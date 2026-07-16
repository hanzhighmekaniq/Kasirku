# Audit Lengkap: Kasir Mode Retail — Frontend + Backend

## Temuan Bug & Masalah

---

### 🔴 BUG 1: `Filters` Button — Dead UI
**File:** `RetailKasir.jsx` (line ~42)

Tombol ada, tidak ada `onClick`, tidak ada state `showFilters`. Kasir klik → tidak ada respon.

---

### 🔴 BUG 2: Stok frontend stale setelah transaksi sukses
**File:** `useKasir.js`

Setelah `clearCart()` transaksi sukses, `products` prop dari server tidak berubah. Kalau toko jual barang stok 2, setelah transaksi ProductCard masih tampil stok 2. Scan barcode barang yang sama bisa masuk keranjang lagi karena stok lokal tidak dikurangi.

`products` di `useKasir` langsung dari props — tidak ada local state. Harus ada `localProducts` state yang dikurangi post-transaksi.

---

### 🔴 BUG 3: `handleBarcodeScan` pakai `alert()` langsung
**File:** `useKasir.js`

```js
alert('Produk dengan barcode "' + barcode + '" tidak ditemukan');
```

`alert()` browser memblokir thread, menutup scanner, dan tampilan tidak konsisten dengan `StockAlertModal` yang sudah ada. Harus pakai state modal yang sama.

---

### 🔴 BUG 4: `console.log` debug masih aktif di production
**File:** `useKasir.js`

```js
console.log("[Scan] Barcode:", barcode);
console.log("[Scan] Produk ketemu:", product.name);
console.log("[Scan] Variant ketemu:", ...);
console.log("[Scan] Packaging unit ketemu:", ...);
console.log("[Scan] Tidak ketemu");
```

5 console.log aktif. Ini bocor info transaksi ke console user.

---

### 🔴 BUG 5: `quick add customer` pakai `alert()` saat gagal
**File:** `KasirLayout.jsx`

```js
} catch (err) { alert("Gagal: " + (err.response?.data?.message || err.message)); }
```

Harus pakai toast/notifikasi yang sudah ada atau minimal state error inline.

---

### 🔴 BUG 6: `handleConfirmPayment` — validasi delivery pakai `alert()`
**File:** `useKasir.js`

Beberapa validasi pre-submit:
```js
alert("Alamat pengiriman wajib diisi...");
alert("Nama penerima wajib diisi...");
```

Tidak konsisten dengan pola `missingRequiredField` yang sudah dibuat dengan benar untuk mode lain.

---

### 🔴 BUG 7: Diskon melebihi subtotal → `grandTotal` negatif mungkin
**File:** `useKasir.js`

```js
const grandTotal = Math.max(0, subtotal - totalPromoDisc - cartPromoDiscount - Number(discount) + Number(tax) + ...);
```

`Math.max(0, ...)` sudah ada. **Namun**, `discount` di payload dikirim ke backend apa adanya. Backend tidak validasi `discount_amount <= subtotal`. Kalau kasir input Rp 999.999.999 → grandTotal di backend bisa sangat negatif → `paid_amount < grandTotal` dengan nilai negatif = chaos di laporan.

**Backend fix diperlukan:** `'discount_amount' => 'nullable|numeric|min:0|max:'.$subtotal`

---

### 🔴 BUG 8: `order_type` "wholesale" dikirim ke backend tapi tidak divalidasi
**File:** `KasirController.php` — `store()` validation

`'order_type' => 'required|string|max:30'` — validasi hanya `max:30`. Backend menerima `wholesale` tapi tidak ada handling khusus, tidak ada validasi customer wajib untuk wholesale. Di `missingRequiredField` (useKasir.js) juga tidak ada guard untuk `wholesale`.

---

### 🟠 BUG 9: Tier price tidak menyertakan `tierApplied` ke cart item
**File:** `useKasir.js` — `addToCart`

`getTierPrice()` dipakai dan hasilnya masuk `effectivePrice`, tapi tidak disimpan `tierApplied: matched_tier` ke newItem. CartRow tidak tahu bahwa harga ini hasil tier. Tidak ada feedback visual ke kasir.

---

### 🟠 BUG 10: `changeQty` mengubah harga tier item tapi tidak update `price` di payload
**File:** `useKasir.js` — `handleConfirmPayment`

Payload item:
```js
price: Number(product_sell_price(c)),
```

`product_sell_price(c)` mengembalikan harga **base** dari produk, bukan harga tier yang sedang berlaku di cart. Artinya backend menyimpan harga salah — struk dan laporan menampilkan harga base, padahal kasir bayar harga tier.

**Ini bug kritis.** Pendapatan toko salah tercatat.

---

### 🟠 BUG 11: `clearCart` reset `orderType` ke index 0
**File:** `useKasir.js`

