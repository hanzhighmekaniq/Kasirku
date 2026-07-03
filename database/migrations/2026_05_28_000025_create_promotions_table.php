<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('promotions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('store_id')->nullable()->constrained()->nullOnDelete();
            $table->string('code', 100)->unique();
            $table->string('name');
            // type: percent / flat / buy_x_get_y / tier_price / free_item / point_multiplier
            $table->string('type', 50);
            $table->enum('scope', ['item', 'cart'])->default('item');
            $table->decimal('discount_value', 15, 2)->default(0);
            $table->decimal('min_purchase_amount', 15, 2)->default(0);
            $table->decimal('max_discount_amount', 15, 2)->nullable();
            $table->unsignedInteger('min_quantity')->nullable();
            $table->decimal('tier_price', 15, 2)->nullable();
            $table->string('customer_tier', 50)->nullable();
            $table->string('start_hour', 5)->nullable(); // HH:MM
            $table->string('end_hour', 5)->nullable();   // HH:MM
            $table->json('applicable_days')->nullable(); // ["mon","tue","wed"]
            $table->foreignId('free_product_id')->nullable()->constrained('products')->nullOnDelete();
            $table->unsignedInteger('free_quantity')->nullable();
            $table->unsignedInteger('max_usage')->nullable();
            $table->unsignedInteger('used_count')->default(0);
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('promotions');
    }
};
