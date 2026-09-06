<?php

require __DIR__ . '/vendor/autoload.php';

use Illuminate\Encryption\Encrypter;

$roots = [
    'C:\Users\Kriscel Aquiman\CAPS',
    'C:\Users\Kriscel Aquiman\CAPS---LOCAL',
    'C:\Users\Kriscel Aquiman\Downloads',
    'C:\Users\Kriscel Aquiman\Desktop',
    'C:\Users\Kriscel Aquiman\Documents',
];

$files = [];

foreach ($roots as $root) {
    if (!is_dir($root)) {
        continue;
    }

    $iterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator(
            $root,
            FilesystemIterator::SKIP_DOTS
        )
    );

    foreach ($iterator as $file) {
        if (!$file->isFile()) {
            continue;
        }

        if (strtolower($file->getFilename()) !== '.env') {
            continue;
        }

        $files[] = $file->getPathname();
    }
}

$files = array_values(array_unique($files));

$pdo = new PDO(
    'mysql:host=127.0.0.1;port=3306;dbname=caps_import;charset=utf8mb4',
    'root',
    ''
);

$row = $pdo->query(
    "SELECT questionID, questionText
     FROM questions
     WHERE questionText IS NOT NULL
       AND questionText <> ''
     ORDER BY questionID
     LIMIT 1"
)->fetch(PDO::FETCH_ASSOC);

if (!$row) {
    exit("No encrypted question found.\n");
}

echo "Testing questionID: {$row['questionID']}\n";
echo "Found .env files: " . count($files) . "\n\n";

$found = false;

foreach ($files as $file) {
    $lines = @file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

    if (!$lines) {
        continue;
    }

    foreach ($lines as $line) {
        $line = trim($line);

        if (!str_starts_with($line, 'APP_KEY=')) {
            continue;
        }

        $key = trim(substr($line, strlen('APP_KEY=')));

        if ($key === '') {
            continue;
        }

        $decoded = $key;

        if (str_starts_with($decoded, 'base64:')) {
            $decoded = base64_decode(substr($decoded, 7), true);
        }

        if ($decoded === false || $decoded === '') {
            continue;
        }

        foreach (['AES-256-CBC', 'AES-128-CBC'] as $cipher) {
            try {
                $encrypter = new Encrypter($decoded, $cipher);
                $encrypter->decrypt($row['questionText'], false);

                echo "========================================\n";
                echo "MATCH FOUND!\n";
                echo "File: {$file}\n";
                echo "Cipher: {$cipher}\n";
                echo "========================================\n";

                $found = true;
                break 2;
            } catch (Throwable $e) {
                // Wrong key/cipher. Continue testing.
            }
        }
    }
}

if (!$found) {
    echo "========================================\n";
    echo "NO MATCH FOUND IN LOCAL .ENV FILES.\n";
    echo "========================================\n";
}
