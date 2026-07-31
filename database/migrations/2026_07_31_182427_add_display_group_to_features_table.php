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
        Schema::table('features', function (Blueprint $table) {
            $table
                ->string('display_group', 20)
                ->default('other')
                ->after('category')
                ->comment('Grup tampilan di UI Developer — home/transaction/operations/catalog/people/finance/system/other. Sinkron manual dengan resources/js/Utils/featureGroups.js.');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('features', function (Blueprint $table) {
            $table->dropColumn('display_group');
        });
    }
};
