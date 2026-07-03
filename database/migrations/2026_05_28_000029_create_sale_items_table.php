<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sale_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sale_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('variant_id')->nullable();
            $table->foreignId('product_batch_id')->nullable()->constrained('product_batches')->nullOnDelete();
            $table->foreignId('promotion_id')->nullable()->constrained('promotions')->nullOnDelete();
            // employee yang melayani item ini (untuk komisi barber/salon/jasa)
            $table->foreignId('employee_id')->nullable()->constrained('employees')->nullOnDelete();
            $table->decimal('quantity', 15, 4);
            $table->decimal('price', 15, 2)->default(0);
            $table->decimal('discount_amount', 15, 2)->default(0);
            $table->decimal('promo_discount', 15, 2)->default(0)->comment('Diskon otomatis dari promo aktif');
            $table->decimal('subtotal', 15, 2)->default(0);
            // status per item: pending / cooking / ready / served (untuk FnB/kitchen)
            $table->string('item_status', 20)->default('pending');
            $table->json('modifiers')->nullable()->comment('[{id, name, price_addition}]');
            $table->json('recipe_snapshot')->nullable()->comment('Snapshot resep saat transaksi');
            $table->decimal('ingredient_cost', 15, 2)->default(0)->comment('Total HPP bahan baku dari resep');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['sale_id', 'item_status']);
            $table->index('employee_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sale_items');
    }
};
