<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('store_types', function (Blueprint $table) {
            $table->id();
            $table->string('code', 30)->unique();
            $table->string('label');
            $table->string('icon', 10)->default('🏬');
            $table->text('description')->nullable();
            $table->json('order_types')->nullable()->comment('Array of {v, l} untuk POS tabs');
            $table->string('pos_behavior', 30)->default('retail')->comment('Pola POS: retail, fnb, service, rental');
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('store_types');
    }
};