```js
setOrderType(orderOpts[0].v);
```

Ini reset ke "Ambil" setiap selesai transaksi. Kalau kasir sedang mode grosir lagi-lagi, setiap selesai harus pilih Grosir lagi. UX buruk untuk toko grosir aktif.

---

### 🟠 BUG 12: `ReceiptModal` tidak ada tombol print yang prominent
**File:** ReceiptModal (tidak terbaca penuh tapi konfirm dari konteks)

Kasir retail sangat butuh cetak struk fisik. Tidak ada `window.print()` call atau tombol cetak yang jelas.

---

### 🟡 MASALAH 13: Diskon hanya format Rp, tidak ada %
**File:** `KasirLayout.jsx` — totals section, `useKasir.js`

Input diskon menerima angka Rp mentah. Untuk retail kasir sering negosiasi "kasih diskon 10%". Harus ada toggle Rp/%.

---

### 🟡 MASALAH 14: Catatan per-item tidak bisa diedit dari CartRow
**File:** `CartRow.jsx`

Catatan item hanya dari ModifierModal. Untuk produk tanpa modifier, kasir tidak bisa tambah catatan dari CartRow. Buka modal baru hanya untuk catatan = friction tinggi.

---

### 🟡 MASALAH 15: `wholesale` order type — tidak ada behavior berbeda
**File:** `RetailKasir.jsx`, `KasirLayout.jsx`, `useKasir.js`

Tab "Grosir" ada di order type selector, tapi:
- Tidak ada customer required
- Tidak ada badge/indikator visual
- Tidak ada info tier price otomatis
- Backend tidak tau ini wholesale

---

### 🟡 MASALAH 16: Backend `store()` — `price` per item tidak divalidasi terhadap product
**File:** `KasirController.php`

`'items.*.price' => 'required|numeric|min:0'` — kasir bisa kirim harga Rp 1 untuk produk seharga Rp 100.000. Tidak ada validasi minimum price relatif terhadap `product.sell_price`. Ini celah manipulasi harga.

---

### 🟡 MASALAH 17: Keyboard shortcut tidak lengkap
**File:** `KasirLayout.jsx`

- `Enter` untuk buka PaymentModal: belum ada
- `Escape` untuk tutup PaymentModal: belum ada
- Tanda `⏎` ada di tombol Bayar tapi tidak ada handler

---

### 🟡 MASALAH 18: Barcode scan tidak clear search field setelah berhasil
**File:** `useKasir.js` — `handleBarcodeScan`

Setelah scan berhasil, `k.search` tidak dikosongkan. Search field masih berisi barcode string setelah produk masuk cart.

---

### 🟢 MASALAH 19: `storeFeatureSettings` tidak dipass ke `RetailKasir`
**File:** `KasirController.php` index()

`storeFeatureSettings` dikirim via `HandleInertiaRequests` sebagai shared prop (bukan dari `Inertia::render`). Itu benar. Tapi cash rounding ada karena `useKasir` menerima `storeFeatureSettings = {}` sebagai prop langsung. Cek apakah ini double-sent atau hanya dari shared props.

---

### 🟢 MASALAH 20: `products` di props belum include `barcode` field eksplisit
**File:** `KasirController.php` — products query

Query pakai `.get()` tanpa select spesifik — semua kolom ikut. Ini tidak efisien untuk toko 1000+ produk. Perlu explicit select yang mencakup `barcode`, `sku`, `sell_price`, `track_stock`, `stock` (computed), dll.

---

## Planning & Task List Urut

---

### FASE 1 — Critical Bugs (kerjakan duluan, bisa break production)

**T1 — Fix: `price` payload kirim harga cart bukan base price**
- File: `useKasir.js` — `handleConfirmPayment`
- Ubah `price: Number(product_sell_price(c))` → `price: Number(c.price)` (yang sudah include tier/override)
- Test: transaksi grosir dengan tier price → struk harga benar

**T2 — Fix: Stok frontend update setelah transaksi**
- File: `useKasir.js`
- Tambah `const [localProducts, setLocalProducts] = useState(products)` — ganti `products` → `localProducts` di semua tempat (filtered, addToCart, changeQty, dll)
- Setelah transaksi sukses, kurangi stok di `localProducts` berdasarkan cart
- Test: jual 5 pcs stok 5 → ProductCard langsung HABIS tanpa reload

**T3 — Fix: Validasi diskon backend tidak bisa melebihi grandTotal**
- File: `KasirController.php` — store() validation
- Tambah validasi `discount_amount` max
- Test: kirim diskon > subtotal → 422

**T4 — Fix: Hapus semua `console.log` di useKasir.js**
- File: `useKasir.js`
- 5 baris console.log

---

### FASE 2 — Bug UX yang terlihat kasir

