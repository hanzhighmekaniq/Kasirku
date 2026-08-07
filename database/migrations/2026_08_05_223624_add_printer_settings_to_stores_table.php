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
            $table->string('printer_ip', 45)->nullable()->after('receipt_footer')
                ->comment('IP address thermal printer (untuk receipt printing)');
            $table->integer('printer_port')->nullable()->default(9100)->after('printer_ip')
                ->comment('Port printer, default 9100');
            $table->enum('paper_width', ['58', '80'])->nullable()->default('80')->after('printer_port')
                ->comment('Lebar kertas thermal: 58mm atau 80mm');
        });
    }

    public function down(): void
    {
        Schema::table('stores', function (Blueprint $table) {
            $table->dropColumn(['printer_ip', 'printer_port', 'paper_width']);
        });
    }
};
