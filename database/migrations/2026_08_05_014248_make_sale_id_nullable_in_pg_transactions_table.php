<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payment_gateway_transactions', function (Blueprint $table) {
            $table->dropForeign(['sale_id']);
            $table->dropIndex(['sale_id']);
            $table->dropColumn('sale_id');
        });

        Schema::table('payment_gateway_transactions', function (Blueprint $table) {
            $table->foreignId('sale_id')->nullable()
                ->after('id')
                ->constrained('sales')
                ->nullOnDelete();
            $table->index('sale_id');
        });
    }

    public function down(): void
    {
        Schema::table('payment_gateway_transactions', function (Blueprint $table) {
            $table->dropForeign(['sale_id']);
            $table->dropIndex(['sale_id']);
            $table->dropColumn('sale_id');
        });

        Schema::table('payment_gateway_transactions', function (Blueprint $table) {
            $table->foreignId('sale_id')
                ->after('id')
                ->constrained('sales')
                ->cascadeOnDelete();
            $table->index('sale_id');
        });
    }
};
