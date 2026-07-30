<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CustomerTier;
use App\Models\Membership;
use App\Models\Product;
use App\Models\Store;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class MembershipController extends Controller
{
    public function index()
    {
        $storeId = session('current_store_id');
        $memberships = Membership::where('store_id', $storeId)
            ->withCount('customerMemberships')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->each->withNormalizedBenefits();

        $storeTypeCode = Store::with('storeType')->find($storeId)
            ?->getRelation('storeType')?->code;

        return Inertia::render('Admin/Memberships/Index', [
            'memberships' => $memberships,
            'benefitTypes' => $this->benefitTypesForStore($storeTypeCode),
            'products' => Product::forStore($storeId)
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name', 'sku', 'sell_price']),
            // Tier dikelola per toko, jadi pilihan di form harus datang dari DB
            // bukan dari daftar tetap.
            'customerTiers' => CustomerTier::forStore($storeId)
                ->where('is_active', true)
                ->ranked()
                ->get(['id', 'name', 'rank', 'color']),
        ]);
    }

    /**
     * Data referensi yang dibutuhkan form create/edit.
     *
     * Dikumpulkan di satu tempat supaya halaman Create dan Edit selalu menerima
     * bentuk props yang sama.
     *
     * @return array<string, mixed>
     */
    private function formProps(): array
    {
        $storeId = session('current_store_id');

        $storeTypeCode = Store::with('storeType')->find($storeId)
            ?->getRelation('storeType')?->code;

        return [
            'benefitTypes' => $this->benefitTypesForStore($storeTypeCode),
            'products' => Product::forStore($storeId)
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name', 'sku', 'sell_price']),
            'customerTiers' => CustomerTier::forStore($storeId)
                ->where('is_active', true)
                ->ranked()
                ->get(['id', 'name', 'rank', 'color']),
        ];
    }

    public function create()
    {
        return Inertia::render('Admin/Memberships/Create', $this->formProps());
    }

    public function edit(Membership $membership)
    {
        abort_unless(
            $membership->store_id === session('current_store_id'),
            404,
        );

        return Inertia::render('Admin/Memberships/Edit', array_merge(
            $this->formProps(),
            ['membership' => $membership->withNormalizedBenefits()],
        ));
    }

    public function show(Membership $membership)
    {
        abort_unless(
            $membership->store_id === session('current_store_id'),
            404,
        );

        $membership->loadCount('customerMemberships');
        $membership->withNormalizedBenefits();

        // Anggota terbaru untuk panel detail. Dibatasi supaya halaman tetap
        // ringan pada membership dengan banyak pelanggan.
        $recentMembers = $membership->customerMemberships()
            ->with('customer:id,name,code,phone')
            ->latest('start_date')
            ->limit(20)
            ->get();

        $storeId = session('current_store_id');

        return Inertia::render('Admin/Memberships/Show', [
            'membership' => $membership,
            'recentMembers' => $recentMembers,
            'stats' => [
                'total_members' => $membership->customer_memberships_count,
                'active_members' => $membership->customerMemberships()
                    ->where('status', 'active')
                    ->count(),
                'expired_members' => $membership->customerMemberships()
                    ->where('status', 'expired')
                    ->count(),
            ],
            'customerTiers' => CustomerTier::forStore($storeId)
                ->ranked()
                ->get(['id', 'name', 'rank', 'color']),
        ]);
    }

    /**
     * Katalog benefit yang relevan untuk tipe toko aktif.
     *
     * Benefit dengan `store_types` kosong berlaku universal; sisanya hanya
     * ditawarkan ke tipe toko yang memang memakainya, supaya form tidak penuh
     * opsi yang tidak masuk akal untuk bisnis tersebut.
     *
     * @return array<int, array<string, mixed>>
     */
    private function benefitTypesForStore(?string $storeTypeCode): array
    {
        return collect(Membership::BENEFIT_TYPES)
            ->filter(fn (array $meta) => $meta['store_types'] === []
                || $storeTypeCode === null
                || in_array($storeTypeCode, $meta['store_types'], true))
            ->map(fn (array $meta, string $type) => [...$meta, 'type' => $type])
            ->values()
            ->all();
    }

    /**
     * Aturan validasi bersama untuk store & update.
     *
     * @return array<string, mixed>
     */
    private function rules(): array
    {
        return [
            'code' => 'required|string|max:50',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:500',
            'duration_type' => 'required|in:day,month,year,visit',
            'duration_value' => 'required|integer|min:1',
            'price' => 'numeric|min:0',
            'is_sellable_at_pos' => 'boolean',
            'auto_tier_min_spend' => 'nullable|numeric|min:0',
            'auto_tier_window_type' => 'nullable|in:day,month,year',
            'auto_tier_window_value' => 'nullable|integer|min:1',
            // Diskon, multiplier poin, dan tier tidak lagi punya kolom sendiri —
            // semuanya masuk sebagai baris benefit.
            'benefits' => 'nullable|array|max:20',
            'benefits.*.type' => ['required', Rule::in(array_keys(Membership::BENEFIT_TYPES))],
            'benefits.*.label' => 'required|string|max:120',
            'benefits.*.value' => 'nullable|numeric|min:0',
            // Tier divalidasi terhadap tier milik toko ini saja, supaya tier
            // toko lain tidak bisa dirujuk lewat request langsung.
            'benefits.*.tier_id' => [
                'nullable',
                Rule::exists('customer_tiers', 'id')
                    ->where('store_id', session('current_store_id')),
            ],
            'benefits.*.product_id' => 'nullable|exists:products,id',
            'benefits.*.quantity' => 'nullable|integer|min:1|max:99',
            'benefits.*.min_purchase' => 'nullable|numeric|min:0',
            'benefits.*.max_amount' => 'nullable|numeric|min:0',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Pesan validasi khusus benefit dinamis.
     *
     * Tanpa ini pesan default menyebut indeks array (`benefits.0.value`) yang
     * tidak berarti apa-apa bagi pemilik toko.
     *
     * @return array<string, string>
     */
    private function messages(): array
    {
        return [
            'benefits.*.type.required' => 'Tipe benefit wajib dipilih.',
            'benefits.*.type.in' => 'Tipe benefit tidak dikenali.',
            'benefits.*.label.required' => 'Label benefit wajib diisi.',
            'benefits.*.value.numeric' => 'Nilai benefit harus berupa angka.',
            'benefits.*.quantity.integer' => 'Jumlah produk gratis harus berupa angka.',
        ];
    }

    /**
     * Tier milik toko aktif, di-cache per request.
     *
     * @return Collection<int, CustomerTier>
     */
    private function storeTiers(): Collection
    {
        return once(fn () => CustomerTier::forStore(session('current_store_id'))->get());
    }

    /**
     * Bersihkan benefit: buang field yang tidak dipakai tipe tersebut, dan
     * pastikan tipe yang butuh nilai memang punya nilai.
     *
     * @param  array<int, array<string, mixed>>  $benefits
     * @return array<int, array<string, mixed>>
     */
    private function sanitizeBenefits(array $benefits): array
    {
        $result = [];
        $seenOnce = [];

        foreach ($benefits as $benefit) {
            $type = $benefit['type'];
            $meta = Membership::BENEFIT_TYPES[$type];

            // Tipe ber-`once` hanya masuk sekali; baris berikutnya diabaikan
            // ketimbang menyimpan dua aturan yang saling bertentangan.
            if ($meta['once']) {
                if (isset($seenOnce[$type])) {
                    continue;
                }
                $seenOnce[$type] = true;
            }

            $clean = ['type' => $type, 'label' => trim($benefit['label'])];

            if ($meta['value_kind'] === 'product') {
                if (empty($benefit['product_id'])) {
                    continue;
                }
                $clean['product_id'] = (int) $benefit['product_id'];
            } elseif ($meta['value_kind'] === 'tier') {
                if (empty($benefit['tier_id'])) {
                    continue;
                }

                $tier = $this->storeTiers()->firstWhere('id', (int) $benefit['tier_id']);

                if (! $tier) {
                    continue;
                }

                // Nama ikut disimpan sebagai snapshot: kalau tier dihapus lalu
                // dibuat ulang dengan nama sama, benefit ini masih bisa
                // dipulihkan lewat pencocokan nama.
                $clean['tier_id'] = $tier->id;
                $clean['tier'] = $tier->name;
            } elseif ($meta['value_kind'] !== 'none') {
                $value = $benefit['value'] ?? null;
                if ($value === null || $value === '' || (float) $value <= 0) {
                    continue;
                }
                $clean['value'] = (float) $value;
            }

            foreach (['quantity', 'min_purchase', 'max_amount'] as $field) {
                if (! in_array($field, $meta['uses'], true)) {
                    continue;
                }
                $value = $benefit[$field] ?? null;
                if ($value === null || $value === '') {
                    continue;
                }
                $clean[$field] = $field === 'quantity' ? (int) $value : (float) $value;
            }

            $result[] = $clean;
        }

        return $result;
    }

    /**
     * Turunkan kolom lama dari benefit yang baru disimpan.
     *
     * Kolom `discount_percent`, `point_multiplier`, dan `maps_to_tier` masih ada
     * di tabel dan masih dibaca laporan serta kode lain, jadi tetap diisi agar
     * konsisten. Yang penting: kolomnya selalu ditulis ulang — termasuk
     * dinetralkan saat benefit terkait dihapus. Tanpa itu, nilai lama akan
     * dibangkitkan lagi oleh fallback di normalizedBenefits().
     *
     * @param  array<int, array<string, mixed>>  $benefits
     * @return array<string, mixed>
     */
    private function legacyColumnsFromBenefits(array $benefits): array
    {
        $percent = 0.0;
        $multiplier = 1;
        $tier = null;
        $tierId = null;

        foreach ($benefits as $benefit) {
            if ($benefit['type'] === 'discount_percent') {
                // Kolom lama tidak bisa menyimpan syarat min belanja, jadi hanya
                // diskon tanpa syarat yang boleh diturunkan ke sana. Kalau tidak,
                // konsumen kolom itu akan memberi diskon yang syaratnya belum
                // terpenuhi.
                if ((float) ($benefit['min_purchase'] ?? 0) <= 0) {
                    $percent = max($percent, (float) $benefit['value']);
                }

                continue;
            }

            if ($benefit['type'] === 'point_multiplier') {
                $multiplier = max($multiplier, (int) $benefit['value']);

                continue;
            }

            if ($benefit['type'] === 'maps_to_tier') {
                // Kolom lama menyimpan nama lowercase agar cocok dengan data
                // pelanggan yang juga lowercase (mis. 'gold', bukan 'Gold').
                $tier = isset($benefit['tier']) ? strtolower((string) $benefit['tier']) : null;
                $tierId = $benefit['tier_id'];
            }
        }

        return [
            'discount_percent' => $percent,
            'point_multiplier' => $multiplier,
            'maps_to_tier' => $tier,
            'maps_to_tier_id' => $tierId,
        ];
    }

    public function store(Request $request)
    {
        $storeId = session('current_store_id');
        $validated = $request->validate($this->rules(), $this->messages());
        $validated['benefits'] = $this->sanitizeBenefits($validated['benefits'] ?? []);

        $exists = Membership::where('store_id', $storeId)
            ->where('code', $validated['code'])
            ->exists();

        if ($exists) {
            return back()->withErrors(['code' => 'Kode sudah digunakan.']);
        }

        $membership = Membership::create(array_merge(
            $validated,
            $this->legacyColumnsFromBenefits($validated['benefits']),
            ['store_id' => $storeId],
        ));

        // Form pindah ke halaman sendiri, jadi arahkan ke detail paket yang baru
        // dibuat. `back()` hanya cocok saat form-nya masih modal di halaman index.
        return redirect()
            ->route('admin.memberships.show', $membership->id)
            ->with(
                'success',
                "Membership \"{$validated['name']}\" berhasil dibuat.",
            );
    }

    public function update(Request $request, Membership $membership)
    {
        $storeId = session('current_store_id');
        $validated = $request->validate($this->rules(), $this->messages());
        $validated['benefits'] = $this->sanitizeBenefits($validated['benefits'] ?? []);

        // Cek duplicate code di membership lain
        $exists = Membership::where('store_id', $storeId)
            ->where('code', $validated['code'])
            ->where('id', '!=', $membership->id)
            ->exists();

        if ($exists) {
            return back()->withErrors([
                'code' => 'Kode sudah digunakan oleh membership lain.',
            ]);
        }

        $membership->update(array_merge(
            $validated,
            $this->legacyColumnsFromBenefits($validated['benefits']),
        ));

        return redirect()
            ->route('admin.memberships.show', $membership->id)
            ->with(
                'success',
                "Membership \"{$validated['name']}\" berhasil diperbarui.",
            );
    }

    public function destroy(Membership $membership)
    {
        if ($membership->customerMemberships()->exists()) {
            return back()->with(
                'error',
                'Membership masih dipakai pelanggan. Nonaktifkan saja.',
            );
        }

        $membership->delete();

        // Selalu ke index, bukan back(): hapus bisa dipicu dari halaman detail,
        // dan halaman itu sudah tidak ada setelah datanya terhapus.
        return redirect()
            ->route('admin.memberships.index')
            ->with('success', 'Membership berhasil dihapus.');
    }
}
