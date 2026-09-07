<?php

require __DIR__ . '/vendor/autoload.php';

use Illuminate\Encryption\Encrypter;

$encrypted = 'eyJpdiI6IkpaWGFvU1MzTGlhdHdhVk5YWmxRRUE9PSIsInZhbHVlIjoiOFg1WHp5WTJTVEQ0VmVSamhGcC9FeFZXdEhKTWdoUmdDM1VHbitCYWsrQmRERlFsQXN0bC9DUjV1Ty9ReDN5VDlpQUVHVHNwMnJYNVdrOXJoeWhER1JmUHBEelV0REpMWHdzcU43MGRsSzBD';

$key = 'base64:fvlguvpXXiHRQN/r735X6Q3Up3uAPBJn7bNxJEhA8DI=';

$key = base64_decode(substr($key, 7));

$encrypter = new Encrypter($key, 'AES-256-CBC');

try {
    $decrypted = $encrypter->decrypt($encrypted);

    echo "SUCCESS!" . PHP_EOL;
    echo "DECRYPTED QUESTION:" . PHP_EOL;
    echo $decrypted . PHP_EOL;
} catch (Throwable $e) {
    echo "FAILED" . PHP_EOL;
    echo $e->getMessage() . PHP_EOL;
}
