<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabel Antrian — untuk barbershop, salon, klinik, dll.
 * Bisa juga dipakai sebagai nomor panggil FnB (queue_number di sale_fnb_details).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('queue_tickets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('store_id')->constrained()->cascadeOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('customer_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('employee_id')->nullable()->constrained('employees')->nullOnDelete()
                  ->comment('Staff yang akan melayani');
            $table->foreignId('sale_id')->nullable()->constrained('sales')->nullOnDelete()
                  ->comment('Terisi saat antrian diproses jadi transaksi');
            $table->string('queue_no', 20);
            $table->string('category', 50)->nullable()->comment('Kategori layanan: potong rambut, creambath, dll');
            $table->string('customer_name', 200)->nullable();
            $table->string('customer_phone', 30)->nullable();
            // status: waiting / called / in_service / done / skipped / cancelled
            $table->string('status', 20)->default('waiting');
            $table->dateTime('called_at')->nullable();
            $table->dateTime('started_at')->nullable();
            $table->dateTime('finished_at')->nullable();
            $table->date('queue_date');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['branch_id', 'queue_no', 'queue_date']);
            $table->index(['store_id', 'queue_date', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('queue_tickets');
    }
};
