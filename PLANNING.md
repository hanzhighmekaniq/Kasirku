 # PLANNING — Rombak Alur Registrasi & Onboarding Kasirku

> Checklist ini dikerjakan bertahap. Centang `[x]` setiap task yang sudah selesai.
> Jika tidak sempat hari ini, lanjutkan besok dari task yang belum tercentang.

---

## Ringkasan Alur Baru

```
REGISTER (email + password saja)
    └── Akun langsung dibuat, langsung login
        └── WELCOME DASHBOARD
            ├── Sidebar: semua menu dari semua tipe toko (non-interactive)
            └── Modal "Setup Toko" fixed, tidak bisa ditutup
                ├── Step 1: Pilih Tipe Toko
                ├── Step 2: Pilih Plan
                └── Step 3: Nama Toko + Nama Pemilik
                    └── DASHBOARD sesuai tipe toko yang dipilih
                        ├── Semua menu bisa diklik & dilihat
                        └── Eksekusi aksi → BLOKIR jika belum verif email
                            └── Notif + tombol → Profile (section verif email)
                                └── Verif email → WAJIB ganti password (ketat)
                                    └── FULLY UNLOCKED
```

---

## FASE 1 — Sederhanakan Registrasi

### 1.1 Hapus OTP dari Registrasi
- [x] Hapus route `GET /register/verify`, `POST /register/verify`, `POST /register/resend` dari `routes/auth.php`
- [x] Hapus method `showVerify()`, `verifyOtp()`, `resendOtp()` dari `RegisteredUserController`
- [x] Ubah method `store()` di `RegisteredUserController`:
  - Tidak lagi menyimpan ke `registration_otps`
  - Langsung buat `User` dengan plan Free
  - Langsung `Auth::login($user)`
  - Redirect ke `welcome`
- [x] Hapus file `resources/js/Pages/Auth/VerifyRegistration.jsx`
- [x] Hapus model `app/Models/RegistrationOtp.php`
- [x] Buat migration `drop_registration_otps_table`

### 1.2 Sederhanakan Form Register
- [x] Update `Register.jsx`:
  - Hapus field `name`
  - Hapus field `password_confirmation`
  - Hapus Turnstile captcha
  - Sisakan hanya: `email` + `password` (tetap ada confirmation di form)
- [x] Update validasi di `RegisteredUserController::store()`:
  - Hapus validasi `name`, `password_confirmation` (kec), Turnstile
  - Password rule: `min:8` saja (bebas karakter)
- [x] Generate nama user otomatis dari email + timestamp
  - Format: `{email_local}_{YYYYMMDD}_{HHmmss}`
  - Contoh: `hanz_20260803_165532`
  - Pastikan unik (append angka random jika bentrok)

---

## FASE 2 — Welcome Dashboard (Pra-Setup Toko)

### 2.1 Rombak Halaman Welcome
- [x] Update `WelcomeController` untuk pass semua data yang dibutuhkan:
  - Semua `StoreType` aktif
  - Semua `Plan` aktif
- [x] Update `Welcome.jsx` menjadi layout dashboard penuh:
  - Sidebar tampil semua menu gabungan dari semua tipe toko
  - Semua item sidebar: tampil tapi `pointer-events-none` + visual greyed out + lock icon
  - Area konten: dummy dashboard preview (stats, chart, produk terlaris)
- [x] Pastikan route `/welcome` tetap exempt dari `StoreMiddleware`

### 2.2 Tombol Setup Toko Fixed
- [x] Tombol "Setup Toko" fixed di header halaman Welcome
  - Selalu tampil di atas semua konten
  - Klik → buka modal setup

### 2.3 Modal Setup Toko (Non-Closable)
- [x] Modal muncul **otomatis** saat halaman Welcome dimuat
- [x] Tidak ada tombol close — overlay click tidak menutup modal
- [x] Step 1: Pilih Tipe Toko (grid card)
- [x] Step 2: Pilih Plan (card plan)
- [x] Step 3: Nama Toko + Nama Pemilik
- [x] Submit ke `POST /onboarding`

### 2.4 Update Onboarding
- [x] Update `OnboardingController::create()`: urutan step → tipe toko dulu, baru plan
- [x] Tambah field `owner_name` ke validasi
- [x] Update `Onboarding/Index.jsx`: urutan baru + tambah owner_name field
- [x] Kirim `userName` dari controller ke frontend (pre-fill)

---

## FASE 3 — Lock Eksekusi Sebelum Verifikasi Email

### 3.1 Implementasi Laravel Email Verification
- [x] Tambahkan `implements MustVerifyEmail` ke `User` model
- [x] Tambahkan route verifikasi email di `routes/auth.php`:
  - `GET /email/verify` → halaman notice (Inertia `Auth/VerifyEmail`)
  - `GET /email/verify/{id}/{hash}` → handler verifikasi (signed)
  - `POST /email/verification-notification` → resend link
