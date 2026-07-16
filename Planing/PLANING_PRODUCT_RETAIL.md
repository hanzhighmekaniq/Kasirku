PLANNING: Variant-First Product Architecture
Overview
Ubah arsitektur produk sehingga ketika is_variant=true, semua fitur (harga, grosir, multi-satuan) nyambung ke variant, bukan ke product. Ketika is_variant=false, semua tetap nyambung ke product seperti sekarang.
Task 1: Migration — is_variant di products
File: database/migrations/xxxx_add_is_variant_to_products_table.php
- Tambah kolom is_variant (boolean, default false) ke tabel products
- Letakkan setelah is_active
Task 2: Migration — variant_id di product_price_tiers
File: database/migrations/xxxx_add_variant_id_to_product_price_tiers_table.php
- Tambah kolom variant_id (nullable FK ke product_variants, cascade delete)
- Drop unique constraint lama [product_id, min_qty]
- Tambah unique constraint baru [product_id, variant_id, min_qty]
- Data existing: variant_id = NULL (tetap product-level)
Task 3: Migration — variant_id di product_packaging_units
File: database/migrations/xxxx_add_variant_id_to_product_packaging_units_table.php
- Tambah kolom variant_id (nullable FK ke product_variants, cascade delete)
- Drop unique constraint lama [product_id, name]
- Tambah unique constraint baru [product_id, variant_id, name]
- Data existing: variant_id = NULL (tetap product-level)
Task 4: Update Model — Product.php
File: app/Models/Product.php
- Tambah is_variant ke $fillable
- Tambah 'is_variant' => 'boolean' ke casts()
- Update getTierPrice() — tambah parameter ?int $variantId = null:
- Jika $variantId ada → cek tier dengan variant_id = $variantId dulu
- Fallback ke tier dengan variant_id = NULL (product-level)
- Return null jika tidak ada tier sama sekali
Task 5: Update Model — ProductVariant.php
File: app/Models/ProductVariant.php
- Tambah relasi priceTiers() → hasMany(ProductPriceTier::class, 'variant_id')
- Tambah relasi packagingUnits() → hasMany(ProductPackagingUnit::class, 'variant_id')
- Tambah method getTierPrice(int $quantity): ?float — lookup tier dari relasi priceTiers
Task 6: Update Model — ProductPriceTier.php
File: app/Models/ProductPriceTier.php
- Tambah variant_id ke $fillable
- Tambah relasi variant() → belongsTo(ProductVariant::class, 'variant_id')
Task 7: Update Model — ProductPackagingUnit.php
File: app/Models/ProductPackagingUnit.php
- Tambah variant_id ke $fillable
- Tambah relasi variant() → belongsTo(ProductVariant::class, 'variant_id')
Task 8: Update ProductController::store()
File: app/Http/Controllers/Admin/ProductController.php
- Tambah validasi:
- 'is_variant' => 'boolean'
- 'variants' => 'nullable|array'
- 'variants.*.name' => 'required|string|max:100'
- 'variants.*.sku' => 'required|string|max:100|unique:product_variants,sku'
- 'variants.*.price' => 'required|numeric|min:0'
- 'variants.*.cost_price' => 'nullable|numeric|min:0'
- 'variants.*.barcode' => 'nullable|string|max:100'
- 'variants.*.price_tiers' => 'nullable|array'
- 'variants.*.price_tiers.*.min_qty' => 'required|integer|min:1'
- 'variants.*.price_tiers.*.price' => 'required|numeric|min:0'
- 'variants.*.packaging_units' => 'nullable|array'
- 'variants.*.packaging_units.*.name' => 'required|string|max:50'
- 'variants.*.packaging_units.*.conversion_qty' => 'required|integer|min:1'
- 'variants.*.packaging_units.*.sell_price' => 'nullable|numeric|min:0'
- 'variants.*.packaging_units.*.barcode' => 'nullable|string|max:100'
- Ubah sell_price validasi: 'required' → 'nullable' (karena variant product tidak perlu sell_price di product level)
- Simpan is_variant ke product
- Jika is_variant = true && variants ada:
- Loop variants → product->variants()->create(...)
- Per variant: simpan price_tiers dengan variant_id
- Per variant: simpan packaging_units dengan variant_id
Task 9: Update ProductController::update()
File: app/Http/Controllers/Admin/ProductController.php
- Tambah validasi variant (sama dengan store, tapi SKU unique ignore variant id)
- Update is_variant di product
- Sync variants: hapus semua variant lama, buat ulang (sama seperti pattern packaging_units sekarang)
- Sync price_tiers dan packaging_units per variant
Task 10: Update ProductController::edit()
File: app/Http/Controllers/Admin/ProductController.php
- Eager load variants + relasinya:
$product->load('packagingUnits', 'priceTiers', 'variants.priceTiers', 'variants.packagingUnits');
Task 11: Update KasirController::index()
File: app/Http/Controllers/Admin/KasirController.php
- Eager load variant tiers dan units:
'variants:id,product_id,name,sku,price,cost_price,is_active',
'variants.priceTiers',
'variants.packagingUnits',
Task 12: Frontend — Create.jsx (Form Produk)
File: resources/js/Pages/Admin/Products/Create.jsx
- Tambah is_variant: false dan variants: [] ke form data
- Di section "Harga Jual":
- Tambah checkbox "Punya Variant?" sebelum input harga
- Jika is_variant = true:
- Sembunyikan input sell_price
- Sembunyikan section "Multi-Satuan" (product-level)
- Sembunyikan section "Harga Grosir" (product-level)
- Tampilkan section "Variant" baru:
- Per variant card: Nama, SKU, Harga, Barcode
- Per variant: sub-section "Multi-Satuan" (opsional)
- Per variant: sub-section "Harga Grosir" (opsional)
- Tombol "+ Tambah Variant"
- Jika is_variant = false: tampilan normal (existing)
Task 13: Frontend — Edit.jsx (Form Edit Produk)
File: resources/js/Pages/Admin/Products/Edit.jsx
- Load is_variant dan variants (dengan nested price_tiers dan packaging_units) dari product
- Tambah logic yang sama dengan Create.jsx
- Variant yang sudah ada ditampilkan pre-filled
Task 14: Frontend — ProductCard.jsx (Badge Grosir)
File: resources/js/Pages/Admin/Kasir/components/ProductCard.jsx
- Update logika badge grosir:
const hasAnyTiers = product.price_tiers?.length > 0 ||
    (product.variants ?? []).some(v => v.price_tiers?.length > 0);
