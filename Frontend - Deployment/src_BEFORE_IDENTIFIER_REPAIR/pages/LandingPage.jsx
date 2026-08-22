import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import collegeLogo from "/src/assets/college-logo.png";
import CogIcon from "/src/assets/landing/cog.svg";
import ExportIcon from "/src/assets/landing/export.svg";
import APlusIcon from "/src/assets/landing/a+.svg";
import RightDisplay from "/src/assets/landing/rtp.png";
import GetStarted from "/src/assets/landing/getstarted.png";

import LoginModal from "../components/LoginModal";
import RegisterModal from "../components/RegisterModal";
import ForgotPasswordModal from "../components/ForgotPasswordModal";
import ResetPasswordModal from "../components/ResetPasswordModal";
import ForgotUserCodeModal from "../components/ForgotUserCodeModal";
import ResetUserCodeModal from "../components/ResetUserCodeModal";
import AppVersion from "../components/appVersion";
import LoadingOverlay from "../components/loadingOverlay";

import {
  clearDeferredInstallPrompt,
  getDeferredInstallPrompt,
} from "../pwaDeferredInstall.js";

import {
  getDashboardPathForRole,
  getToken,
  getUser,
  syncPersistedSession,
} from "../utils/authStorage";

const getInitialAutoLoginState = () => {
  const params = new URLSearchParams(window.location.search);

  if (params.get("token")) return false;

  syncPersistedSession();

  const token = getToken();
  const user = getUser();

  if (!token || !user) return false;

  return !!getDashboardPathForRole(user.roleID);
};

