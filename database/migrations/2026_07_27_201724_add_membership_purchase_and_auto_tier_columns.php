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
        Schema::table('products', function (Blueprint $table) {
            $table->foreignId('membership_id')->nullable()->after('supplier_id')
                ->constrained('memberships')->cascadeOnDelete();
        });

        Schema::table('memberships', function (Blueprint $table) {
            $table->boolean('is_sellable_at_pos')->default(false)->after('maps_to_tier');
            $table->decimal('auto_tier_min_spend', 15, 2)->nullable()->after('is_sellable_at_pos');
            $table->string('auto_tier_window_type', 10)->nullable()->after('auto_tier_min_spend'); // day|month|year
            $table->unsignedInteger('auto_tier_window_value')->nullable()->after('auto_tier_window_type');
        });

        Schema::table('customer_memberships', function (Blueprint $table) {
            $table->string('source', 20)->default('manual')->after('status'); // manual|purchase|auto_tier
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('customer_memberships', fn (Blueprint $t) => $t->dropColumn('source'));
        Schema::table('memberships', fn (Blueprint $t) => $t->dropColumn([
            'is_sellable_at_pos', 'auto_tier_min_spend', 'auto_tier_window_type', 'auto_tier_window_value',
        ]));
        Schema::table('products', function (Blueprint $t) {
            $t->dropConstrainedForeignId('membership_id');
        });
    }
};
