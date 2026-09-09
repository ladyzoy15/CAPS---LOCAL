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
$questions = $clientDb->table('questions')->get();

$imgCount = 0;
$dataUrlCount = 0;

echo "Scanning " . $questions->count() . " questions in client_db for embedded images/HTML...\n";

foreach ($questions as $q) {
    try {
        $text = $sourceEncrypter->decryptString($q->questionText);
    } catch (\Exception $e) {
        $text = $q->questionText;
    }

    if (stripos($text, '<img') !== false || stripos($text, 'src=') !== false) {
        $imgCount++;
        echo "\n[Question ID {$q->questionID} has HTML img tag]:\n";
        echo substr($text, 0, 300) . "\n";
    }

    if (stripos($text, 'data:image') !== false) {
        $dataUrlCount++;
    }
}

$choices = $clientDb->table('choices')->get();
echo "\nScanning " . $choices->count() . " choices in client_db...\n";
$choiceImgCount = 0;
foreach ($choices as $c) {
    try {
        $text = $sourceEncrypter->decryptString($c->choiceText);
    } catch (\Exception $e) {
        $text = $c->choiceText;
    }

    if (stripos($text, '<img') !== false || stripos($text, 'src=') !== false) {
        $choiceImgCount++;
        echo "\n[Choice ID {$c->choiceID} has HTML img tag]:\n";
        echo substr($text, 0, 300) . "\n";
    }
}

echo "\nSummary:\n";
echo "Questions with <img / src: $imgCount\n";
echo "Questions with data:image: $dataUrlCount\n";
echo "Choices with <img / src: $choiceImgCount\n";
