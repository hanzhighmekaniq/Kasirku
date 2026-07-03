<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('store_id')->nullable()->constrained()->nullOnDelete();
            $table->string('code', 50);
            $table->string('name');
            $table->string('phone', 30)->nullable();
            $table->string('email')->nullable();
            $table->text('address')->nullable();
            $table->date('birth_date')->nullable();
            $table->string('gender', 10)->nullable(); // male / female
            // Loyalty
            $table->unsignedInteger('points')->default(0);
            $table->string('tier', 20)->default('bronze'); // bronze / silver / gold / platinum
            $table->decimal('total_spent', 15, 2)->default(0);
            $table->timestamp('last_visit_at')->nullable();
            // Deposit/saldo titipan (untuk mode rental, langganan, dll)
            $table->decimal('deposit_balance', 15, 2)->default(0);
            $table->text('notes')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['store_id', 'code']);
            $table->index('store_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customers');
    }
};
