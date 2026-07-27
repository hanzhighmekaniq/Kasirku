<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Waste harus bisa menunjuk bucket stok yang tepat.
 *
 * Stok disimpan per produk + variant + satuan + toko + cabang
 * (unique index `product_stocks_bucket_unique`). Sebelum ini `waste_items`
 * hanya menyimpan `product_id`, sehingga pembuangan "Indomie Soto Dus" akan
 * mengurangi bucket dasar produk Indomie — bucket yang untuk produk bervariant
 * justru tidak pernah dipakai berjualan.
 *
 * Kolomnya nullable: produk tanpa variant/satuan tetap memakai NULL, sama
 * seperti bucket dasarnya. Jadi baris lama tidak perlu di-backfill.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('waste_items', function (Blueprint $table) {
            $table->foreignId('variant_id')
                ->nullable()
                ->after('product_id')
                ->constrained('product_variants')
                ->nullOnDelete();

            $table->foreignId('packaging_unit_id')
                ->nullable()
                ->after('variant_id')
                ->constrained('product_packaging_units')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('waste_items', function (Blueprint $table) {
            $table->dropConstrainedForeignId('variant_id');
            $table->dropConstrainedForeignId('packaging_unit_id');
        });
    }
};