**T5 — Fix: Ganti semua `alert()` dengan modal/toast**
- Files: `useKasir.js`, `KasirLayout.jsx`
- Barcode tidak ditemukan → state modal (sama dengan `stockAlert`)
- Quick add customer gagal → error inline di form
- Validasi delivery → masukkan ke `missingRequiredField` pattern

**T6 — Fix: Tier price indicator di CartRow**
- Files: `useKasir.js` — addToCart, `CartRow.jsx`
- Simpan `tierLabel` ke cart item
- Tampilkan badge kecil "Tier X+" di CartRow

**T7 — Fix: Tombol Filters wiring**
- File: `RetailKasir.jsx`
- State `showFilters` + panel toggle dengan opsi: "Stok ada saja" + sort A-Z/harga
- Update `filtered` useMemo di useKasir untuk terima filter params

**T8 — Fix: Keyboard shortcuts lengkap**
- File: `KasirLayout.jsx`
- `Enter` → buka PaymentModal jika cart tidak kosong & shift aktif
- `Escape` → tutup PaymentModal

---

### FASE 3 — Feature Retail Wholesale

**T9 — Feature: Wholesale customer required**
- Files: `useKasir.js` — missingRequiredField, `KasirLayout.jsx`
- Tambah: `if (isRetail && orderType === "wholesale" && !selectedCustomer) return "Pilih pelanggan grosir dulu"`
- Badge "GROSIR" di cart header saat mode wholesale

**T10 — Feature: Wholesale backend handling**
- File: `KasirController.php`
- Tambah `wholesale` ke allowed order_types untuk retail
- Validasi: wholesale + tanpa customer → 422

**T11 — Feature: clearCart tidak reset orderType**
- File: `useKasir.js`
- Hapus `setOrderType(orderOpts[0].v)` dari clearCart
- OrderType tetap sama setelah transaksi selesai

---

### FASE 4 — UX Improvements

**T12 — Feature: Diskon % toggle**
- Files: `KasirLayout.jsx`, `useKasir.js`
- State `discountType: 'rp' | 'pct'`
- Kalkulasi: pct → `subtotal * (discount/100)`
- Kirim ke backend tetap sebagai `discount_amount` dalam Rp (kalkulasi di frontend)

**T13 — Feature: Catatan per-item inline di CartRow**
- Files: `CartRow.jsx`, `useKasir.js`
- State `editingNote` di CartRow
- Handler `onNoteChange(cartId, note)` di useKasir

**T14 — Feature: Print button di ReceiptModal**
- File: `ReceiptModal.jsx`
- Tombol "🖨️ Cetak" → `window.print()` dengan CSS `@media print`

**T15 — Fix: Barcode scan kosongkan search field setelah berhasil**
- File: `useKasir.js` — handleBarcodeScan
- `setSearch("")` setelah produk ketemu dan masuk cart

---

### FASE 5 — Backend & Performance

**T16 — Fix: Products query explicit select + optimasi**
- File: `KasirController.php`
- Tambah explicit select ke products query
- Pastikan `barcode` kolom ikut ter-select

**T17 — Fix: Price validation per item**
- File: `KasirController.php` — store() validation
- Pertimbangkan `items.*.price` minimal misal `min:0` sudah ada, tapi perlu batas bawah relative
- Atau: server recalculate price dari product, flag jika deviasi >X%

**T18 — Test Coverage**
- File: `tests/Feature/RetailKasirTest.php`
- Test cases:
  - Transaksi retail normal → sukses, stok berkurang
  - Transaksi dengan tier price → harga benar di `sale_items`
  - Transaksi wholesale tanpa customer → 422
  - Transaksi wholesale dengan customer → sukses
  - Diskon melebihi subtotal → 422 atau capped
  - Idempotency key duplikat → return existing sale
  - Barcode scan tidak ditemukan → tidak error 500

---

## Definition of Done

Kasir retail selesai ketika:

| Checklist | Keterangan |
|---|---|
| ✅ Tidak ada `alert()` browser | Semua feedback pakai modal/state |
| ✅ Tidak ada `console.log` | Clean production code |
| ✅ Stok real-time | Post-transaksi ProductCard langsung update |
| ✅ Harga tier benar di struk | `sale_items.price` = harga tier, bukan base |
| ✅ Wholesale punya behavior | Customer required, badge, backend validate |
| ✅ Tombol Filters fungsional | Filter stok + sort |
| ✅ Keyboard shortcut | Enter bayar, Esc tutup modal |
| ✅ Diskon % support | Toggle Rp/% di totals |
| ✅ Print receipt | Tombol cetak di ReceiptModal |
| ✅ Backend price validation | Diskon & harga tidak bisa abuse |
| ✅ Test coverage | Semua path tercover Pest test |
| ✅ `php artisan test --compact` | Zero failures |