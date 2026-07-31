<?php

namespace App\Services;

use App\Models\CustomerTier;
use App\Models\Plan;
use App\Models\PlanSubscription;
use App\Models\Store;
use App\Models\StoreType;
use App\Models\User;
use App\Notifications\WelcomeStoreOwner;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Spatie\Permission\PermissionRegistrar;

/**
 * Orkestrasi registrasi mandiri (self-service): dari data akun, jenis usaha,
 * template bisnis, dan plan pilihan user → jadi User + Store yang siap
 * dipakai (role, payment method, tier, dan data awal sudah lengkap).
 *
 * Dipakai oleh RegisteredUserController. Method register() HARUS dipanggil
 * di dalam DB::transaction() oleh pemanggilnya.
 */
class StoreOnboardingService
{
    /**
     * @param  array{name: string, email: string, password: string}  $account
     */
    public function register(
        array $account,
        int $storeTypeId,
        ?string $businessTemplateCode,
        int $planId,
    ): User {
        $storeType = StoreType::findOrFail($storeTypeId);
        $plan = Plan::findOrFail($planId);

        $user = User::create([
            'name' => $account['name'],
            'email' => $account['email'],
            'password' => Hash::make($account['password']),
        ]);

        $store = Store::create([
            'user_id' => $user->id,
            'code' => $this->generateUniqueStoreCode($account['name']),
            'name' => $account['name']."'s Store",
            'store_type_id' => $storeType->id,
            'is_active' => true,
            'plan_id' => $plan->id,
            'plan_expires_at' => $plan->trial_days > 0
                ? now()->addDays($plan->trial_days)
                : null,
            // max_users & max_branches null → ikut limit plan
            'max_users' => null,
            'max_branches' => null,
        ]);

        $store->branches()->create([
            'code' => 'PUSAT',
            'name' => 'Cabang Pusat',
            'is_active' => true,
        ]);

        PlanSubscription::create([
            'store_id' => $store->id,
            'plan_id' => $plan->id,
            'started_at' => now(),
            'reason' => 'initial',
            'created_by' => null,
        ]);

        StoreRoleService::createRolesForStore($store->id);
        $this->assignOwnerRole($user, $store->id);

        $store->users()->syncWithoutDetaching([$user->id]);

        $store->paymentMethods()->create([
            'code' => 'CASH_'.$store->id,
            'name' => 'Tunai',
            'type' => 'cash',
            'is_active' => true,
            'sort_order' => 0,
        ]);
        $store->paymentMethods()->create([
            'code' => 'DEBT_'.$store->id,
            'name' => 'Hutang / Kasbon',
            'type' => 'debt',
            'is_active' => true,
            'sort_order' => 1,
        ]);

        CustomerTier::seedDefaultsForStore($store->id);

        BusinessTemplateService::apply($store, $businessTemplateCode);

        $user->notify(new WelcomeStoreOwner($store));

        return $user;
    }

    private function assignOwnerRole(User $user, int $storeId): void
    {
        app(PermissionRegistrar::class)->setPermissionsTeamId($storeId);
        $user->assignRole('owner');
        app(PermissionRegistrar::class)->setPermissionsTeamId(null);
    }

    /** Kode toko unik, diturunkan dari nama pemilik + suffix acak. */
    private function generateUniqueStoreCode(string $seed): string
    {
        $base = Str::upper(Str::slug($seed, ''));
        $base = substr($base !== '' ? $base : 'STORE', 0, 8);

        do {
            $code = $base.strtoupper(Str::random(4));
        } while (Store::where('code', $code)->exists());

        return $code;
    }
}
