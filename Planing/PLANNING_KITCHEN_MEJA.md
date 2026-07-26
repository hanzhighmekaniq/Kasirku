Ringkasan Masalah yang Harus Diselesaikan
#	Masalah
1	Meja tidak pernah dibebaskan otomatis setelah bayar
2	activeSale() query status salah (processing tidak pernah ada)
3	Kitchen queue di FnBKasir.jsx adalah mock data hardcoded
4	FnB order via PG (QRIS/e-wallet) kitchen_status = null, tidak masuk kitchen
5	guest_count tidak dikirim ke backend
6	delivery_platform tidak dikirim ke backend
7	delivery_platform / deliveryOrderNo state orphaned di useKasir
8	Table tidak load active_sale data — floor map tidak tahu order mana di meja mana
Task 1 — Fix CafeTable::activeSale() Model
File: app/Models/CafeTable.php
Masalah: Query cari status pending/processing — tapi FnB sales status lifecycle adalah draft → completed (atau pending saat PG). Tidak pernah ada processing.
Fix:
// SEKARANG (salah):
public function activeSale(): ?Sale
{
    return $this->sales()
        ->whereIn('status', ['pending', 'processing'])
        ->latest()
        ->first();
}

// SEHARUSNYA:
public function activeSale(): ?Sale
{
    return $this->sales()
        ->whereNotIn('status', ['completed', 'cancelled', 'voided'])
        ->latest()
        ->first();
}

// Atau lebih eksplisit untuk FnB:
public function hasActiveOrder(): bool
{
    return $this->sales()
        ->whereNotIn('status', ['completed', 'cancelled', 'voided'])
        ->exists();
}
Task 2 — Fix KasirController::store() — Table & Kitchen Status
File: app/Http/Controllers/Admin/KasirController.php
2A. Auto-set kitchen_status untuk SEMUA FnB orders (termasuk PG)
Masalah: Kondisi $saleStatus !== 'pending' mengecualikan PG orders dari dapat kitchen_status = 'pending'.
Fix — selalu set kitchen_status untuk FnB:
// SEKARANG (salah — skip PG orders):
if (in_array($storeTypeCode, ['fnb']) && $saleStatus !== 'pending') {
    $sale->update(['kitchen_status' => 'pending']);
}

// SEHARUSNYA (selalu set untuk FnB):
if (in_array($storeTypeCode, ['fnb'])) {
    $sale->update(['kitchen_status' => 'pending']);
}
// Kitchen harus tahu order masuk SEBELUM dibayar,
// bukan setelah. Pelanggan order dulu, baru bayar.
2B. Handle guest_count dan delivery_platform
Tambah ke validated fields:
'guest_count'       => 'nullable|integer|min:1',
'delivery_platform' => 'nullable|string|max:50',
'delivery_order_no' => 'nullable|string|max:100',
Set saat create sale:
$sale->update([
    'guest_count'       => $validated['guest_count'] ?? null,
    'delivery_platform' => $validated['delivery_platform'] ?? null,
    // delivery_order_no bisa disimpan di sale notes atau field baru
]);
2C. Auto-free table setelah sale selesai
Di method finalize() / completeSale() / webhook PG callback — tambah:
// Setelah sale status = 'completed':
if ($sale->table_id) {
    CafeTable::where('id', $sale->table_id)
        ->update(['status' => 'available']);
}
Juga di cancelSale() / void:
if ($sale->table_id) {
    // Cek apakah ada active order lain di meja ini
    $hasOtherActiveOrders = Sale::where('table_id', $sale->table_id)
        ->where('id', '!=', $sale->id)
        ->whereNotIn('status', ['completed', 'cancelled', 'voided'])
        ->exists();

    if (!$hasOtherActiveOrders) {
        CafeTable::where('id', $sale->table_id)
            ->update(['status' => 'available']);
    }
}
2D. Load active_sale saat render floor map
Di KasirController::index(), tambah load data meja beserta order aktifnya:
$tables = CafeTable::where('store_id', $storeId)
    ->where('branch_id', $branchId)
    ->where('is_active', true)
    ->with(['activeSale' => function ($q) {
        $q->select('id', 'table_id', 'sale_no', 'kitchen_status', 'created_at', 'grand_total');
    }])
    ->orderBy('table_number')
    ->get();
Task 3 — Fix KasirController — PG Payment Callback
File: app/Http/Controllers/Admin/KasirController.php (method finalizePayment atau PG webhook handler)
Masalah: Setelah PG confirmed, tidak ada yang set kitchen_status = 'pending'.
Fix — di method yang handle PG confirmation:
// Setelah PG payment confirmed dan sale status diupdate:
if ($sale->store->store_type === 'fnb' && is_null($sale->kitchen_status)) {
    $sale->update(['kitchen_status' => 'pending']);
}
Task 4 — Fix useKasir.js — Submit Payload FnB
File: resources/js/Pages/Admin/Kasir/useKasir.js
4A. Tambah guest_count ke payload:
Cari handleStartSale atau fungsi yang build payload, tambah:
guest_count: guestCount ?? 1,  // state sudah ada, tinggal include di payload
4B. Fix delivery_platform dan deliveryOrderNo:
Sekarang kedua state ini orphaned — tidak masuk payload. Fix:
// Di payload handleStartSale:
...(orderType === 'delivery' && {
    delivery_platform:  deliveryPlatform,   // "GoFood", "GrabFood", dll
    delivery_order_no:  deliveryOrderNo,    // nomor order dari platform
    delivery_address:   deliveryAddress,
}),
Pastikan setDeliveryOrderNo dan setDeliveryPlatform di-expose dari useKasir ke FnBKasir.jsx.
4C. Fix bug setNotes → setNote:
// SEKARANG (bug):
setNotes('')

