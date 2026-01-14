import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// src/components/CookieConsent.tsx
import { useEffect, useMemo, useRef, useState } from "react";
const STORAGE_KEY = "oi_cookie_consent";
const COOKIE_KEY = "oi_consent";
const POLICY_VERSION = "2025-10-25.1";
const DEFAULTS = {
    necessary: true,
    functional: false,
    analytics: false,
    ads: false,
};
function readConsent() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw)
            return null;
        const parsed = JSON.parse(raw);
        if (!parsed.version || parsed.version !== POLICY_VERSION)
            return null;
        return parsed;
    }
    catch {
        return null;
    }
}
function writeConsent(rec) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rec));
    document.cookie = `${COOKIE_KEY}=${encodeURIComponent(btoa(JSON.stringify(rec.categories)))}; Max-Age=${60 * 60 * 24 * 365}; Path=/; SameSite=Lax; Secure`;
    window.dispatchEvent(new CustomEvent("cookie-consent-changed", { detail: rec }));
}
function detectGPC() {
    try {
        return navigator.globalPrivacyControl === true;
    }
    catch {
        return false;
    }
}
export default function CookieConsent() {
    const [open, setOpen] = useState(() => !readConsent());
    const [expanded, setExpanded] = useState(false); // slim by default
    const [flash, setFlash] = useState(true);
    const gpc = detectGPC();
    const initial = useMemo(() => {
        return { ...DEFAULTS, ads: false };
    }, []);
    const [cats, setCats] = useState(initial);
    const readyCalled = useRef(false);
    useEffect(() => {
        const current = readConsent();
        window.cookieConsentAllowed = (k) => {
            const r = readConsent();
            return r ? r.categories[k] : DEFAULTS[k];
        };
        window.onCookieConsentReady = (cb) => {
            if (!readyCalled.current && current) {
                readyCalled.current = true;
                cb(current);
            }
            window.addEventListener("cookie-consent-changed", (e) => cb(e.detail));
        };
        // Open settings panel when footer "Cookie settings" is clicked
        window.showCookieBanner = () => {
            setOpen(true);
            setExpanded(false); // SLIM bar by default
        };
        window.showDoNotSell = () => {
            setOpen(true);
            setExpanded(true); // BIG panel for CPRA
            setCats((c) => ({ ...c, ads: false }));
        };
    }, []);
    // stop the glow after a moment
    useEffect(() => {
        const t = setTimeout(() => setFlash(false), 6000);
        return () => clearTimeout(t);
    }, []);
    // load saved consent
    useEffect(() => {
        const saved = readConsent();
        if (saved) {
            setOpen(false);
            setCats(saved.categories);
        }
    }, []);
    // open + expand on CPRA hash, and react to changes
    // Only react when the hash CHANGES (e.g., footer CPRA link). Do not auto-open on first load.
    useEffect(() => {
        const onHash = () => {
            const hash = window.location.hash.toLowerCase();
            if (hash.includes("do-not-sell") || hash.includes("privacy-opt-out")) {
                window.showDoNotSell?.();
            }
        };
        window.addEventListener("hashchange", onHash);
        return () => window.removeEventListener("hashchange", onHash);
    }, []);
    function saveConsent(next) {
        const now = new Date().toISOString();
        const rec = {
            version: POLICY_VERSION,
            givenAt: readConsent()?.givenAt || now,
            updatedAt: now,
            categories: { ...next, necessary: true },
            gpc,
        };
        writeConsent(rec);
    }
    function acceptAll() {
        const next = {
            necessary: true,
            functional: true,
            analytics: true,
            ads: !gpc,
        };
        saveConsent(next);
        setCats(next);
        setOpen(false);
    }
    function rejectNonEssential() {
        const next = { ...DEFAULTS };
        saveConsent(next);
        setCats(next);
        setOpen(false);
    }
    function saveChoices() {
        const next = { ...cats, necessary: true, ads: gpc ? false : cats.ads };
        saveConsent(next);
        setCats(next);
        setOpen(false);
    }
    if (!open)
        return null;
    return (_jsxs(_Fragment, { children: [_jsx("style", { children: `
        @keyframes oiFlash {
          0%, 100% { box-shadow: 0 0 0 0 rgba(245,158,11,0.0); }
          50% { box-shadow: 0 -0.5rem 2rem 0 rgba(245,158,11,0.18); }
        }
        @media (prefers-reduced-motion: reduce) {
          .oi-flash { animation: none !important; }
        }
      ` }), _jsx("div", { role: "region", "aria-label": "Cookie consent", className: "fixed inset-x-0 bottom-0 z-[100] mx-auto max-w-6xl px-4 pb-4", children: _jsx("div", { className: [
                        "rounded-xl border border-amber-500/40 bg-neutral-950/95 backdrop-blur",
                        "ring-1 ring-neutral-800 shadow-2xl text-neutral-200",
                        flash ? "oi-flash animate-[oiFlash_1.2s_ease-in-out_5]" : "",
                    ].join(" "), children: _jsx("div", { className: "p-3 md:p-4", children: !expanded ? (
                        // ===== Slim bar (default) =====
                        _jsxs("div", { className: "flex flex-col md:flex-row md:items-center md:justify-between gap-3", children: [_jsxs("p", { className: "text-xs md:text-sm text-neutral-300", children: ["We use cookies to run the site and improve your experience. See our", " ", _jsx("a", { href: "/cookie-policy", className: "text-amber-300 underline underline-offset-4 hover:text-amber-200", children: "Cookie Policy" }), "."] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("button", { onClick: rejectNonEssential, className: "inline-flex justify-center rounded-lg px-3.5 py-2 text-xs md:text-sm font-medium ring-1 ring-neutral-700 hover:ring-neutral-600 bg-neutral-900 hover:bg-neutral-800 text-neutral-200", children: "Reject" }), _jsx("button", { onClick: () => setExpanded(true), className: "inline-flex justify-center rounded-lg px-3.5 py-2 text-xs md:text-sm font-medium ring-1 ring-neutral-700 hover:ring-neutral-600 text-neutral-200", "aria-expanded": expanded, children: "Settings" }), _jsx("button", { onClick: acceptAll, className: "inline-flex justify-center rounded-lg px-3.5 py-2 text-xs md:text-sm font-semibold bg-amber-400 text-neutral-900 hover:bg-amber-300 ring-1 ring-amber-300", children: "Accept" })] })] })) : (
                        // ===== Full panel (advanced options) =====
                        _jsxs(_Fragment, { children: [_jsxs("div", { className: "flex items-start gap-3", children: [_jsx("div", { className: "mt-1 h-2.5 w-2.5 rounded-full bg-amber-400 shadow-[0_0_12px_2px_rgba(245,158,11,0.6)]" }), _jsxs("div", { className: "flex-1", children: [_jsxs("p", { className: "text-sm md:text-base leading-snug", children: ["We use cookies and similar tech to run the site, save your preferences, measure performance, and show relevant offers. Learn more in our", " ", _jsx("a", { href: "/cookie-policy", className: "text-amber-300 underline underline-offset-4 hover:text-amber-200", children: "Cookie Policy" }), " ", "and", " ", _jsx("a", { href: "/privacy", className: "text-amber-300 underline underline-offset-4 hover:text-amber-200", children: "Privacy Policy" }), ".", " ", _jsx("a", { href: "#do-not-sell", onClick: (e) => { e.preventDefault(); setExpanded(true); }, className: "text-amber-300 underline underline-offset-4 hover:text-amber-200", "aria-label": "Do Not Sell or Share My Personal Information", children: "Do Not Sell or Share" }), "."] }), _jsx("button", { type: "button", onClick: () => setExpanded(false), className: "mt-2 inline-flex items-center gap-1 text-xs md:text-sm text-neutral-300 hover:text-white", "aria-expanded": expanded, "aria-controls": "cookie-details", children: "Hide options" }), _jsxs("div", { id: "cookie-details", className: "mt-3 grid grid-cols-1 md:grid-cols-2 gap-3", children: [_jsx(CategoryRow, { title: "Necessary", description: "Required for cart, security, checkout.", checked: true, locked: true }), _jsx(CategoryRow, { title: "Functional", description: "UI preferences, chat widgets.", checked: cats.functional, onChange: (v) => setCats((c) => ({ ...c, functional: v })) }), _jsx(CategoryRow, { title: "Analytics", description: "Lets us measure performance.", checked: cats.analytics, onChange: (v) => setCats((c) => ({ ...c, analytics: v })) }), _jsx(CategoryRow, { title: "Ads", description: `Personalized ads and remarketing. ${gpc ? "GPC detected, set to off." : ""}`, checked: !gpc && cats.ads, disabled: gpc, onChange: (v) => setCats((c) => ({ ...c, ads: v })) })] })] })] }), _jsxs("div", { className: "mt-4 flex flex-col sm:flex-row gap-2 sm:justify-end", children: [_jsx("button", { onClick: rejectNonEssential, className: "inline-flex justify-center rounded-lg px-4 py-2 text-sm font-medium ring-1 ring-neutral-700 hover:ring-neutral-600 bg-neutral-900 hover:bg-neutral-800 text-neutral-200", children: "Reject non-essential" }), _jsx("button", { onClick: saveChoices, className: "inline-flex justify-center rounded-lg px-4 py-2 text-sm font-semibold bg-neutral-100 text-neutral-900 hover:bg-white", children: "Save choices" }), _jsx("button", { onClick: acceptAll, className: "inline-flex justify-center rounded-lg px-4 py-2 text-sm font-semibold bg-amber-400 text-neutral-900 hover:bg-amber-300 ring-1 ring-amber-300", children: "Accept all" })] })] })) }) }) })] }));
}
function CategoryRow({ title, description, checked, onChange, locked, disabled, }) {
    return (_jsxs("label", { className: "flex items-start gap-3 rounded-lg border border-neutral-800/70 p-3 bg-neutral-900/60 hover:bg-neutral-900/80", children: [_jsx("input", { type: "checkbox", className: "mt-1 h-4 w-4 rounded border-neutral-600 text-amber-400 focus:ring-amber-300 disabled:opacity-50", checked: !!checked, onChange: (e) => onChange?.(e.target.checked), disabled: locked || disabled, "aria-disabled": locked || disabled }), _jsxs("span", { children: [_jsx("span", { className: "block text-sm font-semibold text-neutral-100", children: title }), _jsx("span", { className: "block text-xs text-neutral-400", children: description })] })] }));
}
