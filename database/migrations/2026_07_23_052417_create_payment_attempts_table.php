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
        Schema::create('payment_attempts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pg_transaction_id')->constrained('payment_gateway_transactions')->cascadeOnDelete();
            $table->unsignedInteger('attempt_no');
            $table->string('idempotency_key', 64);
            $table->unsignedSmallInteger('http_status')->nullable();
            $table->string('result', 20); // success / client_error / server_error / timeout
            $table->string('gateway_error_code', 100)->nullable();
            $table->text('error_message')->nullable();
            $table->json('request_snapshot')->nullable(); // order_id, amount, payment_type — TANPA credentials
            $table->json('response_snapshot')->nullable();
            $table->timestamps();

            $table->index(['pg_transaction_id', 'attempt_no']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payment_attempts');
    }
};
