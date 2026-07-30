<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Concerns\BuildsPromoTargetOptions;
use App\Http\Controllers\Controller;
use App\Models\CustomerTier;
use App\Models\Promotion;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class PromotionController extends Controller
{
    use BuildsPromoTargetOptions;

    public function index()
    {
        $storeId = session('current_store_id');

        $promotions = Promotion::forStore($storeId)
            ->withCount('products')
            ->orderByDesc('id')
            ->get();

        return Inertia::render('Admin/Promotions/Index', [
            'promotions' => $promotions,
        ]);
    }

    public function create()
    {
        $storeId = session('current_store_id');

        return Inertia::render('Admin/Promotions/Create', [
            'buckets' => $this->promoTargetOptions($storeId),
            'customerTiers' => $this->tierOptions($storeId),
            'scopeSupport' => Promotion::SCOPE_SUPPORT,
        ]);
    }

    /**
     * Tier milik toko untuk dropdown target promo.
     *
     * @return Collection<int, CustomerTier>
     */
    private function tierOptions(int $storeId)
    {
        return CustomerTier::forStore($storeId)
            ->where('is_active', true)
            ->ranked()
            ->get(['id', 'name', 'rank', 'color']);
    }

    /**
     * Nama tier untuk kolom string `customer_tier` yang lama.
     *
     * Kolom itu masih dibaca sebagian kode, jadi selalu ditulis ulang — termasuk
     * dinolkan saat target tier dilepas.
     */
    private function legacyTierName(?int $tierId): ?string
    {
        if (! $tierId) {
            return null;
        }

        $name = CustomerTier::where('id', $tierId)->value('name');

        return $name ? strtolower($name) : null;
    }

    /**
     * Aturan validasi promo. Dipakai bersama store() & update() supaya
     * keduanya tidak pernah berbeda diam-diam.
     *
     * @return array<string, mixed>
     */
    private function promotionRules(): array
    {
        $storeId = session('current_store_id');

        return [
            'name' => 'required|string|max:255',
            'type' => ['required', 'string', Rule::in(Promotion::TYPES)],
            'scope' => 'required|string|in:item,cart',
            'discount_value' => 'required|numeric|min:0',
            'min_purchase_amount' => 'nullable|numeric|min:0',
            'max_discount_amount' => 'nullable|numeric|min:0',
            'min_quantity' => 'nullable|integer|min:1',
            'tier_price' => 'nullable|numeric|min:0',
            // Target tier dirujuk lewat id, dibatasi ke tier milik toko ini.
            'customer_tier_id' => [
                'nullable',
                Rule::exists('customer_tiers', 'id')->where('store_id', $storeId),
            ],
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'start_hour' => 'nullable|string|max:5',
            'end_hour' => 'nullable|string|max:5',
            'applicable_days' => 'nullable|array',
            'applicable_days.*' => ['string', Rule::in(Promotion::DAYS)],
            'free_product_id' => [
                'nullable',
                Rule::exists('products', 'id')->where('store_id', $storeId),
            ],
            'free_variant_id' => 'nullable|exists:product_variants,id',
            'free_quantity' => 'nullable|integer|min:1',
            'is_active' => 'boolean',
            'max_usage' => 'nullable|integer|min:0',
            // Target promo kini berupa bucket produk + varian + satuan.
            'items' => 'nullable|array',
            'items.*.product_id' => [
                'required',
                Rule::exists('products', 'id')->where('store_id', $storeId),
            ],
            'items.*.variant_id' => 'nullable|exists:product_variants,id',
            'items.*.packaging_unit_id' => 'nullable|exists:product_packaging_units,id',
        ];
    }

    /**
     * Rapikan payload promo: kosongkan string kosong, terapkan default, dan
     * pastikan kombinasi tipe + cakupan memang didukung.
     *
     * @param  array<string, mixed>  $validated
     * @return array{0: array<string, mixed>, 1: array<int, array<string, mixed>>}
     */
    private function preparePromotionData(array $validated): array
    {
        // Cakupan keranjang tidak bisa dihitung untuk tipe berbasis item.
        // Divalidasi di server juga, bukan hanya disembunyikan di UI.
        if (! Promotion::supportsScope($validated['type'], $validated['scope'])) {
            throw ValidationException::withMessages([
                'scope' => 'Cakupan ini tidak tersedia untuk tipe promo yang dipilih.',
            ]);
        }

        if (empty($validated['min_purchase_amount'])) {
            $validated['min_purchase_amount'] = 0;
        }
        if (empty($validated['max_discount_amount'])) {
            $validated['max_discount_amount'] = null;
        }

        foreach ([
            'min_quantity',
            'tier_price',
            'customer_tier_id',
            'start_hour',
            'end_hour',
            'free_product_id',
            'free_variant_id',
            'free_quantity',
            'max_usage',
        ] as $field) {
            if (isset($validated[$field]) && $validated[$field] === '') {
                $validated[$field] = null;
            }
        }

        $items = $validated['items'] ?? [];
        unset($validated['items']);

        // Cakupan keranjang tidak terikat produk apa pun, jadi target diabaikan
        // agar tidak ada data menggantung yang membingungkan saat promo diedit.
        if ($validated['scope'] === 'cart') {
            $items = [];
        }

        // applicable_days kosong berarti berlaku setiap hari. Disimpan null
        // supaya konsisten dengan pemeriksaan di Promotion::isActiveOnDay().
        $days = array_values(array_unique($validated['applicable_days'] ?? []));
        $validated['applicable_days'] = ($days === [] || count($days) === count(Promotion::DAYS))
            ? null
            : $days;

        $validated['is_active'] = $validated['is_active'] ?? true;
        $validated['customer_tier'] = $this->legacyTierName($validated['customer_tier_id'] ?? null);

        return [$validated, $items];
    }

    /**
     * Simpan target promo ke pivot, termasuk varian & satuannya.
     *
     * @param  array<int, array<string, mixed>>  $items
     */
    private function syncPromotionItems(Promotion $promotion, array $items): void
    {
        $promotion->products()->detach();

        // Bucket yang sama tidak perlu disimpan dua kali.
        $unique = collect($items)
            ->unique(fn ($item) => sprintf(
                '%s-%s-%s',
                $item['product_id'],
                $item['variant_id'] ?? '',
                $item['packaging_unit_id'] ?? '',
            ));

        foreach ($unique as $item) {
            $promotion->products()->attach($item['product_id'], [
                'variant_id' => $item['variant_id'] ?? null,
                'packaging_unit_id' => $item['packaging_unit_id'] ?? null,
            ]);
        }
    }

    public function store(Request $request)
    {
        $validated = $request->validate($this->promotionRules());

        [$data, $items] = $this->preparePromotionData($validated);

        $data['code'] = 'PROMO-'.strtoupper(Str::random(8));

        $promotion = Promotion::create($data);
        $this->syncPromotionItems($promotion, $items);

        return redirect()
            ->route('admin.promotions.index')
            ->with('success', 'Promo berhasil dibuat.');
    }

    public function edit(Promotion $promotion)
    {
        $storeId = session('current_store_id');
        $promotion->load('products:id,name,sku,sell_price', 'freeProduct:id,name,sell_price');

        // Target promo dikirim sebagai daftar bucket agar picker di form bisa
        // langsung mencocokkannya dengan opsi yang tersedia.
        $items = $promotion->products->map(fn ($product) => [
            'key' => sprintf(
                '%d-%s-%s',
                $product->id,
                $product->pivot->variant_id ?? '',
                $product->pivot->packaging_unit_id ?? '',
            ),
            'product_id' => $product->id,
            'variant_id' => $product->pivot->variant_id,
            'packaging_unit_id' => $product->pivot->packaging_unit_id,
        ])->values();

        return Inertia::render('Admin/Promotions/Edit', [
            'promotion' => $promotion,
            'promotionItems' => $items,
            'buckets' => $this->promoTargetOptions($storeId),
            'customerTiers' => $this->tierOptions($storeId),
            'scopeSupport' => Promotion::SCOPE_SUPPORT,
        ]);
    }

    public function update(Request $request, Promotion $promotion)
    {
        $validated = $request->validate($this->promotionRules());

        [$data, $items] = $this->preparePromotionData($validated);

        $promotion->update($data);
        $this->syncPromotionItems($promotion, $items);

        return redirect()
            ->route('admin.promotions.index')
            ->with('success', 'Promo berhasil diupdate.');
    }

    public function show(Promotion $promotion)
    {
        $promotion->load(
            'products:id,name,sku,sell_price',
            'freeProduct:id,name,sell_price',
            'freeVariant:id,name,sku',
        );
        $promotion->loadCount('products');

        /**
         * Nama tier dikirim sebagai prop tersendiri, bukan lewat eager load.
         * Relasi `customerTier` diserialisasi dengan key `customer_tier` yang
         * bentrok dengan kolom string legacy bernama sama, sehingga di frontend
         * nilainya bisa berubah dari string menjadi objek.
         */
        $tierName = $promotion->customer_tier_id
            ? $promotion->customerTier()->value('name')
            : ($promotion->customer_tier ? Str::title($promotion->customer_tier) : null);

        return Inertia::render('Admin/Promotions/Show', [
            'promotion' => $promotion,
            'customerTierName' => $tierName,
        ]);
    }

    public function destroy(Promotion $promotion)
    {
        $promotion->products()->detach();
        $promotion->delete();

        return redirect()
            ->route('admin.promotions.index')
            ->with('success', 'Promo berhasil dihapus.');
    }
}
