<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            $table->decimal('price_yearly', 15, 2)->default(0)->after('price')
                ->comment('Harga per tahun — null/0 berarti tidak ada opsi tahunan');

            $table->integer('max_stores')->default(1)->after('max_branches')
                ->comment('Jumlah toko per owner. 999 = unlimited di seeder dev.');

            $table->integer('max_products')->nullable()->after('max_stores')
                ->comment('Batas produk aktif per toko. null = unlimited.');

            $table->integer('max_transactions_per_month')->nullable()->after('max_products')
                ->comment('Batas transaksi per bulan per toko. null = unlimited.');

            $table->boolean('is_popular')->default(false)->after('is_active')
                ->comment('Tampilkan badge "Populer" di halaman pilih paket.');

            // Paket musiman/event — developer nyalakan/matikan manual.
            // Kolom ini memungkinkan developer membuat paket Ramadhan, Harbolnas,
            // dll yang hanya tampil di landing page saat event berlangsung.
            $table->boolean('is_seasonal')->default(false)->after('is_popular')
                ->comment('Paket event/musiman — developer toggle manual.');

            $table->string('seasonal_label', 100)->nullable()->after('is_seasonal')
                ->comment('Teks badge event, mis. "Ramadhan Special". Hanya tampil jika is_seasonal = true.');
        });
    }

    public function down(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            $table->dropColumn([
                'price_yearly',
                'max_stores',
                'max_products',
                'max_transactions_per_month',
                'is_popular',
                'is_seasonal',
                'seasonal_label',
            ]);
        });
    }
};
