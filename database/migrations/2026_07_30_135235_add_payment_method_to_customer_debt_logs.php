<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Pelunasan hutang sebelumnya tidak mencatat metode pembayarannya, sehingga
 * kasir tidak bisa membedakan pelunasan tunai dari transfer saat rekonsiliasi.
 *
 * Nullable karena log lama tidak punya data ini, dan pelunasan lewat kasir
 * juga tidak selalu menyertakan metode.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('customer_debt_logs', function (Blueprint $table) {
            $table->foreignId('payment_method_id')
                ->nullable()
                ->after('amount')
                ->constrained('payment_methods')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('customer_debt_logs', function (Blueprint $table) {
            $table->dropConstrainedForeignId('payment_method_id');
        });
    }
};
