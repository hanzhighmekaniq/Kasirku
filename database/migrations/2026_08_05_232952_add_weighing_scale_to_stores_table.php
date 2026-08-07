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
        Schema::table('stores', function (Blueprint $table) {
            $table->boolean('weighing_scale_enabled')->default(false)->after('paper_width')
                ->comment('Aktifkan integrasi timbangan digital');
            $table->string('weighing_scale_port', 50)->nullable()->after('weighing_scale_enabled')
                ->comment('COM port / IP address timbangan');
            $table->string('weighing_scale_baud_rate', 20)->default('9600')->after('weighing_scale_port')
                ->comment('Baud rate koneksi serial');
        });
    }

    public function down(): void
    {
        Schema::table('stores', function (Blueprint $table) {
            $table->dropColumn(['weighing_scale_enabled', 'weighing_scale_port', 'weighing_scale_baud_rate']);
        });
    }
};
