<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Concerns\HasStoreScope;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\CafeTable;
use App\Models\Customer;
use App\Models\Employee;
use App\Models\Store;
use Carbon\Carbon;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class BookingController extends Controller
{
    use HasStoreScope;

    /**
     * Durasi yang diasumsikan untuk booking tanpa jam selesai.
     * Tanpa asumsi ini rentang booking jadi tak terhingga, sehingga setiap
     * booking berikutnya di resource yang sama akan selalu dianggap bentrok.
     */
    private const DEFAULT_DURATION_HOURS = 2;

    /** Status yang berarti booking sudah tidak memesan resource lagi. */
    private const RELEASED_STATUSES = ['completed', 'cancelled', 'no_show'];

    public function index(Request $request)
    {
        [$storeId, $branchId] = $this->storeScope();
        $storeTypeCode = Store::with('storeType')
            ->find($storeId)
            ?->getRelation('storeType')
            ?->code ?? 'retail';

        $query = Booking::with(['customer:id,name', 'employee:id,name', 'branch:id,name'])
            ->where('store_id', $storeId)
            ->latest('booking_start_at');

        if ($branchId) {
            $query->where('branch_id', $branchId);
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        return Inertia::render('Admin/Bookings/Index', [
            'bookings' => $query->paginate(15)->withQueryString(),
            'filters' => $request->only('status'),
            'storeType' => $storeTypeCode,
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/Bookings/Create', $this->formOptions());
    }

    public function show(Booking $booking)
    {
        $this->ensureSameStore($booking);

        return Inertia::render('Admin/Bookings/Show', [
            'booking' => $booking->load([
                'customer:id,name,phone',
                'employee:id,name',
                'branch:id,name',
            ]),
            'table' => $this->resolveResourceLabel($booking),
        ]);
    }

    public function edit(Booking $booking)
    {
        $this->ensureSameStore($booking);

        return Inertia::render('Admin/Bookings/Edit', [
            'booking' => $booking,
            ...$this->formOptions(),
        ]);
    }

    public function store(Request $request)
    {
        [$storeId, $branchId] = $this->storeScope();

        $validated = $request->validate($this->rules());

        $this->assertResourceBelongsToStore($validated, $storeId);
        $this->assertDepositIsSane($validated);
        $this->assertNoScheduleConflict($validated, $storeId);

        $booking = $this->createWithUniqueBookingNo([
            'store_id' => $storeId,
            'branch_id' => $branchId,
            'customer_id' => $validated['customer_id'] ?? null,
            'employee_id' => $validated['employee_id'] ?? null,
            'resource_type' => $validated['resource_type'] ?? null,
            'resource_id' => $validated['resource_id'] ?? null,
            'customer_name' => $validated['customer_name'],
            'customer_phone' => $validated['customer_phone'] ?? null,
            'booking_start_at' => $validated['booking_start_at'],
            'booking_end_at' => $validated['booking_end_at'] ?? null,
            'guest_count' => $validated['guest_count'] ?? null,
            'deposit_amount' => $validated['deposit_amount'] ?? 0,
            'deposit_paid' => $validated['deposit_paid'] ?? 0,
            'status' => $validated['status'],
            'notes' => $validated['notes'] ?? null,
        ]);

        return redirect()
            ->route('admin.bookings.index')
            ->with('success', "Booking #{$booking->booking_no} berhasil dibuat.");
    }

    public function update(Request $request, Booking $booking)
    {
        [$storeId] = $this->storeScope();
        $this->ensureSameStore($booking);

        $validated = $request->validate($this->rules(isUpdate: true));

        $this->assertResourceBelongsToStore($validated, $storeId);
        $this->assertDepositIsSane($validated, $booking);
        $this->assertNoScheduleConflict($validated, $storeId, $booking);

        $booking->update($validated);

        return redirect()
            ->route('admin.bookings.index')
            ->with('success', "Booking #{$booking->booking_no} berhasil diperbarui.");
    }

    public function destroy(Booking $booking)
    {
        $this->ensureSameStore($booking);

        $booking->delete();

        // Tidak memakai back(): penghapusan dari halaman detail akan
        // mengembalikan user ke booking yang sudah tidak ada (404).
        return redirect()
            ->route('admin.bookings.index')
            ->with('success', 'Booking berhasil dihapus.');
    }

    // ── Helpers ──────────────────────────────────────────────────────────

    /**
     * Aturan validasi booking. Satu-satunya perbedaan antara membuat dan
     * mengubah adalah status akhir (completed/cancelled/no_show) yang hanya
     * masuk akal untuk booking yang sudah ada.
     *
     * @return array<string, string>
     */
    private function rules(bool $isUpdate = false): array
    {
        $statuses = $isUpdate
            ? 'pending,confirmed,checked_in,completed,cancelled,no_show'
            : 'pending,confirmed,checked_in';

        return [
            'customer_id' => 'nullable|exists:customers,id',
            'employee_id' => 'nullable|exists:employees,id',
            'resource_type' => 'nullable|string|max:30|required_with:resource_id',
            'resource_id' => 'nullable|integer|required_with:resource_type',
            'customer_name' => 'required|string|max:200',
            'customer_phone' => 'nullable|string|max:30',
            'booking_start_at' => 'required|date',
            'booking_end_at' => 'nullable|date|after:booking_start_at',
            'guest_count' => 'nullable|integer|min:1',
            'deposit_amount' => 'nullable|numeric|min:0',
            'deposit_paid' => 'nullable|numeric|min:0',
            'status' => "required|in:{$statuses}",
            'notes' => 'nullable|string|max:500',
        ];
    }

    /**
     * Pilihan yang dibutuhkan form tambah/ubah booking.
     *
     * @return array{customers: mixed, employees: mixed, tables: array, storeType: string}
     */
    private function formOptions(): array
    {
        [$storeId, $branchId] = $this->storeScope();
        $storeTypeCode = Store::with('storeType')
            ->find($storeId)
            ?->getRelation('storeType')
            ?->code ?? 'retail';

        return [
            'customers' => Customer::where('store_id', $storeId)
                ->orderBy('name')
                ->get(['id', 'name']),
            // Kolom penanda karyawan aktif bernama `status`, bukan `is_active`.
            // Query lama memakai is_active dan membuat halaman ini selalu 500.
            'employees' => Employee::where('store_id', $storeId)
                ->where('status', 'active')
                ->orderBy('name')
                ->get(['id', 'name']),
            // Resource yang bisa dipesan. Sampai sekarang hanya meja yang
            // punya tabel entitas sendiri — kamar/unit masih berupa teks bebas.
            'tables' => $this->bookableTables($storeId, $branchId, $storeTypeCode),
            'storeType' => $storeTypeCode,
        ];
    }

    /**
     * Booking hanya boleh diakses dari toko pemiliknya.
     */
    private function ensureSameStore(Booking $booking): void
    {
        [$storeId] = $this->storeScope();

        abort_if($booking->store_id !== $storeId, 403);
    }

    /**
     * Nama resource yang dipesan untuk ditampilkan di halaman detail.
     * Selain meja, resource masih berupa teks bebas sehingga tidak ada
     * entitas yang bisa dicari namanya.
     */
    private function resolveResourceLabel(Booking $booking): ?string
    {
        if ($booking->resource_type !== 'table' || ! $booking->resource_id) {
            return null;
        }

        return CafeTable::where('id', $booking->resource_id)
            ->where('store_id', $booking->store_id)
            ->value('table_number');
    }

    /**
     * Daftar meja yang bisa dipesan. Mode selain FnB/hospitality tidak punya
     * meja, jadi dikembalikan kosong supaya form tidak menampilkan picker.
     */
    private function bookableTables(int $storeId, ?int $branchId, string $storeTypeCode): array
    {
        if (! in_array($storeTypeCode, ['fnb', 'hospitality'])) {
            return [];
        }

        return CafeTable::where('store_id', $storeId)
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->where('is_active', true)
            ->orderBy('table_number')
            ->get(['id', 'table_number', 'capacity'])
            ->toArray();
    }

    /**
     * Resource yang dipesan harus benar-benar milik toko ini. Tanpa cek ini
     * ID meja toko lain bisa ditempelkan ke booking lewat request manual.
     *
     * @throws ValidationException
     */
    private function assertResourceBelongsToStore(array $validated, int $storeId): void
    {
        if (($validated['resource_type'] ?? null) !== 'table') {
            return;
        }

        $exists = CafeTable::where('id', $validated['resource_id'])
            ->where('store_id', $storeId)
            ->exists();

        if (! $exists) {
            throw ValidationException::withMessages([
                'resource_id' => 'Meja tidak ditemukan di toko ini.',
            ]);
        }
    }

    /**
     * Deposit yang dibayar tidak boleh melebihi deposit yang ditagihkan.
     *
     * @throws ValidationException
     */
    private function assertDepositIsSane(array $validated, ?Booking $existing = null): void
    {
        $amount = (float) ($validated['deposit_amount'] ?? $existing?->deposit_amount ?? 0);
        $paid = (float) ($validated['deposit_paid'] ?? $existing?->deposit_paid ?? 0);

        if ($paid > $amount) {
            throw ValidationException::withMessages([
                'deposit_paid' => 'Deposit dibayar tidak boleh melebihi deposit yang ditagihkan.',
            ]);
        }
    }

    /**
     * Tolak booking yang jadwalnya bertumpuk dengan booking lain di resource
     * yang sama. Booking tanpa jam selesai dihitung selama
     * DEFAULT_DURATION_HOURS jam sejak jam mulai.
     *
     * @throws ValidationException
     */
    private function assertNoScheduleConflict(
        array $validated,
        int $storeId,
        ?Booking $ignore = null,
    ): void {
        $resourceId = $validated['resource_id'] ?? null;

        // Booking tanpa resource tidak memesan apa pun — tidak bisa bentrok.
        if (empty($resourceId)) {
            return;
        }

        $start = Carbon::parse($validated['booking_start_at']);
        $end = ! empty($validated['booking_end_at'])
            ? Carbon::parse($validated['booking_end_at'])
            : $start->copy()->addHours(self::DEFAULT_DURATION_HOURS);

        // Ambang untuk booking lain yang jam selesainya kosong: jam selesai
        // efektifnya start + N jam, jadi ia masih bertumpuk selama mulainya
        // lebih baru dari (start kita - N jam).
        $openEndedThreshold = $start->copy()->subHours(self::DEFAULT_DURATION_HOURS);

        $conflict = Booking::where('store_id', $storeId)
            ->where('resource_type', $validated['resource_type'] ?? null)
            ->where('resource_id', $resourceId)
            ->whereNotIn('status', self::RELEASED_STATUSES)
            ->when($ignore, fn ($q) => $q->where('id', '!=', $ignore->id))
            // Dua rentang bertumpuk kalau yang satu mulai sebelum yang lain
            // selesai, DAN selesai setelah yang lain mulai.
            ->where('booking_start_at', '<', $end)
            ->where(function ($q) use ($start, $openEndedThreshold) {
                $q->where('booking_end_at', '>', $start)
                    ->orWhere(function ($q2) use ($openEndedThreshold) {
                        $q2->whereNull('booking_end_at')
                            ->where('booking_start_at', '>', $openEndedThreshold);
                    });
            })
            ->orderBy('booking_start_at')
            ->first();

        if (! $conflict) {
            return;
        }

        $jam = $conflict->booking_start_at->format('d/m/Y H:i');
        $sampai = $conflict->booking_end_at
            ? '–'.$conflict->booking_end_at->format('H:i')
            : '';

        throw ValidationException::withMessages([
            'booking_start_at' => "Jadwal bentrok dengan booking #{$conflict->booking_no} "
                ."atas nama {$conflict->customer_name} ({$jam}{$sampai}).",
        ]);
    }

    /**
     * Simpan booking dengan nomor unik.
     *
     * Nomor dibuat berurutan global karena unique constraint-nya juga global —
     * kalau diseragamkan per toko, dua toko bisa sama-sama menghasilkan
     * BK-20260726-001. Dua kasir yang menyimpan bersamaan tetap bisa merebut
     * nomor yang sama, jadi tabrakan unique ditangkap dan dicoba ulang.
     */
    private function createWithUniqueBookingNo(array $attributes): Booking
    {
        $maxAttempts = 5;

        for ($attempt = 1; $attempt <= $maxAttempts; $attempt++) {
            try {
                return Booking::create([
                    ...$attributes,
                    'booking_no' => $this->nextBookingNo(),
                ]);
            } catch (QueryException $e) {
                $isDuplicateNo = $e->getCode() === '23000'
                    && str_contains($e->getMessage(), 'booking_no');

                if (! $isDuplicateNo || $attempt === $maxAttempts) {
                    throw $e;
                }
            }
        }

        throw new \RuntimeException('Gagal membuat nomor booking unik.');
    }

    /**
     * Nomor booking berikutnya untuk hari ini.
     *
     * Urutan diambil dari potongan setelah tanda hubung terakhir, bukan tiga
     * karakter terakhir. Dengan substr(-3), booking ke-1000 menghasilkan
     * "...-1000" lalu dibaca kembali sebagai "000" sehingga nomor berikutnya
     * mengulang dari 001 dan menabrak unique constraint.
     *
     * Pengurutan juga memakai panjang lebih dulu karena urutan leksikografis
     * menempatkan "999" di atas "1000".
     */
    private function nextBookingNo(): string
    {
        $prefix = 'BK-'.now()->format('Ymd').'-';

        $last = Booking::where('booking_no', 'like', $prefix.'%')
            ->orderByRaw('LENGTH(booking_no) DESC')
            ->orderByDesc('booking_no')
            ->value('booking_no');

        $seq = $last ? ((int) Str::afterLast($last, '-')) + 1 : 1;

        return $prefix.str_pad((string) $seq, 3, '0', STR_PAD_LEFT);
    }
}
