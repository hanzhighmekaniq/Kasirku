<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('purchase_return_items', function (Blueprint $table) {
            $table->foreignId('variant_id')
                ->nullable()
                ->after('product_id')
                ->constrained('product_variants')
                ->cascadeOnDelete();
            $table->foreignId('packaging_unit_id')
                ->nullable()
                ->after('variant_id')
                ->constrained('product_packaging_units')
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('purchase_return_items', function (Blueprint $table) {
            $table->dropForeign(['variant_id']);
            $table->dropForeign(['packaging_unit_id']);
            $table->dropColumn(['variant_id', 'packaging_unit_id']);
        });
    }
};
