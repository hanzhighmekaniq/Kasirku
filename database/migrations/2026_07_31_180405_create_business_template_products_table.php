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
        Schema::create('business_template_products', function (Blueprint $table) {
            $table->id();
            $table
                ->foreignId('business_template_category_id')
                ->constrained()
                ->cascadeOnDelete();
            $table->string('sku', 50);
            $table->string('name');
            $table->string('unit', 20)->default('pcs');
            $table->decimal('cost_price', 15, 2)->default(0);
            $table->decimal('sell_price', 15, 2)->default(0);
            $table->boolean('track_stock')->default(false);
            $table->integer('stock_minimum')->nullable();
            $table
                ->integer('preparation_time')
                ->nullable()
                ->comment('menit, khusus produk F&B/komposisi');
            $table->boolean('is_composable')->default(false);
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->index(['business_template_category_id', 'sort_order'], 'btp_category_sort_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('business_template_products');
    }
};
