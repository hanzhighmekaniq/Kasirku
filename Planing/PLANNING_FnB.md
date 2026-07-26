Konteks
Project Kasirku (C:\HanzShadows\Kerja\Kasirku) — Laravel 12 + Inertia + React + Tailwind. Fokus: menambah dan menyempurnakan fitur Product Management khusus mode FnB (Food & Beverage), mencakup backend dan frontend. Semua yang FnB-specific harus hidden di mode non-FnB.
Schema Database (sudah dicek)
products:
  ✅ base_unit              varchar(30) — sudah ada
  ✅ is_composable          tinyint(1)  — sudah ada
  ✅ preparation_time       int unsigned — sudah ada
  ❌ base_unit_conversion   — BELUM ADA, perlu migration

product_recipes:
  ✅ product_id, raw_material_id, quantity, unit, is_nullable, notes

product_modifier_products:
  ✅ product_id, modifier_group_id
Task 1 — Migration: Tambah base_unit_conversion
File: database/migrations/xxxx_add_base_unit_conversion_to_products_table.php
php artisan make:migration add_base_unit_conversion_to_products_table --table=products
Isi migration:
$table->decimal('base_unit_conversion', 10, 4)->nullable()->after('base_unit');
// Contoh: unit = "kg", base_unit = "gram", base_unit_conversion = 1000
// Artinya: 1 kg = 1000 gram
Jalankan:
php artisan migrate
Task 2 — Backend: Update Product Model
File: app/Models/Product.php
Tambah ke $fillable:
'base_unit_conversion',
Tambah/update relasi:
// Resep produk ini (untuk finished_goods/combo)
public function recipes(): HasMany
{
    return $this->hasMany(ProductRecipe::class);
}

// Produk ini dipakai di resep mana (untuk raw_material)
public function usedInRecipes(): HasMany
{
    return $this->hasMany(ProductRecipe::class, 'raw_material_id');
}

// Modifier groups yang attached ke produk ini
public function modifierGroups(): BelongsToMany
{
    return $this->belongsToMany(
        ProductModifierGroup::class,
        'product_modifier_products',
        'product_id',
        'modifier_group_id'
    )->withTimestamps();
}
Auto-update is_composable — tambah observer atau method helper:
public function syncIsComposable(): void
{
    $this->update(['is_composable' => $this->recipes()->exists()]);
}
Task 3 — Backend: Update ProductController
File: app/Http/Controllers/Admin/ProductController.php
index() — tambah withCount untuk badge:
$query->withCount(['recipes', 'modifierGroups']);
// Pass ke Inertia: recipes_count, modifier_groups_count
show() — eager load FnB relations:
$product->load([
    'recipes.rawMaterial',           // untuk tab Resep
    'modifierGroups.modifiers',      // untuk tab Modifier
    'usedInRecipes.product',         // untuk tab "Dipakai di Resep"
    // ... relasi yang sudah ada tetap dipertahankan
]);
store() dan update() — handle field baru:
// Tambah ke validated fields:
'base_unit_conversion' => 'nullable|numeric|min:0',

// Handle modifier groups attach/detach:
if ($request->has('modifier_group_ids')) {
    $product->modifierGroups()->sync($request->modifier_group_ids ?? []);
}
ProductRecipeController — auto-sync is_composable:
// Setelah store/destroy recipe:
$product->syncIsComposable();
Task 4 — Backend: Update ProductRequest (Form Request)
File: app/Http/Requests/Admin/ProductRequest.php (atau nama serupa)
Tambah rules:
'base_unit_conversion' => ['nullable', 'numeric', 'min:0.0001'],
'modifier_group_ids'   => ['nullable', 'array'],
'modifier_group_ids.*' => ['exists:product_modifier_groups,id'],
Task 5 — Frontend: Products/Create.jsx + Products/Edit.jsx
A. Label tipe produk — ganti berdasarkan storeType:
const TYPE_LABELS = storeType === 'fnb'
    ? { finished_goods: 'Menu / Makanan', raw_material: 'Bahan Baku', combo: 'Paket' }
    : { finished_goods: 'Barang Jadi', raw_material: 'Bahan Baku', combo: 'Produk Kombo' };
