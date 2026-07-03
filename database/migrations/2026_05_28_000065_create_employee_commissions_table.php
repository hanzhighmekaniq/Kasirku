<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Komisi karyawan per transaksi/item yang mereka tangani.
 * Berlaku untuk mode: barbershop, salon, spa, klinik, atau retail.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employee_commissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained()->cascadeOnDelete();
            $table->foreignId('store_id')->constrained()->cascadeOnDelete();
            $table->foreignId('sale_id')->nullable()->constrained('sales')->nullOnDelete();
            $table->foreignId('sale_item_id')->nullable()->constrained('sale_items')->nullOnDelete();
            // type: percent / flat
            $table->string('type', 20)->default('percent');
            $table->decimal('commission_rate', 10, 2)->default(0)->comment('Persen atau nominal flat');
            $table->decimal('base_amount', 15, 2)->default(0)->comment('Nilai dasar perhitungan komisi');
            $table->decimal('commission_amount', 15, 2)->default(0)->comment('Nominal komisi yang didapat');
            // status: pending / approved / paid / cancelled
            $table->string('status', 20)->default('pending');
            $table->date('commission_date');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['employee_id', 'status']);
            $table->index(['store_id', 'commission_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employee_commissions');
    }
};
