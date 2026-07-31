<?php

namespace App\Notifications;

use App\Models\Store;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Dikirim H-3 dan H-1 sebelum trial/plan toko berakhir (plan_expires_at).
 */
class TrialEndingSoon extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Store $store,
        public int $daysRemaining,
    ) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $planLabel = $this->store->planModel?->label ?? 'kamu';
        $dayWord = $this->daysRemaining === 1 ? 'besok' : "{$this->daysRemaining} hari lagi";

        return (new MailMessage)
            ->subject("Trial plan {$planLabel} akan habis {$dayWord}")
            ->greeting("Halo {$notifiable->name},")
            ->line("Trial plan {$planLabel} untuk toko \"{$this->store->name}\" akan berakhir {$dayWord} ({$this->store->plan_expires_at->translatedFormat('d F Y')}).")
            ->line('Setelah trial berakhir, toko otomatis turun ke plan Free dengan fitur dan limit yang lebih terbatas.')
            ->action('Upgrade Plan Sekarang', route('login'))
            ->line('Kalau kamu sudah puas dengan plan ini, upgrade sekarang supaya tidak ada gangguan operasional.');
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'store_id' => $this->store->id,
            'days_remaining' => $this->daysRemaining,
        ];
    }
}
