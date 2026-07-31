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
        Schema::create('business_template_categories', function (Blueprint $table) {
            $table->id();
            $table
                ->foreignId('business_template_id')
                ->constrained()
                ->cascadeOnDelete();
            $table->string('name');
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->index(['business_template_id', 'sort_order'], 'btc_template_sort_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('business_template_categories');
    }
};
