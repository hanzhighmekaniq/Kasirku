<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Batas waktu kasir boleh mengubah metode pembayaran transaksi yang sudah
     * selesai. Kedua kolom null berarti tidak ada batas waktu (perilaku lama).
     */
    public function up(): void
    {
        Schema::table('stores', function (Blueprint $table) {
            $table->unsignedSmallInteger('payment_edit_limit_value')
                ->nullable()
                ->after('points_per_amount');

            $table->enum('payment_edit_limit_unit', ['minutes', 'hours', 'days'])
                ->nullable()
                ->after('payment_edit_limit_value');
        });
    }

    public function down(): void
    {
        Schema::table('stores', function (Blueprint $table) {
            $table->dropColumn(['payment_edit_limit_value', 'payment_edit_limit_unit']);
        });
    }
};
