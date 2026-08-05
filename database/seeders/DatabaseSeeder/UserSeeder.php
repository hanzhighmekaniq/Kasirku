<?php

namespace Database\Seeders\DatabaseSeeder;

use App\Models\Store;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // ── Developer ────────────────────────────────────────────────────────
        User::updateOrCreate(
            ['email' => 'dev@gmail.com'],
            [
                'name' => 'Dev Admin',
                'password' => Hash::make('password'),
                'is_developer' => true,
                ...self::readyToUseAttributes(),
            ],
        );

        // ── Owner untuk STORE001 ─────────────────────────────────────────────
        $owner = User::updateOrCreate(
            ['email' => 'owner1@gmail.com'],
            [
                'name' => 'Budi Santoso',
                'password' => Hash::make('password'),
                'is_developer' => false,
                ...self::readyToUseAttributes(),
            ],
        );

        $store = Store::where('code', 'STORE001')->firstOrFail();
        $store->users()->syncWithoutDetaching([$owner->id]);

        // ── Kasir per branch ─────────────────────────────────────────────────
        $kasirs = [
            ['email' => 'kasir.pusat@gmail.com', 'name' => 'Rizki Firmansyah'],
            ['email' => 'kasir.babarsari@gmail.com', 'name' => 'Andi Prasetyo'],
        ];

        foreach ($kasirs as $k) {
            User::updateOrCreate(
                ['email' => $k['email']],
                [
                    'name' => $k['name'],
                    'password' => Hash::make('password'),
                    'is_developer' => false,
                    ...self::readyToUseAttributes(),
                ],
            );
        }
    }

    /**
     * Akun seed harus langsung bisa dipakai.
     *
     * Tanpa `email_verified_at`, middleware EnsureEmailVerifiedForMutations
     * memblokir semua POST/PUT/PATCH/DELETE. Tanpa `password_changed_at`,
     * middleware EnsurePasswordChangedAfterVerification memaksa ke
     * /password/setup. Keduanya harus diisi bersamaan.
     *
     * @return array{email_verified_at: Carbon, password_changed_at: Carbon}
     */
    private static function readyToUseAttributes(): array
    {
        return [
            'email_verified_at' => now(),
            'password_changed_at' => now(),
        ];
    }
}
