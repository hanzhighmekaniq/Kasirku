Task A — Kunci satuan resep ke base_unit
File: app/Http/Controllers/Admin/ProductRecipeController.php
Di store(), setelah validasi dasar, tambah guard yang memaksa unit resep sama dengan base_unit bahan — apa pun yang dikirim client:
$rawMaterial = Product::findOrFail($validated['raw_material_id']);

// Satuan resep WAJIB ikut base_unit bahan, bukan pilihan bebas dari form.
// Ini gerbang tunggal — kalau tidak dipaksa di sini, HPP bisa salah diam-diam
// ketika quantity ditulis dalam satuan yang berbeda dari base_unit.
$validated['unit'] = $rawMaterial->base_unit;
Pendekatan ini override otomatis, bukan reject — karena setelah Task A frontend, UI tidak lagi punya jalur untuk mengirim satuan yang salah, jadi guard ini murni safety-net untuk request langsung ke endpoint.
File: resources/js/Pages/Admin/Products/Recipes.jsx
- Hapus konstanta UNIT_OPTS (baris 38-49) — tidak terpakai lagi.
- Ganti <select> satuan (baris ~482-499) jadi tampilan read-only yang menunjukkan selectedMaterial?.base_unit, dengan pesan kalau belum pilih bahan ("Pilih bahan dulu"). data.unit tetap ter-set via handleMaterialChange (sudah ada, tidak berubah).
- Field "Satuan" di form berubah dari input jadi label statis bergaya badge, konsisten dengan pola field read-only lain di file yang sama.
Test baru (perluas file yang relevan atau file baru ProductRecipeUnitLockTest.php):
1. Tambah resep dengan raw_material_id bahan base_unit=gram dan unit yang dikirim sdm → tersimpan sebagai gram (ter-override, bukan ditolak).
2. Tambah resep dengan unit yang memang sudah sama dengan base_unit → tersimpan seperti biasa.
Task B — Combo bisa diisi produk jadi (satu level)
File: app/Http/Controllers/Admin/ProductRecipeController.php
Di index() (baris 26-39), filter daftar bahan yang bisa dipilih jadi kondisional:
$rawMaterials = Product::forStore($storeId)
    ->when(
        $product->type === 'combo',
        fn ($q) => $q->whereIn('type', ['raw_material', 'finished_goods'])
            ->where('id', '!=', $product->id)
            ->whereDoesntHave('recipes') // cegah resep bertingkat
            ->where('is_variant', false)  // cegah ambiguitas bucket stok
            ->whereDoesntHave('packagingUnits'),
        fn ($q) => $q->where('type', 'raw_material'),
    )
    ->where('is_active', true)
    ->orderBy('name')
    ->get(['id', 'name', 'sku', 'unit', 'base_unit', 'base_unit_conversion', 'cost_price']);
Di store(), tambah guard yang sama (defense-in-depth untuk request langsung ke endpoint):
if ($product->type === 'combo') {
    if ($rawMaterial->recipes()->exists()) {
        throw ValidationException::withMessages([
            'raw_material_id' => 'Komponen paket tidak boleh berupa produk yang punya resep sendiri.',
        ]);
    }
    if ($rawMaterial->is_variant || $rawMaterial->packagingUnits()->exists()) {
        throw ValidationException::withMessages([
            'raw_material_id' => 'Komponen paket tidak boleh berupa produk yang punya varian atau kemasan.',
        ]);
    }
}
File: resources/js/Pages/Admin/Products/Recipes.jsx
- Label kondisional: judul section "Bahan Baku" → "Isi Paket" ketika product.type === 'combo'.
- Placeholder select produk dan copy pendukung ("Belum ada bahan...") disesuaikan.
- Warning box "belum punya satuan pakai" (baris ~424-441) tetap relevan hanya untuk raw_material — disembunyikan kalau item yang dipilih adalah finished_goods (karena finished_goods valid tanpa base_unit khusus, costPerBaseUnit() otomatis fallback ke cost_price mentah lewat gerbang usesUnitConversion() yang sudah ada).
Tidak ada perubahan di FinalizesSaleStock.php — logic pemotongan stok sudah generik terhadap raw_material_id, tidak peduli tipe produknya.
Test baru (perluas atau file baru ProductComboRecipeTest.php):
1. Combo diisi finished_goods sederhana (tanpa varian/kemasan/resep sendiri) → tersimpan.
2. Combo diisi produk yang punya resep sendiri → ditolak.
3. Combo diisi produk finished_goods bervarian → ditolak.
4. Combo diisi produk yang punya packaging unit → ditolak.
5. Menjual combo memotong stok komponen sesuai qty resep (integrasi dengan FinalizesSaleStock, mengikuti pola test yang sudah ada untuk resep biasa).
Task C1 — Hint konversi di form pembelian
Tidak ada perubahan backend — PurchaseController::productsForPurchaseForm() sudah mengirim seluruh kolom produk termasuk base_unit, base_unit_conversion, type, cost_price.
File: resources/js/Pages/Admin/Purchases/Create.jsx
Helper baru di scope module:
const showsUnitConversion = (product) =>
    product?.type === "raw_material" && Number(product?.base_unit_conversion) > 0;
