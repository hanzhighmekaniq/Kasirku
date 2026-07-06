<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Testing Model Relations ===\n\n";

try {
    echo "1. Testing Plan->features() relation...\n";
    $plan = App\Models\Plan::with('features')->first();
    if ($plan) {
        echo "   ✓ Plan found: {$plan->label}\n";
        echo "   ✓ Features count: " . $plan->features->count() . "\n";
    } else {
        echo "   ⚠ No plans found\n";
    }
} catch (\Exception $e) {
    echo "   ✗ Error: " . $e->getMessage() . "\n";
}

echo "\n";

try {
    echo "2. Testing Store->storeType() relation...\n";
    $store = App\Models\Store::with('storeType')->first();
    if ($store) {
        echo "   ✓ Store found: {$store->name}\n";
        echo "   ✓ Store Type: " . ($store->storeType?->code ?? 'null') . "\n";
    } else {
        echo "   ⚠ No stores found\n";
    }
} catch (\Exception $e) {
    echo "   ✗ Error: " . $e->getMessage() . "\n";
}

echo "\n";

try {
    echo "3. Testing Store->planModel() relation...\n";
    $store = App\Models\Store::with('planModel')->first();
    if ($store) {
        echo "   ✓ Store found: {$store->name}\n";
        echo "   ✓ Plan: " . ($store->planModel?->label ?? 'null') . "\n";
    } else {
        echo "   ⚠ No stores found\n";
    }
} catch (\Exception $e) {
    echo "   ✗ Error: " . $e->getMessage() . "\n";
}

echo "\n";

try {
    echo "4. Testing Feature->storeTypes() relation...\n";
    $feature = App\Models\Feature::with('storeTypes')->first();
    if ($feature) {
        echo "   ✓ Feature found: {$feature->label}\n";
        echo "   ✓ Store Types count: " . $feature->storeTypes->count() . "\n";
    } else {
        echo "   ⚠ No features found\n";
    }
} catch (\Exception $e) {
    echo "   ✗ Error: " . $e->getMessage() . "\n";
}

echo "\n=== Test Complete ===\n";
