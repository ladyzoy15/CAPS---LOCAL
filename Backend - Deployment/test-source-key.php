<?php

require __DIR__ . '/vendor/autoload.php';

use Illuminate\Encryption\Encrypter;
use Illuminate\Support\Facades\Crypt;

$oldEnv = 'C:\Users\Kriscel Aquiman\CAPS\Backend - Deployment\.env';

$line = collect(file($oldEnv, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES))
    ->first(fn($line) => str_starts_with(trim($line), 'APP_KEY='));

$sourceKey = trim(substr($line, strlen('APP_KEY=')));

echo "Source key found: " . (!empty($sourceKey) ? "YES" : "NO") . PHP_EOL;
echo "Source key starts base64: " . (str_starts_with($sourceKey, 'base64:') ? "YES" : "NO") . PHP_EOL;

if (str_starts_with($sourceKey, 'base64:')) {
    $sourceKey = base64_decode(substr($sourceKey, 7));
}

$encrypter = new Encrypter($sourceKey, 'AES-256-CBC');

$pdo = new PDO(
    'mysql:host=127.0.0.1;port=3306;dbname=caps_import;charset=utf8mb4',
    'root',
    ''
);

$stmt = $pdo->query(
    "SELECT questionID, questionText
     FROM questions
     WHERE questionText IS NOT NULL
     LIMIT 1"
);

$row = $stmt->fetch(PDO::FETCH_ASSOC);

echo "Testing questionID: " . $row['questionID'] . PHP_EOL;

try {
    $plain = $encrypter->decrypt($row['questionText'], false);

    echo "====================================" . PHP_EOL;
    echo "SOURCE APP KEY MATCH: YES" . PHP_EOL;
    echo "Question decrypted successfully." . PHP_EOL;
    echo "====================================" . PHP_EOL;
} catch (Throwable $e) {
    echo "====================================" . PHP_EOL;
    echo "SOURCE APP KEY MATCH: NO" . PHP_EOL;
    echo "Reason: " . $e->getMessage() . PHP_EOL;
    echo "====================================" . PHP_EOL;
}
