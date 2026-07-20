<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('queues', function (Blueprint $table) {
            $table->id();
            $table->foreignId('store_id')->constrained()->cascadeOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->string('customer_name', 100)->nullable();
            $table->string('customer_phone', 20)->nullable();
            $table->unsignedInteger('queue_number');
            $table->string('status', 20)->default('waiting');
            $table->text('notes')->nullable();
            $table->foreignId('served_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('served_at')->nullable();
            $table->timestamps();

            $table->index(['store_id', 'branch_id', 'status']);
            $table->index(['store_id', 'branch_id', 'queue_number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('queues');
    }
};
