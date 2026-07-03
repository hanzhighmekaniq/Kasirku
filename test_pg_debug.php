<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$sale = \App\Models\Sale::with('pgTransactions')->find(19);
echo "Sale #19 status: " . $sale->status . " | payment_status: " . $sale->payment_status . PHP_EOL;
echo "pgTransactions count: " . $sale->pgTransactions->count() . PHP_EOL;

foreach ($sale->pgTransactions as $t) {
    echo "  PG id:" . $t->id . " status:" . $t->status . " type:" . $t->payment_type . PHP_EOL;
    $raw = $t->raw_response;
    echo "  raw_response keys: " . implode(', ', array_keys($raw ?? [])) . PHP_EOL;
    if (isset($raw['actions'])) {
        echo "  actions[0] url: " . ($raw['actions'][0]['url'] ?? 'N/A') . PHP_EOL;
    }
    echo "  qr_string: " . substr($raw['qr_string'] ?? 'N/A', 0, 60) . PHP_EOL;
}