- [x] Kirim email verifikasi otomatis setelah register (via `Registered` event + `MustVerifyEmail`)

### 3.2 Middleware Lock Eksekusi
- [x] Buat middleware `EnsureEmailVerifiedForMutations`:
  - Hanya berlaku untuk HTTP method `POST`, `PUT`, `PATCH`, `DELETE`
  - Jika belum verif: `Inertia::location()` redirect ke halaman verifikasi
- [x] Daftarkan alias `verified-mutations` di `bootstrap/app.php`
- [x] Terapkan ke admin route group di `routes/web.php`

### 3.3 Notifikasi Verifikasi di Frontend
- [x] Tambahkan `auth.emailVerified` (boolean) ke shared props di `HandleInertiaRequests`
- [x] Buat komponen `VerificationRequiredModal`
- [x] Buat custom hook `useVerificationGuard()`
- [x] Middleware redirect via `Inertia::location()` → tidak perlu handler frontend
- [x] Buat halaman `Auth/VerifyEmail.jsx` (Inertia page)

---

## FASE 4 — Verifikasi Email & Ganti Password di Profile

### 4.1 Section Verifikasi Email di Profile
- [x] Update `Profile/Edit.jsx`:
  - Tambah section card: **"Verifikasi Email"** dengan anchor `id="verifikasi-email"`
  - Jika belum verif: tampil status + tombol "Kirim Link Verifikasi"
  - Jika sudah verif: tampil badge "Terverifikasi ✓"
  - Badge "Belum Verifikasi" di identity card

### 4.2 Paksa Ganti Password Setelah Verifikasi
- [x] Tambah kolom `password_changed_at` (timestamp nullable) ke tabel `users` via migration
- [x] Backfill existing verified users dengan `password_changed_at = now()`
- [x] Buat `ForcePasswordChangeController`:
  - `GET /password/setup` → form ganti password paksa
  - `POST /password/setup` → simpan password baru, set `password_changed_at`
- [x] Buat middleware `EnsurePasswordChangedAfterVerification`:
  - Jika `email_verified_at` tidak null tapi `password_changed_at` null → redirect ke `/password/setup`
  - Exempt routes: password.setup, profile, verification, logout
- [x] Daftarkan alias `force-password-change` di `bootstrap/app.php`
- [x] Terapkan ke admin route group
- [x] Validasi password baru: `Password::min(8)->mixedCase()->numbers()->symbols()`
- [x] Buat halaman `Auth/SetupPassword.jsx`:
  - Form dengan field `password` + `password_confirmation`
  - Indikator strength password (5 checks)
  - Tunjukkan requirements: huruf besar, huruf kecil, angka, simbol, min 8 karakter
- [x] Redirect setelah verifikasi → `/password/setup` (bukan profile)

---

## FASE 5 — Cleanup & Penyesuaian

### 5.1 Cleanup File & Kode Tidak Terpakai
- [x] Hapus `PruneRegistrationOtps` command
- [x] Hapus `RegistrationOtpCode` notification
- [x] Hapus schedule `registration-otp:prune` dari `routes/console.php`
- [x] Hapus `PruneRegistrationOtpsTest.php`

### 5.2 Testing
- [x] Rewrite `RegistrationTest.php` — 7 test, semua pass:
  - registration screen can be rendered
  - submitting the form creates the account and logs the user in
  - generated name is unique even with same email timestamp
  - duplicate email is rejected
  - weak password is rejected
  - password confirmation must match
  - name and captcha are not required for registration

### 5.3 Jalankan Pint
- [x] `vendor/bin/pint --dirty --format agent` — 4 file diperbaiki

---

## Catatan Teknis

| Hal | Status |
|-----|--------|
| Nama user default | `{email_local}_{YYYYMMDD}_{HHmmss}` — sudah diimplementasi |
| Password saat register | Min 8 karakter, bebas — sudah diimplementasi |
| Password setelah verif email | Min 8 + mixedCase + numbers + symbols — sudah diimplementasi |
| Verifikasi email | Laravel built-in `MustVerifyEmail` + signed URL — sudah diimplementasi |
| OTP register | **Dihapus total** — sudah diimplementasi |
| Captcha Turnstile | **Dihapus** dari form register — sudah diimplementasi |
| Nama pemilik | Diisi di Step 3 onboarding wizard — sudah diimplementasi |
| Urutan onboarding | Tipe Toko → Plan → Nama Toko & Nama Pemilik — sudah diimplementasi |
| Sidebar welcome | Gabungan semua tipe toko, non-interactive, lock icon — sudah diimplementasi |
| Modal setup toko | Auto-muncul, tidak bisa ditutup — sudah diimplementasi |
| Lock eksekusi | Middleware server-side + `useVerificationGuard()` hook — sudah diimplementasi |
| Ganti password paksa | Middleware `EnsurePasswordChangedAfterVerification` — sudah diimplementasi |
