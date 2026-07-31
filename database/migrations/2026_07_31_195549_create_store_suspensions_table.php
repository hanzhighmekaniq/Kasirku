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
        Schema::create('store_suspensions', function (Blueprint $table) {
            $table->id();
            $table
                ->foreignId('store_id')
                ->constrained()
                ->cascadeOnDelete();
            $table->text('reason');
            $table
                ->foreignId('suspended_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->timestamp('suspended_at');
            $table->timestamp('reactivated_at')->nullable();
            $table
                ->foreignId('reactivated_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->timestamps();

            $table->index(['store_id', 'suspended_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('store_suspensions');
    }
};
