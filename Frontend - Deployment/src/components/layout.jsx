import { useEffect, useMemo, useState } from "react";
import Sidebar from "./sideBar";
import Header from "./header";
import { Outlet, useLocation } from "react-router-dom";

const Layout = () => {
  const [role_id, setRoleId] = useState(null);

  const [selectedSubject, setSelectedSubject] = useState(() => {
    try {
      const saved = localStorage.getItem("selectedSubject");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubjectExpanded, setIsSubjectExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(
    () => window.innerWidth < 1025
  );

  const location = useLocation();

  // =========================================================
  // DARK MODE
  // =========================================================
  const [isDarkMode, setIsDarkMode] = useState(() =>
    document.documentElement.classList.contains("dark")
  );

  useEffect(() => {
    const html = document.documentElement;

    const checkDarkMode = () => {
      const dark = html.classList.contains("dark");

      setIsDarkMode((prev) => {
        if (prev === dark) return prev;
        return dark;
      });
    };

    checkDarkMode();

    const observer = new MutationObserver(checkDarkMode);

    observer.observe(html, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  // =========================================================
  // LOAD USER ROLE
  // =========================================================
  useEffect(() => {
    try {
      const user = JSON.parse(sessionStorage.getItem("user"));

      if (
        user &&
        (user.roleID !== undefined || user.roleId !== undefined)
      ) {
        const role = user.roleID ?? user.roleId;

        setRoleId((prev) => {
          if (prev === role) return prev;
          return role;
        });
      }
    } catch (error) {
      console.error("Unable to load user:", error);
    }
  }, []);

  // =========================================================
  // RESPONSIVE
  // =========================================================
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1025;

      setIsMobile((prev) => {
        if (prev === mobile) return prev;
        return mobile;
      });
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // =========================================================
  // SAVE SELECTED SUBJECT
  // =========================================================
  useEffect(() => {
    if (selectedSubject) {
      localStorage.setItem(
        "selectedSubject",
        JSON.stringify(selectedSubject)
      );
    } else {
      localStorage.removeItem("selectedSubject");
    }
  }, [selectedSubject]);

  // =========================================================
  // ROLE
  // =========================================================
  const roleMap = {
    1: "Student",
    2: "Faculty",
    3: "Program Chair",
    4: "Dean",
    5: "Associate Dean",
  };

  const roleTitle =
    role_id !== null && roleMap[role_id]
      ? roleMap[role_id]
      : "User";

  // =========================================================
  // PAGE TYPES
  // =========================================================
  const isStudentQuizPage =
    /^\/quiz\/[^/]+$/.test(location.pathname);

  const isTutorialPage =
    location.pathname.includes("/help");

  const isPrintQualifyingExam =
    location.pathname === "/print-qualification-exam";

  const isPrintPersonalQuiz =
    location.pathname === "/print-personal-quiz";

  const isQuizPage =
    location.pathname.includes("/quiz-info/") ||
    location.pathname.includes("/quiz/") ||
    location.pathname.includes("/quiz-result/");

  const isPracticeExamPage =
    location.pathname.includes("/practice-exam") ||
    location.pathname.includes("/exam-preview");

  const isLibrariesPage =
    location.pathname === "/libraries" ||
    location.pathname === "/archived-quiz" ||
    location.pathname === "/dean/subjects" ||
    location.pathname === "/asso-dean/subjects" ||
    location.pathname === "/program-chair/subjects" ||
    location.pathname === "/faculty/subjects" ||
    location.pathname === "/student/subjects";

  const isDashboard =
    location.pathname === "/admin-dashboard" ||
    location.pathname === "/dean-dashboard" ||
    location.pathname === "/asso-dean-dashboard" ||
    location.pathname === "/program-chair-dashboard" ||
    location.pathname === "/faculty-dashboard" ||
    location.pathname === "/student-dashboard";

  // =========================================================
  // COLORS
  // =========================================================
  const backgroundColor = isDarkMode
    ? "#0b0f14"
    : "#fff8ef";

  const textColor = isDarkMode
    ? "#f3f4f6"
    : "#1f2937";

  // =========================================================
  // STABLE OUTLET CONTEXT
  // Prevent unnecessary child re-renders
  // =========================================================
  const outletContext = useMemo(
    () => ({
      selectedSubject,
      setSelectedSubject,
    }),
    [selectedSubject]
  );

  // =========================================================
  // RENDER
  // =========================================================
  return (
    <div
      className="REVA-layout min-h-screen w-full"
      style={{
        backgroundColor,
        color: textColor,
        transition:
          "background-color 0.3s ease, color 0.3s ease",
      }}
    >
      <div
        className="flex min-h-screen w-full"
        style={{
          backgroundColor,
        }}
      >
        {/* =====================================================
            SIDEBAR
        ===================================================== */}
        {!isTutorialPage &&
          !isPrintQualifyingExam &&
          !isPrintPersonalQuiz &&
          !isQuizPage &&
          !isPracticeExamPage && (
            <Sidebar
              role_id={role_id}
              setSelectedSubject={setSelectedSubject}
              selectedSubject={selectedSubject}
              isExpanded={isExpanded}
              setIsExpanded={setIsExpanded}
              isSubjectExpanded={isSubjectExpanded}
              setIsSubjectExpanded={setIsSubjectExpanded}
            />
          )}

        {/* =====================================================
            MAIN CONTENT
        ===================================================== */}
        <div
          className={`flex min-h-screen flex-1 flex-col ${
            isTutorialPage ||
            isPrintQualifyingExam ||
            isPrintPersonalQuiz ||
            isQuizPage ||
            isPracticeExamPage ||
            isMobile
              ? "ml-0"
              : isLibrariesPage
                ? "ml-[63px]"
                : "ml-[220px]"
          }`}
          style={{
            backgroundColor,
            color: textColor,
            transition:
              "background-color 0.3s ease, color 0.3s ease",
          }}
        >
          {/* HEADER */}
          {!isStudentQuizPage && (
            <Header
              title={roleTitle}
              className="lg:hidden"
            />
          )}

          {/* MAIN */}
          <main
            className={`REVA-main ${
              isTutorialPage ||
              isQuizPage ||
              isPracticeExamPage ||
              isDashboard
                ? ""
                : "lg:px-4"
            } min-h-screen h-full w-full`}
            style={{
              backgroundColor,
              color: textColor,
              transition:
                "background-color 0.3s ease, color 0.3s ease",
            }}
          >
            <Outlet context={outletContext} />
          </main>
        </div>
      </div>
    </div>
  );
};

export default Layout;




