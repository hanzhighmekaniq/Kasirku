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
        Schema::create('business_hours', function (Blueprint $table) {
            $table->id();
            $table->foreignId('store_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('day_of_week')
                ->comment('0=Senin, 6=Minggu');
            $table->time('open_time')->nullable()
                ->comment('Jam buka, NULL = tutup');
            $table->time('close_time')->nullable()
                ->comment('Jam tutup, NULL = tutup');
            $table->boolean('is_closed')->default(false)
                ->comment('True = hari ini tutup');
            $table->timestamps();

            $table->unique(['store_id', 'day_of_week']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('business_hours');
    }
};
