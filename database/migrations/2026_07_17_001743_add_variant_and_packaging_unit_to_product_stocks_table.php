<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('product_stocks', 'variant_id')) {
            Schema::table('product_stocks', function (Blueprint $table) {
                $table->foreignId('variant_id')
                    ->nullable()
                    ->after('product_id')
                    ->constrained('product_variants')
                    ->cascadeOnDelete();
            });
        }

        if (! Schema::hasColumn('product_stocks', 'packaging_unit_id')) {
            Schema::table('product_stocks', function (Blueprint $table) {
                $table->foreignId('packaging_unit_id')
                    ->nullable()
                    ->after('variant_id')
                    ->constrained('product_packaging_units')
                    ->cascadeOnDelete();
            });
        }

        if (! Schema::hasColumn('product_stocks', 'average_cost')) {
            Schema::table('product_stocks', function (Blueprint $table) {
                $table->decimal('average_cost', 15, 2)->default(0)->after('reserved_quantity');
            });
        }

        $indexes = collect(DB::select('SHOW INDEX FROM product_stocks'))
            ->pluck('Key_name')->unique()->toArray();

        if (in_array('product_stocks_product_id_store_id_branch_id_unique', $indexes)) {
            // MySQL error 1553: drop product FK first, then the old unique index,
            // then re-add the FK so the composite unique below can be created cleanly.
            DB::statement('ALTER TABLE product_stocks DROP FOREIGN KEY product_stocks_product_id_foreign');
            DB::statement('ALTER TABLE product_stocks DROP INDEX product_stocks_product_id_store_id_branch_id_unique');
            DB::statement('ALTER TABLE product_stocks ADD CONSTRAINT product_stocks_product_id_foreign FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE');
        }

        if (! in_array('product_stocks_bucket_unique', $indexes)) {
            Schema::table('product_stocks', function (Blueprint $table) {
                $table->unique(
                    ['product_id', 'variant_id', 'packaging_unit_id', 'store_id', 'branch_id'],
                    'product_stocks_bucket_unique',
                );
            });
        }
    }

    public function down(): void
    {
        Schema::table('product_stocks', function (Blueprint $table) {
            $table->dropUnique('product_stocks_bucket_unique');
            $table->unique(['product_id', 'store_id', 'branch_id']);
        });

        Schema::table('product_stocks', function (Blueprint $table) {
            $table->dropForeign(['variant_id']);
            $table->dropForeign(['packaging_unit_id']);
            $table->dropColumn(['variant_id', 'packaging_unit_id', 'average_cost']);
        });
    }
};
