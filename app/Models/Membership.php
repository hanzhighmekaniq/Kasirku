<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Collection;

class Membership extends Model
{
    use HasFactory;

    /**
     * Katalog tipe benefit yang bisa dipasang owner ke sebuah membership.
     *
     * Katalog ini satu-satunya sumber kebenaran: form di admin dirender dari
     * sini, validasi backend memakai kunci-kuncinya, dan POS mengeksekusi
     * benefit ber-`auto` = true. Menambah jenis benefit baru cukup menambah
     * satu entri di sini (plus eksekusinya di MembershipBenefitService) tanpa
     * migration.
     *
     * - `value_kind`: bentuk input nilai utama (none|percent|amount|number|product|tier)
     * - `uses`: field pendukung yang relevan (min_purchase|max_amount|quantity)
     * - `auto`: dieksekusi sistem saat transaksi, bukan sekadar teks tampilan
     * - `once`: hanya boleh dipasang satu kali per membership
     * - `store_types`: kosong = cocok untuk semua tipe toko
     *
     * @var array<string, array{label: string, description: string, value_kind: string, value_label: ?string, uses: array<int, string>, auto: bool, once: bool, store_types: array<int, string>}>
     */
    public const BENEFIT_TYPES = [
        'custom_text' => [
            'label' => 'Teks Bebas',
            'description' => 'Hanya tampil sebagai informasi ke pelanggan, tidak dieksekusi sistem.',
            'value_kind' => 'none',
            'value_label' => null,
            'uses' => [],
            'auto' => false,
            'once' => false,
            'store_types' => [],
        ],
        'discount_percent' => [
            'label' => 'Diskon Persen',
            'description' => 'Potongan persen dari subtotal. Dibandingkan dengan promo keranjang, yang terbesar dipakai.',
            'value_kind' => 'percent',
            'value_label' => 'Persen diskon',
            'uses' => ['min_purchase', 'max_amount'],
            'auto' => true,
            'once' => false,
            'store_types' => [],
        ],
        'discount_amount' => [
            'label' => 'Diskon Nominal',
            'description' => 'Potongan rupiah tetap dari subtotal, bisa dibatasi minimal belanja.',
            'value_kind' => 'amount',
            'value_label' => 'Nominal diskon',
            'uses' => ['min_purchase'],
            'auto' => true,
            'once' => false,
            'store_types' => [],
        ],
        'point_multiplier' => [
            'label' => 'Multiplier Poin',
            'description' => 'Poin loyalitas dikalikan sebanyak ini setiap transaksi selesai. 2 = dua kali lipat.',
            'value_kind' => 'number',
            'value_label' => 'Kelipatan poin',
            'uses' => [],
            'auto' => true,
            'once' => true,
            'store_types' => [],
        ],
        'maps_to_tier' => [
            'label' => 'Setara Tier',
            'description' => 'Tier pelanggan otomatis mengikuti tier ini selama membership aktif.',
            'value_kind' => 'tier',
            'value_label' => 'Tier',
            'uses' => [],
            'auto' => true,
            'once' => true,
            'store_types' => [],
        ],
        'free_shipping' => [
            'label' => 'Gratis Ongkir / Antar',
            'description' => 'Biaya kirim dinolkan otomatis di kasir. Isi plafon jika hanya disubsidi sebagian.',
            'value_kind' => 'none',
            'value_label' => null,
            'uses' => ['min_purchase', 'max_amount'],
            'auto' => true,
            'once' => true,
            'store_types' => ['retail', 'fnb'],
        ],
        'free_product' => [
            'label' => 'Produk / Layanan Gratis',
            'description' => 'Hak produk gratis milik member. Ditandai di kasir untuk ditambahkan ke keranjang.',
            'value_kind' => 'product',
            'value_label' => 'Produk',
            'uses' => ['quantity', 'min_purchase'],
            'auto' => true,
            'once' => false,
            'store_types' => [],
        ],
        'priority_queue' => [
            'label' => 'Prioritas Antrean',
            'description' => 'Member ditandai prioritas pada antrean dan layanan.',
            'value_kind' => 'none',
            'value_label' => null,
            'uses' => [],
            'auto' => true,
            'once' => true,
            'store_types' => ['fnb', 'service', 'ticket', 'hospitality', 'session'],
        ],
    ];

