<?php

namespace Tests\Feature;

use App\Models\Feature;
use App\Models\FeatureDetail;
use App\Models\Plan;
use App\Models\StoreType;
use App\Models\User;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * CRUD Fitur Sistem (Feature) level platform: metadata + display_group +
 * detail fitur nested (data-driven, dikelola developer lewat UI).
 */
class DeveloperFeatureTest extends TestCase
{
    use RefreshDatabase;

    private function developer(): User
    {
        return User::factory()->create(['is_developer' => true]);
    }

    public function test_non_developer_cannot_access(): void
    {
        $user = User::factory()->create(['is_developer' => false]);

        $this->actingAs($user)->get('/developer/features')->assertStatus(403);
    }

    public function test_index_lists_features(): void
    {
        Feature::create(['code' => 'stock_transfer', 'label' => 'Transfer Stok', 'is_active' => true]);

        $response = $this->actingAs($this->developer())->get('/developer/features');

        $response->assertOk();
        $codes = collect($response->viewData('page')['props']['features'])->pluck('code');
        $this->assertTrue($codes->contains('stock_transfer'));
    }

    public function test_developer_can_create_feature_with_display_group(): void
    {
        $response = $this->withoutMiddleware(ValidateCsrfToken::class)
            ->actingAs($this->developer())
            ->post('/developer/features', [
                'code' => 'stock_transfer',
                'label' => 'Transfer Stok',
                'display_group' => 'catalog',
            ]);

        $response->assertRedirect(route('developer.features.index'));

        $feature = Feature::where('code', 'stock_transfer')->first();
        $this->assertNotNull($feature);
        $this->assertSame('catalog', $feature->display_group);
    }

    public function test_display_group_must_be_a_valid_key(): void
    {
        $response = $this->withoutMiddleware(ValidateCsrfToken::class)
            ->actingAs($this->developer())
            ->post('/developer/features', [
                'code' => 'stock_transfer',
                'label' => 'Transfer Stok',
                'display_group' => 'invalid_group',
            ]);

        $response->assertSessionHasErrors('display_group');
    }

    public function test_duplicate_code_is_rejected(): void
    {
        Feature::create(['code' => 'stock_transfer', 'label' => 'A', 'is_active' => true]);

        $response = $this->withoutMiddleware(ValidateCsrfToken::class)
            ->actingAs($this->developer())
            ->post('/developer/features', [
                'code' => 'stock_transfer',
                'label' => 'B',
                'display_group' => 'catalog',
            ]);

        $response->assertSessionHasErrors('code');
        $this->assertSame(1, Feature::where('code', 'stock_transfer')->count());
    }

    public function test_developer_can_update_feature(): void
    {
        $feature = Feature::create(['code' => 'stock_transfer', 'label' => 'A', 'display_group' => 'other', 'is_active' => true]);

        $response = $this->withoutMiddleware(ValidateCsrfToken::class)
            ->actingAs($this->developer())
            ->put("/developer/features/{$feature->id}", [
                'code' => 'stock_transfer',
                'label' => 'Transfer Stok',
                'display_group' => 'catalog',
                'is_active' => false,
            ]);

        $response->assertRedirect(route('developer.features.index'));

        $feature->refresh();
        $this->assertSame('Transfer Stok', $feature->label);
        $this->assertSame('catalog', $feature->display_group);
        $this->assertFalse($feature->is_active);
    }

    public function test_developer_can_delete_unused_feature(): void
    {
        $feature = Feature::create(['code' => 'unused', 'label' => 'Unused', 'is_active' => true]);

        $this->withoutMiddleware(ValidateCsrfToken::class)
            ->actingAs($this->developer())
            ->delete("/developer/features/{$feature->id}")
            ->assertRedirect(route('developer.features.index'));

        $this->assertDatabaseMissing('features', ['id' => $feature->id]);
    }

    public function test_feature_used_by_plan_cannot_be_deleted(): void
    {
        $feature = Feature::create(['code' => 'stock_transfer', 'label' => 'A', 'is_active' => true]);
        $plan = Plan::create(['code' => 'pro', 'label' => 'Pro', 'is_active' => true]);
        $plan->features()->attach($feature->id);

        $response = $this->withoutMiddleware(ValidateCsrfToken::class)
            ->actingAs($this->developer())
            ->delete("/developer/features/{$feature->id}");

        $response->assertRedirect();
        $response->assertSessionHas('error');
        $this->assertDatabaseHas('features', ['id' => $feature->id]);
    }

