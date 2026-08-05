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
        Schema::dropIfExists('registration_otps');
    }

    public function down(): void
    {
        // Tabel registration_otps tidak bisa di-restore — data sudah dihapus.
    }
};
