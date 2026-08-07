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
        Schema::table('expense_categories', function (Blueprint $table) {
            $table->decimal('monthly_budget', 15, 2)->nullable()->after('description')
                ->comment('Budget bulanan, NULL = tanpa batas');
        });
    }

    public function down(): void
    {
        Schema::table('expense_categories', function (Blueprint $table) {
            $table->dropColumn('monthly_budget');
        });
    }
};
