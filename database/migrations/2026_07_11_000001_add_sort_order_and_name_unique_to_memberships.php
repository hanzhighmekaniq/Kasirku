<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('memberships', function (Blueprint $table) {
            // Urutan tampil (0 = paling atas)
            $table->unsignedInteger('sort_order')->default(0)->after('point_multiplier');

            // Nama membership harus unik per toko
            $table->unique(['store_id', 'name']);
        });
    }

    public function down(): void
    {
        Schema::table('memberships', function (Blueprint $table) {
            $table->dropUnique(['store_id', 'name']);
            $table->dropColumn('sort_order');
        });
    }
};
