<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Crypt;

$source = DB::table('database_sources')->where('id', 1)->first();
$decryptedPassword = Crypt::decryptString($source->password);

config([
    'database.connections.client_source' => [
        'driver'    => $source->driver,
        'host'      => $source->host,
        'port'      => $source->port,
        'database'  => $source->database,
        'username'  => $source->username,
        'password'  => $decryptedPassword,
        'charset'   => 'utf8mb4',
        'collation' => 'utf8mb4_unicode_ci',
        'prefix'    => '',
    ]
]);

$clientDb = DB::connection('client_source');

$qImages = $clientDb->table('questions')
    ->whereNotNull('image')
    ->where('image', '!=', '')
    ->pluck('image')
    ->take(10);

$cImages = $clientDb->table('choices')
    ->whereNotNull('image')
    ->where('image', '!=', '')
    ->pluck('image')
    ->take(10);

echo "--- Question Image Paths in client_db ---\n";
foreach ($qImages as $img) {
    echo $img . "\n";
}

echo "\n--- Choice Image Paths in client_db ---\n";
foreach ($cImages as $img) {
    echo $img . "\n";
}
