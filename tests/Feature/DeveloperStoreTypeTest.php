<?php

namespace Tests\Feature;

use App\Models\Store;
use App\Models\StoreType;
use App\Models\User;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * CRUD Jenis Usaha (StoreType) level platform — akses developer, validasi,
 * reorder, dan guard hapus saat masih dipakai toko.
 */
class DeveloperStoreTypeTest extends TestCase
{
    use RefreshDatabase;

    private function developer(): User
    {
        return User::factory()->create(['is_developer' => true]);
    }

    public function test_non_developer_cannot_access(): void
    {
        $user = User::factory()->create(['is_developer' => false]);

        $this->actingAs($user)->get('/developer/store-types')->assertStatus(403);
    }

    public function test_index_lists_store_types(): void
    {
        StoreType::create(['code' => 'retail', 'label' => 'Retail', 'is_active' => true]);

        $response = $this->actingAs($this->developer())->get('/developer/store-types');

        $response->assertOk();
        $codes = collect($response->viewData('page')['props']['storeTypes'])->pluck('code');
        $this->assertTrue($codes->contains('retail'));
    }

    public function test_developer_can_create_store_type(): void
    {
        $response = $this->withoutMiddleware(ValidateCsrfToken::class)
            ->actingAs($this->developer())
            ->post('/developer/store-types', [
                'code' => 'laundry',
                'label' => 'Laundry',
                'icon' => '🧺',
                'description' => 'Bisnis cuci pakaian',
                'is_active' => true,
                'sort_order' => 9,
            ]);

        $response->assertRedirect(route('developer.store-types.index'));

        $this->assertDatabaseHas('store_types', [
            'code' => 'laundry',
            'label' => 'Laundry',
            'icon' => '🧺',
        ]);
    }

    public function test_duplicate_code_is_rejected(): void
    {
        StoreType::create(['code' => 'retail', 'label' => 'Retail', 'is_active' => true]);

        $response = $this->withoutMiddleware(ValidateCsrfToken::class)
            ->actingAs($this->developer())
            ->post('/developer/store-types', [
                'code' => 'retail',
                'label' => 'Retail Lain',
            ]);

        $response->assertSessionHasErrors('code');
        $this->assertSame(1, StoreType::where('code', 'retail')->count());
    }

    public function test_developer_can_update_store_type(): void
    {
        $type = StoreType::create(['code' => 'service', 'label' => 'Service', 'is_active' => true]);

        $response = $this->withoutMiddleware(ValidateCsrfToken::class)
            ->actingAs($this->developer())
            ->put("/developer/store-types/{$type->id}", [
                'code' => 'service',
                'label' => 'Jasa & Layanan',
                'icon' => '✂️',
                'is_active' => false,
            ]);

        $response->assertRedirect(route('developer.store-types.index'));

        $type->refresh();
        $this->assertSame('Jasa & Layanan', $type->label);
        $this->assertFalse($type->is_active);
        // Kode tidak berubah — dipakai relasi lain
        $this->assertSame('service', $type->code);
    }

    public function test_developer_can_delete_unused_store_type(): void
    {
        $type = StoreType::create(['code' => 'unused', 'label' => 'Unused', 'is_active' => true]);

        $this->withoutMiddleware(ValidateCsrfToken::class)
            ->actingAs($this->developer())
            ->delete("/developer/store-types/{$type->id}")
            ->assertRedirect(route('developer.store-types.index'));

        $this->assertDatabaseMissing('store_types', ['id' => $type->id]);
    }

    public function test_store_type_in_use_cannot_be_deleted(): void
    {
        $type = StoreType::create(['code' => 'retail', 'label' => 'Retail', 'is_active' => true]);
        Store::create([
            'code' => 'STORE-USED',
            'name' => 'Toko Terpakai',
            'store_type_id' => $type->id,
            'is_active' => true,
        ]);

        $response = $this->withoutMiddleware(ValidateCsrfToken::class)
            ->actingAs($this->developer())
            ->delete("/developer/store-types/{$type->id}");

        $response->assertRedirect();
        $response->assertSessionHas('error');
        $this->assertDatabaseHas('store_types', ['id' => $type->id]);
    }

    public function test_developer_can_reorder_store_types(): void
    {
        $a = StoreType::create(['code' => 'a', 'label' => 'A', 'is_active' => true, 'sort_order' => 0]);
        $b = StoreType::create(['code' => 'b', 'label' => 'B', 'is_active' => true, 'sort_order' => 1]);

        $response = $this->withoutMiddleware(ValidateCsrfToken::class)
            ->actingAs($this->developer())
            ->post('/developer/store-types/reorder', [
                'orders' => [
                    ['id' => $a->id, 'sort_order' => 1],
                    ['id' => $b->id, 'sort_order' => 0],
                ],
            ]);

        $response->assertOk();
        $this->assertSame(1, $a->fresh()->sort_order);
        $this->assertSame(0, $b->fresh()->sort_order);
    }
}
