<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payment_gateway_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sale_id')->constrained('sales')->cascadeOnDelete();
            $table->string('provider', 50); // midtrans / xendit / duitku
            $table->string('external_id', 255);
            $table->string('payment_type', 50)->nullable();
            $table->string('status', 30)->default('pending'); // pending / paid / failed / expired / cancelled
            $table->decimal('amount', 15, 2)->default(0);
            $table->json('raw_response')->nullable();
            $table->timestamps();

            $table->index('sale_id');
            $table->index('external_id');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_gateway_transactions');
    }
};
