<?php

namespace Modules\Questions\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Modules\Choices\Models\Choice;
use Modules\Questions\Models\DatabaseSource;
use Modules\Questions\Models\Question;
use Modules\Subjects\Models\Subject;
use Throwable;

class DatabaseQuestionImportController
{
    /**
     * Create a dynamic connection for the selected source database.
     */
    private function getSourceConnection(DatabaseSource $source): string
    {
        $connectionName = 'dynamic_import_' . $source->id;

        $password = '';

        if (!empty($source->password)) {
            try {
                $password = Crypt::decryptString($source->password);
            } catch (Throwable $e) {
                $password = $source->password;
            }
        }

        Config::set(
            "database.connections.{$connectionName}",
            [
                'driver' => $source->driver,
                'host' => $source->host,
                'port' => $source->port,
                'database' => $source->database,
                'username' => $source->username,
                'password' => $password,

                'charset' => 'utf8mb4',
                'collation' => 'utf8mb4_unicode_ci',
                'prefix' => '',
                'prefix_indexes' => true,
                'strict' => true,
                'engine' => null,

                'options' => extension_loaded('pdo_mysql')
                    ? array_filter([
                        \PDO::ATTR_EMULATE_PREPARES => true,
                    ])
                    : [],
            ]
        );

        DB::purge($connectionName);

        return $connectionName;
    }

    /**
     * Resolve the selected source database.
     *
     * If sourceDatabaseID is not provided,
     * CAPS will be used as the default source.
     */
    private function resolveSource(Request $request): DatabaseSource
    {
        $sourceDatabaseID = $request->input('sourceDatabaseID');

        if ($sourceDatabaseID) {
            $source = DatabaseSource::where('id', $sourceDatabaseID)
                ->where('is_active', true)
                ->first();
        } else {
            $source = DatabaseSource::where('name', 'CAPS')
                ->where('is_active', true)
                ->first();

            if (!$source) {
                $source = DatabaseSource::where('is_active', true)
                    ->orderBy('id')
                    ->first();
            }
        }

        if (!$source) {
            abort(response()->json([
                'success' => false,
                'message' => 'No active source database is available.',
            ], 404));
        }

        return $source;
    }

    /**
     * GET /api/database-import/sources
     *
     * Get all active source databases.
     */
    public function sources()
    {
        $sources = DatabaseSource::where('is_active', true)
            ->orderBy('name')
            ->get([
                'id',
                'name',
                'driver',
                'host',
                'port',
                'database',
                'username',
                'is_active',
            ]);

        return response()->json([
            'success' => true,
            'data' => $sources,
        ]);
    }

