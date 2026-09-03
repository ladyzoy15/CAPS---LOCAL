<?php

use Modules\Questions\Controllers\DatabaseQuestionImportController;
use App\Http\Middleware\TokenExpirationMiddleware;
use Illuminate\Support\Facades\Route;
use Modules\Users\Controllers\AuthController;
use Modules\Subjects\Controllers\SubjectController;
use Modules\FacultySubjects\Controllers\FacultySubjectController;
use Modules\Questions\Controllers\QuestionController;
use Modules\Choices\Controllers\ChoiceController;
use Modules\Users\Controllers\UserController;
use Modules\PracticeExams\Controllers\PracticeExamSettingController;
use Modules\PracticeExams\Controllers\PracticeExamController;
use Modules\PracticeExams\Controllers\PracticeExamLeaderboardController;
use Modules\Users\Controllers\ProgramController;
use Modules\Users\Controllers\CampusController;
use Modules\Users\Controllers\RoleController;
use Modules\Users\Controllers\PasswordResetController;
use Modules\App\Controllers\AppController;
use Modules\Print\Controllers\PrintController;
use Modules\Subjects\Controllers\YearLevelController;
use Modules\Users\Controllers\StudentTeacherEnrollmentController;
use Modules\PersonalExams\Controllers\PersonalQuizController;
use Modules\PersonalExams\Controllers\PersonalQuizQuestionController;
use Modules\PersonalExams\Controllers\PersonalQuizChoiceController;
use Modules\PersonalExams\Controllers\PersonalQuizSettingController;
use Modules\PersonalExams\Controllers\PersonalQuizLeaderboardController;
use Modules\PersonalClasses\Controllers\ClassController;
use Modules\PersonalClasses\Controllers\ClassEnrollmentController;
use Modules\PersonalClasses\Controllers\ClassPersonalQuizController;
use Modules\PersonalExams\Controllers\StudentQuizResultController;
use Modules\PersonalExams\Controllers\StudentQuizController;
use Modules\PersonalExams\Controllers\QuizSessionController;

/*
|--------------------------------------------------------------------------
| Public API Routes
|--------------------------------------------------------------------------
*/

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::get('/roles', [RoleController::class, 'indexAvailableRoles']);
Route::get('/campuses', [CampusController::class, 'index']);
Route::post('/forgot-password', [PasswordResetController::class, 'sendResetLinkEmail']);
Route::post('/reset-password', [PasswordResetController::class, 'reset']);
Route::post('/forgot-user-code', [UserController::class, 'sendUserCodeResetLinkEmail']);
Route::post('/reset-user-code', [UserController::class, 'resetUserCode']);
Route::get('/app-version', [AppController::class, 'getVersion']);

/*
|--------------------------------------------------------------------------
| Authenticated Routes - All Roles
|--------------------------------------------------------------------------
*/

Route::middleware(['auth:sanctum'])->group(function () {

    Route::post('/change-password', [AuthController::class, 'changePassword']);
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::get('/user/profile', [UserController::class, 'getProfile']);
    Route::post('/user/update-profile', [UserController::class, 'updateProfile']);

    Route::get('/subjects/all', [SubjectController::class, 'allSubjects']);

    Route::get(
        '/practice-exam/results/{subjectID}',
        [PracticeExamController::class, 'subjectExamResults']
    );

    Route::get(
        '/results/all-students',
        [PracticeExamController::class, 'getAllExamResults']
    );

    Route::get(
        '/practice-exam/leaderboard/{subjectID}',
        [PracticeExamLeaderboardController::class, 'leaderboard']
    );

    Route::get(
        '/practice-exam/recent-takers/{subjectID}',
        [PracticeExamLeaderboardController::class, 'recentTakers']
    );

    Route::get(
        '/practice-exam/overall-leaderboard',
        [PracticeExamLeaderboardController::class, 'overallLeaderboard']
    );

    Route::get(
        '/practice-exam/overall-recent-takers',
        [PracticeExamLeaderboardController::class, 'overallRecentTakers']
    );

    Route::get(
        '/classes/{classID}/quizzes',
        [ClassPersonalQuizController::class, 'index']
    );

    Route::get(
        '/classes/index',
        [ClassController::class, 'index']
    );
});

