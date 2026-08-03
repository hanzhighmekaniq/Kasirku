<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use App\Models\RegistrationOtp;
use App\Models\User;
use App\Notifications\RegistrationOtpCode;
use App\Rules\Turnstile;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Registrasi mandiri dua tahap (hanya akun, tanpa toko).
 *
 *  1. store()     — validasi form + captcha, kirim kode OTP ke email.
 *                   User BELUM dibuat di tahap ini.
 *  2. verifyOtp() — kode benar → User baru dibuat (plan Free), lalu login
 *                   → redirect ke halaman onboarding untuk buat toko.
 *
 * Verifikasi email bersifat WAJIB: tidak ada jalur yang membuat akun tanpa
 * kode terverifikasi. Data form ditahan sementara di tabel
 * `registration_otps` (kolom payload) selama kode masih berlaku.
 */
class RegisteredUserController extends Controller
{
    /** Session key penanda email yang sedang menunggu verifikasi. */
    private const PENDING_EMAIL_KEY = 'registration.pending_email';

    public function create(Request $request): Response
    {
        return Inertia::render('Auth/Register', [
            'turnstileSiteKey' => app()->environment('local')
                ? null
                : config('services.turnstile.site_key'),
        ]);
    }

    /**
     * Tahap 1 — validasi form akun + captcha, tahan datanya, kirim kode ke email.
     *
     * @throws ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'cf_turnstile_response' => ['nullable', 'string', new Turnstile],
        ]);

        try {
            $otp = RegistrationOtp::issueFor($validated['email'], [
                'name' => $validated['name'],
                'password' => Hash::make($validated['password']),
            ]);

            // Kirim kode OTP ke email di semua environment
            $this->sendCode($otp);
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Throwable $e) {
            Log::error('[Registrasi] Gagal memproses registrasi: '.$e->getMessage(), [
                'email' => $validated['email'],
                'trace' => $e->getTraceAsString(),
            ]);

            throw ValidationException::withMessages([
                'email' => 'Terjadi kesalahan saat memproses pendaftaran. Silakan coba lagi.',
            ]);
        }

        $request->session()->put(self::PENDING_EMAIL_KEY, $otp->email);

        // Di environment local, kirim kode juga di response untuk mempermudah development
        $flashData = ['otp_code' => null];
        if (app()->environment('local')) {
            $flashData['otp_code'] = $otp->code;
        }

        // Redirect ke halaman verifikasi terpisah
        return redirect()->route('register.verify.show')->with($flashData);
    }

    /**
     * Tampilkan halaman verifikasi OTP.
     */
    public function showVerify(Request $request): Response|RedirectResponse
    {
        $pendingEmail = $request->session()->get(self::PENDING_EMAIL_KEY);

        if (! $pendingEmail) {
            return redirect()->route('register')
                ->with('error', 'Sesi pendaftaran tidak ditemukan. Silakan daftar ulang.');
        }

        $otp = RegistrationOtp::where('email', $pendingEmail)->first();

        if (! $otp) {
            $request->session()->forget(self::PENDING_EMAIL_KEY);

            return redirect()->route('register')
                ->with('error', 'Sesi pendaftaran kedaluwarsa. Silakan daftar ulang.');
        }

        if ($otp->isExpired() || $otp->hasReachedMaxAttempts()) {
            $otp->delete();
            $request->session()->forget(self::PENDING_EMAIL_KEY);

            return redirect()->route('register')
                ->with('error', 'Kode sudah kedaluwarsa atau percobaan habis. Silakan daftar ulang.');
        }

        return Inertia::render('Auth/VerifyRegistration', [
            'email' => $otp->email,
        ]);
    }

