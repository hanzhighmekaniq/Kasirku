<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::dropIfExists('store_payment_gateways');
    }

    public function down(): void
    {
        // Tidak bisa restore — file migration asli sudah dihapus.
        // Jalankan migrate:fresh jika perlu re-create dari awal.
    }
};
