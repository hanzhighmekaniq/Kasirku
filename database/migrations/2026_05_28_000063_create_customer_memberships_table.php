<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Membership aktif milik customer
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customer_memberships', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
            $table->foreignId('membership_id')->constrained()->cascadeOnDelete();
            $table->foreignId('sale_id')->nullable()->constrained('sales')->nullOnDelete()
                  ->comment('Transaksi pembelian membership ini');
            $table->date('start_date');
            $table->date('expired_date')->nullable();
            $table->unsignedInteger('remaining_visits')->nullable()->comment('Untuk membership berbasis kunjungan');
            // status: active / expired / cancelled / suspended
            $table->string('status', 20)->default('active');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['customer_id', 'status']);
            $table->index('expired_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_memberships');
    }
};
