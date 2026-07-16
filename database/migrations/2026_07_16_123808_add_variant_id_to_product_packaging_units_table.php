<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $hasColumn = Schema::hasColumn('product_packaging_units', 'variant_id');
        $hasFK = false;

        if (! $hasColumn) {
            Schema::table('product_packaging_units', function (Blueprint $table) {
                $table->foreignId('variant_id')
                    ->nullable()
                    ->after('product_id')
                    ->constrained('product_variants')
                    ->cascadeOnDelete();
            });
            $hasFK = true;
        }

        // Check if old unique still exists (fresh DB or partial state)
        $indexes = collect(DB::select('SHOW INDEX FROM product_packaging_units'))
            ->pluck('Key_name')->unique()->toArray();

        if (in_array('product_packaging_units_product_id_name_unique', $indexes)) {
            // MySQL error 1553: must drop product_id FK, then drop unique, then re-add FK
            DB::statement('ALTER TABLE product_packaging_units DROP FOREIGN KEY product_packaging_units_product_id_foreign');
            DB::statement('ALTER TABLE product_packaging_units DROP INDEX product_packaging_units_product_id_name_unique');
            DB::statement('ALTER TABLE product_packaging_units ADD CONSTRAINT product_packaging_units_product_id_foreign FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE');

            if (! $hasFK) {
                // FK for variant_id was from partial migration; add it if missing
                $fks = collect(DB::select("SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product_packaging_units' AND CONSTRAINT_TYPE = 'FOREIGN KEY'"))->pluck('CONSTRAINT_NAME')->toArray();
                if (! in_array('product_packaging_units_variant_id_foreign', $fks)) {
                    DB::statement('ALTER TABLE product_packaging_units ADD CONSTRAINT product_packaging_units_variant_id_foreign FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE');
                }
            }
        }

        if (! in_array('product_packaging_units_product_id_variant_id_name_unique', $indexes)) {
            Schema::table('product_packaging_units', function (Blueprint $table) {
                $table->unique(['product_id', 'variant_id', 'name']);
            });
        }
    }

    public function down(): void
    {
        Schema::table('product_packaging_units', function (Blueprint $table) {
            $table->dropUnique(['product_id', 'variant_id', 'name']);
            $table->dropForeign(['variant_id']);
            $table->dropColumn('variant_id');
            $table->unique(['product_id', 'name']);
        });
    }
};
