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
        Schema::table('payment_gateway_transactions', function (Blueprint $table) {
            $table->string('idempotency_key', 64)->nullable()->after('external_id');
            $table->unsignedInteger('attempt_no')->default(1)->after('idempotency_key');
            $table->unsignedSmallInteger('gateway_http_status')->nullable()->after('status');
            $table->timestamp('status_checked_at')->nullable()->after('raw_response');
            $table->text('error_message')->nullable()->after('status_checked_at');
            $table->string('gateway_error_code', 100)->nullable()->after('error_message');

            $table->index('idempotency_key');
            $table->index(['status', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payment_gateway_transactions', function (Blueprint $table) {
            $table->dropIndex(['status', 'created_at']);
            $table->dropIndex(['idempotency_key']);

            $table->dropColumn([
                'idempotency_key',
                'attempt_no',
                'gateway_http_status',
                'status_checked_at',
                'error_message',
                'gateway_error_code',
            ]);
        });
    }
};
