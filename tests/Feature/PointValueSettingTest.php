<?php

namespace Tests\Feature;

use App\Models\Store;
use App\Models\StoreType;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('store can save point_value setting', function () {
    $type = StoreType::first() ?? StoreType::create(['label' => 'Retail', 'code' => 'retail', 'pos_behavior' => 'retail']);
    $store = Store::create(['store_type_id' => $type->id, 'name' => 'Test Store', 'code' => 'TEST', 'point_value' => 1000]);
    $store->update(['point_value' => 500]);
    $this->assertEquals(500, (int) $store->fresh()->point_value);
});
