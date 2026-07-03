<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\Employee;
use App\Models\Store;
use App\Models\User;
use Illuminate\Database\Seeder;

class EmployeeSeeder extends Seeder
{
    public function run(): void
    {
        $store1 = Store::where('code', 'STORE001')->firstOrFail();
        $store2 = Store::where('code', 'STORE002')->firstOrFail();
        $store3 = Store::where('code', 'STORE003')->firstOrFail();
        $store4 = Store::where('code', 'STORE004')->firstOrFail();

        $br1 = Branch::where('code', 'BR001')->firstOrFail();
        $br2 = Branch::where('code', 'BR002')->firstOrFail();
        $br3 = Branch::where('code', 'BR003')->firstOrFail();
        $br4 = Branch::where('code', 'BR004')->firstOrFail();
        $br5 = Branch::where('code', 'BR005')->firstOrFail();
        $br6 = Branch::where('code', 'BR006')->firstOrFail();

        // ── Store 1: Kopi Senja ───────────────────────────────────────
        Employee::firstOrCreate(['store_id' => $store1->id, 'employee_code' => 'EMP001'], [
            'branch_id'        => $br1->id,
            'user_id'          => User::where('email', 'owner@gmail.com')->value('id'),
            'name'             => 'Budi Santoso',
            'phone'            => '081111111111',
            'email'            => 'owner@gmail.com',
            'position'         => 'Owner / Manager',
            'commission_type'  => 'none',
            'commission_value' => 0,
            'status'           => 'active',
        ]);
        Employee::firstOrCreate(['store_id' => $store1->id, 'employee_code' => 'EMP002'], [
            'branch_id'        => $br1->id,
            'user_id'          => User::where('email', 'kasir@gmail.com')->value('id'),
            'name'             => 'Andi Prasetyo',
            'phone'            => '082222222222',
            'email'            => 'kasir@gmail.com',
            'position'         => 'Kasir',
            'commission_type'  => 'none',
            'commission_value' => 0,
            'status'           => 'active',
        ]);
        Employee::firstOrCreate(['store_id' => $store1->id, 'employee_code' => 'EMP003'], [
            'branch_id'        => $br2->id,
            'user_id'          => User::where('email', 'dewi@gmail.com')->value('id'),
            'name'             => 'Dewi Lestari',
            'phone'            => '083333333333',
            'email'            => 'dewi@gmail.com',
            'position'         => 'Barista',
            'commission_type'  => 'none',
            'commission_value' => 0,
            'status'           => 'active',
        ]);

        // ── Store 2: Minimarket ───────────────────────────────────────
        Employee::firstOrCreate(['store_id' => $store2->id, 'employee_code' => 'EMP004'], [
            'branch_id'        => $br3->id,
            'user_id'          => User::where('email', 'owner2@gmail.com')->value('id'),
            'name'             => 'Siti Rahmawati',
            'phone'            => '085555555555',
            'email'            => 'owner2@gmail.com',
            'position'         => 'Owner / Manager',
            'commission_type'  => 'none',
            'commission_value' => 0,
            'status'           => 'active',
        ]);
        Employee::firstOrCreate(['store_id' => $store2->id, 'employee_code' => 'EMP005'], [
            'branch_id'        => $br3->id,
            'user_id'          => User::where('email', 'rizki@gmail.com')->value('id'),
            'name'             => 'Rizki Firmansyah',
            'phone'            => '086666666666',
            'email'            => 'rizki@gmail.com',
            'position'         => 'Kasir',
            'commission_type'  => 'none',
            'commission_value' => 0,
            'status'           => 'active',
        ]);
        Employee::firstOrCreate(['store_id' => $store2->id, 'employee_code' => 'EMP006'], [
            'branch_id'        => $br4->id,
            'user_id'          => User::where('email', 'sari@gmail.com')->value('id'),
            'name'             => 'Sari Indah',
            'phone'            => '087777777777',
            'email'            => 'sari@gmail.com',
            'position'         => 'Kasir',
            'commission_type'  => 'none',
            'commission_value' => 0,
            'status'           => 'active',
        ]);
        // Staff gudang tanpa akun user
        Employee::firstOrCreate(['store_id' => $store2->id, 'employee_code' => 'EMP007'], [
            'branch_id'        => $br3->id,
            'user_id'          => null,
            'name'             => 'Rina Wati',
            'phone'            => '088888888888',
            'email'            => 'rina@sejahtera.com',
            'position'         => 'Staff Gudang',
            'commission_type'  => 'none',
            'commission_value' => 0,
            'status'           => 'active',
        ]);

        // ── Store 3: Barbershop Rapi ──────────────────────────────────
        // Barber dapat komisi 15% per layanan
        Employee::firstOrCreate(['store_id' => $store3->id, 'employee_code' => 'EMP008'], [
            'branch_id'        => $br5->id,
            'user_id'          => User::where('email', 'owner3@gmail.com')->value('id'),
            'name'             => 'Eko Prasetyo',
            'phone'            => '082112345678',
            'email'            => 'owner3@gmail.com',
            'position'         => 'Owner / Senior Barber',
            'commission_type'  => 'percent',
            'commission_value' => 20,
            'status'           => 'active',
        ]);
        Employee::firstOrCreate(['store_id' => $store3->id, 'employee_code' => 'EMP009'], [
            'branch_id'        => $br5->id,
            'user_id'          => User::where('email', 'barber@gmail.com')->value('id'),
            'name'             => 'Fandi Ahmad',
            'phone'            => '082198765432',
            'email'            => 'barber@gmail.com',
            'position'         => 'Barber',
            'commission_type'  => 'percent',
            'commission_value' => 15,
            'status'           => 'active',
        ]);
        // Barber junior tanpa akun
        Employee::firstOrCreate(['store_id' => $store3->id, 'employee_code' => 'EMP010'], [
            'branch_id'        => $br5->id,
            'user_id'          => null,
            'name'             => 'Dimas Saputra',
            'phone'            => '082187654321',
            'email'            => null,
            'position'         => 'Barber Junior',
            'commission_type'  => 'percent',
            'commission_value' => 10,
            'status'           => 'active',
        ]);

        // ── Store 4: Laundry Bersih ───────────────────────────────────
        Employee::firstOrCreate(['store_id' => $store4->id, 'employee_code' => 'EMP011'], [
            'branch_id'        => $br6->id,
            'user_id'          => User::where('email', 'owner4@gmail.com')->value('id'),
            'name'             => 'Linda Wulandari',
            'phone'            => '083198765432',
            'email'            => 'owner4@gmail.com',
            'position'         => 'Owner',
            'commission_type'  => 'none',
            'commission_value' => 0,
            'status'           => 'active',
        ]);
        Employee::firstOrCreate(['store_id' => $store4->id, 'employee_code' => 'EMP012'], [
            'branch_id'        => $br6->id,
            'user_id'          => User::where('email', 'laundry@gmail.com')->value('id'),
            'name'             => 'Yuni Astuti',
            'phone'            => '083111222333',
            'email'            => 'laundry@gmail.com',
            'position'         => 'Kasir / Operator',
            'commission_type'  => 'none',
            'commission_value' => 0,
            'status'           => 'active',
        ]);
    }
}
