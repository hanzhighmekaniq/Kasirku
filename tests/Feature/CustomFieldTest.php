<?php

use App\Models\Branch;
use App\Models\CustomField;
use App\Models\CustomFieldValue;
use App\Models\Feature;
use App\Models\Plan;
use App\Models\Store;
use App\Models\StoreType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

uses(RefreshDatabase::class);

function setupCustomFieldContext(): array
{
    $storeType = StoreType::create([
        'code' => 'retail', 'label' => 'Retail', 'is_active' => true, 'sort_order' => 0,
    ]);

    foreach (['settings'] as $code) {
        $f = Feature::create(['code' => $code, 'label' => $code, 'is_active' => true, 'sort_order' => 0]);
        $storeType->features()->attach($f->id);
    }

    $plan = Plan::create(['code' => 'basic', 'label' => 'Basic', 'is_active' => true, 'sort_order' => 0, 'price' => 0]);
    $plan->features()->attach(Feature::pluck('id'));

    $store = Store::create([
        'user_id' => null,
        'code' => 'TST'.uniqid(),
        'name' => 'Toko CustomField',
        'store_type_id' => $storeType->id,
        'plan_id' => $plan->id,
    ]);

    $branch = Branch::create([
        'store_id' => $store->id, 'code' => 'BR1', 'name' => 'Cabang Utama', 'is_active' => true,
    ]);

    $user = User::factory()->create();
    $store->users()->attach($user->id);

    app(PermissionRegistrar::class)->setPermissionsTeamId($store->id);
    $role = Role::create(['name' => 'owner-'.uniqid(), 'guard_id' => 1]);
    foreach (['setting.view', 'setting.edit'] as $permName) {
        $role->givePermissionTo(Permission::firstOrCreate(['name' => $permName], ['guard_id' => 1]));
    }
    $user->assignRole($role);

    return [$store, $branch, $user];
}

test('store creates a custom field', function () {
    [$store, $branch, $user] = setupCustomFieldContext();
    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'current_branch_id' => $branch->id]);

    $response = $this->postJson(route('admin.custom-fields.store'), [
        'entity_type' => 'product',
        'field_name' => 'origin',
        'field_label' => 'Origin Country',
        'field_type' => 'text',
    ]);

    $response->assertSuccessful();
    $this->assertDatabaseHas('custom_fields', [
        'field_name' => 'origin',
        'entity_type' => 'product',
    ]);
});

test('store rejects duplicate field_name per entity', function () {
    [$store, $branch, $user] = setupCustomFieldContext();
    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'current_branch_id' => $branch->id]);

    CustomField::create([
        'store_id' => $store->id,
        'entity_type' => 'product',
        'field_name' => 'origin',
        'field_label' => 'Origin Country',
        'field_type' => 'text',
    ]);

    $response = $this->postJson(route('admin.custom-fields.store'), [
        'entity_type' => 'product',
        'field_name' => 'origin',
        'field_label' => 'Origin Country',
        'field_type' => 'text',
    ]);

    $response->assertUnprocessable();
    $response->assertJsonValidationErrors('field_name');
});

test('update modifies field label', function () {
    [$store, $branch, $user] = setupCustomFieldContext();
    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'current_branch_id' => $branch->id]);

    $field = CustomField::create([
        'store_id' => $store->id,
        'entity_type' => 'product',
        'field_name' => 'origin',
        'field_label' => 'Origin Country',
        'field_type' => 'text',
    ]);

    $response = $this->putJson(route('admin.custom-fields.update', $field), [
        'field_label' => 'Updated Label',
    ]);

    $response->assertSuccessful();
    expect($field->fresh()->field_label)->toBe('Updated Label');
});

test('destroy removes custom field', function () {
    [$store, $branch, $user] = setupCustomFieldContext();
    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'current_branch_id' => $branch->id]);

    $field = CustomField::create([
        'store_id' => $store->id,
        'entity_type' => 'product',
        'field_name' => 'origin',
        'field_label' => 'Origin Country',
        'field_type' => 'text',
    ]);

    $response = $this->deleteJson(route('admin.custom-fields.destroy', $field));

    $response->assertSuccessful();
    $this->assertDatabaseMissing('custom_fields', ['id' => $field->id]);
});

test('saveValues saves values for entity', function () {
    [$store, $branch, $user] = setupCustomFieldContext();
    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'current_branch_id' => $branch->id]);

    $field = CustomField::create([
        'store_id' => $store->id,
        'entity_type' => 'product',
        'field_name' => 'origin',
        'field_label' => 'Origin Country',
        'field_type' => 'text',
    ]);

    $response = $this->postJson(route('admin.custom-fields.saveValues'), [
        'entity_type' => 'product',
        'entity_id' => 1,
        'values' => [
            ['custom_field_id' => $field->id, 'value' => 'Indonesia'],
        ],
    ]);

    $response->assertSuccessful();
    $this->assertDatabaseHas('custom_field_values', [
        'custom_field_id' => $field->id,
        'entity_id' => 1,
        'value' => 'Indonesia',
    ]);
});

test('getValues returns values with field metadata', function () {
    [$store, $branch, $user] = setupCustomFieldContext();
    $this->actingAs($user);
    session(['current_store_id' => $store->id, 'current_branch_id' => $branch->id]);

    $field = CustomField::create([
        'store_id' => $store->id,
        'entity_type' => 'product',
        'field_name' => 'origin',
        'field_label' => 'Origin Country',
        'field_type' => 'text',
    ]);

    CustomFieldValue::create([
        'custom_field_id' => $field->id,
        'entity_id' => 1,
        'value' => 'Indonesia',
    ]);

    $response = $this->getJson(route('admin.custom-fields.values', [
        'entity_type' => 'product',
        'entity_id' => 1,
    ]));

    $response->assertSuccessful();
    $response->assertJsonPath('fields.0.field_name', 'origin');
    $response->assertJsonPath('fields.0.field_label', 'Origin Country');
    $response->assertJsonPath('fields.0.value', 'Indonesia');
});
