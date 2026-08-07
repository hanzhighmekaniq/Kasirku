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
        Schema::table('cashier_shifts', function (Blueprint $table) {
            $table->decimal('mid_count_cash', 15, 2)->nullable()->after('actual_cash')
                ->comment('Jumlah cash saat hitung tengah shift');
            $table->timestamp('mid_count_at')->nullable()->after('mid_count_cash')
                ->comment('Waktu hitung tengah shift');
            $table->text('mid_count_note')->nullable()->after('mid_count_at')
                ->comment('Catatan saat hitung tengah shift');
        });
    }

    public function down(): void
    {
        Schema::table('cashier_shifts', function (Blueprint $table) {
            $table->dropColumn(['mid_count_cash', 'mid_count_at', 'mid_count_note']);
        });
    }
};
