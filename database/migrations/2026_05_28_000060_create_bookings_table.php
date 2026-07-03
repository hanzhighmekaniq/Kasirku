<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabel Booking/Reservasi — dipakai oleh semua mode yang butuh jadwal:
 * cafe (meja), barber/salon (slot stylist), hotel/penginapan (kamar), dll.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('store_id')->constrained()->cascadeOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('customer_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('employee_id')->nullable()->constrained('employees')->nullOnDelete()
                  ->comment('Staff/stylist/terapis yang handle booking');
            // sale_id akan terisi saat booking diconvert jadi transaksi
            $table->foreignId('sale_id')->nullable()->constrained('sales')->nullOnDelete();
            $table->string('booking_no', 100)->unique();
            // resource_type: table / room / unit / slot (fleksibel)
            $table->string('resource_type', 30)->nullable();
            $table->unsignedBigInteger('resource_id')->nullable()->comment('ID meja/kamar/unit yang direservasi');
            $table->string('customer_name', 200)->nullable();
            $table->string('customer_phone', 30)->nullable();
            $table->dateTime('booking_start_at');
            $table->dateTime('booking_end_at')->nullable();
            $table->unsignedInteger('guest_count')->nullable();
            $table->decimal('deposit_amount', 15, 2)->default(0);
            $table->decimal('deposit_paid', 15, 2)->default(0);
            // status: pending / confirmed / checked_in / completed / cancelled / no_show
            $table->string('status', 30)->default('pending');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['store_id', 'booking_start_at']);
            $table->index(['store_id', 'status']);
            $table->index(['resource_type', 'resource_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};
