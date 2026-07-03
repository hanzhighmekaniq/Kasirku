<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('store_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('category_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('supplier_id')->nullable()->constrained()->nullOnDelete();
            $table->string('sku', 100)->unique();
            $table->string('barcode', 100)->nullable()->unique();
            $table->string('name');
            // type: finished_goods / raw_material / combo / service / rental_item / time_based
            $table->string('type', 30)->default('finished_goods');
            $table->string('image')->nullable();
            $table->boolean('is_composable')->default(false);
            $table->unsignedInteger('preparation_time')->nullable()->comment('Menit, untuk FnB');
            $table->boolean('is_sellable')->default(true);
            $table->string('unit', 30)->default('pcs');
            $table->string('base_unit', 30)->default('pcs')->comment('Satuan dasar stok bahan baku: gram, ml, pcs, dll');
            $table->decimal('cost_price', 15, 2)->default(0);
            $table->decimal('sell_price', 15, 2)->default(0);
            // Untuk type: time_based (parkir, warnet) → harga per jam
            $table->decimal('price_per_hour', 15, 2)->nullable()->comment('Untuk produk berbasis waktu');
            $table->unsignedInteger('min_duration_minutes')->nullable()->comment('Minimum durasi sewa/sesi dalam menit');
            $table->integer('stock_minimum')->default(0);
            $table->boolean('track_stock')->default(true);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
