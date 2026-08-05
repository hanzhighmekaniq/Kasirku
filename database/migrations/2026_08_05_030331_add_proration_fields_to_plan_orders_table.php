<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('plan_orders', function (Blueprint $table) {
            $table->decimal('original_amount', 15, 2)->nullable()->after('amount')
                ->comment('Harga penuh plan baru sebelum prorasi');
            $table->string('proration_type', 30)->nullable()->after('original_amount')
                ->comment('full|prorated_same_period|prorated_cross_period');
        });
    }

    public function down(): void
    {
        Schema::table('plan_orders', function (Blueprint $table) {
            $table->dropColumn(['original_amount', 'proration_type']);
        });
    }
};
