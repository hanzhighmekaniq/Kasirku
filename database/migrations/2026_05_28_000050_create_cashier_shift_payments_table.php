<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cashier_shift_payments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('cashier_shift_id')->index();
            $table->foreignId('payment_method_id')->nullable()->constrained()->nullOnDelete();
            $table->decimal('system_amount', 15, 2)->default(0);
            $table->decimal('actual_amount', 15, 2)->nullable();
            $table->decimal('difference_amount', 15, 2)->default(0);
            $table->timestamps();

            $table->unique(['cashier_shift_id', 'payment_method_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cashier_shift_payments');
    }
};
