
**Implementation Plan — Retail Kasir: New ProductCard + RetailProductModal**

**Problem Statement:**
Tampilan ProductCard dan modal produk di kasir retail belum mengikuti desain `index1.html` yang lebih modern dan alurnya belum sesuai (variant → unit → qty → notes → subtotal real-time dalam satu modal). Fokus sepenuhnya ke retail, folder dirapikan.

**Requirements:**
- Satu modal adaptif (`RetailProductModal`) menggantikan `VariantModal` + `UnitModal`
- `ProductCard.jsx` diupdate tampilannya persis `index1.html`
- Produk **Has Variant**: modal tampilkan Choose Variant → setelah pilih, jika variant/produk punya packaging units tampilkan Choose Unit → Qty → Notes
- Produk **In Stock**: modal langsung Choose Unit (jika ada) → Qty → Notes
- Expand dropdown per-variant untuk lihat harga grosir (tier)
- Subtotal real-time dengan logika tier price
- Folder `components/retail/` untuk file khusus retail, non-retail dipindah/diisolasi

**Proposed Solution:**
Reorganisasi folder, update `ProductCard.jsx`, buat `RetailProductModal.jsx`, update `RetailKasir.jsx` dan `Kasir.jsx` untuk pakai modal baru.

---

**Task Breakdown:**

**Task 1: Reorganisasi folder — pisahkan komponen retail**
- Buat subfolder `components/retail/` untuk komponen khusus retail
- Pindahkan/isolasi `VariantModal.jsx` dan `UnitModal.jsx` ke `components/legacy/` (tidak dihapus dulu, dikunci dari retail)
- File yang tetap di `components/` adalah yang shared: `CartRow`, `PaymentModal`, `ReceiptModal`, `HistoryPanel`, `StockAlertModal`, `IconBtn`, `helpers`, `ModeSpecificPanel`
- Demo: folder struktur jelas, tidak ada yang broken

**Task 2: Update `ProductCard.jsx` — tampilan persis `index1.html`**
- Gambar aspek `4/3` (bukan square)
- Badge `Has Variants` (biru) atau `In Stock` (hijau) di pojok kiri atas gambar
- Tombol `+` rounded di pojok kanan bawah gambar (hover scale up, bg dark)
- Info: nama produk, SKU, harga "Starting from X" untuk variant / harga flat untuk non-variant
- Hover card: `translateY(-4px)` + shadow lebih dalam
- Logic klik tombol `+`: tidak lagi buka `UnitModal` inline — cukup panggil `onClick()` saja, biarkan parent handle modal
- Demo: grid produk tampil dengan style baru persis mockup

**Task 3: Buat `RetailProductModal.jsx`**
- **Header**: thumbnail gambar + nama + SKU (sama persis `index1.html`)
- **Section Choose Variant** (conditional, hanya jika `hasActiveVariants`):
  - List variant sebagai option card dengan checkmark
  - Tiap variant punya tombol expand (chevron) untuk lihat tier pricing (harga grosir)
  - Saat expand: tampil tabel retail price + tier rows (qty+ → harga)
  - State: `selectedVariant`, `expandedVariantId`
- **Section Choose Unit** (conditional, muncul setelah variant dipilih ATAU langsung jika non-variant):
  - List packaging units sebagai option cards dengan checkmark
  - Satuan dasar selalu ada sebagai opsi pertama
  - State: `selectedUnit`
- **Section Quantity**: stepper +/- dengan input manual
- **Section Notes**: textarea opsional
- **Footer**: Subtotal real-time + Cancel + Add to Cart
- **Logika subtotal**:
  - Jika variant dipilih + unit adalah unit dasar → cek tier price berdasarkan qty (sama persis `index1.html` `updateSubtotal()`)
  - Jika pilih packaging unit → pakai harga packaging unit
  - Jika non-variant + unit dasar → cek tier product-level
- Demo: buka modal dari card, semua section muncul/hilang sesuai kondisi produk, subtotal berubah real-time

**Task 4: Integrasikan `RetailProductModal` ke `RetailKasir.jsx` dan `Kasir.jsx`**
- Di `Kasir.jsx`: tambah state `retailProductTarget`, ganti pemanggilan `setVariantTarget` / `setShowUnitModal` untuk retail mode → gunakan `setRetailProductTarget`
- Di `RetailKasir.jsx`: render `RetailProductModal` jika `retailProductTarget` ada
- Update `handleProductClick` di `useKasir.js`: jika `isRetail` → selalu pakai `RetailProductModal` (bahkan untuk produk simple sekalipun yang punya tier/unit)
- Pastikan `onConfirm` di modal memanggil `addToCart` dengan parameter yang benar (variant, packagingUnit, qty, note)
- Demo: full flow — klik produk variant → pilih variant → lihat grosir → pilih unit → atur qty → add to cart → toast; klik produk non-variant → pilih unit → qty → add to cart

**Task 5: Verifikasi logika harga & edge cases**
- Subtotal untuk variant + tier: qty naik → harga turun sesuai tier
- Subtotal untuk packaging unit: harga flat dari `packaging_unit.sell_price`
- Produk tanpa variant tanpa packaging unit: langsung qty + base price
- Tombol "Add to Cart" disabled selama variant belum dipilih (untuk produk bervariant)
- Demo: test semua 3 tipe produk, subtotal selalu akurat

