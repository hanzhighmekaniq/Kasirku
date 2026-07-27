<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('memberships', function (Blueprint $table) {
            $table->string('maps_to_tier', 20)->nullable()->after('point_multiplier');
        });

        Schema::table('stores', function (Blueprint $table) {
            $table->decimal('points_per_amount', 15, 2)->nullable()->after('default_tax_rate');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('memberships', function (Blueprint $table) {
            $table->dropColumn('maps_to_tier');
        });

        Schema::table('stores', function (Blueprint $table) {
            $table->dropColumn('points_per_amount');
        });
    }
};
