<?php

namespace App\Notifications;

use App\Models\Store;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Dikirim ke owner saat developer menonaktifkan (suspend) toko mereka,
 * lengkap dengan alasannya.
 */
class StoreSuspended extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Store $store, public string $reason) {}

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
            ->subject("Toko \"{$this->store->name}\" dinonaktifkan")
            ->greeting("Halo {$notifiable->name},")
            ->line("Toko \"{$this->store->name}\" (kode: {$this->store->code}) telah dinonaktifkan oleh tim kami.")
            ->line("Alasan: {$this->reason}")
            ->line('Kalau kamu merasa ini keliru atau ingin klarifikasi, silakan hubungi tim support kami.');
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'store_id' => $this->store->id,
            'reason' => $this->reason,
        ];
    }
}
