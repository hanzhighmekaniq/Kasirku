<?php

namespace App\Http\Controllers\Concerns;

use App\Models\CafeTable;
use App\Models\Sale;

/**
 * Menjaga kolom `cafe_tables.status` tetap sinkron dengan kondisi order
 * yang sebenarnya.
 *
 * Sebelumnya meja hanya pernah di-set 'occupied' saat order dibuat dan tidak
 * pernah dikembalikan ke 'available' setelah dibayar — meja jadi nyangkut
 * terisi selamanya sampai kasir membebaskannya manual. Trait ini dipanggil di
 * setiap titik yang mengubah nasib sebuah sale (dibuat, diselesaikan,
 * dibatalkan, dibayar lewat payment gateway) supaya status meja selalu
 * diturunkan dari data, bukan ditebak.
 */
trait ManagesTableStatus
{
    /**
     * Hitung ulang status sebuah meja dari order yang menempatinya.
     *
     * @param  int|string|null  $tableId  Meja yang mau disinkronkan; null = tidak ada meja, langsung keluar.
     * @param  int|null  $storeId  Pembatas kepemilikan. Kalau null, diambil dari sesi aktif.
     * @param  int|null  $ignoreSaleId  Sale yang efeknya harus diabaikan — dipakai saat
     *                                  sale tersebut sedang/baru saja dihapus sehingga
     *                                  query di bawah masih bisa melihatnya.
     */
    protected function syncTableStatus(
        int|string|null $tableId,
        ?int $storeId = null,
        ?int $ignoreSaleId = null,
    ): void {
        if (empty($tableId)) {
            return;
        }

        $storeId ??= session('current_store_id');

        $table = CafeTable::where('id', $tableId)
            ->when($storeId, fn ($q) => $q->where('store_id', $storeId))
            ->first();

        if (! $table) {
            return;
        }

        $hasActiveOrder = Sale::where('table_id', $table->id)
            ->when($ignoreSaleId, fn ($q) => $q->where('id', '!=', $ignoreSaleId))
            ->whereNotIn('status', Sale::CLOSED_STATUSES)
            ->exists();

        if ($hasActiveOrder) {
            if ($table->status !== 'occupied') {
                $table->update(['status' => 'occupied']);
            }

            return;
        }

        // Tidak ada order aktif lagi. Hanya meja yang memang sedang terisi
        // yang dibebaskan — meja 'reserved' dibiarkan apa adanya supaya
        // booking tidak tertimpa oleh transaksi yang baru saja ditutup.
        if ($table->status === 'occupied') {
            $table->update(['status' => 'available']);
        }
    }
}
