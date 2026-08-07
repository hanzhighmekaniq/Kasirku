<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('platform_payment_gateways', function (Blueprint $table) {
            $table->string('payout_mode', 20)->default('manual')->after('plan_order_mode');
        });
    }

    public function down(): void
    {
        Schema::table('platform_payment_gateways', function (Blueprint $table) {
            $table->dropColumn('payout_mode');
        });
    }
};
