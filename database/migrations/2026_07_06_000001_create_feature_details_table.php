<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create("feature_details", function (Blueprint $table) {
            $table->id();
            $table->foreignId("feature_id")->constrained()->cascadeOnDelete();
            $table->string("code", 50)->unique();
            $table->string("label");
            $table->text("description")->nullable();
            $table->integer("sort_order")->default(0);
            $table->boolean("is_active")->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists("feature_details");
    }
};
