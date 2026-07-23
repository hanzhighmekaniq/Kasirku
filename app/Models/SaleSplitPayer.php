<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SaleSplitPayer extends Model
{
    protected $fillable = [
        'sale_id',
        'name',
        'customer_id',
        'subtotal',
        'discount',
        'tax',
        'total',
        'status',
        'payment_method_id',
        'paid_amount',
        'change_amount',
        'rounding_mode',
        'rounding_nearest',
        'rounding_adjustment',
        'sale_payment_id',
        'pg_trx_id',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'subtotal' => 'decimal:2',
            'discount' => 'decimal:2',
            'tax' => 'decimal:2',
            'total' => 'decimal:2',
            'paid_amount' => 'decimal:2',
            'change_amount' => 'decimal:2',
            'rounding_nearest' => 'integer',
            'rounding_adjustment' => 'decimal:2',
            'sort_order' => 'integer',
        ];
    }

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function paymentMethod(): BelongsTo
    {
        return $this->belongsTo(PaymentMethod::class);
    }

    public function salePayment(): BelongsTo
    {
        return $this->belongsTo(SalePayment::class);
    }

    public function pgTransaction(): BelongsTo
    {
        return $this->belongsTo(PaymentGatewayTransaction::class, 'pg_trx_id');
    }

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isPaid(): bool
    {
        return $this->status === 'paid';
    }

    public function isVoid(): bool
    {
        return $this->status === 'void';
    }
}
