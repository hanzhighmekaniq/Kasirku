<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Restructure theme_presets: gabungkan light_tokens + dark_tokens jadi
     * satu kolom `tokens` JSON berbentuk {light: {...}, dark: {...}}.
     * Kolom primary/secondary/accent/is_dark dihapus — nilai preview
     * (untuk kartu di Theme Index) sekarang diambil langsung dari
     * tokens.light.primary/secondary/accent saat runtime, tidak perlu
     * kolom terpisah lagi. is_dark juga tidak relevan lagi karena setiap
     * row sudah punya KEDUA mode (light & dark) sekaligus.
     */
    public function up(): void
    {
        Schema::table('theme_presets', function (Blueprint $table) {
            $table->json('tokens')->nullable()->after('description');
        });

        Schema::table('theme_presets', function (Blueprint $table) {
            $table->dropColumn(['primary', 'secondary', 'accent', 'is_dark', 'light_tokens', 'dark_tokens']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('theme_presets', function (Blueprint $table) {
            $table->string('primary', 9)->default('#4F46E5');
            $table->string('secondary', 9)->default('#64748B');
            $table->string('accent', 9)->default('#8B5CF6');
            $table->boolean('is_dark')->default(false);
            $table->json('light_tokens')->nullable();
            $table->json('dark_tokens')->nullable();
        });

        Schema::table('theme_presets', function (Blueprint $table) {
            $table->dropColumn('tokens');
        });
    }
};