B. Field base_unit + base_unit_conversion — muncul hanya jika:
- storeType === 'fnb' AND data.type === 'raw_material'
{storeType === 'fnb' && data.type === 'raw_material' && (
    <div className="grid grid-cols-2 gap-4">
        <Field label="Satuan Pakai (base_unit)" hint="Satuan terkecil di resep. Contoh: gram, ml, butir">
            <input type="text" value={data.base_unit} onChange={...} className={inp(errors.base_unit)} />
        </Field>
        <Field label="Konversi" hint="1 satuan beli = berapa satuan pakai. Contoh: 1 kg = 1000 gram">
            <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">1 {data.unit || '?'} =</span>
                <input type="number" value={data.base_unit_conversion} onChange={...} className={inp(errors.base_unit_conversion)} />
                <span className="text-sm text-muted-foreground">{data.base_unit || '?'}</span>
            </div>
        </Field>
    </div>
)}
C. Field preparation_time — prominent untuk FnB:
{storeTypeFeatures.has('kitchen') && (
    <Field label="Waktu Saji (menit)" hint="Estimasi waktu persiapan menu ini di dapur">
        <input type="number" min="0" value={data.preparation_time} onChange={...} />
    </Field>
)}
(Sudah ada, hanya pastikan styling dan posisi yang prominent untuk FnB)
D. Section "Modifier Groups" — hanya FnB finished_goods/combo:
{storeType === 'fnb' && ['finished_goods', 'combo'].includes(data.type) && (
    <SectionCard title="Modifier / Topping" subtitle="Pilihan tambahan untuk menu ini (level gula, ukuran, topping, dll)">
        {/* Multi-select dari modifier_groups yang ada di store */}
        {modifierGroups.map(mg => (
            <CheckboxTile
                key={mg.id}
                checked={data.modifier_group_ids.includes(mg.id)}
                onChange={() => toggleModifierGroup(mg.id)}
                label={mg.name}
                description={`${mg.modifiers_count} pilihan · ${mg.is_required ? 'Wajib' : 'Opsional'}`}
            />
        ))}
    </SectionCard>
)}
Props baru yang perlu dikirim dari controller ke halaman Create/Edit:
'modifierGroups' => ProductModifierGroup::where('store_id', $store->id)
    ->withCount('modifiers')
    ->orderBy('sort_order')
    ->get(['id', 'name', 'is_required', 'modifiers_count']),
Task 6 — Frontend: Products/Show.jsx
A. Ganti label tipe produk:
const typeLabel = storeType === 'fnb'
    ? { finished_goods: 'Menu', raw_material: 'Bahan Baku', combo: 'Paket' }[product.type]
    : product.type_label; // existing logic
