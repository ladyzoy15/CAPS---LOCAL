import { useState, useEffect } from "react";
import ChangelogModal from "../components/ChangelogModal";

const CHANGELOG_KEY = "changelog_v2.0.0_seen";

const AdminDashboard = () => {
  const [showChangelog, setShowChangelog] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!localStorage.getItem(CHANGELOG_KEY)) {
      setShowChangelog(true);
      localStorage.setItem(CHANGELOG_KEY, "true");
    }
  }, []);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <>
      {/* ── Welcome Hero ────────────────────────────────────── */}
      <div
        onMouseMove={handleMouseMove}
        className="outfit-400 relative mt-8 flex min-h-[calc(100vh-44px)] flex-col items-center justify-center text-center lg:mt-0"
      >
        {/* Subtle background blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {/* Top-left */}
          <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-orange-200/50 blur-3xl" />
          {/* Top-right */}
          <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-orange-200/50 blur-3xl" />
          {/* Bottom-left */}
          <div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-orange-200/50 blur-3xl" />
          {/* Bottom-right */}
          <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-orange-200/50 blur-3xl" />
          {/* Middle */}
          <div className="absolute top-1/2 left-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-100/40 blur-3xl" />

          {/* Mouse-follow glow */}
          <div
            className="pointer-events-none absolute h-30 w-30 rounded-full bg-orange-400/50 blur-2xl transition-transform duration-150 ease-out"
            style={{
              transform: `translate(${mousePos.x - 100}px, ${mousePos.y - 100}px)`,
            }}
          />
        </div>

        <div className="relative z-10 -mt-50 flex flex-col items-center gap-5 lg:mt-0">
          {/* Badge */}
          <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-300/60 bg-orange-200/40 backdrop-blur-md px-3 py-1 text-[11px] font-semibold tracking-widest text-amber-700 uppercase">
            <i className="bx bx-rocket text-[13px]" />
            CAPS RVW is live
          </span>

          {/* Heading */}
          <div className="flex flex-col items-center gap-2">
            <h1 className="outfit-700 text-[32px] leading-tight font-extrabold text-amber-900 md:text-[42px]">
              Good Day, Engr!👋
            </h1>
            <h2 className="outfit-700 text-[32px] leading-tight font-extrabold text-amber-900 md:text-[28px]">
              Welcome Back.
            </h2>
          </div>

          <p className="max-w-md text-[15px] leading-relaxed text-gray-500">
            Explore everything new in{" "}
            <strong className="text-amber-700">CAPS RVW</strong> — quizzes,
            classes, reports, and more are now live.
          </p>

          {/* Changelog button */}
          <button
            onClick={() => setShowChangelog(true)}
            className="outfit-600 mt-2 hidden cursor-pointer items-center gap-2 rounded-2xl bg-orange-500 px-6 py-3 text-[14px] font-bold text-white shadow-lg shadow-amber-200 transition hover:bg-amber-600 hover:shadow-orange-300 active:scale-95 lg:flex"
          >
            <i className="bx bx-news text-[17px]" />
            See What&apos;s New
          </button>

          <p className="text-[12px] text-gray-400">
            Use the sidebar to navigate to subjects, Classes, Sessions, and
            more.
          </p>
        </div>
      </div>

      {showChangelog && (
        <ChangelogModal onClose={() => setShowChangelog(false)} />
      )}
    </>
  );
};

export default AdminDashboard;





