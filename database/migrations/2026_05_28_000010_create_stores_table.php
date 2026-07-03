<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stores', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('code', 50)->unique();
            $table->string('name');
            // store_type sebagai hint utama, modules JSON sebagai penentu fitur aktif
            $table->string('store_type', 30)->default('retail');
            // modules: { "pos_modes": ["retail","fnb","service"], "features": ["kitchen","queue","booking","delivery","rental","parking","membership","commission"] }
            $table->json('modules')->nullable();
            $table->string('logo')->nullable();
            $table->string('currency', 10)->default('IDR');
            $table->unsignedTinyInteger('decimal_places')->default(0);
            $table->string('timezone', 50)->default('Asia/Jakarta');
            $table->boolean('tax_inclusive')->default(false);
            $table->decimal('default_tax_rate', 5, 2)->default(0);
            $table->text('receipt_header')->nullable();
            $table->text('receipt_footer')->nullable();
            $table->string('phone', 30)->nullable();
            $table->string('email')->nullable()->unique();
            $table->text('address')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stores');
    }
};
