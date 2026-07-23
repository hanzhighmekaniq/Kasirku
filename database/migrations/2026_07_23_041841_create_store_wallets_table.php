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
        Schema::create('store_wallets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('store_id')->constrained()->cascadeOnDelete();
            $table->decimal('balance', 15, 2)->default(0); // saldo tersedia (bisa ditarik)
            $table->decimal('pending_balance', 15, 2)->default(0); // dari PG belum settlement
            $table->decimal('withdrawn', 15, 2)->default(0); // total sudah ditarik
            $table->timestamps();

            $table->unique('store_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('store_wallets');
    }
};