    protected $fillable = [
        'store_id',
        'code',
        'name',
        'description',
        'duration_type',
        'duration_value',
        'price',
        'discount_percent',
        'point_multiplier',
        'maps_to_tier',
        'maps_to_tier_id',
        'is_sellable_at_pos',
        'auto_tier_min_spend',
        'auto_tier_window_type',
        'auto_tier_window_value',
        'sort_order',
        'benefits',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'benefits' => 'array',
            'is_active' => 'boolean',
            'is_sellable_at_pos' => 'boolean',
            'price' => 'decimal:2',
            'discount_percent' => 'decimal:2',
            'auto_tier_min_spend' => 'decimal:2',
            'point_multiplier' => 'integer',
            'sort_order' => 'integer',
            'duration_value' => 'integer',
            'auto_tier_window_value' => 'integer',
        ];
    }

    // --- Relationships ---

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public function customerMemberships(): HasMany
    {
        return $this->hasMany(CustomerMembership::class);
    }

    public function mapsToTierRelation(): BelongsTo
    {
        return $this->belongsTo(CustomerTier::class, 'maps_to_tier_id');
    }

    public function product(): HasOne
    {
        return $this->hasOne(Product::class);
    }

    protected static function booted(): void
    {
        static::saved(function (Membership $membership) {
            if (! $membership->is_sellable_at_pos) {
                $membership->product?->update(['is_active' => false]);

                return;
            }

            Product::updateOrCreate(
                ['membership_id' => $membership->id],
                [
                    'store_id' => $membership->store_id,
                    'name' => $membership->name,
                    'sku' => 'MBR-'.$membership->code,
                    'type' => 'membership',
                    'unit' => 'pcs',
                    'sell_price' => $membership->price,
                    'track_stock' => false,
                    'is_sellable' => false, // tidak pernah muncul di grid kasir
                    'is_active' => $membership->is_active,
                ],
            );
        });
    }

    /**
     * Peringkat tier membership ini, 0 kalau tidak memetakan tier.
     *
     * Angkanya berasal dari `customer_tiers.rank` milik toko, jadi ikut berubah
     * saat owner menggeser urutan tier — termasuk saat ia menyisipkan level baru
     * di tengah hierarki.
     */
    public function tierRank(): int
    {
        return $this->mapsToTier()?->rank ?? 0;
    }

    /**
     * Tier yang dipetakan membership ini, null kalau tidak ada.
     *
     * Resolusi bertahap: `tier_id` di benefit lebih dulu, lalu nama tier di
     * benefit, terakhir kolom lama. Nama dipakai sebagai jaring kalau tier
     * pernah dihapus lalu dibuat ulang dengan nama sama.
     */
    public function mapsToTier(): ?CustomerTier
    {
        $benefit = $this->benefitOfType('maps_to_tier');
        $tierId = $benefit['tier_id'] ?? $this->maps_to_tier_id;

        if ($tierId) {
            $tier = $this->resolveTierById((int) $tierId);

            if ($tier) {
                return $tier;
            }
        }

        $name = $benefit['tier'] ?? $this->maps_to_tier;

        return $name ? $this->resolveTierByName((string) $name) : null;
    }

    private function resolveTierById(int $tierId): ?CustomerTier
    {
        return $this->storeTiers()->firstWhere('id', $tierId);
    }

    private function resolveTierByName(string $name): ?CustomerTier
    {
        return $this->storeTiers()
            ->first(fn (CustomerTier $tier) => strcasecmp($tier->name, $name) === 0);
    }

    /**
     * Tier milik toko ini, di-cache per request.
     *
     * tierRank() dipanggil berulang saat menyortir membership (mis. di
     * AutoTierService dan syncTierFromMembership), jadi tanpa cache ini satu
     * proses bisa memicu puluhan query yang sama.
     *
     * @return Collection<int, CustomerTier>
     */
    private function storeTiers(): Collection
    {
        return once(fn () => CustomerTier::where('store_id', $this->store_id)->get());
    }

    /** Kelipatan poin loyalitas dari benefit, minimal 1. */
    public function pointMultiplier(): int
    {
        $value = $this->benefitOfType('point_multiplier')['value'] ?? 1;

        return max(1, (int) $value);
    }

    // --- Helpers ---

    /**
     * Benefit yang sudah dinormalisasi ke bentuk baku.
     *
     * Satu-satunya pintu baca benefit. Tiga bentuk data lama dinaikkan ke
     * bentuk objek di sini supaya konsumen (POS, tampilan, service) tidak perlu
     * tahu asal formatnya:
     *
     * 1. Array string murni: `["Gratis ongkir", ...]` → `custom_text`.
     * 2. Kolom `discount_percent`, `point_multiplier`, `maps_to_tier` yang
     *    dulu berdiri sendiri di tabel → benefit dengan tipe senama.
     * 3. Tipe yang sudah tidak dikenal → dibuang.
     *
     * Kolom legacy hanya disuntikkan kalau benefit bertipe sama belum ada, jadi
     * membership yang sudah dimigrasi tidak dobel.
     *
     * @return array<int, array{type: string, label: string, value: ?float, tier: ?string, product_id: ?int, quantity: ?int, min_purchase: ?float, max_amount: ?float}>
     */
    public function normalizedBenefits(): array
    {
        $benefits = collect($this->benefits ?? [])
            ->map(fn ($benefit) => $this->normalizeBenefitRow($benefit))
            ->filter()
            ->values();

        foreach ($this->legacyColumnBenefits() as $legacy) {
            if ($benefits->contains('type', $legacy['type'])) {
                continue;
            }

            $benefits->push($this->normalizeBenefitRow($legacy));
        }

        return $benefits->values()->all();
    }

    /**
     * @param  mixed  $benefit
     * @return array<string, mixed>|null
     */
    private function normalizeBenefitRow($benefit): ?array
    {
        if (is_string($benefit)) {
            $benefit = ['type' => 'custom_text', 'label' => $benefit];
        }

        if (! is_array($benefit)) {
            return null;
        }

        $type = $benefit['type'] ?? 'custom_text';

        if (! isset(self::BENEFIT_TYPES[$type])) {
            return null;
        }

        $tier = $benefit['tier'] ?? null;
        $tierId = $benefit['tier_id'] ?? null;

        return [
            'type' => $type,
            'label' => (string) ($benefit['label'] ?? self::BENEFIT_TYPES[$type]['label']),
            'value' => isset($benefit['value']) && $benefit['value'] !== '' ? (float) $benefit['value'] : null,
            // Nama tier tidak divalidasi terhadap daftar tetap lagi — owner
            // bebas menamai levelnya. Validitasnya diuji saat resolusi ke
            // tabel customer_tiers di mapsToTier().
            'tier' => $tier !== '' ? $tier : null,
            'tier_id' => $tierId !== null && $tierId !== '' ? (int) $tierId : null,
            'product_id' => isset($benefit['product_id']) && $benefit['product_id'] !== '' ? (int) $benefit['product_id'] : null,
            'quantity' => isset($benefit['quantity']) && $benefit['quantity'] !== '' ? (int) $benefit['quantity'] : null,
            'min_purchase' => isset($benefit['min_purchase']) && $benefit['min_purchase'] !== '' ? (float) $benefit['min_purchase'] : null,
            'max_amount' => isset($benefit['max_amount']) && $benefit['max_amount'] !== '' ? (float) $benefit['max_amount'] : null,
        ];
    }

    /**
     * Kolom lama yang kini hidup sebagai benefit.
     *
     * Dipakai sebagai jembatan untuk data yang dibuat sebelum benefit
     * disatukan. Begitu owner menyimpan ulang membership-nya, controller
     * menuliskan nilai ini ke kolom `benefits` dan menetralkan kolom lamanya.
     *
     * @return array<int, array<string, mixed>>
     */
    private function legacyColumnBenefits(): array
    {
        $legacy = [];

        if ((float) ($this->discount_percent ?? 0) > 0) {
            $legacy[] = [
                'type' => 'discount_percent',
                'label' => 'Diskon '.rtrim(rtrim(number_format((float) $this->discount_percent, 2, ',', '.'), '0'), ',').'%',
                'value' => (float) $this->discount_percent,
            ];
        }

        if ((int) ($this->point_multiplier ?? 1) > 1) {
            $legacy[] = [
                'type' => 'point_multiplier',
                'label' => 'Poin '.(int) $this->point_multiplier.'x lipat',
                'value' => (int) $this->point_multiplier,
            ];
        }

        if ($this->maps_to_tier_id || $this->maps_to_tier) {
            $legacy[] = [
                'type' => 'maps_to_tier',
                'label' => 'Setara tier '.ucfirst((string) $this->maps_to_tier),
                'tier' => $this->maps_to_tier,
                'tier_id' => $this->maps_to_tier_id,
            ];
        }

        return $legacy;
    }

    /**
     * Ganti atribut `benefits` dengan bentuk yang sudah dinormalisasi.
     *
     * Dipakai sebelum model dikirim ke Inertia supaya tampilan hanya mengenal
     * satu bentuk benefit dan tidak perlu tahu soal kolom lama.
     */
    public function withNormalizedBenefits(): self
    {
        return $this->setAttribute('benefits', $this->normalizedBenefits());
    }

    /** Ambil benefit pertama dengan tipe tertentu, null kalau tidak ada. */
    public function benefitOfType(string $type): ?array
    {
        foreach ($this->normalizedBenefits() as $benefit) {
            if ($benefit['type'] === $type) {
                return $benefit;
            }
        }

        return null;
    }

    public function hasBenefit(string $type): bool
    {
        return $this->benefitOfType($type) !== null;
    }

    /** Hitung tanggal expired dari tanggal mulai */
    public function calculateExpiry(Carbon $from): ?Carbon
    {
        return match ($this->duration_type) {
            'day' => $from->copy()->addDays($this->duration_value),
            'month' => $from->copy()->addMonths($this->duration_value),
            'year' => $from->copy()->addYears($this->duration_value),
            'visit' => null, // berbasis kunjungan, tidak ada expired date
            default => null,
        };
    }
}
