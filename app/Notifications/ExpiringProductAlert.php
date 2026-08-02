<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class ExpiringProductAlert extends Notification
{
    use Queueable;

    public function __construct(
        public array $batches,
        public int $storeId,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'expiry_alert',
            'title' => 'Produk Akan Kadaluarsa',
            'message' => count($this->batches).' batch produk akan kadaluarsa dalam 30 hari.',
            'batches' => array_map(fn ($b) => [
                'id' => $b['id'],
                'product_name' => $b['product_name'],
                'batch_number' => $b['batch_number'],
                'expiry_date' => $b['expiry_date'],
                'quantity' => $b['quantity'],
            ], array_slice($this->batches, 0, 10)),
            'total_count' => count($this->batches),
            'url' => '/admin/reports/stock',
        ];
    }
}
