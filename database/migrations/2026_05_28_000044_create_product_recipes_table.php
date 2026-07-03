<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_recipes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')
                  ->constrained('products')
                  ->cascadeOnDelete()
                  ->comment('Produk jadi (finished_goods / combo)');
            $table->foreignId('raw_material_id')
                  ->constrained('products')
                  ->cascadeOnDelete()
                  ->comment('Bahan baku (type: raw_material)');
            $table->decimal('quantity', 12, 4)->default(0)->comment('Jumlah bahan per 1 produk jadi');
            $table->string('unit', 30)->default('gram')->comment('Satuan: gram, ml, pcs, dll');
            $table->boolean('is_nullable')->default(false)->comment('true = bahan opsional, boleh tidak ada stok');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['product_id', 'raw_material_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_recipes');
    }
};
