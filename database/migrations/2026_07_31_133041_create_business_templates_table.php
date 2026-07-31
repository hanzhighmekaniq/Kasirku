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
        Schema::create('business_templates', function (Blueprint $table) {
            $table->id();
            $table
                ->foreignId('store_type_id')
                ->constrained()
                ->cascadeOnDelete();
            $table
                ->string('code', 50)
                ->unique()
                ->comment('retail_minimarket, fnb_cafe, etc.');
            $table->string('label');
            $table->string('icon', 20)->nullable();
            $table->text('description')->nullable();
            $table
                ->boolean('is_ready')
                ->default(false)
                ->comment('false = katalog data contohnya belum tersedia');
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->index(['store_type_id', 'is_active', 'sort_order']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('business_templates');
    }
};
