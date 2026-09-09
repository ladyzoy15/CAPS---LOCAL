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
    echo "Decrypted password for source {$source->name}: '$decryptedPassword'\n";

    // Set dynamic connection
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
    $subjects = $clientDb->table('subjects')->get();
    echo "Found " . $subjects->count() . " subjects in {$source->database}:\n";

    $result = [];

    foreach ($subjects as $subject) {
        $questions = $clientDb->table('questions')
            ->where('subjectID', $subject->subjectID)
            ->get();

        if ($questions->count() == 0) continue;

        echo "Subject: {$subject->subjectCode} - {$subject->subjectName} (Questions: {$questions->count()})\n";

        $subjData = [
            'subjectID' => $subject->subjectID,
            'subjectCode' => $subject->subjectCode,
            'subjectName' => $subject->subjectName,
            'questions' => []
        ];

        foreach ($questions as $q) {
            $qText = "";
            try {
                $qText = $sourceEncrypter->decryptString($q->questionText);
            } catch (\Exception $e) {
                try {
                    $qText = Crypt::decryptString($q->questionText);
                } catch (\Exception $e2) {
                    $qText = $q->questionText;
                }
            }

            $choicesRaw = $clientDb->table('choices')->where('questionID', $q->questionID)->get();
            $choices = [];
            foreach ($choicesRaw as $c) {
                $cText = "";
                try {
                    $cText = $sourceEncrypter->decryptString($c->choiceText);
                } catch (\Exception $e) {
                    try {
                        $cText = Crypt::decryptString($c->choiceText);
                    } catch (\Exception $e2) {
                        $cText = $c->choiceText;
                    }
                }
                $choices[] = [
                    'text' => $cText ? trim(strip_tags($cText)) : '',
                    'raw_text' => $cText,
                    'isCorrect' => (bool)$c->isCorrect
                ];
            }

            $diffName = $clientDb->table('difficulties')->where('id', $q->difficulty_id)->value('name');
            $covName = $clientDb->table('coverages')->where('id', $q->coverage_id)->value('name');
            $statName = $clientDb->table('statuses')->where('id', $q->status_id)->value('name');
            $purpName = $clientDb->table('purposes')->where('id', $q->purpose_id)->value('name');

            $subjData['questions'][] = [
                'id' => $q->questionID,
                'text' => $qText ? trim(strip_tags($qText)) : '',
                'raw_text' => $qText,
                'score' => $q->score,
                'status' => $statName,
                'difficulty' => $diffName,
                'coverage' => $covName,
                'purpose' => $purpName,
                'choices' => $choices
            ];
        }

        $result[] = $subjData;
    }

    file_put_contents(__DIR__ . '/exported_client_questions.json', json_encode($result, JSON_PRETTY_PRINT));
    echo "\nSuccessfully exported and decrypted " . count($result) . " subjects from Client CAPS Database!\n";

} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n" . $e->getTraceAsString() . "\n";
}
