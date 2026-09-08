<?php

require __DIR__ . '/vendor/autoload.php';

use Illuminate\Encryption\Encrypter;

$envFiles = [
    'C:\Users\Kriscel Aquiman\CAPS\Backend - Deployment\.env',
    'C:\Users\Kriscel Aquiman\CAPS---LOCAL\Backend - Deployment\.env',
    'C:\Users\Kriscel Aquiman\CAPS---LOCAL\Backend - Deployment\.env',
];

$pdo = new PDO(
    'mysql:host=127.0.0.1;port=3306;dbname=caps;charset=utf8mb4',
    'root',
    ''
);

$row = $pdo->query(
    "SELECT questionID, questionText
     FROM questions
     WHERE questionID = 108
     LIMIT 1"
)->fetch(PDO::FETCH_ASSOC);

if (!$row) {
    exit("questionID 108 was not found.\n");
}

echo "Testing encrypted questionID: 108\n\n";

foreach ($envFiles as $file) {

    echo "----------------------------------------\n";
    echo "FILE: $file\n";

    if (!file_exists($file)) {
        echo "RESULT: FILE NOT FOUND\n";
        continue;
    }

    $lines = file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    $appKey = null;

    foreach ($lines as $line) {
        if (str_starts_with(trim($line), 'APP_KEY=')) {
            $appKey = trim(substr(trim($line), strlen('APP_KEY=')));
            break;
        }
    }

    if (!$appKey) {
        echo "RESULT: NO APP_KEY\n";
        continue;
    }

    if (str_starts_with($appKey, 'base64:')) {
        $key = base64_decode(substr($appKey, 7), true);
    } else {
        $key = $appKey;
    }

    if ($key === false || $key === '') {
        echo "RESULT: INVALID KEY FORMAT\n";
        continue;
    }

    $matched = false;

    foreach (['AES-256-CBC', 'AES-128-CBC'] as $cipher) {
        try {
            $encrypter = new Encrypter($key, $cipher);
            $encrypter->decrypt($row['questionText'], false);

            echo "RESULT: MATCH FOUND\n";
            echo "CIPHER: $cipher\n";
            $matched = true;
            break;
        } catch (Throwable $e) {
        }
    }

    if (!$matched) {
        echo "RESULT: NO MATCH\n";
    }
}

echo "\n----------------------------------------\n";
echo "TEST COMPLETE\n";
