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
        Schema::table('products', function (Blueprint $table) {
            $table
                ->decimal('base_unit_conversion', 10, 4)
                ->nullable()
                ->after('base_unit')
                ->comment('1 unit (satuan beli) = berapa base_unit (satuan pakai). Contoh: unit=kg, base_unit=gram, conversion=1000');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('base_unit_conversion');
        });
    }
};
