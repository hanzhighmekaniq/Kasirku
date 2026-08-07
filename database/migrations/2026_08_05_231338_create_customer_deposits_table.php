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
        Schema::create('customer_deposits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('store_id')->constrained()->cascadeOnDelete();
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('deposit_no', 100)->unique();
            $table->string('type', 20)->default('deposit')
                ->comment('deposit / installment / usage');
            $table->decimal('amount', 15, 2)->default(0);
            $table->decimal('remaining_balance', 15, 2)->default(0);
            $table->decimal('total_used', 15, 2)->default(0);
            $table->string('payment_method', 50)->nullable()
                ->comment('cash / qris / transfer / edc');
            $table->string('reference_no', 100)->nullable();
            $table->text('notes')->nullable();
            $table->timestamp('deposit_at');
            $table->timestamps();
            $table->softDeletes();

            $table->index(['store_id', 'customer_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_deposits');
    }
};
