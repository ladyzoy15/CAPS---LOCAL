import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  useSearchParams,
} from "react-router-dom";


import Register from "./pages/Register";
import Layout from "./components/layout";
import ProtectedRoute from "./components/protectRoute";
import TutorialLayout from "./components/TutorialLayout";

import Credits from "./pages/Credits";

import StudentDashboard from "./pages/StudentDashboard";
import FacultyDashboard from "./pages/FacultyDashboard";
import ProgramChairDashboard from "./pages/ProgramChairDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AssoDeanDashboard from "./pages/AssoDeanDashboard";

import Users from "./pages/Users";

import AdminContent from "./pages/AdminContent";
import ProgramChairContent from "./pages/ProgramChairContent";
import FacultyContent from "./pages/FacultyContent";
import AssoDeanContent from "./pages/AssoDeanContent";

import PracticeExamResults from "./pages/PracticeExamResults";
import PracticeExam from "./pages/PracticeExam";
import PracticeExamPreview from "./pages/PracticeExamPreview";

import ResetPasswordPage from "./components/resetPassForm";
import ForgotPasswordForm from "./components/forgotPassForm";
import ResetUserCodePage from "./components/resetUserCodeForm";
import ForgotUserCodeForm from "./components/forgotUserCodeForm";
import PracticeExamInfo from "./pages/PracticeExamInfo";

import PrintQualifyingExam from "./pages/PrintQualifyingExam";
import PrintPersonalQuiz from "./pages/PrintPersonalQuiz";
import SubjectOverview from "./pages/SubjectOverview";

import Libraries from "./pages/Libraries";
import Sessions from "./pages/Sessions";
import Reports from "./pages/Reports";
import Class from "./pages/Class";
import ClassContent from "./pages/ClassContent";
import StudentClasses from "./pages/StudentClasses";
import ArchivedClass from "./pages/ArchivedClass";
import ArchivedQuiz from "./pages/ArchivedQuiz";

import SubjectList from "./pages/SubjectList";
import SubjectsArchive from "./pages/SubjectsArchive";

import LandingPage from "./pages/LandingPage";

import QuizOverview from "./pages/QuizOverview";
import QuizContent from "./pages/QuizContent";
import QuizInfo from "./pages/QuizInfo";
import StudentQuiz from "./pages/StudentQuiz";
import StudentQuizResults from "./pages/StudentQuizResults";

import ImportQuestionModal from "./components/ImportQuestionModal";


/* =========================================================
   IMPORT QUESTIONS PAGE
========================================================= */

function ImportQuestionsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const personalQuizID =
    searchParams.get("personalQuizID") ||
    searchParams.get("personal_quiz_id");

  const subjectID =
    searchParams.get("subjectID") ||
    searchParams.get("subject_id");

  const handleImportComplete = () => {
    navigate(-1);
  };

  /*
    If opened directly without the quiz/subject IDs,
    show a safe page instead of a blank screen.
  */
  if (!personalQuizID || !subjectID) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-6 dark:bg-[#0f141a]">
        <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-lg dark:border-gray-700 dark:bg-[#171d25]">

          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-orange-100 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400">
            <i className="bx bx-import text-3xl" />
          </div>

          <h1 className="outfit-700 text-xl text-gray-900 dark:text-gray-100">
            Import Questions
          </h1>

          <p className="outfit-400 mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
            Please open the quiz you want to add questions to,
            then use Import Questions from that quiz.
          </p>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="outfit-500 mt-6 rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600"
          >
            Go Back
          </button>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f141a]">
      <ImportQuestionModal
        isOpen={true}
        personalQuizID={personalQuizID}
        subjectID={subjectID}
        existingQuestionIds={[]}
        onClose={() => navigate(-1)}
        onImport={handleImportComplete}
      />
    </div>
  );
}


/* =========================================================
   APP
========================================================= */