/*
|--------------------------------------------------------------------------
| Faculty / Program Chair / Dean / Associate Dean
| roleID: 2,3,4,5
|--------------------------------------------------------------------------
*/

Route::middleware([
    'auth:sanctum',
    TokenExpirationMiddleware::class,
    'role:2,3,4,5'
])->group(function () {

    /*
    |--------------------------------------------------------------------------
    | User Management
    |--------------------------------------------------------------------------
    */

    Route::get('/users', [UserController::class, 'index']);
    Route::patch('/users/{userID}/approve', [UserController::class, 'approveUser']);
    Route::patch('/users/{userID}/disapprove', [UserController::class, 'disapproveUser']);

    Route::post(
        '/users/approve-multiple',
        [UserController::class, 'approveMultipleUsers']
    );

    Route::post(
        '/users/activate-multiple',
        [UserController::class, 'activateMultipleUsers']
    );

    Route::post(
        '/users/deactivate-multiple',
        [UserController::class, 'deactivateMultipleUsers']
    );

    Route::patch(
        'users/{id}/deactivate',
        [UserController::class, 'deactivate']
    );

    Route::patch(
        'users/{id}/activate',
        [UserController::class, 'activate']
    );

    /*
    |--------------------------------------------------------------------------
    | Choices
    |--------------------------------------------------------------------------
    */

    Route::post(
        '/questions/choices',
        [ChoiceController::class, 'store']
    );

    Route::get(
        '/questions/{questionID}/choices',
        [ChoiceController::class, 'showChoices']
    );

    /*
    |--------------------------------------------------------------------------
    | Subjects
    |--------------------------------------------------------------------------
    */

    Route::get('/subjects', [SubjectController::class, 'index']);

    Route::post(
        '/faculty/assign-subject',
        [FacultySubjectController::class, 'assignSubject']
    );

    Route::get(
        '/faculty/my-subjects',
        [FacultySubjectController::class, 'mySubjects']
    );

    Route::get(
        '/faculty/availableSubjects',
        [FacultySubjectController::class, 'availableSubjects']
    );

    Route::delete(
        '/remove-assigned-subject/{subjectID}',
        [FacultySubjectController::class, 'removeAssignedSubject']
    );

    /*
    |--------------------------------------------------------------------------
    | Year Levels
    |--------------------------------------------------------------------------
    */

    Route::get('/year-levels', [YearLevelController::class, 'index']);

    /*
    |--------------------------------------------------------------------------
    | Questions
    |--------------------------------------------------------------------------
    */

    // Existing FILE import route - DO NOT REMOVE
    Route::post(
        '/questions/add',
        [QuestionController::class, 'store']
    );

    /*
    |--------------------------------------------------------------------------
    | DATABASE QUESTION IMPORT
    |--------------------------------------------------------------------------
    |
    | Source:
    |     MySQL database "caps"
    |
    | Flow:
    |     From Database
    |       -> Select Subject
    |       -> Get Questions
    |       -> Select Questions
    |       -> Import Selected
    |
    */

    Route::get(
        '/database-import/subjects',
        [DatabaseQuestionImportController::class, 'subjects']
    );

    Route::get(
        '/database-import/questions/{subjectID}',
        [DatabaseQuestionImportController::class, 'questions']
    );

    Route::post(
        '/database-import/questions',
        [DatabaseQuestionImportController::class, 'import']
    );

    /*
    |--------------------------------------------------------------------------
    | Existing Question Routes
    |--------------------------------------------------------------------------
    */

    Route::get(
        '/subjects/{subjectID}/questions',
        [QuestionController::class, 'indexQuestions']
    );

    Route::post(
        '/questions/update/{questionID}',
        [QuestionController::class, 'update']
    );

    Route::delete(
        '/questions/delete/{questionID}',
        [QuestionController::class, 'destroy']
    );

    Route::get(
        '/faculty/my-questions/{subjectID}',
        [QuestionController::class, 'mySubjectQuestions']
    );

    Route::post(
        '/choices/update',
        [ChoiceController::class, 'updateChoices']
    );

    Route::post(
        '/questions/{questionID}/duplicate',
        [QuestionController::class, 'duplicate']
    );

    Route::get(
        '/questions/count',
        [QuestionController::class, 'questionCount']
    );

    /*
    |--------------------------------------------------------------------------
    | Printable Exam
    |--------------------------------------------------------------------------
    */

    Route::post(
        '/generate-printable-exam/{subjectID}',
        [PrintController::class, 'generatePrintableExam']
    );

    Route::get(
        '/subjects/question-difficulty-counts',
        [PrintController::class, 'getSubjectQuestionDifficultyCounts']
    );

    /*
    |--------------------------------------------------------------------------
    | Personal Quiz PDF
    |--------------------------------------------------------------------------
    */

    Route::get(
        '/personal-quiz/{personalQuizID}/questions',
        [PrintController::class, 'getPersonalQuizQuestions']
    );

    Route::post(
        '/generate-personal-quiz-pdf',
        [PrintController::class, 'generatePersonalQuizPDF']
    );

    /*
    |--------------------------------------------------------------------------
    | Practice Exam
    |--------------------------------------------------------------------------
    */

    Route::get(
        '/practice-exam/preview/{subjectID}',
        [PracticeExamController::class, 'previewPracticeExam']
    );

    Route::post(
        '/generate-single-subject-personal-preview',
        [PrintController::class, 'generateSingleSubjectPersonalPreview']
    );

    /*
    |--------------------------------------------------------------------------
    | Programs
    |--------------------------------------------------------------------------
    */

    Route::get('/programs', [ProgramController::class, 'index']);

    /*
    |--------------------------------------------------------------------------
    | Personal Quizzes
    |--------------------------------------------------------------------------
    */

    Route::post(
        '/personal-quizzes',
        [PersonalQuizController::class, 'store']
    );

    Route::get(
        '/personal-quizzes',
        [PersonalQuizController::class, 'index']
    );

    Route::get(
        '/personal-quizzes/archived',
        [PersonalQuizController::class, 'archived']
    );

    Route::get(
        '/personal-quizzes/subject-options',
        [SubjectController::class, 'quizSubjects']
    );

    Route::put(
        '/update-personal-quizzes/{personalQuizID}',
        [PersonalQuizController::class, 'update']
    );

    Route::patch(
        '/personal-quizzes/{personalQuizID}/archive',
        [PersonalQuizController::class, 'archive']
    );

    Route::patch(
        '/personal-quizzes/{personalQuizID}/unarchive',
        [PersonalQuizController::class, 'unarchive']
    );

    Route::delete(
        '/personal-quizzes/{personalQuizID}',
        [PersonalQuizController::class, 'destroy']
    );

    /*
    |--------------------------------------------------------------------------
    | Personal Quiz Leaderboard
    |--------------------------------------------------------------------------
    */

    Route::get(
        '/personal-quiz/{personalQuizID}/leaderboard',
        [PersonalQuizLeaderboardController::class, 'leaderboard']
    );

    Route::get(
        '/personal-quiz/{personalQuizID}/recent-takers',
        [PersonalQuizLeaderboardController::class, 'recentTakers']
    );

    /*
    |--------------------------------------------------------------------------
    | Personal Quiz Questions
    |--------------------------------------------------------------------------
    */

    Route::get(
        '/personal-quiz-questions/{personalQuizID}',
        [PersonalQuizQuestionController::class, 'index']
    );

    Route::post(
        '/personal-quiz-questions',
        [PersonalQuizQuestionController::class, 'store']
    );

    Route::post(
        '/personal-quiz-questions/import',
        [PersonalQuizQuestionController::class, 'import']
    );

    Route::post(
        '/personal-quiz-questions/{personalQuizQuestionID}',
        [PersonalQuizQuestionController::class, 'update']
    );

    Route::post(
        '/personal-quiz-questions/{personalQuizQuestionID}/duplicate',
        [PersonalQuizQuestionController::class, 'duplicate']
    );

    Route::delete(
        '/personal-quiz-questions/{personalQuizQuestionID}',
        [PersonalQuizQuestionController::class, 'destroy']
    );

    /*
    |--------------------------------------------------------------------------
    | Personal Quiz Choices
    |--------------------------------------------------------------------------
    */

    Route::get(
        '/personal-quiz-choices/{personalQuizQuestionID}',
        [PersonalQuizChoiceController::class, 'show']
    );

    Route::post(
        '/personal-quiz-choices',
        [PersonalQuizChoiceController::class, 'store']
    );

    Route::put(
        '/personal-quiz-choices',
        [PersonalQuizChoiceController::class, 'updateChoices']
    );

    Route::post(
        '/personal-quiz-choices/update',
        [PersonalQuizChoiceController::class, 'updateChoices']
    );

    Route::delete(
        '/personal-quiz-choices/{personalQuizQuestionID}',
        [PersonalQuizChoiceController::class, 'destroy']
    );

    /*
    |--------------------------------------------------------------------------
    | Class Personal Quiz Settings
    |--------------------------------------------------------------------------
    */

    Route::get(
        '/class-quizzes/{classPersonalQuizID}/settings',
        [PersonalQuizSettingController::class, 'show']
    );

    Route::post(
        '/class-quizzes/{classPersonalQuizID}/settings',
        [PersonalQuizSettingController::class, 'store']
    );

    Route::put(
        '/class-quizzes/{classPersonalQuizID}/settings',
        [PersonalQuizSettingController::class, 'update']
    );

    Route::delete(
        '/class-quizzes/{classPersonalQuizID}/settings',
        [PersonalQuizSettingController::class, 'destroy']
    );

    /*
    |--------------------------------------------------------------------------
    | Personal Exam Settings
    |--------------------------------------------------------------------------
    */

    Route::post(
        '/personal-exam-settings',
        [PracticeExamSettingController::class, 'store']
    );

    Route::get(
        '/personal-exam-settings/{subjectID}',
        [PracticeExamSettingController::class, 'show']
    );

    /*
    |--------------------------------------------------------------------------
    | Students
    |--------------------------------------------------------------------------
    */

    Route::get(
        '/my-students',
        [StudentTeacherEnrollmentController::class, 'myStudents']
    );

    /*
    |--------------------------------------------------------------------------
    | Exam Questions Status
    |--------------------------------------------------------------------------
    */

    Route::get(
        '/subjects/{subjectID}/exam-questions-status',
        [SubjectController::class, 'getExamQuestionsStatus']
    );

    /*
    |--------------------------------------------------------------------------
    | Practice Exam Leaderboard
    |--------------------------------------------------------------------------
    */

    Route::get(
        '/practice-exam/leaderboard/{subjectID}',
        [PracticeExamLeaderboardController::class, 'leaderboard']
    );

    Route::get(
        '/practice-exam/recent-takers/{subjectID}',
        [PracticeExamLeaderboardController::class, 'recentTakers']
    );

    Route::get(
        '/practice-exam/overall-leaderboard',
        [PracticeExamLeaderboardController::class, 'overallLeaderboard']
    );

    /*
    |--------------------------------------------------------------------------
    | Personal Classes
    |--------------------------------------------------------------------------
    */

    Route::post(
        '/classes',
        [ClassController::class, 'store']
    );

    Route::get(
        '/classes/archived',
        [ClassController::class, 'archived']
    );

    Route::get(
        '/classes/show/{classID}',
        [ClassController::class, 'show']
    );

    Route::put(
        '/classes/update/{classID}',
        [ClassController::class, 'update']
    );

    Route::patch(
        '/classes/archive/{classID}',
        [ClassController::class, 'archive']
    );

    Route::patch(
        '/classes/{classID}/unarchive',
        [ClassController::class, 'unarchive']
    );

    Route::delete(
        '/classes/destroy/{classID}',
        [ClassController::class, 'destroy']
    );

    /*
    |--------------------------------------------------------------------------
    | Class Enrollments
    |--------------------------------------------------------------------------
    */

    Route::get(
        '/classes/{classID}/students',
        [ClassEnrollmentController::class, 'index']
    );

    Route::delete(
        '/classes/{classID}/remove-student',
        [ClassEnrollmentController::class, 'removeStudent']
    );

    /*
    |--------------------------------------------------------------------------
    | Class Personal Quizzes
    |--------------------------------------------------------------------------
    */

    Route::get(
        '/classes/{classID}/quizzes/available',
        [ClassPersonalQuizController::class, 'availablePersonalQuizzes']
    );

    Route::post(
        '/classes/quizzes',
        [ClassPersonalQuizController::class, 'store']
    );

    Route::put(
        '/classes/quizzes/{classPersonalQuizID}',
        [ClassPersonalQuizController::class, 'update']
    );

    Route::patch(
        '/classes/quizzes/{classPersonalQuizID}/dates',
        [ClassPersonalQuizController::class, 'updateDates']
    );

    Route::delete(
        '/classes/quizzes/{classPersonalQuizID}',
        [ClassPersonalQuizController::class, 'destroy']
    );

    /*
    |--------------------------------------------------------------------------
    | Personal Quiz to Classes Assignment
    |--------------------------------------------------------------------------
    */

    Route::get(
        '/personal-quizzes/{personalQuizID}/classes',
        [ClassPersonalQuizController::class, 'getClassesForQuiz']
    );

    Route::post(
        '/personal-quizzes/{personalQuizID}/assign-classes',
        [ClassPersonalQuizController::class, 'assignQuizToClasses']
    );

    /*
    |--------------------------------------------------------------------------
    | Quiz Results
    |--------------------------------------------------------------------------
    */

    Route::get(
        '/quiz-results',
        [StudentQuizResultController::class, 'index']
    );

    Route::get(
        '/quiz-results/{id}',
        [StudentQuizResultController::class, 'show']
    );

    Route::put(
        '/quiz-results/{id}',
        [StudentQuizResultController::class, 'update']
    );

    Route::delete(
        '/quiz-results/{id}',
        [StudentQuizResultController::class, 'destroy']
    );

    Route::get(
        '/classes/{classID}/quiz-results',
        [StudentQuizResultController::class, 'classResults']
    );

    Route::get(
        '/quizzes/{classPersonalQuizID}/results',
        [StudentQuizResultController::class, 'quizResults']
    );

    Route::get(
        '/quizzes/{classPersonalQuizID}/non-takers',
        [StudentQuizResultController::class, 'quizNonTakers']
    );

    /*
    |--------------------------------------------------------------------------
    | Quiz Sessions
    |--------------------------------------------------------------------------
    */

    Route::get(
        '/quiz-sessions/faculty-sessions',
        [QuizSessionController::class, 'facultySessions']
    );
});

