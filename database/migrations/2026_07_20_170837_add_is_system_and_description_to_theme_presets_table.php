<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('theme_presets', function (Blueprint $table) {
            $table->boolean('is_system')->default(false)->after('is_dark');
            $table->string('description', 255)->nullable()->after('name');
        });

        // Preset sistem tidak dimiliki user tertentu (global), jadi user_id
        // harus nullable. Drop FK lama (cascadeOnDelete) lalu buat ulang
        // nullable dengan nullOnDelete supaya preset sistem tidak ikut
        // terhapus saat user dihapus. Pakai raw SQL karena doctrine/dbal
        // (dibutuhkan Blueprint::change()) belum terinstall di project ini.
        Schema::table('theme_presets', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
        });

        DB::statement('ALTER TABLE theme_presets MODIFY user_id BIGINT UNSIGNED NULL');

        Schema::table('theme_presets', function (Blueprint $table) {
            $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('theme_presets', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
        });

        DB::statement('DELETE FROM theme_presets WHERE user_id IS NULL');
        DB::statement('ALTER TABLE theme_presets MODIFY user_id BIGINT UNSIGNED NOT NULL');

        Schema::table('theme_presets', function (Blueprint $table) {
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });

        Schema::table('theme_presets', function (Blueprint $table) {
            $table->dropColumn(['is_system', 'description']);
        });
    }
};