function App() {
  return (
    <Router>
      <Routes>

        {/* =================================================
            PUBLIC ROUTES
        ================================================= */}

        <Route
          path="/"
          element={<LandingPage />}
        />

        <Route
          path="/landing"
          element={<LandingPage />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/reset-password"
          element={<ResetPasswordPage />}
        />

        <Route
          path="/forgot-password"
          element={<ForgotPasswordForm />}
        />

        <Route
          path="/reset-user-code"
          element={<ResetUserCodePage />}
        />

        <Route
          path="/forgot-user-code"
          element={<ForgotUserCodeForm />}
        />

        <Route
          path="/team-rvw"
          element={<Credits />}
        />


        {/* =================================================
            LIBRARIES
        ================================================= */}

        <Route
          path="/libraries"
          element={<ProtectedRoute element={<Layout />} />}
        >
          <Route
            index
            element={<Libraries />}
          />
        </Route>


        {/* =================================================
            SESSIONS
        ================================================= */}

        <Route
          path="/sessions"
          element={<ProtectedRoute element={<Layout />} />}
        >
          <Route
            index
            element={<Sessions />}
          />
        </Route>


        {/* =================================================
            CLASS
        ================================================= */}

        <Route
          path="/class"
          element={<ProtectedRoute element={<Layout />} />}
        >
          <Route
            index
            element={<Class />}
          />

          <Route
            path=":classID/students"
            element={<ClassContent />}
          />

          <Route
            path=":classID/quizzes"
            element={<StudentClasses />}
          />
        </Route>


        {/* =================================================
            ARCHIVED CLASS
        ================================================= */}

        <Route
          path="/archived-class"
          element={<ProtectedRoute element={<Layout />} />}
        >
          <Route
            index
            element={<ArchivedClass />}
          />
        </Route>


        {/* =================================================
            ARCHIVED QUIZ
        ================================================= */}

        <Route
          path="/archived-quiz"
          element={<ProtectedRoute element={<Layout />} />}
        >
          <Route
            index
            element={<ArchivedQuiz />}
          />
        </Route>


        {/* =================================================
            REPORTS
        ================================================= */}

        <Route
          path="/reports"
          element={<ProtectedRoute element={<Layout />} />}
        >
          <Route
            index
            element={<Reports />}
          />
        </Route>


        {/* =================================================
            HELP
        ================================================= */}

        <Route
          path="/help"
          element={<TutorialLayout />}
        />


        {/* =================================================
            PRACTICE EXAM RESULTS
        ================================================= */}

        <Route
          path="/practice-exam-result"
          element={<ProtectedRoute element={<Layout />} />}
        >
          <Route
            index
            element={<PracticeExamResults />}
          />

          <Route
            path="content"
            element={<PracticeExamResults />}
          />
        </Route>


        {/* =================================================
            PRINT QUALIFICATION EXAM
        ================================================= */}

        <Route
          path="/print-qualification-exam"
          element={<ProtectedRoute element={<Layout />} />}
        >
          <Route
            index
            element={<PrintQualifyingExam />}
          />

          <Route
            path="content"
            element={<PrintQualifyingExam />}
          />
        </Route>


        {/* =================================================
            PRINT PERSONAL QUIZ
        ================================================= */}

        <Route
          path="/print-personal-quiz"
          element={<ProtectedRoute element={<Layout />} />}
        >
          <Route
            index
            element={<PrintPersonalQuiz />}
          />

          <Route
            path="content"
            element={<PrintPersonalQuiz />}
          />
        </Route>


        {/* =================================================
            PRACTICE EXAM
        ================================================= */}

        <Route
          path="/practice-exam"
          element={<ProtectedRoute element={<Layout />} />}
        >
          <Route
            index
            element={<PracticeExam />}
          />

          <Route
            path="content"
            element={<PracticeExam />}
          />
        </Route>


        {/* =================================================
            PRACTICE EXAM PREVIEW
        ================================================= */}

        <Route
          path="/practice-exam/preview/:subjectID"
          element={<ProtectedRoute element={<Layout />} />}
        >
          <Route
            index
            element={<PracticeExamPreview />}
          />
        </Route>


        {/* =================================================
            EXAM PREVIEW
        ================================================= */}

        <Route
          path="/exam-preview"
          element={<ProtectedRoute element={<Layout />} />}
        >
          <Route
            index
            element={<PracticeExamInfo />}
          />

          <Route
            path="content"
            element={<PracticeExamInfo />}
          />
        </Route>


        {/* =================================================
            STUDENT DASHBOARD
        ================================================= */}

        <Route
          path="/student-dashboard"
          element={<ProtectedRoute element={<Layout />} />}
        >
          <Route
            index
            element={<StudentDashboard />}
          />

          <Route
            path="dashboard"
            element={<StudentDashboard />}
          />
        </Route>


        {/* =================================================
            FACULTY ROUTES
        ================================================= */}

        <Route
          path="/faculty/subjects"
          element={<ProtectedRoute element={<Layout />} />}
        >
          <Route
            index
            element={<SubjectList />}
          />

          <Route
            path="content"
            element={<FacultyContent />}
          />
        </Route>


        <Route
          path="/faculty-dashboard"
          element={<ProtectedRoute element={<Layout />} />}
        >
          <Route
            index
            element={<FacultyDashboard />}
          />

          <Route
            path="dashboard"
            element={<FacultyDashboard />}
          />
        </Route>


        {/* =================================================
            PROGRAM CHAIR ROUTES
        ================================================= */}

        <Route
          path="/program-chair/subjects"
          element={<ProtectedRoute element={<Layout />} />}
        >
          <Route
            index
            element={<SubjectList />}
          />

          <Route
            path="content"
            element={<ProgramChairContent />}
          />
        </Route>


        <Route
          path="/program-chair-dashboard"
          element={<ProtectedRoute element={<Layout />} />}
        >
          <Route
            index
            element={<ProgramChairDashboard />}
          />

          <Route
            path="dashboard"
            element={<ProgramChairDashboard />}
          />
        </Route>


        {/* =================================================
            ASSOCIATE DEAN ROUTES
        ================================================= */}

        <Route
          path="/asso-dean/subjects"
          element={<ProtectedRoute element={<Layout />} />}
        >
          <Route
            index
            element={<SubjectList />}
          />

          <Route
            path="archive"
            element={<SubjectsArchive />}
          />

          <Route
            path="content"
            element={<AdminContent />}
          />
        </Route>


        <Route
          path="/asso-dean-dashboard"
          element={<ProtectedRoute element={<Layout />} />}
        >
          <Route
            index
            element={<AssoDeanDashboard />}
          />

          <Route
            path="dashboard"
            element={<AssoDeanDashboard />}
          />
        </Route>


        {/* =================================================
            DEAN ROUTES
        ================================================= */}

        <Route
          path="/dean/subjects"
          element={<ProtectedRoute element={<Layout />} />}
        >
          <Route
            index
            element={<SubjectList />}
          />

          <Route
            path="archive"
            element={<SubjectsArchive />}
          />

          <Route
            path="content"
            element={<AdminContent />}
          />
        </Route>


        <Route
          path="/dean-dashboard"
          element={<ProtectedRoute element={<Layout />} />}
        >
          <Route
            index
            element={<FacultyDashboard />}
          />

          <Route
            path="dashboard"
            element={<FacultyDashboard />}
          />
        </Route>


        {/* =================================================
            SUBJECT OVERVIEW
        ================================================= */}

        <Route
          path="/subject-overview/:subjectID"
          element={<ProtectedRoute element={<Layout />} />}
        >
          <Route
            index
            element={<SubjectOverview />}
          />
        </Route>


        {/* =================================================
            QUIZ OVERVIEW
        ================================================= */}

        <Route
          path="/quiz-overview"
          element={<ProtectedRoute element={<Layout />} />}
        >
          <Route
            index
            element={<QuizOverview />}
          />
        </Route>


        {/* =================================================
            QUIZ CONTENT
        ================================================= */}

        <Route
          path="/quiz-content"
          element={<ProtectedRoute element={<Layout />} />}
        >
          <Route
            index
            element={<QuizContent />}
          />
        </Route>


        {/* =================================================
            QUIZ INFO
        ================================================= */}

        <Route
          path="/quiz-info/:classPersonalQuizID"
          element={<ProtectedRoute element={<Layout />} />}
        >
          <Route
            index
            element={<QuizInfo />}
          />
        </Route>


        {/* =================================================
            STUDENT QUIZ
        ================================================= */}

        <Route
          path="/quiz/:classPersonalQuizID"
          element={<ProtectedRoute element={<Layout />} />}
        >
          <Route
            index
            element={<StudentQuiz />}
          />
        </Route>


        {/* =================================================
            QUIZ RESULT
        ================================================= */}

        <Route
          path="/quiz-result/:classPersonalQuizID"
          element={<ProtectedRoute element={<Layout />} />}
        >
          <Route
            index
            element={<StudentQuizResults />}
          />
        </Route>


        {/* =================================================
            IMPORT QUESTIONS
        ================================================= */}

        <Route
          path="/import-questions"
          element={<ProtectedRoute element={<Layout />} />}
        >
          <Route
            index
            element={<ImportQuestionsPage />}
          />
        </Route>


        {/* =================================================
            ALSO SUPPORT /import
        ================================================= */}

        <Route
          path="/import"
          element={<ProtectedRoute element={<Layout />} />}
        >
          <Route
            index
            element={<ImportQuestionsPage />}
          />
        </Route>


        {/* =================================================
            USERS
        ================================================= */}

        <Route
          path="/users"
          element={<ProtectedRoute element={<Layout />} />}
        >
          <Route
            index
            element={<Users />}
          />

          <Route
            path="users"
            element={<Users />}
          />
        </Route>


        {/* =================================================
            ADMIN DASHBOARD
        ================================================= */}

        <Route
          path="/admin-dashboard"
          element={<ProtectedRoute element={<Layout />} />}
        >
          <Route
            index
            element={<AdminDashboard />}
          />

          <Route
            path="dashboard"
            element={<AdminDashboard />}
          />
        </Route>

      </Routes>
    </Router>
  );
}

export default App;