/*
|--------------------------------------------------------------------------
| Students
| roleID: 1
|--------------------------------------------------------------------------
*/

Route::middleware([
    'api',
    'auth:sanctum',
    'role:1'
])->group(function () {

    Route::get(
        '/student/practice-subjects',
        [SubjectController::class, 'getProgramSubjects']
    );

    Route::get(
        '/practice-exam/generate/{subjectID}',
        [PracticeExamController::class, 'generate']
    );

    Route::post(
        '/practice-exam/submit',
        [PracticeExamController::class, 'submit']
    );

    Route::get(
        '/practice-exam/history',
        [PracticeExamController::class, 'history']
    );

    Route::post(
        '/enroll-teacher',
        [StudentTeacherEnrollmentController::class, 'enroll']
    );

    Route::get(
        '/my-teachers',
        [StudentTeacherEnrollmentController::class, 'myTeachers']
    );

    Route::post(
        '/personal-exam/generate/{subjectID}/{teacherID}',
        [PracticeExamController::class, 'generatePersonalExam']
    );

    Route::post(
        '/personal-exam/submit',
        [PracticeExamController::class, 'submitPersonalExam']
    );

    Route::get(
        '/classes/my-classes',
        [ClassEnrollmentController::class, 'myClasses']
    );

    Route::post(
        '/classes/join-by-code',
        [ClassEnrollmentController::class, 'joinByCode']
    );

    Route::get(
        '/classes/join/{token}',
        [ClassEnrollmentController::class, 'joinByLink']
    );

    Route::delete(
        '/classes/{classID}/unenroll',
        [ClassEnrollmentController::class, 'unenroll']
    );

    Route::get(
        '/classes/{classID}/quizzes/student',
        [ClassPersonalQuizController::class, 'studentQuizzes']
    );

    Route::get(
        '/quizzes/{classPersonalQuizID}/info',
        [StudentQuizController::class, 'getQuizInfo']
    );

    Route::post(
        '/quizzes/{classPersonalQuizID}/start',
        [StudentQuizController::class, 'startQuiz']
    );

    Route::post(
        '/quizzes/{classPersonalQuizID}/submit',
        [StudentQuizController::class, 'submitQuiz']
    );

    Route::get(
        '/quiz-results',
        [StudentQuizResultController::class, 'index']
    );

    Route::get(
        '/quiz-results/{id}',
        [StudentQuizResultController::class, 'show']
    );

    Route::get(
        '/classes/{classID}/quiz-history',
        [StudentQuizResultController::class, 'classHistory']
    );

    Route::get(
        '/quizzes/{classPersonalQuizID}/history',
        [StudentQuizResultController::class, 'quizHistory']
    );

    Route::get(
        '/quiz-sessions',
        [QuizSessionController::class, 'studentSessions']
    );
});

