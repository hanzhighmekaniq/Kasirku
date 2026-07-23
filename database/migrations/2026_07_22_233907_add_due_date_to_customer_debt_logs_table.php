<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('customer_debt_logs', function (Blueprint $table) {
            $table->date('due_date')->nullable()->after('balance_after');
        });
    }

    public function down(): void
    {
        Schema::table('customer_debt_logs', function (Blueprint $table) {
            $table->dropColumn('due_date');
        });
    }
};
