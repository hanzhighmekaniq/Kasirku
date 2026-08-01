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
        Schema::create('plan_orders', function (Blueprint $table) {
            $table->id();
            $table
                ->foreignId('store_id')
                ->constrained()
                ->cascadeOnDelete();
            $table
                ->foreignId('plan_id')
                ->constrained()
                ->restrictOnDelete();
            $table
                ->enum('billing_period', ['monthly', 'yearly'])
                ->comment('Periode tagihan yang dipilih user');
            $table
                ->decimal('amount', 15, 2)
                ->comment('Harga yang harus dibayar (snapshot saat order dibuat)');
            $table
                ->enum('status', ['pending', 'paid', 'failed', 'expired', 'cancelled'])
                ->default('pending');
            $table->timestamp('paid_at')->nullable();
            $table
                ->date('plan_active_until')
                ->nullable()
                ->comment('Tanggal plan akan aktif sampai, diset saat order approved/paid');
            $table
                ->string('payment_gateway', 30)
                ->nullable()
                ->comment('Provider PG yang dipakai (midtrans/xendit/dst), null = mode manual');
            $table->string('pg_transaction_id')->nullable();
            $table->string('pg_token')->nullable()->comment('Snap token / checkout URL token dari PG');
            $table
                ->string('idempotency_key')
                ->unique()
                ->comment('Kode referensi order yang ditampilkan ke user');
            $table
                ->foreignId('created_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete()
                ->comment('User toko yang request upgrade');
            $table
                ->foreignId('processed_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete()
                ->comment('Developer yang approve/reject (mode manual)');
            $table->text('notes')->nullable()->comment('Catatan developer saat approve/reject');
            $table->timestamps();

            $table->index(['store_id', 'status']);
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('plan_orders');
    }
};
