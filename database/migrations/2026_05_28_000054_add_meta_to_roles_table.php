<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tambahan kolom di tabel roles (Spatie):
 *
 * - is_system : true = role bawaan sistem (developer, owner), tidak bisa diedit/hapus
 * - store_id sudah ada dari migration Spatie (teams feature)
 *   → null  = role sistem global (developer, owner)
 *   → int   = role buatan owner, hanya berlaku di store itu
 * - description : label deskripsi untuk UI role management
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('roles', function (Blueprint $table) {
            $table->boolean('is_system')->default(false)->after('guard_name')
                  ->comment('true = role sistem, tidak bisa diedit/hapus oleh owner');
            $table->string('description', 255)->nullable()->after('is_system')
                  ->comment('Deskripsi role untuk UI');
        });
    }

    public function down(): void
    {
        Schema::table('roles', function (Blueprint $table) {
            $table->dropColumn(['is_system', 'description']);
        });
    }
};
