<?php

namespace Database\Seeders;

use App\Models\Store;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $store1 = Store::where("code", "STORE001")->firstOrFail();
        $store2 = Store::where("code", "STORE002")->firstOrFail();
        $store3 = Store::where("code", "STORE003")->firstOrFail();
        $store4 = Store::where("code", "STORE004")->firstOrFail();
        $store5 = Store::where("code", "STORE005")->firstOrFail();
        $store6 = Store::where("code", "STORE006")->firstOrFail();

        // ── Developer ────────────────────────────────────────────────
        $dev1 = User::updateOrCreate(
            ["email" => "dev@gmail.com"],
            [
                "name" => "Dev Admin",
                "password" => Hash::make("password"),
                "is_developer" => true,
            ],
        );
        $dev2 = User::updateOrCreate(
            ["email" => "dev@simkasir.id"],
            [
                "name" => "Developer Utama",
                "password" => Hash::make("password"),
                "is_developer" => true,
            ],
        );

        // ── Owner Store 1 (Minimarket / Retail) ──────────────────────
        $owner1 = User::updateOrCreate(
            ["email" => "owner@gmail.com"],
            [
                "name" => "Budi Santoso",
                "password" => Hash::make("password"),
            ],
        );

        // ── Owner Store 2 (Kopi Senja / FnB) ──────────────────────────
        $owner2 = User::updateOrCreate(
            ["email" => "owner2@gmail.com"],
            [
                "name" => "Siti Rahmawati",
                "password" => Hash::make("password"),
            ],
        );

        // ── Owner Store 3 (Barbershop / Service) ──────────────────────
        $owner3 = User::updateOrCreate(
            ["email" => "owner3@gmail.com"],
            [
                "name" => "Eko Prasetyo",
                "password" => Hash::make("password"),
            ],
        );

        // ── Owner Store 4 (Sewa Alat / Rental) ────────────────────────
        $owner4 = User::updateOrCreate(
            ["email" => "owner4@gmail.com"],
            [
                "name" => "Linda Wulandari",
                "password" => Hash::make("password"),
            ],
        );

        // Owner Store 5 (Futsal / Ticket)
        $owner5 = User::updateOrCreate(
            ["email" => "owner5@gmail.com"],
            [
                "name" => "Rudi Hartono",
                "password" => Hash::make("password"),
            ],
        );

        // Owner Store 6 (Villa / Hospitality)
        $owner6 = User::updateOrCreate(
            ["email" => "owner6@gmail.com"],
            [
                "name" => "Mega Putri",
                "password" => Hash::make("password"),
            ],
        );

        // ── Kasir Store 1 (Minimarket / Retail) ───────────────────────
        $kasir1 = User::updateOrCreate(
            ["email" => "rizki@gmail.com"],
            [
                "name" => "Rizki Firmansyah",
                "password" => Hash::make("password"),
            ],
        );
        $kasir2 = User::updateOrCreate(
            ["email" => "sari@gmail.com"],
            [
                "name" => "Sari Indah",
                "password" => Hash::make("password"),
            ],
        );

        // ── Kasir Store 2 (Kopi Senja / FnB) ──────────────────────────
        $kasir3 = User::updateOrCreate(
            ["email" => "kasir@gmail.com"],
            [
                "name" => "Andi Prasetyo",
                "password" => Hash::make("password"),
            ],
        );
        $kasir4 = User::updateOrCreate(
            ["email" => "dewi@gmail.com"],
            [
                "name" => "Dewi Lestari",
                "password" => Hash::make("password"),
            ],
        );

        // ── Kasir Store 3 (Barbershop / Service) ──────────────────────
        $kasir5 = User::updateOrCreate(
            ["email" => "barber@gmail.com"],
            [
                "name" => "Fandi Ahmad",
                "password" => Hash::make("password"),
            ],
        );

        // ── Kasir Store 4 (Sewa Alat / Rental) ────────────────────────
        $kasir6 = User::updateOrCreate(
            ["email" => "sewa@gmail.com"],
            [
                "name" => "Yuni Astuti",
                "password" => Hash::make("password"),
            ],
        );

        // Kasir Store 5 (Futsal / Ticket)
        $kasir7 = User::updateOrCreate(
            ["email" => "futsal@gmail.com"],
            [
                "name" => "Anton Wijaya",
                "password" => Hash::make("password"),
            ],
        );

        // Kasir Store 6 (Villa / Hospitality)
        $kasir8 = User::updateOrCreate(
            ["email" => "villa@gmail.com"],
            [
                "name" => "Dian Permata",
                "password" => Hash::make("password"),
            ],
        );

        // ── Assign roles via Spatie (teams = store_id) ────────────────
        // Developer tidak pakai Spatie role — pakai is_developer flag
        // Roles per store sudah dibuat oleh RolePermissionSeeder

        $this->assignRole($owner1, "owner", $store1->id);
        $this->assignRole($owner2, "owner", $store2->id);
        $this->assignRole($owner3, "owner", $store3->id);
        $this->assignRole($owner4, "owner", $store4->id);
        $this->assignRole($owner5, "owner", $store5->id);
        $this->assignRole($owner6, "owner", $store6->id);

        $this->assignRole($kasir1, "kasir", $store1->id);
        $this->assignRole($kasir2, "kasir", $store1->id);
        $this->assignRole($kasir3, "kasir", $store2->id);
        $this->assignRole($kasir4, "kasir", $store2->id);
        $this->assignRole($kasir5, "kasir", $store3->id);
        $this->assignRole($kasir6, "kasir", $store4->id);
        $this->assignRole($kasir7, "kasir", $store5->id);
        $this->assignRole($kasir8, "kasir", $store6->id);

        // ── Pivot user_store ──────────────────────────────────────────
        $pivots = [
            // Developer akses semua store
            [$dev1->id, $store1->id],
            [$dev1->id, $store2->id],
            [$dev1->id, $store3->id],
            [$dev1->id, $store4->id],
            [$dev1->id, $store5->id],
            [$dev1->id, $store6->id],
            [$dev2->id, $store1->id],
            [$dev2->id, $store2->id],
            [$dev2->id, $store3->id],
            [$dev2->id, $store4->id],
            [$dev2->id, $store5->id],
            [$dev2->id, $store6->id],
            // Owner masing-masing store
            [$owner1->id, $store1->id],
            [$owner2->id, $store2->id],
            [$owner3->id, $store3->id],
            [$owner4->id, $store4->id],
            [$owner5->id, $store5->id],
            [$owner6->id, $store6->id],
            // Kasir per store
            // STORE001 (Retail): rizki + sari
            [$kasir1->id, $store1->id],
            [$kasir2->id, $store1->id],
            // STORE002 (FnB): kasir + dewi
            [$kasir3->id, $store2->id],
            [$kasir4->id, $store2->id],
            // STORE003 (Service): barber
            [$kasir5->id, $store3->id],
            // STORE004 (Rental): sewa
            [$kasir6->id, $store4->id],
            // STORE005 (Ticket): futsal
            [$kasir7->id, $store5->id],
            // STORE006 (Hospitality): villa
            [$kasir8->id, $store6->id],
        ];

        foreach ($pivots as [$userId, $storeId]) {
            DB::table("user_store")->updateOrInsert(
                ["user_id" => $userId, "store_id" => $storeId],
                ["created_at" => now(), "updated_at" => now()],
            );
        }
    }

    private function assignRole(
        User $user,
        string $roleName,
        ?int $storeId,
    ): void {
        if (!$storeId) {
            return;
        } // developer tidak perlu role Spatie
        $registrar = app(\Spatie\Permission\PermissionRegistrar::class);
        $registrar->setPermissionsTeamId($storeId);

        // Cari role yang store_id-nya match
        $role = \Spatie\Permission\Models\Role::where("name", $roleName)
            ->where("store_id", $storeId)
            ->first();

        if ($role) {
            $user->assignRole($role);
        }

        $registrar->setPermissionsTeamId(null);
    }
}
