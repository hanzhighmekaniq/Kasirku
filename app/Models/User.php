<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\PermissionRegistrar;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasFactory, HasRoles, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'is_developer',
        'password',
        'session_token',
        'theme_preference',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_developer' => 'boolean',
            'theme_preference' => 'array',
        ];
    }

    // --- Relationships ---

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

    // --- Helpers ---

    /**
     * Developer adalah flag kolom, bukan Spatie role.
     * Karena Spatie teams butuh store_id context,
     * developer yang lintas semua store lebih aman pakai kolom biasa.
     */
    public function isDeveloper(): bool
    {
        return (bool) $this->is_developer;
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