Di blok pendingProduct (setelah field Qty & Harga Beli, sekitar baris 650-660, sebelum blok Subtotal), tambah hint kondisional:
{showsUnitConversion(pendingProduct) && pendingQty > 0 && (
    <p className="mt-2 text-xs text-primary/80">
        Masuk stok: <strong>{(Number(pendingQty) * Number(pendingProduct.base_unit_conversion)).toLocaleString("id-ID")} {pendingProduct.base_unit}</strong>
        {pendingPrice > 0 && (
            <> · Modal ≈ <strong>{fmtRp(Number(pendingPrice) / Number(pendingProduct.base_unit_conversion))}/{pendingProduct.base_unit}</strong></>
        )}
    </p>
)}
File: resources/js/Pages/Admin/Purchases/Edit.jsx
Pola identik — file ini punya blok pending item sendiri (tidak reuse dari Create.jsx untuk bagian ini), jadi hint ditambah di lokasi yang sama secara struktural.
Task C2 — Hint konversi di halaman stok
Tidak ada perubahan backend untuk semua file di bawah — data produk (type, base_unit, base_unit_conversion) sudah tersedia lewat relasi product yang di-load di masing-masing controller (StockController, StockAdjustmentController, StockOpnameController, StockTransferController, WasteController).
Helper yang sama (showsUnitConversion) direplikasi di setiap file (tidak ada shared util module untuk komponen ini di codebase — konsisten dengan pola existing yang tidak banyak berbagi helper antar halaman Stock).
File: resources/js/Pages/Admin/Stock/Index.jsx
Di baris tabel/kartu yang menampilkan quantity (sekitar baris 354-360 dan 395-417), tambah subteks kondisional di bawah angka utama:
{showsUnitConversion(s.product) && (
    <p className="text-xs text-muted-foreground">
        ≈ {(avail / Number(s.product.base_unit_conversion)).toFixed(2)} {s.product.unit}
    </p>
)}
File: resources/js/Pages/Admin/Stock/Adjustment/Create.jsx + Stock/Opname/Create.jsx
Di baris item (dekat "Stok Sistem"/"Stok Aktual" atau "Hitung Fisik"), tambah baris kecil di bawah label field kalau item punya produk sumber dengan konversi — perlu simpan referensi produk penuh di data.items (saat ini hanya product_name, product_sku — perlu tambah field base_unit dan base_unit_conversion saat addItem() dipanggil, supaya hint bisa dirender tanpa lookup ulang).
File: resources/js/Pages/Admin/Stock/Transfer/Create.jsx + Stock/Waste/Create.jsx
Pola identik — tambah field base_unit/base_unit_conversion saat item ditambahkan (addItem()), lalu render hint di bawah field quantity.
Task D — Verifikasi
1. php artisan migrate:fresh --env=testing --force (pelajaran dari sesi sebelumnya — database test yang basi menyebabkan false failure)
2. php artisan test --compact — target 0 regresi dari baseline sebelumnya (176 passed setelah Task A-D, dari 165 sebelumnya + test baru)
3. vendor/bin/pint --dirty --format agent
4. npm run build
5. Tidak ada test otomatis untuk Task C (UI-only hint) — verifikasi lewat review kode, karena tidak mengubah logic backend.
Urutan eksekusi
Task A (kunci satuan resep)
    ↓
Task B (combo — bergantung pada gating type dari Task A)
    ↓
Task C1 (hint pembelian) → Task C2 (hint stok, pola sama)
    ↓
Task D (verifikasi penuh) 