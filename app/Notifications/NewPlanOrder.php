<?php

namespace App\Notifications;

use App\Models\PlanOrder;
use App\Models\Store;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Notifikasi ke developer/admin saat ada order upgrade plan baru masuk.
 * Dikirim ke BILLING_EMAIL di .env — supaya admin cepat tahu ada yang mau upgrade.
 * Queued supaya tidak memperlambat response user saat submit order.
 */
class NewPlanOrder extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public PlanOrder $order,
        public Store $store,
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
        $amount = 'Rp '.number_format($this->order->amount, 0, ',', '.');

        return (new MailMessage)
            ->subject("Order Upgrade Plan Baru — {$this->order->idempotency_key}")
            ->greeting('Halo Admin,')
            ->line('Ada order upgrade plan baru yang masuk dan menunggu konfirmasi kamu.')
            ->line("**Toko**: {$this->store->name} ({$this->store->code})")
            ->line("**Plan**: {$this->order->plan?->label} · {$periodLabel}")
            ->line("**Nominal**: {$amount}")
            ->line("**Kode Order**: {$this->order->idempotency_key}")
            ->action('Lihat & Approve Order', route('developer.plan-orders.index'))
            ->line('Segera konfirmasi setelah menerima pembayaran dari toko ini.');
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'order_id' => $this->order->id,
            'order_ref' => $this->order->idempotency_key,
            'store_id' => $this->store->id,
        ];
    }
}
