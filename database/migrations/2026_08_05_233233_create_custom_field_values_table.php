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
        Schema::create('custom_field_values', function (Blueprint $table) {
            $table->id();
            $table->foreignId('custom_field_id')->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('entity_id')->comment('ID produk atau customer');
            $table->text('value')->nullable();
            $table->timestamps();

            $table->unique(['custom_field_id', 'entity_id']);
            $table->index(['entity_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('custom_field_values');
    }
};
