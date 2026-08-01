<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Level akses developer platform.
 *
 * Sebelum ini `is_developer` hanya boolean: setiap developer punya kuasa
 * identik, termasuk menghapus toko, mengubah plan siapa pun, dan
 * impersonate akun owner mana pun. Kolom ini memisahkan dua level:
 *
 *   super_admin — akses penuh (perilaku lama)
 *   support     — hanya baca + impersonate + catatan internal
 *
 * Semua developer yang sudah ada di-backfill jadi `super_admin` supaya
 * tidak ada yang kehilangan akses saat migrasi dijalankan.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table
                ->string('developer_role', 20)
                ->nullable()
                ->after('is_developer')
                ->comment('super_admin | support. Null berarti bukan developer.');
        });

        DB::table('users')
            ->where('is_developer', true)
            ->update(['developer_role' => 'super_admin']);
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('developer_role');
        });
    }
};
