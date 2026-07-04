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
        $store7 = Store::where("code", "STORE007")->firstOrFail();
        $store8 = Store::where("code", "STORE008")->firstOrFail();

        // ── Developer ────────────────────────────────────────────────
        $dev1 = User::updateOrCreate(
            ["email" => "dev@gmail.com"],
            [
                "name" => "Dev Admin",
                "password" => Hash::make("password"),
                "is_developer" => true,
            ],
        );

        // ── Owner 1: Minimarket Sejahtera (Retail) ──────────────────
        $owner1 = User::updateOrCreate(
            ["email" => "owner1@gmail.com"],
            [
                "name" => "Budi Santoso",
                "password" => Hash::make("password"),
            ],
        );
        // ── Owner 2: Kopi Senja (FnB) ──────────────────────────────
        $owner2 = User::updateOrCreate(
            ["email" => "owner2@gmail.com"],
            [
                "name" => "Siti Rahmawati",
                "password" => Hash::make("password"),
            ],
        );
        // ── Owner 3: Barbershop Rapi (Service) ──────────────────────
        $owner3 = User::updateOrCreate(
            ["email" => "owner3@gmail.com"],
            [
                "name" => "Eko Prasetyo",
                "password" => Hash::make("password"),
            ],
        );
        // ── Owner 4: Sewa Alat Jaya (Rental) ────────────────────────
        $owner4 = User::updateOrCreate(
            ["email" => "owner4@gmail.com"],
            [
                "name" => "Linda Wulandari",
                "password" => Hash::make("password"),
            ],
        );
        // ── Owner 5: Bioskop Nusantara (Ticket) ─────────────────────
        $owner5 = User::updateOrCreate(
            ["email" => "owner5@gmail.com"],
            [
                "name" => "Rudi Hartono",
                "password" => Hash::make("password"),
            ],
        );
        // ── Owner 6: Villa Sunrise (Hospitality) ────────────────────
        $owner6 = User::updateOrCreate(
            ["email" => "owner6@gmail.com"],
            [
                "name" => "Mega Putri",
                "password" => Hash::make("password"),
            ],
        );
        // ── Owner 7: Parkir Jayabaya (Parking) ──────────────────────
        $owner7 = User::updateOrCreate(
            ["email" => "owner7@gmail.com"],
            [
                "name" => "Hendra Gunawan",
                "password" => Hash::make("password"),
            ],
        );
        // ── Owner 8: GamerZone (Session) ────────────────────────────
        $owner8 = User::updateOrCreate(
            ["email" => "owner8@gmail.com"],
            [
                "name" => "Dian Permata",
                "password" => Hash::make("password"),
            ],
        );

        // ── Kasir per store ─────────────────────────────────────────
        $kasir1 = User::updateOrCreate(
            ["email" => "rizki@gmail.com"],
            [
                "name" => "Rizki Firmansyah",
                "password" => Hash::make("password"),
            ],
        );
        $kasir2 = User::updateOrCreate(
            ["email" => "kasir@gmail.com"],
            ["name" => "Andi Prasetyo", "password" => Hash::make("password")],
        );
        $kasir3 = User::updateOrCreate(
            ["email" => "barber@gmail.com"],
            ["name" => "Fandi Ahmad", "password" => Hash::make("password")],
        );
        $kasir4 = User::updateOrCreate(
            ["email" => "sewa@gmail.com"],
            ["name" => "Yuni Astuti", "password" => Hash::make("password")],
        );
        $kasir5 = User::updateOrCreate(
            ["email" => "bioskop@gmail.com"],
            ["name" => "Anton Wijaya", "password" => Hash::make("password")],
        );
        $kasir6 = User::updateOrCreate(
            ["email" => "villa@gmail.com"],
            ["name" => "Sari Indah", "password" => Hash::make("password")],
        );
        $kasir7 = User::updateOrCreate(
            ["email" => "parkir@gmail.com"],
            ["name" => "Bayu Setiawan", "password" => Hash::make("password")],
        );
        $kasir8 = User::updateOrCreate(
            ["email" => "gamer@gmail.com"],
            ["name" => "Rama Putra", "password" => Hash::make("password")],
        );

        // ── Assign roles via Spatie ────────────────────────────────
        $this->assignRole($owner1, "owner", $store1->id);
        $this->assignRole($owner2, "owner", $store2->id);
        $this->assignRole($owner3, "owner", $store3->id);
        $this->assignRole($owner4, "owner", $store4->id);
        $this->assignRole($owner5, "owner", $store5->id);
        $this->assignRole($owner6, "owner", $store6->id);
        $this->assignRole($owner7, "owner", $store7->id);
        $this->assignRole($owner8, "owner", $store8->id);

        $this->assignRole($kasir1, "kasir", $store1->id);
        $this->assignRole($kasir2, "kasir", $store2->id);
        $this->assignRole($kasir3, "kasir", $store3->id);
        $this->assignRole($kasir4, "kasir", $store4->id);
        $this->assignRole($kasir5, "kasir", $store5->id);
        $this->assignRole($kasir6, "kasir", $store6->id);
        $this->assignRole($kasir7, "kasir", $store7->id);
        $this->assignRole($kasir8, "kasir", $store8->id);

        // ── Pivot user_store ──────────────────────────────────────────
        $pivots = [
            // Developer — akses semua
            [$dev1->id, $store1->id],
            [$dev1->id, $store2->id],
            [$dev1->id, $store3->id],
            [$dev1->id, $store4->id],
            [$dev1->id, $store5->id],
            [$dev1->id, $store6->id],
            [$dev1->id, $store7->id],
            [$dev1->id, $store8->id],
            // Owner — store masing-masing
            [$owner1->id, $store1->id],
            [$owner2->id, $store2->id],
            [$owner3->id, $store3->id],
            [$owner4->id, $store4->id],
            [$owner5->id, $store5->id],
            [$owner6->id, $store6->id],
            [$owner7->id, $store7->id],
            [$owner8->id, $store8->id],
            // Kasir — store masing-masing
            [$kasir1->id, $store1->id],
            [$kasir2->id, $store2->id],
            [$kasir3->id, $store3->id],
            [$kasir4->id, $store4->id],
            [$kasir5->id, $store5->id],
            [$kasir6->id, $store6->id],
            [$kasir7->id, $store7->id],
            [$kasir8->id, $store8->id],
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
        }
        $registrar = app(\Spatie\Permission\PermissionRegistrar::class);
        $registrar->setPermissionsTeamId($storeId);

        $role = Role::where("name", $roleName)
            ->where("store_id", $storeId)
            ->first();

        if ($role) {
            $user->assignRole($role);
        }
        $registrar->setPermissionsTeamId(null);
    }
}
