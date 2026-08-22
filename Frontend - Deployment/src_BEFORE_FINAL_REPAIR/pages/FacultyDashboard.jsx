import { useState, useEffect } from "react";
import ChangelogModal from "../components/ChangelogModal";

const CHANGELOG_KEY = "changelog_v2.0.0_seen";

export default function FacultyDashboard() {
  const [showChangelog, setShowChangelog] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  /* =========================================================
     DETECT DARK MODE
  ========================================================= */
  useEffect(() => {
    const checkDarkMode = () => {
      const dark =
        document.documentElement.classList.contains("dark") ||
        document.body.classList.contains("dark");

      setIsDarkMode(dark);
    };

    checkDarkMode();

    const observer = new MutationObserver(() => {
      checkDarkMode();
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  /* =========================================================
     CHANGELOG
  ========================================================= */
  useEffect(() => {
    if (!localStorage.getItem(CHANGELOG_KEY)) {
      setShowChangelog(true);
      localStorage.setItem(CHANGELOG_KEY, "true");
    }
  }, []);

  return (
    <>
      {/* =====================================================
          FACULTY HOME
      ====================================================== */}
      <div
        className="faculty-dashboard-home relative flex min-h-[calc(100vh-44px)] flex-col items-center justify-center overflow-hidden px-6 text-center"
        style={{
          backgroundColor: isDarkMode ? "#0b0f14" : "#ffffff",
          color: isDarkMode ? "#ffffff" : "#111827",
        }}
      >
        {/* LIGHT MODE DECORATIONS ONLY */}
        {!isDarkMode && (
          <div
            className="pointer-events-none absolute inset-0 overflow-hidden"
            aria-hidden="true"
          >
            <div
              className="
                absolute
                -top-24
                -left-24
                h-80
                w-80
                rounded-full
                bg-orange-100/40
                blur-3xl
              "
            />

            <div
              className="
                absolute
                -right-24
                -bottom-24
                h-80
                w-80
                rounded-full
                bg-sky-100/40
                blur-3xl
              "
            />
          </div>
        )}

        {/* ===================================================
            MAIN CONTENT
        ==================================================== */}
        <div
          className="
            relative
            z-10
            flex
            max-w-3xl
            flex-col
            items-center
          "
        >
          {/* =================================================
              COLLEGE NAME
          ================================================== */}
          <div className="mb-3 flex flex-col items-center">
            <span
              className="
                outfit-600
                text-[11px]
                font-semibold
                tracking-[0.18em]
                uppercase
                md:text-[12px]
              "
              style={{
                color: isDarkMode ? "#fb923c" : "#f97316",
              }}
            >
              COLLEGE OF ENGINEERING
            </span>

            {/* Accent Line */}
            <div
              className="mt-1 h-[2px] w-10 rounded-full"
              style={{
                backgroundColor: "#f97316",
              }}
            />
          </div>

          {/* =================================================
              GREETING
          ================================================== */}
          <h1
            className="
              outfit-700
              text-[34px]
              leading-[1.1]
              font-bold
              tracking-[-0.03em]
              md:text-[44px]
              lg:text-[50px]
            "
            style={{
              color: isDarkMode ? "#ffffff" : "#111827",
            }}
          >
            Good Day, Engr!{" "}
            <span className="inline-block">👋</span>
          </h1>

          {/* =================================================
              WELCOME TEXT
          ================================================== */}
          <p
            className="
              outfit-400
              mt-2
              text-[15px]
              leading-relaxed
              font-medium
              md:text-[17px]
            "
            style={{
              color: isDarkMode ? "#cbd5e1" : "#6b7280",
            }}
          >
            Welcome back to{" "}
            <strong
              className="outfit-600 font-semibold"
              style={{
                color: isDarkMode ? "#ffffff" : "#374151",
              }}
            >
              REVA.
            </strong>
          </p>

          {/* =================================================
              QUOTE
          ================================================== */}
          <div
            className="
              mt-5
              w-full
              max-w-xl
              rounded-2xl
              border
              px-5
              py-4
              md:px-8
              md:py-5
            "
            style={{
              borderColor: isDarkMode ? "#27313d" : "#e5e7eb",
              backgroundColor: isDarkMode
                ? "rgba(11,15,20,0.45)"
                : "rgba(255,255,255,0.6)",
            }}
          >
            {/* Quote mark */}
            <div
              className="mb-2 text-[26px] leading-none"
              style={{
                color: "#f97316",
              }}
            >
              “
            </div>

            <p
              className="
                outfit-400
                text-[15px]
                leading-7
                font-medium
                md:text-[17px]
                md:leading-8
              "
              style={{
                color: isDarkMode ? "#ffffff" : "#374151",
              }}
            >
              Teach with purpose, lead with passion,
              <br />
              and inspire with heart.
            </p>

            {/* Accent */}
            <div className="mt-4 flex items-center justify-center gap-3">
              <div
                className="h-px w-24"
                style={{
                  backgroundColor: isDarkMode ? "#475569" : "#d1d5db",
                }}
              />

              <span
                className="text-[14px]"
                style={{
                  color: "#f97316",
                }}
              >
                ✦
              </span>

              <div
                className="h-px w-24"
                style={{
                  backgroundColor: isDarkMode ? "#475569" : "#d1d5db",
                }}
              />
            </div>
          </div>

          {/* =================================================
              SEE WHAT'S MORE BUTTON
          ================================================== */}
          <button
            onClick={() => setShowChangelog(true)}
            className="
              outfit-600
              mt-5
              flex
              cursor-pointer
              items-center
              gap-3
              rounded-xl
              px-5
              py-2.5
              text-[13px]
              font-semibold
              text-white
              transition-all
              duration-200
              hover:-translate-y-0.5
              hover:bg-orange-600
              active:translate-y-0
              active:scale-95
            "
            style={{
              backgroundColor: "#f97316",
              boxShadow: isDarkMode
                ? "0 8px 20px rgba(249,115,22,0.22)"
                : "0 8px 20px rgba(249,115,22,0.18)",
            }}
          >
            <span className="text-[15px]">✧</span>
            See What's More
            <span className="text-[16px]">→</span>
          </button>

          {/* =================================================
              BOTTOM MESSAGE
          ================================================== */}
          <div className="mt-4 flex flex-col items-center">
            <div className="flex items-center gap-3">
              <div
                className="h-px w-24"
                style={{
                  backgroundColor: isDarkMode ? "#7c4a28" : "#fed7aa",
                }}
              />

              <span
                className="text-[13px]"
                style={{
                  color: "#f97316",
                }}
              >
                ◆
              </span>

              <div
                className="h-px w-24"
                style={{
                  backgroundColor: isDarkMode ? "#7c4a28" : "#fed7aa",
                }}
              />
            </div>

            <p
              className="
                outfit-400
                mt-3
                text-[14px]
                italic
                font-medium
                md:text-[16px]
              "
              style={{
                color: isDarkMode ? "#94a3b8" : "#6b7280",
              }}
            >
              Have a productive and meaningful day!
            </p>

            <span
              className="mt-1 text-[20px]"
              style={{
                color: "#f97316",
              }}
            >
              ♡
            </span>
          </div>
        </div>
      </div>

      {/* =====================================================
          CHANGELOG MODAL
      ====================================================== */}
      {showChangelog && (
        <ChangelogModal
          onClose={() => setShowChangelog(false)}
        />
      )}
    </>
  );
}