/*
|--------------------------------------------------------------------------
| Program Chair
| roleID: 3
|--------------------------------------------------------------------------
*/

Route::middleware([
    'auth:sanctum',
    'role:3'
])->group(function () {

    Route::get(
        '/program/{subjectID}',
        [QuestionController::class, 'indexQuestionsByProgram']
    );
});

/*
|--------------------------------------------------------------------------
| Program Chair / Dean / Associate Dean
| roleID: 3,4,5
|--------------------------------------------------------------------------
*/

Route::middleware([
    'auth:sanctum',
    'role:3,4,5'
])->group(function () {

    Route::patch(
        '/questions/{questionID}/status',
        [QuestionController::class, 'updateStatus']
    );

    Route::post(
        '/questions/approve-multiple',
        [QuestionController::class, 'approveMultipleQuestions']
    );

    Route::get(
        '/practice-settings/{subjectID}',
        [PracticeExamSettingController::class, 'show']
    );

    Route::post(
        '/practice-settings',
        [PracticeExamSettingController::class, 'store']
    );

    Route::post(
        '/generate-multi-subject-exam',
        [PrintController::class, 'generateMultiSubjectExam']
    );
});

/*
|--------------------------------------------------------------------------
| Dean Only
| roleID: 4
|--------------------------------------------------------------------------
*/

