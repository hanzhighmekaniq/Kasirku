<?php

namespace App\Notifications;

use App\Models\RegistrationOtp;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Kode verifikasi email untuk registrasi.
 *
 * SENGAJA TIDAK memakai ShouldQueue: verifikasi email adalah syarat mutlak
 * untuk mendaftar, jadi kalau queue worker mati, tidak ada satu pun user
 * yang bisa membuat akun. Dikirim sinkron supaya registrasi tetap jalan
 * tanpa bergantung pada worker.
 */
class RegistrationOtpCode extends Notification
{
    use Queueable;

    public function __construct(public string $code) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("Kode verifikasi: {$this->code}")
            ->greeting('Halo!')
            ->line('Gunakan kode berikut untuk menyelesaikan pendaftaran toko kamu:')
            ->line("**{$this->code}**")
            ->line('Kode ini berlaku '.RegistrationOtp::TTL_MINUTES.' menit.')
            ->line('Kalau kamu tidak merasa mendaftar, abaikan email ini — tidak ada akun yang dibuat tanpa kode ini.');
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return ['code' => $this->code];
    }
}
