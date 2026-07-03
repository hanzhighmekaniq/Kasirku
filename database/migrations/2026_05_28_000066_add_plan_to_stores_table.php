<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('stores', function (Blueprint $table) {
            // Paket langganan: free / basic / pro
            $table->string('plan', 20)->default('free')->after('is_active');
            $table->date('plan_expires_at')->nullable()->after('plan');
            // Batas per paket
            $table->unsignedSmallInteger('max_users')->default(1)->after('plan_expires_at');
            $table->unsignedSmallInteger('max_branches')->default(1)->after('max_users');
        });
    }

    public function down(): void
    {
        Schema::table('stores', function (Blueprint $table) {
            $table->dropColumn(['plan', 'plan_expires_at', 'max_users', 'max_branches']);
        });
    }
};
