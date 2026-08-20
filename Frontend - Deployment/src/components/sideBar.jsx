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

  const [isMobile, setIsMobile] = useState(
    window.innerWidth < 1025
  );

  const [isSubjectFocused, setIsSubjectFocused] =
    useState(false);

  const [isLoading, setIsLoading] = useState(false);

  const [showPrintModal, setShowPrintModal] =
    useState(false);

  const [activeMenu, setActiveMenu] =
    useState(null);

  const [userDropdownOpen, setUserDropdownOpen] =
    useState(false);

  const [showLogoutModal, setShowLogoutModal] =
    useState(false);

  const [isLoggingOut, setIsLoggingOut] =
    useState(false);

  const profile = useUserProfile();

  const {
    userInfo,
    avatarColor,
    showProfileModal,
    setShowProfileModal,
    showChangePassword,
    clearUserAvatarColor,
  } = profile;


  // =========================================================
  // DARK MODE
  // =========================================================

  const [isDarkMode, setIsDarkMode] = useState(() => {
    return (
      document.documentElement.classList.contains("dark") ||
      localStorage.getItem("theme") === "dark"
    );
  });


  // =========================================================
  // SIDEBAR COLLAPSE
  // =========================================================

  const [isCollapsed, setIsCollapsed] = useState(() => {
    return (
      localStorage.getItem("sidebar_collapsed") === "true"
    );
  });


  const sidebarRef = useRef(null);
  const userDropdownRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();

  const apiUrl = import.meta.env.VITE_API_BASE_URL;

  const { toast, showToast } = useToast();


  // =========================================================
  // DARK MODE SYNC
  // =========================================================

  useEffect(() => {
    const html = document.documentElement;

    html.classList.toggle("dark", isDarkMode);

    html.style.colorScheme = isDarkMode
      ? "dark"
      : "light";

    localStorage.setItem(
      "theme",
      isDarkMode ? "dark" : "light"
    );

    window.dispatchEvent(
      new Event("themechange")
    );
  }, [isDarkMode]);


  useEffect(() => {
    const handler = () => {
      setIsDarkMode(
        document.documentElement.classList.contains(
          "dark"
        )
      );
    };

    window.addEventListener(
      "themechange",
      handler
    );

    return () => {
      window.removeEventListener(
        "themechange",
        handler
      );
    };
  }, []);


  // =========================================================
  // DARK MODE ICON STYLE
  // =========================================================
  //
  // SVG files are loaded through <img>, therefore
  // Tailwind text colors cannot change their color.
  //
  // This filter makes icons brighter and stronger ONLY
  // when dark mode is enabled.
  // =========================================================

  const getDarkIconStyle = (active = false) => {
    if (!isDarkMode) {
      return {
        opacity: 1,
        filter: "none",
      };
    }

    if (active) {
      return {
        opacity: 1,
        filter:
          "brightness(1.35) contrast(1.35) saturate(1.25) drop-shadow(0 0 2px rgba(249,115,22,0.55))",
      };
    }

    return {
      opacity: 1,
      filter:
        "brightness(1.75) contrast(1.4) saturate(0.9) drop-shadow(0 0 1.5px rgba(255,255,255,0.35))",
    };
  };


  // =========================================================
  // SAVE SIDEBAR STATE
  // =========================================================

  useEffect(() => {
    localStorage.setItem(
      "sidebar_collapsed",
      isCollapsed ? "true" : "false"
    );
  }, [isCollapsed]);


  const isUsersPage = isCollapsed;


  // =========================================================
  // PAGE LOADING
  // =========================================================

  useEffect(() => {
    setIsLoading(true);

    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [location]);


  // =========================================================
  // RESPONSIVE
  // =========================================================

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1025);
    };

    window.addEventListener(
      "resize",
      handleResize
    );

    return () => {
      window.removeEventListener(
        "resize",
        handleResize
      );
    };
  }, []);


  // =========================================================
  // CLOSE DROPDOWN OUTSIDE
  // =========================================================

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(
          event.target
        )
      ) {
        setUserDropdownOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);


  // =========================================================
  // LOGOUT
  // =========================================================

  const handleLogout = async () => {
    setIsLoggingOut(true);

    const token =
      sessionStorage.getItem("token");

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

      logoutUser(
        showToast,
        navigate
      );

      setIsLoggingOut(false);
      setShowLogoutModal(false);
    }
  };


  // =========================================================
  // DISPLAY NAME
  // =========================================================

  const getDisplayName = () => {
    if (!userInfo?.fullName) {
      return "Loading...";
    }

    const parts =
      userInfo.fullName
        .trim()
        .split(/\s+/);

    const firstName = parts[0];

    let lastInitial = "";

    if (parts.length > 1) {
      lastInitial =
        parts[parts.length - 1][0];
    }

    return `${firstName} ${lastInitial}.`;
  };


  useEffect(() => {
    if (
      showProfileModal ||
      showChangePassword
    ) {
      setUserDropdownOpen(false);
    }
  }, [
    showProfileModal,
    showChangePassword,
  ]);


  // =========================================================
  // ROLE
  // =========================================================

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


  // =========================================================
  // MENU ITEMS
  // =========================================================

  const baseMenuItems = [
    {
      icon:
        parsedRoleId === 1
          ? "bx-file-detail"
          : "bx-home-alt-3",

      label:
        parsedRoleId === 1
          ? "Exams"
          : "Home",

      path: homePath,
    },
  ];


  const librariesItem = {
    label: "Quizzes",
    path: "/libraries",
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
    ];
  } else {
    menuItems = [
      ...baseMenuItems,
    ];

    if (parsedRoleId >= 2) {
      menuItems = [
        ...menuItems,
        librariesItem,
        classItem,
        ...adminItems,
      ];
    }
  }


  const printButton = {
    icon: "bx-printer",
    label: "Export",

    onClick: () =>
      setShowPrintModal(true),

    isButton: true,
  };


  // =========================================================
  // ACTIVE ROUTE
  // =========================================================

  const isActive = (path) => {

    if (path === "/class") {
      return (
        location.pathname === "/class" ||
        location.pathname ===
          "/archived-class" ||
        location.pathname.startsWith(
          "/class/"
        )
      );
    }


    if (path === "/libraries") {
      return (
        location.pathname ===
          "/libraries" ||
        location.pathname ===
          "/archived-quiz"
      );
    }


    return (
      location.pathname === path
    );
  };


  // =========================================================
  // MENU CLICK
  // =========================================================

  const handleMenuClick = () => {
    setIsSubjectFocused(false);
    setIsSubjectExpanded(false);
    setSelectedSubject(null);
    setActiveMenu(null);
  };



  // =========================================================
  // MOBILE
  // =========================================================

  if (isMobile) {

    const homeItem =
      menuItems.find(
        (item) =>
          item.label === "Home" ||
          item.label === "Exams"
      );


    return (
      <>
        <div
          id="mobile-bottom-nav"
          className="fixed right-0 bottom-0 left-0 z-50 flex justify-center pb-4"
        >
          <div
            className="
              mx-4
              w-full
              max-w-md
              rounded-2xl
              border
              border-gray-200
              bg-white
              px-4
              py-2
              shadow-lg
              dark:border-gray-700
              dark:bg-[#11161d]
              min-[500px]:px-6
            "
          >

            <div
              className={
                parsedRoleId === 1
                  ? "flex items-center justify-evenly"
                  : "flex items-center justify-between gap-8"
              }
            >

              {parsedRoleId === 1 ? (
                <>
                  {/* HOME / EXAMS */}

                  {homeItem && (
                    <div className="flex h-16 flex-col items-center justify-center">

                      <Link
                        to={homeItem.path}
                        onClick={handleMenuClick}
                        className="flex flex-col items-center"
                      >

                        <span className="mb-1 flex items-center justify-center">

                          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 text-white shadow-lg">

                            <i className="bx bx-file-detail text-[20px]" />

                          </span>

                        </span>

                        <span
                          className={`outfit-500 text-xs ${
                            isActive(homeItem.path)
                              ? "text-amber-950 dark:text-gray-100"
                              : "text-amber-700 dark:text-gray-400"
                          }`}
                        >
                          {homeItem.label}
                        </span>

                      </Link>

                    </div>
                  )}


                  {/* CLASSES */}

                  <div className="flex h-16 flex-col items-center justify-center">

                    <Link
                      to="/class"
                      onClick={handleMenuClick}
                      className={`flex flex-col items-center transition-colors ${
                        isActive("/class")
                          ? "text-amber-950 dark:text-gray-100"
                          : "text-amber-700 dark:text-gray-400 hover:text-amber-900 dark:hover:text-orange-300"
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
                          style={getDarkIconStyle(
                            isActive("/class")
                          )}
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
                  {/* QUIZZES */}

                  <div className="flex h-16 flex-1 flex-col items-center justify-center">

                    <Link
                      to="/libraries"
                      onClick={handleMenuClick}
                      className={`flex flex-col items-center transition-colors ${
                        isActive("/libraries")
                          ? "text-amber-950 dark:text-gray-100"
                          : "text-amber-700 dark:text-gray-400 hover:text-amber-900 dark:hover:text-orange-300"
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
                          style={getDarkIconStyle(
                            isActive("/libraries")
                          )}
                        />

                      </span>

                      <span className="outfit-500 text-xs">
                        Quizzes
                      </span>

                    </Link>

                  </div>


                  {/* CLASSES */}

                  <div className="flex h-16 flex-1 flex-col items-center justify-center">

                    <Link
                      to="/class"
                      onClick={handleMenuClick}
                      className={`flex flex-col items-center transition-colors ${
                        isActive("/class")
                          ? "text-amber-950 dark:text-gray-100"
                          : "text-amber-700 dark:text-gray-400 hover:text-amber-900 dark:hover:text-orange-300"
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
                          style={getDarkIconStyle(
                            isActive("/class")
                          )}
                        />

                      </span>

                      <span className="outfit-500 text-xs">
                        Classes
                      </span>

                    </Link>

                  </div>


                  {/* DASHBOARD */}

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
                              style={getDarkIconStyle(
                                true
                              )}
                            />

                          </span>

                        </span>

                        <span
                          className={`outfit-500 text-xs ${
                            isActive(homeItem.path)
                              ? "text-amber-950 dark:text-gray-100"
                              : "text-amber-700 dark:text-gray-400"
                          }`}
                        >
                          {homeItem.label}
                        </span>

                      </Link>

                    </div>
                  )}


                  {/* USERS */}

                  {parsedRoleId >= 2 && (
                    <div className="flex h-16 flex-1 flex-col items-center justify-center">

                      <Link
                        to="/users"
                        onClick={handleMenuClick}
                        className={`flex flex-col items-center transition-colors ${
                          isActive("/users")
                            ? "text-amber-950 dark:text-gray-100"
                            : "text-amber-700 dark:text-gray-400 hover:text-amber-900 dark:hover:text-orange-300"
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
                            style={getDarkIconStyle(
                              isActive("/users")
                            )}
                          />

                        </span>

                        <span className="outfit-500 text-xs">
                          Users
                        </span>

                      </Link>

                    </div>
                  )}


                  {/* SUBJECTS */}

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
                                  : "/asso-dean/subjects"
                          )
                            ? "text-amber-950 dark:text-gray-100"
                            : "text-amber-700 dark:text-gray-400 hover:text-amber-900 dark:hover:text-orange-300"
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
                                      : "/asso-dean/subjects"
                              )
                                ? SubjectsIconH
                                : SubjectsIcon
                            }
                            alt="Subjects"
                            className="h-6 w-6 object-contain"
                            style={getDarkIconStyle(
                              isActive(
                                parsedRoleId === 2
                                  ? "/faculty/subjects"
                                  : parsedRoleId === 3
                                    ? "/program-chair/subjects"
                                    : parsedRoleId === 4
                                      ? "/dean/subjects"
                                      : "/asso-dean/subjects"
                              )
                            )}
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
          onClose={() =>
            setShowPrintModal(false)
          }
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
        className={`fixed top-0 left-0 z-55 h-[100vh] overflow-visible border-r transition-all duration-300 ease-in-out ${
          isUsersPage
            ? "w-[63px]"
            : "w-[220px]"
        }`}
        style={{
          backgroundColor: isDarkMode
            ? "#11161d"
            : "#fff1dc",

          borderColor: isDarkMode
            ? "#303946"
            : "#ead7bd",

          boxShadow: "none",
          backgroundImage: "none",
          backdropFilter: "none",
          WebkitBackdropFilter: "none",
        }}
      >

        {/* =====================================================
            COLLAPSE BUTTON
        ===================================================== */}

        <button
          onClick={() =>
            setIsCollapsed(
              (prev) => !prev
            )
          }
          className="
            absolute
            -right-3
            top-20
            z-10
            flex
            h-6
            w-6
            items-center
            justify-center
            rounded-full
            border
            border-amber-400/50
            bg-amber-950/90
            text-amber-300
            shadow-[0_2px_10px_rgba(0,0,0,0.4)]
            backdrop-blur-md
            transition
            hover:bg-amber-800
            hover:text-amber-100
          "
        >
          <i
            className={`bx ${
              isCollapsed
                ? "bx-chevron-right"
                : "bx-chevron-left"
            } text-[16px]`}
          />
        </button>


        {/* =====================================================
            USER PROFILE
        ===================================================== */}

        <div
          className="relative z-10 px-3 pt-3"
          ref={userDropdownRef}
        >

          <div
            onClick={() =>
              setUserDropdownOpen(
                !userDropdownOpen
              )
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
                    const parts =
                      userInfo.fullName
                        .trim()
                        .split(" ");

                    const firstInitial =
                      parts[0]?.[0] ||
                      "";

                    const lastInitial =
                      parts.length > 1
                        ? parts[
                            parts.length - 1
                          ][0]
                        : "";

                    return (
                      firstInitial +
                      lastInitial
                    ).toUpperCase();
                  })()
                ) : (
                  <span className="inline-block size-8 animate-pulse rounded-full bg-amber-300" />
                )}

              </div>

            </div>


            {!isUsersPage && (
              <div className="flex flex-1 flex-col">

                <span className="text-sm font-bold text-amber-950 dark:text-gray-100">
                  {getDisplayName()}
                </span>

                <span className="text-xs font-normal text-amber-800 dark:text-gray-400">
                  {getRoleName(role_id)}
                </span>

              </div>
            )}


            {!isUsersPage && (
              <i
                className={`bx flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md border border-amber-900/10 bg-amber-50/70 text-[23px] leading-none text-amber-700 dark:bg-gray-800/80 dark:text-gray-300 ${
                  userDropdownOpen
                    ? "bx-chevron-left"
                    : "bx-chevron-right"
                }`}
              />
            )}

          </div>

{/* USER DROPDOWN */}

{userDropdownOpen && (
  <div
    className="outfit-400 fade-in absolute top-2 left-full z-50 ml-2 w-60 rounded-md border p-1 shadow-lg"
    style={{
      backgroundColor: isDarkMode ? "#171d25" : "#ffffff",
      borderColor: isDarkMode ? "#374151" : "#fde68a",
      boxShadow: isDarkMode
        ? "0 10px 30px rgba(0,0,0,0.45)"
        : "0 10px 25px rgba(0,0,0,0.12)",
    }}
  >

    {/* USER INFORMATION */}
    <div className="flex items-center gap-3 px-2 py-3">

      <div
        className={`flex h-8 w-10 items-center justify-center rounded-full ${
          userInfo
            ? avatarColor
            : "bg-amber-500"
        } text-sm font-bold text-white`}
      >
        {userInfo?.fullName
          ? (() => {
              const parts = userInfo.fullName
                .trim()
                .split(/\s+/);

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
          : null}
      </div>

      <div className="flex w-full min-w-0 flex-col">

        {/* NAME */}
        <span
          className="overflow-hidden text-ellipsis whitespace-nowrap font-semibold"
          style={{
            color: isDarkMode
              ? "#ffffff"
              : "#451a03",
          }}
        >
          {userInfo?.fullName || "Loading..."}
        </span>

        {/* EMAIL */}
        <span
          className="overflow-hidden text-ellipsis whitespace-nowrap text-xs"
          style={{
            color: isDarkMode
              ? "#d1d5db"
              : "#b45309",
          }}
        >
          {userInfo?.email || "Loading..."}
        </span>

      </div>

    </div>


    {/* DIVIDER */}
    <div
      className="mx-1 h-[1px]"
      style={{
        backgroundColor: isDarkMode
          ? "#374151"
          : "#fef3c7",
      }}
    />


    {/* PROFILE */}
    <button
      onClick={() => {
        setUserDropdownOpen(false);
        setShowProfileModal(true);
      }}
      className="mt-1 flex w-full cursor-pointer items-center justify-start rounded-sm px-4 py-3 text-left text-[14px] transition duration-200"
      style={{
        color: isDarkMode
          ? "#ffffff"
          : "#451a03",
        backgroundColor: "transparent",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor =
          isDarkMode
            ? "#252d38"
            : "#fef3c7";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor =
          "transparent";
      }}
    >
      <i className="bx bx-user mr-2 text-[16px]" />
      Profile
    </button>


    {/* DARK / LIGHT MODE */}
    <button
      onClick={() =>
        setIsDarkMode((prev) => !prev)
      }
      className="flex w-full cursor-pointer items-center justify-start rounded-sm px-4 py-3 text-left text-[14px] transition duration-200"
      style={{
        color: isDarkMode
          ? "#ffffff"
          : "#451a03",
        backgroundColor: "transparent",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor =
          isDarkMode
            ? "#252d38"
            : "#fef3c7";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor =
          "transparent";
      }}
    >
      <i
        className={`bx ${
          isDarkMode
            ? "bx-sun"
            : "bx-moon"
        } mr-2 text-[16px]`}
      />

      {isDarkMode
        ? "Light Mode"
        : "Dark Mode"}
    </button>


    {/* LOGOUT */}
    <button
      onClick={() =>
        setShowLogoutModal(true)
      }
      className="flex w-full cursor-pointer items-center justify-start rounded-sm px-4 py-3 text-left text-[14px] transition duration-200"
      style={{
        color: isDarkMode
          ? "#ffffff"
          : "#451a03",
        backgroundColor: "transparent",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor =
          isDarkMode
            ? "#252d38"
            : "#fef3c7";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor =
          "transparent";
      }}
    >
      <i className="bx bx-arrow-out-right-square-half mr-2 text-[16px]" />

      {isLoggingOut
        ? "Logging out..."
        : "Log out"}
    </button>

  </div>
)}
          <div className="mt-2 mb-4 h-px w-full bg-amber-700/20 dark:bg-gray-700/70" />


          {!isUsersPage && (
            <div className="outfit-500 px-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-800/80 dark:text-gray-400">
              MAIN
            </div>
          )}

        </div>


        {/* =====================================================
            MAIN MENU
        ===================================================== */}

        <ul className="relative z-10 mt-2 mb-3 space-y-[5px] px-0">

          {menuItems.map(
            (item, index) => {

              const routeActive =
                item.path &&
                typeof item.path ===
                  "string"
                  ? isActive(
                      item.path
                    )
                  : false;

              const isItemActive =
                activeMenu != null
                  ? activeMenu ===
                    item.label
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
                  />


                  <div className="px-3">

                    <Link
                      to={item.path}
                      onClick={
                        handleMenuClick
                      }
                      className={`group flex cursor-pointer items-center rounded-lg transition-colors hover:bg-amber-900/10 dark:hover:bg-orange-500/10 ${
                        isUsersPage
                          ? "justify-center py-[10px]"
                          : "justify-start py-[6px]"
                      } ${
                        isItemActive
                          ? "bg-amber-900/10 text-amber-950 shadow-[inset_0_0_0_1px_rgba(120,53,15,0.15)] dark:text-gray-100"
                          : "text-amber-700 dark:text-gray-400 hover:text-amber-900 dark:hover:text-orange-300"
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

                        {item.label ===
                        "Home" ? (
                          <span className="relative flex-shrink-0">

                            <img
                              src={
                                isItemActive
                                  ? DashboardIconH
                                  : DashboardIcon
                              }
                              alt="Dashboard"
                              className={`${
                                isUsersPage
                                  ? "size-[20px]"
                                  : "size-[18px]"
                              } flex-shrink-0`}
                              style={getDarkIconStyle(
                                isItemActive
                              )}
                            />

                          </span>

                        ) : item.label ===
                          "Exams" ? (

                          <i
                            className={`bx bx-file-detail flex-shrink-0 ${
                              isUsersPage
                                ? "text-[20px]"
                                : "text-[18px]"
                            } ${
                              isDarkMode
                                ? "text-gray-100 drop-shadow-[0_0_2px_rgba(255,255,255,0.35)]"
                                : "text-amber-700"
                            }`}
                          />

                        ) : item.label ===
                          "Quizzes" ? (

                          <span className="relative flex-shrink-0">

                            <img
                              src={
                                isItemActive
                                  ? LibrariesIconH
                                  : LibrariesIcon
                              }
                              alt="Library"
                              className={`${
                                isUsersPage
                                  ? "size-[20px]"
                                  : "size-[18px]"
                              } flex-shrink-0`}
                              style={getDarkIconStyle(
                                isItemActive
                              )}
                            />

                          </span>

                        ) : item.label ===
                          "Users" ? (

                          <span className="relative flex-shrink-0">

                            <img
                              src={
                                isItemActive
                                  ? UsersIconH
                                  : UsersIcon
                              }
                              alt="Users"
                              className={`${
                                isUsersPage
                                  ? "size-[20px]"
                                  : "size-[18px]"
                              } flex-shrink-0`}
                              style={getDarkIconStyle(
                                isItemActive
                              )}
                            />

                          </span>

                        ) : item.label ===
                          "Classes" ? (

                          <span className="relative flex-shrink-0">

                            <img
                              src={
                                isItemActive
                                  ? ClassIconH
                                  : ClassIcon
                              }
                              alt="Class"
                              className={`${
                                isUsersPage
                                  ? "size-[20px]"
                                  : "size-[18px]"
                              } flex-shrink-0`}
                              style={getDarkIconStyle(
                                isItemActive
                              )}
                            />

                          </span>

                        ) : item.label ===
                          "Subjects" ? (

                          <span className="relative flex-shrink-0">

                            <img
                              src={
                                isItemActive
                                  ? SubjectsIconH
                                  : SubjectsIcon
                              }
                              alt="Subjects"
                              className={`${
                                isUsersPage
                                  ? "size-[20px]"
                                  : "size-[18px]"
                              } flex-shrink-0`}
                              style={getDarkIconStyle(
                                isItemActive
                              )}
                            />

                          </span>

                        ) : (

                          <i
                            className={`bx ${item.icon} flex-shrink-0 ${
                              isUsersPage
                                ? "text-[20px]"
                                : "text-[18px]"
                            } ${
                              isDarkMode
                                ? "text-gray-100"
                                : "text-amber-700"
                            }`}
                          />

                        )}


                        {!isUsersPage && (
                          <span
                            className={`outfit-500 text-[15px] whitespace-nowrap ${
                              isItemActive
                                ? "font-semibold text-amber-950 dark:text-gray-100"
                                : "text-amber-700 dark:text-gray-400 hover:text-amber-900 dark:hover:text-orange-300"
                            }`}
                          >
                            {item.label}
                          </span>
                        )}

                      </div>

                    </Link>


                    {isUsersPage && (
                      <span className="pointer-events-none absolute top-1/2 left-full ml-2 -translate-y-1/2 rounded-md bg-amber-950 px-2 py-1 text-xs whitespace-nowrap text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 dark:bg-gray-700">
                        {item.label}
                      </span>
                    )}

                  </div>

                </li>
              );
            }
          )}


          {/* =================================================
              IMPORT QUESTIONS
              Shown to Faculty and up — same roles that can see
              the Quizzes/Libraries section.
          ================================================= */}

          {parsedRoleId >= 2 && (
            <li className="group relative">

              <span
                className={`absolute top-1/2 left-0 h-6 w-[5px] -translate-y-1/2 rounded-tr-lg rounded-br-lg ${
                  isActive("/import-questions")
                    ? "bg-amber-600"
                    : "bg-transparent"
                }`}
              />

              <div className="px-3">

                <Link
                  to="/import-questions"
                  onClick={handleMenuClick}
                  className={`group flex cursor-pointer items-center rounded-lg transition-colors hover:bg-amber-900/10 dark:hover:bg-orange-500/10 ${
                    isUsersPage
                      ? "justify-center py-[10px]"
                      : "justify-start py-[6px]"
                  } ${
                    isActive("/import-questions")
                      ? "bg-amber-900/10 text-amber-950 shadow-[inset_0_0_0_1px_rgba(120,53,15,0.15)] dark:text-gray-100"
                      : "text-amber-700 dark:text-gray-400 hover:text-amber-900 dark:hover:text-orange-300"
                  }`}
                >

                  <div
                    className={`flex items-center ${
                      isUsersPage
                        ? "justify-center"
                        : "ml-3 gap-3"
                    }`}
                  >

                    <i
                      className={`bx bx-import flex-shrink-0 ${
                        isUsersPage
                          ? "text-[20px]"
                          : "text-[18px]"
                      } ${
                        isDarkMode
                          ? "text-gray-100 drop-shadow-[0_0_2px_rgba(255,255,255,0.35)]"
                          : "text-amber-700"
                      }`}
                    />


                    {!isUsersPage && (
                      <span
                        className={`outfit-500 text-[15px] whitespace-nowrap ${
                          isActive("/import-questions")
                            ? "font-semibold text-amber-950 dark:text-gray-100"
                            : "text-amber-700 dark:text-gray-400 hover:text-amber-900 dark:hover:text-orange-300"
                        }`}
                      >
                        Import
                      </span>
                    )}

                  </div>

                </Link>


                {isUsersPage && (
                  <span className="pointer-events-none absolute top-1/2 left-full ml-2 -translate-y-1/2 rounded-md bg-amber-950 px-2 py-1 text-xs whitespace-nowrap text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 dark:bg-gray-700">
                    Import
                  </span>
                )}

              </div>

            </li>
          )}

        </ul>


        {/* =====================================================
            SUBJECTS / QUALIFYING EXAM
        ===================================================== */}

        {(parsedRoleId === 2 ||
          parsedRoleId === 3 ||
          parsedRoleId === 4 ||
          parsedRoleId === 5) && (

          <div className="relative z-10 flex flex-col space-y-[5px]">

            <div className="px-3">

              <div className="mb-4 h-px w-full bg-amber-700/20 dark:bg-gray-700/70" />

              {!isUsersPage && (
                <div className="outfit-500 px-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-800/80 dark:text-gray-400">
                  QUALIFYING EXAM
                </div>
              )}

            </div>


            <ul>

              {classes.map(
                (item, index) => {

                  const subjectsPath =
                    parsedRoleId === 2
                      ? "/faculty/subjects"
                      : parsedRoleId === 3
                        ? "/program-chair/subjects"
                        : parsedRoleId === 4
                          ? "/dean/subjects"
                          : "/asso-dean/subjects";


                  const subjectActive =
                    isActive(
                      subjectsPath
                    );


                  return (
                    <li
                      key={index}
                      className="group relative"
                    >

                      <span
                        className={`absolute top-1/2 left-0 h-6 w-[5px] -translate-y-1/2 rounded-tr-lg rounded-br-lg ${
                          subjectActive
                            ? "bg-amber-600"
                            : "bg-transparent"
                        }`}
                      />


                      <div className="mt-1 px-3">

                        <Link
                          to={
                            subjectsPath
                          }
                          onClick={
                            handleMenuClick
                          }
                          className={`group flex cursor-pointer items-center rounded-lg transition-colors hover:bg-amber-900/10 dark:hover:bg-orange-500/10 ${
                            isUsersPage
                              ? "justify-center py-[10px]"
                              : "justify-start py-[6px]"
                          } ${
                            subjectActive
                              ? "bg-amber-900/10 text-amber-950 dark:text-gray-100"
                              : "text-amber-700 dark:text-gray-400"
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
                                  subjectActive
                                    ? SubjectsIconH
                                    : SubjectsIcon
                                }
                                alt="Subjects"
                                className={`${
                                  isUsersPage
                                    ? "size-[20px]"
                                    : "size-[18px]"
                                } flex-shrink-0`}
                                style={getDarkIconStyle(
                                  subjectActive
                                )}
                              />

                            </span>


                            {!isUsersPage && (
                              <span
                                className={`outfit-500 text-[15px] whitespace-nowrap ${
                                  subjectActive
                                    ? "font-semibold text-amber-950 dark:text-gray-100"
                                    : "text-amber-700 dark:text-gray-400"
                                }`}
                              >
                                {item.label}
                              </span>
                            )}

                          </div>

                        </Link>


                        {isUsersPage && (
                          <span className="pointer-events-none absolute top-1/2 left-full ml-2 -translate-y-1/2 rounded-md bg-amber-950 px-2 py-1 text-xs whitespace-nowrap text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 dark:bg-gray-700">
                            {item.label}
                          </span>
                        )}

                      </div>

                    </li>
                  );
                }
              )}


              {/* =================================================
                  EXPORT
                  Visible to Faculty and up.
              ================================================= */}

              {parsedRoleId >= 2 && (
                <li className="group relative">

                  <div className="px-3">

                    <button
                      onClick={() => {
                        setActiveMenu(
                          "Print"
                        );

                        printButton.onClick();
                      }}
                      className={`group mt-[6px] mb-[6px] flex w-full cursor-pointer items-center rounded-lg transition-colors hover:bg-amber-900/10 dark:hover:bg-orange-500/10 ${
                        isUsersPage
                          ? "justify-center py-[10px]"
                          : "justify-start py-[6px]"
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
                          className="size-[20px] flex-shrink-0"
                          style={getDarkIconStyle(
                            showPrintModal
                          )}
                        />


                        {!isUsersPage && (
                          <span
                            className={`outfit-500 text-[15px] whitespace-nowrap ${
                              showPrintModal
                                ? "font-semibold text-amber-950 dark:text-gray-100"
                                : "text-amber-700 dark:text-gray-400"
                            }`}
                          >
                            Export
                          </span>
                        )}

                      </div>

                    </button>


                    {isUsersPage && (
                      <span className="pointer-events-none absolute top-1/2 left-full ml-2 -translate-y-1/2 rounded-md bg-amber-950 px-2 py-1 text-xs whitespace-nowrap text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 dark:bg-gray-700">
                        Export
                      </span>
                    )}

                  </div>

                </li>
              )}



            </ul>

          </div>
        )}


        {/* =====================================================
            FOOTER
        ===================================================== */}

        <div className="absolute bottom-4 left-0 z-10 w-full">

          {/* CAPS */}

          <div className="px-3">

            <div className="mb-2 h-px w-full bg-amber-700/20 dark:bg-gray-700/70" />

            <button
              onClick={() =>
                navigate(
                  "/team-rvw"
                )
              }
              className={`group flex w-full cursor-pointer items-center rounded-lg px-3 py-[8px] transition-colors hover:bg-amber-900/10 dark:hover:bg-orange-500/10 ${
                isUsersPage
                  ? "justify-center"
                  : "justify-start"
              }`}
            >

              <div
                className={`flex items-center ${
                  isUsersPage
                    ? ""
                    : "gap-[10px]"
                }`}
              >

                <img
                  src={CollegeLogo}
                  alt="CAPS"
                  className="size-[20px] flex-shrink-0"
                  style={getDarkIconStyle()}
                />


                {!isUsersPage && (
                  <span className="outfit-500 flex items-baseline gap-1 text-[15px] whitespace-nowrap text-amber-700 dark:text-gray-400">
                    CAPS - REVIEW
                    <span className="text-xs font-medium">
                      <AppVersion />
                    </span>
                  </span>
                )}

              </div>

            </button>

          </div>

        </div>

      </div>


      {/* =====================================================
          PRINT MODAL
      ===================================================== */}

      <PrintExamModal
        isOpen={
          showPrintModal === true
        }
        onClose={() =>
          setShowPrintModal(false)
        }
      />


      {/* =====================================================
          LOGOUT MODAL
      ===================================================== */}

      {showLogoutModal && (
        <div className="lightbox-bg fixed inset-0 z-[200] flex items-center justify-center">

          <div className="animate-fade-in-up flex w-[90vw] max-w-xs flex-col items-center rounded-2xl bg-white p-6 shadow-xl dark:bg-[#171d25] dark:text-gray-100">

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


            <div className="outfit-400 mb-5 text-center text-[14px] text-gray-500 dark:text-gray-400">
              Are you sure you want to log out?
            </div>


            <button
              className="outfit-400 mb-2 w-full cursor-pointer rounded-lg bg-orange-500 py-2 text-[16px] font-semibold text-white transition hover:bg-orange-700"
              onClick={
                handleLogout
              }
              disabled={
                isLoggingOut
              }
            >
              {isLoggingOut ? (
                <span className="flex items-center justify-center">
                  <span className="loader-white mr-2" />
                </span>
              ) : (
                "Yes, Log out"
              )}
            </button>


            <button
              className="border-color outfit-400 w-full cursor-pointer rounded-lg border py-2 text-[16px] font-semibold text-gray-700 transition hover:bg-gray-200 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
              onClick={() =>
                setShowLogoutModal(
                  false
                )
              }
              disabled={
                isLoggingOut
              }
            >
              Cancel
            </button>

          </div>

        </div>
      )}


      {/* =====================================================
          PROFILE MODALS
      ===================================================== */}

      <ProfileModalsHost
        profile={profile}
        showToast={showToast}
      />


      {/* =====================================================
          TOAST
      ===================================================== */}

      <Toast
        message={toast.message}
        type={toast.type}
        show={toast.show}
      />

    </>
  );
};


export default Sidebar;