B. Tampilkan preparation_time di info card (FnB only):
{storeType === 'fnb' && product.preparation_time && (
    <div>
        <p className="text-xs font-medium text-muted-foreground">Waktu Saji</p>
        <p className="mt-0.5 text-sm font-semibold text-foreground">{product.preparation_time} menit</p>
    </div>
)}
C. Tab baru "Resep" — hanya finished_goods/combo di FnB:
{storeType === 'fnb' && product.type !== 'raw_material' && (
    <TabPanel name="resep" label="Resep">
        {/* Tabel bahan baku: nama, qty, unit, HPP per bahan */}
        {/* Total HPP di bawah */}
        {/* Tombol "Kelola Resep" → route admin.products.recipes.index */}
        {product.recipes.length === 0
            ? <EmptyState icon="book" text="Belum ada resep" action={<Link href={route('admin.products.recipes.index', product.id)}>Tambah Resep</Link>} />
            : (
                <>
                    <RecipeTable recipes={product.recipes} />
                    <div className="flex justify-between items-center mt-4">
                        <span className="text-sm font-medium text-muted-foreground">Total HPP</span>
                        <span className="text-base font-bold text-foreground">{fmt(totalHpp)}</span>
                    </div>
                    <Link href={route('admin.products.recipes.index', product.id)} className="mt-4 inline-flex ...">Kelola Resep</Link>
                </>
            )
        }
    </TabPanel>
)}
D. Tab baru "Modifier" — hanya finished_goods/combo di FnB:
{storeType === 'fnb' && product.type !== 'raw_material' && (
    <TabPanel name="modifier" label="Modifier">
        {product.modifier_groups.length === 0
            ? <EmptyState text="Belum ada modifier group" />
            : product.modifier_groups.map(mg => (
                <div key={mg.id} className="rounded-xl border border-border p-4">
                    <div className="flex items-center justify-between">
                        <p className="font-semibold text-foreground">{mg.name}</p>
                        <span className={mg.is_required ? 'bg-warning/10 text-warning ...' : 'bg-muted text-muted-foreground ...'}>
                            {mg.is_required ? 'Wajib' : 'Opsional'}
                        </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                        {mg.modifiers.map(m => (
                            <span key={m.id} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                                {m.name} {m.price_addition > 0 ? `+${fmt(m.price_addition)}` : ''}
                            </span>
                        ))}
                    </div>
                </div>
            ))
        }
    </TabPanel>
)}
E. Tab baru "Dipakai di Resep" — hanya raw_material di FnB:
{storeType === 'fnb' && product.type === 'raw_material' && (
    <TabPanel name="dipakai" label="Dipakai di Resep">
        {product.used_in_recipes.length === 0
            ? <EmptyState text="Bahan baku ini belum dipakai di resep manapun" />
            : (
                <table className="w-full text-sm">
                    <thead className="bg-muted">
                        <tr>
                            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-left">Menu</th>
                            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Qty Dipakai</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-background">
                        {product.used_in_recipes.map(r => (
                            <tr key={r.id} className="hover:bg-muted/50">
                                <td className="px-4 py-3 text-foreground">{r.product.name}</td>
                                <td className="px-4 py-3 text-right text-muted-foreground">{r.quantity} {r.unit}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )
        }
    </TabPanel>
)}
Task 7 — Frontend: Products/Index.jsx
A. Badge baru di indicator row:
// Tambah setelah badge existing (Varian, Multi-Satuan, Grosir)
{storeType === 'fnb' && product.recipes_count > 0 && (
    <span className="inline-flex items-center rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success">
        Resep
    </span>
)}
{storeType === 'fnb' && product.modifier_groups_count > 0 && (
    <span className="inline-flex items-center rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
        Modifier
    </span>
)}
B. Kolom "Waktu Saji" — hanya FnB:
// Di thead:
{storeType === 'fnb' && (
    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">
        Waktu Saji
    </th>
)}

// Di tbody:
{storeType === 'fnb' && (
    <td className="px-4 py-3 text-center text-sm text-muted-foreground">
        {product.preparation_time ? `${product.preparation_time} mnt` : '—'}
    </td>
)}
C. Shortcut tombol "Modifier" di aksi baris:
{storeType === 'fnb' && product.type !== 'raw_material' && (
    <Link
        href={route('admin.modifier-groups.index', { product_id: product.id })}
        className="rounded p-1.5 text-foreground transition hover:bg-violet-50 hover:text-violet-600 dark:hover:bg-violet-900/30 dark:hover:text-violet-400"
        title="Kelola Modifier"
    >
        <NavIcons name="sliders" className="h-4 w-4" />
    </Link>
)}
Task 8 — Frontend: Products/Recipes.jsx
A. Tampilkan info konversi satuan saat pilih bahan baku:
// Setelah pilih raw_material, tampilkan:
{selectedMaterial?.base_unit && (
    <p className="mt-1 text-xs text-muted-foreground">
        Satuan pakai: <strong>{selectedMaterial.base_unit}</strong>
        {selectedMaterial.base_unit_conversion && (
            <span> · 1 {selectedMaterial.unit} = {selectedMaterial.base_unit_conversion} {selectedMaterial.base_unit}</span>
        )}
    </p>
)}
B. Warning kalau bahan baku tidak punya base_unit:
{selectedMaterial && !selectedMaterial.base_unit && (
    <div className="rounded-lg border border-warning/20 bg-warning/10 px-3 py-2 text-xs text-warning">
        ⚠️ Bahan baku ini belum punya satuan pakai (base_unit). HPP mungkin tidak akurat.{' '}
        <Link href={route('admin.products.edit', selectedMaterial.id)} className="underline">Set sekarang</Link>
    </div>
)}
C. HPP calculation dengan konversi:
// Kalau base_unit_conversion ada, HPP per unit pakai = cost_price / base_unit_conversion
const hppPerUnit = (material) => {
    if (material.base_unit_conversion && material.base_unit_conversion > 0) {
        return material.cost_price / material.base_unit_conversion;
    }
    return material.cost_price; // fallback tanpa konversi
};

const lineHpp = (recipe) => hppPerUnit(recipe.rawMaterial) * recipe.quantity;
D. Auto-sync is_composable setelah add/delete recipe:
Ini dikerjakan di backend (ProductRecipeController) — sudah dicakup di Task 3.
Task 9 — Test
Setelah semua task selesai, jalankan:
php artisan test --compact --filter=Product
npm run build
Spot-check manual di browser:
1. Buat produk FnB tipe "Bahan Baku" → pastikan field base_unit + konversi muncul
2. Buat produk FnB tipe "Menu" → pastikan section Modifier muncul, Resep tab di Show muncul
3. Buka produk Retail → pastikan semua yang FnB-specific tidak muncul
4. Tambah resep → cek HPP kalkulasi dengan konversi
5. Attach modifier group dari Create produk → cek tersimpan dan muncul di Show tab Modifier
Ringkasan File yang Diubah
No	File
1	database/migrations/xxxx_add_base_unit_conversion_to_products_table.php
2	app/Models/Product.php
3	app/Http/Controllers/Admin/ProductController.php
4	app/Http/Controllers/Admin/ProductRecipeController.php
5	app/Http/Requests/Admin/ProductRequest.php
6	resources/js/Pages/Admin/Products/Create.jsx
7	resources/js/Pages/Admin/Products/Edit.jsx
8	resources/js/Pages/Admin/Products/Show.jsx
9	resources/js/Pages/Admin/Products/Index.jsx
10	resources/js/Pages/Admin/Products/Recipes.jsx
Catatan Penting
- Semua field/UI FnB-specific wajib hidden kalau storeType !== 'fnb'
- Gunakan storeTypeFeatures.has('kitchen') untuk preparation_time (bukan hardcode storeType)
- Gunakan storeType === 'fnb' untuk resep, modifier, base_unit
- Label "Menu/Bahan Baku/Paket" hanya ganti di display, value di database tetap finished_goods/raw_material/combo
- is_composable tidak pernah di-expose ke user — dikelola otomatis oleh backend
- Token warna badge baru: Resep → bg-success/10 text-success, Modifier → bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400