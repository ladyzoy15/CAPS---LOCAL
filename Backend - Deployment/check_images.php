<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Encryption\Encrypter;

try {
    $sourceAppKey = env('SOURCE_APP_KEY', 'base64:fvlguvpXXiHRQN/r735X6Q3Up3uAPBJn7bNxJEhA8DI=');
    $key = base64_decode(str_replace('base64:', '', $sourceAppKey));
    $sourceEncrypter = new Encrypter($key, 'AES-256-CBC');

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

    // Count questions with images
    $questionsWithImg = $clientDb->table('questions')->whereNotNull('image')->where('image', '!=', '')->count();
    $choicesWithImg = $clientDb->table('choices')->whereNotNull('image')->where('image', '!=', '')->count();

    echo "Questions with images in client_db: $questionsWithImg\n";
    echo "Choices with images in client_db: $choicesWithImg\n";

    $sampleQuestionImg = $clientDb->table('questions')->whereNotNull('image')->where('image', '!=', '')->first();
    if ($sampleQuestionImg) {
        echo "Sample Question Image Path: " . $sampleQuestionImg->image . "\n";
    }

    $sampleChoiceImg = $clientDb->table('choices')->whereNotNull('image')->where('image', '!=', '')->first();
    if ($sampleChoiceImg) {
        echo "Sample Choice Image Path: " . $sampleChoiceImg->image . "\n";
    }

} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
