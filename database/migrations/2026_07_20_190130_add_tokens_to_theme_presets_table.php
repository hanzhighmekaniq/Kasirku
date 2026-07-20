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
        Schema::table('theme_presets', function (Blueprint $table) {
            // Full36-token set per mode (light + dark) dalam format JSON.
            // Kolom primary/secondary/accent lama tetap ada untuk backward
            // compatibility dan preview card di Index page.
            $table->json('light_tokens')->nullable()->after('is_system');
            $table->json('dark_tokens')->nullable()->after('light_tokens');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('theme_presets', function (Blueprint $table) {
            $table->dropColumn(['light_tokens', 'dark_tokens']);
        });
    }
};
