<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Modules\Subjects\Models\Subject;
use Modules\Questions\Models\Question;
use Illuminate\Support\Facades\Crypt;

$subjects = Subject::with('program', 'yearLevel')->get();
echo "Found " . $subjects->count() . " subjects.\n";

$result = [];

foreach ($subjects as $subject) {
    $questions = Question::with(['choices', 'status', 'difficulty', 'coverage', 'purpose'])
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
        try {
            $qText = Crypt::decryptString($q->questionText);
        } catch (\Exception $e) {
            $qText = "[Decryption Error]";
        }

        $choices = [];
        foreach ($q->choices as $c) {
            try {
                $cText = Crypt::decryptString($c->choiceText);
            } catch (\Exception $e) {
                $cText = "[Decryption Error]";
            }
            $choices[] = [
                'text' => $cText ? strip_tags($cText) : '',
                'isCorrect' => $c->isCorrect
            ];
        }

        $subjData['questions'][] = [
            'id' => $q->questionID,
            'text' => $qText ? strip_tags($qText) : '',
            'score' => $q->score,
            'status' => optional($q->status)->name,
            'difficulty' => optional($q->difficulty)->name,
            'coverage' => optional($q->coverage)->name,
            'purpose' => optional($q->purpose)->name,
            'choices' => $choices
        ];
    }

    $result[] = $subjData;
}

file_put_contents(__DIR__ . '/exported_questions.json', json_encode($result, JSON_PRETTY_PRINT));
echo "Successfully exported " . count($result) . " subjects to exported_questions.json\n";
