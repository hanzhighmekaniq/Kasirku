# Plan: Payment URL Routing — `/app/kasir/payment/{sale_no}`

## Goal
Buat route Inertia baru `GET /kasir/payment/{sale_no}` agar user bisa buka payment session langsung via URL (misal: `/app/kasir/payment/SL-20260725-001`). Refresh/deep-link jadi aman karena data transaksi tersimpan di URL. Flow kasir biasa (`/app/kasir`) tidak berubah.

---

## Struktur Existing (Sebelum)

```
GET /kasir                           → KasirController@index
  → Inertia::render('Admin/Kasir/modes/RetailKasir', [...props, pendingSale])
    → KasirLayout.jsx (AuthenticatedLayout wrapper)
      → useKasir(props) hook
        → conditional showPayment → PaymentView (full-page takeover)

POST /kasir/start                    → KasirController@start   (create pending sale)
POST /kasir/finalize                 → KasirController@finalize (complete sale)
POST /kasir/cancel-pending/{sale}    → KasirController@cancelPending
```

---

## Perubahan yang Dibutuhkan

### 1. Route Baru — `routes/web.php`

Tambahkan route **di luar** group kasir utama agar tidak bentrok dengan route seperti `/kasir/split/{sale}`:

```php
// Setelah group kasir utama
Route::get('/kasir/payment/{saleNo}', [KasirPaymentController::class, 'show'])
    ->middleware(['auth', 'permission:sale.view'])
    ->name('kasir.payment.show');
```

Catatan: route ini pakai controller baru karena butuh logika spesifik untuk payment view.

### 2. Controller Baru — `KasirPaymentController`

Buat file baru: `app/Http/Controllers/Admin/KasirPaymentController.php`

Method `show(Request $request, string $saleNo)`:
- Ambil store scope dari `$this->storeScope()` (reuse HasStoreScope trait)
- Lookup Sale WHERE `store_id`, `status = 'pending'`, `sale_no = $saleNo`
- Jika tidak ada → abort 404
- Build semua data yang sama persis dengan `KasirController@index`:
  - Products (dengan stocks, variants, packagingUnits, priceTiers, recipes)
  - Categories
  - Payment methods (active)
  - Promotions
  - Initial customers
  - Tables
  - Today's sales/history
  - Store type + posMode
  - PG methods (active)
  - Active shift
  - Employees
  - Receipt footer
- Override `pendingSale` data dari sale yang ditemukan
- Cek juga `pendingPgTransaction` untuk sale tersebut
- Render page component sesuai `storeType` (sama seperti KasirController)

Data `pendingSale` yang dikirim:
```php
'pendingSale' => [
    'sale_id' => $sale->id,
    'sale_no' => $sale->sale_no,
    'grand_total' => (float) $sale->grand_total,
    'items' => $sale->items->map(fn ($i) => [
        'productId' => $i->product_id,
        'variantId' => $i->variant_id,
        'quantity' => (float) $i->quantity,
        'price' => (float) $i->price,
        'name' => $i->product?->name ?? 'Item',
    ])->toArray(),
],
'pendingPgTransaction' => $pendingPg ? buildPgProp($pendingPg) : null,
```

### 3. Frontend — `useKasir.js` modification

Update logic detection sumber data:

```javascript
export default function useKasir(props) {
    const { pendingSale, pendingPgTransaction, initialPgTransaction } = props;
    
    // Deteksi apakah datang dari payment route (URL mengandung sale_no)
    const isFromPaymentRoute = !!(pendingSale?.sale_id && pendingPgTransaction);

    const [showPayment, setShowPayment] = useState(
        isFromPaymentRoute ? true : !!pendingSale
    );
    const [resumeSaleId, setResumeSaleId] = useState(
        pendingSale?.sale_id || null
    );
    const [resumeSaleNo, setResumeSaleNo] = useState(
        pendingSale?.sale_no || null
    );

    // Restore cart from pending sale items on mount (sudah ada, tetap pertahankan)
    useEffect(() => {
        if (pendingSale?.items?.length) {
            const restoredCart = pendingSale.items.map((item, i) => ({
                cartId: i + 1,
                key: `${item.productId}-${item.variantId || 0}-0-[]`,
                productId: item.productId,
                variantId: item.variantId || null,
                name: item.name,
                price: item.price,
                qty: item.quantity,
                modifiers: [],
                note: '',
            }));
            setCart(restoredCart);
            cartIdSeqRef.current = restoredCart.length;
        }
    }, [pendingSale]);

    // Auto-show payment jika dari payment route
    useEffect(() => {
        if (isFromPaymentRoute && pendingSale) {
            setShowPayment(true);
        }
    }, [isFromPaymentRoute, pendingSale]);
    
    ...
}
```

