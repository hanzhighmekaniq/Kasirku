<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Plan;

class Store extends Model
{
    use HasFactory;

    protected $fillable = [
        "user_id",
        "code",
        "name",
        "store_type",
        "modules",
        "logo",
        "currency",
        "decimal_places",
        "timezone",
        "tax_inclusive",
        "default_tax_rate",
        "receipt_header",
        "receipt_footer",
        "phone",
        "email",
        "address",
        "is_active",
        "plan",
        "plan_expires_at",
        "max_users",
        "max_branches",
    ];

    protected function casts(): array
    {
        return [
            "modules" => "array",
            "is_active" => "boolean",
            "tax_inclusive" => "boolean",
            "default_tax_rate" => "decimal:2",
            "plan_expires_at" => "date",
        ];
    }

    // --- Relationships ---

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, "user_id");
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(
            User::class,
            "user_store",
        )->withTimestamps();
    }

    public function branches(): HasMany
    {
        return $this->hasMany(Branch::class);
    }

    public function employees(): HasMany
    {
        return $this->hasMany(Employee::class);
    }

    public function categories(): HasMany
    {
        return $this->hasMany(Category::class);
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    public function suppliers(): HasMany
    {
        return $this->hasMany(Supplier::class);
    }

    public function customers(): HasMany
    {
        return $this->hasMany(Customer::class);
    }

    public function paymentMethods(): HasMany
    {
        return $this->hasMany(PaymentMethod::class);
    }

    public function cafeTables(): HasMany
    {
        return $this->hasMany(CafeTable::class);
    }

    public function sales(): HasMany
    {
        return $this->hasMany(Sale::class);
    }

    public function purchases(): HasMany
    {
        return $this->hasMany(Purchase::class);
    }

    public function expenses(): HasMany
    {
        return $this->hasMany(Expense::class);
    }

    public function promotions(): HasMany
    {
        return $this->hasMany(Promotion::class);
    }

    public function memberships(): HasMany
    {
        return $this->hasMany(Membership::class);
    }

    public function paymentGateways(): HasMany
    {
        return $this->hasMany(StorePaymentGateway::class);
    }

    // --- Plan config terpusat ---

    /**
     * Definisi paket. Single source of truth — dipakai backend dan frontend.
     * Sync dengan StoreController::PLANS.
     */
    public static function planConfig(): array
    {
        return [
            "free" => [
                "label" => "Free",
                "max_users" => 1,
                "max_branches" => 1,
                // Fitur dasar saja — tidak ada laporan, tidak ada payment gateway, tidak ada multi-fitur advance
                "features" => ["basic_pos", "stock", "purchase", "promo"],
            ],
            "basic" => [
                "label" => "Basic",
                "max_users" => 5,
                "max_branches" => 3,
                "features" => [
                    "basic_pos",
                    "stock",
                    "purchase",
                    "batch",
                    "expiry",
                    "promo",
                    "sale_return",
                    "recipe",
                    "modifier",
                    "table",
                    "kitchen",
                    "waste",
                    "queue",
                    "booking",
                    "commission",
                    "membership",
                    "deposit",
                    "report",
                    "payment_gateway",
                    "stock_opname",
                ],
            ],
            "pro" => [
                "label" => "Pro",
                "max_users" => 999,
                "max_branches" => 999,
                "features" => ["*"], // semua fitur
            ],
        ];
    }

    /** Ambil semua plan dari database (dengan fallback ke hardcoded) */
    public static function allPlans(): array
    {
        $dbPlans = Plan::with("planFeatures")
            ->where("is_active", true)
            ->orderBy("sort_order")
            ->get();
        if ($dbPlans->isNotEmpty()) {
            return $dbPlans
                ->map(
                    fn($p) => [
                        "key" => $p->code,
                        "label" => $p->label,
                        "description" => $p->description,
                        "max_users" => $p->max_users,
                        "max_branches" => $p->max_branches,
                        "price" => (float) $p->price,
                        "trial_days" => $p->trial_days,
                        "features" => $p->featureCodes(),
                    ],
                )
                ->values()
                ->toArray();
        }
        // Fallback ke hardcoded
        return collect(self::planConfig())
            ->map(fn($p, $k) => array_merge($p, ["key" => $k]))
            ->values()
            ->toArray();
    }

    /** Ambil config plan aktif toko ini */
    public function activePlanConfig(): array
    {
        return self::planConfig()[$this->plan] ?? self::planConfig()["free"];
    }

    /** Cek apakah plan mengizinkan fitur tertentu */
    public function planAllowsFeature(string $feature): bool
    {
        $plan = $this->effectivePlan();
        $features = $this->activePlanConfig()["features"];

        // Pro = semua diizinkan
        if ($features === ["*"] || in_array("*", $features)) {
            return true;
        }

        // Free = hanya blokir fitur premium tertentu, sisanya boleh
        // Ini mencegah sidebar kosong saat developer set plan free tapi modules sudah dikonfigurasi
        if ($plan === "free") {
            $blockedInFree = ["payment_gateway"]; // hanya blokir ini di free
            return !in_array($feature, $blockedInFree);
        }

        // Basic ke atas = izinkan semua fitur yang ada di modules
        return true;
    }

    /** Cek apakah fitur aktif di modules DAN diizinkan plan */
    public function hasFeature(string $feature): bool
    {
        // Fitur harus aktif di modules toko ini (dikonfigurasi developer)
        if (!in_array($feature, $this->modules["features"] ?? [])) {
            return false;
        }
        // Dan plan harus mengizinkannya
        return $this->planAllowsFeature($feature);
    }

    public function hasPosMode(string $mode): bool
    {
        return in_array(
            $mode,
            $this->modules["pos_modes"] ?? [$this->store_type],
        );
    }

    /** Apakah masih bisa tambah user baru */
    public function canAddUser(): bool
    {
        $maxUsers = $this->max_users ?? $this->activePlanConfig()["max_users"];
        return $this->users()->count() < $maxUsers;
    }

    /** Apakah masih bisa tambah branch baru */
    public function canAddBranch(): bool
    {
        $maxBranches =
            $this->max_branches ?? $this->activePlanConfig()["max_branches"];
        return $this->branches()->count() < $maxBranches;
    }

    /** Plan expired? */
    public function isPlanExpired(): bool
    {
        return $this->plan_expires_at !== null &&
            $this->plan_expires_at->isPast();
    }

    /** Efektif plan aktif (fallback ke free jika expired) */
    public function effectivePlan(): string
    {
        return $this->isPlanExpired() ? "free" : $this->plan ?? "free";
    }
}
