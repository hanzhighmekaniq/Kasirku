<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tier pelanggan yang dikelola sendiri oleh tiap toko.
     *
     * Sebelumnya tier ditulis mati di kode (`bronze`/`silver`/`gold`/`platinum`)
     * sehingga owner tidak bisa menambah level di tengah hierarki. Sekarang
     * hierarki ditentukan kolom `rank`: makin besar makin tinggi. `rank` tidak
     * dibuat unique karena reorder menulis ulang seluruh baris sekaligus, dan
     * constraint unique akan bentrok di tengah proses itu.
     */
    public function up(): void
    {
        Schema::create('customer_tiers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('store_id')->constrained()->cascadeOnDelete();
            $table->string('name', 50);
            $table->unsignedInteger('rank')->default(1);
            $table->string('color', 20)->default('slate');
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['store_id', 'name']);
            $table->index(['store_id', 'rank']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_tiers');
    }
};
