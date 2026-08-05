<?php

namespace Database\Seeders\DevSeeder;

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

        // ── Owners (4 owners, 2 stores each) ────────────────────────────────
        $owners = [
            [
                'email' => 'owner1@gmail.com',
                'name' => 'Budi Santoso',
                'stores' => ['STORE001', 'STORE002'],
            ],
            [
                'email' => 'owner2@gmail.com',
                'name' => 'Siti Rahmawati',
                'stores' => ['STORE003', 'STORE004'],
            ],
            [
                'email' => 'owner3@gmail.com',
                'name' => 'Eko Prasetyo',
                'stores' => ['STORE005', 'STORE006'],
            ],
            [
                'email' => 'owner4@gmail.com',
                'name' => 'Linda Wulandari',
                'stores' => ['STORE007', 'STORE008'],
            ],
        ];

        foreach ($owners as $ownerData) {
            $user = User::updateOrCreate(
                ['email' => $ownerData['email']],
                [
                    'name' => $ownerData['name'],
                    'password' => Hash::make('password'),
                    'is_developer' => false,
                    ...self::readyToUseAttributes(),
                ],
            );

            foreach ($ownerData['stores'] as $storeCode) {
                $store = Store::where('code', $storeCode)->firstOrFail();
                $store->users()->syncWithoutDetaching([$user->id]);
            }
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
