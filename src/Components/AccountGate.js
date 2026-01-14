import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
export default function AccountGate({ open, onClose }) {
    if (!open)
        return null;
    return (_jsxs("div", { role: "dialog", "aria-modal": "true", className: "fixed inset-0 z-[1000] flex items-center justify-center p-4", children: [_jsx("div", { className: "absolute inset-0 bg-black/70 backdrop-blur-sm", onClick: onClose, "aria-hidden": true }), _jsx("div", { className: "relative w-full max-w-[640px] mx-auto rounded-2xl ring-1 ring-amber-400/60 bg-neutral-950/95 shadow-2xl shadow-amber-500/20", children: _jsxs("div", { className: "p-6 sm:p-8", children: [_jsxs("div", { className: "grid grid-cols-[auto,1fr] items-center gap-4", children: [_jsx("img", { src: "/emblem-black.png", alt: "", className: "h-16 w-16 sm:h-20 sm:w-20 opacity-70 select-none pointer-events-none shrink-0", "aria-hidden": "true" }), _jsxs("div", { className: "self-center", children: [_jsx("h2", { className: "text-2xl sm:text-1xl font-extrabold tracking-tight text-amber-300 m-0", children: "Join the Fleet to unlock your 15% off" }), _jsx("p", { className: "mt-2 text-neutral-300", children: "To get the subscription price, please sign in or create an account." })] })] }), _jsxs("div", { className: "mt-6 grid sm:grid-cols-2 gap-3", children: [_jsx(Link, { to: "/account/login", onClick: () => {
                                        try {
                                            localStorage.setItem("oi_afterLoginPath", "/cart");
                                        }
                                        catch { }
                                        onClose();
                                    }, className: "inline-flex items-center justify-center rounded-xl px-4 py-3 bg-amber-400 text-neutral-900 font-semibold hover:bg-amber-300", children: "Sign in" }), _jsx(Link, { to: "/account/login", onClick: () => {
                                        try {
                                            localStorage.setItem("oi_afterLoginPath", "/cart");
                                        }
                                        catch { }
                                        onClose();
                                    }, className: "inline-flex items-center justify-center rounded-xl px-4 py-3 border border-amber-400/60 text-amber-300 hover:bg-neutral-900", children: "Create account" })] }), _jsx("button", { onClick: onClose, className: "mt-4 w-full text-sm text-neutral-400 hover:text-neutral-200", children: "Continue without subscribing" })] }) })] }));
}
