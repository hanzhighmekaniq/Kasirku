<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('store_payment_gateways', function (Blueprint $table) {
            $table->id();
            $table->foreignId('store_id')->constrained()->cascadeOnDelete();
            $table->string('provider', 30); // midtrans / xendit / duitku
            $table->boolean('is_active')->default(false);
            $table->string('environment', 20)->default('sandbox'); // sandbox / production
            $table->text('server_key')->nullable();   // encrypted
            $table->text('client_key')->nullable();   // encrypted
            $table->string('merchant_id', 100)->nullable();
            $table->json('enabled_methods')->nullable(); // ["qris","gopay","bca_va",...]
            $table->json('config_json')->nullable();
            $table->timestamps();

            $table->unique(['store_id', 'provider']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('store_payment_gateways');
    }
};