    public function test_feature_used_by_store_type_cannot_be_deleted(): void
    {
        $feature = Feature::create(['code' => 'stock_transfer', 'label' => 'A', 'is_active' => true]);
        $type = StoreType::create(['code' => 'retail', 'label' => 'Retail', 'is_active' => true]);
        $type->features()->attach($feature->id);

        $response = $this->withoutMiddleware(ValidateCsrfToken::class)
            ->actingAs($this->developer())
            ->delete("/developer/features/{$feature->id}");

        $response->assertSessionHas('error');
        $this->assertDatabaseHas('features', ['id' => $feature->id]);
    }

    // ── Feature Detail nested ───────────────────────────────────────────

    public function test_developer_can_add_feature_detail(): void
    {
        $feature = Feature::create(['code' => 'stock_transfer', 'label' => 'A', 'is_active' => true]);

        $response = $this->withoutMiddleware(ValidateCsrfToken::class)
            ->actingAs($this->developer())
            ->post("/developer/features/{$feature->id}/details", [
                'code' => 'stock_transfer.approve',
                'label' => 'Perlu Approval Transfer',
            ]);

        $response->assertRedirect(route('developer.features.details', $feature->id));

        $this->assertDatabaseHas('feature_details', [
            'feature_id' => $feature->id,
            'code' => 'stock_transfer.approve',
        ]);
    }

    public function test_feature_detail_code_unique_scoped_to_feature(): void
    {
        $feature = Feature::create(['code' => 'stock_transfer', 'label' => 'A', 'is_active' => true]);
        FeatureDetail::create([
            'feature_id' => $feature->id,
            'code' => 'stock_transfer.approve',
            'label' => 'Existing',
        ]);

        $response = $this->withoutMiddleware(ValidateCsrfToken::class)
            ->actingAs($this->developer())
            ->post("/developer/features/{$feature->id}/details", [
                'code' => 'stock_transfer.approve',
                'label' => 'Duplikat',
            ]);

        $response->assertSessionHasErrors('code');
        $this->assertSame(1, FeatureDetail::where('code', 'stock_transfer.approve')->count());
    }

    public function test_detail_code_is_unique_globally_not_just_within_feature(): void
    {
        // Kolom feature_details.code unique di seluruh tabel (bukan per-fitur) —
        // sesuai constraint database asli (migrasi 2026_07_06_000001).
        $featureA = Feature::create(['code' => 'a', 'label' => 'A', 'is_active' => true]);
        $featureB = Feature::create(['code' => 'b', 'label' => 'B', 'is_active' => true]);
        FeatureDetail::create(['feature_id' => $featureA->id, 'code' => 'shared_code', 'label' => 'X']);

        $response = $this->withoutMiddleware(ValidateCsrfToken::class)
            ->actingAs($this->developer())
            ->post("/developer/features/{$featureB->id}/details", [
                'code' => 'shared_code',
                'label' => 'Y',
            ]);

        $response->assertSessionHasErrors('code');
        $this->assertSame(1, FeatureDetail::where('code', 'shared_code')->count());
    }

    public function test_detail_from_another_feature_cannot_be_deleted_via_wrong_feature(): void
    {
        $featureA = Feature::create(['code' => 'a', 'label' => 'A', 'is_active' => true]);
        $featureB = Feature::create(['code' => 'b', 'label' => 'B', 'is_active' => true]);
        $detail = FeatureDetail::create(['feature_id' => $featureA->id, 'code' => 'x', 'label' => 'X']);

        $response = $this->withoutMiddleware(ValidateCsrfToken::class)
            ->actingAs($this->developer())
            ->delete("/developer/features/{$featureB->id}/details/{$detail->id}");

        // Handler global aplikasi mengubah 404 jadi redirect dashboard + flash error
        $response->assertRedirect(route('admin.dashboard'));
        $response->assertSessionHas('error', 'Halaman tidak ditemukan.');
        $this->assertDatabaseHas('feature_details', ['id' => $detail->id]);
    }

    public function test_deleting_feature_cascades_details(): void
    {
        $feature = Feature::create(['code' => 'stock_transfer', 'label' => 'A', 'is_active' => true]);
        $detail = FeatureDetail::create(['feature_id' => $feature->id, 'code' => 'x', 'label' => 'X']);

        $feature->delete();

        $this->assertDatabaseMissing('feature_details', ['id' => $detail->id]);
    }
}