function LandingPage() {
  const navigate = useNavigate();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [isForgotUserCodeOpen, setIsForgotUserCodeOpen] = useState(false);

  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return !!params.get("token") && params.get("reset") !== "user-code";
  });

  const [isResetUserCodeOpen, setIsResetUserCodeOpen] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return !!params.get("token") && params.get("reset") === "user-code";
  });

  const [secureContext, setSecureContext] = useState(
    () => typeof window !== "undefined" && window.isSecureContext,
  );

  const [showInstallButton, setShowInstallButton] = useState(false);

  const [hasDeferredPrompt, setHasDeferredPrompt] = useState(() =>
    typeof window !== "undefined" ? !!getDeferredInstallPrompt() : false,
  );

  const [isAutoLoggingIn, setIsAutoLoggingIn] = useState(
    getInitialAutoLoginState,
  );

  useEffect(() => {
    setSecureContext(window.isSecureContext);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get("token")) {
      setIsAutoLoggingIn(false);
      return;
    }

    syncPersistedSession();

    const token = getToken();
    const user = getUser();

    if (!token || !user) {
      setIsAutoLoggingIn(false);
      return;
    }

    const dashboardPath = getDashboardPathForRole(user.roleID);

    if (dashboardPath) {
      setIsAutoLoggingIn(true);
      navigate(dashboardPath, { replace: true });
    } else {
      setIsAutoLoggingIn(false);
    }
  }, [navigate]);

  useEffect(() => {
    const updateVisibility = () => {
      const standalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        window.navigator.standalone === true;

      setShowInstallButton(window.isSecureContext && !standalone);
    };

    updateVisibility();

    const mq = window.matchMedia("(display-mode: standalone)");

    mq.addEventListener("change", updateVisibility);

    return () => mq.removeEventListener("change", updateVisibility);
  }, []);

  useEffect(() => {
    const sync = () =>
      setHasDeferredPrompt(!!getDeferredInstallPrompt());

    window.addEventListener("pwa-deferred-ready", sync);

    sync();

    return () =>
      window.removeEventListener("pwa-deferred-ready", sync);
  }, []);

  const handleInstallApp = async () => {
    let prompt = getDeferredInstallPrompt();

    if (!prompt && "serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();

      const reloaded = sessionStorage.getItem("pwa-install-reloaded");

      if (reg && !navigator.serviceWorker.controller && !reloaded) {
        sessionStorage.setItem("pwa-install-reloaded", "1");
        window.location.reload();
        return;
      }

      prompt = getDeferredInstallPrompt();
    }

    if (prompt) {
      try {
        await prompt.prompt();
        await prompt.userChoice;
      } finally {
        clearDeferredInstallPrompt();
        setHasDeferredPrompt(false);
      }

      return;
    }

    window.alert(
      "Chrome hasn't fired the install prompt yet.\n\n" +
        "Try: ? menu ? Save and share ? Install REVA JRMSU (or Install page).\n\n" +
        "If that's missing: DevTools ? Application ? Manifest (fix any errors), " +
        "then hard refresh (Ctrl+Shift+R). Use Chrome or Edge on HTTPS.",
    );
  };

  return (
    <>
      {/* =========================================================
          MAIN PAGE
      ========================================================= */}

      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-orange-50 via-white to-orange-100 pt-8">

        {/* =======================================================
            AMBIENT BACKGROUND - ORANGE & WHITE GLOWS
        ======================================================= */}

        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">

          <div className="absolute -left-32 -top-32 h-[420px] w-[420px] rounded-full bg-orange-300/40 blur-[130px]" />

          <div className="absolute -right-40 top-[15%] h-[500px] w-[500px] rounded-full bg-white/60 blur-[140px]" />

          <div className="absolute -bottom-32 -left-20 h-[460px] w-[460px] rounded-full bg-orange-400/35 blur-[140px]" />

          <div className="absolute bottom-[8%] right-[15%] h-[360px] w-[360px] rounded-full bg-orange-200/40 blur-[130px]" />

          <div className="absolute left-[40%] top-[35%] h-[280px] w-[280px] rounded-full bg-white/70 blur-[100px]" />

          <div className="absolute left-[5%] top-[48%] h-[220px] w-[220px] rounded-full bg-orange-200/50 blur-[100px]" />

        </div>

        {/* =======================================================
            TOP NAVIGATION
        ======================================================= */}

        <div
          className="
            absolute left-4 top-4 z-50
            flex items-center gap-2
            rounded-full
            border border-orange-200/50
            bg-white/80
            px-4 py-2
            shadow-[0_8px_30px_rgba(0,0,0,0.08)]
            backdrop-blur-2xl
            md:left-8 md:top-5
            2xl:left-16
          "
        >

          <div className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-orange-300/50 to-transparent" />

          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-orange-200/50 bg-white/70 backdrop-blur-md">

            <img
              src={collegeLogo}
              alt="REVA logo"
              decoding="async"
              fetchPriority="low"
              className="h-6 w-6 object-contain"
            />

          </div>

          <span className="outfit-500 text-[20px] tracking-wide text-gray-900 md:text-[24px]">
            REVA
          </span>

        </div>

        {/* MOBILE MENU */}

        <button
          onClick={() => setIsSidebarOpen(true)}
          className="
            hidden
            rounded-full
            border border-orange-200/50
            bg-white/70
            p-3
            shadow-[0_8px_30px_rgba(0,0,0,0.08)]
            backdrop-blur-2xl
            md:hidden
          "
          aria-label="Open menu"
        >
          <span className="h-0.5 w-6 bg-gray-800/80" />
          <span className="h-0.5 w-6 bg-gray-800/80" />
          <span className="h-0.5 w-6 bg-gray-800/80" />
        </button>

        {/* DESKTOP NAVIGATION */}

        <div
          className="
            outfit-500
            absolute right-4 top-4 z-50
            flex items-center
            rounded-full
            border border-orange-200/50
            bg-white/80
            px-6 py-3
            text-[13px] text-gray-700
            shadow-[0_8px_30px_rgba(0,0,0,0.08)]
            backdrop-blur-2xl
            md:right-8 md:top-5 md:text-[14px]
            lg:text-[15px]
            2xl:right-16
          "
        >

          <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-orange-300/50 to-transparent" />

          <span className="relative z-10 whitespace-nowrap">
            JOSE RIZAL MEMORIAL STATE UNIVERSITY
          </span>

        </div>

        {/* =======================================================
            HERO
        ======================================================= */}

        <div className="relative isolate w-full max-w-[1450px] px-2 md:px-4">

          <div
            className="
              relative overflow-visible
              rounded-[40px] md:rounded-[50px]
              border border-orange-200/50
              bg-white/70
              shadow-[0_20px_70px_rgba(0,0,0,0.08)]
              backdrop-blur-2xl
            "
          >

            <div className="pointer-events-none absolute inset-x-16 top-0 z-20 h-px bg-gradient-to-r from-transparent via-orange-300/50 to-transparent" />

            <div className="pointer-events-none absolute left-1/2 top-[-100px] h-[220px] w-[420px] -translate-x-1/2 rounded-full bg-orange-200/30 blur-[80px]" />

            <div className="pointer-events-none absolute -bottom-[30%] -left-[5%] h-[380px] w-[430px] rounded-full bg-orange-300/20 blur-[150px]" />

            <div className="pointer-events-none absolute -bottom-[20%] right-[-5%] h-[320px] w-[370px] rounded-full bg-orange-400/15 blur-[140px]" />

            <div className="pointer-events-none absolute left-[32%] top-[-25%] h-[260px] w-[300px] rounded-full bg-orange-200/20 blur-[120px]" />

            <div className="outfit finisher-header relative z-10 overflow-hidden rounded-[40px] text-white md:rounded-[50px]">

              <header
                className="
                  relative z-10 mx-auto
                  min-h-[760px] w-full
                  px-5 pb-32 pt-24
                  md:min-h-[900px] md:px-10 md:pb-36 md:pt-24
                  lg:min-h-[900px] lg:px-16
                  xl:min-h-[920px] xl:px-20
                "
              >

                {/* =====================================================
                    HERO CONTENT — REFERENCE DESIGN
                ====================================================== */}

                <div className="relative mx-auto min-h-[790px] max-w-[1280px] text-center md:min-h-[820px]">

                  {/* Large decorative orbit */}
                  <div className="pointer-events-none absolute left-1/2 top-[-210px] h-[760px] w-[760px] -translate-x-1/2 rounded-full border border-orange-300/70" />
                  <div className="pointer-events-none absolute left-1/2 top-[-175px] h-[690px] w-[690px] -translate-x-1/2 rounded-full border border-orange-200/70" />
                  <div className="pointer-events-none absolute left-1/2 top-[-125px] h-[590px] w-[590px] -translate-x-1/2 rounded-full border border-orange-200/60 border-dashed" />

                  <span className="pointer-events-none absolute left-[6%] top-[30%] h-3 w-3 rounded-full bg-slate-900" />
                  <span className="pointer-events-none absolute right-[8%] top-[28%] h-3 w-3 rounded-full border-2 border-slate-900 bg-white" />
                  <span className="pointer-events-none absolute right-[20%] top-[10%] h-2.5 w-2.5 rounded-full bg-orange-600" />
                  <span className="pointer-events-none absolute left-[18%] top-[12%] h-6 w-6 rounded-full border-2 border-orange-600 bg-white" />

                  {/* REVA Logo */}
                  <div className="relative z-20 mx-auto flex h-20 w-20 items-center justify-center pt-4 md:h-24 md:w-24">
                    <img
                      src={collegeLogo}
                      alt="REVA"
                      className="h-16 w-16 object-contain md:h-20 md:w-20"
                    />
                  </div>

                  {/* College label */}
                  <div className="relative z-20 mx-auto mt-3 flex max-w-[620px] items-center justify-center gap-3">
                    <div className="h-[2px] flex-1 bg-orange-300/80" />
                    <span className="outfit-600 whitespace-nowrap text-[16px] font-semibold uppercase tracking-[2.6px] text-slate-800 md:text-[19px]">
                      COLLEGE OF <span className="text-orange-600">ENGINEERING</span>
                    </span>
                    <div className="h-[2px] flex-1 bg-orange-300/80" />
                  </div>

                  {/* Main heading with SLIDE ANIMATION - FIXED */}
                  <div className="relative z-30 mx-auto mt-10 max-w-[980px] px-3 md:mt-11">
                    <h1 className="outfit-700 text-[45px] font-extrabold leading-[0.94] tracking-[-2px] text-slate-900 sm:text-[56px] md:text-[72px] lg:text-[52px] xl:text-[70px] slide-in-left">
                      CREATE, PRACTICE
                      <br />
                      &amp; REVIEW
                      <br />
                      <span className="text-orange-600">FOR EXAMS</span>
                    </h1>
                  </div>

                  {/* Custom CSS for slide animation - FIXED */}
                  <style>{`
                    @keyframes slideInLeft {
                      0% {
                        transform: translateX(-100%);
                        opacity: 0;
                      }
                      100% {
                        transform: translateX(0);
                        opacity: 1;
                      }
                    }
                    .slide-in-left {
                      animation: slideInLeft 0.8s ease-out forwards;
                    }
                  `}</style>

                  <div className="relative z-30 mx-auto mt-8 h-[4px] w-20 rounded-full bg-orange-500" />

                  <p className="outfit-400 relative z-30 mx-auto mt-7 max-w-[650px] px-4 text-[16px] leading-7 text-slate-700 md:text-[18px]">
                    A smart review platform that helps students
                    <br className="hidden sm:block" />
                    practice, review lessons, and prepare with confidence.
                  </p>

                  {/* =====================================================
                      LOGIN / SIGN UP - WITH BOUNCE ANIMATION
                  ====================================================== */}
                  <div className="relative z-50 mt-8 flex items-center justify-center gap-5 md:mt-7">
                    <button
                      onClick={() => setIsLoginOpen(true)}
                      className="
                        animate-bounce
                        inline-flex cursor-pointer items-center justify-center gap-3 
                        rounded-full border-2 border-black bg-orange-500 
                        px-9 py-4 text-[15px] font-semibold text-white 
                        shadow-[0_6px_0_rgba(0,0,0,.22),0_10px_24px_rgba(0,0,0,.12)] 
                        transition-all duration-300 
                        hover:-translate-y-0.5 hover:bg-orange-600 
                        hover:shadow-[0_7px_0_rgba(0,0,0,.24),0_12px_26px_rgba(0,0,0,.14)] 
                        active:translate-y-0 active:scale-95 
                        active:shadow-[0_2px_0_rgba(0,0,0,.2)]
                      "
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m10 17 5-5-5-5" />
                        <path d="M15 12H3" />
                        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                      </svg>
                      LOG IN
                    </button>

                    <button
                      onClick={() => setIsRegisterOpen(true)}
                      className="
                        animate-bounce
                        inline-flex cursor-pointer items-center justify-center gap-3 
                        rounded-full border-2 border-black bg-amber3r2/90 
                        px-9 py-4 text-[15px] font-semibold text-slate-800 
                        shadow-[0_6px_0_rgba(0,0,0,.22),0_10px_24px_rgba(0,0,0,.12)] 
                        transition-all duration-300 
                        hover:-translate-y-0.5 hover:bg-white  
                        hover:shadow-[0_7px_0_rgba(0,0,0,.24),0_12px_26px_rgba(0,0,0,.14)] 
                        active:translate-y-0 active:scale-95 
                        active:shadow-[0_2px_0_rgba(0,0,0,.2)]
                      "
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="8" r="5" />
                        <path d="M20 21a8 8 0 0 0-16 0" />
                      </svg>
                      SIGN UP
                    </button>
                  </div>

                  {/* Engineering disciplines — 4 display-only cards with BROWN BORDERS */}
                  <div className="relative z-40 mx-auto mt-10 grid max-w-[1160px] grid-cols-2 gap-4 px-4 md:mt-12 md:grid-cols-4 md:gap-5 md:px-0">

                    {/* CIVIL - Brown Border */}
                    <div className="flex min-h-[205px] flex-col items-center justify-center rounded-[24px] border-2 border-amber-800/80 bg-white/90 px-4 py-6 shadow-[0_10px_30px_rgba(0,0,0,.06)] backdrop-blur-xl md:min-h-[220px]">
                      <div className="mb-5 flex h-14 w-14 items-center justify-center text-amber-800 md:h-16 md:w-16">
                        <svg viewBox="0 0 48 48" className="h-full w-full" fill="none">
                          <circle cx="24" cy="24" r="16" stroke="currentColor" strokeWidth="3" />
                          <circle cx="24" cy="24" r="8" stroke="currentColor" strokeWidth="3" />
                          <path d="M24 5V10M24 38V43M5 24H10M38 24H43M10.5 10.5L14 14M34 34L37.5 37.5M37.5 10.5L34 14M14 34L10.5 37.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                        </svg>
                      </div>
                      <h3 className="outfit-700 text-center text-[14px] font-bold leading-5 text-slate-900 md:text-[16px]">CIVIL<br />ENGINEERING</h3>
                      <p className="outfit-400 mt-3 text-center text-[12px] leading-5 text-slate-700 md:text-[13px]">Build and shape<br />the future.</p>
                    </div>

                    {/* COMPUTER - Brown Border */}
                    <div className="flex min-h-[205px] flex-col items-center justify-center rounded-[24px] border-2 border-amber-800/80 bg-white/90 px-4 py-6 shadow-[0_10px_30px_rgba(0,0,0,.06)] backdrop-blur-xl md:min-h-[220px]">
                      <div className="mb-5 flex h-14 w-14 items-center justify-center text-amber-800 md:h-16 md:w-16">
                        <svg viewBox="0 0 48 48" className="h-full w-full" fill="none">
                          <rect x="6" y="9" width="36" height="25" rx="2" stroke="currentColor" strokeWidth="3" />
                          <path d="M17 40H31M24 34V40" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                        </svg>
                      </div>
                      <h3 className="outfit-700 text-center text-[14px] font-bold leading-5 text-slate-900 md:text-[16px]">COMPUTER<br />ENGINEERING</h3>
                      <p className="outfit-400 mt-3 text-center text-[12px] leading-5 text-slate-700 md:text-[13px]">Design. Code.<br />Innovate.</p>
                    </div>

                    {/* ELECTRICAL - Brown Border */}
                    <div className="flex min-h-[205px] flex-col items-center justify-center rounded-[24px] border-2 border-amber-800/80 bg-white/90 px-4 py-6 shadow-[0_10px_30px_rgba(0,0,0,.06)] backdrop-blur-xl md:min-h-[220px]">
                      <div className="mb-5 flex h-14 w-14 items-center justify-center text-amber-800 md:h-16 md:w-16">
                        <svg viewBox="0 0 48 48" className="h-full w-full" fill="none">
                          <rect x="14" y="14" width="20" height="20" rx="2" stroke="currentColor" strokeWidth="3" />
                          <rect x="20" y="20" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="3" />
                          <path d="M18 8V14M24 8V14M30 8V14M18 34V40M24 34V40M30 34V40M8 18H14M8 24H14M8 30H14M34 18H40M34 24H40M34 30H40" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                        </svg>
                      </div>
                      <h3 className="outfit-700 text-center text-[14px] font-bold leading-5 text-slate-900 md:text-[16px]">ELECTRICAL<br />ENGINEERING</h3>
                      <p className="outfit-400 mt-3 text-center text-[12px] leading-5 text-slate-700 md:text-[13px]">Powering systems.<br />Powering progress.</p>
                    </div>

                    {/* ELECTRONICS - Brown Border */}
                    <div className="flex min-h-[205px] flex-col items-center justify-center rounded-[24px] border-2 border-amber-800/80 bg-white/90 px-4 py-6 shadow-[0_10px_30px_rgba(0,0,0,.06)] backdrop-blur-xl md:min-h-[220px]">
                      <div className="mb-5 flex h-14 w-14 items-center justify-center text-amber-800 md:h-16 md:w-16">
                        <svg viewBox="0 0 48 48" className="h-full w-full" fill="none">
                          <rect x="13" y="13" width="22" height="22" rx="3" stroke="currentColor" strokeWidth="3" />
                          <rect x="19" y="19" width="10" height="10" rx="1" stroke="currentColor" strokeWidth="3" />
                          <path d="M18 7V13M24 7V13M30 7V13M18 35V41M24 35V41M30 35V41M7 18H13M7 24H13M7 30H13M35 18H41M35 24H41M35 30H41" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                        </svg>
                      </div>
                      <h3 className="outfit-700 text-center text-[14px] font-bold leading-5 text-slate-900 md:text-[16px]">ELECTRONICS<br />ENGINEERING</h3>
                      <p className="outfit-400 mt-3 text-center text-[12px] leading-5 text-slate-700 md:text-[13px]">Smart solutions.<br />Connected world.</p>
                    </div>

                  </div>

                  {/* Bottom engineering illustration band */}
                  <div className="pointer-events-none absolute -bottom-[115px] left-1/2 z-10 h-[230px] w-[1150px] -translate-x-1/2 opacity-95">
                    {/* Building */}
                    <svg className="absolute bottom-0 left-[-20px] h-[220px] w-[260px]" viewBox="0 0 260 250" fill="none">
                      <defs>
                        <linearGradient id="refBuilding" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#fcd34d" />
                          <stop offset="50%" stopColor="#f59e0b" />
                          <stop offset="100%" stopColor="#d97706" />
                        </linearGradient>
                      </defs>
                      <path d="M35 75L145 48V240H35Z" fill="url(#refBuilding)" />
                      <path d="M145 48L215 76V240H145Z" fill="#f59e0b" />
                      <path d="M35 75L112 38L215 76L145 48Z" fill="#fbbf24" />
                      <g fill="#fde68a" opacity=".8">
                        <rect x="52" y="92" width="25" height="34" rx="2" /><rect x="87" y="84" width="25" height="34" rx="2" /><rect x="122" y="76" width="18" height="34" rx="2" />
                        <rect x="52" y="140" width="25" height="34" rx="2" /><rect x="87" y="132" width="25" height="34" rx="2" /><rect x="122" y="124" width="18" height="34" rx="2" />
                      </g>
                    </svg>

                    {/* Circuit board */}
                    <div className="absolute bottom-[-30px] left-1/2 h-[190px] w-[390px] -translate-x-1/2 rotate-[-7deg] rounded-[24px] bg-gradient-to-br from-orange-500 to-orange-600 shadow-[0_20px_45px_rgba(0,0,0,.18)]">
                      <div className="absolute left-10 top-12 h-3 w-3 rounded-full bg-orange-200" />
                      <div className="absolute left-14 top-[55px] h-[2px] w-28 bg-orange-200/80" />
                      <div className="absolute right-10 top-12 h-3 w-3 rounded-full bg-orange-200" />
                      <div className="absolute right-14 top-[55px] h-[2px] w-28 bg-orange-200/80" />
                      <div className="absolute left-1/2 top-[52px] h-28 w-36 -translate-x-1/2 rounded-xl bg-slate-950 shadow-[inset_0_0_0_6px_rgba(255,255,255,.08)]" />
                      <div className="absolute left-[35px] top-[88px] h-[2px] w-20 bg-orange-200/80" />
                      <div className="absolute right-[35px] top-[88px] h-[2px] w-20 bg-orange-200/80" />
                    </div>

                    {/* Transformer */}
                    <svg className="absolute bottom-[-8px] right-[70px] h-[190px] w-[220px]" viewBox="0 0 220 190" fill="none">
                      <defs>
                        <linearGradient id="refTransformer" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#fde68a" /><stop offset="55%" stopColor="#facc15" /><stop offset="100%" stopColor="#ca8a04" />
                        </linearGradient>
                      </defs>
                      <path d="M35 40L175 55V180H35Z" fill="url(#refTransformer)" />
                      <path d="M175 55L205 70V180H175Z" fill="#ca8a04" />
                      <g fill="#fef3c7"><rect x="50" y="20" width="12" height="28" rx="3" /><rect x="95" y="15" width="12" height="32" rx="3" /><rect x="140" y="20" width="12" height="28" rx="3" /></g>
                      <g stroke="#a16207" strokeWidth="3"><path d="M65 50V180M105 48V180M145 50V180" /></g>
                      <circle cx="105" cy="100" r="26" fill="#fef08a" opacity=".7" />
                    </svg>

                    {/* Transmission tower */}
                    <svg className="absolute bottom-[-5px] right-[-40px] h-[310px] w-[180px]" viewBox="0 0 190 370" fill="none">
                      <path d="M90 10L145 350H45Z" fill="#f59e0b" fillOpacity=".08" stroke="#f59e0b" strokeWidth="5" />
                      <g stroke="#f59e0b" strokeWidth="2"><path d="M90 10L45 350M90 10L145 350" /><path d="M78 70H102M70 125H111M61 180H120M52 240H130M45 300H139" /><path d="M78 70L111 125M102 70L70 125M70 125L120 180M111 125L61 180M61 180L130 240M120 180L52 240M52 240L139 300M130 240L45 300" /></g>
                      <g stroke="#f59e0b" strokeWidth="6" strokeLinecap="round"><path d="M20 75H165M5 130H180M0 185H190" /></g>
                      <g fill="#fef3c7"><circle cx="25" cy="75" r="5" /><circle cx="155" cy="75" r="5" /><circle cx="10" cy="130" r="5" /><circle cx="170" cy="130" r="5" /></g>
                    </svg>
                  </div>

                </div>

              </header>

            </div>

          </div>

        </div>

        {/* =======================================================
            COMPREHENSIVE SYSTEM
        ======================================================= */}

        <div
          className="
            relative z-[101]
            mx-4 mt-8
            w-full max-w-[1450px]
            overflow-hidden
            rounded-[40px]
            border border-orange-200/50
            bg-white/70
            px-6 py-12
            shadow-[0_15px_50px_rgba(0,0,0,0.08)]
            backdrop-blur-2xl
            md:mx-8 md:px-12
            lg:max-w-[1650px]
            lg:px-16
            xl:max-w-[1550px]
            xl:px-30
          "
        >

          <div className="pointer-events-none absolute inset-x-20 top-0 h-px bg-gradient-to-r from-transparent via-orange-300/50 to-transparent" />

          <div className="pointer-events-none absolute -right-32 -top-32 h-[280px] w-[280px] rounded-full bg-orange-300/20 blur-[100px]" />

          <div className="relative z-10 flex flex-col gap-6 text-center md:flex-row md:items-center md:justify-between md:text-left">

            <div className="flex-1">

              <h2 className="outfit-500 text-[24px] font-semibold leading-tight text-gray-900 md:text-[25px] lg:text-[33px] xl:text-[45px]">

                <span className="text-gray-800">
                  Review Evaluation
                </span>

                <br />

                <span className="bg-gradient-to-r from-orange-500 via-orange-400 to-orange-600 bg-clip-text text-transparent">
                  &amp; and Validation Assessment
                </span>

              </h2>

            </div>

            <div className="flex-1 xl:max-w-md">

              <p className="outfit-400 mx-auto max-w-sm text-[14px] text-gray-700 md:mx-0 md:max-w-none lg:text-[16px] xl:text-[18px]">

                A web-based review and assessment platform designed
                to help JRMSU students practice, review, and prepare for exams.

              </p>

            </div>

          </div>

          <div className="relative z-10 mt-10 h-px w-full bg-gradient-to-r from-transparent via-orange-300/50 to-transparent" />

          <div className="relative z-10 mt-12 text-center">

            <div className="mb-4">

              <span
                className="
                  outfit-500
                  rounded-full
                  border border-orange-300/30
                  bg-orange-100
                  px-4 py-1.5
                  text-orange-700
                  shadow-[0_4px_20px_rgba(251,146,60,0.08)]
                  backdrop-blur-md
                  md:text-[18px]
                  lg:text-lg
                "
              >
                [ REVA FEATURES ]
              </span>

            </div>

            <h3 className="outfit-700 mt-8 text-gray-900 md:mt-12 md:text-4xl lg:text-[24px] xl:text-3xl">
              Everything you need for smarter exam review
            </h3>

            <p className="outfit-400 mx-auto mt-8 max-w-2xl text-[14px] text-gray-700 lg:text-[16px] xl:text-lg">

              REVA gives students a focused space to practice questions,
              review difficult topics, track progress, and build confidence before exam day.

            </p>

          </div>

          {/* FEATURE CARDS */}

          <div className="relative z-10 mb-16 px-2 md:px-8">

            <div className="mt-20 grid grid-cols-1 gap-8 md:grid-cols-3">

              {/* QUIZ CREATION */}

              <div
                className="
                  group
                  flex flex-col items-start
                  rounded-3xl
                  border border-orange-200/50
                  bg-white/80
                  p-6
                  shadow-[0_10px_35px_rgba(0,0,0,0.06)]
                  backdrop-blur-2xl
                  transition-all duration-300
                  hover:-translate-y-2
                  hover:shadow-[0_18px_45px_rgba(0,0,0,0.12)]
                "
              >

                <div
                  className="
                    mb-4 flex size-14
                    items-center justify-center
                    rounded-2xl
                    border border-orange-200/50
                    bg-orange-100
                    shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]
                    backdrop-blur-xl
                  "
                >

                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-orange-600"
                  >

                    <path d="M15 18h-5" />

                    <path d="M18 14h-8" />

                    <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-4 0v-9a2 2 0 0 1 2-2h2" />

                    <rect
                      width="8"
                      height="4"
                      x="10"
                      y="6"
                      rx="1"
                    />

                  </svg>

                </div>

                <h4 className="outfit-700 mb-2 font-bold text-gray-900 lg:text-[16px] xl:text-xl">
                  Review Quiz Creation
                </h4>

                <p className="text-gray-700 md:text-[14px] lg:text-base">

                  Create custom review quizzes and practice sets to master
                  important topics before every exam.

                </p>

              </div>

              {/* PRACTICE */}

              <div
                className="
                  group
                  flex flex-col items-start
                  rounded-3xl
                  border border-orange-200/50
                  bg-white/80
                  p-6
                  shadow-[0_10px_35px_rgba(0,0,0,0.06)]
                  backdrop-blur-2xl
                  transition-all duration-300
                  hover:-translate-y-2
                  hover:shadow-[0_18px_45px_rgba(0,0,0,0.12)]
                "
              >

                <div
                  className="
                    mb-4 flex size-14
                    items-center justify-center
                    rounded-2xl
                    border border-orange-200/50
                    bg-orange-100
                    shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]
                    backdrop-blur-xl
                  "
                >

                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-orange-600"
                  >

                    <path d="M14.364 13.634a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506l4.013-4.009a1 1 0 0 0-3.004-3.004z" />

                    <path d="M14.487 7.858A1 1 0 0 1 14 7V2" />

                    <path d="M20 19.645V20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l2.516 2.516" />

                    <path d="M8 18h1" />

                  </svg>

                </div>

                <h4 className="outfit-700 mb-2 font-bold text-gray-900 lg:text-[16px] xl:text-xl">
                  Practice, Review &amp; Track
                </h4>

                <p className="text-gray-700 md:text-[14px] lg:text-base">

                  Answer practice questions, review your answers, and track
                  your progress throughout your exam preparation.

                </p>

              </div>

              {/* QUALIFYING */}

              <div
                className="
                  group
                  flex flex-col items-start
                  rounded-3xl
                  border border-orange-200/50
                  bg-white/80
                  p-6
                  shadow-[0_10px_35px_rgba(0,0,0,0.06)]
                  backdrop-blur-2xl
                  transition-all duration-300
                  hover:-translate-y-2
                  hover:shadow-[0_18px_45px_rgba(0,0,0,0.12)]
                "
              >

                <div
                  className="
                    mb-4 flex size-14
                    items-center justify-center
                    rounded-2xl
                    border border-orange-200/50
                    bg-orange-100
                    shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]
                    backdrop-blur-xl
                  "
                >

                  <img
                    src={APlusIcon}
                    alt="Settings"
                    loading="lazy"
                    decoding="async"
                    className="h-[28px] w-[28px] object-contain"
                  />

                </div>

                <h4 className="outfit-700 mb-2 font-bold text-gray-900 lg:text-[16px] xl:text-xl">
                  Focused Exam Preparation
                </h4>

                <p className="text-gray-700 md:text-[14px] lg:text-base">

                  Use focused review materials for major and qualifying exams
                  to strengthen mastery and build exam confidence.

                </p>

              </div>

            </div>

          </div>

        </div>

        {/* =======================================================
            READY-TO-PRINT
        ======================================================= */}

        <div
          className="
            relative z-[100]
            mx-4 -mt-10
            w-full max-w-[1450px]
            overflow-hidden
            rounded-[40px]
            border border-orange-200/50
            bg-gradient-to-br
            from-orange-100/80
            via-white
            to-orange-50/80
            py-15
            shadow-[0_15px_50px_rgba(0,0,0,0.08)]
            backdrop-blur-2xl
            md:mx-8 md:px-12
            lg:px-12
            xl:px-6
          "
        >

          <div className="pointer-events-none absolute inset-x-20 top-0 h-px bg-gradient-to-r from-transparent via-orange-300/50 to-transparent" />

          <div className="pointer-events-none absolute -right-32 -top-32 h-[300px] w-[300px] rounded-full bg-orange-300/20 blur-[120px]" />

          <div className="mx-auto mt-4 w-full max-w-[1200px] px-6 md:mt-10 lg:-mt-10">

            <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2">

              {/* LEFT */}

              <div className="flex flex-col gap-6 text-center lg:text-left">

                <h2 className="outfit-500 mb-6 text-[28px] leading-tight text-gray-900 lg:text-[30px] xl:text-4xl">

                  Create{" "}

                  <span className="bg-gradient-to-r from-orange-500 via-orange-400 to-orange-600 bg-clip-text text-transparent">
                    Ready-to-Print
                  </span>{" "}

                  Review &amp; Quiz PDFs

                </h2>

                {/* FEATURE 1 */}

                <div
                  className="
                    flex items-start gap-6
                    rounded-3xl
                    border border-orange-200/50
                    bg-white/80
                    p-4
                    text-left
                    shadow-[0_8px_30px_rgba(0,0,0,0.06)]
                    backdrop-blur-2xl
                  "
                >

                  <div
                    className="
                      flex size-12 shrink-0
                      items-center justify-center
                      rounded-full
                      border border-orange-200/50
                      bg-orange-100
                      backdrop-blur-xl
                      lg:size-14
                      xl:size-16
                    "
                  >

                    <img
                      src={CogIcon}
                      alt="Settings"
                      loading="lazy"
                      decoding="async"
                      className="size-[24px] object-contain lg:size-[28px] xl:size-[34px]"
                    />

                  </div>

                  <div>

                    <h3 className="outfit-700 mb-2 text-gray-900 lg:text-[18px] xl:text-xl">
                      Build Your Own Review Materials
                    </h3>

                    <p className="outfit-400 text-[13px] text-gray-700 lg:text-[14px] xl:text-base">

                      Create personalized review materials and practice worksheets
                      for the topics you need to master.

                    </p>

                  </div>

                </div>

                {/* FEATURE 2 */}

                <div
                  className="
                    flex items-start gap-6
                    rounded-3xl
                    border border-orange-200/50
                    bg-white/80
                    p-4
                    text-left
                    shadow-[0_8px_30px_rgba(0,0,0,0.06)]
                    backdrop-blur-2xl
                  "
                >

                  <div
                    className="
                      flex size-12 shrink-0
                      items-center justify-center
                      rounded-full
                      border border-orange-200/50
                      bg-orange-100
                      backdrop-blur-xl
                      lg:size-14
                      xl:size-16
                    "
                  >

                    <img
                      src={ExportIcon}
                      alt="Export"
                      loading="lazy"
                      decoding="async"
                      className="size-[24px] object-contain lg:size-[28px] xl:size-[34px]"
                    />

                  </div>

                  <div>

                    <h3 className="outfit-700 mb-2 font-bold text-gray-900 lg:text-[18px] xl:text-xl">
                      Quick Review Export
                    </h3>

                    <p className="outfit-400 text-[13px] text-gray-700 lg:text-[14px] xl:text-base">

                      Export your review sheets and quizzes into a clean,
                      print-ready format with just one click.

                    </p>

                  </div>

                </div>

              </div>

              {/* RIGHT PREVIEW */}

              <div className="relative flex items-center justify-center">

                <div
                  className="
                    rounded-[32px]
                    border border-orange-200/50
                    bg-white/80
                    p-3
                    shadow-[0_15px_45px_rgba(0,0,0,0.08)]
                    backdrop-blur-2xl
                  "
                >

                  <img
                    src={RightDisplay}
                    alt="Ready-to-print exam preview"
                    loading="lazy"
                    decoding="async"
                    className="w-full max-w-[500px] rounded-[24px] lg:max-w-[600px]"
                  />

                </div>

              </div>

            </div>

          </div>

        </div>

        {/* =======================================================
            GET STARTED
        ======================================================= */}

        <div className="relative z-[101] -mt-10 w-full max-w-[1450px] px-4 pb-16 md:px-12">

          <div className="mx-auto w-full md:max-w-[800px] lg:max-w-[1000px] xl:max-w-[1100px]">

            <div
              className="
                relative overflow-hidden
                rounded-[36px]
                border border-orange-200/50
                shadow-[0_15px_50px_rgba(0,0,0,0.10)]
              "
            >

              <img
                src={GetStarted}
                alt="Get started with REVA"
                loading="lazy"
                decoding="async"
                className="w-full rounded-[36px]"
              />

              <div className="absolute inset-0 flex items-center justify-end">

                <div
                  className="
                    relative mr-4
                    w-[55%]
                    rounded-3xl
                    border border-orange-200/50
                    bg-white/80
                    p-4
                    text-left
                    text-gray-900
                    shadow-[0_12px_40px_rgba(0,0,0,0.08)]
                    backdrop-blur-2xl
                    md:mr-8 md:p-6
                    lg:mr-12
                    xl:mr-16
                  "
                >

                  <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-orange-300/50 to-transparent" />

                  <h3 className="outfit-700 text-[12px] leading-tight sm:text-[16px] md:text-[20px] lg:text-[26px] xl:text-[30px]">

                    Ready? Start Reviewing with{" "}

                    <span className="text-orange-600">
                      REVA
                    </span>

                    <br />

                    and make your{" "}

                    <span className="bg-gradient-to-r from-orange-500 via-orange-400 to-orange-600 bg-clip-text text-transparent">
                      Exam Review Smarter
                    </span>

                  </h3>

                  <p className="outfit-400 mt-1 hidden text-gray-700 sm:block sm:text-[11px] md:mt-2 md:text-[13px] lg:mt-3 lg:text-[15px] xl:text-base">

                    Use REVA to practice, review your lessons, and
                    prepare for exams in a smarter and more organized way.

                  </p>

                  <div className="mt-2 flex justify-start md:mt-4">

                    <button
                      onClick={() => setIsRegisterOpen(true)}
                      className="
                        flex cursor-pointer
                        items-center gap-1
                        rounded-full
                        border border-orange-300/50
                        bg-gradient-to-r from-orange-400 to-orange-500
                        px-3 py-1.5
                        text-[10px]
                        font-semibold text-white
                        shadow-[0_8px_25px_rgba(251,146,60,0.28)]
                        transition-all
                        hover:-translate-y-0.5
                        hover:from-orange-300
                        hover:to-orange-400
                        active:scale-95
                        sm:px-4 sm:py-2 sm:text-[12px]
                        md:gap-2 md:px-5 md:py-2.5 md:text-[13px]
                        lg:px-6 lg:py-3 lg:text-sm
                      "
                    >

                      <span className="outfit-500">
                        Get Started
                      </span>

                      <i className="bx bx-arrow-right-stroke flex items-center justify-center text-[12px] md:text-[16px]" />

                    </button>

                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>

        {/* =======================================================
            MORE FEATURES
        ======================================================= */}

        <section className="relative w-full max-w-[1450px] px-6 pb-16">

          <div
            className="
              relative mx-auto
              w-full max-w-[900px]
              overflow-hidden
              rounded-[36px]
              border border-orange-200/50
              bg-white/70
              px-6 py-10
              text-center
              shadow-[0_15px_45px_rgba(0,0,0,0.06)]
              backdrop-blur-2xl
            "
          >

            <div className="pointer-events-none absolute inset-x-16 top-0 h-px bg-gradient-to-r from-transparent via-orange-300/50 to-transparent" />

            <h2 className="outfit-700 text-2xl text-gray-900 md:text-3xl lg:text-4xl xl:text-5xl">
              More REVA Features to come!
            </h2>

            <p className="outfit-400 mt-4 text-sm text-gray-700 md:text-[14px] lg:text-base">
              Keep reviewing, keep practicing, and get ready to ace your exams!
            </p>

          </div>

        </section>

        {/* =======================================================
            FOOTER
        ======================================================= */}

        <footer
          className="
            relative mt-auto
            w-full
            border-t border-orange-200/50
            bg-white/80
            shadow-[0_-10px_40px_rgba(0,0,0,0.04)]
            backdrop-blur-2xl
          "
        >

          <div className="pointer-events-none absolute inset-x-20 top-0 h-px bg-gradient-to-r from-transparent via-orange-300/50 to-transparent" />

          <div
            className="
              mx-auto
              flex w-full max-w-[1450px]
              flex-col gap-6
              px-6 py-8
              text-sm text-gray-600
              md:flex-row
              md:items-start
              md:justify-between
            "
          >

            {/* BRAND */}

            <div className="flex flex-col items-start gap-3">

              <div className="flex items-center gap-2">

                <div className="flex h-7 w-7 items-center justify-center rounded-full border border-orange-200/50 bg-white/70 backdrop-blur-md">

                  <img
                    src={collegeLogo}
                    alt="REVA logo"
                    className="h-5 w-5"
                  />

                </div>

                <span className="outfit-700 text-base text-gray-900">
                  REVA
                </span>

                <span className="text-[12px] text-gray-500">
                  <AppVersion />
                </span>

              </div>

              <p className="outfit-400 max-w-sm text-xs text-gray-600 md:text-sm">

                REVA is a smart assessment and exam review platform designed
                to help students practice, review lessons, and prepare with confidence.

              </p>

            </div>

            {/* FOOTER LINKS */}

            <div className="grid grid-cols-2 gap-6 md:grid-cols-3 md:gap-10">

              <div>

                <h4 className="outfit-700 mb-2 text-xs uppercase tracking-wide text-gray-700">
                  Product
                </h4>

                <ul className="space-y-1 text-xs md:text-sm">

                  <li>

                    <a
                      href="#features"
                      className="outfit-400 transition hover:text-gray-900"
                    >
                      Features
                    </a>

                  </li>

                  <li>

                    <a
                      href="https://docs.google.com/spreadsheets/d/1YzHRRk4Y_LSc9-fazPL4tDginLq_V1-6/edit?gid=1756766640#gid=1756766640"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="outfit-400 transition hover:text-gray-900"
                    >
                      Feedback
                    </a>

                  </li>

                </ul>

              </div>

              <div>

                <h4 className="outfit-700 mb-2 text-xs uppercase tracking-wide text-gray-700">
                  About
                </h4>

                <ul className="space-y-1 text-xs md:text-sm">

                  <li>

                    <a
                      href="/team-REVA"
                      className="outfit-400 transition hover:text-gray-900"
                    >
                      Developers
                    </a>

                  </li>

                  <li>

                    <a
                      href="#contact"
                      className="outfit-400 transition hover:text-gray-900"
                    >
                      Contact
                    </a>

                  </li>

                </ul>

              </div>

            </div>

          </div>

          <div className="border-t border-orange-200/50">

            <div
              className="
                mx-auto
                flex w-full max-w-[1450px]
                flex-col items-center
                justify-between gap-2
                px-6 py-4
                text-[11px] text-gray-500
                md:flex-row
              "
            >

              <p className="outfit-400">
                © 2026 REVA – Review Evaluation and Validation Assessment.
              </p>

              <p className="outfit-400">
                Powered by JRMSU College of Engineering
              </p>

            </div>

          </div>

        </footer>

      </div>

      {/* =========================================================
          MODALS
      ========================================================= */}

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onSwitchToRegister={() => {
          setIsLoginOpen(false);
          setIsRegisterOpen(true);
        }}
        onSwitchToForgotPassword={() => {
          setIsLoginOpen(false);
          setIsForgotPasswordOpen(true);
        }}
        onSwitchToForgotUserCode={() => {
          setIsLoginOpen(false);
          setIsForgotUserCodeOpen(true);
        }}
      />

      <RegisterModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onSwitchToLogin={() => {
          setIsRegisterOpen(false);
          setIsLoginOpen(true);
        }}
      />

      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
        onSwitchToLogin={() => {
          setIsForgotPasswordOpen(false);
          setIsLoginOpen(true);
        }}
      />

      <ForgotUserCodeModal
        isOpen={isForgotUserCodeOpen}
        onClose={() => setIsForgotUserCodeOpen(false)}
        onSwitchToLogin={() => {
          setIsForgotUserCodeOpen(false);
          setIsLoginOpen(true);
        }}
      />

      <ResetPasswordModal
        isOpen={isResetPasswordOpen}
        onClose={() => {
          setIsResetPasswordOpen(false);

          window.history.replaceState(
            {},
            "",
            window.location.pathname,
          );
        }}
        onSwitchToLogin={() => {
          setIsResetPasswordOpen(false);

          window.history.replaceState(
            {},
            "",
            window.location.pathname,
          );

          setIsLoginOpen(true);
        }}
      />

      <ResetUserCodeModal
        isOpen={isResetUserCodeOpen}
        onClose={() => {
          setIsResetUserCodeOpen(false);

          window.history.replaceState(
            {},
            "",
            window.location.pathname,
          );
        }}
        onSwitchToLogin={() => {
          setIsResetUserCodeOpen(false);

          window.history.replaceState(
            {},
            "",
            window.location.pathname,
          );

          setIsLoginOpen(true);
        }}
      />

      <LoadingOverlay
        show={isAutoLoggingIn}
        message="Logging in..."
      />

    </>
  );
}

export default LandingPage;

