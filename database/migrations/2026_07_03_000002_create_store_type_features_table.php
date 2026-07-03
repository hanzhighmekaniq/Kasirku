<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('store_type_features', function (Blueprint $table) {
            $table->string('store_type', 30);
            $table->string('feature_code', 50);
            $table->primary(['store_type', 'feature_code']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('store_type_features');
    }
};
