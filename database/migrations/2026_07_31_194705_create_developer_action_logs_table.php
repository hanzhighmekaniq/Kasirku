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
        Schema::create('developer_action_logs', function (Blueprint $table) {
            $table->id();
            $table
                ->foreignId('developer_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table
                ->string('action', 100)
                ->comment('mis. store.update, plan.destroy, business_template.categories.store');
            $table->nullableMorphs('subject');
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->timestamps();

            $table->index(['developer_id', 'created_at']);
            $table->index('action');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('developer_action_logs');
    }
};
