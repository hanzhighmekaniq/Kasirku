<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('stores', function (Blueprint $table) {
            // Tambah plan_id setelah kolom plan (string lama)
            $table->foreignId('plan_id')
                ->nullable()
                ->after('plan')
                ->constrained('plans')
                ->nullOnDelete();

            // max_users & max_branches jadi nullable (null = ikut plan)
            $table->unsignedSmallInteger('max_users')->nullable()->change();
            $table->unsignedSmallInteger('max_branches')->nullable()->change();
        });

        // Isi plan_id berdasarkan kolom plan (string) yang sudah ada
        DB::statement("
            UPDATE stores s
            JOIN plans p ON p.code = s.plan
            SET s.plan_id = p.id
        ");

        // Set max_users & max_branches null (ikut plan) untuk semua store
        DB::statement("UPDATE stores SET max_users = NULL, max_branches = NULL");
    }

    public function down(): void
    {
        Schema::table('stores', function (Blueprint $table) {
            $table->dropForeign(['plan_id']);
            $table->dropColumn('plan_id');
            $table->unsignedSmallInteger('max_users')->default(1)->change();
            $table->unsignedSmallInteger('max_branches')->default(1)->change();
        });
    }
};
