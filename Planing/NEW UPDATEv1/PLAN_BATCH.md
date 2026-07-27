Berikut planning task lengkap yang tersisa.
Planning: Sisa Pekerjaan Sistem Batch
Yang sudah selesai
Tahap
0 — Bug fix branch_id + SaleService + Waste bucket-aware
1 — StockService pintu tunggal + hapus duplikasi resep
2 — Struktur batch: migration + route + UI toggle
3 — Batch lahir dari pembelian (backend)
Task tersisa
Task 3.1 — Validasi backend batch_no dan expiry_date di form pembelian
File: PurchaseController::store() dan update()
Tambah rule validasi kondisional di array rules:
'items.*.batch_no'    => 'nullable|string|max:100',
'items.*.expiry_date' => 'nullable|date',
Pastikan PurchaseItem::create() menyimpan kedua field dari $validated.
Task 3.2 — UI form pembelian: field batch per item
File: Purchases/Create.jsx + Purchases/Edit.jsx
Untuk setiap item di daftar, tambah dua field yang muncul hanya jika produk track_batch = true:
{item.track_batch && (
    <div className="mt-2 grid grid-cols-2 gap-2">
        <div>
            <label>No. Batch</label>
            <input value={item.batch_no} onChange={...} placeholder="cth. BTH-001" />
        </div>
        <div>
            <label>Tgl Expired</label>
            <input type="date" value={item.expiry_date} onChange={...} />
        </div>
    </div>
)}
Data produk (track_batch) sudah dikirim dari productsForPurchaseForm() — perlu pastikan kolom itu ikut di-select.
Task 3.3 — Halaman Batch (ProductBatches) mendukung variant & kemasan
File: ProductBatches/Index.jsx, Create.jsx, Edit.jsx, ProductBatchForm.jsx
- Index.jsx: tambah kolom Variant dan Kemasan di tabel; filter by variant
- ProductBatchForm.jsx: tambah dropdown varian dan kemasan (mengikuti pola form pembelian)
- ProductBatchController: validasi + simpan variant_id + packaging_unit_id
Task 4 — FEFO di StockService::decrease()
File: app/Services/Stock/StockService.php
public function decrease(StockMutation $m): void
{
    if ($this->shouldUseFEFO($m)) {
        $this->decreaseFEFO($m);
        return;
    }
    // ... kode existing
}

private function shouldUseFEFO(StockMutation $m): bool
{
    $product = Product::find($m->productId);
    return $product?->track_batch === true;
}

private function decreaseFEFO(StockMutation $m): void
{
    $remaining = $m->quantity;
    
    // Ambil batch urut expiry_date ASC (NULL terakhir)
    $batches = ProductBatch::where([
        'product_id'        => $m->productId,
        'variant_id'        => $m->variantId,
        'packaging_unit_id' => $m->packagingUnitId,
        'store_id'          => $m->storeId,
        'branch_id'         => $m->branchId,
    ])
    ->whereNull('expiry_date')->orWhereDate('expiry_date', '>=', now())
    ->orderByRaw('expiry_date IS NULL, expiry_date ASC')
    ->get();
    
    foreach ($batches as $batch) {
        if ($remaining <= 0) break;
        $take = min($remaining, $batch->quantity);
        $batch->decrement('quantity', $take);
        $remaining -= $take;
    }
    
    // Kalau batch habis, sisanya potong stok biasa (tidak blokir penjualan)
    if ($remaining > 0) {
        $stock = $this->resolveBucket($m);
        $stock->decrement('quantity', $remaining);
    }
    
    // Catat satu movement untuk total qty
    $this->recordMovement($m);
}
Task 5 — Retur, Opname, Transfer, Waste sadar batch
Sub-task	File
5.1 Retur penjualan	SaleReturnController
5.2 Retur pembelian	PurchaseReturnController
5.3 Opname	StockOpnameController + Opname/Create.jsx
5.4 Transfer	StockTransferController
5.5 Waste	WasteController + Waste/Create.jsx
Task 6 — Halaman monitor batch kadaluarsa
File baru: sudah ada ProductBatches/Index.jsx — tambahkan:
- Card "Hampir Kadaluarsa" (≤30 hari) clickable filter
- Badge warna sesuai status (active/expiring_soon/expired) — sudah ada di STATUS_META
- Sort default: expiry_date ASC
Task 7 — Laporan "Penjualan tanpa batch"
Produk yang track_batch = true tapi sale_items.product_batch_id = NULL — menandakan stok dipotong di luar batch, perlu dirapikan lewat opname.
File: bisa masuk ke laporan stok yang sudah ada, atau halaman tersendiri.
Task 8 — Test
Test
PurchaseBatchAutoCreateTest
FEFOStockDeductionTest
BatchNotBlockSaleTest
Task 9 — Verifikasi akhir
npm run build
vendor/bin/pint --dirty
php artisan migrate:fresh --env=testing --force
php artisan test --compact
Urutan eksekusi
3.1 → 3.2 → 3.3   (form pembelian + halaman batch lengkap)
     ↓
     4             (FEFO — butuh struktur batch siap)
     ↓
     5             (retur/opname/transfer/waste sadar batch)
     ↓
     6 + 7         (monitor + laporan)
     ↓
     8 + 9         (test + verifikasi akhir)