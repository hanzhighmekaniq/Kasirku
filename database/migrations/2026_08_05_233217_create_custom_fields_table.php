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
        Schema::create('custom_fields', function (Blueprint $table) {
            $table->id();
            $table->foreignId('store_id')->constrained()->cascadeOnDelete();
            $table->string('entity_type', 50)->comment('product / customer');
            $table->string('field_name', 100)->comment('Nama field (snake_case)');
            $table->string('field_label', 100)->comment('Label untuk display');
            $table->string('field_type', 30)->default('text')
                ->comment('text / number / date / select / textarea');
            $table->json('options')->nullable()
                ->comment('Opsi untuk type select, array of values');
            $table->boolean('is_required')->default(false);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->unique(['store_id', 'entity_type', 'field_name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('custom_fields');
    }
};