Route::middleware([
    'auth:sanctum',
    'role:4'
])->group(function () {

    Route::post(
        '/campuses',
        [CampusController::class, 'store']
    );
});

/*
|--------------------------------------------------------------------------
| Dean / Associate Dean
| roleID: 4,5
|--------------------------------------------------------------------------
*/

Route::middleware([
    'auth:sanctum',
    'role:4,5'
])->group(function () {

    Route::patch(
        '/users/{userID}/credentials',
        [UserController::class, 'updateUserCredentials']
    );

    /*
    |--------------------------------------------------------------------------
    | Subject Management
    |--------------------------------------------------------------------------
    */

    Route::post(
        '/add-subjects',
        [SubjectController::class, 'store']
    );

    Route::get(
        '/subjects/archived',
        [SubjectController::class, 'archived']
    );

    Route::patch(
        '/subjects/{subjectID}/archive',
        [SubjectController::class, 'destroy']
    );

    Route::patch(
        '/subjects/{subjectID}/restore',
        [SubjectController::class, 'restore']
    );

    Route::delete(
        '/subjects/{subjectID}/permanent-delete',
        [SubjectController::class, 'permanentDelete']
    );

    Route::put(
        '/subjects/{subjectID}/update',
        [SubjectController::class, 'update']
    );

    /*
    |--------------------------------------------------------------------------
    | User Deletion
    |--------------------------------------------------------------------------
    */

    Route::delete(
        '/users/{userID}',
        [UserController::class, 'deleteUser']
    );

    Route::post(
        '/users/delete-multiple',
        [UserController::class, 'deleteMultipleUsers']
    );

    /*
    |--------------------------------------------------------------------------
    | Exam Questions Management
    |--------------------------------------------------------------------------
    */

    Route::patch(
        '/subjects/{subjectID}/enable-exam-questions',
        [SubjectController::class, 'enableExamQuestions']
    );

    Route::patch(
        '/subjects/{subjectID}/disable-exam-questions',
        [SubjectController::class, 'disableExamQuestions']
    );
});

/*
|--------------------------------------------------------------------------
| Storage / Images
|--------------------------------------------------------------------------
*/

Route::get(
    'storage/question_images/{filename}',
    function ($filename) {

        $path = public_path(
            'storage/question_images/' . $filename
        );

        if (!file_exists($path)) {
            abort(404);
        }

        return response()->file($path);
    }
)->middleware('image.cors');

Route::get(
    'storage/choices/{filename}',
    function ($filename) {

        $path = public_path(
            'storage/choices/' . $filename
        );

        if (!file_exists($path)) {
            abort(404);
        }

        return response()->file($path);
    }
)->middleware('image.cors');