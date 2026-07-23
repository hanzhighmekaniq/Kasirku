<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->string('rounding_mode', 20)->nullable()->after('rounding_adjustment');
            $table->unsignedInteger('rounding_nearest')->nullable()->after('rounding_mode');
        });
    }

    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropColumn(['rounding_mode', 'rounding_nearest']);
        });
    }
};
