<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Testing Features Query ===\n\n";

// Test 1: Check features table
echo "1. Features in database:\n";
$features = DB::table('features')->select('id', 'code', 'label')->take(5)->get();
echo "   Count: " . $features->count() . "\n";
foreach ($features as $f) {
    echo "   - {$f->code}: {$f->label}\n";
}

echo "\n2. Feature Details in database:\n";
$featureDetails = DB::table('feature_details')->select('id', 'feature_id', 'code', 'label')->take(5)->get();
echo "   Count: " . $featureDetails->count() . "\n";
foreach ($featureDetails as $fd) {
    echo "   - Feature ID {$fd->feature_id}: {$fd->code} - {$fd->label}\n";
}

echo "\n3. Plan Feature Relations:\n";
$planFeatures = DB::table('plan_feature')->take(5)->get();
echo "   Count: " . $planFeatures->count() . "\n";
foreach ($planFeatures as $pf) {
    echo "   - Plan {$pf->plan_id} has Feature {$pf->feature_id}\n";
}

echo "\n4. Testing Plan with Features relation:\n";
$plan = App\Models\Plan::first();
if ($plan) {
    echo "   Plan: {$plan->label}\n";
    echo "   Trying to load features...\n";
    $plan->load('features');
    $featuresLoaded = $plan->getRelation('features');
    echo "   Features loaded: " . ($featuresLoaded ? 'Yes' : 'No') . "\n";
    if ($featuresLoaded) {
        echo "   Features count: " . $featuresLoaded->count() . "\n";
    }
}

echo "\n=== Test Complete ===\n";
