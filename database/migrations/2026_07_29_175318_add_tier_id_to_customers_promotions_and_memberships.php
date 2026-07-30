<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** Tier bawaan yang dipakai sebelum tier bisa dikelola per toko. */
    private const LEGACY_TIERS = ['bronze', 'silver', 'gold', 'platinum'];

    /**
     * Pindahkan referensi tier dari string ke relasi `customer_tiers`.
     *
     * Kolom string lama (`customers.tier`, `promotions.customer_tier`,
     * `memberships.maps_to_tier`) sengaja TIDAK dihapus. Kolom itu masih dibaca
     * kode lain dan menjadi jaring aman kalau ada data yang belum ikut
     * ter-backfill; penghapusannya dijadwalkan setelah semua pembaca beralih.
     */
    public function up(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->foreignId('customer_tier_id')
                ->nullable()
                ->after('tier')
                ->constrained('customer_tiers')
                ->nullOnDelete();
        });

        Schema::table('promotions', function (Blueprint $table) {
            $table->foreignId('customer_tier_id')
                ->nullable()
                ->after('customer_tier')
                ->constrained('customer_tiers')
                ->nullOnDelete();
        });

        Schema::table('memberships', function (Blueprint $table) {
            $table->foreignId('maps_to_tier_id')
                ->nullable()
                ->after('maps_to_tier')
                ->constrained('customer_tiers')
                ->nullOnDelete();
        });

        $this->backfill();
    }

    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropConstrainedForeignId('customer_tier_id');
        });

        Schema::table('promotions', function (Blueprint $table) {
            $table->dropConstrainedForeignId('customer_tier_id');
        });

        Schema::table('memberships', function (Blueprint $table) {
            $table->dropConstrainedForeignId('maps_to_tier_id');
        });
    }

    /**
     * Buat empat tier bawaan untuk setiap toko, lalu petakan data string lama
     * ke ID-nya. Dijalankan per toko supaya tier satu toko tidak pernah
     * dipakai toko lain.
     */
    private function backfill(): void
    {
        $storeIds = DB::table('stores')->pluck('id');

        foreach ($storeIds as $storeId) {
            $tierIds = [];

            foreach (self::LEGACY_TIERS as $index => $name) {
                $existing = DB::table('customer_tiers')
                    ->where('store_id', $storeId)
                    ->where('name', ucfirst($name))
                    ->value('id');

                $tierIds[$name] = $existing ?: DB::table('customer_tiers')->insertGetId([
                    'store_id' => $storeId,
                    'name' => ucfirst($name),
                    'rank' => $index + 1,
                    'color' => match ($name) {
                        'bronze' => 'amber',
                        'silver' => 'slate',
                        'gold' => 'yellow',
                        'platinum' => 'indigo',
                        default => 'slate',
                    },
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            foreach ($tierIds as $name => $tierId) {
                DB::table('customers')
                    ->where('store_id', $storeId)
                    ->where('tier', $name)
                    ->update(['customer_tier_id' => $tierId]);

                DB::table('promotions')
                    ->where('store_id', $storeId)
                    ->where('customer_tier', $name)
                    ->update(['customer_tier_id' => $tierId]);

                DB::table('memberships')
                    ->where('store_id', $storeId)
                    ->where('maps_to_tier', $name)
                    ->update(['maps_to_tier_id' => $tierId]);
            }

            $this->backfillBenefitTierIds($storeId, $tierIds);
        }
    }

    /**
     * Tulis `tier_id` ke dalam benefit `maps_to_tier` pada kolom JSON.
     *
     * Benefit menyimpan nama tier sebagai string. Nama itu dibiarkan (berguna
     * saat tier terlanjur dihapus), tapi `tier_id` ditambahkan supaya pembacaan
     * berikutnya tidak lagi bergantung pada string.
     *
     * @param  array<string, int>  $tierIds
     */
    private function backfillBenefitTierIds(int $storeId, array $tierIds): void
    {
        $memberships = DB::table('memberships')
            ->where('store_id', $storeId)
            ->whereNotNull('benefits')
            ->get(['id', 'benefits']);

        foreach ($memberships as $membership) {
            $benefits = json_decode($membership->benefits, true);

            if (! is_array($benefits)) {
                continue;
            }

            $changed = false;

            foreach ($benefits as $i => $benefit) {
                if (! is_array($benefit) || ($benefit['type'] ?? null) !== 'maps_to_tier') {
                    continue;
                }

                $tierName = $benefit['tier'] ?? null;

                if (! isset($tierIds[$tierName]) || isset($benefit['tier_id'])) {
                    continue;
                }

                $benefits[$i]['tier_id'] = $tierIds[$tierName];
                $changed = true;
            }

            if ($changed) {
                DB::table('memberships')
                    ->where('id', $membership->id)
                    ->update(['benefits' => json_encode($benefits)]);
            }
        }
    }
};
