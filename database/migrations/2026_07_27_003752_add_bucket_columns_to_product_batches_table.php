<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Lengkapi bucket di product_batches: tambah variant_id + packaging_unit_id.
 *
 * MySQL melarang drop unique key (product_id, batch_no) karena kolom
 * product_id-nya juga mendukung FK product_batches_product_id_foreign.
 * Solusi: buat index reguler untuk product_id dulu, baru drop unique key lama.
 */
return new class extends Migration
{
    public function up(): void
    {
        // Buat index reguler untuk product_id supaya FK tetap punya
        // backing index setelah unique key (product_id, batch_no) di-drop.
        DB::statement('ALTER TABLE product_batches ADD INDEX product_batches_product_id_index (product_id)');

        Schema::table('product_batches', function (Blueprint $table) {
            $table->dropUnique('product_batches_product_id_batch_no_unique');

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

            $table->unique(
                ['product_id', 'variant_id', 'packaging_unit_id', 'batch_no'],
                'product_batches_bucket_batch_no_unique',
            );
        });
    }

    public function down(): void
    {
        Schema::table('product_batches', function (Blueprint $table) {
            $table->dropUnique('product_batches_bucket_batch_no_unique');
            $table->dropForeign(['packaging_unit_id']);
            $table->dropForeign(['variant_id']);
            $table->dropColumn(['packaging_unit_id', 'variant_id']);
            $table->unique(['product_id', 'batch_no']);
        });

        DB::statement('ALTER TABLE product_batches DROP INDEX product_batches_product_id_index');
    }
};
