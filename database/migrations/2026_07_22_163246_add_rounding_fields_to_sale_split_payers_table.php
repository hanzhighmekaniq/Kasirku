<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sale_split_payers', function (Blueprint $table) {
            $table->string('rounding_mode', 20)->nullable()->after('change_amount');
            $table->unsignedInteger('rounding_nearest')->nullable()->after('rounding_mode');
            $table->decimal('rounding_adjustment', 12, 2)->default(0)->after('rounding_nearest');
        });
    }

    public function down(): void
    {
        Schema::table('sale_split_payers', function (Blueprint $table) {
            $table->dropColumn(['rounding_mode', 'rounding_nearest', 'rounding_adjustment']);
        });
    }
};
