<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create("store_type_feature", function (Blueprint $table) {
            $table->id();
            $table
                ->foreignId("store_type_id")
                ->constrained("store_types")
                ->cascadeOnDelete();
            $table->foreignId("feature_id")->constrained()->cascadeOnDelete();
            $table->unique(["store_type_id", "feature_id"]);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists("store_type_feature");
    }
};
