import { useState, useEffect } from "react";
import univLogo from "../assets/univLogo.png";
import collegeLogo from "/src/assets/college-logo.png";
import { useNavigate } from "react-router-dom";
import AppVersion from "../components/appVersion";
import Toast from "../components/Toast";
import useToast from "../hooks/useToast";
import {
  getRememberedUserCode,
  isRememberMeEnabled,
  setAuth,
  setRememberedUserCode,
} from "../utils/authStorage";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const apiUrl = import.meta.env.VITE_API_BASE_URL;

  const { toast, showToast } = useToast();

  const [isLogIn, setIsLogIn] = useState(false);
  const [rememberMe, setRememberMe] = useState(() =>
    isRememberMeEnabled(),
  );

  useEffect(() => {
    if (isRememberMeEnabled()) {
      setUsername(getRememberedUserCode());
    } else {
      setUsername("");
      setRememberMe(false);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLogIn(true);

    if (!username.trim() || !password.trim()) {
      showToast("Please enter both Username and Password.", "error");
      setIsLogIn(false);
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          userCode: username,
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          showToast(
            data.message || "Incorrect username or password",
            "error",
          );
        } else {
          showToast(
            data.message || "Something went wrong. Please try again later.",
            "error",
          );
        }
        return;
      }

      setRememberedUserCode(rememberMe ? username.trim() : "");

      setAuth({
        token: data.token,
        user: data.user,
        rememberMe,
      });

      navigate(
        `/dashboard/${data.user.userID || data.user.id || data.user._id}`,
      );

      const roleId = Number(data.user.roleID);

      switch (roleId) {
        case 1:
          navigate("/student-dashboard");
          break;

        case 2:
          navigate("/faculty-dashboard");
          break;

        case 3:
          navigate("/program-chair-dashboard");
          break;

        case 4:
          navigate("/dean-dashboard");
          break;

        case 5:
          navigate("/asso-dean-dashboard");
          break;

        default:
          setError("Invalid user role.");
          break;
      }
    } catch (error) {
      showToast(
        "Something went wrong. Please try again later.",
        "error",
      );
    } finally {
      setIsLogIn(false);
    }
  };

  return (
    <>
      {/* =========================================================
          DESKTOP LOGIN - ORANGE & WHITE BACKGROUND
      ========================================================= */}
      <div
        className="
          relative
          hidden
          min-h-screen
          w-full
          overflow-hidden
          bg-gradient-to-br from-orange-50 via-white to-orange-100
          lg:block
        "
      >
        {/* Background Glows */}
        <div className="pointer-events-none absolute inset-0 bg-white/10 backdrop-blur-[2px]" />

        {/* Orange Glow */}
        <div
          className="
            pointer-events-none
            absolute
            -top-32
            -left-32
            h-[450px]
            w-[450px]
            rounded-full
            bg-orange-300/30
            blur-[120px]
          "
        />

        {/* White Glow */}
        <div
          className="
            pointer-events-none
            absolute
            -right-32
            -bottom-32
            h-[450px]
            w-[450px]
            rounded-full
            bg-white/60
            blur-[120px]
          "
        />

        {/* Center Glow */}
        <div
          className="
            pointer-events-none
            absolute
            top-1/2
            left-1/2
            h-[350px]
            w-[350px]
            -translate-x-1/2
            -translate-y-1/2
            rounded-full
            bg-orange-200/20
            blur-[100px]
          "
        />

        <div className="relative z-10 flex min-h-screen flex-row">
          {/* ===================================================
              LEFT SECTION
          =================================================== */}
          <div
            className="
              mr-18
              flex
              min-h-screen
              w-full
              flex-col
              items-center
              justify-center
              p-6
              lg:w-1/2
            "
          >
            {/* University Logos */}
            <div
              className="
                absolute
                top-3
                left-3
                flex
                items-center
                space-x-2
                rounded-2xl
                border
                border-orange-200/50
                bg-white/70
                px-3
                py-2
                shadow-lg
                backdrop-blur-xl
              "
            >
              <img
                src={univLogo}
                alt="University Logo"
                className="size-8"
              />

              <img
                src={collegeLogo}
                alt="College Logo"
                className="size-8"
              />

              <h1 className="outfit-500 text-xs text-gray-800 drop-shadow-md lg:text-lg">
                JOSE RIZAL MEMORIAL STATE UNIVERSITY
              </h1>
            </div>

            {/* Title */}
            <div
              className="
                outfit-700
                mt-20
                hidden
                flex-col
                items-center
                justify-center
                lg:flex
              "
            >
              <h1 className="text-3xl leading-snug drop-shadow-lg text-gray-900 lg:text-4xl">
                <span className="text-5xl text-orange-500">C</span>
                OMPREHENSIVE
                <br />

                <span className="text-5xl text-orange-500">A</span>
                SSESSMENT AND
                <br />

                <span className="text-5xl text-orange-500">P</span>
                REPARATION
                <br />

                <span className="text-5xl text-orange-500">S</span>
                YSTEM
              </h1>

              <p
                className="
                  outfit-400
                  mt-20
                  mr-10
                  hidden
                  max-w-xs
                  text-center
                  text-sm
                  text-gray-600
                  drop-shadow
                  lg:block
                "
              >
                A platform designed to help students practice and prepare
                for subjects while assessing their knowledge
                through randomized questions.
              </p>
            </div>

            {/* Mobile Title */}
            <div className="outfit mt-12 flex flex-col items-center justify-center lg:hidden">
              <h1
                className="
                  text-center
                  text-[20px]
                  leading-snug
                  font-bold
                  tracking-wide
                  whitespace-nowrap
                  text-gray-900
                  drop-shadow-lg
                  sm:text-[30px]
                "
              >
                <span>
                  <span className="text-3xl text-orange-500">C</span>
                  OMPREHENSIVE
                </span>

                <span>
                  <span className="text-3xl text-orange-500"> A</span>
                  SSESSMENT
                </span>

                <br />

                <span>AND</span>

                <span>
                  <span className="text-3xl text-orange-500"> P</span>
                  REPARATION
                </span>

                <span>
                  <span className="text-3xl text-orange-500"> S</span>
                  YSTEM
                </span>
              </h1>
            </div>
          </div>

          {/* ===================================================
              RIGHT SECTION - GLASS LOGIN CARD
          =================================================== */}
          <div
            className="
              outfit-400
              mt-30
              flex
              w-full
              items-center
              justify-center
              p-6
              sm:mt-30
              md:mt-30
              lg:mt-0
              lg:w-1/2
            "
          >
            <div
              className="
                relative
                w-full
                max-w-md
                overflow-hidden
                rounded-[30px]
                border
                border-orange-200/50
                bg-white/80
                p-7
                shadow-[0_25px_70px_rgba(0,0,0,0.08)]
                backdrop-blur-2xl
                sm:p-9
              "
            >
              {/* Glass Highlight */}
              <div
                className="
                  pointer-events-none
                  absolute
                  inset-x-8
                  top-0
                  h-px
                  bg-gradient-to-r
                  from-transparent
                  via-orange-300/50
                  to-transparent
                "
              />

              {/* Top Glass Shine */}
              <div
                className="
                  pointer-events-none
                  absolute
                  -top-20
                  left-1/2
                  h-40
                  w-40
                  -translate-x-1/2
                  rounded-full
                  bg-orange-200/20
                  blur-3xl
                "
              />

              <div className="relative z-10 text-center">
                {/* Login Icon */}
                <div
                  className="
                    mx-auto
                    mb-4
                    flex
                    size-14
                    items-center
                    justify-center
                    rounded-2xl
                    border
                    border-orange-200/50
                    bg-orange-100
                    shadow-lg
                    backdrop-blur-xl
                  "
                >
                  <i className="bx bx-lock-open-alt text-2xl text-orange-500" />
                </div>

                <h2
                  className="
                    outfit-700
                    mb-1
                    text-[22px]
                    font-bold
                    text-gray-900
                  "
                >
                  Welcome Back
                </h2>

                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                  Please enter your details to login.
                </p>

                <form
                  className="mt-7 w-full"
                  onSubmit={handleLogin}
                >
                  {/* =================================================
                      USERNAME
                  ================================================= */}
                  <div className="relative mb-5">
                    <div className="relative">
                      <input
                        type="text"
                        id="username"
                        className="
                          peer
                          mt-2
                          w-full
                          rounded-2xl
                          border
                          border-orange-200/50
                          bg-white/60
                          px-4
                          py-[12px]
                          text-base
                          text-gray-900
                          shadow-sm
                          outline-none
                          backdrop-blur-md
                          transition-all
                          duration-200
                          placeholder-transparent
                          hover:bg-white/80
                          hover:shadow-md
                          focus:border-orange-400/70
                          focus:bg-white/80
                          focus:ring-4
                          focus:ring-orange-400/10
                        "
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                      />

                      <label
                        htmlFor="username"
                        className="
                          pointer-events-none
                          absolute
                          top-1/2
                          left-4
                          z-10
                          -translate-y-1/2
                          bg-transparent
                          px-1
                          text-base
                          text-gray-500
                          transition-all
                          duration-200

                          peer-placeholder-shown:top-1/2
                          peer-placeholder-shown:mt-1
                          peer-placeholder-shown:text-base

                          peer-focus:top-2
                          peer-focus:mt-0
                          peer-focus:bg-white/80
                          peer-focus:text-xs
                          peer-focus:text-orange-500

                          peer-[&:not(:placeholder-shown)]:top-2
                          peer-[&:not(:placeholder-shown)]:text-xs
                        "
                      >
                        Username
                      </label>
                    </div>
                  </div>

                  {/* =================================================
                      PASSWORD
                  ================================================= */}
                  <div className="relative mb-4">
                    <div className="relative flex items-center overflow-hidden">
                      <input
                        type={
                          passwordVisible ? "text" : "password"
                        }
                        id="password"
                        className="
                          peer
                          mt-2
                          w-full
                          rounded-2xl
                          border
                          border-orange-200/50
                          bg-white/60
                          px-4
                          py-[12px]
                          pr-12
                          text-base
                          text-gray-900
                          shadow-sm
                          outline-none
                          backdrop-blur-md
                          transition-all
                          duration-200
                          placeholder-transparent
                          hover:bg-white/80
                          hover:shadow-md
                          focus:border-orange-400/70
                          focus:bg-white/80
                          focus:ring-4
                          focus:ring-orange-400/10
                        "
                        placeholder=" "
                        value={password}
                        onChange={(e) =>
                          setPassword(e.target.value)
                        }
                        autoComplete="current-password"
                      />

                      <label
                        htmlFor="password"
                        className="
                          pointer-events-none
                          absolute
                          top-1/2
                          left-4
                          z-10
                          -translate-y-1/2
                          bg-transparent
                          px-1
                          text-base
                          text-gray-500
                          transition-all
                          duration-200

                          peer-placeholder-shown:top-1/2
                          peer-placeholder-shown:mt-1
                          peer-placeholder-shown:text-base

                          peer-focus:top-2
                          peer-focus:mt-0
                          peer-focus:bg-white/80
                          peer-focus:text-xs
                          peer-focus:text-orange-500

                          peer-[&:not(:placeholder-shown)]:top-2
                          peer-[&:not(:placeholder-shown)]:text-xs
                        "
                      >
                        Password
                      </label>

                      <button
                        type="button"
                        className="
                          absolute
                          top-[19px]
                          right-3
                          text-gray-400
                          transition-colors
                          hover:text-orange-500
                        "
                        onClick={() =>
                          setPasswordVisible((v) => !v)
                        }
                        tabIndex={-1}
                      >
                        <i
                          className={`bx ${
                            passwordVisible
                              ? "bx-eye-alt text-orange-500"
                              : "bx-eye-slash"
                          } text-[24px]`}
                        />
                      </button>
                    </div>

                    {error && (
                      <p className="mt-3 text-center text-xs text-red-500">
                        {error}
                      </p>
                    )}
                  </div>

                  {/* =================================================
                      REMEMBER ME & FORGOT PASSWORD - BROWN
                  ================================================= */}
                  <div className="flex items-center justify-between mb-4">
                    <label
                      className="
                        outfit-400
                        flex
                        cursor-pointer
                        items-center
                        gap-2
                        text-sm
                        text-gray-600
                      "
                    >
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) =>
                          setRememberMe(e.target.checked)
                        }
                        className="
                          h-4
                          w-4
                          cursor-pointer
                          rounded
                          border-gray-300
                          accent-orange-500
                        "
                      />

                      Remember me
                    </label>

                    <button
                      type="button"
                      className="
                        cursor-pointer
                        text-sm
                        text-[#8B6914]
                        transition
                        hover:text-[#6B4F12]
                        hover:underline
                      "
                      onClick={() =>
                        navigate("/forgot-password")
                      }
                    >
                      Forgot password?
                    </button>
                  </div>

                  {/* =================================================
                      LOGIN BUTTON - ORANGE
                  ================================================= */}
                  <button
                    type="submit"
                    disabled={isLogIn}
                    className="
                      mb-2
                      flex
                      w-full
                      cursor-pointer
                      items-center
                      justify-center
                      rounded-2xl
                      border
                      border-orange-300/40
                      bg-gradient-to-r
                      from-orange-500
                      to-orange-600
                      py-[12px]
                      text-base
                      font-semibold
                      text-white
                      shadow-[0_8px_25px_rgba(249,115,22,0.25)]
                      backdrop-blur-md
                      transition-all
                      duration-300
                      ease-in-out
                      hover:-translate-y-0.5
                      hover:brightness-110
                      hover:shadow-[0_12px_30px_rgba(249,115,22,0.35)]
                      active:scale-[0.98]
                      disabled:cursor-not-allowed
                      disabled:opacity-60
                    "
                  >
                    {isLogIn ? (
                      <div className="flex items-center justify-center">
                        <span className="loader-white"></span>
                      </div>
                    ) : (
                      "Login"
                    )}
                  </button>

                  {/* =================================================
                      REGISTER - BROWN
                  ================================================= */}
                  <p
                    className="
                      mt-5
                      mb-4
                      text-center
                      text-[14px]
                      text-gray-600
                    "
                  >
                    Don't have an account?{" "}
                    <span
                      onClick={() => navigate("/register")}
                      className="
                        cursor-pointer
                        font-medium
                        text-[#8B6914]
                        transition
                        hover:text-[#6B4F12]
                        hover:underline
                      "
                    >
                      Register
                    </span>
                  </p>

                  {/* Developer */}
                  <span className="text-xs text-gray-400">
                    Developed by{" "}
                    <span
                      onClick={() => navigate("/team-REVA")}
                      className="
                        cursor-pointer
                        text-orange-500
                        hover:underline
                      "
                    >
                      Team REVA
                    </span>
                  </span>
                </form>
              </div>
            </div>
          </div>

          {/* App Version */}
          <div
            className="
              absolute
              bottom-3
              left-1/2
              flex
              -translate-x-1/2
              transform
              items-center
              space-x-2
              text-gray-400
              lg:left-8
            "
          >
            <AppVersion />
          </div>
        </div>
      </div>

      {/* =========================================================
          MOBILE LOGIN - ORANGE & WHITE BACKGROUND
      ========================================================= */}
      <div
        className="
          relative
          flex
          min-h-screen
          flex-col
          overflow-hidden
          bg-gradient-to-br from-orange-50 via-white to-orange-100
          lg:hidden
        "
      >
        {/* Mobile Background Glows */}
        <div
          className="
            pointer-events-none
            absolute
            -top-20
            -right-20
            h-72
            w-72
            rounded-full
            bg-orange-300/30
            blur-[90px]
          "
        />

        <div
          className="
            pointer-events-none
            absolute
            bottom-40
            -left-20
            h-72
            w-72
            rounded-full
            bg-orange-200/20
            blur-[90px]
          "
        />

        {/* =====================================================
            MOBILE HEADER
        ===================================================== */}
        <div
          className="
            relative
            flex
            h-60
            w-full
            flex-col
            items-center
            justify-center
            border-b
            border-orange-200/30
            bg-white/60
            backdrop-blur-xl
          "
        >
          {/* Register - BROWN */}
          <div className="outfit absolute top-5 right-5">
            <span className="mr-2 text-[12px] text-gray-600">
              Don't have an account?
            </span>

            <button
              onClick={() => navigate("/register")}
              className="
                cursor-pointer
                rounded-xl
                border
                border-[#8B6914]/30
                bg-[#8B6914]/10
                px-4
                py-1.5
                text-[14px]
                font-medium
                text-[#8B6914]
                shadow-md
                backdrop-blur-md
                transition
                hover:bg-[#8B6914]/20
              "
            >
              Sign in
            </button>
          </div>

          {/* Logos */}
          <div
            className="
              absolute
              top-5
              left-5
              z-10
              flex
              items-center
              gap-3
              rounded-xl
              border
              border-orange-200/50
              bg-white/70
              px-2
              py-1.5
              backdrop-blur-md
            "
          >
            <img
              src={univLogo}
              alt="University Logo"
              className="size-8 object-contain"
            />

            <img
              src={collegeLogo}
              alt="College Logo"
              className="size-8 object-contain"
            />
          </div>

          {/* REVA Title */}
          <div className="mt-5 mb-1 flex flex-col items-center">
            <h1
              className="
                text-center
                text-[22px]
                font-bold
                tracking-wide
                whitespace-nowrap
                text-gray-900
                drop-shadow-lg
                sm:text-[30px]
              "
            >
              <span>
                <span className="text-3xl text-orange-500">
                  C
                </span>
                OMPREHENSIVE
              </span>

              <span>
                <span className="text-3xl text-orange-500">
                  {" "}
                  A
                </span>
                SSESSMENT
              </span>

              <br />

              <span>AND</span>

              <span>
                <span className="text-3xl text-orange-500">
                  {" "}
                  P
                </span>
                REPARATION
              </span>

              <span>
                <span className="text-3xl text-orange-500">
                  {" "}
                  S
                </span>
                YSTEM
              </span>
            </h1>
          </div>
        </div>

        {/* Glass Transition */}
        <div
          className="
            relative
            z-10
            mx-auto
            -mt-7
            h-[30px]
            w-[85%]
            rounded-t-[30px]
            border
            border-b-0
            border-orange-200/50
            bg-white/60
            shadow-lg
            backdrop-blur-xl
          "
        />

        {/* =====================================================
            MOBILE GLASS LOGIN CARD
        ===================================================== */}
        <div
          className="
            relative
            z-20
            -mt-1
            flex
            w-full
            flex-1
            flex-col
            items-center
            justify-start
            rounded-t-[32px]
            border-t
            border-orange-200/50
            bg-white/80
            px-6
            pt-7
            pb-8
            shadow-[0_-15px_40px_rgba(0,0,0,0.06)]
            backdrop-blur-2xl
          "
        >
          {/* Glass shine */}
          <div
            className="
              pointer-events-none
              absolute
              top-0
              left-1/2
              h-px
              w-3/4
              -translate-x-1/2
              bg-gradient-to-r
              from-transparent
              via-orange-300/50
              to-transparent
            "
          />

          {/* Login Icon */}
          <div
            className="
              mb-3
              flex
              size-12
              items-center
              justify-center
              rounded-2xl
              border
              border-orange-200/50
              bg-orange-100
              shadow-md
              backdrop-blur-xl
            "
          >
            <i className="bx bx-lock-open-alt text-xl text-orange-500" />
          </div>

          <h2 className="mb-1 text-[20px] font-bold text-gray-900">
            Welcome Back
          </h2>

          <p className="mb-5 max-w-80 text-center text-xs leading-relaxed text-gray-500 md:max-w-full">
            Please enter your details to login.
          </p>

          <form
            className="
              mt-2
              flex
              w-full
              flex-col
              gap-4
              sm:max-w-md
              md:max-w-xl
            "
            onSubmit={handleLogin}
          >
            {/* Username */}
            <div className="relative w-full">
              <div className="relative">
                <input
                  type="text"
                  id="mobileUsername"
                  className="
                    peer
                    mt-2
                    w-full
                    rounded-2xl
                    border
                    border-orange-200/50
                    bg-white/60
                    px-4
                    py-[12px]
                    text-base
                    text-gray-900
                    shadow-sm
                    outline-none
                    backdrop-blur-md
                    transition-all
                    duration-200
                    placeholder-transparent
                    focus:border-orange-400/70
                    focus:bg-white/80
                    focus:ring-4
                    focus:ring-orange-400/10
                  "
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />

                <label
                  htmlFor="mobileUsername"
                  className="
                    pointer-events-none
                    absolute
                    top-1/2
                    left-4
                    z-10
                    -translate-y-1/2
                    bg-transparent
                    px-1
                    text-base
                    text-gray-500
                    transition-all
                    duration-200

                    peer-placeholder-shown:top-1/2
                    peer-placeholder-shown:mt-1
                    peer-placeholder-shown:text-base

                    peer-focus:top-2
                    peer-focus:mt-0
                    peer-focus:bg-white/80
                    peer-focus:text-xs
                    peer-focus:text-orange-500

                    peer-[&:not(:placeholder-shown)]:top-2
                    peer-[&:not(:placeholder-shown)]:text-xs
                  "
                >
                  Username
                </label>
              </div>
            </div>

            {/* Password */}
            <div className="relative w-full">
              <div className="relative">
                <input
                  type={
                    passwordVisible ? "text" : "password"
                  }
                  id="mobilePassword"
                  className="
                    peer
                    mt-2
                    w-full
                    rounded-2xl
                    border
                    border-orange-200/50
                    bg-white/60
                    px-4
                    py-[12px]
                    pr-12
                    text-base
                    text-gray-900
                    shadow-sm
                    outline-none
                    backdrop-blur-md
                    transition-all
                    duration-200
                    placeholder-transparent
                    focus:border-orange-400/70
                    focus:bg-white/80
                    focus:ring-4
                    focus:ring-orange-400/10
                  "
                  placeholder=" "
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  autoComplete="current-password"
                />

                <label
                  htmlFor="mobilePassword"
                  className="
                    pointer-events-none
                    absolute
                    top-1/2
                    left-4
                    z-10
                    -translate-y-1/2
                    bg-transparent
                    px-1
                    text-base
                    text-gray-500
                    transition-all
                    duration-200

                    peer-placeholder-shown:top-1/2
                    peer-placeholder-shown:mt-1
                    peer-placeholder-shown:text-base

                    peer-focus:top-2
                    peer-focus:mt-0
                    peer-focus:bg-white/80
                    peer-focus:text-xs
                    peer-focus:text-orange-500

                    peer-[&:not(:placeholder-shown)]:top-2
                    peer-[&:not(:placeholder-shown)]:text-xs
                  "
                >
                  Password
                </label>

                <button
                  type="button"
                  className="
                    absolute
                    top-[21px]
                    right-3
                    text-gray-400
                    transition-colors
                    hover:text-orange-500
                  "
                  onClick={() =>
                    setPasswordVisible((v) => !v)
                  }
                  tabIndex={-1}
                >
                  <i
                    className={`bx ${
                      passwordVisible
                        ? "bx-eye-alt text-orange-500"
                        : "bx-eye-slash"
                    } text-[25px]`}
                  />
                </button>
              </div>
            </div>

            {error && (
              <p className="text-center text-xs text-red-500">
                {error}
              </p>
            )}

            {/* Remember Me & Forgot Password - BROWN */}
            <div className="flex items-center justify-between">
              <label
                className="
                  outfit-400
                  flex
                  cursor-pointer
                  items-center
                  gap-2
                  text-sm
                  text-gray-600
                "
              >
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) =>
                    setRememberMe(e.target.checked)
                  }
                  className="
                    h-4
                    w-4
                    cursor-pointer
                    rounded
                    border-gray-300
                    accent-orange-500
                  "
                />

                Remember me
              </label>

              <button
                type="button"
                className="
                  cursor-pointer
                  text-sm
                  text-[#8B6914]
                  transition
                  hover:text-[#6B4F12]
                  hover:underline
                "
                onClick={() =>
                  navigate("/forgot-password")
                }
              >
                Forgot password?
              </button>
            </div>

            {/* Login - ORANGE */}
            <button
              type="submit"
              disabled={isLogIn}
              className="
                mt-3
                mb-1
                flex
                w-full
                cursor-pointer
                items-center
                justify-center
                rounded-2xl
                border
                border-orange-300/40
                bg-gradient-to-r
                from-orange-500
                to-orange-600
                py-3
                text-base
                font-semibold
                text-white
                shadow-[0_8px_25px_rgba(249,115,22,0.25)]
                transition-all
                duration-300
                hover:-translate-y-0.5
                hover:brightness-110
                active:scale-[0.98]
                disabled:opacity-60
              "
            >
              {isLogIn ? (
                <div className="flex items-center justify-center">
                  <span className="loader-white"></span>
                </div>
              ) : (
                "Login"
              )}
            </button>
          </form>

          {/* Register - BROWN */}
          <p
            className="
              mt-5
              mb-4
              text-center
              text-[14px]
              text-gray-600
            "
          >
            Don't have an account?{" "}
            <span
              onClick={() => navigate("/register")}
              className="
                cursor-pointer
                font-medium
                text-[#8B6914]
                transition
                hover:text-[#6B4F12]
                hover:underline
              "
            >
              Register
            </span>
          </p>

          {/* App Version */}
          <div className="my-2 flex w-full items-center">
            <div className="h-px flex-1 bg-orange-200/50"></div>

            <span className="mx-2 text-xs text-gray-400">
              <AppVersion />
            </span>

            <div className="h-px flex-1 bg-orange-200/50"></div>
          </div>

          {/* Developer */}
          <span className="mx-2 text-xs text-gray-400">
            Developed by{" "}
            <button
              onClick={() => navigate("/team-REVA")}
              className="
                cursor-pointer
                text-orange-500
                hover:underline
              "
            >
              Team REVA
            </button>
          </span>
        </div>
      </div>

      {/* Toast */}
      <Toast
        message={toast.message}
        type={toast.type}
        show={toast.show}
      />
    </>
  );
}