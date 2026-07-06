<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create("plans", function (Blueprint $table) {
            $table->id();
            $table
                ->string("code", 30)
                ->unique()
                ->comment("free, basic, pro, etc.");
            $table->string("label");
            $table->text("description")->nullable();
            $table->integer("max_users")->default(1);
            $table->integer("max_branches")->default(1);
            $table
                ->decimal("price", 15, 2)
                ->default(0)
                ->comment("Harga per bulan");
            $table->integer("trial_days")->default(0);
            $table->boolean("is_active")->default(true);
            $table->integer("sort_order")->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists("plans");
    }
};
