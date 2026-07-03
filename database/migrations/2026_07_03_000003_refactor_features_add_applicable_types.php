<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Add applicable_types column to features
        Schema::table('features', function (Blueprint $table) {
            $table->json('applicable_types')->nullable()->after('category')
                ->comment('Tipe toko yang bisa pakai fitur ini');
        });

        // 2. Migrate data from store_type_features to features.applicable_types
        if (Schema::hasTable('store_type_features')) {
            $mapping = DB::table('store_type_features')->get()
                ->groupBy('feature_code')
                ->map(fn($rows) => $rows->pluck('store_type')->unique()->values()->toArray());

            foreach ($mapping as $featureCode => $types) {
                DB::table('features')->where('code', $featureCode)->update([
                    'applicable_types' => json_encode($types),
                ]);
            }
        }

        // 3. Drop store_type_features table
        Schema::dropIfExists('store_type_features');
    }

    public function down(): void
    {
        // Recreate store_type_features
        if (!Schema::hasTable('store_type_features')) {
            Schema::create('store_type_features', function (Blueprint $table) {
                $table->string('store_type', 30);
                $table->string('feature_code', 50);
                $table->primary(['store_type', 'feature_code']);
            });

            // Restore data from features.applicable_types
            $features = DB::table('features')->whereNotNull('applicable_types')->get();
            foreach ($features as $f) {
                $types = json_decode($f->applicable_types, true) ?? [];
                foreach ($types as $type) {
                    DB::table('store_type_features')->insert([
                        'store_type' => $type,
                        'feature_code' => $f->code,
                    ]);
                }
            }
        }

        Schema::table('features', function (Blueprint $table) {
            $table->dropColumn('applicable_types');
        });
    }
};
