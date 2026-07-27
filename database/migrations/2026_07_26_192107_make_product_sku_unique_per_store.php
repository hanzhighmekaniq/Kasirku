<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * SKU produk unik per toko, bukan lintas seluruh sistem.
 *
 * SKU adalah kode internal milik masing-masing toko. Index unik global
 * membuat toko kedua gagal memakai kode yang sudah dipakai toko lain —
 * paling kentara pada Product::generateSku() yang selalu mulai dari
 * BRG-00001 untuk tiap toko, sehingga toko kedua langsung bentrok saat
 * tombol "Auto" dipakai.
 *
 * Barcode sengaja DIBIARKAN unik global: itu identitas produk pabrik yang
 * memang universal, dan pemindaian barcode harus selalu menunjuk ke satu
 * produk tanpa ambiguitas.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropUnique('products_sku_unique');
            $table->unique(['store_id', 'sku']);
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropUnique('products_store_id_sku_unique');
            $table->unique('sku');
        });
    }
};
