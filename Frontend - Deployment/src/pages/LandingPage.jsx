import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import collegeLogo from "/src/assets/college-logo.png";
import heroImg from "/src/assets/landing/firstpic.png";
import MobileheroImg from "/src/assets/landing/secondpic.png";
import CogIcon from "/src/assets/landing/cog.svg";
import ExportIcon from "/src/assets/landing/export.svg";
import APlusIcon from "/src/assets/landing/a+.svg";
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
        "Try: ⋮ menu → Save and share → Install CAPS-REVIEW JRMSU (or Install page).\n\n" +
        "If that's missing: DevTools → Application → Manifest (fix any errors), " +
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
            bg-white/70
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
              alt="CAPS-REVIEW logo"
              decoding="async"
              fetchPriority="low"
              className="h-6 w-6 object-contain"
            />

          </div>

          <span className="outfit-500 text-[20px] tracking-wide text-gray-900 md:text-[24px]">
            CAPS-REVIEW
          </span>

        </div>

        {/* MOBILE MENU */}

        <button
          onClick={() => setIsSidebarOpen(true)}
          className="
            absolute right-4 top-4 z-50
            flex flex-col gap-1.5
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
            hidden items-center
            rounded-full
            border border-orange-200/50
            bg-white/70
            px-6 py-3
            text-[13px] text-gray-700
            shadow-[0_8px_30px_rgba(0,0,0,0.08)]
            backdrop-blur-2xl
            md:right-8 md:top-5 md:flex md:text-[14px]
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
              rounded-[100px] md:rounded-[100px]
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
                    HERO CONTENT
                ====================================================== */}

                <div className="relative mx-auto flex min-h-[620px] max-w-[1280px] items-center">

                  {/* =================================================
                      ORBITAL RINGS
                  ================================================= */}

                  <div className="pointer-events-none absolute right-[2%] top-[2%] hidden h-[520px] w-[520px] rounded-full border border-orange-800/30 md:block">

                    <div className="absolute inset-8 rounded-full border border-orange-900/50" />

                    <div className="absolute inset-24 rounded-full border border-orange-700/40 border-dashed" />

                    <span className="absolute -left-1 top-[50%] h-2 w-2 rounded-full bg-orange-600 shadow-[0_0_16px_rgba(251,146,60,.6)]" />

                    <span className="absolute right-[8%] top-[16%] h-2 w-2 rounded-full bg-orange-400 shadow-[0_0_16px_rgba(251,146,60,.6)]" />

                    <span className="absolute bottom-[8%] right-[15%] h-2 w-2 rounded-full bg-orange-600 shadow-[0_0_16px_rgba(251,146,60,.6)]" />

                  </div>

                  {/* =================================================
                      TECHNICAL CIRCUITS
                  ================================================= */}

                  <svg
                    className="pointer-events-none absolute right-[-2%] top-[10%] hidden h-[540px] w-[580px] opacity-30 md:block"
                    viewBox="0 0 560 520"
                    fill="none"
                  >

                    <path
                      d="M35 115H135V70H245"
                      stroke="#fb923c"
                      strokeOpacity="0.40"
                      strokeWidth="1.5"
                    />

                    <path
                      d="M330 80H450V135H530"
                      stroke="#fb923c"
                      strokeOpacity="0.35"
                      strokeWidth="1.5"
                    />

                    <path
                      d="M300 390H405V445H530"
                      stroke="#fb923c"
                      strokeOpacity="0.28"
                      strokeWidth="1.5"
                    />

                    <path
                      d="M30 430H125V380H220"
                      stroke="#fb923c"
                      strokeOpacity="0.28"
                      strokeWidth="1.5"
                    />

                    <circle
                      cx="135"
                      cy="115"
                      r="4"
                      fill="#fb923c"
                      fillOpacity="0.85"
                    />

                    <circle
                      cx="245"
                      cy="70"
                      r="4"
                      fill="#fb923c"
                      fillOpacity="0.8"
                    />

                    <circle
                      cx="450"
                      cy="80"
                      r="4"
                      fill="#fb923c"
                      fillOpacity="0.8"
                    />

                    <circle
                      cx="405"
                      cy="390"
                      r="4"
                      fill="#fb923c"
                      fillOpacity="0.8"
                    />

                  </svg>

                  {/* =================================================
                      LEFT HERO TEXT
                  ================================================= */}

                  <div
                    className="
                      relative z-30
                      w-full max-w-[560px]
                      rounded-[34px]
                      border border-orange-200/50
                      bg-gradient-to-br from-white/90 via-white/80 to-orange-50/80
                      p-7
                      shadow-[0_20px_55px_rgba(0,0,0,.08)]
                      backdrop-blur-2xl
                      md:p-9
                      lg:p-10
                    "
                  >

                    <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-orange-300/50 to-transparent" />

                    <div className="pointer-events-none absolute -bottom-24 -left-20 h-48 w-48 rounded-full bg-orange-200/30 blur-[75px]" />

                    {/* COLLEGE OF ENGINEERING LABEL */}

                    <div className="relative z-10 mb-5 flex flex-col items-start gap-2">

                      <div className="h-[4px] w-[92px] rounded-full bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 shadow-[0_0_12px_rgba(251,146,60,.3)]" />

                      <span className="outfit-600 text-[13px] font-semibold uppercase tracking-[2.2px] text-orange-600 md:text-[14px]">
                        College of Engineering
                      </span>

                    </div>

                    <h1
                      className="
                        relative z-10
                        text-[42px] font-bold leading-[.98]
                        tracking-[-1.5px]
                        text-gray-900
                        md:text-[48px]
                        lg:text-[54px]
                        xl:text-[58px]
                      "
                    >

                      CREATE, PRACTICE &amp; REVIEW

                      <br />

                      FOR{" "}

                      <span className="bg-gradient-to-r from-orange-500 via-orange-400 to-orange-600 bg-clip-text text-transparent">
                        EXAMS
                      </span>

                    </h1>

                    <div className="relative z-10 mt-7 h-1 w-20 rounded-full bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600" />

                    <p className="outfit-400 relative z-10 mt-7 max-w-md text-[15px] leading-6 text-gray-700 md:text-[16px]">

                      A smart review platform that helps students
                      <br className="hidden sm:block" />
                      practice, review lessons, and prepare with confidence.

                    </p>

                    <div className="relative z-10 mt-8 flex flex-wrap items-center gap-5">

                      <button
                        onClick={() => setIsLoginOpen(true)}
                        className="
                          inline-flex cursor-pointer items-center justify-center gap-2
                          rounded-full border border-orange-300/50
                          bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600
                          px-7 py-3.5 text-[14px] font-medium text-white
                          shadow-[0_10px_28px_rgba(251,146,60,.30)]
                          transition-all duration-300
                          hover:-translate-y-0.5
                          hover:shadow-[0_14px_34px_rgba(251,146,60,.38)]
                          active:scale-95
                        "
                      >

                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="21"
                          height="21"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="m10 17 5-5-5-5" />
                          <path d="M15 12H3" />
                          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                        </svg>

                        LOG IN

                      </button>

                      <button
                        onClick={() => setIsRegisterOpen(true)}
                        className="
                          inline-flex cursor-pointer items-center justify-center gap-2
                          rounded-full border border-orange-200/50 bg-white/60
                          px-7 py-3.5 text-[14px] font-medium text-gray-800
                          shadow-[0_8px_25px_rgba(0,0,0,.06)]
                          backdrop-blur-xl
                          transition-all duration-300
                          hover:-translate-y-0.5
                          hover:bg-white/80
                          active:scale-95
                        "
                      >

                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="21"
                          height="21"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle cx="12" cy="8" r="5" />
                          <path d="M20 21a8 8 0 0 0-16 0" />
                        </svg>

                        SIGN UP

                      </button>

                    </div>

                  </div>

                  {/* =====================================================
                      RIGHT — 3D ENGINEERING COMPOSITION
                  ====================================================== */}

                  <div
                    className="
                      absolute
                      right-[-2%]
                      top-[0%]
                      z-20
                      hidden
                      h-[640px]
                      w-[640px]
                      md:block
                      lg:right-[0%]
                      lg:h-[680px]
                      lg:w-[680px]
                      xl:right-[2%]
                      xl:h-[700px]
                      xl:w-[700px]
                    "
                  >

                    {/* =================================================
                        AMBIENT LIGHT
                    ================================================= */}

                    <div className="pointer-events-none absolute right-[8%] top-[8%] h-[430px] w-[430px] rounded-full bg-orange-300/20 blur-[120px]" />

                    <div className="pointer-events-none absolute bottom-[5%] right-[15%] h-[300px] w-[300px] rounded-full bg-orange-400/20 blur-[100px]" />

                    {/* =================================================
                        3D CIVIL BUILDING
                    ================================================= */}

                    <div
                      className="
                        absolute
                        bottom-[8%]
                        left-[0%]
                        z-20
                        h-[235px]
                        w-[245px]
                        rotate-[-4deg]
                      "
                    >

                      <svg
                        viewBox="0 0 260 250"
                        className="h-full w-full overflow-visible"
                        fill="none"
                      >

                        <defs>

                          <linearGradient
                            id="buildingFront"
                            x1="0"
                            y1="0"
                            x2="1"
                            y2="1"
                          >
                            <stop offset="0%" stopColor="#fcd34d" />
                            <stop offset="45%" stopColor="#f59e0b" />
                            <stop offset="100%" stopColor="#d97706" />
                          </linearGradient>

                          <linearGradient
                            id="buildingSide"
                            x1="0"
                            y1="0"
                            x2="1"
                            y2="0"
                          >
                            <stop offset="0%" stopColor="#fbbf24" />
                            <stop offset="100%" stopColor="#f59e0b" />
                          </linearGradient>

                          <linearGradient
                            id="buildingRoof"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop offset="0%" stopColor="#fcd34d" />
                            <stop offset="100%" stopColor="#f59e0b" />
                          </linearGradient>

                          <linearGradient
                            id="windowGlass"
                            x1="0"
                            y1="0"
                            x2="1"
                            y2="1"
                          >
                            <stop offset="0%" stopColor="#fef3c7" />
                            <stop offset="35%" stopColor="#fcd34d" />
                            <stop offset="100%" stopColor="#d97706" />
                          </linearGradient>

                          <filter id="buildingDropShadow">
                            <feDropShadow
                              dx="0"
                              dy="12"
                              stdDeviation="8"
                              floodColor="#000000"
                              floodOpacity="0.15"
                            />
                          </filter>

                          <linearGradient
                            id="buildingHighlight"
                            x1="0"
                            y1="0"
                            x2="1"
                            y2="1"
                          >
                            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.34" />
                            <stop offset="45%" stopColor="#ffffff" stopOpacity="0.05" />
                            <stop offset="100%" stopColor="#000000" stopOpacity="0.10" />
                          </linearGradient>

                        </defs>

                        {/* Ground shadow */}

                        <ellipse
                          cx="128"
                          cy="232"
                          rx="112"
                          ry="10"
                          fill="#000000"
                          fillOpacity="0.15"
                        />

                        {/* Front */}

                        <path
                          d="M60 80L150 55V210H60Z"
                          fill="url(#buildingFront)"
                          filter="url(#buildingDropShadow)"
                        />

                        <path
                          d="M60 80L150 55V210H60Z"
                          fill="url(#buildingHighlight)"
                          opacity="0.55"
                        />

                        {/* Side */}

                        <path
                          d="M150 55L205 78V210H150Z"
                          fill="url(#buildingSide)"
                        />

                        {/* Roof */}

                        <path
                          d="M60 80L120 48L205 78L150 55Z"
                          fill="url(#buildingRoof)"
                        />

                        {/* Roof edge */}

                        <path
                          d="M60 80L150 55L205 78"
                          stroke="#fef3c7"
                          strokeOpacity="0.35"
                          strokeWidth="2"
                        />

                        {/* Windows */}

                        <g fill="url(#windowGlass)">

                          <rect x="75" y="92" width="19" height="25" rx="2" />

                          <rect x="101" y="85" width="19" height="25" rx="2" />

                          <rect x="127" y="78" width="14" height="25" rx="2" />

                          <rect x="75" y="128" width="19" height="25" rx="2" />

                          <rect x="101" y="121" width="19" height="25" rx="2" />

                          <rect x="127" y="114" width="14" height="25" rx="2" />

                          <rect x="75" y="164" width="19" height="25" rx="2" />

                          <rect x="101" y="157" width="19" height="25" rx="2" />

                          <rect x="127" y="150" width="14" height="25" rx="2" />

                        </g>

                        {/* Realistic glass reflections */}

                        <g
                          stroke="#ffffff"
                          strokeOpacity="0.65"
                          strokeWidth="2"
                        >

                          <path d="M77 101L88 97" />
                          <path d="M103 94L114 90" />
                          <path d="M77 137L88 133" />
                          <path d="M103 130L114 126" />

                        </g>

                        {/* Window highlights */}

                        <g
                          stroke="#ffffff"
                          strokeOpacity="0.35"
                          strokeWidth="1.5"
                        >

                          <path d="M77 95L91 92" />
                          <path d="M103 88L117 84" />

                        </g>

                        {/* Side windows */}

                        <g fill="#fcd34d" fillOpacity="0.22">

                          <path d="M162 86L191 97V119L162 110Z" />

                          <path d="M162 124L191 135V157L162 148Z" />

                          <path d="M162 162L191 173V195L162 186Z" />

                        </g>

                        {/* Floor lines */}

                        <g
                          stroke="#fef3c7"
                          strokeOpacity="0.18"
                          strokeWidth="1"
                        >

                          <path d="M60 120L150 98" />
                          <path d="M60 155L150 133" />
                          <path d="M60 190L150 168" />

                        </g>

                        {/* Structural columns */}

                        <g
                          stroke="#fef3c7"
                          strokeOpacity="0.32"
                          strokeWidth="3"
                        >

                          <path d="M65 80V210" />
                          <path d="M150 57V210" />
                          <path d="M204 79V210" />

                        </g>

                      </svg>

                    </div>

                    {/* =================================================
                        3D CONSTRUCTION CRANE
                    ================================================= */}

                    <div
                      className="
                        absolute
                        bottom-[27%]
                        left-[0%]
                        z-30
                        h-[310px]
                        w-[290px]
                      "
                    >

                      <svg
                        viewBox="0 0 300 320"
                        className="h-full w-full overflow-visible"
                        fill="none"
                      >

                        <defs>

                          <linearGradient
                            id="craneMetal"
                            x1="0"
                            y1="0"
                            x2="1"
                            y2="1"
                          >
                            <stop offset="0%" stopColor="#fef3c7" />
                            <stop offset="35%" stopColor="#fcd34d" />
                            <stop offset="70%" stopColor="#f59e0b" />
                            <stop offset="100%" stopColor="#d97706" />
                          </linearGradient>

                        </defs>

                        {/* Shadow */}

                        <ellipse
                          cx="95"
                          cy="308"
                          rx="78"
                          ry="7"
                          fill="#000000"
                          fillOpacity="0.15"
                        />

                        {/* Tower */}

                        <path
                          d="M80 300H105V70H80Z"
                          fill="url(#craneMetal)"
                          stroke="#d97706"
                          strokeWidth="1"
                        />

                        {/* Lattice */}

                        <g
                          stroke="#f59e0b"
                          strokeWidth="2"
                        >

                          <path d="M80 90L105 110L80 130L105 150L80 170L105 190L80 210L105 230L80 250L105 270L80 290" />

                          <path d="M105 90L80 110L105 130L80 150L105 170L80 190L105 210L80 230L105 250L80 270L105 290" />

                        </g>

                        {/* Main boom */}

                        <path
                          d="M92 70H278"
                          stroke="url(#craneMetal)"
                          strokeWidth="8"
                          strokeLinecap="round"
                        />

                        {/* Boom lattice */}

                        <g
                          stroke="#f59e0b"
                          strokeWidth="1.5"
                        >

                          <path d="M110 70L122 88" />
                          <path d="M135 70L147 88" />
                          <path d="M160 70L172 88" />
                          <path d="M185 70L197 88" />
                          <path d="M210 70L222 88" />
                          <path d="M235 70L247 88" />

                        </g>

                        {/* Counter boom */}

                        <path
                          d="M92 70L45 45"
                          stroke="url(#craneMetal)"
                          strokeWidth="7"
                          strokeLinecap="round"
                        />

                        {/* Counterweight */}

                        <rect
                          x="28"
                          y="37"
                          width="27"
                          height="18"
                          rx="3"
                          fill="#f59e0b"
                          stroke="#fef3c7"
                        />

                        {/* Cabin */}

                        <path
                          d="M82 61H108V80H82Z"
                          fill="#d97706"
                          stroke="#fef3c7"
                        />

                        <path
                          d="M86 65H103V75H86Z"
                          fill="#fcd34d"
                          fillOpacity="0.45"
                        />

                        {/* Cable */}

                        <path
                          d="M245 70V165"
                          stroke="#fef3c7"
                          strokeWidth="2"
                        />

                        {/* Hook */}

                        <path
                          d="M238 165C238 177 253 177 253 165"
                          stroke="#fbbf24"
                          strokeWidth="3"
                        />

                        <rect
                          x="237"
                          y="150"
                          width="17"
                          height="16"
                          rx="2"
                          fill="#f59e0b"
                        />

                        {/* Warning light */}

                        <circle
                          cx="92"
                          cy="66"
                          r="5"
                          fill="#fbbf24"
                        />

                      </svg>

                    </div>

                    {/* =================================================
                        ELECTRICAL — TRANSMISSION TOWER
                    ================================================= */}

                    <div
                      className="
                        absolute
                        bottom-[5%]
                        right-[1%]
                        z-20
                        h-[350px]
                        w-[180px]
                      "
                    >

                      <svg
                        viewBox="0 0 190 370"
                        className="h-full w-full overflow-visible"
                        fill="none"
                      >

                        <defs>

                          <linearGradient
                            id="towerMetal"
                            x1="0"
                            y1="0"
                            x2="1"
                            y2="0"
                          >
                            <stop offset="0%" stopColor="#fef3c7" />
                            <stop offset="35%" stopColor="#fcd34d" />
                            <stop offset="65%" stopColor="#f59e0b" />
                            <stop offset="100%" stopColor="#d97706" />
                          </linearGradient>

                        </defs>

                        <ellipse
                          cx="95"
                          cy="360"
                          rx="70"
                          ry="7"
                          fill="#000000"
                          fillOpacity="0.15"
                        />

                        {/* Tower body */}

                        <path
                          d="M90 10L145 350H45Z"
                          fill="#f59e0b"
                          fillOpacity="0.15"
                          stroke="url(#towerMetal)"
                          strokeWidth="5"
                        />

                        {/* Tower lattice */}

                        <g
                          stroke="#f59e0b"
                          strokeWidth="2"
                        >

                          <path d="M90 10L45 350" />
                          <path d="M90 10L145 350" />

                          <path d="M78 70H102" />
                          <path d="M70 125H111" />
                          <path d="M61 180H120" />
                          <path d="M52 240H130" />
                          <path d="M45 300H139" />

                          <path d="M78 70L111 125" />
                          <path d="M102 70L70 125" />

                          <path d="M70 125L120 180" />
                          <path d="M111 125L61 180" />

                          <path d="M61 180L130 240" />
                          <path d="M120 180L52 240" />

                          <path d="M52 240L139 300" />
                          <path d="M130 240L45 300" />

                        </g>

                        {/* Crossarms */}

                        <path
                          d="M20 75H165"
                          stroke="url(#towerMetal)"
                          strokeWidth="6"
                          strokeLinecap="round"
                        />

                        <path
                          d="M5 130H180"
                          stroke="url(#towerMetal)"
                          strokeWidth="6"
                          strokeLinecap="round"
                        />

                        <path
                          d="M0 185H190"
                          stroke="url(#towerMetal)"
                          strokeWidth="6"
                          strokeLinecap="round"
                        />

                        {/* Insulators */}

                        <g fill="#fef3c7">

                          <circle cx="25" cy="75" r="5" />
                          <circle cx="155" cy="75" r="5" />

                          <circle cx="10" cy="130" r="5" />
                          <circle cx="170" cy="130" r="5" />

                          <circle cx="8" cy="185" r="5" />
                          <circle cx="182" cy="185" r="5" />

                        </g>

                        {/* Power cables */}

                        <path
                          d="M25 75C-10 95 -10 155 25 185"
                          stroke="#fef3c7"
                          strokeOpacity="0.5"
                          strokeWidth="1.5"
                        />

                        <path
                          d="M155 75C195 100 195 155 155 185"
                          stroke="#fef3c7"
                          strokeOpacity="0.5"
                          strokeWidth="1.5"
                        />

                        {/* Beacon */}

                        <circle
                          cx="90"
                          cy="10"
                          r="5"
                          fill="#fbbf24"
                        />

                        <circle
                          cx="90"
                          cy="10"
                          r="10"
                          fill="#fbbf24"
                          fillOpacity="0.18"
                        />

                      </svg>

                    </div>

                    {/* =================================================
                        ELECTRICAL — 3D TRANSFORMER
                    ================================================= */}

                    <div
                      className="
                        absolute
                        bottom-[8%]
                        right-[17%]
                        z-30
                        h-[185px]
                        w-[175px]
                        rotate-[5deg]
                      "
                    >

                      <svg
                        viewBox="0 0 200 220"
                        className="h-full w-full overflow-visible"
                        fill="none"
                      >

                        <defs>

                          <linearGradient
                            id="transformerBody"
                            x1="0"
                            y1="0"
                            x2="1"
                            y2="1"
                          >
                            <stop offset="0%" stopColor="#fef08a" />
                            <stop offset="35%" stopColor="#facc15" />
                            <stop offset="70%" stopColor="#ca8a04" />
                            <stop offset="100%" stopColor="#854d0e" />
                          </linearGradient>

                          <linearGradient
                            id="transformerSide"
                            x1="0"
                            y1="0"
                            x2="1"
                            y2="0"
                          >
                            <stop offset="0%" stopColor="#a16207" />
                            <stop offset="100%" stopColor="#713f12" />
                          </linearGradient>

                        </defs>

                        <ellipse
                          cx="100"
                          cy="205"
                          rx="75"
                          ry="8"
                          fill="#000000"
                          fillOpacity="0.15"
                        />

                        {/* Main body */}

                        <path
                          d="M45 70L145 52L175 70V160L75 180L45 160Z"
                          fill="url(#transformerBody)"
                          stroke="#fef3c7"
                        />

                        <path
                          d="M49 72L144 55L166 71V94L72 112L49 101Z"
                          fill="#ffffff"
                          fillOpacity="0.16"
                        />

                        {/* Side depth */}

                        <path
                          d="M145 52L175 70V160L145 145Z"
                          fill="url(#transformerSide)"
                        />

                        {/* Cooling fins */}

                        <g
                          stroke="#92400e"
                          strokeWidth="3"
                          opacity="0.75"
                        >

                          <path d="M60 74V163" />
                          <path d="M70 72V166" />
                          <path d="M80 70V164" />
                          <path d="M90 68V162" />
                          <path d="M100 66V160" />
                          <path d="M110 64V158" />
                          <path d="M120 62V155" />
                          <path d="M130 60V151" />

                        </g>

                        {/* Insulators */}

                        <g fill="#fef3c7">

                          <rect x="63" y="48" width="13" height="23" rx="4" />

                          <rect x="94" y="42" width="13" height="23" rx="4" />

                          <rect x="125" y="37" width="13" height="23" rx="4" />

                        </g>

                        <g
                          stroke="#f59e0b"
                          strokeWidth="2"
                        >

                          <path d="M60 54H79" />
                          <path d="M91 48H110" />
                          <path d="M122 43H141" />

                        </g>

                        {/* Supports */}

                        <path
                          d="M55 160V198M145 145V198"
                          stroke="#f59e0b"
                          strokeWidth="5"
                        />

                        <rect
                          x="72"
                          y="101"
                          width="34"
                          height="22"
                          rx="3"
                          fill="#fef3c7"
                          fillOpacity="0.72"
                          stroke="#92400e"
                          strokeOpacity="0.55"
                        />

                        <circle
                          cx="78"
                          cy="107"
                          r="2"
                          fill="#dc2626"
                        />

                        <circle
                          cx="78"
                          cy="117"
                          r="2"
                          fill="#16a34a"
                        />

                        <text
                          x="92"
                          y="111"
                          fontSize="6"
                          fill="#422006"
                          fontWeight="700"
                          textAnchor="middle"
                        >
                          HIGH
                        </text>

                        <text
                          x="92"
                          y="118"
                          fontSize="5"
                          fill="#422006"
                          textAnchor="middle"
                        >
                          VOLTAGE
                        </text>

                        <text
                          x="86"
                          y="138"
                          fontSize="9"
                          fill="#422006"
                          fontWeight="700"
                          textAnchor="middle"
                        >
                          POWER
                        </text>

                        <text
                          x="86"
                          y="137"
                          fontSize="7"
                          fill="#422006"
                          textAnchor="middle"
                        >
                          TRANSFORMER
                        </text>

                      </svg>

                    </div>

                    {/* =================================================
                        ELECTRONICS — 3D PCB
                    ================================================= */}

                    <div
                      className="
                        absolute
                        bottom-[8%]
                        right-[38%]
                        z-40
                        h-[120px]
                        w-[215px]
                        rotate-[-10deg]
                        rounded-[18px]
                        border
                        border-orange-300/40
                        bg-gradient-to-br
                        from-orange-400
                        via-orange-600
                        to-orange-900
                        shadow-[0_25px_45px_rgba(0,0,0,.15)]
                      "
                    >

                      <div className="pointer-events-none absolute inset-0 rounded-[18px] bg-gradient-to-br from-white/15 via-transparent to-transparent" />

                      <div className="pointer-events-none absolute inset-x-3 top-2 h-5 rounded-full bg-white/10 blur-md" />

                      <div className="absolute left-2 top-2 h-2.5 w-2.5 rounded-full border border-amber-200/50 bg-slate-950/70 shadow-[inset_0_1px_2px_rgba(255,255,255,.25)]" />
                      <div className="absolute bottom-2 right-2 h-2.5 w-2.5 rounded-full border border-amber-200/50 bg-slate-950/70 shadow-[inset_0_1px_2px_rgba(255,255,255,.25)]" />

                      {/* PCB traces */}

                      <svg
                        className="absolute inset-0 h-full w-full"
                        viewBox="0 0 220 125"
                        fill="none"
                      >

                        <path
                          d="M18 28H65L78 42H105"
                          stroke="#fbbf24"
                          strokeWidth="2"
                        />

                        <path
                          d="M130 25H180V50H200"
                          stroke="#fbbf24"
                          strokeWidth="2"
                        />

                        <path
                          d="M25 90H70V70H100"
                          stroke="#fcd34d"
                          strokeWidth="2"
                        />

                        <path
                          d="M125 98H160L178 80H205"
                          stroke="#f59e0b"
                          strokeWidth="2"
                        />

                        <circle
                          cx="65"
                          cy="28"
                          r="3"
                          fill="#fbbf24"
                        />

                        <circle
                          cx="180"
                          cy="25"
                          r="3"
                          fill="#fbbf24"
                        />

                        <circle
                          cx="70"
                          cy="90"
                          r="3"
                          fill="#fcd34d"
                        />

                      </svg>

                      {/* Solder points / components */}

                      <div className="absolute left-5 top-[52px] h-2 w-2 rounded-full bg-amber-300 shadow-[0_0_6px_rgba(252,211,77,.45)]" />
                      <div className="absolute left-5 top-[72px] h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_6px_rgba(103,232,249,.45)]" />
                      <div className="absolute right-12 bottom-[31px] h-2 w-2 rounded-full bg-green-300 shadow-[0_0_6px_rgba(134,239,172,.45)]" />

                      {/* Raised IC */}

                      <div
                        className="
                          absolute
                          left-[72px]
                          top-[34px]
                          h-[48px]
                          w-[65px]
                          rounded-[6px]
                          border
                          border-slate-500
                          bg-gradient-to-br
                          from-slate-600
                          via-slate-900
                          to-black
                          shadow-[0_8px_12px_rgba(0,0,0,.6)]
                        "
                      >

                        <div className="absolute inset-[7px] rounded-[3px] bg-black ring-1 ring-orange-400/30" />

                        <div className="absolute left-2 top-1 h-1 w-7 rounded-full bg-white/20 blur-[1px]" />

                        <div className="absolute -left-[5px] top-2 h-1 w-2 bg-slate-300 shadow-[0_7px_0_#cbd5e1,0_14px_0_#94a3b8,0_21px_0_#cbd5e1,0_28px_0_#94a3b8]" />

                        <div className="absolute -right-[5px] top-2 h-1 w-2 bg-slate-300 shadow-[0_7px_0_#cbd5e1,0_14px_0_#94a3b8,0_21px_0_#cbd5e1,0_28px_0_#94a3b8]" />

                      </div>

                      {/* Capacitor */}

                      <div
                        className="
                          absolute
                          right-5
                          top-5
                          h-9
                          w-9
                          rounded-full
                          border
                          border-slate-300/60
                          bg-gradient-to-br
                          from-slate-200
                          via-slate-500
                          to-slate-900
                          shadow-[0_5px_10px_rgba(0,0,0,.5)]
                        "
                      >

                        <div className="absolute left-1/2 top-0 h-full w-[2px] -translate-x-1/2 bg-white/40" />

                      </div>

                      {/* Resistors */}

                      <div
                        className="
                          absolute
                          bottom-4
                          left-5
                          h-2
                          w-12
                          rounded-full
                          bg-gradient-to-r
                          from-amber-900
                          via-amber-400
                          to-amber-900
                        "
                      />

                      <div
                        className="
                          absolute
                          bottom-4
                          right-5
                          h-2
                          w-9
                          rounded-full
                          bg-gradient-to-r
                          from-orange-900
                          via-orange-400
                          to-orange-900
                        "
                      />

                    </div>

                    {/* =================================================
                        ELECTRONICS — MICROCHIP
                    ================================================= */}

                    <div
                      className="
                        absolute
                        bottom-[6%]
                        right-[31%]
                        z-50
                        h-[68px]
                        w-[68px]
                        rotate-[12deg]
                        rounded-[12px]
                        border
                        border-slate-400/50
                        bg-gradient-to-br
                        from-slate-600
                        via-slate-900
                        to-black
                        shadow-[0_15px_30px_rgba(0,0,0,.6)]
                      "
                    >

                      <div className="absolute inset-3 rounded-md bg-black ring-1 ring-orange-300/30" />

                      <div className="absolute left-1/2 top-2 h-1 w-5 -translate-x-1/2 rounded-full bg-white/20" />

                      <div className="absolute -left-2 top-3 h-[2px] w-2 bg-orange-300/70 shadow-[0_10px_0_rgba(251,146,60,.7),0_20px_0_rgba(251,146,60,.7),0_30px_0_rgba(251,146,60,.7),0_40px_0_rgba(251,146,60,.7)]" />

                      <div className="absolute -right-2 top-3 h-[2px] w-2 bg-orange-300/70 shadow-[0_10px_0_rgba(251,146,60,.7),0_20px_0_rgba(251,146,60,.7),0_30px_0_rgba(251,146,60,.7),0_40px_0_rgba(251,146,60,.7)]" />

                    </div>

                    {/* =================================================
                        PHONE
                    ================================================= */}

                    <div
                      className="
                        absolute
                        left-[28%]
                        top-[6%]
                        z-[70]
                        w-[290px]
                        lg:w-[320px]
                        xl:w-[335px]
                      "
                    >

                      {/* Phone frame */}

                      <div
                        className="
                          relative
                          rounded-[48px]
                          border-[3px]
                          border-orange-200/40
                          bg-gradient-to-br
                          from-orange-100/40
                          via-white/10
                          to-orange-200/50
                          p-[5px]
                          shadow-[0_18px_38px_rgba(0,0,0,.10),inset_0_1px_1px_rgba(255,255,255,.45)]
                          backdrop-blur-xl
                          transition-transform
                          duration-500
                          hover:-translate-y-2
                        "
                      >

                        {/* Metallic highlight */}

                        <div className="pointer-events-none absolute inset-0 rounded-[48px] bg-gradient-to-br from-white/30 via-transparent to-orange-200/30" />

                        <div
                          className="
                            relative
                            overflow-hidden
                            rounded-[42px]
                            bg-black
                            shadow-[inset_0_0_0_2px_rgba(255,255,255,.15)]
                          "
                        >

                          {/* Dynamic island */}

                          <div
                            className="
                              pointer-events-none
                              absolute
                              left-1/2
                              top-2
                              z-30
                              h-[24px]
                              w-[82px]
                              -translate-x-1/2
                              rounded-full
                              bg-slate-950
                              shadow-[0_2px_8px_rgba(0,0,0,.7)]
                            "
                          >

                            <div className="absolute right-3 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-slate-700" />

                          </div>

                          <picture>

                            <source
                              media="(min-width: 768px)"
                              srcSet={heroImg}
                            />

                            <img
                              src={MobileheroImg}
                              alt="CAPS-REVIEW mobile interface"
                              loading="eager"
                              decoding="async"
                              fetchPriority="high"
                              className="block h-auto w-full object-contain"
                            />

                          </picture>

                          {/* Screen glass */}

                          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/12 via-transparent to-transparent" />

                        </div>

                        {/* =================================================
                            HARD HAT
                            REALISTIC — PERCHED ON THE PHONE'S UPPER-RIGHT EDGE
                        ================================================= */}

                        <div
                          className="
                            pointer-events-none
                            absolute
                            -right-[43px]
                            -top-[47px]
                            z-[100]
                            rotate-[8deg]
                            scale-[1.18]
                            origin-bottom-left
                            lg:-right-[48px]
                            lg:-top-[51px]
                          "
                        >

                          {/* Soft contact shadow — makes the hat look physically seated */}

                          <div
                            className="
                              absolute
                              bottom-[3px]
                              left-[18px]
                              z-0
                              h-[10px]
                              w-[112px]
                              rounded-[50%]
                              bg-black/20
                              blur-[7px]
                            "
                          />

                          {/* Hard-hat shell */}

                          <div
                            className="
                              relative
                              z-10
                              h-[67px]
                              w-[114px]
                              overflow-hidden
                              rounded-t-[54px]
                              border
                              border-white/90
                              bg-gradient-to-br
                              from-white
                              via-slate-100
                              to-slate-400
                              shadow-[0_9px_16px_rgba(0,0,0,.20),inset_0_2px_4px_rgba(255,255,255,.95)]
                            "
                          >

                            {/* Dome highlight */}

                            <div
                              className="
                                absolute
                                left-[12px]
                                top-[7px]
                                h-[24px]
                                w-[62px]
                                rotate-[-10deg]
                                rounded-full
                                bg-white/85
                                blur-[3px]
                              "
                            />

                            {/* Raised center ridge */}

                            <div
                              className="
                                absolute
                                left-1/2
                                top-[-2px]
                                h-[70px]
                                w-[14px]
                                -translate-x-1/2
                                rounded-full
                                bg-gradient-to-b
                                from-white
                                via-slate-100
                                to-slate-300
                                shadow-[0_0_5px_rgba(255,255,255,.9)]
                              "
                            />

                            {/* Left shell contour */}

                            <div
                              className="
                                absolute
                                left-[17px]
                                top-[18px]
                                h-[39px]
                                w-[22px]
                                rounded-[50%]
                                border-l-2
                                border-white/70
                                opacity-80
                              "
                            />

                            {/* Right shell contour */}

                            <div
                              className="
                                absolute
                                right-[15px]
                                top-[18px]
                                h-[38px]
                                w-[20px]
                                rounded-[50%]
                                border-r-2
                                border-slate-400/50
                              "
                            />

                            {/* Orange safety detail */}

                            <div
                              className="
                                absolute
                                right-[13px]
                                top-[23px]
                                h-[20px]
                                w-[20px]
                                rounded-full
                                border
                                border-orange-300/80
                                bg-gradient-to-br
                                from-orange-200
                                via-orange-400
                                to-orange-600/50
                                shadow-[0_0_9px_rgba(249,115,22,.35),inset_0_1px_2px_rgba(255,255,255,.8)]
                              "
                            />

                          </div>

                          {/* Wide brim — this is the part that actually sits across the phone edge */}

                          <div
                            className="
                              relative
                              z-20
                              -mt-[5px]
                              ml-[-22px]
                              h-[18px]
                              w-[154px]
                              rounded-[50%]
                              border
                              border-white/90
                              bg-gradient-to-b
                              from-white
                              via-slate-200
                              to-slate-500
                              shadow-[0_6px_11px_rgba(0,0,0,.20),inset_0_2px_3px_rgba(255,255,255,.95)]
                            "
                          >

                            {/* Brim top reflection */}

                            <div
                              className="
                                absolute
                                left-[18px]
                                right-[18px]
                                top-[4px]
                                h-[3px]
                                rounded-full
                                bg-white/80
                                blur-[1px]
                              "
                            />

                            {/* Dark lower edge for depth */}

                            <div
                              className="
                                absolute
                                bottom-[2px]
                                left-[22px]
                                right-[22px]
                                h-[3px]
                                rounded-full
                                bg-slate-500/35
                                blur-[1px]
                              "
                            />

                          </div>

                        </div>

                      </div>

                    </div>

                  </div>

                </div>

                {/* =====================================================
                    ENGINEERING DISCIPLINE STRIP
                ====================================================== */}

                <div
                  className="
                    relative z-[80]
                    mx-2 mt-10
                    flex flex-col gap-6
                    rounded-[30px]
                    border border-orange-200/50
                    bg-white/80
                    px-6 py-6
                    shadow-[0_14px_45px_rgba(0,0,0,.08)]
                    backdrop-blur-2xl
                    sm:mx-6
                    md:absolute
                    md:bottom-5
                    md:left-1/2
                    md:mt-0
                    md:w-[92%]
                    md:-translate-x-1/2
                    md:flex-row
                    md:items-center
                    md:justify-between
                    md:px-9
                  "
                >

                  {/* CIVIL */}

                  <div className="flex flex-1 items-center gap-4">

                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-orange-300/30 bg-orange-100 md:h-16 md:w-16">

                      <svg
                        viewBox="0 0 48 48"
                        className="h-8 w-8 md:h-9 md:w-9"
                        fill="none"
                      >

                        <path
                          d="M9 35H39"
                          stroke="#f59e0b"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        />

                        <path
                          d="M12 35C12 22 17 14 24 14C31 14 36 22 36 35"
                          stroke="#f59e0b"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />

                        <path
                          d="M24 14V9"
                          stroke="#f59e0b"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        />

                        <path
                          d="M20 35V27M28 35V27"
                          stroke="#f59e0b"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />

                      </svg>

                    </div>

                    <div>

                      <h3 className="outfit-700 text-[14px] text-gray-900 md:text-[15px]">
                        CIVIL ENGINEERING
                      </h3>

                      <p className="mt-1 text-[12px] leading-5 text-gray-600">
                        Design. Build. Innovate.
                        <br />
                        Shape the future infrastructure.
                      </p>

                    </div>

                  </div>

                  <div className="hidden h-16 w-px bg-orange-200/50 lg:mx-5 lg:block" />

                  {/* ELECTRICAL */}

                  <div className="flex flex-1 items-center gap-4">

                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-orange-300/30 bg-orange-100 md:h-16 md:w-16">

                      <svg
                        viewBox="0 0 48 48"
                        className="h-8 w-8 md:h-9 md:w-9"
                        fill="none"
                      >

                        <path
                          d="M27 5L13 27H23L20 43L36 20H26L27 5Z"
                          stroke="#f59e0b"
                          strokeWidth="2.5"
                          strokeLinejoin="round"
                        />

                      </svg>

                    </div>

                    <div>

                      <h3 className="outfit-700 text-[14px] text-gray-900 md:text-[15px]">
                        ELECTRICAL ENGINEERING
                      </h3>

                      <p className="mt-1 text-[12px] leading-5 text-gray-600">
                        Power. Systems. Solutions.
                        <br />
                        Energize the world.
                      </p>

                    </div>

                  </div>

                  <div className="hidden h-16 w-px bg-orange-200/50 lg:mx-5 lg:block" />

                  {/* ELECTRONICS */}

                  <div className="flex flex-1 items-center gap-4">

                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-orange-300/30 bg-orange-100 md:h-16 md:w-16">

                      <svg
                        viewBox="0 0 48 48"
                        className="h-8 w-8 md:h-9 md:w-9"
                        fill="none"
                      >

                        <rect
                          x="13"
                          y="13"
                          width="22"
                          height="22"
                          rx="3"
                          stroke="#f59e0b"
                          strokeWidth="2.5"
                        />

                        <rect
                          x="19"
                          y="19"
                          width="10"
                          height="10"
                          rx="1"
                          stroke="#f59e0b"
                          strokeWidth="2"
                        />

                        <path
                          d="M18 7V13M24 7V13M30 7V13M18 35V41M24 35V41M30 35V41M7 18H13M7 24H13M7 30H13M35 18H41M35 24H41M35 30H41"
                          stroke="#f59e0b"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />

                      </svg>

                    </div>

                    <div>

                      <h3 className="outfit-700 text-[14px] text-gray-900 md:text-[15px]">
                        ELECTRONICS ENGINEERING
                      </h3>

                      <p className="mt-1 text-[12px] leading-5 text-gray-600">
                        Circuits. Devices. Intelligence.
                        <br />
                        Create smart innovations.
                      </p>

                    </div>

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
                  Comprehensive Assessment
                </span>

                <br />

                <span className="bg-gradient-to-r from-orange-500 via-orange-400 to-orange-600 bg-clip-text text-transparent">
                  &amp; Review System
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
                [ CAPS-REVIEW FEATURES ]
              </span>

            </div>

            <h3 className="outfit-700 mt-8 text-gray-900 md:mt-12 md:text-4xl lg:text-[24px] xl:text-3xl">
              Everything you need for smarter exam review
            </h3>

            <p className="outfit-400 mx-auto mt-8 max-w-2xl text-[14px] text-gray-700 lg:text-[16px] xl:text-lg">

              CAPS-REVIEW gives students a focused space to practice questions,
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

              {/* RIGHT PREVIEW - PHONE LIKE QUESTION CARD */}

              <div className="relative flex items-center justify-center">
                {/* Phone Frame */}
                <div
                  className="
                    relative
                    rounded-[48px]
                    border-[4px]
                    border-orange-200/40
                    bg-gradient-to-br
                    from-orange-100/40
                    via-white/10
                    to-orange-200/50
                    p-[6px]
                    shadow-[0_25px_60px_rgba(0,0,0,0.15),inset_0_1px_1px_rgba(255,255,255,.45)]
                    backdrop-blur-xl
                    transition-transform
                    duration-500
                    hover:-translate-y-2
                  "
                >
                  {/* Metallic shine on frame */}
                  <div className="pointer-events-none absolute inset-0 rounded-[48px] bg-gradient-to-br from-white/30 via-transparent to-orange-200/30" />

                  {/* Phone Screen */}
                  <div
                    className="
                      relative
                      overflow-hidden
                      rounded-[40px]
                      bg-gradient-to-br
                      from-slate-900
                      via-slate-800
                      to-slate-950
                      shadow-[inset_0_0_0_2px_rgba(255,255,255,.08)]
                      w-[320px]
                      max-w-full
                    "
                  >
                    {/* Dynamic Island */}
                    <div
                      className="
                        pointer-events-none
                        absolute
                        left-1/2
                        top-3
                        z-30
                        h-[28px]
                        w-[100px]
                        -translate-x-1/2
                        rounded-full
                        bg-black
                        shadow-[0_2px_8px_rgba(0,0,0,.7)]
                      "
                    >
                      <div className="absolute right-4 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-slate-700" />
                    </div>

                    {/* Screen Content - Question Card */}
                    <div className="p-5 pt-12">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-[15px] font-bold text-white">
                            Engineering Calculus 1
                          </h3>
                          <div className="mt-1 flex items-center gap-2 text-[11px] text-gray-400">
                            <span>📚 MATH111</span>
                            <span className="text-gray-600">·</span>
                            <span>General</span>
                            <span className="text-gray-600">·</span>
                            <span>1st Year</span>
                          </div>
                        </div>
                        <div className="rounded-full bg-orange-500/20 px-3 py-1 text-[10px] font-medium text-orange-400">
                          QUIZ
                        </div>
                      </div>

                      {/* Question Badge */}
                      <div className="mt-4 flex items-center gap-3">
                        <span className="rounded-full bg-orange-500/10 px-3 py-1 text-[11px] text-orange-400">
                          1. Multiple Choice
                        </span>
                        <span className="text-[11px] text-gray-500">•</span>
                        <span className="text-[11px] text-gray-400">Easy</span>
                        <span className="text-[11px] text-gray-500">•</span>
                        <span className="text-[11px] text-gray-400">Midterm</span>
                        <span className="ml-auto text-[11px] font-medium text-orange-400">
                          1 pt
                        </span>
                      </div>

                      {/* Question */}
                      <div className="mt-4 rounded-2xl bg-white/5 p-4 border border-white/10">
                        <p className="text-[14px] leading-relaxed text-gray-200">
                          What is the derivative of{" "}
                          <span className="font-mono text-orange-300">3x² + 5x - 7</span>?
                        </p>
                      </div>

                      {/* Options */}
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3 border border-white/5 hover:border-orange-500/30 transition cursor-pointer">
                          <span className="text-[13px] font-medium text-gray-400">A.</span>
                          <span className="text-[13px] text-gray-300">6x + 5</span>
                        </div>
                        <div className="flex items-center gap-3 rounded-xl bg-orange-500/10 p-3 border border-orange-500/30">
                          <span className="text-[13px] font-medium text-orange-400">B.</span>
                          <span className="text-[13px] text-white">6x - 5</span>
                          <span className="ml-auto text-[10px] text-orange-400">✓ Correct</span>
                        </div>
                        <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3 border border-white/5 hover:border-orange-500/30 transition cursor-pointer">
                          <span className="text-[13px] font-medium text-gray-400">C.</span>
                          <span className="text-[13px] text-gray-300">3x² + 5</span>
                        </div>
                        <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3 border border-white/5 hover:border-orange-500/30 transition cursor-pointer">
                          <span className="text-[13px] font-medium text-gray-400">D.</span>
                          <span className="text-[13px] text-gray-300">6x² + 5</span>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="mt-5 flex items-center justify-between">
                        <span className="text-[11px] text-gray-500">1 / 10 Questions</span>
                        <button className="rounded-full bg-orange-500 px-5 py-2 text-[12px] font-medium text-white shadow-[0_8px_25px_rgba(249,115,22,0.25)] hover:bg-orange-600 transition">
                          Next →
                        </button>
                      </div>
                    </div>

                    {/* Screen Glass Reflection */}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent rounded-[40px]" />

                    {/* Bottom Home Indicator */}
                    <div className="pointer-events-none absolute bottom-2 left-1/2 h-1 w-28 -translate-x-1/2 rounded-full bg-white/20" />
                  </div>
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
                alt="Get started with CAPS-REVIEW"
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
                      CAPS-REVIEW
                    </span>

                    <br />

                    and make your{" "}

                    <span className="bg-gradient-to-r from-orange-500 via-orange-400 to-orange-600 bg-clip-text text-transparent">
                      Exam Review Smarter
                    </span>

                  </h3>

                  <p className="outfit-400 mt-1 hidden text-gray-700 sm:block sm:text-[11px] md:mt-2 md:text-[13px] lg:mt-3 lg:text-[15px] xl:text-base">

                    Use CAPS-REVIEW to practice, review your lessons, and
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
              More CAPS-REVIEW Features to come!
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
                    alt="CAPS-REVIEW logo"
                    className="h-5 w-5"
                  />

                </div>

                <span className="outfit-700 text-base text-gray-900">
                  CAPS-REVIEW
                </span>

                <span className="text-[12px] text-gray-500">
                  <AppVersion />
                </span>

              </div>

              <p className="outfit-400 max-w-sm text-xs text-gray-600 md:text-sm">

                CAPS-REVIEW is a smart assessment and exam review platform designed
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
                      href="/team-caps"
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
                © 2025 CAPS-REVIEW – Comprehensive Assessment and Preparation System.
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