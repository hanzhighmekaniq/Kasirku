<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Sale extends Model
{
    use HasFactory;

    protected $fillable = [
        'store_id', 'branch_id', 'customer_id', 'user_id', 'cashier_shift_id',
        'sale_no', 'sale_date',
        'pos_mode', 'order_type',
        'subtotal', 'discount_amount', 'tax_amount', 'shipping_amount',
        'grand_total', 'paid_amount', 'change_amount',
        'status', 'payment_status',
        'customer_name', 'customer_phone',
        // FnB
        'table_id', 'queue_number', 'kitchen_status', 'kitchen_printed_at',
        'served_at', 'guest_count',
        'delivery_address', 'delivery_platform', 'delivery_order_no',
        // Service
        'employee_id', 'service_status', 'service_started_at', 'service_finished_at',
        // Laundry
        'laundry_status', 'weight_kg', 'estimated_done_at', 'picked_up_at',
        // Rental
        'rental_status', 'rent_start_at', 'rent_end_at', 'actual_return_at',
        'deposit_amount', 'deposit_paid', 'deposit_refunded', 'overdue_charge',
        // Parkir
        'plate_number', 'vehicle_type', 'parking_ticket_no', 'entry_at', 'exit_at',
        // Sesi
        'session_status', 'unit_name', 'session_started_at', 'session_ended_at', 'rate_per_hour',
        // Extra
        'extra_data', 'notes', 'idempotency_key',    ];

    protected function casts(): array
    {
        return [
            'sale_date'           => 'datetime',
            'kitchen_printed_at'  => 'datetime',
            'served_at'           => 'datetime',
            'service_started_at'  => 'datetime',
            'service_finished_at' => 'datetime',
            'estimated_done_at'   => 'datetime',
            'picked_up_at'        => 'datetime',
            'rent_start_at'       => 'datetime',
            'rent_end_at'         => 'datetime',
            'actual_return_at'    => 'datetime',
            'entry_at'            => 'datetime',
            'exit_at'             => 'datetime',
            'session_started_at'  => 'datetime',
            'session_ended_at'    => 'datetime',
            'subtotal'            => 'decimal:2',
            'discount_amount'     => 'decimal:2',
            'tax_amount'          => 'decimal:2',
            'shipping_amount'     => 'decimal:2',
            'grand_total'         => 'decimal:2',
            'paid_amount'         => 'decimal:2',
            'change_amount'       => 'decimal:2',
            'deposit_amount'      => 'decimal:2',
            'deposit_paid'        => 'decimal:2',
            'deposit_refunded'    => 'decimal:2',
            'overdue_charge'      => 'decimal:2',
            'weight_kg'           => 'decimal:3',
            'rate_per_hour'       => 'decimal:2',
            'extra_data'          => 'array',
        ];
    }

    // --- Relationships ---

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function shift(): BelongsTo
    {
        return $this->belongsTo(CashierShift::class, 'cashier_shift_id');
    }

    public function table(): BelongsTo
    {
        return $this->belongsTo(CafeTable::class, 'table_id');
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(SaleItem::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(SalePayment::class);
    }

    public function returns(): HasMany
    {
        return $this->hasMany(SaleReturn::class);
    }

    public function pgTransactions(): HasMany
    {
        return $this->hasMany(PaymentGatewayTransaction::class);
    }

    public function commissions(): HasMany
    {
        return $this->hasMany(EmployeeCommission::class);
    }

    // --- Helpers ---

    public function isFnb(): bool          { return $this->pos_mode === 'fnb'; }
    public function isService(): bool      { return $this->pos_mode === 'service'; }
    public function isRental(): bool       { return $this->pos_mode === 'rental'; }
    public function isTicket(): bool       { return $this->pos_mode === 'ticket'; }
    public function isHospitality(): bool  { return $this->pos_mode === 'hospitality'; }
    // Backward-compat aliases
    public function isLaundry(): bool { return $this->isService(); }
    public function isSession(): bool { return $this->isRental(); }
    public function isParking(): bool { return false; } // belum diimplementasi
}
