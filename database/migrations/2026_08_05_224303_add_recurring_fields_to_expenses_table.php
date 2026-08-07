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
        Schema::table('expenses', function (Blueprint $table) {
            $table->boolean('is_recurring')->default(false)->after('status')
                ->comment('Apakah pengeluaran ini berulang');
            $table->enum('recurrence_type', ['weekly', 'monthly', 'yearly'])->nullable()->after('is_recurring')
                ->comment('Tipe pengulangan: weekly/monthly/yearly');
            $table->date('next_due_date')->nullable()->after('recurrence_type')
                ->comment('Tanggal jatuh tempo berikutnya');
            $table->unsignedBigInteger('parent_expense_id')->nullable()->after('next_due_date')
                ->comment('ID pengeluaran induk (untuk expense berulang)');
        });
    }

    public function down(): void
    {
        Schema::table('expenses', function (Blueprint $table) {
            $table->dropColumn(['is_recurring', 'recurrence_type', 'next_due_date', 'parent_expense_id']);
        });
    }
};
