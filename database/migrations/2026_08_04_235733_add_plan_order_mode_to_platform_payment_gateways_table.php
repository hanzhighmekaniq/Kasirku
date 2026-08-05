<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Mode pembayaran untuk order upgrade plan:
     *   - 'auto'   → redirect ke Payment Gateway
     *   - 'manual' → instruksi transfer manual + kontak admin
     *
     * Ini adalah setting GLOBAL (bukan per-provider). Nilai dibaca
     * dari baris pertama di tabel ini.
     */
    public function up(): void
    {
        Schema::table('platform_payment_gateways', function (Blueprint $table) {
            $table->string('plan_order_mode', 10)->nullable()->default('auto')
                ->comment('auto = redirect PG, manual = transfer bank');
        });
    }

    public function down(): void
    {
        Schema::table('platform_payment_gateways', function (Blueprint $table) {
            $table->dropColumn('plan_order_mode');
        });
    }
};
