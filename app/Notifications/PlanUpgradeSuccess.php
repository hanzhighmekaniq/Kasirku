<?php

namespace App\Notifications;

use App\Models\Plan;
use App\Models\PlanOrder;
use App\Models\Store;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Notifikasi ke owner toko saat upgrade plan berhasil dikonfirmasi
 * (baik manual oleh developer maupun otomatis via webhook PG).
 */
class PlanUpgradeSuccess extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Store $store,
        public Plan $plan,
        public PlanOrder $order,
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
        $periodLabel = $this->order->periodLabel();
        $activeUntil = $this->order->plan_active_until?->translatedFormat('d F Y') ?? '—';
        $amount = 'Rp '.number_format($this->order->amount, 0, ',', '.');

        $mail = (new MailMessage)
            ->subject("🎉 Upgrade Plan {$this->plan->label} Berhasil — {$this->store->name}")
            ->greeting("Halo {$notifiable->name},")
            ->line("Selamat! Paket toko **\"{$this->store->name}\"** berhasil ditingkatkan ke **{$this->plan->label}**.")
            ->line("**Periode**: {$periodLabel} · berlaku sampai {$activeUntil}")
            ->line("**Nominal dibayar**: {$amount}")
            ->line("**Kode Order**: {$this->order->idempotency_key}")
            ->action('Masuk ke Dashboard', route('login'));

        if ($this->plan->max_users) {
            $mail->line("Sekarang kamu bisa menambah hingga **{$this->plan->max_users} user** dan **{$this->plan->max_branches} cabang**.");
        }

        return $mail->line('Terima kasih sudah mempercayakan bisnis kamu ke SIM-KASIR!');
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'order_id' => $this->order->id,
            'plan_id' => $this->plan->id,
            'store_id' => $this->store->id,
        ];
    }
}
