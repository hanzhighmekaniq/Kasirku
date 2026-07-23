<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payment_gateway_transactions', function (Blueprint $table) {
            $table->foreignId('sale_split_payer_id')->nullable()->after('sale_id')->constrained('sale_split_payers')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('payment_gateway_transactions', function (Blueprint $table) {
            $table->dropForeign(['sale_split_payer_id']);
            $table->dropColumn('sale_split_payer_id');
        });
    }
};
