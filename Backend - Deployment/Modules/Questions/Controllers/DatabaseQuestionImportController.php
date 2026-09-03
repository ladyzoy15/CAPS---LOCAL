<?php

namespace Modules\Questions\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class DatabaseQuestionImportController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | SOURCE DATABASE
    |--------------------------------------------------------------------------
    |
    | This connection points to the external MySQL database:
    |
    |     caps
    |
    | The destination remains the normal Laravel application database.
    |
    */

    private string $sourceConnection = 'mysql_import';

    /*
    |--------------------------------------------------------------------------
    | Allowed roles
    |--------------------------------------------------------------------------
    */

    private function authorizeRoles(): void
    {
        $user = Auth::user();

        if (!$user || !in_array((int) $user->roleID, [2, 3, 4, 5], true)) {
            abort(403, 'You are not authorized to import questions.');
        }
    }

    /*
    |--------------------------------------------------------------------------
    | GET SOURCE SUBJECTS
    |--------------------------------------------------------------------------
    |
    | Returns subjects from caps.subjects.
    |
    */

    public function subjects()
    {
        $this->authorizeRoles();

        try {
            $subjects = DB::connection($this->sourceConnection)
                ->table('subjects')
                ->select([
                    'subjectID',
                    'subjectCode',
                    'subjectName',
                    'programID',
                    'yearLevelID',
                    'is_enabled_for_exam_questions',
                ])
                ->orderBy('subjectName')
                ->orderBy('subjectCode')
                ->get();

            return response()->json([
                'message' => 'Source subjects retrieved successfully.',
                'data' => $subjects,
            ]);
        } catch (\Throwable $e) {
            Log::error('Database import: failed to retrieve source subjects.', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Unable to connect to the source database.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | GET SOURCE QUESTIONS BY SUBJECT
    |--------------------------------------------------------------------------
    |
    | Only questions belonging to the selected source subject are returned.
    |
    */

    public function questions($subjectID)
    {
        $this->authorizeRoles();

        try {
            $source = DB::connection($this->sourceConnection);

            $subject = $source
                ->table('subjects')
                ->where('subjectID', $subjectID)
                ->first();

            if (!$subject) {
                return response()->json([
                    'message' => 'Source subject not found.',
                ], 404);
            }

            $questions = $source
                ->table('questions')
                ->where('questions.subjectID', $subjectID)
                ->whereExists(function ($query) {
                    $query->select(DB::raw(1))
                        ->from('choices')
                        ->whereColumn(
                            'choices.questionID',
                            'questions.questionID'
                        );
                })
                ->orderBy('questions.questionID')
                ->get();

            $questionIDs = $questions
                ->pluck('questionID')
                ->values()
                ->all();

            $choices = collect();

            if (!empty($questionIDs)) {
                $choices = $source
                    ->table('choices')
                    ->whereIn('questionID', $questionIDs)
                    ->orderBy('questionID')
                    ->orderBy('position')
                    ->get()
                    ->groupBy('questionID');
            }

            $formatted = $questions->map(function ($question) use ($choices) {
                $questionText = $this->decryptValue(
                    $question->questionText
                );

                $questionChoices = ($choices[$question->questionID] ?? collect())
                    ->map(function ($choice) {
                        return [
                            'choiceID' => $choice->choiceID,
                            'choiceText' => $this->decryptValue(
                                $choice->choiceText
                            ),
                            'isCorrect' => (bool) $choice->isCorrect,
                            'position' => (int) $choice->position,
                            'image' => $choice->image,
                        ];
                    })
                    ->values()
                    ->all();

                return [
                    'questionID' => $question->questionID,
                    'subjectID' => $question->subjectID,
                    'questionText' => $questionText,
                    'image' => $question->image,
                    'score' => (int) $question->score,
                    'difficulty_id' => $question->difficulty_id,
                    'coverage_id' => $question->coverage_id,
                    'purpose_id' => $question->purpose_id,
                    'status_id' => $question->status_id,
                    'choices' => $questionChoices,
                ];
            })->values();

            return response()->json([
                'message' => 'Source questions retrieved successfully.',
                'subject' => [
                    'subjectID' => $subject->subjectID,
                    'subjectCode' => $subject->subjectCode,
                    'subjectName' => $subject->subjectName,
                ],
                'count' => $formatted->count(),
                'data' => $formatted,
            ]);
        } catch (\Throwable $e) {
            Log::error('Database import: failed to retrieve source questions.', [
                'subjectID' => $subjectID,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Unable to retrieve questions from the source database.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | IMPORT SELECTED QUESTIONS
    |--------------------------------------------------------------------------
    |
    | Source:
    |     caps.questions
    |     caps.choices
    |
    | Destination:
    |     normal Laravel application database
    |
    | A NEW questionID and NEW choiceIDs are generated.
    |
    */

    public function import(Request $request)
    {
        $this->authorizeRoles();

        $validated = $request->validate([
            'destinationSubjectID' => 'required',
            'questionIDs' => 'required|array|min:1',
            'questionIDs.*' => 'required|integer',
        ]);

        $destinationSubjectID = $validated['destinationSubjectID'];
        $questionIDs = array_values(
            array_unique(
                array_map('intval', $validated['questionIDs'])
            )
        );

        try {
            $source = DB::connection($this->sourceConnection);

            /*
            |--------------------------------------------------------------------------
            | Verify destination subject exists in the CURRENT application DB
            |--------------------------------------------------------------------------
            */

            $destinationSubjectExists = DB::table('subjects')
                ->where('subjectID', $destinationSubjectID)
                ->exists();

            if (!$destinationSubjectExists) {
                return response()->json([
                    'message' => 'Destination subject does not exist.',
                ], 422);
            }

            /*
            |--------------------------------------------------------------------------
            | Get source questions
            |--------------------------------------------------------------------------
            */

            $sourceQuestions = $source
                ->table('questions')
                ->whereIn('questionID', $questionIDs)
                ->get();

            if ($sourceQuestions->isEmpty()) {
                return response()->json([
                    'message' => 'No source questions were found.',
                ], 404);
            }

            /*
            |--------------------------------------------------------------------------
            | Get source choices
            |--------------------------------------------------------------------------
            */

            $sourceChoices = $source
                ->table('choices')
                ->whereIn('questionID', $sourceQuestions->pluck('questionID'))
                ->orderBy('questionID')
                ->orderBy('position')
                ->get()
                ->groupBy('questionID');

            /*
            |--------------------------------------------------------------------------
            | Import into current Laravel database
            |--------------------------------------------------------------------------
            */

            $result = DB::transaction(function () use (
                $sourceQuestions,
                $sourceChoices,
                $destinationSubjectID
            ) {
                $imported = [];
                $failed = [];

                foreach ($sourceQuestions as $sourceQuestion) {
                    try {
                        $choices = $sourceChoices[
                            $sourceQuestion->questionID
                        ] ?? collect();

                        if ($choices->isEmpty()) {
                            $failed[] = [
                                'sourceQuestionID' => $sourceQuestion->questionID,
                                'reason' => 'Question has no choices.',
                            ];

                            continue;
                        }

                        /*
                        |--------------------------------------------------------------------------
                        | Create NEW question
                        |--------------------------------------------------------------------------
                        */

                        $newQuestionID = DB::table('questions')->insertGetId([
                            'subjectID' => $destinationSubjectID,
                            'userID' => Auth::id(),
                            'questionText' => Crypt::encryptString(
                                $this->decryptValue(
                                    $sourceQuestion->questionText
                                )
                            ),
                            'image' => $this->copyQuestionImage(
                                $sourceQuestion->image
                            ),
                            'score' => (int) ($sourceQuestion->score ?? 1),
                            'difficulty_id' => $sourceQuestion->difficulty_id,
                            'coverage_id' => $sourceQuestion->coverage_id,
                            'purpose_id' => $sourceQuestion->purpose_id,
                            'status_id' => $sourceQuestion->status_id,
                            'editedBy' => null,
                            'approvedBy' => null,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);

                        /*
                        |--------------------------------------------------------------------------
                        | Create NEW choices
                        |--------------------------------------------------------------------------
                        */

                        foreach ($choices as $choice) {
                            DB::table('choices')->insert([
                                'questionID' => $newQuestionID,
                                'choiceText' => $choice->choiceText !== null
                                    ? Crypt::encryptString(
                                        $this->decryptValue(
                                            $choice->choiceText
                                        )
                                    )
                                    : null,
                                'isCorrect' => (int) $choice->isCorrect,
                                'image' => $this->copyChoiceImage(
                                    $choice->image
                                ),
                                'position' => (int) ($choice->position ?? 0),
                                'created_at' => now(),
                                'updated_at' => now(),
                            ]);
                        }

                        $imported[] = [
                            'sourceQuestionID' => $sourceQuestion->questionID,
                            'newQuestionID' => $newQuestionID,
                        ];
                    } catch (\Throwable $e) {
                        Log::error(
                            'Database import: individual question failed.',
                            [
                                'sourceQuestionID' => $sourceQuestion->questionID,
                                'error' => $e->getMessage(),
                            ]
                        );

                        $failed[] = [
                            'sourceQuestionID' => $sourceQuestion->questionID,
                            'reason' => $e->getMessage(),
                        ];
                    }
                }

                return [
                    'imported' => $imported,
                    'failed' => $failed,
                ];
            });

            return response()->json([
                'message' => count($result['imported']) > 0
                    ? 'Questions imported successfully.'
                    : 'No questions were imported.',
                'importedCount' => count($result['imported']),
                'failedCount' => count($result['failed']),
                'imported' => $result['imported'],
                'failed' => $result['failed'],
            ], count($result['imported']) > 0 ? 201 : 422);
        } catch (\Throwable $e) {
            Log::error('Database import failed.', [
                'destinationSubjectID' => $destinationSubjectID,
                'questionIDs' => $questionIDs,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Database import failed.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | DECRYPT
    |--------------------------------------------------------------------------
    */

    private function decryptValue($value): ?string
    {
        if ($value === null || $value === '') {
            return $value;
        }

        try {
            return Crypt::decryptString($value);
        } catch (\Throwable $e) {
            /*
             * If the source value is already plaintext,
             * keep it instead of breaking the entire import.
             */
            return (string) $value;
        }
    }

    /*
    |--------------------------------------------------------------------------
    | IMAGE COPY
    |--------------------------------------------------------------------------
    |
    | If the image path already exists on the current application's
    | public storage, copy it to the same logical location.
    |
    */

    private function copyQuestionImage($image)
    {
        if (!$image) {
            return null;
        }

        try {
            if (Storage::disk('public')->exists($image)) {
                $extension = pathinfo($image, PATHINFO_EXTENSION);

                $newPath = 'question_images/imported_' .
                    Str::uuid() .
                    ($extension ? '.' . $extension : '');

                Storage::disk('public')->copy(
                    $image,
                    $newPath
                );

                return $newPath;
            }
        } catch (\Throwable $e) {
            Log::warning(
                'Database import: question image could not be copied.',
                [
                    'image' => $image,
                    'error' => $e->getMessage(),
                ]
            );
        }

        /*
         * Keep original path if the file is not available locally.
         */
        return $image;
    }

    private function copyChoiceImage($image)
    {
        if (!$image) {
            return null;
        }

        try {
            if (Storage::disk('public')->exists($image)) {
                $extension = pathinfo($image, PATHINFO_EXTENSION);

                $newPath = 'choices/imported_' .
                    Str::uuid() .
                    ($extension ? '.' . $extension : '');

                Storage::disk('public')->copy(
                    $image,
                    $newPath
                );

                return $newPath;
            }
        } catch (\Throwable $e) {
            Log::warning(
                'Database import: choice image could not be copied.',
                [
                    'image' => $image,
                    'error' => $e->getMessage(),
                ]
            );
        }

        return $image;
    }
}