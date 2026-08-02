<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Customer extends Model
{
    use HasFactory;

    protected $fillable = [
        'store_id', 'code', 'name', 'phone', 'email', 'address',
        'birth_date', 'gender',
        'points', 'tier', 'customer_tier_id', 'total_spent', 'last_visit_at',
        'deposit_balance', 'debt_balance', 'credit_limit', 'notes', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'birth_date' => 'date',
            'last_visit_at' => 'datetime',
            'total_spent' => 'decimal:2',
            'deposit_balance' => 'decimal:2',
            'debt_balance' => 'decimal:2',
            'credit_limit' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    // --- Relationships ---

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public function customerTier(): BelongsTo
    {
        return $this->belongsTo(CustomerTier::class, 'customer_tier_id');
    }

    public function sales(): HasMany
    {
        return $this->hasMany(Sale::class);
    }

    public function memberships(): HasMany
    {
        return $this->hasMany(CustomerMembership::class);
    }

    public function depositLogs(): HasMany
    {
        return $this->hasMany(CustomerDepositLog::class);
    }

    public function debtLogs(): HasMany
    {
        return $this->hasMany(CustomerDebtLog::class);
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    public function queueTickets(): HasMany
    {
        return $this->hasMany(QueueTicket::class);
    }

    // --- Helpers ---

    public function pointLogs(): HasMany
    {
        return $this->hasMany(CustomerPointLog::class);
    }

    public function activeMembership(): ?CustomerMembership
    {
        return $this->memberships()
            ->with('membership')
            ->where('status', 'active')
            ->where(function ($query) {
                $query->whereNull('expired_date')
                    ->orWhere('expired_date', '>=', now());
            })
            ->latest()
            ->first();
    }

    /**
     * Setel ulang tier pelanggan dari membership aktifnya.
     *
     * Tier diambil dari benefit `maps_to_tier` milik membership dengan rank
     * tertinggi. Kalau tidak ada membership aktif yang memetakan tier,
     * pelanggan jatuh ke tier terendah milik toko — bukan ke nama yang
     * ditulis mati, karena owner bebas menamai levelnya sendiri.
     */
    public function syncTierFromMembership(): void
    {
        $highest = $this->memberships()
            ->active()
            ->with('membership')
            ->get()
            ->map(fn ($cm) => $cm->membership)
            ->filter()
            ->sortByDesc(fn ($m) => $m->tierRank())
            ->first();

        $tier = $highest?->mapsToTier()
            ?? CustomerTier::lowestForStore($this->store_id);

        $this->forceFill([
            'customer_tier_id' => $tier?->id,
            // Kolom string lama wajib NOT NULL dengan default 'bronze'.
            // Kalau toko belum punya tier dinamis (mis. di test), fallback ke
            // nama tier terendah atau ke 'bronze' supaya constraint tidak gagal.
            'tier' => $tier ? strtolower($tier->name) : 'bronze',
        ])->save();
    }
}
