<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $hasColumn = Schema::hasColumn('product_price_tiers', 'variant_id');
        $hasFK = false;

        if (! $hasColumn) {
            Schema::table('product_price_tiers', function (Blueprint $table) {
                $table->foreignId('variant_id')
                    ->nullable()
                    ->after('product_id')
                    ->constrained('product_variants')
                    ->cascadeOnDelete();
            });
            $hasFK = true;
        }

        $indexes = collect(DB::select('SHOW INDEX FROM product_price_tiers'))
            ->pluck('Key_name')->unique()->toArray();

        if (in_array('product_price_tiers_product_id_min_qty_unique', $indexes)) {
            // MySQL error 1553: drop product FK, drop unique, re-add FK
            DB::statement('ALTER TABLE product_price_tiers DROP FOREIGN KEY product_price_tiers_product_id_foreign');
            DB::statement('ALTER TABLE product_price_tiers DROP INDEX product_price_tiers_product_id_min_qty_unique');
            DB::statement('ALTER TABLE product_price_tiers ADD CONSTRAINT product_price_tiers_product_id_foreign FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE');

            if (! $hasFK) {
                $fks = collect(DB::select("SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product_price_tiers' AND CONSTRAINT_TYPE = 'FOREIGN KEY'"))->pluck('CONSTRAINT_NAME')->toArray();
                if (! in_array('product_price_tiers_variant_id_foreign', $fks)) {
                    DB::statement('ALTER TABLE product_price_tiers ADD CONSTRAINT product_price_tiers_variant_id_foreign FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE');
                }
            }
        }

        if (! in_array('product_price_tiers_product_id_variant_id_min_qty_unique', $indexes)) {
            Schema::table('product_price_tiers', function (Blueprint $table) {
                $table->unique(['product_id', 'variant_id', 'min_qty']);
            });
        }
    }

    public function down(): void
    {
        Schema::table('product_price_tiers', function (Blueprint $table) {
            $table->dropUnique(['product_id', 'variant_id', 'min_qty']);
            $table->dropForeign(['variant_id']);
            $table->dropColumn('variant_id');
            $table->unique(['product_id', 'min_qty']);
        });
    }
};
