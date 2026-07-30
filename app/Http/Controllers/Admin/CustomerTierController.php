<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CustomerTier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

/**
 * Kelola level tier pelanggan milik toko.
 *
 * Hierarki tier ditentukan kolom `rank`, dan urutannya diatur owner lewat
 * drag & drop di halaman index. Menambah level di tengah hierarki cukup dengan
 * membuat tier baru lalu menggesernya ke posisi yang diinginkan.
 */
class CustomerTierController extends Controller
{
    public function index()
    {
        $storeId = session('current_store_id');

        // Tier bawaan dibuat saat toko dibuat, tapi toko lama (dibuat sebelum
        // fitur ini ada) belum punya. Diseed di sini supaya halaman tidak pernah
        // tampil kosong dan pelanggan selalu punya tier untuk dijatuhi.
        CustomerTier::seedDefaultsForStore($storeId);

        $tiers = CustomerTier::forStore($storeId)
            ->ranked()
            ->withCount(['customers', 'memberships', 'promotions'])
            ->get();

        return Inertia::render('Admin/CustomerTiers/Index', [
            'tiers' => $tiers,
            'colors' => CustomerTier::COLORS,
        ]);
    }

    public function store(Request $request)
    {
        $storeId = session('current_store_id');
        $validated = $request->validate($this->rules($storeId));

        // Tier baru masuk di posisi teratas; owner bisa menggesernya setelah itu.
        $validated['rank'] = (int) CustomerTier::forStore($storeId)->max('rank') + 1;
        $validated['store_id'] = $storeId;
        $validated['is_active'] = $validated['is_active'] ?? true;

        CustomerTier::create($validated);

        return back()->with('success', "Tier \"{$validated['name']}\" berhasil dibuat.");
    }

    public function update(Request $request, CustomerTier $customerTier)
    {
        $storeId = session('current_store_id');
        abort_if($customerTier->store_id !== $storeId, 403);

        $validated = $request->validate($this->rules($storeId, $customerTier->id));

        $customerTier->update($validated);

        // Nama tier ikut tersimpan di kolom string lama pada pelanggan &
        // membership, jadi disinkronkan supaya tidak jadi nama basi.
        $this->syncLegacyTierNames($customerTier);

        return back()->with('success', "Tier \"{$customerTier->name}\" berhasil diperbarui.");
    }

    public function destroy(CustomerTier $customerTier)
    {
        abort_if($customerTier->store_id !== session('current_store_id'), 403);

        $storeId = $customerTier->store_id;

        if (CustomerTier::forStore($storeId)->count() <= 1) {
            return back()->with(
                'error',
                'Minimal satu tier harus ada. Buat tier lain dulu sebelum menghapus yang ini.',
            );
        }

        // Tier yang masih dirujuk tidak dihapus: pelanggan akan kehilangan
        // levelnya dan membership kehilangan target upgrade-nya tanpa jejak.
        $used = $customerTier->customers()->count()
            + $customerTier->memberships()->count()
            + $customerTier->promotions()->count();

        if ($used > 0) {
            return back()->with(
                'error',
                "Tier \"{$customerTier->name}\" masih dipakai {$used} data (pelanggan/membership/promo). Nonaktifkan saja.",
            );
        }

        $name = $customerTier->name;
        $customerTier->delete();

        return back()->with('success', "Tier \"{$name}\" berhasil dihapus.");
    }

    /**
     * Simpan ulang urutan tier.
     *
     * Seluruh daftar dikirim sekaligus dan ditulis dalam satu transaksi, bukan
     * satu request per baris. Reorder yang setengah tersimpan akan membuat dua
     * tier punya rank sama, dan hierarki jadi ambigu.
     */
    public function reorder(Request $request)
    {
        $storeId = session('current_store_id');

        $validated = $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => [
                'required',
                'integer',
                'distinct',
                Rule::exists('customer_tiers', 'id')->where('store_id', $storeId),
            ],
        ]);

        DB::transaction(function () use ($validated, $storeId) {
            foreach ($validated['ids'] as $index => $id) {
                CustomerTier::where('store_id', $storeId)
                    ->where('id', $id)
                    ->update(['rank' => $index + 1]);
            }
        });

        return response()->json(['success' => true]);
    }

    /**
     * @return array<string, mixed>
     */
    private function rules(int $storeId, ?int $ignoreId = null): array
    {
        return [
            'name' => [
                'required',
                'string',
                'max:50',
                Rule::unique('customer_tiers', 'name')
                    ->where('store_id', $storeId)
                    ->ignore($ignoreId),
            ],
            'color' => ['required', Rule::in(CustomerTier::COLORS)],
            'is_active' => 'boolean',
        ];
    }

    /**
     * Jaga kolom string `tier` lama tetap cocok dengan nama tier terbaru.
     *
     * Kolom itu masih dibaca sebagian kode; tanpa sinkronisasi ini, mengganti
     * nama tier akan meninggalkan nama lama di data pelanggan.
     */
    private function syncLegacyTierNames(CustomerTier $tier): void
    {
        $tier->customers()->update(['tier' => strtolower($tier->name)]);
        $tier->memberships()->update(['maps_to_tier' => strtolower($tier->name)]);
        $tier->promotions()->update(['customer_tier' => strtolower($tier->name)]);
    }
}
