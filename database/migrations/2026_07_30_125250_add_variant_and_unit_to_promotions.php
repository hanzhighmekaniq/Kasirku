<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Promo sebelumnya hanya bisa diikat ke produk induk, sehingga produk yang
 * punya varian atau multi-satuan tidak bisa dipromokan secara spesifik
 * (mis. hanya "Kopi Size L" atau hanya "Beras per Karung").
 *
 * Kolom nullable dipakai supaya data promo lama tetap valid: null berarti
 * promo berlaku untuk seluruh varian/satuan produk tersebut.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('promotion_products', function (Blueprint $table) {
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

        Schema::table('promotions', function (Blueprint $table) {
            $table->foreignId('free_variant_id')
                ->nullable()
                ->after('free_product_id')
                ->constrained('product_variants')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('promotion_products', function (Blueprint $table) {
            $table->dropConstrainedForeignId('variant_id');
            $table->dropConstrainedForeignId('packaging_unit_id');
        });

        Schema::table('promotions', function (Blueprint $table) {
            $table->dropConstrainedForeignId('free_variant_id');
        });
    }
};
