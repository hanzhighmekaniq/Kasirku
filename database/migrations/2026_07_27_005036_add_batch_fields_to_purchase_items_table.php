<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tambah batch_no dan expiry_date ke purchase_items.
 *
 * Staf gudang mengisi kedua field ini saat mencatat pembelian — batch_no
 * diambil dari label fisik barang, expiry_date dari tanggal cetak di kemasan.
 * Kalau dikosongkan, batch_no di-generate otomatis dan expiry_date dibiarkan
 * null (produk tanpa kadaluarsa).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('purchase_items', function (Blueprint $table) {
            $table->string('batch_no', 100)
                ->nullable()
                ->after('unit_name')
                ->comment('Nomor batch dari label kemasan — dipakai untuk membuat ProductBatch otomatis');

            $table->date('expiry_date')
                ->nullable()
                ->after('batch_no')
                ->comment('Tanggal kadaluarsa produk dalam batch ini');
        });
    }

    public function down(): void
    {
        Schema::table('purchase_items', function (Blueprint $table) {
            $table->dropColumn(['batch_no', 'expiry_date']);
        });
    }
};
