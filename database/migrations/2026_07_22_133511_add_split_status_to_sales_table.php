<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->string('split_status', 20)->default('none')->after('payment_status');
            // none | in_progress | completed | cancelled
            $table->boolean('is_split_stale')->default(false)->after('split_status');
        });
    }

    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropColumn(['split_status', 'is_split_stale']);
        });
    }
};