    /**
     * Tahap 2 — verifikasi kode, lalu buat User (tanpa Store).
     *
     * User dibuat dengan plan Free. Store dibuat nanti di halaman onboarding
     * setelah user login.
     *
     * @throws ValidationException
     */
    public function verifyOtp(Request $request): RedirectResponse
    {
        // Pastikan user belum ter-authenticate
        if (Auth::check()) {
            Log::warning('[Registrasi] User sudah login saat verifikasi OTP', [
                'user_id' => Auth::id(),
                'email' => $request->input('email'),
            ]);
            Auth::logout();
        }

        $validated = $request->validate([
            'email' => 'required|string|email',
            'code' => 'required|string|size:6',
        ]);

        $otp = RegistrationOtp::where('email', $validated['email'])->first();

        if (! $otp) {
            throw ValidationException::withMessages([
                'code' => 'Sesi pendaftaran tidak ditemukan. Silakan daftar ulang.',
            ]);
        }

        if ($otp->isExpired()) {
            $otp->delete();
            $request->session()->forget(self::PENDING_EMAIL_KEY);

            throw ValidationException::withMessages([
                'code' => 'Kode sudah kedaluwarsa. Silakan daftar ulang untuk mendapatkan kode baru.',
            ]);
        }

        if ($otp->hasReachedMaxAttempts()) {
            throw ValidationException::withMessages([
                'code' => 'Terlalu banyak percobaan salah. Minta kode baru untuk melanjutkan.',
            ]);
        }

        if (! $otp->matches($validated['code'])) {
            $otp->recordFailedAttempt();

            throw ValidationException::withMessages([
                'code' => "Kode salah. Sisa percobaan: {$otp->fresh()->remainingAttempts()}.",
            ]);
        }

        // Kode benar — barulah akun dibuat (tanpa toko).
        $payload = $otp->payload;
        $freePlan = Plan::where('code', 'free')->first();

        $user = DB::transaction(fn () => User::create([
            'name' => $payload['name'],
            'email' => $otp->email,
            'password' => $payload['password'],
            'plan_id' => $freePlan?->id,
        ]));

        $otp->delete();
        $request->session()->forget(self::PENDING_EMAIL_KEY);

        event(new Registered($user));

        Auth::login($user);

        return redirect()->route('welcome');
    }

    /**
     * Kirim ulang kode untuk email yang sedang menunggu verifikasi.
     *
     * @throws ValidationException
     */
    public function resendOtp(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'email' => 'required|string|email',
        ]);

        $otp = RegistrationOtp::where('email', $validated['email'])->first();

        if (! $otp) {
            throw ValidationException::withMessages([
                'email' => 'Sesi pendaftaran tidak ditemukan. Silakan daftar ulang.',
            ]);
        }

        // Kode baru + reset percobaan, data form yang ditahan tetap dipakai.
        $otp = RegistrationOtp::issueFor($otp->email, $otp->payload);

        // Kirim kode OTP ke email di semua environment
        try {
            $this->sendCode($otp);
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Throwable $e) {
            Log::error('[Registrasi] Gagal mengirim ulang kode OTP: '.$e->getMessage(), [
                'email' => $otp->email,
            ]);

            throw ValidationException::withMessages([
                'email' => 'Gagal mengirim kode. Silakan coba lagi.',
            ]);
        }

        // Di environment local, kirim kode juga di response untuk mempermudah development
        $flashData = ['success' => 'Kode verifikasi baru telah dikirim ke email Anda.'];
        if (app()->environment('local')) {
            $flashData['otp_code'] = $otp->code;
        }

        return back()->with($flashData);
    }

    /**
     * Kirim kode ke email tujuan. Dikirim sinkron (bukan queued) — lihat
     * catatan di RegistrationOtpCode.
     *
     * @throws ValidationException
     */
    private function sendCode(RegistrationOtp $otp): void
    {
        try {
            Notification::route('mail', $otp->email)
                ->notify(new RegistrationOtpCode($otp->code));
        } catch (\Throwable $e) {
            Log::error('[Registrasi] Gagal mengirim kode OTP: '.$e->getMessage(), [
                'email' => $otp->email,
            ]);

            throw ValidationException::withMessages([
                'email' => 'Gagal mengirim kode ke email tersebut. Periksa alamat email lalu coba lagi.',
            ]);
        }
    }
}
