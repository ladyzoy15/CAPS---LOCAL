<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Modules\Questions\Models\Question;
use Modules\Choices\Models\Choice;
use Illuminate\Support\Facades\Storage;

$questionsWithImg = Question::whereNotNull('image')->where('image', '!=', '')->get();
$choicesWithImg = Choice::whereNotNull('image')->where('image', '!=', '')->get();

echo "Main DB (arc_db) Questions with image: " . $questionsWithImg->count() . "\n";
echo "Main DB (arc_db) Choices with image: " . $choicesWithImg->count() . "\n";

foreach ($questionsWithImg->take(10) as $q) {
    $path = $q->image;
    $existsPublic = Storage::disk('public')->exists($path);
    $fullPath = storage_path('app/public/' . $path);
    $existsFile = file_exists($fullPath);
    echo "Question ID {$q->questionID} Image: '{$path}' | Exists in Public Disk: " . ($existsPublic ? "YES" : "NO") . " | File path: {$fullPath} (" . ($existsFile ? "FOUND" : "NOT FOUND") . ")\n";
}

foreach ($choicesWithImg->take(10) as $c) {
    $path = $c->image;
    $existsPublic = Storage::disk('public')->exists($path);
    $fullPath = storage_path('app/public/' . $path);
    $existsFile = file_exists($fullPath);
    echo "Choice ID {$c->choiceID} Image: '{$path}' | Exists in Public Disk: " . ($existsPublic ? "YES" : "NO") . " | File path: {$fullPath} (" . ($existsFile ? "FOUND" : "NOT FOUND") . ")\n";
}