Penjelasan:
- Jika ada `pendingPgTransaction` di props → berarti user navigasi langsung ke `/kasir/payment/{code}` → auto tampil PaymentView
- Cart restore dari `pendingSale.items` sudah ada di code saat ini → otomatis jalan juga
- `resumeSaleId` sudah terisi → PaymentView skip `handleStartSale`

### 4. Frontend — `PaymentView.jsx` modification

Sedikit adjustment di logic `useEffect` yang auto-call `startSale()`:

```javascript
// Di PaymentView.jsx — pre-create sale on mount
useEffect(() => {
    if (!showPayment) return;
    if (k.successData || successData) return;
    if (saleId) return; // SALE ALREADY EXISTS —skip auto-startSale

    // TAMBAHAN: jika resumeSaleId sudah ada, jangan buat sale baru
    if (k.resumeSaleId) return; // Dari payment route

    if (!cart || cart.length === 0) return;
    startSale();
}, [showPayment, k.successData, successData, cart, saleId, k.resumeSaleId]);
```

Ini penting: ketika dari `/kasir/payment/{code}`, sale sudah ada di DB → jangan call `handleStartSale` lagi.

### 5. Navigasi — Link dari Komponen Lain (Opsional Nanti)

Nanti bisa ditambahkan komponen untuk share/deep-link link payment URL:
- Dari halaman riwayat transaksi → "Open Payment" button
- Dari notifikasi → deep link ke `/kasir/payment/TRA-XXX`

Tidak termasuk dalam plan ini, boleh ditambahkan sebagai phase 2.

---

## Ringkasan File yang Berubah/Berdiri Baru

| File | Aksi | Perubahan |
|------|------|-----------|
| `routes/web.php` | Edit | Tambah route `GET /kasir/payment/{saleNo}` |
| `app/Http/Controllers/Admin/KasirPaymentController.php` | **BARU** | Controller baru untuk payment route |
| `resources/js/Pages/Admin/Kasir/useKasir.js` | Edit | Auto-detect payment route, auto showPayment |
| `resources/js/Pages/Admin/Kasir/components/PaymentView.jsx` | Edit kecil | Skip `handleStartSale` jika `resumeSaleId` sudah ada |

---

## Order Eksekusi (Step-by-step)

### Phase 1: Backend
1. Buat `KasirPaymentController.php` dengan method `show(Request $request, string $saleNo)`
2. Tambah route `GET /kasir/payment/{saleNo}` di `routes/web.php` (setelah group kasir utama, di middleware auth + permission)
3. Pastikan controller load semua data yang sama persis seperti `KasirController@index`
4. Filter pending sale by `sale_no` + `store_id` + `status = 'pending'`
5. Include `pendingSale` dan `pendingPgTransaction` sebagai shared props ke frontend

### Phase 2: Frontend
6. Update `useKasir.js` untuk detect source dari payment route:
   - Check: `pendingPgTransaction` hadir → berarti dari payment route
   - Set `showPayment = true` otomatis
   - Cart restore dari `pendingSale.items` (sudah ada logic-nya)
7. Update `PaymentView.jsx`: skip auto `handleStartSale` jika `resumeSaleId` sudah diset
8. Test flow lengkap:
   - Buka `/kasir` → tambah item → klik bayar → POST `/kasir/start` → tampil payment view
   - Buka `/kasir/payment/SL-YYYYMMDD-NNN` langsung → load sale → restore cart → tampil payment view
   - Refresh di halaman payment → state pulih dari `pendingSale` di backend
   - Finalize → sale completed → kembali ke kasir index

### Phase 3: Validation & Polish
9. Add 404 handler jika sale_no tidak ditemukan atau sudah completed
10. Add 403 handler jika user tidak punya akses ke sale tersebut (bukan store mereka)
11. Pastikan semua feature flags (promo, shift, payment_gateway) tetap di-check sama seperti KasirController

---

## Trade-off yang Dipertimbangkan

| Aspek | Pertimbangan | Keputusan |
|-------|-------------|-----------|
| Controller baru vs reusing KasirController | Duplikasi code vs clean separation | **Controller baru** — payment route punya concern berbeda (load single sale vs full dashboard) |
| Inertia render vs API redirect | Inertia → full page reload vs SPA nav | **Inertia render** — semua data di-load server-side, lebih aman untuk recovery |
| Sale lookup by ID vs sale_no | ID lebih secure, sale_no lebih human-friendly | **sale_no** — mudah diketik/dibaca, tetap protected by store scope |
| Auto-show payment vs manual trigger | UX langsung payment vs control user | **Auto show** — karena user explicitly navigasi ke `/kasir/payment/{code}`, intent-nya jelas mau bayar |
| Prop detection source | Bagaimana kenalai dari payment route vs dari kasir index? | **pendingPgTransaction** — hanya payment route yang kirim ini + pendingSale sekaligus |
