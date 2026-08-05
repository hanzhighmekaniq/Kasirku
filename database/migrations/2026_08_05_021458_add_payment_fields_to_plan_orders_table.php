<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('plan_orders', function (Blueprint $table) {
            $table->unsignedSmallInteger('payment_method_change_count')->default(0)->after('notes');
            $table->timestamp('expires_at')->nullable()->after('payment_method_change_count');
        });
    }

    public function down(): void
    {
        Schema::table('plan_orders', function (Blueprint $table) {
            $table->dropColumn(['payment_method_change_count', 'expires_at']);
        });
    }
};
