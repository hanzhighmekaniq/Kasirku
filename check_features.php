<?php
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=== SEMUA FEATURES DI DB ===\n";
$features = App\Models\Feature::orderBy('sort_order')->get();
echo "Total: " . $features->count() . "\n\n";
foreach ($features as $f) {
    echo sprintf("%-4s %-22s %-12s %s\n", $f->sort_order, $f->code, $f->category, $f->label);
}

echo "\n=== FEATURES PER PLAN ===\n";
$plans = App\Models\Plan::with('planFeatures')->orderBy('sort_order')->get();
foreach ($plans as $p) {
    $codes = $p->planFeatures->pluck('code')->sort()->values();
    echo "\n[{$p->code}] {$p->label} — {$codes->count()} fitur\n";
    foreach ($codes->chunk(5) as $chunk) {
        echo "  " . $chunk->join(', ') . "\n";
    }
}
