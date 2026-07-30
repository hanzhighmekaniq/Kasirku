<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('plan_addons', function (Blueprint $table) {
            $table->id();
            $table->foreignId('plan_id')
                ->constrained('plans')
                ->cascadeOnDelete();
            // 'branch' | 'user' | 'store'
            $table->string('code', 30);
            $table->string('label');
            $table->decimal('price', 15, 2)->default(0)
                ->comment('Harga add-on per bulan');
            $table->text('description')->nullable();
            $table->integer('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            // Setiap plan hanya boleh punya satu baris per jenis add-on
            $table->unique(['plan_id', 'code']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('plan_addons');
    }
};
