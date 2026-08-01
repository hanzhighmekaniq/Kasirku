<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\RegistrationOtp;
use App\Models\Store;
use App\Models\StoreType;
use App\Models\User;
use App\Notifications\RegistrationOtpCode;
use App\Rules\Turnstile;
use App\Services\StoreOnboardingService;
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
 * Registrasi mandiri dua tahap.
 *
 *  1. store()     — validasi form + captcha, kirim kode OTP ke email.
 *                   User & Store BELUM dibuat di tahap ini.
 *  2. verifyOtp() — kode benar → User & Store baru dibuat, lalu login.
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
        $storeTypes = StoreType::where('is_active', true)
            ->orderBy('sort_order')
            ->with([
                'businessTemplates' => fn ($q) => $q
                    ->ready()
                    ->active()
                    ->ordered(),
            ])
            ->get()
            ->map(fn (StoreType $type) => [
                'id' => $type->id,
                'code' => $type->code,
                'label' => $type->label,
                'icon' => $type->icon,
                'description' => $type->description,
                'business_templates' => $type->businessTemplates->map(fn ($t) => [
                    'code' => $t->code,
                    'label' => $t->label,
                    'icon' => $t->icon,
                    'description' => $t->description,
                ])->values(),
            ])
            ->values();

        // Kalau user menutup browser di tengah proses lalu kembali, dan kode
        // OTP-nya masih berlaku, biarkan dia langsung lanjut ke tahap
        // verifikasi tanpa mengisi ulang seluruh form.
        $pendingEmail = $request->session()->get(self::PENDING_EMAIL_KEY);
        $pendingOtp = $pendingEmail
            ? RegistrationOtp::where('email', $pendingEmail)->first()
            : null;

        if ($pendingOtp && ($pendingOtp->isExpired() || $pendingOtp->hasReachedMaxAttempts())) {
            $pendingOtp = null;
            $request->session()->forget(self::PENDING_EMAIL_KEY);
        }

        return Inertia::render('Auth/Register', [
            'storeTypes' => $storeTypes,
            'plans' => Store::allPlans(),
            'turnstileSiteKey' => config('services.turnstile.site_key'),
            'pendingEmail' => $pendingOtp?->email,
        ]);
    }

    /**
     * Tahap 1 — validasi form, tahan datanya, kirim kode ke email.
     *
     * @throws ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'store_type_id' => ['required', 'integer', 'exists:store_types,id'],
            'business_template_code' => ['nullable', 'string', 'exists:business_templates,code'],
            'plan_id' => ['required', 'integer', 'exists:plans,id'],
            'cf_turnstile_response' => ['nullable', 'string', new Turnstile],
        ]);

        $otp = RegistrationOtp::issueFor($validated['email'], [
            'name' => $validated['name'],
            // Password sudah di-hash sejak tahap ini — plaintext tidak pernah
            // tersimpan, bahkan sementara.
            'password' => Hash::make($validated['password']),
            'store_type_id' => $validated['store_type_id'],
            'business_template_code' => $validated['business_template_code'] ?? null,
            'plan_id' => $validated['plan_id'],
        ]);

        $this->sendCode($otp);

        $request->session()->put(self::PENDING_EMAIL_KEY, $otp->email);

        return back()->with('status', 'otp-sent');
    }

    /**
     * Tahap 2 — verifikasi kode, lalu buat User & Store.
     *
     * @throws ValidationException
     */
    public function verifyOtp(Request $request): RedirectResponse
    {
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

        // Kode benar — barulah akun & toko dibuat.
        $payload = $otp->payload;

        $user = DB::transaction(fn () => app(StoreOnboardingService::class)->registerVerified(
            account: [
                'name' => $payload['name'],
                'email' => $otp->email,
                'hashed_password' => $payload['password'],
            ],
            storeTypeId: (int) $payload['store_type_id'],
            businessTemplateCode: $payload['business_template_code'] ?? null,
            planId: (int) $payload['plan_id'],
        ));

        $otp->delete();
        $request->session()->forget(self::PENDING_EMAIL_KEY);

        event(new Registered($user));

        Auth::login($user);

        return redirect(route('admin.dashboard', absolute: false));
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
                'code' => 'Sesi pendaftaran tidak ditemukan. Silakan daftar ulang.',
            ]);
        }

        // Kode baru + reset percobaan, data form yang ditahan tetap dipakai.
        $otp = RegistrationOtp::issueFor($otp->email, $otp->payload);

        $this->sendCode($otp);

        return back()->with('status', 'otp-resent');
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
