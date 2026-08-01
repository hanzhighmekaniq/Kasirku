<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Pindahkan plan dari stores ke users.
 *
 * Sebelum: plan menempel ke toko (stores.plan_id, stores.plan_expires_at)
 * Sesudah:  plan menempel ke akun (users.plan_id, users.plan_expires_at)
 *
 * Alasan: satu user bisa punya banyak toko — lebih masuk akal kalau
 * user berlangganan satu plan yang berlaku untuk semua tokonya, bukan
 * bayar per toko.
 *
 * Strategi backfill:
 *   - User yang punya toko → ambil plan tertinggi (sort_order terbesar)
 *     dari toko-toko miliknya (via stores.user_id).
 *   - User tanpa toko → plan null (Free saat diakses).
 *   - Toko seeder (user_id null, STORE001/STORE002) → dibiarkan, logika
 *     Store::effectivePlanCode() akan fallback ke stores.plan_id untuk
 *     kasus user_id null.
 *
 * Kolom lama di stores TIDAK dihapus di migrasi ini — dihapus di
 * migrasi terpisah setelah semua logika diverifikasi (langkah 8).
 *
 * plan_orders dan plan_subscriptions juga diubah dari store_id ke user_id.
 */
return new class extends Migration
{
    public function up(): void
    {
        // ── 1. Tambah kolom plan ke users ────────────────────────────
        Schema::table('users', function (Blueprint $table) {
            $table
                ->foreignId('plan_id')
                ->nullable()
                ->after('is_developer')
                ->constrained('plans')
                ->nullOnDelete();
            $table
                ->date('plan_expires_at')
                ->nullable()
                ->after('plan_id');
        });

        // ── 2. Backfill: salin plan dari toko ke owner-nya ──────────
        // Kalau satu user punya banyak toko, ambil plan dengan sort_order
        // tertinggi (plan paling mahal/lengkap yang dimiliki user).
        $usersWithStores = DB::table('stores')
            ->whereNotNull('user_id')
            ->join('users', 'users.id', '=', 'stores.user_id')
            ->join('plans', 'plans.id', '=', 'stores.plan_id')
            ->select(
                'stores.user_id',
                'stores.plan_id',
                'stores.plan_expires_at',
                'plans.sort_order',
            )
            ->orderBy('stores.user_id')
            ->orderByDesc('plans.sort_order')
            ->get()
            ->unique('user_id'); // ambil plan tertinggi per user

        foreach ($usersWithStores as $row) {
            DB::table('users')->where('id', $row->user_id)->update([
                'plan_id' => $row->plan_id,
                'plan_expires_at' => $row->plan_expires_at,
            ]);
        }

        // ── 3. Ubah plan_orders: store_id → user_id ──────────────────
        if (Schema::hasTable('plan_orders')) {
            // Tambah kolom user_id dulu
            Schema::table('plan_orders', function (Blueprint $table) {
                $table
                    ->foreignId('user_id')
                    ->nullable()
                    ->after('store_id')
                    ->constrained('users')
                    ->nullOnDelete();
            });

            // Backfill user_id dari store.user_id
            DB::table('plan_orders')
                ->join('stores', 'stores.id', '=', 'plan_orders.store_id')
                ->whereNotNull('stores.user_id')
                ->update(['plan_orders.user_id' => DB::raw('stores.user_id')]);

            // Drop store_id dari plan_orders
            Schema::table('plan_orders', function (Blueprint $table) {
                $table->dropForeign(['store_id']);
                $table->dropColumn('store_id');
            });
        }

        // ── 4. Ubah plan_subscriptions: store_id → user_id ──────────
        if (Schema::hasTable('plan_subscriptions')) {
            Schema::table('plan_subscriptions', function (Blueprint $table) {
                $table
                    ->foreignId('user_id')
                    ->nullable()
                    ->after('store_id')
                    ->constrained('users')
                    ->nullOnDelete();
            });

            // Backfill user_id dari store.user_id
            DB::table('plan_subscriptions')
                ->join('stores', 'stores.id', '=', 'plan_subscriptions.store_id')
                ->whereNotNull('stores.user_id')
                ->update(['plan_subscriptions.user_id' => DB::raw('stores.user_id')]);

            Schema::table('plan_subscriptions', function (Blueprint $table) {
                $table->dropForeign(['store_id']);
                $table->dropColumn('store_id');
            });
        }
    }

    public function down(): void
    {
        // Kembalikan plan_subscriptions
        if (Schema::hasTable('plan_subscriptions') && ! Schema::hasColumn('plan_subscriptions', 'store_id')) {
            Schema::table('plan_subscriptions', function (Blueprint $table) {
                $table
                    ->foreignId('store_id')
                    ->nullable()
                    ->after('id')
                    ->constrained()
                    ->cascadeOnDelete();
                $table->dropForeign(['user_id']);
                $table->dropColumn('user_id');
            });
        }

        // Kembalikan plan_orders
        if (Schema::hasTable('plan_orders') && ! Schema::hasColumn('plan_orders', 'store_id')) {
            Schema::table('plan_orders', function (Blueprint $table) {
                $table
                    ->foreignId('store_id')
                    ->nullable()
                    ->after('id')
                    ->constrained()
                    ->cascadeOnDelete();
                $table->dropForeign(['user_id']);
                $table->dropColumn('user_id');
            });
        }

        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['plan_id']);
            $table->dropColumn(['plan_id', 'plan_expires_at']);
        });
    }
};
