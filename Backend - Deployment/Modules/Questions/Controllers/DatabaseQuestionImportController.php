<?php

namespace Modules\Questions\Controllers;

use Illuminate\Encryption\Encrypter;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Modules\Choices\Models\Choice;
use Modules\Questions\Models\DatabaseSource;
use Modules\Questions\Models\Question;
use Modules\Subjects\Models\Subject;
use Throwable;

class DatabaseQuestionImportController
{
    /**
     * Get the source database encryption encrypter.
     *
     * Priority:
     * 1. SOURCE_APP_KEY
     * 2. Current application's APP_KEY
     *
     * Laravel AES-256-CBC requires a 32-byte key.
     */
    private function getSourceEncrypter(): ?Encrypter
    {
        $key = env('SOURCE_APP_KEY');

        /*
         * If SOURCE_APP_KEY is not configured,
         * use the current application's APP_KEY.
         */
        if (!$key) {
            $key = config('app.key');
        }

        if (!$key) {
            return null;
        }

        /*
         * Remove base64: prefix if present.
         */
        if (str_starts_with($key, 'base64:')) {
            $decodedKey = base64_decode(
                substr($key, 7),
                true
            );

            if ($decodedKey === false) {
                throw new \RuntimeException(
                    'SOURCE_APP_KEY / APP_KEY is not valid base64.'
                );
            }

            $key = $decodedKey;
        }

        /*
         * AES-256-CBC requires exactly 32 bytes.
         */
        if (strlen($key) !== 32) {
            throw new \RuntimeException(
                'The encryption key must be exactly 32 bytes for AES-256-CBC.'
            );
        }

        return new Encrypter(
            $key,
            config(
                'app.cipher',
                'AES-256-CBC'
            )
        );
    }

    /**
     * Determine whether a value looks like
     * a Laravel encrypted payload.
     */
    private function isLaravelEncryptedValue($value): bool
    {
        if (!is_string($value) || $value === '') {
            return false;
        }

        $decoded = base64_decode(
            $value,
            true
        );

        if ($decoded === false) {
            return false;
        }

        $json = json_decode(
            $decoded,
            true
        );

        return is_array($json)
            && isset(
                $json['iv'],
                $json['value'],
                $json['mac']
            );
    }

    /**
     * Decrypt a value from the source database.
     *
     * Supports:
     * - SOURCE_APP_KEY
     * - current APP_KEY
     * - plaintext values
     *
     * IMPORTANT:
     * Encrypted values are never returned to the frontend.
     */
    private function decryptValue(
        $value,
        ?Encrypter $sourceEncrypter = null
    ) {
        if ($value === null) {
            return null;
        }

        if ($value === '') {
            return '';
        }

        /*
         * First try SOURCE_APP_KEY.
         */
        if ($sourceEncrypter) {
            try {
                return $sourceEncrypter->decryptString(
                    $value
                );
            } catch (Throwable $e) {
                /*
                 * Continue to current APP_KEY.
                 */
            }
        }

        /*
         * Try the application's APP_KEY.
         */
        try {
            return Crypt::decryptString(
                $value
            );
        } catch (Throwable $e) {
            /*
             * Continue.
             */
        }

        /*
         * If this is a Laravel encrypted payload,
         * then the correct key is missing/wrong.
         *
         * DO NOT return the encrypted string.
         */
        if (
            $this->isLaravelEncryptedValue(
                $value
            )
        ) {
            throw new \RuntimeException(
                'Question or choice data is encrypted, but the correct source APP_KEY is not configured. Set SOURCE_APP_KEY in the backend .env file using the APP_KEY from the source database.'
            );
        }

        /*
         * Otherwise it is normal plaintext.
         */
        return $value;
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

        /*
         * Database passwords stored in the local
         * database may be encrypted or plaintext.
         */
        if (!empty($source->password)) {
            try {
                $password = Crypt::decryptString(
                    $source->password
                );
            } catch (Throwable $e) {
                /*
                 * Treat it as plaintext if it is not
                 * encrypted using the current APP_KEY.
                 */
                $password = $source->password;
            }
        }

        Config::set(
            "database.connections.{$connectionName}",
            [
                'driver' =>
                    $source->driver,

                'host' =>
                    $source->host,

                'port' =>
                    $source->port,

                'database' =>
                    $source->database,

                'username' =>
                    $source->username,

                'password' =>
                    $password,

                'charset' =>
                    'utf8mb4',

                'collation' =>
                    'utf8mb4_unicode_ci',

                'prefix' =>
                    '',

                'prefix_indexes' =>
                    true,

                'strict' =>
                    true,

                'engine' =>
                    null,

                'options' =>
                    extension_loaded('pdo_mysql')
                        ? [
                            \PDO::ATTR_EMULATE_PREPARES => true,
                        ]
                        : [],
            ]
        );

        DB::purge(
            $connectionName
        );

        return $connectionName;
    }

