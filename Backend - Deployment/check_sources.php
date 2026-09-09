<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$sources = DB::table('database_sources')->get();
echo "Database Sources count: " . $sources->count() . "\n";
foreach ($sources as $s) {
    print_r((array)$s);
}
