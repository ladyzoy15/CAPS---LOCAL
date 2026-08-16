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
  const [idCode, setIdCode] = useState("");
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
      setIdCode(getRememberedUserCode());
      setRememberMe(isRememberMeEnabled());
      setPassword("");
      setError("");
    } else {
      setIdCode("");
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

    if (!idCode.trim() || !password.trim()) {
      showToast("Please enter both ID Code and Password.", "error");
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
          userCode: idCode,
          password: password,
        }),
      });

      // ── ADDED: Guard against non-JSON responses (e.g. HTML error pages,
      // empty bodies) so JSON.parse itself doesn't throw and get swallowed
      // by the generic catch block below.
      let data;
      try {
        data = await response.json();
      } catch (parseErr) {
        console.error("LOGIN: failed to parse response as JSON", parseErr);
        showToast("Unexpected server response. Please try again later.", "error");
        return;
      }

      // ── ADDED: Log the raw response so you can inspect the actual shape
      // the backend returns (open DevTools → Console after attempting login).
      console.log("LOGIN RESPONSE:", data);

      if (!response.ok) {
        if (response.status === 401) {
          showToast(data?.message || "Incorrect user code or password", "error");
        } else {
          showToast(
            data?.message || "Something went wrong. Please try again later.",
            "error",
          );
        }
        return;
      }

      // ── ADDED: Defensive checks — if the backend's success response
      // doesn't actually include `user` / `roleID` in the shape we expect,
      // show a clear message instead of silently crashing into the catch
      // block and showing the generic "something went wrong" toast.
      if (!data || !data.user) {
        console.error("LOGIN: response.ok was true but data.user is missing", data);
        showToast(
          "Login succeeded but user data was missing from the response.",
          "error",
        );
        return;
      }

      if (data.user.roleID === undefined || data.user.roleID === null) {
        console.error("LOGIN: data.user.roleID is missing", data.user);
        showToast(
          "Login succeeded but your account role is missing. Contact support.",
          "error",
        );
        return;
      }

      setRememberedUserCode(rememberMe ? idCode.trim() : "");
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
      // ── CHANGED: log the actual error instead of swallowing it silently,
      // so future issues are visible in the console instead of just showing
      // a generic toast.
      console.error("LOGIN: unexpected error", err);
      showToast("Something went wrong. Please try again later.", "error");
    } finally {
      setIsLogIn(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden bg-black/70 px-4 backdrop-blur-sm"
        onClick={onClose}
      >
        {/* Ambient glow blobs behind the glass card */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -left-20 h-[380px] w-[380px] rounded-full bg-blue-600/30 blur-[120px]" />
          <div className="absolute -right-24 top-10 h-[340px] w-[340px] rounded-full bg-purple-600/30 blur-[120px]" />
          <div className="absolute -bottom-28 left-1/3 h-[360px] w-[360px] rounded-full bg-yellow-400/20 blur-[130px]" />
        </div>

        {/* Modal card - dark glass */}
        <div
          className="relative z-10 w-full max-w-[420px] overflow-hidden rounded-3xl border border-white/15 bg-white/5 p-8 shadow-[0_25px_70px_rgba(0,0,0,0.55)] backdrop-blur-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top glass shine */}
          <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />
          <div className="pointer-events-none absolute -top-20 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-blue-400/20 blur-3xl" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-white/5 text-gray-300 backdrop-blur-md transition hover:bg-white/15 hover:text-white"
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
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/15 bg-white/5 shadow-lg backdrop-blur-xl">
              <img
                src={collegeLogo}
                alt="CAPS logo"
                className="size-9 object-contain"
              />
            </div>
          </div>

          {/* Heading */}
          <div className="relative z-10 mb-6 text-center">
            <h2 className="outfit-700 text-[22px] text-white">
              Welcome back
            </h2>
            <p className="outfit-400 mt-1 text-sm text-gray-400">
              Please enter your details to login.
            </p>
          </div>

          <form
            onSubmit={handleLogin}
            className="relative z-10 flex flex-col gap-4"
          >
            {/* ID Code field */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="outfit-500 text-sm text-gray-300">
                  ID Code
                </label>
                {/* <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onSwitchToForgotUserCode?.();
                  }}
                  className="outfit-400 text-sm text-yellow-400 hover:underline"
                >
                  Forgot ID code?
                </button> */}
              </div>
              <input
                type="text"
                id="modal-userCode"
                placeholder="e.g. 23-A-12345"
                value={idCode}
                onChange={(e) => setIdCode(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white transition outline-none placeholder:text-gray-500 hover:border-white/20 hover:bg-white/10 focus:border-blue-400/60 focus:bg-white/10 focus:ring-2 focus:ring-blue-400/20"
              />
            </div>

            {/* Password field */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="outfit-500 text-sm text-gray-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onSwitchToForgotPassword?.();
                  }}
                  className="outfit-400 text-sm text-yellow-400 hover:underline"
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
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 pr-10 text-sm text-white transition outline-none placeholder:text-gray-500 hover:border-white/20 hover:bg-white/10 focus:border-blue-400/60 focus:bg-white/10 focus:ring-2 focus:ring-blue-400/20"
                />
                <button
                  type="button"
                  onClick={() => setPasswordVisible((v) => !v)}
                  tabIndex={-1}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500 transition hover:text-gray-300"
                >
                  <i
                    className={`bx ${passwordVisible ? "bx-eye-alt text-yellow-400" : "bx-eye-slash"} text-[20px]`}
                  ></i>
                </button>
              </div>
            </div>

            <label className="outfit-400 flex cursor-pointer items-center gap-2 text-sm text-gray-400">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 cursor-pointer rounded border-white/20 bg-white/5 accent-blue-500"
              />
              Remember me
            </label>

            {error && (
              <p className="text-center text-xs text-red-400">{error}</p>
            )}

            {/* Login button - blue/purple gradient with yellow-tinted glow */}
            <button
              type="submit"
              disabled={isLogIn}
              className="outfit-400 mt-1 w-full cursor-pointer rounded-xl border border-white/10 bg-gradient-to-r from-blue-600 to-purple-600 py-3 text-sm font-semibold text-white shadow-[0_8px_25px_rgba(99,102,241,0.35)] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(99,102,241,0.45)] active:scale-[0.98] disabled:opacity-60"
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
            <p className="outfit-400 text-center text-sm text-gray-400">
              Don't have an account?{" "}
              <span
                onClick={() => {
                  onClose();
                  onSwitchToRegister?.();
                }}
                className="cursor-pointer font-medium text-yellow-400 hover:underline"
              >
                Register
              </span>
            </p>
          </form>
        </div>
      </div>

      <Toast message={toast.message} type={toast.type} show={toast.show} />
    </>
  );
}