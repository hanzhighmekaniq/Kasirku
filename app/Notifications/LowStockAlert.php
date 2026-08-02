<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class LowStockAlert extends Notification
{
    use Queueable;

    public function __construct(
        public array $products,
        public int $storeId,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'low_stock',
            'title' => 'Stok Menipis',
            'message' => count($this->products).' produk di bawah stok minimum.',
            'products' => array_map(fn ($p) => [
                'id' => $p['id'],
                'name' => $p['name'],
                'current_stock' => $p['current_stock'],
                'stock_minimum' => $p['stock_minimum'],
            ], array_slice($this->products, 0, 10)),
            'total_count' => count($this->products),
            'url' => '/admin/reports/stock',
        ];
    }
}
