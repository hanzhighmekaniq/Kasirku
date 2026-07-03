<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Master paket membership (Gym, Laundry langganan, Kursus, dll)
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('memberships', function (Blueprint $table) {
            $table->id();
            $table->foreignId('store_id')->constrained()->cascadeOnDelete();
            $table->string('code', 50);
            $table->string('name');
            $table->text('description')->nullable();
            // duration_type: day / month / year / visit (berbasis kunjungan)
            $table->string('duration_type', 20)->default('month');
            $table->unsignedInteger('duration_value')->default(1)->comment('Misal: 1 bulan, 30 hari, 10 kunjungan');
            $table->decimal('price', 15, 2)->default(0);
            $table->decimal('discount_percent', 5, 2)->default(0)->comment('Diskon member saat transaksi');
            $table->unsignedInteger('point_multiplier')->default(1)->comment('Kelipatan poin yang didapat');
            $table->json('benefits')->nullable()->comment('Benefit tambahan dalam format JSON');
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['store_id', 'code']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('memberships');
    }
};
