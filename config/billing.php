<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Billing — Konfigurasi Pembayaran Plan Platform
    |--------------------------------------------------------------------------
    |
    | Konfigurasi ini menentukan kontak dan instruksi pembayaran manual
    | yang ditampilkan ke user saat Payment Gateway belum aktif/dikonfigurasi.
    |
    | Mode pembayaran ditentukan OTOMATIS:
    |   - Kalau ada minimal 1 PlatformPaymentGateway yang is_active = true
    |     → mode otomatis (redirect ke PG)
    |   - Kalau semua PG nonaktif
    |     → mode manual (tampilkan instruksi transfer + kontak admin)
    |
    */

    // ── Kontak Admin (mode manual) ─────────────────────────────────────
    // Nomor WhatsApp tanpa tanda + (misal: 6281234567890)
    'whatsapp' => env('BILLING_WHATSAPP', ''),

    // Email yang akan menerima notifikasi order baru dan dihubungi user
    'email' => env('BILLING_EMAIL', ''),

    // ── Rekening Transfer (mode manual) ────────────────────────────────
    'bank_name' => env('BILLING_BANK_NAME', ''),
    'bank_account' => env('BILLING_BANK_ACCOUNT', ''),
    'bank_holder' => env('BILLING_BANK_HOLDER', ''),

    // ── Pesan WhatsApp (opsional) ───────────────────────────────────────
    // Template pesan yang dikirim saat user klik tombol WhatsApp.
    // {order_ref} akan diganti kode referensi order.
    'whatsapp_template' => env(
        'BILLING_WHATSAPP_TEMPLATE',
        'Halo, saya ingin upgrade plan SIM-KASIR. Kode order saya: {order_ref}',
    ),

];
