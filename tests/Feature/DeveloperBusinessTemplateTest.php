<?php

namespace Tests\Feature;

use App\Models\BusinessTemplate;
use App\Models\BusinessTemplateProduct;
use App\Models\StoreType;
use App\Models\User;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * CRUD Template Bisnis (BusinessTemplate) level platform: metadata + nested
 * kategori & produk contoh (data-driven, dikelola developer lewat UI).
 */
class DeveloperBusinessTemplateTest extends TestCase
{
    use RefreshDatabase;

    private function developer(): User
    {
        return User::factory()->create(['is_developer' => true]);
    }

    private function storeType(string $code = 'fnb'): StoreType
    {
        return StoreType::create(['code' => $code, 'label' => strtoupper($code), 'is_active' => true]);
    }

    public function test_non_developer_cannot_access(): void
    {
        $user = User::factory()->create(['is_developer' => false]);

        $this->actingAs($user)->get('/developer/business-templates')->assertStatus(403);
    }

    public function test_index_groups_templates_by_store_type(): void
    {
        $type = $this->storeType('fnb');
        BusinessTemplate::create([
            'store_type_id' => $type->id,
            'code' => 'fnb_warteg',
            'label' => 'Warteg',
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->developer())->get('/developer/business-templates');

        $response->assertOk();
        $storeTypes = collect($response->viewData('page')['props']['storeTypes']);
        $fnb = $storeTypes->firstWhere('code', 'fnb');
        $this->assertNotNull($fnb);
        $this->assertSame('fnb_warteg', $fnb['business_templates'][0]['code']);
    }

    public function test_developer_can_create_template_metadata(): void
    {
        $type = $this->storeType();

        $response = $this->withoutMiddleware(ValidateCsrfToken::class)
            ->actingAs($this->developer())
            ->post('/developer/business-templates', [
                'store_type_id' => $type->id,
                'code' => 'fnb_warteg',
                'label' => 'Warteg',
                'icon' => '🍚',
            ]);

        $response->assertRedirect(route('developer.business-templates.index'));

        $template = BusinessTemplate::where('code', 'fnb_warteg')->first();
        $this->assertNotNull($template);
        // is_ready selalu false saat baru dibuat — belum ada kategori
        $this->assertFalse($template->is_ready);
    }

    public function test_developer_can_add_category_and_is_ready_becomes_true(): void
    {
        $type = $this->storeType();
        $template = BusinessTemplate::create([
            'store_type_id' => $type->id,
            'code' => 'fnb_warteg',
            'label' => 'Warteg',
            'is_active' => true,
            'is_ready' => false,
        ]);

        $response = $this->withoutMiddleware(ValidateCsrfToken::class)
            ->actingAs($this->developer())
            ->post("/developer/business-templates/{$template->id}/categories", [
                'name' => 'Makanan',
                'sort_order' => 1,
            ]);

        $response->assertRedirect(route('developer.business-templates.categories', $template->id));

        $this->assertDatabaseHas('business_template_categories', [
            'business_template_id' => $template->id,
            'name' => 'Makanan',
        ]);
        $this->assertTrue($template->fresh()->is_ready);
    }

    public function test_is_ready_becomes_false_again_after_last_category_deleted(): void
    {
        $type = $this->storeType();
        $template = BusinessTemplate::create([
            'store_type_id' => $type->id,
            'code' => 'fnb_warteg',
            'label' => 'Warteg',
            'is_active' => true,
        ]);
        $category = $template->categories()->create(['name' => 'Makanan', 'sort_order' => 1]);
        $template->syncIsReady();
        $this->assertTrue($template->fresh()->is_ready);

        $this->withoutMiddleware(ValidateCsrfToken::class)
            ->actingAs($this->developer())
            ->delete("/developer/business-templates/{$template->id}/categories/{$category->id}")
            ->assertRedirect(route('developer.business-templates.categories', $template->id));

        $this->assertFalse($template->fresh()->is_ready);
    }

    public function test_developer_can_add_product_to_category(): void
    {
        $type = $this->storeType();
        $template = BusinessTemplate::create([
            'store_type_id' => $type->id,
            'code' => 'fnb_warteg',
            'label' => 'Warteg',
            'is_active' => true,
        ]);
        $category = $template->categories()->create(['name' => 'Makanan', 'sort_order' => 1]);

        $response = $this->withoutMiddleware(ValidateCsrfToken::class)
            ->actingAs($this->developer())
            ->post("/developer/business-templates/{$template->id}/categories/{$category->id}/products", [
                'sku' => 'WRT-001',
                'name' => 'Nasi Rames',
                'unit' => 'porsi',
                'cost_price' => 8000,
                'sell_price' => 15000,
            ]);

        $response->assertRedirect(route('developer.business-templates.categories', $template->id));

        $this->assertDatabaseHas('business_template_products', [
            'business_template_category_id' => $category->id,
            'sku' => 'WRT-001',
            'name' => 'Nasi Rames',
        ]);
    }

    public function test_product_from_another_category_cannot_be_updated_via_wrong_category(): void
    {
        $type = $this->storeType();
        $template = BusinessTemplate::create([
            'store_type_id' => $type->id,
            'code' => 'fnb_warteg',
            'label' => 'Warteg',
            'is_active' => true,
        ]);
        $categoryA = $template->categories()->create(['name' => 'Makanan', 'sort_order' => 1]);
        $categoryB = $template->categories()->create(['name' => 'Minuman', 'sort_order' => 2]);
        $product = BusinessTemplateProduct::create([
            'business_template_category_id' => $categoryA->id,
            'sku' => 'WRT-001',
            'name' => 'Nasi Rames',
            'unit' => 'porsi',
            'cost_price' => 8000,
            'sell_price' => 15000,
        ]);

        // Coba update produk milik kategori A lewat URL kategori B — controller
        // abort_if(404), tapi handler global aplikasi (bootstrap/app.php) mengubah
        // NotFoundHttpException jadi redirect ke dashboard + flash error untuk
        // request non-Inertia yang user-nya sudah login (bukan status 404 mentah).
        $response = $this->withoutMiddleware(ValidateCsrfToken::class)
            ->actingAs($this->developer())
            ->put("/developer/business-templates/{$template->id}/categories/{$categoryB->id}/products/{$product->id}", [
                'sku' => 'WRT-001',
                'name' => 'Diubah Paksa',
                'unit' => 'porsi',
                'cost_price' => 1,
                'sell_price' => 1,
            ]);

        $response->assertRedirect(route('admin.dashboard'));
        $response->assertSessionHas('error', 'Halaman tidak ditemukan.');
        $this->assertSame('Nasi Rames', $product->fresh()->name);
    }

    public function test_category_from_another_template_cannot_be_deleted_via_wrong_template(): void
    {
        $type = $this->storeType();
        $templateA = BusinessTemplate::create([
            'store_type_id' => $type->id, 'code' => 'a', 'label' => 'A', 'is_active' => true,
        ]);
        $templateB = BusinessTemplate::create([
            'store_type_id' => $type->id, 'code' => 'b', 'label' => 'B', 'is_active' => true,
        ]);
        $category = $templateA->categories()->create(['name' => 'Makanan', 'sort_order' => 1]);

        $response = $this->withoutMiddleware(ValidateCsrfToken::class)
            ->actingAs($this->developer())
            ->delete("/developer/business-templates/{$templateB->id}/categories/{$category->id}");

        $response->assertRedirect(route('admin.dashboard'));
        $response->assertSessionHas('error', 'Halaman tidak ditemukan.');
        $this->assertDatabaseHas('business_template_categories', ['id' => $category->id]);
    }

    public function test_developer_can_delete_template(): void
    {
        $type = $this->storeType();
        $template = BusinessTemplate::create([
            'store_type_id' => $type->id, 'code' => 'fnb_warteg', 'label' => 'Warteg', 'is_active' => true,
        ]);

        $this->withoutMiddleware(ValidateCsrfToken::class)
            ->actingAs($this->developer())
            ->delete("/developer/business-templates/{$template->id}")
            ->assertRedirect(route('developer.business-templates.index'));

        $this->assertDatabaseMissing('business_templates', ['id' => $template->id]);
    }

    public function test_deleting_template_cascades_categories_and_products(): void
    {
        $type = $this->storeType();
        $template = BusinessTemplate::create([
            'store_type_id' => $type->id, 'code' => 'fnb_warteg', 'label' => 'Warteg', 'is_active' => true,
        ]);
        $category = $template->categories()->create(['name' => 'Makanan', 'sort_order' => 1]);
        $product = BusinessTemplateProduct::create([
            'business_template_category_id' => $category->id,
            'sku' => 'WRT-001', 'name' => 'Nasi Rames', 'unit' => 'porsi',
            'cost_price' => 8000, 'sell_price' => 15000,
        ]);

        $template->delete();

        $this->assertDatabaseMissing('business_template_categories', ['id' => $category->id]);
        $this->assertDatabaseMissing('business_template_products', ['id' => $product->id]);
    }
}
