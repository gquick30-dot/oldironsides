import React from "react";
import { Link } from "react-router-dom";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function AccountGate({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      {/* Panel */}
      <div className="relative w-full max-w-[640px] rounded-2xl ring-1 ring-amber-400/60 bg-neutral-950/95 shadow-2xl shadow-amber-500/20">
        <div className="p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <img
              src="/emblem-black.png"
              alt=""
              className="h-10 w-10 opacity-70 select-none pointer-events-none"
            />
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-amber-300 m-0">
                Join the Fleet to unlock Subscribe & Save
              </h2>
              <p className="mt-2 text-neutral-300">
                To use the subscription price, please sign in or create an
                account.
              </p>
            </div>
          </div>

          <div className="mt-6 grid sm:grid-cols-2 gap-3">
            <Link
              to="/account/login"
              onClick={() => {
                try {
                  localStorage.setItem("oi_afterLoginPath", "/cart");
                } catch {}
                onClose();
              }}
              className="inline-flex items-center justify-center rounded-xl px-4 py-3 bg-amber-400 text-neutral-900 font-semibold hover:bg-amber-300"
            >
              Sign in
            </Link>

            <Link
              to="/account/login"
              onClick={() => {
                try {
                  localStorage.setItem("oi_afterLoginPath", "/cart");
                } catch {}
                onClose();
              }}
              className="inline-flex items-center justify-center rounded-xl px-4 py-3 border border-amber-400/60 text-amber-300 hover:bg-neutral-900"
            >
              Create account
            </Link>
          </div>

          <button
            onClick={onClose}
            className="mt-4 w-full text-sm text-neutral-400 hover:text-neutral-200"
          >
            Continue without subscribing
          </button>
        </div>
      </div>
    </div>
  );
}