    /**
     * Resolve the selected source database.
     */
    private function resolveSource(
        Request $request
    ): DatabaseSource {
        $sourceDatabaseID =
            $request->input(
                'sourceDatabaseID'
            );

        if ($sourceDatabaseID) {

            $source =
                DatabaseSource::where(
                    'id',
                    $sourceDatabaseID
                )
                    ->where(
                        'is_active',
                        true
                    )
                    ->first();

        } else {

            /*
             * Default to CAPS if no source was specified.
             */
            $source =
                DatabaseSource::where(
                    'name',
                    'CAPS'
                )
                    ->where(
                        'is_active',
                        true
                    )
                    ->first();

            /*
             * If CAPS does not exist,
             * use the first active source.
             */
            if (!$source) {

                $source =
                    DatabaseSource::where(
                        'is_active',
                        true
                    )
                        ->orderBy('id')
                        ->first();
            }
        }

        if (!$source) {

            abort(
                response()->json([
                    'success' => false,

                    'message' =>
                        'No active source database is available.',
                ], 404)
            );
        }

        return $source;
    }

    /**
     * GET /api/database-import/sources
     */
    public function sources()
    {
        try {

            $sources =
                DatabaseSource::where(
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

                'data' =>
                    $sources,
            ]);

        } catch (Throwable $e) {

            Log::error(
                'Database import sources failed',
                [
                    'message' =>
                        $e->getMessage(),

                    'file' =>
                        $e->getFile(),

                    'line' =>
                        $e->getLine(),
                ]
            );

            return response()->json([
                'success' => false,

                'message' =>
                    'Could not load source databases.',

                'error' =>
                    $e->getMessage(),
            ], 500);
        }
    }

    /**
     * GET /api/database-import/subjects
     */
    public function subjects(
        Request $request
    ) {
        $connectionName = null;

        try {

            $source =
                $this->resolveSource(
                    $request
                );

            $connectionName =
                $this->getSourceConnection(
                    $source
                );

            $subjects =
                DB::connection(
                    $connectionName
                )
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
                    'id' =>
                        $source->id,

                    'name' =>
                        $source->name,

                    'driver' =>
                        $source->driver,

                    'database' =>
                        $source->database,
                ],

                'data' =>
                    $subjects,
            ]);

        } catch (Throwable $e) {

            Log::error(
                'Database import subjects failed',
                [
                    'message' =>
                        $e->getMessage(),

                    'file' =>
                        $e->getFile(),

                    'line' =>
                        $e->getLine(),
                ]
            );

            return response()->json([
                'success' => false,

                'message' =>
                    'Could not load subjects from the selected database.',

                'error' =>
                    $e->getMessage(),
            ], 500);

        } finally {

            if ($connectionName) {
                DB::purge(
                    $connectionName
                );
            }
        }
    }

    /**
     * GET /api/database-import/questions/{subjectID}
     */
    public function questions(
        Request $request,
        $subjectID
    ) {
        $connectionName = null;

        try {

            /*
             * Resolve source database.
             */
            $source =
                $this->resolveSource(
                    $request
                );

            /*
             * Create source connection.
             */
            $connectionName =
                $this->getSourceConnection(
                    $source
                );

            /*
             * Get source encryption key.
             */
            $sourceEncrypter =
                $this->getSourceEncrypter();

            /*
             * Get source database connection.
             */
            $connection =
                DB::connection(
                    $connectionName
                );

            /*
             * Verify source subject.
             */
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

            /*
             * Get questions belonging
             * to the selected subject.
             */
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

            foreach (
                $questions
                as $question
            ) {

                /*
                 * Get choices for this question.
                 */
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

                /*
                 * Ignore questions without choices.
                 */
                if (
                    $choices->isEmpty()
                ) {
                    continue;
                }

                $formattedChoices = [];

                foreach (
                    $choices
                    as $choice
                ) {

                    $formattedChoices[] = [
                        'choiceID' =>
                            $choice->choiceID,

                        /*
                         * IMPORTANT:
                         * Decrypt before sending to React.
                         */
                        'choiceText' =>
                            $this->decryptValue(
                                $choice->choiceText,
                                $sourceEncrypter
                            ),

                        'isCorrect' =>
                            (bool)
                            $choice->isCorrect,

                        'position' =>
                            (int)
                            $choice->position,

                        'image' =>
                            $choice->image,
                    ];
                }

                $result[] = [
                    'questionID' =>
                        $question->questionID,

                    'subjectID' =>
                        $question->subjectID,

                    /*
                     * IMPORTANT:
                     * Decrypt before sending to React.
                     */
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
                    'id' =>
                        $source->id,

                    'name' =>
                        $source->name,

                    'driver' =>
                        $source->driver,

                    'database' =>
                        $source->database,
                ],

                'sourceSubject' => [
                    'subjectID' =>
                        $subject->subjectID,

                    'subjectCode' =>
                        $subject->subjectCode,

                    'subjectName' =>
                        $subject->subjectName,
                ],

                'data' =>
                    $result,
            ]);

        } catch (Throwable $e) {

            /*
             * Log the real exception.
             */
            Log::error(
                'DatabaseQuestionImportController@questions failed',
                [
                    'subjectID' =>
                        $subjectID,

                    'sourceDatabaseID' =>
                        $request->input(
                            'sourceDatabaseID'
                        ),

                    'message' =>
                        $e->getMessage(),

                    'file' =>
                        $e->getFile(),

                    'line' =>
                        $e->getLine(),

                    'trace' =>
                        $e->getTraceAsString(),
                ]
            );

            return response()->json([
                'success' => false,

                'message' =>
                    'Could not load questions from the selected database.',

                'error' =>
                    $e->getMessage(),
            ], 500);

        } finally {

            if ($connectionName) {
                DB::purge(
                    $connectionName
                );
            }
        }
    }

    /**
     * POST /api/database-import/questions
     *
     * Import selected questions and their choices.
     */
    public function import(
        Request $request
    ) {
        $validator =
            Validator::make(
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
                ->where(
                    'is_active',
                    true
                )
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

        $connectionName = null;

        try {

            $connectionName =
                $this->getSourceConnection(
                    $source
                );

            $sourceEncrypter =
                $this->getSourceEncrypter();

            $sourceDB =
                DB::connection(
                    $connectionName
                );

            /*
             * Verify source subject if supplied.
             */
            if (
                $request->filled(
                    'sourceSubjectID'
                )
            ) {

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

            /*
             * Get selected questions.
             */
            $query =
                $sourceDB
                    ->table('questions')
                    ->whereIn(
                        'questionID',
                        $request->questionIDs
                    );

            if (
                $request->filled(
                    'sourceSubjectID'
                )
            ) {

                $query->where(
                    'subjectID',
                    $request->sourceSubjectID
                );
            }

            $sourceQuestions =
                $query
                    ->orderBy('questionID')
                    ->get();

            /*
             * Make sure all requested questions exist.
             */
            if (
                $sourceQuestions->count()
                !==
                count(
                    $request->questionIDs
                )
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
             * Destination transaction.
             */
            DB::connection()
                ->transaction(
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

                            /*
                             * Get source choices.
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
                                $sourceChoices->isEmpty()
                            ) {
                                continue;
                            }

                            /*
                             * Decrypt source question first,
                             * then encrypt it using the destination
                             * application's APP_KEY.
                             */
                            $questionText =
                                $this->decryptValue(
                                    $sourceQuestion->questionText,
                                    $sourceEncrypter
                                );

                            $newQuestion =
                                Question::create([
                                    'subjectID' =>
                                        $request->destinationSubjectID,

                                    'questionText' =>
                                        Crypt::encryptString(
                                            $questionText
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
                                        $sourceQuestion->status_id,

                                    'purpose_id' =>
                                        $sourceQuestion->purpose_id,

                                    'editedBy' =>
                                        null,

                                    'approvedBy' =>
                                        null,
                                ]);

                            /*
                             * Import choices.
                             */
                            foreach (
                                $sourceChoices
                                as $sourceChoice
                            ) {

                                $choiceText =
                                    $this->decryptValue(
                                        $sourceChoice->choiceText,
                                        $sourceEncrypter
                                    );

                                Choice::create([
                                    'questionID' =>
                                        $newQuestion->questionID,

                                    'choiceText' =>
                                        Crypt::encryptString(
                                            $choiceText
                                        ),

                                    'isCorrect' =>
                                        (bool)
                                        $sourceChoice->isCorrect,

                                    'position' =>
                                        (int)
                                        $sourceChoice->position,

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

            Log::error(
                'Database question import failed',
                [
                    'sourceDatabaseID' =>
                        $request->sourceDatabaseID,

                    'sourceSubjectID' =>
                        $request->sourceSubjectID,

                    'destinationSubjectID' =>
                        $request->destinationSubjectID,

                    'message' =>
                        $e->getMessage(),

                    'file' =>
                        $e->getFile(),

                    'line' =>
                        $e->getLine(),

                    'trace' =>
                        $e->getTraceAsString(),
                ]
            );

            return response()->json([
                'success' => false,

                'message' =>
                    'Question import failed.',

                'error' =>
                    $e->getMessage(),
            ], 500);

        } finally {

            if ($connectionName) {
                DB::purge(
                    $connectionName
                );
            }
        }
    }

    /**
     * POST /api/database-import/all
     *
     * Import ALL subjects, questions, and choices.
     */
    public function importAll(
        Request $request
    ) {
        $validator =
            Validator::make(
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
                ->where(
                    'is_active',
                    true
                )
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
            config(
                'database.default'
            );

        $defaultConfig =
            config(
                "database.connections.{$defaultConnection}"
            );

        $mainDatabase =
            $defaultConfig['database']
            ?? null;

        $mainHost =
            $defaultConfig['host']
            ?? null;

        /*
         * Prevent importing the same database
         * into itself.
         */
        $sourceHost =
            strtolower(
                trim(
                    (string)
                    $source->host
                )
            );

        $destinationHost =
            strtolower(
                trim(
                    (string)
                    $mainHost
                )
            );

        $sourceHostNormalized =
            in_array(
                $sourceHost,
                [
                    'localhost',
                    '127.0.0.1',
                    '::1',
                ],
                true
            )
                ? 'local'
                : $sourceHost;

        $destinationHostNormalized =
            in_array(
                $destinationHost,
                [
                    'localhost',
                    '127.0.0.1',
                    '::1',
                ],
                true
            )
                ? 'local'
                : $destinationHost;

        if (
            $mainDatabase &&
            $source->database ===
                $mainDatabase &&
            $sourceHostNormalized ===
                $destinationHostNormalized
        ) {

            return response()->json([
                'success' => false,

                'message' =>
                    'The selected source database is the same as the current destination database. Please select a different source database.',
            ], 422);
        }

        $connectionName = null;

        try {

            $connectionName =
                $this->getSourceConnection(
                    $source
                );

            $sourceEncrypter =
                $this->getSourceEncrypter();

            $importedSubjects = 0;
            $importedQuestions = 0;
            $importedChoices = 0;
            $skippedQuestions = 0;

            $questionImagesFound = 0;
            $questionImagesMissing = 0;

            $choiceImagesFound = 0;
            $choiceImagesMissing = 0;

            $sourceDB =
                DB::connection(
                    $connectionName
                );

            /*
             * Verify required tables.
             */
            foreach (
                [
                    'subjects',
                    'questions',
                    'choices',
                ]
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
             * Get all subjects.
             */
            $sourceSubjects =
                $sourceDB
                    ->table('subjects')
                    ->orderBy('subjectID')
                    ->get();

            if (
                $sourceSubjects->isEmpty()
            ) {

                return response()->json([
                    'success' => false,

                    'message' =>
                        'No subjects were found in the selected source database.',
                ], 422);
            }

            DB::connection()
                ->transaction(
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

                        $storagePath =
                            storage_path(
                                'app/public'
                            );

                        $subjectMap = [];

                        foreach (
                            $sourceSubjects
                            as $sourceSubject
                        ) {

                            /*
                             * Create destination subject.
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

                                    'is_imported' =>
                                        true,
                                ]);

                            $subjectMap[
                                $sourceSubject->subjectID
                            ] =
                                $newSubject->subjectID;

                            $importedSubjects++;

                            /*
                             * Get questions.
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
                                 * Get choices.
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
                                    $sourceChoices->isEmpty()
                                ) {

                                    $skippedQuestions++;

                                    continue;
                                }

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
                                 * QUESTION IMAGE
                                 */
                                $questionImage =
                                    $sourceQuestion->image;

                                if (
                                    $questionImage &&
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
                                 * Decrypt source question.
                                 */
                                $questionText =
                                    $this->decryptValue(
                                        $sourceQuestion->questionText,
                                        $sourceEncrypter
                                    );

                                /*
                                 * Create destination question.
                                 */
                                $newQuestion =
                                    Question::create([
                                        'subjectID' =>
                                            $newSubjectID,

                                        'questionText' =>
                                            Crypt::encryptString(
                                                $questionText
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
                                 * CHOICES
                                 */
                                foreach (
                                    $sourceChoices
                                    as $sourceChoice
                                ) {

                                    $choiceImage =
                                        $sourceChoice->image;

                                    if (
                                        $choiceImage &&
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
                                     * Decrypt source choice.
                                     */
                                    $choiceText =
                                        $this->decryptValue(
                                            $sourceChoice->choiceText,
                                            $sourceEncrypter
                                        );

                                    /*
                                     * Create destination choice.
                                     */
                                    Choice::create([
                                        'questionID' =>
                                            $newQuestion->questionID,

                                        'choiceText' =>
                                            Crypt::encryptString(
                                                $choiceText
                                            ),

                                        'isCorrect' =>
                                            (bool)
                                            $sourceChoice->isCorrect,

                                        'position' =>
                                            (int)
                                            $sourceChoice->position,

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

            Log::error(
                'Full database import failed',
                [
                    'sourceDatabaseID' =>
                        $request->sourceDatabaseID,

                    'message' =>
                        $e->getMessage(),

                    'file' =>
                        $e->getFile(),

                    'line' =>
                        $e->getLine(),

                    'trace' =>
                        $e->getTraceAsString(),
                ]
            );

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

            if ($connectionName) {
                DB::purge(
                    $connectionName
                );
            }
        }
    }
}