    /**
     * GET /api/database-import/subjects?sourceDatabaseID=1
     *
     * Get subjects from selected source database.
     */
    public function subjects(Request $request)
    {
        $source = $this->resolveSource($request);

        $connectionName = $this->getSourceConnection($source);

        try {
            $subjects = DB::connection($connectionName)
                ->table('subjects')
                ->orderBy('subjectName')
                ->get([
                    'subjectID',
                    'subjectCode',
                    'subjectName',
                    'programID',
                    'yearLevelID',
                    'is_enabled_for_exam_questions',
                ]);

            return response()->json([
                'success' => true,

                'sourceDatabase' => [
                    'id' => $source->id,
                    'name' => $source->name,
                    'driver' => $source->driver,
                    'database' => $source->database,
                ],

                'data' => $subjects,
            ]);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Could not load subjects from the selected database.',
                'error' => $e->getMessage(),
            ], 500);
        } finally {
            DB::purge($connectionName);
        }
    }

    /**
     * GET /api/database-import/questions/{subjectID}?sourceDatabaseID=1
     *
     * Get all questions belonging ONLY to the selected subject.
     */
    public function questions(Request $request, $subjectID)
    {
        $source = $this->resolveSource($request);

        $connectionName = $this->getSourceConnection($source);

        try {
            $connection = DB::connection($connectionName);

            /*
             * Verify source subject.
             */
            $subject = $connection
                ->table('subjects')
                ->where('subjectID', $subjectID)
                ->first();

            if (!$subject) {
                return response()->json([
                    'success' => false,
                    'message' => 'Source subject not found.',
                ], 404);
            }

            /*
             * Get questions for this subject only.
             */
            $questions = $connection
                ->table('questions')
                ->where('subjectID', $subjectID)
                ->orderBy('questionID')
                ->get();

            $result = [];

            foreach ($questions as $question) {
                /*
                 * Get choices for this question.
                 */
                $choices = $connection
                    ->table('choices')
                    ->where('questionID', $question->questionID)
                    ->orderBy('position')
                    ->orderBy('choiceID')
                    ->get();

                /*
                 * Skip questions with no choices.
                 */
                if ($choices->count() === 0) {
                    continue;
                }

                $formattedChoices = [];

                foreach ($choices as $choice) {
                    $formattedChoices[] = [
                        'choiceID' => $choice->choiceID,

                        'choiceText' => $this->decryptValue(
                            $choice->choiceText
                        ),

                        'isCorrect' => (bool) $choice->isCorrect,

                        'position' => (int) $choice->position,

                        'image' => $choice->image,
                    ];
                }

                $result[] = [
                    'questionID' => $question->questionID,

                    'subjectID' => $question->subjectID,

                    'questionText' => $this->decryptValue(
                        $question->questionText
                    ),

                    'image' => $question->image,

                    'score' => $question->score,

                    'difficulty_id' => $question->difficulty_id,

                    'coverage_id' => $question->coverage_id,

                    'status_id' => $question->status_id,

                    'purpose_id' => $question->purpose_id,

                    'created_at' => $question->created_at,

                    'updated_at' => $question->updated_at,

                    'choices' => $formattedChoices,
                ];
            }

            return response()->json([
                'success' => true,

                'sourceDatabase' => [
                    'id' => $source->id,
                    'name' => $source->name,
                    'driver' => $source->driver,
                    'database' => $source->database,
                ],

                'sourceSubject' => [
                    'subjectID' => $subject->subjectID,
                    'subjectCode' => $subject->subjectCode,
                    'subjectName' => $subject->subjectName,
                ],

                'data' => $result,
            ]);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Could not load questions from the selected database.',
                'error' => $e->getMessage(),
            ], 500);
        } finally {
            DB::purge($connectionName);
        }
    }

    /**
     * POST /api/database-import/questions
     *
     * Import selected questions and their choices
     * into the destination subject.
     */
    public function import(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'sourceDatabaseID' => [
                'required',
                'integer',
                'exists:database_sources,id',
            ],

            'sourceSubjectID' => [
                'nullable',
                'integer',
            ],

            'destinationSubjectID' => [
                'required',
                'integer',
            ],

            'questionIDs' => [
                'required',
                'array',
                'min:1',
            ],

            'questionIDs.*' => [
                'integer',
            ],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid import request.',
                'errors' => $validator->errors(),
            ], 422);
        }

        /*
         * Find selected source database.
         */
        $source = DatabaseSource::where(
            'id',
            $request->sourceDatabaseID
        )
            ->where('is_active', true)
            ->first();

        if (!$source) {
            return response()->json([
                'success' => false,
                'message' => 'Selected source database is not active.',
            ], 404);
        }

        /*
         * Find destination subject
         * using the application's MAIN database.
         *
         * DB_CONNECTION=sqlite remains unchanged.
         */
        $destinationSubject = Subject::where(
            'subjectID',
            $request->destinationSubjectID
        )->first();

        if (!$destinationSubject) {
            return response()->json([
                'success' => false,
                'message' => 'Destination subject not found.',
            ], 404);
        }

        $connectionName = $this->getSourceConnection($source);

        try {
            $sourceDB = DB::connection($connectionName);

            /*
             * Verify source subject if supplied.
             */
            if ($request->filled('sourceSubjectID')) {
                $sourceSubject = $sourceDB
                    ->table('subjects')
                    ->where(
                        'subjectID',
                        $request->sourceSubjectID
                    )
                    ->first();

                if (!$sourceSubject) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Source subject not found.',
                    ], 404);
                }
            }

            /*
             * Get selected questions ONLY.
             */
            $query = $sourceDB
                ->table('questions')
                ->whereIn(
                    'questionID',
                    $request->questionIDs
                );

            /*
             * Make sure selected questions
             * belong to the selected source subject.
             */
            if ($request->filled('sourceSubjectID')) {
                $query->where(
                    'subjectID',
                    $request->sourceSubjectID
                );
            }

            $sourceQuestions = $query
                ->orderBy('questionID')
                ->get();

            /*
             * Make sure every selected question exists.
             */
            if (
                $sourceQuestions->count()
                !== count($request->questionIDs)
            ) {
                return response()->json([
                    'success' => false,
                    'message' =>
                        'One or more selected questions could not be found in the selected source subject.',
                ], 422);
            }

            $importedCount = 0;
            $importedQuestionIDs = [];

            /*
             * Transaction on the MAIN database.
             */
            DB::connection()->transaction(function () use (
                $sourceDB,
                $sourceQuestions,
                $request,
                &$importedCount,
                &$importedQuestionIDs
            ) {
                foreach ($sourceQuestions as $sourceQuestion) {
                    /*
                     * Get choices from SOURCE database.
                     */
                    $sourceChoices = $sourceDB
                        ->table('choices')
                        ->where(
                            'questionID',
                            $sourceQuestion->questionID
                        )
                        ->orderBy('position')
                        ->orderBy('choiceID')
                        ->get();

                    /*
                     * Skip questions with no choices.
                     */
                    if ($sourceChoices->count() === 0) {
                        continue;
                    }

                    /*
                     * Create NEW destination question.
                     *
                     * Source questionID is NOT copied.
                     */
                    $newQuestion = Question::create([
                        'subjectID' =>
                            $request->destinationSubjectID,

                        'questionText' =>
                            Crypt::encryptString(
                                $this->decryptValue(
                                    $sourceQuestion->questionText
                                )
                            ),

                        'userID' => Auth::id(),

                        'image' => $sourceQuestion->image,

                        'score' => $sourceQuestion->score,

                        'difficulty_id' =>
                            $sourceQuestion->difficulty_id,

                        'coverage_id' =>
                            $sourceQuestion->coverage_id,

                        'status_id' =>
                            $sourceQuestion->status_id,

                        'purpose_id' =>
                            $sourceQuestion->purpose_id,

                        'editedBy' => null,

                        'approvedBy' => null,
                    ]);

                    /*
                     * Create NEW choices.
                     *
                     * Correct answer and position are preserved.
                     */
                    foreach ($sourceChoices as $sourceChoice) {
                        Choice::create([
                            'questionID' =>
                                $newQuestion->questionID,

                            'choiceText' =>
                                Crypt::encryptString(
                                    $this->decryptValue(
                                        $sourceChoice->choiceText
                                    )
                                ),

                            'isCorrect' =>
                                (bool) $sourceChoice->isCorrect,

                            'position' =>
                                (int) $sourceChoice->position,

                            'image' =>
                                $sourceChoice->image,
                        ]);
                    }

                    $importedCount++;

                    $importedQuestionIDs[] =
                        $newQuestion->questionID;
                }
            });

            return response()->json([
                'success' => true,

                'message' =>
                    "{$importedCount} question(s) imported successfully.",

                'sourceDatabase' => [
                    'id' => $source->id,
                    'name' => $source->name,
                ],

                'destinationSubject' => [
                    'subjectID' =>
                        $destinationSubject->subjectID,

                    'subjectName' =>
                        $destinationSubject->subjectName,
                ],

                'importedCount' =>
                    $importedCount,

                'importedQuestionIDs' =>
                    $importedQuestionIDs,
            ]);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Question import failed.',
                'error' => $e->getMessage(),
            ], 500);
        } finally {
            DB::purge($connectionName);
        }
    }

    /**
     * Decrypt Laravel encrypted values.
     *
     * If the value is already plaintext,
     * return it without changing it.
     */
    private function decryptValue($value)
    {
        if ($value === null) {
            return null;
        }

        try {
            return Crypt::decryptString($value);
        } catch (Throwable $e) {
            return $value;
        }
    }
}