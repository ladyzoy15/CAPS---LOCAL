<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Encryption\Encrypter;

$sourceAppKey = env('SOURCE_APP_KEY', 'base64:fvlguvpXXiHRQN/r735X6Q3Up3uAPBJn7bNxJEhA8DI=');
$key = base64_decode(str_replace('base64:', '', $sourceAppKey));
$encrypter = new Encrypter($key, 'AES-256-CBC');

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
$question = $clientDb->table('questions')->first();

echo "Raw Question Text: {$question->questionText}\n";

try {
    $decrypted = $encrypter->decryptString($question->questionText);
    echo "Decrypted with SOURCE_APP_KEY: '$decrypted'\n";
} catch (\Exception $e) {
    echo "Failed with SOURCE_APP_KEY: " . $e->getMessage() . "\n";
}

try {
    $decrypted2 = Crypt::decryptString($question->questionText);
    echo "Decrypted with APP_KEY: '$decrypted2'\n";
} catch (\Exception $e) {
    echo "Failed with APP_KEY: " . $e->getMessage() . "\n";
}
