<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Template role level platform — sumber kebenaran role default yang dibuat
 * saat toko baru lahir. Sebelumnya di-hardcode di array PHP
 * StoreRoleService::systemRolePermissions().
 *
 * `store_type_codes` menentukan "role ini muncul di mana": role hanya dibuat
 * untuk toko yang tipenya tercantum di situ. Disimpan sebagai JSON, bukan
 * tabel pivot, karena datanya kecil (6 template x 8 tipe toko).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('role_templates', function (Blueprint $table) {
            $table->id();
            $table->string('key', 50)->unique()
                ->comment('slug unik, dipakai sebagai nama role di tiap store');
            $table->string('name', 80);
            $table->string('description', 255)->nullable();
            $table->string('icon', 50)->nullable()
                ->comment('nama ikon lucide-react');
            $table->string('color', 30)->nullable()
                ->comment('warna badge di UI');
            $table->boolean('is_core')->default(false)
                ->comment('role inti (owner/kasir) — tidak bisa dihapus/rename');
            $table->json('permissions')
                ->comment('array nama permission, atau ["*"] untuk semua');
            $table->json('store_type_codes')
                ->comment('array kode store_type tempat role ini berlaku');
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('role_templates');
    }
};
