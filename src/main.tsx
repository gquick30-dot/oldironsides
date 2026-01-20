import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
// ===== Klaviyo onsite loader =====
(function loadKlaviyo() {
  const COMPANY_ID = (import.meta as any).env?.VITE_KLAVIYO_COMPANY_ID as
    | string
    | undefined;

  if (!COMPANY_ID) return;
  if (typeof window === "undefined") return;

  // Prevent duplicates
  if ((window as any).__klaviyoLoaded) return;
  (window as any).__klaviyoLoaded = true;

  const s = document.createElement("script");
  s.async = true;
  s.src = `https://static.klaviyo.com/onsite/js/klaviyo.js?company_id=${encodeURIComponent(
    COMPANY_ID
  )}`;
  document.head.appendChild(s);
})();

// ===== CONFIG =====
// mode: "session" (show once per browser session), "daily" (once per day),
// "cooldown" (every N days), or "always" (every load — not recommended).
const PROMO_MODE: "session" | "daily" | "cooldown" | "always" = "session";
const COOLDOWN_DAYS = 7; // used only in "cooldown" mode

function PromoSubscribeTrigger() {
  React.useEffect(() => {
    // Do not show if they already subscribed
    if (localStorage.getItem("promo_subscribed") === "1") return;

    const fire = () =>
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("promo-subscribe"));
      }, 300);

    const now = Date.now();

    switch (PROMO_MODE) {
      case "always":
        fire();
        break;

      case "session": {
        const shown = sessionStorage.getItem("promo_shown_session") === "1";
        if (!shown) {
          sessionStorage.setItem("promo_shown_session", "1");
          fire();
        }
        break;
      }

      case "daily": {
        const key = "promo_seen_at";
        const last = Number(localStorage.getItem(key) || "0");
        const day = 86400000;
        if (!last || now - last > day) {
          localStorage.setItem(key, String(now));
          fire();
        }
        break;
      }

      case "cooldown": {
        const key = "promo_seen_at";
        const last = Number(localStorage.getItem(key) || "0");
        const span = COOLDOWN_DAYS * 86400000;
        if (!last || now - last > span) {
          localStorage.setItem(key, String(now));
          fire();
        }
        break;
      }
    }
  }, []);

  return null;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <PromoSubscribeTrigger />
    <App />
  </React.StrictMode>
);
