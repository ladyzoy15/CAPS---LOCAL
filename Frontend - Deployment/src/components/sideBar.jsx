import { useEffect, useState, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AllSubjectsDropDownProgramChair from "./subjectsProgramChair";
import AssignedSubjectsDropDown from "./subjectsFaculty";
import PrintExamModal from "./PrintExamModal";
import { logoutUser } from "../utils/logoutUser";
import useToast from "../hooks/useToast";
import Toast from "./Toast";
import CollegeLogo from "/src/assets/college-logo.png";
import AppVersion from "./appVersion";
import ProfileModalsHost from "./ProfileModalsHost";
import { useUserProfile } from "../hooks/useUserProfile";

import DashboardIcon from "/src/assets/symbols/dashboard.svg";
import DashboardIconH from "/src/assets/symbols/dashboardhover.svg";
import DashboardIconW from "/src/assets/symbols/dashboard-white.svg";

import LibrariesIcon from "/src/assets/symbols/libraries.svg";
import LibrariesIconH from "/src/assets/symbols/librarieshover.svg";

import ClassIcon from "/src/assets/symbols/class.svg";
import ClassIconH from "/src/assets/symbols/classhover.svg";

import UsersIcon from "/src/assets/symbols/users.svg";
import UsersIconH from "/src/assets/symbols/usershove.svg";

import PrintIcon from "/src/assets/symbols/print.svg";
import PrintIconH from "/src/assets/symbols/printhover.svg";

import SessionsIcon from "/src/assets/symbols/sessions.svg";
import SessionsIconH from "/src/assets/symbols/sessionshover.svg";

import ReportsIcon from "/src/assets/symbols/reports.svg";
import ReportsIconH from "/src/assets/symbols/reportshover.svg";

import SupportIcon from "/src/assets/symbols/support.svg";
import SupportIconH from "/src/assets/symbols/supporthover.svg";

import SubjectsIcon from "/src/assets/symbols/subjects.svg";
import SubjectsIconH from "/src/assets/symbols/subjectshover.svg";

const getRoleName = (roleId) => {
  switch (Number(roleId)) {
    case 1:
      return "Student";
    case 2:
      return "Faculty";
    case 3:
      return "Program Chair";
    case 4:
      return "Dean";
    case 5:
      return "Associate Dean";
    default:
      return "";
  }
};

const Sidebar = ({
  role_id,
  setSelectedSubject,
  isExpanded,
  setIsExpanded,
  selectedSubject,
  isSubjectExpanded,
  setIsSubjectExpanded,
}) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1025);
  const [isSubjectFocused, setIsSubjectFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const profile = useUserProfile();

  const {
    userInfo,
    avatarColor,
    showProfileModal,
    setShowProfileModal,
    showChangePassword,
    clearUserAvatarColor,
  } = profile;

  const [isDarkMode, setIsDarkMode] = useState(
    () => localStorage.getItem("theme") === "dark",
  );

  const [isCollapsed, setIsCollapsed] = useState(
    () => localStorage.getItem("sidebar_collapsed") === "true",
  );

  const sidebarRef = useRef(null);
  const userDropdownRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();

  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const { toast, showToast } = useToast();

  const handleMouseMove = (e) => {
    const rect = sidebarRef.current?.getBoundingClientRect();
    if (!rect) return;
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");
    window.dispatchEvent(new Event("themechange"));
  }, [isDarkMode]);

  useEffect(() => {
    const handler = () => {
      setIsDarkMode(
        document.documentElement.classList.contains("dark"),
      );
    };

    window.addEventListener("themechange", handler);

    return () => {
      window.removeEventListener("themechange", handler);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "sidebar_collapsed",
      isCollapsed ? "true" : "false",
    );
  }, [isCollapsed]);

  const isUsersPage = isCollapsed;

  useEffect(() => {
    setIsLoading(true);

    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [location]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1025);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target)
      ) {
        setUserDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);

    const token = sessionStorage.getItem("token");

    try {
      await fetch(`${apiUrl}/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      // Ignore network/backend errors.
    } finally {
      clearUserAvatarColor();
      logoutUser(showToast, navigate);
      setIsLoggingOut(false);
      setShowLogoutModal(false);
    }
  };

  const getDisplayName = () => {
    if (!userInfo?.fullName) return "Loading...";

    const parts = userInfo.fullName.trim().split(/\s+/);

    const firstName = parts[0];

    let lastInitial = "";

    if (parts.length > 1) {
      lastInitial = parts[parts.length - 1][0];
    }

    return `${firstName} ${lastInitial}.`;
  };

  useEffect(() => {
    if (showProfileModal || showChangePassword) {
      setUserDropdownOpen(false);
    }
  }, [showProfileModal, showChangePassword]);

  const parsedRoleId = Number(role_id);

  const homePath =
    parsedRoleId === 1
      ? "/student-dashboard"
      : parsedRoleId === 2
        ? "/faculty-dashboard"
        : parsedRoleId === 3
          ? "/program-chair-dashboard"
          : parsedRoleId === 4
            ? "/dean-dashboard"
            : parsedRoleId === 5
              ? "/asso-dean-dashboard"
              : "/";

  const baseMenuItems = [
    {
      icon: parsedRoleId === 1 ? "bx-file-detail" : "bx-home-alt-3",
      label: parsedRoleId === 1 ? "Exams" : "Home",
      path: homePath,
    },
  ];

  const librariesItem = {
    label: "Quizzes",
    path: "/libraries",
  };

  const sessionsItem = {
    label: "Sessions",
    path: "/sessions",
  };

  const classItem = {
    label: "Classes",
    path: "/class",
  };

  const adminItems = [
    {
      icon: "bx-group",
      label: "Users",
      path: "/users",
    },
  ];

  const classes = [
    {
      icon: "bx-book-bookmark",
      label: "Subjects",
    },
  ];

  let menuItems = [];

  if (parsedRoleId === 1) {
    menuItems = [
      ...baseMenuItems,
      classItem,
      sessionsItem,
    ];
  } else {
    menuItems = [...baseMenuItems];

    if (parsedRoleId >= 2) {
      menuItems = [
        ...menuItems,
        librariesItem,
        sessionsItem,
        classItem,
        ...adminItems,
      ];
    }
  }

  const printButton = {
    icon: "bx-printer",
    label: "Export",
    onClick: () => setShowPrintModal(true),
    isButton: true,
  };

  const isActive = (path) => {
    if (path === "/class") {
      return (
        location.pathname === "/class" ||
        location.pathname === "/archived-class" ||
        location.pathname.startsWith("/class/")
      );
    }

    if (path === "/libraries") {
      return (
        location.pathname === "/libraries" ||
        location.pathname === "/archived-quiz"
      );
    }

    return location.pathname === path;
  };

  const handleMenuClick = () => {
    setIsSubjectFocused(false);
    setIsSubjectExpanded(false);
    setSelectedSubject(null);
    setActiveMenu(null);
  };

  const handleSupportClick = () => {
    window.open(
      "https://docs.google.com/spreadsheets/d/1YzHRRk4Y_LSc9-fazPL4tDginLq_V1-6/edit?fbclid=IwY2xjawLBQ-5leHRuA2FlbQIxMABicmlkETFzMFZMckszUTBuMzFWYTIyAR7sVSVjXMwMZEQr9U0iCvDgzORURS9UFfOmPEEVEJxgxnAegPuUAeN99-GXBQ_aem_3VnqJNYrAHDz_RMtVx_Ssg&pli=1&gid=1756766640#gid=1756766640",
      "_blank",
    );
  };

  // =========================================================
  // MOBILE BOTTOM NAVIGATION
  // =========================================================

  if (isMobile) {
    const homeItem = menuItems.find(
      (item) =>
        item.label === "Home" ||
        item.label === "Exams",
    );

    return (
      <>
        <div
          id="mobile-bottom-nav"
          className="fixed right-0 bottom-0 left-0 z-50 flex justify-center pb-4"
        >
          <div className="border-color mx-4 w-full max-w-md rounded-2xl border border-gray-200 bg-white px-4 py-2 shadow-lg min-[500px]:px-6">
            <div
              className={
                parsedRoleId === 1
                  ? "flex items-center justify-evenly"
                  : "flex items-center justify-between gap-8"
              }
            >
              {parsedRoleId === 1 ? (
                <>
                  <div className="flex h-16 flex-col items-center justify-center">
                    <Link
                      to="/sessions"
                      onClick={handleMenuClick}
                      className={`flex flex-col items-center transition-colors ${
                        isActive("/sessions")
                          ? "text-orange-600"
                          : "text-amber-700 hover:text-amber-900"
                      }`}
                    >
                      <span className="mb-1 flex h-6 w-6 items-center justify-center">
                        <img
                          src={
                            isActive("/sessions")
                              ? SessionsIconH
                              : SessionsIcon
                          }
                          alt="Sessions"
                          className="h-6 w-6 object-contain"
                        />
                      </span>

                      <span className="outfit-500 text-xs">
                        Sessions
                      </span>
                    </Link>
                  </div>

                  {homeItem && (
                    <div className="flex h-16 flex-col items-center justify-center">
                      <Link
                        to={homeItem.path}
                        onClick={handleMenuClick}
                        className="flex flex-col items-center"
                      >
                        <span className="mb-1 flex items-center justify-center">
                          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 text-white shadow-lg">
                            <i className="bx bx-file-detail text-[20px]"></i>
                          </span>
                        </span>

                        <span
                          className={`outfit-500 text-xs ${
                            isActive(homeItem.path)
                              ? "text-amber-950"
                              : "text-amber-700"
                          }`}
                        >
                          {homeItem.label}
                        </span>
                      </Link>
                    </div>
                  )}

                  <div className="flex h-16 flex-col items-center justify-center">
                    <Link
                      to="/class"
                      onClick={handleMenuClick}
                      className={`flex flex-col items-center transition-colors ${
                        isActive("/class")
                          ? "text-amber-950"
                          : "text-amber-700 hover:text-amber-900"
                      }`}
                    >
                      <span className="mb-1 flex h-6 w-6 items-center justify-center">
                        <img
                          src={
                            isActive("/class")
                              ? ClassIconH
                              : ClassIcon
                          }
                          alt="Classes"
                          className="h-6 w-6 object-contain"
                        />
                      </span>

                      <span className="outfit-500 text-xs">
                        Classes
                      </span>
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex h-16 flex-1 flex-col items-center justify-center">
                    <Link
                      to="/libraries"
                      onClick={handleMenuClick}
                      className={`flex flex-col items-center transition-colors ${
                        isActive("/libraries")
                          ? "text-amber-950"
                          : "text-amber-700 hover:text-amber-900"
                      }`}
                    >
                      <span className="mb-1 flex h-6 w-6 items-center justify-center">
                        <img
                          src={
                            isActive("/libraries")
                              ? LibrariesIconH
                              : LibrariesIcon
                          }
                          alt="Quizzes"
                          className="h-6 w-6 object-contain"
                        />
                      </span>

                      <span className="outfit-500 text-xs">
                        Quizzes
                      </span>
                    </Link>
                  </div>

                  <div className="flex h-16 flex-1 flex-col items-center justify-center">
                    <Link
                      to="/class"
                      onClick={handleMenuClick}
                      className={`flex flex-col items-center transition-colors ${
                        isActive("/class")
                          ? "text-amber-950"
                          : "text-amber-700 hover:text-amber-900"
                      }`}
                    >
                      <span className="mb-1 flex h-6 w-6 items-center justify-center">
                        <img
                          src={
                            isActive("/class")
                              ? ClassIconH
                              : ClassIcon
                          }
                          alt="Classes"
                          className="h-6 w-6 object-contain"
                        />
                      </span>

                      <span className="outfit-500 text-xs">
                        Classes
                      </span>
                    </Link>
                  </div>

                  {homeItem && (
                    <div className="flex h-16 flex-1 flex-col items-center justify-center">
                      <Link
                        to={homeItem.path}
                        onClick={handleMenuClick}
                        className="flex flex-col items-center"
                      >
                        <span className="mb-1 flex items-center justify-center">
                          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 shadow-lg">
                            <img
                              src={DashboardIconW}
                              alt="Dashboard"
                              className="h-5 w-5 object-contain"
                            />
                          </span>
                        </span>

                        <span
                          className={`outfit-500 text-xs ${
                            isActive(homeItem.path)
                              ? "text-amber-950"
                              : "text-amber-700"
                          }`}
                        >
                          {homeItem.label}
                        </span>
                      </Link>
                    </div>
                  )}

                  {parsedRoleId >= 2 && (
                    <div className="flex h-16 flex-1 flex-col items-center justify-center">
                      <Link
                        to="/users"
                        onClick={handleMenuClick}
                        className={`flex flex-col items-center transition-colors ${
                          isActive("/users")
                            ? "text-amber-950"
                            : "text-amber-700 hover:text-amber-900"
                        }`}
                      >
                        <span className="mb-1 flex h-6 w-6 items-center justify-center">
                          <img
                            src={
                              isActive("/users")
                                ? UsersIconH
                                : UsersIcon
                            }
                            alt="Users"
                            className="h-6 w-6 object-contain"
                          />
                        </span>

                        <span className="outfit-500 text-xs">
                          Users
                        </span>
                      </Link>
                    </div>
                  )}

                  {parsedRoleId >= 2 && (
                    <div className="flex h-16 flex-1 flex-col items-center justify-center">
                      <Link
                        to={
                          parsedRoleId === 2
                            ? "/faculty/subjects"
                            : parsedRoleId === 3
                              ? "/program-chair/subjects"
                              : parsedRoleId === 4
                                ? "/dean/subjects"
                                : "/asso-dean/subjects"
                        }
                        onClick={() => {
                          handleMenuClick();
                          setIsSubjectFocused(false);
                          setIsSubjectExpanded(false);
                        }}
                        className={`flex flex-col items-center transition-colors ${
                          isActive(
                            parsedRoleId === 2
                              ? "/faculty/subjects"
                              : parsedRoleId === 3
                                ? "/program-chair/subjects"
                                : parsedRoleId === 4
                                  ? "/dean/subjects"
                                  : "/asso-dean/subjects",
                          )
                            ? "text-amber-950"
                            : "text-amber-700 hover:text-amber-900"
                        }`}
                      >
                        <span className="mb-1 flex h-6 w-6 items-center justify-center">
                          <img
                            src={
                              isActive(
                                parsedRoleId === 2
                                  ? "/faculty/subjects"
                                  : parsedRoleId === 3
                                    ? "/program-chair/subjects"
                                    : parsedRoleId === 4
                                      ? "/dean/subjects"
                                      : "/asso-dean/subjects",
                              )
                                ? SubjectsIconH
                                : SubjectsIcon
                            }
                            alt="Subjects"
                            className="h-6 w-6 object-contain"
                          />
                        </span>

                        <span className="outfit-500 text-xs">
                          Subjects
                        </span>
                      </Link>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <PrintExamModal
          isOpen={showPrintModal === true}
          onClose={() => setShowPrintModal(false)}
        />
      </>
    );
  }

  // =========================================================
  // DESKTOP SIDEBAR
  // =========================================================

  return (
    <>
      <div
        ref={sidebarRef}
        onMouseMove={handleMouseMove}
        className={`fixed top-0 left-0 z-55 h-[100vh] overflow-visible border-r border-white-300/20 bg-[linear-gradient(180deg,rgba(255,236,213,0.95)_0%,rgba(206, 188, 167, 0.92)_52%,rgba(255,220,180,0.95)_100%)] shadow-[12px_0_40px_rgba(217,119,6,0.6),inset_-1px_0_0_rgba(255,200,100,0.15)] backdrop-blur-[26px] backdrop-saturate-150 transition-all duration-300 ease-in-out ${
          isUsersPage ? "w-[63px]" : "w-[220px]"
        }`}
      >
        {/* SUBTLE BACKGROUND BLOBS + MOUSE-FOLLOW GLOW */}
        <div className="pointer-events-none absolute inset-0 z-0 overflow-visible">
          <div className="absolute -top-16 -left-16 h-56 w-56 rounded-full bg-orange-200/50 blur-3xl" />
          <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-orange-200/50 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-orange-200/50 blur-3xl" />
          <div className="absolute -bottom-16 -right-16 h-56 w-56 rounded-full bg-orange-200/50 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-100/40 blur-3xl" />

          <div
            className="pointer-events-none absolute h-4 w-4 rounded-full bg-orange-500/100 blur-md transition-transform duration-75 ease-out"
            style={{
              transform: `translate(${mousePos.x - 8}px, ${mousePos.y - 8}px)`,
            }}
          />
        </div>

        {/* COLLAPSE BUTTON */}
        <button
          onClick={() => setIsCollapsed((prev) => !prev)}
          className="absolute -right-3 top-20 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-amber-400/50 bg-amber-950/90 text-amber-300 shadow-[0_2px_10px_rgba(0,0,0,0.4)] backdrop-blur-md transition hover:bg-amber-800 hover:text-amber-100"
        >
          <i
            className={`bx ${
              isCollapsed
                ? "bx-chevron-right"
                : "bx-chevron-left"
            } text-[16px]`}
          ></i>
        </button>

        {/* USER PROFILE */}
        <div
          className="relative z-10 px-3 pt-3"
          ref={userDropdownRef}
        >
          <div
            onClick={() =>
              setUserDropdownOpen(!userDropdownOpen)
            }
            className={`outfit-500 group flex w-full cursor-pointer items-center rounded-[8px] transition-colors ${
              isUsersPage
                ? "justify-center px-2 py-1"
                : "gap-3 border border-amber-400/30 bg-[linear-gradient(135deg,rgba(255,180,90,0.25),rgba(230,150,60,0.18))] px-2 py-2.5 shadow-[0_4px_16px_rgba(90,60,10,0.15)] backdrop-blur-xl hover:bg-amber-300/20"
            }`}
          >
            <div className="relative">
              <div
                className={`flex size-9 items-center justify-center rounded-full ${
                  userInfo
                    ? avatarColor
                    : "bg-amber-500"
                } font-bold text-white`}
              >
                {userInfo?.fullName ? (
                  (() => {
                    const parts = userInfo.fullName
                      .trim()
                      .split(" ");

                    const firstInitial =
                      parts[0]?.[0] || "";

                    const lastInitial =
                      parts.length > 1
                        ? parts[parts.length - 1][0]
                        : "";

                    return (
                      firstInitial + lastInitial
                    ).toUpperCase();
                  })()
                ) : (
                  <span className="inline-block size-8 animate-pulse rounded-full bg-amber-300"></span>
                )}
              </div>
            </div>

            {!isUsersPage && (
              <div className="flex flex-1 flex-col">
                <span className="text-sm font-bold text-amber-950">
                  {getDisplayName()}
                </span>

                <span className="text-xs font-normal text-amber-800">
                  {getRoleName(role_id)}
                </span>
              </div>
            )}

            {!isUsersPage && (
              <i
                className={`bx shadow-s flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md border border-amber-900/10 bg-amber-50/70 text-[23px] leading-none text-amber-700/90 ${
                  userDropdownOpen
                    ? "bx-chevron-left"
                    : "bx-chevron-right"
                }`}
              ></i>
            )}
          </div>

          {/* USER DROPDOWN */}
          {userDropdownOpen && (
            <div className="outfit-400 fade-in absolute top-2 left-full z-50 ml-2 w-60 rounded-md border border-amber-200 bg-white p-1 shadow-lg">
              <div className="flex items-center gap-3 border-amber-100 px-2 py-3">
                <div
                  className={`flex h-8 w-10 items-center justify-center rounded-full ${
                    userInfo
                      ? avatarColor
                      : "bg-amber-500"
                  } text-sm font-bold text-white`}
                >
                  {userInfo?.fullName ? (
                    (() => {
                      const parts = userInfo.fullName
                        .trim()
                        .split(" ");

                      const firstInitial =
                        parts[0]?.[0] || "";

                      const lastInitial =
                        parts.length > 1
                          ? parts[parts.length - 1][0]
                          : "";

                      return (
                        firstInitial + lastInitial
                      ).toUpperCase();
                    })()
                  ) : (
                    <span className="inline-block size-8 animate-pulse rounded-full bg-amber-200"></span>
                  )}
                </div>

                <div className="flex w-full flex-col overflow-visible text-sm">
                  <span className="overflow-visible font-semibold text-ellipsis whitespace-nowrap text-amber-950">
                    {userInfo?.fullName ? (
                      userInfo.fullName
                    ) : (
                      <span className="inline-block h-4 w-24 animate-pulse rounded bg-amber-100"></span>
                    )}
                  </span>

                  <span className="overflow-visible text-xs text-ellipsis whitespace-nowrap text-amber-700/70">
                    {userInfo?.email ? (
                      userInfo.email
                    ) : (
                      <span className="inline-block h-3 w-32 animate-pulse rounded bg-amber-100"></span>
                    )}
                  </span>
                </div>
              </div>

              <div className="mx-1 h-[1px] bg-amber-100" />

              <button
                onClick={() => {
                  setUserDropdownOpen(false);
                  setShowProfileModal(true);
                }}
                className="mt-1 flex w-full cursor-pointer items-center justify-start rounded-sm px-4 py-3 text-left text-[14px] text-amber-950 transition duration-200 ease-in-out hover:bg-amber-100"
              >
                <i className="bx bx-user mr-2 text-[16px]"></i>
                Profile
              </button>

              <button
                onClick={() => {
                  alert("Dark Mode is coming soon");
                }}
                className="flex w-full cursor-pointer items-center justify-start rounded-sm px-4 py-3 text-left text-[14px] text-amber-950 transition duration-200 ease-in-out hover:bg-amber-100"
              >
                <i
                  className={`bx ${
                    isDarkMode
                      ? "bx-sun"
                      : "bx-moon"
                  } mr-2 text-[16px]`}
                ></i>
                Dark Mode
              </button>

              <button
                onClick={() =>
                  setShowLogoutModal(true)
                }
                className="flex w-full cursor-pointer items-center justify-start rounded-sm px-4 py-3 text-left text-[14px] text-amber-950 transition duration-200 ease-in-out hover:bg-amber-100"
              >
                <i className="bx bx-arrow-out-right-square-half mr-2 text-[16px]"></i>

                {isLoggingOut ? (
                  <div className="flex items-center justify-center">
                    <span>Logging out...</span>
                  </div>
                ) : (
                  "Log out"
                )}
              </button>
            </div>
          )}

          <div className="mt-2 mb-4 h-px w-full bg-amber-700/20"></div>

          {!isUsersPage && (
            <div className="outfit-500 px-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-800/80">
              MAIN
            </div>
          )}
        </div>

        {/* =========================================================
            MAIN MENU
        ========================================================= */}

        <ul className="relative z-10 mt-2 mb-3 space-y-[5px] px-0">
          {menuItems.map((item, index) => {
            const routeActive =
              item.path &&
              typeof item.path === "string"
                ? isActive(item.path)
                : false;

            const isItemActive =
              activeMenu != null
                ? activeMenu === item.label
                : routeActive;

            return (
              <li
                key={index}
                className="group relative"
              >
                <span
                  className={`absolute top-1/2 left-0 h-6 w-[5px] -translate-y-1/2 rounded-tr-lg rounded-br-lg transition-colors ${
                    isItemActive
                      ? "bg-amber-600"
                      : "bg-transparent"
                  }`}
                ></span>

                <div className="px-3">
                  <Link
                    to={item.path}
                    onClick={handleMenuClick}
                    className={`group flex cursor-pointer items-center rounded-lg transition-colors hover:bg-amber-900/10 ${
                      isUsersPage
                        ? "justify-center py-[10px]"
                        : "justify-start py-[6px]"
                    } ${
                      isItemActive
                        ? "bg-amber-900/10 text-amber-950 shadow-[inset_0_0_0_1px_rgba(120,53,15,0.15)]"
                        : "text-amber-700 hover:text-amber-900"
                    }`}
                  >
                    <div
                      className={`flex items-center ${
                        isUsersPage
                          ? "justify-center"
                          : "ml-3 gap-3"
                      }`}
                    >
                      {/* HOME */}
                      {item.label === "Home" ? (
                        <span className="outfit-500 relative flex-shrink-0">
                          <img
                            src={
                              isItemActive
                                ? DashboardIconH
                                : DashboardIcon
                            }
                            alt="Dashboard"
                            className={`icon-orange-tint ${
                              isUsersPage
                                ? "size-[20px]"
                                : "size-[18px]"
                            } flex-shrink-0`}
                          />
                        </span>

                      /* EXAMS */
                      ) : item.label === "Exams" ? (
                        <i
                          className={`bx bx-file-detail flex-shrink-0 text-amber-700 ${
                            isUsersPage
                              ? "text-[20px]"
                              : "text-[18px]"
                          }`}
                        ></i>

                      /* QUIZZES */
                      ) : item.label === "Quizzes" ? (
                        <span className="outfit-500 relative flex-shrink-0">
                          <img
                            src={
                              isItemActive
                                ? LibrariesIconH
                                : LibrariesIcon
                            }
                            alt="Library"
                            className={`icon-orange-tint ${
                              isUsersPage
                                ? "size-[20px]"
                                : "size-[18px]"
                            } flex-shrink-0`}
                          />
                        </span>

                      /* SESSIONS */
                      ) : item.label === "Sessions" ? (
                        <span className="outfit-500 relative flex-shrink-0">
                          <img
                            src={
                              isItemActive
                                ? SessionsIconH
                                : SessionsIcon
                            }
                            alt="Sessions"
                            className={`icon-orange-tint ${
                              isUsersPage
                                ? "size-[20px]"
                                : "size-[18px]"
                            } flex-shrink-0`}
                          />
                        </span>

                      /* USERS */
                      ) : item.label === "Users" ? (
                        <span className="relative flex-shrink-0">
                          <img
                            src={
                              isItemActive
                                ? UsersIconH
                                : UsersIcon
                            }
                            alt="Users"
                            className={`icon-orange-tint ${
                              isUsersPage
                                ? "size-[20px]"
                                : "size-[18px]"
                            } flex-shrink-0`}
                          />
                        </span>

                      /* CLASSES */
                      ) : item.label === "Classes" ? (
                        <span className="relative flex-shrink-0">
                          <img
                            src={
                              isItemActive
                                ? ClassIconH
                                : ClassIcon
                            }
                            alt="Class"
                            className={`icon-orange-tint ${
                              isUsersPage
                                ? "size-[20px]"
                                : "size-[18px]"
                            } flex-shrink-0`}
                          />
                        </span>

                      /* SUBJECTS */
                      ) : item.label === "Subjects" ? (
                        <span className="relative flex-shrink-0">
                          <img
                            src={
                              isItemActive
                                ? SubjectsIconH
                                : SubjectsIcon
                            }
                            alt="Subjects"
                            className={`icon-orange-tint ${
                              isUsersPage
                                ? "size-[20px]"
                                : "size-[18px]"
                            } flex-shrink-0`}
                          />
                        </span>

                      /* DEFAULT ICON */
                      ) : (
                        <i
                          className={`bx ${item.icon} flex-shrink-0 text-amber-700 ${
                            isUsersPage
                              ? "text-[20px]"
                              : "text-[18px]"
                          }`}
                        ></i>
                      )}

                      {!isUsersPage && (
                        <span
                          className={`outfit-500 text-[15px] whitespace-nowrap ${
                            isItemActive
                              ? "font-semibold text-amber-950"
                              : "text-amber-700 hover:text-amber-900"
                          }`}
                        >
                          {item.label}
                        </span>
                      )}
                    </div>
                  </Link>

                  {isUsersPage && (
                    <span className="pointer-events-none absolute top-1/2 left-full ml-2 -translate-y-1/2 rounded-md bg-amber-950 px-2 py-1 text-xs whitespace-nowrap text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
                      {item.label}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        {/* =========================================================
            QUALIFYING EXAM - DEAN / ASSOCIATE DEAN
        ========================================================= */}

        {(parsedRoleId === 4 || parsedRoleId === 5) && (
          <div className="relative z-10 flex flex-col space-y-[5px]">
            <div className="px-3">
              <div className="mb-4 h-px w-full bg-amber-700/20"></div>

              {!isUsersPage && (
                <div className="outfit-500 px-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-800/80">
                  QUALIFYING EXAM
                </div>
              )}
            </div>

            <ul>
              {classes.map((item, index) => {
                const subjectsPath =
                  parsedRoleId === 4
                    ? "/dean/subjects"
                    : "/asso-dean/subjects";

                return (
                  <li
                    key={index}
                    className="group relative"
                  >
                    <span
                      className={`absolute top-1/2 left-0 h-6 w-[5px] -translate-y-1/2 rounded-tr-lg rounded-br-lg transition-colors ${
                        isActive(subjectsPath) &&
                        activeMenu !== "Print"
                          ? "bg-amber-600"
                          : "bg-transparent"
                      }`}
                    ></span>

                    <div className="mt-1 px-3">
                      <Link
                        to={subjectsPath}
                        onClick={handleMenuClick}
                        className={`group flex cursor-pointer items-center rounded-lg transition-colors hover:bg-amber-900/10 hover:text-amber-900 ${
                          isUsersPage
                            ? "justify-center py-[10px]"
                            : "justify-start py-[6px]"
                        } ${
                          isActive(subjectsPath)
                            ? "border border-amber-400/25 bg-amber-500/20 text-amber-950"
                            : "text-amber-700"
                        }`}
                      >
                        <div
                          className={`flex items-center ${
                            isUsersPage
                              ? "justify-center"
                              : "ml-3 gap-3"
                          }`}
                        >
                          <span className="relative flex-shrink-0">
                            <img
                              src={
                                isActive(subjectsPath)
                                  ? SubjectsIconH
                                  : SubjectsIcon
                              }
                              alt="Subjects"
                              className={`icon-orange-tint ${
                                isUsersPage
                                  ? "size-[20px]"
                                  : "size-[18px]"
                              } flex-shrink-0`}
                            />
                          </span>

                          {!isUsersPage && (
                            <span
                              className={`outfit-500 text-[15px] whitespace-nowrap ${
                                isActive(subjectsPath) &&
                                activeMenu !== "Print"
                                  ? "font-semibold text-amber-950"
                                  : "text-amber-700 hover:text-amber-900"
                              }`}
                            >
                              {item.label}
                            </span>
                          )}
                        </div>
                      </Link>

                      {isUsersPage && (
                        <span className="pointer-events-none absolute top-1/2 left-full ml-2 -translate-y-1/2 rounded-md bg-amber-950 px-2 py-1 text-xs whitespace-nowrap text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
                          {item.label}
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}

              {/* EXPORT */}
              {parsedRoleId >= 3 && (
                <li className="group relative">
                  <span
                    className={`absolute top-1/2 left-0 h-6 w-[5px] -translate-y-1/2 rounded-tr-lg rounded-br-lg transition-colors ${
                      activeMenu === "Print" &&
                      showPrintModal
                        ? "bg-amber-600"
                        : "bg-transparent"
                    }`}
                  ></span>

                  <div className="px-3">
                    <button
                      onClick={() => {
                        setActiveMenu("Print");
                        printButton.onClick();
                      }}
                      className={`group mt-[6px] mb-[6px] flex w-full cursor-pointer items-center rounded-lg transition-colors hover:bg-amber-900/10 hover:text-amber-900 ${
                        isUsersPage
                          ? "justify-center py-[10px]"
                          : "justify-start py-[6px]"
                      } ${
                        activeMenu === "Print" &&
                        showPrintModal
                          ? "border border-amber-400/25 bg-amber-500/20 text-amber-950"
                          : ""
                      }`}
                    >
                      <div
                        className={`flex items-center ${
                          isUsersPage
                            ? "justify-center"
                            : "ml-3 gap-3"
                        }`}
                      >
                        <img
                          src={
                            showPrintModal
                              ? PrintIconH
                              : PrintIcon
                          }
                          alt="Export"
                          className={`icon-orange-tint ${
                            isUsersPage
                              ? "size-[20px]"
                              : "size-[20px]"
                          } flex-shrink-0`}
                        />

                        {!isUsersPage && (
                          <span
                            className={`outfit-500 text-[15px] whitespace-nowrap ${
                              activeMenu === "Print" &&
                              showPrintModal
                                ? "font-semibold text-amber-950"
                                : "text-amber-700 hover:text-amber-900"
                            }`}
                          >
                            {printButton.label}
                          </span>
                        )}
                      </div>
                    </button>

                    {isUsersPage && (
                      <span className="pointer-events-none absolute top-1/2 left-full ml-2 -translate-y-1/2 rounded-md bg-amber-950 px-2 py-1 text-xs whitespace-nowrap text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
                        {printButton.label}
                      </span>
                    )}
                  </div>
                </li>
              )}

              {/* REPORTS */}
              <li className="group relative">
                <span
                  className={`absolute top-1/2 left-0 h-6 w-[5px] -translate-y-1/2 rounded-tr-lg rounded-br-lg transition-colors ${
                    activeMenu === "Reports"
                      ? "bg-amber-600"
                      : "bg-transparent"
                  }`}
                ></span>

                <div className="px-3">
                  <button
                    onClick={() => {
                      setActiveMenu("Reports");
                      navigate("/reports");
                    }}
                    className={`group flex w-full cursor-pointer items-center rounded-lg transition-colors hover:bg-amber-900/10 hover:text-amber-900 ${
                      isUsersPage
                        ? "justify-center py-[10px]"
                        : "justify-start py-[6px]"
                    } ${
                      activeMenu === "Reports"
                        ? "border border-amber-400/25 bg-amber-500/20 text-amber-950"
                        : ""
                    }`}
                  >
                    <div
                      className={`flex items-center ${
                        isUsersPage
                          ? "justify-center"
                          : "ml-3 gap-[10px]"
                      }`}
                    >
                      <img
                        src={
                          activeMenu === "Reports"
                            ? ReportsIconH
                            : ReportsIcon
                        }
                        alt="Reports"
                        className={`icon-orange-tint ${
                          isUsersPage
                            ? "size-[20px]"
                            : "size-[20px]"
                        } flex-shrink-0`}
                      />

                      {!isUsersPage && (
                        <span
                          className={`outfit-500 text-[15px] whitespace-nowrap ${
                            activeMenu === "Reports"
                              ? "font-semibold text-amber-950"
                              : "text-amber-700 hover:text-amber-900"
                          }`}
                        >
                          Reports
                        </span>
                      )}
                    </div>
                  </button>

                  {isUsersPage && (
                    <span className="pointer-events-none absolute top-1/2 left-full ml-2 -translate-y-1/2 rounded-md bg-amber-950 px-2 py-1 text-xs whitespace-nowrap text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
                      Reports
                    </span>
                  )}
                </div>
              </li>
            </ul>
          </div>
        )}

        {/* =========================================================
            QUALIFYING EXAM - PROGRAM CHAIR
        ========================================================= */}

        {parsedRoleId === 3 && (
          <div className="relative z-10 flex flex-col space-y-[5px]">
            <div className="px-3">
              <div className="mb-4 h-px w-full bg-amber-700/20"></div>

              {!isUsersPage && (
                <div className="outfit-500 px-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-800/80">
                  QUALIFYING EXAM
                </div>
              )}
            </div>

            <ul>
              {classes.map((item, index) => (
                <li
                  key={index}
                  className="group relative"
                >
                  <span
                    className={`absolute top-1/2 left-0 h-6 w-[5px] -translate-y-1/2 rounded-tr-lg rounded-br-lg transition-colors ${
                      isActive("/program-chair/subjects") &&
                      activeMenu !== "Print"
                        ? "bg-amber-600"
                        : "bg-transparent"
                    }`}
                  ></span>

                  <div className="mt-1 px-3">
                    <Link
                      to="/program-chair/subjects"
                      onClick={handleMenuClick}
                      className={`group flex cursor-pointer items-center rounded-lg transition-colors hover:bg-amber-900/10 hover:text-amber-900 ${
                        isUsersPage
                          ? "justify-center py-[10px]"
                          : "justify-start py-[6px]"
                      } ${
                        isActive("/program-chair/subjects")
                          ? "bg-amber-900/10 text-amber-950"
                          : "text-amber-700"
                      }`}
                    >
                      <div
                        className={`flex items-center ${
                          isUsersPage
                            ? "justify-center"
                            : "ml-3 gap-3"
                        }`}
                      >
                        <span className="relative flex-shrink-0">
                          <img
                            src={
                              isActive(
                                "/program-chair/subjects",
                              )
                                ? SubjectsIconH
                                : SubjectsIcon
                            }
                            alt="Subjects"
                            className={`icon-orange-tint ${
                              isUsersPage
                                ? "size-[20px]"
                                : "size-[18px]"
                            } flex-shrink-0`}
                          />
                        </span>

                        {!isUsersPage && (
                          <span
                            className={`outfit-500 text-[15px] whitespace-nowrap ${
                              isActive(
                                "/program-chair/subjects",
                              ) &&
                              activeMenu !== "Print"
                                ? "font-semibold text-amber-950"
                                : "text-amber-700 hover:text-amber-900"
                            }`}
                          >
                            {item.label}
                          </span>
                        )}
                      </div>
                    </Link>

                    {isUsersPage && (
                      <span className="pointer-events-none absolute top-1/2 left-full ml-2 -translate-y-1/2 rounded-md bg-amber-950 px-2 py-1 text-xs whitespace-nowrap text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
                        {item.label}
                      </span>
                    )}
                  </div>
                </li>
              ))}

              {/* EXPORT */}
              {parsedRoleId >= 3 && (
                <li className="group relative">
                  <span
                    className={`absolute top-1/2 left-0 h-6 w-[5px] -translate-y-1/2 rounded-tr-lg rounded-br-lg transition-colors ${
                      activeMenu === "Print" &&
                      showPrintModal
                        ? "bg-amber-600"
                        : "bg-transparent"
                    }`}
                  ></span>

                  <div className="px-3">
                    <button
                      onClick={() => {
                        setActiveMenu("Print");
                        printButton.onClick();
                      }}
                      className={`group mt-[6px] mb-[6px] flex w-full cursor-pointer items-center rounded-lg py-[6px] transition-colors hover:bg-amber-900/10 hover:text-amber-900 ${
                        isUsersPage
                          ? "justify-center"
                          : "justify-start"
                      } ${
                        activeMenu === "Print" &&
                        showPrintModal
                          ? "border border-amber-400/25 bg-amber-500/20 text-amber-950"
                          : ""
                      }`}
                    >
                      <div
                        className={`flex items-center ${
                          isUsersPage
                            ? "justify-center"
                            : "ml-3 gap-3"
                        }`}
                      >
                        <img
                          src={
                            showPrintModal
                              ? PrintIconH
                              : PrintIcon
                          }
                          alt="Export"
                          className="icon-orange-tint size-[20px] flex-shrink-0"
                        />

                        {!isUsersPage && (
                          <span
                            className={`outfit-500 text-[15px] whitespace-nowrap ${
                              activeMenu === "Print" &&
                              showPrintModal
                                ? "font-semibold text-amber-950"
                                : "text-amber-700 hover:text-amber-900"
                            }`}
                          >
                            {printButton.label}
                          </span>
                        )}
                      </div>
                    </button>

                    {isUsersPage && (
                      <span className="pointer-events-none absolute top-1/2 left-full ml-2 -translate-y-1/2 rounded-md bg-amber-950 px-2 py-1 text-xs whitespace-nowrap text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
                        {printButton.label}
                      </span>
                    )}
                  </div>
                </li>
              )}

              {/* REPORTS */}
              <li className="group relative">
                <span
                  className={`absolute top-1/2 left-0 h-6 w-[5px] -translate-y-1/2 rounded-tr-lg rounded-br-lg transition-colors ${
                    activeMenu === "Reports"
                      ? "bg-amber-600"
                      : "bg-transparent"
                  }`}
                ></span>

                <div className="px-3">
                  <button
                    onClick={() => {
                      setActiveMenu("Reports");
                      navigate("/reports");
                    }}
                    className={`group flex w-full cursor-pointer items-center rounded-lg py-[6px] transition-colors hover:bg-amber-900/10 hover:text-amber-900 ${
                      isUsersPage
                        ? "justify-center"
                        : "justify-start"
                    } ${
                      activeMenu === "Reports"
                        ? "border border-amber-400/25 bg-amber-500/20 text-amber-950"
                        : ""
                    }`}
                  >
                    <div
                      className={`flex items-center ${
                        isUsersPage
                          ? "justify-center"
                          : "ml-3 gap-[10px]"
                      }`}
                    >
                      <img
                        src={
                          activeMenu === "Reports"
                            ? ReportsIconH
                            : ReportsIcon
                        }
                        alt="Reports"
                        className="icon-orange-tint size-[20px] flex-shrink-0"
                      />

                      {!isUsersPage && (
                        <span
                          className={`outfit-500 text-[15px] whitespace-nowrap ${
                            activeMenu === "Reports"
                              ? "font-semibold text-amber-950"
                              : "text-amber-700 hover:text-amber-900"
                          }`}
                        >
                          Reports
                        </span>
                      )}
                    </div>
                  </button>

                  {isUsersPage && (
                    <span className="pointer-events-none absolute top-1/2 left-full ml-2 -translate-y-1/2 rounded-md bg-amber-950 px-2 py-1 text-xs whitespace-nowrap text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
                      Reports
                    </span>
                  )}
                </div>
              </li>
            </ul>
          </div>
        )}

        {/* =========================================================
            QUALIFYING EXAM - FACULTY
        ========================================================= */}

        {parsedRoleId === 2 && (
          <div className="relative z-10 flex flex-col space-y-[5px]">
            <div className="px-3">
              <div className="mb-4 h-px w-full bg-amber-700/20"></div>

              {!isUsersPage && (
                <div className="outfit-500 px-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-800/80">
                  QUALIFYING EXAM
                </div>
              )}
            </div>

            <ul>
              {classes.map((item, index) => (
                <li
                  key={index}
                  className="group relative"
                >
                  <span
                    className={`absolute top-1/2 left-0 h-6 w-[5px] -translate-y-1/2 rounded-tr-lg rounded-br-lg transition-colors ${
                      isActive("/faculty/subjects") &&
                      activeMenu !== "Print"
                        ? "bg-amber-600"
                        : "bg-transparent"
                    }`}
                  ></span>

                  <div className="mt-1 px-3">
                    <Link
                      to="/faculty/subjects"
                      onClick={handleMenuClick}
                      className={`group flex cursor-pointer items-center rounded-lg transition-colors hover:bg-amber-900/10 hover:text-amber-900 ${
                        isUsersPage
                          ? "justify-center py-[10px]"
                          : "justify-start py-[6px]"
                      } ${
                        isActive("/faculty/subjects")
                          ? "bg-amber-900/10 text-amber-950"
                          : "text-amber-700"
                      }`}
                    >
                      <div
                        className={`flex items-center ${
                          isUsersPage
                            ? "justify-center"
                            : "ml-3 gap-3"
                        }`}
                      >
                        <span className="relative flex-shrink-0">
                          <img
                            src={
                              isActive(
                                "/faculty/subjects",
                              )
                                ? SubjectsIconH
                                : SubjectsIcon
                            }
                            alt="Subjects"
                            className={`icon-orange-tint ${
                              isUsersPage
                                ? "size-[20px]"
                                : "size-[18px]"
                            } flex-shrink-0`}
                          />
                        </span>

                        {!isUsersPage && (
                          <span
                            className={`outfit-500 text-[15px] whitespace-nowrap ${
                              isActive(
                                "/faculty/subjects",
                              ) &&
                              activeMenu !== "Print"
                                ? "font-semibold text-amber-950"
                                : "text-amber-700 hover:text-amber-900"
                            }`}
                          >
                            {item.label}
                          </span>
                        )}
                      </div>
                    </Link>

                    {isUsersPage && (
                      <span className="pointer-events-none absolute top-1/2 left-full ml-2 -translate-y-1/2 rounded-md bg-amber-950 px-2 py-1 text-xs whitespace-nowrap text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
                        {item.label}
                      </span>
                    )}
                  </div>
                </li>
              ))}

              {/* EXPORT */}
              {parsedRoleId >= 3 && (
                <li className="group relative">
                  <span
                    className={`absolute top-1/2 left-0 h-6 w-[5px] -translate-y-1/2 rounded-tr-lg rounded-br-lg transition-colors ${
                      activeMenu === "Print" &&
                      showPrintModal
                        ? "bg-amber-600"
                        : "bg-transparent"
                    }`}
                  ></span>

                  <div className="px-3">
                    <button
                      onClick={() => {
                        setActiveMenu("Print");
                        printButton.onClick();
                      }}
                      className={`group mt-[6px] mb-[6px] flex w-full cursor-pointer items-center rounded-lg transition-colors hover:bg-amber-900/10 hover:text-amber-900 ${
                        isUsersPage
                          ? "justify-center py-[10px]"
                          : "justify-start py-[6px]"
                      } ${
                        activeMenu === "Print" &&
                        showPrintModal
                          ? "border border-amber-400/25 bg-amber-500/20 text-amber-950"
                          : ""
                      }`}
                    >
                      <div
                        className={`flex items-center ${
                          isUsersPage
                            ? "justify-center"
                            : "ml-3 gap-3"
                        }`}
                      >
                        <img
                          src={
                            showPrintModal
                              ? PrintIconH
                              : PrintIcon
                          }
                          alt="Export"
                          className={`icon-orange-tint ${
                            isUsersPage
                              ? "size-[20px]"
                              : "size-[20px]"
                          } flex-shrink-0`}
                        />

                        {!isUsersPage && (
                          <span
                            className={`outfit-500 text-[15px] whitespace-nowrap ${
                              activeMenu === "Print" &&
                              showPrintModal
                                ? "font-semibold text-amber-950"
                                : "text-amber-700 hover:text-amber-900"
                            }`}
                          >
                            {printButton.label}
                          </span>
                        )}
                      </div>
                    </button>

                    {isUsersPage && (
                      <span className="pointer-events-none absolute top-1/2 left-full ml-2 -translate-y-1/2 rounded-md bg-amber-950 px-2 py-1 text-xs whitespace-nowrap text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
                        {printButton.label}
                      </span>
                    )}
                  </div>
                </li>
              )}

              {/* REPORTS */}
              <li className="group relative">
                <span
                  className={`absolute top-1/2 left-0 h-6 w-[5px] -translate-y-1/2 rounded-tr-lg rounded-br-lg transition-colors ${
                    activeMenu === "Reports"
                      ? "bg-amber-600"
                      : "bg-transparent"
                  }`}
                ></span>

                <div className="px-3">
                  <button
                    onClick={() => {
                      setActiveMenu("Reports");
                      navigate("/reports");
                    }}
                    className={`group flex w-full cursor-pointer items-center rounded-lg transition-colors hover:bg-amber-900/10 hover:text-amber-900 ${
                      isUsersPage
                        ? "justify-center py-[10px]"
                        : "justify-start py-[6px]"
                    } ${
                      activeMenu === "Reports"
                        ? "border border-amber-400/25 bg-amber-500/20 text-amber-950"
                        : ""
                    }`}
                  >
                    <div
                      className={`flex items-center ${
                        isUsersPage
                          ? "justify-center"
                          : "ml-3 gap-[10px]"
                      }`}
                    >
                      <img
                        src={
                          activeMenu === "Reports"
                            ? ReportsIconH
                            : ReportsIcon
                        }
                        alt="Reports"
                        className={`icon-orange-tint ${
                          isUsersPage
                            ? "size-[20px]"
                            : "size-[20px]"
                        } flex-shrink-0`}
                      />

                      {!isUsersPage && (
                        <span
                          className={`outfit-500 text-[15px] whitespace-nowrap ${
                            activeMenu === "Reports"
                              ? "font-semibold text-amber-950"
                              : "text-amber-700 hover:text-amber-900"
                          }`}
                        >
                          Reports
                        </span>
                      )}
                    </div>
                  </button>

                  {isUsersPage && (
                    <span className="pointer-events-none absolute top-1/2 left-full ml-2 -translate-y-1/2 rounded-md bg-amber-950 px-2 py-1 text-xs whitespace-nowrap text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
                      Reports
                    </span>
                  )}
                </div>
              </li>
            </ul>
          </div>
        )}

        {/* =========================================================
            SUPPORT / FOOTER
        ========================================================= */}

        <div className="absolute bottom-4 left-0 z-10 w-full">
          {/* SUPPORT */}
          <div className="px-3">
            <button
              onClick={() => {
                setActiveMenu("Support");
                handleSupportClick();
              }}
              className={`group mb-2 flex w-full cursor-pointer items-center rounded-lg py-[8px] transition-colors hover:bg-amber-900/10 hover:text-amber-900 ${
                isUsersPage
                  ? "justify-center"
                  : "justify-start"
              } ${
                activeMenu === "Support"
                  ? "bg-amber-900/10 text-amber-950"
                  : "text-amber-700"
              }`}
            >
              <div
                className={`flex items-center ${
                  isUsersPage
                    ? "justify-center"
                    : "ml-3 gap-[10px]"
                }`}
              >
                <img
                  src={
                    activeMenu === "Support"
                      ? SupportIconH
                      : SupportIcon
                  }
                  alt="Support"
                  className="icon-orange-tint size-[20px] flex-shrink-0"
                />

                {!isUsersPage && (
                  <span
                    className={`outfit-500 text-[15px] whitespace-nowrap ${
                      activeMenu === "Support"
                        ? "font-semibold text-amber-950"
                        : "text-amber-700 hover:text-amber-900"
                    }`}
                  >
                    Support
                  </span>
                )}
              </div>
            </button>
          </div>

          {/* CAPS FOOTER */}
          <div className="px-3">
            <div className="mb-2 h-px w-full bg-amber-700/20"></div>

            <button
              onClick={() => {
                navigate("/team-caps");
              }}
              className={`group flex w-full cursor-pointer items-center rounded-lg px-3 py-[8px] transition-colors hover:bg-amber-900/10 hover:text-amber-900 ${
                activeMenu === "Support"
                  ? "bg-amber-900/10 text-amber-950"
                  : ""
              } ${
                isUsersPage
                  ? "justify-center"
                  : "justify-between"
              }`}
            >
              <div
                className={`flex items-center ${
                  isUsersPage ? "" : "gap-[10px]"
                }`}
              >
                <img
                  src={CollegeLogo}
                  alt="CAPS"
                  className="size-[20px] flex-shrink-0"
                />

                {!isUsersPage && (
                  <span className="outfit-500 text-[15px] whitespace-nowrap text-amber-700">
                    CAPS
                  </span>
                )}
              </div>

              {!isUsersPage && (
                <span className="text-xs font-medium text-amber-700/70">
                  <AppVersion />
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* PRINT MODAL */}
      <PrintExamModal
        isOpen={showPrintModal === true}
        onClose={() => setShowPrintModal(false)}
      />

      {/* LOGOUT MODAL */}
      {showLogoutModal && (
        <div className="lightbox-bg fixed inset-0 z-[200] flex items-center justify-center">
          <div className="animate-fade-in-up flex w-[90vw] max-w-xs flex-col items-center rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50">
              <svg
                width="36"
                height="36"
                fill="none"
                viewBox="0 0 24 24"
                stroke="orange"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1"
                />
              </svg>
            </div>

            <div className="outfit-700 mb-1 text-[20px]">
              Log out
            </div>

            <div className="outfit-400 mb-5 text-center text-[14px] text-gray-500">
              Are you sure you want to log out?
            </div>

            <button
              className="outfit-400 mb-2 w-full cursor-pointer rounded-lg bg-orange-500 py-2 text-[16px] font-semibold text-white transition hover:bg-orange-700"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? (
                <span className="flex items-center justify-center">
                  <span className="loader-white mr-2"></span>
                </span>
              ) : (
                "Yes, Log out"
              )}
            </button>

            <button
              className="border-color outfit-400 w-full cursor-pointer rounded-lg border py-2 text-[16px] font-semibold text-gray-700 transition hover:bg-gray-200"
              onClick={() =>
                setShowLogoutModal(false)
              }
              disabled={isLoggingOut}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* PROFILE MODALS */}
      <ProfileModalsHost
        profile={profile}
        showToast={showToast}
      />

      {/* TOAST */}
      <Toast
        message={toast.message}
        type={toast.type}
        show={toast.show}
      />
    </>
  );
};

export default Sidebar;