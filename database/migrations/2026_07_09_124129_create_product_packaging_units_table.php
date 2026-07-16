<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_packaging_units', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->string('name', 50);
            $table->unsignedInteger('conversion_qty');
            $table->unsignedBigInteger('sell_price')->default(0);
            $table->string('barcode', 100)->nullable();
            $table->timestamps();

            $table->unique(['product_id', 'name']);
            $table->index('barcode');
        });

        // Add FK constraint to sale_items.packaging_unit_id now that the table exists
        Schema::table('sale_items', function (Blueprint $table) {
            $table->foreign('packaging_unit_id')->references('id')->on('product_packaging_units')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('sale_items', function (Blueprint $table) {
            $table->dropForeign(['packaging_unit_id']);
        });
        Schema::dropIfExists('product_packaging_units');
    }
};
