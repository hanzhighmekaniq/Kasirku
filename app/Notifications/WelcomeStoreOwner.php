<?php

namespace App\Notifications;

use App\Models\Store;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Dikirim ke owner sesaat setelah toko baru dibuat (registrasi mandiri).
 */
class WelcomeStoreOwner extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Store $store) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $mail = (new MailMessage)
            ->subject("Selamat! Toko \"{$this->store->name}\" sudah siap dipakai")
            ->greeting("Halo {$notifiable->name},")
            ->line("Toko \"{$this->store->name}\" (kode: {$this->store->code}) berhasil dibuat dan siap dipakai.")
            ->line('Kamu bisa langsung login untuk mulai mengatur produk, kategori, dan mulai berjualan.')
            ->action('Masuk ke Dashboard', route('login'));

        if ($this->store->plan_expires_at) {
            $mail->line("Kamu sedang menikmati trial sampai {$this->store->plan_expires_at->translatedFormat('d F Y')}. Setelah itu, akun otomatis turun ke plan Free kecuali kamu upgrade.");
        }

        return $mail->line('Terima kasih sudah bergabung!');
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'store_id' => $this->store->id,
            'store_name' => $this->store->name,
        ];
    }
}
