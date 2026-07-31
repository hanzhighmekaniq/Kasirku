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
        Schema::create('plan_subscriptions', function (Blueprint $table) {
            $table->id();
            $table
                ->foreignId('store_id')
                ->constrained()
                ->cascadeOnDelete();
            $table
                ->foreignId('plan_id')
                ->nullable()
                ->constrained()
                ->nullOnDelete();
            $table->timestamp('started_at');
            $table->timestamp('ended_at')->nullable();
            $table
                ->string('reason', 30)
                ->comment('initial, upgraded, downgraded, trial_expired, manual, reactivated');
            $table
                ->foreignId('created_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete()
                ->comment('Developer yang mengubah manual, null kalau otomatis (registrasi/command)');
            $table->timestamps();

            $table->index(['store_id', 'started_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('plan_subscriptions');
    }
};
