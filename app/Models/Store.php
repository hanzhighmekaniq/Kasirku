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
        "plan_id",
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

    public function planModel(): BelongsTo
    {
        return $this->belongsTo(Plan::class, "plan_id");
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
                        "id"           => $p->id,
                        "key"          => $p->code,
                        "label"        => $p->label,
                        "description"  => $p->description,
                        "max_users"    => $p->max_users,
                        "max_branches" => $p->max_branches,
                        "price"        => (float) $p->price,
                        "trial_days"   => $p->trial_days,
                        "features"     => $p->featureCodes(),
                    ],
                )
                ->values()
                ->toArray();
        }
        // Fallback ke hardcoded (tanpa id)
        return collect(self::planConfig())
            ->map(fn($p, $k) => array_merge($p, ["id" => null, "key" => $k]))
            ->values()
            ->toArray();
    }

    /** Ambil config plan aktif toko ini — dari relasi plan_id, fallback ke hardcoded */
    public function activePlanConfig(): array
    {
        // Coba dari relasi Plan model
        $plan = $this->planModel;
        if ($plan) {
            return [
                "label"        => $plan->label,
                "max_users"    => $plan->max_users,
                "max_branches" => $plan->max_branches,
                "features"     => $plan->featureCodes(),
            ];
        }
        // Fallback ke hardcoded (jika plan_id belum diset)
        return self::planConfig()[$this->plan] ?? self::planConfig()["free"];
    }

    /** Efektif max users: override toko ?? ambil dari plan */
    public function effectiveMaxUsers(): int
    {
        return $this->max_users ?? $this->activePlanConfig()["max_users"] ?? 1;
    }

    /** Efektif max branches: override toko ?? ambil dari plan */
    public function effectiveMaxBranches(): int
    {
        return $this->max_branches ?? $this->activePlanConfig()["max_branches"] ?? 1;
    }

    /** Cek apakah plan mengizinkan fitur tertentu */
    public function planAllowsFeature(string $feature): bool
    {
        $features = $this->activePlanConfig()["features"] ?? [];

        // Wildcard = semua diizinkan (plan Pro)
        if ($features === ["*"] || in_array("*", $features)) {
            return true;
        }

        // Free: hanya blokir payment_gateway agar sidebar tidak kosong
        if ($this->effectivePlanCode() === "free") {
            $blockedInFree = ["payment_gateway"];
            return !in_array($feature, $blockedInFree);
        }

        // Basic ke atas = izinkan semua fitur yang ada di modules
        return true;
    }

    /** Cek apakah fitur aktif di modules DAN diizinkan plan */
    public function hasFeature(string $feature): bool
    {
        if (!in_array($feature, $this->modules["features"] ?? [])) {
            return false;
        }
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
        return $this->users()->count() < $this->effectiveMaxUsers();
    }

    /** Apakah masih bisa tambah branch baru */
    public function canAddBranch(): bool
    {
        return $this->branches()->count() < $this->effectiveMaxBranches();
    }

    /** Plan expired? */
    public function isPlanExpired(): bool
    {
        return $this->plan_expires_at !== null &&
            $this->plan_expires_at->isPast();
    }

    /** Kode plan efektif (fallback ke free jika expired) */
    public function effectivePlanCode(): string
    {
        if ($this->isPlanExpired()) return "free";
        // Dari relasi plan_id dulu, lalu kolom plan lama
        return $this->planModel?->code ?? $this->plan ?? "free";
    }

    /** @deprecated Gunakan effectivePlanCode() */
    public function effectivePlan(): string
    {
        return $this->effectivePlanCode();
    }
}
