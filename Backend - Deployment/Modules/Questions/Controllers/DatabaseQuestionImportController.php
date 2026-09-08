<?php

namespace Modules\Questions\Controllers;

use Illuminate\Http\Request;
use Illuminate\Encryption\Encrypter;
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
     * Get the encryption key used by the source database.
     */
    private function getSourceEncrypter(): ?Encrypter
    {
        $key = env('SOURCE_APP_KEY');

        if (!$key) {
            return null;
        }

        if (str_starts_with($key, 'base64:')) {
            $decodedKey = base64_decode(
                substr($key, 7),
                true
            );

            if ($decodedKey === false) {
                throw new \RuntimeException(
                    'SOURCE_APP_KEY is not valid base64.'
                );
            }

            $key = $decodedKey;
        }

        return new Encrypter(
            $key,
            config('app.cipher', 'AES-256-CBC')
        );
    }

    /**
     * Create a dynamic connection for the selected source database.
     */
    private function getSourceConnection(
        DatabaseSource $source
    ): string {
        $connectionName =
            'dynamic_import_' . $source->id;

        $password = '';

        if (!empty($source->password)) {
            try {
                $password = Crypt::decryptString(
                    $source->password
                );
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
     */
    private function resolveSource(
        Request $request
    ): DatabaseSource {
        $sourceDatabaseID =
            $request->input('sourceDatabaseID');

        if ($sourceDatabaseID) {
            $source = DatabaseSource::where(
                'id',
                $sourceDatabaseID
            )
                ->where('is_active', true)
                ->first();
        } else {
            $source = DatabaseSource::where(
                'name',
                'CAPS'
            )
                ->where('is_active', true)
                ->first();

            if (!$source) {
                $source = DatabaseSource::where(
                    'is_active',
                    true
                )
                    ->orderBy('id')
                    ->first();
            }
        }

        if (!$source) {
            abort(response()->json([
                'success' => false,
                'message' =>
                    'No active source database is available.',
            ], 404));
        }

        return $source;
    }

    /**
     * GET /api/database-import/sources
     */
    public function sources()
    {
        $sources = DatabaseSource::where(
            'is_active',
            true
        )
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
     * GET /api/database-import/subjects
     */
    public function subjects(Request $request)
    {
        $source =
            $this->resolveSource($request);

        $connectionName =
            $this->getSourceConnection($source);

        try {
            $subjects =
                DB::connection($connectionName)
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
                'message' =>
                    'Could not load subjects from the selected database.',
                'error' => $e->getMessage(),
            ], 500);
        } finally {
            DB::purge($connectionName);
        }
    }

    /**
     * GET /api/database-import/questions/{subjectID}
     */
    public function questions(
        Request $request,
        $subjectID
    ) {
        $source =
            $this->resolveSource($request);

        $connectionName =
            $this->getSourceConnection($source);

        $sourceEncrypter =
            $this->getSourceEncrypter();

        try {
            $connection =
                DB::connection($connectionName);

            $subject =
                $connection
                    ->table('subjects')
                    ->where(
                        'subjectID',
                        $subjectID
                    )
                    ->first();

            if (!$subject) {
                return response()->json([
                    'success' => false,
                    'message' =>
                        'Source subject not found.',
                ], 404);
            }

            $questions =
                $connection
                    ->table('questions')
                    ->where(
                        'subjectID',
                        $subjectID
                    )
                    ->orderBy('questionID')
                    ->get();

            $result = [];

            foreach ($questions as $question) {

                $choices =
                    $connection
                        ->table('choices')
                        ->where(
                            'questionID',
                            $question->questionID
                        )
                        ->orderBy('position')
                        ->orderBy('choiceID')
                        ->get();

                if ($choices->count() === 0) {
                    continue;
                }

                $formattedChoices = [];

                foreach ($choices as $choice) {
                    $formattedChoices[] = [
                        'choiceID' =>
                            $choice->choiceID,

                        'choiceText' =>
                            $this->decryptValue(
                                $choice->choiceText,
                                $sourceEncrypter
                            ),

                        'isCorrect' =>
                            (bool) $choice->isCorrect,

                        'position' =>
                            (int) $choice->position,

                        'image' =>
                            $choice->image,
                    ];
                }

                $result[] = [
                    'questionID' =>
                        $question->questionID,

                    'subjectID' =>
                        $question->subjectID,

                    'questionText' =>
                        $this->decryptValue(
                            $question->questionText,
                            $sourceEncrypter
                        ),

                    'image' =>
                        $question->image,

                    'score' =>
                        $question->score,

                    'difficulty_id' =>
                        $question->difficulty_id,

                    'coverage_id' =>
                        $question->coverage_id,

                    'status_id' =>
                        $question->status_id,

                    'purpose_id' =>
                        $question->purpose_id,

                    'created_at' =>
                        $question->created_at,

                    'updated_at' =>
                        $question->updated_at,

                    'choices' =>
                        $formattedChoices,
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
                    'subjectID' =>
                        $subject->subjectID,

                    'subjectCode' =>
                        $subject->subjectCode,

                    'subjectName' =>
                        $subject->subjectName,
                ],

                'data' => $result,
            ]);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' =>
                    'Could not load questions from the selected database.',
                'error' => $e->getMessage(),
            ], 500);
        } finally {
            DB::purge($connectionName);
        }
    }

    /**
     * POST /api/database-import/questions
     *
     * Import selected questions and their choices.
     */
    public function import(Request $request)
    {
        $validator = Validator::make(
            $request->all(),
            [
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
            ]
        );

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' =>
                    'Invalid import request.',
                'errors' =>
                    $validator->errors(),
            ], 422);
        }

        $source =
            DatabaseSource::where(
                'id',
                $request->sourceDatabaseID
            )
                ->where('is_active', true)
                ->first();

        if (!$source) {
            return response()->json([
                'success' => false,
                'message' =>
                    'Selected source database is not active.',
            ], 404);
        }

        $destinationSubject =
            Subject::where(
                'subjectID',
                $request->destinationSubjectID
            )->first();

        if (!$destinationSubject) {
            return response()->json([
                'success' => false,
                'message' =>
                    'Destination subject not found.',
            ], 404);
        }

        $connectionName =
            $this->getSourceConnection($source);

        $sourceEncrypter =
            $this->getSourceEncrypter();

        try {
            $sourceDB =
                DB::connection($connectionName);

            if ($request->filled('sourceSubjectID')) {

                $sourceSubject =
                    $sourceDB
                        ->table('subjects')
                        ->where(
                            'subjectID',
                            $request->sourceSubjectID
                        )
                        ->first();

                if (!$sourceSubject) {
                    return response()->json([
                        'success' => false,
                        'message' =>
                            'Source subject not found.',
                    ], 404);
                }
            }

            $query =
                $sourceDB
                    ->table('questions')
                    ->whereIn(
                        'questionID',
                        $request->questionIDs
                    );

            if ($request->filled('sourceSubjectID')) {
                $query->where(
                    'subjectID',
                    $request->sourceSubjectID
                );
            }

            $sourceQuestions =
                $query
                    ->orderBy('questionID')
                    ->get();

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

            DB::connection()->transaction(
                function () use (
                    $sourceDB,
                    $sourceQuestions,
                    $request,
                    $sourceEncrypter,
                    &$importedCount,
                    &$importedQuestionIDs
                ) {

                    foreach (
                        $sourceQuestions
                        as $sourceQuestion
                    ) {

                        $sourceChoices =
                            $sourceDB
                                ->table('choices')
                                ->where(
                                    'questionID',
                                    $sourceQuestion->questionID
                                )
                                ->orderBy('position')
                                ->orderBy('choiceID')
                                ->get();

                        if (
                            $sourceChoices->count() === 0
                        ) {
                            continue;
                        }

                        $newQuestion =
                            Question::create([
                                'subjectID' =>
                                    $request->destinationSubjectID,

                                'questionText' =>
                                    Crypt::encryptString(
                                        $this->decryptValue(
                                            $sourceQuestion->questionText,
                                            $sourceEncrypter
                                        )
                                    ),

                                'userID' =>
                                    Auth::id(),

                                'image' =>
                                    $sourceQuestion->image,

                                'score' =>
                                    $sourceQuestion->score,

                                'difficulty_id' =>
                                    $sourceQuestion->difficulty_id,

                                'coverage_id' =>
                                    $sourceQuestion->coverage_id,

                                'status_id' =>
                                    1,

                                'purpose_id' =>
                                    $sourceQuestion->purpose_id,

                                'editedBy' =>
                                    null,

                                'approvedBy' =>
                                    null,
                            ]);

                        foreach (
                            $sourceChoices
                            as $sourceChoice
                        ) {

                            Choice::create([
                                'questionID' =>
                                    $newQuestion->questionID,

                                'choiceText' =>
                                    Crypt::encryptString(
                                        $this->decryptValue(
                                            $sourceChoice->choiceText,
                                            $sourceEncrypter
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
                }
            );

            return response()->json([
                'success' => true,

                'message' =>
                    "{$importedCount} question(s) imported successfully.",

                'sourceDatabase' => [
                    'id' =>
                        $source->id,

                    'name' =>
                        $source->name,
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
                'message' =>
                    'Question import failed.',
                'error' =>
                    $e->getMessage(),
            ], 500);

        } finally {
            DB::purge($connectionName);
        }
    }

    /**
     * POST /api/database-import/all
     *
     * Import ALL subjects, questions, and choices.
     *
     * Image paths are preserved.
     *
     * If the physical image files are available in the
     * source storage, they are copied to the destination.
     *
     * Missing physical files do NOT stop the database import.
     */
    public function importAll(Request $request)
    {
        $validator = Validator::make(
            $request->all(),
            [
                'sourceDatabaseID' => [
                    'required',
                    'integer',
                    'exists:database_sources,id',
                ],
            ]
        );

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' =>
                    'Invalid import request.',
                'errors' =>
                    $validator->errors(),
            ], 422);
        }

        $source =
            DatabaseSource::where(
                'id',
                $request->sourceDatabaseID
            )
                ->where('is_active', true)
                ->first();

        if (!$source) {
            return response()->json([
                'success' => false,
                'message' =>
                    'Selected source database is not active.',
            ], 404);
        }

        /*
         * Destination database configuration.
         */
        $defaultConnection =
            config('database.default');

        $defaultConfig =
            config(
                "database.connections.{$defaultConnection}"
            );

        $mainDatabase =
            $defaultConfig['database'] ?? null;

        $mainHost =
            $defaultConfig['host'] ?? null;

        /*
         * Prevent importing the same database
         * into itself.
         */
        $sourceHost =
            strtolower(
                trim(
                    (string) $source->host
                )
            );

        $destinationHost =
            strtolower(
                trim(
                    (string) $mainHost
                )
            );

        $sourceHostNormalized =
            in_array(
                $sourceHost,
                ['localhost', '127.0.0.1', '::1'],
                true
            )
                ? 'local'
                : $sourceHost;

        $destinationHostNormalized =
            in_array(
                $destinationHost,
                ['localhost', '127.0.0.1', '::1'],
                true
            )
                ? 'local'
                : $destinationHost;

        if (
            $mainDatabase &&
            $source->database === $mainDatabase &&
            $sourceHostNormalized ===
                $destinationHostNormalized
        ) {
            return response()->json([
                'success' => false,
                'message' =>
                    'The selected source database is the same as the current destination database. Please select a different source database.',
            ], 422);
        }

        $connectionName =
            $this->getSourceConnection($source);

        $sourceEncrypter =
            $this->getSourceEncrypter();

        /*
         * Counters.
         */
        $importedSubjects = 0;
        $importedQuestions = 0;
        $importedChoices = 0;
        $skippedQuestions = 0;

        $questionImagesFound = 0;
        $questionImagesMissing = 0;

        $choiceImagesFound = 0;
        $choiceImagesMissing = 0;

        try {

            $sourceDB =
                DB::connection($connectionName);

            /*
             * Verify required tables.
             */
            foreach (
                ['subjects', 'questions', 'choices']
                as $table
            ) {

                if (
                    !$sourceDB
                        ->getSchemaBuilder()
                        ->hasTable($table)
                ) {

                    return response()->json([
                        'success' => false,
                        'message' =>
                            "Source database is missing the required '{$table}' table.",
                    ], 422);
                }
            }

            /*
             * Get ALL subjects.
             */
            $sourceSubjects =
                $sourceDB
                    ->table('subjects')
                    ->orderBy('subjectID')
                    ->get();

            if ($sourceSubjects->isEmpty()) {

                return response()->json([
                    'success' => false,
                    'message' =>
                        'No subjects were found in the selected source database.',
                ], 422);
            }

            /*
             * Import everything inside one
             * destination transaction.
             */
            DB::connection()->transaction(
                function () use (
                    $sourceDB,
                    $sourceSubjects,
                    $sourceEncrypter,
                    &$importedSubjects,
                    &$importedQuestions,
                    &$importedChoices,
                    &$skippedQuestions,
                    &$questionImagesFound,
                    &$questionImagesMissing,
                    &$choiceImagesFound,
                    &$choiceImagesMissing
                ) {

                    /*
                     * The Laravel public storage directory.
                     *
                     * Expected:
                     *
                     * storage/app/public/question_images
                     * storage/app/public/choices
                     */
                    $storagePath =
                        storage_path('app/public');

                    /*
                     * Map source subject IDs
                     * to new destination subject IDs.
                     */
                    $subjectMap = [];

                    foreach (
                        $sourceSubjects
                        as $sourceSubject
                    ) {

                        /*
                         * Check if subject already exists
                         * in the destination database by
                         * subjectCode.
                         */
                        $existingSubject =
                            Subject::where(
                                'subjectCode',
                                $sourceSubject->subjectCode
                            )
                            ->whereNull('archived_at')
                            ->first();

                        if ($existingSubject) {
                            $subjectMap[
                                $sourceSubject->subjectID
                            ] =
                                $existingSubject->subjectID;

                            continue;
                        }

                        /*
                         * Create NEW destination subject.
                         */
                        $newSubject =
                            Subject::create([
                                'subjectCode' =>
                                    $sourceSubject->subjectCode,

                                'subjectName' =>
                                    $sourceSubject->subjectName,

                                'programID' =>
                                    $sourceSubject->programID,

                                'yearLevelID' =>
                                    $sourceSubject->yearLevelID,

                                'is_enabled_for_exam_questions' =>
                                    $sourceSubject
                                        ->is_enabled_for_exam_questions,
                            ]);

                        $subjectMap[
                            $sourceSubject->subjectID
                        ] =
                            $newSubject->subjectID;

                        $importedSubjects++;

                        /*
                         * Get ALL questions belonging
                         * to this source subject.
                         */
                        $sourceQuestions =
                            $sourceDB
                                ->table('questions')
                                ->where(
                                    'subjectID',
                                    $sourceSubject->subjectID
                                )
                                ->orderBy('questionID')
                                ->get();

                        foreach (
                            $sourceQuestions
                            as $sourceQuestion
                        ) {

                            /*
                             * Get ALL choices.
                             */
                            $sourceChoices =
                                $sourceDB
                                    ->table('choices')
                                    ->where(
                                        'questionID',
                                        $sourceQuestion->questionID
                                    )
                                    ->orderBy('position')
                                    ->orderBy('choiceID')
                                    ->get();

                            /*
                             * Skip questions without choices.
                             */
                            if (
                                $sourceChoices->count() === 0
                            ) {

                                $skippedQuestions++;

                                continue;
                            }

                            /*
                             * Resolve the new destination
                             * subject ID.
                             */
                            $newSubjectID =
                                $subjectMap[
                                    $sourceQuestion->subjectID
                                ] ?? null;

                            if (!$newSubjectID) {
                                throw new \RuntimeException(
                                    'Could not map source subject ID to destination subject ID.'
                                );
                            }

                            /*
                             * ------------------------------------------------
                             * QUESTION IMAGE
                             * ------------------------------------------------
                             */
                            $questionImage =
                                $sourceQuestion->image;

                            if (
                                $questionImage
                                &&
                                !filter_var(
                                    $questionImage,
                                    FILTER_VALIDATE_URL
                                )
                            ) {

                                $cleanQuestionImage =
                                    ltrim(
                                        str_replace(
                                            '\\',
                                            '/',
                                            $questionImage
                                        ),
                                        '/'
                                    );

                                $questionImageFile =
                                    $storagePath .
                                    DIRECTORY_SEPARATOR .
                                    str_replace(
                                        '/',
                                        DIRECTORY_SEPARATOR,
                                        $cleanQuestionImage
                                    );

                                if (
                                    file_exists(
                                        $questionImageFile
                                    )
                                ) {

                                    $questionImagesFound++;

                                } else {

                                    $questionImagesMissing++;
                                }
                            }

                            /*
                             * Create NEW question.
                             */
                            $newQuestion =
                                Question::create([
                                    'subjectID' =>
                                        $newSubjectID,

                                    'questionText' =>
                                        Crypt::encryptString(
                                            $this->decryptValue(
                                                $sourceQuestion->questionText,
                                                $sourceEncrypter
                                            )
                                        ),

                                    'userID' =>
                                        Auth::id(),

                                    'image' =>
                                        $questionImage,

                                    'score' =>
                                        $sourceQuestion->score,

                                    'difficulty_id' =>
                                        $sourceQuestion->difficulty_id,

                                    'coverage_id' =>
                                        $sourceQuestion->coverage_id,

                                    'status_id' =>
                                        $sourceQuestion->status_id,

                                    'purpose_id' =>
                                        $sourceQuestion->purpose_id,

                                    'editedBy' =>
                                        null,

                                    'approvedBy' =>
                                        null,
                                ]);

                            $importedQuestions++;

                            /*
                             * ------------------------------------------------
                             * CHOICES
                             * ------------------------------------------------
                             */
                            foreach (
                                $sourceChoices
                                as $sourceChoice
                            ) {

                                $choiceImage =
                                    $sourceChoice->image;

                                if (
                                    $choiceImage
                                    &&
                                    !filter_var(
                                        $choiceImage,
                                        FILTER_VALIDATE_URL
                                    )
                                ) {

                                    $cleanChoiceImage =
                                        ltrim(
                                            str_replace(
                                                '\\',
                                                '/',
                                                $choiceImage
                                            ),
                                            '/'
                                        );

                                    $choiceImageFile =
                                        $storagePath .
                                        DIRECTORY_SEPARATOR .
                                        str_replace(
                                            '/',
                                            DIRECTORY_SEPARATOR,
                                            $cleanChoiceImage
                                        );

                                    if (
                                        file_exists(
                                            $choiceImageFile
                                        )
                                    ) {

                                        $choiceImagesFound++;

                                    } else {

                                        $choiceImagesMissing++;
                                    }
                                }

                                /*
                                 * Create NEW choice.
                                 */
                                Choice::create([
                                    'questionID' =>
                                        $newQuestion->questionID,

                                    'choiceText' =>
                                        Crypt::encryptString(
                                            $this->decryptValue(
                                                $sourceChoice->choiceText,
                                                $sourceEncrypter
                                            )
                                        ),

                                    'isCorrect' =>
                                        (bool) $sourceChoice->isCorrect,

                                    'position' =>
                                        (int) $sourceChoice->position,

                                    'image' =>
                                        $choiceImage,
                                ]);

                                $importedChoices++;
                            }
                        }
                    }
                }
            );

            return response()->json([
                'success' => true,

                'message' =>
                    'All subjects, questions, and choices imported successfully.',

                'sourceDatabase' => [
                    'id' =>
                        $source->id,

                    'name' =>
                        $source->name,

                    'database' =>
                        $source->database,
                ],

                'importedSubjects' =>
                    $importedSubjects,

                'importedQuestions' =>
                    $importedQuestions,

                'importedChoices' =>
                    $importedChoices,

                'skippedQuestions' =>
                    $skippedQuestions,

                'images' => [
                    'questionImagesFound' =>
                        $questionImagesFound,

                    'questionImagesMissing' =>
                        $questionImagesMissing,

                    'choiceImagesFound' =>
                        $choiceImagesFound,

                    'choiceImagesMissing' =>
                        $choiceImagesMissing,
                ],
            ]);

        } catch (Throwable $e) {

            return response()->json([
                'success' => false,

                'message' =>
                    'Full database import failed.',

                'error' =>
                    $e->getMessage(),

                'importedSubjects' =>
                    0,

                'importedQuestions' =>
                    0,

                'importedChoices' =>
                    0,

                'skippedQuestions' =>
                    0,
            ], 500);

        } finally {

            DB::purge($connectionName);
        }
    }

    /**
     * Decrypt Laravel encrypted values.
     */
    private function decryptValue(
        $value,
        ?Encrypter $sourceEncrypter = null
    ) {
        if ($value === null) {
            return null;
        }

        try {

            return ($sourceEncrypter ?? app('encrypter'))
                ->decryptString($value);

        } catch (Throwable $e) {

            /*
             * Detect Laravel encrypted payload.
             */
            $decoded =
                base64_decode(
                    $value,
                    true
                );

            if (
                $decoded !== false &&
                str_starts_with(
                    $decoded,
                    '{"iv"'
                )
            ) {

                throw new \RuntimeException(
                    'Imported question data is encrypted with a different APP_KEY. Configure SOURCE_APP_KEY with the original source key.'
                );
            }

            /*
             * If it isn't encrypted,
             * treat it as plaintext.
             */
            return $value;
        }
    }
}