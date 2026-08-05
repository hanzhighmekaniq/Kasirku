<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('plan_orders', function (Blueprint $table) {
            $table->unsignedSmallInteger('cancel_count')->default(0)
                ->after('notes')
                ->comment('Berapa kali order ini dibatalkan (max 1)');
            $table->unsignedSmallInteger('resume_count')->default(0)
                ->after('cancel_count')
                ->comment('Berapa kali order ini dilanjutkan dari cancelled (max 1)');
        });
    }

    public function down(): void
    {
        Schema::table('plan_orders', function (Blueprint $table) {
            $table->dropColumn(['cancel_count', 'resume_count']);
        });
    }
};
