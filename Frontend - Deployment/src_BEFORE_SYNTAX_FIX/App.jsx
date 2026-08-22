import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

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

/* =====================================================
   IMPORT QUESTIONS
   ===================================================== */
import ImportQuestions from "./pages/ImportQuestions";

import LandingPage from "./pages/LandingPage";

import QuizOverview from "./pages/QuizOverview";
import QuizContent from "./pages/QuizContent";
import QuizInfo from "./pages/QuizInfo";
import StudentQuiz from "./pages/StudentQuiz";
import StudentQuizResults from "./pages/StudentQuizResults";


function App() {
  return (
    <Router>
      <Routes>

        {/* =====================================================
            PUBLIC ROUTES
            ===================================================== */}

        <Route path="/" element={<LandingPage />} />

        <Route path="/register" element={<Register />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordForm />} />
        <Route path="/reset-user-code" element={<ResetUserCodePage />} />
        <Route path="/forgot-user-code" element={<ForgotUserCodeForm />} />
        <Route path="/team-REVA" element={<Credits />} />
        <Route path="/team-rvw" element={<Credits />} />

        {/* Public Landing Page */}
        <Route
          path="/landing"
          element={<LandingPage />}
        />


        {/* =====================================================
            LIBRARIES - PERSONAL QUIZZES
            ===================================================== */}

        <Route
          path="/libraries"
          element={<ProtectedRoute element={<Layout />} />}
        >
          <Route
            index
            element={<Libraries />}
          />
        </Route>


        {/* =====================================================
            SESSIONS
            ===================================================== */}

        <Route
          path="/sessions"
          element={<ProtectedRoute element={<Layout />} />}
        >
          <Route
            index
            element={<Sessions />}
          />
        </Route>


        {/* =====================================================
            CLASS
            ===================================================== */}

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


        {/* =====================================================
            ARCHIVED CLASS
            ===================================================== */}

        <Route
          path="/archived-class"
          element={<ProtectedRoute element={<Layout />} />}
        >
          <Route
            index
            element={<ArchivedClass />}
          />
        </Route>


        {/* =====================================================
            ARCHIVED QUIZZES
            ===================================================== */}

        <Route
          path="/archived-quiz"
          element={<ProtectedRoute element={<Layout />} />}
        >
          <Route
            index
            element={<ArchivedQuiz />}
          />
        </Route>


        {/* =====================================================
            REPORTS
            ===================================================== */}

        <Route
          path="/reports"
          element={<ProtectedRoute element={<Layout />} />}
        >
          <Route
            index
            element={<Reports />}
          />
        </Route>


        {/* =====================================================
            PUBLIC DOCUMENTATION
            ===================================================== */}

        <Route
          path="/help"
          element={<TutorialLayout />}
        />


        {/* =====================================================
            PRACTICE EXAM RESULTS
            ===================================================== */}

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


        {/* =====================================================
            PRINT Subject
            ===================================================== */}

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


        {/* =====================================================
            PRINT PERSONAL QUIZ
            ===================================================== */}

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


        {/* =====================================================
            PRACTICE EXAM
            ===================================================== */}

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


        {/* =====================================================
            PRACTICE EXAM PREVIEW
            ===================================================== */}

        <Route
          path="/practice-exam/preview/:subjectID"
          element={<ProtectedRoute element={<Layout />} />}
        >
          <Route
            index
            element={<PracticeExamPreview />}
          />
        </Route>


        {/* =====================================================
            EXAM PREVIEW
            ===================================================== */}

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


        {/* =====================================================
            STUDENT DASHBOARD
            ===================================================== */}

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


        {/* =====================================================
            FACULTY subjects
            ===================================================== */}

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


        {/* =====================================================
            FACULTY DASHBOARD
            ===================================================== */}

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


        {/* =====================================================
            PROGRAM CHAIR subjects
            ===================================================== */}

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


        {/* =====================================================
            PROGRAM CHAIR DASHBOARD
            ===================================================== */}

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


        {/* =====================================================
            ASSOCIATE DEAN subjects
            ===================================================== */}

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


        {/* =====================================================
            ASSOCIATE DEAN DASHBOARD
            ===================================================== */}

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


        {/* =====================================================
            DEAN subjects
            ===================================================== */}

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


        {/* =====================================================
            DEAN DASHBOARD
            ===================================================== */}

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


        {/* =====================================================
            SUBJECT OVERVIEW
            ===================================================== */}

        <Route
          path="/subject-overview/:subjectID"
          element={<ProtectedRoute element={<Layout />} />}
        >
          <Route
            index
            element={<SubjectOverview />}
          />
        </Route>


        {/* =====================================================
            QUIZ OVERVIEW
            ===================================================== */}

        <Route
          path="/quiz-overview"
          element={<ProtectedRoute element={<Layout />} />}
        >
          <Route
            index
            element={<QuizOverview />}
          />
        </Route>


        {/* =====================================================
            QUIZ CONTENT
            ===================================================== */}

        <Route
          path="/quiz-content"
          element={<ProtectedRoute element={<Layout />} />}
        >
          <Route
            index
            element={<QuizContent />}
          />
        </Route>


        {/* =====================================================
            QUIZ INFO
            ===================================================== */}

        <Route
          path="/quiz-info/:classPersonalQuizID"
          element={<ProtectedRoute element={<Layout />} />}
        >
          <Route
            index
            element={<QuizInfo />}
          />
        </Route>


        {/* =====================================================
            STUDENT QUIZ
            ===================================================== */}

        <Route
          path="/quiz/:classPersonalQuizID"
          element={<ProtectedRoute element={<Layout />} />}
        >
          <Route
            index
            element={<StudentQuiz />}
          />
        </Route>


        {/* =====================================================
            STUDENT QUIZ RESULTS
            ===================================================== */}

        <Route
          path="/quiz-result/:classPersonalQuizID"
          element={<ProtectedRoute element={<Layout />} />}
        >
          <Route
            index
            element={<StudentQuizResults />}
          />
        </Route>


        {/* =====================================================
            USERS
            ===================================================== */}

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


        {/* =====================================================
            IMPORT QUESTIONS
            ===================================================== */}

        <Route
          path="/import"
          element={<ProtectedRoute element={<Layout />} />}
        >
          <Route
            index
            element={<ImportQuestions />}
          />
        </Route>


      </Routes>
    </Router>
  );
}

export default App;









