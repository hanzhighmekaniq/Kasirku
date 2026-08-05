<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payment_gateway_transactions', function (Blueprint $table) {
            $table->foreignId('plan_order_id')->nullable()
                ->after('sale_id')
                ->constrained('plan_orders')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('payment_gateway_transactions', function (Blueprint $table) {
            $table->dropForeign(['plan_order_id']);
            $table->dropColumn('plan_order_id');
        });
    }
};
