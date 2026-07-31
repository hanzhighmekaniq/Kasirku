<?php

namespace App\Notifications;

use App\Models\Store;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Dikirim saat plan toko benar-benar di-downgrade ke Free oleh command
 * `plan:check-expired` (bukan sekedar computed expired).
 */
class PlanExpiredDowngraded extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Store $store, public string $previousPlanLabel) {}

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
            ->subject("Plan toko \"{$this->store->name}\" telah diturunkan ke Free")
            ->greeting("Halo {$notifiable->name},")
            ->line("Trial/plan {$this->previousPlanLabel} untuk toko \"{$this->store->name}\" sudah berakhir.")
            ->line('Toko kamu sekarang berjalan di plan Free dengan fitur dan limit yang lebih terbatas.')
            ->action('Upgrade Kembali', route('login'))
            ->line('Upgrade kapan saja untuk mendapatkan kembali fitur lengkap dan limit yang lebih besar.');
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'store_id' => $this->store->id,
            'previous_plan_label' => $this->previousPlanLabel,
        ];
    }
}
