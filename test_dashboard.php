<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

// Create a request as authenticated user
$request = Illuminate\Http\Request::create('/admin/dashboard', 'GET');

// Set session cookie manually
$session = $app->make('session');

// Boot auth
$app->make('auth')->loginUsingId(1);

$user = $app->make('auth')->user();
echo "Logged in as: " . $user->email . PHP_EOL;
echo "Store ID: " . $user->store_id . PHP_EOL;

try {
    $response = $kernel->handle($request);
    echo "Status: " . $response->getStatusCode() . PHP_EOL;
    if ($response->getStatusCode() >= 400) {
        echo "Content: " . substr($response->getContent(), 0, 2000) . PHP_EOL;
    }
} catch (\Throwable $e) {
    echo "Exception: " . get_class($e) . PHP_EOL;
    echo "Message: " . $e->getMessage() . PHP_EOL;
    echo "File: " . $e->getFile() . ":" . $e->getLine() . PHP_EOL;
}