- Badge grosir tampil juga untuk produk variant (selama ada tier di salah satu variant)
Task 15: Frontend — VariantModal.jsx (Tampilkan Grosir)
File: resources/js/Pages/Admin/Kasir/components/VariantModal.jsx
- Saat variant dipilih, tampilkan info grosir jika ada:
Variant "Soto" — Rp4.500
Grosir: 12+ pcs → Rp4.000
- Perlu pass product ke modal agar bisa akses variant.price_tiers
Task 16: Frontend — useKasir.js (getTierPrice variant-aware)
File: resources/js/Pages/Admin/Kasir/useKasir.js
- Update getTierPrice(product, qty, variantId = null):
- Jika variantId ada → cek variant.price_tiers dulu
- Fallback ke product.price_tiers (variant_id = NULL)
- Update addToCart(): hapus !variant guard
// SEBELUM:
const tierPrice = (!packagingUnit && !variant && product.price_tiers?.length)
    ? getTierPrice(product, qty) : null;
// SESUDAH:
const tier = (!packagingUnit)
    ? getTierPrice(product, qty, variant?.id) : null;
- Update changeQty(): variant-aware tier recalculation
// SEBELUM:
if (product?.price_tiers?.length && !c.packagingUnitId && !c.variantId) {
    const tierPrice = getTierPrice(product, newQty);
// SESUDAH:
const hasTiers = product?.price_tiers?.length || variant?.price_tiers?.length;
if (hasTiers && !c.packagingUnitId) {
    const tierPrice = getTierPrice(product, newQty, c.variantId);
}
Task 17: Tests
File: tests/Feature/VariantProductTest.php
Test skenario:
1. Buat produk is_variant=true dengan 2 variant + grosir per variant → simpan berhasil
2. Buat produk is_variant=false dengan grosir product-level → simpan berhasil (existing behavior)
3. Product::getTierPrice(15, variantId) → return variant tier
4. Product::getTierPrice(15, variantId) fallback ke product tier jika variant tier tidak ada
5. Product::getTierPrice(15) (tanpa variant) → return product tier
Task 18: Seeder update (opsional)
File: database/seeders/DatabaseSeeder/ProductSeeder.php
- Tambah contoh produk variant (jika diperlukan untuk demo)
- Tidak wajib — bisa di-skip jika tidak perlu data demo
Task 19: Pint + Build + Test
- vendor/bin/pint --dirty --format agent
- npm run build
- php artisan migrate:fresh --seed
- php artisan test --compact
Dependency Graph
Task 1 (migration is_variant)     ─┐
Task 2 (migration tier variant_id) ├─ Task 4-7 (models)
Task 3 (migration unit variant_id) ─┘
                                      │
                              Task 8-10 (ProductController)
                              Task 11 (KasirController)
                                      │
                              Task 12-13 (Create/Edit.jsx)
                              Task 14 (ProductCard)
                              Task 15 (VariantModal)
                              Task 16 (useKasir.js)
                                      │
                              Task 17 (Tests)
                              Task 18 (Seeder)
                              Task 19 (Final)
Estimasi
Fase	Task	Estimasi
Database	1-3	±10 menit
Models	4-7	±10 menit
Backend	8-11	±20 menit
Frontend	12-16	±30 menit
Test + Final	17-19	±15 menit
Total	 	±85 menit