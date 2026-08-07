<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Registrasi mandiri — langsung buat akun (email + password saja).
 *
 * Tidak ada OTP, tidak ada captcha. Nama user di-generate otomatis
 * dari email + timestamp. Password wajib huruf besar, huruf kecil,
 * dan angka (simbol opsional). User langsung login setelah registrasi
 * dan diarahkan ke onboarding untuk pilih jenis usaha + nama toko.
 * Toko langsung dibuat dengan plan Free — verifikasi email TIDAK
 * memblokir alur ini, cukup jadi pengingat pasif di dashboard.
 */
class RegisteredUserController extends Controller
{
    public function create(Request $request): Response
    {
        return Inertia::render('Auth/Register', [
            'honeypot_token' => encrypt(now()->timestamp),
        ]);
    }

    /**
     * Buat akun baru, langsung login, redirect ke onboarding.
     *
     * @throws ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        // Anti-spam: honeypot check
        if (! empty($request->website)) {
            return redirect()->route('register');
        }

        // Anti-spam: time check (< 3 detik = bot)
        $startTime = $request->get('honeypot_token');
        if ($startTime && now()->timestamp - decrypt($startTime) < 3) {
            return redirect()->route('register')
                ->withErrors(['email' => 'Registrasi terlalu cepat. Silakan coba lagi.']);
        }

        $validated = $request->validate([
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::min(8)->mixedCase()->numbers()],
        ]);

        $name = $this->generateUniqueName($validated['email']);
        $freePlan = Plan::where('code', 'free')->first();

        if (! $freePlan) {
            throw ValidationException::withMessages([
                'email' => 'Konfigurasi sistem bermasalah. Silakan hubungi admin.',
            ]);
        }

        $sessionToken = Str::random(64);

        $user = DB::transaction(fn () => User::create([
            'name' => $name,
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'plan_id' => $freePlan->id,
            'session_token' => $sessionToken,
        ]));

        event(new Registered($user));
        Auth::login($user);

        // Set session token di session untuk single-session enforcement
        session()->put('session_token', $sessionToken);

        return redirect()->route('onboarding');
    }

    /**
     * Generate nama unik dari email + timestamp.
     * Format: {local_part}_{YYYYMMDD}_{HHmmss}
     * Jika bentrok, tambahkan 4 digit random.
     */
    private function generateUniqueName(string $email): string
    {
        $local = strtolower(explode('@', $email)[0]);
        $local = preg_replace('/[^a-z0-9_]/', '_', $local);
        $local = trim($local, '_') ?: 'user';

        $timestamp = now()->format('Ymd_His');
        $base = "{$local}_{$timestamp}";

        $name = $base;
        $counter = 0;

        while (User::where('name', $name)->exists()) {
            $counter++;
            $name = $base.'_'.str_pad((string) $counter, 4, '0', STR_PAD_LEFT);
        }

        return $name;
    }
}
