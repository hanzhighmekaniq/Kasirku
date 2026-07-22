<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sale_payments', function (Blueprint $table) {
            $table->string('payer_name', 100)->nullable()->after('note');
            $table->foreignId('payer_customer_id')->nullable()->constrained('customers')->nullOnDelete()->after('payer_name');
            $table->decimal('paid_amount', 15, 2)->nullable()->after('payer_customer_id');
            $table->decimal('change_amount', 15, 2)->nullable()->after('paid_amount');
            $table->boolean('is_split')->default(false)->after('change_amount');
        });
    }

    public function down(): void
    {
        Schema::table('sale_payments', function (Blueprint $table) {
            $table->dropForeign(['payer_customer_id']);
            $table->dropColumn(['payer_name', 'payer_customer_id', 'paid_amount', 'change_amount', 'is_split']);
        });
    }
};
