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
      {/* ── FULL SCREEN BACKGROUND ONLY ───────────────────── */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-gradient-to-br from-orange-50 via-white to-orange-100">

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
      </div>

      {/* ── Welcome Hero ────────────────────────────────────── */}
      <div
        onMouseMove={handleMouseMove}
        className="outfit- 100 relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden text-center"
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
            className="pointer-events-none absolute h-4 w-4 rounded-full bg-orange-500/100 blur-md transition-transform duration-75 ease-out"
            style={{
              transform: `translate(${mousePos.x - 8}px, ${mousePos.y - 8}px)`,
            }}
          />
        </div>

        <div className="relative z-10 -mt-50 flex flex-col items-center gap-5 lg:mt-0">

          
         {/* Badge */}
         <span className="inline-flex items-center gap-2 rounded-full border border-orange-300/60 bg-orange-200/40 px-3 py-1 text-[11px] font-semibold tracking-widest text-amber-700 uppercase backdrop-blur-md">
         <span className="text-[15px] leading-none">✦</span>
          CAPS RVW • READY TO EXPLORE
         </span>

          {/* Heading */}
          <div className="flex flex-col items-center gap-2">
            <h1 className="outfit-700 text-[32px] leading-tight font-extrabold text-amber-900 md:text-[42px]">
              Good Day, Engr! 👋
            </h1>

            <h2 className="outfit-700 text-[32px] leading-tight font-extrabold text-amber-900 md:text-[28px]">
              Welcome Back.
            </h2>
          </div>

          {/* Description */}
          <p className="max-w-md text-[12px] leading-relaxed text-gray-650">
            Your academic workspace is ready.{" "}
            <strong className="text-amber-700">CAPS RVW</strong> brings your
            classes, assessments, sessions, and reports together in one place.
          </p>

          {/* Changelog button */}
          <button
            onClick={() => setShowChangelog(true)}
            className="outfit-600 mt-2 hidden cursor-pointer items-center gap-2 rounded-2xl bg-orange-500 px-6 py-3 text-[14px] font-bold text-white shadow-lg shadow-amber-200 transition hover:bg-amber-600 hover:shadow-orange-300 active:scale-95 lg:flex"
          >
            <i className="bx bx-news text-[17px]" />
            Get Started
            <i className="bx bx-right-arrow-alt text-[18px]" />
          </button>

          {/* Bottom guide text */}
         <p className="max-w-md text-[12px] leading-relaxed text-gray-400">
          Select a section from the sidebar to begin exploring{" "}
         <span className="font-semibold text-orange-400">CAPS RVW</span>.

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