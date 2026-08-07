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
            $table->unsignedBigInteger('approved_by')->nullable()->after('status')
                ->comment('User ID yang approve');
            $table->timestamp('approved_at')->nullable()->after('approved_by')
                ->comment('Waktu approve');
            $table->text('rejection_reason')->nullable()->after('approved_at')
                ->comment('Alasan ditolak');
        });
    }

    public function down(): void
    {
        Schema::table('expenses', function (Blueprint $table) {
            $table->dropColumn(['approved_by', 'approved_at', 'rejection_reason']);
        });
    }
};
