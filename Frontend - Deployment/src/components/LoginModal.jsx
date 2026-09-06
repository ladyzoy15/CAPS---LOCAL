import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import collegeLogo from "/src/assets/college-logo.png";
import Toast from "./Toast";
import useToast from "../hooks/useToast";
import {
  getDashboardPathForRole,
  getRememberedUserCode,
  isRememberMeEnabled,
  setAuth,
  setRememberedUserCode,
} from "../utils/authStorage";

export default function LoginModal({
  isOpen,
  onClose,
  onSwitchToRegister,
  onSwitchToForgotPassword,
  onSwitchToForgotUserCode,
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLogIn, setIsLogIn] = useState(false);
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const { toast, showToast } = useToast();

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  // Prevent background scroll when open
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setUsername(getRememberedUserCode());
      setRememberMe(isRememberMeEnabled());
      setPassword("");
      setError("");
    } else {
      setUsername("");
      setPassword("");
      setRememberMe(false);
      setError("");
      setPasswordVisible(false);
      setIsLogIn(false);
    }
  }, [isOpen]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLogIn(true);

    if (!username.trim() || !password.trim()) {
      setError("Please enter both Username and Password.");
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

      let data;
      try {
        data = await response.json();
      } catch (parseErr) {
        console.error("LOGIN: failed to parse response as JSON", parseErr);
        setError("Unexpected server response. Please try again later.");
        showToast("Unexpected server response. Please try again later.", "error");
        return;
      }

      console.log("LOGIN RESPONSE:", data);

      if (!response.ok) {
        const errMsg = data?.message || "Incorrect username or password";
        setError(errMsg);
        showToast(errMsg, "error");
        return;
      }

      if (!data || !data.user) {
        console.error("LOGIN: response.ok was true but data.user is missing", data);
        setError("Login succeeded but user data was missing.");
        showToast("Login succeeded but user data was missing.", "error");
        return;
      }

      if (data.user.roleID === undefined || data.user.roleID === null) {
        console.error("LOGIN: data.user.roleID is missing", data.user);
        setError("Your account role is missing. Contact support.");
        showToast("Your account role is missing. Contact support.", "error");
        return;
      }

      const roleId = Number(data.user.roleID);

      // ── ROLE CHECKING ──
      // 1 = student, 2 = faculty, 3 = program chair, 4 = dean, 5 = associate dean
      const ALLOWED_ROLES = [2, 4, 5];

      if (roleId === 1 || !ALLOWED_ROLES.includes(roleId)) {
        setError("Unauthorized Access");
        showToast("Unauthorized Access", "error");
        return;
      }

      setRememberedUserCode(rememberMe ? username.trim() : "");
      setAuth({
        token: data.token,
        user: data.user,
        rememberMe,
      });

      const dashboardPath = getDashboardPathForRole(data.user.roleID);
      if (dashboardPath) {
        navigate(dashboardPath);
      } else {
        setError("Invalid user role.");
      }
    } catch (err) {
      console.error("LOGIN: unexpected error", err);
      setError("Something went wrong. Please try again later.");
      showToast("Something went wrong. Please try again later.", "error");
    } finally {
      setIsLogIn(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Toast inilipat sa ibabaw ug pinalapdan ang z-index container para makita jud sa ibabaw sa modal */}
      <div className="relative z-[9999]">
        <Toast message={toast.message} type={toast.type} show={toast.show} />
      </div>

      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[300] flex items-center justify-center overflow-hidden bg-orange/100 px-50 backdrop-blur-xl"
        onClick={onClose}
      >
        {/* Ambient glow blobs */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -left-20 h-[380px] w-[700px] rounded-full bg-orange-400/30 blur-[120px]" />
          <div className="absolute -right-24 top-10 h-[340px] w-[700px] rounded-full bg-yellow-800/40 blur-[120px]" />
          <div className="absolute -bottom-28 left-1/3 h-[360px] w-[400px] rounded-full bg-amber-600/40 blur-[130px]" />
        </div>

        {/* Modal card */}
        <div
          className="relative z-10 w-full max-w-[420px] overflow-hidden rounded-3xl border border-black/60 bg-white/5 p-8 shadow-[0_25px_70px_rgba(0,0,0,0.55)] backdrop-blur-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top glass shine */}
          <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />
          <div className="pointer-events-none absolute -top-20 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-blue-400/20 blur-3xl" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-black/50 bg-block/10 text-black-300 backdrop-blur-2xl transition hover:bg-white/15 hover:text-white"
            aria-label="Close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>

          {/* Logo */}
          <div className="relative z-10 mb-5 flex flex-col items-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-black/60 bg-white/5 shadow-lg backdrop-blur-xl">
              <img
                src={collegeLogo}
                alt="CAPS logo"
                className="size-9 object-contain"
              />
            </div>
          </div>

          {/* Heading */}
          <div className="relative z-10 mb-6 text-center">
            <h2 className="outfit-700 text-[40px] text-pink">
              Hello, there!
            </h2>
            <p className="outfit-400 mt-1 text-sm text-black-300">
              Please enter your details to login.
            </p>
          </div>

          <form
            onSubmit={handleLogin}
            className="relative z-10 flex flex-col gap-4"
          >
            {/* Username field */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="outfit-500 text-sm text-black-600">
                  Username
                </label>
              </div>
              <input
                type="text"
                id="modal-username"
                placeholder="e.g. juan.delacruz"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-xl border border-black/70 bg-white/5 px-4 py-2.5 pr-10 text-sm text-black transition outline-none placeholder:text-amber-700 hover:border-white/20 hover:bg-white/10 focus:border-white-400/60 focus:bg-orange/10 focus:ring-2 focus:ring-orange-600/30"
              />
            </div>

            {/* Password field */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="outfit-500 text-sm text-black-600">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onSwitchToForgotPassword?.();
                  }}
                  className="outfit-400 text-sm text-red-600 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={passwordVisible ? "text" : "password"}
                  placeholder="••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-black/70 bg-white/5 px-4 py-2.5 pr-10 text-sm text-black transition outline-none placeholder:text-amber-700 hover:border-white/20 hover:bg-white/10 focus:border-white-400/60 focus:bg-orange/10 focus:ring-2 focus:ring-orange-600/30"
                />
                <button
                  type="button"
                  onClick={() => setPasswordVisible((v) => !v)}
                  tabIndex={-1}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-black-500 transition hover:text-amber-800"
                >
                  <i
                    className={`bx ${passwordVisible ? "bx-eye-alt text-orange-400" : "bx-eye-slash"} text-[20px]`}
                  ></i>
                </button>
              </div>
            </div>

            <label className="outfit-400 flex cursor-pointer items-center gap-2 text-sm text-black-400">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 cursor-pointer rounded border-white/20 bg-white/5 accent-orange-500"
              />
              Remember me
            </label>

            {/* Direct error text inside modal */}
            {error && (
              <p className="rounded-lg bg-red-500/20 p-2 text-center text-xs font-semibold text-red-600">
                {error}
              </p>
            )}

            {/* Login button */}
            <button
              type="submit"
              disabled={isLogIn}
              className="outfit-400 mt-1 w-full cursor-pointer rounded-xl border border-black/50 bg-gradient-to-r from-orange-500 to-orange-500 py-3 text-sm font-semibold text-black shadow-[0_8px_25px_rgba(99,102,241,0.35)] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(99,102,241,0.45)] active:scale-[0.98] disabled:opacity-60"
            >
              {isLogIn ? (
                <div className="flex items-center justify-center">
                  <span className="loader-white"></span>
                </div>
              ) : (
                "Login"
              )}
            </button>

            {/* Register link */}
            <p className="outfit-400 text-center text-sm text-black-400">
              Don't have an account?{" "}
              <span
                onClick={() => {
                  onClose();
                  onSwitchToRegister?.();
                }}
                className="cursor-pointer font-medium text-red-500 hover:underline"
              >
                Sign Up
              </span>
            </p>
          </form>
        </div>
      </div>
    </>
  );
}