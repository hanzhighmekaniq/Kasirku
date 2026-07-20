<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('theme_presets', function (Blueprint $table) {
            // Identifier stabil untuk preset sistem (dipakai sebagai templateId
            // di preference user), independen dari id auto-increment supaya
            // tidak berubah kalau seeder di-re-run/re-order.
            $table->string('slug', 80)->nullable()->unique()->after('name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('theme_presets', function (Blueprint $table) {
            $table->dropColumn('slug');
        });
    }
};
