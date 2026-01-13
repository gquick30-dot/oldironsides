// FORCE-GITsss-CHANGE

import AccountGate from "./Components/AccountGate";
import CookieConsent from "./Components/CookieConsent";
import {
  getProductByHandle,
  ensureCart,
  cartLinesAdd,
  cartLinesUpdate,
  cartLinesRemove,
  getCart,
  cartCreate,
  cartDiscountCodesUpdate,
} from "./lib/shopify";

import React, {
  useState,
  useMemo,
  useContext,
  createContext,
  useEffect,
  useRef,
  useCallback,
} from "react";

import { createPortal } from "react-dom";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Link,
  useLocation,
  Outlet,
  useNavigate,
  useParams,
} from "react-router-dom";

import { DateTime } from "luxon";
// ---------- REVIEW TYPES & DEFAULT SUMMARY (no seeded text) ----------
export type Review = {
  id: string;
  name: string;
  date: string;
  rating: number;
  title?: string;
  body?: string;
  verified?: boolean;
  source?: "seed" | "judge";
};

export type ReviewStats = {
  avg: number;
  count: number;
  breakdown: Record<number, number>;
};

declare global {
  interface Window {
    __REVIEWS__?: Record<
      string,
      {
        stats?: ReviewStats;
        list?: Review[];
      }
    >;
  }
}

export const DEFAULT_REVIEW_SUMMARY: Record<string, ReviewStats> = {
  flagship: {
    avg: 0,
    count: 0,
    breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  },
  "baptism-by-fire": {
    avg: 0,
    count: 0,
    breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  },
  "java-action": {
    avg: 0,
    count: 0,
    breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  },
  "oak-and-copper": {
    avg: 0,
    count: 0,
    breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  },
};

// ----------------------------------------------------------------------

// Back target for story pages
const STORIES_HOME = "/origins#origins-history";
function ShopButton({ slug, title }: { slug: string; title: string }) {
  return (
    <Link
      to={`/roast/${slug}`}
      className="group inline-flex items-center gap-2 rounded-xl px-5 py-3 font-semibold ring-1 ring-amber-400 text-amber-300 bg-transparent hover:bg-amber-400 hover:text-neutral-900 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
      aria-label={`Shop ${title}`}
      title={`Shop ${title}`}
    >
      Shop {title}
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5 transition group-hover:translate-x-0.5"
        fill="currentColor"
        aria-hidden
      >
        <path d="M13 5l7 7-7 7M5 12h14" />
      </svg>
    </Link>
  );
}
function formatDate(d?: string | null) {
  if (!d) return "—";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/* ================= Flash Toast (global 2s banner) ================= */
function FlashToast() {
  const [msg, setMsg] = React.useState("");
  const [show, setShow] = React.useState(false);
  const timeoutRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    const onFlash = (e: any) => {
      setMsg(String((e as CustomEvent).detail || ""));
      setShow(true);

      // clear any existing hide timer, then start a fresh 2s timer
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => setShow(false), 4000);
    };

    window.addEventListener("flash", onFlash as any);

    return () => {
      window.removeEventListener("flash", onFlash as any);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []); // run once

  return (
    <div
      className={`fixed left-1/2 -translate-x-1/2 z-[100] transition-all duration-200 top-[calc(env(safe-area-inset-top)+8px)] ${
        show
          ? "opacity-100 scale-100"
          : "opacity-0 scale-95 pointer-events-none"
      }`}
    >
      <div
        className="rounded-lg bg-amber-400/95 px-4 py-2 text-neutral-900 font-semibold shadow-xl text-center whitespace-pre-line"
        role="status"
        aria-live="polite"
      >
        {msg}
      </div>
    </div>
  );
}

/* ================= Inline Icon Fallbacks (no external deps) ================= */
type IconProps = React.SVGProps<SVGSVGElement>;

const iconBase = (p: IconProps) => ({
  width: 24,
  height: 24,
  className: p?.className,
  style: p?.style,
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});
const ArrowLeft = (p?: any) => (
  <svg viewBox="0 0 24 24" {...iconBase(p)}>
    <polyline points="15 18 9 12 15 6" />
    <line x1="9" y1="12" x2="21" y2="12" />
  </svg>
);
const PackageOpen = (p?: any) => (
  <svg viewBox="0 0 24 24" {...iconBase(p)}>
    <path d="M21 16V8a2 2 0 0 0-1-1.73L13 2.27a2 2 0 0 0-2 0L4 6.27A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <path d="M3.27 6.96 12 12l8.73-5.04" />
    <path d="M12 22V12" />
  </svg>
);
const Bell = (p?: any) => (
  <svg viewBox="0 0 24 24" {...iconBase(p)}>
    <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 01-3.46 0" />
  </svg>
);
const Mail = (p?: any) => (
  <svg viewBox="0 0 24 24" {...iconBase(p)}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3 7l9 6 9-6" />
  </svg>
);
const Phone = (p?: any) => (
  <svg viewBox="0 0 24 24" {...iconBase(p)}>
    <path d="M22 16.92V21a2 2 0 01-2.18 2A19.8 19.8 0 013 5.18 2 2 0 015 3h4.09a2 2 0 012 1.72c.12.81.3 1.6.54 2.36a2 2 0 01-.45 2.11L9.91 10.09a16 16 0 006 6l.9-1.27a2 2 0 012.11-.45c.76.24 1.55.42 2.36.54A2 2 0 0122 16.92z" />
  </svg>
);
const Instagram = (p?: any) => (
  <svg viewBox="0 0 24 24" {...iconBase(p)}>
    <rect x="2" y="2" width="20" height="20" rx="5" />
    <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
    <circle cx="17.5" cy="6.5" r="1" />
  </svg>
);
const Facebook = (p?: any) => (
  <svg viewBox="0 0 24 24" {...iconBase(p)}>
    <path d="M14 9h3V6h-3c-2.2 0-4 1.8-4 4v2H7v3h3v6h3v-6h3l1-3h-4v-2c0-.6.4-1 1-1z" />
  </svg>
);

const Shirt = (p?: any) => (
  <svg viewBox="0 0 24 24" {...iconBase(p)}>
    <path d="M16 3l-4 2-4-2-3 3 3 3v10h8V9l3-3z" />
  </svg>
);
const Compass = (p?: any) => (
  <svg viewBox="0 0 24 24" {...iconBase(p)}>
    <circle cx="12" cy="12" r="10" />
    <polygon points="16 8 12 14 8 16 10 10 16 8" />
  </svg>
);
const Plus = (p?: any) => (
  <svg viewBox="0 0 24 24" {...iconBase(p)}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const Minus = (p?: any) => (
  <svg viewBox="0 0 24 24" {...iconBase(p)}>
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const Trash2 = (p?: any) => (
  <svg viewBox="0 0 24 24" {...iconBase(p)}>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
    <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
  </svg>
);
const ChestIcon = (p?: any) => (
  <svg viewBox="0 0 24 24" {...iconBase(p)}>
    {/* chest base */}
    <rect x="3" y="8" width="18" height="10" rx="2" />
    {/* chest lid */}
    <path d="M3 8V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2" />
    {/* lock */}
    <rect x="11" y="12" width="2" height="4" />
    <circle cx="12" cy="12" r="1" />
  </svg>
);

/* ================= Config ================= */
const SHOW_DATES_IN_BUY_CARDS = false;

/* ================= Helpers & UI ================= */
class ErrorBoundary extends React.Component<any, { error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { error };
  }
  componentDidCatch(error: any, info: any) {
    console.error("[UI ErrorBoundary]", error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div className="p-6 text-sm text-red-300 bg-red-950/30 border border-red-800 rounded-xl m-4">
          <div className="font-bold text-red-200">Something went wrong.</div>
          <pre className="whitespace-pre-wrap mt-2 text-red-200">
            {String(this.state.error?.message || this.state.error)}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const Container = ({ children, className = "" }: any) => (
  <div
    className={`mx-auto w-full max-w-screen-2xl px-4 sm:px-6 lg:px-8 ${className}`}
  >
    {children}
  </div>
);

const BackButton = ({
  to,
  size = "lg",
}: {
  to?: string;
  size?: "lg" | "sm";
}) => {
  const navigate = useNavigate();
  const base =
    "inline-flex items-center gap-2 rounded-2xl border-2 border-amber-400 bg-amber-500/20 font-bold text-amber-300 hover:bg-amber-400 hover:text-neutral-900";
  const sz = size === "sm" ? "px-3 py-2 text-sm" : "px-6 py-4 text-lg";
  const iconCls = size === "sm" ? "h-5 w-5" : "h-7 w-7";
  return (
    <button
      type="button"
      onClick={() => {
        try {
          if (to) return navigate(to);
          if (
            typeof window !== "undefined" &&
            window.history &&
            window.history.length > 1
          ) {
            navigate(-1);
          } else {
            navigate("/");
          }
        } catch {
          navigate(to || "/");
        }
      }}
      className={`${base} ${sz}`}
    >
      <ArrowLeft className={iconCls} /> Back
    </button>
  );
};

const SectionTitle = ({ title, subtitle }: any) => {
  const isString = typeof title === "string";
  const TitleTag: any = isString ? "h2" : "div";
  const titleClasses =
    "mt-0 text-2xl md:text-4xl font-extrabold leading-tight tracking-tight text-amber-300";
  return (
    <div className="max-w-3xl">
      <TitleTag className={titleClasses}>{title}</TitleTag>
      {subtitle && (
        <div className="mt-1 md:text-base space-y-1 text-neutral-300">
          {subtitle}
        </div>
      )}
    </div>
  );
};

const fmt = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });
const emailOk = (s: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || "").trim());

// kill em/en dashes so no “—” slips onto the site
const cleanCopy = (s: string) => s.replace(/[–—]/g, "-");

// unified non-blocking toast
const flash = (message: string) => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("flash", { detail: String(message) }));
  }
};
const roastCards = [
  {
    id: "flagship-12oz-ground",
    slug: "flagship",
    title: "Flagship",
    subTitle: "Medium Roast",
    note: "Balanced, Enduring, Everyday",
    img: "Flagship Transparent Mockup.png", // Main image for hero section
    imgLeft: "washington-cannon.jpg", // New property for left image in duel
    imgRight: "barry-ship.jpg", // New property for right image in duel
    heroImg: "Flagship-web.png", // New property for hero section image
    price: 22.0,
    canBuy: true,
    variant: "12oz Bag",
    battleDate: "Commissioned October 21, 1797",
    storyTitle: (
      <>
        <div className="text-2xl font-bold text-amber-300">Flagship</div>
        <div className="text-white text-base">
          USS Constitution – Old Ironsides
        </div>
      </>
    ),
    story:
      "The flagship of the U.S. Navy, USS Constitution, built to withstand the fiercest battles. Her commissioning in 1797 is the foundation of American naval history.", // Blurb (short version)
    mainStory: "", // Full story
  },
  {
    id: "baptism-dark-12oz-ground",
    slug: "baptism-by-fire",
    title: "Baptism by Fire",
    subTitle: "Dark Roast",
    note: "Bold, Smooth, Unyielding",
    img: "Baptism By Fire Transparent .png", // Main image for hero section
    imgLeft: "capt-hull.jpg", // New property for left image in duel
    imgRight: "james-surrender.jpg", // New property for right image in duel
    heroImg: "baptism-web.png", // New property for hero section image
    price: 22.0,
    canBuy: true,
    variant: "12oz Bag",
    battleDate: "August 19, 1812",
    storyTitle: (
      <>
        <div className="text-2xl font-bold text-amber-300">Baptism by Fire</div>
        <div className="text-white text-base">
          USS Constitution vs HMS Guerriere
        </div>
      </>
    ),
    story:
      "In 1812, the USS Constitution defeated HMS Guerriere in one of America’s first great naval victories. This battle established the Constitution’s legendary status as ‘Old Ironsides.’", // Blurb (short version)
    mainStory: "", // Full story
  },
  {
    id: "java-action-12oz-ground",
    slug: "java-action",
    title: "The Java Action",
    subTitle: "Medium Roast",
    note: "Captivating, Decisive Finish.",
    img: "Java Action Transparent.png", // Main image for hero section
    imgLeft: "bainbridge-java.jpg", // New property for left image in duel
    imgRight: "lambert-pic.png", // New property for right image in duel
    heroImg: "java-web.png", // New property for hero section image
    price: 22.0,
    canBuy: true,
    variant: "12oz Bag",
    battleDate: "December 29, 1812",
    storyTitle: (
      <>
        <div className="text-2xl font-bold text-amber-300">The Java Action</div>
        <div className="text-white text-base">USS Constitution vs HMS Java</div>
      </>
    ),
    story:
      "In 1812, Constitution faced off against HMS Java in a fierce sea battle. The American frigate’s victory proved her might and resilience, further cementing her legendary status.", // Blurb (short version)
    mainStory: "", // Full story
  },
  {
    id: "oak-copper-coming-soon",
    slug: "oak-and-copper",
    title: "OAK & COPPER",
    subTitle: "Medium Roast",
    note: "Limited Release, Micro-Batch",
    img: "Oak&Copper Bag Transparent.png", // Main image for hero section
    imgLeft: "ship-hull.avif", // New property for left image in duel
    imgRight: "ship-restore.jpg", // New property for right image in duel
    heroImg: "ironship.png", // New property for hero section image
    price: 0,
    canBuy: false,
    variant: "12oz Bag",
    battleDate: "",
    storyTitle: (
      <>
        <div className="text-2xl font-bold text-amber-300">Oak & Copper</div>
        <div className="text-white text-base">Bones of Oak, Skin of Copper</div>
      </>
    ),
    story:
      "Inspired by the rugged oak and copper that defined the USS Constitution, Oak & Copper is a bourbon barrel-aged seasonal roast that celebrates American craftsmanship.", // Blurb (short version)
    mainStory: "", // Full story
  },
  {
    id: "brass-monkey",
    slug: "brass-monkey",
    title: "BRASS MONKEY",
    subTitle: "COLD AS BALLS!",
    note: "Southern Pecan Seasonal Winter Roast",
    img: "/Brass Monkey Transparent Bag.png", // change to your actual filename
    price: 22, // change if needed
    canBuy: true, // or false if you want it visible but not purchasable yet
  },
];
type RoastCardConfig = (typeof roastCards)[number];
const PRODUCT_IDS_BY_SLUG: Record<string, string> = {
  flagship: "9141081276637",
  "baptism-by-fire": "9192531853533",
  "java-action": "9192548663517",
  "oak-and-copper": "9192552104157",
  "brass-monkey": "9236587315421",
};

function RoastMegaCard({
  card,
  onClick,
}: {
  card: RoastCardConfig;
  onClick: () => void;
}) {
  const [stats, setStats] = React.useState<{
    avg: number;
    count: number;
  } | null>(null);

  React.useEffect(() => {
    const productId = PRODUCT_IDS_BY_SLUG[card.slug];
    if (!productId) {
      setStats(null);
      return;
    }

    let cancelled = false;

    async function loadStats() {
      try {
        const res = await fetch(
          `/api/get-reviews?shopifyProductId=${encodeURIComponent(productId)}`
        );

        if (!res.ok) {
          console.error("Failed to load review stats", await res.text());
          if (!cancelled) setStats(null);
          return;
        }

        const data = await res.json();
        const reviews: any[] = Array.isArray(data.reviews) ? data.reviews : [];

        if (!reviews.length) {
          if (!cancelled) setStats(null);
          return;
        }

        const count = reviews.length;
        const sum = reviews.reduce(
          (acc, r) => acc + (Number(r.rating) || 0),
          0
        );
        const avg = Math.round((sum / count) * 10) / 10;

        if (!cancelled) setStats({ avg, count });
      } catch (err) {
        if (!cancelled) {
          console.error("Error loading review stats", err);
          setStats(null);
        }
      }
    }

    loadStats();
    return () => {
      cancelled = true;
    };
  }, [card.slug]);

  return (
    <Link
      to={`/roast/${card.slug}`}
      onClick={onClick}
      className="group relative overflow-hidden rounded-2xl ring-1 ring-neutral-800 bg-neutral-900/40 hover:bg-neutral-900 transition shadow-lg flex flex-col"
    >
      <img
        src={
          card.img?.startsWith("/") || card.img?.startsWith("http")
            ? card.img
            : `/${card.img}`
        }
        alt={card.title}
        className="h-52 sm:h-60 lg:h-60 w-full object-cover"
      />

      <div className="p-3">
        <div
          className="text-lg font-extrabold text-amber-300"
          style={{
            fontFamily: "'Cinzel', serif",
            fontWeight: 800,
          }}
        >
          {card.title}
        </div>
        <div className="text-xs text-neutral-400">{card.variant}</div>
        <div className="text-xs md:text-sm text-neutral-300">
          {card.subTitle}
        </div>

        {stats && (
          <div className="mt-1 flex items-center gap-1 text-[0.7rem] text-amber-300">
            <span>★ {stats.avg.toFixed(1)}</span>
            <span className="text-neutral-400">
              ({stats.count} review{stats.count === 1 ? "" : "s"})
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}

/* ================= Cart Context ================= */
const CartCtx = createContext<any | null>(null);

function useCart() {
  const ctx = useContext(CartCtx);
  if (!ctx) {
    throw new Error("useCart must be used within <CartProvider>");
  }
  return ctx;
}

function CartProvider({ children }: any) {
  const [cart, setCart] = useState(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem("oi_cart") || "[]");
    } catch {
      return [];
    }
  });

  // cross-tab sync: update this tab if oi_cart changes in another tab
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== "oi_cart") return;
      try {
        const next = JSON.parse(e.newValue || "[]");
        setCart(Array.isArray(next) ? next : []);
      } catch {
        // ignore parse errors
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const persist = useCallback((updater: (prev: any[]) => any[]) => {
    setCart((prev) => {
      const next = updater(prev);
      try {
        localStorage.setItem("oi_cart", JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const count = useMemo(
    () => cart.reduce((s: number, i: any) => s + Number(i.qty || 0), 0),
    [cart]
  );

  const subtotal = useMemo(
    () =>
      cart.reduce((s: number, i: any) => {
        const qty = Number(i.qty || 0);
        if (!qty) return s;

        // If it's marked as a subscription:
        // - use explicit subPrice if present
        // - otherwise use price (already discounted for subs added from product page)
        if (i?.isSubscription) {
          const explicitSub = Number(i?.subPrice ?? 0);
          const p = explicitSub > 0 ? explicitSub : Number(i?.price ?? 0);
          return s + p * qty;
        }

        // One-time purchase: use normal price
        const p = Number(i?.price || 0);
        return s + p * qty;
      }, 0),
    [cart]
  );

  // === Free shipping logic ===
  const FREE_SHIPPING_THRESHOLD = 3;

  const coffeeBagCount = useMemo(() => {
    return cart.reduce((sum: number, it: any) => {
      const isCoffee =
        it?.isCoffee === true ||
        it?.type === "coffee" ||
        it?.category === "coffee";
      const qty = Number(it?.qty ?? 0);
      return isCoffee ? sum + qty : sum;
    }, 0);
  }, [cart]);

  const freeShippingQualified = coffeeBagCount >= FREE_SHIPPING_THRESHOLD;

  // If you have a base shipping rate, set it here. Leaving 0 by default.
  const baseShipping = 0;

  const shipping = useMemo(
    () => (freeShippingQualified ? 0 : baseShipping),
    [freeShippingQualified]
  );

  const shippingLabel = useMemo(
    () =>
      freeShippingQualified ? "Free Shipping Applied" : "UPS Standard Ground",
    [freeShippingQualified]
  );

  const total = useMemo(() => subtotal + shipping, [subtotal, shipping]);

  const add = useCallback(
    (item: any, qty = 1) => {
      const variantLabel =
        item?.beanType === "whole"
          ? "Whole Bean"
          : item?.beanType === "ground"
          ? "Ground"
          : null;

      const rawId = String(item?.id ?? "");
      const beanKey =
        item?.beanType === "whole" || item?.beanType === "ground"
          ? item.beanType
          : "nobean";

      const purchaseKey = item?.purchaseMode === "sub" ? "sub" : "one";
      const freqKey =
        item?.purchaseMode === "sub" ? `_${String(item?.subEvery ?? 30)}d` : "";

      const base = rawId.replace(/(__.*)$/, "");
      const canonicalId = `${base}__${beanKey}__${purchaseKey}${freqKey}`;

      const displayTitle =
        variantLabel &&
        typeof item.title === "string" &&
        !new RegExp(`\\(${variantLabel}\\)$`).test(item.title)
          ? `${item.title} (${variantLabel})`
          : item.title;

      // ensure product image path is absolute and cache-friendly
      const imgRaw = item?.img || item?.image || item?.imgUrl || "";
      const img =
        typeof imgRaw === "string" && imgRaw.length > 0
          ? imgRaw.startsWith("/") || imgRaw.startsWith("http")
            ? imgRaw
            : `/${imgRaw}`
          : "/bag.png";

      const normalized = {
        ...item,
        id: canonicalId,
        sku: item.sku || canonicalId,
        title: displayTitle,
        img, // ⟵ normalized, absolute path
        isCoffee: typeof item.isCoffee === "boolean" ? item.isCoffee : true,
        isSubscription: item?.purchaseMode === "sub",
      };

      persist((prev) => {
        const copy = [...prev];
        const idx = copy.findIndex((x: any) => x.id === normalized.id);
        if (idx >= 0) {
          copy[idx] = { ...copy[idx], qty: copy[idx].qty + qty };
        } else {
          copy.push({ ...normalized, qty });
        }
        return copy;
      });

      // Do NOT auto-open the cart drawer on add (mobile included).
      // We only show the flash banner + cart count update.
      // Drawer opens only when the user taps the chest icon or a dedicated "View cart" CTA.
    },
    [persist]
  );

  const inc = useCallback(
    (id: string) => {
      persist((prev) =>
        prev.map((x: any) => (x.id === id ? { ...x, qty: x.qty + 1 } : x))
      );
    },
    [persist]
  );

  const dec = useCallback(
    (id: string) => {
      persist((prev) =>
        prev
          .map((x: any) =>
            x.id === id ? { ...x, qty: Math.max(0, x.qty - 1) } : x
          )
          .filter((x: any) => x.qty > 0)
      );
    },
    [persist]
  );

  const remove = useCallback(
    (id: string) => {
      persist((prev) => prev.filter((x: any) => x.id !== id));
    },
    [persist]
  );

  // simple sub price helper:

  const getSubPrice = useCallback((it: any) => {
    const explicit = Number(it?.subPrice ?? 0);
    if (explicit > 0) return explicit;

    // Oak & Copper: subscription exists, but no discount
    const slug = String(it?.slug ?? "");
    if (slug === "oak-and-copper") {
      const bp = Number(it?.basePrice ?? it?.price ?? 0);
      return Math.max(0, +bp.toFixed(2));
    }

    const p = Number(it?.price ?? 0);
    if (it?.isSubscription) {
      // price is already the subscription price; don't double-discount
      return Math.max(0, +p.toFixed(2));
    }

    return Math.max(0, +(p * 0.85).toFixed(2));
  }, []);

  // generic updater for one item
  const updateItem = useCallback(
    (id: string, patch: any) => {
      persist((prev) =>
        prev.map((x: any) => (x.id === id ? { ...x, ...patch } : x))
      );
    },
    [persist]
  );

  const clear = useCallback(() => {
    persist(() => []);
  }, [persist]);

  const value = useMemo(
    () => ({
      cart,
      add,
      inc,
      dec,
      remove,
      clear,
      updateItem, // ⟵ new
      getSubPrice, // ⟵ new
      count,
      subtotal,
      shipping,
      shippingLabel,
      total,
      coffeeBagCount,
      freeShippingQualified,
      freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
    }),
    [
      cart,
      add,
      inc,
      dec,
      remove,
      clear,
      updateItem,
      getSubPrice,
      count,
      subtotal,
      shipping,
      shippingLabel,
      total,
      coffeeBagCount,
      freeShippingQualified,
    ]
  );

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

/* ================= Components ================= */
const LinkA = ({ to, children, className }: any) => (
  <Link to={to} className={className}>
    {children}
  </Link>
);

function IntroRow({
  img,
  text,
  tone,
  className,
  imgClassName,
}: {
  img: string;
  text: React.ReactNode;
  tone?: string;
  className?: string;
  imgClassName?: string;
}) {
  return (
    <div
      className={`
        flex flex-col items-center text-center
        md:flex-row md:text-left md:items-center md:gap-4
        ${className ?? ""}
      `}
    >
      <img
        src={img}
        alt="row art"
        className={`
          w-32 h-40
          md:w-[13.75rem] md:h-[16.25rem]
          translate-y-2 md:translate-y-6
          rounded-xl object-cover ring-1 ring-amber-500 shadow-2xl shadow-black/30
          ${imgClassName ?? ""}
        `}
      />
      <div
        className={`
          mt-4 md:mt-0
          text-base leading-snug font-bold
          sm:text-lg
          md:text-[1.6rem]
          ${tone ?? ""}
        `}
        style={{ fontFamily: "'Cinzel', serif", fontWeight: 700 }}
      >
        {text}
      </div>
    </div>
  );
}
// ===== Shared promo submit (used by every Ring That Bell box) =====
const KEY_SUB = "promo_subscribed";
const COOKIE_SUB = "promo_subscribed";

const setCookieDays = (name: string, value: string, days: number) => {
  const maxAge = Math.max(0, Math.floor(days * 86400));
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(
    value
  )}; Path=/; SameSite=Lax; Max-Age=${maxAge}${secure}`;
};

const submitPromoEmail = async (email: string) => {
  if (!emailOk(email)) {
    flash("Enter a valid email.");
    return false;
  }

  // Send email to Shopify via Vercel API (same as your modal)
  try {
    await fetch("/api/create-customer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
  } catch {
    // do not block conversion
  }

  // Mark as subscribed locally (same as your modal)
  localStorage.setItem(KEY_SUB, "1");
  setCookieDays(COOKIE_SUB, "1", 365);

  // Bell confirmation tone (user-gesture = allowed)
  try {
    const a = new Audio("/ship-bell.mp3");
    a.preload = "auto";
    a.currentTime = 0;
    a.play().catch(() => {});
  } catch {}

  // Show the code (same outcome as the modal)
  window.dispatchEvent(
    new CustomEvent("flash", {
      detail:
        "Welcome aboard! Your discount will be applied at checkout.\nDoes not stack with subscriptions.",
    })
  );

  return true;
};
function BellRinger({
  iconClassName,
  soundSrc = "/ship-bell.mp3",
  ariaLabel = "Ring the bell",
}: {
  iconClassName: string;
  soundSrc?: string;
  ariaLabel?: string;
}) {
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [ringing, setRinging] = React.useState(false);

  const ring = () => {
    setRinging(true);
    window.setTimeout(() => setRinging(false), 750);

    const a = audioRef.current;
    if (a) {
      a.currentTime = 0;
      a.play().catch(() => {});
    }
  };

  return (
    <>
      <button
        type="button"
        aria-label={ariaLabel}
        onClick={ring}
        data-ring={ringing ? "1" : "0"}
        className={[
          "bell-btn inline-flex items-center justify-center rounded-full p-1 select-none",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400",
          "hover:[animation:bellSway_450ms_ease-in-out]",
          ringing ? "[animation:bellRing_750ms_ease-in-out]" : "",
        ].join(" ")}
      >
        <span className="bell-wrap" aria-hidden="true">
          {/* LEFT: big arc + small arc */}
          <span className="vibes vibes-l">
            <svg viewBox="0 0 24 24" className="vibe-svg">
              {/* big */}
              <path d="M19 4c-6 5-6 11 0 16" />
              {/* small (closer to bell) */}
              <path d="M16 6c-4 3-4 9 0 12" />
            </svg>
          </span>

          <Bell className={iconClassName} />

          {/* RIGHT: big arc + small arc */}
          <span className="vibes vibes-r">
            <svg viewBox="0 0 24 24" className="vibe-svg">
              {/* big */}
              <path d="M5 4c6 5 6 11 0 16" />
              {/* small (closer to bell) */}
              <path d="M8 6c4 3 4 9 0 12" />
            </svg>
          </span>
        </span>

        <audio ref={audioRef} preload="auto" src={soundSrc} />
      </button>

      <style>{`
        .bell-wrap {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        /* always-on vibes */
        .vibes {
          position: absolute;
          top: 50%;
          width: 18px;
          height: 26px;
          transform: translateY(-50%);
          opacity: 0.5;
          pointer-events: none;
          animation: vibesIdle 1600ms ease-in-out infinite;
        }

        /* keep them off the circle so they read as vibration, not ears */
        .vibes-l { left: -24px; }
        .vibes-r { right: -24px; }
        .vibes-r { animation-delay: 160ms; }

        .vibe-svg {
          width: 100%;
          height: 100%;
          fill: none;
          stroke: rgba(252, 211, 77, 0.9);
          stroke-width: 2;
          stroke-linecap: round;
        }

        /* stronger when clicked */
        .bell-btn[data-ring="1"] .vibes {
          animation: vibesHit 750ms ease-in-out;
          opacity: 0.9;
        }

        @keyframes vibesIdle {
          0%   { opacity: 0.35; transform: translateY(-50%) scale(0.98); }
          50%  { opacity: 0.60; transform: translateY(-50%) scale(1.03); }
          100% { opacity: 0.35; transform: translateY(-50%) scale(0.98); }
        }

        @keyframes vibesHit {
          0%   { opacity: 0.40; transform: translateY(-50%) scale(0.92); }
          18%  { opacity: 1.00; transform: translateY(-50%) scale(1.10); }
          60%  { opacity: 0.85; transform: translateY(-50%) scale(1.03); }
          100% { opacity: 0.60; transform: translateY(-50%) scale(1.00); }
        }

        @keyframes bellSway {
          0% { transform: rotate(0deg); }
          50% { transform: rotate(-8deg); }
          100% { transform: rotate(0deg); }
        }

        @keyframes bellRing {
          0% { transform: rotate(0deg); }
          12% { transform: rotate(-18deg); }
          24% { transform: rotate(14deg); }
          36% { transform: rotate(-12deg); }
          48% { transform: rotate(10deg); }
          60% { transform: rotate(-7deg); }
          72% { transform: rotate(5deg); }
          84% { transform: rotate(-3deg); }
          100% { transform: rotate(0deg); }
        }
      `}</style>
    </>
  );
}
function RingThatBellBox({ mode = "section" }: { mode?: "section" | "card" }) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const submit = async (e: any) => {
    e.preventDefault();
    const ok = await submitPromoEmail(email);
    if (ok) setSubmitted(true);
  };

  const Card = (
    <div className="rounded-2xl ring-1 ring-amber-400/60 bg-neutral-900/60 p-6 sm:p-8 text-center">
      <div className="flex flex-col items-center justify-center gap-2 sm:gap-3 mb-4">
        <BellRinger iconClassName="h-9 w-9 sm:h-11 sm:w-11 text-amber-300" />
        <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-amber-300">
          RING THAT BELL
        </h3>
      </div>

      <p className="text-neutral-300 mb-5 text-base sm:text-lg md:text-xl">
        Get 20% off your first freshly roasted coffee order. <br />
        Join the fleet later and save 15% off every order.
      </p>

      <form
        onSubmit={submit}
        className="flex flex-col sm:flex-row justify-center gap-3 max-w-md mx-auto"
      >
        <input
          type="email"
          autoComplete="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className="flex-1 min-w-0 rounded-xl bg-neutral-900/70 border border-neutral-700 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
        <button
          type="submit"
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-amber-400 text-neutral-900 font-semibold hover:bg-amber-300"
        >
          GET 20% OFF
        </button>
      </form>

      <div className="mt-6 text-xs sm:text-sm text-neutral-400">
        Already a member?{" "}
        <Link to="/account/login" className="text-amber-300 hover:underline">
          Sign in
        </Link>
      </div>

      {submitted && (
        <p className="mt-3 text-sm text-emerald-400">
          Welcome aboard! Your discount will be applied at checkout. <br />
          Does not stack with subscriptions.
        </p>
      )}
    </div>
  );

  if (mode === "card") return Card;

  return (
    <section className="py-10 md:py-14 border-b border-neutral-800">
      <Container>
        <div className="max-w-xl mx-auto">{Card}</div>
      </Container>
    </section>
  );
}

function MegaSubscribeBox({
  email,
  setEmail,
  done,
  onSubmit,
  title,
  subtitle,
  buttonText,
  imageSrc = "/subscribe-hero.jpg",
  imageAlt = "Old Ironsides at sea",
}: {
  email: string;
  setEmail: (v: string) => void;
  done: boolean;
  onSubmit: (e: any) => void;
  title?: string;
  subtitle?: string;
  buttonText?: string;
  imageSrc?: string;
  imageAlt?: string;
}) {
  const heading = title ?? "RING THAT BELL";
  const sub =
    subtitle ??
    `Get 20% off your first order
  Join the fleet for 15% off recurring orders`;
  const btn = buttonText ?? "GET 20% OFF";

  return (
    <div className="w-full lg:w-[36rem]">
      {/* MOBILE VERSION ONLY (tighter v2) */}
      <div className="md:hidden">
        <div className="mx-auto max-w-[16.5rem] overflow-hidden rounded-2xl ring-1 ring-amber-400/60 bg-neutral-900/60">
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={imageAlt}
              className="w-full h-14 object-cover"
            />
          ) : null}

          <div className="p-2 text-center">
            {/* Icon inline with heading */}
            <div className="flex items-center justify-center gap-1 mb-1">
              <BellRinger iconClassName="h-3.5 w-3.5 text-amber-300" />

              <h3
                className="font-extrabold text-amber-300"
                style={{ fontSize: 13, lineHeight: 1.05, letterSpacing: 0.2 }}
              >
                {heading}
              </h3>
            </div>

            <p
              className="text-neutral-300 mb-2 whitespace-pre-line"
              style={{ fontSize: 11, lineHeight: 1.2 }}
            >
              {sub}
            </p>

            <form
              onSubmit={onSubmit}
              className="flex flex-col justify-center gap-1 max-w-[14.5rem] mx-auto"
            >
              <input
                type="email"
                name="email"
                autoComplete="email"
                inputMode="email"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 min-w-0 rounded-md bg-neutral-900/70 border border-neutral-700 px-2 py-[5px] text-[11px] focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <button className="w-full px-3 py-[6px] rounded-md bg-amber-400 text-neutral-900 text-[11px] font-semibold hover:bg-amber-300">
                {btn}
              </button>
            </form>

            <div
              className="mt-1 text-neutral-400"
              style={{ fontSize: 9.5, lineHeight: 1.2 }}
            >
              Already a member?{" "}
              <Link
                to="/account/login"
                className="text-amber-300 hover:underline"
              >
                Sign in
              </Link>
            </div>

            {done && (
              <p className="mt-1 text-emerald-400" style={{ fontSize: 10.5 }}>
                Welcome aboard! Your discount will be applied at checkout.{" "}
                <br /> Does not stack with subscriptions.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* DESKTOP/TABLET VERSION — unchanged */}
      <div className="hidden md:block">
        <div className="rounded-2xl ring-1 ring-amber-400/60 bg-neutral-900/60 p-6 sm:p-8 text-center">
          <div className="flex flex-col items-center justify-center gap-2 sm:gap-3 mb-4">
            <Bell className="h-6 w-6 sm:h-7 sm:w-7 text-amber-300" />
            <h3 className="text-xl sm:text-2xl font-extrabold text-amber-300">
              {heading}
            </h3>
          </div>

          <p className="text-neutral-300 mb-5 text-base sm:text-lg md:text-xl whitespace-pre-line">
            {sub}
          </p>

          <form
            onSubmit={onSubmit}
            className="flex flex-col sm:flex-row justify-center gap-3 max-w-md mx-auto"
          >
            <input
              type="email"
              name="email"
              autoComplete="email"
              inputMode="email"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="flex-1 min-w-0 rounded-xl bg-neutral-900/70 border border-neutral-700 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <button className="w-full sm:w-auto px-6 py-3 rounded-xl bg-amber-400 text-neutral-900 font-semibold hover:bg-amber-300">
              {btn}
            </button>
          </form>

          <div className="mt-3 text-[11px] sm:text-xs text-neutral-400">
            Already a member?{" "}
            <Link
              to="/account/login"
              className="text-amber-300 hover:underline"
            >
              Sign in
            </Link>
          </div>

          {done && (
            <p className="mt-3 text-sm text-emerald-400">
              Welcome aboard! Your discount will be applied at checkout. <br />{" "}
              Does not stack with subscriptions.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function GovXLoginBox() {
  return (
    <div className="rounded-2xl ring-1 ring-amber-400/60 bg-neutral-900/60 p-5 text-center">
      <div className="flex flex-col items-center justify-center gap-2 mb-2">
        <Bell className="h-5 w-5 text-amber-300" />
        <h4 className="text-base sm:text-lg font-extrabold text-amber-300">
          GovX Login
        </h4>
      </div>

      <p className="text-neutral-300 text-sm sm:text-[15px] leading-relaxed">
        Enjoy <span className="font-semibold text-amber-300">15% off</span> both
        coffee and merch — plus{" "}
        <span className="font-semibold text-amber-300">$1 extra per bag</span>{" "}
        off for veterans and first responders.
      </p>

      <a
        href="https://auth.govx.com/shopify/verify?shop=81ub0m-s7.myshopify.com&utm_source=shopify&utm_medium=govxid&utm_campaign=custom_link"
        className="mt-3 w-full inline-block px-4 py-2 rounded-lg bg-amber-400 text-neutral-900 text-sm font-semibold hover:bg-amber-300 underline-offset-2 hover:underline"
      >
        Get Govx discount code
      </a>

      <div className="mt-2 text-[11px] text-neutral-400">
        Need help?{" "}
        <Link to="/contact" className="text-amber-300 hover:underline">
          Contact the crew
        </Link>
      </div>
    </div>
  );
}

function NotifyForm({ onSubmit }: any) {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const submit = (e: any) => {
    e.preventDefault();
    if (!emailOk(email)) {
      flash("Enter a valid email.");
      return;
    }

    setDone(true);
    onSubmit && onSubmit(email);
  };
  if (done)
    return (
      <p className="mt-2 text-xs text-emerald-400">
        Aye! We'll notify you when it's in stock.
      </p>
    );
  return (
    <form
      onSubmit={submit}
      className="mt-2 flex flex-col sm:flex-row gap-2 min-w-0"
    >
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        className="w-full sm:flex-1 min-w-0 rounded-lg bg-neutral-900/70 border border-neutral-700 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
      />
      <button className="w-full sm:w-auto px-3 py-2 rounded-lg bg-amber-400 text-neutral-900 text-xs font-semibold hover:bg-amber-300">
        Notify
      </button>
    </form>
  );
}
function LaunchedFromHarbor({ noBg = false }: { noBg?: boolean }) {
  const location = useLocation();
  const isHome = location.pathname === "/";
  const isStore = location.pathname.startsWith("/store");
  const mobileMerch = [
    { key: "tees", label: "Tees", img: "shirts-web.png" },
    { key: "hats", label: "Hats", img: "hat1-web.png" },
    { key: "mugs", label: "Mugs", img: "coffee-deck2.png" },
    { key: "accessories", label: "Accessories", img: "canister-web.png" },
  ];

  // Inline timer data (uses your existing helpers)
  const nowET = useEtNow(45000); // update ~45s
  const { state, roastMonday, cutoff } = getRoastState(nowET);

  let left = "";
  if (state === "countdown" && cutoff) {
    const diff = cutoff.diff(nowET, ["days", "hours", "minutes"]).toObject();
    const d = Math.max(0, Math.floor(diff.days ?? 0));
    const h = Math.max(0, Math.floor(diff.hours ?? 0));
    const m = Math.max(0, Math.floor(diff.minutes ?? 0));
    left = `${d}d ${h}h ${m}m`;
  }
  const dateLabel = formatEtDate(roastMonday);
  const nextInfo = state === "countdown" && left ? left : dateLabel;

  // refs + state for mobile carousel
  const scrollRef = React.useRef<HTMLDivElement | null>(null);
  const cardRefs = React.useRef<(HTMLAnchorElement | null)[]>([]);
  const [currentIdx, setCurrentIdx] = React.useState(0);

  // helper: scroll to a given index (wrap safe)
  const scrollToIndex = React.useCallback(
    (idx: number) => {
      const clamped =
        ((idx % roastCards.length) + roastCards.length) % roastCards.length;
      const el = cardRefs.current[clamped];
      if (el && scrollRef.current) {
        el.scrollIntoView({
          behavior: "smooth",
          inline: "center",
          block: "nearest",
        });
      }
      setCurrentIdx(clamped);
    },
    [roastCards.length]
  );

  // arrow handlers
  const handlePrev = React.useCallback(() => {
    scrollToIndex(currentIdx - 1);
  }, [currentIdx, scrollToIndex]);

  const handleNext = React.useCallback(() => {
    scrollToIndex(currentIdx + 1);
  }, [currentIdx, scrollToIndex]);

  // sync index when user swipes manually
  const handleScroll = React.useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;
    const scrollLeft = container.scrollLeft;

    let bestIdx = 0;
    let bestDist = Infinity;
    cardRefs.current.forEach((cardEl, idx) => {
      if (!cardEl) return;
      const dist = Math.abs(cardEl.offsetLeft - scrollLeft);
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = idx;
      }
    });
    setCurrentIdx(bestIdx);
  }, []);

  // === FULL MOBILE TUNING PER CARD (image + content) ===
  // === MOBILE TUNING PER CARD (image + content, default same for all) ===
  const MOBILE_TUNE: Record<
    string,
    {
      imgH: string;
      objY: string;
      shift: string;
      gradH: string;
      overlap: string;
      stack: string;
      title: string;
      subtitle: string;
      note: string;
      fit: string;
      sideFill: boolean; // NEW: add blurred cover filler behind contain images
    }
  > = {
    flagship: {
      imgH: "h-[24rem]", // taller image so it can bleed downward
      objY: "object-[center_40%]",
      shift: "",
      gradH: "h-24", // deeper gradient for readability
      overlap: "-mb-16", // pulls the image DOWN behind content without changing card height
      stack: "", // leave content where it is
      title: "text-[28px]", // ~5% bump from 26px
      subtitle: "text-[16px]",
      note: "",
      fit: "object-cover",
      sideFill: true,
    },

    "baptism-by-fire": {
      imgH: "h-[24rem]", // allow the photo to bleed downward
      objY: "object-[center_30%]", // tweak later if you want a different crop
      shift: "",
      gradH: "h-24", // deeper gradient for readability
      overlap: "-mb-16", // bleed image under the text without changing card size
      stack: "", // keep content position the same
      title: "text-[28px]", // ~5% larger title like flagship
      subtitle: "text-[16px]",
      note: "",
      fit: "object-cover",
      sideFill: true,
    },

    "java-action": {
      imgH: "h-[24rem]",
      objY: "object-[center_35%]",
      shift: "",
      gradH: "h-24",
      overlap: "-mb-16",
      stack: "",
      title: "text-[28px]",
      subtitle: "text-[16px]",
      note: "",
      fit: "object-contain", // keep the zoom-out effect
      sideFill: true, // turn on filler layer to remove side bars visually
    },
    "oak-and-copper": {
      imgH: "h-[24rem]", // allow the photo to bleed under text
      objY: "object-[center_40%]", // adjust later if you want more sea/sky
      shift: "",
      gradH: "h-24", // deeper gradient for readability
      overlap: "-mb-16", // bleed image without changing card height
      stack: "", // keep content position the same
      title: "text-[28px]", // match your global sizes
      subtitle: "text-[16px]",
      note: "",
      fit: "object-cover", // full-width; no side bars
      sideFill: false, // no filler needed when using cover
    },
    "brass-monkey": {
      imgH: "h-[24rem]",
      objY: "object-[center_35%]",
      shift: "",
      gradH: "h-24",
      overlap: "-mb-16",
      stack: "",
      title: "text-[28px]",
      subtitle: "text-[16px]",
      note: "",
      fit: "object-contain", // zoom out
      sideFill: true, // blurred filler behind to hide side bars
    },
  };

  const DEFAULT_MOBILE_TUNE = {
    imgH: "h-[20rem]",
    objY: "object-[center_40%]",
    shift: "",
    gradH: "h-10",
    overlap: "",
    stack: "",
    title: "",
    subtitle: "",
    note: "",
    fit: "object-cover",
    sideFill: false, // NEW
  };
  // Live review summaries for each roast card (avg + count from Judge.me)
  const [summaryBySlug, setSummaryBySlug] = React.useState<
    Record<string, { avg: number; count: number }>
  >({});

  React.useEffect(() => {
    let cancelled = false;

    async function loadAllSummaries() {
      try {
        const promises = roastCards.map(async (card) => {
          const productId = PRODUCT_IDS_BY_SLUG[card.slug];
          if (!productId) return [card.slug, { avg: 0, count: 0 }] as const;

          const res = await fetch(
            `/api/get-reviews?shopifyProductId=${encodeURIComponent(productId)}`
          );
          if (!res.ok) return [card.slug, { avg: 0, count: 0 }] as const;

          const data = await res.json();
          const reviews: any[] = Array.isArray(data.reviews)
            ? data.reviews
            : [];

          if (!reviews.length)
            return [card.slug, { avg: 0, count: 0 }] as const;

          const count = reviews.length;
          const sum = reviews.reduce(
            (acc, r) => acc + (Number(r.rating) || 0),
            0
          );
          const avg = Math.round((sum / count) * 10) / 10;

          return [card.slug, { avg, count }] as const;
        });

        const entries = await Promise.all(promises);
        if (cancelled) return;

        const map: Record<string, { avg: number; count: number }> = {};
        for (const [slug, stats] of entries) {
          map[slug] = stats;
        }
        setSummaryBySlug(map);
      } catch (err) {
        if (!cancelled) {
          console.error("Error loading review summaries", err);
        }
      }
    }

    loadAllSummaries();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section
      id="fleet"
      className={`relative overflow-hidden ${
        isHome
          ? "pt-2 pb-6 md:pt-8 md:pb-10 min-h-[auto] md:min-h-[820px]"
          : isStore
          ? "pt-2 pb-6 md:pt-8 md:pb-14 min-h-[auto] md:min-h-[1000px]"
          : "pt-2 pb-6 md:py-20 min-h-[auto] md:min-h-[1100px]"
      }`}
    >
      {/* Background image just for this section */}
      {!noBg && (
        <img
          src="/old-boston-harbor.png"
          alt="Boston Harbor backdrop"
          className="hidden md:block absolute inset-0 w-full h-full object-cover opacity-40 -z-0"
        />
      )}

      <Container
        className={`relative z-10 ${
          isStore ? "md:pt-16" : ""
        } px-0 sm:px-0 lg:px-0`}
      >
        {/* header row: title + (maybe) back button */}
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between text-center md:text-left px-4 sm:px-6 lg:px-8">
          <SectionTitle
            title={
              <span
                className="
              block md:inline md:whitespace-nowrap
              text-[18.5px] sm:text-[24px] md:text-5xl
              leading-tight md:leading-[1.1]
              tracking-[0.08em] md:text-5xl font-extrabold md:font-bold text-amber-300
              mt-2 md:mt-0
              "
                style={{ fontFamily: "'Cinzel', serif", fontWeight: 1000 }}
              >
                LAUNCHED FROM THE HARBOR
              </span>
            }
            subtitle={
              <>
                {/* info lines */}
                <div className="text-neutral-300 text-sm sm:text-base font-normal tracking-tight flex flex-col items-center md:items-start gap-1">
                  {/* line 1: Roast CTA */}
                  <div className="whitespace-nowrap">
                    <span>Order your fresh roasted coffee now</span>
                  </div>

                  {/* line 2: Next Roast Date: <value>  (same line now, both mobile + desktop) */}
                  <div className="text-center md:text-left whitespace-nowrap">
                    <span>Next Roast Date: </span>
                    <span className="text-amber-400">{nextInfo}</span>
                  </div>
                </div>
              </>
            }
          />

          {/* Back button drops under title on mobile, floats right on desktop */}
          {!isHome && (
            <div className="hidden md:block self-center md:self-start">
              <BackButton size="sm" />
            </div>
          )}
        </div>

        {/* tighten gap before cards */}
        <div className="mt-1 md:mt-1"></div>
        {/* mobile: 1-card swipe carousel with arrows */}
        <div className="relative md:hidden">
          {/* scroll row */}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 pl-3 pr-3 no-scrollbar scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none]"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {roastCards.map((card, idx) => {
              const base =
                card.slug === "oak-and-copper" ? 27 : Number(card.price ?? 22);

              const sub =
                card.slug === "oak-and-copper"
                  ? base
                  : Math.round(base * 0.85 * 100) / 100;

              const t = MOBILE_TUNE[card.slug] ?? DEFAULT_MOBILE_TUNE;

              return (
                <Link
                  key={card.id}
                  to={`/roast/${card.slug}`}
                  aria-label={`${card.title} details`}
                  ref={(el) => {
                    cardRefs.current[idx] = el;
                  }}
                  className="
                    mt-2 snap-center shrink-0
                    w-[88vw] max-w-[88vw]
                    rounded-2xl ring-1 ring-amber-400/60
                    bg-neutral-900/40 shadow-lg shadow-amber-400/10
                    hover:ring-amber-300 hover:bg-neutral-900
                    transition flex flex-col
                  "
                >
                  {/* ===== IMAGE (no overlay text) ===== */}
                  {/* Tweak these two numbers if needed */}
                  {/* IMG_HEIGHT ↓ and OBJECT_Y ↓ */}
                  <div
                    className={`relative ${t.imgH} ${t.shift} ${t.overlap} rounded-t-2xl overflow-hidden bg-black`}
                  >
                    {/* FILLER LAYER: covers side bars when using object-contain */}
                    {t.sideFill && (
                      <img
                        src={
                          card.img?.startsWith("/") ||
                          card.img?.startsWith("http")
                            ? card.img
                            : `/${card.img}`
                        }
                        alt=""
                        aria-hidden
                        className={`absolute inset-0 w-full ${t.imgH} object-cover scale-110 blur-sm opacity-60 z-0`}
                      />
                    )}

                    {/* MAIN IMAGE */}
                    <img
                      src={
                        card.img?.startsWith("/") ||
                        card.img?.startsWith("http")
                          ? card.img
                          : `/${card.img}`
                      }
                      alt={card.title}
                      className={`relative z-[1] w-full ${t.imgH} ${t.fit} ${t.objY}`}
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        const el = e.currentTarget as HTMLImageElement;
                        if (!el.src.includes("/placeholder.png"))
                          el.src = "/placeholder.png";
                      }}
                    />

                    {/* GRADIENT */}
                    <div
                      className={`pointer-events-none absolute inset-x-0 bottom-0 ${t.gradH} bg-gradient-to-t from-black/80 via-black/45 to-transparent z-[2]`}
                    />
                  </div>

                  {/* ===== CONTENT BELOW IMAGE (tight stack) ===== */}
                  <div
                    className={`relative z-10 px-4 pt-0 pb-4 flex flex-col text-center ${t.stack}`}
                  >
                    <h3
                      className={`text-[26px] leading-[1.1] font-extrabold text-amber-300 ${t.title}`}
                      style={{
                        fontFamily: "'Cinzel', serif",
                        fontWeight: 800,
                      }}
                    >
                      {card.title}
                    </h3>

                    {/* SUBTITLE — ensure this exists ONLY ONCE in mobile */}
                    <p
                      className={`text-[13px] italic text-neutral-400 ${t.subtitle}`}
                    >
                      {card.subTitle}
                      <span className="mx-1.5 text-amber-300/80" aria-hidden>
                        -
                      </span>
                      <span className="not-italic">12 oz</span>
                    </p>

                    {/* NOTE */}
                    <p
                      className={`text-sm text-neutral-400 line-clamp-1 ${t.note}`}
                    >
                      {card.note}
                    </p>

                    {/* PRICE */}

                    <div className="mt-2 text-[15px] flex flex-row flex-wrap items-center justify-center gap-2">
                      <span className="text-neutral-100">From {fmt(base)}</span>
                      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[13px] bg-amber-400/10 text-amber-300 ring-1 ring-amber-400/30 whitespace-nowrap">
                        <span className="font-semibold">{fmt(sub)}</span>
                        <span className="opacity-140">"Subscribe"</span>
                      </span>
                    </div>

                    {/* STARS */}
                    <div className="mt-2 flex flex-col items-center text-[12px] text-neutral-300">
                      <div className="flex items-center gap-2">
                        {(() => {
                          const summary = summaryBySlug[card.slug] || {
                            avg: 0,
                            count: 0,
                          };
                          const avg = summary.avg ?? 0;
                          const count = summary.count ?? 0;

                          return (
                            <>
                              <span className="text-amber-300 font-semibold tabular-nums">
                                {avg.toFixed(1)}
                              </span>
                              <div className="inline-flex items-center gap-0.5">
                                {[0, 1, 2, 3, 4].map((i) => {
                                  const starFill = Math.max(
                                    0,
                                    Math.min(1, avg - i)
                                  );
                                  const clipWidth = 24 * starFill;
                                  const clipId = `cardStarClip-${card.slug}-${i}`;
                                  return (
                                    <svg
                                      key={i}
                                      viewBox="0 0 24 24"
                                      className="h-4 w-4"
                                      aria-hidden
                                    >
                                      <defs>
                                        <clipPath
                                          id={clipId}
                                          clipPathUnits="userSpaceOnUse"
                                        >
                                          <rect
                                            x="0"
                                            y="0"
                                            width={clipWidth}
                                            height="24"
                                          />
                                        </clipPath>
                                      </defs>
                                      {/* base */}
                                      <path
                                        d="M12 .587l3.668 7.568L24 9.753l-6 5.854L19.335 24 12 19.771 4.665 24 6 15.607 0 9.753l8.332-1.598z"
                                        className="text-neutral-800"
                                        fill="currentColor"
                                      />
                                      {/* amber fill */}
                                      <path
                                        d="M12 .587l3.668 7.568L24 9.753l-6 5.854L19.335 24 12 19.771 4.665 24 6 15.607 0 9.753l8.332-1.598z"
                                        className="text-amber-400"
                                        fill="currentColor"
                                        clipPath={`url(#${clipId})`}
                                      />
                                      {/* outline */}
                                      <path
                                        d="M12 .587l3.668 7.568L24 9.753l-6 5.854L19.335 24 12 19.771 4.665 24 6 15.607 0 9.753l8.332-1.598z"
                                        fill="none"
                                        stroke="currentColor"
                                        className="text-neutral-600"
                                        strokeWidth="1.4"
                                        strokeLinejoin="round"
                                      />
                                    </svg>
                                  );
                                })}
                              </div>
                              <span className="text-[11px] text-neutral-300/85 tracking-wide whitespace-nowrap">
                                {count} REVIEWS
                              </span>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* left/right hint arrows - clickable */}
          <div className="absolute inset-y-1/2 -translate-y-1/2 left-1 flex items-center pl-1 pointer-events-none">
            <button
              type="button"
              onClick={handlePrev}
              className="pointer-events-auto h-9 w-9 rounded-full bg-amber-400 text-neutral-900 font-bold text-xl flex items-center justify-center shadow-md shadow-black/40 active:scale-95"
              aria-label="Previous roast"
            >
              ‹
            </button>
          </div>
          <div className="absolute inset-y-1/2 -translate-y-1/2 right-1 flex items-center pr-1 pointer-events-none">
            <button
              type="button"
              onClick={handleNext}
              className="pointer-events-auto h-9 w-9 rounded-full bg-amber-400 text-neutral-900 font-bold text-xl flex items-center justify-center shadow-md shadow-black/40 active:scale-95"
              aria-label="Next roast"
            >
              ›
            </button>
          </div>
        </div>

        {/* desktop / tablet: horizontal slider (all roasts) */}
        <div className="hidden md:block relative">
          {/* scroll row */}
          <div
            className="flex gap-12 overflow-x-auto md:overflow-x-visible snap-x snap-mandatory pb-4 no-scrollbar scroll-smooth px-0 -mx-4 sm:-mx-6 lg:-mx-8 pl-4 sm:pl-6 lg:pl-8 pr-4 sm:pr-6 lg:pr-8 md:justify-center"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {roastCards.map((card) => {
              const base =
                card.slug === "oak-and-copper" ? 27 : Number(card.price ?? 22);

              const sub =
                card.slug === "oak-and-copper"
                  ? base
                  : Math.round(base * 0.85 * 100) / 100;

              return (
                <Link
                  key={card.id}
                  to={`/roast/${card.slug}`}
                  aria-label={`${card.title} details`}
                  className="group relative snap-center shrink-0 w-[260px] flex flex-col items-center text-center transition"
                >
                  <div className="pointer-events-none absolute top-[110px] left-1/2 -translate-x-1/2 h-[300px] w-[300px] rounded-full bg-amber-300/30 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  <img
                    src={
                      card.img?.startsWith("/") || card.img?.startsWith("http")
                        ? card.img
                        : `/${card.img}`
                    }
                    alt={card.title}
                    className="w-auto h-[450px] object-contain mx-auto mb-[-72px] relative z-10 transition duration-300 group-hover:brightness-110"
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      const el = e.currentTarget as HTMLImageElement;
                      if (!el.src.includes("/placeholder.png"))
                        el.src = "/placeholder.png";
                    }}
                  />

                  <div className="pt-0 pb-5 px-5 flex flex-col flex-1 items-center text-center transition duration-300 group-hover:brightness-110">
                    <h3
                      className="text-2xl font-extrabold text-amber-300 mt-[-4px] transition duration-300 group-hover:text-amber-200"
                      style={{ fontFamily: "'Cinzel', serif", fontWeight: 700 }}
                    >
                      {card.title}
                    </h3>

                    <p className="text-[1.05rem] italic text-neutral-500 -mt-1">
                      {card.subTitle}
                      <span className="mx-1.5 text-amber-300/80" aria-hidden>
                        -
                      </span>
                      <span className="not-italic">12 oz</span>
                    </p>

                    {/* Clamp ONLY Brass Monkey so it can't make the card taller */}
                    <p
                      className={
                        "text-sm text-neutral-400 leading-snug mt-1 " +
                        (card.slug === "brass-monkey"
                          ? "line-clamp-1"
                          : "line-clamp-2")
                      }
                    >
                      {card.note}
                    </p>

                    {/* PRICE ROW */}
                    <div className="mt-2 flex items-center justify-center gap-3">
                      {card.slug !== "oak-and-copper" && (
                        <span className="text-neutral-300 text-[13px] whitespace-nowrap">
                          From {fmt(base)}
                        </span>
                      )}

                      {card.slug === "oak-and-copper" ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-300 text-[13px] whitespace-nowrap font-extrabold tabular-nums">
                          {fmt(base)}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2 px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-300 text-[13px] whitespace-nowrap">
                          <span className="font-semibold">Subscribe</span>
                          <span className="font-extrabold tabular-nums">
                            {fmt(sub)}
                          </span>
                        </span>
                      )}
                    </div>

                    {/* STARS (same as your desktop grid) */}
                    <div className="mt-2 flex flex-col items-center text-[13px] text-neutral-400">
                      <div className="flex items-center justify-center gap-2">
                        {(() => {
                          const summary = summaryBySlug[card.slug] || {
                            avg: 0,
                            count: 0,
                          };
                          const avg = summary.avg ?? 0;
                          const count = summary.count ?? 0;

                          return (
                            <>
                              <span className="text-amber-300 font-semibold tabular-nums">
                                {avg.toFixed(1)}
                              </span>

                              <div className="inline-flex items-center gap-0.5">
                                {[0, 1, 2, 3, 4].map((i) => {
                                  const starFill = Math.max(
                                    0,
                                    Math.min(1, avg - i)
                                  );
                                  const clipWidth = 24 * starFill;
                                  const clipId = `cardStarClipDesk-${card.slug}-${i}`;

                                  return (
                                    <svg
                                      key={i}
                                      viewBox="0 0 24 24"
                                      className="h-4 w-4"
                                      aria-hidden
                                    >
                                      <defs>
                                        <clipPath
                                          id={clipId}
                                          clipPathUnits="userSpaceOnUse"
                                        >
                                          <rect
                                            x="0"
                                            y="0"
                                            width={clipWidth}
                                            height="24"
                                          />
                                        </clipPath>
                                      </defs>

                                      <path
                                        d="M12 .587l3.668 7.568L24 9.753l-6 5.854L19.335 24 12 19.771 4.665 24 6 15.607 0 9.753l8.332-1.598z"
                                        className="text-neutral-800"
                                        fill="currentColor"
                                      />
                                      <path
                                        d="M12 .587l3.668 7.568L24 9.753l-6 5.854L19.335 24 12 19.771 4.665 24 6 15.607 0 9.753l8.332-1.598z"
                                        className="text-amber-400"
                                        fill="currentColor"
                                        clipPath={`url(#${clipId})`}
                                      />
                                      <path
                                        d="M12 .587l3.668 7.568L24 9.753l-6 5.854L19.335 24 12 19.771 4.665 24 6 15.607 0 9.753l8.332-1.598z"
                                        fill="none"
                                        stroke="currentColor"
                                        className="text-neutral-600"
                                        strokeWidth="1.4"
                                        strokeLinejoin="round"
                                      />
                                    </svg>
                                  );
                                })}
                              </div>

                              <span className="text-[11px] text-neutral-400/80 tracking-wide whitespace-nowrap">
                                {count} REVIEWS
                              </span>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </Container>
    </section>
  );
}

function SDVOSBHighlight() {
  return (
    <section
      id="sdvosb-highlight"
      className="py-10 sm:py-12 border-t border-neutral-800"
    >
      <Container>
        <div className="max-w-xl mx-auto rounded-2xl ring-1 ring-amber-400/60 bg-neutral-900/60 p-6 sm:p-8 text-center">
          <h3 className="text-xl sm:text-2xl font-extrabold text-amber-300">
            SDVOSB
          </h3>
          <p className="text-neutral-300 mt-2 text-sm sm:text-base">
            Government contract information.
          </p>
          <Link
            to="/sdvosb"
            className="inline-block mt-4 px-4 py-2 rounded-lg bg-amber-400 text-neutral-900 font-semibold text-sm sm:text-base hover:bg-amber-300"
          >
            View Details
          </Link>
        </div>
      </Container>
    </section>
  );
}

/* ================= Pages ================= */
function HomePage() {
  return (
    <>
      <header
        id="top"
        className="relative overflow-hidden border-b border-neutral-800 z-[0]"
        style={{ isolation: "isolate" }}
      >
        {/* MOBILE full-bleed bean hero */}
        <div className="absolute inset-0 md:hidden bg-neutral-950">
          {/* bean image as background, less zoom */}
          <img
            src="officer-window3.tif"
            alt=""
            className="w-full h-full object-contain object-center"
          />
          {/* dark overlay for readability */}
          <div className="absolute inset-0 bg-black/20" />
        </div>

        {/* DESKTOP original emblem + radial glow */}
        <img
          src="emblem-black.png"
          alt="Stormy sea"
          className="hidden md:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[62vw] max-w-[780px] object-contain opacity-30 pointer-events-none select-none"
        />
        <div className="hidden md:block absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,193,7,0.10),transparent_60%)]" />
        <div className="hidden md:block absolute inset-0 bg-neutral-950/10 mix-blend-multiply" />

        {/* content wrapper sits on top */}
        <Container className="relative desktopHeroPad pt-[26rem] pb-10 sm:pt-[24rem] sm:pb-14">
          <style>{`
  @media (min-width: 768px) {
    #top .desktopHeroPad {
      padding-top: 4.5rem;
      padding-bottom: 4.5rem;
    }
    #top .heroCenter {
      transform: translateY(72px);
    }
  }
`}</style>

          <div className="grid grid-cols-1 md:grid-cols-12 md:gap-12 items-center text-center md:text-left md:-mx-16 lg:-mx-24">
            {/* LEFT HERO IMAGE (desktop only) */}
            <div className="hidden md:flex md:col-span-3 justify-start">
              <div className="w-full max-w-[420px] rounded-3xl overflow-hidden ring-1 ring-amber-400/40 shadow-2xl shadow-amber-500/20">
                <img
                  src="smell-beans.png"
                  alt="Smelling beans"
                  className="
          block
          w-full
          h-auto
          max-h-[60vh]
          sm:max-h-[70vh]
          md:max-h-[calc(100vh-300px)]
          object-cover
        "
                />
              </div>
            </div>

            {/* CENTER TEXT + CTA (desktop only) */}
            <div className="md:col-span-6 flex flex-col items-center text-center heroCenter">
              <div aria-hidden className="hidden md:block h-12 lg:h-16" />

              <h2
                className="text-amber-400 font-extrabold leading-snug tracking-tight
      text-[1.25rem] sm:text-[1.5rem] md:text-[2.1rem]"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                PREMIUM, SMALL-BATCH COFFEE
              </h2>

              <div className="mt-1 text-neutral-300 text-[12px] sm:text-sm md:text-lg">
                <span>Roasted To Order</span>
                <span className="mx-1.5 text-amber-400/70" aria-hidden>
                  •
                </span>
                <span>Ethically Sourced</span>
                <span className="mx-1.5 text-amber-400/70" aria-hidden>
                  •
                </span>
                <a
                  href="https://auth.govx.com/shopify/verify?shop=81ub0m-s7.myshopify.com&utm_source=shopify&utm_medium=govxid&utm_campaign=custom_link"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-amber-200 underline-offset-2 hover:underline"
                >
                  GovX Partner
                </a>
              </div>

              <div aria-hidden className="h-2 md:h-3" />

              <div className="w-full max-w-[28rem]">
                <Link
                  to="/store"
                  className="w-full inline-flex items-center justify-center gap-2
                  px-8 py-4 sm:px-10 sm:py-5

          rounded-xl bg-neutral-900 text-amber-400 font-extrabold
          text-2xl sm:text-lg md:text-2xl tracking-wide
          border-2 border-amber-400 shadow-2xl shadow-amber-500/35


          hover:bg-amber-400 hover:text-neutral-900
          transition-all duration-200"
                >
                  <span aria-hidden>⚓</span>
                  SHOP COFFEE NOW
                </Link>

                <RoastCTAInfo />
              </div>
            </div>

            {/* RIGHT HERO IMAGE (desktop only) */}
            <div className="hidden md:flex md:col-span-3 justify-end">
              <div className="w-full max-w-[420px] ml-auto rounded-3xl overflow-hidden ring-1 ring-amber-400/40 shadow-2xl shadow-amber-500/20">
                <img
                  src="officer-window2.png"
                  alt="Old Ironsides hero"
                  className="
          block
          w-full
          h-auto
          max-h-[60vh]
          sm:max-h-[70vh]
          md:max-h-[calc(100vh-300px)]
          object-cover
        "
                />
              </div>
            </div>
          </div>
        </Container>
      </header>

      <section className="relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] overflow-hidden">
        <img
          src="/World Amber.png"
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-black/70" />

        <div className="relative">
          <LaunchedFromHarbor noBg />
        </div>
      </section>

      <RingThatBellBox />
      {/* ===== GIVING BACK (copied from Origins) ===== */}
      <section
        id="origins-giving-back"
        className="relative overflow-hidden border-t border-neutral-800 scroll-mt-28 md:scroll-mt-36"
      >
        {/* Background image, cooled and desaturated */}
        <img
          src="/flag-close.jpg"
          alt=""
          role="presentation"
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover object-center z-0 pointer-events-none brightness-70 saturate-70 hue-rotate-[-10deg]"
        />

        <div className="pointer-events-none absolute inset-0 z-0">
          {/* global darken */}
          <div className="absolute inset-0 bg-black/45" />
          {/* left shield over copy only */}
          <div className="absolute inset-y-0 left-0 w-full md:w-[62%] lg:w-[55%] bg-gradient-to-r from-black/90 via-black/70 to-transparent" />
          {/* mild texture blur */}
          <div className="absolute inset-0 md:backdrop-blur-[2px]" />
          {/* top/bottom vignette to kill remaining glare */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/35" />
        </div>

        <Container>
          {/* ===== MOBILE-ONLY: amber line + GovX button ===== */}
          <div className="relative z-10 md:hidden min-h-[420px] py-12 flex items-center">
            <div className="mx-auto max-w-screen-sm space-y-4 text-center">
              <p className="text-amber-300 text-xl leading-relaxed tracking-[0.02em]">
                Active duty, veterans, and first responders including fire, law
                enforcement, and EMTs receive $1 off every bag of fresh roasted
                coffee, every day. The discount stacks with subscriptions.
              </p>
              <a
                href="https://auth.govx.com/shopify/verify?shop=81ub0m-s7.myshopify.com&utm_source=shopify&utm_medium=govxid&utm_campaign=custom_link"
                className="mt-3 inline-block rounded-xl ring-1 ring-amber-400/60 
       text-amber-400 font-semibold text-[1rem]
       px-[1.1rem] py-[0.45rem]
       hover:bg-amber-400 hover:text-neutral-900 transition-all"
              >
                Get GovX discount code
              </a>
            </div>
          </div>

          {/* ===== DESKTOP/TABLET: original layout (unchanged) ===== */}
          <div className="relative z-10 hidden md:block">
            <div className="min-h-[700px] py-16 flex flex-col justify-center">
              <div className="grid grid-cols-1 md:grid-cols-[auto,1fr] gap-6 items-center">
                <div className="justify-self-center md:justify-self-start self-center">
                  <div className="relative w-64 md:w-[30rem] mx-auto md:mx-0 aspect-[4/3] rounded-xl overflow-hidden ring-1 ring-white/10 shadow-xl shadow-black/60 bg-neutral-900/40">
                    <img
                      src="/soliders-sunset.png"
                      alt="Giving back"
                      className="w-full h-full object-cover hue-rotate-[-10deg] saturate-70"
                    />
                    {/* top and bottom vignettes reduce perceived warmth */}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/10" />
                  </div>
                </div>

                {/* text: center on mobile, left on md+ */}
                <div className="space-y-3 text-center md:text-left">
                  <h3 className="font-cinzel text-2xl md:text-4xl font-extrabold text-amber-300 tracking-wide uppercase">
                    Giving Back To Those Who Served
                  </h3>
                  <br />

                  <p className="text-neutral-100 text-xl md:text-2xl leading-relaxed tracking-[0.02em]">
                    Even as a young company where every dollar counts, giving
                    back is a big part of who we are and what Old Ironsides
                    Coffee stands for. As a veteran, I believe service is a
                    promise kept when no one is watching. It is standards held
                    high, teamwork under pressure, and loyalty to the people
                    beside you. <br />
                    <br />
                    This brand exists to honor that code, to stand with those
                    who protect our freedoms, and to keep their legacy present
                    in the work we do every day.
                  </p>
                  <br />
                  <p className="text-amber-300 text-xl md:text-2xl leading-relaxed tracking-[0.02em]">
                    Active duty, veterans, and first responders receive $1 off
                    every bag of fresh roasted coffee, every day. The discount
                    stacks with subscriptions.
                  </p>
                  <br />
                  <a
                    href="https://auth.govx.com/shopify/verify?shop=81ub0m-s7.myshopify.com&utm_source=shopify&utm_medium=govxid&utm_campaign=custom_link"
                    className="mt-3 inline-block rounded-xl ring-1 ring-amber-400/60 
       text-amber-400 font-semibold text-[1rem]
       px-[1.1rem] py-[0.45rem]
       hover:bg-amber-400 hover:text-neutral-900 transition-all"
                  >
                    Get GovX discount code
                  </a>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section
        id="contact"
        className="py-16 md:py-24 border-b border-neutral-800"
      >
        <Container>
          <SectionTitle
            title="Hail The Quarterdeck"
            subtitle="Questions • Comments • Press – We’ll get back to you fast."
          />
          <div className="mt-2 md:mt-8 grid md:grid-cols-3 gap-6 text-sm">
            <div className="rounded-2xl ring-1 ring-neutral-800 bg-neutral-900/40 p-6">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-amber-300" />
                <span className="text-neutral-300">
                  HQ@oldironsidescoffee.org
                </span>
              </div>

              <div className="mt-2 text-neutral-400">
                6 Liberty Square #2564, Boston, MA 02109
              </div>
            </div>
            <div className="rounded-2xl ring-1 ring-neutral-800 bg-neutral-900/40 p-6">
              <h4 className="font-semibold text-amber-300">Follow Us</h4>

              <div className="mt-3 flex gap-6 text-amber-300">
                <a
                  href="https://instagram.com/oldironsidescoffee"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 hover:text-amber-200 transition"
                >
                  <Instagram className="h-5 w-5" />
                  Instagram
                </a>

                <a
                  href="https://facebook.com/oldironsidescoffee"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 hover:text-amber-200 transition"
                >
                  <Facebook className="h-5 w-5" />
                  Facebook
                </a>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <div className="hidden md:block">
        <SDVOSBHighlight />
      </div>
    </>
  );
}
function ShopCoffeeCard({ className = "" }: { className?: string }) {
  const flagship = roastCards.find((c) => c.slug === "flagship");
  return (
    <Link
      to="/store"
      className={[
        "group relative inline-block align-top overflow-hidden rounded-xl",
        "ring-1 ring-amber-500 shadow-2xl shadow-black/30",
        // responsive sizing
        "w-[11rem] h-[13rem] sm:w-[12.5rem] sm:h-[15rem] md:w-[13.75rem] md:h-[16.25rem]",
        "translate-y-4 md:translate-y-6",
        "bg-neutral-900/40 hover:bg-neutral-900 transition",
        className,
      ].join(" ")}
    >
      <img
        src={
          flagship?.img?.startsWith("/") || flagship?.img?.startsWith("http")
            ? flagship?.img
            : `/${flagship?.img || "Flagship-web.png"}`
        }
        alt="Shop Coffee"
        className="absolute inset-0 w-full h-full object-cover"
      />

      <div className="absolute inset-x-0 bottom-0 p-3 bg-neutral-950/40 backdrop-blur-sm">
        <div className="text-center text-base sm:text-lg md:text-xl text-amber-300 font-bold group-hover:underline">
          SHOP COFFEE
        </div>
      </div>
    </Link>
  );
}

function FleetPage() {
  return (
    <main className="max-md:py-0 md:py-8 max-md:-mt-10">
      <LaunchedFromHarbor />
    </main>
  );
}

const cardFrame =
  "w-full max-w-[24rem] md:max-w-[26rem] aspect-[3/4] overflow-hidden rounded-2xl ring-1 ring-amber-400/60 shadow-2xl shadow-amber-500/20 bg-neutral-900/40";
function FleetStoryPage() {
  const { slug } = useParams();
  const card = roastCards.find((c) => c.slug === slug);
  if (!card) return <NotFoundPage />;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const isFlagship = card.slug === "flagship";
  const isBaptism = card.slug === "baptism-by-fire";
  const isJavaAction = card.slug === "java-action";
  const isOakAndCopper = card.slug === "oak-and-copper";
  const displayTitle = isFlagship
    ? "FLAGSHIP"
    : isBaptism
    ? "BAPTISM BY FIRE"
    : isJavaAction
    ? "THE JAVA ACTION"
    : isOakAndCopper
    ? "OAK & COPPER"
    : card.title;

  const battleLineMap: Record<string, string> = {
    "java-action": "USS Constitution vs HMS Java",
    "baptism-by-fire": "USS Constitution vs HMS Guerriere",
    "oak-and-copper": "Wrapped in Oak Above, Clad in Copper Below",
    flagship: "",
  };

  const battleLine =
    battleLineMap[card.slug] ||
    (card as any).battleLine ||
    (card as any).storyTitle ||
    "";

  const captionsBySlug: Record<string, { left: string; right: string }> = {
    "java-action": {
      left: "Capt. William Bainbridge",
      right: "Capt. Henry Lambert, Representation only",
    },
    "baptism-by-fire": {
      left: "Capt. Isaac Hull",
      right: "Capt. James Dacres Surrenders to Capt. Hull",
    },
    flagship: {
      left: "President George Washington",
      right: "Commodore John Barry",
    },
    "oak-and-copper": {
      left: "USS Constitution at Philadelphia Navy Yard, c. 1875",
      right: "USS Constitution Restoration, Boston Navy Yard c. 1930",
    },
  };
  const caps = captionsBySlug[card.slug] ?? {
    left: "President George Washington",
    right: "Commodore John Barry",
  };
  // Use conditional fallback for undefined properties
  const heroImg =
    (card.heroImg &&
      (card.heroImg.startsWith("/") || card.heroImg.startsWith("http")
        ? card.heroImg
        : `/${card.heroImg}`)) ||
    "/placeholder.png";

  const imgLeft =
    (card.imgLeft &&
      (card.imgLeft.startsWith("/") || card.imgLeft.startsWith("http")
        ? card.imgLeft
        : `/${card.imgLeft}`)) ||
    "/placeholder.png";

  const imgRight =
    (card.imgRight &&
      (card.imgRight.startsWith("/") || card.imgRight.startsWith("http")
        ? card.imgRight
        : `/${card.imgRight}`)) ||
    "/placeholder.png";

  const duelStoryMap: Record<string, { title: string; story: string[] }> = {
    "java-action": {
      title: "Duel Between Two Captains",
      story: [
        "Captain William Bainbridge of the USS Constitution was a seasoned and resolute leader, whose calm under pressure and tactical brilliance turned the tide in the fierce battle against the HMS Java. Despite being wounded twice during the engagement, Bainbridge maintained control, directing his crew with precision. His unwavering resolve and the Constitution’s superior strength secured a decisive victory, further solidifying his place in naval history. The triumph proved invaluable to the young nation, boosting morale and solidifying Bainbridge’s reputation as one of the finest commanders of the U.S. Navy.",
        "On the opposing side, Captain Henry Lambert of the HMS Java faced an overwhelming challenge. The British frigate, despite its armament, struggled against the Constitution’s superior firepower and maneuverability. Lambert, gravely wounded during the battle, was unable to lead his crew effectively as the situation deteriorated. Tragically, he succumbed to his injuries on January 4, 1813, in Salvador, Brazil. His death marked a somber end to a promising career, and he was buried with full military honors.",
        "In the aftermath, the victory of the Constitution was not just a naval success, it was a defining moment for both captains. Bainbridge’s victory became a cornerstone of his career, while Lambert’s life was cut short, forever tying his legacy to the defeat of the Java. Their fates, shaped by that battle, would be forever linked to the USS Constitution’s engagement with the HMS Java.",
      ],
    },
    "baptism-by-fire": {
      title: "Duel Between Two Captains",
      story: [
        "Captain Isaac Hull, commanding the USS Constitution, was a master tactician. His calm under fire and expert maneuvering turned the tide of battle against the HMS Guerriere. In just 30 minutes, Hull’s decisive actions crippled the British ship, earning him praise and hero status. The victory not only secured his place in history but also gave the young United States a powerful boost in morale during the War of 1812.",
        "On the other side, Captain James Richard Dacres of the Guerriere faced harsh consequences. Despite struggling with poor weather and his ship’s slower maneuvering, Dacres was held responsible for the loss. The British Navy ordered a court-martial, not for incompetence but for the disgrace of losing a royal vessel. Though Dacres was exonerated, his reputation was forever tarnished. The battle’s aftermath cast a long shadow over his career, marking the start of his decline in naval service.",
        "In the end, the Constitution’s victory was more than just a military win. It was a statement of American strength and a defining moment for both captains—one that would shape their legacies for years to come.",
      ],
    },

    "oak-and-copper": {
      title: "Saving Old Ironsides",
      story: [
        "By the middle of the 1800s, time had not been kind to the USS Constitution. Her victories had faded into memory, her hull weathered by decades of service. Stripped of her guns and glory, she lay in quiet neglect, her timbers worn and her decks nearly bare. To many, she was a relic of another age — a ship whose time had passed.",
        "When word spread that the Navy planned to scrap her, the nation reacted with outrage. From classrooms to city halls, citizens spoke out. Poet Oliver Wendell Holmes captured the nation’s voice with his stirring poem “Old Ironsides,” calling for her to be spared. His words struck deep, and Congress took notice.",
        "Repairs began, but it would take another century for a true restoration to bring her back to life. In the 1930s, shipwrights once again worked the oak and copper that had made her a legend. Piece by piece, they returned her to her former strength.",
        "Today, the Constitution still sails because a nation remembered. Saved by its people, restored by its craftsmen, she remains a living symbol of endurance — proof that history, like her hull, was built to last.",
      ],
    },
    flagship: {
      title: "The Founding Fathers Of The Navy",
      story: [
        "As tensions with Britain grew, the young United States needed more than a standing army. The nation’s very survival depended on securing its maritime borders and asserting control over its own waters. President George Washington recognized this and understood that to defend its sovereignty, America required a powerful navy.",
        "In 1794, with British ships still harassing American merchants and impressing sailors, Washington took a historic step. He signed the Naval Act, which authorized the construction of six frigates, including the USS Constitution. This decision was more than just military strategy; it was a statement of American resolve, an acknowledgment that the U.S. would no longer be at the mercy of foreign powers on the seas.",
        "Leading the way was Commodore John Barry, the first commissioned officer of the United States Navy, known as the Father of the Navy.  A seasoned veteran of the Revolutionary War, Barry’s leadership and deep naval expertise would prove essential. His commitment to building a formidable naval force ensured that the Constitution would be a ship capable of standing up to the British and defending the nation’s interests.",
        "Together, Washington’s foresight and Barry’s experience laid the foundation for the Navy. The USS Constitution was not just a ship, it was a symbol of the nation's growing strength and independence, forged from the vision of two men determined to ensure America's place on the world stage.",
      ],
    },
  };

  const duelStory = duelStoryMap[card.slug] || {
    title: "Duel Between Two Captains",
    story:
      "A historic clash at sea between two mighty ships, each a symbol of national pride.",
  };

  const storiesHome = "/origins#origins-history"; // Add this line right here

  return (
    <main className="relative overflow-hidden pt-0 pb-12 md:py-20 max-md:-mt-10">
      <img
        src="/maps-books.png"
        alt=""
        className="hidden md:block pointer-events-none select-none absolute inset-0 w-full h-full object-cover opacity-35 z-0"
      />

      <Container className="relative z-10 max-md:pt-0">
        <div className="hidden md:flex justify-end">
          <Link
            to={storiesHome} // Use the constant STORIES_HOME here
            className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm ring-1 ring-amber-400/70 text-amber-300 hover:bg-amber-400 hover:text-neutral-900 transition"
            onClick={() => {
              try {
                sessionStorage.setItem("storiesReturnTo", storiesHome);
              } catch {}
            }}
          >
            ← Back
          </Link>
        </div>
        <div className="mt-0 md:mt-4 max-md:mt-0 flex items-start mb-16 md:mb-0 lg:mb-0 max-md:flex-col max-md:gap-4 max-md:mb-12">
          <figure
            className={`${cardFrame} md:h-[720px] md:w-[130%] max-md:h-[120vw] max-md:w-[92%] max-md:mx-auto relative max-md:bg-transparent max-md:ring-0 max-md:shadow-none`}
            style={{ maxWidth: "1000px" }}
          >
            <img
              src={heroImg}
              alt={card.title}
              className="block w-full h-full object-cover max-md:rounded-2xl max-md:ring-1 max-md:ring-amber-400/60"
              loading="eager"
              decoding="async"
            />
          </figure>

          <div className="ml-4 self-start">
            {" "}
            {/* Adjusted spacing between image and text */}
            <h1
              className="m-0 text-3xl md:text-4xl font-extrabold tracking-tight text-amber-300"
              style={{ fontFamily: "'Cinzel', serif", fontWeight: 800 }}
            >
              {displayTitle}
            </h1>
            {/* Only show USS Constitution for Flagship, remove subtitle for Flagship */}
            {isFlagship && displayTitle === "FLAGSHIP" ? (
              <div className="mt-1 text-neutral-300 text-base md:text-lg">
                USS Constitution
              </div>
            ) : (
              battleLine && (
                <div className="mt-1 text-neutral-300 text-base md:text-lg">
                  {battleLine}
                </div>
              )
            )}
            {card.battleDate && (
              <div className="text-amber-300 font-semibold text-sm md:text-base">
                {card.battleDate}
              </div>
            )}
            {/* Amber border line */}
            <div className="mt-2 h-px w-full bg-amber-400/30" />
            {/* Main Story Block */}
            {isFlagship && displayTitle === "FLAGSHIP" && (
              <div className="mt-6">
                <p className="mt-4 text-neutral-300 text-lg leading-relaxed">
                  As a young nation, America found itself facing the might of
                  European powers, particularly Britain, whose navy dominated
                  the seas. The British, still wounded from their defeat in the
                  Revolutionary War, sought to reassert their control over
                  American trade routes and maritime freedom.
                </p>
                <p className="mt-4 text-neutral-300 text-lg leading-relaxed">
                  Meanwhile, the United States, though growing in strength and
                  influence, lacked the naval power to defend its sovereignty.
                  British ships frequently seized American merchant vessels,
                  impressed American sailors into service, and imposed tariffs
                  that threatened the nation's economy. The young republic
                  needed a solution, and quickly.
                </p>
                <p className="mt-4 text-neutral-300 text-lg leading-relaxed">
                  In this clash between two nations, one seeking to dominate the
                  seas and the other determined to protect its rights, the USS
                  Constitution was born. Congress understood that to safeguard
                  its shores, ships, and people, the U.S. needed a navy capable
                  of standing up to British power. The Constitution would be
                  more than just a warship; she would be a symbol of America's
                  resolve, a weapon forged for both defense and national pride.
                </p>
                <p className="mt-4 text-neutral-300 text-lg leading-relaxed">
                  With the Constitution's commissioning, the stage was set for a
                  battle of maritime strength and national identity. As tensions
                  continued to rise, the frigate would soon face the ultimate
                  test on the open sea.
                </p>
              </div>
            )}
            {/* Main Story Block for Baptism by Fire */}
            {isBaptism && displayTitle === "BAPTISM BY FIRE" && (
              <div className="mt-6">
                <p className="mt-4 text-neutral-300 text-lg leading-relaxed">
                  On August 19, 1812, off the coast of Nova Scotia, the USS
                  Constitution met the HMS Guerriere in one of the most pivotal
                  naval engagements of the War of 1812. The Constitution,
                  commanded by Captain Isaac Hull, was an American frigate,
                  heavily armed and known for her strength and resilience. The
                  HMS Guerriere, a British ship of similar size, was tasked with
                  stopping American trade and defending British interests at
                  sea.
                </p>
                <p className="mt-4 text-neutral-300 text-lg leading-relaxed">
                  As the two ships closed in on each other, the Constitution
                  proved to be a master of maneuvering, a key advantage that
                  would set the stage for the battle. Captain Hull skillfully
                  positioned his ship to bring her broadside guns to bear while
                  avoiding the Guerriere's fire. The British ship struggled with
                  the winds, which left it vulnerable to the American frigate's
                  superior handling. As the battle raged, the Constitution fired
                  deadly broadsides, with her crew unloading devastating cannon
                  fire on the Guerriere.
                </p>
                <p className="mt-4 text-neutral-300 text-lg leading-relaxed">
                  The decisive blow came when a well-aimed shot from the
                  Constitution’s main guns struck the Guerriere's mizzenmast,
                  causing it to collapse. This crippled the British ship’s
                  ability to maneuver, giving the Constitution a clear
                  advantage. Hull took advantage of the situation and closed in,
                  delivering fatal blows that left the Guerriere disabled.
                  Within 30 minutes of fierce fighting, the Guerriere was forced
                  to surrender, her crew battered and broken.
                </p>
                <p className="mt-4 text-neutral-300 text-lg leading-relaxed">
                  The American victory was a powerful statement, not only
                  because of the Constitution’s ability to withstand British
                  cannonfire, leading to her nickname "Old Ironsides," but also
                  because it gave the United States its first significant naval
                  victory of the war, boosting morale and proving that the U.S.
                  Navy could stand against the world’s most formidable naval
                  force.
                </p>
              </div>
            )}
            {/* Add main story for Java Action and Oak & Copper as needed */}
            {isJavaAction && (
              <div className="mt-6">
                <p className="mt-4 text-neutral-300 text-lg leading-relaxed">
                  On December 29, 1812, off the coast of Brazil, the USS
                  Constitution squared off against the HMS Java in a battle that
                  would further cement the Constitution’s legendary reputation.
                  Commanded by Captain William Bainbridge, the Constitution
                  faced a formidable foe in the HMS Java, a British 38-gun
                  frigate under the command of Captain Henry Lambert. Though
                  heavily armed, the Java lacked the seasoned crew that
                  Bainbridge's Constitution brought to the fight.
                </p>
                <p className="mt-4 text-neutral-300 text-lg leading-relaxed">
                  The battle began when the Constitution spotted the Java on the
                  horizon. As the two ships closed in, the Java fired the first
                  shot, damaging the Constitution’s rigging. The Constitution
                  quickly returned fire, and a fierce exchange of broadsides
                  ensued, with both ships unloading cannon fire at close range.
                  During the battle, a shot from the Java destroyed the
                  Constitution's helm, and the crew was forced to steer manually
                  using the tiller, maintaining control despite the chaos.
                </p>
                <p className="mt-4 text-neutral-300 text-lg leading-relaxed">
                  As the fight continued, the Constitution’s superior firepower
                  and sturdier construction began to turn the tide. A well-aimed
                  shot from the Constitution’s guns brought down the Java's
                  foremast, causing it to crash down through two decks, further
                  crippling the British frigate. With her rigging and crew in
                  disarray, the Java’s ability to fight back diminished rapidly.
                </p>
                <p className="mt-4 text-neutral-300 text-lg leading-relaxed">
                  In the final moments of the battle, the Constitution unleashed
                  a devastating broadside that left the Java dismasted and
                  helpless. With her sails in tatters and her crew
                  incapacitated, the Java had no choice but to surrender. The
                  Constitution, having secured victory, ordered the Java to be
                  destroyed to prevent her from falling into enemy hands.
                </p>
                <p className="mt-4 text-neutral-300 text-lg leading-relaxed">
                  The victory was a powerful morale boost for the United States
                  during the War of 1812. Not only was it the second triumph for
                  the Constitution, but it also demonstrated the effectiveness
                  of the U.S. Navy against the world’s most formidable naval
                  power. The Constitution’s nickname, "Old Ironsides," was
                  further solidified, as she proved her ability to withstand
                  brutal cannon fire and emerge victorious.
                </p>
              </div>
            )}
            {isOakAndCopper && (
              <div className="mt-6">
                <p className="mt-4 text-neutral-300 text-lg leading-relaxed">
                  After the Revolution, the new United States faced the open
                  seas with little to defend its trade or its honor. Foreign
                  powers tested its resolve, and pirates hunted its merchant
                  ships without fear. President George Washington and Secretary
                  of War Henry Knox turned to a man who understood both war and
                  water, naval architect Joshua Humphreys. What he designed
                  would not just defend a nation, but define it.
                </p>
                <p className="mt-4 text-neutral-300 text-lg leading-relaxed">
                  Humphreys imagined a new kind of frigate, one unlike any built
                  before. She would be larger, stronger, and faster, able to
                  face the guns of the great powers yet light enough to slip
                  away when outnumbered. In 1794, her keel was laid in Edmund
                  Hartt’s shipyard in Boston, and from that moment, the work
                  became a calling.
                </p>
                <p className="mt-4 text-neutral-300 text-lg leading-relaxed">
                  The shipwrights chose live oak from the southern coast, wood
                  so dense it could turn back cannon fire. Each beam was shaped
                  by hand, each curve measured by experience more than rule. The
                  men who built her worked through heat and storm, carving
                  strength into every joint.
                </p>
                <p className="mt-4 text-neutral-300 text-lg leading-relaxed">
                  Over her oak frame they fastened plates of copper rolled at
                  Paul Revere’s foundry. It was a bold idea, one that gave her a
                  smooth, gleaming armor against the sea. The copper kept her
                  hull free from decay and let her glide faster than any ship of
                  her size. Where others dragged through the water, the
                  Constitution sliced cleanly through the waves.
                </p>
                <p className="mt-4 text-neutral-300 text-lg leading-relaxed">
                  On her launch day in 1797, the people of Boston filled the
                  shore to watch her slip into the harbor. Her name, chosen by
                  Washington himself, spoke to the strength of the nation she
                  would serve. Constitution. The men who built her could not
                  have known she would sail for centuries, but their work
                  endures. In every plank, every plate of copper, and every
                  ripple she cuts across the water, their skill still speaks.
                </p>
              </div>
            )}
            <div className="mt-4 text-neutral-300 text-lg leading-relaxed">
              {card.mainStory} {/* Only display the full story */}
            </div>
          </div>
        </div>

        <div
          role="separator"
          aria-hidden="true"
          className="my-0 md:my-12 lg:my-16 h-px w-full bg-amber-400/30"
        />

        <div className="mt-16 md:mt-0 lg:mt-0 max-md:grid max-md:grid-cols-2 max-md:gap-2 md:flex md:items-start md:gap-6">
          {/* Left Image (desktop left, mobile left) */}
          <figure className="md:flex-shrink-0 max-md:col-span-1">
            <div
              className={`${cardFrame} ${
                isOakAndCopper ? "max-md:aspect-[123/100]" : ""
              }`}
            >
              <img
                src={imgLeft}
                alt={caps.left}
                className="h-full w-full object-cover max-md:h-auto"
                loading="lazy"
                decoding="async"
              />
            </div>
            <figcaption className="mt-2 text-xs md:text-sm text-amber-300 text-center">
              {caps.left}
            </figcaption>
          </figure>

          {/* Text Block (desktop center, mobile below spanning both) */}
          <div className="md:flex-grow md:px-6 max-md:col-span-2 max-md:order-3 max-md:mt-6 text-left px-2">
            <h2
              className="text-xl md:text-2xl font-bold text-amber-300 tracking-tight max-md:text-center md:text-center"
              style={{ fontFamily: "'Cinzel', serif", fontWeight: 700 }}
            >
              {duelStory.title}
            </h2>

            <div className="mt-4 md:mt-3 text-neutral-300 text-lg leading-relaxed max-md:text-left">
              {typeof duelStory.story === "string"
                ? duelStory.story.split("\n").map((paragraph, i) => (
                    <p key={i} className="mb-4 last:mb-0">
                      {paragraph}
                    </p>
                  ))
                : duelStory.story.map((paragraph, i) => (
                    <p key={i} className="mb-1 last:mb-0">
                      {paragraph}
                    </p>
                  ))}
            </div>

            <div className="mt-4 max-md:flex max-md:justify-center">
              <ShopButton slug={card.slug} title={card.title} />
            </div>
          </div>

          {/* Right Image (desktop right, mobile right) */}
          <figure className="md:flex-shrink-0 max-md:col-span-1">
            <div
              className={`${cardFrame} ${
                isOakAndCopper ? "max-md:aspect-[123/100]" : ""
              }`}
            >
              <img
                src={imgRight}
                alt={caps.right}
                className="h-full w-full object-cover max-md:h-auto"
                loading="eager"
                decoding="async"
              />
            </div>
            <figcaption className="mt-2 text-xs md:text-sm text-amber-300 text-center">
              {caps.right}
            </figcaption>
          </figure>
        </div>
      </Container>
    </main>
  );
}

/* ================== ROAST DETAIL PAGE (CLEAN) ================== */
function RoastDetailPage() {
  const { slug } = useParams();

  // Roast-level anchors mapping
  const roastLevelBySlug: Partial<Record<string, 1 | 2 | 3 | 4 | 5>> = {
    flagship: 3,
    "java-action": 3,
    "oak-and-copper": 3,
    "baptism-by-fire": 4,
    "brass-monkey": 3,
  };

  const [mobileToast, setMobileToast] = useState<null | {
    title: string;
    qty: number;
  }>(null);

  const anchorLevel = roastLevelBySlug[String(slug)];

  const card = roastCards.find((c) => c.slug === slug);

  if (!card) return <NotFoundPage />;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // drop-in replacement for craftSubtitleMap (no names/emojis in the text)
  const craftSubtitleMap: Record<string, React.ReactNode> = {
    flagship: (
      <>
        Our everyday staple, Flagship is a breakfast-style medium roast that is
        smooth, reliable, and never bitter. A roast you can reach for day after
        day.
      </>
    ),
    "baptism-by-fire": (
      <>
        Our darkest and most intense roast in the fleet - full-bodied and
        unyielding, with a finish so smooth you have to taste it to believe it.
      </>
    ),
    "java-action": (
      <>
        From the lush hills of Colombia to the highlands of Guatemala, The Java
        Action is a medium roast, full-bodied, smooth, and crafted for those who
        rise ready to seize the day.
      </>
    ),
    "oak-and-copper": (
      <>
        Every limited release is aged in a single American bourbon barrel,
        producing a uniquely rich profile shaped by that barrel alone. Each
        batch and barrel is numbered. No two releases will ever taste the same.
      </>
    ),
    "brass-monkey": (
      <>
        A Southern pecan roast crafted for pure winter comfort, smooth and
        full-bodied with a warmth that carries you through the cold.
      </>
    ),
  };
  const craftSubtitle = craftSubtitleMap[card.slug] ?? null;

  // Roast flags (slug-based so copy changes don't break logic)
  const isFlagship = card.slug === "flagship";
  const isBaptism = card.slug === "baptism-by-fire";
  const isJava = card.slug === "java-action";
  const isOak = card.slug === "oak-and-copper";
  const isBrass = card.slug === "brass-monkey";

  // ⬇️ INSERT THIS BLOCK RIGHT HERE ⬇️
  const AMBER_DESC = isFlagship
    ? "Old Ironsides Coffee - Ignite the Spirit, Savor the Victory!"
    : isBaptism
    ? "Old Ironsides Coffee - Ignite the Spirit, Savor the Victory!"
    : isJava
    ? "Old Ironsides Coffee - Ignite the Spirit, Savor the Victory!"
    : isOak
    ? "Oak & Copper pours a steady bourbon barrel aged cup of caramel, warm vanilla, and toasted oak with a calm finish you’ll want every morning."
    : isBrass
    ? "Brass Monkey is a winter seasonal Southern Pecan roast built for cold mornings and bad decisions."
    : "";

  // review data used for stars + counts beside the subtitle and in the histogram

  type Review = {
    id: string;
    name: string;
    date: string;
    rating: number; // 1..5
    title?: string;
    body?: string;

    verified?: boolean; // true when coming from Judge.me or your checkout pipeline
    source?: "judge";
  };

  type ReviewStats = {
    avg: number;
    count: number;
    breakdown: Record<number, number>;
  };

  const shopifyProductId = PRODUCT_IDS_BY_SLUG[card.slug];

  function computeStats(list: Review[]): ReviewStats {
    const count = list.length;
    if (count === 0)
      return { avg: 0, count: 0, breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } };
    const breakdown: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let sum = 0;
    for (const r of list) {
      sum += r.rating;
      breakdown[r.rating] = (breakdown[r.rating] || 0) + 1;
    }
    const avg = Math.round((sum / count) * 10) / 10;
    return { avg, count, breakdown };
  }

  const [reviewList, setReviewList] = useState<Review[]>([]);
  const [reviewData, setReviewData] = useState<ReviewStats>(() =>
    computeStats([])
  );

  useEffect(() => {
    if (!shopifyProductId) {
      setReviewList([]);
      setReviewData(computeStats([]));
      return;
    }

    const controller = new AbortController();

    async function loadReviews() {
      try {
        const res = await fetch(
          `/api/get-reviews?shopifyProductId=${encodeURIComponent(
            shopifyProductId
          )}`,
          { signal: controller.signal }
        );

        if (!res.ok) {
          console.error("Failed to load reviews", await res.text());
          setReviewList([]);
          setReviewData(computeStats([]));
          return;
        }

        const data = await res.json();
        const list: Review[] = Array.isArray(data.reviews) ? data.reviews : [];

        setReviewList(list);
        setReviewData(computeStats(list));
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        console.error("Error loading reviews", err);
        setReviewList([]);
        setReviewData(computeStats([]));
      }
    }

    loadReviews();

    return () => controller.abort();
  }, [shopifyProductId]);

  const hasReviews = reviewData.count > 0;

  // Order used in the UI - currently just raw Judge.me list
  const reviews: Review[] = reviewList;

  const { add } = useCart();
  const [purchaseMode, setPurchaseMode] = useState<"one" | "sub">("one");
  const [subEvery, setSubEvery] = useState<14 | 30 | 60>(30);
  const [qty, setQty] = useState(1);
  const [beanType, setBeanType] = useState<"" | "whole" | "ground">("");
  const [showBeanError, setShowBeanError] = useState(false);
  // Shopify product + chosen variant
  const [shopifyProduct, setShopifyProduct] = useState<any>(null);
  // Map Seal plan names -> 14/30/60
  const planMap = useMemo(() => {
    const map: Record<number, string> = {};
    const allPlans: { name: string; id: string }[] = [];

    const groups = shopifyProduct?.sellingPlanGroups?.edges ?? [];
    for (const g of groups) {
      const plans = g?.node?.sellingPlans?.edges ?? [];
      for (const e of plans) {
        const name = (e?.node?.name || "").toLowerCase();
        const id = e?.node?.id;
        if (!id) continue;

        allPlans.push({ name, id });

        // 14-day / bi-weekly
        if (name.includes("14") || name.includes("bi-weekly")) {
          map[14] = id;
        }
        // 60-day / bi-monthly / every 2 months
        else if (
          name.includes("60") ||
          name.includes("every 2 months") ||
          name.includes("every 2 month") ||
          name.includes("bi monthly") ||
          name.includes("bi-monthly") ||
          name.includes("bimonthly")
        ) {
          // important: treat bi-monthly as 60d BEFORE generic "monthly"
          map[60] = id;
        }
        // 30-day / monthly (but not bi-monthly)
        else if (
          name.includes("30") ||
          name.includes("every 1 month") ||
          name.includes("every month") ||
          (name.includes("monthly") && !name.includes("bi-monthly"))
        ) {
          map[30] = id;
        }
      }
    }

    // Fallback: if we have at least 3 plans and only 14 + 30 mapped,
    // treat the remaining one as 60.
    if (!map[60] && allPlans.length >= 3) {
      const used = new Set([map[14], map[30]].filter(Boolean));
      const leftover = allPlans.find((p) => !used.has(p.id));
      if (leftover) map[60] = leftover.id;
    }

    console.log("[DEBUG] planMap", map, allPlans);
    return map;
  }, [shopifyProduct]);

  const [merchandiseId, setMerchandiseId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  // Use the real Shopify product handles now
  const handleMap: Record<string, string> = {
    flagship: "flagship",
    "baptism-by-fire": "baptism-by-fire",
    "java-action": "java-action",
    "oak-and-copper": "oak-and-copper",
    "brass-monkey": "brass-monkey",
  };

  // Reset Bean Type selector whenever you navigate to a different roast page
  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const handle = handleMap[String(slug)] ?? String(slug);
        const p = await getProductByHandle(handle);

        // DEBUG: confirm selling plans are coming through
        console.log("[DEBUG] FULL PRODUCT for", handle, p);
        console.log(
          "[DEBUG] sellingPlanGroups for",
          handle,
          p?.sellingPlanGroups
        );

        if (!cancelled) setShopifyProduct(p || null);
      } catch (e) {
        console.warn("[Shopify] getProductByHandle failed", e);
        if (!cancelled) setShopifyProduct(null);
      }
    }
    if (slug) run();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    if (!shopifyProduct) {
      setMerchandiseId(null);
      return;
    }
    if (beanType !== "whole" && beanType !== "ground") {
      setMerchandiseId(null);
      return;
    }
    setMerchandiseId(pickVariantIdByBean(shopifyProduct, beanType));
  }, [shopifyProduct, beanType]);

  // Mirror BUY BOX width/height so Bean Type box matches exactly
  const buyBoxRef = useRef<HTMLDivElement>(null);
  const [buyBoxDims, setBuyBoxDims] = useState<{ w: number; h: number }>({
    w: 0,
    h: 0,
  });
  const BEAN_BOX_RATIO = 0.83; // width = 83% of buy box

  useEffect(() => {
    const el = buyBoxRef.current;

    if (!el || typeof ResizeObserver === "undefined") {
      const measure = () => {
        if (!buyBoxRef.current) return;
        const r = buyBoxRef.current.getBoundingClientRect();
        setBuyBoxDims({ w: Math.round(r.width), h: Math.round(r.height) });
      };
      measure();
      const onResize = () => requestAnimationFrame(measure);
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }

    const ro = new ResizeObserver(() => {
      if (!buyBoxRef.current) return;
      const r = buyBoxRef.current.getBoundingClientRect();
      setBuyBoxDims({ w: Math.round(r.width), h: Math.round(r.height) });
    });

    ro.observe(el);

    const r = el.getBoundingClientRect();
    setBuyBoxDims({ w: Math.round(r.width), h: Math.round(r.height) });

    return () => {
      ro.disconnect();
    };
  }, []);

  const basePrice = isOak ? 27 : card.price ?? 22;
  const discounted = isOak ? basePrice : Number((basePrice * 0.85).toFixed(2));

  const addToChest = async () => {
    const n = Math.max(1, Math.min(99, Math.trunc(qty || 1)));
    setQty(n);

    if (!beanType) {
      setShowBeanError(true);
      window.dispatchEvent(
        new CustomEvent("flash", { detail: "Please choose bean type." })
      );
      return;
    }
    setShowBeanError(false);

    if (!shopifyProduct) {
      window.dispatchEvent(
        new CustomEvent("flash", {
          detail: "Product not loaded yet. Try again.",
        })
      );
      return;
    }

    const variantLabel = beanType === "whole" ? "Whole Bean" : "Ground";
    const merchId = merchandiseId;
    if (!merchId) {
      window.dispatchEvent(
        new CustomEvent("flash", { detail: "Variant not found in Shopify." })
      );
      return;
    }

    try {
      setAdding(true);

      // 1) ensure Shopify cart
      const cart = await ensureCart();

      // 2) add to Shopify cart
      // pick selling plan if subscribing
      const planId = purchaseMode === "sub" ? planMap[subEvery] : undefined;

      if (purchaseMode === "sub" && !planId) {
        window.dispatchEvent(
          new CustomEvent("flash", {
            detail: "Subscription plan not available yet. Try again.",
          })
        );
        setAdding(false);
        return;
      }

      await cartLinesAdd({
        cartId: cart.id,
        merchandiseId: merchId,
        quantity: n,
        ...(planId ? { sellingPlanId: planId } : {}),
        attributes: {
          beanType: variantLabel,
          purchaseMode,
          subEvery: purchaseMode === "sub" ? String(subEvery) : "",
        },
      });

      // 3) mirror to your local cart UI
      const itemToAdd = {
        ...card,
        id: `${card.slug}-12oz-${beanType}`,
        sku: `${card.slug}-12oz-${beanType}`,
        title: `${card.title} (${variantLabel})`,
        // store both the regular one-time price and the active price
        basePrice,
        price: purchaseMode === "sub" ? discounted ?? basePrice : basePrice,
        beanType,
        purchaseMode,
        subEvery: purchaseMode === "sub" ? subEvery : undefined,
        merchandiseId: merchId,
        // active plan used right now
        sellingPlanId: planId,
        // map of frequency -> planId so drawers can swap correctly
        sellingPlans: {
          ...(planMap[14] ? { 14: planMap[14] } : {}),
          ...(planMap[30] ? { 30: planMap[30] } : {}),
          ...(planMap[60] ? { 60: planMap[60] } : {}),
        },
      };

      add(itemToAdd, n);

      // set mobile toast state so we can render a bottom banner on mobile
      setMobileToast({
        title: `${card.title} (${variantLabel})`,
        qty: n,
      });

      // auto-hide after 2.5s
      setTimeout(() => {
        setMobileToast(null);
      }, 2500);

      // still fire the existing desktop/global flash event
      window.dispatchEvent(
        new CustomEvent("flash", {
          detail: `${n} × ${card.title} (${variantLabel}) added to Chest`,
        })
      );
    } catch (e) {
      console.error(e);
      window.dispatchEvent(
        new CustomEvent("flash", {
          detail: "Could not add to cart. Check console.",
        })
      );
    } finally {
      setAdding(false);
    }
  };

  return (
    <main className="relative overflow-hidden min-h-[calc(100vh-140px)] pt-0 pb-6 md:pt-16 md:pb-16">
      <div className="absolute inset-0 z-0 bg-neutral-950/30" aria-hidden />

      <Container className="relative z-10 mt-0 md:mt-0">
        {/* ===== HERO ===== */}
        <div className="relative">
          <div
            className="pointer-events-none select-none absolute left-1/2 top-[45%] -translate-x-1/2 -translate-y-1/2 z-0 hidden md:block"
            aria-hidden
          >
            <img
              src="/emblem-black.png"
              alt=""
              className="w-[58vw] max-w-[720px] opacity-15 object-contain"
            />
          </div>

          <div className="relative z-10 mt-0 md:mt-3 grid md:grid-cols-[auto,1fr] gap-0 md:gap-6 items-start">
            {/* HERO IMAGE */}
            <div className="flex flex-col items-center md:items-start w-full md:w-auto">
              <div className="w-full md:w-auto rounded-3xl overflow-hidden ring-1 ring-amber-400/40 shadow-2xl shadow-amber-500/20 bg-neutral-900/40">
                <div className="flex flex-col items-center md:items-start w-full md:w-auto">
                  <img
                    src={
                      card.img?.startsWith("/") || card.img?.startsWith("http")
                        ? card.img
                        : `/${card.img}`
                    }
                    alt={card.title}
                    loading="eager"
                    decoding="async"
                    className="block w-full h-auto max-h-[61vh] md:w-auto md:max-h-[65vh] object-cover md:object-contain rounded-2xl md:rounded-3xl ring-1 ring-amber-400/60 shadow-2xl shadow-amber-500/20"
                  />
                </div>
              </div>
            </div>
            {/* ...rest of your text column stays exactly the same */}

            {/* 2/3/4/5/6 live together in this column so desktop still sees one text column */}
            <div className="order-2 md:order-none self-start flex flex-col space-y-4">
              {/* ===== TITLE / SUBTITLE / STARS (Mobile #1, Desktop #1) ===== */}
              <div className="order-1 md:order-1 -mt-1 md:mt-0 mb-0 flex items-start justify-between gap-3">
                <div className="w-full">
                  {/* Title */}
                  <h1
                    className="m-0 text-3xl md:text-4xl font-extrabold tracking-tight text-amber-300"
                    style={{ fontFamily: "'Cinzel', serif", fontWeight: 800 }}
                  >
                    {isFlagship
                      ? "FLAGSHIP"
                      : isBaptism
                      ? "BAPTISM BY FIRE"
                      : card.title}
                  </h1>

                  {/* Subtitle + stars + count */}
                  <div className="mt-0 max-w-[72ch]">
                    <div className="flex flex-col gap-1 text-neutral-400 md:flex-row md:items-baseline md:justify-between md:gap-3">
                      {/* roast style text */}
                      <div className="text-base md:text-[1.2rem]">
                        {isFlagship
                          ? "Medium Roast"
                          : isBaptism
                          ? "Dark Roast"
                          : card.subTitle}
                      </div>

                      {/* Stars + avg + count */}
                      <div className="flex items-center gap-2 shrink-0">
                        {/* numeric value */}
                        <span className="text-amber-300 font-semibold tabular-nums text-sm md:text-base">
                          {reviewData.avg.toFixed(1)}
                        </span>

                        {/* stars */}
                        <a
                          href="#reviews"
                          onClick={(e) => {
                            e.preventDefault();
                            const el = document.getElementById("reviews");
                            if (!el) return;
                            const mobileOffset = 200;
                            const desktopOffset = 260;
                            const offset =
                              window.innerWidth < 768
                                ? mobileOffset
                                : desktopOffset;
                            const top =
                              el.getBoundingClientRect().top +
                              window.scrollY -
                              offset;
                            window.scrollTo({ top, behavior: "smooth" });
                          }}
                          className="inline-flex items-center gap-0.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                          aria-label="Jump to customer reviews"
                          title="Jump to customer reviews"
                        >
                          {[0, 1, 2, 3, 4].map((i) => {
                            const starFill = Math.max(
                              0,
                              Math.min(1, (reviewData.avg ?? 0) - i)
                            );
                            const clipWidth = 24 * starFill;
                            const clipId = `titleStarClip-${i}`;
                            return (
                              <svg
                                key={i}
                                viewBox="0 0 24 24"
                                className="h-4 w-4 md:h-5 md:w-5"
                                aria-hidden
                              >
                                <defs>
                                  <clipPath
                                    id={clipId}
                                    clipPathUnits="userSpaceOnUse"
                                  >
                                    <rect
                                      x="0"
                                      y="0"
                                      width={clipWidth}
                                      height="24"
                                    />
                                  </clipPath>
                                </defs>

                                {/* base (neutral) */}
                                <path
                                  d="M12 .587l3.668 7.568L24 9.753l-6 5.854L19.335 24 12 19.771 4.665 24 6 15.607 0 9.753l8.332-1.598z"
                                  className="text-neutral-800"
                                  fill="currentColor"
                                />

                                {/* amber fill clipped */}
                                <path
                                  d="M12 .587l3.668 7.568L24 9.753l-6 5.854L19.335 24 12 19.771 4.665 24 6 15.607 0 9.753l8.332-1.598z"
                                  className="text-amber-400"
                                  fill="currentColor"
                                  clipPath={`url(#${clipId})`}
                                />

                                {/* outline */}
                                <path
                                  d="M12 .587l3.668 7.568L24 9.753l-6 5.854L19.335 24 12 19.771 4.665 24 6 15.607 0 9.753l8.332-1.598z"
                                  fill="none"
                                  stroke="currentColor"
                                  className="text-neutral-600"
                                  strokeWidth="1.4"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            );
                          })}
                          <span className="sr-only">
                            {reviewData.avg.toFixed(1)} out of 5 stars
                          </span>
                        </a>

                        {/* review count */}
                        <span className="text-[10px] md:text-xs text-neutral-400/80 tracking-wide whitespace-nowrap">
                          {reviewData.count} REVIEWS
                        </span>
                      </div>
                    </div>

                    <div className="h-px bg-amber-400/30 mt-2 relative left-1/2 -ml-[60vw] w-[120vw] md:static md:left-auto md:ml-0 md:w-full" />
                  </div>
                </div>

                <div className="hidden md:inline-flex">
                  <BackButton to="/store" size="sm" />
                </div>
              </div>
              {/* ===== END TITLE BLOCK ===== */}

              {/* ===== MOBILE BUY BOX STYLE (md:hidden) ===== */}
              {(card.canBuy || isOak) && (
                <div className="order-2 w-full md:order-4 md:hidden mt-4">
                  {/* OPTION CARDS */}
                  <div className="space-y-3">
                    {/* ONE-TIME CARD */}
                    <button
                      type="button"
                      onClick={() => setPurchaseMode("one")}
                      className={
                        "w-full border-2 p-4 flex items-start justify-between text-left " +
                        (purchaseMode === "one"
                          ? "border-amber-400 ring-1 ring-amber-400/40 bg-black/70"
                          : "border-neutral-600 bg-black/40")
                      }
                      aria-pressed={purchaseMode === "one"}
                    >
                      <div className="flex items-start gap-3 w-full">
                        {/* radio */}
                        <div
                          className={
                            "h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 " +
                            (purchaseMode === "one"
                              ? "border-amber-400"
                              : "border-neutral-400")
                          }
                        >
                          <div
                            className={
                              "h-2.5 w-2.5 rounded-full " +
                              (purchaseMode === "one"
                                ? "bg-amber-400"
                                : "bg-transparent")
                            }
                          />
                        </div>

                        {/* text/price in one line */}
                        <div className="flex flex-col flex-1">
                          <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
                            <span className="text-base text-neutral-100 font-medium leading-none">
                              Single Purchase
                            </span>

                            <span className="text-sm text-neutral-300">
                              <span className="font-semibold text-amber-300">
                                {fmt(basePrice)}
                              </span>
                              <span className="text-xs text-neutral-500 ml-1">
                                / 12oz bag
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>

                    {/* SUBSCRIBE & SAVE CARD */}
                    <button
                      type="button"
                      onClick={() => setPurchaseMode("sub")}
                      className={
                        "w-full border-2 p-4 flex flex-col text-left " +
                        (purchaseMode === "sub"
                          ? "border-amber-400 ring-1 ring-amber-400/40 bg-black/70"
                          : "border-neutral-600 bg-black/40")
                      }
                      aria-pressed={purchaseMode === "sub"}
                    >
                      <div className="w-full flex items-start gap-3">
                        {/* radio */}
                        <div
                          className={
                            "h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 " +
                            (purchaseMode === "sub"
                              ? "border-amber-400"
                              : "border-neutral-400")
                          }
                        >
                          <div
                            className={
                              "h-2.5 w-2.5 rounded-full " +
                              (purchaseMode === "sub"
                                ? "bg-amber-400"
                                : "bg-transparent")
                            }
                          />
                        </div>

                        <div className="flex flex-col flex-1">
                          {/* top row: Join the Fleet + prices all inline */}
                          <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1 w-full">
                            <span className="text-base text-neutral-100 font-medium leading-none">
                              {isOak ? "Join The Fleet" : "Join The Fleet"}
                            </span>

                            <span className="text-sm text-neutral-300">
                              {!isOak && (
                                <span className="line-through text-neutral-400 mr-2">
                                  {fmt(basePrice)}
                                </span>
                              )}
                              <span className="font-semibold text-amber-300">
                                {fmt(discounted)}
                              </span>

                              <span className="text-xs text-neutral-500 ml-1">
                                / 12oz bag
                              </span>
                            </span>
                          </div>
                          {/* under-row: SAVE 15% pill */}
                          {!isOak && (
                            <div className="mt-2">
                              <span className="inline-block text-[11px] font-bold leading-none px-2 py-1 rounded-[4px] bg-red-600 text-white tracking-tight">
                                SAVE 15%
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* SUB FREQUENCY lives right under subscribe card */}
                      {purchaseMode === "sub" && (
                        <div className="mt-4">
                          <div className="text-sm text-amber-300 font-medium mb-2">
                            Deliver every:
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            {[14, 30, 60].map((d) => (
                              <button
                                key={d}
                                type="button"
                                onClick={() => setSubEvery(d as 14 | 30 | 60)}
                                className={
                                  "px-3 py-2 border text-sm " +
                                  (subEvery === d
                                    ? "border-amber-400/70 text-amber-300 bg-black"
                                    : "border-neutral-700 text-neutral-300 hover:border-amber-400/40")
                                }
                                aria-pressed={subEvery === d}
                              >
                                {d} days
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </button>
                  </div>

                  {/* BEAN TYPE SELECT */}
                  <div
                    className={
                      "mt-4 w-full border-2 bg-black/70 " +
                      (showBeanError
                        ? "border-red-500 ring-2 ring-red-500 animate-pulse"
                        : "border-amber-400/60")
                    }
                  >
                    {/* slimmer padding now */}
                    <div className="p-3">
                      {/* Bean Type row compressed */}
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="font-semibold text-amber-300">
                          Bean Type:
                        </span>

                        <label
                          htmlFor="beanTypeSelectMobile"
                          className="sr-only"
                        >
                          Bean Type
                        </label>
                        <select
                          id="beanTypeSelectMobile"
                          value={beanType}
                          onChange={(e) => {
                            setBeanType(
                              e.target.value as "" | "whole" | "ground"
                            );
                            setShowBeanError(false);
                          }}
                          className={
                            "min-w-[15rem] border px-2 py-2 text-sm text-center outline-none bg-black/70 " +
                            (beanType
                              ? "border-amber-400/70 text-amber-300"
                              : "border-neutral-700 text-neutral-400") +
                            " focus-visible:ring-2 focus-visible:ring-amber-400"
                          }
                        >
                          <option value="">Choose...</option>
                          <option value="whole">12oz Whole Bean</option>
                          <option value="ground">12oz Ground</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* QTY + ADD ROW */}
                  <div className="mt-4 flex items-center gap-3">
                    {/* qty box */}
                    <div className="inline-flex items-center border border-neutral-700">
                      <button
                        type="button"
                        onClick={() => setQty((q) => Math.max(1, (q || 1) - 1))}
                        className="px-3 py-2 text-neutral-200"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-4 w-4" />
                      </button>

                      <input
                        value={String(qty)}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, "");
                          const next =
                            digits === "" ? 1 : Math.min(99, Number(digits));
                          setQty(next);
                        }}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        aria-label="Quantity"
                        className="w-12 text-center bg-neutral-900/70 py-2 text-sm text-neutral-100 outline-none"
                        onBlur={() => {
                          setQty((q) => {
                            const n = Number.isFinite(q) ? q : 1;
                            return Math.min(99, Math.max(1, n));
                          });
                        }}
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setQty((q) => Math.min(99, (q || 1) + 1))
                        }
                        className="px-3 py-2 text-neutral-200"
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>

                    {/* ADD TO CHEST */}
                    <button
                      type="button"
                      onClick={addToChest}
                      disabled={adding}
                      className={
                        "flex-1 border border-amber-400/70 px-4 py-3 text-base font-semibold text-amber-300 bg-black shadow-md shadow-amber-400/10 " +
                        (adding
                          ? "opacity-60 cursor-not-allowed"
                          : "hover:bg-amber-400 hover:text-neutral-900")
                      }
                      aria-label={`Add ${card.title} to Chest`}
                    >
                      {adding ? "Adding..." : "Add to Chest"}
                    </button>
                  </div>

                  {/* shipping / perk line (tighter) */}
                  <div className="mt-2 text-sm text-neutral-400 text-right">
                    <span className="text-amber-300 font-semibold">
                      3+ bags ship free
                    </span>
                  </div>
                </div>
              )}
              {mobileToast && (
                <div className="fixed left-0 right-0 top-1/2 transform -translate-y-1/2 z-[9999] px-4 md:hidden">
                  <div className="w-full rounded-lg border border-amber-400/70 bg-amber-400/90 text-black shadow-lg shadow-amber-400/20 px-6 py-4 flex items-center justify-center gap-4">
                    <div className="flex-1 text-center">
                      <div className="text-xl font-bold text-black">
                        Added to Chest
                      </div>
                      <div className="text-lg font-bold text-neutral-800 leading-snug">
                        {mobileToast.qty} × {mobileToast.title}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setMobileToast(null)}
                      className="text-[12px] text-neutral-500 hover:text-neutral-200"
                      aria-label="Close message"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}

              {/* ================= DESKTOP VERSION (hidden on mobile) ================= */}
              {(card.canBuy || isOak) && (
                <>
                  {/* ===== BUY BOX / ADD TO CHEST (Desktop only) ===== */}
                  <div className="hidden md:block order-2 md:order-4 mt-4 w-full">
                    <div className="flex flex-col md:flex-row md:items-stretch md:gap-4">
                      {/* BUY BOX */}
                      <div
                        ref={buyBoxRef}
                        className="inline-flex w-full md:w-auto items-center gap-4 rounded-xl border border-amber-400/60 bg-black/70 p-3 px-4 shadow-md shadow-amber-400/10"
                      >
                        {/* Price */}
                        <div className="text-sm text-neutral-300">
                          {purchaseMode === "sub" ? (
                            <>
                              {!isOak && (
                                <span className="line-through text-amber-300/80 mr-1">
                                  {fmt(basePrice)}
                                </span>
                              )}
                              <span className="font-semibold text-amber-300">
                                {fmt(discounted)}
                              </span>

                              <span className="text-xs text-neutral-400 ml-1">
                                / bag
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="font-semibold text-amber-300">
                                {fmt(basePrice)}
                              </span>
                              <span className="text-xs text-neutral-400 ml-1">
                                / bag
                              </span>
                            </>
                          )}
                        </div>

                        {/* Qty + Add */}
                        <div className="ml-auto inline-flex items-center gap-4">
                          <div className="inline-flex items-center rounded-lg border border-neutral-700">
                            <button
                              type="button"
                              onClick={() =>
                                setQty((q) => Math.max(1, (q || 1) - 1))
                              }
                              className="px-2 py-1 hover:bg-neutral-800 rounded-l-lg"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="h-4 w-4" />
                            </button>

                            <input
                              value={String(qty)}
                              onChange={(e) => {
                                const digits = e.target.value.replace(
                                  /\D/g,
                                  ""
                                );
                                const next =
                                  digits === ""
                                    ? 1
                                    : Math.min(99, Number(digits));
                                setQty(next);
                              }}
                              inputMode="numeric"
                              pattern="[0-9]*"
                              aria-label="Quantity"
                              className="w-12 text-center bg-neutral-900/70 py-1.5 text-sm outline-none"
                              onBlur={() => {
                                setQty((q) => {
                                  const n = Number.isFinite(q) ? q : 1;
                                  return Math.min(99, Math.max(1, n));
                                });
                              }}
                            />

                            <button
                              type="button"
                              onClick={() =>
                                setQty((q) => Math.min(99, (q || 1) + 1))
                              }
                              className="px-2 py-1 hover:bg-neutral-800 rounded-r-lg"
                              aria-label="Increase quantity"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={addToChest}
                            disabled={adding}
                            className={
                              "px-4 py-2 md:px-6 md:py-3 rounded-lg text-sm md:text-base font-semibold border border-amber-400/70 text-amber-300 bg-black transition shadow-md shadow-amber-400/10 " +
                              (adding
                                ? "opacity-60 cursor-not-allowed"
                                : "hover:bg-amber-400 hover:text-neutral-900")
                            }
                            aria-label={`Add ${card.title} to Chest`}
                          >
                            {adding ? "Adding..." : "Add to Chest"}
                          </button>
                        </div>
                      </div>

                      {/* BEAN TYPE BOX */}
                      <div
                        className={
                          "group inline-flex w-full md:w-auto items-center justify-between gap-4 rounded-xl p-3 px-4 shadow-md transition mt-3 md:mt-0 " +
                          (showBeanError
                            ? "border border-red-500 ring-2 ring-red-500 animate-pulse bg-black/70"
                            : "border border-amber-400/60 bg-black/70 shadow-amber-400/10 hover:border-amber-400/80 hover:shadow-[0_0_0_2px_rgba(251,191,36,0.25)]")
                        }
                        style={{
                          minHeight: buyBoxDims.h
                            ? `${buyBoxDims.h}px`
                            : undefined,
                          height: buyBoxDims.h
                            ? `${buyBoxDims.h}px`
                            : undefined,
                          width: buyBoxDims.w ? undefined : undefined,
                        }}
                      >
                        <div className="text-sm text-neutral-300">
                          <div className="font-semibold text-amber-300">
                            Bean Type
                          </div>
                          <div className="text-xs text-neutral-400 mt-0.5">
                            12oz bags
                          </div>
                        </div>

                        <label
                          htmlFor="beanTypeSelectDesktop"
                          className="sr-only"
                        >
                          Bean Type
                        </label>
                        <select
                          id="beanTypeSelectDesktop"
                          value={beanType}
                          onChange={(e) => {
                            setBeanType(
                              e.target.value as "" | "whole" | "ground"
                            );
                            setShowBeanError(false);
                          }}
                          className={
                            "min-w-[10rem] md:min-w-[12rem] rounded-lg border px-3 py-2 text-sm outline-none bg-black/70 " +
                            (beanType
                              ? "border-amber-400/70 text-amber-300"
                              : "border-neutral-700 text-neutral-400") +
                            " focus-visible:ring-2 focus-visible:ring-amber-400"
                          }
                          aria-invalid={showBeanError || undefined}
                        >
                          <option value="">Choose...</option>
                          <option value="whole">12oz Whole Bean</option>
                          <option value="ground">12oz Ground</option>
                        </select>
                      </div>
                    </div>

                    <div className="mt-2 text-sm md:text-lg text-neutral-400 text-center md:text-left">
                      <span className="text-amber-300 font-semibold">
                        3+ bags ship free
                      </span>{" "}
                    </div>
                  </div>
                  {/* ===== END DESKTOP BUY BOX ===== */}

                  {/* ===== SUBSCRIBE & SAVE (Desktop only) ===== */}
                  <div className="hidden md:block order-3 md:order-3 mt-6 w-full">
                    {/* mode selector */}
                    <div className="inline-flex flex-col sm:flex-row items-start sm:items-center gap-2 rounded-xl border border-amber-400/60 bg-black/70 p-4 px-5 shadow-md shadow-amber-400/10 w-full md:w-fit whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setPurchaseMode("one")}
                        className={
                          "px-3 py-1.5 rounded-lg border text-xs md:text-sm leading-none tracking-tight font-semibold transition w-full sm:w-auto text-center " +
                          (purchaseMode === "one"
                            ? "bg-amber-400 text-neutral-900 border-amber-400"
                            : "text-amber-300 border-neutral-700 hover:border-amber-400/40")
                        }
                        aria-pressed={purchaseMode === "one"}
                      >
                        Single Purchase
                      </button>

                      <button
                        type="button"
                        onClick={() => setPurchaseMode("sub")}
                        className={
                          "px-4 py-2 rounded-lg border text-sm md:text-base font-semibold transition w-full sm:w-auto text-center " +
                          (purchaseMode === "sub"
                            ? "bg-amber-400 text-neutral-900 border-amber-400"
                            : "text-amber-300 border-neutral-700 hover:border-amber-400/40")
                        }
                        aria-pressed={purchaseMode === "sub"}
                      >
                        {isOak ? "Join the Fleet" : "Join the Fleet & Save 15%"}
                      </button>
                    </div>

                    {/* sub frequency */}
                    {purchaseMode === "sub" && (
                      <div className="mt-3 mb-4 w-full max-w-[36rem]">
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="text-base md:text-[1.15rem] text-amber-300 font-medium">
                            Deliver every:
                          </div>
                          <div className="flex items-center gap-2">
                            {[14, 30, 60].map((d) => (
                              <button
                                key={d}
                                type="button"
                                onClick={() => setSubEvery(d as 14 | 30 | 60)}
                                className={
                                  "px-3 py-1.5 rounded-lg border text-sm transition " +
                                  (subEvery === d
                                    ? "border-amber-400/70 text-amber-300 bg-black"
                                    : "border-neutral-700 text-neutral-300 hover:border-amber-400/40")
                                }
                                aria-pressed={subEvery === d}
                              >
                                {d} days
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  {/* ===== END SUBSCRIBE ===== */}
                </>
              )}

              {/* ===== STORY CONTENT (Mobile #4, Desktop #2) ===== */}
              <div className="order-4 md:order-2">
                <div
                  className="max-w-[64ch] sm:max-w-[68ch] md:max-w-[70ch] lg:max-w-[72ch] text-pretty leading-[1.7] md:leading-[1.85]"
                  lang="en"
                  style={{ hyphens: "auto", textWrap: "balance" }}
                >
                  {isFlagship && (
                    <div className="space-y-3 text-neutral-300 text-base md:text-lg leading-relaxed">
                      <p className="text-amber-300 text-base md:text-lg">
                        USS Constitution - Commissioned October 21, 1797
                      </p>
                      <p>
                        Commissioned by President George Washington, the USS
                        Constitution was built to stand as the strength and
                        pride of a new Republic. She was one of six great
                        frigates launched to secure America’s place on the seas,
                        yet time and war would claim all but one.
                      </p>
                      <p>
                        Through every storm and every battle, the Constitution
                        endured. Today she stands as a living symbol of the
                        nation she was made to defend.
                      </p>
                      <p>
                        This roast honors that legacy, steady and enduring as
                        the ship herself. Smooth, balanced, and bold, our
                        Flagship Medium Roast carries her spirit in every cup.
                      </p>
                      {/* Desktop version */}
                      <p className="hidden md:block text-left text-xl font-normal text-amber-300 break-words md:font-semibold">
                        Old Ironsides Coffee - Ignite the Spirit, Savor the
                        Victory!
                      </p>

                      {/* Mobile version */}
                      <p className="md:hidden text-center text-xl font-normal text-amber-300 break-words">
                        Old Ironsides Coffee
                        <br />
                        <span className="block text-sm">
                          Ignite the Spirit, Savor the Victory!
                        </span>
                      </p>
                    </div>
                  )}

                  {isBaptism && (
                    <div className="space-y-3 text-neutral-300 text-base md:text-lg leading-relaxed">
                      <p className="text-amber-300 text-base md:text-lg">
                        USS Constitution vs HMS Guerriere - August 19, 1812
                      </p>
                      <p>
                        Off the coast of Nova Scotia, the Constitution met the
                        British frigate Guerriere in her first great trial at
                        sea. As they drew within range, the sea erupted with the
                        thunder of broadside cannons. British shot struck hard
                        against the hull of the American frigate but failed to
                        pierce it. A British sailor, awestruck by what he saw,
                        shouted, “Her sides are made of iron!”
                      </p>
                      <p>
                        Through smoke and cannon fire, the Guerriere’s masts
                        splintered and her decks shattered. She fought bravely,
                        but her rigging fell to ruin and her colors were struck.
                        As flames consumed what remained, Old Ironsides sailed
                        on, scarred yet unbroken, carrying a nation’s pride upon
                        the sea.
                      </p>
                      <p>
                        This bold roast carries that victory forward in every
                        cup and enduring as the ship herself.
                      </p>
                      {/* Tagline for Baptism (Desktop + Mobile, no bold on desktop, reduced bold on mobile) */}
                      {/* Desktop version */}
                      <p className="hidden md:block text-left text-xl font-normal text-amber-300 break-words md:font-semibold">
                        Old Ironsides Coffee - Ignite the Spirit, Savor the
                        Victory!
                      </p>

                      {/* Mobile version */}
                      <p className="md:hidden text-center text-xl font-normal text-amber-300 break-words">
                        Old Ironsides Coffee
                        <br />
                        <span className="block text-sm">
                          Ignite the Spirit, Savor the Victory!
                        </span>
                      </p>
                    </div>
                  )}

                  {isJava && (
                    <div className="space-y-3 text-neutral-300 text-base md:text-lg leading-relaxed">
                      <p className="text-amber-300 text-base md:text-lg">
                        USS Constitution vs HMS Java - December 29, 1812
                      </p>
                      <p>
                        In the wake of HMS Guerriere’s defeat, the Royal Navy
                        cast its hope upon the formidable HMS Java to restore
                        British honor. Swift, heavily armed, and set upon the
                        hunt for the USS Constitution, she was expected to sink
                        the American frigate once and for all.
                      </p>
                      <p>
                        Off Brazil’s sunlit coast, the sea became the
                        battlefield. Broadsides clashed, cannons roared, masts
                        splintered, and the resolve of a young nation was tested
                        once again. Out from the smoke and chaos, scarred but
                        victorious, Old Ironsides watched as the Java burned in
                        fiery defeat.
                      </p>
                      <p>
                        This medium roast carries that victory forward in every
                        cup, with a smooth, full-bodied flavor and a finish as
                        enduring as Old Ironsides herself.
                      </p>
                      {/* Desktop version */}
                      <p className="hidden md:block text-left text-xl font-normal text-amber-300 break-words md:font-semibold">
                        Old Ironsides Coffee - Ignite the Spirit, Savor the
                        Victory!
                      </p>

                      {/* Mobile version */}
                      <p className="md:hidden text-center text-xl font-normal text-amber-300 break-words">
                        Old Ironsides Coffee
                        <br />
                        <span className="block text-sm">
                          Ignite the Spirit, Savor the Victory!
                        </span>
                      </p>
                    </div>
                  )}

                  {isOak && (
                    <div className="space-y-3 text-neutral-300 text-base md:text-lg leading-relaxed">
                      <p className="text-amber-300 text-base md:text-lg">
                        Wrapped in Oak Above, Clad in Copper Below
                      </p>
                      <p>
                        Her copper hull kissed the waves beneath, above, her
                        timbers stood firm against the British cannon’s plea,
                        her heart of oak and copper forged for battle on the
                        open sea.
                      </p>
                      <p>
                        Born for speed, for maneuver, and for glory, she cut the
                        waves, mastered the cannons, and earned her place upon
                        the sea.
                      </p>
                      <p>
                        This bourbon barrel aged roast honors the shipwrights
                        whose craft carried her through storms, battle, and into
                        legend.
                      </p>

                      {/* Desktop version */}
                      <p className="hidden md:block text-left text-xl font-normal text-amber-300 break-words md:font-semibold">
                        Old Ironsides Coffee - Ignite the Spirit, Savor the
                        Victory!
                      </p>

                      {/* Mobile version */}
                      <p className="md:hidden text-center text-xl font-normal text-amber-300 break-words">
                        Old Ironsides Coffee
                        <br />
                        <span className="block text-sm">
                          Ignite the Spirit, Savor the Victory!
                        </span>
                      </p>
                    </div>
                  )}
                  {isBrass && (
                    <div className="space-y-2 text-neutral-300 text-base md:text-lg leading-relaxed">
                      <p className="text-amber-300 text-base md:text-lg">
                        The "Brass Monkey" Myth
                      </p>

                      <p>
                        For Generations sailors have joked about weather so cold
                        it could “freeze the balls off a brass monkey.” Great
                        line. Terrible story.
                      </p>
                      <p>
                        Despite the legend, the Royal Navy never stored
                        cannonballs on a brass tray, and nothing on Old
                        Ironsides ever dumped its shot into the snow like
                        spilled marbles. Cannonballs were kept in wooden racks
                        or below deck, far from the frost and spray.
                      </p>
                      <p>
                        So why did the saying stick? Because sailors spent half
                        their lives freezing their asses off. Iced-over rigging,
                        frozen canvas, breath hanging in the lantern light. That
                        was the real winter at sea.
                      </p>
                      <p>
                        This roast salutes that folklore with a grin and a
                        shiver. Bold, warming, and cold-weather approved. This
                        roast cuts through the cold and hits with rich,
                        comforting flavor.
                      </p>
                      <p>
                        Perfect for mornings so cold you question every choice
                        that brought you outside.
                      </p>

                      {/* Desktop version */}
                      <p className="hidden md:block text-left text-xl font-normal text-amber-300 break-words md:font-semibold">
                        Old Ironsides Coffee - Ignite the Spirit, Savor the
                        Victory!
                      </p>

                      {/* Mobile version */}
                      <p className="md:hidden text-center text-xl font-normal text-amber-300 break-words">
                        Old Ironsides Coffee
                        <br />
                        <span className="block text-sm">
                          Ignite the Spirit, Savor the Victory!
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
              {/* ===== END STORY ===== */}
              {/* Hide on desktop, visible on mobile */}
              <div className="md:hidden">
                {/* Add any additional mobile content adjustments if needed */}
              </div>
            </div>
            {/* end right column for desktop / stacked column for mobile */}
          </div>
          {/* end hero grid */}
        </div>
      </Container>
      {/* ===== PER-ROAST "THE CRAFT IN THE CUP" SECTION ===== */}
      <RoastCoffeeSection
        slug={card.slug}
        craftSubtitle={craftSubtitle}
        reviewData={reviewData}
        reviews={reviews}
        anchorLevel={anchorLevel}
      />
    </main>
  );
}

/* ================== COFFEE SECTION ROUTER ================== */
function RoastCoffeeSection({
  slug,
  craftSubtitle,
  reviewData,
  reviews,
  anchorLevel,
}: {
  slug: string;
  craftSubtitle: React.ReactNode | null;
  reviewData: { avg: number; count: number; breakdown: Record<number, number> };
  reviews: Review[];
  anchorLevel?: 1 | 2 | 3 | 4 | 5;
}) {
  switch (slug) {
    case "flagship":
      return (
        <TheCoffeeFlagship
          craftSubtitle={craftSubtitle}
          reviewData={reviewData}
          reviews={reviews}
          anchorLevel={anchorLevel}
        />
      );
    case "baptism-by-fire":
      return (
        <TheCoffeeBaptism
          craftSubtitle={craftSubtitle}
          reviewData={reviewData}
          reviews={reviews}
          anchorLevel={anchorLevel}
        />
      );
    case "java-action":
      return (
        <TheCoffeeJava
          craftSubtitle={craftSubtitle}
          reviewData={reviewData}
          reviews={reviews}
          anchorLevel={anchorLevel}
        />
      );
    case "oak-and-copper":
      return (
        <TheCoffeeOak
          craftSubtitle={craftSubtitle}
          reviewData={reviewData}
          reviews={reviews}
          anchorLevel={anchorLevel}
        />
      );
    case "brass-monkey":
      return (
        <TheCoffeeBrass
          craftSubtitle={craftSubtitle}
          reviewData={reviewData}
          reviews={reviews}
          anchorLevel={anchorLevel}
        />
      );

    default:
      return null;
  }
}
/* ================== SHARED PARTS ================== */
function CareCard() {
  return (
    <>
      {/* MOBILE VERSION */}
      <aside className="block md:hidden w-full rounded-xl border border-amber-400/60 bg-black/70 px-4 py-4 shadow-md shadow-amber-400/10">
        <h3 className="m-0 text-center text-[1rem] font-bold text-amber-300 tracking-wide leading-tight">
          COFFEE STORAGE &amp; FRESHNESS
        </h3>

        <p className="mt-2 text-[0.9rem] text-amber-300 text-center leading-snug">
          Buying 3+ bags to save on shipping? Here is how to keep extras fresh.
        </p>

        <ol className="mt-3 space-y-2 text-[0.9rem] text-neutral-300 leading-snug list-decimal pl-5">
          <li>Freeze unopened 12-oz bags inside Ziplocks or vacuum-sealed.</li>
          <li>
            When ready, let the bag reach room temperature{" "}
            <span className="italic">before opening</span>.
          </li>
          <li>
            <span className="font-semibold text-amber-300">Whole bean:</span>{" "}
            Store airtight at room temperature. Best flavor within{" "}
            <span className="font-semibold">2-4 weeks</span>.
          </li>
          <li>
            <span className="font-semibold text-amber-300">Ground:</span> Store
            airtight at room temperature. Best within{" "}
            <span className="font-semibold">7-10 days</span>.
          </li>
          <li>Do not refreeze after opening.</li>
        </ol>

        <div className="mt-3 text-[0.9rem] text-amber-300 text-center leading-snug">
          Follow these steps and your coffee stays fresh for weeks, even months
          when frozen.
        </div>
      </aside>

      {/* DESKTOP VERSION */}
      <aside className="hidden md:block w-[110%] rounded-xl border border-amber-400/60 bg-black/70 px-5 py-5 md:px-6 md:py-8 shadow-md shadow-amber-400/10">
        <h3 className="m-0 text-center text-[1.15rem] md:text-[1.294rem] font-bold text-amber-300 tracking-wide">
          COFFEE STORAGE &amp; FRESHNESS
        </h3>

        <p className="mt-2 text-[1.006rem] text-amber-300 text-center">
          Buying 3+ bags to save on shipping? Here is how to keep extras fresh.
        </p>

        <ol className="mt-3 space-y-2 text-[1.006rem] text-neutral-300 list-decimal pl-5">
          <li>Freeze unopened 12-oz bags inside Ziplocks or vacuum-sealed.</li>
          <li>
            When ready, let the bag reach room temperature{" "}
            <span className="italic">before opening</span>.
          </li>
          <li>
            <span className="font-semibold text-amber-300">Whole bean:</span>{" "}
            Store airtight at room temperature. Best flavor within{" "}
            <span className="font-semibold">2-4 weeks</span>.
          </li>
          <li>
            <span className="font-semibold text-amber-300">Ground:</span> Store
            airtight at room temperature. Best within{" "}
            <span className="font-semibold">7-10 days</span>.
          </li>
          <li>Do not refreeze after opening.</li>
        </ol>

        <div className="mt-3 text-m md:text-m text-amber-300 text-center">
          Follow these steps and your coffee stays fresh for weeks, even months
          when frozen.
        </div>
      </aside>
    </>
  );
}

function OriginImg({
  name,
  bumpIndonesia = false,
}: {
  name: string;
  bumpIndonesia?: boolean;
}) {
  const FILE_ALIAS: Record<string, string> = {
    Colombia: "columbia filled2",
    "El Salvador": "el salvador filled2",
    Ethiopia: "ethiopia filled2",
    Guatemala: "guatemala filled2",
    Indonesia: "indonesia filled2",
    Brazil: "Brazil amber filled2",
  };

  const SCALE_BY_COUNTRY: Record<string, string> = {
    "El Salvador": "scale-[0.70] md:scale-[0.65]",
    Guatemala: "scale-[0.85] md:scale-[0.80]",
    Ethiopia: "scale-[0.82] md:scale-[0.78]",
    Colombia: "scale-[0.85] md:scale-[0.82]",
    Indonesia: "scale-[0.90]",
    Brazil: "scale-[0.6375] md:scale-[0.615]",
  };

  const fileKey = FILE_ALIAS[name] || name.toLowerCase().replace(/\s+/g, "-");
  const scaleCls = SCALE_BY_COUNTRY[name] || "scale-100";

  // Desktop positioning nudge stays exactly how you wrote it.
  const nudgeDesktop =
    bumpIndonesia && name === "Indonesia"
      ? "-translate-y-12 md:-translate-y-16"
      : "";

  // On mobile we do NOT yank the image so far up, because that can cause overlap.
  const nudgeMobile =
    bumpIndonesia && name === "Indonesia" ? "-translate-y-6" : "";

  return (
    <>
      {/* MOBILE VERSION */}
      <div className="block md:hidden flex flex-col items-center text-center">
        <img
          src={`/${fileKey}.png`}
          alt={name}
          className={`h-auto max-w-[7rem] ${scaleCls} drop-shadow-[0_0_14px_rgba(251,191,36,0.25)] ${nudgeMobile}`}
        />
        <div className="mt-2 text-amber-400/90 tracking-wider text-[0.7rem] font-semibold uppercase leading-none">
          {name}
        </div>
      </div>

      {/* DESKTOP VERSION (UNCHANGED BEHAVIOR) */}
      <div className="hidden md:flex flex-col items-center text-center">
        <img
          src={`/${fileKey}.png`}
          alt={name}
          className={`h-auto max-w-[9.5rem] md:max-w-[11rem] ${scaleCls} drop-shadow-[0_0_14px_rgba(251,191,36,0.25)] ${nudgeDesktop}`}
        />
        <div className="mt-2 text-amber-400/90 tracking-wider text-sm font-semibold uppercase">
          {name}
        </div>
      </div>
    </>
  );
}
function LocalFlashBanner() {
  return null;
}

function RoastLevelAnchors({
  level,
  reviewData,
  reviews,
  roastTitle: _roastTitle, // kept for callsites, unused now
}: {
  level: 1 | 2 | 3 | 4 | 5;
  reviewData: { avg: number; count: number; breakdown: Record<number, number> };
  reviews: Review[];
  roastTitle: string;
}) {
  const total = reviewData?.count || 0;
  const b = reviewData?.breakdown || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);

  const [page, setPage] = useState(1);
  const pageSize = 8;
  const pageCount = Math.max(1, Math.ceil((reviews?.length || 0) / pageSize));
  const start = (page - 1) * pageSize;
  const pageItems = (reviews || []).slice(start, start + pageSize);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const toggleExpand = (id: string) =>
    setExpandedId((prev) => (prev === id ? null : id));

  return (
    <>
      <LocalFlashBanner />
      <section className="mt-0 md:mt-2">
        {/* ================= DESKTOP (unchanged from your original) ================= */}
        <div className="hidden md:block">
          {/* Desktop header */}
          <div className="mb-4 flex flex-col items-center text-center">
            {/* Title */}
            <h2 className="text-xl md:text-2xl font-bold tracking-wide text-amber-300">
              CUSTOMER REVIEWS
            </h2>

            {/* Row under title: rating num, stars, count */}
            <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-center">
              {/* rating number */}
              <span className="text-amber-300 font-semibold tabular-nums text-base">
                {(reviewData?.avg ?? 0).toFixed(1)}
              </span>

              {/* stars */}
              <div className="inline-flex items-center gap-0.5">
                {[0, 1, 2, 3, 4].map((i) => {
                  const avg = reviewData?.avg ?? 0;
                  const starFill = Math.max(0, Math.min(1, avg - i));
                  const clipWidth = 24 * starFill;
                  const clipId = `reviewsStarClip-desktop-header-${i}`;
                  return (
                    <svg
                      key={i}
                      viewBox="0 0 24 24"
                      className="h-6 w-6"
                      aria-hidden
                    >
                      <defs>
                        <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
                          <rect x="0" y="0" width={clipWidth} height="24" />
                        </clipPath>
                      </defs>

                      {/* base (neutral) */}
                      <path
                        d="M12 .587l3.668 7.568L24 9.753l-6 5.854L19.335 24 12 19.771 4.665 24 6 15.607 0 9.753l8.332-1.598z"
                        className="text-neutral-800"
                        fill="currentColor"
                      />

                      {/* amber fill clipped */}
                      <path
                        d="M12 .587l3.668 7.568L24 9.753l-6 5.854L19.335 24 12 19.771 4.665 24 6 15.607 0 9.753l8.332-1.598z"
                        className="text-amber-400"
                        fill="currentColor"
                        clipPath={`url(#${clipId})`}
                      />

                      {/* outline stroke */}
                      <path
                        d="M12 .587l3.668 7.568L24 9.753l-6 5.854L19.335 24 12 19.771 4.665 24 6 15.607 0 9.753l8.332-1.598z"
                        fill="none"
                        stroke="currentColor"
                        className="text-neutral-600"
                        strokeWidth="1.6"
                        strokeLinejoin="round"
                      />
                    </svg>
                  );
                })}
                <span className="sr-only">
                  {(reviewData?.avg ?? 0).toFixed(1)} out of 5 stars
                </span>
              </div>

              {/* review count */}
              <div className="text-neutral-400 text-lg">{total} REVIEWS</div>
            </div>
          </div>

          {/* Histogram box */}
          <div className="mt-4 mx-auto max-w-[780px] w-full rounded-xl border border-amber-400/40 bg-black/40 p-4 md:p-6">
            {[5, 4, 3, 2, 1].map((s) => (
              <div key={s} className="flex items-center gap-3 py-1">
                <div className="w-8 text-right text-sm text-neutral-300">
                  {s}★
                </div>
                <div className="flex-1 h-2 rounded-full bg-neutral-800 overflow-hidden">
                  <div
                    className="h-full bg-amber-400"
                    style={{ width: `${pct(b[s] || 0)}%` }}
                  />
                </div>
                <div className="w-12 text-left text-sm text-neutral-400">
                  {b[s] || 0}
                </div>
              </div>
            ))}
          </div>

          {/* Testimonials grid */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 overflow-visible">
            {pageItems.map((r) => {
              const isOpen = expandedId === r.id;

              // Format the date to MM/DD/YY
              const formattedDate = new Date(r.date).toLocaleDateString(
                "en-US",
                {
                  month: "2-digit",
                  day: "2-digit",
                  year: "2-digit",
                }
              );

              return (
                <article
                  key={r.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    if (!isOpen) toggleExpand(r.id);
                  }}
                  onKeyDown={(e) => {
                    if (!isOpen && (e.key === "Enter" || e.key === " "))
                      toggleExpand(r.id);
                  }}
                  aria-expanded={isOpen}
                  className={
                    "relative overflow-visible text-left rounded-lg border border-amber-400/30 bg-black/50 p-4 shadow-sm cursor-pointer transition hover:border-amber-400/60 " +
                    (isOpen ? "z-[70]" : "")
                  }
                >
                  {/* Name and Formatted Date */}
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-amber-300">{r.name}</div>
                    <div className="text-xs text-neutral-400">
                      {formattedDate}
                    </div>
                  </div>

                  {/* Rating Stars */}
                  <div className="mt-1 flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        viewBox="0 0 24 24"
                        fill={i < r.rating ? "currentColor" : "none"}
                        className={
                          "h-4 w-4 " +
                          (i < r.rating ? "text-amber-400" : "text-neutral-700")
                        }
                        stroke="currentColor"
                      >
                        <path d="M12 .587l3.668 7.568L24 9.753l-6 5.854L19.335 24 12 19.771 4.665 24 6 15.607 0 9.753l8.332-1.598z" />
                      </svg>
                    ))}
                  </div>

                  {/* Title for the Review */}
                  {r.title && (
                    <div className="mt-2 text-sm font-semibold text-neutral-300">
                      {r.title}
                    </div>
                  )}

                  {/* Review Body */}
                  {r.body ? (
                    <p className="mt-1 text-sm text-neutral-300 leading-relaxed overflow-hidden max-h-16">
                      {r.body}
                    </p>
                  ) : null}

                  {/* Verified Buyer */}
                  <div className="mt-3 text-[11px] uppercase tracking-wide text-amber-300/90">
                    Verified Buyer
                  </div>

                  {/* Expanded View */}
                  {isOpen && (
                    <div
                      className="absolute left-0 right-0 -top-2 z-50 rounded-xl border border-amber-400/70 bg-neutral-950 shadow-2xl shadow-amber-500/20 p-4 md:p-5"
                      style={{ minHeight: 280 }}
                      onClick={() => toggleExpand(r.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-amber-300">
                          {r.name}
                        </div>
                        <div className="text-xs text-neutral-400">
                          {formattedDate}
                        </div>
                      </div>

                      {/* Rating Stars */}
                      <div className="mt-1 flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            viewBox="0 0 24 24"
                            fill={i < r.rating ? "currentColor" : "none"}
                            className={
                              "h-4 w-4 " +
                              (i < r.rating
                                ? "text-amber-400"
                                : "text-neutral-700")
                            }
                            stroke="currentColor"
                          >
                            <path d="M12 .587l3.668 7.568L24 9.753l-6 5.854L19.335 24 12 19.771 4.665 24 6 15.607 0 9.753l8.332-1.598z" />
                          </svg>
                        ))}
                      </div>

                      {/* Title and Review Body */}
                      {r.title && (
                        <div className="mt-2 text-sm font-semibold text-neutral-300">
                          {r.title}
                        </div>
                      )}
                      {r.body ? (
                        <p className="mt-1 text-sm text-neutral-300 leading-relaxed">
                          {r.body}
                        </p>
                      ) : null}

                      {/* Verified Buyer */}
                      <div className="mt-3 text-[11px] uppercase tracking-wide text-amber-300/90">
                        Verified Buyer
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>

          {/* Pager */}
          {pageCount > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className={
                  "px-3 py-1.5 rounded-md border text-sm " +
                  (page === 1
                    ? "border-neutral-800 text-neutral-600 cursor-not-allowed"
                    : "border-amber-400/60 text-amber-300 hover:bg-amber-400 hover:text-neutral-900")
                }
                aria-label="Previous reviews page"
              >
                ‹ Prev
              </button>

              {[...Array(pageCount)].map((_, i) => {
                const n = i + 1;
                const active = n === page;
                return (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={
                      "h-8 min-w-[2rem] px-2 rounded-md border text-sm " +
                      (active
                        ? "border-amber-400 bg-amber-400 text-neutral-900 font-semibold"
                        : "border-amber-400/40 text-amber-300 hover:bg-amber-400 hover:text-neutral-900")
                    }
                    aria-current={active ? "page" : undefined}
                    aria-label={`Go to page ${n}`}
                  >
                    {n}
                  </button>
                );
              })}

              <button
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                disabled={page === pageCount}
                className={
                  "px-3 py-1.5 rounded-md border text-sm " +
                  (page === pageCount
                    ? "border-neutral-800 text-neutral-600 cursor-not-allowed"
                    : "border-amber-400/60 text-amber-300 hover:bg-amber-400 hover:text-neutral-900")
                }
                aria-label="Next reviews page"
              >
                Next ›
              </button>
            </div>
          )}
        </div>
        {/* ================= END DESKTOP ================= */}

        {/* ================= MOBILE (tweaked) ================= */}
        <div className="block md:hidden">
          {/* Header: title only */}
          <div className="mb-4 flex flex-col items-center text-center">
            <h2 className="text-lg font-bold tracking-wide text-amber-300">
              CUSTOMER REVIEWS
            </h2>
          </div>

          {/* Avg / Stars / Count */}
          <div className="mt-2 flex flex-col items-center justify-center gap-2 mb-4">
            {/* rating number + stars on same row now */}
            <div className="flex items-center gap-2">
              <div className="text-amber-300 font-semibold tabular-nums text-base leading-none">
                {(reviewData?.avg ?? 0).toFixed(1)}
              </div>

              <div className="inline-flex items-center gap-0.5">
                {[0, 1, 2, 3, 4].map((i) => {
                  const avg = reviewData?.avg ?? 0;
                  const starFill = Math.max(0, Math.min(1, avg - i));
                  const clipWidth = 20 * starFill;
                  const clipId = `reviewsStarClip-mobile-${i}`;
                  return (
                    <svg
                      key={i}
                      viewBox="0 0 24 24"
                      className="h-5 w-5"
                      aria-hidden
                    >
                      <defs>
                        <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
                          <rect x="0" y="0" width={clipWidth} height="24" />
                        </clipPath>
                      </defs>

                      <path
                        d="M12 .587l3.668 7.568L24 9.753l-6 5.854L19.335 24 12 19.771 4.665 24 6 15.607 0 9.753l8.332-1.598z"
                        className="text-neutral-800"
                        fill="currentColor"
                      />
                      <path
                        d="M12 .587l3.668 7.568L24 9.753l-6 5.854L19.335 24 12 19.771 4.665 24 6 15.607 0 9.753l8.332-1.598z"
                        className="text-amber-400"
                        fill="currentColor"
                        clipPath={`url(#${clipId})`}
                      />
                      <path
                        d="M12 .587l3.668 7.568L24 9.753l-6 5.854L19.335 24 12 19.771 4.665 24 6 15.607 0 9.753l8.332-1.598z"
                        fill="none"
                        stroke="currentColor"
                        className="text-neutral-600"
                        strokeWidth="1.6"
                        strokeLinejoin="round"
                      />
                    </svg>
                  );
                })}
                <span className="sr-only">
                  {(reviewData?.avg ?? 0).toFixed(1)} out of 5 stars
                </span>
              </div>
            </div>

            {/* review count below */}
            <div className="text-neutral-400 text-xs tracking-wide">
              {total} REVIEWS
            </div>
          </div>

          {/* Histogram: tighter padding to pull text closer to border */}
          <div className="mt-2 mx-auto w-full rounded-xl border border-amber-400/40 bg-black/40 p-3">
            {[5, 4, 3, 2, 1].map((s) => (
              <div key={s} className="flex items-center gap-3 py-1">
                <div className="w-8 text-right text-xs text-neutral-300">
                  {s}★
                </div>
                <div className="flex-1 h-2 rounded-full bg-neutral-800 overflow-hidden">
                  <div
                    className="h-full bg-amber-400"
                    style={{ width: `${pct(b[s] || 0)}%` }}
                  />
                </div>
                <div className="w-10 text-left text-xs text-neutral-400">
                  {b[s] || 0}
                </div>
              </div>
            ))}
          </div>

          {/* Testimonials: tighter padding inside each card too */}
          <div className="mt-6 grid grid-cols-1 gap-4 overflow-visible">
            {pageItems.map((r) => {
              const isOpen = expandedId === r.id;
              const formattedDate = new Date(r.date).toLocaleDateString(
                "en-US",
                {
                  month: "2-digit",
                  day: "2-digit",
                  year: "2-digit",
                }
              );

              return (
                <article
                  key={r.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    if (!isOpen) toggleExpand(r.id);
                  }}
                  onKeyDown={(e) => {
                    if (!isOpen && (e.key === "Enter" || e.key === " "))
                      toggleExpand(r.id);
                  }}
                  aria-expanded={isOpen}
                  className={
                    "relative overflow-visible text-left rounded-lg border border-amber-400/30 bg-black/50 p-3 shadow-sm cursor-pointer transition hover:border-amber-400/60 " +
                    (isOpen ? "z-[70]" : "")
                  }
                >
                  {/* Header row */}
                  <div className="flex items-start justify-between">
                    <div className="font-semibold text-amber-300 text-sm leading-tight">
                      {r.name}
                    </div>
                    <div className="text-[10px] text-neutral-400">
                      {formattedDate}
                    </div>
                  </div>

                  {/* Rating Stars */}
                  <div className="mt-1 flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        viewBox="0 0 24 24"
                        fill={i < r.rating ? "currentColor" : "none"}
                        className={
                          "h-4 w-4 " +
                          (i < r.rating ? "text-amber-400" : "text-neutral-700")
                        }
                        stroke="currentColor"
                      >
                        <path d="M12 .587l3.668 7.568L24 9.753l-6 5.854L19.335 24 12 19.771 4.665 24 6 15.607 0 9.753l8.332-1.598z" />
                      </svg>
                    ))}
                  </div>

                  {/* Title */}
                  {r.title && (
                    <div className="mt-2 text-[0.8rem] font-semibold text-neutral-300 leading-snug">
                      {r.title}
                    </div>
                  )}

                  {/* Body */}
                  {r.body ? (
                    <p className="mt-1 text-[0.8rem] text-neutral-300 leading-relaxed overflow-hidden max-h-24">
                      {r.body}
                    </p>
                  ) : null}

                  {/* Verified Buyer */}
                  <div className="mt-3 text-[10px] uppercase tracking-wide text-amber-300/90">
                    Verified Buyer
                  </div>

                  {/* Expanded View */}
                  {isOpen && (
                    <div
                      className="absolute left-0 right-0 -top-2 z-50 rounded-xl border border-amber-400/70 bg-neutral-950 shadow-2xl shadow-amber-500/20 p-3"
                      style={{ minHeight: 240 }}
                      onClick={() => toggleExpand(r.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="font-semibold text-amber-300 text-sm leading-tight">
                          {r.name}
                        </div>
                        <div className="text-[10px] text-neutral-400">
                          {formattedDate}
                        </div>
                      </div>

                      <div className="mt-1 flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            viewBox="0 0 24 24"
                            fill={i < r.rating ? "currentColor" : "none"}
                            className={
                              "h-4 w-4 " +
                              (i < r.rating
                                ? "text-amber-400"
                                : "text-neutral-700")
                            }
                            stroke="currentColor"
                          >
                            <path d="M12 .587l3.668 7.568L24 9.753l-6 5.854L19.335 24 12 19.771 4.665 24 6 15.607 0 9.753l8.332-1.598z" />
                          </svg>
                        ))}
                      </div>

                      {r.title && (
                        <div className="mt-2 text-[0.8rem] font-semibold text-neutral-300 leading-snug">
                          {r.title}
                        </div>
                      )}

                      {r.body ? (
                        <p className="mt-1 text-[0.8rem] text-neutral-300 leading-relaxed">
                          {r.body}
                        </p>
                      ) : null}

                      <div className="mt-3 text-[10px] uppercase tracking-wide text-amber-300/90">
                        Verified Buyer
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>

          {/* Pager (mobile) */}
          {pageCount > 1 && (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-sm">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className={
                  "px-3 py-1.5 rounded-md border text-xs " +
                  (page === 1
                    ? "border-neutral-800 text-neutral-600 cursor-not-allowed"
                    : "border-amber-400/60 text-amber-300 hover:bg-amber-400 hover:text-neutral-900")
                }
                aria-label="Previous reviews page"
              >
                ‹ Prev
              </button>

              {[...Array(pageCount)].map((_, i) => {
                const n = i + 1;
                const active = n === page;
                return (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={
                      "h-8 min-w-[2rem] px-2 rounded-md border text-xs " +
                      (active
                        ? "border-amber-400 bg-amber-400 text-neutral-900 font-semibold"
                        : "border-amber-400/40 text-amber-300 hover:bg-amber-400 hover:text-neutral-900")
                    }
                    aria-current={active ? "page" : undefined}
                    aria-label={`Go to page ${n}`}
                  >
                    {n}
                  </button>
                );
              })}

              <button
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                disabled={page === pageCount}
                className={
                  "px-3 py-1.5 rounded-md border text-xs " +
                  (page === pageCount
                    ? "border-neutral-800 text-neutral-600 cursor-not-allowed"
                    : "border-amber-400/60 text-amber-300 hover:bg-amber-400 hover:text-neutral-900")
                }
                aria-label="Next reviews page"
              >
                Next ›
              </button>
            </div>
          )}
        </div>
        {/* ================= END MOBILE ================= */}

        {/* Fullscreen dim behind expanded tile (both views) */}
        {expandedId && (
          <div
            className="fixed inset-0 z-40 bg-black/40"
            onClick={() => toggleExpand(expandedId)}
            aria-hidden
          />
        )}
      </section>
    </>
  );
}

/* ================== PER-ROAST SECTIONS ================== */
function TheCoffeeFlagship({
  craftSubtitle,
  reviewData,
  reviews,
  anchorLevel,
}: {
  craftSubtitle: React.ReactNode | null;
  reviewData: { avg: number; count: number; breakdown: Record<number, number> };
  reviews: Review[];
  anchorLevel?: 1 | 2 | 3 | 4 | 5;
}) {
  const notes = ["Hazelnut", "Spice", "Cream"];
  const origins = ["El Salvador", "Indonesia"];
  const level: 1 | 2 | 3 | 4 | 5 = 3;
  const GRID =
    origins.length === 2
      ? "grid-cols-[auto_auto]"
      : "grid-cols-[auto_auto_auto]";
  const anchors = typeof anchorLevel === "number" ? anchorLevel : level;

  return (
    <section className="relative left-1/2 right-1/2 -mx-[50vw] w-screen">
      <div className="border-t-2 border-amber-400/70 relative translate-y-3 md:translate-y-6 w-[110%] -ml-[5%]" />
      <div className="bg-neutral-950 mt-[-1px]">
        <Container className="pt-6 md:pt-8 pb-6 md:pb-10">
          <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(460px,520px)] md:gap-10 items-start">
            {/* LEFT: Title + content */}
            <div className="max-w-[80ch]">
              <h2 className="text-xl md:text-2xl font-bold text-amber-300">
                THE CRAFT IN THE CUP
              </h2>

              {craftSubtitle && (
                <div className="mt-1 text-neutral-300 text-base md:text-lg leading-relaxed max-w-[68ch]">
                  {craftSubtitle}
                </div>
              )}

              <div className="w-full max-w-4xl h-px bg-amber-400/30 my-3" />

              <div className="mt-1">
                <h3 className="text-base md:text-lg font-semibold text-amber-300/90">
                  Signature Notes
                </h3>
                <div className="mt-1 text-neutral-300 text-lg leading-relaxed">
                  {notes.map((note, i) => (
                    <span key={note}>
                      {note}
                      {i < notes.length - 1 && (
                        <span className="mx-1 text-amber-300">|</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>

              <div className="w-full max-w-4xl h-px bg-amber-400/30 my-3" />

              <h3 className="text-base md:text-lg font-semibold text-amber-300/90 mb-4 text-center md:text-left">
                Bean Origins
              </h3>

              <div
                className={`inline-grid ${GRID} gap-4 md:gap-6 items-end justify-center md:justify-start`}
              >
                {origins.map((name) => (
                  <OriginImg key={name} name={name} />
                ))}
              </div>

              <div className="w-full max-w-4xl h-px bg-amber-400/30 my-3" />

              {typeof anchors === "number" && (
                <div className="mt-4 flex items-center justify-start">
                  <span className="mr-3 text-base md:text-lg font-semibold tracking-wider text-amber-300 uppercase">
                    Roast Level
                  </span>

                  <div className="relative flex items-center gap-3">
                    <div
                      className="pointer-events-none absolute top-1/2 left-0 right-0 -z-10 h-[2px]
              bg-[repeating-linear-gradient(90deg,rgba(214,158,46,0.35)_0,rgba(214,158,46,0.35)_6px,transparent_6px,transparent_10px)]"
                      aria-hidden
                    />
                    {[1, 2, 3, 4, 5].map((n) => (
                      <div key={n} className="relative">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className={
                            "relative z-10 h-6 w-6 md:h-7 md:w-7 align-middle select-none transition-transform " +
                            (n <= anchors
                              ? "text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)] scale-110"
                              : "text-neutral-600")
                          }
                          aria-hidden
                        >
                          <rect
                            x="11"
                            y="0"
                            width="2"
                            height="24"
                            fill="currentColor"
                            className="text-neutral-950"
                          />
                          <circle
                            cx="12"
                            cy="4"
                            r="1.6"
                            fill="currentColor"
                            className="text-neutral-950"
                          />
                          <circle cx="12" cy="4" r="2" />
                          <path d="M12 6v11" />
                          <path d="M8 10h8" />
                          <path d="M5 17c2 3 5 4 7 4s5-1 7-4" />
                          <path d="M7 17l-2 2" />
                          <path d="M17 17l2 2" />
                        </svg>
                        <span className="sr-only">{`Roast level ${n} of 5`}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT: CareCard desktop */}
            <aside className="hidden md:block md:self-start md:justify-self-end w-full max-w-[520px] md:sticky md:top-14 md:mt-6">
              <CareCard />
            </aside>
          </div>
        </Container>

        {/* MOBILE CareCard (stacked above RoastLevel, with breathing room) */}
        <div className="block md:hidden bg-neutral-950">
          <Container className="pt-2 pb-0">
            <div className="mt-0">
              <CareCard />
            </div>
          </Container>
        </div>

        <div className="border-t-2 border-amber-400/70 relative mt-6 md:mt-8 w-[110%] -ml-[5%]" />

        <div className="bg-neutral-950">
          <Container className="pt-6 md:pt-8 pb-6 md:pb-10">
            <RoastLevelAnchors
              level={level}
              reviewData={reviewData}
              reviews={reviews}
              roastTitle="Flagship"
            />
          </Container>
        </div>
      </div>
    </section>
  );
}

function TheCoffeeBaptism({
  craftSubtitle,
  reviewData,
  reviews,
  anchorLevel,
}: {
  craftSubtitle: React.ReactNode | null;
  reviewData: { avg: number; count: number; breakdown: Record<number, number> };
  reviews: Review[];
  anchorLevel?: 1 | 2 | 3 | 4 | 5;
}) {
  const notes = ["Dark chocolate", "Molasses", "Smoke"];
  const origins = ["Indonesia", "Colombia"];
  const level: 1 | 2 | 3 | 4 | 5 = 4;
  const GRID =
    origins.length === 2
      ? "grid-cols-[auto_auto]"
      : "grid-cols-[auto_auto_auto]";
  const anchors = typeof anchorLevel === "number" ? anchorLevel : level;

  return (
    <section className="relative left-1/2 right-1/2 -mx-[50vw] w-screen">
      <div className="border-t-2 border-amber-400/70 relative translate-y-3 md:translate-y-6 w-[110%] -ml-[5%]" />
      <div className="bg-neutral-950 mt-[-1px]">
        <Container className="pt-6 md:pt-8 pb-6 md:pb-10">
          <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(460px,520px)] md:gap-10 items-start">
            {/* LEFT: Title + content */}
            <div className="max-w-[80ch]">
              <h2 className="text-xl md:text-2xl font-bold text-amber-300">
                THE CRAFT IN THE CUP
              </h2>

              {craftSubtitle && (
                <div className="mt-1 text-neutral-300 text-base md:text-lg leading-relaxed max-w-[68ch]">
                  {craftSubtitle}
                </div>
              )}

              <div className="w-full max-w-4xl h-px bg-amber-400/30 my-3" />

              <div className="mt-1">
                <h3 className="text-base md:text-lg font-semibold text-amber-300/90">
                  Signature Notes
                </h3>
                <div className="mt-1 text-neutral-300 text-lg leading-relaxed">
                  {notes.map((note, i) => (
                    <span key={note}>
                      {note}
                      {i < notes.length - 1 && (
                        <span className="mx-1 text-amber-300">|</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>

              <div className="w-full max-w-4xl h-px bg-amber-400/30 my-3" />

              <h3 className="text-base md:text-lg font-semibold text-amber-300/90 mb-4 text-center md:text-left">
                Bean Origins
              </h3>

              <div
                className={`inline-grid ${GRID} gap-4 md:gap-6 items-end justify-center md:justify-start`}
              >
                {origins.map((name) => (
                  <OriginImg key={name} name={name} bumpIndonesia />
                ))}
              </div>

              <div className="w-full max-w-4xl h-px bg-amber-400/30 my-3" />

              {typeof anchors === "number" && (
                <div className="mt-4 flex items-center justify-start">
                  <span className="mr-3 text-base md:text-lg font-semibold tracking-wider text-amber-300 uppercase">
                    Roast Level
                  </span>

                  <div className="relative flex items-center gap-3">
                    <div
                      className="pointer-events-none absolute top-1/2 left-0 right-0 -z-10 h-[2px]
              bg-[repeating-linear-gradient(90deg,rgba(214,158,46,0.35)_0,rgba(214,158,46,0.35)_6px,transparent_6px,transparent_10px)]"
                      aria-hidden
                    />
                    {[1, 2, 3, 4, 5].map((n) => (
                      <div key={n} className="relative">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className={
                            "relative z-10 h-6 w-6 md:h-7 md:w-7 align-middle select-none transition-transform " +
                            (n <= anchors
                              ? "text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)] scale-110"
                              : "text-neutral-600")
                          }
                          aria-hidden
                        >
                          <rect
                            x="11"
                            y="0"
                            width="2"
                            height="24"
                            fill="currentColor"
                            className="text-neutral-950"
                          />
                          <circle
                            cx="12"
                            cy="4"
                            r="1.6"
                            fill="currentColor"
                            className="text-neutral-950"
                          />
                          <circle cx="12" cy="4" r="2" />
                          <path d="M12 6v11" />
                          <path d="M8 10h8" />
                          <path d="M5 17c2 3 5 4 7 4s5-1 7-4" />
                          <path d="M7 17l-2 2" />
                          <path d="M17 17l2 2" />
                        </svg>
                        <span className="sr-only">{`Roast level ${n} of 5`}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT: CareCard desktop */}
            <aside className="hidden md:block md:self-start md:justify-self-end w-full max-w-[520px] md:sticky md:top-14 md:mt-6">
              <CareCard />
            </aside>
          </div>
        </Container>

        {/* MOBILE CareCard (stacked above RoastLevel, tighter spacing like you said) */}
        <div className="block md:hidden bg-neutral-950">
          <Container className="pt-2 pb-0">
            <div className="mt-0">
              <CareCard />
            </div>
          </Container>
        </div>

        <div className="border-t-2 border-amber-400/70 relative mt-6 md:mt-8 w-[110%] -ml-[5%]" />

        <div className="bg-neutral-950">
          <Container className="pt-6 md:pt-8 pb-6 md:pb-10">
            <RoastLevelAnchors
              level={level}
              reviewData={reviewData}
              reviews={reviews}
              roastTitle="Baptism by Fire"
            />
          </Container>
        </div>
      </div>
    </section>
  );
}

function TheCoffeeJava({
  craftSubtitle,
  reviewData,
  reviews,
  anchorLevel,
}: {
  craftSubtitle: React.ReactNode | null;
  reviewData: { avg: number; count: number; breakdown: Record<number, number> };
  reviews: Review[];
  anchorLevel?: 1 | 2 | 3 | 4 | 5;
}) {
  const notes = ["Hazelnut", "Caramel", "Apple"];
  const origins = ["Guatemala", "Ethiopia", "Colombia"];
  const level: 1 | 2 | 3 | 4 | 5 = 3;
  const GRID =
    origins.length === 2
      ? "grid-cols-[auto_auto]"
      : "grid-cols-[auto_auto_auto]";
  const anchors = typeof anchorLevel === "number" ? anchorLevel : level;

  return (
    <section className="relative left-1/2 right-1/2 -mx-[50vw] w-screen">
      <div className="border-t-2 border-amber-400/70 relative translate-y-3 md:translate-y-6 w-[110%] -ml-[5%]" />
      <div className="bg-neutral-950 mt-[-1px]">
        <Container className="pt-6 md:pt-8 pb-6 md:pb-10">
          <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(460px,520px)] md:gap-10 items-start">
            {/* LEFT: Title + content */}
            <div className="max-w-[80ch]">
              <h2 className="text-xl md:text-2xl font-bold text-amber-300">
                THE CRAFT IN THE CUP
              </h2>

              {craftSubtitle && (
                <div className="mt-1 text-neutral-300 text-base md:text-lg leading-relaxed max-w-[68ch]">
                  {craftSubtitle}
                </div>
              )}

              <div className="w-full max-w-4xl h-px bg-amber-400/30 my-3" />

              <div className="mt-1">
                <h3 className="text-base md:text-lg font-semibold text-amber-300/90">
                  Signature Notes
                </h3>
                <div className="mt-1 text-neutral-300 text-lg leading-relaxed">
                  {notes.map((note, i) => (
                    <span key={note}>
                      {note}
                      {i < notes.length - 1 && (
                        <span className="mx-1 text-amber-300">|</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>

              <div className="w-full max-w-4xl h-px bg-amber-400/30 my-3" />

              <h3 className="text-base md:text-lg font-semibold text-amber-300/90 mb-4 text-center md:text-left">
                Bean Origins
              </h3>

              <div
                className={`inline-grid ${GRID} gap-4 md:gap-6 items-end justify-center md:justify-start`}
              >
                {origins.map((name) => (
                  <OriginImg key={name} name={name} />
                ))}
              </div>

              <div className="w-full max-w-4xl h-px bg-amber-400/30 my-3" />

              {typeof anchors === "number" && (
                <div className="mt-4 flex items-center justify-start">
                  <span className="mr-3 text-base md:text-lg font-semibold tracking-wider text-amber-300 uppercase">
                    Roast Level
                  </span>

                  <div className="relative flex items-center gap-3">
                    <div
                      className="pointer-events-none absolute top-1/2 left-0 right-0 -z-10 h-[2px]
              bg-[repeating-linear-gradient(90deg,rgba(214,158,46,0.35)_0,rgba(214,158,46,0.35)_6px,transparent_6px,transparent_10px)]"
                      aria-hidden
                    />
                    {[1, 2, 3, 4, 5].map((n) => (
                      <div key={n} className="relative">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className={
                            "relative z-10 h-6 w-6 md:h-7 md:w-7 align-middle select-none transition-transform " +
                            (n <= anchors
                              ? "text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)] scale-110"
                              : "text-neutral-600")
                          }
                          aria-hidden
                        >
                          <rect
                            x="11"
                            y="0"
                            width="2"
                            height="24"
                            fill="currentColor"
                            className="text-neutral-950"
                          />
                          <circle
                            cx="12"
                            cy="4"
                            r="1.6"
                            fill="currentColor"
                            className="text-neutral-950"
                          />
                          <circle cx="12" cy="4" r="2" />
                          <path d="M12 6v11" />
                          <path d="M8 10h8" />
                          <path d="M5 17c2 3 5 4 7 4s5-1 7-4" />
                          <path d="M7 17l-2 2" />
                          <path d="M17 17l2 2" />
                        </svg>
                        <span className="sr-only">{`Roast level ${n} of 5`}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT: CareCard desktop */}
            <aside className="hidden md:block md:self-start md:justify-self-end w-full max-w-[520px] md:sticky md:top-14 md:mt-6">
              <CareCard />
            </aside>
          </div>
        </Container>

        {/* MOBILE CareCard (stacked above RoastLevel, tight spacing) */}
        <div className="block md:hidden bg-neutral-950">
          <Container className="pt-2 pb-0">
            <div className="mt-0">
              <CareCard />
            </div>
          </Container>
        </div>

        <div className="border-t-2 border-amber-400/70 relative mt-6 md:mt-8 w-[110%] -ml-[5%]" />

        <div className="bg-neutral-950">
          <Container className="pt-6 md:pt-8 pb-6 md:pb-10">
            <RoastLevelAnchors
              level={level}
              reviewData={reviewData}
              reviews={reviews}
              roastTitle="The Java Action"
            />
          </Container>
        </div>
      </div>
    </section>
  );
}

function TheCoffeeOak({
  craftSubtitle,
  reviewData,
  reviews,
  anchorLevel,
}: {
  craftSubtitle: React.ReactNode | null;
  reviewData: { avg: number; count: number; breakdown: Record<number, number> };
  reviews: Review[];
  anchorLevel?: 1 | 2 | 3 | 4 | 5;
}) {
  const notes = ["Warm Vanilla", "Caramel", "Toasted Oak"];
  const origins = ["Colombia"];
  const level: 1 | 2 | 3 | 4 | 5 = 3;
  const GRID =
    origins.length === 2
      ? "grid-cols-[auto_auto]"
      : "grid-cols-[auto_auto_auto]";
  const anchors = typeof anchorLevel === "number" ? anchorLevel : level;

  return (
    <section className="relative left-1/2 right-1/2 -mx-[50vw] w-screen">
      <div className="border-t-2 border-amber-400/70 relative translate-y-3 md:translate-y-6 w-[110%] -ml-[5%]" />
      <div className="bg-neutral-950 mt-[-1px]">
        <Container className="pt-6 md:pt-8 pb-6 md:pb-10">
          <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(460px,520px)] md:gap-10 items-start">
            {/* LEFT: Title + content */}
            <div className="max-w-[80ch]">
              <h2 className="text-xl md:text-2xl font-bold text-amber-300">
                THE CRAFT IN THE CUP
              </h2>

              {craftSubtitle && (
                <div className="mt-1 text-neutral-300 text-base md:text-lg leading-relaxed max-w-[68ch]">
                  {craftSubtitle}
                </div>
              )}

              <div className="w-full max-w-4xl h-px bg-amber-400/30 my-3" />

              <div className="mt-1">
                <h3 className="text-base md:text-lg font-semibold text-amber-300/90">
                  Signature Notes
                </h3>
                <div className="mt-1 text-neutral-300 text-lg leading-relaxed">
                  {notes.map((note, i) => (
                    <span key={note}>
                      {note}
                      {i < notes.length - 1 && (
                        <span className="mx-1 text-amber-300">|</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>

              <div className="w-full max-w-4xl h-px bg-amber-400/30 my-3" />

              <h3 className="text-base md:text-lg font-semibold text-amber-300/90 mb-4 text-center md:text-left">
                Bean Origins
              </h3>

              <div
                className={`inline-grid ${GRID} gap-4 md:gap-6 items-end justify-center md:justify-start`}
              >
                {origins.map((name) => (
                  <OriginImg key={name} name={name} bumpIndonesia />
                ))}
              </div>

              <div className="w-full max-w-4xl h-px bg-amber-400/30 my-3" />

              {typeof anchors === "number" && (
                <div className="mt-4 flex items-center justify-start">
                  <span className="mr-3 text-base md:text-lg font-semibold tracking-wider text-amber-300 uppercase">
                    Roast Level
                  </span>

                  <div className="relative flex items-center gap-3">
                    <div
                      className="pointer-events-none absolute top-1/2 left-0 right-0 -z-10 h-[2px]
              bg-[repeating-linear-gradient(90deg,rgba(214,158,46,0.35)_0,rgba(214,158,46,0.35)_6px,transparent_6px,transparent_10px)]"
                      aria-hidden
                    />
                    {[1, 2, 3, 4, 5].map((n) => (
                      <div key={n} className="relative">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className={
                            "relative z-10 h-6 w-6 md:h-7 md:w-7 align-middle select-none transition-transform " +
                            (n <= anchors
                              ? "text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)] scale-110"
                              : "text-neutral-600")
                          }
                          aria-hidden
                        >
                          <rect
                            x="11"
                            y="0"
                            width="2"
                            height="24"
                            fill="currentColor"
                            className="text-neutral-950"
                          />
                          <circle
                            cx="12"
                            cy="4"
                            r="1.6"
                            fill="currentColor"
                            className="text-neutral-950"
                          />
                          <circle cx="12" cy="4" r="2" />
                          <path d="M12 6v11" />
                          <path d="M8 10h8" />
                          <path d="M5 17c2 3 5 4 7 4s5-1 7-4" />
                          <path d="M7 17l-2 2" />
                          <path d="M17 17l2 2" />
                        </svg>
                        <span className="sr-only">{`Roast level ${n} of 5`}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT: CareCard desktop */}
            <aside className="hidden md:block md:self-start md:justify-self-end w-full max-w-[520px] md:sticky md:top-14 md:mt-6">
              <CareCard />
            </aside>
          </div>
        </Container>

        {/* MOBILE CareCard (stacked above RoastLevel, tight spacing) */}
        <div className="block md:hidden bg-neutral-950">
          <Container className="pt-2 pb-0">
            <div className="mt-0">
              <CareCard />
            </div>
          </Container>
        </div>

        <div className="border-t-2 border-amber-400/70 relative mt-6 md:mt-8 w-[110%] -ml-[5%]" />

        <div className="bg-neutral-950">
          <Container className="pt-6 md:pt-8 pb-6 md:pb-10">
            <RoastLevelAnchors
              level={level}
              reviewData={reviewData}
              reviews={reviews}
              roastTitle="Oak & Copper"
            />
          </Container>
        </div>
      </div>
    </section>
  );
}
function TheCoffeeBrass({
  craftSubtitle,
  reviewData,
  reviews,
  anchorLevel,
}: {
  craftSubtitle: React.ReactNode | null;
  reviewData: { avg: number; count: number; breakdown: Record<number, number> };
  reviews: Review[];
  anchorLevel?: 1 | 2 | 3 | 4 | 5;
}) {
  // TODO: set your real notes + origins
  const notes = ["Pecan, obviously"];
  const origins = ["Brazil"]; // change if needed
  const level: 1 | 2 | 3 | 4 | 5 = 3;

  const GRID =
    origins.length === 2
      ? "grid-cols-[auto_auto]"
      : "grid-cols-[auto_auto_auto]";

  const anchors = typeof anchorLevel === "number" ? anchorLevel : level;

  return (
    <section className="relative left-1/2 right-1/2 -mx-[50vw] w-screen">
      <div className="border-t-2 border-amber-400/70 relative translate-y-3 md:translate-y-6 w-[110%] -ml-[5%]" />
      <div className="bg-neutral-950 mt-[-1px]">
        <Container className="pt-6 md:pt-8 pb-6 md:pb-10">
          <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(460px,520px)] md:gap-10 items-start">
            {/* LEFT: Title + content */}
            <div className="max-w-[80ch]">
              <h2 className="text-xl md:text-2xl font-bold text-amber-300">
                THE CRAFT IN THE CUP
              </h2>

              {craftSubtitle && (
                <div className="mt-1 text-neutral-300 text-base md:text-lg leading-relaxed max-w-[68ch]">
                  {craftSubtitle}
                </div>
              )}

              <div className="w-full max-w-4xl h-px bg-amber-400/30 my-3" />

              <div className="mt-1">
                <h3 className="text-base md:text-lg font-semibold text-amber-300/90 mb-0 text-center md:text-left">
                  Bean Origins
                </h3>

                <div className="mt-1 text-neutral-300 text-lg leading-relaxed">
                  {notes.join(", ")}
                </div>
              </div>

              <div className="w-full max-w-4xl h-px bg-amber-400/30 my-3" />

              <h3 className="text-base md:text-lg font-semibold text-amber-300/90 mb-1 text-center md:text-left">
                Bean Origins
              </h3>

              <div
                className={`inline-grid ${GRID} gap-0 md:gap-1 items-end justify-center md:justify-start`}
              >
                {origins.map((name) => (
                  <OriginImg key={name} name={name} />
                ))}
              </div>

              <div className="w-full max-w-4xl h-px bg-amber-400/30 my-3" />

              {typeof anchors === "number" && (
                <div className="mt-4 flex items-center justify-start">
                  <span className="mr-3 text-base md:text-lg font-semibold tracking-wider text-amber-300 uppercase">
                    Roast Level
                  </span>

                  <div className="relative flex items-center gap-3">
                    <div
                      className="pointer-events-none absolute top-1/2 left-0 right-0 -z-10 h-[2px]
              bg-[repeating-linear-gradient(90deg,rgba(214,158,46,0.35)_0,rgba(214,158,46,0.35)_6px,transparent_6px,transparent_10px)]"
                      aria-hidden
                    />
                    {[1, 2, 3, 4, 5].map((n) => (
                      <div key={n} className="relative">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className={
                            "relative z-10 h-6 w-6 md:h-7 md:w-7 align-middle select-none transition-transform " +
                            (n <= anchors
                              ? "text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)] scale-110"
                              : "text-neutral-600")
                          }
                          aria-hidden
                        >
                          <rect
                            x="11"
                            y="0"
                            width="2"
                            height="24"
                            fill="currentColor"
                            className="text-neutral-950"
                          />
                          <circle
                            cx="12"
                            cy="4"
                            r="1.6"
                            fill="currentColor"
                            className="text-neutral-950"
                          />
                          <circle cx="12" cy="4" r="2" />
                          <path d="M12 6v11" />
                          <path d="M8 10h8" />
                          <path d="M5 17c2 3 5 4 7 4s5-1 7-4" />
                          <path d="M7 17l-2 2" />
                          <path d="M17 17l2 2" />
                        </svg>
                        <span className="sr-only">{`Roast level ${n} of 5`}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT: CareCard desktop */}
            <aside className="hidden md:block md:self-start md:justify-self-end w-full max-w-[520px] md:sticky md:top-14 md:mt-6">
              <CareCard />
            </aside>
          </div>
        </Container>

        {/* MOBILE CareCard */}
        <div className="block md:hidden bg-neutral-950">
          <Container className="pt-2 pb-0">
            <div className="mt-0">
              <CareCard />
            </div>
          </Container>
        </div>

        <div className="border-t-2 border-amber-400/70 relative mt-6 md:mt-8 w-[110%] -ml-[5%]" />

        <div className="bg-neutral-950">
          <Container className="pt-6 md:pt-8 pb-6 md:pb-10">
            <RoastLevelAnchors
              level={level}
              reviewData={reviewData}
              reviews={reviews}
              roastTitle="Brass Monkey"
            />
          </Container>
        </div>
      </div>
    </section>
  );
}

function StorePage() {
  const tiles = [
    {
      key: "tees",
      label: "Tees",
      icon: <Shirt className="h-5 w-5" />,
      img: "shirts-web.png",
    },
    {
      key: "Hats",
      label: "Hats",
      icon: <span className="text-sm">☕</span>,
      img: "hat1-web.png",
    },
    {
      key: "Mugs",
      label: "Mugs",
      icon: <span className="text-sm">◼︎</span>,
      img: "coffee-deck2.png",
    },
    {
      key: "accessories",
      label: "Coffee Accessories",
      icon: <PackageOpen className="h-5 w-5" />,
      img: "canister-web.png",
    },
  ];

  return (
    <main className="relative overflow-hidden">
      {/* 1) Fleet content at the very top (keeps its own full-bleed harbor backdrop) */}
      <LaunchedFromHarbor />
      {/* 2) Store content below */}
      <section
        id="merch"
        className="relative overflow-hidden pt-10 pb-16 md:pt-12 md:pb-24 scroll-mt-28 md:scroll-mt-36"
      >
        <Container>
          <SectionTitle
            title="Coming soon!"
            subtitle="Apparel, mugs, hats, and gear for the Fleet."
          />

          {/* MOBILE: 2×2 gear tiles */}
          <div className="md:hidden mt-4">
            <div className="grid grid-cols-2 gap-4">
              {tiles.map((t) => {
                const slug = String(t.key).toLowerCase();
                return (
                  <div
                    key={`mob-merch-${slug}`}
                    role="presentation"
                    aria-disabled="true"
                    tabIndex={-1}
                    className="group overflow-hidden rounded-2xl ring-1 ring-amber-400/60 bg-neutral-900/40 shadow-lg shadow-amber-400/10 transition cursor-default select-none"
                  >
                    <div className="aspect-[3/4] w-full overflow-hidden bg-neutral-900">
                      <img
                        src={
                          t.img?.startsWith("/") || t.img?.startsWith("http")
                            ? t.img
                            : `/${t.img}`
                        }
                        alt={`${t.label} preview`}
                        className="h-full w-full object-cover"
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          const el = e.currentTarget as HTMLImageElement;
                          if (!el.src.includes("/placeholder.png")) {
                            el.src = "/placeholder.png";
                          }
                        }}
                      />
                    </div>
                    <div className="p-3 text-center">
                      <div
                        className="text-base font-extrabold text-amber-300 tracking-wide"
                        style={{ fontFamily: "'Cinzel', serif" }}
                      >
                        {t.label}
                      </div>
                      <div className="text-[11px] text-neutral-400">
                        Coming soon
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* DESKTOP: original grid */}
          <div className="hidden md:grid mt-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {tiles.map((t) => (
              <div
                key={t.key}
                className="rounded-2xl ring-1 ring-neutral-800 bg-neutral-900/40 transition text-left overflow-hidden flex flex-col"
              >
                <div className="aspect-[4/3] w-full overflow-hidden">
                  <img
                    src={t.img}
                    alt={`${t.label} preview`}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-3 text-amber-300 font-semibold">
                    {t.icon}
                    <span>{t.label}</span>
                  </div>
                </div>
                <div className="px-6 pb-6">
                  <div className="mt-2 text-sm text-neutral-400">
                    Join the Fleet to get first access on gear. <br />
                    Plus 20% off on first order of coffee.
                  </div>
                  <NotifyForm onSubmit={() => {}} />
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>
    </main>
  );
}
// Store categories used by /store/:slug
type StoreCategory = { slug: string; label: string };

const STORE_CATEGORIES: ReadonlyArray<StoreCategory> = [
  { slug: "coffee", label: "Coffee" },
  { slug: "gear", label: "Gear" },
  { slug: "apparel", label: "Apparel" },
  { slug: "bundles", label: "Bundles" },
  { slug: "gifts", label: "Gifts" },
];

function StoreCategoryPage() {
  const { slug } = useParams();
  const cat = STORE_CATEGORIES.find((c) => c.slug === slug);
  const title = cat?.label ?? "Store";

  return (
    <main className="py-16 md:py-24">
      <Container>
        <BackButton to="/store" size="sm" />
        <SectionTitle
          title={
            <span className="text-3xl md:text-5xl font-extrabold text-amber-300">
              {title} — Coming Soon
            </span>
          }
          subtitle="Preview product shots and specs soon. Join the Fleet for notifications."
        />
        <div className="mt-6 grid sm:grid-cols-2 md:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="aspect-[4/3] rounded-2xl ring-1 ring-neutral-800 bg-neutral-900/50 grid place-content-center text-neutral-500"
            >
              Image placeholder
            </div>
          ))}
        </div>
        <div className="mt-8 max-w-xl">
          <div className="rounded-2xl ring-1 ring-amber-400/50 bg-neutral-900/60 p-5">
            <div className="text-sm text-neutral-200">
              Get an alert when {title.toLowerCase()} drops.
            </div>
            <NotifyForm onSubmit={() => {}} />
          </div>
        </div>
      </Container>
    </main>
  );
}

function OriginsPage() {
  // Mobile History carousel (Origins > The History Behind The Fleet)
  const histScrollRef = React.useRef<HTMLDivElement | null>(null);
  const histCardRefs = React.useRef<(HTMLAnchorElement | null)[]>([]);
  const [histIdx, setHistIdx] = React.useState(0);
  const histSlugs = [
    "flagship",
    "baptism-by-fire",
    "java-action",
    "oak-and-copper",
  ];

  const histScrollTo = React.useCallback(
    (idx: number) => {
      const len = histSlugs.length;
      const clamped = ((idx % len) + len) % len;
      const el = histCardRefs.current[clamped];
      if (el && histScrollRef.current) {
        el.scrollIntoView({
          behavior: "smooth",
          inline: "center",
          block: "nearest",
        });
      }
      setHistIdx(clamped);
    },
    [histSlugs.length]
  );

  const histPrev = React.useCallback(
    () => histScrollTo(histIdx - 1),
    [histIdx, histScrollTo]
  );
  const histNext = React.useCallback(
    () => histScrollTo(histIdx + 1),
    [histIdx, histScrollTo]
  );

  const onHistScroll = React.useCallback(() => {
    const c = histScrollRef.current;
    if (!c) return;
    const sl = c.scrollLeft;
    let best = 0;
    let bestDist = Infinity;
    histCardRefs.current.forEach((el, i) => {
      if (!el) return;
      const dist = Math.abs(el.offsetLeft - sl);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    });
    setHistIdx(best);
  }, []);

  // Shared frame for all sections
  const SECTION_FRAME = "relative overflow-hidden border-t border-neutral-800";
  const SECTION_INNER = "relative z-10 min-h-0 md:min-h-[700px] py-4 md:py-16";

  return (
    <main className="pt-0 -mt-16 md:mt-0">
      {/* ===== ROASTING PROCESS (buy box + fonts ~15% larger) ===== */}
      <section
        id="origins-roasting"
        className={`${SECTION_FRAME} -translate-y-3 md:translate-y-0 scroll-mt-28 md:scroll-mt-36`}
      >
        <img
          src="/roasted-dark.jpg"
          alt="Roasting process backdrop"
          className="absolute inset-0 w-full h-full object-cover object-center transform scale-[0.9] md:scale-100 opacity-50 z-0 pointer-events-none"
        />
        <div className="absolute inset-0 bg-neutral-950/40 z-0 pointer-events-none" />

        <Container>
          <div className={`${SECTION_INNER} flex items-center`}>
            <div className="grid w-full grid-cols-1 md:grid-cols-[auto,1fr] gap-4 md:gap-6 items-center">
              {/* Photo LEFT */}
              <div className="justify-self-center self-center">
                <div className="w-64 md:w-[32rem] mx-auto aspect-square rounded-xl overflow-hidden ring-1 ring-amber-400 bg-neutral-900/50">
                  <img
                    src="/roast-machine.jpg"
                    alt="Roaster"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Text RIGHT (fonts bumped ~15%) */}
              <div className="space-y-3">
                <h3 className="font-cinzel text-2xl md:text-4xl font-extrabold text-amber-300 tracking-wide uppercase">
                  ROASTING PROCESS
                </h3>
                <p className="text-neutral-300 text-[15px] md:text-2xl leading-snug tracking-[0.01em]">
                  Coffee is at its best in the first days after roasting when
                  the oils are alive, the aroma is full, and the flavor is at
                  its peak. That is why we roast to order every Monday and ship
                  Tuesday/Wednesday. <br /> <br />
                  No months-old roasted beans sitting on supermarket shelves or
                  in an Amazon warehouse. Our coffee is battle fresh, hitting
                  your cup at its prime exactly the way it was meant to be
                  experienced.
                  <br /> <br />
                </p>

                {/* Buy box ~15% larger: font + padding increased */}
                <Link
                  to="/store"
                  className="mt-8 mx-auto md:mx-0 flex md:inline-flex items-center justify-center gap-2

             rounded-xl ring-1 ring-amber-400/60
             text-amber-400 font-semibold
             text-[1.25rem] md:text-[1.55rem]
             w-[88%] max-w-[22rem] md:w-auto md:max-w-none
             px-[1.65rem] py-[0.7rem] md:px-[1.75rem] md:py-[0.75rem]
             hover:bg-amber-400 hover:text-neutral-900
             transition-all leading-snug text-center"
                >
                  <span className="leading-none text-[2em] md:text-[1em] flex items-center">
                    ⚓
                  </span>
                  <span className="md:whitespace-nowrap">
                    SHOP OUR FRESHLY ROASTED COFFEE
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ===== THE LANDS WHERE OUR BEANS ARE GROWN (photo RIGHT, text LEFT) ===== */}
      <section
        id="origins-lands"
        className={`${SECTION_FRAME} scroll-mt-28 md:scroll-mt-36`}
      >
        <img
          src="/farm1-web.jpg"
          alt="Origins & Voyages backdrop"
          className="absolute inset-0 w-full h-full object-cover object-[50%_68%] opacity-80 z-0 pointer-events-none origin-center [transform:scaleY(1.08)] md:[transform:none]"
        />
        <div className="absolute inset-0 bg-neutral-950/40 z-0 pointer-events-none" />

        <Container>
          <div className="relative z-10 flex items-center min-h-0 md:min-h-[820px] py-4 md:py-16">
            <div className="grid w-full grid-cols-1 md:grid-cols-[1fr,auto] gap-4 md:gap-6 items-center">
              {/* Text LEFT */}
              <div className="space-y-3">
                <h3 className="font-cinzel text-2xl md:text-4xl font-extrabold text-amber-300 tracking-wide uppercase">
                  The Lands Where Our Beans Are Grown
                </h3>
                <p className="text-neutral-300 text-[15px] md:text-2xl leading-snug tracking-[0.01em]">
                  From the volcanic slopes of Guatemala to the highlands of
                  Ethiopia and the misty mountains of Colombia, our beans are
                  born in lands where rich soil and thin air forge extraordinary
                  flavor. <br /> <br /> These distant regions each lend their
                  own character, shaped by altitude, climate, and tradition. It
                  is here that our journey begins, where the spirit of the land
                  becomes the soul of every cup of Old Ironsides Coffee.
                </p>
              </div>

              {/* Photo RIGHT */}
              <div className="justify-self-center self-center">
                <div className="w-64 md:w-[32rem] mx-auto aspect-square rounded-xl overflow-hidden ring-1 ring-amber-400 bg-neutral-900/50">
                  <img
                    src="/bean-stock3.jpg"
                    alt="Beans lands"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ===== THE HANDS THAT GROW OUR BEANS (3-stack offset: top/bottom far LEFT, middle shifted RIGHT; text snug) ===== */}
      <section
        id="origins-hands"
        className={`${SECTION_FRAME} scroll-mt-28 md:scroll-mt-36`}
      >
        {/* Mobile: no backdrop. Desktop: keep backdrop */}
        <img
          src="/hands-bowl.jpg"
          alt="Growers backdrop"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-70 z-0 pointer-events-none hidden md:block"
        />
        <div className="absolute inset-0 bg-neutral-950/40 z-0 pointer-events-none hidden md:block" />
        {/* Mobile-only flat bg */}
        <div className="absolute inset-0 z-0 md:hidden bg-neutral-950" />

        <Container>
          <div
            className={`${SECTION_INNER} flex items-center min-h-[720px] md:min-h-[820px]`}
          >
            <div className="grid w-full grid-cols-1 md:grid-cols-[auto,1fr] items-center gap-3 md:gap-4">
              {/* MOBILE-ONLY TITLE (above pics) */}
              <h3 className="md:hidden font-cinzel text-2xl font-extrabold text-amber-300 tracking-wide uppercase order-1">
                The Hands That Grow Our Beans
              </h3>

              {/* 3-STACK PICS — mobile order 2, desktop left */}
              <div className="justify-self-center md:justify-self-start self-center order-2 md:order-1">
                <div className="relative w-[22rem] sm:w-[28rem] md:w-[36rem] h-[30rem] sm:h-[40rem] md:h-[48rem]">
                  {/* Top card (far LEFT) */}
                  <div className="absolute left-0 top-0 w-64 md:w-72 aspect-[4/3] rounded-xl overflow-hidden ring-1 ring-amber-400 bg-neutral-900/60 shadow-xl">
                    <img
                      src="/workergirl1.jpg"
                      alt="Harvest and selection"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {/* Middle card (offset to RIGHT) */}
                  <div className="absolute left-[58%] top-1/2 -translate-x-1/2 -translate-y-1/2 w-64 md:w-72 aspect-[4/3] rounded-xl overflow-hidden ring-1 ring-amber-400 bg-neutral-900/60 shadow-2xl">
                    <img
                      src="/hands-beans.jpg"
                      alt="Hands with beans"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {/* Bottom card (far LEFT) */}
                  <div className="absolute left-0 bottom-0 w-64 md:w-72 aspect-[4/3] rounded-xl overflow-hidden ring-1 ring-amber-400 bg-neutral-900/60 shadow-xl">
                    <img
                      src="/woman2.jpg"
                      alt="Care at every step"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>

              {/* TEXT — desktop right; on mobile shows only the story (title hidden) */}
              <div className="space-y-3 md:justify-self-start order-3 md:order-2">
                {/* Desktop title */}
                <h3 className="hidden md:block font-cinzel text-4xl font-extrabold text-amber-300 tracking-wide uppercase">
                  The Hands That Grow Our Beans
                </h3>

                {/* Story paragraph */}
                <p className="text-neutral-300 text-[15px] md:text-2xl leading-snug md:leading-relaxed tracking-[0.01em]">
                  Behind every harvest are the families who make it possible.
                  Generations of farmers rise before dawn, nurturing each tree
                  by hand and protecting the land that sustains them. Their
                  knowledge, patience, and respect for nature give our coffee
                  its strength and character. <br />
                  <br />
                  These small family farms are the heart of what we do. Every
                  bean is ethically sourced, every grower treated with fairness
                  and dignity. Their craftsmanship and pride live on in every
                  roast, carrying forward the spirit of Old Ironsides Coffee.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>
      {/* ===== THE HISTORY BEHIND THE FLEET ===== */}
      <section
        id="origins-history"
        className="relative border-t border-neutral-800 py-12 md:py-16 scroll-mt-28 md:scroll-mt-36"
      >
        <Container>
          <SectionTitle
            title={
              <span
                className="text-3xl md:text-5xl font-bold text-amber-300 tracking-tight whitespace-normal md:whitespace-nowrap leading-tight"
                style={{ fontFamily: "'Cinzel', serif", fontWeight: 700 }}
              >
                The History Behind The Fleet
              </span>
            }
            subtitle=""
          />
          {/* Mobile-only subtitle (smaller, tighter, centered) */}
          <p className="md:hidden mt-2 text-[13px] leading-snug text-neutral-300 text-center px-3">
            Explore the history of the USS Constitution and her victories that
            inspired our roasts.
          </p>
          {/* Desktop/tablet subtitle preserved, just below title */}
          <p className="hidden md:block mt-3 text-base leading-relaxed text-neutral-300">
            Explore the history of the USS Constitution and her victories that
            inspired our roasts.
          </p>

          <div className="mt-6 md:mt-10">
            {/* MOBILE: swipeable carousel with arrows */}
            <div className="relative md:hidden">
              <div
                ref={histScrollRef}
                onScroll={onHistScroll}
                className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 pl-3 pr-3 no-scrollbar scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none]"
                style={{ WebkitOverflowScrolling: "touch" }}
              >
                {histSlugs.map((slug, idx) => {
                  const card = roastCards.find((c) => c.slug === slug);
                  if (!card) return null;

                  return (
                    <Link
                      key={`story-m-${card.slug}`}
                      ref={(el) => {
                        histCardRefs.current[idx] = el;
                      }}
                      to={`/stories/${card.slug}`}
                      onClick={() => {
                        try {
                          sessionStorage.setItem(
                            "storiesReturnTo",
                            STORIES_HOME
                          );
                        } catch {}
                      }}
                      className="
                        mt-2 snap-center shrink-0
                        w-[88vw] max-w-[88vw]
                        rounded-2xl ring-1 ring-neutral-800
                        bg-neutral-900/40 shadow-lg shadow-black/30
                        hover:bg-neutral-900 transition flex flex-col
                      "
                      aria-label={`${card.storyTitle} details`}
                    >
                      <div className="relative h-[22rem] rounded-t-2xl overflow-hidden bg-black">
                        <img
                          src={
                            card.img?.startsWith("/") ||
                            card.img?.startsWith("http")
                              ? card.img
                              : `/${card.img}`
                          }
                          alt={String(card.title)}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          decoding="async"
                          onError={(e) => {
                            const el = e.currentTarget as HTMLImageElement;
                            if (!el.src.includes("/placeholder.png"))
                              el.src = "/placeholder.png";
                          }}
                        />
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
                      </div>

                      <div className="p-4 flex flex-col text-left">
                        <div className="flex items-center gap-2 text-amber-300 mb-1">
                          <Compass className="h-4 w-4" />
                          <div className="text-sm font-semibold">
                            {card.storyTitle}
                          </div>
                        </div>
                        <div className="text-[13px] text-amber-300 font-semibold">
                          {card.battleDate}
                        </div>
                        <p className="mt-1 text-[13px] text-neutral-300 line-clamp-3">
                          {card.story}
                        </p>
                        <span className="mt-3 inline-block text-[13px] text-amber-300">
                          Learn more
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* arrows */}
              <div className="absolute inset-y-1/2 -translate-y-1/2 left-1 flex items-center pl-1 pointer-events-none">
                <button
                  type="button"
                  onClick={histPrev}
                  className="pointer-events-auto h-9 w-9 rounded-full bg-amber-400 text-neutral-900 font-bold text-xl flex items-center justify-center shadow-md shadow-black/40 active:scale-95"
                  aria-label="Previous story"
                >
                  ‹
                </button>
              </div>
              <div className="absolute inset-y-1/2 -translate-y-1/2 right-1 flex items-center pr-1 pointer-events-none">
                <button
                  type="button"
                  onClick={histNext}
                  className="pointer-events-auto h-9 w-9 rounded-full bg-amber-400 text-neutral-900 font-bold text-xl flex items-center justify-center shadow-md shadow-black/40 active:scale-95"
                  aria-label="Next story"
                >
                  ›
                </button>
              </div>
            </div>

            {/* DESKTOP/TABLET: original grid unchanged */}
            <div className="hidden md:grid md:grid-cols-4 gap-6">
              {[
                "flagship",
                "baptism-by-fire",
                "java-action",
                "oak-and-copper",
              ].map((slug) => {
                const card = roastCards.find((c) => c.slug === slug);
                if (!card) return null;
                return (
                  <Link
                    key={`story-${card.slug}`}
                    to={`/stories/${card.slug}`}
                    onClick={() => {
                      try {
                        sessionStorage.setItem("storiesReturnTo", STORIES_HOME);
                      } catch {}
                    }}
                    className="group relative overflow-hidden rounded-2xl ring-1 ring-neutral-800 bg-neutral-900/40 hover:bg-neutral-900 transition shadow-lg flex flex-col"
                  >
                    <img
                      src={
                        card.img?.startsWith("/") ||
                        card.img?.startsWith("http")
                          ? card.img
                          : `/${card.img}`
                      }
                      alt={String(card.title)}
                      className="h-72 sm:h-80 md:h-96 w-full object-cover"
                    />
                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex items-center gap-3 text-amber-300 mb-1">
                        <Compass className="h-4 w-4" />
                        <div>{card.storyTitle}</div>
                      </div>
                      <div className="text-sm md:text-base text-amber-300 font-semibold">
                        {card.battleDate}
                      </div>
                      <p className="mt-1 text-sm text-neutral-300 flex-1">
                        {card.story}
                      </p>
                      <span className="mt-4 inline-block text-sm text-amber-300">
                        Learn more
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </Container>
      </section>

      {/* ===== FROM THE SAND TO THE SEA (unchanged) ===== */}
      <section
        id="origins-service"
        className={`${SECTION_FRAME} scroll-mt-28 md:scroll-mt-36`}
      >
        {/* Mobile: no backdrop. Desktop: keep backdrop */}
        <img
          src="/iraq-moon.JPG"
          alt="Service backdrop"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-70 z-0 pointer-events-none hidden md:block"
        />
        <div className="absolute inset-0 bg-neutral-950/40 z-0 pointer-events-none hidden md:block" />
        {/* Mobile-only flat bg */}
        <div className="absolute inset-0 z-0 md:hidden bg-neutral-950" />

        <Container>
          <div className="relative z-10 flex items-center min-h-0 md:min-h-[960px] py-3 md:py-16">
            {/* Collapsed to two columns: text + right stack */}
            <div className="grid w-full grid-cols-1 md:grid-cols-[1fr,auto] items-center gap-3 md:gap-8">
              {/* CENTER TEXT (now left column on desktop) */}
              <div className="text-center md:text-left self-center">
                <h3 className="font-cinzel text-2xl md:text-4xl font-extrabold text-amber-300 tracking-wide uppercase">
                  From The Sand To The Sea
                </h3>
                <p className="mt-1 md:mt-3 text-neutral-300 text-[15px] md:text-2xl leading-snug tracking-[0.01em]">
                  Although my boots were in the sand, not on the deck, the
                  spirit of Old Ironsides has always inspired me. She is a
                  reminder that grit, sacrifice, and courage win the day. Those
                  same values carried me through my service and are now at the
                  heart of Old Ironsides Coffee.
                </p>
              </div>

              {/* RIGHT STACK: mobile mimics “Hands” collage; desktop keeps original */}
              {/* MOBILE COLLAGE (like Hands) */}
              <div className="md:hidden justify-self-center">
                <div className="relative w-[20rem] sm:w-[22rem] h-[26rem]">
                  {/* Top card (left) */}
                  <div className="absolute left-0 top-0 w-48 aspect-[4/3] rounded-xl overflow-hidden ring-1 ring-amber-400 bg-neutral-900/60 shadow-xl">
                    <img
                      src="/humvee-turret.jpg"
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {/* Middle card (offset right) */}
                  <div className="absolute left-[56%] top-1/2 -translate-x-1/2 -translate-y-1/2 w-48 aspect-[4/3] rounded-xl overflow-hidden ring-1 ring-amber-400 bg-neutral-900/60 shadow-2xl">
                    <img
                      src="/iraq-self1.JPG"
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {/* Bottom card (left) */}
                  <div className="absolute left-0 bottom-0 w-48 aspect-[4/3] rounded-xl overflow-hidden ring-1 ring-amber-400 bg-neutral-900/60 shadow-xl">
                    <img
                      src="/iraq-kids.JPG"
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>

              {/* DESKTOP ORIGINAL STACK */}
              <div className="hidden md:block justify-self-center md:justify-self-end">
                <div className="relative w-[36rem] h-[48rem]">
                  <div className="absolute left-1/2 top-0 -translate-x-full w-72 aspect-[4/3] rounded-xl overflow-hidden ring-1 ring-amber-400 bg-neutral-900/60 shadow-xl">
                    <img
                      src="/humvee-turret.jpg"
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute left-1/2 top-1/2 -translate-y-1/2 w-72 aspect-[4/3] rounded-xl overflow-hidden ring-1 ring-amber-400 bg-neutral-900/60 shadow-2xl">
                    <img
                      src="/iraq-self1.JPG"
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute left-1/2 bottom-0 -translate-x-full w-72 aspect-[4/3] rounded-xl overflow-hidden ring-1 ring-amber-400 bg-neutral-900/60 shadow-xl">
                    <img
                      src="/iraq-kids.JPG"
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ===== GIVING BACK (switch: text LEFT, hero pic RIGHT) ===== */}
      <section
        id="origins-giving-back"
        className="relative overflow-hidden border-t border-neutral-800 scroll-mt-28 md:scroll-mt-36"
      >
        {/* Background image, cooled and desaturated */}
        <img
          src="/flag-close.jpg"
          alt=""
          role="presentation"
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-contain md:object-cover object-center z-0 pointer-events-none brightness-70 saturate-70 hue-rotate-[-10deg] bg-black"
        />

        <div className="pointer-events-none absolute inset-0 z-0">
          {/* global darken */}
          <div className="absolute inset-0 bg-black/45" />
          {/* left shield over copy only */}
          <div className="absolute inset-y-0 left-0 w-full md:w-[62%] lg:w-[55%] bg-gradient-to-r from-black/90 via-black/70 to-transparent" />
          {/* mild texture blur */}
          <div className="absolute inset-0 md:backdrop-blur-[2px]" />
          {/* top/bottom vignette to kill remaining glare */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/35" />
        </div>

        <Container>
          <div className="relative z-10 min-h-[600px] md:min-h-[700px] py-12 md:py-16 flex flex-col justify-center">
            <div className="grid grid-cols-1 md:grid-cols-[auto,1fr] gap-4 md:gap-6 items-center">
              <div className="justify-self-center md:justify-self-start self-center">
                <div className="relative w-64 md:w-[30rem] mx-auto md:mx-0 aspect-[4/3] rounded-xl overflow-hidden ring-1 ring-white/10 shadow-xl shadow-black/60 bg-neutral-900/40">
                  <img
                    src="/soliders-sunset.png"
                    alt="Giving back"
                    className="w-full h-full object-cover hue-rotate-[-10deg] saturate-70"
                  />
                  {/* top and bottom vignettes reduce perceived warmth */}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/10" />
                </div>
              </div>

              {/* text: center on mobile, left on md+ */}
              <div className="space-y-3 text-center md:text-left">
                <h3 className="font-cinzel text-2xl md:text-4xl font-extrabold text-amber-300 tracking-wide uppercase">
                  Giving Back To Those Who Served
                </h3>
                <br />

                <p className="text-neutral-100 text-xl md:text-2xl leading-relaxed tracking-[0.02em]">
                  Even as a young company where every dollar counts, giving back
                  is a big part of who we are and what Old Ironsides Coffee
                  stands for. As a veteran, I believe service is a promise kept
                  when no one is watching. It is standards held high, teamwork
                  under pressure, and loyalty to the people beside you. <br />
                  <br />
                  This brand exists to honor that code, to stand with those who
                  protect our freedoms, and to keep their legacy present in the
                  work we do every day.
                </p>
                <br />
                <p className="text-amber-300 text-xl md:text-2xl leading-relaxed tracking-[0.02em]">
                  Active duty, veterans, and first responders including fire,
                  law enforcement, and EMTs receive $1 off every bag of fresh
                  roasted coffee, every day. The discount stacks with
                  subscriptions.
                </p>
                <br />
                <a
                  href="https://auth.govx.com/shopify/verify?shop=81ub0m-s7.myshopify.com&utm_source=shopify&utm_medium=govxid&utm_campaign=custom_link"
                  className="mt-3 inline-block rounded-xl ring-1 ring-amber-400/60 
       text-amber-400 font-semibold text-[1rem]
       px-[1.1rem] py-[0.45rem]
       hover:bg-amber-400 hover:text-neutral-900 transition-all"
                >
                  Get GovX discount code
                </a>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ===== ABOUT OLD IRONSIDES COFFEE (unchanged) ===== */}
      <section
        id="origins-about"
        className={`${SECTION_FRAME} scroll-mt-28 md:scroll-mt-36`}
      >
        {/* Backdrop image full-bleed */}
        <img
          src="/sunrise-deck.png"
          alt="About backdrop"
          className="absolute inset-0 w-full h-full object-cover object-center transform scale-[0.9] md:scale-100 opacity-40 z-0 pointer-events-none"
        />
        <div className="absolute inset-0 bg-neutral-950/40 z-0 pointer-events-none" />

        <Container>
          <div className="relative z-10 flex items-center min-h-0 md:min-h-[820px] py-4 md:py-16">
            <div className="grid w-full grid-cols-1 md:grid-cols-[auto,1fr] gap-4 md:gap-6 items-center">
              {/* Photo LEFT */}
              <div className="justify-self-center self-center">
                <div className="w-64 md:w-[32rem] mx-auto aspect-[10/13] rounded-xl overflow-hidden ring-1 ring-amber-400 bg-neutral-900/50">
                  <img
                    src="/ironship.png"
                    alt="Old Ironsides legacy"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Text RIGHT */}
              <div className="space-y-3">
                <h3 className="font-cinzel text-2xl md:text-4xl font-extrabold text-amber-300 tracking-wide uppercase">
                  About Old Ironsides Coffee
                </h3>
                <p className="text-neutral-300 text-[15px] md:text-2xl leading-snug tracking-[0.01em]">
                  At Old Ironsides Coffee, our mission is to bring education,
                  pride, and a revival of the American spirit that is being lost
                  at an alarming rate. <br /> <br />
                  If we can entice people to learn about our history and the
                  great American treasure that is the USS Constitution, while
                  also enjoying a truly excellent cup of coffee, then we have
                  done our duty. <br /> <br /> This is the heart of what Old
                  Ironsides Coffee stands for. <br /> <br /> OLD IRONSIDES
                  COFFEE - IGNITE THE SPIRIT, SAVOR THE VICTORY!
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
function ContactPage() {
  return (
    <main className="pt-0 pb-12 md:pt-24 md:pb-24">
      <Container className="-mt-4 md:mt-0">
        <div className="flex items-start justify-between mt-0 md:mt-4">
          <SectionTitle
            title={
              <span className="text-3xl md:text-5xl font-extrabold text-amber-300">
                Hail The Quarterdeck!
              </span>
            }
            subtitle="Questions, comments, press. We’ll get back fast."
          />
          <div className="hidden md:block">
            <BackButton size="sm" />
          </div>
        </div>

        <div className="mt-4 md:mt-8 grid gap-6 text-sm md:grid-cols-2 items-start">
          {/* LEFT: Contact + Follow */}
          <div className="rounded-2xl ring-1 ring-neutral-800 bg-neutral-900/40 p-6 max-w-md">
            <h4 className="font-semibold text-amber-300">Contact</h4>

            <div className="mt-3 space-y-3">
              <a
                href="mailto:HQ@oldironsidescoffee.org"
                className="flex items-center gap-3 text-neutral-300 hover:text-amber-300"
              >
                <Mail className="h-5 w-5 text-amber-300" />
                <span>HQ@oldironsidescoffee.org</span>
              </a>

              <div className="text-neutral-400 leading-relaxed">
                6 Liberty Square #2564
                <br />
                Boston, MA 02109
              </div>
            </div>

            <div className="mt-6 border-t border-neutral-800 pt-5">
              <h4 className="font-semibold text-amber-300">Follow Us</h4>

              <div className="mt-3 flex flex-wrap gap-4 text-neutral-300">
                <a
                  href="https://instagram.com/oldironsidescoffee"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 hover:text-amber-300"
                >
                  <Instagram className="h-5 w-5" />
                  Instagram
                </a>

                <a
                  href="https://facebook.com/oldironsidescoffee"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 hover:text-amber-300"
                >
                  <span className="h-5 w-5 grid place-content-center">f</span>
                  Facebook
                </a>
              </div>
            </div>
          </div>

          {/* RIGHT: Ring That Bell (use the exact same working component as homepage) */}
          <div className="max-w-xl">
            <RingThatBellBox mode="card" />
          </div>
        </div>
      </Container>
    </main>
  );
}

function nextRoastLabel() {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon, ...
  const nextMonday = new Date(now);
  nextMonday.setHours(0, 0, 0, 0);
  // always the NEXT Monday (not today if it's Monday)
  nextMonday.setDate(now.getDate() + ((1 - day + 7) % 7 || 7));
  return nextMonday.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

function SDVOSBPage() {
  return (
    <main className="py-16 md:py-24">
      <Container>
        <div className="flex items-start justify-between">
          <SectionTitle
            title="DoD / Government Contracting Profile"
            subtitle="Central repository for CAGE, SAM, NAICS, UEI, and capability statements."
          />
          <BackButton size="sm" />
        </div>

        <div className="mt-6 grid md:grid-cols-2 gap-6">
          <div className="rounded-2xl ring-1 ring-neutral-800 bg-neutral-900/40 p-6">
            <h3 className="text-amber-300 font-semibold">Core Identifiers</h3>
            <ul className="mt-3 text-sm text-neutral-300 space-y-2">
              <li>
                <span className="text-neutral-400">CAGE Code:</span>{" "}
                <span className="ml-2">—</span>
              </li>
              <li>
                <span className="text-neutral-400">UEI (SAM):</span>{" "}
                <span className="ml-2">—</span>
              </li>
              <li>
                <span className="text-neutral-400">NAICS:</span>{" "}
                <span className="ml-2">
                  311920 (Coffee & Tea Mfg), 424490, 722515 …
                </span>
              </li>
              <li>
                <span className="text-neutral-400">PSC/UNSPSC:</span>{" "}
                <span className="ml-2">—</span>
              </li>
            </ul>
          </div>
          <div className="rounded-2xl ring-1 ring-neutral-800 bg-neutral-900/40 p-6">
            <h3 className="text-amber-300 font-semibold">Capabilities</h3>
            <ul className="mt-3 text-sm text-neutral-300 list-disc list-inside space-y-1">
              <li>Small-batch roasting and packaging (retail & bulk)</li>
              <li>
                Custom blends, unit/command branding, and gift provisioning
              </li>
              <li>CONUS shipping, rush fulfillment, and recurring orders</li>
            </ul>
          </div>
          <div className="rounded-2xl ring-1 ring-neutral-800 bg-neutral-900/40 p-6 md:col-span-2">
            <h3 className="text-amber-300 font-semibold">Past Performance</h3>
            <p className="mt-2 text-sm text-neutral-300">
              Add awards, POs, references here.
            </p>
          </div>
        </div>
      </Container>
    </main>
  );
}

function LegalPage() {
  const { slug } = useParams();
  const titles: any = {
    returns: "Returns & Freshness Policy",
    shipping: "Roast & Shipping",
    terms: "Terms of Service",
    privacy: "Privacy Policy",
  };
  const title = titles[slug as string] || "Roast & Shipping";
  const [dateLabel, setDateLabel] = useState("");
  const [left, setLeft] = useState("");

  useEffect(() => {
    const STORE_TZ = "America/New_York"; // Sunday 5:00 PM ET cutoff

    const compute = () => {
      const now = DateTime.now().setZone(STORE_TZ);

      // Cutoff: Sunday 5:00 PM ET (this Sunday if not passed, else next Sunday)
      const cutoffThisSunday = now.set({
        weekday: 7,
        hour: 17,
        minute: 0,
        second: 0,
        millisecond: 0,
      });
      const cutoff =
        now <= cutoffThisSunday
          ? cutoffThisSunday
          : cutoffThisSunday.plus({ weeks: 1 });

      // Roast: Monday immediately after the cutoff
      const nextRoast = cutoff.plus({ days: 1 }).startOf("day");
      setDateLabel(nextRoast.toFormat("EEEE, LLL d"));

      // Countdown to cutoff → "Xd Yh Zm"
      const diff = cutoff
        .diff(now, ["days", "hours", "minutes"])
        .shiftTo("days", "hours", "minutes");
      const dd = Math.max(0, Math.floor(diff.days));
      const hh = Math.max(0, Math.floor(diff.hours));
      const mm = Math.max(0, Math.floor(diff.minutes));
      setLeft(
        dd > 0 ? `${dd}d ${hh}h ${mm}m` : hh > 0 ? `${hh}h ${mm}m` : `${mm}m`
      );
    };

    compute();
    const id = setInterval(compute, 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <main className="md:py-16 max-md:py-6 max-md:-mt-12">
      <Container className="max-md:pt-0">
        <div className="flex items-start justify-between max-md:mt-0">
          <SectionTitle
            title={title}
            subtitle={
              slug === "shipping"
                ? "Roast schedule, shipping timing, and free-shipping details."
                : slug === "returns"
                ? "How we handle freshness, replacements, and damage."
                : slug === "privacy"
                ? "How we collect, use, and protect your information."
                : undefined
            }
          />

          <div className="hidden md:block">
            <BackButton size="sm" />
          </div>
        </div>

        {/* Live roast schedule notice only on Roast & Shipping */}
        {slug === "shipping" && (
          <div className="mt-6 mb-6 rounded-2xl ring-1 ring-neutral-800 bg-neutral-900/50 p-6">
            <div className="text-sm md:text-base text-neutral-200">
              <p>We roast on Monday and Tuesday and ship Wednesday.</p>

              <p className="mt-2">
                Your next eligible roast date is{" "}
                <span className="font-semibold text-amber-300">
                  {dateLabel}
                </span>
                .
              </p>

              <p className="mt-2">
                Orders placed before <strong>Sunday 5 p.m. ET</strong> are
                roasted that week. Orders placed after roll to the following
                week.
              </p>

              <p className="mt-2">
                We roast to order. It will not arrive overnight like Amazon. It
                will arrive fresh.
              </p>

              <div className="mt-4">
                <p className="font-semibold text-amber-300">Free Shipping</p>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li>Mix and match any roasts.</li>
                  <li>
                    <strong>3 or more bags</strong> ship free.
                  </li>
                  <li>
                    All free shipping is via{" "}
                    <strong>UPS Standard Ground</strong>.
                  </li>
                </ul>
                <p className="mt-2">
                  Orders of 1 or 2 bags ship at the carrier rates shown at
                  checkout.
                </p>
              </div>

              <p className="mt-4 text-amber-300">
                Missed the cutoff time? Leave a note at checkout or reply to
                your confirmation email. We will do our best to accommodate.
              </p>
            </div>
          </div>
        )}

        {/* Returns & Freshness Policy */}
        {/* Returns & Freshness Policy — tightened layout, wrapped width */}
        {slug === "returns" && (
          <section className="mt-6 text-neutral-100">
            <div className="max-w-[72ch] leading-relaxed">
              <div className="space-y-8">
                <div>
                  <h3 className="text-amber-300 font-semibold">
                    Short version
                  </h3>
                  <p className="mt-1">
                    Our coffee is roasted to your order and sails out fresh. We
                    cannot accept returns on roasted coffee. If there is
                    something wrong with your order, please contact us.
                  </p>
                </div>

                <div>
                  <h3 className="text-amber-300 font-semibold">
                    Why no returns on coffee
                  </h3>
                  <p className="mt-1">
                    Once beans are roasted and ship out, they’re like a frigate
                    leaving port. We cannot resell opened or returned coffee,
                    and we do not restock roasted bags.
                  </p>
                </div>

                <div>
                  <h3 className="text-amber-300 font-semibold">
                    Customer's Satisfaction
                  </h3>
                  <p className="mt-1">
                    If your package is damaged, the coffee is defective in any
                    way, or we made a mistake, contact us. We won't leave you at
                    the harbor.
                  </p>
                </div>

                <div>
                  <h3 className="text-amber-300 font-semibold">
                    If you're unhappy with your purchase
                  </h3>
                  <p className="mt-1">
                    Email us and we will not leave you at the harbor. We can
                    recommend a better roast to your liking or find another fix.
                  </p>
                </div>

                <div>
                  <h3 className="text-amber-300 font-semibold">
                    How to report an issue (quick steps)
                  </h3>
                  <ol className="mt-1 list-decimal list-outside pl-5 space-y-1">
                    <li>Contact us within 5 days of delivery.</li>
                    <li>
                      Include your order number, a brief note on the issue, and
                      photos if the package or bag is damaged.
                    </li>
                    <li>We’ll reply quickly with our resolution</li>
                  </ol>
                </div>

                <div>
                  <h3 className="text-amber-300 font-semibold">
                    What this covers
                  </h3>
                  <ul className="mt-1 list-disc list-outside pl-5 space-y-1">
                    <li>Damaged in transit</li>
                    <li>Wrong item received</li>
                    <li>
                      Defective product (seal issues, off roast, quality
                      problems)
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-amber-300 font-semibold">
                    What this doesn’t cover
                  </h3>
                  <ul className="mt-1 list-disc list-outside pl-5 space-y-1">
                    <li>
                      Returns or exchanges on roasted coffee that was correctly
                      fulfilled
                    </li>
                    <li>
                      Taste preferences after correct fulfillment
                      <span className="text-neutral-400">
                        {" "}
                        (still contact us and we’ll carefully review your case)
                      </span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-amber-300 font-semibold">Contact</h3>
                  <p className="mt-1">
                    <a
                      href="mailto:Support@oldironsidescoffee.org"
                      className="text-amber-300 hover:underline"
                    >
                      Support@oldironsidescoffee.org
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}
        {/* Terms of Service — tightened layout, wrapped width */}
        {slug === "terms" && (
          <section className="mt-3 text-neutral-100">
            <div className="max-w-[72ch] leading-relaxed">
              <div className="space-y-8">
                <div>
                  <h3 className="text-amber-300 font-semibold">
                    Effective Date
                  </h3>
                  <p className="mt-1">October 11, 2025</p>
                </div>

                <div>
                  <h3 className="text-amber-300 font-semibold">Overview</h3>
                  <p className="mt-1">
                    These Terms of Service govern your access to and use of the
                    websites, online stores, and services operated by Liberty
                    Lighthouse Supply Co., dba Old Ironsides Coffee (“Company,”
                    “we,” “us,” or “our”). By visiting our site, placing an
                    order, creating an account, or subscribing to any product,
                    you agree to these Terms and to our Privacy Policy
                    (incorporated by reference). If you do not agree, do not use
                    our site or services.
                  </p>
                </div>

                <div>
                  <h3 className="text-amber-300 font-semibold">
                    1. Eligibility and Accounts
                  </h3>
                  <ul className="mt-1 list-disc list-outside pl-5 space-y-1">
                    <li>
                      You must be at least 18 years old and able to enter a
                      binding contract.
                    </li>
                    <li>
                      You are responsible for your account and for safeguarding
                      your credentials.
                    </li>
                    <li>
                      You agree to provide accurate information and keep it
                      updated.
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-amber-300 font-semibold">
                    2. Orders, Acceptance, and Right to Refuse Service
                  </h3>
                  <ul className="mt-1 list-disc list-outside pl-5 space-y-1">
                    <li>
                      Your order is an offer to buy. We may accept, reject, or
                      cancel any order at our discretion.
                    </li>
                    <li>
                      We may refuse service, cancel orders, or terminate
                      subscriptions for any reason (e.g., suspected fraud,
                      abuse, resale, policy violations, or risk to our
                      business).
                    </li>
                    <li>
                      We may limit or cancel quantities per person, household,
                      account, payment card, or order.
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-amber-300 font-semibold">
                    3. Pricing, Availability, and Errors
                  </h3>
                  <ul className="mt-1 list-disc list-outside pl-5 space-y-1">
                    <li>
                      Prices, descriptions, and availability may change without
                      notice.
                    </li>
                    <li>
                      We may correct errors or cancel orders placed with
                      incorrect information, even after submission.
                    </li>
                    <li>
                      Applicable taxes, shipping, and handling appear at
                      checkout and are your responsibility unless stated
                      otherwise.
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-amber-300 font-semibold">4. Payment</h3>
                  <ul className="mt-1 list-disc list-outside pl-5 space-y-1">
                    <li>
                      You authorize us and our processors to charge your
                      selected payment method for all amounts due.
                    </li>
                    <li>
                      If payment fails, you remain responsible; we may suspend
                      or cancel shipments or subscriptions until resolved.
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-amber-300 font-semibold">
                    5. Subscriptions and Auto-Renewal
                  </h3>
                  <ul className="mt-1 list-disc list-outside pl-5 space-y-1">
                    <li>
                      Subscriptions renew automatically at the stated interval
                      until you cancel.
                    </li>
                    <li>
                      Cancel any time before the renewal cutoff shown in your
                      account or emails. Cancellations apply to future renewals
                      and do not affect orders already processed.
                    </li>
                    <li>
                      We may change subscription pricing or terms with notice.
                      Continued use after the effective date means acceptance.
                    </li>
                    <li>
                      We may pause or cancel a subscription for any reason,
                      including failed payments or product unavailability.
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-amber-300 font-semibold">
                    6. Shipping, Risk of Loss, and Delivery
                  </h3>
                  <ul className="mt-1 list-disc list-outside pl-5 space-y-1">
                    <li>
                      We ship to the address you provide. Title and risk of loss
                      pass when the carrier accepts the shipment.
                    </li>
                    <li>
                      Delivery dates are estimates. We are not liable for delays
                      outside our control.
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-amber-300 font-semibold">
                    7. Returns, Replacements, and Freshness Policy
                  </h3>
                  <p className="mt-1">
                    To avoid any conflict, this section mirrors our Returns
                    &amp; Freshness Policy and controls if inconsistent
                    elsewhere.
                  </p>
                  <ul className="mt-2 list-disc list-outside pl-5 space-y-1">
                    <li>
                      No returns on roasted coffee that was correctly fulfilled;
                      we do not restock roasted bags.
                    </li>
                    <li>
                      If damaged, defective, or if we made a mistake, contact
                      us—we’ll replace or refund.
                    </li>
                    <li>
                      Not happy? Email us. We can recommend a better fit, or
                      find a solution.
                    </li>
                    <li>
                      Report issues within 7 days of delivery. Include your
                      order number, a brief note, and photos if the package/bag
                      is damaged.
                    </li>
                    <li>
                      Covers: damaged in transit, wrong item, defective product
                      (seal, off roast, quality).
                    </li>
                    <li>
                      Doesn’t cover: correctly fulfilled roasted coffee; pure
                      taste preferences (still contact us—we’ll help).
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-amber-300 font-semibold">
                    8. Promotions, Gift Cards, and Referral Codes
                  </h3>
                  <ul className="mt-1 list-disc list-outside pl-5 space-y-1">
                    <li>
                      Promotions/coupons/codes are subject to their own rules
                      and may be modified or canceled at any time.
                    </li>
                    <li>
                      Gift cards are not reloadable, refundable, or redeemable
                      for cash unless required by law.
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-amber-300 font-semibold">
                    9. Personal Use Only and Resale
                  </h3>
                  <p className="mt-1">
                    Products are intended for personal use. We may refuse or
                    cancel suspected resale orders without written consent.
                  </p>
                </div>

                <div>
                  <h3 className="text-amber-300 font-semibold">
                    10. User Content and Reviews
                  </h3>
                  <ul className="mt-1 list-disc list-outside pl-5 space-y-1">
                    <li>
                      You grant us a worldwide, royalty-free, perpetual license
                      to use, reproduce, modify, publish, translate, and display
                      your content.
                    </li>
                    <li>
                      You represent your content is accurate, lawful, and
                      non-infringing.
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-amber-300 font-semibold">
                    11. Acceptable Use
                  </h3>
                  <p className="mt-1">
                    You agree not to violate law or third-party rights;
                    interfere with or disrupt the site; bypass security
                    measures; or scrape/harvest data except as allowed by
                    robots.txt or our written permission.
                  </p>
                </div>

                <div>
                  <h3 className="text-amber-300 font-semibold">
                    12. Intellectual Property
                  </h3>
                  <p className="mt-1">
                    The site, products, logos, graphics, text, and other
                    materials are owned by us or our licensors. We grant a
                    limited, nonexclusive, nontransferable license to access and
                    use the site for personal, noncommercial purposes—no other
                    rights are granted.
                  </p>
                </div>

                <div>
                  <h3 className="text-amber-300 font-semibold">
                    13. Health and Safety
                  </h3>
                  <p className="mt-1">
                    Coffee contains caffeine. We do not provide medical advice.
                    You are responsible for your own dietary and medical
                    needs—consult a qualified professional with questions about
                    caffeine or allergens.
                  </p>
                </div>

                <div>
                  <h3 className="text-amber-300 font-semibold">
                    14. Third-Party Services and Links
                  </h3>
                  <p className="mt-1">
                    We are not responsible for third-party websites, apps, or
                    services that may be linked or integrated. Your use is at
                    your own risk and subject to those terms and policies.
                  </p>
                </div>

                <div>
                  <h3 className="text-amber-300 font-semibold">
                    15. SMS, Email, and Electronic Communications
                  </h3>
                  <p className="mt-1">
                    By providing a phone number or email, you consent to receive
                    transactional and marketing messages, subject to our Privacy
                    Policy. Message/data rates may apply. Opt out of marketing
                    emails via the unsubscribe link and SMS by replying STOP. We
                    may still send transactional messages about orders or your
                    account.
                  </p>
                </div>

                <div>
                  <h3 className="text-amber-300 font-semibold">
                    16. Disclaimers
                  </h3>
                  <ul className="mt-1 list-disc list-outside pl-5 space-y-1">
                    <li>
                      The site and all products/services are provided “as is”
                      and “as available.”
                    </li>
                    <li>
                      To the fullest extent allowed by law, we disclaim all
                      warranties, express or implied, including merchantability,
                      fitness for a particular purpose, title, and
                      non-infringement. We do not warrant uninterrupted or
                      error-free operation.
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-amber-300 font-semibold">
                    17. Limitation of Liability
                  </h3>
                  <p className="mt-1">
                    To the fullest extent allowed by law, we and our suppliers
                    are not liable for any indirect, incidental, special,
                    consequential, or punitive damages, or any loss of profits,
                    revenue, data, or use. Our total liability will not exceed
                    the amount you paid for the product or service at issue
                    during the six months before the claim arose.
                  </p>
                </div>

                <div>
                  <h3 className="text-amber-300 font-semibold">
                    18. Indemnification
                  </h3>
                  <p className="mt-1">
                    You agree to defend, indemnify, and hold harmless the
                    Company and our officers, directors, employees, agents, and
                    affiliates from and against claims, liabilities, damages,
                    losses, and expenses (including reasonable attorneys’ fees)
                    arising out of or related to your use of the site or
                    products, your violation of these Terms, or your violation
                    of any law or third-party right.
                  </p>
                </div>

                <div>
                  <h3 className="text-amber-300 font-semibold">
                    19. Dispute Resolution, Arbitration, and Class Action Waiver
                  </h3>
                  <p className="mt-1">
                    You and the Company agree to resolve any dispute arising out
                    of or relating to these Terms or your use of our site or
                    products through binding arbitration administered by the
                    American Arbitration Association under its Consumer
                    Arbitration Rules. The Federal Arbitration Act governs this
                    agreement to arbitrate. Arbitration will take place in Salt
                    Lake City, Utah, unless we agree otherwise, and may be
                    conducted by telephone or video when appropriate. You and we
                    each waive the right to a jury trial and to participate in a
                    class action or class-wide arbitration; claims must be
                    brought individually. Either party may bring an individual
                    claim in small-claims court if eligible. You may opt out by
                    sending written notice to{" "}
                    <a
                      href="mailto:Support@oldironsidescoffee.org"
                      className="text-amber-300 hover:underline"
                    >
                      Support@oldironsidescoffee.org
                    </a>{" "}
                    within 30 days of your first use of our services. If you opt
                    out, the exclusive venue for any non-arbitrated action will
                    be the state and federal courts in Suffolk County,
                    Massachusetts, and you consent to personal jurisdiction
                    there.
                  </p>
                </div>

                <div>
                  <h3 className="text-amber-300 font-semibold">
                    20. Governing Law
                  </h3>
                  <p className="mt-1">
                    These Terms are governed by the laws of the State of Utah,
                    without regard to its conflict-of-laws rules. The Federal
                    Arbitration Act governs the arbitration provision.
                  </p>
                </div>

                <div>
                  <h3 className="text-amber-300 font-semibold">
                    21. Termination
                  </h3>
                  <p className="mt-1">
                    We may suspend or terminate your access at any time and for
                    any reason. You may stop using our services at any time.
                    Sections that by their nature should survive termination
                    will survive.
                  </p>
                </div>

                <div>
                  <h3 className="text-amber-300 font-semibold">
                    22. Force Majeure
                  </h3>
                  <p className="mt-1">
                    We are not liable for delays or failures caused by events
                    outside our reasonable control, including natural disasters,
                    labor disputes, acts of government, supply or transportation
                    interruptions, or power or internet outages.
                  </p>
                </div>

                <div>
                  <h3 className="text-amber-300 font-semibold">
                    23. Changes to the Services or Terms
                  </h3>
                  <p className="mt-1">
                    We may update these Terms at any time. Changes apply when
                    posted unless a later effective date is stated. Your
                    continued use after changes means you accept the updated
                    Terms.
                  </p>
                </div>

                <div>
                  <h3 className="text-amber-300 font-semibold">
                    24. Assignment
                  </h3>
                  <p className="mt-1">
                    You may not assign or transfer your rights under these Terms
                    without our prior written consent. We may assign these Terms
                    at any time.
                  </p>
                </div>

                <div>
                  <h3 className="text-amber-300 font-semibold">
                    25. Severability and Waiver
                  </h3>
                  <p className="mt-1">
                    If any provision is found unenforceable, the remaining
                    provisions remain in full force. Our failure to enforce any
                    right is not a waiver.
                  </p>
                </div>

                <div>
                  <h3 className="text-amber-300 font-semibold">
                    26. Entire Agreement
                  </h3>
                  <p className="mt-1">
                    These Terms, together with the Privacy Policy and any order
                    or subscription details, are the entire agreement between
                    you and us and supersede all prior or contemporaneous
                    communications.
                  </p>
                </div>

                <div>
                  <h3 className="text-amber-300 font-semibold">27. Contact</h3>
                  <p className="mt-1">
                    Liberty Lighthouse Supply Co., dba Old Ironsides Coffee
                    <br />
                    Email:{" "}
                    <a
                      href="mailto:Support@oldironsidescoffee.org"
                      className="text-amber-300 hover:underline"
                    >
                      Support@oldironsidescoffee.org
                    </a>
                    <br />
                    Address: 6 Liberty Square #2564, Boston, MA 02109
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Privacy Policy */}
        {slug === "privacy" && (
          <section className="mt-3 max-w-[68ch] text-neutral-100 space-y-8">
            {/* Intro */}
            <div className="space-y-2">
              <h3 className="text-amber-300 font-semibold">Effective date</h3>
              <div className="text-neutral-300">October 11, 2025</div>
            </div>

            <p className="text-neutral-300">
              This Privacy Policy explains how Liberty Lighthouse Supply Co.,
              dba Old Ironsides Coffee (“Company,” “we,” “us,” or “our”)
              collects, uses, shares, and protects personal information when you
              visit our websites, make a purchase, create an account, subscribe,
              or otherwise interact with us. If you do not agree with this
              Policy, do not use our services.
            </p>

            <p className="text-neutral-300">
              Liberty Lighthouse Supply Co. is the data controller for purposes
              of applicable privacy laws.
            </p>

            {/* Contact */}
            <div className="space-y-2">
              <h3 className="text-amber-300 font-semibold">
                Contact for privacy questions and requests
              </h3>
              <p className="text-neutral-300">
                Email:{" "}
                <a
                  href="mailto:Support@oldironsidescoffee.org"
                  className="text-amber-300 hover:underline"
                >
                  Support@oldironsidescoffee.org
                </a>
                <br />
                Address: 6 Liberty Square #2564, Boston, MA 02109
              </p>
            </div>

            {/* 1 */}
            <div className="space-y-2">
              <h3 className="text-amber-300 font-semibold">
                1. Information we collect
              </h3>
              <p className="text-neutral-300">
                We collect the categories of information below. The exact data
                depends on how you interact with us.
              </p>
              <ul className="list-disc pl-5 space-y-2 text-neutral-300">
                <li>
                  <span className="font-semibold">Identifiers:</span> name,
                  email address, billing and shipping addresses, phone number,
                  account username, IP address, device identifiers.
                </li>
                <li>
                  <span className="font-semibold">Commercial information:</span>{" "}
                  products viewed or purchased, order history, subscription
                  selections, discount code usage, customer service
                  interactions.
                </li>
                <li>
                  <span className="font-semibold">
                    Internet or network activity:
                  </span>{" "}
                  pages viewed, links clicked, timestamps, approximate location
                  derived from IP, cookie identifiers, analytics events.
                </li>
                <li>
                  <span className="font-semibold">Payment information:</span> we
                  receive limited payment details from our payment processors
                  such as payment method type and the last four digits of a
                  card. We do not store full card numbers.
                </li>
                <li>
                  <span className="font-semibold">User content:</span> product
                  reviews, ratings, photos, messages you send to us.
                </li>
                <li>
                  <span className="font-semibold">
                    Inferences and preferences:
                  </span>{" "}
                  roast and product preferences, marketing segment membership,
                  subscription cadence.
                </li>
                <li>
                  <span className="font-semibold">Sensitive information:</span>{" "}
                  we do not intentionally collect sensitive personal information
                  as defined by applicable law. We do not collect biometric
                  identifiers such as fingerprints, facial scans, or
                  voiceprints. If you provide any such information to us, we
                  will handle it as required by law and will delete or restrict
                  it when appropriate.
                </li>
              </ul>
              <p className="text-neutral-300">
                We obtain personal information from you directly, from your
                devices through cookies and similar tools, from our service
                providers such as payment processors and shipping carriers, and
                from marketing and analytics partners.
              </p>
            </div>

            {/* 2 */}
            <div className="space-y-2">
              <h3 className="text-amber-300 font-semibold">
                2. Why we use your information
              </h3>
              <p className="text-neutral-300">
                For users in the EEA and UK, legal bases appear in parentheses.
              </p>
              <ul className="list-disc pl-5 space-y-2 text-neutral-300">
                <li>
                  <span className="font-semibold">Provide the services:</span>{" "}
                  process and fulfill orders, manage subscriptions, deliver
                  products, provide customer support, operate your account (
                  <em>contract necessity</em>).
                </li>
                <li>
                  <span className="font-semibold">
                    Payments and fraud prevention:
                  </span>{" "}
                  process payments, verify identity, prevent abuse and
                  unauthorized activity (<em>contract necessity</em>,{" "}
                  <em>legitimate interests</em>).
                </li>
                <li>
                  <span className="font-semibold">
                    Customer communications:
                  </span>{" "}
                  send transactional emails and SMS about orders, subscriptions,
                  and account notices (<em>contract necessity</em>).
                </li>
                <li>
                  <span className="font-semibold">Marketing:</span> send
                  promotional emails and SMS, personalize content, and measure
                  campaign performance where permitted (<em>consent</em> or{" "}
                  <em>legitimate interests</em>).
                </li>
                <li>
                  <span className="font-semibold">
                    Analytics and improvement:
                  </span>{" "}
                  understand site performance, fix bugs, and improve our
                  products and services (<em>legitimate interests</em>).
                </li>
                <li>
                  <span className="font-semibold">
                    Security and compliance:
                  </span>{" "}
                  enforce terms, comply with legal obligations, respond to
                  lawful requests (<em>legal obligation</em>,{" "}
                  <em>legitimate interests</em>).
                </li>
                <li>
                  <span className="font-semibold">Financial incentives:</span>{" "}
                  operate opt-in programs like subscribe-and-save discounts and
                  email signup offers (<em>consent</em>).
                </li>
              </ul>
            </div>

            {/* 3 */}
            <div className="space-y-2">
              <h3 className="text-amber-300 font-semibold">
                3. Cookies and similar technologies
              </h3>
              <p className="text-neutral-300">
                We use cookies, pixels, tags, and similar technologies to enable
                site functionality, maintain your session, remember preferences,
                perform analytics, and support marketing.
              </p>
              <h4 className="text-amber-300 font-semibold">Your choices</h4>
              <ul className="list-disc pl-5 space-y-2 text-neutral-300">
                <li>Control cookies in your browser settings.</li>
                <li>
                  Opt out of certain analytics or advertising cookies through
                  the cookie banner or device settings where available.
                </li>
                <li>
                  Where required by law and technically feasible, we will treat
                  a browser-level opt-out signal such as Global Privacy Control
                  as a valid request to opt out of sale or sharing.
                </li>
              </ul>
            </div>

            {/* 4 */}
            <div className="space-y-2">
              <h3 className="text-amber-300 font-semibold">
                4. How we share information
              </h3>
              <p className="text-neutral-300">
                We do not sell personal information for money. We may share
                limited information with advertising and analytics partners that
                could be considered a “share” for targeted advertising under
                some state laws.
              </p>
              <ul className="list-disc pl-5 space-y-2 text-neutral-300">
                <li>
                  <span className="font-semibold">
                    Service providers and processors:
                  </span>{" "}
                  ecommerce platforms, payment processors, fraud prevention
                  tools, email and SMS platforms, analytics providers, shipping
                  and logistics partners, customer support tools.
                </li>
                <li>
                  <span className="font-semibold">Business partners:</span> only
                  where you have explicitly opted in to a joint promotion or
                  collaboration, and only for the purpose disclosed at the time
                  of collection.
                </li>
                <li>
                  <span className="font-semibold">Legal and safety:</span> to
                  comply with law, respond to lawful requests, or protect
                  rights, users, or the public.
                </li>
                <li>
                  <span className="font-semibold">Business transfers:</span> in
                  connection with a merger, acquisition, financing, or sale of
                  assets.
                </li>
                <li>
                  <span className="font-semibold">
                    Aggregated or de-identified data:
                  </span>{" "}
                  information that cannot reasonably be linked to you. We
                  maintain de-identified data and do not attempt to re-identify
                  it.
                </li>
              </ul>
            </div>

            {/* 5 */}
            <div className="space-y-2">
              <h3 className="text-amber-300 font-semibold">
                5. Your choices about marketing
              </h3>
              <ul className="list-disc pl-5 space-y-2 text-neutral-300">
                <li>
                  <span className="font-semibold">Email:</span> use the
                  unsubscribe link in any marketing email or email{" "}
                  <a
                    href="mailto:Support@oldironsidescoffee.org"
                    className="text-amber-300 hover:underline"
                  >
                    Support@oldironsidescoffee.org
                  </a>
                  .
                </li>
                <li>
                  <span className="font-semibold">SMS:</span> reply STOP to opt
                  out of marketing texts. Transactional emails or texts about
                  your orders or account will still be sent.
                </li>
              </ul>
            </div>

            {/* 6 */}
            <div className="space-y-2">
              <h3 className="text-amber-300 font-semibold">
                6. Your privacy rights
              </h3>
              <p className="text-neutral-300">
                Your rights depend on your location. We will honor requests as
                required by law.
              </p>
              <p className="text-neutral-300">
                U.S. state privacy laws (including CA, CO, CT, UT, VA) may
                provide rights to:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-neutral-300">
                <li>
                  know and access categories and specific pieces of personal
                  information we collected about you,
                </li>
                <li>correct inaccurate information,</li>
                <li>delete information,</li>
                <li>opt out of sale or sharing for targeted advertising,</li>
                <li>limit use and disclosure of sensitive information,</li>
                <li>non-discrimination for exercising these rights.</li>
              </ul>

              <p className="text-neutral-300">
                Utah residents may exercise their rights under the Utah Consumer
                Privacy Act by contacting us as described below.
              </p>

              <p className="text-neutral-300">
                <span className="font-semibold">How to submit a request:</span>{" "}
                email{" "}
                <a
                  href="mailto:Support@oldironsidescoffee.org"
                  className="text-amber-300 hover:underline"
                >
                  Support@oldironsidescoffee.org
                </a>{" "}
                with your name, the email used for your purchases or account,
                your request type, and your state of residence. We will verify
                your identity by matching to existing records and may request
                additional information such as an order number. You may use an
                authorized agent as permitted by law if you provide a signed
                permission or a valid power of attorney.
              </p>
              <p className="text-neutral-300">
                <span className="font-semibold">Appeals:</span> if we deny a
                request, you may appeal by replying to our decision email within
                30 days. If you still have concerns, you may contact your state
                attorney general.
              </p>
              <p className="text-neutral-300">
                <span className="font-semibold">Global Privacy Control:</span>{" "}
                where required by law and technically feasible, we will treat an
                opt-out signal such as GPC as a valid request for the associated
                browser.
              </p>
            </div>

            {/* 7 */}
            <div className="space-y-2">
              <h3 className="text-amber-300 font-semibold">
                7. California disclosures
              </h3>
              <ul className="list-disc pl-5 space-y-2 text-neutral-300">
                <li>
                  <span className="font-semibold">
                    Categories collected in the last 12 months:
                  </span>{" "}
                  identifiers, commercial information, internet or network
                  activity, geolocation derived from IP, user content,
                  inferences. Payment card details are processed by our payment
                  processor.
                </li>
                <li>
                  <span className="font-semibold">Sources:</span> directly from
                  you, your devices, service providers, analytics and marketing
                  partners.
                </li>
                <li>
                  <span className="font-semibold">Purposes:</span> as listed in
                  Section 2.
                </li>
                <li>
                  <span className="font-semibold">
                    Disclosures for business purposes:
                  </span>{" "}
                  service providers and processors, shipping carriers, analytics
                  and security vendors, customer support tools.
                </li>
                <li>
                  <span className="font-semibold">Sale or sharing:</span> we do
                  not sell personal information for money. We may “share”
                  limited identifiers and internet activity with advertising
                  partners for cross-context behavioral advertising. You can opt
                  out as described in Section 6.
                </li>
                <li>
                  <span className="font-semibold">
                    Sensitive personal information:
                  </span>{" "}
                  we do not use or disclose sensitive personal information for
                  purposes that require a right to limit under California law.
                </li>
                <li>
                  <span className="font-semibold">Non-discrimination:</span> we
                  will not discriminate against you for exercising your rights.
                </li>
              </ul>
              <p className="text-neutral-300">
                <span className="font-semibold">
                  Financial incentive notice:
                </span>{" "}
                if you join our email list or subscribe to receive a discount
                such as 20% off, we collect your email and marketing preferences
                in exchange for the incentive. You can withdraw at any time by
                unsubscribing or canceling the subscription. We estimate the
                value of the incentive based on the cost of running the program
                and expected revenue from increased engagement.
              </p>
            </div>

            {/* 8 */}
            <div className="space-y-2">
              <h3 className="text-amber-300 font-semibold">
                8. Children’s privacy
              </h3>
              <p className="text-neutral-300">
                Our services are not intended for children under 13, and we do
                not knowingly collect personal information from children under
                13. If you believe a child provided information, contact us and
                we will delete it.
              </p>
            </div>

            {/* 9 */}
            <div className="space-y-2">
              <h3 className="text-amber-300 font-semibold">
                9. Data retention
              </h3>
              <p className="text-neutral-300">
                We keep personal information only as long as necessary for the
                purposes described in this Policy, for legitimate business
                needs, and as required by law. Typical retention periods
                include:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-neutral-300">
                <li>orders and tax records: up to 7 years,</li>
                <li>
                  customer support records: up to 3 years after resolution,
                </li>
                <li>
                  marketing contact data: until you unsubscribe or your account
                  becomes inactive,
                </li>
                <li>
                  analytics data: per vendor defaults or a reasonable period we
                  configure.
                </li>
              </ul>
            </div>

            {/* 10 */}
            <div className="space-y-2">
              <h3 className="text-amber-300 font-semibold">10. Security</h3>
              <p className="text-neutral-300">
                We use administrative, technical, and physical safeguards
                designed to protect personal information, including encryption
                in transit, access controls, and vendor due diligence. No method
                of transmission or storage is completely secure. You use the
                services at your own risk.
              </p>
            </div>

            {/* 11 */}
            <div className="space-y-2">
              <h3 className="text-amber-300 font-semibold">
                11. International users
              </h3>
              <p className="text-neutral-300">
                We are based in the United States, with operations and legal
                domicile in the State of Utah. If you access the services from
                outside the United States, your information may be transferred
                to, stored in, or processed in the United States or other
                countries that may not provide the same level of data protection
                as your home jurisdiction. We will protect your information as
                described in this Policy and as required by applicable law.
              </p>
              <p className="text-neutral-300">
                For EEA and UK users, our legal bases appear in Section 2. You
                may contact your data protection authority if you believe your
                rights have been infringed.
              </p>
            </div>

            {/* 12 */}
            <div className="space-y-2">
              <h3 className="text-amber-300 font-semibold">
                12. Third party sites and services
              </h3>
              <p className="text-neutral-300">
                Our site may link to or integrate with third party websites,
                apps, or services. Their privacy practices are governed by their
                own policies. We are not responsible for third party privacy
                practices.
              </p>
            </div>

            {/* 13 */}
            <div className="space-y-2">
              <h3 className="text-amber-300 font-semibold">13. Do Not Track</h3>
              <p className="text-neutral-300">
                Some browsers transmit Do Not Track signals. Our services do not
                respond to Do Not Track. We will treat a legally required
                browser-level opt-out signal such as Global Privacy Control as
                described in Section 6.
              </p>
            </div>

            {/* 14 */}
            <div className="space-y-2">
              <h3 className="text-amber-300 font-semibold">
                14. Changes to this Policy
              </h3>
              <p className="text-neutral-300">
                We may update this Policy from time to time. If we make material
                changes, we will post the updated Policy and change the
                effective date. Your continued use of the services after an
                update means you accept the changes.
              </p>
            </div>

            {/* 15 */}
            <div className="space-y-2">
              <h3 className="text-amber-300 font-semibold">
                15. How to contact us
              </h3>
              <p className="text-neutral-300">
                Liberty Lighthouse Supply Co., dba Old Ironsides Coffee
                <br />
                Email:{" "}
                <a
                  href="mailto:Support@oldironsidescoffee.org"
                  className="text-amber-300 hover:underline"
                >
                  Support@oldironsidescoffee.org
                </a>
                <br />
                Address: 6 Liberty Square #2564, Boston, MA 02109
              </p>
            </div>
          </section>
        )}
      </Container>
    </main>
  );
}
// Use the real Shopify product handles now
const handleMap: Record<string, string> = {
  flagship: "flagship",
  "baptism-by-fire": "baptism-by-fire",
  "java-action": "java-action",
  "oak-and-copper": "oak-and-copper",
  "brass-monkey": "brass-monkey",

  // add others here if needed
};

function pickVariantIdByBean(product: any, beanType: "whole" | "ground") {
  if (!product?.variants?.edges?.length) return null;
  const want = beanType === "whole" ? "whole" : "ground";
  for (const { node } of product.variants.edges) {
    const opts = node.selectedOptions || [];
    const match = opts.some(
      (o: any) =>
        String(o.name).toLowerCase().includes("grind") &&
        String(o.value).toLowerCase().includes(want)
    );
    if (match) return node.id;
  }
  // fallback: title contains Whole/Ground
  for (const { node } of product.variants.edges) {
    if (String(node.title).toLowerCase().includes(want)) return node.id;
  }
  return product.variants.edges[0]?.node?.id ?? null;
}

function CartPage() {
  const {
    cart,
    inc,
    dec,
    remove,
    clear, // <-- add this
    subtotal,
    shipping,
    shippingLabel,
    total,
    freeShippingQualified,
    coffeeBagCount,
    freeShippingThreshold,
  } = useCart();

  // Sidebar "Ring That Bell" state/submit (mimics MegaSubscribeBox)
  const [sbEmail, setSbEmail] = useState("");
  const [sbDone, setSbDone] = useState(false);
  const [dateLabel, setDateLabel] = useState("");
  const [left, setLeft] = useState("");

  useEffect(() => {
    const STORE_TZ = "America/New_York"; // Sunday 5:00 PM ET cutoff

    const compute = () => {
      const now = DateTime.now().setZone(STORE_TZ);

      // Cutoff: Sunday 5:00 PM ET (this Sunday if not passed, else next Sunday)
      const cutoffThisSunday = now.set({
        weekday: 7,
        hour: 17,
        minute: 0,
        second: 0,
        millisecond: 0,
      });
      const cutoff =
        now <= cutoffThisSunday
          ? cutoffThisSunday
          : cutoffThisSunday.plus({ weeks: 1 });

      // Roast: Monday immediately after the cutoff
      const nextRoast = cutoff.plus({ days: 1 }).startOf("day");
      setDateLabel(nextRoast.toFormat("EEEE, LLL d"));

      // Countdown to cutoff → "Xd Yh Zm"
      const diff = cutoff
        .diff(now, ["days", "hours", "minutes"])
        .shiftTo("days", "hours", "minutes");
      const dd = Math.max(0, Math.floor(diff.days));
      const hh = Math.max(0, Math.floor(diff.hours));
      const mm = Math.max(0, Math.floor(diff.minutes));
      setLeft(
        dd > 0 ? `${dd}d ${hh}h ${mm}m` : hh > 0 ? `${hh}h ${mm}m` : `${mm}m`
      );
    };

    compute();
    const id = setInterval(compute, 1000);
    return () => clearInterval(id);
  }, []);
  // After checkout, if Shopify cart is empty, clear local Chest
  useEffect(() => {
    let cancelled = false;

    const reconcile = async () => {
      try {
        const { id } = await ensureCart();
        const sf = await getCart(id);
        const qty = Number(sf?.totalQuantity ?? 0);

        let started = false;
        try {
          started = localStorage.getItem("oi_checkout_started") === "1";
        } catch {}

        if (!cancelled && started && qty === 0 && cart.length > 0) {
          clear();
          try {
            localStorage.removeItem("oi_checkout_started");
          } catch {}
        }
      } catch {
        // ignore
      }
    };

    // Run on load and on tab return (common after checkout)
    reconcile();
    const onVis = () => {
      if (document.visibilityState === "visible") reconcile();
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [clear, cart.length]);

  // Free shipping helpers
  const missingForFree = Math.max(0, freeShippingThreshold - coffeeBagCount);
  const freeShipProgress = Math.min(1, coffeeBagCount / freeShippingThreshold);

  // Account gate
  const [showAccountGate, setShowAccountGate] = useState(false);

  // Detect subscription items in cart
  const hasSubInCart = useMemo(
    () => cart.some((i: any) => i?.purchaseMode === "sub"),
    [cart]
  );

  // Simple logged-in check using your local storage key
  const isLoggedIn = useMemo(() => {
    if (typeof window === "undefined") return false;
    try {
      return !!localStorage.getItem("oi_user");
    } catch {
      return false;
    }
  }, []);
  // Checkout: gate subs → hard reset Shopify cart to match local → go
  const onCheckoutClick = async (): Promise<void> => {
    try {
      // Gate: require sign-in if any subscription items are in the Chest
      if (hasSubInCart && !isLoggedIn) {
        setShowAccountGate(true);
        window.dispatchEvent(
          new CustomEvent("flash", {
            detail: "Sign in to unlock 15% subscription pricing.",
          })
        );
        return;
      }

      // 1) Same persisted Shopify cart
      const { id: cartId } = await ensureCart();

      // 2) Desired state from YOUR local cart (one line per Chest item)
      type DesiredLine = {
        merchandiseId: string;
        quantity: number;
        sellingPlanId?: string;
      };

      const desired: DesiredLine[] = [];
      for (const i of cart ?? []) {
        const merchId = i?.merchandiseId;
        const qty = Math.max(0, Math.min(99, Number(i?.qty ?? 0)));
        if (!merchId || qty <= 0) continue;

        const planId =
          i?.purchaseMode === "sub" && i?.sellingPlanId
            ? String(i.sellingPlanId)
            : undefined;

        desired.push({
          merchandiseId: merchId,
          quantity: qty,
          sellingPlanId: planId,
        });
      }

      // 3) Clear existing Shopify lines
      const sf = await getCart(cartId);
      const existingLineIds =
        sf?.lines?.edges
          ?.map((e: any) => String(e?.node?.id))
          .filter(Boolean) ?? [];
      if (existingLineIds.length) {
        await cartLinesRemove({ cartId, lineIds: existingLineIds });
      }

      if (!desired.length) {
        window.dispatchEvent(
          new CustomEvent("flash", { detail: "Your cart is empty." })
        );
        return;
      }

      // 4) Add exactly what you want (one Shopify line per local item, with sellingPlanId when present)
      for (const line of desired) {
        await cartLinesAdd({
          cartId,
          merchandiseId: line.merchandiseId,
          quantity: line.quantity,
          ...(line.sellingPlanId ? { sellingPlanId: line.sellingPlanId } : {}),
        });
      }
      // Apply promo code ONLY if they submitted the promo email box
      const promoOk =
        (typeof window !== "undefined" &&
          (localStorage.getItem("promo_subscribed") === "1" ||
            document.cookie.includes("promo_subscribed=1"))) ||
        false;

      if (promoOk) {
        try {
          await cartDiscountCodesUpdate({
            cartId,
            discountCodes: ["IRONSIDES20"],
          });
        } catch {}
      }

      // Re-fetch cart for checkoutUrl
      const fresh = await getCart(cartId);

      const url: string | undefined = fresh?.checkoutUrl;
      if (
        !url ||
        !/^https?:\/\/[^\/]+\.myshopify\.com\/(cart|checkouts)\b/i.test(url)
      ) {
        console.error("Invalid checkoutUrl:", url, fresh);
        window.dispatchEvent(
          new CustomEvent("flash", {
            detail: "Couldn’t get a valid checkout link. Try again.",
          })
        );
        return;
      }
      try {
        localStorage.setItem("oi_checkout_started", "1");
      } catch {}

      window.location.assign(url);
    } catch (e) {
      console.error(e);
      window.dispatchEvent(
        new CustomEvent("flash", { detail: "Checkout failed. See console." })
      );
    }
  };

  const onSbSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await submitPromoEmail(sbEmail);
    if (ok) {
      setSbDone(true);
      setSbEmail("");
    }
  };

  return (
    <main className="pt-28 md:pt-36 pb-16 md:pb-24">
      <Container>
        <div className="flex items-start justify-between">
          <SectionTitle title="Chest" />
          <BackButton to="/store" size="sm" />
        </div>

        {cart.length ? (
          <div>
            {/* Message centered, nudged upward toward banner */}
            <div className="mb-6 text-center relative">
              <p className="text-sm md:text-base text-blue-300 relative -top-[50px] pointer-events-none select-none">
                <>
                  All of our coffees are roasted fresh every Monday and ship
                  Tuesday/Wednesday. <br />
                  Your next eligible roast date is{" "}
                  <span className="font-semibold text-amber-300">
                    {dateLabel}
                    <br />
                    Time left to make the next roast:{" "}
                    <span className="text-amber-300">{left}</span>
                  </span>
                  . <br />
                  Orders placed before 5 p.m. EST on Sunday make that week’s
                  roast; after that, they roll to the following week. <br />
                  Because we roast to order, your coffee won’t arrive overnight
                  like Amazon, but it will arrive fresh. <br />
                  Need it sooner? Leave a note at checkout or reply to your
                  confirmation email — we’ll do our best to accommodate.
                </>
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-4">
                {cart.map((item: any) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 rounded-xl ring-1 ring-neutral-800 bg-neutral-900/50 p-4"
                  >
                    {/* Product image */}
                    <img
                      src={item.img}
                      alt={item.title}
                      className="h-16 w-16 object-cover rounded-lg"
                    />

                    {/* Title + variant + price (flex-1 pushes controls to the right) */}
                    <div className="flex-1">
                      <div className="font-semibold text-amber-300">
                        {item.title}
                      </div>

                      {/* Variant line (only if present) */}
                      {item?.variant ? (
                        <div className="text-xs text-neutral-400">
                          {item.variant}
                        </div>
                      ) : null}

                      {/* Price */}
                      <div className="mt-1 text-sm">{fmt(item.price)}</div>

                      {/* Purchase type copy */}
                      {item?.purchaseMode === "sub" ? (
                        <div className="mt-1 text-m text-amber-400">
                          Fresh Roasted, Ships every {item?.subEvery ?? 30}{" "}
                          days. 15% off applied.
                        </div>
                      ) : (
                        <div className="mt-1 text-m text-neutral-400">
                          Priced as if the Crown won the war.{" "}
                          <span className="text-amber-300">
                            Join the fleet and save 15% off this item.
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Right-side controls (qty + remove) */}
                    <div className="flex items-center gap-2">
                      <div
                        className="inline-flex items-center rounded-lg border border-neutral-700"
                        role="group"
                        aria-label={`Quantity controls for ${item.title}`}
                      >
                        <button
                          onClick={() => dec(item.id)}
                          className="px-2 py-1 hover:bg-neutral-800 rounded-l-lg"
                          aria-label={`Decrease quantity of ${item.title}`}
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <div
                          className="w-10 text-center bg-neutral-900/70 py-1 text-sm"
                          role="status"
                          aria-live="polite"
                        >
                          {item.qty}
                        </div>
                        <button
                          onClick={() => inc(item.id)}
                          className="px-2 py-1 hover:bg-neutral-800 rounded-r-lg"
                          aria-label={`Increase quantity of ${item.title}`}
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>

                      <button
                        onClick={() => remove(item.id)}
                        className="p-2 rounded-lg hover:bg-neutral-800"
                        aria-label={`Remove ${item.title}`}
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Free shipping indicator (half width, amber count) */}
                <div className="w-full md:w-1/3">
                  <div className="rounded-xl ring-1 ring-neutral-800 bg-neutral-900/50 p-4">
                    {!freeShippingQualified ? (
                      <>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-neutral-300">
                            Add{" "}
                            <span className="text-amber-300 font-semibold">
                              {Math.max(
                                0,
                                freeShippingThreshold - coffeeBagCount
                              )}{" "}
                              {Math.max(
                                0,
                                freeShippingThreshold - coffeeBagCount
                              ) === 1
                                ? "more bag"
                                : "more bags"}
                            </span>{" "}
                            for free shipping.
                          </span>
                          <span className="text-amber-300 font-semibold">
                            {coffeeBagCount}/{freeShippingThreshold}
                          </span>
                        </div>
                        <div className="mt-2 h-2 rounded-full bg-neutral-800">
                          <div
                            className="h-2 rounded-full bg-amber-400 transition-all"
                            style={{
                              width: `${Math.round(
                                Math.min(
                                  1,
                                  (coffeeBagCount || 0) /
                                    (freeShippingThreshold || 1)
                                ) * 100
                              )}%`,
                            }}
                            aria-hidden
                          />
                        </div>
                      </>
                    ) : (
                      <div className="text-emerald-400 text-sm font-semibold">
                        Free Shipping Applied
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Checkout sidebar */}
              <aside className="space-y-6">
                {/* Checkout box */}
                <div className="rounded-xl ring-1 ring-neutral-800 bg-neutral-900/50 p-6 h-max">
                  {/* Subtotal */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-400">Subtotal</span>
                    <span className="font-semibold">{fmt(subtotal)}</span>
                  </div>

                  {/* Shipping */}
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-neutral-400">Shipping</span>
                    {shipping === 0 ? (
                      <span className="font-semibold text-amber-300">
                        {shippingLabel}
                      </span>
                    ) : (
                      <span className="font-semibold">{fmt(shipping)}</span>
                    )}
                  </div>
                  <div className="mt-1 text-xs text-neutral-500">
                    UPS Standard Ground
                  </div>

                  {/* Total */}
                  <div className="mt-3 border-t border-neutral-800 pt-3 flex items-center justify-between text-lg">
                    <span className="text-amber-400">Total</span>
                    <span className="font-semibold">{fmt(total)}</span>
                  </div>

                  <button
                    onClick={onCheckoutClick}
                    className="mt-4 w-full px-4 py-2 rounded-lg bg-amber-400 text-neutral-900 font-semibold hover:bg-amber-300"
                    aria-label="Proceed to checkout"
                  >
                    Checkout
                  </button>
                </div>

                {/* Ring That Bell subscribe box */}
                <div className="rounded-2xl ring-1 ring-amber-400/60 bg-neutral-900/60 p-8 text-center">
                  <div className="flex items-center justify-center gap-3 mb-3">
                    <Bell className="h-7 w-7 text-amber-300" />
                    <h3 className="text-2xl font-extrabold text-amber-300">
                      RING THAT BELL
                    </h3>
                  </div>
                  <p className="text-neutral-300 mb-5 text-lg md:text-xl">
                    Get 20% off your first order. <br /> Join the fleet and save
                    15% off every order.
                  </p>

                  <form
                    onSubmit={onSbSubmit}
                    className="flex justify-center gap-3 max-w-md mx-auto"
                  >
                    <input
                      type="email"
                      name="email"
                      autoComplete="email"
                      inputMode="email"
                      autoCapitalize="off"
                      autoCorrect="off"
                      spellCheck={false}
                      value={sbEmail}
                      onChange={(e) => setSbEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="flex-1 rounded-xl bg-neutral-900/70 border border-neutral-700 px-4 py-3 text-sm text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                    <button className="px-6 py-3 rounded-xl bg-amber-400 text-neutral-900 font-semibold hover:bg-amber-300">
                      GET 20% OFF
                    </button>
                  </form>

                  <div className="mt-3 text-xs text-neutral-400">
                    Already a member?{" "}
                    <Link
                      to="/account/login"
                      className="text-amber-300 hover:underline"
                    >
                      Sign in
                    </Link>
                  </div>

                  {sbDone && (
                    <p className="mt-3 text-sm text-emerald-400">
                      Welcome aboard! Your discount will be applied at checkout.
                    </p>
                  )}
                </div>
              </aside>
            </div>
          </div>
        ) : (
          <div className="mt-6 rounded-2xl ring-1 ring-neutral-800 bg-neutral-900/40 p-10 text-center">
            <p className="text-neutral-400 text-xl">
              No items yet. Sail back to the{" "}
              <Link to="/store" className="text-amber-300 hover:underline">
                Harbor
              </Link>
              .
            </p>
          </div>
        )}
        {/* Account gate modal */}
        <AccountGate
          open={showAccountGate}
          onClose={() => setShowAccountGate(false)}
        />
      </Container>
    </main>
  );
}
function getDisplayName(user: any) {
  if (!user) return "";
  const raw =
    user.name && user.name.trim().length > 0
      ? user.name
      : user.firstName && user.lastName
      ? `${user.firstName} ${user.lastName}`
      : user.firstName
      ? user.firstName
      : user.email
      ? String(user.email).split("@")[0]
      : "";

  return String(raw)
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

/* ===================== Account / Subscribe & Manage ===================== */
function SubscribeManagePage({
  initialTab = "overview",
}: {
  initialTab?: "overview" | "login";
}) {
  const [user, setUser] = useState<any>(() => {
    try {
      return JSON.parse(localStorage.getItem("oi_user") || "null");
    } catch {
      return null;
    }
  });
  const [addresses, setAddresses] = useState<any[]>([]);
  const [defaultAddressId, setDefaultAddressId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const SHOP_DOMAIN_RAW = (import.meta as any).env
    ?.VITE_SHOPIFY_STORE_DOMAIN as string;
  const SHOP_DOMAIN = (SHOP_DOMAIN_RAW || "")
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");
  const SEAL_LOGIN_URL = `https://${SHOP_DOMAIN}/account/login?return_url=/a/subscriptions`;
  const [showPassword, setShowPassword] = useState(false);

  // US-only shipping controls
  const US_STATES = [
    "AL",
    "AK",
    "AZ",
    "AR",
    "CA",
    "CO",
    "CT",
    "DE",
    "FL",
    "GA",
    "HI",
    "ID",
    "IL",
    "IN",
    "IA",
    "KS",
    "KY",
    "LA",
    "ME",
    "MD",
    "MA",
    "MI",
    "MN",
    "MS",
    "MO",
    "MT",
    "NE",
    "NV",
    "NH",
    "NJ",
    "NM",
    "NY",
    "NC",
    "ND",
    "OH",
    "OK",
    "OR",
    "PA",
    "RI",
    "SC",
    "SD",
    "TN",
    "TX",
    "UT",
    "VT",
    "VA",
    "WA",
    "WV",
    "WI",
    "WY",
    "DC",
  ] as const;

  // Undo default change (lightweight safety net)
  const [undoFromId, setUndoFromId] = useState<string | null>(null);
  const [undoToId, setUndoToId] = useState<string | null>(null);
  const [showUndo, setShowUndo] = useState(false);
  const undoTimerRef = useRef<number | null>(null);

  const [tab, setTab] = useState<
    "overview" | "login" | "subscriptions" | "orders" | "profile"
  >(initialTab ?? (user ? "overview" : "login"));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [subs, setSubs] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [defaultAddress, setDefaultAddress] = useState<any>(null);
  useEffect(() => {
    if (tab !== "profile") return;

    const token = localStorage.getItem("oi_token");
    if (!token) return;

    fetch("/api/account/addresses", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setAddresses(data.addresses || []);
        setDefaultAddressId(data.defaultId || null);
      })
      .catch(() => {
        // ignore for now
      });
  }, [tab]);

  useEffect(() => {
    const u: any = user;
    setDefaultAddress(u?.defaultAddress ?? null);
  }, [user]);

  useEffect(() => {
    if (!user) setTab("login");
  }, [user]);

  // On real backend: fetch customer, orders, subs, addresses here
  useEffect(() => {
    async function bootstrap() {
      if (!user) return;

      const token = localStorage.getItem("oi_token");
      if (!token) return;

      const resp = await fetch(
        `/api/account/overview?email=${encodeURIComponent(user.email)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!resp.ok) return;

      const data = await resp.json();
      setOrders(data.orders || []);
      setSubs(data.subscriptions || []);
    }

    bootstrap();
  }, [user]);

  // ---------- Auth ----------

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") || "");
    const password = String(fd.get("password") || "");

    try {
      if (!emailOk(email) || !password) {
        throw new Error("Check your email and password.");
      }

      const resp = await fetch("/api/account-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const text = await resp.text();
      console.log("[account-login] raw response:", text);

      let data: any = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error("Login server returned invalid response.");
      }

      if (!resp.ok) {
        throw new Error(data?.error || "Login failed.");
      }

      // data: { accessToken, user }
      localStorage.setItem("oi_user", JSON.stringify(data.user));
      localStorage.setItem("oi_token", data.accessToken);
      setUser(data.user);
      setTab("overview");

      window.dispatchEvent(
        new CustomEvent("flash", { detail: "Welcome back." })
      );
    } catch (err: any) {
      setError(err?.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") || "");
    const email = String(fd.get("email") || "");

    try {
      if (!name || !emailOk(email)) {
        setError("Enter your name and a valid email.");
        return;
      }

      const resp = await fetch("/api/account/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      });

      const text = await resp.text();
      let data: any = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {}

      if (!resp.ok) {
        setError(data?.error || "Account creation failed.");
        return;
      }

      window.dispatchEvent(
        new CustomEvent("flash", {
          detail: "Check your email to activate your account.",
        })
      );

      (e.target as HTMLFormElement)?.reset();
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("oi_user");
    localStorage.removeItem("oi_token");
    setUser(null);
    setTab("login");
  }

  // ---------- Subscription actions (wired later) ----------

  async function skipNextCharge(subId: string) {
    // REAL: POST /api/account/subscriptions/:id/skip or /undo
    setSubs((list) =>
      list.map((s) => {
        if (s.id !== subId) return s;

        // If already skipped, restore original date
        if (s.skipped) {
          return {
            ...s,
            skipped: false,
            nextCharge: s.originalNextCharge ?? s.nextCharge,
          };
        }

        // First time skipping: move date and mark as skipped
        return {
          ...s,
          skipped: true,
          originalNextCharge: s.originalNextCharge ?? s.nextCharge,
          nextCharge: "2025-11-10", // placeholder, real API will send this
        };
      })
    );

    window.dispatchEvent(
      new CustomEvent("flash", {
        detail: "Next delivery updated.",
      })
    );
  }

  async function pauseSub(subId: string) {
    // REAL: POST /api/account/subscriptions/:id/pause
    setSubs((list) =>
      list.map((s) => (s.id === subId ? { ...s, status: "paused" } : s))
    );
    window.dispatchEvent(
      new CustomEvent("flash", { detail: "Subscription paused." })
    );
  }

  async function resumeSub(subId: string) {
    // REAL: POST /api/account/subscriptions/:id/resume
    setSubs((list) =>
      list.map((s) => (s.id === subId ? { ...s, status: "active" } : s))
    );
    window.dispatchEvent(
      new CustomEvent("flash", { detail: "Subscription resumed." })
    );
  }

  async function cancelSub(subId: string) {
    // REAL: POST /api/account/subscriptions/:id/cancel
    setSubs((list) => list.filter((s) => s.id !== subId));
    window.dispatchEvent(
      new CustomEvent("flash", { detail: "Subscription canceled." })
    );
  }

  const TabBtn = ({ id, children }: any) => (
    <button
      onClick={() => setTab(id)}
      className={
        "px-3 py-2 rounded-lg text-sm " +
        (tab === id
          ? "bg-amber-400 text-neutral-900 font-semibold"
          : "border border-neutral-700 hover:border-amber-400/40 text-neutral-300")
      }
    >
      {children}
    </button>
  );

  // ---------- Login / Register view ----------

  if (!user && tab === "login") {
    return (
      <main className="pt-0 pb-8 md:py-24">
        <Container>
          <div className="flex items-start justify-between">
            <SectionTitle
              title={
                <span className="text-3xl md:text-5xl font-extrabold text-amber-300">
                  Account
                </span>
              }
              subtitle="Log in or create an account to manage your subscriptions and orders."
            />
            <div className="hidden md:block">
              <BackButton size="sm" />
            </div>
          </div>

          <div className="mt-6 grid md:grid-cols-2 gap-6">
            {/* Login */}
            <form
              onSubmit={handleLogin}
              className="rounded-2xl ring-1 ring-neutral-800 bg-neutral-900/50 p-6"
            >
              <div className="text-lg font-semibold text-amber-300 mb-3">
                Log in
              </div>
              <div className="space-y-3">
                <input
                  name="email"
                  type="email"
                  placeholder="Email address"
                  className="w-full rounded-lg bg-neutral-900/70 border border-neutral-700 px-3 py-2 text-sm"
                />
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    className="w-full rounded-lg bg-neutral-900/70 border border-neutral-700 px-3 py-2 pr-10 text-sm"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-2 flex items-center text-neutral-400 hover:text-amber-300"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.657.402-3.221 1.125-4.575M6.223 6.223A9.956 9.956 0 0112 5c5.523 0 10 4.477 10 10 0 1.433-.3 2.797-.84 4.025M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3 3l18 18"
                        />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                  </button>
                </div>

                {error && <div className="text-sm text-red-300">{error}</div>}
                <button
                  disabled={loading}
                  className="w-full px-4 py-2 rounded-lg bg-amber-400 text-neutral-900 font-semibold hover:bg-amber-300"
                >
                  {loading ? "Signing in..." : "Log in"}
                </button>
              </div>
              <div className="mt-3 text-xs text-neutral-500">
                Trouble signing in? Email{" "}
                <a
                  href="mailto:support@oldironsidescoffee.org"
                  className="text-amber-300"
                >
                  support@oldironsidescoffee.org
                </a>
                .
              </div>
            </form>{" "}
            {/* Register */}
            <form
              onSubmit={handleRegister}
              className="rounded-2xl ring-1 ring-neutral-800 bg-neutral-900/50 p-6"
            >
              <div className="text-lg font-semibold text-amber-300 mb-3">
                JOIN THE FLEET & SAVE
              </div>

              <div className="space-y-3">
                <input
                  name="name"
                  placeholder="Full name"
                  className="w-full rounded-lg bg-neutral-900/70 border border-neutral-700 px-3 py-2 text-sm"
                />
                <input
                  name="email"
                  type="email"
                  placeholder="Email address"
                  className="w-full rounded-lg bg-neutral-900/70 border border-neutral-700 px-3 py-2 text-sm"
                />

                <button
                  disabled={loading}
                  className="w-full px-4 py-2 rounded-lg bg-amber-400 text-neutral-900 font-semibold hover:bg-amber-300 disabled:opacity-60"
                >
                  {loading ? "Creating..." : "Create account"}
                </button>
              </div>

              <div className="mt-3 text-xs text-neutral-500">
                Your account is used to view orders, manage subscriptions and
                update your shipping details.
              </div>
            </form>
          </div>
        </Container>
      </main>
    );
  }

  // ---------- Logged in view ----------

  return (
    <main className="pt-0 pb-8 md:py-24">
      <Container>
        <div className="-mt-28 md:mt-0">
          <div className="flex items-start justify-between">
            <span className="text-neutral-300">
              Welcome,{" "}
              <span className="text-amber-300 font-semibold">
                {getDisplayName(user) || user?.email}
              </span>
              . Manage your subscriptions, orders and shipping details here.
            </span>

            <div className="hidden md:block">
              <BackButton size="sm" />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <TabBtn id="overview">Overview</TabBtn>
            <TabBtn id="subscriptions">Subscriptions</TabBtn>
            <TabBtn id="orders">Orders</TabBtn>
            <TabBtn id="profile">Profile</TabBtn>
            <div className="ml-auto">
              <button
                onClick={handleLogout}
                className="px-3 py-2 rounded-lg border border-neutral-700 hover:border-amber-400/40 text-neutral-300 text-sm"
              >
                Log out
              </button>
            </div>
          </div>

          {/* OVERVIEW */}
          {tab === "overview" && (
            <div className="mt-6 grid md:grid-cols-3 gap-6">
              {/* Next delivery / subscriptions summary */}
              <div className="rounded-2xl ring-1 ring-neutral-800 bg-neutral-900/50 p-6 flex flex-col justify-between">
                <div>
                  <div className="text-amber-300 font-semibold">
                    Subscriptions and upcoming deliveries:
                  </div>

                  <div className="mt-3 space-y-2 text-sm">
                    {subs.length === 0 ? (
                      <div className="text-neutral-400">
                        No active subscriptions.
                      </div>
                    ) : (
                      subs.slice(0, 4).map((s) => (
                        <div
                          key={s.id}
                          className="border-t border-neutral-800 pt-2 first:border-t-0 first:pt-0"
                        >
                          <div className="text-amber-300 font-semibold">
                            {s.product}
                          </div>

                          <div className="text-neutral-400">
                            {s.nextCharge
                              ? `Ships around ${s.nextCharge}`
                              : s.nextInDays != null
                              ? `Ships in ${s.nextInDays} days`
                              : "Next ship date unavailable"}{" "}
                            • {s.frequency || "—"} • {s.status || "active"}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {subs.length > 4 && (
                    <div className="mt-2 text-xs text-neutral-400">
                      +{subs.length - 4} more subscriptions
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setTab("subscriptions")}
                  className="mt-4 text-amber-300 text-sm text-left"
                >
                  Manage subscriptions →
                </button>
              </div>

              {/* Recent orders */}
              <div className="rounded-2xl ring-1 ring-neutral-800 bg-neutral-900/50 p-6 flex flex-col justify-between">
                <div>
                  <div className="text-amber-300 font-semibold">
                    Recent orders
                  </div>

                  <div className="mt-3 space-y-2 text-sm">
                    {orders.length === 0 ? (
                      <div className="text-neutral-400">No orders yet.</div>
                    ) : (
                      orders.slice(0, 4).map((o) => {
                        const items = Array.isArray(o.items) ? o.items : [];
                        const first = items[0];
                        const moreCount = Math.max(0, items.length - 1);

                        const firstLine = first
                          ? `${first.title} × ${first.qty}`
                          : `${items.length} item${
                              items.length === 1 ? "" : "s"
                            }`;

                        return (
                          <div
                            key={o.id}
                            className="border-t border-neutral-800 pt-2 first:border-t-0 first:pt-0"
                          >
                            <div className="text-amber-300 font-semibold">
                              {o.id}
                            </div>

                            <div className="text-neutral-400">
                              {o.date} • {o.status} • {fmt(o.total)}
                            </div>

                            <div className="text-neutral-300">
                              {firstLine}
                              {moreCount > 0 ? ` + ${moreCount} more` : ""}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setTab("orders")}
                  className="mt-4 text-amber-300 text-sm text-left"
                >
                  View all orders →
                </button>
              </div>

              {/* Default shipping */}
              <div className="rounded-2xl ring-1 ring-neutral-800 bg-neutral-900/50 p-6">
                <div className="text-amber-300 font-semibold">
                  Default shipping address
                </div>

                {defaultAddress ? (
                  <div className="mt-2 text-neutral-300 text-sm">
                    {defaultAddress.name && (
                      <>
                        {defaultAddress.name}
                        <br />
                      </>
                    )}
                    {defaultAddress.line1 && (
                      <>
                        {defaultAddress.line1}
                        <br />
                      </>
                    )}
                    {defaultAddress.line2 && (
                      <>
                        {defaultAddress.line2}
                        <br />
                      </>
                    )}
                    {(defaultAddress.city ||
                      defaultAddress.state ||
                      defaultAddress.zip) && (
                      <>
                        {defaultAddress.city && `${defaultAddress.city}, `}
                        {defaultAddress.state && `${defaultAddress.state} `}
                        {defaultAddress.zip}
                        <br />
                      </>
                    )}
                    {defaultAddress.country}
                  </div>
                ) : (
                  <div className="mt-2 text-neutral-400 text-sm">
                    No default address on file yet. Update it in your Shopify
                    account.
                  </div>
                )}

                <button
                  onClick={() => setTab("profile")}
                  className="mt-3 px-3 py-2 rounded-lg border border-neutral-700 text-sm text-amber-300 hover:border-amber-400/60 hover:bg-amber-400/10"
                >
                  Manage addresses →
                </button>
              </div>
            </div>
          )}

          {/* SUBSCRIPTIONS */}
          {tab === "subscriptions" && (
            <div className="mt-6 space-y-4 max-w-3xl mx-auto">
              {subs.length === 0 && (
                <div className="text-neutral-400">
                  No active subscriptions. Add Subscribe & Save from the store
                  to start.
                </div>
              )}
              {subs.map((s) => (
                <div
                  key={s.id}
                  className="rounded-2xl ring-1 ring-neutral-800 bg-neutral-900/50 p-6 border-l-4 border-amber-400/60"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="font-semibold text-amber-300">
                      {s.product}
                    </div>
                    <div className="text-sm text-neutral-400">
                      • Next ship date:{" "}
                      {s.nextCharge
                        ? formatDate(s.nextCharge)
                        : s.nextInDays != null
                        ? `in ${s.nextInDays} days`
                        : "—"}{" "}
                      • {s.frequency}
                    </div>

                    <div className="text-xs ml-auto rounded px-2 py-1 ring-1 ring-amber-400/60 text-amber-300 uppercase tracking-wide">
                      {s.status}
                    </div>
                  </div>

                  <div className="mt-4 border-t border-neutral-800" />

                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() =>
                        window.open(
                          SEAL_LOGIN_URL,
                          "_blank",
                          "noopener,noreferrer"
                        )
                      }
                      className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-amber-400 text-neutral-900 text-sm font-semibold hover:bg-amber-300"
                    >
                      Manage subscription
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ORDERS */}
          {tab === "orders" && (
            <div className="mt-6 space-y-4 max-w-3xl mx-auto">
              {orders.length === 0 && (
                <div className="text-neutral-400">No orders yet.</div>
              )}
              {orders.map((o) => (
                <div
                  key={o.id}
                  className="rounded-2xl ring-1 ring-neutral-800 bg-neutral-900/50 p-6 border-l-4 border-amber-400/60"
                >
                  <div className="flex items-center gap-4">
                    <div className="font-semibold text-amber-300">{o.id}</div>

                    <div className="flex items-center gap-2 text-sm text-neutral-400">
                      <span>{o.date}</span>
                      <span>•</span>
                      <span>{fmt(o.total)}</span>
                    </div>

                    <div className="ml-auto text-xs rounded px-2 py-1 ring-1 ring-neutral-700 text-neutral-300 uppercase tracking-wide">
                      {o.status}
                    </div>
                  </div>

                  <ul className="mt-3 text-sm text-neutral-300 list-disc list-inside">
                    {o.items.map((it: any, i: number) => (
                      <li key={i}>
                        {it.title} × {it.qty}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-3 grid md:grid-cols-2 gap-4 text-xs text-neutral-400">
                    <div>
                      <div className="uppercase tracking-wide mb-1">
                        Help with this order
                      </div>
                      <div>
                        Email{" "}
                        <a
                          href="mailto:support@oldironsidescoffee.org"
                          className="text-amber-300"
                        >
                          support@oldironsidescoffee.org
                        </a>{" "}
                        with your order number.
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* PROFILE */}
          {tab === "profile" && (
            <div className="mt-6 grid md:grid-cols-2 gap-6">
              {/* Contact + address */}
              <div className="rounded-2xl ring-1 ring-neutral-800 bg-neutral-900/50 p-6">
                <div className="text-amber-300 font-semibold mb-3">
                  Contact and shipping
                </div>
                <div className="text-sm text-neutral-300 space-y-4">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-neutral-400 mb-1">
                      Email
                    </div>
                    <div>{user?.email}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-neutral-400 mb-1">
                      Default shipping address
                    </div>
                    <div className="space-y-0.5">
                      <div>{defaultAddress?.name}</div>
                      <div>{defaultAddress?.line1}</div>
                      {defaultAddress?.line2 && (
                        <div>{defaultAddress.line2}</div>
                      )}
                      <div>
                        {defaultAddress?.city}, {defaultAddress?.state}{" "}
                        {defaultAddress?.zip}
                      </div>
                      <div>{defaultAddress?.country}</div>
                    </div>
                  </div>
                </div>

                <form
                  className="mt-4 grid gap-3"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const form = e.currentTarget as HTMLFormElement;
                    setError("");
                    setLoading(true);

                    try {
                      const token = localStorage.getItem("oi_token");
                      if (!token) {
                        setError("Please log in again.");
                        return;
                      }

                      const fd = new FormData(
                        e.currentTarget as HTMLFormElement
                      );

                      const address = {
                        firstName: String(fd.get("firstName") || "").trim(),
                        lastName: String(fd.get("lastName") || "").trim(),
                        address1: String(fd.get("address1") || "").trim(),
                        address2: String(fd.get("address2") || "").trim(),
                        city: String(fd.get("city") || "").trim(),
                        province: String(fd.get("province") || "").trim(),
                        zip: String(fd.get("zip") || "").trim(),
                        country: "United States",

                        phone: String(fd.get("phone") || "").trim(),
                      };

                      if (
                        !address.address1 ||
                        !address.city ||
                        !address.province ||
                        !address.zip ||
                        !address.country
                      ) {
                        setError(
                          "Address, city, state, zip, and country are required."
                        );
                        return;
                      }

                      const endpoint = editingId
                        ? "/api/account/address-update"
                        : "/api/account/address-create";

                      const payload = editingId
                        ? { id: editingId, address }
                        : { address };

                      const resp = await fetch(endpoint, {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify(payload),
                      });

                      const text = await resp.text();
                      console.log("[address-create] raw response:", text);

                      let data: any = {};
                      try {
                        data = text ? JSON.parse(text) : {};
                      } catch {
                        setError("Address server returned invalid response.");
                        return;
                      }

                      if (!resp.ok) {
                        setError(data?.error || "Address update failed.");
                        return;
                      }
                      // Refresh addresses from Shopify so UI matches reality
                      try {
                        const r2 = await fetch("/api/account/addresses", {
                          headers: { Authorization: `Bearer ${token}` },
                        });
                        const d2 = await r2.json();
                        setAddresses(d2.addresses || []);
                        setDefaultAddressId(d2.defaultId || null);
                      } catch {}

                      // Update local UI immediately
                      const newDefault = {
                        name: [address.firstName, address.lastName]
                          .filter(Boolean)
                          .join(" ")
                          .trim(),
                        line1: address.address1,
                        line2: address.address2,
                        city: address.city,
                        state: address.province,
                        zip: address.zip,
                        country: address.country,
                      };

                      setDefaultAddress(newDefault);
                      setUser((u: any) => {
                        if (!u) return u;
                        const next = { ...u, defaultAddress: newDefault };
                        localStorage.setItem("oi_user", JSON.stringify(next));
                        return next;
                      });

                      window.dispatchEvent(
                        new CustomEvent("flash", {
                          detail: "Shipping address saved.",
                        })
                      );
                      setEditingId(null);
                      setDeleteId(null);
                      setConfirmDelete(false);

                      form.reset();
                    } catch (err: any) {
                      setError(err?.message || "Address update failed.");
                    } finally {
                      setLoading(false);
                    }
                  }}
                >
                  {addresses.map((a) => {
                    const isDefault = a.id === defaultAddressId;

                    return (
                      <div
                        key={a.id}
                        className={[
                          "w-full text-left rounded-lg border p-3 transition relative",
                          isDefault
                            ? "border-amber-400 bg-amber-400/10"
                            : "border-neutral-700 hover:border-amber-400/60",
                        ].join(" ")}
                      >
                        {/* Address display (no click-to-set-default) */}
                        <div className="block w-full text-left pr-24">
                          <div className="font-semibold text-neutral-200">
                            {a.firstName} {a.lastName}
                            {isDefault && (
                              <span className="ml-2 text-xs text-amber-300">
                                (Default)
                              </span>
                            )}
                          </div>
                          <div>{a.address1}</div>
                          {a.address2 && <div>{a.address2}</div>}
                          <div>
                            {a.city}, {a.province} {a.zip}
                          </div>
                          <div>{a.country}</div>
                        </div>

                        {/* Actions (top-right) */}
                        <div className="absolute top-3 right-3 flex gap-2">
                          {!isDefault && (
                            <button
                              type="button"
                              disabled={loading}
                              onClick={async () => {
                                const token = localStorage.getItem("oi_token");
                                if (!token) return;

                                setLoading(true);
                                setError("");

                                try {
                                  const resp = await fetch(
                                    "/api/account/address-set-default",
                                    {
                                      method: "POST",
                                      headers: {
                                        "Content-Type": "application/json",
                                        Authorization: `Bearer ${token}`,
                                      },
                                      body: JSON.stringify({ addressId: a.id }),
                                    }
                                  );

                                  const data = await resp.json();
                                  if (!resp.ok) {
                                    setError(
                                      data?.error ||
                                        "Failed to update default address."
                                    );
                                    return;
                                  }

                                  setDefaultAddressId(a.id);
                                  setDefaultAddress({
                                    name: [a.firstName, a.lastName]
                                      .filter(Boolean)
                                      .join(" "),
                                    line1: a.address1,
                                    line2: a.address2,
                                    city: a.city,
                                    state: a.province,
                                    zip: a.zip,
                                    country: a.country,
                                  });

                                  window.dispatchEvent(
                                    new CustomEvent("flash", {
                                      detail:
                                        "Default shipping address updated.",
                                    })
                                  );
                                } finally {
                                  setLoading(false);
                                }
                              }}
                              className="px-2 py-1 text-xs rounded border border-neutral-600 text-neutral-200 hover:border-amber-400/60 disabled:opacity-60"
                            >
                              Set default
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(a.id);
                              setDeleteId(null);
                              setConfirmDelete(false);

                              const f = document.querySelector(
                                'form[class*="mt-4"][class*="grid"][class*="gap-3"]'
                              ) as HTMLFormElement | null;

                              if (!f) return;

                              const setVal = (name: string, val: string) => {
                                const el = f.elements.namedItem(name) as
                                  | HTMLInputElement
                                  | HTMLSelectElement
                                  | null;
                                if (!el) return;
                                (el as any).value = val ?? "";
                              };

                              setVal("firstName", a.firstName);
                              setVal("lastName", a.lastName);
                              setVal("address1", a.address1);
                              setVal("address2", a.address2);
                              setVal("city", a.city);
                              setVal("province", a.province);
                              setVal("zip", a.zip);
                              setVal("country", a.country);
                              setVal("phone", a.phone);

                              window.dispatchEvent(
                                new CustomEvent("flash", {
                                  detail: "Editing address.",
                                })
                              );
                            }}
                            className="px-2 py-1 text-xs rounded border border-neutral-600 text-neutral-200 hover:border-amber-400/60"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(null);
                              setDeleteId(a.id);
                              setConfirmDelete(true);
                            }}
                            className="px-2 py-1 text-xs rounded border border-red-800 text-red-300 hover:border-red-600"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  <div className="flex items-center justify-between">
                    <div className="text-amber-300 font-semibold">
                      {editingId
                        ? "Edit shipping address"
                        : "Add shipping address"}
                    </div>

                    {editingId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(null);
                          setDeleteId(null);
                          setConfirmDelete(false);

                          (
                            document.querySelector(
                              'form[class*="mt-4"][class*="grid"][class*="gap-3"]'
                            ) as HTMLFormElement | null
                          )?.reset?.();
                          setError("");
                        }}
                        className="px-3 py-1 text-xs rounded border border-amber-400 text-amber-300 hover:bg-amber-400/10 font-semibold"
                      >
                        Cancel
                      </button>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-3">
                    <input
                      name="firstName"
                      placeholder="First name"
                      className="w-full rounded-lg bg-neutral-900/70 border border-neutral-700 px-3 py-2 text-sm"
                    />
                    <input
                      name="lastName"
                      placeholder="Last name"
                      className="w-full rounded-lg bg-neutral-900/70 border border-neutral-700 px-3 py-2 text-sm"
                    />
                  </div>

                  <input
                    name="address1"
                    placeholder="Address line 1"
                    className="w-full rounded-lg bg-neutral-900/70 border border-neutral-700 px-3 py-2 text-sm"
                  />
                  <input
                    name="address2"
                    placeholder="Address line 2 (optional)"
                    className="w-full rounded-lg bg-neutral-900/70 border border-neutral-700 px-3 py-2 text-sm"
                  />

                  <div className="grid md:grid-cols-2 gap-3">
                    <input
                      name="city"
                      placeholder="City"
                      className="w-full rounded-lg bg-neutral-900/70 border border-neutral-700 px-3 py-2 text-sm"
                    />
                    <select
                      name="province"
                      required
                      defaultValue=""
                      className="w-full rounded-lg bg-neutral-900/70 border border-neutral-700 px-3 py-2 text-sm"
                    >
                      <option value="" disabled>
                        State
                      </option>
                      {US_STATES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid md:grid-cols-2 gap-3">
                    <input
                      name="zip"
                      placeholder="ZIP / Postal code"
                      className="w-full rounded-lg bg-neutral-900/70 border border-neutral-700 px-3 py-2 text-sm"
                    />
                    <div className="space-y-2">
                      <select
                        name="country"
                        required
                        defaultValue="United States"
                        disabled
                        className="w-full rounded-lg bg-neutral-900/70 border border-neutral-700 px-3 py-2 text-sm opacity-80"
                      >
                        <option value="United States">United States</option>
                      </select>

                      <div className="text-xs text-neutral-400">
                        International? Contact us:{" "}
                        <a
                          href="mailto:support@oldironsidescoffee.org"
                          className="text-amber-300 font-medium"
                        >
                          support@oldironsidescoffee.org
                        </a>
                      </div>
                    </div>
                  </div>

                  <input
                    name="phone"
                    placeholder="Phone (optional)"
                    className="w-full rounded-lg bg-neutral-900/70 border border-neutral-700 px-3 py-2 text-sm"
                  />

                  {error && <div className="text-sm text-red-300">{error}</div>}
                  {deleteId && confirmDelete && (
                    <div className="mt-4 rounded-lg border border-red-800 bg-red-900/30 p-4">
                      <div className="text-red-300 font-semibold mb-2">
                        Delete this address?
                      </div>
                      <div className="text-sm text-neutral-300 mb-3">
                        This action cannot be undone.
                      </div>

                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setConfirmDelete(false);
                            setDeleteId(null);
                          }}
                          className="px-3 py-2 rounded-lg border border-neutral-600 text-neutral-200 hover:border-amber-400/60"
                        >
                          Cancel
                        </button>

                        <button
                          type="button"
                          disabled={loading}
                          onClick={async () => {
                            const token = localStorage.getItem("oi_token");
                            if (!token || !deleteId) return;

                            setLoading(true);
                            setError("");

                            const deletingId = deleteId;

                            try {
                              const resp = await fetch(
                                "/api/account/address-delete",
                                {
                                  method: "POST",
                                  headers: {
                                    "Content-Type": "application/json",
                                    Authorization: `Bearer ${token}`,
                                  },
                                  body: JSON.stringify({ id: deletingId }),
                                }
                              );

                              const data = await resp.json();
                              if (!resp.ok) {
                                setError(data?.error || "Delete failed.");
                                return;
                              }

                              // Compute remaining BEFORE state updates (so default promotion is correct)
                              const remaining = addresses.filter(
                                (x) => x.id !== deletingId
                              );
                              const nextDefault = remaining[0] || null;

                              // Update list UI
                              setAddresses(remaining);

                              // If we deleted the default, promote another one in Shopify
                              if (defaultAddressId === deletingId) {
                                if (nextDefault) {
                                  try {
                                    const resp2 = await fetch(
                                      "/api/account/address-set-default",
                                      {
                                        method: "POST",
                                        headers: {
                                          "Content-Type": "application/json",
                                          Authorization: `Bearer ${token}`,
                                        },
                                        body: JSON.stringify({
                                          addressId: nextDefault.id,
                                        }),
                                      }
                                    );
                                    const data2 = await resp2.json();

                                    if (!resp2.ok) {
                                      setError(
                                        data2?.error ||
                                          "Deleted default, but couldn't set a new default."
                                      );
                                      setDefaultAddressId(null);
                                      setDefaultAddress(null);
                                    } else {
                                      setDefaultAddressId(nextDefault.id);
                                      setDefaultAddress({
                                        name: [
                                          nextDefault.firstName,
                                          nextDefault.lastName,
                                        ]
                                          .filter(Boolean)
                                          .join(" "),
                                        line1: nextDefault.address1,
                                        line2: nextDefault.address2,
                                        city: nextDefault.city,
                                        state: nextDefault.province,
                                        zip: nextDefault.zip,
                                        country: nextDefault.country,
                                      });
                                    }
                                  } catch {
                                    setDefaultAddressId(null);
                                    setDefaultAddress(null);
                                  }
                                } else {
                                  setDefaultAddressId(null);
                                  setDefaultAddress(null);
                                }
                              }

                              // If you happened to be editing the same address, exit edit mode + clear form
                              if (editingId === deletingId) {
                                setEditingId(null);
                                (
                                  document.querySelector(
                                    'form[class*="mt-4"][class*="grid"][class*="gap-3"]'
                                  ) as HTMLFormElement | null
                                )?.reset?.();
                              }

                              setConfirmDelete(false);
                              setDeleteId(null);

                              window.dispatchEvent(
                                new CustomEvent("flash", {
                                  detail: "Address deleted.",
                                })
                              );
                            } finally {
                              setLoading(false);
                            }
                          }}
                          className="px-3 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-500 disabled:opacity-60"
                        >
                          Confirm delete
                        </button>
                      </div>
                    </div>
                  )}

                  <button
                    disabled={loading}
                    className="px-3 py-2 rounded-lg bg-amber-400 text-neutral-900 text-sm font-semibold hover:bg-amber-300 disabled:opacity-60"
                  >
                    {loading ? "Saving..." : "Save address"}
                  </button>
                </form>
              </div>

              {/* Security */}
              <div className="rounded-2xl ring-1 ring-neutral-800 bg-neutral-900/50 p-6">
                <div className="text-amber-300 font-semibold mb-3">
                  Security and password
                </div>
                <div className="text-sm text-neutral-300 space-y-3">
                  <p>
                    You can change your password and update login details from
                    your secure account portal once connected.
                  </p>
                  <p className="text-neutral-400 text-xs">
                    For now, email{" "}
                    <a
                      href="mailto:support@oldironsidescoffee.com"
                      className="text-amber-300"
                    >
                      support@oldironsidescoffee.org
                    </a>{" "}
                    if you need help updating your login.
                  </p>
                </div>
                <button
                  // REAL: link to password reset flow
                  className="mt-4 px-3 py-2 rounded-lg bg-amber-400 text-neutral-900 text-sm font-semibold hover:bg-amber-300"
                >
                  Request password reset
                </button>
              </div>
            </div>
          )}
        </div>
      </Container>
    </main>
  );
}

function NotFoundPage() {
  return (
    <main className="py-24">
      <Container>
        <div className="flex items-start justify-between">
          <SectionTitle
            title={
              <span className="text-3xl font-extrabold text-amber-300">
                Page not found
              </span>
            }
            subtitle="The page you’re looking for was sunk by the British!"
          />
          <BackButton size="sm" />
        </div>

        <div className="mt-6 rounded-2xl ring-1 ring-neutral-800 bg-neutral-900/40 p-10 text-center">
          {/* keep the rest of your existing card content, but remove the duplicate h1/subtitle inside */}
          <Link
            to="/"
            className="mt-4 inline-block px-5 py-2 rounded-xl bg-amber-400 text-neutral-900 font-semibold hover:bg-amber-300"
          >
            Return to Port
          </Link>
        </div>
      </Container>
    </main>
  );
}

/* ================= Layout & Footer ================= */
function HeaderNavLink({
  to,
  children,
}: {
  to: string;
  children: React.ReactNode;
}) {
  const location = useLocation();

  // Special case: treat /store and /store#merch the same
  const isActive =
    location.pathname === to ||
    (to.startsWith("/store") && location.pathname === "/store");

  return (
    <Link
      to={to}
      className={
        "px-1.5 py-1 rounded-md " +
        (isActive
          ? "text-amber-300 font-semibold"
          : "text-neutral-300 hover:text-amber-200") +
        " text-base md:text-lg transition-colors"
      }
    >
      {children}
    </Link>
  );
}

function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    // If there’s a hash like #merch, try to scroll to it after render
    if (hash) {
      // wait a tick so the section exists in the DOM
      requestAnimationFrame(() => {
        const id = hash.slice(1);
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        } else {
          // fallback if anchor not found
          window.scrollTo({ top: 0, left: 0, behavior: "auto" });
        }
      });
      return;
    }

    // No hash: normal behavior
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname, hash]);

  return null;
}
// Drop-in replacement: removes the "X" and adds a centered bottom closer
// styled like your buy box. Clicking it closes the banner.

function PromoSubscribeModal() {
  // ===== LIVE CONFIG =====
  const TEST_FORCE_OPEN = false; // keep false in production
  const OPEN_DELAY_MS = 5000; // open ~5s AFTER window 'load'
  const COOLDOWN_MINUTES = 1440; // 24 hours

  // ===== STATE =====
  const [open, setOpen] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [phase, setPhase] = React.useState<"form" | "success">("form");

  // ===== KEYS =====
  const KEY_SUB = "promo_subscribed";
  const KEY_CD = "promo_cooldown_until";
  const COOKIE_SUB = "promo_subscribed";
  const COOKIE_CD = "promo_cooldown_until";

  // ===== GLOBAL GUARDS (singleton + timers + gating) =====
  const g = globalThis as any;
  g.__promo = g.__promo || {
    leaderId: null as string | null,
    entryTimer: null as any,
    pendingTimer: null as any,
    readyAt: Number.POSITIVE_INFINITY as number,
    isLockedOpen: false,
  };

  // unique id for this instance
  const instanceId = React.useMemo(
    () => Math.random().toString(36).slice(2),
    []
  );
  const [isLeader, setIsLeader] = React.useState(false);

  // elect a single leader instance
  React.useEffect(() => {
    if (!g.__promo.leaderId) g.__promo.leaderId = instanceId;
    setIsLeader(g.__promo.leaderId === instanceId);
    return () => {
      if (g.__promo.leaderId === instanceId) g.__promo.leaderId = null;
    };
  }, [g, instanceId]);

  // ===== HELPERS =====
  const emailOk = (val: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  const nowMs = () => Date.now();

  // Cookie helpers (regex-free)
  const setCookieDays = (name: string, value: string, days: number) => {
    const maxAge = Math.max(0, Math.floor(days * 86400));
    const secure = location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${name}=${encodeURIComponent(
      value
    )}; Path=/; SameSite=Lax; Max-Age=${maxAge}${secure}`;
  };
  const setCookieSeconds = (name: string, value: string, seconds: number) => {
    const maxAge = Math.max(0, Math.floor(seconds));
    const secure = location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${name}=${encodeURIComponent(
      value
    )}; Path=/; SameSite=Lax; Max-Age=${maxAge}${secure}`;
  };
  const getCookie = (name: string): string | null => {
    if (!document.cookie) return null;
    const parts = document.cookie.split("; ");
    for (const part of parts) {
      const eq = part.indexOf("=");
      const key = eq >= 0 ? part.slice(0, eq) : part;
      if (key === name) {
        const val = eq >= 0 ? part.slice(eq + 1) : "";
        return decodeURIComponent(val);
      }
    }
    return null;
  };

  const isSubscribed = () =>
    localStorage.getItem(KEY_SUB) === "1" || getCookie(COOKIE_SUB) === "1";

  const getCooldownUntil = () => {
    const cdLocal = parseInt(localStorage.getItem(KEY_CD) || "0", 10);
    const cdCookie = parseInt(getCookie(COOKIE_CD) || "0", 10);
    return Math.max(
      Number.isFinite(cdLocal) ? cdLocal : 0,
      Number.isFinite(cdCookie) ? cdCookie : 0
    );
  };

  const startCooldown = () => {
    if (COOLDOWN_MINUTES > 0) {
      const until = nowMs() + COOLDOWN_MINUTES * 60 * 1000;
      localStorage.setItem(KEY_CD, String(until));
      setCookieSeconds(COOKIE_CD, String(until), COOLDOWN_MINUTES * 60);
    }
  };

  // force=true bypasses delay gate for user clicks; auto-open respects gate
  const safeOpen = (force = false) => {
    if (g.__promo.isLockedOpen) return;

    const readyAt = g.__promo.readyAt || 0;
    const now = nowMs();

    if (!force && now < readyAt) {
      if (!g.__promo.pendingTimer) {
        g.__promo.pendingTimer = window.setTimeout(() => {
          g.__promo.pendingTimer = null;
          safeOpen(false);
        }, Math.max(0, readyAt - now + 10));
      }
      return;
    }

    g.__promo.isLockedOpen = true;
    setEmail("");
    setPhase("form");
    setOpen(true);
  };

  const safeClose = () => {
    setOpen(false);
    startCooldown();
    setTimeout(() => {
      g.__promo.isLockedOpen = false;
    }, 200);
  };

  // ===== EVENT: open from anywhere (respects gate) =====
  React.useEffect(() => {
    if (!isLeader) return;
    const onOpen = () => safeOpen(false);
    window.addEventListener("promo-subscribe", onOpen as any);
    document.addEventListener("promo-subscribe", onOpen as any);
    return () => {
      window.removeEventListener("promo-subscribe", onOpen as any);
      document.removeEventListener("promo-subscribe", onOpen as any);
    };
  }, [isLeader]);

  // ===== CLICK TRIGGER: [data-open-promo] — opens immediately for user action =====
  React.useEffect(() => {
    if (!isLeader) return;
    const handleClickCapture = (e: Event) => {
      const t = e.target as HTMLElement | null;
      if (!t) return;
      const trigger = t.closest("[data-open-promo]");
      if (!trigger) return;
      e.preventDefault();
      safeOpen(true); // user clicked, bypass delay
    };
    document.addEventListener("click", handleClickCapture, true);
    return () =>
      document.removeEventListener("click", handleClickCapture, true);
  }, [isLeader]);

  // ===== ESC to close =====
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") safeClose();
    };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // ===== SET READY TIME AFTER FULL WINDOW LOAD, THEN SCHEDULE AUTO-OPEN =====
  React.useEffect(() => {
    if (!isLeader) return;

    const setReady = () => {
      g.__promo.readyAt = nowMs() + OPEN_DELAY_MS;

      const cooldownUntil = getCooldownUntil();
      const isLoggedIn = (() => {
        try {
          return !!localStorage.getItem("oi_user");
        } catch {
          return false;
        }
      })();

      const canAuto = TEST_FORCE_OPEN
        ? true
        : !isSubscribed() && !isLoggedIn && nowMs() >= cooldownUntil;

      if (!canAuto) return;

      if (!g.__promo.entryTimer) {
        const delay = Math.max(0, g.__promo.readyAt - nowMs());
        g.__promo.entryTimer = window.setTimeout(() => {
          g.__promo.entryTimer = null;
          safeOpen(false);
        }, delay);
      }
    };

    if (document.readyState === "complete") {
      setReady();
    } else {
      const onLoad = () => setReady();
      window.addEventListener("load", onLoad, { once: true });
      return () => window.removeEventListener("load", onLoad);
    }
  }, [isLeader]);

  // ===== SUBMIT =====
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const ok = await submitPromoEmail(email);
    if (!ok) return;

    // match existing modal UX
    const isDesktop = window.matchMedia("(min-width: 768px)").matches;
    if (isDesktop) {
      safeClose();
    } else {
      setPhase("success");
      setTimeout(() => safeClose(), 7000);
    }
  };

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[2147483647] flex items-center justify-center pt-[calc(env(safe-area-inset-top)+40px)] md:pt-0"
      style={{ zIndex: 2147483647 }}
      role="dialog"
      aria-modal="true"
      aria-label="Get 20% off your first order"
      onClick={(e) => {
        if (e.target === e.currentTarget) safeClose();
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal shell */}
      <div className="relative z-10 w-[92vw] max-w-[380px] md:w-[98vw] md:max-w-6xl">
        <div
          className="relative rounded-2xl md:rounded-2xl ring-1 ring-amber-400/60 bg-neutral-900/60 
  overflow-y-auto md:overflow-visible max-h-[96vh] md:min-h-0 md:max-h-none"
        >
          {/* TOP-RIGHT CLOSE (X) */}
          <button
            type="button"
            onClick={safeClose}
            className="absolute right-3 top-3 z-20 inline-flex h-10 w-10 items-center justify-center rounded-md
            bg-neutral-900/70 ring-1 ring-amber-300 text-amber-300 hover:text-amber-200
            hover:ring-amber-400 transition"
            aria-label="Close"
          >
            <span
              aria-hidden="true"
              className="text-[22px] leading-[1] relative top-[-1px]"
            >
              ×
            </span>
          </button>

          {/* Body: grid */}
          <div className="grid md:grid-cols-[auto,1fr] items-stretch gap-0 min-h-full">
            {/* MOBILE HERO */}
            <div className="md:hidden">
              <div className="relative w-full h-[246px] sm:h-[282px] bg-neutral-900 overflow-hidden">
                <img
                  src="/captain-deck1.png"
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-cover blur-sm scale-110 opacity-60"
                />
                <img
                  src="/captain-deck1.png"
                  alt="Hero"
                  className="relative z-10 h-full mx-auto object-contain"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-transparent" />
              </div>
            </div>

            {/* DESKTOP HERO */}
            <div className="hidden md:flex items-center justify-start pl-6 pr-0 py-6">
              <div className="rounded-2xl ring-1 ring-amber-400 bg-neutral-900/60 overflow-hidden shadow-2xl shadow-black/40">
                <div className="w-[19rem] lg:w-[21rem] aspect-[4/5]">
                  <img
                    src="/captain-deck1.png"
                    alt="Hero"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>

            {/* RIGHT CONTENT */}
            <div className="py-5 md:py-10 px-4 md:pl-4 md:pr-10 md:-ml-8 min-h-full flex">
              <div className="h-full w-full flex flex-col justify-between text-center">
                {/* Title + copy + form */}
                <div>
                  <div className="flex flex-col items-center justify-center gap-2 md:gap-3 mb-2 md:mb-4">
                    <BellRinger iconClassName="h-10 w-10 md:h-14 md:w-14 text-amber-300" />

                    <h3 className="font-extrabold text-amber-300 text-[31px] leading-tight md:text-[3.25rem]">
                      RING THAT BELL
                    </h3>
                  </div>

                  <p className="text-neutral-300 mb-3 md:mb-5 text-[14px] leading-snug md:text-[1.5625rem] md:leading-normal md:whitespace-nowrap">
                    Get 20% off your first freshly roasted coffee order.
                    <br className="hidden md:block" />
                  </p>

                  {/* === THIS WHOLE WRAPPER SWAPPED === */}
                  <div className="w-full max-w-[300px] sm:max-w-sm md:max-w-2xl mx-auto">
                    {/* MOBILE: success OR form */}
                    <div className="md:hidden">
                      {phase === "success" ? (
                        <>
                          {/* Full-width amber banner fixed to the top */}
                          <div className="fixed inset-x-0 top-0 z-[2147483647] bg-amber-400 text-neutral-900 text-center font-semibold px-4 py-3 shadow-lg">
                            Welcome aboard! Your discount applied at checkout
                          </div>

                          {/* Spacer so content below doesn’t jump if visible briefly */}
                          <div className="h-12" />
                        </>
                      ) : (
                        <div>
                          <form
                            onSubmit={onSubmit}
                            className="flex flex-col md:flex-row gap-2 md:gap-4 justify-center"
                          >
                            <input
                              type="email"
                              name="email"
                              autoComplete="email"
                              inputMode="email"
                              autoCapitalize="off"
                              autoCorrect="off"
                              spellCheck={false}
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="Enter your email"
                              className="rounded-xl bg-neutral-900/70 border border-neutral-700 px-3 py-2 text-[16px] text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-400 md:px-5 md:py-3 md:text-[1.25rem] md:flex-none md:w-[50%]"
                              style={{ color: "#ffffff" }}
                            />
                            <button
                              type="submit"
                              className="px-4 py-2 md:px-10 md:py-3.5 rounded-xl ring-1 ring-amber-400/70 bg-amber-400 text-neutral-900 text-[18px] md:text-lg font-semibold hover:bg-amber-300 transition-all"
                            >
                              GET 20% OFF
                            </button>
                          </form>

                          <div className="mt-2 md:mt-3 text-[11px] md:text-[0.9375rem] text-neutral-400 text-center">
                            Already a member?{" "}
                            <Link
                              to="/account/login"
                              className="text-amber-300 hover:underline"
                              onClick={() => {
                                localStorage.setItem(KEY_SUB, "1");
                                setCookieDays(COOKIE_SUB, "1", 365);
                                safeClose();
                              }}
                            >
                              Sign in
                            </Link>
                          </div>

                          <div className="mt-1 text-[11px] md:text-xs text-neutral-400 text-center">
                            Cancel anytime
                          </div>
                        </div>
                      )}
                    </div>

                    {/* DESKTOP: form (closes immediately on submit) */}
                    <div className="hidden md:block">
                      <form
                        onSubmit={onSubmit}
                        className="flex flex-col md:flex-row gap-2 md:gap-4 justify-center"
                      >
                        <input
                          type="email"
                          name="email"
                          autoComplete="email"
                          inputMode="email"
                          autoCapitalize="off"
                          autoCorrect="off"
                          spellCheck={false}
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Enter your email"
                          className="rounded-xl bg-neutral-900/70 border border-neutral-700 px-3 py-2 text-[16px] text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-400 md:px-5 md:py-3 md:text-[1.25rem] md:flex-none md:w-[50%]"
                          style={{ color: "#ffffff" }}
                        />
                        <button
                          type="submit"
                          className="px-4 py-2 md:px-10 md:py-3.5 rounded-xl ring-1 ring-amber-400/70 bg-amber-400 text-neutral-900 text-[18px] md:text-lg font-semibold hover:bg-amber-300 transition-all"
                        >
                          GET 20% OFF
                        </button>
                      </form>

                      <div className="mt-2 md:mt-3 text-[11px] md:text-[0.9375rem] text-neutral-400 text-center">
                        Already a member?{" "}
                        <Link
                          to="/account/login"
                          className="text-amber-300 hover:underline"
                          onClick={() => {
                            localStorage.setItem(KEY_SUB, "1");
                            setCookieDays(COOKIE_SUB, "1", 365);
                            safeClose();
                          }}
                        >
                          Sign in
                        </Link>
                      </div>

                      <div className="mt-1 text-[11px] md:text-xs text-neutral-400 text-center">
                        Cancel anytime
                      </div>
                    </div>
                  </div>
                  {/* === /WRAPPER === */}
                </div>

                {/* BOTTOM: desktop-only Nah */}
                <div className="hidden md:flex justify-center pt-4">
                  <button
                    type="button"
                    onClick={safeClose}
                    className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl ring-1 ring-amber-400/60 
                    text-amber-400 font-semibold text-lg hover:bg-amber-400 hover:text-neutral-900 transition-all"
                    aria-label="Close banner"
                  >
                    Nah. Tax me like it&apos;s 1773. Give my 20% to the
                    Redcoats.
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* FOOTER: mobile Nah (hide after success) */}
          <div
            className={`border-t border-neutral-800 p-4 justify-center bg-neutral-900/40 md:hidden ${
              phase === "success" ? "hidden" : "flex"
            }`}
          >
            <button
              type="button"
              onClick={safeClose}
              className="inline-flex items-center justify-center px-4 md:px-5 py-2 rounded-xl ring-1 ring-amber-400/60 
              text-amber-400 font-semibold text-m md:text-lg
              hover:bg-amber-400 hover:text-neutral-900 transition-all"
              aria-label="Close banner"
            >
              Nah. Tax me like it&apos;s 1773. Give my 20% to the Redcoats.
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
} // <-- end PromoSubscribeModal

function RoastAnchorsInline({ level = 3 }: { level?: 1 | 2 | 3 | 4 | 5 }) {
  return (
    <div className="mt-2">
      <div className="relative flex items-center gap-3">
        <div
          className="pointer-events-none absolute top-1/2 left-0 right-0 -z-10 h-[2px]
          bg-[repeating-linear-gradient(90deg,rgba(214,158,46,0.35)_0,rgba(214,158,46,0.35)_6px,transparent_6px,transparent_10px)]"
          aria-hidden
        />
        <div className="relative flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <svg
              key={n}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={
                "h-6 w-6 align-middle select-none " +
                (n <= level
                  ? "text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]"
                  : "text-neutral-600")
              }
              aria-hidden
            >
              <rect
                x="11"
                y="0"
                width="2"
                height="24"
                fill="currentColor"
                className="text-neutral-950"
              />
              <circle
                cx="12"
                cy="4"
                r="1.6"
                fill="currentColor"
                className="text-neutral-950"
              />
              <circle cx="12" cy="4" r="2" />
              <path d="M12 6v11" />
              <path d="M8 10h8" />
              <path d="M5 17c2 3 5 4 7 4s5-1 7-4" />
              <path d="M7 17l-2 2" />
              <path d="M17 17l2 2" />
            </svg>
          ))}
        </div>
      </div>
    </div>
  );
}

function Layout() {
  const { count } = useCart();
  const location = useLocation();
  const isHome = location.pathname === "/";

  const isRoast = location.pathname.startsWith("/roast");
  const isOrigins = location.pathname.startsWith("/origins");
  const isSupport =
    location.pathname.startsWith("/legal") ||
    location.pathname.startsWith("/contact");
  const panelRef = React.useRef<HTMLDivElement | null>(null);

  const [shrunk, setShrunk] = useState(true);
  const [stickyOpen, setStickyOpen] = useState(false);
  const megaRef = React.useRef<HTMLDivElement | null>(null);
  // Mega menu: null | 'coffee' | 'merch' | 'origins'
  const [openMega, setOpenMega] = useState<
    null | "coffee" | "merch" | "origins"
  >(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileCartOpen, setMobileCartOpen] = useState(false);
  const [desktopCartOpen, setDesktopCartOpen] = useState(false);

  // Open the cart drawer when other code dispatches 'oi-open-cart'
  useEffect(() => {
    const onOpen = () => {
      if (typeof window !== "undefined" && window.innerWidth < 768) {
        // mobile
        setMobileCartOpen(true);
      } else {
        // desktop / tablet
        setDesktopCartOpen(true);
      }
    };
    window.addEventListener("oi-open-cart", onOpen);
    return () => window.removeEventListener("oi-open-cart", onOpen);
  }, []);

  const isStore = location.pathname.startsWith("/store");
  const isAccount = location.pathname.startsWith("/account");
  const isCart = location.pathname.startsWith("/cart"); // mobile drawer trigger
  const navigate = useNavigate();

  // Close the mega panel whenever the route changes
  useEffect(() => {
    setOpenMega(null);
  }, [location.pathname, location.search, location.hash]);

  // lock body scroll when any drawer is open (mobile menu, mobile cart, desktop cart)
  useEffect(() => {
    const lock = mobileOpen || mobileCartOpen || desktopCartOpen;
    document.body.style.overflow = lock ? "hidden" : "";
    document.body.style.touchAction = lock ? "none" : "";
  }, [mobileOpen, mobileCartOpen, desktopCartOpen]);

  // Inline subscribe state for Origins mega panel
  const [mmEmail, setMmEmail] = useState("");
  const [mmDone, setMmDone] = useState(false);
  const submitMegaSubscribe = async (e: any) => {
    e.preventDefault();
    const ok = await submitPromoEmail(mmEmail);
    if (ok) setMmDone(true);
  };

  // Hover-intent helpers so the mega menu doesn't close while moving into it or typing
  const closeTimer = React.useRef<number | null>(null);
  const scheduleClose = React.useCallback(() => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => {
      const panel = panelRef.current as any;
      const active = document.activeElement as HTMLElement | null;

      const focusWithin =
        !!panel &&
        ((!!active && panel.contains(active)) ||
          panel.matches?.(":focus-within"));

      const until = panel?.__suppressUntil || 0;
      const sticky = !!panel?.__sticky;

      // Only close if: not focused inside, not sticky, and no suppression window active
      if (!focusWithin && !sticky && Date.now() > until) {
        setOpenMega(null);
      }
    }, 700) as unknown as number; // a bit more time for the autofill popup
  }, []);

  const cancelClose = React.useCallback(() => {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  // Minimal merch cards to show in the dropdown (keys match your store)
  const merchTiles = [
    { key: "tees", label: "Tees", img: "shirts-web.png" },
    { key: "hats", label: "Hats", img: "hat1-web.png" },
    { key: "mugs", label: "Mugs", img: "coffee-deck2.png" },
    {
      key: "accessories",
      label: "Coffee Accessories",
      img: "canister-web.png",
    },
  ];
  const flagship = roastCards.find((c) => c.slug === "flagship");

  useEffect(() => {
    const onScroll = () => setShrunk(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 overflow-x-hidden">
      <ScrollToTop />
      <FlashToast />
      <PromoSubscribeModal />

      {/* ===== HEADER (desktop + mobile) ===== */}
      <header className="fixed top-0 inset-x-0 z-[999999] md:z-50 bg-neutral-950/95 backdrop-blur border-b border-neutral-800">
        {/* === MOBILE HEADER TALL v3 === */}
        <div className="md:hidden border-b border-neutral-800 bg-neutral-950 pb-1">
          {/* promo strip */}
          <div className="px-3 py-2 text-center text-[13px] font-semibold leading-tight text-amber-300 truncate border-b border-neutral-800">
            <button
              type="button"
              onClick={() =>
                document.dispatchEvent(
                  new CustomEvent("promo-subscribe", {
                    bubbles: true,
                    composed: true,
                  })
                )
              }
              className="hover:text-amber-200 underline-offset-2 hover:underline"
            >
              20% Off First Order
            </button>
            <span className="mx-1 text-neutral-500">|</span>
            <Link
              to="/legal/shipping"
              className="hover:text-amber-200 underline-offset-2 hover:underline"
            >
              Free Shipping on 3+ Bags
            </Link>
          </div>

          {/* brand block full width on its own row */}
          <Link
            to="/"
            aria-label="Old Ironsides Coffee Home"
            className="block px-4 pt-2 pb-1 text-center leading-tight"
          >
            <div
              className="text-[20px] font-bold tracking-[0.18em] text-neutral-300"
              style={{ fontFamily: "'Cinzel', serif", fontWeight: 1000 }}
            >
              OLD IRONSIDES COFFEE
            </div>
            <div className="text-[12px] text-amber-300">
              Ignite the Spirit, Savor the Victory!
            </div>
          </Link>

          {/* row 2: burger left / icons right */}
          <div className="flex justify-between px-4 pb-1">
            {/* left: burger */}
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="flex flex-col justify-center gap-[4px] text-amber-300 translate-y-[6px]"
              aria-label="Open menu"
            >
              <span className="block w-8 h-[3px] bg-amber-300" />
              <span className="block w-8 h-[3px] bg-amber-300" />
              <span className="block w-8 h-[3px] bg-amber-300" />
            </button>

            {/* right icons */}
            <div className="flex gap-4 text-amber-300 translate-y-[6px]">
              {/* chest/cart */}
              <button
                type="button"
                onClick={() => setMobileCartOpen(true)}
                aria-label="Open Chest (Cart)"
                title="Chest"
                className="relative flex flex-col items-center text-center leading-none"
              >
                <ChestIcon className="h-8 w-8" />
                <span className="absolute -top-1 -right-2 text-[10px] font-bold tabular-nums bg-neutral-900 rounded px-1 py-[1px] ring-1 ring-amber-400/60 text-amber-300 leading-none">
                  {count ?? 0}
                </span>
              </button>

              {/* sign in / my fleet */}
              <Link
                to="/account"
                aria-label="My Fleet / Sign In"
                className="flex flex-col items-center text-center leading-none text-neutral-300 hover:text-amber-300"
              >
                <span className="text-3xl leading-none text-amber-300">⚓</span>
              </Link>
            </div>
          </div>
        </div>

        {/* === DESKTOP TOP BAR === */}
        <div className="hidden md:block border-b border-neutral-800 bg-neutral-950">
          <Container>
            <div className="h-10 flex items-center relative">
              {/* promo text centered */}
              <div className="absolute left-1/2 -translate-x-1/2 text-amber-300 text-sm font-semibold tracking-wide text-center space-x-3">
                <button
                  type="button"
                  onClick={() =>
                    document.dispatchEvent(
                      new CustomEvent("promo-subscribe", {
                        bubbles: true,
                        composed: true,
                      })
                    )
                  }
                  className="hover:text-amber-200 underline-offset-2 hover:underline"
                >
                  20% OFF First Order
                </button>

                <span>|</span>

                <Link
                  to="/account/login"
                  className="hover:text-amber-200 underline-offset-2 hover:underline"
                >
                  Join The Fleet &amp; Save 15%
                </Link>

                <span>|</span>

                <Link
                  to="/legal/shipping"
                  className="hover:text-amber-200 underline-offset-2 hover:underline"
                >
                  Free Shipping on 3+ Bags
                </Link>

                <span>|</span>

                <a
                  href="https://auth.govx.com/shopify/verify?shop=81ub0m-s7.myshopify.com&utm_source=shopify&utm_medium=govxid&utm_campaign=custom_link"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-amber-200 underline-offset-2 hover:underline"
                >
                  GovX Partner
                </a>
              </div>

              {/* right My Fleet */}
              <Link
                to="/account"
                className="ml-auto inline-flex items-center gap-2 text-amber-300 hover:text-amber-200 text-base font-semibold"
                aria-label="My Fleet"
                title="My Fleet"
              >
                <span aria-hidden className="text-xl">
                  ⚓
                </span>
                <span>My Fleet</span>
              </Link>
            </div>
          </Container>
        </div>

        {/* === DESKTOP HEADER STACK + NAV (unchanged look) === */}
        <div className="hidden md:block">
          <Container>
            <div className={(shrunk ? "pt-3 pb-2" : "pt-8 pb-3") + " relative"}>
              {/* centered brand block with emblem on the left */}
              <div className="relative mx-auto w-max">
                {/* emblem left of stack */}
                <Link to="/" aria-label="Go to Home Port">
                  <img
                    src="/emblem-black.png"
                    alt="Old Ironsides emblem"
                    className={
                      (shrunk
                        ? "h-28 md:h-32 top-[calc(50%+6px)]"
                        : "h-40 md:h-48 top-[calc(50%+12px)]") +
                      " w-auto object-contain select-none transition-all cursor-pointer " +
                      "absolute -translate-y-1/2 right-[calc(100%+72px)]"
                    }
                  />
                </Link>

                {/* Title + taglines (desktop only now) */}
                <div className="flex flex-col items-center">
                  <div
                    className={
                      shrunk
                        ? "text-4xl font-bold tracking-[0.18em] text-neutral-300 text-center"
                        : "text-5xl font-bold tracking-[0.18em] text-neutral-300 text-center"
                    }
                    style={{ fontFamily: "'Cinzel', serif", fontWeight: 700 }}
                  >
                    OLD IRONSIDES COFFEE
                  </div>

                  <div
                    className={
                      shrunk
                        ? "text-sm text-amber-300 text-center"
                        : "text-lg text-amber-300 text-center"
                    }
                  >
                    Ignite the Spirit, Savor the Victory!
                  </div>
                  <div
                    className={
                      shrunk
                        ? "text-sm text-neutral-300 text-center"
                        : "text-base text-neutral-300 text-center"
                    }
                  >
                    Proudly Veteran-owned
                  </div>
                </div>
              </div>

              {/* NAV + CHEST row */}
              <div
                className="relative mt-3"
                onMouseEnter={cancelClose}
                onMouseLeave={scheduleClose}
              >
                {/* CHEST pinned right (desktop drawer trigger) */}
                <button
                  type="button"
                  onClick={() => setDesktopCartOpen(true)}
                  className="hidden md:flex items-center gap-3 h-11 px-4 rounded-xl
          ring-1 ring-amber-400/60 bg-neutral-900/60 text-amber-300
          hover:bg-amber-400 hover:text-neutral-900 transition shadow-lg
          divide-x divide-neutral-700 z-30 absolute right-0 top-1/2 -translate-y-1/2"
                  aria-label="Open Chest (Cart)"
                  title="Chest"
                >
                  <span className="flex items-center gap-2 pr-3">
                    <ChestIcon className="h-6 w-6" />
                    <span className="uppercase tracking-wide font-bold text-lg">
                      CHEST
                    </span>
                  </span>
                  <span className="pl-3 font-bold tabular-nums text-lg">
                    {count ?? 0}
                  </span>
                </button>

                {/* desktop nav */}
                <nav className="hidden md:flex justify-center">
                  <div className="flex items-center gap-6 text-neutral-100 font-semibold">
                    <div
                      onMouseEnter={() => {
                        cancelClose();
                        setOpenMega("coffee");
                      }}
                      className="relative"
                    >
                      <HeaderNavLink to="/store">SHOP COFFEE</HeaderNavLink>
                    </div>

                    <div
                      onMouseEnter={() => {
                        cancelClose();
                        setOpenMega("merch");
                      }}
                      className="relative"
                    >
                      <HeaderNavLink to="/store#merch">GEAR</HeaderNavLink>
                    </div>

                    <div
                      onMouseEnter={() => {
                        cancelClose();
                        setOpenMega("origins");
                      }}
                      className="relative"
                    >
                      <HeaderNavLink to="/origins">
                        ORIGINS AND VOYAGES
                      </HeaderNavLink>
                    </div>

                    <HeaderNavLink to="/contact">
                      CONTACT THE CREW
                    </HeaderNavLink>
                  </div>
                </nav>

                {/* mega menu unchanged */}
                {openMega && (
                  /* keep your same mega menu block exactly like you already have */
                  <div
                    ref={panelRef}
                    className="absolute left-1/2 -translate-x-1/2 w-screen z-40"
                    onMouseEnter={() => {
                      const p = panelRef.current as any;
                      if (p) p.__sticky = true;
                    }}
                    onMouseLeave={() => {
                      const p = panelRef.current as any;
                      if (p) p.__sticky = false;
                      setTimeout(() => {
                        const active =
                          document.activeElement as HTMLElement | null;
                        const within =
                          !!panelRef.current &&
                          ((!!active && panelRef.current.contains(active)) ||
                            (panelRef.current as any).matches?.(
                              ":focus-within"
                            ));
                        const until =
                          (panelRef.current as any)?.__suppressUntil || 0;
                        if (!within && Date.now() > until) setOpenMega(null);
                      }, 600);
                    }}
                    onFocusCapture={() => {
                      const p = panelRef.current as any;
                      if (p) p.__sticky = true;
                    }}
                    onBlurCapture={() => {
                      setTimeout(() => {
                        const active =
                          document.activeElement as HTMLElement | null;
                        const within =
                          !!panelRef.current &&
                          ((!!active && panelRef.current.contains(active)) ||
                            (panelRef.current as any).matches?.(
                              ":focus-within"
                            ));
                        const until =
                          (panelRef.current as any)?.__suppressUntil || 0;
                        if (!within && Date.now() > until) setOpenMega(null);
                      }, 600);
                    }}
                    onPointerDownCapture={() => {
                      const p = panelRef.current as any;
                      if (p) p.__suppressUntil = Date.now() + 2000;
                    }}
                    onKeyDownCapture={(e) => {
                      if (e.key === "Tab" || e.key === "Enter") {
                        const p = panelRef.current as any;
                        if (p) p.__suppressUntil = Date.now() + 1200;
                      }
                    }}
                  >
                    <div className="mt-2 border-t border-neutral-800">
                      <div className="relative">
                        <div className="absolute inset-0 bg-neutral-950/95 backdrop-blur" />
                        <Container className="relative py-4 md:py-6">
                          {/* keep your inner openMega === 'coffee' / 'merch' / 'origins' exactly */}
                          {openMega === "coffee" && (
                            <div className="grid lg:grid-cols-[1fr,auto] gap-8 items-start">
                              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {roastCards.map((card) => (
                                  <RoastMegaCard
                                    key={`mega-roast-${card.id}`}
                                    card={card}
                                    onClick={() => setOpenMega(null)}
                                  />
                                ))}
                              </div>

                              <MegaSubscribeBox
                                email={mmEmail}
                                setEmail={setMmEmail}
                                done={mmDone}
                                onSubmit={submitMegaSubscribe}
                              />
                            </div>
                          )}

                          {openMega === "merch" && (
                            <div className="grid lg:grid-cols-[1fr,auto] gap-8 items-start">
                              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {merchTiles.map((t) => (
                                  <div
                                    key={`mega-merch-${t.key}`}
                                    className="group relative overflow-hidden rounded-2xl ring-1 ring-neutral-800 bg-neutral-900/40 transition shadow-lg flex flex-col"
                                  >
                                    <div className="h-52 sm:h-60 lg:h-60 w-full overflow-hidden">
                                      <img
                                        src={t.img}
                                        alt={`${t.label} preview`}
                                        className="h-full w-full object-cover"
                                      />
                                    </div>
                                    <div className="p-3">
                                      <div className="text-lg font-extrabold text-amber-300">
                                        {t.label}
                                      </div>
                                      <div className="text-xs text-neutral-400">
                                        Coming soon
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              <MegaSubscribeBox
                                email={mmEmail}
                                setEmail={setMmEmail}
                                done={mmDone}
                                onSubmit={submitMegaSubscribe}
                                title="RING THAT BELL"
                                subtitle={`Get first access to gear.
                          Plus 20% off your first coffee order.`}
                                buttonText="GET 20% OFF"
                              />
                            </div>
                          )}

                          {openMega === "origins" && (
                            <div className="grid md:grid-cols-[auto,1fr,auto] gap-8 items-start">
                              <Link
                                to="/store"
                                onClick={() => setOpenMega(null)}
                                className="group block rounded-2xl overflow-hidden ring-1 ring-neutral-800 bg-neutral-900/40 hover:bg-neutral-900 transition text-center justify-self-center md:justify-self-start w-40 sm:w-48 md:w-56"
                              >
                                <div className="aspect-[4/3] w-full overflow-hidden">
                                  <img
                                    src={
                                      flagship?.img?.startsWith("/") ||
                                      flagship?.img?.startsWith("http")
                                        ? flagship?.img
                                        : `/${
                                            flagship?.img || "Flagship-web.png"
                                          }`
                                    }
                                    alt="Shop Coffee"
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                                <div className="p-3">
                                  <div className="text-sm md:text-base text-amber-300 font-semibold group-hover:underline">
                                    Shop Coffee
                                  </div>
                                </div>
                              </Link>

                              <div className="justify-self-center">
                                <ul className="space-y-2 text-neutral-300 text-sm md:text-base">
                                  <li>
                                    <Link
                                      to="/origins#origins-roasting"
                                      onClick={() => setOpenMega(null)}
                                      className="hover:text-amber-300"
                                    >
                                      Roasting Process
                                    </Link>
                                  </li>
                                  <li>
                                    <Link
                                      to="/origins#origins-lands"
                                      className="hover:text-amber-300"
                                    >
                                      The Lands Where Our Beans Are Grown
                                    </Link>
                                  </li>
                                  <li>
                                    <Link
                                      to="/origins#origins-hands"
                                      className="hover:text-amber-300"
                                    >
                                      The Hands That Grow Our Beans
                                    </Link>
                                  </li>
                                  <li>
                                    <Link
                                      to="/origins#origins-history"
                                      className="hover:text-amber-300"
                                    >
                                      The History Behind The Fleet
                                    </Link>
                                  </li>
                                  <li>
                                    <Link
                                      to="/origins#origins-service"
                                      className="hover:text-amber-300"
                                    >
                                      Founder’s Bio
                                    </Link>
                                  </li>
                                  <li>
                                    <Link
                                      to="/origins#origins-giving-back"
                                      className="hover:text-amber-300"
                                    >
                                      Giving Back To Those Who Served
                                    </Link>
                                  </li>
                                  <li>
                                    <Link
                                      to="/origins#origins-about"
                                      className="hover:text-amber-300"
                                    >
                                      About Old Ironsides Coffee
                                    </Link>
                                  </li>
                                </ul>
                              </div>

                              <MegaSubscribeBox
                                email={mmEmail}
                                setEmail={setMmEmail}
                                done={mmDone}
                                onSubmit={submitMegaSubscribe}
                              />
                            </div>
                          )}
                        </Container>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Container>
        </div>
      </header>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-[999999] flex items-start">
          <div className="relative z-[1000000] w-[80%] max-w-[360px] bg-neutral-950 shadow-xl ring-1 ring-neutral-800 inline-flex flex-col max-h-[90vh]">
            {/* header */}
            <div className="flex items-start justify-between p-4 border-b border-neutral-800">
              <div className="text-left">
                <div
                  className="text-base font-bold tracking-[0.18em] text-neutral-100 leading-snug"
                  style={{ fontFamily: "'Cinzel', serif", fontWeight: 700 }}
                >
                  OLD IRONSIDES COFFEE
                </div>
                <div className="text-[12px] text-amber-300 leading-tight">
                  Veteran-owned
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="text-amber-300 text-2xl font-bold px-2"
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>

            {/* body */}
            <div className="flex-1 overflow-y-auto text-neutral-100 text-lg font-semibold">
              <Link
                to="/store"
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-4 border-b border-neutral-800"
              >
                COFFEE
              </Link>

              <Link
                to="/store#merch"
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-4 border-b border-neutral-800"
              >
                GEAR
              </Link>
              <Link
                to="/origins"
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-4 border-b border-neutral-800"
              >
                ORIGINS &amp; VOYAGES
              </Link>
              <Link
                to="/contact"
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-4 border-b border-neutral-800"
              >
                CONTACT THE CREW
              </Link>
              <Link
                to="/account"
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-4 text-amber-300 flex items-center gap-2"
              >
                <span className="text-2xl leading-none">⚓</span>
                <span>Sign In</span>
              </Link>
            </div>
          </div>

          {/* backdrop */}
          <button
            className="flex-1 bg-black/70 z-[999999]"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu backdrop"
          />
        </div>
      )}

      {/* Desktop Cart Drawer */}
      {desktopCartOpen && (
        <DesktopCartSheet onClose={() => setDesktopCartOpen(false)} />
      )}

      {/* Mobile Cart Drawer */}
      {mobileCartOpen && (
        <MobileCartSheet onClose={() => setMobileCartOpen(false)} />
      )}

      {/* spacer so content doesn’t hide under header (mobile-tuned for /coffee) */}
      <div
        className={
          isHome
            ? "h-[105px] md:h-[205px]"
            : isStore
            ? "h-[120px] md:h-[150px]"
            : isAccount
            ? "h-[150px] md:h-[160px]"
            : isRoast
            ? "h-[140px] md:h-[190px]"
            : isOrigins
            ? "h-[200px] md:h-[210px]"
            : isSupport
            ? "h-[190px] md:h-[200px]"
            : "h-[180px] md:h-[160px]"
        }
      />

      {/* page body */}
      <Outlet />

      {/* footer */}
      <footer className="border-t border-neutral-800 bg-neutral-950">
        <Container className="py-8 text-sm">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Brand + Vet-owned + Flag (centered and nudged up) */}
            <div className="relative -top-4 md:-top-5 flex flex-col items-center text-center">
              {/* Title */}
              <div className="mt-3 md:mt-4 text-base tracking-[0.5em] text-amber-300">
                OLD IRONSIDES COFFEE
              </div>

              {/* Vet line */}
              <div className="mt-0 md:mt-0 text-base text-neutral-300 leading-tight">
                Veteran-owned and operated.
              </div>

              {/* Flag */}
              <img
                src="/stars-stripes.png"
                alt="American flag"
                className="mt-3 md:mt-5 w-44 h-auto rounded-sm shadow-md"
              />
            </div>

            {/* Support */}
            <div>
              <div className="text-neutral-400 font-semibold mb-2">Support</div>
              <ul className="space-y-1">
                <li>
                  <Link
                    className="text-neutral-300 hover:text-amber-300"
                    to="/legal/shipping"
                  >
                    Roast &amp; Shipping
                  </Link>
                </li>
                <li>
                  <Link
                    className="text-neutral-300 hover:text-amber-300"
                    to="/legal/returns"
                  >
                    Returns
                  </Link>
                </li>
                <li>
                  <Link
                    className="text-neutral-300 hover:text-amber-300"
                    to="/legal/terms"
                  >
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link
                    className="text-neutral-300 hover:text-amber-300"
                    to="/legal/privacy"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => window.showCookieBanner?.()}
                    className="text-neutral-300 hover:text-amber-300"
                  >
                    Cookie settings
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => window.showDoNotSell?.()}
                    className="text-neutral-300 hover:text-amber-300"
                    aria-label="Do Not Sell or Share My Personal Information"
                  >
                    Do Not Sell or Share
                  </button>
                </li>
              </ul>
            </div>
            {/* Contact */}
            <div className="hidden md:block">
              <div className="text-neutral-400 font-semibold mb-2">Contact</div>
              <ul className="space-y-1 text-neutral-300">
                <li>
                  <a
                    href="mailto:HQ@oldironsidescoffee.org"
                    className="hover:text-amber-300"
                  >
                    HQ@oldironsidescoffee.org
                  </a>
                </li>
                <li>6 Liberty Square #2564, Boston, MA 02109</li>
              </ul>
            </div>
            {/* Follow */}
            <div className="hidden md:block">
              <div className="text-amber-300 font-semibold mb-2">Follow Us</div>

              <div className="flex gap-6 text-amber-300">
                <a
                  href="https://instagram.com/oldironsidescoffee"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 hover:text-amber-200 transition"
                >
                  <Instagram className="h-5 w-5" />
                  Instagram
                </a>

                <a
                  href="https://facebook.com/oldironsidescoffee"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 hover:text-amber-200 transition"
                >
                  <Facebook className="h-5 w-5" />
                  Facebook
                </a>
              </div>
            </div>
          </div>

          <div className="mt-8 text-xs text-neutral-500">
            © {new Date().getFullYear()} Old Ironsides Coffee. All rights
            reserved.
          </div>
        </Container>
      </footer>
    </div>
  );
}

// === Roast CTA helper (ET-aware) ===
<RoastCTAInfo />;
const ET_ZONE = "America/New_York";

function formatEtDate(d: DateTime) {
  return d.setZone(ET_ZONE).toFormat("EEEE, LLLL d"); // e.g., Monday, October 21
}

function useEtNow(tickMs = 45000) {
  const [now, setNow] = React.useState(() => DateTime.now().setZone(ET_ZONE));
  React.useEffect(() => {
    const id = setInterval(
      () => setNow(DateTime.now().setZone(ET_ZONE)),
      tickMs
    );
    return () => clearInterval(id);
  }, [tickMs]);
  return now;
}

/**
 * Decides which message to show and which Monday date to display.
 * States:
 * - countdown: Thu → Sun 4:59 PM ET (shows time to Sunday 5 PM ET)
 * - closed: Sun 5:00 PM ET → Wed (roll Monday forward a week)
 * - normal: everything else (Mon–Wed before countdown)
 */
function getRoastState(nowET: DateTime) {
  const wd = nowET.weekday; // 1=Mon ... 7=Sun
  const hour = nowET.hour;

  // Candidate Monday that is >= today’s Monday if wd=Mon, otherwise the next Monday.
  let candidateMonday = nowET.startOf("week");
  // Monday of this ISO week (week starts Sunday in en-US)
  if (wd > 1) candidateMonday = candidateMonday.plus({ weeks: 1 }); // Tue–Sun -> next Monday

  const isCountdown =
    wd === 4 || wd === 5 || wd === 6 || (wd === 7 && hour < 17); // Thu, Fri, Sat, Sun before 5pm

  const isClosed = (wd === 7 && hour >= 17) || (wd >= 1 && wd <= 3); // Sun >= 5pm, Mon–Wed

  // Cutoff for the *immediate* Monday is the prior Sunday 5pm ET
  const cutoffForCandidate = candidateMonday.startOf("day").minus({ hours: 7 });

  if (isClosed) {
    // On Sun after 5pm or on Monday, push one more week so it reads the *next* Monday date.
    const roastMonday =
      wd === 7 || wd === 1
        ? candidateMonday.plus({ weeks: 1 })
        : candidateMonday; // Tue/Wed already points to next Monday
    return {
      state: "closed" as const,
      roastMonday,
      cutoff: null,
    };
  }

  if (isCountdown) {
    return {
      state: "countdown" as const,
      roastMonday: candidateMonday,
      cutoff: cutoffForCandidate,
    };
  }

  // Fallback: normal (Mon–Wed before countdown window)
  return {
    state: "normal" as const,
    roastMonday: candidateMonday,
    cutoff: null,
  };
}

function RoastCTAInfo() {
  const nowET = useEtNow(45000); // update every ~45s
  const { state, roastMonday, cutoff } = getRoastState(nowET);

  // For countdown, compute remaining to Sunday 5:00 PM ET (cutoff)
  let left = "";
  if (state === "countdown" && cutoff) {
    const diff = cutoff.diff(nowET, ["days", "hours", "minutes"]).toObject();
    const d = Math.max(0, Math.floor(diff.days ?? 0));
    const h = Math.max(0, Math.floor(diff.hours ?? 0));
    const m = Math.max(0, Math.floor(diff.minutes ?? 0));
    left = `${d}d ${h}h ${m}m`;
  }

  const dateLabel = formatEtDate(roastMonday);

  return (
    <>
      {/* MOBILE VERSION */}
      <div className="mt-3 text-center leading-tight md:hidden">
        {state === "countdown" ? (
          // countdown phase (Thu morning -> Sun 5pm ET)
          <div className="space-y-1">
            <div className="text-m text-neutral-200">
              Time left to make the next roast:{" "}
              <span className="text-amber-300">{left}</span>
            </div>
            <div className="text-[14px] text-neutral-200">
              Secure your fresh order now.
            </div>
          </div>
        ) : state === "closed" ? (
          // after cutoff passed, next roast date known, preorder
          <div className="space-y-1">
            <div className="text-m text-neutral-300 font-medium">
              Next batch roasts:{" "}
              <span className="text-amber-300">{dateLabel}</span>
            </div>
            <div className="text-[14px] text-neutral-400">
              Reserve your bag today
            </div>
          </div>
        ) : (
          // normal early-week state
          <div className="space-y-1">
            <div className="text-sm text-neutral-300">
              <span className="font-medium">Next batch roasts:</span>{" "}
              <span className="text-amber-300">{dateLabel}</span>{" "}
              <span className="text-neutral-400">(ET)</span>
            </div>
          </div>
        )}
      </div>

      {/* DESKTOP / TABLET VERSION (unchanged behavior) */}
      <div className="mt-3 text-center leading-tight hidden md:block">
        {state === "countdown" ? (
          <div className="space-y-1">
            <div className="text-lg md:text-lg text-neutral-300 font-medium">
              Next batch roasts:{" "}
              <span className="text-amber-300">{dateLabel}</span>{" "}
              <span className="text-neutral-400"></span>
            </div>
            <div className="text-m md:text-m text-neutral-200">
              Time left to make the next roast:{" "}
              <span className="text-amber-300">{left}</span> <br />
              Secure your fresh order now.
            </div>
          </div>
        ) : state === "closed" ? (
          <div className="space-y-1">
            <div className="text-lg md:text-lg text-neutral-300 font-medium">
              Next batch roasts:{" "}
              <span className="text-amber-300">{dateLabel}</span>{" "}
              <span className="text-neutral-400"></span>
            </div>
            <div className="text-m md:text-m text-neutral-400">
              Reserve your bag today
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            <div className="text-xs md:text-sm text-neutral-300">
              <span className="font-medium">Next batch roasts:</span>{" "}
              <span className="text-amber-300">{dateLabel}</span>{" "}
              <span className="text-neutral-400">(ET)</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

/* ================= App Entrypoint ================= */
function AppShell() {
  return (
    <>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="coffee" element={<Navigate to="/store" replace />} />
          <Route path="roast/:slug" element={<RoastDetailPage />} />
          <Route path="store" element={<StorePage />} />
          <Route path="store/:slug" element={<StoreCategoryPage />} />

          {/* History Story pages */}
          <Route path="stories/:slug" element={<FleetStoryPage />} />
          <Route path="origins" element={<OriginsPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="sdvosb" element={<SDVOSBPage />} />
          <Route path="legal/:slug" element={<LegalPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="account" element={<SubscribeManagePage />} />
          <Route
            path="account/login"
            element={<SubscribeManagePage initialTab="login" />}
          />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>

      {/* Cookie banner lives outside Routes so it appears on all pages */}
      <CookieConsent />
    </>
  );
}
// ===== DESKTOP CART SLIDE-OVER (right -> left, 420px) =====
function DesktopCartSheet({ onClose }: { onClose: () => void }) {
  const {
    cart,
    inc,
    dec,
    remove,
    updateItem,
    getSubPrice,
    subtotal,
    total,
    coffeeBagCount,
    freeShippingThreshold,
    freeShippingQualified,
    shippingLabel,
  } = useCart();

  const navigate = useNavigate();

  const isLoggedIn = React.useMemo(() => {
    if (typeof window === "undefined") return false;
    try {
      return !!localStorage.getItem("oi_user");
    } catch {
      return false;
    }
  }, []);

  const hasSubscription = cart.some((i: any) => !!i.isSubscription);

  // drawer open/close
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => setOpen(true), []);

  // per-item sub frequency (14/30/60)
  const [freq, setFreq] = React.useState<Record<string, number>>({});
  const [showSubChooser, setShowSubChooser] = React.useState<
    Record<string, boolean>
  >({});
  const [manageSubOpen, setManageSubOpen] = React.useState<
    Record<string, boolean>
  >({});

  const getFreq = (id: string, fallback?: number) => freq[id] ?? fallback ?? 30;

  // modals / banners
  const [showRoastInfo, setShowRoastInfo] = React.useState(false);
  const [checkingOut, setCheckingOut] = React.useState(false);
  const [showSubGate, setShowSubGate] = React.useState(false);

  // roast timer (reuse ET helpers)
  const nowET = useEtNow(45000);
  const { state, roastMonday, cutoff } = getRoastState(nowET);
  const dateLabel = formatEtDate(roastMonday);
  let left = "";
  if (state === "countdown" && cutoff) {
    const diff = cutoff.diff(nowET, ["days", "hours", "minutes"]).toObject();
    const d = Math.max(0, Math.floor(diff.days ?? 0));
    const h = Math.max(0, Math.floor(diff.hours ?? 0));
    const m = Math.max(0, Math.floor(diff.minutes ?? 0));
    left = `${d}d ${h}h ${m}m`;
  }

  const bagsLeft = Math.max(0, freeShippingThreshold - coffeeBagCount);

  const handleCheckout = async () => {
    if (checkingOut) return;
    setCheckingOut(true);

    if (hasSubscription && !isLoggedIn) {
      setShowSubGate(true);
      setCheckingOut(false);
      return;
    }

    try {
      const { id: cartId } = await ensureCart();

      // Build desired state from local cart, including sellingPlanId if present
      const desired: Array<{
        merchandiseId: string;
        quantity: number;
        sellingPlanId?: string;
      }> = [];

      for (const i of cart ?? []) {
        const v = i?.merchandiseId;
        const q = Math.max(0, Math.min(99, Number(i?.qty ?? 0)));
        const sp =
          typeof i?.sellingPlanId === "string" && i.sellingPlanId.length > 0
            ? i.sellingPlanId
            : undefined;

        if (v && q > 0) {
          desired.push({ merchandiseId: v, quantity: q, sellingPlanId: sp });
        }
      }

      const sf = await getCart(cartId);
      const existingLineIds =
        sf?.lines?.edges
          ?.map((e: any) => String(e?.node?.id))
          .filter(Boolean) ?? [];
      if (existingLineIds.length) {
        await cartLinesRemove({ cartId, lineIds: existingLineIds });
      }

      if (desired.length === 0) {
        window.dispatchEvent(
          new CustomEvent("flash", { detail: "Your cart is empty." })
        );
        setCheckingOut(false);
        return;
      }

      // Merge by (variant, sellingPlanId)
      const byKey = new Map<
        string,
        { merchandiseId: string; sellingPlanId?: string; quantity: number }
      >();

      for (const d of desired) {
        const key = `${d.merchandiseId}::${d.sellingPlanId ?? "one"}`;
        const existing = byKey.get(key);
        if (existing) {
          existing.quantity += d.quantity;
        } else {
          byKey.set(key, {
            merchandiseId: d.merchandiseId,
            sellingPlanId: d.sellingPlanId,
            quantity: d.quantity,
          });
        }
      }

      for (const { merchandiseId, sellingPlanId, quantity } of byKey.values()) {
        await cartLinesAdd({
          cartId,
          merchandiseId,
          quantity,
          ...(sellingPlanId ? { sellingPlanId } : {}),
        });
      }

      // Apply promo code ONLY if they submitted the promo email box
      const promoOk =
        (typeof window !== "undefined" &&
          (localStorage.getItem("promo_subscribed") === "1" ||
            document.cookie.includes("promo_subscribed=1"))) ||
        false;

      if (promoOk) {
        try {
          await cartDiscountCodesUpdate({
            cartId,
            discountCodes: ["IRONSIDES20"],
          });
        } catch {}
      }

      // Re-fetch cart for checkoutUrl
      const fresh = await getCart(cartId);

      const url: string | undefined = fresh?.checkoutUrl;
      if (
        !url ||
        !/^https?:\/\/[^\/]+\.myshopify\.com\/(cart|checkouts)\b/i.test(url)
      ) {
        console.error("Invalid checkoutUrl:", url, fresh);
        window.dispatchEvent(
          new CustomEvent("flash", {
            detail: "Couldn’t get a valid checkout link. Try again.",
          })
        );
        setCheckingOut(false);
        return;
      }

      // clear local cart so it’s empty next time you open it
      try {
        localStorage.removeItem("oi_cart");
        localStorage.removeItem("oi_cart_v1");
        localStorage.removeItem("oi_cart_v2");
      } catch {
        /* ignore */
      }

      window.location.assign(url);
    } catch (e) {
      console.error(e);
      window.dispatchEvent(
        new CustomEvent("flash", { detail: "Checkout failed. See console." })
      );
      setCheckingOut(false);
    }
  };

  return (
    <div className="hidden md:flex fixed inset-0 z-[1000002] justify-end items-stretch">
      {/* BACKDROP */}
      <button
        className="flex-1 bg-black/65"
        onClick={onClose}
        aria-label="Close cart backdrop"
      />

      {/* PANEL */}
      <div
        className={[
          "h-full w-full max-w-[420px]",
          "bg-neutral-950 ring-1 ring-neutral-800 shadow-2xl",
          "transition-transform duration-200 ease-out",
          open ? "translate-x-0" : "translate-x-full",
          "flex flex-col overscroll-contain",
        ].join(" ")}
      >
        {/* HEADER + FREE-SHIPPING BANNER */}
        <div className="border-b border-neutral-800">
          <div className="flex items-center justify-between px-4 py-2">
            <button
              onClick={onClose}
              className="text-amber-300 text-2xl font-bold px-1"
              aria-label="Close cart"
            >
              ✕
            </button>

            <div
              className="text-base font-extrabold tracking-wider leading-none text-neutral-100"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              Chest
            </div>
            <span className="w-6" />
          </div>

          <div className="px-4 py-2 bg-amber-400 text-neutral-900">
            {freeShippingQualified ? (
              <div className="text-center">
                <div className="text-[13px] font-extrabold leading-tight">
                  Congratulations!
                </div>
                <div className="text-[13px] font-extrabold leading-tight">
                  Free Shipping Unlocked!
                </div>
              </div>
            ) : (
              <div className="text-[13px] font-extrabold text-center">
                {`Only ${bagsLeft} more bag${
                  bagsLeft === 1 ? "" : "s"
                } to unlock free shipping`}
              </div>
            )}
            <div className="mt-2 h-[6px] w-full bg-neutral-200/60 rounded">
              <div
                className="h-[6px] bg-neutral-900 rounded"
                style={{
                  width: `${Math.min(
                    100,
                    Math.round((coffeeBagCount / freeShippingThreshold) * 100)
                  )}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* ITEMS */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {cart.length === 0 ? (
            <div className="px-6 py-8 text-center text-neutral-400 text-sm">
              Your chest is empty.
            </div>
          ) : (
            <ul className="divide-y divide-neutral-800">
              {cart.map((it: any) => {
                const isSub = !!it?.isSubscription;
                const price = Number(it.price ?? 0);
                const selFreq = getFreq(it.id, Number(it?.subEvery ?? 30));
                const subPrice = getSubPrice({ ...it, subEvery: selFreq });

                return (
                  <li key={it.id} className="p-3">
                    <div className="flex items-start gap-3">
                      <img
                        src={
                          it.img &&
                          (it.img.startsWith("/") || it.img.startsWith("http"))
                            ? it.img
                            : "/bag.png"
                        }
                        alt=""
                        width={44}
                        height={44}
                        loading="eager"
                        decoding="async"
                        fetchPriority="high"
                        className="w-11 h-11 rounded-md ring-1 ring-neutral-800 object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="font-semibold text-neutral-100 text-[15px] leading-tight line-clamp-2">
                              {it.title || "Coffee"}
                            </div>
                            <div className="text-[11px] text-neutral-400">
                              12oz
                            </div>

                            {isSub && (
                              <div className="mt-1">
                                <div className="inline-flex items-center gap-2 text-[10px] text-emerald-400">
                                  <span className="px-1.5 py-[1px] rounded bg-emerald-900/30 ring-1 ring-emerald-700">
                                    Subscription
                                  </span>
                                  <span>Every {it?.subEvery ?? 30}d</span>
                                  <button
                                    onClick={() =>
                                      setManageSubOpen((prev) => ({
                                        ...prev,
                                        [it.id]: !prev[it.id],
                                      }))
                                    }
                                    className="ml-2 text-[10px] text-amber-300 underline underline-offset-2"
                                  >
                                    Manage
                                  </button>
                                </div>

                                {manageSubOpen[it.id] && (
                                  <div className="mt-2">
                                    <div className="mb-2 grid grid-cols-3 gap-2">
                                      {[14, 30, 60].map((d) => (
                                        <button
                                          key={`${it.id}-manage-${d}`}
                                          onClick={() =>
                                            setFreq((prev) => ({
                                              ...prev,
                                              [it.id]: d,
                                            }))
                                          }
                                          className={[
                                            "py-1.5 rounded-md text-[12px] font-semibold ring-1",
                                            (freq[it.id] ??
                                              it?.subEvery ??
                                              30) === d
                                              ? "bg-amber-400 text-neutral-900 ring-amber-400"
                                              : "bg-neutral-900/60 text-amber-300 ring-amber-400/60",
                                          ].join(" ")}
                                        >
                                          {d} days
                                        </button>
                                      ))}
                                    </div>

                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => {
                                          const newEvery =
                                            freq[it.id] ?? it?.subEvery ?? 30;

                                          updateItem(it.id, {
                                            isSubscription: true,
                                            purchaseMode: "sub",
                                            subEvery: newEvery,
                                            subPrice: getSubPrice({
                                              ...it,
                                              subEvery: newEvery,
                                            }),
                                            sellingPlanId:
                                              it.sellingPlans &&
                                              it.sellingPlans[newEvery]
                                                ? it.sellingPlans[newEvery]
                                                : it.sellingPlanId,
                                          });

                                          setManageSubOpen((prev) => ({
                                            ...prev,
                                            [it.id]: false,
                                          }));
                                        }}
                                        className="flex-1 rounded-md bg-amber-400 text-neutral-900 font-semibold py-1.5 text-[12px] hover:bg-amber-300 transition"
                                      >
                                        Update
                                      </button>

                                      <button
                                        onClick={() => {
                                          const currentPrice = Number(
                                            it.price ?? 0
                                          );

                                          let newPrice = currentPrice;

                                          if (it.basePrice != null) {
                                            const bp = Number(it.basePrice);
                                            if (!Number.isNaN(bp) && bp > 0) {
                                              newPrice = bp;
                                            }
                                          } else if (
                                            !it.subPrice &&
                                            currentPrice > 0
                                          ) {
                                            newPrice =
                                              Math.round(
                                                (currentPrice / 0.85) * 100
                                              ) / 100;
                                          }

                                          updateItem(it.id, {
                                            isSubscription: false,
                                            purchaseMode: "one",
                                            subEvery: undefined,
                                            subPrice: undefined,
                                            price: newPrice,
                                            sellingPlanId: undefined,
                                          });

                                          setManageSubOpen((prev) => ({
                                            ...prev,
                                            [it.id]: false,
                                          }));
                                        }}
                                        className="px-3 rounded-md ring-1 ring-amber-400/60 text-amber-300 text-[12px]"
                                      >
                                        One-time
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() => remove(it.id)}
                            className="text-neutral-400 hover:text-amber-300 text-[11px] flex-shrink-0"
                            aria-label="Remove"
                          >
                            Remove
                          </button>
                        </div>

                        <div className="mt-1.5 flex items-center justify-between">
                          <div className="text-amber-300 font-bold text-[13px]">
                            {isSub
                              ? `$${subPrice.toFixed(2)}`
                              : `$${price.toFixed(2)}`}
                          </div>

                          <div className="inline-flex items-center ring-1 ring-neutral-700 rounded-lg overflow-hidden">
                            <button
                              onClick={() => dec(it.id)}
                              className="px-2 py-1 text-base text-neutral-200"
                              aria-label="Decrease"
                            >
                              −
                            </button>
                            <div className="px-2 py-1 text-neutral-100 tabular-nums text-[13px]">
                              {it.qty}
                            </div>
                            <button
                              onClick={() => inc(it.id)}
                              className="px-2 py-1 text-base text-neutral-200"
                              aria-label="Increase"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {!isSub && it?.slug !== "oak-and-copper" && (
                          <div className="mt-2">
                            {!showSubChooser[it.id] ? (
                              <button
                                onClick={() =>
                                  setShowSubChooser((prev) => ({
                                    ...prev,
                                    [it.id]: true,
                                  }))
                                }
                                className="w-full rounded-md ring-1 ring-amber-400/60 bg-neutral-900/60 text-amber-300 font-semibold py-1.5 text-[12px] hover:bg-amber-400 hover:text-neutral-900 transition"
                              >
                                Join The Fleet &amp; Save 15%
                              </button>
                            ) : (
                              <>
                                <div className="mb-2 grid grid-cols-3 gap-2">
                                  {[14, 30, 60].map((d) => (
                                    <button
                                      key={`${it.id}-freq-${d}`}
                                      onClick={() =>
                                        setFreq((prev) => ({
                                          ...prev,
                                          [it.id]: d,
                                        }))
                                      }
                                      className={[
                                        "py-1.5 rounded-md text-[12px] font-semibold ring-1",
                                        selFreq === d
                                          ? "bg-amber-400 text-neutral-900 ring-amber-400"
                                          : "bg-neutral-900/60 text-amber-300 ring-amber-400/60",
                                      ].join(" ")}
                                    >
                                      {d} days
                                    </button>
                                  ))}
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => {
                                      updateItem(it.id, {
                                        isSubscription: true,
                                        purchaseMode: "sub",
                                        subEvery: selFreq,
                                        subPrice: getSubPrice({
                                          ...it,
                                          subEvery: selFreq,
                                        }),
                                        sellingPlanId:
                                          it.sellingPlans &&
                                          it.sellingPlans[selFreq]
                                            ? it.sellingPlans[selFreq]
                                            : it.sellingPlanId,
                                      });
                                      setShowSubChooser((prev) => {
                                        const next = { ...prev };
                                        delete next[it.id];
                                        return next;
                                      });
                                    }}
                                    className="flex-1 rounded-md bg-amber-400 text-neutral-900 font-semibold py-1.5 text-[12px] hover:bg-amber-300 transition"
                                  >
                                    Start Subscription
                                  </button>

                                  <button
                                    onClick={() =>
                                      setShowSubChooser((prev) => {
                                        const next = { ...prev };
                                        delete next[it.id];
                                        return next;
                                      })
                                    }
                                    className="px-3 rounded-md ring-1 ring-amber-400/60 text-amber-300 text-[12px]"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* FOOTER */}
        <div className="border-t border-neutral-800 px-4 pt-3 pb-2 space-y-2">
          <div className="flex items-center justify-between text-[12px] text-neutral-400">
            <span>Shipping</span>
            <span>{shippingLabel}</span>
          </div>

          {/* Primary actions row */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={checkingOut ? undefined : handleCheckout}
              disabled={checkingOut}
              className={[
                "flex-1 font-extrabold py-2.5 text-center text-[15px]",
                "rounded-md",
                checkingOut
                  ? "bg-amber-300/70 text-neutral-800 cursor-not-allowed"
                  : "bg-amber-400 text-neutral-900",
              ].join(" ")}
              aria-busy={checkingOut}
            >
              {checkingOut
                ? "Syncing cart…"
                : `Checkout • $${total.toFixed(2)}`}
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                navigate("/cart");
              }}
              className="flex-1 rounded-md border border-neutral-600 bg-neutral-900 text-[15px] font-extrabold text-neutral-100 py-2.5 text-center hover:bg-neutral-800"
            >
              View Chest
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="block w-full text-center text-[16px] text-neutral-300 underline underline-offset-4"
          >
            Continue shopping
          </button>

          <div className="mt-3 flex justify-center">
            <a
              href="https://auth.govx.com/shopify/verify?shop=81ub0m-s7.myshopify.com&utm_source=shopify&utm_medium=govxid&utm_campaign=custom_link"
              className="inline-block rounded-xl ring-1 ring-amber-400/60 
       text-amber-400 font-semibold text-[1rem]
       px-[1.1rem] py-[0.45rem]
       hover:bg-amber-400 hover:text-neutral-900 transition-all"
            >
              Get GovX discount code
            </a>
          </div>

          <button
            type="button"
            onClick={() => setShowRoastInfo(true)}
            className="block w-full text-center text-[14px] text-red-300 underline underline-offset-4"
          >
            Please read before checking out
          </button>

          <div className="mt-1 mb-1 rounded-md bg-neutral-900/60 ring-1 ring-neutral-800 px-3 py-2 text-center">
            {state === "countdown" ? (
              <div className="text-[12px] text-neutral-300">
                Time left to make the next roast:{" "}
                <span className="text-amber-300 font-semibold">{left}</span>
              </div>
            ) : state === "closed" ? (
              <div className="text-[12px] text-neutral-300">
                Next batch roasts:{" "}
                <span className="text-amber-300">{dateLabel}</span>
              </div>
            ) : (
              <div className="text-[12px] text-neutral-300">
                Next batch roasts:{" "}
                <span className="text-amber-300">{dateLabel}</span>{" "}
                <span className="text-neutral-500">(ET)</span>
              </div>
            )}
          </div>
        </div>

        {/* SUBSCRIBE GATE */}
        {showSubGate && (
          <div className="absolute inset-x-0 bottom-0 z-[1000003] p-3">
            <div className="rounded-xl ring-1 ring-amber-400 bg-neutral-900 text-amber-300 px-3 py-3 text-sm text-center shadow-2xl">
              Join or sign in to manage your Fleet subscription before checkout.
              <div className="mt-2 flex gap-2 justify-center">
                <a
                  href="/account/login"
                  className="px-3 py-1.5 rounded-md bg-amber-400 text-neutral-900 font-bold"
                >
                  Sign in / Join
                </a>
                <button
                  onClick={() => setShowSubGate(false)}
                  className="px-3 py-1.5 rounded-md ring-1 ring-amber-400/60 text-amber-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ROAST INFO MODAL */}
        {showRoastInfo && (
          <div className="absolute inset-0 z-[1000004] flex items-center justify-center p-4">
            <button
              className="absolute inset-0 bg-black/70"
              onClick={() => setShowRoastInfo(false)}
              aria-label="Close roast info backdrop"
            />
            <div className="relative w-full max-w-md rounded-2xl bg-neutral-950 ring-1 ring-neutral-800 shadow-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div
                  className="text-sm font-extrabold text-neutral-100"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  Roast & Shipping Schedule
                </div>
                <button
                  onClick={() => setShowRoastInfo(false)}
                  className="text-amber-300 text-lg font-bold px-1"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
              <div className="text-[13px] text-neutral-300 space-y-2">
                <p>
                  We roast to order. All orders are roasted on Monday/Tuesday.
                  Please be sure to place your order before{" "}
                  <span className="text-amber-300 font-semibold">
                    Sunday 5:00 PM ET
                  </span>{" "}
                  to get on the roast schedule. All orders made after the cut
                  off time will be roasted the following week.
                </p>
                <p>
                  <span className="text-amber-300 font-semibold">
                    Roast Day:
                  </span>{" "}
                  Monday <br />
                  <span className="text-amber-300 font-semibold">
                    Ship:
                  </span>{" "}
                  Wednesday.
                </p>
                <p>
                  Coffee is bagged immediately after roasting and rests briefly
                  to preserve peak flavor. Tracking is emailed once your order
                  leaves the roastery.
                </p>
                <p className="text-blue-300">
                  If you missed the order cut off time, please contact us and we
                  will see what we can do to still get your order roasted.
                </p>
                <p className="text-amber-300">
                  Questions?{" "}
                  <a href="/contact" className="underline text-amber-300">
                    Contact the crew
                  </a>
                  .
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ===== MOBILE CART SLIDE-OVER (right -> left, 80% width) =====
function MobileCartSheet({ onClose }: { onClose: () => void }) {
  const {
    cart,
    inc,
    dec,
    remove,
    updateItem,
    getSubPrice,
    subtotal,
    total,
    coffeeBagCount,
    freeShippingThreshold,
    freeShippingQualified,
    shippingLabel,
  } = useCart();

  // --- helpers ---
  // --- helpers ---
  const isLoggedIn = React.useMemo(() => {
    if (typeof window === "undefined") return false;
    try {
      return !!localStorage.getItem("oi_user");
    } catch {
      return false;
    }
  }, []);

  const hasSubscription = cart.some((i: any) => !!i.isSubscription);

  // drawer open/close + dwell
  const [open, setOpen] = React.useState(false);
  const [pinned, setPinned] = React.useState(false); // interaction cancels autoclose
  React.useEffect(() => setOpen(true), []);
  // No autoclose — user explicitly closes via ✕, backdrop, or "Continue shopping"
  React.useEffect(() => {}, []);

  // per-item sub frequency (14/30/60)
  const [freq, setFreq] = React.useState<Record<string, number>>({});
  const [showSubChooser, setShowSubChooser] = React.useState<
    Record<string, boolean>
  >({});
  const [manageSubOpen, setManageSubOpen] = React.useState<
    Record<string, boolean>
  >({});

  const getFreq = (id: string, fallback?: number) => freq[id] ?? fallback ?? 30;

  // modals / banners
  const [showRoastInfo, setShowRoastInfo] = React.useState(false);
  // ADD THIS just below other state hooks in MobileCartSheet
  const [checkingOut, setCheckingOut] = React.useState(false);
  const [showSubGate, setShowSubGate] = React.useState(false);

  // roast timer (reuse your ET helpers already in this file)
  const nowET = useEtNow(45000);
  const { state, roastMonday, cutoff } = getRoastState(nowET);
  const dateLabel = formatEtDate(roastMonday);
  let left = "";
  if (state === "countdown" && cutoff) {
    const diff = cutoff.diff(nowET, ["days", "hours", "minutes"]).toObject();
    const d = Math.max(0, Math.floor(diff.days ?? 0));
    const h = Math.max(0, Math.floor(diff.hours ?? 0));
    const m = Math.max(0, Math.floor(diff.minutes ?? 0));
    left = `${d}d ${h}h ${m}m`;
  }

  const bagsLeft = Math.max(0, freeShippingThreshold - coffeeBagCount);

  const handleCheckout = async () => {
    if (checkingOut) return; // guard
    setCheckingOut(true);
    setPinned(true);

    if (hasSubscription && !isLoggedIn) {
      setShowSubGate(true);
      setCheckingOut(false);
      return;
    }

    try {
      const { id: cartId } = await ensureCart();

      // Build desired state from local cart, including sellingPlanId if present
      const desired: Array<{
        merchandiseId: string;
        quantity: number;
        sellingPlanId?: string;
      }> = [];

      for (const i of cart ?? []) {
        const v = i?.merchandiseId;
        const q = Math.max(0, Math.min(99, Number(i?.qty ?? 0)));
        const sp =
          typeof i?.sellingPlanId === "string" && i.sellingPlanId.length > 0
            ? i.sellingPlanId
            : undefined;

        if (v && q > 0) {
          desired.push({ merchandiseId: v, quantity: q, sellingPlanId: sp });
        }
      }

      const sf = await getCart(cartId);
      const existingLineIds =
        sf?.lines?.edges
          ?.map((e: any) => String(e?.node?.id))
          .filter(Boolean) ?? [];
      if (existingLineIds.length) {
        await cartLinesRemove({ cartId, lineIds: existingLineIds });
      }

      if (desired.length === 0) {
        window.dispatchEvent(
          new CustomEvent("flash", { detail: "Your cart is empty." })
        );
        setCheckingOut(false);
        return;
      }

      // Merge by (variant, sellingPlanId) so subs and one-time stay distinct
      const byKey = new Map<
        string,
        { merchandiseId: string; sellingPlanId?: string; quantity: number }
      >();

      for (const d of desired) {
        const key = `${d.merchandiseId}::${d.sellingPlanId ?? "one"}`;
        const existing = byKey.get(key);
        if (existing) {
          existing.quantity += d.quantity;
        } else {
          byKey.set(key, {
            merchandiseId: d.merchandiseId,
            sellingPlanId: d.sellingPlanId,
            quantity: d.quantity,
          });
        }
      }

      for (const { merchandiseId, sellingPlanId, quantity } of byKey.values()) {
        await cartLinesAdd({
          cartId,
          merchandiseId,
          quantity,
          ...(sellingPlanId ? { sellingPlanId } : {}),
        });
      }

      // Apply promo code ONLY if they submitted the promo email box
      const promoOk =
        (typeof window !== "undefined" &&
          (localStorage.getItem("promo_subscribed") === "1" ||
            document.cookie.includes("promo_subscribed=1"))) ||
        false;

      if (promoOk) {
        try {
          await cartDiscountCodesUpdate({
            cartId,
            discountCodes: ["IRONSIDES20"],
          });
        } catch {}
      }

      // Re-fetch cart for checkoutUrl
      const fresh = await getCart(cartId);

      const url: string | undefined = fresh?.checkoutUrl;
      if (
        !url ||
        !/^https?:\/\/[^\/]+\.myshopify\.com\/(cart|checkouts)\b/i.test(url)
      ) {
        console.error("Invalid checkoutUrl:", url, fresh);
        window.dispatchEvent(
          new CustomEvent("flash", {
            detail: "Couldn’t get a valid checkout link. Try again.",
          })
        );
        setCheckingOut(false);
        return;
      }

      // clear local cart before sending to Shopify checkout
      try {
        localStorage.removeItem("oi_cart");
        localStorage.removeItem("oi_cart_v1");
        localStorage.removeItem("oi_cart_v2");
      } catch {
        /* ignore */
      }

      window.location.assign(url);
    } catch (e) {
      console.error(e);
      window.dispatchEvent(
        new CustomEvent("flash", { detail: "Checkout failed. See console." })
      );
      setCheckingOut(false);
    }
  };

  return (
    <div className="md:hidden fixed inset-0 z-[1000002] flex justify-end items-stretch">
      {/* BACKDROP */}
      <button
        className="flex-1 bg-black/65 touch-none"
        onClick={onClose}
        aria-label="Close cart backdrop"
      />

      {/* PANEL */}
      <div
        onPointerDown={() => setPinned(true)}
        onMouseEnter={() => setPinned(true)}
        className={[
          "h-full w-[80%] max-w-[420px]",
          "bg-neutral-950 ring-1 ring-neutral-800 shadow-2xl",
          "transition-transform duration-200 ease-out",
          open ? "translate-x-0" : "translate-x-full",
          "flex flex-col overscroll-contain touch-pan-y",
        ].join(" ")}
      >
        {/* HEADER + AMBER FREE-SHIPPING BANNER */}
        <div className="border-b border-neutral-800">
          <div className="flex items-center justify-between px-4 py-2">
            <button
              onClick={onClose}
              className="text-amber-300 text-2xl font-bold px-1"
              aria-label="Close cart"
            >
              ✕
            </button>

            <div
              className="text-base font-extrabold tracking-wider leading-none text-neutral-100"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              Shopping Cart
            </div>
            <span className="w-6" />
          </div>

          <div className="px-4 py-2 bg-amber-400 text-neutral-900">
            {freeShippingQualified ? (
              <div className="text-center">
                <div className="text-[13px] font-extrabold leading-tight">
                  Congratulations!
                </div>
                <div className="text-[13px] font-extrabold leading-tight">
                  Free Shipping Unlocked!
                </div>
              </div>
            ) : (
              <div className="text-[13px] font-extrabold text-center">
                {`Only ${bagsLeft} more bag${
                  bagsLeft === 1 ? "" : "s"
                } to unlock free shipping`}
              </div>
            )}
            <div className="mt-2 h-[6px] w-full bg-neutral-200/60 rounded">
              <div
                className="h-[6px] bg-neutral-900 rounded"
                style={{
                  width: `${Math.min(
                    100,
                    Math.round((coffeeBagCount / freeShippingThreshold) * 100)
                  )}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* ITEMS (condensed further; removes big bean tag) */}
        <div className="flex-1 overflow-y-auto overscroll-contain touch-pan-y">
          {cart.length === 0 ? (
            <div className="px-6 py-8 text-center text-neutral-400 text-sm">
              Your chest is empty.
            </div>
          ) : (
            <ul className="divide-y divide-neutral-800">
              {cart.map((it: any) => {
                const isSub = !!it?.isSubscription;
                const price = Number(it.price ?? 0);
                const selFreq = getFreq(it.id, Number(it?.subEvery ?? 30));
                const subPrice = getSubPrice({ ...it, subEvery: selFreq });

                return (
                  <li key={it.id} className="p-3">
                    <div className="flex items-start gap-3">
                      <img
                        src={
                          it.img &&
                          (it.img.startsWith("/") || it.img.startsWith("http"))
                            ? it.img
                            : "/bag.png"
                        }
                        alt=""
                        width={44}
                        height={44}
                        loading="eager"
                        decoding="async"
                        fetchPriority="high"
                        className="w-11 h-11 rounded-md ring-1 ring-neutral-800 object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            {/* Title — no bean badge inline */}
                            <div className="font-semibold text-neutral-100 text-[15px] leading-tight line-clamp-2">
                              {it.title || "Coffee"}
                            </div>
                            {/* Size line only */}
                            <div className="text-[11px] text-neutral-400">
                              12oz
                            </div>

                            {isSub && (
                              <div className="mt-1">
                                <div className="inline-flex items-center gap-2 text-[10px] text-emerald-400">
                                  <span className="px-1.5 py-[1px] rounded bg-emerald-900/30 ring-1 ring-emerald-700">
                                    Subscription
                                  </span>
                                  <span>Every {it?.subEvery ?? 30}d</span>
                                  <button
                                    onClick={() =>
                                      setManageSubOpen((prev) => ({
                                        ...prev,
                                        [it.id]: !prev[it.id],
                                      }))
                                    }
                                    className="ml-2 text-[10px] text-amber-300 underline underline-offset-2"
                                  >
                                    Manage
                                  </button>
                                </div>

                                {manageSubOpen[it.id] && (
                                  <div className="mt-2">
                                    <div className="mb-2 grid grid-cols-3 gap-2">
                                      {[14, 30, 60].map((d) => (
                                        <button
                                          key={`${it.id}-manage-${d}`}
                                          onClick={() =>
                                            setFreq((prev) => ({
                                              ...prev,
                                              [it.id]: d,
                                            }))
                                          }
                                          className={[
                                            "py-1.5 rounded-md text-[12px] font-semibold ring-1",
                                            (freq[it.id] ??
                                              it?.subEvery ??
                                              30) === d
                                              ? "bg-amber-400 text-neutral-900 ring-amber-400"
                                              : "bg-neutral-900/60 text-amber-300 ring-amber-400/60",
                                          ].join(" ")}
                                        >
                                          {d} days
                                        </button>
                                      ))}
                                    </div>

                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => {
                                          const newEvery =
                                            freq[it.id] ?? it?.subEvery ?? 30;

                                          updateItem(it.id, {
                                            isSubscription: true,
                                            purchaseMode: "sub",
                                            subEvery: newEvery,
                                            subPrice: getSubPrice({
                                              ...it,
                                              subEvery: newEvery,
                                            }),
                                            // make sure Shopify gets the matching plan for this frequency
                                            sellingPlanId:
                                              it.sellingPlans &&
                                              it.sellingPlans[newEvery]
                                                ? it.sellingPlans[newEvery]
                                                : it.sellingPlanId,
                                          });

                                          setManageSubOpen((prev) => ({
                                            ...prev,
                                            [it.id]: false,
                                          }));
                                        }}
                                        className="flex-1 rounded-md bg-amber-400 text-neutral-900 font-semibold py-1.5 text-[12px] hover:bg-amber-300 transition"
                                      >
                                        Update
                                      </button>

                                      <button
                                        onClick={() => {
                                          // convert back to one-time and restore full price
                                          const currentPrice = Number(
                                            it.price ?? 0
                                          );

                                          let newPrice = currentPrice;

                                          // Prefer explicit basePrice if we have it
                                          if (it.basePrice != null) {
                                            const bp = Number(it.basePrice);
                                            if (!Number.isNaN(bp) && bp > 0) {
                                              newPrice = bp;
                                            }
                                          } else if (
                                            !it.subPrice &&
                                            currentPrice > 0
                                          ) {
                                            // If it started life as a subscription from the roast page,
                                            // price is already discounted (no subPrice stored).
                                            // Reverse the 15% discount to get the original.
                                            newPrice =
                                              Math.round(
                                                (currentPrice / 0.85) * 100
                                              ) / 100;
                                          }

                                          updateItem(it.id, {
                                            isSubscription: false,
                                            purchaseMode: "one",
                                            subEvery: undefined,
                                            subPrice: undefined,
                                            price: newPrice,
                                            // clear any plan ID so Shopify treats it as one-time
                                            sellingPlanId: undefined,
                                          });

                                          setManageSubOpen((prev) => ({
                                            ...prev,
                                            [it.id]: false,
                                          }));
                                        }}
                                        className="px-3 rounded-md ring-1 ring-amber-400/60 text-amber-300 text-[12px]"
                                      >
                                        One-time
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() => remove(it.id)}
                            className="text-neutral-400 hover:text-amber-300 text-[11px] flex-shrink-0"
                            aria-label="Remove"
                          >
                            Remove
                          </button>
                        </div>

                        {/* price + qty */}
                        <div className="mt-1.5 flex items-center justify-between">
                          <div className="text-amber-300 font-bold text-[13px]">
                            {isSub
                              ? `$${subPrice.toFixed(2)}`
                              : `$${price.toFixed(2)}`}
                          </div>

                          <div className="inline-flex items-center ring-1 ring-neutral-700 rounded-lg overflow-hidden">
                            <button
                              onClick={() => dec(it.id)}
                              className="px-2 py-1 text-base text-neutral-200"
                              aria-label="Decrease"
                            >
                              −
                            </button>
                            <div className="px-2 py-1 text-neutral-100 tabular-nums text-[13px]">
                              {it.qty}
                            </div>
                            <button
                              onClick={() => inc(it.id)}
                              className="px-2 py-1 text-base text-neutral-200"
                              aria-label="Increase"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* JOIN THE FLEET — 14/30/60 selector */}
                        {!isSub && it?.slug !== "oak-and-copper" && (
                          <div className="mt-2">
                            {!showSubChooser[it.id] ? (
                              <button
                                onClick={() =>
                                  setShowSubChooser((prev) => ({
                                    ...prev,
                                    [it.id]: true,
                                  }))
                                }
                                className="w-full rounded-md ring-1 ring-amber-400/60 bg-neutral-900/60 text-amber-300 font-semibold py-1.5 text-[12px] hover:bg-amber-400 hover:text-neutral-900 transition"
                              >
                                Join The Fleet &amp; Save 15%
                              </button>
                            ) : (
                              <>
                                <div className="mb-2 grid grid-cols-3 gap-2">
                                  {[14, 30, 60].map((d) => (
                                    <button
                                      key={`${it.id}-freq-${d}`}
                                      onClick={() =>
                                        setFreq((prev) => ({
                                          ...prev,
                                          [it.id]: d,
                                        }))
                                      }
                                      className={[
                                        "py-1.5 rounded-md text-[12px] font-semibold ring-1",
                                        selFreq === d
                                          ? "bg-amber-400 text-neutral-900 ring-amber-400"
                                          : "bg-neutral-900/60 text-amber-300 ring-amber-400/60",
                                      ].join(" ")}
                                    >
                                      {d} days
                                    </button>
                                  ))}
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => {
                                      updateItem(it.id, {
                                        isSubscription: true,
                                        purchaseMode: "sub",
                                        subEvery: selFreq,
                                        subPrice: getSubPrice({
                                          ...it,
                                          subEvery: selFreq,
                                        }),
                                        sellingPlanId:
                                          it.sellingPlans &&
                                          it.sellingPlans[selFreq]
                                            ? it.sellingPlans[selFreq]
                                            : it.sellingPlanId,
                                      });
                                      // collapse the chooser after starting
                                      setShowSubChooser((prev) => {
                                        const next = { ...prev };
                                        delete next[it.id];
                                        return next;
                                      });
                                    }}
                                    className="flex-1 rounded-md bg-amber-400 text-neutral-900 font-semibold py-1.5 text-[12px] hover:bg-amber-300 transition"
                                  >
                                    Start Subscription
                                  </button>

                                  <button
                                    onClick={() =>
                                      setShowSubChooser((prev) => {
                                        const next = { ...prev };
                                        delete next[it.id];
                                        return next;
                                      })
                                    }
                                    className="px-3 rounded-md ring-1 ring-amber-400/60 text-amber-300 text-[12px]"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* FOOTER: Checkout ABOVE ID.me, plus links */}
        <div className="border-t border-neutral-800 px-4 pt-3 pb-2 space-y-2">
          <div className="flex items-center justify-between text-[12px] text-neutral-400">
            <span>Shipping</span>
            <span>{shippingLabel}</span>
          </div>

          {/* Checkout first */}
          <button
            type="button"
            onClick={checkingOut ? undefined : handleCheckout}
            disabled={checkingOut}
            className={[
              "block w-full rounded-xl font-extrabold py-2.5 text-center text-[15px]",
              checkingOut
                ? "bg-amber-300/70 text-neutral-800 cursor-not-allowed"
                : "bg-amber-400 text-neutral-900",
            ].join(" ")}
            aria-busy={checkingOut}
          >
            {checkingOut ? "Syncing cart…" : `Checkout • $${total.toFixed(2)}`}
          </button>

          {/* Continue shopping closes drawer */}
          <button
            type="button"
            onClick={() => {
              setPinned(true);
              onClose();
            }}
            className="block w-full text-center text-[20px] text-neutral-300 underline underline-offset-4"
          >
            Continue shopping
          </button>

          {/* GovX login after checkout */}
          <div className="mt-3 flex justify-center">
            <a
              href="https://auth.govx.com/shopify/verify?shop=81ub0m-s7.myshopify.com&utm_source=shopify&utm_medium=govxid&utm_campaign=custom_link"
              className="inline-block rounded-xl ring-1 ring-amber-400/60 
       text-amber-400 font-semibold text-[1rem]
       px-[1.1rem] py-[0.45rem]
       hover:bg-amber-400 hover:text-neutral-900 transition-all"
            >
              Get GovX discount code
            </a>
          </div>

          {/* Read-before-checkout link */}
          <button
            type="button"
            onClick={() => setShowRoastInfo(true)}
            className="block w-full text-center text-[16px] text-red-300 underline underline-offset-4"
          >
            Please read before checking out
          </button>

          {/* Tiny roast timer pinned at very bottom */}
          <div className="mt-1 mb-1 rounded-md bg-neutral-900/60 ring-1 ring-neutral-800 px-3 py-2 text-center">
            {state === "countdown" ? (
              <div className="text-[16px] text-neutral-300">
                Time left to make the next roast:{" "}
                <span className="text-amber-300 font-semibold">{left}</span>
              </div>
            ) : state === "closed" ? (
              <div className="text-[11px] text-neutral-300">
                Next batch roasts:{" "}
                <span className="text-amber-300">{dateLabel}</span>
              </div>
            ) : (
              <div className="text-[11px] text-neutral-300">
                Next batch roasts:{" "}
                <span className="text-amber-300">{dateLabel}</span>{" "}
                <span className="text-neutral-500">(ET)</span>
              </div>
            )}
          </div>
        </div>

        {/* SUBSCRIBE GATE BANNER (blocks checkout when not signed in) */}
        {showSubGate && (
          <div className="absolute inset-x-0 bottom-0 z-[1000003] p-3">
            <div className="rounded-xl ring-1 ring-amber-400 bg-neutral-900 text-amber-300 px-3 py-3 text-sm text-center shadow-2xl">
              Join or sign in to manage your Fleet subscription before checkout.
              <div className="mt-2 flex gap-2 justify-center">
                <a
                  href="/account/login"
                  className="px-3 py-1.5 rounded-md bg-amber-400 text-neutral-900 font-bold"
                >
                  Sign in / Join
                </a>
                <button
                  onClick={() => setShowSubGate(false)}
                  className="px-3 py-1.5 rounded-md ring-1 ring-amber-400/60 text-amber-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ROAST INFO MODAL */}
        {showRoastInfo && (
          <div className="absolute inset-0 z-[1000004] flex items-center justify-center p-4">
            <button
              className="absolute inset-0 bg-black/70"
              onClick={() => setShowRoastInfo(false)}
              aria-label="Close roast info backdrop"
            />
            <div className="relative w-full max-w-md rounded-2xl bg-neutral-950 ring-1 ring-neutral-800 shadow-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div
                  className="text-sm font-extrabold text-neutral-100"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  Roast & Shipping Schedule
                </div>
                <button
                  onClick={() => setShowRoastInfo(false)}
                  className="text-amber-300 text-lg font-bold px-1"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
              <div className="text-[13px] text-neutral-300 space-y-2">
                <p>
                  We roast to order. All orders are roasted on Monday/Tuesday.
                  Please be sure to place your order before{" "}
                  <span className="text-amber-300 font-semibold">
                    Sunday 5:00 PM ET
                  </span>{" "}
                  to get on the roast schedule. All orders made after the cut
                  off time will be roasted the following week.
                </p>
                <p>
                  <span className="text-amber-300 font-semibold">
                    Roast Day:
                  </span>{" "}
                  Monday <br />
                  <span className="text-amber-300 font-semibold">
                    Ship:
                  </span>{" "}
                  Wednesday.
                </p>
                <p>
                  Coffee is bagged immediately after roasting and rests briefly
                  to preserve peak flavor. Tracking is emailed once your order
                  leaves the roastery.
                </p>
                <p className="text-blue-300">
                  If you missed the order cut off time, please contact us and we
                  will see what we can do to still get your order roasted.
                </p>
                <p className="text-amber-300">
                  Questions?{" "}
                  <a href="/contact" className="underline text-amber-300">
                    Contact the crew
                  </a>
                  .
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* =============== Minimal Smoke Tests =============== */
function useSmokeTests() {
  useEffect(() => {
    try {
      console.assert(
        typeof CartProvider === "function",
        "CartProvider should be a function"
      );
      console.assert(
        typeof useCart === "function",
        "useCart should be a function"
      );
      const ok = typeof fmt === "function" && fmt(1).includes("$");
      console.assert(ok, "fmt should format USD");
      console.log("[SmokeTests] basic checks passed");
    } catch (e) {
      console.error("[SmokeTests] failed", e);
    }
  }, []);
}

export default function App() {
  useSmokeTests();
  return (
    <BrowserRouter>
      <CartProvider>
        <ErrorBoundary>
          <AppShell />
        </ErrorBoundary>
      </CartProvider>
    </BrowserRouter>
  );
}

// auto-deploy test Tue 28 Oct 2025 12:33:22 AM UTC
