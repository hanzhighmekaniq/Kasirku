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
        Schema::table('product_stocks', function (Blueprint $table) {
            $table->string('lot_number', 100)->nullable()->after('quantity')
                ->comment('Nomor lot/batch untuk tracking');
        });
    }

    public function down(): void
    {
        Schema::table('product_stocks', function (Blueprint $table) {
            $table->dropColumn('lot_number');
        });
    }
};