// SEHARUSNYA:
setNote('')
Task 5 — Fix FnBKasir.jsx — Kitchen Queue Widget (Real Data)
File: resources/js/Pages/Admin/Kasir/modes/FnBKasir.jsx
Masalah: kitchenQueue adalah mock data hardcoded.
Fix: Sambungkan ke data real via Inertia prop atau polling API.
Opsi A — Via Inertia prop (lebih clean):
Di KasirController::index(), tambah:
'kitchenQueue' => Sale::where('store_id', $storeId)
    ->where('branch_id', $branchId)
    ->whereIn('kitchen_status', ['pending', 'cooking', 'ready'])
    ->with('table:id,table_number', 'items:sale_id,quantity,product_id', 'items.product:id,name')
    ->orderBy('created_at')
    ->limit(10)
    ->get()
    ->map(fn($s) => [
        'table'  => $s->table?->table_number ?? ($s->order_type === 'takeaway' ? 'TA' : 'DEL'),
        'status' => $s->kitchen_status,
        'items'  => $s->items->map(fn($i) => "{$i->product->name} ×{$i->quantity}")->join(', '),
        'time'   => $s->created_at->diffForHumans(short: true),
        'tone'   => match($s->kitchen_status) {
            'pending' => 'brand',
            'cooking' => 'warn',
            'ready'   => 'success',
            default   => 'muted',
        },
    ]),
Di FnBKasir.jsx:
// HAPUS mock data:
// const kitchenQueue = [...hardcoded...]

// GANTI dengan prop dari Inertia:
const { kitchenQueue = [] } = usePage().props;
Opsi B — Polling API (jika tidak mau ubah controller index):
const [kitchenQueue, setKitchenQueue] = useState([]);

useEffect(() => {
    const fetchQueue = () => {
        router.reload({ only: ['kitchenQueue'] });
    };
    const interval = setInterval(fetchQueue, 15000); // 15s polling
    fetchQueue(); // initial load
    return () => clearInterval(interval);
}, []);
Saran: Opsi A — lebih efisien, tidak perlu extra request, data sudah ada saat POS load.
Task 6 — Fix FnBKasir.jsx — Floor Map dengan Active Order Info
File: resources/js/Pages/Admin/Kasir/modes/FnBKasir.jsx
Sekarang floor map hanya tahu status (available/occupied/reserved). Dengan data dari Task 2D, bisa tampilkan info order di meja:
// Di setiap meja card di floor map:
<div className={`table-card ${getTableColorClass(table.status)}`}>
    <p className="font-bold">{table.table_number}</p>
    <p className="text-xs">{table.capacity} org</p>
    {table.active_sale && (
        <div className="mt-1 text-xs text-muted-foreground">
            <p>{table.active_sale.sale_no}</p>
            <KitchenStatusBadge status={table.active_sale.kitchen_status} />
        </div>
    )}
</div>
Task 7 — Fix FnBKasir.jsx — Guest Count Input
File: resources/js/Pages/Admin/Kasir/modes/FnBKasir.jsx
Tambah input guest count di modal/drawer saat memilih meja untuk dine-in:
{orderType === 'dine_in' && (
    <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-foreground">Jumlah Tamu</label>
        <div className="flex items-center gap-2">
            <button onClick={() => setGuestCount(Math.max(1, guestCount - 1))}
                className="h-8 w-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted">
                −
            </button>
            <span className="w-8 text-center font-semibold">{guestCount}</span>
            <button onClick={() => setGuestCount(guestCount + 1)}
                className="h-8 w-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted">
                +
            </button>
        </div>
    </div>
)}
Urutan Implementasi
Task 1  → CafeTable model — fix activeSale()
Task 2A → KasirController — fix kitchen_status untuk semua FnB orders
Task 2B → KasirController — tambah guest_count, delivery_platform ke validated
Task 2C → KasirController — auto-free table setelah sale completed/cancelled
Task 2D → KasirController — load active_sale di floor map data
Task 3  → KasirController — PG callback set kitchen_status
Task 4A → useKasir.js — submit guest_count
Task 4B → useKasir.js — submit delivery_platform + delivery_order_no
Task 4C → useKasir.js — fix bug setNotes → setNote
Task 5  → FnBKasir.jsx — kitchen queue widget real data
Task 6  → FnBKasir.jsx — floor map tampilkan active order info
Task 7  → FnBKasir.jsx — guest count input
File yang Diubah
No	File
1	app/Models/CafeTable.php
2	app/Http/Controllers/Admin/KasirController.php
3	resources/js/Pages/Admin/Kasir/useKasir.js
4	resources/js/Pages/Admin/Kasir/modes/FnBKasir.jsx
Test Checklist
Setelah implementasi, verifikasi:
- Buat order FnB dine-in → meja berubah occupied ✓
- Bayar order tunai → meja otomatis kembali available ✓
- Buat order FnB via QRIS → kitchen_status = 'pending' setelah PG confirm ✓
- Kitchen Display menampilkan order yang baru dibuat ✓
- Kitchen queue widget di POS menampilkan data real ✓
- Floor map menampilkan info order di meja yang occupied ✓
- Guest count tersimpan di database ✓
- Delivery platform (GoFood dll) tersimpan di database ✓
- Cancel/void order → meja kembali available ✓