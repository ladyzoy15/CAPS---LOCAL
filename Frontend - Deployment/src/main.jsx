import "./pwaDeferredInstall.js";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/index.css";
import App from "./App.jsx";
import "./i18n.js";
import { syncPersistedSession } from "./utils/authStorage";

syncPersistedSession();

// ── CHANGED: Only register the service worker in a production build.
// Previously this ran unconditionally, which meant the service worker
// was also active during `npm run dev`. That caused it to intercept
// and sometimes corrupt/cache fetch requests like POST /login, leading
// to intermittent "failed to parse response as JSON" errors and stale
// JS bundles being served even after editing source files.
if (import.meta.env.PROD) {
  import("virtual:pwa-register")
    .then(({ registerSW }) => {
      registerSW({
        immediate: true,
        onRegisteredSW() {
          window.dispatchEvent(new CustomEvent("pwa-sw-ready"));
        },
        onRegisterError(err) {
          console.warn("[PWA] Service worker registration failed:", err);
        },
      });
    })
    .catch((err) => {
      console.warn("[PWA] Service worker import failed:", err);
    });
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
