<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sale_items', function (Blueprint $table) {
            $table->foreignId('packaging_unit_id')->nullable()
                ->after('variant_id')
                ->constrained('product_packaging_units')
                ->nullOnDelete();
            $table->string('unit_name')->nullable()->after('packaging_unit_id');
            $table->integer('unit_conversion_qty')->default(1)->after('unit_name');
        });
    }

    public function down(): void
    {
        Schema::table('sale_items', function (Blueprint $table) {
            $table->dropForeign(['packaging_unit_id']);
            $table->dropColumn(['packaging_unit_id', 'unit_name', 'unit_conversion_qty']);
        });
    }
};
