<?php

namespace App\Console\Commands;

use App\Models\Customer;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SendBirthdayGreetings extends Command
{
    protected $signature = 'app:send-birthday-greetings';

    protected $description = 'Kirim ucapan ulang tahun ke customer yang berulang tahun hari ini';

    public function handle(): int
    {
        $today = now();
        $day = (int) $today->format('j');
        $month = (int) $today->format('n');

        // Cari customer yang ultah hari ini
        $customers = Customer::where('is_active', true)
            ->whereNotNull('birth_date')
            ->whereRaw('DAY(birth_date) = ?', [$day])
            ->whereRaw('MONTH(birth_date) = ?', [$month])
            ->with(['store:id,name'])
            ->get();

        if ($customers->isEmpty()) {
            $this->info('Tidak ada customer yang berulang tahun hari ini.');

            return self::SUCCESS;
        }

        $this->info("Ditemukan {$customers->count()} customer yang berulang tahun hari ini.");

        $sent = 0;

        foreach ($customers as $customer) {
            $store = $customer->store;
            if (! $store) {
                continue;
            }

            // Kirim notifikasi ke owner/admin toko
            $admins = $store->users()->get();

            foreach ($admins as $admin) {
                $age = $customer->birth_date
                    ? now()->year - $customer->birth_date->year
                    : null;

                DB::table('notifications')->insert([
                    'id' => Str::uuid(),
                    'type' => 'App\\Notifications\\BirthdayGreetingNotification',
                    'notifiable_type' => 'App\\Models\\User',
                    'notifiable_id' => $admin->id,
                    'data' => json_encode([
                        'title' => 'Ulang Tahun Customer',
                        'message' => "{$customer->name} berulang tahun hari ini".
                            ($age ? " (ke-{$age})" : '').
                            '. Kirim ucapan atau voucher diskon!',
                        'customer_id' => $customer->id,
                        'customer_name' => $customer->name,
                        'store_id' => $store->id,
                        'store_name' => $store->name,
                    ]),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            $sent++;
        }

        $this->info("Berhasil mengirim {$sent} notifikasi ulang tahun.");

        return self::SUCCESS;
    }
}
