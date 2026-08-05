<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\PermissionRegistrar;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable implements MustVerifyEmail
{
    use HasFactory, HasRoles, Notifiable;

    /** Akses penuh ke seluruh panel developer. */
    public const DEV_SUPER_ADMIN = 'super_admin';

    /**
     * Hanya baca + impersonate + catatan internal. Tidak boleh menghapus
     * toko, mengubah plan, atau mengubah data konfigurasi platform.
     */
    public const DEV_SUPPORT = 'support';

    /** @var array<string, string> */
    public const DEVELOPER_ROLES = [
        self::DEV_SUPER_ADMIN => 'Super Admin',
        self::DEV_SUPPORT => 'Support',
    ];

    protected $fillable = [
        'name',
        'email',
        'is_developer',
        'developer_role',
        'plan_id',
        'plan_expires_at',
        'password',
        'session_token',
        'theme_preference',
        'sidebar_preference',
        'password_changed_at',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_developer' => 'boolean',
            'plan_expires_at' => 'date',
            'theme_preference' => 'array',
            'sidebar_preference' => 'array',
            'password_changed_at' => 'datetime',
        ];
    }

    // --- Relationships ---

    /** Plan yang dimiliki user — sumber kebenaran billing sekarang. */
    public function planModel(): BelongsTo
    {
        return $this->belongsTo(Plan::class, 'plan_id');
    }

    public function planOrders(): HasMany
    {
        return $this->hasMany(PlanOrder::class);
    }

    public function planSubscriptions(): HasMany
    {
        return $this->hasMany(PlanSubscription::class);
    }

    public function stores(): BelongsToMany
    {
        return $this->belongsToMany(Store::class, 'user_store')
            ->with('storeType')
            ->withTimestamps()
            ->select(
                'stores.id',
                'stores.name',
                'stores.code',
                'stores.store_type_id',
                'stores.logo',
                'stores.is_active',
                // Dipakai saat mencetak struk di kasir.
                'stores.phone',
                'stores.address',
                'stores.receipt_header',
                'stores.receipt_footer',
                'stores.currency',
                'stores.decimal_places',
                'stores.default_tax_rate',
                'stores.tax_inclusive',
                'stores.payment_edit_limit_value',
                'stores.payment_edit_limit_unit',
            );
    }

    public function employee(): HasOne
    {
        return $this->hasOne(Employee::class);
    }

    /** Accessor: branch_id dari employee record (untuk kasir) */
    public function getBranchIdAttribute(): ?int
    {
        return $this->employee?->branch_id;
    }

    public function sales(): HasMany
    {
        return $this->hasMany(Sale::class);
    }

    public function themePresets(): HasMany
    {
        return $this->hasMany(ThemePreset::class)->orderByDesc('updated_at');
    }

    public function purchases(): HasMany
    {
        return $this->hasMany(Purchase::class);
    }

    // --- Plan helpers ---

    /** Plan efektif user — fallback ke free kalau tidak punya plan atau expired. */
    public function effectivePlanCode(): string
    {
        if ($this->isPlanExpired()) {
            return 'free';
        }

        return $this->planModel?->code ?? 'free';
    }

    public function isPlanExpired(): bool
    {
        return $this->plan_expires_at !== null
            && $this->plan_expires_at->isPast();
    }

    /**
     * Periode billing aktif user berdasarkan order terakhir yang sudah dibayar.
     */
    public function currentBillingPeriod(): ?string
    {
        return PlanOrder::where('user_id', $this->id)
            ->where('status', PlanOrder::STATUS_PAID)
            ->latest('paid_at')
            ->value('billing_period');
    }

    /** Apakah user masih bisa membuat toko baru (cek max_stores). */
    public function canAddStore(): bool
    {
        $max = $this->planModel?->max_stores;
        if ($max === null || $max >= 999) {
            return true;
        }

        return $this->stores()->count() < $max;
    }

    // --- Developer helpers ---

    /**
     * Developer adalah flag kolom, bukan Spatie role.
     * Karena Spatie teams butuh store_id context,
     * developer yang lintas semua store lebih aman pakai kolom biasa.
     */
    public function isDeveloper(): bool
    {
        return (bool) $this->is_developer;
    }

    /**
     * Super admin — akses penuh panel developer.
     *
     * Developer lama (sebelum kolom developer_role ada) di-backfill jadi
     * super_admin lewat migrasi. Nilai null pada developer yang aktif
     * tetap diperlakukan sebagai super admin supaya tidak ada developer
     * yang tiba-tiba kehilangan akses karena data belum terisi.
     */
    public function isSuperAdmin(): bool
    {
        return $this->isDeveloper()
            && $this->developer_role !== self::DEV_SUPPORT;
    }

    /** Support agent — hanya baca + impersonate + catatan internal. */
    public function isSupportAgent(): bool
    {
        return $this->isDeveloper()
            && $this->developer_role === self::DEV_SUPPORT;
    }

    /** Shortcut: cek apakah user bisa akses operasional (semua kecuali developer) */
    public function canAccessOperational(): bool
    {
        return ! $this->isDeveloper();
    }

    /**
     * Cek apakah user boleh ganti toko/branch.
     * Owner, admin, supervisor bisa — kasir & gudang tidak.
     * Cek via permission setting.view yang hanya dimiliki role dengan akses luas.
     */
    public function canSwitchBranch(): bool
    {
        // setting.view dimiliki owner, admin, supervisor — tidak dimiliki kasir/gudang/kitchen
        return $this->can('setting.view');
    }

    public function hasRoleInStore(string $role, int $storeId): bool
    {
        return $this->hasRole($role, null, $storeId);
    }

    public function assignRoleInStore(string $role, int $storeId): void
    {
        app(
            PermissionRegistrar::class,
        )->setPermissionsTeamId($storeId);
        $this->assignRole($role);
        app(
            PermissionRegistrar::class,
        )->setPermissionsTeamId(null);
    }

    public function currentStore(): ?Store
    {
        $storeId = session('current_store_id');
        if ($storeId) {
            return $this->stores()->find($storeId);
        }

        return $this->stores()->first();
    }

    public function currentBranch(): ?Branch
    {
        $branchId = session('current_branch_id');
        if ($branchId) {
            return Branch::find($branchId);
        }

        return $this->employee?->branch;
    }
}
