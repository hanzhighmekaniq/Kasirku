<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create("stock_transfers", function (Blueprint $table) {
            $table->id();
            $table
                ->foreignId("store_id")
                ->constrained("stores")
                ->cascadeOnDelete();
            $table
                ->foreignId("from_branch_id")
                ->constrained("branches")
                ->cascadeOnDelete();
            $table
                ->foreignId("to_branch_id")
                ->constrained("branches")
                ->cascadeOnDelete();
            $table
                ->foreignId("user_id")
                ->nullable()
                ->constrained("users")
                ->nullOnDelete();
            $table->string("transfer_no", 100)->unique();
            $table->date("transfer_date");
            $table->string("status", 20)->default("pending");
            $table->text("notes")->nullable();
            $table->timestamps();

            $table->index(["store_id", "status"]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists("stock_transfers");
    }
};
