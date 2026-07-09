<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create("product_packaging_units", function (Blueprint $table) {
            $table->id();
            $table
                ->foreignId("product_id")
                ->constrained("products")
                ->cascadeOnDelete();
            $table->string("name", 50); // "Dus", "Box", "Karton"
            $table->unsignedInteger("conversion_qty"); // 1 Dus = 12 Pcs
            $table->unsignedBigInteger("sell_price")->default(0); // Harga per satuan ini
            $table->string("barcode", 100)->nullable(); // Barcode unik per kemasan
            $table->timestamps();

            $table->unique(["product_id", "name"]); // Tidak boleh duplikat nama kemasan per produk
            $table->index("barcode");
        });
    }

    public function down(): void
    {
        Schema::dropIfExists("product_packaging_units");
    }
};
