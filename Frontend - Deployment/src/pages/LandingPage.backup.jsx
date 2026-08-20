
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import collegeLogo from "../assets/college-logo.png";
import heroImg from "../assets/landing/firstpic.png";
import MobileheroImg from "../assets/landing/secondpic.png";
import CogIcon from "../assets/landing/cog.svg";
import ExportIcon from "../assets/landing/export.svg";
import APlusIcon from "../assets/landing/a+.svg";
import RightDisplay from "../assets/landing/rtp.png";
import GetStarted from "../assets/landing/getstarted.png";
import RizalBg from "../assets/landing/rizal-bg.webp";
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
    const sync = () => setHasDeferredPrompt(!!getDeferredInstallPrompt());
    window.addEventListener("pwa-deferred-ready", sync);
    sync();
    return () => window.removeEventListener("pwa-deferred-ready", sync);
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
      "Chrome hasn’t fired the install prompt yet.\n\n" +
        "Try: ⋮ menu → Save and share → Install REVA JRMSU (or Install page).\n\n" +
        "If that’s missing: DevTools → Application → Manifest (fix any errors), " +
        "then hard refresh (Ctrl+Shift+R). Use Chrome or Edge on HTTPS.",
    );
  };

  return (
    <>
      <div className="flex min-h-screen flex-col items-center justify-center bg-white pt-8">
        {/* Top Navigation */}
        {/* Sidebar Overlay */}
        {isSidebarOpen && (
          <div
            className="lightbox-bg fixed inset-0 z-[103] md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
        )}

        {/* Sidebar */}
        <div
          className={`fixed top-0 right-0 z-[104] h-screen w-64 bg-white shadow-xl transition-transform duration-300 ease-in-out md:hidden ${
            isSidebarOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex h-full flex-col p-6">
            {/* Close Button */}
            <div className="mb-8 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img src={collegeLogo} alt="REVA logo" className="h-6 w-6" />
                <span className="outfit-500 text-[20px] tracking-wide">
                  REVA
                </span>
              </div>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="relative h-8 w-8"
                aria-label="Close menu"
              >
                <span className="absolute top-1/2 left-1/2 h-0.5 w-5 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-gray-700"></span>
                <span className="absolute top-1/2 left-1/2 h-0.5 w-5 -translate-x-1/2 -translate-y-1/2 -rotate-45 bg-gray-700"></span>
              </button>
            </div>

            {/* Navigation Links */}
            <nav className="flex flex-col gap-6">
              <a
                onClick={() => {
                  alert("Application is coming soon");
                  setIsSidebarOpen(false);
                }}
                className="cursor-pointer text-[14px] font-medium text-gray-700 hover:text-gray-900"
              >
                Download
              </a>

              <a
                href="/team-REVA"
                onClick={() => setIsSidebarOpen(false)}
                className="text-[14px] font-medium text-gray-700 hover:text-gray-900"
              >
                Developers
              </a>

              <a
                href="https://docs.google.com/spreadsheets/d/1YzHRRk4Y_LSc9-fazPL4tDginLq_V1-6/edit?fbclid=IwY2xjawLBQ-5leHRuA2FlbQIxMABicmlkETFzMFZMckszUTBuMzFWYTIyAR7sVSVjXMwMZEQr9U0iCvDgzORURS9UFfOmPEEVEJxgxnAegPuUAeN99-GXBQ_aem_3VnqJNYrAHDz_RMtVx_Ssg&pli=1&gid=1756766640#gid=1756766640"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsSidebarOpen(false)}
                className="text-[14px] font-medium text-gray-700 hover:text-gray-900"
              >
                Feedback
              </a>
            </nav>
          </div>
        </div>

        {/* ========================= HERO SECTION ========================= */}
        <section className="relative isolate mx-auto mt-4 w-full max-w-[1450px] overflow-hidden rounded-[34px] border border-gray-300 bg-[#fffaf2] shadow-sm md:mt-6 md:rounded-[42px] lg:rounded-[50px]">
          {/* Background layers */}
          <div className="pointer-events-none absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-br from-[#fffaf2] via-[#fff9f0] to-[#fffdf9]" />
            <div className="absolute -bottom-44 -left-24 h-[620px] w-[720px] rounded-full bg-orange-200/35 blur-[120px]" />
            <div className="absolute -bottom-20 left-[34%] h-[380px] w-[520px] rounded-full bg-amber-100/45 blur-[110px]" />
            <div className="absolute top-[25%] right-[-12%] h-[520px] w-[520px] rounded-full bg-orange-100/30 blur-[130px]" />
          </div>

          {/* Rizal gold outline */}
          <img
            src={RizalBg}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute bottom-[-95px] left-[-75px] z-[1] h-[500px] w-auto select-none object-contain opacity-30 md:bottom-[-115px] md:left-[-90px] md:h-[610px] lg:bottom-[-135px] lg:left-[-110px] lg:h-[700px] xl:left-[-125px] xl:h-[760px]"
          />

          {/* Navigation */}
          <div className="relative z-30 flex items-center justify-between px-6 pt-5 md:px-10 md:pt-7 lg:px-12 xl:px-14">
            <div className="flex items-center gap-2">
              <img
                src={collegeLogo}
                alt="REVA logo"
                decoding="async"
                fetchPriority="low"
                className="h-7 w-7 md:h-8 md:w-8"
              />
              <span className="outfit-500 flex items-center gap-1.5 text-[20px] tracking-wide text-gray-900 md:text-[24px]">
                REVA
                <span className="rounded-md border border-orange-500 px-1.5 py-0.5 text-[9px] font-semibold tracking-widest text-orange-500 md:text-[11px]">
                  REVIEW
                </span>
              </span>
            </div>

            <nav className="outfit-500 hidden items-center gap-6 text-[14px] text-gray-700 md:flex lg:gap-8 lg:text-[16px]">
              <a
                onClick={() => alert("Application is coming soon")}
                className="cursor-pointer transition-colors hover:text-gray-900"
              >
                Download
              </a>
              <a
                href="/team-REVA"
                className="transition-colors hover:text-gray-900"
              >
                Developers
              </a>
              <a
                href="https://docs.google.com/spreadsheets/d/1YzHRRk4Y_LSc9-fazPL4tDginLq_V1-6/edit?fbclid=IwY2xjawLBQ-5leHRuA2FlbQIxMABicmlkETFzMFZMckszUTBuMzFWYTIyAR7sVSVjXMwMZEQr9U0iCvDgzORURS9UFfOmPEEVEJxgxnAegPuUAeN99-GXBQ_aem_3VnqJNYrAHDz_RMtVx_Ssg&pli=1&gid=1756766640#gid=1756766640"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-gray-900"
              >
                Feedback
              </a>
            </nav>

            <button
              onClick={() => setIsSidebarOpen(true)}
              className="flex flex-col gap-1.5 rounded-lg p-2 md:hidden"
              aria-label="Open menu"
            >
              <span className="h-0.5 w-6 bg-gray-700" />
              <span className="h-0.5 w-6 bg-gray-700" />
              <span className="h-0.5 w-6 bg-gray-700" />
            </button>
          </div>

          {/* Hero content */}
          <header className="relative z-10 mx-auto grid min-h-[650px] w-full max-w-[1380px] grid-cols-1 items-center px-6 pb-12 pt-12 md:min-h-[560px] md:grid-cols-[47%_53%] md:px-10 md:pb-14 md:pt-7 lg:min-h-[620px] lg:px-12 xl:min-h-[700px] xl:px-14">
            {/* Left side */}
            <div className="relative z-20 flex flex-col justify-center pt-6 text-center md:pt-0 md:text-left">
              <div className="mb-5 flex items-center justify-center gap-2 md:justify-start">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="outfit-500 text-[11px] tracking-wide text-gray-500 md:text-[12px]">
                  Trusted by students across JRMSU
                </span>
              </div>

              <h1 className="outfit-700 max-w-[650px] text-[39px] leading-[0.98] tracking-[-1.7px] text-[#172033] sm:text-[45px] md:text-[39px] lg:text-[50px] xl:text-[60px]">
                CREATE, ANSWER,
                <br />
                AND <span className="text-orange-500">REVIEW</span>
                <br />
                UNTIL IT STICKS
              </h1>

              <p className="outfit-400 mx-auto mt-5 max-w-[500px] text-[13px] leading-6 text-gray-600 md:mx-0 md:text-[14px] lg:text-[15px]">
                A collaborative platform to help students effectively
                <br className="hidden sm:block" />
                review, retain, and excel in every exam.
              </p>

              <div className="mt-7 flex flex-wrap items-center justify-center gap-4 md:justify-start lg:mt-8">
                <button
                  onClick={() => setIsLoginOpen(true)}
                  className="outfit-500 inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-orange-500 px-6 py-3 text-[12px] text-white shadow-md transition-all duration-200 hover:bg-orange-600 hover:shadow-lg focus:outline-none active:scale-95 lg:px-7 lg:py-3.5 lg:text-[13px]"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="19"
                    height="19"
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
                  className="outfit-500 inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-gray-400 bg-white/40 px-6 py-3 text-[12px] text-gray-800 transition-all duration-200 hover:bg-white hover:shadow-md focus:outline-none active:scale-95 lg:px-7 lg:py-3.5 lg:text-[13px]"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="19"
                    height="19"
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

            {/* Right side - phone / platform preview */}
            <div className="relative flex min-h-[410px] items-center justify-center md:min-h-[520px] md:justify-end">
              <div className="relative z-10 flex items-center justify-center md:-mr-16 lg:-mr-20 xl:-mr-24">
                <picture>
                  <source media="(min-width: 768px)" srcSet={heroImg} />
                  <img
                    src={MobileheroImg}
                    alt="REVA Review platform preview"
                    loading="eager"
                    decoding="async"
                    fetchPriority="high"
                    className="w-[410px] max-w-none object-contain sm:w-[450px] md:w-[550px] lg:w-[650px] xl:w-[720px]"
                  />
                </picture>
              </div>
            </div>
          </header>
        </section>
        {/* ======================= END HERO SECTION ======================= */}

        {/* Comprehensive Assessment and Preparation System Section */}
        <div className="z-101 w-full rounded-b-[35px] bg-white px-6 py-12 md:px-12 lg:max-w-[1650px] lg:px-16 xl:max-w-[1550px] xl:px-30">
          <div className="flex flex-col gap-6 text-center md:flex-row md:items-center md:justify-between md:text-left">
            {/* Title Section - Left */}
            <div className="flex-1">
              <h2 className="outfit-500 text-[24px] leading-tight font-semibold md:text-[25px] lg:text-[33px] xl:text-[45px]">
                <span className="text-gray-800">Comprehensive Assessment</span>
                <br />
                <span className="text-gray-800"> and Preparation System</span>
              </h2>
            </div>

            {/* Description Section - Right */}
            <div className="flex-1 xl:max-w-md">
              <p className="outfit-400 mx-auto max-w-sm text-[14px] text-gray-700 md:mx-0 md:max-w-none lg:text-[16px] xl:text-[18px]">
                An innovative web-based examination system proudly developed and
                powered by the JRMSU College of Engineering.
              </p>
            </div>
          </div>

          {/* Horizontal Line Separator */}
          <div className="mt-10 h-px w-full bg-gradient-to-r from-transparent from-5% via-gray-300 via-50% to-transparent to-95%"></div>

          {/* System Features Section */}
          <div className="mt-12 text-center">
            {/* System Features Callout */}
            <div className="mb-4">
              <span className="outfit-500 text-orange-500 md:text-[18px] lg:text-lg">
                [ System Features ]
              </span>
            </div>

            {/* Main Heading */}
            <h3 className="outfit-700 mt-8 text-black md:mt-12 md:text-4xl lg:text-[24px] xl:text-3xl">
              Discover the key features
            </h3>

            {/* Descriptive Paragraph */}
            <p className="outfit-400 mx-auto mt-8 max-w-2xl text-[14px] text-gray-700 lg:text-[16px] xl:text-lg">
              Experience the power of smart technology through a reliable and
              high-performing platform engineered to help students practice
              effectively, analyze their progress, and continuously improve
              their exam readiness.
            </p>
          </div>

          <div className="outfit-400 mb-16 px-8">
            {/* Feature Cards Section */}
            <div className="mt-26 grid grid-cols-1 gap-20 md:grid-cols-3">
              {/* Exam Creation Feature */}
              <div className="flex flex-col items-start">
                <div className="mb-4 flex items-center justify-center rounded-lg bg-white">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-newspaper-icon lucide-newspaper"
                  >
                    <path d="M15 18h-5" />
                    <path d="M18 14h-8" />
                    <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-4 0v-9a2 2 0 0 1 2-2h2" />
                    <rect width="8" height="4" x="10" y="6" rx="1" />
                  </svg>
                </div>
                <h4 className="outfit-700 mb-2 font-bold text-black lg:text-[16px] xl:text-xl">
                  Quiz Creation
                </h4>
                <p className="text-gray-700 md:text-[14px] lg:text-base">
                  Easily create quizzes or exams, share knowledge, and empower
                  students to excel in every exam.
                </p>
              </div>

              {/* Answer Questions Feature */}
              <div className="flex flex-col items-start">
                <div className="mb-4 flex items-center justify-center rounded-lg bg-white">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-file-pen-line-icon lucide-file-pen-line"
                  >
                    <path d="M14.364 13.634a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506l4.013-4.009a1 1 0 0 0-3.004-3.004z" />
                    <path d="M14.487 7.858A1 1 0 0 1 14 7V2" />
                    <path d="M20 19.645V20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l2.516 2.516" />
                    <path d="M8 18h1" />
                  </svg>
                </div>
                <h4 className="outfit-700 mb-2 font-bold text-black lg:text-[16px] xl:text-xl">
                  Answer Questions
                </h4>
                <p className="text-gray-700 md:text-[14px] lg:text-base">
                  Test your knowledge by answering quizzes and track your
                  progress instantly.
                </p>
              </div>

              {/* Qualifying Exam Feature */}
              <div className="flex flex-col items-start">
                <div className="mb-4 flex items-center justify-center rounded-lg bg-white">
                  <img
                    src={APlusIcon}
                    alt="Settings"
                    loading="lazy"
                    decoding="async"
                    className="h-[34px] w-[34px] object-contain"
                  />
                </div>
                <h4 className="outfit-700 mb-2 font-bold text-black lg:text-[16px] xl:text-xl">
                  Qualifying Exam
                </h4>
                <p className="text-gray-700 md:text-[14px] lg:text-base">
                  Prepare for your qualifying exams with quizzes covering key
                  topics to build confidence and mastery.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Create Ready-to-Print Exams Section */}
        <div className="z-100 -mt-10 w-full max-w-[1550px] bg-gradient-to-b from-orange-200/28 via-orange-100/50 via-70% to-white to-100% py-15 md:px-12 lg:px-12 xl:px-6">
          <div className="mx-auto mt-4 w-full max-w-[1200px] px-6 md:mt-10 lg:-mt-10">
            <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2">
              {/* Left Section */}
              <div className="flex flex-col gap-6 text-center lg:text-left">
                {/* Main Heading */}
                <h2 className="outfit-500 mb-6 text-[28px] leading-tight text-black lg:text-[30px] xl:text-4xl">
                  Create <span className="text-orange-500">Ready-to-Print</span>{" "}
                  Quiz PDFs in One Click
                </h2>

                {/* Flexible Exam Creation Feature */}
                <div className="mb-4 flex items-start gap-6 text-left">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-white text-[#A96702] shadow-[-6px_10px_20px_rgba(0,0,0,0.12)] lg:size-14 xl:size-16">
                    <img
                      src={CogIcon}
                      alt="Settings"
                      loading="lazy"
                      decoding="async"
                      className="size-[24px] object-contain lg:size-[28px] xl:size-[34px]"
                    />
                  </div>
                  <div>
                    <h3 className="outfit-700 mb-2 text-black lg:text-[18px] xl:text-xl">
                      Flexible exam and quiz creation
                    </h3>
                    <p className="outfit-400 text-[13px] text-black lg:text-[14px] xl:text-base">
                      Everything you need to build and customize your worksheets
                      easily
                    </p>
                  </div>
                </div>

                {/* Quick Export Feature */}
                <div className="flex items-start gap-6 text-left">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-white text-[#A96702] shadow-[-6px_10px_20px_rgba(0,0,0,0.12)] lg:size-14 xl:size-16">
                    <img
                      src={ExportIcon}
                      alt="Settings"
                      loading="lazy"
                      decoding="async"
                      className="size-[24px] object-contain lg:size-[28px] xl:size-[34px]"
                    />
                  </div>
                  <div>
                    <h3 className="outfit-700 mb-2 font-bold text-black lg:text-[18px] xl:text-xl">
                      Quick Export
                    </h3>
                    <p className="outfit-400 text-[13px] text-black lg:text-[14px] xl:text-base">
                      Easily create your exam or quizzes and get a fully
                      formatted, print-ready version with just one click.
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Section - Ready-to-Print Preview */}
              <div className="relative flex items-center justify-center">
                <img
                  src={RightDisplay}
                  alt="Ready-to-print exam preview"
                  loading="lazy"
                  decoding="async"
                  className="w-full max-w-[500px] lg:-mb-20 lg:ml-18 lg:max-w-[650px]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Get Started Call-to-Action Section */}
        <div className="z-101 -mt-20 w-full max-w-[1450px] px-4 pb-16 md:-mt-16 md:px-12 lg:-mt-24 xl:-mt-38">
          <div className="mx-auto w-full md:max-w-[800px] lg:max-w-[1000px] xl:max-w-[1100px]">
            <div className="relative">
              <img
                src={GetStarted}
                alt="Get started with REVA"
                loading="lazy"
                decoding="async"
                className="w-full rounded-2xl"
              />

              <div className="absolute inset-0 flex items-center justify-end">
                <div className="w-[55%] pr-4 text-left text-white md:pr-8 lg:pr-12 xl:pr-16">
                  <h3 className="outfit-700 text-[12px] leading-tight sm:text-[16px] md:text-[20px] lg:text-[26px] xl:text-[30px]">
                    Ready? Start with{" "}
                    <span className="text-[rgb(124,75,0)]">REVA</span>
                    <br />
                    and Enjoy an{" "}
                    <span className="text-[rgb(124,75,0)]">
                      Amazing Experience
                    </span>
                  </h3>
                  <p className="outfit-400 mt-1 hidden text-white/90 sm:block sm:text-[11px] md:mt-2 md:text-[13px] lg:mt-3 lg:text-[15px] xl:text-base">
                    Start your journey with REVA and experience a smarter,
                    faster, and more organized way to handle exams.
                  </p>
                  <div className="mt-2 flex justify-start md:mt-4">
                    <button
                      onClick={() => setIsRegisterOpen(true)}
                      className="flex cursor-pointer items-center gap-1 rounded-full bg-[rgb(255,246,0)] px-3 py-1.5 text-[10px] font-semibold text-black shadow-md transition hover:bg-yellow-300 active:scale-95 sm:px-4 sm:py-2 sm:text-[12px] md:gap-2 md:px-5 md:py-2.5 md:text-[13px] lg:px-6 lg:py-3 lg:text-sm"
                    >
                      <span className="outfit-500">Get Started</span>
                      <i className="bx bx-arrow-right-stroke flex items-center justify-center text-[12px] md:text-[16px]"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* More Features Teaser Section */}
        <section className="w-full max-w-[1450px] bg-white px-6 pb-16">
          <div className="mx-auto w-full max-w-[900px] text-center">
            <h2 className="outfit-700 text-2xl text-black md:text-3xl lg:text-4xl xl:text-5xl">
              More Features to come!
            </h2>
            <p className="outfit-400 mt-4 text-sm text-gray-600 md:text-[14px] lg:text-base">
              Looks like you've reached the bottom. Time to head back up!
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-auto w-full border-t border-gray-200 bg-white/90 backdrop-blur-sm">
          <div className="mx-auto flex w-full max-w-[1450px] flex-col gap-6 px-6 py-8 text-sm text-gray-500 md:flex-row md:items-start md:justify-between">
            {/* Brand + Description */}
            <div className="flex flex-col items-start gap-3">
              <div className="flex items-center gap-2">
                <img src={collegeLogo} alt="REVA logo" className="h-6 w-6" />
                <span className="outfit-700 text-base text-gray-900">REVA</span>
                <span className="text-[12px] text-gray-500">
                  <AppVersion />{" "}
                </span>
              </div>
              <p className="outfit-400 max-w-sm text-xs md:text-sm">
                Comprehensive Assessment and Preparation System designed to help
                students and educators create, manage, and analyze exams with
                ease.
              </p>
            </div>

            {/* Footer Links */}
            <div className="grid grid-cols-2 gap-6 md:grid-cols-3 md:gap-10">
              <div>
                <h4 className="outfit-700 mb-2 text-xs tracking-wide text-gray-700 uppercase">
                  Product
                </h4>
                <ul className="space-y-1 text-xs md:text-sm">
                  <li>
                    <a
                      href="#features"
                      className="outfit-400 hover:text-gray-800"
                    >
                      Features
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://docs.google.com/spreadsheets/d/1YzHRRk4Y_LSc9-fazPL4tDginLq_V1-6/edit?fbclid=IwY2xjawLBQ-5leHRuA2FlbQIxMABicmlkETFzMFZMckszUTBuMzFWYTIyAR7sVSVjXMwMZEQr9U0iCvDgzORURS9UFfOmPEEVEJxgxnAegPuUAeN99-GXBQ_aem_3VnqJNYrAHDz_RMtVx_Ssg&pli=1&gid=1756766640#gid=1756766640"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="outfit-400 hover:text-gray-800"
                    >
                      Feedback
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="outfit-700 outfit-400 mb-2 text-xs tracking-wide text-gray-700 uppercase">
                  About
                </h4>
                <ul className="space-y-1 text-xs md:text-sm">
                  <li>
                    <a
                      href="/team-REVA"
                      className="outfit-400 hover:text-gray-800"
                    >
                      Developers
                    </a>
                  </li>
                  <li>
                    <a
                      href="#contact"
                      className="outfit-400 hover:text-gray-800"
                    >
                      Contact
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100">
            <div className="mx-auto flex w-full max-w-[1450px] flex-col items-center justify-between gap-2 px-6 py-4 text-[11px] text-gray-400 md:flex-row">
              <p className="outfit-400">
                © 2025 REVA – Comprehensive Assessment and Preparation System.
              </p>
              <p className="outfit-400">
                Powered by JRMSU College of Engineering
              </p>
            </div>
          </div>
        </footer>
      </div>

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
          window.history.replaceState({}, "", window.location.pathname);
        }}
        onSwitchToLogin={() => {
          setIsResetPasswordOpen(false);
          window.history.replaceState({}, "", window.location.pathname);
          setIsLoginOpen(true);
        }}
      />
      <ResetUserCodeModal
        isOpen={isResetUserCodeOpen}
        onClose={() => {
          setIsResetUserCodeOpen(false);
          window.history.replaceState({}, "", window.location.pathname);
        }}
        onSwitchToLogin={() => {
          setIsResetUserCodeOpen(false);
          window.history.replaceState({}, "", window.location.pathname);
          setIsLoginOpen(true);
        }}
      />

      <LoadingOverlay show={isAutoLoggingIn} message="Logging in..." />
    </>
  );
}

export default LandingPage;