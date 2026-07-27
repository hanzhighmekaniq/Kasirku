<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tambah kolom track_batch ke tabel products.
 *
 * Batch pelacakan kadaluarsa sengaja opsional per produk — rokok dan deterjen
 * tidak butuh batch, tapi susu dan roti perlu. Toggle ini mencegah input
 * pembelian jadi lebih ribet untuk produk yang tidak butuh pelacakan.
 *
 * Default false: perilaku semua produk existing tidak berubah.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->boolean('track_batch')
                ->default(false)
                ->after('track_stock')
                ->comment('Aktifkan pelacakan batch & kadaluarsa untuk produk ini');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('track_batch');
        });
    }
};
