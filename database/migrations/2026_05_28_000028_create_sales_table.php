<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sales', function (Blueprint $table) {
            $table->id();
            $table->foreignId('store_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('customer_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->unsignedBigInteger('cashier_shift_id')->nullable()->index();

            $table->string('sale_no', 100)->unique();
            $table->dateTime('sale_date');

            // --- Mode & Tipe Order ---
            // pos_mode: retail | fnb | service | laundry | rental | parking | session
            $table->string('pos_mode', 30)->default('retail');
            // order_type: takeaway | dine_in | delivery | drive_thru (untuk FnB)
            $table->string('order_type', 20)->nullable();

            // --- Nominal ---
            $table->decimal('subtotal', 15, 2)->default(0);
            $table->decimal('discount_amount', 15, 2)->default(0);
            $table->decimal('tax_amount', 15, 2)->default(0);
            $table->decimal('shipping_amount', 15, 2)->default(0);
            $table->decimal('grand_total', 15, 2)->default(0);
            $table->decimal('paid_amount', 15, 2)->default(0);
            $table->decimal('change_amount', 15, 2)->default(0);

            // --- Status ---
            // status: draft | pending | processing | completed | cancelled
            $table->string('status', 20)->default('draft');
            // payment_status: unpaid | partial | paid | refunded
            $table->string('payment_status', 20)->default('unpaid');

            // --- Info Pelanggan (walk-in tanpa akun) ---
            $table->string('customer_name', 200)->nullable();
            $table->string('customer_phone', 30)->nullable();

            // --- FnB ---
            $table->foreignId('table_id')->nullable()->constrained('cafe_tables')->nullOnDelete();
            $table->string('queue_number', 20)->nullable()->comment('Nomor antrian / panggil');
            // kitchen_status: pending | cooking | ready | served
            $table->string('kitchen_status', 20)->nullable();
            $table->dateTime('kitchen_printed_at')->nullable();
            $table->dateTime('served_at')->nullable();
            $table->unsignedInteger('guest_count')->nullable();
            // Delivery
            $table->text('delivery_address')->nullable();
            $table->string('delivery_platform', 50)->nullable()->comment('gofood / grabfood / shopeefood / direct');
            $table->string('delivery_order_no', 100)->nullable();

            // --- Service / Barbershop / Salon ---
            $table->foreignId('employee_id')->nullable()->constrained('employees')->nullOnDelete()
                  ->comment('Karyawan utama yang handle transaksi');
            // service_status: waiting | in_progress | done
            $table->string('service_status', 20)->nullable();
            $table->dateTime('service_started_at')->nullable();
            $table->dateTime('service_finished_at')->nullable();

            // --- Laundry ---
            // laundry_status: received | washing | drying | ironing | ready | picked_up
            $table->string('laundry_status', 30)->nullable();
            $table->decimal('weight_kg', 8, 3)->nullable()->comment('Berat kg untuk layanan kiloan');
            $table->dateTime('estimated_done_at')->nullable();
            $table->dateTime('picked_up_at')->nullable();

            // --- Rental / Sewa ---
            // rental_status: active | returned | overdue | cancelled
            $table->string('rental_status', 20)->nullable();
            $table->dateTime('rent_start_at')->nullable();
            $table->dateTime('rent_end_at')->nullable();
            $table->dateTime('actual_return_at')->nullable();
            $table->decimal('deposit_amount', 15, 2)->default(0);
            $table->decimal('deposit_paid', 15, 2)->default(0);
            $table->decimal('deposit_refunded', 15, 2)->default(0);
            $table->decimal('overdue_charge', 15, 2)->default(0);

            // --- Parkir ---
            $table->string('plate_number', 20)->nullable();
            $table->string('vehicle_type', 20)->nullable()->comment('motor | mobil | truk');
            $table->string('parking_ticket_no', 50)->nullable();
            $table->dateTime('entry_at')->nullable();
            $table->dateTime('exit_at')->nullable();

            // --- Sesi Waktu (Warnet / PS / Karaoke) ---
            // session_status: active | paused | ended
            $table->string('session_status', 20)->nullable();
            $table->string('unit_name', 50)->nullable()->comment('PC-01, PS-03, Room-A, dll');
            $table->dateTime('session_started_at')->nullable();
            $table->dateTime('session_ended_at')->nullable();
            $table->decimal('rate_per_hour', 15, 2)->nullable()->comment('Snapshot tarif per jam saat sesi dibuka');

            // --- Extra Data (JSON untuk data spesifik yang tidak perlu di-query SQL) ---
            $table->json('extra_data')->nullable()->comment('Data tambahan spesifik mode yang tidak perlu di-filter');

            $table->text('notes')->nullable();
            $table->string('idempotency_key', 100)->nullable()->unique();
            $table->timestamps();

            $table->index(['store_id', 'branch_id', 'sale_date']);
            $table->index(['store_id', 'status']);
            $table->index(['store_id', 'pos_mode']);
            $table->index('plate_number');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales');
    }
};
