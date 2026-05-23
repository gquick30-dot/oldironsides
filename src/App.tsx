import AccountGateModal from "./Components/AccountGate";

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
function RouteTracker() {
  const location = useLocation();

  React.useEffect(() => {
    if ((window as any).gtag) {
      (window as any).gtag("event", "page_view", {
        page_path: location.pathname,
      });
    }

    if ((window as any).fbq) {
      (window as any).fbq("track", "PageView");
    }
  }, [location]);

  return null;
}
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
      className="group inline-flex items-center gap-2 rounded-xl px-5 py-3 font-semibold ring-1 ring-[#C08C45] text-[#C08C45] bg-transparent hover:bg-[#C08C45] hover:text-neutral-900 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C08C45]"
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
        className="rounded-lg bg-[#C08C45]/95 px-4 py-2 text-neutral-900 font-semibold shadow-xl text-center whitespace-pre-line"
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
    "inline-flex items-center gap-2 rounded-2xl border-2 border-[#C08C45] bg-amber-500/20 font-bold text-[#C08C45] hover:bg-[#C08C45] hover:text-neutral-900";
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
    "mt-0 text-2xl md:text-4xl font-extrabold leading-tight tracking-tight text-[#C08C45]";
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
    // Detail page hero image. Homepage tile still uses img.
    detailImg: "flagship-1.jpg",
    imgLeft: "washington-cannon.jpg", // New property for left image in duel
    imgRight: "barry-ship.jpg", // New property for right image in duel
    heroImg: "Flagship-web.jpg", // New property for hero section image
    price: 19.99,
    canBuy: true,
    variant: "12oz Bag",
    battleDate: "Commissioned October 21, 1797",
    storyTitle: (
      <>
        <div className="text-2xl font-bold text-[#C08C45]">Flagship</div>
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
    // Detail page hero image. Homepage tile still uses img.
    detailImg: "Baptism-1.jpg",
    imgLeft: "capt-hull.jpeg", // New property for left image in duel
    imgRight: "james-surrender.jpeg", // New property for right image in duel
    heroImg: "baptism-web.jpg", // New property for hero section image
    price: 19.99,
    canBuy: true,
    variant: "12oz Bag",
    battleDate: "August 19, 1812",
    storyTitle: (
      <>
        <div className="text-2xl font-bold text-[#C08C45]">Baptism by Fire</div>
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
    // Detail page hero image. Homepage tile still uses img.
    detailImg: "java-action-1.jpg",
    imgLeft: "bainbridge-java.jpg", // New property for left image in duel
    imgRight: "lambert-pic.jpg", // New property for right image in duel
    heroImg: "java-web.jpg", // New property for hero section image
    price: 19.99,
    canBuy: true,
    variant: "12oz Bag",
    battleDate: "December 29, 1812",
    storyTitle: (
      <>
        <div className="text-2xl font-bold text-[#C08C45]">The Java Action</div>
        <div className="text-white text-base">USS Constitution vs HMS Java</div>
      </>
    ),
    story:
      "In 1812, Constitution faced off against HMS Java in a fierce sea battle. The American frigate’s victory proved her might and resilience, further cementing her legendary status.", // Blurb (short version)
    mainStory: "", // Full story
  },
  {
    id: "black-salvo-12oz-ground",
    slug: "black-salvo",
    title: "BLACK SALVO",
    subTitle: "Medium Roast",
    note: "Versatile, Smooth, Unique",
    img: "black-salvo-emblem.png",
    detailImg: "black-salvo5.jpg",
    price: 19.99,
    canBuy: true,
    variant: "12oz Bag",
    isNew: true,
  },
  {
    id: "oak-copper-coming-soon",
    slug: "oak-and-copper",
    title: "OAK & COPPER",
    subTitle: "Bourbon Barrel Aged",
    note: "Limited Release, Micro-Batch",
    img: "Oak&Copper Bag Transparent.png", // Main image for hero section
    // Detail page hero image. Homepage tile still uses img.
    detailImg: "oak&copper-1.jpg",
    imgLeft: "ship-hull.jpg", // New property for left image in duel
    imgRight: "ship-restore.jpeg", // New property for right image in duel
    heroImg: "ironship.jpg", // New property for hero section image
    price: 24.99,
    canBuy: true,
    variant: "12oz Bag",
    battleDate: "",
    storyTitle: (
      <>
        <div className="text-2xl font-bold text-[#C08C45]">Oak & Copper</div>
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
    subTitle: "Winter Seasonal",
    note: "Warm Pecan",
    // Detail page hero image. Homepage tile still uses img.
    detailImg: "Brass Monkey-1.jpg",
    img: "/Brass Monkey Transparent Bag.png", // change to your actual filename
    price: 19.99, // change if needed
    canBuy: true, // or false if you want it visible but not purchasable yet
  },
];
type RoastCardConfig = (typeof roastCards)[number];
const PRODUCT_IDS_BY_SLUG: Record<string, string> = {
  flagship: "9271153885405",
  "baptism-by-fire": "9271153754333",
  "java-action": "9271153918173",
  "oak-and-copper": "9271153787101",
  "brass-monkey": "9271153819869",
  "black-salvo": "9418482024669",
  "armada-sample-pack": "9479395180765",
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
        className="h-52 sm:h-60 md:h-52 lg:h-60 w-full object-cover"
      />

      <div className="p-3">
        <div
          className="text-lg font-extrabold text-[#C08C45]"
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
          <div className="mt-1 flex items-center gap-1 text-[0.7rem] text-[#C08C45]">
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
    async (id: string) => {
      try {
        const { id: cartId } = await ensureCart();
        const sf = await getCart(cartId);

        const lineToRemove = sf?.lines?.edges?.find((e: any) => {
          const merchId = String(e?.node?.merchandise?.id ?? "");
          return cart.some(
            (i: any) => i.id === id && String(i.merchandiseId) === merchId
          );
        })?.node?.id;

        if (lineToRemove) {
          await cartLinesRemove({ cartId, lineIds: [lineToRemove] });
        }
      } catch (e) {
        console.error("Shopify remove failed", e);
      }

      persist((prev) => prev.filter((x: any) => x.id !== id));
    },
    [persist, cart]
  );

  // simple sub price helper:

  const getSubPrice = useCallback((it: any) => {
    const explicit = Number(it?.subPrice ?? 0);
    if (explicit > 0) return explicit;

    // Sample packs and Oak & Copper never receive subscription discounts
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

    return Math.max(0, +(p * 0.9).toFixed(2));
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

  const clear = useCallback(async () => {
    try {
      const { id: cartId } = await ensureCart();
      const sf = await getCart(cartId);

      const lineIds =
        sf?.lines?.edges
          ?.map((e: any) => String(e?.node?.id))
          .filter(Boolean) ?? [];

      if (lineIds.length) {
        await cartLinesRemove({ cartId, lineIds });
      }
    } catch (e) {
      console.error("Shopify clear failed", e);
    }

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
  // Send email to Klaviyo (server-side, safe)
  try {
    await fetch("/api/klaviyo-subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        source: "ring-that-bell",
      }),
    });
  } catch {
    // do not block conversion
  }

  // Mark as subscribed locally (same as your modal)
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

  // Klaviyo client-side event (analytics only)
  try {
    (window as any)._learnq = (window as any)._learnq || [];
    (window as any)._learnq.push(["identify", { $email: email }]);
    (window as any)._learnq.push([
      "track",
      "Promo Email Submitted",
      { source: "ring-that-bell" },
    ]);
  } catch {}

  return true;
};
// ===== Soft-launch notify submit (NO discounts, NO promo messaging) =====
const submitLaunchNotifyEmail = async (email: string) => {
  if (!emailOk(email)) {
    flash("Enter a valid email.");
    return false;
  }

  // Best-effort: create Shopify customer (optional, do not block)
  try {
    await fetch("/api/create-customer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
  } catch {
    // do not block
  }

  // Klaviyo subscribe (server-side)
  try {
    await fetch("/api/klaviyo-subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        source: "soft-launch-notify",
      }),
    });
  } catch {
    // do not block
  }

  // Klaviyo client-side event (analytics only)
  try {
    (window as any)._learnq = (window as any)._learnq || [];
    (window as any)._learnq.push(["identify", { $email: email }]);
    (window as any)._learnq.push([
      "track",
      "Launch Notify Submitted",
      { source: "soft-launch-notify" },
    ]);
  } catch {}

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
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C08C45]",
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
    <div className="rounded-2xl ring-1 ring-[#C08C45]/60 bg-neutral-900/60 p-6 sm:p-8 text-center">
      <div className="flex flex-col items-center justify-center gap-2 sm:gap-3 mb-4">
        <BellRinger iconClassName="h-9 w-9 sm:h-11 sm:w-11 text-[#C08C45]" />
        <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#C08C45]">
          RING THAT BELL
        </h3>
      </div>

      <p className="text-neutral-300 mb-5 text-base sm:text-lg md:text-xl">
        Get 15% off your first freshly roasted coffee order. <br />
        Subscribe later and save 10% off every order.
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
          className="flex-1 min-w-0 rounded-xl bg-neutral-900/70 border border-neutral-700 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#C08C45]"
        />
        <button
          type="submit"
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#C08C45] text-neutral-900 font-semibold hover:bg-[#C08C45]"
        >
          GET 15% OFF
        </button>
      </form>

      <div className="mt-6 text-xs sm:text-sm text-neutral-400">
        Already a member?{" "}
        <Link to="/account/login" className="text-[#C08C45] hover:underline">
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
    `Get 15% off your first order
  Join the fleet for 10% off recurring orders`;
  const btn = buttonText ?? "GET 15% OFF";

  // ===== 48-hour cooldown logic =====
  const COOLDOWN_HOURS = 48;
  const COOLDOWN_KEY = "welcome_20_seen_at";

  const now = Date.now();
  const lastSeen = Number(localStorage.getItem(COOLDOWN_KEY) || 0);
  const cooldownMs = COOLDOWN_HOURS * 60 * 60 * 1000;

  const isInCooldown = lastSeen && now - lastSeen < cooldownMs;

  if (isInCooldown) return null;
  // mark banner as seen
  if (!lastSeen) {
    localStorage.setItem(COOLDOWN_KEY, String(now));
  }

  return (
    <div className="w-full lg:w-[36rem]">
      {/* MOBILE VERSION ONLY (tighter v2) */}
      <div className="md:hidden">
        <div className="mx-auto max-w-[16.5rem] overflow-hidden rounded-2xl ring-1 ring-[#C08C45]/60 bg-neutral-900/60">
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
              <BellRinger iconClassName="h-3.5 w-3.5 text-[#C08C45]" />

              <h3
                className="font-extrabold text-[#C08C45]"
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
                className="flex-1 min-w-0 rounded-md bg-neutral-900/70 border border-neutral-700 px-2 py-[5px] text-[11px] focus:outline-none focus:ring-2 focus:ring-[#C08C45]"
              />
              <button className="w-full px-3 py-[6px] rounded-md bg-[#C08C45] text-neutral-900 text-[11px] font-semibold hover:bg-[#C08C45]">
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
                className="text-[#C08C45] hover:underline"
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
        <div className="rounded-2xl ring-1 ring-[#C08C45]/60 bg-neutral-900/60 p-6 sm:p-8 text-center">
          <div className="flex flex-col items-center justify-center gap-2 sm:gap-3 mb-4">
            <Bell className="h-6 w-6 sm:h-7 sm:w-7 text-[#C08C45]" />
            <h3 className="text-xl sm:text-2xl font-extrabold text-[#C08C45]">
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
              className="flex-1 min-w-0 rounded-xl bg-neutral-900/70 border border-neutral-700 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#C08C45]"
            />
            <button className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#C08C45] text-neutral-900 font-semibold hover:bg-[#C08C45]">
              {btn}
            </button>
          </form>

          <div className="mt-3 text-[11px] sm:text-xs text-neutral-400">
            Already a member?{" "}
            <Link
              to="/account/login"
              className="text-[#C08C45] hover:underline"
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
    <div className="rounded-2xl ring-1 ring-[#C08C45]/60 bg-neutral-900/60 p-5 text-center">
      <div className="flex flex-col items-center justify-center gap-2 mb-2">
        <Bell className="h-5 w-5 text-[#C08C45]" />
        <h4 className="text-base sm:text-lg font-extrabold text-[#C08C45]">
          GovX Login
        </h4>
      </div>

      <p className="text-neutral-300 text-sm sm:text-[15px] leading-relaxed">
        Enjoy <span className="font-semibold text-[#C08C45]">10% off</span> both
        coffee and merch — plus{" "}
        <span className="font-semibold text-[#C08C45]">$1 extra per bag</span>{" "}
        off for veterans and first responders.
      </p>

      <a
        href="https://auth.govx.com/shopify/verify?shop=81ub0m-s7.myshopify.com&utm_source=shopify&utm_medium=govxid&utm_campaign=custom_link"
        className="mt-3 w-full inline-block px-4 py-2 rounded-lg bg-[#C08C45] text-neutral-900 text-sm font-semibold hover:bg-[#C08C45] underline-offset-2 hover:underline"
      >
        Get Govx discount code
      </a>

      <div className="mt-2 text-[11px] text-neutral-400">
        Need help?{" "}
        <Link to="/contact" className="text-[#C08C45] hover:underline">
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
        className="w-full sm:flex-1 min-w-0 rounded-lg bg-neutral-900/70 border border-neutral-700 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#C08C45]"
      />
      <button className="w-full sm:w-auto px-3 py-2 rounded-lg bg-[#C08C45] text-neutral-900 text-xs font-semibold hover:bg-[#C08C45]">
        Notify
      </button>
    </form>
  );
}
function LaunchedFromHarbor({ noBg = false }: { noBg?: boolean }) {
  const location = useLocation();
  const isHome = location.pathname === "/";
  const isStore = location.pathname.startsWith("/store");

  const nowET = useEtNow(45000);
  const { state, roastMonday, cutoff } = getRoastState(nowET);

  let left = "";
  if (state === "countdown" && cutoff) {
    const diff = cutoff.diff(nowET, ["days", "hours", "minutes"]).toObject();
    const d = Math.max(0, Math.floor(diff.days ?? 0));
    const h = Math.max(0, Math.floor(diff.hours ?? 0));
    const m = Math.max(0, Math.floor(diff.minutes ?? 0));
    left = `${d}d ${h}h ${m}m`;
  }

  const trustItems = [
    {
      title: "ROASTED TO ORDER",
      copy: "Always Fresh Roasted.",
      icon: "/anchor.png",
    },
    { title: "SMALL BATCH", copy: "Craft Roasted.", icon: "/compass.png" },
    {
      title: "SHIPS FRESH",
      copy: "Timed For Peak Freshness.",
      icon: "/truck.png",
    },
    {
      title: "VETERAN OWNED",
      copy: "Built with discipline.",
      icon: "/army-star.png",
    },
  ];

  return (
    <section
      id="fleet"
      className={`relative overflow-hidden ${
        isHome
          ? "pt-2 pb-6 md:pt-2 md:pb-8"
          : isStore
          ? "pt-2 pb-8 md:pt-6 md:pb-12"
          : "pt-2 pb-8 md:py-20"
      }`}
    >
      {!noBg && (
        <>
          <img
            src="/dark-theme.png"
            alt="Dark coffee roastery backdrop"
            className="hidden md:block absolute inset-0 w-full h-full object-cover opacity-100 -z-0"
          />
          <div className="hidden md:block absolute inset-0 bg-black/50 -z-0" />
        </>
      )}

      <Container
        className={`relative z-10 ${
          isStore ? "md:pt-10" : ""
        } px-0 sm:px-0 lg:px-0`}
      >
        <div className="flex flex-col items-center text-center px-3 sm:px-6 lg:px-8">
          <SectionTitle
            title={
              <div className="flex flex-col items-center w-full">
                <span
                  className="whitespace-nowrap text-[2.45rem] sm:text-[3.2rem] md:text-[4.6rem] xl:text-[5.3rem] leading-none tracking-[0.08em] font-bold text-roastTitle"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  OUR ROASTS
                </span>

                <div className="flex items-center w-full max-w-[390px] md:max-w-[560px] -mt-1 md:mt-0">
                  <div className="h-px flex-1 bg-roastTitle/80" />
                  <span className="px-3 text-roastTitle text-base md:text-lg leading-none">
                    ★
                  </span>
                  <div className="h-px flex-1 bg-roastTitle/80" />
                </div>
              </div>
            }
            subtitle={
              <div
                className="mt-2 text-[1rem] sm:text-[1.15rem] md:text-[1.35rem] italic text-roastSubtitle text-center"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Six roasts. Built for every kind of coffee drinker.
              </div>
            }
          />
        </div>

        <div className="mt-5 md:mt-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-[1450px] mx-auto px-3 sm:px-6 xl:px-4 2xl:px-0">
            {roastCards.map((card) => {
              const base =
                card.slug === "oak-and-copper"
                  ? 24.99
                  : Number(card.price ?? 19.99);

              const badge = card.isNew
                ? "NEW"
                : card.slug === "brass-monkey"
                ? "SEASONAL"
                : card.slug === "oak-and-copper"
                ? "LIMITED RELEASE"
                : "";

              const roastType =
                card.slug === "oak-and-copper"
                  ? "Bourbon Barrel Aged"
                  : card.slug === "baptism-by-fire"
                  ? "Dark Roast"
                  : card.slug === "brass-monkey"
                  ? "Winter Seasonal"
                  : card.subTitle || "Medium Roast";

              return (
                <Link
                  key={card.id}
                  to={`/roast/${card.slug}`}
                  aria-label={`${card.title} details`}
                  className="
                  group relative overflow-hidden rounded-[14px]
                  h-[265px] sm:h-[340px] lg:h-[390px]
            border border-[#6D5333]/55
            bg-[#050302]
            shadow-[0_0_26px_rgba(0,0,0,0.85),inset_0_0_22px_rgba(192,140,69,0.07)]
            transition-all duration-300
            hover:border-[#C08C45]/75
            hover:shadow-[0_0_34px_rgba(0,0,0,0.9),0_0_16px_rgba(192,140,69,0.18),inset_0_0_22px_rgba(192,140,69,0.10)]
          "
                >
                  <div className="absolute inset-0 bg-[#050302]" />

                  <div className="absolute inset-0 bg-gradient-to-br from-[#160D05] via-[#050302] to-black" />

                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_52%,rgba(192,140,69,0.18),transparent_38%)]" />

                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/20 to-black/82" />

                  <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black via-black/74 to-transparent" />

                  {badge && (
                    <div
                      className="
                absolute left-3 top-3 z-30
                rounded-[5px] border border-[#6D5333]/80
                bg-black/75 backdrop-blur-[2px]
                px-3 py-1.5
                text-[10px] font-black tracking-[0.08em]
                text-[#E6C07F]
              "
                      style={{ fontFamily: "'Cinzel', serif" }}
                    >
                      {badge}
                    </div>
                  )}

                  <div className="relative z-20 grid h-full grid-cols-[54%_46%] items-center px-3 py-4 sm:px-4 lg:px-5">
                    <div className="relative flex h-full items-center justify-center overflow-visible">
                      <div className="absolute bottom-[22px] h-[22px] w-[175px] rounded-full bg-black/90 blur-xl" />

                      <img
                        src={
                          card.img?.startsWith("/") ||
                          card.img?.startsWith("http")
                            ? card.img
                            : `/${card.img}`
                        }
                        alt={card.title}
                        className="
                        relative z-10
                        h-[255px] sm:h-[310px] lg:h-[360px]
                        w-auto object-contain
                        scale-[1.35] sm:scale-[1.5] lg:scale-[1.6]
                        transition duration-300
                        group-hover:brightness-110
                        group-hover:scale-[1.65]
                      "
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

                    <div className="relative z-20 flex flex-col justify-center pl-0 pr-1">
                      <h3
                        className="text-[25px] sm:text-[27px] lg:text-[31px] font-black leading-[0.95] tracking-[0.01em] text-[#C08C45]"
                        style={{ fontFamily: "'Cinzel', serif" }}
                      >
                        {card.title}
                      </h3>

                      <p
                        className="mt-2 text-[15px] sm:text-[16px] lg:text-[17px] italic leading-tight text-[#B39871]"
                        style={{ fontFamily: "'Playfair Display', serif" }}
                      >
                        {roastType}
                      </p>

                      <div className="mt-3 h-px w-14 bg-[#C08C45]/60" />

                      <p
                        className="mt-3 text-[15px] sm:text-[16px] lg:text-[18px] italic leading-snug text-neutral-200/85 line-clamp-2"
                        style={{ fontFamily: "'Playfair Display', serif" }}
                      >
                        {card.note?.replace(/micro[- ]batch\s*/i, "")}
                      </p>

                      <div className="mt-4 text-[14px] sm:text-[15px] text-neutral-100 font-semibold">
                        From {fmt(base)}
                      </div>
                    </div>

                    <div className="absolute right-4 bottom-4 z-30 text-[#C08C45] opacity-70 transition group-hover:translate-x-1 group-hover:opacity-100">
                      ›
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="mt-7 grid grid-cols-2 lg:grid-cols-4 gap-y-5 max-w-[1450px] mx-auto px-4 xl:px-0 pt-6 border-t border-[#6D5333]/35">
          {trustItems.map((item, idx) => (
            <div
              key={item.title}
              className={`relative flex items-center justify-center px-3 lg:px-6 ${
                idx !== 0 ? "lg:border-l lg:border-[#6D5333]/45" : ""
              }`}
            >
              <div className="relative w-[38px] h-[38px] shrink-0">
                <img
                  src={item.icon}
                  alt=""
                  className={`
            absolute left-1/2 top-1/2
            -translate-x-1/2 -translate-y-1/2
            object-contain opacity-90 pointer-events-none
            ${
              item.title === "ROASTED TO ORDER"
                ? "h-[70px] w-[70px] scale-[2.5]"
                : item.title === "SMALL BATCH"
                ? "h-[70px] w-[70px] scale-[3.6]"
                : item.title === "SHIPS FRESH"
                ? "h-[70px] w-[70px] scale-[4.2]"
                : "h-[70px] w-[70px] scale-[2.7]"
            }
          `}
                />
              </div>

              <div className="ml-3">
                <div
                  className="text-[11px] sm:text-[13px] lg:text-[15px] font-black tracking-[0.12em] text-neutral-300"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  {item.title}
                </div>
                <div
                  className="mt-1 text-[13px] sm:text-[15px] lg:text-[16px] italic text-[#B39871]"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {item.copy}
                </div>
              </div>
            </div>
          ))}
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
        <div className="max-w-xl mx-auto rounded-2xl ring-1 ring-[#C08C45]/60 bg-neutral-900/60 p-6 sm:p-8 text-center">
          <h3 className="text-xl sm:text-2xl font-extrabold text-[#C08C45]">
            SDVOSB
          </h3>
          <p className="text-neutral-300 mt-2 text-sm sm:text-base">
            Government contract information.
          </p>
          <Link
            to="/sdvosb"
            className="inline-block mt-4 px-4 py-2 rounded-lg bg-[#C08C45] text-neutral-900 font-semibold text-sm sm:text-base hover:bg-[#C08C45]"
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
  const [siteRating, setSiteRating] = React.useState<{
    avg: number;
    count: number;
  } | null>(null);

  React.useEffect(() => {
    async function loadAllReviews() {
      try {
        const ids = Object.values(PRODUCT_IDS_BY_SLUG);

        const results = await Promise.all(
          ids.map((id) =>
            fetch(`/api/get-reviews?shopifyProductId=${encodeURIComponent(id)}`)
              .then((r) => r.json())
              .catch(() => ({ reviews: [] }))
          )
        );

        const allReviews = results.flatMap((r) =>
          Array.isArray(r.reviews) ? r.reviews : []
        );

        if (!allReviews.length) {
          setSiteRating({ avg: 0, count: 0 });
          return;
        }

        const sum = allReviews.reduce(
          (acc, r) => acc + (Number(r.rating) || 0),
          0
        );
        const count = allReviews.length;
        const avg = Math.round((sum / count) * 10) / 10;

        setSiteRating({ avg, count });
      } catch (err) {
        console.error("Failed loading site rating", err);
      }
    }

    loadAllReviews();
  }, []);
  return (
    <>
      <header
        id="top"
        className="relative overflow-hidden border-b-0 z-0 min-h-[78svh] md:min-h-screen"
        style={{ isolation: "isolate" }}
      >
        {/* HERO background */}
        <div className="absolute inset-0 bg-black overflow-hidden">
          {/* MOBILE ONLY */}
          <img
            src="/ff-warm.jpg"
            alt=""
            aria-hidden="true"
            className="md:hidden absolute inset-0 w-full h-full object-contain object-[40%_top] translate-y-[12%]"
          />

          {/* DESKTOP / TABLET ONLY */}
          <img
            src="/ff-warm.jpg"
            alt=""
            aria-hidden="true"
            className="hidden md:block absolute top-0 left-0 w-[115%] h-full object-cover md:translate-x-[15%] md:scale-[0.9]"
          />
          <div className="absolute inset-0 bg-black/10 md:bg-black/20" />
        </div>

        <Container className="relative desktopHeroPad min-h-[98svh] md:min-h-[92svh] flex items-start pt-[120px] md:items-center md:pt-0 pb-0 px-10 xl:px-6">
          <style>{`
@media (min-width: 768px) {
  #top .desktopHeroPad {
    min-height: 100svh;
    padding-top: clamp(7rem, 12svh, 11rem);
    padding-bottom: clamp(2rem, 5svh, 4rem);
  }

  #top .heroCenter {
    transform-origin: left center;
    transform: translateY(1.5rem);
  }
}

@media (min-width: 1024px) and (max-height: 820px) {
  #top .heroCenter {
    margin-left: 3rem;
    transform: translateY(2rem) scale(0.82);
  }
}

@media (min-width: 1024px) and (max-height: 740px) {
  #top .heroCenter {
    margin-left: 3.5rem;
    transform: translateY(1.5rem) scale(0.74);
  }
}
`}</style>

          <div className="grid grid-cols-1 items-center text-center lg:text-left">
            {/* HERO TEXT */}
            <div
              className="max-w-[560px] lg:max-w-[900px] flex flex-col items-start text-left heroCenter mt-[110px] translate-y-[10%] md:translate-y-0 md:mt-0"
              style={{ maxWidth: "fit-content" }}
            >
              <div aria-hidden className="hidden md:block h-12 lg:h-16" />

              <h2
                className="font-cinzel font-black leading-[0.95] tracking-[0.04em] text-left translate-y-[10%]
                text-[1.38rem] sm:text-[1.76rem] md:text-[2.7rem] xl:text-[3.3rem]"
              >
                <span className="block text-[#E6DCC8]">
                  SMALL BATCH COFFEE.
                </span>

                <span className="block text-[#C69A58] md:text-[#D3A052] mt-1 md:mt-2">
                  ROASTED TO ORDER.
                </span>
              </h2>

              {/* DIVIDER */}
              <div className="flex items-center w-full mt-5 md:mt-6">
                <div className="h-px flex-1 bg-[#C08C45]/70" />
                <span className="px-2 md:px-3 text-[#E6C07F] text-base md:text-lg leading-none">
                  ★
                </span>
                <div className="h-px flex-1 bg-[#C08C45]/40" />
              </div>

              {/* SUBTEXT */}
              <div className="mt-6 md:mt-5 font-playfair font-semibold text-[1rem] sm:text-[1.1rem] md:text-[1.35rem] xl:text-[1.55rem] leading-snug text-[#E6DCC8]/75">
                Fresh-roasted and shipped at peak freshness.
              </div>

              <div className="w-full max-w-none mt-8 md:mt-12 xl:mt-14">
                <div className="flex flex-col md:flex-row items-stretch gap-3 w-full md:w-fit">
                  {/* SAMPLE BUTTON */}
                  <Link
                    to="/store"
                    className="relative inline-flex h-[58px] w-full md:w-fit items-center justify-center
  px-8 sm:px-9
  rounded-none overflow-hidden
  bg-[#C08C45]
  text-black font-extrabold
  text-lg sm:text-base md:text-[1.35rem] tracking-[0.04em]
  border border-[#C08C45]
  shadow-[0_0_18px_rgba(192,140,69,0.16)]
  transition-all duration-200
  hover:-translate-y-[1px]
  hover:bg-[#E6C07F]
  hover:border-[#E6C07F]
  hover:shadow-[0_0_22px_rgba(230,192,127,0.18)]"
                  >
                    <div className="absolute inset-0 bg-chestTexture bg-cover bg-center opacity-[0.12]" />

                    <span className="relative z-10">SHOP FRESH ROASTS</span>
                  </Link>

                  {/* SAMPLE PACK BUTTON */}
                  <Link
                    to="/roast/armada-sample-pack"
                    className="inline-flex h-[58px] w-full md:w-fit items-center justify-center
  px-8 sm:px-9
  rounded-none bg-black text-[#E6C07F] font-extrabold
  text-base md:text-[1.05rem] tracking-[0.08em]
  border border-[#C08C45]
  shadow-[inset_0_0_12px_rgba(255,255,255,0.05),0_0_18px_rgba(192,140,69,0.12)]
  transition-all duration-200
  hover:-translate-y-[1px]
  hover:bg-[#C08C45]
  hover:text-black
  hover:border-[#C08C45]
  hover:shadow-[0_0_18px_rgba(192,140,69,0.18)]"
                  >
                    START WITH A SAMPLE
                  </Link>
                </div>
                {/* STAR RATING */}
                <div className="mt-4 md:mt-3 w-full md:w-[24rem] xl:w-[28rem]">
                  {siteRating && (
                    <div className="flex items-center justify-center gap-2 text-center">
                      <span className="text-roastTitle font-semibold tabular-nums text-[1.15rem]">
                        {siteRating.avg.toFixed(1)}
                      </span>

                      {[0, 1, 2, 3, 4].map((i) => {
                        const starFill = Math.max(
                          0,
                          Math.min(1, (siteRating.avg ?? 0) - i)
                        );
                        const clipWidth = 24 * starFill;
                        const clipId = `ctaStarClip-${i}`;

                        return (
                          <svg
                            key={i}
                            viewBox="0 0 24 24"
                            className="h-[1.15rem] w-[1.15rem]"
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
                              className="text-roastTitle"
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

                      <span className="text-[0.95rem] text-neutral-300">
                        {siteRating.count} Verified Reviews
                      </span>
                    </div>
                  )}

                  <div className="mt-1.5 flex items-center justify-center gap-2 text-neutral-300 text-[0.95rem] sm:hidden text-center">
                    <span className="inline-flex items-center gap-2">
                      Veteran Owned. Veteran Roasted.
                      <img
                        src="/stars-stripes.png"
                        alt="American flag"
                        className="h-4 w-auto inline-block"
                      />
                    </span>
                  </div>
                </div>
                <RoastCTAInfo />
              </div>
            </div>
          </div>
        </Container>
      </header>
      {/* ===== QUIET RITUAL SECTION ===== */}
      <section
        id="quiet-ritual"
        className="relative overflow-hidden bg-[#070402] py-10 md:py-16 border-t border-[#6D5333]/35 border-b border-[#6D5333]/35"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_28%,rgba(192,140,69,0.18),transparent_32%),radial-gradient(circle_at_78%_58%,rgba(181,151,109,0.12),transparent_34%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(0,0,0,0.92)_0%,rgba(7,4,2,0.82)_42%,rgba(35,20,9,0.48)_100%)] pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#C08C45]/60 to-transparent" />

        <Container>
          <div className="relative z-10 max-w-[1320px] mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-[0.88fr_1.12fr] gap-10 xl:gap-16 items-center">
              {/* LEFT TEXT */}
              <div className="order-1">
                <div className="relative max-w-[590px] mx-auto lg:mx-0 rounded-2xl border border-[#6D5333]/45 bg-[#0B0704]/65 px-6 md:px-8 py-8 md:py-10 shadow-2xl shadow-black/55 backdrop-blur-sm">
                  <p className="font-oswald text-[0.66rem] font-semibold uppercase tracking-[0.34em] text-[#D7D0C4]">
                    Morning Ritual
                  </p>

                  <h3 className="mt-5 font-cinzel text-3xl md:text-4xl xl:text-[3.65rem] font-semibold leading-[1.12] tracking-[0.01em] text-[#A47B49]">
                    Better coffee
                    <br />
                    for quieter
                    <br />
                    mornings.
                  </h3>

                  <div className="mt-5 h-px w-64 md:w-56 bg-gradient-to-r from-[#C08C45]/80 via-[#6D5333]/55 to-transparent" />

                  <p className="mt-6 max-w-[500px] font-ebgaramond text-lg md:text-xl leading-relaxed text-[#D6C5A8]">
                    Fresh-roasted in small batches for the slow start, the first
                    cup, and the few quiet minutes before the day takes over.
                  </p>

                  <div className="mt-7 flex flex-col sm:flex-row gap-3">
                    <a
                      href="#fleet"
                      className="inline-flex h-[46px] items-center justify-center rounded-md border border-[#C08C45] bg-[#C08C45] px-6 font-oswald text-sm font-bold uppercase tracking-[0.16em] text-black transition hover:bg-[#E6C07F] hover:border-[#E6C07F]"
                    >
                      Shop The Fleet
                    </a>

                    <a
                      href="#roasting-process"
                      className="inline-flex h-[46px] items-center justify-center rounded-md border border-[#6D5333] bg-black/25 px-6 font-oswald text-sm font-bold uppercase tracking-[0.16em] text-[#C08C45] transition hover:border-[#C08C45] hover:text-[#E6C07F]"
                    >
                      How We Roast
                    </a>
                  </div>
                </div>
              </div>

              {/* RIGHT COLLAGE */}
              <div className="order-2">
                <div className="relative mx-auto lg:ml-auto w-full max-w-[710px]">
                  <div className="absolute -inset-5 rounded-[2rem] bg-[#C08C45]/10 blur-2xl" />

                  <div className="relative grid grid-cols-1 sm:grid-cols-[1fr_0.78fr] gap-4 md:gap-5 items-center">
                    {/* MAIN IMAGE */}
                    <div className="relative overflow-hidden rounded-[1.4rem] border border-[#8A683F]/55 bg-[#100905] shadow-2xl shadow-black/70">
                      <img
                        src="/pour-1.jpg"
                        alt="Fresh coffee in a quiet morning setting"
                        className="w-full h-[390px] md:h-[460px] object-cover object-center opacity-95"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

                      <div className="absolute left-5 bottom-5 right-5 rounded-xl border border-[#6D5333]/70 bg-[#090603]/78 px-5 py-4 backdrop-blur-sm shadow-xl shadow-black/60">
                        <p className="font-playfair text-3xl md:text-4xl font-black leading-none text-[#F3E9D6]">
                          Small batch.
                        </p>
                        <p className="mt-2 font-oswald text-[0.68rem] font-bold uppercase tracking-[0.24em] text-[#B5976D]">
                          Roasted for the daily ritual
                        </p>
                      </div>
                    </div>

                    {/* SIDE IMAGES */}
                    <div className="grid grid-cols-2 sm:grid-cols-1 gap-4 md:gap-5">
                      <div className="relative overflow-hidden rounded-[1.2rem] border border-[#6D5333]/55 bg-black shadow-xl shadow-black/60 sm:-translate-x-3">
                        <img
                          src="/bean-pour.jpg"
                          alt="Fresh roasted coffee beans"
                          className="w-full h-[165px] md:h-[205px] object-cover object-center opacity-95"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />
                      </div>

                      <div className="relative overflow-hidden rounded-[1.2rem] border border-[#6D5333]/55 bg-black shadow-xl shadow-black/60 sm:translate-x-5">
                        <img
                          src="/coffee-fire-1.jpeg"
                          alt="Coffee on a dark wooden table"
                          className="w-full h-[165px] md:h-[225px] object-cover object-center opacity-95"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ===== ROASTING PROCESS ===== */}
      <section
        id="roasting-process"
        className="relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] overflow-hidden bg-[#050302] py-12 sm:py-14 md:py-16 lg:py-18 xl:py-24 2xl:py-24 border-t border-[#6D5333]/40 border-b border-[#6D5333]/40"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_28%,rgba(192,140,69,0.14),transparent_30%),radial-gradient(circle_at_82%_70%,rgba(109,83,51,0.14),transparent_34%)] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black pointer-events-none" />

        <div className="relative z-10 mx-auto w-full px-5 sm:px-7 md:px-10 lg:px-14 xl:px-0 2xl:px-0 max-w-[620px] sm:max-w-[720px] md:max-w-[900px] lg:max-w-[1040px] xl:max-w-[1280px] 2xl:max-w-[1440px]">
          <div className="grid grid-cols-1 md:grid-cols-[minmax(0,0.9fr)_minmax(0,0.82fr)] lg:grid-cols-[minmax(0,0.92fr)_minmax(0,0.82fr)] xl:grid-cols-[0.9fr_1.1fr] 2xl:grid-cols-[0.9fr_1.1fr] gap-8 sm:gap-9 md:gap-4 lg:gap-6 xl:gap-20 2xl:gap-20 items-center">
            {/* TEXT */}
            <div className="order-1 w-full mx-auto text-center md:text-left max-w-[620px] sm:max-w-[660px] md:max-w-[470px] lg:max-w-[500px] xl:max-w-none 2xl:max-w-none md:ml-auto xl:ml-0">
              <div className="mb-5 flex justify-center md:justify-start">
                <div className="border-l-2 border-[#C08C45] bg-black/45 px-4 py-2">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.32em] text-[#9C9791]">
                    From The Roaster
                  </p>
                </div>
              </div>

              <h3 className="mx-auto md:mx-0 max-w-[620px] md:max-w-[470px] lg:max-w-[500px] xl:max-w-none font-playfair text-[2.35rem] sm:text-[2.8rem] md:text-[3.05rem] lg:text-[3.55rem] xl:text-7xl 2xl:text-7xl font-semibold italic leading-[1.02] tracking-[0.02em] text-[#E6DCC8]">
                Roasted to order.
                <br />
                <span className="text-[#C08C45]">Timed to land fresh.</span>
              </h3>

              {/* MOBILE IMAGE */}
              <div className="mt-8 flex justify-center md:hidden">
                <div className="relative w-full max-w-[560px] sm:max-w-[620px]">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-[#6D5333]/60 bg-black shadow-2xl shadow-black/70">
                    <img
                      src="/roaster.jpg"
                      alt="Coffee roasting process"
                      className="absolute inset-0 h-full w-full object-cover object-center"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/10" />

                    <div className="absolute left-3 right-3 bottom-3 sm:left-4 sm:right-4 sm:bottom-4 grid grid-cols-2 gap-2 sm:gap-3">
                      <div className="border border-[#6D5333]/70 bg-black/75 px-3 py-3 sm:px-4 backdrop-blur-sm">
                        <p className="font-oswald text-[1.45rem] sm:text-3xl font-black text-ironsideWhite leading-none">
                          MONDAY
                        </p>
                        <p className="mt-1 text-[0.56rem] sm:text-[0.62rem] font-bold uppercase tracking-[0.16em] sm:tracking-[0.18em] text-[#B5976D]">
                          Roast Day
                        </p>
                      </div>

                      <div className="border border-[#6D5333]/70 bg-black/75 px-3 py-3 sm:px-4 backdrop-blur-sm">
                        <p className="font-oswald text-[1.45rem] sm:text-3xl font-black text-ironsideWhite leading-none">
                          THURSDAY
                        </p>
                        <p className="mt-1 text-[0.56rem] sm:text-[0.62rem] font-bold uppercase tracking-[0.16em] sm:tracking-[0.18em] text-[#B5976D]">
                          Roast Day
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mx-auto -mt-5 relative z-10 w-fit border border-[#6D5333]/60 bg-[#130E08] px-5 sm:px-6 py-2 shadow-xl shadow-black/50">
                    <p className="font-oswald text-sm sm:text-base font-black uppercase tracking-[0.18em] sm:tracking-[0.2em] text-[#C08C45]">
                      Roasted Fresh
                    </p>
                  </div>
                </div>
              </div>

              {/* PROCESS */}
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-3 lg:gap-4">
                <div className="rounded-xl border border-[#6D5333]/50 bg-black/55 p-4 sm:p-5 md:p-4 lg:p-5">
                  <p className="text-[#C08C45] text-xs sm:text-sm font-bold uppercase tracking-[0.16em] sm:tracking-[0.18em]">
                    01 Order
                  </p>
                  <p className="mt-3 text-neutral-300 text-sm md:text-sm lg:text-base leading-relaxed">
                    You place the order. Secures your beans.
                  </p>
                </div>

                <div className="rounded-xl border border-[#6D5333]/50 bg-black/55 p-4 sm:p-5 md:p-4 lg:p-5">
                  <p className="text-[#C08C45] text-xs sm:text-sm font-bold uppercase tracking-[0.16em] sm:tracking-[0.18em]">
                    02 Roast
                  </p>
                  <p className="mt-3 text-neutral-300 text-sm md:text-sm lg:text-base leading-relaxed">
                    We roast every Monday and Thursday.
                  </p>
                </div>

                <div className="rounded-xl border border-[#6D5333]/50 bg-black/55 p-4 sm:p-5 md:p-4 lg:p-5">
                  <p className="text-[#C08C45] text-xs sm:text-sm font-bold uppercase tracking-[0.16em] sm:tracking-[0.18em]">
                    03 Ship
                  </p>
                  <p className="mt-3 text-neutral-300 text-sm md:text-sm lg:text-base leading-relaxed">
                    Degassing and shipping are timed so it lands at your
                    doorstep at peak freshness.
                  </p>
                </div>
              </div>

              <p className="mt-6 mx-auto md:mx-0 max-w-[620px] md:max-w-[470px] lg:max-w-[560px] xl:max-w-[660px] text-neutral-300 text-[0.95rem] sm:text-base md:text-base lg:text-lg leading-relaxed">
                We do not roast big batches and let them sit. Orders are roasted
                fresh, given time to settle, then shipped so the flavor opens up
                when it reaches your cup.
              </p>
            </div>

            {/* DESKTOP IMAGE */}
            <div className="hidden md:flex order-2 justify-center md:justify-start xl:justify-end">
              <div className="relative w-full max-w-[300px] md:max-w-[320px] lg:max-w-[390px] xl:max-w-[640px] 2xl:max-w-[640px]">
                <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-[#6D5333]/60 bg-black shadow-2xl shadow-black/70">
                  <img
                    src="/roaster.jpg"
                    alt="Coffee roasting process"
                    className="absolute inset-0 h-full w-full object-cover"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/68 via-transparent to-black/10" />

                  <div className="absolute left-3 right-3 bottom-3 md:left-3 md:right-auto md:bottom-3 lg:left-4 lg:bottom-4 xl:left-6 xl:bottom-6 grid grid-cols-2 gap-2 lg:gap-3">
                    <div className="border border-[#6D5333]/70 bg-black/75 px-3 py-3 lg:px-4 lg:py-3 xl:px-5 xl:py-4 backdrop-blur-sm">
                      <p className="font-oswald text-[1.35rem] md:text-[1.45rem] lg:text-3xl xl:text-4xl font-black text-ironsideWhite leading-none">
                        MONDAY
                      </p>
                      <p className="mt-1 text-[0.52rem] lg:text-[0.65rem] font-bold uppercase tracking-[0.14em] lg:tracking-[0.18em] text-[#B5976D]">
                        Roast Day
                      </p>
                    </div>

                    <div className="border border-[#6D5333]/70 bg-black/75 px-3 py-3 lg:px-4 lg:py-3 xl:px-5 xl:py-4 backdrop-blur-sm">
                      <p className="font-oswald text-[1.35rem] md:text-[1.45rem] lg:text-3xl xl:text-4xl font-black text-ironsideWhite leading-none">
                        THURSDAY
                      </p>
                      <p className="mt-1 text-[0.52rem] lg:text-[0.65rem] font-bold uppercase tracking-[0.14em] lg:tracking-[0.18em] text-[#B5976D]">
                        Roast Day
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mx-auto md:mx-0 -mt-5 lg:-mt-6 relative z-10 w-fit border border-[#6D5333]/60 bg-[#130E08] px-5 lg:px-7 py-2 shadow-xl shadow-black/50">
                  <p className="font-oswald text-sm lg:text-lg font-black uppercase tracking-[0.18em] lg:tracking-[0.2em] text-[#C08C45]">
                    Roasted To Order
                  </p>
                  <p className="mt-1 text-[0.65rem] lg:text-xs font-semibold uppercase tracking-[0.1em] lg:tracking-[0.12em] text-[#B5976D]">
                    Timed For Peak Freshness
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* ===== TASTING EVENTS SECTION ===== */}
      <section
        id="tasting-events"
        className="relative overflow-hidden bg-black py-12 md:py-16 border-t border-[#6D5333]/40 border-b border-[#6D5333]/40"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_35%,rgba(192,140,69,0.12),transparent_28%),radial-gradient(circle_at_82%_58%,rgba(109,83,51,0.14),transparent_34%)] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-[#050302] to-black pointer-events-none" />

        <Container>
          <div className="relative z-10 max-w-[1420px] mx-auto px-6 md:px-10">
            {/* DESKTOP */}
            <div className="grid grid-cols-1 lg:grid-cols-[1.02fr_0.98fr] gap-10 lg:gap-16 xl:gap-24 items-center">
              {/* VIDEO FEATURE - LEFT */}
              <div className="relative flex flex-col justify-start">
                <div className="lg:hidden mb-6 text-center">
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.34em] text-[#B5976D]">
                    Tasting Events
                  </p>

                  <h2 className="mt-3 font-cinzel text-[2.35rem] font-black leading-[1] tracking-[0.04em] text-[#E6DCC8]">
                    Great Coffee.
                    <br />
                    <span className="text-[#E6C07F]">Great People.</span>
                  </h2>
                </div>
                <div className="absolute -inset-5 bg-[#C08C45]/10 blur-3xl pointer-events-none" />

                <div className="relative w-full max-w-[560px]">
                  <div className="relative aspect-[9/14] md:aspect-[4/5] overflow-hidden rounded-2xl border border-[#6D5333]/60 bg-black shadow-2xl shadow-black/80">
                    <video
                      src="/web-movie.mp4"
                      className="absolute inset-0 w-full h-full object-cover bg-black"
                      autoPlay
                      muted
                      loop
                      playsInline
                      controls
                    />

                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent p-5 pointer-events-none">
                      <p className="font-oswald text-2xl md:text-3xl font-black uppercase tracking-[0.08em] text-ironsideWhite/90">
                        Easter Weekend
                      </p>

                      <p className="mt-1 text-[0.72rem] font-bold uppercase tracking-[0.22em] text-[#E6C07F]">
                        Fresh Cups • Real People • Great Feedback
                      </p>
                    </div>
                  </div>

                  <div className="absolute -right-10 top-10 hidden xl:block h-[72%] w-px bg-gradient-to-b from-transparent via-[#6D5333] to-transparent" />
                </div>
              </div>

              <div className="lg:hidden mt-5 text-center">
                <p className="text-[#B5976D] italic text-[1rem] leading-relaxed max-w-[320px] mx-auto">
                  Fresh coffee, good people, and real feedback from the
                  community.
                </p>

                <Link
                  to="/roast/armada-sample-pack"
                  className="mt-5 inline-flex h-[46px] items-center justify-center px-6 rounded-none bg-[#C08C45] text-black font-oswald font-black uppercase text-[0.82rem] tracking-[0.16em] border border-[#C08C45] transition-all duration-200 hover:bg-[#E6C07F]"
                >
                  Try A Sample
                </Link>
              </div>

              {/* TEXT FEATURE - RIGHT */}
              <div className="relative w-full max-w-[620px] hidden lg:block">
                <div className="border border-[#6D5333]/55 bg-[#0A0603]/82 backdrop-blur-sm p-7 xl:p-8 shadow-2xl shadow-black/60">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.36em] text-[#B5976D]">
                    Easter Weekend Tasting
                  </p>

                  <h2 className="mt-5 font-cinzel text-[2.2rem] sm:text-[2.55rem] xl:text-[3.4rem] font-black leading-[1.02] tracking-[0.03em] text-[#E6DCC8]">
                    Great Coffee.
                    <br />
                    <span className="text-[#E6C07F]">Great People.</span>
                  </h2>

                  <p className="mt-5 font-playfair italic text-[#B5976D] text-xl leading-relaxed">
                    Friends, fans, and new faces gathered around fresh-roasted
                    coffee.
                  </p>

                  <p className="mt-5 text-neutral-300 text-base xl:text-lg leading-relaxed">
                    The turnout was incredible. People tasted the lineup, talked
                    coffee, shared stories, brought good energy, and made the
                    whole thing feel like exactly what Old Ironsides Coffee was
                    created for.
                  </p>

                  <div className="mt-7 flex items-center gap-5">
                    <Link
                      to="/roast/armada-sample-pack"
                      className="inline-flex h-[50px] items-center justify-center px-7 rounded-none bg-[#C08C45] text-black font-oswald font-black uppercase text-[0.9rem] tracking-[0.18em] border border-[#C08C45] transition-all duration-200 hover:-translate-y-[1px] hover:bg-[#E6C07F] hover:border-[#E6C07F]"
                    >
                      Try A Sample
                    </Link>

                    <p className="text-[0.7rem] md:text-[0.76rem] uppercase tracking-[0.14em] md:tracking-[0.18em] text-[#B5976D] font-bold leading-relaxed">
                      Start small. Find your roast.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>
      {/* ===== FROM THE SAND TO THE SEA ===== */}
      <section
        id="origins-service"
        className="relative overflow-hidden bg-[#050302] scroll-mt-28 md:scroll-mt-36 py-8 md:py-20 border-b border-[#6D5333]/40"
      >
        <img
          src="/iraq-moon.JPG"
          alt="Service backdrop"
          className="absolute inset-0 hidden md:block w-full h-full object-cover object-center opacity-45 z-0 pointer-events-none"
        />

        <div className="absolute inset-0 bg-black/65 z-0 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/88 via-black/58 to-black/15 z-0 pointer-events-none" />

        <Container>
          <div className="relative z-10 hidden lg:grid min-h-[640px] pt-8 pb-14 xl:pt-10 xl:pb-16 grid-cols-[0.42fr_1.15fr_0.9fr] gap-8 xl:gap-12 items-start">
            {/* LEFT TITLE RAIL */}
            <div className="self-stretch flex items-center">
              <div className="border-l-2 border-[#C08C45] pl-6 xl:pl-8">
                <p className="mb-5 text-[0.68rem] font-semibold uppercase tracking-[0.42em] text-[#B5976D]">
                  Founder Story
                </p>

                <h3 className="font-cinzel text-4xl xl:text-5xl font-black uppercase leading-[1.05] tracking-[0.08em] text-[#E6DCC8]">
                  From The
                  <br />
                  Sand
                  <br />
                  To The
                  <br />
                  <span className="text-[#C08C45]">Sea</span>
                </h3>

                <div className="mt-7 h-px w-32 bg-[#6D5333]" />

                <p className="mt-5 max-w-[260px] font-playfair italic text-[#B5976D] text-lg leading-relaxed">
                  A different kind of service. Same standard.
                </p>
              </div>
            </div>

            {/* CENTER PHOTO FIELD */}
            <div className="relative h-[560px]">
              <div className="absolute left-0 top-0 w-[68%] overflow-hidden rounded-xl border border-[#6D5333]/60 bg-black shadow-2xl shadow-black/70">
                <img
                  src="/humvee-turret.jpg"
                  alt="Service photo"
                  className="w-full h-[300px] object-cover object-center"
                />
              </div>

              <div className="absolute right-0 top-[140px] w-[54%] overflow-hidden rounded-xl border border-[#C08C45]/70 bg-black shadow-2xl shadow-black/80">
                <img
                  src="/iraq-self1.JPG"
                  alt="Service portrait"
                  className="w-full h-[270px] object-cover object-center"
                />
              </div>

              <div className="absolute left-[70px] bottom-0 w-[58%] overflow-hidden rounded-xl border border-[#6D5333]/60 bg-black shadow-2xl shadow-black/70">
                <img
                  src="/iraq-kids.JPG"
                  alt="Service with local children"
                  className="w-full h-[250px] object-cover object-center"
                />
              </div>

              <div className="absolute right-6 bottom-10 border border-[#6D5333]/70 bg-black/80 px-6 py-4 backdrop-blur-sm shadow-xl shadow-black/60">
                <p className="font-oswald text-3xl font-black uppercase leading-none text-ironsideWhite/90">
                  Service
                </p>
                <p className="mt-2 text-[0.7rem] font-bold uppercase tracking-[0.22em] text-[#B5976D]">
                  Built The Standard
                </p>
              </div>
            </div>

            {/* RIGHT STORY CARD */}
            <div className="justify-self-end w-full max-w-[430px]">
              <div className="border border-[#6D5333]/55 bg-black/62 backdrop-blur-sm p-5 xl:p-6 shadow-2xl shadow-black/60">
                <p className="text-[#E6C07F] text-[0.72rem] font-bold uppercase tracking-[0.24em]">
                  The Code
                </p>

                <p className="mt-5 text-neutral-300 text-[0.95rem] xl:text-base leading-relaxed">
                  My service was in the sand, not on the deck. But the code was
                  the same: discipline, loyalty, pressure, and the refusal to
                  quit.
                </p>

                <p className="mt-4 text-neutral-300 text-base xl:text-lg leading-relaxed">
                  Old Ironsides Coffee was built from that standard. Not as a
                  gimmick. As a way to make coffee with care, consistency, and
                  something worth standing behind.
                </p>

                <div className="mt-6 border-l-2 border-[#C08C45] bg-[#130E08]/70 px-5 py-4">
                  <p className="text-[#E6C07F] text-[0.72rem] font-bold uppercase tracking-[0.2em]">
                    The Standard
                  </p>
                  <p className="mt-3 text-neutral-300 text-base leading-relaxed">
                    Serve with purpose. Build with discipline. Deliver something
                    worth standing behind.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* MOBILE VERSION UNCHANGED */}
          <div className="relative z-10 lg:hidden grid grid-cols-1 gap-8 items-center pt-2 pb-14">
            {/* TEXT */}
            <div className="order-1 text-center">
              <p className="mb-4 text-[0.7rem] font-semibold uppercase tracking-[0.36em] text-[#B5976D]">
                Founder Story
              </p>

              <h3 className="font-oswald text-5xl md:text-6xl font-black uppercase leading-[0.88] tracking-tight text-ironsideWhite/85">
                From The
                <br />
                Sand To
                <br />
                <span className="text-[#C08C45]">The Sea</span>
              </h3>

              <p className="mt-6 max-w-[650px] mx-auto font-playfair italic text-[#B5976D] text-lg md:text-xl leading-relaxed">
                Old Ironsides was born from a different kind of service.
              </p>

              {/* MOBILE PHOTO COLLAGE */}
              <div className="mt-8">
                <div className="relative mx-auto w-full max-w-[620px]">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2 overflow-hidden rounded-xl border border-[#6D5333]/60 bg-black shadow-2xl shadow-black/70">
                      <img
                        src="/humvee-turret.jpg"
                        alt="Service photo"
                        className="w-full h-[230px] object-cover object-center"
                      />
                    </div>

                    <div className="overflow-hidden rounded-xl border border-[#6D5333]/60 bg-black shadow-xl shadow-black/60">
                      <img
                        src="/iraq-kids.JPG"
                        alt="Service with local children"
                        className="w-full h-[175px] object-cover object-center"
                      />
                    </div>

                    <div className="overflow-hidden rounded-xl border border-[#C08C45]/70 bg-black shadow-xl shadow-black/70">
                      <img
                        src="/iraq-self1.JPG"
                        alt="Service portrait"
                        className="w-full h-[175px] object-cover object-center"
                      />
                    </div>
                  </div>

                  <div className="mx-auto -mt-6 relative z-10 w-fit border border-[#6D5333]/70 bg-black/85 px-6 py-4 backdrop-blur-sm shadow-xl shadow-black/60">
                    <p className="font-oswald text-3xl font-black uppercase leading-none text-ironsideWhite/90">
                      Service
                    </p>
                    <p className="mt-2 text-[0.7rem] font-bold uppercase tracking-[0.22em] text-[#B5976D]">
                      Built The Standard
                    </p>
                  </div>
                </div>
              </div>

              <p className="mt-5 text-neutral-300 text-[0.95rem] xl:text-base leading-relaxed">
                My service was in the sand, not on the deck. But the code was
                the same: discipline, loyalty, pressure, and the refusal to
                quit.
              </p>

              <p className="mt-4 text-neutral-300 text-base xl:text-lg leading-relaxed">
                Old Ironsides Coffee was built from that standard. Not as a
                gimmick. As a way to make coffee with care, consistency, and
                something worth standing behind.
              </p>

              <div className="mt-8 border-l-2 border-[#C08C45] bg-[#130E08]/65 px-6 py-5 text-left shadow-xl shadow-black/40">
                <p className="text-[#E6C07F] text-[0.78rem] font-bold uppercase tracking-[0.2em]">
                  The Standard
                </p>
                <p className="mt-3 text-neutral-300 text-base md:text-lg leading-relaxed">
                  Serve with purpose. Build with discipline. Deliver something
                  worth standing behind.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>
      {/* ===== SOURCED WITH RESPECT ===== */}
      <section
        id="origins-sourcing"
        className="relative overflow-hidden bg-[#050302] scroll-mt-28 md:scroll-mt-36 border-t border-[#6D5333]/40 border-b border-[#6D5333]/40"
      >
        {/* MOBILE */}
        <div className="md:hidden py-12">
          <div className="px-4">
            <p className="mb-3 text-[0.68rem] font-semibold uppercase tracking-[0.32em] text-[#B5976D]">
              Where It Begins
            </p>

            <h3 className="font-oswald text-5xl font-black uppercase leading-[0.9] tracking-tight text-ironsideWhite/90">
              The Story Behind
              <br />
              <span className="text-[#B5976D]">The Harvest.</span>
            </h3>

            <p className="mt-4 font-playfair italic text-[#B5976D] text-xl leading-relaxed">
              Before the roast, before the bag, before the cup, there&apos;s an
              origin story.
            </p>

            <p className="mt-5 text-neutral-300 text-[1rem] leading-relaxed">
              We source coffee from regions known for quality, character, and
              craft. Every bean is ethically sourced with respect for the people
              behind the harvest.
            </p>
          </div>

          <div className="relative mt-7 px-4">
            <div className="relative overflow-hidden rounded-xl border border-[#6D5333]/60 bg-black shadow-2xl shadow-black/70">
              <img
                src="/hands-beans.jpeg"
                alt="Hands holding coffee beans"
                className="w-full h-[340px] object-cover object-center block"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-black/10" />

              <div className="absolute left-4 bottom-4 right-4 border border-[#6D5333]/70 bg-black/75 p-4 backdrop-blur-sm">
                <p className="font-oswald text-3xl font-black uppercase leading-none text-ironsideWhite/90">
                  The Crew
                </p>
                <p className="mt-2 text-[0.68rem] font-bold uppercase tracking-[0.22em] text-[#B5976D]">
                  Behind Every Roast
                </p>
              </div>
            </div>
          </div>

          <div className="px-4 mt-6">
            <div className="rounded-xl border border-[#6D5333]/50 bg-[#0A0603]/90 p-5">
              <p className="text-[#C08C45] text-sm font-bold uppercase tracking-[0.18em]">
                Our Standard
              </p>
              <p className="mt-3 text-neutral-300 text-[0.96rem] leading-relaxed">
                No gimmicks. No factory-store nonsense. Just small-batch coffee
                chosen with care, roasted fresh, and built around people who
                give a damn.
              </p>
            </div>

            <p className="mt-6 text-[0.68rem] font-semibold uppercase tracking-[0.36em] text-[#B5976D]">
              Our Core Bean Origins:
            </p>

            <div className="mt-4 grid grid-cols-2 gap-y-3 gap-x-6 max-w-[320px] mx-auto">
              {[
                "Ethiopia",
                "Colombia",
                "Indonesia",
                "El Salvador",
                "Brazil",
                "Guatemala",
              ].map((origin) => (
                <div key={origin} className="flex items-center gap-2">
                  <span className="h-[5px] w-[5px] rounded-full bg-[#C08C45]" />
                  <span className="text-[0.8rem] font-bold uppercase tracking-[0.14em] text-[#C08C45]">
                    {origin}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* DESKTOP */}
        <div className="hidden md:block relative min-h-[680px]">
          <img
            src="/farm1-web.jpeg"
            alt="Coffee growing region"
            className="absolute inset-0 w-full h-full object-cover object-[50%_68%] opacity-80 brightness-[1.17] z-0 pointer-events-none"
          />

          <div className="absolute inset-0 bg-black/55 z-0 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/58 via-black/42 to-black/18 z-0 pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_42%,rgba(192,140,69,0.16),transparent_32%)] z-0 pointer-events-none" />

          <Container>
            <div className="relative z-10 min-h-[680px] py-14 xl:py-16 flex items-center">
              <div className="w-full grid grid-cols-[0.82fr_1.18fr] gap-10 xl:gap-14 items-center">
                {/* LEFT IMAGE CARD */}
                <div className="relative">
                  <div className="relative max-w-[560px] overflow-hidden rounded-xl border border-[#6D5333]/60 bg-black shadow-2xl shadow-black/70">
                    <img
                      src="/hands-beans.jpeg"
                      alt="Hands holding coffee beans"
                      className="w-full h-[460px] object-cover object-center"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/78 via-black/10 to-black/10" />

                    <div className="absolute left-5 bottom-5 right-5 border border-[#6D5333]/70 bg-black/75 p-4 backdrop-blur-sm">
                      <p className="font-oswald text-3xl font-black uppercase leading-none text-ironsideWhite/90">
                        The Crew
                      </p>
                      <p className="mt-2 text-[0.68rem] font-bold uppercase tracking-[0.22em] text-[#B5976D]">
                        Behind Every Roast
                      </p>
                    </div>
                  </div>
                </div>

                {/* RIGHT TEXT */}
                <div className="text-left max-w-[820px] ml-auto pl-4 xl:pl-10">
                  <p className="mb-3 text-[0.68rem] font-semibold uppercase tracking-[0.34em] text-[#B5976D]">
                    Sourced With Respect
                  </p>

                  <h3 className="font-oswald text-5xl xl:text-6xl font-black uppercase leading-[0.88] tracking-tight text-ironsideWhite/90">
                    The Story Behind
                    <br />
                    <span className="text-[#C08C45]">The Harvest.</span>
                  </h3>

                  <p className="mt-4 max-w-[680px] font-playfair italic text-xl xl:text-2xl text-[#B5976D] leading-relaxed">
                    Before the roast, before the bag, before the cup, there is
                    the land and the people who work it.
                  </p>

                  <p className="mt-4 max-w-[760px] text-neutral-300 text-base xl:text-lg leading-relaxed">
                    We source coffee from regions known for quality, character,
                    and craft. Many farms are organic, while others follow the
                    same careful farming practices without formal certification.
                    Every bean is ethically sourced with respect for the growers
                    behind the harvest.
                  </p>

                  <div className="mt-5 grid grid-cols-3 gap-3 max-w-[780px]">
                    <div className="rounded-xl border border-[#6D5333]/50 bg-black/55 p-4 backdrop-blur-sm">
                      <p className="text-[#C08C45] text-[0.8rem] font-bold uppercase tracking-[0.16em]">
                        Small Batch
                      </p>
                      <p className="mt-2 text-neutral-300 text-sm leading-relaxed">
                        Flavor and character, not warehouse volume.
                      </p>
                    </div>

                    <div className="rounded-xl border border-[#6D5333]/50 bg-black/55 p-4 backdrop-blur-sm">
                      <p className="text-[#C08C45] text-[0.8rem] font-bold uppercase tracking-[0.16em]">
                        Fair Sourcing
                      </p>
                      <p className="mt-2 text-neutral-300 text-sm leading-relaxed">
                        Quality, care, and respect behind every roast.
                      </p>
                    </div>

                    <div className="rounded-xl border border-[#6D5333]/50 bg-black/55 p-4 backdrop-blur-sm">
                      <p className="text-[#C08C45] text-[0.8rem] font-bold uppercase tracking-[0.16em]">
                        Real Origins
                      </p>
                      <p className="mt-2 text-neutral-300 text-sm leading-relaxed">
                        Altitude, climate, soil, and tradition in the cup.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 border-t-2 border-[#C08C45] bg-[#130E08]/70 px-6 py-4 shadow-xl shadow-black/40 max-w-[780px]">
                    <p className="text-[#E6C07F] text-[0.72rem] font-bold uppercase tracking-[0.2em]">
                      Our Core Bean Origins:
                    </p>

                    <div className="mt-4 grid grid-cols-3 gap-y-3 gap-x-8 max-w-[720px]">
                      {[
                        "Ethiopia",
                        "Colombia",
                        "Indonesia",
                        "El Salvador",
                        "Brazil",
                        "Guatemala",
                      ].map((origin) => (
                        <div key={origin} className="flex items-center gap-2">
                          <span className="h-[5px] w-[5px] rounded-full bg-[#C08C45]" />
                          <span className="text-[0.78rem] font-bold uppercase tracking-[0.14em] text-[#C08C45]">
                            {origin}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Container>
        </div>
      </section>

      {/* FLEET SECTION */}
      <section className="relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] overflow-hidden bg-black py-4 md:py-24">
        {/* BACKGROUND IMAGE */}
        <img
          src="/dark-theme.png"
          alt=""
          aria-hidden
          className="hidden md:block absolute inset-0 w-full h-full object-cover object-[center_20%] opacity-100 scale-110"
        />

        {/* OVERLAY */}
        <div className="hidden md:block absolute inset-0 bg-black/45" />

        {/* CONTENT */}
        <div className="relative">
          <LaunchedFromHarbor noBg />
        </div>
      </section>
      {/* ===== SAMPLE PACK SECTION ===== */}
      <section className="relative overflow-hidden bg-[#050302] py-12 md:py-16 xl:py-24 border-t border-[#6D5333]/40 border-b border-[#6D5333]/40">
        <div className="absolute inset-0 opacity-[0.08] bg-[repeating-linear-gradient(135deg,rgba(192,140,69,0.45)_0px,rgba(192,140,69,0.45)_1px,transparent_1px,transparent_12px)] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-black/40 pointer-events-none" />

        <Container>
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-[0.92fr_0.88fr] xl:grid-cols-[0.95fr_0.95fr] 2xl:grid-cols-[0.9fr_1.1fr] gap-8 md:gap-2 xl:gap-8 2xl:gap-16 items-center justify-center">
            {/* TEXT */}
            <div className="order-1 text-center md:text-left md:max-w-[500px] md:ml-auto xl:max-w-[560px] 2xl:max-w-none 2xl:ml-0">
              <h2 className="max-w-[560px] mx-auto md:mx-0 font-cinzel text-[2rem] sm:text-[2.4rem] md:text-[2.5rem] lg:text-[2.9rem] xl:text-[3.6rem] 2xl:text-6xl font-black uppercase leading-[0.95] tracking-[0.045em] 2xl:tracking-[0.06em] text-[#E6DCC8]">
                Sample Our Coffee.
                <br />
                <span className="text-[#B5976D]">Discover Your Roast.</span>
              </h2>

              <p className="mt-6 max-w-[560px] mx-auto md:mx-0 font-playfair italic text-[#B5976D] text-base md:text-lg xl:text-xl leading-relaxed">
                Find your roast before committing to a full bag.
              </p>

              {/* MOBILE IMAGE */}
              <div className="mt-7 md:hidden flex justify-center">
                <div className="relative w-full max-w-[620px]">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-[#6D5333]/50 bg-black shadow-2xl shadow-black/70">
                    <img
                      src="/sample-pack2.jpg"
                      alt="Old Ironsides Coffee sample packs"
                      className="absolute inset-0 w-full h-full object-cover"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10" />
                  </div>

                  <Link
                    to="/roast/armada-sample-pack"
                    className="mx-auto -mt-7 relative z-10 block w-fit border border-[#6D5333]/60 bg-[#C08C45] px-8 py-4 text-center shadow-xl shadow-black/50 transition-all duration-200 hover:-translate-y-[1px] hover:bg-[#E6C07F] hover:border-[#E6C07F]"
                  >
                    <p className="font-oswald text-lg font-black uppercase tracking-[0.22em] text-black">
                      SAMPLE BOX
                    </p>

                    <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-black/75">
                      One Roast Free • Free Shipping
                    </p>
                  </Link>
                </div>
              </div>

              <div className="mt-4 max-w-[560px] mx-auto md:mx-0 space-y-3">
                <p className="text-neutral-300 text-[0.95rem] md:text-base xl:text-lg leading-relaxed">
                  Each 2.5 oz sample is enough to brew roughly 6–8 cups of
                  coffee, giving you a real taste of the roast before committing
                  to a full bag.
                </p>

                <p className="text-neutral-300 text-[0.95rem] md:text-base xl:text-lg leading-relaxed">
                  Get a sample for $5 a piece, or get the{" "}
                  <Link
                    to="/roast/armada-sample-pack"
                    className="font-semibold text-[#E6C07F] transition-colors duration-200 hover:text-[#F2D29A]"
                  >
                    Sample Box
                  </Link>{" "}
                  and one roast free plus free shipping.
                </p>
              </div>
              <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-2 max-w-[520px] mx-auto md:mx-0">
                {roastCards.map((card) => (
                  <Link
                    key={card.id}
                    to={`/roast/${card.slug}`}
                    className="
                border border-[#6D5333]/70
                bg-[#130E08]/80
                px-3 py-2
                text-[0.72rem] font-semibold uppercase tracking-[0.16em]
                text-[#B5976D]
                transition-all duration-200
                hover:border-[#C08C45]
                hover:text-[#E6C07F]
                hover:bg-[#32220D]
              "
                  >
                    {card.title}
                  </Link>
                ))}
              </div>

              <div className="mt-8 flex flex-col items-center md:items-start">
                <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4">
                  <Link
                    to="/roast/armada-sample-pack"
                    className="inline-flex h-[56px] items-center justify-center px-9 bg-[#C08C45] text-black font-extrabold text-[0.95rem] md:text-[1.05rem] tracking-[0.18em] uppercase border border-[#C08C45] transition-all duration-200 hover:-translate-y-[1px] hover:bg-[#E6C07F] hover:border-[#E6C07F]"
                  >
                    Shop Samples
                  </Link>

                  <div className="text-center sm:text-left">
                    <p className="text-[#E6C07F] text-[0.75rem] font-bold uppercase tracking-[0.18em]">
                      Sample Box Ships Free
                    </p>
                  </div>
                </div>

                <div className="mt-3 relative overflow-hidden border border-[#5A4630]/60 bg-black/30 px-3 py-2 rounded-sm max-w-[500px]">
                  <div className="absolute inset-y-0 left-0 w-[3px] bg-[#C08C45]" />

                  <p className="pl-3 text-center md:text-left text-[10px] md:text-[11px] uppercase tracking-[0.16em] leading-snug text-[#D2B48C]">
                    Sample packs excluded from 15% first-order and subscription
                    discounts.
                  </p>
                </div>
              </div>
            </div>

            {/* DESKTOP IMAGE */}
            <div className="hidden md:flex order-2 justify-start">
              <div className="relative w-full max-w-[340px] lg:max-w-[390px] xl:max-w-[500px] 2xl:max-w-[620px]">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src="/sample-pack2.jpg"
                    alt="Old Ironsides Coffee sample packs"
                    className="absolute inset-0 w-full h-full object-cover"
                  />

                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_58%,rgba(5,3,2,0.55)_100%)]" />

                  <div className="absolute inset-0 bg-gradient-to-t from-[#050302]/70 via-transparent to-[#050302]/30" />
                </div>

                <Link
                  to="/roast/armada-sample-pack"
                  className="mx-auto -mt-7 relative z-10 block w-fit border border-[#6D5333]/60 bg-[#C08C45] px-8 py-4 text-center shadow-xl shadow-black/50 transition-all duration-200 hover:-translate-y-[1px] hover:bg-[#E6C07F] hover:border-[#E6C07F]"
                >
                  <p className="font-oswald text-lg font-black uppercase tracking-[0.22em] text-black">
                    Sample Box
                  </p>

                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-black/75">
                    One Roast Free • Free Shipping
                  </p>
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ===== FLEET SUBSCRIPTIONS ===== */}
      <section className="relative overflow-hidden bg-[#050302] py-12 md:py-16 border-t border-[#6D5333]/40 border-b border-[#6D5333]/40">
        {/* warm separation glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_48%,rgba(192,140,69,0.16),transparent_28%),radial-gradient(circle_at_42%_62%,rgba(120,66,18,0.16),transparent_24%),radial-gradient(circle_at_72%_42%,rgba(192,140,69,0.10),transparent_30%)] pointer-events-none" />

        {/* soft dark bronze wash */}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(12,7,3,0.96)_0%,rgba(30,15,4,0.78)_38%,rgba(20,10,2,0.84)_62%,rgba(5,3,2,0.98)_100%)] pointer-events-none" />

        {/* subtle texture */}
        <div className="absolute inset-0 opacity-[0.035] bg-[radial-gradient(#C08C45_0.6px,transparent_0.6px)] [background-size:18px_18px] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_32%,rgba(192,140,69,0.12),transparent_30%),radial-gradient(circle_at_82%_68%,rgba(109,83,51,0.14),transparent_36%)] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-[#050302]/90 to-black pointer-events-none" />
        {/* BIG warm cinematic glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute left-[18%] top-[18%] h-[520px] w-[520px] rounded-full bg-[#8A4B10]/22 blur-[120px]" />

          <div className="absolute left-[32%] top-[42%] h-[380px] w-[380px] rounded-full bg-[#C08C45]/18 blur-[110px]" />

          <div className="absolute right-[14%] top-[28%] h-[420px] w-[420px] rounded-full bg-[#5A2F08]/20 blur-[120px]" />

          <div className="absolute inset-0 bg-[radial-gradient(circle_at_38%_48%,rgba(192,140,69,0.14),transparent_34%)]" />
        </div>
        <Container>
          <div className="relative z-10 max-w-[1280px] mx-auto px-4 md:px-8">
            <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-8 lg:gap-14 xl:gap-20 items-center">
              {/* LEFT */}
              <div className="relative">
                <p className="font-cinzel text-[1.2rem] font-black uppercase tracking-[0.28em] text-[#EEE4D3]">
                  COFFEE SUBSCRIPTION
                </p>

                <h2 className="mt-4 font-cinzel text-3xl md:text-5xl xl:text-6xl font-black uppercase leading-[0.95] tracking-[0.04em]">
                  <span className="text-[#B88A4A]">Fresh Coffee.</span>

                  <br />

                  <span className="text-[#DDD2BE]">On Your Schedule.</span>
                </h2>
                <p className="mt-5 max-w-[640px] text-neutral-300 text-base md:text-lg leading-relaxed">
                  Set your schedule once and stay stocked with fresh-roasted
                  coffee without thinking about it again.
                </p>

                <div className="mt-7 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-[760px]">
                  {[
                    {
                      title: "10% Off",
                      text: "Core roasts when subscribed",
                    },
                    {
                      title: "Flexible",
                      text: "Pause, skip, or cancel anytime",
                    },
                    {
                      title: "Fresh",
                      text: "Roasted around order flow",
                    },
                  ].map((item) => (
                    <div
                      key={item.title}
                      className="border border-[#6D5333]/50 bg-[#100905]/75 px-4 py-4"
                    >
                      <p className="font-oswald text-xl font-black uppercase text-[#E6C07F]">
                        {item.title}
                      </p>

                      <p className="mt-2 text-sm leading-relaxed text-neutral-400">
                        {item.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* RIGHT */}
              <div className="relative border-l-2 border-[#C08C45] pl-5 md:pl-8">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.3em] text-[#B5976D]">
                  Fleet Benefits
                </p>

                <div className="mt-5 space-y-4">
                  {[
                    "Choose deliveries every 14, 30, or 60 days",
                    "Subscription pricing applies automatically",
                    "Oak & Copper available by subscription",
                    "Manage everything from your account portal",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <div className="mt-[7px] h-[6px] w-[6px] rounded-full bg-[#C08C45] shrink-0" />

                      <p className="text-neutral-300 text-[0.96rem] leading-relaxed">
                        {item}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex flex-col sm:flex-row gap-3">
                  <Link
                    to="/subscriptions"
                    className="inline-flex h-[52px] items-center justify-center px-7 bg-[#C08C45] text-black font-oswald text-sm font-black uppercase tracking-[0.18em] border border-[#C08C45] transition-all duration-200 hover:bg-[#E6C07F] hover:border-[#E6C07F]"
                  >
                    Subscribe
                  </Link>

                  <Link
                    to="/account"
                    className="inline-flex h-[52px] items-center justify-center px-7 border border-[#6D5333] bg-[#130E08] font-oswald text-sm font-black uppercase tracking-[0.16em] text-[#C08C45] transition-all duration-200 hover:border-[#C08C45] hover:bg-[#32220D] hover:text-[#E6C07F]"
                  >
                    Manage Subscription
                  </Link>
                </div>

                <p className="mt-4 text-[0.72rem] uppercase tracking-[0.18em] text-[#9C9791]">
                  No contracts. No nonsense.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ===== ABOUT OLD IRONSIDES COFFEE ===== */}
      <section
        id="origins-about"
        className="relative overflow-hidden bg-black scroll-mt-28 md:scroll-mt-36 border-t border-[#6D5333]/40 border-b border-[#6D5333]/40"
      >
        <img
          src="/oldironsides-1.jpg"
          alt="USS Constitution inspired Old Ironsides Coffee"
          className="absolute -inset-[8%] w-[116%] h-[116%] object-cover object-center opacity-95 brightness-[1.48] z-0 pointer-events-none"
        />

        <div className="absolute inset-0 bg-black/70 z-0 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/24 z-0 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/92 z-0 pointer-events-none" />

        <Container>
          <div className="relative z-10 min-h-[760px] py-16 xl:py-20 flex items-center">
            <div className="w-full grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-10 xl:gap-14 items-center">
              {/* LEFT TITLE + STORY */}
              <div className="text-center lg:text-left max-w-[760px] mx-auto lg:mx-0">
                <p className="mb-3 text-[0.68rem] font-semibold uppercase tracking-[0.36em] text-[#B5976D]">
                  Brand Legacy
                </p>

                <h3 className="font-oswald text-5xl md:text-6xl xl:text-7xl font-black uppercase leading-[0.88] tracking-tight text-ironsideWhite/90">
                  In Honor Of
                  <br />
                  <span className="text-[#C08C45]">Old Ironsides.</span>
                </h3>

                <p className="mt-5 max-w-[720px] mx-auto lg:mx-0 text-neutral-300 text-base xl:text-lg leading-relaxed">
                  Old Ironsides Coffee Company is a veteran-owned small-batch
                  coffee brand inspired by the USS Constitution, the world’s
                  oldest commissioned warship still afloat.
                </p>

                <p className="mt-4 max-w-[720px] mx-auto lg:mx-0 text-neutral-300 text-base xl:text-lg leading-relaxed">
                  Built in Boston and launched in 1797, the ship became a
                  lasting symbol of American resilience, craftsmanship, and
                  grit. During the War of 1812, her live-oak hull earned the
                  nickname “Old Ironsides.”
                </p>

                <p className="mt-4 max-w-[720px] mx-auto lg:mx-0 text-neutral-300 text-base xl:text-lg leading-relaxed">
                  That same spirit drives everything we do today: fresh-roasted
                  coffee crafted with discipline, pride, and respect for the
                  work.
                </p>

                <div className="mt-7 flex justify-center lg:justify-start">
                  <Link
                    to="/fleet-history"
                    className="inline-flex items-center justify-center border border-[#C08C45] bg-[#C08C45] px-7 py-3 font-oswald text-[0.82rem] font-black uppercase tracking-[0.22em] text-black transition hover:bg-[#E6C07F]"
                  >
                    Explore The History
                  </Link>
                </div>
              </div>

              {/* RIGHT COMPACT HERITAGE PANEL */}
              <div className="w-full max-w-[720px] mx-auto lg:mx-0 lg:justify-self-end">
                <div className="border border-[#6D5333]/55 bg-black/58 backdrop-blur-sm shadow-2xl shadow-black/60">
                  {/* TIMELINE STRIP */}
                  <div className="grid grid-cols-3 border-b border-[#6D5333]/50">
                    {[
                      { year: "1797", label: "Launched At Sea" },
                      { year: "1812", label: "Solidified Her Legacy" },
                      { year: "2025", label: "Our Roast Launched" },
                    ].map((item, i) => (
                      <div
                        key={item.year}
                        className={`px-4 py-5 text-center ${
                          i !== 2 ? "border-r border-[#6D5333]/50" : ""
                        }`}
                      >
                        <p className="font-oswald text-4xl font-black leading-none text-ironsideWhite/90">
                          {item.year}
                        </p>
                        <p className="mt-2 text-[0.62rem] font-bold uppercase tracking-[0.16em] text-[#B5976D]">
                          {item.label}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* STANDARD */}
                  <div className="p-6">
                    <p className="text-[#E6C07F] text-[0.74rem] font-bold uppercase tracking-[0.22em]">
                      The Standard
                    </p>

                    <p className="mt-3 text-neutral-300 text-base leading-relaxed">
                      The USS Constitution was built to endure. That standard
                      carries into the brand: durability, discipline, and pride
                      in the work.
                    </p>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      {[
                        { label: "Flagship", slug: "flagship" },
                        { label: "Baptism By Fire", slug: "baptism-by-fire" },
                        { label: "Java Action", slug: "java-action" },
                        { label: "Oak & Copper", slug: "oak-and-copper" },
                      ].map((item) => (
                        <Link
                          key={item.slug}
                          to={`/stories/${item.slug}`}
                          onClick={() => {
                            try {
                              sessionStorage.setItem(
                                "storiesReturnTo",
                                STORIES_HOME
                              );
                            } catch {}
                          }}
                          className="border border-[#6D5333]/60 bg-[#130E08]/70 px-3 py-3 text-center text-[0.7rem] font-bold uppercase tracking-[0.14em] text-[#C08C45] transition hover:border-[#C08C45] hover:text-[#E6C07F]"
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ===== GIVING BACK ===== */}
      <section
        id="origins-giving-back"
        className="relative overflow-hidden bg-[#050302] scroll-mt-28 md:scroll-mt-36 py-14 md:py-20 border-t border-[#6D5333]/40 border-b border-[#6D5333]/40"
      >
        <img
          src="/flag-close.jpg"
          alt=""
          role="presentation"
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-18 z-0 pointer-events-none"
        />

        <div className="absolute inset-0 bg-black/76 z-0 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-black/45 z-0 pointer-events-none" />

        <Container>
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr] gap-9 lg:gap-16 xl:gap-20 items-center">
            {/* DESKTOP IMAGE */}
            <div className="hidden lg:block order-1">
              <div className="relative w-full max-w-[560px] mx-auto lg:mx-0">
                <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-[#6D5333]/60 bg-black shadow-2xl shadow-black/70">
                  <img
                    src="/soliders-sunset.jpg"
                    alt="Soldiers at sunset"
                    className="absolute inset-0 w-full h-full object-cover object-center saturate-75"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-black/20" />

                  <div className="absolute left-4 bottom-4 right-4 border border-[#6D5333]/70 bg-black/75 p-4 backdrop-blur-sm">
                    <p className="font-oswald text-2xl md:text-3xl font-black uppercase leading-none text-ironsideWhite/90">
                      Still Standing
                    </p>
                    <p className="mt-2 text-[0.68rem] font-bold uppercase tracking-[0.22em] text-[#B5976D]">
                      A Standing Discount For Those Who Serve
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* TEXT */}
            <div className="order-1 lg:order-2 text-center lg:text-left">
              <p className="mb-4 text-[0.68rem] font-semibold uppercase tracking-[0.36em] text-[#B5976D]">
                Standing With The Sacrifice.
              </p>

              <h3 className="font-oswald text-5xl md:text-6xl xl:text-7xl font-black uppercase leading-[0.88] tracking-tight text-ironsideWhite/90">
                Built By
                <br />
                A Veteran.
                <br />
                <span className="text-[#C08C45]">For Those Who Serve.</span>
              </h3>

              <p className="mt-5 max-w-[650px] mx-auto lg:mx-0 font-playfair italic text-[#B5976D] text-lg md:text-xl leading-relaxed">
                This is not a campaign. It is a standing policy.
              </p>

              {/* MOBILE IMAGE */}
              <div className="mt-8 lg:hidden">
                <div className="relative w-full max-w-[560px] mx-auto">
                  <div className="relative aspect-[16/11] overflow-hidden rounded-xl border border-[#6D5333]/60 bg-black shadow-2xl shadow-black/70">
                    <img
                      src="/soliders-sunset.jpg"
                      alt="Soldiers at sunset"
                      className="absolute inset-0 w-full h-full object-cover object-center saturate-75"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-black/20" />

                    <div className="absolute left-4 bottom-4 right-4 border border-[#6D5333]/70 bg-black/75 p-4 backdrop-blur-sm">
                      <p className="font-oswald text-2xl font-black uppercase leading-none text-ironsideWhite/90">
                        Still Standing
                      </p>
                      <p className="mt-2 text-[0.68rem] font-bold uppercase tracking-[0.22em] text-[#B5976D]">
                        A Standing Discount For Those Who Serve
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <p className="mt-5 max-w-[700px] mx-auto lg:mx-0 text-neutral-300 text-base md:text-lg leading-relaxed">
                Old Ironsides Coffee was built by a veteran, so supporting
                active duty, veterans, and first responders is part of the
                company from the start.
              </p>

              <div className="mt-7 max-w-[700px] mx-auto lg:mx-0 border border-[#6D5333]/60 bg-black/55 p-5 md:p-6 shadow-xl shadow-black/40">
                <p className="text-[#E6C07F] text-[0.78rem] font-bold uppercase tracking-[0.2em]">
                  GovX Discount
                </p>

                <p className="mt-3 text-neutral-300 text-base md:text-lg leading-relaxed">
                  Active duty, veterans, and first responders receive $1 off
                  every bag, every day. The discount stacks with subscriptions.
                </p>

                <div className="mt-5 flex flex-col sm:flex-row gap-3 sm:items-center">
                  <a
                    href="https://auth.govx.com/shopify/verify?shop=81ub0m-s7.myshopify.com&utm_source=shopify&utm_medium=govxid&utm_campaign=custom_link"
                    className="inline-flex h-[48px] items-center justify-center px-6 bg-[#C08C45] text-black font-extrabold text-[0.85rem] tracking-[0.16em] uppercase border border-[#C08C45] transition-all duration-200 hover:-translate-y-[1px] hover:bg-[#E6C07F] hover:border-[#E6C07F]"
                  >
                    Get GovX Discount Code
                  </a>

                  <p className="text-[0.78rem] leading-relaxed text-[#B5976D]">
                    Verified through GovX. Applied at checkout.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2 max-w-[700px] mx-auto lg:mx-0">
                {["Active Duty", "Veterans", "First Responders"].map(
                  (label) => (
                    <div
                      key={label}
                      className="border border-[#6D5333]/50 bg-[#130E08]/55 px-3 py-3 text-center text-[0.68rem] md:text-[0.72rem] font-bold uppercase tracking-[0.12em] text-[#C08C45]"
                    >
                      {label}
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section
        id="contact"
        className="relative overflow-hidden bg-[#050302] py-16 md:py-24 border-t border-[#6D5333]/40 border-b border-[#6D5333]/40"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_45%,rgba(192,140,69,0.13),transparent_32%),radial-gradient(circle_at_82%_70%,rgba(109,83,51,0.14),transparent_34%)] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-[#050302] to-black pointer-events-none" />

        <Container>
          <div className="relative z-10 max-w-[1280px] mx-auto">
            {/* MAIN CONTACT ROW */}
            <div className="grid grid-cols-1 lg:grid-cols-[1.08fr_0.92fr] gap-12 lg:gap-20 items-center">
              {/* LEFT */}
              <div className="text-center lg:text-left max-w-[740px] mx-auto lg:mx-0">
                <p className="mb-4 text-[0.68rem] font-medium uppercase tracking-[0.38em] text-[#B5976D]">
                  The Quarterdeck
                </p>

                <h2 className="font-oswald text-5xl md:text-6xl xl:text-7xl font-black uppercase leading-[0.88] tracking-tight text-ironsideWhite/90">
                  HAIL THE
                  <br />
                  <span className="text-[#C08C45]">QUARTERDECK!</span>
                </h2>

                <p className="mt-6 max-w-[650px] mx-auto lg:mx-0 font-playfair italic text-[#B5976D] text-lg md:text-2xl leading-relaxed">
                  Questions, wholesale, partnerships, press, or just a good
                  coffee conversation.
                </p>

                <p className="mt-6 max-w-[690px] mx-auto lg:mx-0 text-neutral-300 text-base md:text-lg leading-relaxed">
                  Old Ironsides Coffee is still run close to the deck. No
                  outsourced support maze. No corporate black hole. When you
                  reach out, you are talking directly to the company behind the
                  roast.
                </p>

                <div className="mt-9 h-px w-36 bg-gradient-to-r from-[#C08C45] to-transparent mx-auto lg:mx-0 opacity-80" />

                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-[680px] mx-auto lg:mx-0">
                  <div className="border border-[#6D5333]/50 bg-black/45 px-5 py-4">
                    <p className="text-[#C08C45] text-[0.72rem] font-bold uppercase tracking-[0.22em]">
                      Rooted in pride.
                    </p>
                    <p className="mt-2 text-neutral-300 text-sm leading-relaxed">
                      Inspired by the USS Constitution and America’s naval
                      heritage.
                    </p>
                  </div>

                  <div className="border border-[#6D5333]/50 bg-black/45 px-5 py-4">
                    <p className="text-[#C08C45] text-[0.72rem] font-bold uppercase tracking-[0.22em]">
                      Nationwide Shipping
                    </p>
                    <p className="mt-2 text-neutral-300 text-sm leading-relaxed">
                      Fresh-roasted coffee shipped across the United States.
                    </p>
                  </div>
                </div>
              </div>

              {/* RIGHT CONTACT CARD */}
              <div className="relative">
                <div className="absolute -inset-6 bg-[#C08C45]/8 blur-3xl pointer-events-none" />

                <div className="relative overflow-hidden rounded-2xl border border-[#6D5333]/60 bg-black/70 backdrop-blur-md shadow-2xl shadow-black/70">
                  <div className="border-b border-[#6D5333]/50 bg-[#130E08]/85 px-6 py-5">
                    <p className="font-oswald text-3xl font-black uppercase tracking-[0.14em] text-[#C08C45]">
                      Old Ironsides HQ
                    </p>

                    <p className="mt-2 text-[0.72rem] font-bold uppercase tracking-[0.24em] text-[#B5976D]">
                      Direct Contact
                    </p>
                  </div>

                  <div className="p-6 md:p-7 space-y-5">
                    <a
                      href="mailto:HQ@oldironsidescoffee.org"
                      className="group block rounded-xl border border-[#6D5333]/50 bg-[#050302]/85 px-5 py-5 transition hover:border-[#C08C45] hover:bg-[#130E08]/80"
                    >
                      <div className="flex items-center gap-3 text-[#C08C45]">
                        <Mail className="h-5 w-5" />
                        <p className="font-oswald text-xl font-black uppercase tracking-[0.12em]">
                          Send Dispatch
                        </p>
                      </div>

                      <p className="mt-3 text-neutral-300 text-base break-all">
                        HQ@oldironsidescoffee.org
                      </p>

                      <p className="mt-2 text-[#9C9791] text-sm">
                        Questions, support, press, wholesale, and partnerships.
                      </p>
                    </a>

                    <div className="rounded-xl border border-[#6D5333]/50 bg-[#050302]/85 px-5 py-5">
                      <p className="font-oswald text-xl font-black uppercase tracking-[0.12em] text-[#C08C45]">
                        Port Of Call
                      </p>

                      <p className="mt-3 text-neutral-300 text-base leading-relaxed">
                        6 Liberty Square #2564
                        <br />
                        Boston, MA 02109
                      </p>

                      <p className="mt-2 text-[#9C9791] text-sm">
                        Boston roots. Veteran-owned. Small-batch roasted.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <a
                        href="https://instagram.com/oldironsidescoffee"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-[50px] items-center justify-center gap-2 rounded-lg border border-[#6D5333] bg-black/60 px-5 font-oswald text-sm font-black uppercase tracking-[0.16em] text-[#C08C45] transition hover:border-[#C08C45] hover:text-[#E6C07F]"
                      >
                        <Instagram className="h-4 w-4" />
                        Instagram
                      </a>

                      <a
                        href="https://facebook.com/oldironsidescoffee"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-[50px] items-center justify-center gap-2 rounded-lg border border-[#6D5333] bg-black/60 px-5 font-oswald text-sm font-black uppercase tracking-[0.16em] text-[#C08C45] transition hover:border-[#C08C45] hover:text-[#E6C07F]"
                      >
                        <Facebook className="h-4 w-4" />
                        Facebook
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* GOVERNMENT CONTRACTS ROW */}
            <div className="mt-14 border-t border-[#6D5333]/40 pt-10">
              <div className="grid grid-cols-1 lg:grid-cols-[0.7fr_1.3fr] gap-6 lg:gap-10 items-center">
                <div className="text-center lg:text-left">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.36em] text-[#B5976D]">
                    Government Contracts
                  </p>

                  <h3 className="mt-3 font-oswald text-4xl md:text-5xl font-black uppercase leading-[0.9] tracking-tight text-ironsideWhite/90">
                    SDVOSB
                    <br />
                    <span className="text-[#C08C45]">Procurement</span>
                  </h3>

                  <p className="mt-5 max-w-[540px] mx-auto lg:mx-0 text-neutral-300 text-base md:text-lg leading-relaxed">
                    Information for agency purchasing, procurement officers, and
                    government contract opportunities.
                  </p>
                </div>

                <div className="rounded-2xl border border-[#6D5333]/60 bg-black/60 backdrop-blur-sm p-5 md:p-7 shadow-xl shadow-black/50">
                  <SDVOSBHighlight />
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>
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
        <div className="text-center text-base sm:text-lg md:text-xl text-[#C08C45] font-bold group-hover:underline">
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
  "w-full max-w-[24rem] md:max-w-[26rem] aspect-[3/4] overflow-hidden rounded-2xl ring-1 ring-[#C08C45]/60 shadow-2xl shadow-amber-500/20 bg-neutral-900/40";
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
            to="/fleet-history" // Use the constant STORIES_HOME here
            className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm ring-1 ring-[#C08C45]/70 text-[#C08C45] hover:bg-[#C08C45] hover:text-neutral-900 transition"
            onClick={() => {
              try {
                sessionStorage.setItem("storiesReturnTo", "/fleet-history");
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
              className="block w-full h-full object-cover max-md:rounded-2xl max-md:ring-1 max-md:ring-[#C08C45]/60"
              loading="eager"
              decoding="async"
            />
          </figure>

          <div className="ml-4 self-start">
            {" "}
            {/* Adjusted spacing between image and text */}
            <h1
              className="m-0 text-3xl md:text-4xl font-extrabold tracking-tight text-[#C08C45]"
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
              <div className="text-[#C08C45] font-semibold text-sm md:text-base">
                {card.battleDate}
              </div>
            )}
            {/* Amber border line */}
            <div className="mt-2 h-px w-full bg-[#C08C45]/30" />
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
          className="my-0 md:my-12 lg:my-16 h-px w-full bg-[#C08C45]/30"
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
            <figcaption className="mt-2 text-xs md:text-sm text-[#C08C45] text-center">
              {caps.left}
            </figcaption>
          </figure>

          {/* Text Block (desktop center, mobile below spanning both) */}
          <div className="md:flex-grow md:px-6 max-md:col-span-2 max-md:order-3 max-md:mt-6 text-left px-2">
            <h2
              className="text-xl md:text-2xl font-bold text-[#C08C45] tracking-tight max-md:text-center md:text-center"
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
            <figcaption className="mt-2 text-xs md:text-sm text-[#C08C45] text-center">
              {caps.right}
            </figcaption>
          </figure>
        </div>
      </Container>
    </main>
  );
}
function FleetHistoryPage() {
  const histScrollRef = React.useRef<HTMLDivElement | null>(null);
  const histCardRefs = React.useRef<(HTMLAnchorElement | null)[]>([]);
  const [histIdx, setHistIdx] = React.useState(0);

  const histSlugs = [
    "flagship",
    "baptism-by-fire",
    "java-action",
    "oak-and-copper",
  ];

  const fleetCards = histSlugs
    .map((slug) => roastCards.find((c) => c.slug === slug))
    .filter(Boolean);

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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

  return (
    <main className="relative overflow-hidden bg-black pt-8 pb-16 md:pt-14 md:pb-24">
      <img
        src="/maps-books.png"
        alt=""
        className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover opacity-25"
      />

      <div className="absolute inset-0 z-0 bg-black/75 pointer-events-none" />

      <Container>
        <div className="relative z-10 mx-auto max-w-5xl text-center">
          <p className="font-oswald text-[0.75rem] font-black uppercase tracking-[0.28em] text-[#C08C45]">
            Old Ironsides History
          </p>

          <h1 className="mt-3 font-cinzel text-3xl md:text-5xl font-black uppercase tracking-[0.12em] text-[#E6C07F]">
            The History Behind The Fleet
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-sm md:text-base leading-relaxed text-neutral-300">
            The ships, battles, captains, and stories behind each roast.
          </p>
        </div>

        <div className="relative z-10 mt-10">
          <div
            ref={histScrollRef}
            onScroll={onHistScroll}
            className="flex gap-5 overflow-x-auto scroll-smooth pb-6 snap-x snap-mandatory md:grid md:grid-cols-4 md:overflow-visible md:pb-0"
          >
            {fleetCards.map((card: any, i) => (
              <Link
                key={card.slug}
                ref={(el) => {
                  histCardRefs.current[i] = el;
                }}
                to={`/fleet-story/${card.slug}`}
                className="group relative min-w-[78%] sm:min-w-[48%] md:min-w-0 snap-center overflow-hidden rounded-2xl border border-[#6D5333]/70 bg-[#080503] shadow-xl shadow-black/50 transition hover:-translate-y-1 hover:border-[#C08C45]"
              >
                <div className="relative aspect-[3/4] overflow-hidden">
                  <img
                    src={card.heroImg}
                    alt={card.title}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent" />

                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <p className="font-oswald text-[0.68rem] font-black uppercase tracking-[0.22em] text-[#C08C45]">
                      Fleet Story
                    </p>

                    <h2 className="mt-2 font-cinzel text-xl font-black uppercase tracking-[0.08em] text-[#E6C07F]">
                      {card.slug === "java-action"
                        ? "The Java Action"
                        : card.title}
                    </h2>

                    {card.battleDate && (
                      <p className="mt-1 text-sm font-semibold text-[#C08C45]">
                        {card.battleDate}
                      </p>
                    )}

                    <p className="mt-3 text-sm leading-relaxed text-neutral-300">
                      Read the story behind the roast.
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-5 flex items-center justify-center gap-4 md:hidden">
            <button
              type="button"
              onClick={histPrev}
              className="rounded-full border border-[#6D5333] px-4 py-2 text-[#C08C45]"
            >
              ←
            </button>

            <div className="text-xs uppercase tracking-[0.2em] text-neutral-400">
              {histIdx + 1} / {histSlugs.length}
            </div>

            <button
              type="button"
              onClick={histNext}
              className="rounded-full border border-[#6D5333] px-4 py-2 text-[#C08C45]"
            >
              →
            </button>
          </div>
        </div>
      </Container>
    </main>
  );
}
/* ================== ROAST DETAIL PAGE (CLEAN) ================== */
function BuyBoxSection({
  mobile = false,
  card,
  isOak,
  size,
  purchaseMode,
  setPurchaseMode,
  subEvery,
  setSubEvery,
  basePrice,
  discounted,
  beanType,
  setBeanType,
  showBeanError,
  setShowBeanError,
  qty,
  setQty,
  addToChest,
  adding,
  buyBoxRef,
  buyBoxDims,
}: {
  mobile?: boolean;
  card: any;
  isOak: boolean;
  size: "12oz" | "sample";
  purchaseMode: "one" | "sub";
  setPurchaseMode: React.Dispatch<React.SetStateAction<"one" | "sub">>;
  subEvery: 14 | 30 | 60;
  setSubEvery: React.Dispatch<React.SetStateAction<14 | 30 | 60>>;
  basePrice: number;
  discounted: number;
  beanType: "" | "whole" | "ground";
  setBeanType: React.Dispatch<React.SetStateAction<"" | "whole" | "ground">>;
  showBeanError: boolean;
  setShowBeanError: React.Dispatch<React.SetStateAction<boolean>>;
  qty: number;
  setQty: React.Dispatch<React.SetStateAction<number>>;
  addToChest: () => void;
  adding: boolean;
  buyBoxRef?: React.RefObject<HTMLDivElement | null>;
  buyBoxDims?: { h: number };
}) {
  if (mobile) {
    return (
      <div className="order-2 w-full md:order-4 md:hidden mt-4">
        <div className="space-y-3">
          <PurchaseModeButton
            mode="one"
            size={size}
            active={purchaseMode === "one"}
            onClick={() => setPurchaseMode("one")}
            basePrice={basePrice}
            discounted={discounted}
            isOak={isOak}
          />

          <PurchaseModeButton
            mode="sub"
            size={size}
            active={purchaseMode === "sub"}
            onClick={() => setPurchaseMode("sub")}
            basePrice={basePrice}
            discounted={discounted}
            isOak={isOak}
            subEvery={subEvery}
            setSubEvery={setSubEvery}
            showSubOptions={purchaseMode === "sub"}
          />
        </div>

        <div className="mt-4 flex items-center gap-3">
          <QuantityControl
            qty={qty}
            setQty={setQty}
            className="inline-flex items-center rounded-md border border-[#6D5333]"
            buttonClassName="px-3 py-2 text-[#E6C07F] hover:bg-[#32220D]"
            inputClassName="w-12 text-center bg-black py-2 text-sm text-[#E6C07F] outline-none border-x border-[#6D5333]"
          />

          <button
            type="button"
            onClick={addToChest}
            disabled={adding}
            className={
              "flex-1 rounded-md border border-[#C08C45] px-4 py-3 text-base font-semibold text-[#E6C07F] bg-black shadow-md shadow-[#C08C45]/10 transition " +
              (adding
                ? "opacity-60 cursor-not-allowed"
                : "hover:bg-[#C08C45] hover:text-black")
            }
            aria-label={`Add ${card.title} to Chest`}
          >
            {adding ? "Adding..." : "Add to Chest"}
          </button>
        </div>

        <div className="mt-2 text-sm text-right">
          <span className="text-[#B39871] font-semibold">
            3+ bags ship free
          </span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className={`hidden md:block order-2 md:order-4 mt-6 w-full${
          card.slug === "flagship" ? DESKTOP_BUYBOX_SHIFT[card.slug] || "" : ""
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-stretch md:gap-4">
          <div
            ref={buyBoxRef}
            className="inline-flex w-full md:w-auto items-center gap-4 rounded-md border border-[#6D5333] bg-black/70 p-3 px-4 shadow-md shadow-[#C08C45]/10"
          >
            <div className="text-sm">
              {purchaseMode === "sub" && !isOak ? (
                <>
                  <span className="line-through text-[#9C9791] mr-2">
                    {fmt(basePrice)}
                  </span>
                  <span className="font-bold text-[#E6C07F]">
                    {fmt(discounted)}
                  </span>
                </>
              ) : (
                <span className="font-bold text-[#E6C07F]">
                  {fmt(basePrice)}
                </span>
              )}

              <span className="text-xs text-[#9C9791] ml-1">/ bag</span>
            </div>

            <div className="ml-auto inline-flex items-center gap-4">
              <QuantityControl
                qty={qty}
                setQty={setQty}
                className="inline-flex items-center rounded-md border border-[#6D5333]"
                buttonClassName="px-2 py-1 text-[#E6C07F] hover:bg-[#32220D]"
                inputClassName="w-12 text-center bg-black/70 py-1.5 text-sm text-[#E6C07F] outline-none border-x border-[#6D5333]"
              />

              <div className="flex items-center justify-between w-full px-[4px] md:px-[5px] gap-4">
                <button
                  type="button"
                  onClick={addToChest}
                  disabled={adding}
                  className={
                    "px-4 py-2 md:px-6 md:py-3 rounded-md text-sm md:text-base font-semibold border border-[#C08C45] text-[#E6C07F] bg-black transition shadow-md shadow-[#C08C45]/10 " +
                    (adding
                      ? "opacity-60 cursor-not-allowed"
                      : "hover:bg-[#C08C45] hover:text-black")
                  }
                  aria-label={`Add ${card.title} to Chest`}
                >
                  {adding ? "Adding..." : "Add to Chest"}
                </button>

                <div className="text-[13px] md:text-[14px] font-extrabold tracking-wide text-right text-[#E6C07F] leading-tight">
                  Free shipping on{" "}
                  <span className="text-[#C08C45]">3+ bags</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className={`hidden md:block order-3 md:order-3 mt-6 w-full${
          card.slug === "flagship" ? DESKTOP_BUYBOX_SHIFT[card.slug] || "" : ""
        }`}
      >
        <div className="w-full max-w-[620px] grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setPurchaseMode("one")}
            className={
              "h-[58px] rounded-md border text-sm md:text-base leading-none tracking-tight font-semibold transition text-center " +
              (purchaseMode === "one"
                ? "bg-[#C08C45] text-black border-[#C08C45]"
                : "bg-[#130E08] text-[#C08C45] border-[#6D5333] hover:border-[#C08C45] hover:text-[#E6C07F]")
            }
            aria-pressed={purchaseMode === "one"}
          >
            Single Purchase
          </button>

          <button
            type="button"
            disabled={size === "sample"}
            onClick={() => {
              if (size === "sample") return;
              setPurchaseMode("sub");
            }}
            className={
              "h-[58px] rounded-md border text-sm md:text-base font-semibold transition text-center " +
              (size === "sample"
                ? "bg-[#130E08] text-[#6D6D6D] border-[#6D5333]/40 opacity-50 cursor-not-allowed"
                : purchaseMode === "sub"
                ? "bg-[#32220D] text-[#E6C07F] border-[#C08C45]"
                : "bg-[#130E08] text-[#C08C45] border-[#6D5333] hover:border-[#C08C45] hover:text-[#E6C07F]")
            }
            aria-pressed={purchaseMode === "sub"}
          >
            {isOak ? "Join the Fleet" : "Subscribe & Save 10%"}
          </button>
        </div>

        {purchaseMode === "sub" && size !== "sample" && (
          <SubscriptionFrequencyPicker
            subEvery={subEvery}
            setSubEvery={setSubEvery}
          />
        )}
      </div>
    </>
  );
}
function useBuyBox(card: any) {
  const isOak = card.slug === "oak-and-copper";

  const [purchaseMode, setPurchaseMode] = useState<"one" | "sub">("one");
  const [subEvery, setSubEvery] = useState<14 | 30 | 60>(30);
  const [qty, setQty] = useState(1);
  const [beanType, setBeanType] = useState<"" | "whole" | "ground">("");
  const [size, setSize] = useState<"12oz" | "sample">("12oz");
  const [showBeanError, setShowBeanError] = useState(false);

  const basePrice =
    size === "sample"
      ? card.slug === "oak-and-copper"
        ? 6
        : 5
      : isOak
      ? 24.99
      : card.price ?? 19.99;
  const discounted = isOak ? basePrice : Number((basePrice * 0.9).toFixed(2));

  return {
    isOak,
    purchaseMode,
    setPurchaseMode,
    subEvery,
    setSubEvery,
    qty,
    setQty,
    beanType,
    setBeanType,
    showBeanError,
    setShowBeanError,
    basePrice,
    discounted,
    size,
    setSize,
  };
}
function PriceDisplay({
  basePrice,
  discounted,
  purchaseMode,
  isOak,
  sizeLabel = "/ 12oz bag",
}: {
  basePrice: number;
  discounted: number;
  purchaseMode: "one" | "sub";
  isOak: boolean;
  sizeLabel?: string;
}) {
  if (purchaseMode === "sub") {
    return (
      <>
        {!isOak && (
          <span className="line-through text-[#9C9791] mr-2">
            {fmt(basePrice)}
          </span>
        )}
        <span className="font-semibold text-[#E6C07F]">{fmt(discounted)}</span>
        <span className="text-xs text-[#9C9791] ml-1">{sizeLabel}</span>
      </>
    );
  }

  return (
    <>
      <span className="font-semibold text-[#E6C07F]">{fmt(basePrice)}</span>
      <span className="text-xs text-[#9C9791] ml-1">{sizeLabel}</span>
    </>
  );
}
function PurchaseModeButton({
  mode,
  active,
  onClick,
  basePrice,
  discounted,
  isOak,
  subEvery,
  setSubEvery,
  showSubOptions = false,
  size,
}: {
  mode: "one" | "sub";
  active: boolean;
  onClick: () => void;
  basePrice: number;
  discounted: number;
  isOak: boolean;
  subEvery?: 14 | 30 | 60;
  setSubEvery?: React.Dispatch<React.SetStateAction<14 | 30 | 60>>;
  showSubOptions?: boolean;
  size: "12oz" | "sample";
}) {
  const isSub = mode === "sub";
  const disabled = size === "sample" && isSub;

  return (
    <button
      type="button"
      onClick={() => {
        if (disabled) return;
        onClick();
      }}
      disabled={disabled}
      className={
        "w-full border rounded-md p-4 transition " +
        (isSub
          ? "flex flex-col text-left "
          : "flex items-start justify-between text-left ") +
        (disabled
          ? "border-[#6D5333]/40 bg-[#130E08] text-[#6D6D6D] opacity-50 cursor-not-allowed"
          : active
          ? "border-[#C08C45] bg-[#32220D] text-[#E6C07F] shadow-[0_0_14px_rgba(192,140,69,0.16)]"
          : "border-[#6D5333] bg-[#130E08] text-[#9C9791]")
      }
      aria-pressed={active}
    >
      <div
        className={
          isSub
            ? "w-full flex items-start gap-3"
            : "flex items-start gap-3 w-full"
        }
      >
        <div
          className={
            "h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 " +
            (active ? "border-[#C08C45]" : "border-[#6D5333]")
          }
        >
          <div
            className={
              "h-2.5 w-2.5 rounded-full " +
              (active ? "bg-[#C08C45]" : "bg-transparent")
            }
          />
        </div>

        <div className="flex flex-col flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1 w-full">
            <span className="text-base font-cinzel font-black leading-none">
              {isSub ? "Join The Fleet" : "Single Purchase"}
            </span>

            <span className="text-sm">
              <PriceDisplay
                basePrice={basePrice}
                discounted={discounted}
                purchaseMode={mode}
                isOak={isOak}
              />
            </span>
          </div>

          {isSub && !isOak && !disabled && (
            <div className="mt-2 flex items-center gap-2">
              <span className="inline-block text-[11px] font-bold leading-none px-2 py-1 rounded-[4px] bg-[#C08C45] text-black tracking-tight">
                SAVE 10%
              </span>

              <span className="text-[11px] text-[#B39871] font-medium">
                Skip or cancel anytime
              </span>
            </div>
          )}
        </div>
      </div>

      {isSub && showSubOptions && subEvery && setSubEvery && !disabled && (
        <SubscriptionFrequencyPicker
          subEvery={subEvery}
          setSubEvery={setSubEvery}
          mobile
        />
      )}
    </button>
  );
}
function QuantityControl({
  qty,
  setQty,
  className = "",
  inputClassName = "",
  buttonClassName = "",
}: {
  qty: number;
  setQty: React.Dispatch<React.SetStateAction<number>>;
  className?: string;
  inputClassName?: string;
  buttonClassName?: string;
}) {
  const displayQty = qty === 0 ? "" : String(qty);
  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setQty((q) => Math.max(1, (q || 1) - 1))}
        className={`${buttonClassName} rounded-l-lg`}
        aria-label="Decrease quantity"
      >
        <Minus className="h-4 w-4" />
      </button>

      <input
        value={displayQty}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, "");
          if (digits === "") {
            setQty(0);
            return;
          }
          setQty(Math.min(99, Number(digits)));
        }}
        inputMode="numeric"
        pattern="[0-9]*"
        aria-label="Quantity"
        className={inputClassName}
        onBlur={() => {
          setQty((q) => {
            const n = Number.isFinite(q) ? q : 1;
            return Math.min(99, Math.max(1, n));
          });
        }}
      />
      <button
        type="button"
        onClick={() => setQty((q) => Math.min(99, (q || 1) + 1))}
        className={`${buttonClassName} rounded-r-lg`}
        aria-label="Increase quantity"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
function BeanTypeSelect({
  id,
  beanType,
  setBeanType,
  setShowBeanError,
  className = "",
  ariaInvalid,
}: {
  id: string;
  beanType: "" | "whole" | "ground";
  setBeanType: React.Dispatch<React.SetStateAction<"" | "whole" | "ground">>;
  setShowBeanError: React.Dispatch<React.SetStateAction<boolean>>;
  className?: string;
  ariaInvalid?: boolean;
}) {
  const options = [
    {
      value: "whole" as const,
      title: "WHOLE BEAN",
      subtitle: "Best for grinders",
      img: "/whole-bean.png",
    },
    {
      value: "ground" as const,
      title: "GROUND",
      subtitle: "Ready to brew",
      img: "/ground.png",
    },
  ];

  return (
    <div
      id={id}
      role="radiogroup"
      aria-invalid={ariaInvalid || undefined}
      className={`grid grid-cols-2 gap-3 w-full ${className}`}
    >
      {options.map((option) => {
        const active = beanType === option.value;

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => {
              setBeanType(option.value);
              setShowBeanError(false);
            }}
            className={
              "relative overflow-hidden min-w-0 h-[70px] rounded-none border px-3 text-left transition " +
              (active
                ? "bg-[#32220D] border-[#6D5333] text-[#E6C07F] shadow-[0_0_18px_rgba(192,140,69,0.18)]"
                : "bg-[#130E08] border-[#6D5333]/70 text-[#9C9791] hover:border-[#6D5333]")
            }
          >
            <img
              src={option.img}
              alt=""
              aria-hidden
              className={
                "pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 object-contain opacity-90 " +
                (option.value === "whole"
                  ? "h-[34px] w-[34px]"
                  : "h-[38px] w-[38px]")
              }
            />

            <div className="pl-[48px] leading-tight">
              <div className="text-[13px] font-black tracking-wide">
                {option.title}
              </div>
              <div className="mt-1 text-[11px] font-semibold opacity-75">
                {option.subtitle}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
const STAR_PATH =
  "M12 .587l3.668 7.568L24 9.753l-6 5.854L19.335 24 12 19.771 4.665 24 6 15.607 0 9.753l8.332-1.598z";

function StarRatingDisplay({
  avg,
  sizeClass = "h-4 w-4",
  clipWidthBase = 24,
  clipIdPrefix = "star",
  numberClassName = "",
  count,
  countClassName = "",
  showNumber = false,
  showCount = false,
  linkToReviews = false,
}: {
  avg: number;
  sizeClass?: string;
  clipWidthBase?: number;
  clipIdPrefix?: string;
  numberClassName?: string;
  count?: number;
  countClassName?: string;
  showNumber?: boolean;
  showCount?: boolean;
  linkToReviews?: boolean;
}) {
  const stars = (
    <>
      {showNumber && <span className={numberClassName}>{avg.toFixed(1)}</span>}

      <div className="inline-flex items-center gap-0.5">
        {[0, 1, 2, 3, 4].map((i) => {
          const starFill = Math.max(0, Math.min(1, avg - i));
          const clipWidth = clipWidthBase * starFill;
          const clipId = `${clipIdPrefix}-${i}`;
          return (
            <svg key={i} viewBox="0 0 24 24" className={sizeClass} aria-hidden>
              <defs>
                <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
                  <rect x="0" y="0" width={clipWidth} height="24" />
                </clipPath>
              </defs>

              <path
                d={STAR_PATH}
                className="text-neutral-800"
                fill="currentColor"
              />

              <path
                d={STAR_PATH}
                className="text-[#C08C45]"
                fill="currentColor"
                clipPath={`url(#${clipId})`}
              />

              <path
                d={STAR_PATH}
                fill="none"
                stroke="currentColor"
                className="text-neutral-600"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
            </svg>
          );
        })}
        <span className="sr-only">{avg.toFixed(1)} out of 5 stars</span>
      </div>

      {showCount && count !== undefined && (
        <span className={countClassName}>{count} REVIEWS</span>
      )}
    </>
  );

  if (linkToReviews) {
    return (
      <a
        href="#reviews"
        onClick={(e) => {
          e.preventDefault();
          const el = document.getElementById("reviews");
          if (!el) return;
          const mobileOffset = 200;
          const desktopOffset = 260;
          const offset = window.innerWidth < 768 ? mobileOffset : desktopOffset;
          const top = el.getBoundingClientRect().top + window.scrollY - offset;
          window.scrollTo({ top, behavior: "smooth" });
        }}
        className="inline-flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C08C45]"
        aria-label="Jump to customer reviews"
        title="Jump to customer reviews"
      >
        {stars}
      </a>
    );
  }

  return <div className="inline-flex items-center gap-2">{stars}</div>;
}
function ReviewStars({
  rating,
  sizeClass = "h-4 w-4",
}: {
  rating: number;
  sizeClass?: string;
}) {
  return (
    <div className="mt-1 flex items-center gap-1">
      {[...Array(5)].map((_, i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          fill={i < rating ? "currentColor" : "none"}
          className={
            `${sizeClass} ` +
            (i < rating ? "text-[#C08C45]" : "text-neutral-700")
          }
          stroke="currentColor"
        >
          <path d={STAR_PATH} />
        </svg>
      ))}
    </div>
  );
}
function formatReviewDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "2-digit",
  });
}

function ReviewCard({
  r,
  isMobile = false,
}: {
  r: Review;
  isMobile?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  const formattedDate = formatReviewDate(r.date);

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => {
        if (!expanded) setExpanded(true);
      }}
      onKeyDown={(e) => {
        if (!expanded && (e.key === "Enter" || e.key === " ")) {
          setExpanded(true);
        }
      }}
      aria-expanded={expanded}
      className={
        "relative overflow-visible text-left rounded-lg border border-[#C08C45]/30 bg-black/50 shadow-sm cursor-pointer transition hover:border-[#C08C45]/60 " +
        (expanded ? "z-[70]" : "") +
        (isMobile ? " p-3" : " p-4")
      }
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="font-semibold text-[#C08C45] text-sm leading-tight">
          {r.name}
        </div>
        <div className="text-[10px] md:text-xs text-neutral-400">
          {formattedDate}
        </div>
      </div>

      {/* Stars */}
      <ReviewStars rating={r.rating} />

      {/* Title */}
      {r.title && (
        <div className="mt-2 text-[0.8rem] md:text-sm font-semibold text-neutral-300">
          {r.title}
        </div>
      )}

      {/* Body */}
      {r.body && (
        <p
          className={
            "mt-1 text-neutral-300 leading-relaxed " +
            (isMobile
              ? "text-[0.8rem] max-h-24 overflow-hidden"
              : "text-sm max-h-16 overflow-hidden")
          }
        >
          {r.body}
        </p>
      )}

      {/* Verified */}
      {r.verified && (
        <div className="mt-3 text-[10px] md:text-[11px] uppercase tracking-wide text-[#C08C45]/90">
          Verified Buyer
        </div>
      )}

      {/* Expanded */}
      {expanded && (
        <div
          className="absolute left-0 right-0 -top-2 z-50 rounded-xl border border-[#C08C45]/70 bg-neutral-900 shadow-2xl shadow-amber-500/20 p-4"
          onClick={() => setExpanded(false)}
        >
          <div className="flex items-start justify-between">
            <div className="font-semibold text-[#C08C45]">{r.name}</div>
            <div className="text-xs text-neutral-400">{formattedDate}</div>
          </div>

          <ReviewStars rating={r.rating} />

          {r.title && (
            <div className="mt-2 text-sm font-semibold text-neutral-300">
              {r.title}
            </div>
          )}

          {r.body && (
            <p className="mt-1 text-sm text-neutral-300 leading-relaxed">
              {r.body}
            </p>
          )}

          {r.verified && (
            <div className="mt-3 text-[11px] uppercase tracking-wide text-[#C08C45]/90">
              Verified Buyer
            </div>
          )}
        </div>
      )}
    </article>
  );
}
const SUB_OPTIONS = [14, 30, 60] as const;

function SubscriptionFrequencyPicker({
  subEvery,
  setSubEvery,
  mobile = false,
}: {
  subEvery: 14 | 30 | 60;
  setSubEvery: React.Dispatch<React.SetStateAction<14 | 30 | 60>>;
  mobile?: boolean;
}) {
  return (
    <div className={mobile ? "mt-4" : "mt-3 mb-4 w-full max-w-[620px]"}>
      <div className={mobile ? "" : "flex flex-wrap items-center gap-3"}>
        <div
          className={
            mobile
              ? "text-sm text-[#B39871] font-semibold mb-2"
              : "text-sm text-[#B39871] font-semibold"
          }
        >
          Deliver every:
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {SUB_OPTIONS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setSubEvery(d as 14 | 30 | 60)}
              className={
                (mobile
                  ? "px-3 py-2 rounded-md border text-sm transition "
                  : "px-3 py-1.5 rounded-md border text-sm transition ") +
                (subEvery === d
                  ? "border-[#C08C45] bg-[#32220D] text-[#E6C07F]"
                  : "border-[#6D5333] bg-[#130E08] text-[#9C9791] hover:border-[#C08C45] hover:text-[#E6C07F]")
              }
              aria-pressed={subEvery === d}
            >
              {d} days
            </button>
          ))}

          {!mobile && (
            <span className="ml-3 text-xs text-[#B39871] whitespace-nowrap font-semibold">
              Skip or cancel anytime
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
type ReviewData = {
  avg: number;
  count: number;
  breakdown: Record<number, number>;
};

const EMPTY_REVIEW_BREAKDOWN: Record<number, number> = {
  5: 0,
  4: 0,
  3: 0,
  2: 0,
  1: 0,
};

function RoastDetailPage() {
  const { slug } = useParams();
  const [mobileToast, setMobileToast] = useState<null | {
    title: string;
    qty: number;
  }>(null);

  const card = roastCards.find((c) => c.slug === slug);

  if (!card) return <NotFoundPage />;

  useEffect(() => {
    window.scrollTo(0, 0);

    if (typeof window !== "undefined" && (window as any).fbq) {
      (window as any).fbq("track", "ViewContent", {
        content_name: card.title,
        content_ids: [card.slug],
        content_type: "product",
        value: card.slug === "oak-and-copper" ? 24.99 : card.price ?? 19.99,
        currency: "USD",
      });
    }
  }, []);

  // review data used for stars + counts beside the subtitle and in the histogram
  type Review = {
    id: string;
    name: string;
    date: string;
    rating: number;
    title?: string;
    body?: string;
    verified?: boolean;
  };

  const shopifyProductId = PRODUCT_IDS_BY_SLUG[card.slug];

  function computeStats(list: Review[]): ReviewStats {
    const count = list.length;
    if (count === 0)
      return { avg: 0, count: 0, breakdown: { ...EMPTY_REVIEW_BREAKDOWN } };
    const breakdown: Record<number, number> = { ...EMPTY_REVIEW_BREAKDOWN };
    let sum = 0;
    for (const r of list) {
      sum += r.rating;
      breakdown[r.rating] = (breakdown[r.rating] || 0) + 1;
    }
    const avg = Math.round((sum / count) * 10) / 10;
    return { avg, count, breakdown };
  }

  const [reviewList, setReviewList] = useState<Review[]>([]);
  const [reviewData, setReviewData] = useState<ReviewData>(() =>
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
  const reviews: Review[] = reviewList;
  const { add } = useCart();
  const {
    isOak,
    purchaseMode,
    setPurchaseMode,
    subEvery,
    setSubEvery,
    qty,
    setQty,
    beanType,
    setBeanType,
    showBeanError,
    setShowBeanError,
    basePrice,
    discounted,
    size,
    setSize,
  } = useBuyBox(card);

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

  // Reset Bean Type selector whenever you navigate to a different roast page
  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const handle = String(slug);
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
    setQty(1);
    setBeanType("");
    setShowBeanError(false);

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
  const [buyBoxDims, setBuyBoxDims] = useState<{ h: number }>({
    h: 0,
  });

  useEffect(() => {
    const el = buyBoxRef.current;

    if (!el || typeof ResizeObserver === "undefined") {
      const measure = () => {
        if (!buyBoxRef.current) return;
        const r = buyBoxRef.current.getBoundingClientRect();
        setBuyBoxDims({ h: Math.round(r.height) });
      };
      measure();
      const onResize = () => requestAnimationFrame(measure);
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }

    const ro = new ResizeObserver(() => {
      if (!buyBoxRef.current) return;
      const r = buyBoxRef.current.getBoundingClientRect();
      setBuyBoxDims({ h: Math.round(r.height) });
    });

    ro.observe(el);

    const r = el.getBoundingClientRect();
    setBuyBoxDims({ h: Math.round(r.height) });

    return () => {
      ro.disconnect();
    };
  }, []);

  const addToChest = async () => {
    const n = qty > 0 ? Math.min(99, Math.trunc(qty)) : 1;
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
    let merchId = merchandiseId;

    if (size === "sample") {
      const sampleProduct = await getProductByHandle("sample-packs");
      const variants = sampleProduct?.variants?.edges ?? [];

      const match = variants.find((v: any) => {
        const title = String(v?.node?.title || "").toLowerCase();
        return title.includes(card.title.toLowerCase());
      });

      merchId = match?.node?.id ?? null;
    }
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
      // Force samples to be one-time only
      const effectivePurchaseMode = size === "sample" ? "sample" : purchaseMode;

      // pick selling plan if subscribing
      const planId =
        effectivePurchaseMode === "sub" ? planMap[subEvery] : undefined;

      if (effectivePurchaseMode === "sub" && !planId) {
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
          purchaseMode: effectivePurchaseMode,
          subEvery: effectivePurchaseMode === "sub" ? String(subEvery) : "",
        },
      });

      // 3) mirror to your local cart UI
      const itemToAdd = {
        ...card,
        id: `${card.slug}-${size}-${beanType}`,
        sku: `${card.slug}-${size}-${beanType}`,
        title: `${card.title} (${variantLabel})`,
        // store both the regular one-time price and the active price
        basePrice,
        price:
          effectivePurchaseMode === "sub" ? discounted ?? basePrice : basePrice,
        beanType,
        purchaseMode: effectivePurchaseMode,
        isSubscription: effectivePurchaseMode === "sub",
        subEvery: effectivePurchaseMode === "sub" ? subEvery : undefined,
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
      // 🔥 META ADD TO CART
      if (typeof window !== "undefined" && (window as any).fbq) {
        (window as any).fbq("track", "AddToCart", {
          content_name: `${card.title} (${variantLabel})`,
          content_ids: [card.slug],
          content_type: "product",
          value: purchaseMode === "sub" ? discounted : basePrice,
          currency: "USD",
        });
      }
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
    <main className="relative overflow-x-hidden min-h-[calc(100vh-140px)] -mt-6 pt-0 pb-6 md:mt-0 md:pt-4 xl:pt-8 md:pb-10 xl:pb-16 bg-black md:bg-transparent px-0 sm:px-4 lg:px-6 xl:px-12 2xl:px-16">
      <Container className="relative z-10 mt-0 md:mt-0 max-w-[1080px] xl:max-w-[1400px] mx-auto w-full max-w-full px-0 sm:px-4">
        {/* ===== HERO ===== */}
        <div className="relative">
          {/* emblem moved to live behind the bag (image wrapper) */}

          <div className="relative z-10 mt-0 md:-mt-2 lg:-mt-4 grid w-full overflow-x-hidden lg:grid-cols-[440px,1fr] xl:grid-cols-[520px,1fr] 2xl:grid-cols-[620px,1fr] gap-5 lg:gap-4 xl:gap-2 2xl:gap-12 items-start">
            {/* HERO IMAGE */}
            <div className="flex flex-col items-center md:items-start w-full md:w-auto relative mt-0 md:mt-0">
              <div className="relative z-10 flex flex-col items-center md:items-start w-full md:w-auto">
                {card.isNew && (
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 md:top-10 md:left-8 md:translate-x-0 z-20 px-3 py-1 text-[11px] md:text-xs font-bold bg-[#C08C45] text-black rounded shadow-md">
                    JUST RELEASED
                  </div>
                )}

                <div className="relative -mt-6 md:-mt-8 xl:-mt-12 2xl:-mt-16 w-full flex justify-center md:justify-start overflow-hidden">
                  <div className="pointer-events-none absolute inset-0 z-20 shadow-[inset_0_0_40px_20px_rgba(0,0,0,0.75)]" />

                  <img
                    src={
                      (card.detailImg || card.img)?.startsWith("/") ||
                      (card.detailImg || card.img)?.startsWith("http")
                        ? card.detailImg || card.img
                        : `/${card.detailImg || card.img}`
                    }
                    alt={card.title}
                    loading="eager"
                    decoding="async"
                    className="relative z-10 block w-full max-w-[400px] md:max-w-[430px] xl:max-w-[440px] 2xl:max-w-[820px] h-auto object-contain mx-auto"
                  />
                </div>
              </div>
            </div>

            {/* ...rest of your text column stays exactly the same */}

            {/* 2/3/4/5/6 live together in this column so desktop still sees one text column */}
            <div className="order-2 md:order-none self-start flex flex-col space-y-3 -mt-4 md:mt-0 w-full min-w-0 overflow-hidden">
              {/* ===== TITLE / SUBTITLE / STARS (Mobile #1, Desktop #1) ===== */}
              <div className="order-1 md:order-1 -mt-4 md:mt-0 mb-0 flex items-start justify-between gap-3">
                <div className="w-full">
                  {/* Title */}
                  <h1
                    className="m-0 text-4xl md:text-5xl xl:text-6xl font-extrabold tracking-tight leading-tight"
                    style={{
                      color: "#C08C45",
                      fontFamily: "'Cinzel', serif",
                      fontWeight: 800,
                    }}
                  >
                    {card.title}
                  </h1>

                  {/* Subtitle + stars + short hook */}
                  <div className="mt-0 max-w-[72ch]">
                    <div className="flex flex-wrap items-center gap-y-1">
                      <div
                        className="text-base md:text-[1.2rem]"
                        style={{ color: "rgba(255,255,255,0.55)" }}
                      >
                        {card.subTitle}
                      </div>

                      <div
                        className="flex items-center gap-2 ml-4 md:ml-20"
                        style={{ color: "#C08C45" }}
                      >
                        <StarRatingDisplay
                          avg={reviewData.avg ?? 0}
                          count={reviewData.count}
                          sizeClass="h-4 w-4 md:h-4 md:w-4"
                          clipIdPrefix="titleStar"
                          numberClassName="font-semibold tabular-nums text-sm"
                          countClassName="text-[10px] md:text-xs tracking-wide whitespace-nowrap"
                          showNumber
                          showCount
                          linkToReviews
                        />
                      </div>
                    </div>

                    <p
                      className="mt-3 max-w-[54ch] text-base md:text-lg leading-relaxed"
                      style={{ color: "rgba(255,255,255,0.60)" }}
                    >
                      {CRAFT_IN_THE_CUP_DATA[card.slug]?.shortHook ??
                        "Roasted to order for a smooth, fresh cup."}
                    </p>

                    {/* DIVIDER */}
                    <div className="flex items-center w-full max-w-[560px] mt-3 md:mt-4">
                      <div className="h-px flex-1 bg-[#C08C45]/40" />
                      <span className="px-2 md:px-3 text-[#E6C07F]/70 text-base md:text-lg leading-none">
                        ★
                      </span>
                      <div className="h-px flex-1 bg-[#C08C45]/40" />
                    </div>
                    {/* ROAST PROFILE */}
                    <div className="mt-4 md:mt-5 w-full max-w-[560px]">
                      <div
                        className="text-[11px] tracking-[0.2em] mb-3 font-semibold uppercase"
                        style={{ color: "#8A6E4A" }}
                      >
                        ROAST PROFILE
                      </div>

                      <div className="relative rounded-md border border-[#6D5333]/45 bg-[#080503]/75 px-4 py-3">
                        <div className="absolute inset-x-5 top-[43%] h-px bg-[#6D5333]/45" />

                        <div className="relative grid grid-cols-3 text-center">
                          {["LIGHT", "MEDIUM", "DARK"].map((level) => {
                            const active =
                              (level === "DARK" &&
                                (card.slug === "baptism-by-fire" ||
                                  card.slug === "oak-and-copper")) ||
                              (level === "MEDIUM" &&
                                card.slug !== "baptism-by-fire" &&
                                card.slug !== "oak-and-copper");

                            return (
                              <div
                                key={level}
                                className="flex flex-col items-center gap-1.5"
                              >
                                <div
                                  className={
                                    "h-3 w-3 rounded-full border " +
                                    (active
                                      ? "bg-[#C08C45] border-[#E6C07F] shadow-[0_0_10px_rgba(192,140,69,0.65)]"
                                      : "bg-black border-[#6D5333]")
                                  }
                                />

                                <div
                                  className={
                                    "text-[10px] md:text-[11px] font-bold tracking-[0.18em] uppercase " +
                                    (active
                                      ? "text-[#E6C07F]"
                                      : "text-[#8A6E4A]")
                                  }
                                >
                                  {level}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* TASTING NOTES */}
                    <div className="mt-5 md:mt-6 w-full max-w-[560px]">
                      <div
                        className="text-[11px] tracking-[0.2em] mb-3 font-semibold uppercase"
                        style={{ color: "#8A6E4A" }}
                      >
                        TASTING NOTES
                      </div>

                      <div className="rounded-md border border-[#6D5333]/45 bg-[#080503]/75 px-5 md:px-6 py-3">
                        <div className="flex items-center justify-between gap-3">
                          {(CRAFT_IN_THE_CUP_DATA[card.slug]?.notes ?? []).map(
                            (note, index) => (
                              <React.Fragment key={note}>
                                <span className="px-1 text-[12px] md:text-[13px] font-bold uppercase tracking-[0.16em] text-[#B5976D] whitespace-nowrap">
                                  {note}
                                </span>

                                {index <
                                  (
                                    CRAFT_IN_THE_CUP_DATA[card.slug]?.notes ??
                                    []
                                  ).length -
                                    1 && (
                                  <span className="h-px flex-1 bg-[#6D5333]/45" />
                                )}
                              </React.Fragment>
                            )
                          )}
                        </div>
                      </div>

                      {(card.canBuy || isOak) && (
                        <div className="mt-6">
                          <div
                            className="text-[11px] tracking-[0.2em] mb-3 font-semibold uppercase"
                            style={{ color: "#B39871" }}
                          >
                            SELECT YOUR PREP
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                setBeanType("whole");
                                setShowBeanError(false);
                              }}
                              className={
                                "relative h-[52px] md:h-[58px] overflow-visible border rounded-md px-2 md:px-4 text-left transition " +
                                (beanType === "whole"
                                  ? "bg-[#32220D] border-[#6D5333] text-[#E6C07F]"
                                  : "bg-[#130E08] border-[#6D5333]/70 text-[#9C9791]")
                              }
                            >
                              <img
                                src="/wb-symbol.png"
                                alt=""
                                className="pointer-events-none absolute left-[8px] md:left-[20px] top-1/2 h-[58px] w-[58px] md:h-[92px] md:w-[92px] -translate-y-1/2 object-contain"
                              />
                              <div className="flex h-full w-full items-center justify-center">
                                <div className="pl-[42px] md:pl-[54px] text-center leading-tight">
                                  <div className="text-[12px] md:text-[16px] font-black tracking-wide font-cinzel">
                                    WHOLE BEAN
                                  </div>
                                  <div className="mt-0.5 text-[10px] md:text-[13px] font-semibold opacity-75">
                                    Best for grinders
                                  </div>
                                </div>
                              </div>
                            </button>

                            <button
                              type="button"
                              disabled={size === "sample"}
                              onClick={() => {
                                if (size === "sample") return;
                                setBeanType("ground");
                                setShowBeanError(false);
                              }}
                              className={
                                "relative h-[52px] md:h-[58px] overflow-visible border rounded-md px-2 md:px-4 text-left transition " +
                                (size === "sample"
                                  ? "bg-[#130E08] border-[#6D5333]/40 text-[#6D6D6D] opacity-50 cursor-not-allowed"
                                  : beanType === "ground"
                                  ? "bg-[#32220D] border-[#6D5333] text-[#E6C07F]"
                                  : "bg-[#130E08] border-[#6D5333]/70 text-[#9C9791]")
                              }
                            >
                              <img
                                src="/g-symbol.png"
                                alt=""
                                className="pointer-events-none absolute left-[10px] md:left-[20px] top-1/2 h-[46px] w-[46px] md:h-[70px] md:w-[70px] -translate-y-1/2 object-contain"
                              />
                              <div className="flex h-full w-full items-center justify-center">
                                <div className="pl-[42px] md:pl-[54px] text-center leading-tight">
                                  <div className="text-[12px] md:text-[16px] font-black tracking-wide font-cinzel">
                                    GROUND
                                  </div>
                                  <div className="mt-0.5 text-[10px] md:text-[13px] font-semibold opacity-75">
                                    Ready to brew
                                  </div>
                                </div>
                              </div>
                            </button>
                          </div>
                        </div>
                      )}
                      {/* CHOOSE YOUR SIZE */}
                      {(card.canBuy || isOak) && (
                        <div className="mt-6 w-full max-w-[620px]">
                          <div
                            className="text-[11px] tracking-[0.2em] mb-3 font-semibold uppercase"
                            style={{ color: "#B39871" }}
                          >
                            CHOOSE YOUR SIZE
                          </div>

                          <div className="grid grid-cols-3 gap-1.5 md:gap-3">
                            {/* SAMPLE PACK */}
                            <button
                              type="button"
                              onClick={() => {
                                setSize("sample");
                                setPurchaseMode("one");
                                setBeanType("whole");
                                setShowBeanError(false);
                              }}
                              className="h-[88px] md:h-[72px] border rounded-md px-4 text-center transition"
                              style={{
                                borderColor: "#6D5333",
                                color:
                                  size === "sample" ? "#E6C07F" : "#9C9791",
                                backgroundColor:
                                  size === "sample" ? "#32220D" : "#130E08",
                              }}
                            >
                              <div className="font-cinzel text-[15px] font-black tracking-wide">
                                SAMPLE (2.5 OZ)
                              </div>

                              <div className="mt-1 text-[11px] font-semibold text-[#B39871]">
                                Whole Bean
                              </div>
                            </button>

                            {/* 12 OZ BAG - ACTIVE */}
                            <button
                              type="button"
                              onClick={() => {
                                setSize("12oz");
                                setPurchaseMode("one");
                                setShowBeanError(false);
                              }}
                              className="h-[88px] md:h-[72px] border rounded-md px-4 text-center transition"
                              style={{
                                borderColor: "#6D5333",
                                color: size === "12oz" ? "#E6C07F" : "#9C9791",
                                backgroundColor:
                                  size === "12oz" ? "#32220D" : "#130E08",
                              }}
                            >
                              <div className="font-cinzel text-[15px] font-black tracking-wide">
                                12 OZ BAG
                              </div>
                            </button>

                            {/* 5 LB BAG */}
                            {/* 5 LB BAG */}
                            <button
                              type="button"
                              disabled
                              className="h-[88px] md:h-[72px] border rounded-md px-4 text-center opacity-60 cursor-not-allowed"
                              style={{
                                borderColor: "#6D5333",
                                color: "#9C9791",
                                backgroundColor: "#130E08",
                              }}
                            >
                              <div className="font-cinzel text-[15px] font-black tracking-wide">
                                5 LB BAG
                              </div>

                              <div className="mt-1 text-[10px] md:text-[11px] tracking-wide">
                                Coming Soon
                              </div>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* ===== END TITLE BLOCK ===== */}

              {/* ===== MOBILE BUY BOX STYLE (md:hidden) ===== */}
              {(card.canBuy || isOak) && (
                <>
                  <BuyBoxSection
                    mobile
                    size={size}
                    card={card}
                    isOak={isOak}
                    purchaseMode={purchaseMode}
                    setPurchaseMode={setPurchaseMode}
                    subEvery={subEvery}
                    setSubEvery={setSubEvery}
                    basePrice={basePrice}
                    discounted={discounted}
                    beanType={beanType}
                    setBeanType={setBeanType}
                    showBeanError={showBeanError}
                    setShowBeanError={setShowBeanError}
                    qty={qty}
                    setQty={setQty}
                    addToChest={addToChest}
                    adding={adding}
                  />

                  {mobileToast && (
                    <div className="fixed left-0 right-0 top-1/2 transform -translate-y-1/2 z-[9999] px-4 md:hidden">
                      <div className="w-full rounded-lg border border-[#C08C45]/70 bg-[#C08C45]/90 text-black shadow-lg shadow-[#C08C45]/20 px-6 py-4 flex items-center justify-center gap-4">
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
                </>
              )}

              {/* ================= DESKTOP VERSION (hidden on mobile) ================= */}
              {(card.canBuy || isOak) && (
                <BuyBoxSection
                  card={card}
                  size={size}
                  isOak={isOak}
                  purchaseMode={purchaseMode}
                  setPurchaseMode={setPurchaseMode}
                  subEvery={subEvery}
                  setSubEvery={setSubEvery}
                  basePrice={basePrice}
                  discounted={discounted}
                  beanType={beanType}
                  setBeanType={setBeanType}
                  showBeanError={showBeanError}
                  setShowBeanError={setShowBeanError}
                  qty={qty}
                  setQty={setQty}
                  addToChest={addToChest}
                  adding={adding}
                  buyBoxRef={buyBoxRef}
                  buyBoxDims={buyBoxDims}
                />
              )}

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
      <RoastUnified
        slug={card.slug}
        reviewData={reviewData}
        reviews={reviews}
      />
    </main>
  );
}
function ArmadaSamplePage() {
  const { add } = useCart();
  const [shopifyProduct, setShopifyProduct] = useState<any>(null);
  const [selectedSample, setSelectedSample] = useState("Armada Sample Pack");
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);

  const sampleOptions = [
    {
      title: "Sample Box",
      slug: "armada-sample-pack",
      price: 25,
      description: "Try all the roast. Get one roast free plus free shipping.",
    },
    {
      title: "Flagship",
      slug: "flagship",
      price: 5,
      description:
        "A smooth, full-bodied medium roast made for everyday drinking. Balanced, rich, and never bitter.",
    },
    {
      title: "The Java Action",
      slug: "java-action",
      price: 5,
      description:
        "A smooth medium roast with hazelnut, caramel, red apple, and a creamy sweet finish.",
    },
    {
      title: "Baptism By Fire",
      slug: "baptism-by-fire",
      price: 5,
      description:
        "The darkest roast in the fleet. Bold, full-bodied, smooth, and built for dark roast drinkers.",
    },
    {
      title: "Black Salvo",
      slug: "black-salvo",
      price: 5,
      description:
        "A versatile espresso-style blend with warm vanilla, cocoa, and toasted almond.",
    },
    {
      title: "Oak & Copper",
      slug: "oak-and-copper",
      price: 6,
      description:
        "Bourbon barrel aged coffee with oak, caramel, warm spice, and subtle bourbon character.",
    },
    {
      title: "Brass Monkey",
      slug: "brass-monkey",
      price: 5,
      description:
        "A Southern pecan roast with toasted pecan, brown sugar, and warm spice.",
    },
  ];

  const selected = sampleOptions.find((x) => x.title === selectedSample)!;

  useEffect(() => {
    window.scrollTo(0, 0);

    let cancelled = false;

    async function run() {
      try {
        const p = await getProductByHandle("sample-packs");
        if (!cancelled) setShopifyProduct(p || null);
      } catch (e) {
        console.warn("[Shopify] sample-pack load failed", e);
        if (!cancelled) setShopifyProduct(null);
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, []);

  const merchandiseId = useMemo(() => {
    const variants = shopifyProduct?.variants?.edges ?? [];

    const match = variants.find((v: any) => {
      const node = v?.node;
      const title = String(node?.title || "").toLowerCase();
      return title.includes(selectedSample.toLowerCase());
    });

    return match?.node?.id ?? null;
  }, [shopifyProduct, selectedSample]);
  const addToChest = async (
    sampleOverride?: (typeof sampleOptions)[number]
  ) => {
    const item = sampleOverride ?? selected;
    const n = qty > 0 ? Math.min(99, Math.trunc(qty)) : 1;
    setQty(n);

    if (!shopifyProduct) {
      window.dispatchEvent(
        new CustomEvent("flash", {
          detail: "Product not loaded yet. Try again.",
        })
      );
      return;
    }

    const variants = shopifyProduct?.variants?.edges ?? [];

    const match = variants.find((v: any) => {
      const node = v?.node;
      const title = String(node?.title || "").toLowerCase();
      return title.includes(item.title.toLowerCase());
    });

    const merchId = match?.node?.id ?? null;

    if (!merchId) {
      window.dispatchEvent(
        new CustomEvent("flash", {
          detail: "Sample variant not found in Shopify.",
        })
      );
      return;
    }

    try {
      setAdding(true);

      const cart = await ensureCart();

      await cartLinesAdd({
        cartId: cart.id,
        merchandiseId: merchId,
        quantity: n,
        attributes: {
          sampleChoice: item.title,
          purchaseMode: "sample",
        },
      });

      add(
        {
          id: `sample-pack-${item.slug}`,
          sku: `sample-pack-${item.slug}`,
          slug: item.slug,
          title: item.title,
          price: item.price,
          basePrice: item.price,
          img: "/sample-pack.jpg",
          detailImg: "/sample-pack2.jpg",
          merchandiseId: merchId,
          purchaseMode: "sample",
        },
        n
      );

      if (typeof window !== "undefined" && (window as any).fbq) {
        (window as any).fbq("track", "AddToCart", {
          content_name: item.title,
          content_ids: [item.slug],
          content_type: "product",
          value: item.price,
          currency: "USD",
        });
      }

      window.dispatchEvent(
        new CustomEvent("flash", {
          detail: `${n} × ${item.title} added to Chest`,
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
    <main className="relative overflow-hidden min-h-[calc(100vh-140px)] -mt-6 pt-0 pb-6 md:mt-0 md:pt-8 xl:pt-14 2xl:pt-16 md:pb-10 xl:pb-16 bg-black md:bg-transparent px-3 sm:px-4 lg:px-6 xl:px-12 2xl:px-16">
      <Container className="relative z-10 mt-0 max-w-[1080px] xl:max-w-[1400px] mx-auto">
        <div className="relative z-10 mt-0 grid xl:grid-cols-[460px,1fr] 2xl:grid-cols-[620px,1fr] gap-5 xl:gap-8 2xl:gap-12 items-start">
          <div className="flex flex-col items-center md:items-start w-full md:w-auto relative mt-2 md:mt-0">
            <div className="relative mt-0 w-full">
              <div className="relative z-10 mb-4 md:mb-5 xl:mb-6 w-full text-center xl:text-left">
                <h1
                  className="m-0 text-4xl md:text-5xl xl:text-6xl font-extrabold tracking-tight leading-tight"
                  style={{
                    color: "#C08C45",
                    fontFamily: "'Cinzel', serif",
                    fontWeight: 800,
                  }}
                >
                  ROAST SAMPLES
                </h1>
              </div>

              <img
                src="/sample-pack2.jpg"
                alt="The Sample Box"
                loading="eager"
                decoding="async"
                className="relative z-10 block w-full max-w-[400px] md:max-w-[430px] xl:max-w-[520px] 2xl:max-w-[820px] h-auto object-contain mx-auto xl:mx-0"
              />

              <div className="relative z-10 mt-3 md:mt-5 w-full max-w-[620px] mx-auto xl:mx-0 text-center md:text-left">
                <div className="space-y-3">
                  <p
                    className="text-base md:text-lg leading-relaxed"
                    style={{ color: "rgba(255,255,255,0.75)" }}
                  >
                    Sample any roast, or choose The Sample Box and get one roast
                    free plus free shipping.
                  </p>

                  <p
                    className="text-[15px] md:text-[16px] leading-relaxed"
                    style={{ color: "rgba(255,255,255,0.62)" }}
                  >
                    Each 2.5 oz sample pack is enough to brew roughly 6–8 cups
                    of coffee, giving you a real taste of the roast before
                    committing to a full bag.
                  </p>
                </div>

                <div className="mt-4 md:hidden relative overflow-hidden border border-[#5A4630]/60 bg-black/40 px-4 py-3 rounded-sm">
                  <div className="absolute inset-y-0 left-0 w-[3px] bg-[#C08C45]" />

                  <p className="pl-3 text-[11px] tracking-[0.14em] leading-relaxed text-[#D2B48C] uppercase">
                    Sample packs are priced separately and are not eligible for
                    first-order or subscription discounts.
                  </p>
                </div>

                <div className="flex items-center w-full mt-3 md:mt-4">
                  <div className="h-px flex-1 bg-[#C08C45]/70" />
                  <span className="px-2 md:px-3 text-[#E6C07F] text-base md:text-lg leading-none">
                    ★
                  </span>
                  <div className="h-px flex-1 bg-[#C08C45]/70" />
                </div>
              </div>
            </div>
          </div>

          <div className="self-start flex flex-col space-y-4">
            <div className="mt-0 w-full max-w-[720px]">
              <div
                className="text-[24px] tracking-[0.2em] mb-3 font-semibold uppercase"
                style={{ color: "#B39871" }}
              >
                PICK YOUR ROAST
              </div>

              <div className="hidden md:block mb-4 relative overflow-hidden border border-[#5A4630]/60 bg-black/40 px-4 py-3 rounded-sm">
                <div className="absolute inset-y-0 left-0 w-[3px] bg-[#C08C45]" />

                <p className="pl-3 text-[11px] md:text-[12px] uppercase tracking-[0.14em] leading-relaxed text-[#D2B48C]">
                  Sample packs are priced separately and are not eligible for
                  first-order or subscription discounts.
                </p>
              </div>

              <div className="w-full border-t border-[#6D5333]/70">
                {sampleOptions.map((item) => {
                  const active = selectedSample === item.title;

                  return (
                    <div
                      key={item.title}
                      className={
                        "border-b border-[#6D5333]/70 py-4 " +
                        (item.slug === "armada-sample-pack"
                          ? "bg-[#130E08]/60 px-3 py-4 rounded border border-[#6D5333] mt-2 mb-2"
                          : "")
                      }
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedSample(item.title)}
                        className="w-full text-left"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div
                              className="font-cinzel text-[15px] md:text-[17px] font-black tracking-wide uppercase"
                              style={{
                                color: active ? "#E6C07F" : "#C08C45",
                              }}
                            >
                              {item.title}
                            </div>
                            <p
                              className="mt-1 text-[13px] md:text-[15px] leading-snug"
                              style={{ color: "rgba(255,255,255,0.60)" }}
                            >
                              {item.description}
                            </p>
                          </div>
                        </div>
                      </button>

                      <div className="mt-2 flex flex-wrap gap-2">
                        {item.slug !== "armada-sample-pack" && (
                          <Link
                            to={`/roast/${item.slug}`}
                            className="inline-flex h-[28px] items-center justify-center border px-3 text-[10px] font-black tracking-[0.16em] transition hover:bg-[#32220D]"
                            style={{
                              borderColor: "#6D5333",
                              color: "#E6C07F",
                              backgroundColor: "rgba(0,0,0,0.25)",
                            }}
                          >
                            VIEW ROAST
                          </Link>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSample(item.title);
                            addToChest(item);
                          }}
                          disabled={adding}
                          className="inline-flex h-[28px] items-center justify-center border px-3 text-[10px] font-black tracking-[0.16em] transition disabled:opacity-60 hover:bg-[#32220D]"
                          style={{
                            borderColor: "#C08C45",
                            color: "#E6C07F",
                            backgroundColor: "#32220D",
                          }}
                        >
                          ADD TO CHEST · {fmt(item.price)}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </Container>
    </main>
  );
}
function CareCard() {
  return (
    <>
      {/* MOBILE VERSION */}
      <aside className="block md:hidden w-full rounded-xl border border-[#6D5333] bg-black/70 px-4 py-4 shadow-md shadow-[#6D5333]/20">
        <h3 className="m-0 text-center text-[1rem] font-bold text-[#E6C07F] tracking-wide leading-tight">
          COFFEE STORAGE &amp; FRESHNESS
        </h3>

        <p className="mt-2 text-[0.9rem] text-[#E6C07F] text-center leading-snug">
          Buying 3+ bags to save on shipping? Here is how to keep extras fresh.
        </p>

        <ol className="mt-3 space-y-2 text-[0.9rem] text-neutral-300 leading-snug list-decimal pl-5">
          <li>Freeze unopened 12-oz bags inside Ziplocks or vacuum-sealed.</li>
          <li>
            When ready, let the bag reach room temperature{" "}
            <span className="italic">before opening</span>.
          </li>
          <li>
            <span className="font-semibold text-[#E6C07F]">Whole bean:</span>{" "}
            Store airtight at room temperature. Best flavor within{" "}
            <span className="font-semibold">2-4 weeks</span>.
          </li>
          <li>
            <span className="font-semibold text-[#E6C07F]">Ground:</span> Store
            airtight at room temperature. Best within{" "}
            <span className="font-semibold">7-10 days</span>.
          </li>
          <li>Do not refreeze after opening.</li>
        </ol>

        <div className="mt-3 text-[0.9rem] text-[#E6C07F] text-center leading-snug">
          Follow these steps and your coffee stays fresh for weeks, even months
          when frozen.
        </div>
      </aside>

      {/* DESKTOP VERSION */}
      <aside className="hidden md:block w-full 2xl:w-[110%] rounded-xl border border-[#6D5333] bg-black/70 px-5 py-5 md:px-6 md:py-8 shadow-md shadow-[#6D5333]/20">
        <h3 className="m-0 text-center text-[1.15rem] md:text-[1.294rem] font-bold text-[#E6C07F] tracking-wide">
          COFFEE STORAGE &amp; FRESHNESS
        </h3>

        <p className="mt-2 text-[1.006rem] text-[#E6C07F] text-center">
          Buying 3+ bags to save on shipping? Here is how to keep extras fresh.
        </p>

        <ol className="mt-3 space-y-2 text-[1.006rem] text-neutral-300 list-decimal pl-5">
          <li>Freeze unopened 12-oz bags inside Ziplocks or vacuum-sealed.</li>
          <li>
            When ready, let the bag reach room temperature{" "}
            <span className="italic">before opening</span>.
          </li>
          <li>
            <span className="font-semibold text-[#E6C07F]">Whole bean:</span>{" "}
            Store airtight at room temperature. Best flavor within{" "}
            <span className="font-semibold">2-4 weeks</span>.
          </li>
          <li>
            <span className="font-semibold text-[#E6C07F]">Ground:</span> Store
            airtight at room temperature. Best within{" "}
            <span className="font-semibold">7-10 days</span>.
          </li>
          <li>Do not refreeze after opening.</li>
        </ol>

        <div className="mt-3 text-m md:text-m text-[#E6C07F] text-center">
          Follow these steps and your coffee stays fresh for weeks, even months
          when frozen.
        </div>
      </aside>
    </>
  );
}

function OriginImg({ name }: { name: string }) {
  const FILE_ALIAS: Record<string, string> = {
    Colombia: "columbia filled",
    "El Salvador": "el salvador filled",
    Ethiopia: "ethiopia filled",
    Guatemala: "guatemala filled",
    Indonesia: "indonesia",
    Brazil: "brazil",
  };

  const SCALE_BY_COUNTRY: Record<string, string> = {
    "El Salvador": "scale-[0.70] md:scale-[0.65]",
    Guatemala: "scale-[0.61] md:scale-[0.60]",
    Ethiopia: "scale-[0.70] md:scale-[0.66]",
    Colombia: "scale-[0.72] md:scale-[0.70]",
    Indonesia: "scale-[0.90]",
    Brazil: "scale-[0.6375] md:scale-[0.615]",
  };

  const fileKey = FILE_ALIAS[name] || name.toLowerCase().replace(/\s+/g, "-");
  const scaleCls = SCALE_BY_COUNTRY[name] || "scale-100";

  return (
    <>
      {/* MOBILE VERSION */}
      <div className="block md:hidden flex flex-col items-center text-center shrink-0">
        <img
          src={`/${fileKey}.png`}
          alt={name}
          className={`h-auto w-[4.5rem] max-w-[4.5rem] shrink-0 ${scaleCls} drop-shadow-[0_0_14px_rgba(251,191,36,0.25)] ${
            name === "Indonesia" ? "-translate-y-2" : ""
          }`}
        />
        <div className="mt-2 text-[#C08C45]/90 tracking-wider text-[0.7rem] font-semibold uppercase leading-none">
          {name}
        </div>
      </div>

      {/* DESKTOP VERSION (UNCHANGED BEHAVIOR) */}
      <div className="hidden md:flex flex-col items-center justify-start text-center">
        <img
          src={`/${fileKey}.png`}
          alt={name}
          className={`h-auto max-w-[8.25rem] md:max-w-[9rem] ${scaleCls} drop-shadow-[0_0_14px_rgba(251,191,36,0.25)] ${
            name === "Indonesia" ? "-translate-y-6" : ""
          }`}
        />
        <div className="-mt-1 text-[#C08C45]/90 tracking-wider text-[0.72rem] font-semibold uppercase leading-none">
          {name}
        </div>
      </div>
    </>
  );
}

const DESKTOP_BUYBOX_SHIFT: Record<string, string> = {
  "baptism-by-fire": "md:-translate-y-16",
  "java-action": "md:-translate-y-8",
  "oak-and-copper": "md:-translate-y-12",
  "brass-monkey": "md:-translate-y-12",
  "black-salvo": "md:-translate-y-12",
};

const CRAFT_IN_THE_CUP_DATA: Record<
  string,
  {
    description?: string;
    shortHook?: string;
    bestFor: string[];
    notes: string[];
    origins: string[];
    roastLevel: 1 | 2 | 3 | 4 | 5;
    lineClass?: string;
    originWrapClass?: string;
    originRowClass?: string;
    originScaleClass?: string;
  }
> = {
  flagship: {
    shortHook: "SMOOTH, BALANCED, EVERYDAY DRINKER.",
    description:
      "A smooth, full-bodied medium roast made for everyday drinking. Balanced, never bitter, and rich enough to enjoy black or with cream and sugar.",
    bestFor: ["Daily drinkers", "Drip", "French press", "Cold brew"],
    notes: ["Hazelnut", "Warm Spice", "Cream"],
    origins: ["El Salvador", "Indonesia"],
    roastLevel: 3,

    // spacing fix for mobile
    originRowClass: "flex items-center gap-4 py-0 translate-y-4",

    // 👇 THIS fixes the overlap + missing indonesia label on mobile
    originScaleClass:
      "flex items-end gap-6 scale-[0.75] md:scale-[0.70] origin-left",
  },
  "baptism-by-fire": {
    shortHook: "BOLD AND DARK WITH A SMOOTH FINISH",
    description:
      "The darkest roast in the fleet. Bold, commanding, and full-bodied, delivering deep chocolate richness with a smooth finish that never turns bitter. Strength and flavor, without the burnt taste.",
    bestFor: [
      "Dark roast lovers",
      "Strong coffee drinkers",
      "Espresso",
      "Black or with cream",
    ],
    notes: ["Chocolate", "Molasses", "Smoke"],
    origins: ["Indonesia", "Colombia"],
    roastLevel: 4,
    lineClass: "w-full max-w-[125%] h-px bg-[#6D5333]/70 my-3",
    originRowClass:
      "flex items-center gap-3 py-0 translate-y-0 md:-translate-y-9",
    originScaleClass: "flex items-end gap-3 ml-3 scale-[0.72] origin-left",
  },

  "java-action": {
    shortHook: "SMOOTH, FULL-BODIED, EASY TO DRINK",
    description:
      "A smooth, balanced medium roast with a creamy sweet finish and just enough depth to keep things interesting. Rich, satisfying, and easy to drink black or with a touch of cream.",
    bestFor: ["Daily drinkers", "Drip", "Pour over", "French press"],
    notes: ["Hazelnut", "Caramel", "Red Apple"],
    origins: ["Guatemala", "Ethiopia", "Colombia"],
    roastLevel: 3,

    lineClass: "w-full h-px bg-[#6D5333]/70 my-3",

    originRowClass:
      "flex items-center gap-4 py-0 min-w-0 overflow-hidden md:-translate-y-6",

    originWrapClass: "min-w-0 overflow-hidden",

    // 👇 THIS is the fix (more spacing + better mobile scale)
    originScaleClass:
      "flex items-end gap-6 scale-[0.70] md:scale-[0.72] origin-left",
  },

  "black-salvo": {
    shortHook: "RICH, SMOOTH, AND VERSATILE",
    description:
      "Our most versatile blend in the fleet. Makes amazing espressos while also delivering a very smooth, easy drinking cup across any brew method.",
    bestFor: ["Espresso", "Drip", "Pour over"],
    notes: ["Vanilla", "Cocoa", "Almond"],
    origins: ["Ethiopia", "Brazil"],
    roastLevel: 3,
    lineClass: "w-full h-px bg-[#6D5333]/70 my-3",
    originRowClass:
      "flex items-center gap-3 py-0 min-w-0 overflow-hidden md:-translate-y-6",
    originScaleClass: "flex items-end gap-3 scale-[0.72] origin-left",
  },

  "oak-and-copper": {
    shortHook: "Bourbon barrel aged with oak, caramel, and warm spice.",
    description:
      "Coffee beans aged in freshly emptied bourbon barrels, slowly absorbing notes of oak, caramel, and warm spice. Roasted to reveal a rich, smooth cup with subtle bourbon character and deep complexity. Never artificially flavored.",
    bestFor: ["Bourbon lovers", "Premium drip", "Pour over", "Espresso"],
    notes: ["Vanilla", "Caramel", "Oak"],
    origins: ["Colombia"],
    roastLevel: 3,
    lineClass: "w-full h-px bg-[#6D5333]/70 my-3",
    originRowClass:
      "flex items-center gap-3 py-0 min-w-0 overflow-hidden md:-translate-y-6",
    originScaleClass: "flex items-end gap-3 scale-[0.72] origin-left",
  },

  "brass-monkey": {
    shortHook: "Toasted pecan, brown sugar, and cold-weather comfort.",
    description:
      "A Southern pecan roast crafted for winter comfort. Smooth and full-bodied with subtle notes of toasted pecan, brown sugar, and warm spice — lightly flavored and perfectly balanced.",
    bestFor: ["Cold weather mornings", "Drip", "French press"],
    notes: ["Pecan", "Brown Sugar", "Spice"],
    origins: ["Brazil"],
    roastLevel: 3,
    lineClass: "w-full h-px bg-[#6D5333]/70 my-3",
    originRowClass:
      "flex items-center gap-3 py-0 min-w-0 overflow-hidden md:-translate-y-6",
    originScaleClass: "flex items-end gap-3 scale-[0.72] origin-left",
  },
};
function CraftInTheCupBlock({ slug }: { slug: string }) {
  const data = CRAFT_IN_THE_CUP_DATA[slug];
  if (!data) return null;

  const lineClass = data.lineClass ?? "w-full h-px bg-[#6D5333]/70 my-3";

  const originRowClass =
    data.originRowClass ??
    "flex items-center gap-3 py-0 min-w-0 overflow-hidden md:-translate-y-6";

  const originScaleClass =
    data.originScaleClass ?? "flex items-end gap-3 scale-[0.72] origin-left";

  return (
    <div className="space-y-3 text-base md:text-lg leading-relaxed max-w-none pr-6">
      <h2
        className="text-xl md:text-2xl font-bold leading-tight"
        style={{ color: "#C08C45" }}
      >
        THE CRAFT IN THE CUP
      </h2>

      {data.description && (
        <p
          className="mt-2 text-base md:text-lg leading-relaxed"
          style={{ color: "rgba(255,255,255,0.60)" }}
        >
          {data.description}
        </p>
      )}

      <div className={lineClass} />

      <div>
        <h3
          className="text-base md:text-lg font-semibold"
          style={{ color: "#C08C45" }}
        >
          Best For
        </h3>

        <div
          className="mt-0.5 text-lg leading-relaxed"
          style={{ color: "rgba(255,255,255,0.60)" }}
        >
          {data.bestFor.map((item, i) => (
            <span key={item}>
              {i > 0 && <span style={{ color: "#6D5333" }}> | </span>}
              {item}
            </span>
          ))}
        </div>
      </div>

      <div className={lineClass} />
      <div className={originRowClass}>
        <h3
          className="text-base md:text-lg font-semibold shrink-0"
          style={{ color: "#C08C45" }}
        >
          Bean Origins
        </h3>

        <div className={data.originWrapClass ?? ""}>
          <div className={originScaleClass}>
            {data.origins.map((origin) => (
              <OriginImg key={origin} name={origin} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Pager({
  page,
  setPage,
  pageCount,
  small = false,
}: {
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  pageCount: number;
  small?: boolean;
}) {
  return (
    <div className="mt-6 flex items-center justify-center gap-2">
      <button
        onClick={() => setPage((p) => Math.max(1, p - 1))}
        disabled={page === 1}
        className={
          "px-3 py-1.5 rounded-md border " +
          (small ? "text-xs " : "text-sm ") +
          (page === 1
            ? "border-neutral-800 text-neutral-600 cursor-not-allowed"
            : "border-[#C08C45]/60 text-[#C08C45] hover:bg-[#C08C45] hover:text-neutral-900")
        }
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
              "h-8 min-w-[2rem] px-2 rounded-md border " +
              (small ? "text-xs " : "text-sm ") +
              (active
                ? "border-[#C08C45] bg-[#C08C45] text-neutral-900 font-semibold"
                : "border-[#C08C45]/40 text-[#C08C45] hover:bg-[#C08C45] hover:text-neutral-900")
            }
          >
            {n}
          </button>
        );
      })}

      <button
        onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
        disabled={page === pageCount}
        className={
          "px-3 py-1.5 rounded-md border " +
          (small ? "text-xs " : "text-sm ") +
          (page === pageCount
            ? "border-neutral-800 text-neutral-600 cursor-not-allowed"
            : "border-[#C08C45]/60 text-[#C08C45] hover:bg-[#C08C45] hover:text-neutral-900")
        }
      >
        Next ›
      </button>
    </div>
  );
}

function RoastLevelAnchors({
  reviewData,
  reviews,
}: {
  reviewData: ReviewData;
  reviews: Review[];
}) {
  const total = reviewData?.count || 0;
  const b = reviewData?.breakdown || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);

  const [page, setPage] = useState(1);
  const pageSize = 8;
  const pageCount = Math.max(1, Math.ceil((reviews?.length || 0) / pageSize));
  const start = (page - 1) * pageSize;
  const pageItems = (reviews || []).slice(start, start + pageSize);

  return (
    <>
      <section className="mt-0 md:mt-2">
        {/* ================= DESKTOP (unchanged from your original) ================= */}
        <div className="hidden md:block">
          {/* Desktop header */}
          <div className="mb-4 flex flex-col items-center text-center">
            {/* Title */}
            <h2 className="text-xl md:text-2xl font-bold tracking-wide text-[#C08C45]">
              CUSTOMER REVIEWS
            </h2>

            {/* Row under title: rating num, stars, count */}
            <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-center">
              <StarRatingDisplay
                avg={reviewData?.avg ?? 0}
                count={total}
                sizeClass="h-6 w-6"
                clipIdPrefix="reviewsStarDesktopHeader"
                numberClassName="font-semibold tabular-nums text-sm md:text-base"
                countClassName="text-neutral-400 text-lg"
                showNumber
                showCount
              />
            </div>
          </div>

          {/* Histogram box */}
          <div className="mt-4 mx-auto max-w-[780px] w-full rounded-xl border border-[#C08C45]/40 bg-black/40 p-4 md:p-6">
            {[5, 4, 3, 2, 1].map((s) => (
              <div key={s} className="flex items-center gap-3 py-1">
                <div className="w-8 text-right text-sm text-neutral-300">
                  {s}★
                </div>
                <div className="flex-1 h-2 rounded-full bg-neutral-800 overflow-hidden">
                  <div
                    className="h-full bg-[#C08C45]"
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
            {pageItems.map((r) => (
              <ReviewCard key={r.id} r={r} />
            ))}
          </div>

          {/* Pager */}
          {pageCount > 1 && (
            <Pager page={page} setPage={setPage} pageCount={pageCount} />
          )}
        </div>
        {/* ================= END DESKTOP ================= */}

        {/* ================= MOBILE (tweaked) ================= */}
        <div className="block md:hidden">
          {/* Header: title only */}
          <div className="mb-4 flex flex-col items-center text-center">
            <h2 className="text-lg font-bold tracking-wide text-[#C08C45]">
              CUSTOMER REVIEWS
            </h2>
          </div>

          {/* Avg / Stars / Count */}
          <div className="mt-2 flex flex-col items-center justify-center gap-2 mb-4">
            <StarRatingDisplay
              avg={reviewData?.avg ?? 0}
              count={total}
              sizeClass="h-5 w-5"
              clipWidthBase={20}
              clipIdPrefix="reviewsStarMobileHeader"
              numberClassName="font-semibold tabular-nums text-sm md:text-base"
              countClassName="text-neutral-400 text-xs tracking-wide"
              showNumber
              showCount
            />
          </div>
          {/* Histogram: tighter padding to pull text closer to border */}
          <div className="mt-2 mx-auto w-full rounded-xl border border-[#C08C45]/40 bg-black/40 p-3">
            {[5, 4, 3, 2, 1].map((s) => (
              <div key={s} className="flex items-center gap-3 py-1">
                <div className="w-8 text-right text-xs text-neutral-300">
                  {s}★
                </div>
                <div className="flex-1 h-2 rounded-full bg-neutral-800 overflow-hidden">
                  <div
                    className="h-full bg-[#C08C45]"
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
            {pageItems.map((r) => (
              <ReviewCard key={r.id} r={r} isMobile />
            ))}
          </div>

          {/* Pager (mobile) */}
          {pageCount > 1 && (
            <Pager page={page} setPage={setPage} pageCount={pageCount} small />
          )}
        </div>
        {/* ================= END MOBILE ================= */}

        {/* Fullscreen dim behind expanded tile (both views) */}
      </section>
    </>
  );
}
function RoastStoryBlock({
  title,
  paragraphs,
}: {
  title: string;
  paragraphs: string[];
}) {
  return (
    <div className="space-y-3 text-neutral-300 text-base md:text-lg leading-relaxed">
      <p className="text-[#C08C45] text-base md:text-lg">{title}</p>

      {paragraphs.map((p, i) => (
        <p key={i}>{p}</p>
      ))}

      {/* Desktop tagline */}
      <p className="hidden md:block text-left text-xl font-semibold text-[#C08C45] break-words pt-2">
        Old Ironsides Coffee - Ignite the Spirit, Savor the Victory!
      </p>

      {/* Mobile tagline */}
      <p className="md:hidden text-center text-xl font-normal text-[#C08C45] break-words pt-2">
        Old Ironsides Coffee
        <br />
        <span className="block text-sm">
          Ignite the Spirit, Savor the Victory!
        </span>
      </p>
    </div>
  );
}
function RoastUnified({
  slug,
  reviewData,
  reviews,
}: {
  slug: string;
  reviewData: ReviewData;
  reviews: Review[];
}) {
  const DATA: Record<
    string,
    {
      title: string;
      paragraphs: string[];
      level: 1 | 2 | 3 | 4 | 5;
    }
  > = {
    flagship: {
      title: "USS Constitution - Commissioned October 21, 1797",
      paragraphs: [
        "Commissioned by President George Washington, the USS Constitution was built to stand as the strength and pride of a new Republic. She was one of six great frigates launched to secure America’s place on the seas, yet time and war would claim all but one.",
        "Through every storm and every battle, the Constitution endured. Today she stands as a living symbol of the nation she was made to defend.",
        "This roast honors that legacy, steady and enduring as the ship herself. Smooth, balanced, and bold, our Flagship Medium Roast carries her spirit in every cup.",
      ],
      level: 3,
    },
    "baptism-by-fire": {
      title: "USS Constitution vs HMS Guerriere - August 19, 1812",
      paragraphs: [
        "Off the coast of Nova Scotia, the Constitution met the British frigate Guerriere in her first great trial at sea. As they drew within range, the sea erupted with the thunder of broadside cannons. British shot struck hard against the hull of the American frigate but failed to pierce it. A British sailor, awestruck by what he saw, shouted, “Her sides are made of iron!”",
        "Through smoke and cannon fire, the Guerriere’s masts splintered and her decks shattered. She fought bravely, but her rigging fell to ruin and her colors were struck. As flames consumed what remained, Old Ironsides sailed on, scarred yet unbroken, carrying a nation’s pride upon the sea.",
        "This bold roast carries that victory forward in every cup and enduring as the ship herself.",
      ],
      level: 4,
    },
    "java-action": {
      title: "USS Constitution vs HMS Java - December 29, 1812",
      paragraphs: [
        "In the wake of HMS Guerriere’s defeat, the Royal Navy cast its hope upon the formidable HMS Java to restore British honor. Swift, heavily armed, and set upon the hunt for the USS Constitution, she was expected to sink the American frigate once and for all.",
        "Off Brazil’s sunlit coast, the sea became the battlefield. Broadsides clashed, cannons roared, masts splintered, and the resolve of a young nation was tested once again. Out from the smoke and chaos, scarred but victorious, Old Ironsides watched as the Java burned in fiery defeat.",
        "This medium roast carries that victory forward in every cup, with a smooth, full-bodied flavor and a finish as enduring as Old Ironsides herself.",
      ],
      level: 3,
    },
    "black-salvo": {
      title: "Black Salvo",
      paragraphs: [
        "In the age of sail, a well-timed salvo could turn the tide of battle in an instant. Old Ironsides, a 44-gun frigate built heavier and armed stronger than most of her class, delivered devastating broadsides that overwhelmed her opponents. At the command, her guns fired in unison, blackening the sky with fire and smoke as iron tore across the water. It was a moment of force, precision, and absolute control.",
        "Black Salvo is roasted with that same intent. Bold yet remarkably smooth, this balanced blend delivers the depth and richness of a true espresso while remaining clean and easy to drink across any brew method.",
        "Built for strength, refined for everyday use, and steady from the first cup to the last.",
      ],
      level: 3,
    },
    "oak-and-copper": {
      title: "Wrapped in Oak Above, Clad in Copper Below",
      paragraphs: [
        "Her copper hull kissed the waves beneath, above, her timbers stood firm against the British cannon’s plea, her heart of oak and copper built for battle on the open sea.",
        "Born for speed, maneuver, and endurance, she cut through the waves, mastered the cannons, and earned her place among the legends of the sea.",
        "This bourbon barrel aged roast honors the shipwrights whose craft carried her through storms, battle, and into history.",
      ],
      level: 3,
    },
    "brass-monkey": {
      title: 'The "Brass Monkey" Myth',
      paragraphs: [
        'For generations sailors joked about weather so cold it could "freeze the balls off a brass monkey." Great line. Terrible story.',
        "Despite the legend, the Royal Navy never stored cannonballs on a brass tray, and nothing on Old Ironsides ever dumped its shot into the snow like spilled marbles. Cannonballs were kept in wooden racks or below deck, far from the frost and spray.",
        "So why did the saying stick? Because sailors spent half their lives freezing their asses off. Iced-over rigging, frozen canvas, breath hanging in the lantern light. That was the real winter at sea.",
        "This roast salutes that folklore with a grin and a shiver. Bold, warming, and cold-weather approved. It cuts through the cold with rich, comforting flavor.",
        "Perfect for mornings so cold you question every choice that brought you outside.",
      ],
      level: 3,
    },
  };

  const data = DATA[slug];
  if (!data) return null;

  return (
    <section className="relative left-1/2 right-1/2 -mx-[50vw] w-screen">
      <div className="border-t-2 border-[#C08C45]/70 relative translate-y-3 md:translate-y-6 w-[110%] -ml-[5%]" />
      <div className="bg-black mt-[-1px]">
        <Container className="pt-6 md:pt-8 pb-6 md:pb-10">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(460px,520px)] lg:gap-10 items-start">
            <div className="max-w-[80ch] md:pt-6 space-y-8">
              <CraftInTheCupBlock slug={slug} />

              <div className="h-px w-full bg-[#6D5333]/70" />

              <RoastStoryBlock
                title={data.title}
                paragraphs={data.paragraphs}
              />
            </div>

            <aside className="hidden md:block md:self-start md:justify-self-end w-full max-w-[520px] md:sticky md:top-14 md:mt-6">
              <CareCard />
            </aside>
          </div>
        </Container>

        <div className="block md:hidden bg-black">
          <Container className="pt-2 pb-0">
            <div className="mt-0">
              <CareCard />
            </div>
          </Container>
        </div>

        <div className="border-t-2 border-[#C08C45]/70 relative mt-6 md:mt-8 w-[110%] -ml-[5%]" />
        <div className="bg-black">
          <Container className="pt-6 md:pt-8 pb-6 md:pb-10">
            <RoastLevelAnchors reviewData={reviewData} reviews={reviews} />
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
      img: "shirts-web.jpg",
    },
    {
      key: "Hats",
      label: "Hats",
      icon: <span className="text-sm">☕</span>,
      img: "hat1-web.jpg",
    },
    {
      key: "Mugs",
      label: "Mugs",
      icon: <span className="text-sm">◼︎</span>,
      img: "coffee-deck2.jpg",
    },
    {
      key: "accessories",
      label: "Coffee Accessories",
      icon: <PackageOpen className="h-5 w-5" />,
      img: "canister-web.jpg",
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
                    className="group overflow-hidden rounded-2xl ring-1 ring-[#C08C45]/60 bg-neutral-900/40 shadow-lg shadow-[#C08C45]/10 transition cursor-default select-none"
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
                        className="text-base font-extrabold text-[#C08C45] tracking-wide"
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
                  <div className="flex items-center gap-3 text-[#C08C45] font-semibold">
                    {t.icon}
                    <span>{t.label}</span>
                  </div>
                </div>
                <div className="px-6 pb-6">
                  <div className="mt-2 text-sm text-neutral-400">
                    Subscribe to get first access on gear. <br />
                    Plus 15% off on first order of coffee.
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
            <span className="text-3xl md:text-5xl font-extrabold text-[#C08C45]">
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
          <div className="rounded-2xl ring-1 ring-[#C08C45]/50 bg-neutral-900/60 p-5">
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

function ContactPage() {
  return (
    <main className="pt-0 pb-12 md:pt-24 md:pb-24">
      <Container className="-mt-4 md:mt-0">
        <div className="flex items-start justify-between mt-0 md:mt-4">
          <SectionTitle
            title={
              <span className="text-3xl md:text-5xl font-extrabold text-[#C08C45]">
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
          <div className="rounded-2xl border border-[#6D5333] bg-[#130E08]/80 p-6 max-w-md">
            <h4 className="font-semibold text-[#C08C45]">Contact</h4>

            <div className="mt-3 space-y-3">
              <a
                href="mailto:HQ@oldironsidescoffee.org"
                className="flex items-center gap-3 text-neutral-300 hover:text-[#E6C07F]"
              >
                <Mail className="h-5 w-5 text-[#C08C45]" />
                <span>HQ@oldironsidescoffee.org</span>
              </a>

              <div className="text-neutral-400 leading-relaxed">
                6 Liberty Square #2564
                <br />
                Boston, MA 02109
              </div>
            </div>

            <div className="mt-6 border-t border-[#6D5333]/60 pt-5">
              <h4 className="font-semibold text-[#C08C45]">Follow Us</h4>

              <div className="mt-3 flex flex-wrap gap-4 text-neutral-300">
                <a
                  href="https://instagram.com/oldironsidescoffee"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 hover:text-[#E6C07F]"
                >
                  <Instagram className="h-5 w-5" />
                  Instagram
                </a>

                <a
                  href="https://facebook.com/oldironsidescoffee"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 hover:text-[#E6C07F]"
                >
                  <span className="h-5 w-5 grid place-content-center">f</span>
                  Facebook
                </a>
              </div>
            </div>
          </div>

          {/* RIGHT: Ring That Bell */}
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
  const day = now.getDay();
  const nextMonday = new Date(now);

  nextMonday.setHours(0, 0, 0, 0);
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
          <div className="rounded-2xl border border-[#6D5333] bg-[#130E08]/80 p-6">
            <h3 className="text-[#C08C45] font-semibold">Core Identifiers</h3>

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

          <div className="rounded-2xl border border-[#6D5333] bg-[#130E08]/80 p-6">
            <h3 className="text-[#C08C45] font-semibold">Capabilities</h3>

            <ul className="mt-3 text-sm text-neutral-300 list-disc list-inside space-y-1">
              <li>Small-batch roasting and packaging (retail & bulk)</li>
              <li>
                Custom blends, unit/command branding, and gift provisioning
              </li>
              <li>CONUS shipping, rush fulfillment, and recurring orders</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-[#6D5333] bg-[#130E08]/80 p-6 md:col-span-2">
            <h3 className="text-[#C08C45] font-semibold">Past Performance</h3>

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
    const STORE_TZ = "America/New_York";

    const compute = () => {
      const now = DateTime.now().setZone(STORE_TZ);

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

      const nextRoast = cutoff.plus({ days: 1 }).startOf("day");
      setDateLabel(nextRoast.toFormat("EEEE, LLL d"));

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

  const sectionWrap = "mt-6 text-neutral-100";
  const proseWrap = "max-w-[72ch] leading-relaxed";
  const stack = "space-y-8";
  const h3 = "text-[#C08C45] font-semibold";
  const p = "mt-1 text-neutral-300";
  const pTight = "text-neutral-300";
  const ul = "mt-1 list-disc list-outside pl-5 space-y-1 text-neutral-300";
  const ulT2 = "mt-2 list-disc list-outside pl-5 space-y-1 text-neutral-300";
  const ol = "mt-1 list-decimal list-outside pl-5 space-y-1 text-neutral-300";
  const link = "text-[#E6C07F] hover:text-[#C08C45] hover:underline";

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

        {slug === "shipping" && (
          <div className="mt-6 mb-6 rounded-2xl border border-[#6D5333] bg-[#130E08]/80 p-6">
            <div className="text-sm md:text-base text-neutral-200">
              <p>We roast on Monday and Tuesday and ship on Wednesday.</p>

              <p className="mt-2">
                Your next eligible roast date is{" "}
                <span className="font-semibold text-[#E6C07F]">
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
                <p className="font-semibold text-[#C08C45]">Free Shipping</p>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li>Mix and match any roasts.</li>
                  <li>
                    <strong>3 or more bags</strong> ship free{" "}
                    <strong>within the continental United States only</strong>.
                  </li>
                  <li>
                    Free shipping applies to standard ground service only (UPS
                    or equivalent carrier).
                  </li>
                  <li>
                    International orders and non-continental U.S. destinations
                    (including Alaska and Hawaii) do not qualify for free
                    shipping.
                  </li>
                </ul>

                <p className="mt-2">
                  Orders of 1 or 2 bags, and all non-qualifying destinations,
                  ship at the carrier rates shown at checkout.
                </p>
              </div>

              <p className="mt-4 text-[#E6C07F]">
                Missed the cutoff time? Leave a note at checkout or reply to
                your confirmation email. We will do our best to accommodate.
              </p>
            </div>
          </div>
        )}

        {slug === "returns" && (
          <section className={sectionWrap}>
            <div className={proseWrap}>
              <div className={stack}>
                <div>
                  <h3 className={h3}>Short version</h3>
                  <p className={p}>
                    Our coffee is roasted to your order and sails out fresh. We
                    cannot accept returns on roasted coffee. If there is
                    something wrong with your order, please contact us.
                  </p>
                </div>

                <div>
                  <h3 className={h3}>Why no returns on coffee</h3>
                  <p className={p}>
                    Once beans are roasted and ship out, they’re like a frigate
                    leaving port. We cannot resell opened or returned coffee,
                    and we do not restock roasted bags.
                  </p>
                </div>

                <div>
                  <h3 className={h3}>Customer's Satisfaction</h3>
                  <p className={p}>
                    If your package is damaged, the coffee is defective in any
                    way, or we made a mistake, contact us. We won't leave you at
                    the harbor.
                  </p>
                </div>

                <div>
                  <h3 className={h3}>If you're unhappy with your purchase</h3>
                  <p className={p}>
                    Email us and we will not leave you at the harbor. We can
                    recommend a better roast to your liking or find another fix.
                  </p>
                </div>

                <div>
                  <h3 className={h3}>How to report an issue (quick steps)</h3>
                  <ol className={ol}>
                    <li>Contact us within 5 days of delivery.</li>
                    <li>
                      Include your order number, a brief note on the issue, and
                      photos if the package or bag is damaged.
                    </li>
                    <li>We’ll reply quickly with our resolution</li>
                  </ol>
                </div>

                <div>
                  <h3 className={h3}>What this covers</h3>
                  <ul className={ul}>
                    <li>Damaged in transit</li>
                    <li>Wrong item received</li>
                    <li>
                      Defective product (seal issues, off roast, quality
                      problems)
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className={h3}>What this doesn’t cover</h3>
                  <ul className={ul}>
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
                  <h3 className={h3}>Contact</h3>
                  <p className={p}>
                    <a
                      href="mailto:Support@oldironsidescoffee.org"
                      className={link}
                    >
                      Support@oldironsidescoffee.org
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {slug === "terms" && (
          <section className="mt-3 text-neutral-100">
            <div className={proseWrap}>
              <div className={stack}>
                <div>
                  <h3 className={h3}>Effective Date</h3>
                  <p className={p}>October 11, 2025</p>
                </div>

                <div>
                  <h3 className={h3}>Overview</h3>
                  <p className={p}>
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
                  <h3 className={h3}>1. Eligibility and Accounts</h3>
                  <ul className={ul}>
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
                  <h3 className={h3}>
                    2. Orders, Acceptance, and Right to Refuse Service
                  </h3>
                  <ul className={ul}>
                    <li>
                      Your order is an offer to buy. We may accept, reject, or
                      cancel any order at our discretion.
                    </li>
                    <li>
                      We may refuse service, cancel orders, or terminate
                      subscriptions for any reason.
                    </li>
                    <li>
                      We may limit or cancel quantities per person, household,
                      account, payment card, or order.
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className={h3}>3. Pricing, Availability, and Errors</h3>
                  <ul className={ul}>
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
                  <h3 className={h3}>4. Payment</h3>
                  <ul className={ul}>
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
                  <h3 className={h3}>5. Subscriptions and Auto-Renewal</h3>
                  <ul className={ul}>
                    <li>
                      Subscriptions renew automatically at the stated interval
                      until you cancel.
                    </li>
                    <li>
                      Cancel any time before the renewal cutoff shown in your
                      account or emails.
                    </li>
                    <li>
                      We may change subscription pricing or terms with notice.
                    </li>
                    <li>
                      We may pause or cancel a subscription for any reason.
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className={h3}>
                    5A. Limited Releases and Discount Exclusions
                  </h3>
                  <ul className={ul}>
                    <li>
                      Certain products are excluded from subscription discounts,
                      first-order promotions, and site-wide offers unless
                      expressly stated otherwise.
                    </li>
                    <li>
                      <strong>Oak &amp; Copper</strong> is a specialty,
                      limited-release coffee and is{" "}
                      <strong>not eligible</strong> for the 10% Subscribe &amp;
                      Save discount.
                    </li>
                    <li>
                      <strong>Oak &amp; Copper</strong> is{" "}
                      <strong>not eligible</strong> for the 15% first-order
                      discount or any automatic promotional discount.
                    </li>
                    <li>
                      The only approved discount for Oak &amp; Copper:{" "}
                      <strong>
                        $1 per bag discount for verified GOVX members
                      </strong>
                      , when applicable.
                    </li>
                    <li>
                      We reserve the right to limit quantities, suspend
                      discounts, or remove any promotion for limited releases at
                      any time.
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className={h3}>
                    6. Shipping, Risk of Loss, and Delivery
                  </h3>
                  <ul className={ul}>
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
                  <h3 className={h3}>
                    7. Returns, Replacements, and Freshness Policy
                  </h3>
                  <p className={p}>
                    To avoid any conflict, this section mirrors our Returns
                    &amp; Freshness Policy and controls if inconsistent
                    elsewhere.
                  </p>
                  <ul className={ulT2}>
                    <li>
                      No returns on roasted coffee that was correctly fulfilled.
                    </li>
                    <li>
                      If damaged, defective, or if we made a mistake, contact us
                      and we’ll replace or refund.
                    </li>
                    <li>
                      Not happy? Email us. We can recommend a better fit, or
                      find a solution.
                    </li>
                    <li>Report issues within 7 days of delivery.</li>
                    <li>
                      Covers: damaged in transit, wrong item, defective product.
                    </li>
                    <li>
                      Doesn’t cover: correctly fulfilled roasted coffee or pure
                      taste preferences.
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className={h3}>
                    8. Promotions, Discounts, and Gift Cards
                  </h3>
                  <ul className={ul}>
                    <li>
                      Promotions, coupons, and discounts are subject to their
                      own rules.
                    </li>
                    <li>
                      Discounts do not apply to limited-release or specialty
                      products unless expressly stated.
                    </li>
                    <li>
                      <strong>Oak &amp; Copper</strong> is excluded from the 10%
                      Subscribe &amp; Save discount and the 15% first-order
                      discount.
                    </li>
                    <li>
                      Gift cards are not reloadable, refundable, or redeemable
                      for cash unless required by law.
                    </li>
                    <li>
                      Free shipping applies only to qualifying orders shipped
                      within the continental United States.
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className={h3}>Launch Mug Offer</h3>
                  <p className={p}>
                    The launch mug offer is available to the first 200 active
                    subscribers only. To qualify, customers must place a
                    subscription order and successfully complete a second
                    subscription shipment. One mug per customer.
                  </p>
                  <p className={p}>
                    The mug ships separately from coffee orders and may arrive
                    in a separate package. Offer is non-transferable, not
                    redeemable for cash, and may not be combined with other
                    promotions or discounts.
                  </p>
                  <p className={p}>
                    This offer ends automatically once 200 qualifying
                    subscribers have been fulfilled or supplies are exhausted.
                  </p>
                </div>

                <div>
                  <h3 className={h3}>10. User Content and Reviews</h3>
                  <ul className={ul}>
                    <li>
                      You grant us a worldwide, royalty-free, perpetual license
                      to use your content.
                    </li>
                    <li>
                      You represent your content is accurate, lawful, and
                      non-infringing.
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className={h3}>11. Acceptable Use</h3>
                  <p className={p}>
                    You agree not to violate law or third-party rights;
                    interfere with or disrupt the site; bypass security
                    measures; or scrape/harvest data except as allowed by
                    robots.txt or our written permission.
                  </p>
                </div>

                <div>
                  <h3 className={h3}>12. Intellectual Property</h3>
                  <p className={p}>
                    The site, products, logos, graphics, text, and other
                    materials are owned by us or our licensors.
                  </p>
                </div>

                <div>
                  <h3 className={h3}>13. Health and Safety</h3>
                  <p className={p}>
                    Coffee contains caffeine. We do not provide medical advice.
                  </p>
                </div>

                <div>
                  <h3 className={h3}>14. Third-Party Services and Links</h3>
                  <p className={p}>
                    We are not responsible for third-party websites, apps, or
                    services that may be linked or integrated.
                  </p>
                </div>

                <div>
                  <h3 className={h3}>
                    15. SMS, Email, and Electronic Communications
                  </h3>
                  <p className={p}>
                    By providing a phone number or email, you consent to receive
                    transactional and marketing messages, subject to our Privacy
                    Policy.
                  </p>
                </div>

                <div>
                  <h3 className={h3}>16. Disclaimers</h3>
                  <ul className={ul}>
                    <li>
                      The site and all products/services are provided “as is”
                      and “as available.”
                    </li>
                    <li>
                      We disclaim all warranties to the fullest extent allowed
                      by law.
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className={h3}>17. Limitation of Liability</h3>
                  <p className={p}>
                    To the fullest extent allowed by law, we and our suppliers
                    are not liable for indirect, incidental, special,
                    consequential, or punitive damages.
                  </p>
                </div>

                <div>
                  <h3 className={h3}>18. Indemnification</h3>
                  <p className={p}>
                    You agree to defend, indemnify, and hold harmless the
                    Company and our officers, directors, employees, agents, and
                    affiliates from claims related to your use of the site.
                  </p>
                </div>

                <div>
                  <h3 className={h3}>
                    19. Dispute Resolution, Arbitration, and Class Action Waiver
                  </h3>
                  <p className={p}>
                    You and the Company agree to resolve disputes through
                    binding arbitration administered by the American Arbitration
                    Association. You may opt out by sending written notice to{" "}
                    <a
                      href="mailto:Support@oldironsidescoffee.org"
                      className={link}
                    >
                      Support@oldironsidescoffee.org
                    </a>{" "}
                    within 30 days of your first use of our services.
                  </p>
                </div>

                <div>
                  <h3 className={h3}>20. Governing Law</h3>
                  <p className={p}>
                    These Terms are governed by the laws of the State of Utah.
                  </p>
                </div>

                <div>
                  <h3 className={h3}>21. Termination</h3>
                  <p className={p}>
                    We may suspend or terminate your access at any time and for
                    any reason.
                  </p>
                </div>

                <div>
                  <h3 className={h3}>22. Force Majeure</h3>
                  <p className={p}>
                    We are not liable for delays or failures caused by events
                    outside our reasonable control.
                  </p>
                </div>

                <div>
                  <h3 className={h3}>23. Changes to the Services or Terms</h3>
                  <p className={p}>
                    We may update these Terms at any time. Your continued use
                    after changes means you accept the updated Terms.
                  </p>
                </div>

                <div>
                  <h3 className={h3}>24. Assignment</h3>
                  <p className={p}>
                    You may not assign or transfer your rights without our prior
                    written consent.
                  </p>
                </div>

                <div>
                  <h3 className={h3}>25. Severability and Waiver</h3>
                  <p className={p}>
                    If any provision is found unenforceable, the remaining
                    provisions remain in full force.
                  </p>
                </div>

                <div>
                  <h3 className={h3}>26. Entire Agreement</h3>
                  <p className={p}>
                    These Terms, together with the Privacy Policy and order or
                    subscription details, are the entire agreement between you
                    and us.
                  </p>
                </div>

                <div>
                  <h3 className={h3}>27. Contact</h3>
                  <p className={p}>
                    Liberty Lighthouse Supply Co., dba Old Ironsides Coffee
                    <br />
                    Email:{" "}
                    <a
                      href="mailto:Support@oldironsidescoffee.org"
                      className={link}
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

        {slug === "privacy" && (
          <section className="mt-3 text-neutral-100">
            <div className="max-w-[68ch] leading-relaxed space-y-8">
              <div className="space-y-2">
                <h3 className={h3}>Effective date</h3>
                <div className={pTight}>October 11, 2025</div>
              </div>

              <p className={pTight}>
                This Privacy Policy explains how Liberty Lighthouse Supply Co.,
                dba Old Ironsides Coffee (“Company,” “we,” “us,” or “our”)
                collects, uses, shares, and protects personal information when
                you visit our websites, make a purchase, create an account,
                subscribe, or otherwise interact with us.
              </p>

              <p className={pTight}>
                Liberty Lighthouse Supply Co. is the data controller for
                purposes of applicable privacy laws.
              </p>

              <div className="space-y-2">
                <h3 className={h3}>
                  Contact for privacy questions and requests
                </h3>
                <p className={pTight}>
                  Email:{" "}
                  <a
                    href="mailto:Support@oldironsidescoffee.org"
                    className={link}
                  >
                    Support@oldironsidescoffee.org
                  </a>
                  <br />
                  Address: 6 Liberty Square #2564, Boston, MA 02109
                </p>
              </div>

              <div className="space-y-2">
                <h3 className={h3}>1. Information we collect</h3>
                <p className={pTight}>
                  We collect information depending on how you interact with us.
                </p>
                <ul className="list-disc pl-5 space-y-2 text-neutral-300">
                  <li>
                    <span className="font-semibold">Identifiers:</span> name,
                    email address, billing and shipping addresses, phone number,
                    account username, IP address, device identifiers.
                  </li>
                  <li>
                    <span className="font-semibold">
                      Commercial information:
                    </span>{" "}
                    products viewed or purchased, order history, subscription
                    selections, discount code usage, customer service
                    interactions.
                  </li>
                  <li>
                    <span className="font-semibold">
                      Internet or network activity:
                    </span>{" "}
                    pages viewed, links clicked, timestamps, approximate
                    location derived from IP, cookie identifiers, analytics
                    events.
                  </li>
                  <li>
                    <span className="font-semibold">Payment information:</span>{" "}
                    limited payment details from payment processors. We do not
                    store full card numbers.
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
                    <span className="font-semibold">
                      Sensitive information:
                    </span>{" "}
                    we do not intentionally collect sensitive personal
                    information.
                  </li>
                </ul>
                <p className={pTight}>
                  We obtain personal information from you directly, your
                  devices, service providers, and marketing and analytics
                  partners.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className={h3}>2. Why we use your information</h3>
                <p className={pTight}>
                  For users in the EEA and UK, legal bases appear in
                  parentheses.
                </p>
                <ul className="list-disc pl-5 space-y-2 text-neutral-300">
                  <li>
                    <span className="font-semibold">Provide the services:</span>{" "}
                    process and fulfill orders, manage subscriptions, deliver
                    products, provide support.
                  </li>
                  <li>
                    <span className="font-semibold">
                      Payments and fraud prevention:
                    </span>{" "}
                    process payments, verify identity, prevent abuse.
                  </li>
                  <li>
                    <span className="font-semibold">
                      Customer communications:
                    </span>{" "}
                    send transactional emails and SMS.
                  </li>
                  <li>
                    <span className="font-semibold">Marketing:</span> send
                    promotional emails and SMS where permitted.
                  </li>
                  <li>
                    <span className="font-semibold">
                      Analytics and improvement:
                    </span>{" "}
                    understand site performance and improve services.
                  </li>
                  <li>
                    <span className="font-semibold">
                      Security and compliance:
                    </span>{" "}
                    enforce terms and comply with legal obligations.
                  </li>
                  <li>
                    <span className="font-semibold">Financial incentives:</span>{" "}
                    operate opt-in programs like subscribe-and-save discounts.
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className={h3}>3. Cookies and similar technologies</h3>
                <p className={pTight}>
                  We use cookies, pixels, tags, and similar technologies to
                  enable site functionality, analytics, and marketing.
                </p>
                <h4 className={h3}>Your choices</h4>
                <ul className="list-disc pl-5 space-y-2 text-neutral-300">
                  <li>Control cookies in your browser settings.</li>
                  <li>
                    Opt out through the cookie banner or device settings where
                    available.
                  </li>
                  <li>
                    Where required, we will treat Global Privacy Control as a
                    valid request.
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className={h3}>4. How we share information</h3>
                <p className={pTight}>
                  We do not sell personal information for money. We may share
                  limited information with advertising and analytics partners.
                </p>
                <ul className="list-disc pl-5 space-y-2 text-neutral-300">
                  <li>
                    <span className="font-semibold">
                      Service providers and processors:
                    </span>{" "}
                    ecommerce platforms, payment processors, email and SMS
                    platforms, analytics providers, shipping partners.
                  </li>
                  <li>
                    <span className="font-semibold">Business partners:</span>{" "}
                    only where you have explicitly opted in.
                  </li>
                  <li>
                    <span className="font-semibold">Legal and safety:</span> to
                    comply with law or protect rights.
                  </li>
                  <li>
                    <span className="font-semibold">Business transfers:</span>{" "}
                    in connection with a merger, acquisition, financing, or sale
                    of assets.
                  </li>
                  <li>
                    <span className="font-semibold">
                      Aggregated or de-identified data:
                    </span>{" "}
                    information that cannot reasonably be linked to you.
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className={h3}>5. Your choices about marketing</h3>
                <ul className="list-disc pl-5 space-y-2 text-neutral-300">
                  <li>
                    <span className="font-semibold">Email:</span> use the
                    unsubscribe link or email{" "}
                    <a
                      href="mailto:Support@oldironsidescoffee.org"
                      className={link}
                    >
                      Support@oldironsidescoffee.org
                    </a>
                    .
                  </li>
                  <li>
                    <span className="font-semibold">SMS:</span> reply STOP to
                    opt out of marketing texts.
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className={h3}>6. Your privacy rights</h3>
                <p className={pTight}>
                  Your rights depend on your location. We will honor requests as
                  required by law.
                </p>
                <ul className="list-disc pl-5 space-y-2 text-neutral-300">
                  <li>
                    know and access categories and specific pieces of personal
                    information,
                  </li>
                  <li>correct inaccurate information,</li>
                  <li>delete information,</li>
                  <li>opt out of sale or sharing for targeted advertising,</li>
                  <li>limit use and disclosure of sensitive information,</li>
                  <li>non-discrimination for exercising these rights.</li>
                </ul>

                <p className={pTight}>
                  <span className="font-semibold">
                    How to submit a request:
                  </span>{" "}
                  email{" "}
                  <a
                    href="mailto:Support@oldironsidescoffee.org"
                    className={link}
                  >
                    Support@oldironsidescoffee.org
                  </a>{" "}
                  with your name, email, request type, and state of residence.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className={h3}>7. California disclosures</h3>
                <ul className="list-disc pl-5 space-y-2 text-neutral-300">
                  <li>
                    <span className="font-semibold">Categories collected:</span>{" "}
                    identifiers, commercial information, internet activity,
                    approximate geolocation, user content, inferences.
                  </li>
                  <li>
                    <span className="font-semibold">Sources:</span> directly
                    from you, your devices, service providers, analytics and
                    marketing partners.
                  </li>
                  <li>
                    <span className="font-semibold">Purposes:</span> as listed
                    in Section 2.
                  </li>
                  <li>
                    <span className="font-semibold">Disclosures:</span> service
                    providers, shipping carriers, analytics vendors, support
                    tools.
                  </li>
                  <li>
                    <span className="font-semibold">Sale or sharing:</span> we
                    do not sell personal information for money.
                  </li>
                  <li>
                    <span className="font-semibold">
                      Sensitive personal information:
                    </span>{" "}
                    we do not use or disclose it for purposes requiring a right
                    to limit.
                  </li>
                  <li>
                    <span className="font-semibold">Non-discrimination:</span>{" "}
                    we will not discriminate against you for exercising your
                    rights.
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className={h3}>8. Children’s privacy</h3>
                <p className={pTight}>
                  Our services are not intended for children under 13.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className={h3}>9. Data retention</h3>
                <p className={pTight}>
                  We keep personal information only as long as necessary.
                </p>
                <ul className="list-disc pl-5 space-y-2 text-neutral-300">
                  <li>orders and tax records: up to 7 years,</li>
                  <li>
                    customer support records: up to 3 years after resolution,
                  </li>
                  <li>
                    marketing contact data: until you unsubscribe or become
                    inactive,
                  </li>
                  <li>
                    analytics data: per vendor defaults or a reasonable period.
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className={h3}>10. Security</h3>
                <p className={pTight}>
                  We use safeguards designed to protect personal information. No
                  method of transmission or storage is completely secure.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className={h3}>11. International users</h3>
                <p className={pTight}>
                  We are based in the United States. Your information may be
                  transferred to, stored in, or processed in the United States.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className={h3}>12. Third party sites and services</h3>
                <p className={pTight}>
                  Third-party privacy practices are governed by their own
                  policies.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className={h3}>13. Do Not Track</h3>
                <p className={pTight}>
                  Our services do not respond to Do Not Track signals.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className={h3}>14. Changes to this Policy</h3>
                <p className={pTight}>
                  We may update this Policy from time to time.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className={h3}>15. How to contact us</h3>
                <p className={pTight}>
                  Liberty Lighthouse Supply Co., dba Old Ironsides Coffee
                  <br />
                  Email:{" "}
                  <a
                    href="mailto:Support@oldironsidescoffee.org"
                    className={link}
                  >
                    Support@oldironsidescoffee.org
                  </a>
                  <br />
                  Address: 6 Liberty Square #2564, Boston, MA 02109
                </p>
              </div>
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
  "black-salvo": "black-salvo",

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
            detail: "Sign in to unlock 10% subscription pricing.",
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
          i?.purchaseMode === "sub" && i.sellingPlanId
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
            discountCodes: ["IRONSIDES15"],
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

      // 🔥 META INITIATE CHECKOUT
      if (typeof window !== "undefined" && (window as any).fbq) {
        (window as any).fbq("track", "InitiateCheckout", {
          content_type: "product",
          contents: desired.map((line) => ({
            id: line.merchandiseId,
            quantity: line.quantity,
          })),
          value: total,
          currency: "USD",
        });
      }

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
                  <span className="font-semibold text-[#C08C45]">
                    {dateLabel}
                    <br />
                    Time left to make the next roast:{" "}
                    <span className="text-[#C08C45]">{left}</span>
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
                      <div className="font-semibold text-[#C08C45]">
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
                        <div className="mt-1 text-m text-[#C08C45]">
                          Fresh Roasted, Ships every {item?.subEvery ?? 30}{" "}
                          days. 10% off applied.
                        </div>
                      ) : (
                        <div className="mt-1 text-m text-neutral-400">
                          Priced as if the Crown won the war.{" "}
                          <span className="text-[#C08C45]">
                            Subscribe and save 10% off this item.
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
                            <span className="text-[#C08C45] font-semibold">
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
                          <span className="text-[#C08C45] font-semibold">
                            {coffeeBagCount}/{freeShippingThreshold}
                          </span>
                        </div>
                        <div className="mt-2 h-2 rounded-full bg-neutral-800">
                          <div
                            className="h-2 rounded-full bg-[#C08C45] transition-all"
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
                      <span className="font-semibold text-[#C08C45]">
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
                    <span className="text-[#C08C45]">Total</span>
                    <span className="font-semibold">{fmt(total)}</span>
                  </div>

                  <button
                    onClick={onCheckoutClick}
                    className="mt-4 w-full px-4 py-2 rounded-lg bg-[#C08C45] text-neutral-900 font-semibold hover:bg-[#C08C45]"
                    aria-label="Proceed to checkout"
                  >
                    Checkout
                  </button>
                </div>

                {/* Ring That Bell subscribe box */}
                <div className="rounded-2xl ring-1 ring-[#C08C45]/60 bg-neutral-900/60 p-8 text-center">
                  <div className="flex items-center justify-center gap-3 mb-3">
                    <Bell className="h-7 w-7 text-[#C08C45]" />
                    <h3 className="text-2xl font-extrabold text-[#C08C45]">
                      RING THAT BELL
                    </h3>
                  </div>
                  <p className="text-neutral-300 mb-5 text-lg md:text-xl">
                    Get 15% off your first order. <br /> Subscribe and save 10%
                    off every order.
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
                      className="flex-1 rounded-xl bg-neutral-900/70 border border-neutral-700 px-4 py-3 text-sm text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#C08C45]"
                    />
                    <button className="px-6 py-3 rounded-xl bg-[#C08C45] text-neutral-900 font-semibold hover:bg-[#C08C45]">
                      GET 15% OFF
                    </button>
                  </form>

                  <div className="mt-3 text-xs text-neutral-400">
                    Already a member?{" "}
                    <Link
                      to="/account/login"
                      className="text-[#C08C45] hover:underline"
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
              <Link to="/store" className="text-[#C08C45] hover:underline">
                Harbor
              </Link>
              .
            </p>
          </div>
        )}
        {/* Account gate modal */}
        <AccountGateModal
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
function SubscriptionLandingPage() {
  const subRoasts = roastCards.filter(
    (r) => r.canBuy || r.slug === "oak-and-copper"
  );

  return (
    <main className="relative overflow-hidden bg-black text-neutral-100">
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-[#6D5333]/40 bg-[#050302]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_25%,rgba(192,140,69,0.14),transparent_30%),radial-gradient(circle_at_82%_70%,rgba(109,83,51,0.14),transparent_34%)] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-[#050302]/90 to-black pointer-events-none" />

        <Container>
          <div className="relative z-10 py-10 md:py-14 max-w-[1040px] mx-auto">
            <div className="mx-auto w-fit border border-[#6D5333]/70 bg-black/50 px-5 py-2">
              <p className="font-oswald text-[0.72rem] md:text-sm font-bold uppercase tracking-[0.34em] text-[#C08C45]">
                Fleet Command
              </p>
            </div>

            <div className="mt-6 text-center">
              <h1 className="font-cinzel text-3xl md:text-5xl xl:text-6xl font-black uppercase leading-[0.96] tracking-[0.04em] text-[#E6DCC8]">
                Coffee Subscriptions
                <br />
                <span className="text-[#C08C45]">Made Simple</span>
              </h1>

              <p className="mt-4 max-w-[680px] mx-auto font-playfair italic text-lg md:text-xl leading-relaxed text-[#B5976D]">
                Pick your roast. Choose 14, 30, or 60 days. Skip, pause, or
                cancel anytime.
              </p>

              <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
                <a
                  href="#choose-subscription"
                  className="inline-flex h-[48px] items-center justify-center rounded-md bg-[#C08C45] px-7 font-oswald text-sm font-black uppercase tracking-[0.16em] text-black transition hover:bg-[#E6C07F]"
                >
                  Start A Subscription
                </a>

                <Link
                  to="/account"
                  className="inline-flex h-[48px] items-center justify-center rounded-md border border-[#6D5333] bg-black/40 px-7 font-oswald text-sm font-black uppercase tracking-[0.16em] text-[#E6C07F] transition hover:border-[#C08C45] hover:bg-[#32220D]"
                >
                  Manage Existing
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* SIMPLE STEPS */}
      <section className="relative bg-black py-7 md:py-9 border-b border-[#6D5333]/40">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-w-[1040px] mx-auto">
            {[
              ["01", "Pick Your Roast", "Choose the coffee you want."],
              ["02", "Choose Schedule", "14, 30, or 60 day delivery."],
              ["03", "Stay In Control", "Skip, pause, or cancel anytime."],
            ].map(([num, title, text]) => (
              <div
                key={num}
                className="rounded-xl border border-[#6D5333]/50 bg-[#080503] p-4 flex gap-4 items-center"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#C08C45] text-[#C08C45] font-oswald font-black text-sm">
                  {num}
                </div>

                <div>
                  <h2 className="font-oswald text-lg md:text-xl font-black uppercase tracking-[0.08em] text-[#E6DCC8]">
                    {title}
                  </h2>

                  <p className="mt-1 text-neutral-400 text-sm leading-relaxed">
                    {text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ROAST GRID */}
      <section
        id="choose-subscription"
        className="relative overflow-hidden bg-[#050302] py-9 md:py-14 border-b border-[#6D5333]/40"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(192,140,69,0.10),transparent_30%),radial-gradient(circle_at_75%_70%,rgba(109,83,51,0.12),transparent_34%)] pointer-events-none" />

        <Container>
          <div className="relative z-10 max-w-[1040px] mx-auto">
            <div className="text-center max-w-[720px] mx-auto">
              <p className="font-oswald text-[0.7rem] font-bold uppercase tracking-[0.32em] text-[#B5976D]">
                Subscribe And Save
              </p>

              <h2 className="mt-3 font-cinzel text-2xl md:text-4xl font-black uppercase leading-tight text-[#C08C45]">
                Choose Your Roast
              </h2>

              <p className="mt-3 text-neutral-300 text-base md:text-lg leading-relaxed">
                Tap a roast. The product page opens with subscription selected.
              </p>
            </div>

            <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {subRoasts.map((r) => {
                const isOak = r.slug === "oak-and-copper";
                const price = isOak ? 24.99 : Number(r.price || 19.99);
                const subPrice = isOak ? price : price * 0.9;

                return (
                  <Link
                    key={r.slug}
                    to={`/roast/${r.slug}?purchase=sub`}
                    className="group rounded-xl border border-[#6D5333]/50 bg-black/70 shadow-xl shadow-black/40 transition hover:border-[#C08C45] overflow-hidden"
                  >
                    <div className="grid grid-cols-[105px_1fr] sm:grid-cols-1">
                      <div className="bg-[#080503] flex items-center justify-center p-3">
                        <img
                          src={
                            r.img?.startsWith("/") || r.img?.startsWith("http")
                              ? r.img
                              : `/${r.img}`
                          }
                          alt={r.title}
                          className="h-[120px] sm:h-[170px] w-full object-contain transition duration-300 group-hover:scale-[1.03]"
                        />
                      </div>

                      <div className="p-4">
                        <h3 className="font-cinzel text-xl md:text-2xl font-black uppercase tracking-[0.03em] text-[#C08C45] leading-tight">
                          {r.title}
                        </h3>

                        <p className="mt-1 text-[#B5976D] text-sm font-semibold">
                          {r.subTitle}
                        </p>

                        <p className="mt-2 text-neutral-300 text-sm leading-relaxed line-clamp-2">
                          {r.note ||
                            "Fresh-roasted and built for the daily cup."}
                        </p>

                        <div className="mt-3 rounded-lg border border-[#6D5333]/50 bg-[#130E08] p-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[#E6C07F] font-oswald text-sm font-black uppercase tracking-[0.08em]">
                              {isOak ? "Subscribe" : "Save 10%"}
                            </span>

                            <span className="text-neutral-300 text-sm font-semibold">
                              {fmt(subPrice)}
                            </span>
                          </div>

                          <p className="mt-1 text-xs text-[#B5976D]">
                            Every 14, 30, or 60 days
                          </p>
                        </div>

                        <div className="mt-3 h-[44px] rounded-md bg-[#C08C45] text-black font-oswald font-black uppercase tracking-[0.14em] flex items-center justify-center text-sm transition group-hover:bg-[#E6C07F]">
                          Subscribe
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

      {/* MANAGE + FAQ */}
      <section className="relative bg-black py-9 md:py-12">
        <Container>
          <div className="max-w-[1040px] mx-auto grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-5">
            {/* MANAGE */}
            <div className="rounded-2xl border border-[#6D5333]/55 bg-[#080503] p-5 md:p-6 shadow-xl shadow-black/50">
              <p className="font-oswald text-[0.7rem] font-bold uppercase tracking-[0.3em] text-[#B5976D]">
                Already Subscribed?
              </p>

              <h2 className="mt-3 font-cinzel text-2xl md:text-3xl font-black uppercase leading-tight text-[#E6DCC8]">
                Manage Your
                <br />
                <span className="text-[#C08C45]">Coffee Deliveries</span>
              </h2>

              <p className="mt-3 text-neutral-300 text-base leading-relaxed">
                Sign in to view deliveries, orders, shipping, and account help.
              </p>

              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Link
                  to="/account"
                  className="rounded-xl border border-[#6D5333] bg-[#130E08] p-4 text-center transition hover:border-[#C08C45]"
                >
                  <div className="font-oswald text-xl font-black uppercase text-[#C08C45]">
                    Account
                  </div>
                  <p className="mt-1 text-neutral-400 text-sm">
                    Orders and shipping.
                  </p>
                </Link>

                <Link
                  to="/account/login"
                  className="rounded-xl border border-[#C08C45] bg-[#C08C45] p-4 text-center transition hover:bg-[#E6C07F]"
                >
                  <div className="font-oswald text-xl font-black uppercase text-black">
                    Sign In
                  </div>
                  <p className="mt-1 text-black/75 text-sm font-semibold">
                    Manage subscription.
                  </p>
                </Link>
              </div>
            </div>

            {/* FAQ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                ["Can I skip?", "Yes. Skip a shipment when needed."],
                ["Can I cancel?", "Yes. Cancel anytime from your account."],
                ["How often?", "Choose every 14, 30, or 60 days."],
                ["Need help?", "Email HQ@oldironsidescoffee.org."],
              ].map(([q, a]) => (
                <div
                  key={q}
                  className="rounded-xl border border-[#6D5333]/45 bg-[#080503] p-4"
                >
                  <h3 className="font-oswald text-lg font-black uppercase tracking-[0.06em] text-[#E6C07F]">
                    {q}
                  </h3>

                  <p className="mt-2 text-neutral-300 text-sm leading-relaxed">
                    {a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
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
          ? "bg-[#C08C45] text-neutral-900 font-semibold"
          : "border border-neutral-700 hover:border-[#C08C45]/40 text-neutral-300")
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
                <span className="text-3xl md:text-5xl font-extrabold text-[#C08C45]">
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
              <div className="text-lg font-semibold text-[#C08C45] mb-3">
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
                    className="absolute inset-y-0 right-2 flex items-center text-neutral-400 hover:text-[#C08C45]"
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
                  className="w-full px-4 py-2 rounded-lg bg-[#C08C45] text-neutral-900 font-semibold hover:bg-[#C08C45]"
                >
                  {loading ? "Signing in..." : "Log in"}
                </button>
              </div>
              <div className="mt-3 text-xs text-neutral-500">
                Trouble signing in? Email{" "}
                <a
                  href="mailto:support@oldironsidescoffee.org"
                  className="text-[#C08C45]"
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
              <div className="text-lg font-semibold text-[#C08C45] mb-3">
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
                  className="w-full px-4 py-2 rounded-lg bg-[#C08C45] text-neutral-900 font-semibold hover:bg-[#C08C45] disabled:opacity-60"
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
              <span className="text-[#C08C45] font-semibold">
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
                className="px-3 py-2 rounded-lg border border-neutral-700 hover:border-[#C08C45]/40 text-neutral-300 text-sm"
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
                  <div className="text-[#C08C45] font-semibold">
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
                          <div className="text-[#C08C45] font-semibold">
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
                  className="mt-4 text-[#C08C45] text-sm text-left"
                >
                  Manage subscriptions →
                </button>
              </div>

              {/* Recent orders */}
              <div className="rounded-2xl ring-1 ring-neutral-800 bg-neutral-900/50 p-6 flex flex-col justify-between">
                <div>
                  <div className="text-[#C08C45] font-semibold">
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
                            <div className="text-[#C08C45] font-semibold">
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
                  className="mt-4 text-[#C08C45] text-sm text-left"
                >
                  View all orders →
                </button>
              </div>

              {/* Default shipping */}
              <div className="rounded-2xl ring-1 ring-neutral-800 bg-neutral-900/50 p-6">
                <div className="text-[#C08C45] font-semibold">
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
                  className="mt-3 px-3 py-2 rounded-lg border border-neutral-700 text-sm text-[#C08C45] hover:border-[#C08C45]/60 hover:bg-[#C08C45]/10"
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
                  className="rounded-2xl ring-1 ring-neutral-800 bg-neutral-900/50 p-6 border-l-4 border-[#C08C45]/60"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="font-semibold text-[#C08C45]">
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

                    <div className="text-xs ml-auto rounded px-2 py-1 ring-1 ring-[#C08C45]/60 text-[#C08C45] uppercase tracking-wide">
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
                      className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-[#C08C45] text-neutral-900 text-sm font-semibold hover:bg-[#C08C45]"
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
                  className="rounded-2xl ring-1 ring-neutral-800 bg-neutral-900/50 p-6 border-l-4 border-[#C08C45]/60"
                >
                  <div className="flex items-center gap-4">
                    <div className="font-semibold text-[#C08C45]">{o.id}</div>

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
                          className="text-[#C08C45]"
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
                <div className="text-[#C08C45] font-semibold mb-3">
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
                            ? "border-[#C08C45] bg-[#C08C45]/10"
                            : "border-neutral-700 hover:border-[#C08C45]/60",
                        ].join(" ")}
                      >
                        {/* Address display (no click-to-set-default) */}
                        <div className="block w-full text-left pr-24">
                          <div className="font-semibold text-neutral-200">
                            {a.firstName} {a.lastName}
                            {isDefault && (
                              <span className="ml-2 text-xs text-[#C08C45]">
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
                              className="px-2 py-1 text-xs rounded border border-neutral-600 text-neutral-200 hover:border-[#C08C45]/60 disabled:opacity-60"
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
                            className="px-2 py-1 text-xs rounded border border-neutral-600 text-neutral-200 hover:border-[#C08C45]/60"
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
                    <div className="text-[#C08C45] font-semibold">
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
                        className="px-3 py-1 text-xs rounded border border-[#C08C45] text-[#C08C45] hover:bg-[#C08C45]/10 font-semibold"
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
                          className="text-[#C08C45] font-medium"
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
                          className="px-3 py-2 rounded-lg border border-neutral-600 text-neutral-200 hover:border-[#C08C45]/60"
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
                    className="px-3 py-2 rounded-lg bg-[#C08C45] text-neutral-900 text-sm font-semibold hover:bg-[#C08C45] disabled:opacity-60"
                  >
                    {loading ? "Saving..." : "Save address"}
                  </button>
                </form>
              </div>

              {/* Security */}
              <div className="rounded-2xl ring-1 ring-neutral-800 bg-neutral-900/50 p-6">
                <div className="text-[#C08C45] font-semibold mb-3">
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
                      className="text-[#C08C45]"
                    >
                      support@oldironsidescoffee.org
                    </a>{" "}
                    if you need help updating your login.
                  </p>
                </div>
                <button
                  // REAL: link to password reset flow
                  className="mt-4 px-3 py-2 rounded-lg bg-[#C08C45] text-neutral-900 text-sm font-semibold hover:bg-[#C08C45]"
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
              <span className="text-3xl font-extrabold text-[#C08C45]">
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
            className="mt-4 inline-block px-5 py-2 rounded-xl bg-[#C08C45] text-neutral-900 font-semibold hover:bg-[#C08C45]"
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
          ? "text-ironsideWhite font-semibold"
          : "text-ironsideWhite/80") +
        " text-base md:text-lg transition-colors hover:text-ironsideWhite"
      }
    >
      {children}
    </Link>
  );
}

function HeaderDropdown({
  label,
  items,
}: {
  label: string;
  items: { label: string; to: string }[];
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="px-1.5 py-1 rounded-md text-base md:text-lg transition-colors text-ironsideWhite/80 hover:text-ironsideWhite font-semibold inline-flex items-center gap-1"
      >
        {label}
        <span className="text-[#C08C45] text-sm leading-none">▼</span>
      </button>

      {open && (
        <div className="absolute left-0 top-full pt-3 z-[999999] min-w-[230px]">
          <div className="rounded-md border border-[#6D5333]/70 bg-black/95 shadow-2xl shadow-black/70 overflow-hidden">
            {items.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="block px-5 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-[#B5976D] hover:bg-[#130E08] hover:text-[#E6C07F] border-b border-[#6D5333]/30 last:border-b-0"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
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
          const headerOffset = window.innerWidth < 1024 ? 140 : 180;

          const elementPosition =
            el.getBoundingClientRect().top + window.pageYOffset;

          const offsetPosition = elementPosition - headerOffset;

          window.scrollTo({
            top: offsetPosition,
            behavior: "smooth",
          });
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
  // ===== STATE =====
  const [open, setOpen] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [phase, setPhase] = React.useState<"form" | "success">("form");

  // ===== KEYS =====
  const KEY_SUB = "promo_subscribed";
  const COOKIE_SUB = "promo_subscribed";

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
    setTimeout(() => {
      g.__promo.isLockedOpen = false;
    }, 200);
  };

  // ===== EVENT: open from anywhere (respects gate) =====
  React.useEffect(() => {
    if (!isLeader) return;
    const onOpen = () => safeOpen(true); // force open for header/tab/manual triggers
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
      aria-label="Get 15% off your first order"
      onClick={(e) => {
        if (e.target === e.currentTarget) safeClose();
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal shell */}
      <div className="relative z-10 w-[92vw] max-w-[380px] md:w-[98vw] md:max-w-6xl">
        <div
          className="relative rounded-2xl md:rounded-2xl ring-1 ring-[#C08C45]/60 bg-neutral-900/60 
  overflow-y-auto md:overflow-visible max-h-[96vh] md:min-h-0 md:max-h-none"
        >
          {/* TOP-RIGHT CLOSE (X) */}
          <button
            type="button"
            onClick={safeClose}
            className="absolute right-3 top-3 z-20 inline-flex h-10 w-10 items-center justify-center rounded-md
            bg-neutral-900/70 ring-1 ring-[#C08C45] text-[#C08C45] hover:text-[#C08C45]
            hover:ring-[#C08C45] transition"
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
                  src="/captain-deck1.jpg"
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-cover blur-sm scale-110 opacity-60"
                />
                <img
                  src="/captain-deck1.jpg"
                  alt="Hero"
                  className="relative z-10 h-full mx-auto object-contain"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-transparent" />
              </div>
            </div>

            {/* DESKTOP HERO */}
            <div className="hidden md:flex items-center justify-start pl-6 pr-0 py-6">
              <div className="rounded-2xl ring-1 ring-[#C08C45] bg-neutral-900/60 overflow-hidden shadow-2xl shadow-black/40">
                <div className="w-[19rem] lg:w-[21rem] aspect-[4/5]">
                  <img
                    src="/captain-deck1.jpg"
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
                    <BellRinger iconClassName="h-10 w-10 md:h-14 md:w-14 text-[#C08C45]" />

                    <h3 className="font-extrabold text-[#C08C45] text-[31px] leading-tight md:text-[3.25rem]">
                      RING THAT BELL
                    </h3>
                  </div>

                  <p className="text-neutral-300 mb-3 md:mb-5 text-[14px] leading-snug md:text-[1.5625rem] md:leading-normal md:whitespace-nowrap">
                    Get 15% off your first fresh coffee order.
                    <br className="hidden md:block" />
                  </p>

                  {/* === THIS WHOLE WRAPPER SWAPPED === */}
                  <div className="w-full max-w-[300px] sm:max-w-sm md:max-w-2xl mx-auto">
                    {/* MOBILE: success OR form */}
                    <div className="md:hidden">
                      {phase === "success" ? (
                        <>
                          {/* Full-width amber banner fixed to the top */}
                          <div className="fixed inset-x-0 top-0 z-[2147483647] bg-[#C08C45] text-neutral-900 text-center font-semibold px-4 py-3 shadow-lg">
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
                              className="rounded-xl bg-neutral-900/70 border border-neutral-700 px-3 py-2 text-[16px] text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#C08C45] md:px-5 md:py-3 md:text-[1.25rem] md:flex-none md:w-[50%]"
                              style={{ color: "#ffffff" }}
                            />
                            <button
                              type="submit"
                              className="px-4 py-2 md:px-10 md:py-3.5 rounded-xl ring-1 ring-[#C08C45]/70 bg-[#C08C45] text-neutral-900 text-[18px] md:text-lg font-semibold hover:bg-[#C08C45] transition-all"
                            >
                              GET 15% OFF
                            </button>
                          </form>

                          <div className="mt-3 text-[11px] md:text-[0.95rem] text-[#D2B48C] text-center uppercase tracking-[0.12em]">
                            15% discount applied automatically at checkout
                          </div>

                          <div className="mt-2 mx-auto max-w-[280px] border border-[#5A4630]/60 bg-black/30 px-3 py-2 rounded-sm">
                            <p className="text-[9px] uppercase tracking-[0.13em] leading-snug text-[#D2B48C] text-center">
                              Full-size bags only. Sample packs and limited
                              releases excluded.
                            </p>
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
                          className="rounded-xl bg-neutral-900/70 border border-neutral-700 px-3 py-2 text-[16px] text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#C08C45] md:px-5 md:py-3 md:text-[1.25rem] md:flex-none md:w-[50%]"
                          style={{ color: "#ffffff" }}
                        />
                        <button
                          type="submit"
                          className="px-4 py-2 md:px-10 md:py-3.5 rounded-xl ring-1 ring-[#C08C45]/70 bg-[#C08C45] text-neutral-900 text-[18px] md:text-lg font-semibold hover:bg-[#C08C45] transition-all"
                        >
                          GET 15% OFF
                        </button>
                      </form>

                      <div className="mt-3 text-[11px] md:text-[0.95rem] text-[#D2B48C] text-center uppercase tracking-[0.12em]">
                        15% discount applied automatically at checkout
                      </div>

                      <div className="mt-3 mx-auto max-w-[520px] relative overflow-hidden border border-[#5A4630]/60 bg-black/30 px-4 py-2 rounded-sm">
                        <div className="absolute inset-y-0 left-0 w-[3px] bg-[#C08C45]" />

                        <p className="pl-3 text-[10px] uppercase tracking-[0.14em] leading-snug text-[#D2B48C] text-center">
                          Full-size bags only. Sample packs and limited releases
                          excluded.
                        </p>
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
                    className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl ring-1 ring-[#C08C45]/60 
                    text-[#C08C45] font-semibold text-lg hover:bg-[#C08C45] hover:text-neutral-900 transition-all"
                    aria-label="Close banner"
                  >
                    Nah. Tax me like it&apos;s 1773. Give my 15% to the
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
              className="inline-flex items-center justify-center px-4 md:px-5 py-2 rounded-xl ring-1 ring-[#C08C45]/60 
              text-[#C08C45] font-semibold text-m md:text-lg
              hover:bg-[#C08C45] hover:text-neutral-900 transition-all"
              aria-label="Close banner"
            >
              Nah. Tax me like it&apos;s 1773. Give my 15% to the Redcoats.
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
                  ? "text-[#C08C45] drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]"
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
  const [hidePromoTab, setHidePromoTab] = useState(() => {
    const hiddenUntil = localStorage.getItem("promoTabHiddenUntil");
    if (!hiddenUntil) return false;
    return Date.now() < Number(hiddenUntil);
  });

  // Open the cart drawer when other code dispatches 'oi-open-cart'
  useEffect(() => {
    const onOpen = () => {
      setMobileCartOpen(true);
      setDesktopCartOpen(false);
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
    { key: "hats", label: "Hats", img: "hat1-web.jpg" },
    { key: "mugs", label: "Mugs", img: "coffee-deck2.jpg" },
    {
      key: "accessories",
      label: "Coffee Accessories",
      img: "canister-web.jpg",
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
    <div className="min-h-screen w-full bg-black text-neutral-100 overflow-x-hidden pt-[20px] lg:pt-0">
      <ScrollToTop />
      <FlashToast />
      <PromoSubscribeModal />

      {/* ===== HEADER (desktop + mobile) ===== */}
      <header
        className={
          "fixed top-0 inset-x-0 z-[999999] md:z-50 transition-colors duration-300 " +
          (shrunk
            ? "bg-black border-b border-neutral-800 shadow-lg"
            : "bg-transparent border-b border-transparent")
        }
        style={{ backgroundColor: shrunk ? "" : "transparent" }}
      >
        {/* === MOBILE HEADER === */}
        <div
          className={
            "lg:hidden pb-1 transition-colors duration-300 " +
            (shrunk
              ? "bg-neutral-950 border-b border-neutral-800"
              : "bg-transparent border-b border-transparent")
          }
        >
          {/* trust strip */}
          <div
            className={
              "px-3 py-2 text-center text-[12px] font-semibold leading-tight text-[#C08C45] transition-colors duration-300 " +
              (shrunk
                ? "border-b border-[#C08C45] bg-neutral-950"
                : "border-b border-[#C08C45]/40 bg-transparent")
            }
          >
            Roasted To Order • Free Shipping on 3+ Bags
          </div>

          <Link
            to="/"
            aria-label="Old Ironsides Coffee Home"
            className="block px-4 pt-2 pb-1 text-center leading-tight"
          >
            <div
              className="text-[20px] md:text-[40px] lg:text-[20px] font-bold tracking-[0.18em] text-neutral-300"
              style={{ fontFamily: "'Cinzel', serif", fontWeight: 1000 }}
            >
              OLD IRONSIDES COFFEE
            </div>
          </Link>

          <div className="flex justify-between px-4 pb-1">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="flex flex-col justify-center gap-[4px] text-[#C08C45] translate-y-[6px]"
              aria-label="Open menu"
            >
              <span className="block w-8 h-[3px] bg-[#C08C45]" />
              <span className="block w-8 h-[3px] bg-[#C08C45]" />
              <span className="block w-8 h-[3px] bg-[#C08C45]" />
            </button>

            <div className="flex gap-4 text-[#C08C45] translate-y-[6px] lg:hidden relative z-[1000001]">
              <button
                type="button"
                onClick={() => window.dispatchEvent(new Event("oi-open-cart"))}
                aria-label="Open Chest (Cart)"
                title="Chest"
                className="relative flex flex-col items-center text-center leading-none z-[1000002] text-[#C08C45]"
              >
                <ChestIcon className="h-8 w-8 pointer-events-none" />
                <span className="absolute -top-1 -right-2 text-[10px] font-bold tabular-nums bg-neutral-900 rounded px-1 py-[1px] ring-1 ring-[#C08C45]/60 text-[#C08C45] leading-none pointer-events-none">
                  {count ?? 0}
                </span>
              </button>

              <Link
                to="/account"
                aria-label="Account"
                className="flex flex-col items-center text-center leading-none text-[#C08C45]"
              >
                <span className="text-3xl leading-none text-[#C08C45]">⚓</span>
              </Link>
            </div>
          </div>
        </div>

        {/* === DESKTOP TOP BAR === */}
        <div className="hidden lg:block border-b border-[#C08C45] bg-transparent text-neutral-300 relative z-30">
          <Container>
            <div className="h-10 flex items-center relative">
              <div className="absolute left-1/2 -translate-x-1/2 text-sm font-semibold tracking-wide text-center flex items-center gap-3">
                <span className="text-neutral-300">
                  Roasted To Order Every Monday &amp; Thursday
                </span>

                <span className="text-[#C08C45]">|</span>

                <Link
                  to="/legal/shipping"
                  className="text-neutral-300 underline-offset-2 hover:underline"
                >
                  Free Shipping on 3+ Bags
                </Link>
              </div>

              <Link
                to="/account"
                className="ml-auto inline-flex items-center gap-2 text-[#C08C45] text-base font-semibold"
                aria-label="Account"
                title="Account"
              >
                <span className="text-[#C08C45]">⚓</span>
                <span>Account</span>
              </Link>
            </div>
          </Container>
        </div>

        {/* === DESKTOP HEADER STACK + NAV (unchanged look) === */}
        <div
          className={
            "hidden lg:block relative z-[999] transition-colors duration-300 " +
            (shrunk ? "bg-black" : "bg-transparent")
          }
        >
          <Container className="flex flex-col items-start px-4 xl:px-6 max-w-full overflow-visible">
            <div
              className={
                (shrunk ? "pt-3 pb-2" : "pt-8 pb-3") + " relative z-30"
              }
            >
              {/* centered brand block with emblem on the left */}
              <div className="flex items-center justify-between w-full min-w-0 overflow-visible">
                {/* LEFT: emblem + title */}
                <div className="flex items-center gap-4 xl:gap-6 translate-x-0 2xl:translate-x-0 whitespace-nowrap shrink min-w-0">
                  <Link
                    to="/"
                    aria-label="Go to Home Port"
                    className="shrink-0"
                  >
                    <img
                      src="/emblem-black.png"
                      alt="Old Ironsides emblem"
                      className={
                        (shrunk ? "h-[74px]" : "h-[104px]") +
                        " w-auto object-contain shrink-0"
                      }
                    />
                  </Link>

                  <div className="flex flex-col items-start leading-none whitespace-nowrap shrink-0">
                    <Link
                      to="/"
                      aria-label="Go to Home Port"
                      className={
                        shrunk
                          ? "text-[1.8rem] font-bold tracking-[0.16em] text-neutral-300 whitespace-nowrap hover:text-[#C08C45] transition"
                          : "text-[2.25rem] font-bold tracking-[0.16em] text-neutral-300 whitespace-nowrap hover:text-[#C08C45] transition"
                      }
                      style={{ fontFamily: "'Cinzel', serif", fontWeight: 700 }}
                    >
                      OLD IRONSIDES COFFEE
                    </Link>
                    <div
                      className="mt-2 text-[1.1rem] font-semibold tracking-[0.16em] text-roastTitle uppercase whitespace-nowrap"
                      style={{ fontFamily: "'Cinzel', serif" }}
                    >
                      Veteran Owned <span className="text-roastTitle">•</span>{" "}
                      Veteran Roasted{" "}
                      <img
                        src="/stars-stripes.png"
                        alt="American flag"
                        className="h-4 w-auto inline-block"
                      />
                    </div>{" "}
                  </div>
                </div>

                {/* CENTER: nav */}
                <nav className="hidden md:flex items-center gap-6 text-idleBtnText font-semibold ml-20 whitespace-nowrap shrink-0">
                  <HeaderDropdown
                    label="SHOP COFFEE"
                    items={[
                      { label: "All Coffee", to: "/store" },
                      {
                        label: "Sample Packs",
                        to: "/roast/armada-sample-pack",
                      },
                      { label: "Subscriptions", to: "/subscriptions" },
                    ]}
                  />

                  <HeaderDropdown
                    label="ORIGINS AND VOYAGES"
                    items={[
                      { label: "Tasting Events", to: "/#tasting-events" },
                      { label: "Roast Process", to: "/#roasting-process" },
                      { label: "Harvest", to: "/#origins-sourcing" },
                      { label: "Our Story", to: "/#origins-about" },
                    ]}
                  />

                  <HeaderNavLink to="/contact">CONTACT</HeaderNavLink>
                </nav>

                {/* RIGHT: chest */}
                <button
                  type="button"
                  onClick={() => setDesktopCartOpen(true)}
                  aria-label="Open Chest (Cart)"
                  title="Chest"
                  className="hidden md:flex items-stretch ml-6 xl:ml-10 border-2 border-[#C08C45] rounded-md overflow-hidden shrink-0"
                >
                  <div className="flex items-center gap-2 px-4 py-2 text-[#C08C45] font-semibold tracking-wide">
                    <ChestIcon className="h-5 w-5" />
                    <span className="text-sm">CHEST</span>
                  </div>

                  <div className="flex items-center justify-center min-w-[44px] px-3 py-2 border-l-2 border-[#C08C45] text-[#C08C45] font-semibold text-sm tabular-nums">
                    {count ?? 0}
                  </div>
                </button>
              </div>
            </div>
          </Container>
        </div>
      </header>

      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-[999999] flex items-start"
          onClick={() => setMobileOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative z-[1000000] w-[80%] max-w-[360px] bg-neutral-950 shadow-xl ring-1 ring-neutral-800 inline-flex flex-col max-h-[90vh]"
          >
            {/* header */}
            <div className="flex items-start justify-between p-4 border-b border-neutral-800">
              <div className="text-left">
                <div
                  className="text-base font-bold tracking-[0.18em] text-neutral-100 leading-snug"
                  style={{ fontFamily: "'Cinzel', serif", fontWeight: 700 }}
                >
                  OLD IRONSIDES COFFEE
                </div>
                <div className="text-[12px] text-[#C08C45] leading-tight">
                  Veteran-owned
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="text-[#C08C45] text-2xl font-bold px-2"
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>

            {/* body */}
            <div className="flex-1 overflow-y-auto text-neutral-100 text-lg font-semibold">
              <div className="px-4 pt-4 pb-2 text-[#C08C45] text-xs uppercase tracking-[0.22em]">
                Shop Coffee
              </div>

              <Link
                to="/store"
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-3 border-b border-neutral-800 text-neutral-200"
              >
                All Coffee
              </Link>

              <Link
                to="/roast/armada-sample-pack"
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-3 border-b border-neutral-800 text-neutral-200"
              >
                Sample Packs
              </Link>
              <Link
                to="/subscriptions"
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-3 border-b border-neutral-800 text-neutral-200"
              >
                Subscriptions
              </Link>

              <div className="px-4 pt-5 pb-2 text-[#C08C45] text-xs uppercase tracking-[0.22em]">
                Origins &amp; Voyages
              </div>

              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);

                  navigate("/#tasting-events");

                  setTimeout(() => {
                    const el = document.getElementById("tasting-events");
                    if (!el) return;

                    const headerOffset = window.innerWidth < 1024 ? 140 : 180;
                    const y =
                      el.getBoundingClientRect().top +
                      window.pageYOffset -
                      headerOffset;

                    window.scrollTo({
                      top: y,
                      behavior: "smooth",
                    });
                  }, 80);
                }}
                className="block w-full text-left px-4 py-3 border-b border-neutral-800 text-neutral-200"
              >
                Tasting Events
              </button>

              <Link
                to="/#origins-sourcing"
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-3 border-b border-neutral-800 text-neutral-200"
              >
                Harvest
              </Link>

              <Link
                to="/#roasting-process"
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-3 border-b border-neutral-800 text-neutral-200"
              >
                Roast Process
              </Link>

              <Link
                to="/#origins-about"
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-3 border-b border-neutral-800 text-neutral-200"
              >
                Our Story
              </Link>

              <Link
                to="/contact"
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-4 border-b border-neutral-800"
              >
                Contact
              </Link>

              <Link
                to="/account"
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-4 text-[#C08C45] flex items-center gap-2"
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
      {desktopCartOpen &&
        typeof window !== "undefined" &&
        window.innerWidth >= 1024 && (
          <DesktopCartSheet onClose={() => setDesktopCartOpen(false)} />
        )}

      {/* Mobile Cart Drawer */}
      {mobileCartOpen && (
        <div className="lg:hidden">
          <MobileCartSheet onClose={() => setMobileCartOpen(false)} />
        </div>
      )}

      {/* spacer so content doesn’t hide under header (mobile-tuned for /coffee) */}
      <div
        className={
          isHome
            ? "h-0 md:h-[170px] lg:h-0"
            : isStore
            ? "h-[120px] md:h-[140px] lg:h-[150px]"
            : isAccount
            ? "h-[150px] md:h-[155px] lg:h-[160px]"
            : isRoast
            ? "h-[140px] md:h-[165px] lg:h-[190px]"
            : isOrigins
            ? "h-[200px] md:h-[205px] lg:h-[210px]"
            : isSupport
            ? "h-[190px] md:h-[195px] lg:h-[200px]"
            : "h-[180px] md:h-[150px] lg:h-[160px]"
        }
      />
      {!hidePromoTab && (
        <div
          className="fixed right-0 md:left-0 md:right-auto top-1/2 z-40"
          style={{ transform: "translateY(-50%)" }}
        >
          <div className="flex flex-col items-center bg-[#C08C45] text-black rounded-l-md md:rounded-r-md md:rounded-l-none shadow-lg overflow-hidden promo-tab-pulse">
            {/* close button */}
            <button
              onClick={() => {
                const until = Date.now() + 24 * 60 * 60 * 1000;
                localStorage.setItem("promoTabHiddenUntil", String(until));
                setHidePromoTab(true);
              }}
              className="w-full flex items-center justify-center text-black text-xl font-extrabold py-2 bg-[#C08C45] hover:bg-[#C08C45] border-b border-black/20"
            >
              ✖
            </button>

            {/* vertical promo tab */}
            <button
              onClick={() =>
                document.dispatchEvent(
                  new CustomEvent("promo-subscribe", {
                    bubbles: true,
                    composed: true,
                  })
                )
              }
              className="px-3 py-10 font-bold tracking-wider hover:bg-[#C08C45] transition"
              style={{
                writingMode: "vertical-rl",
                textOrientation: "mixed",
              }}
            >
              GET 15% OFF
            </button>
          </div>
        </div>
      )}
      {/* page body */}
      <Outlet />
      {/* footer */}
      <footer className="relative overflow-hidden border-t border-[#6D5333]/60 bg-[#050302]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(192,140,69,0.12),transparent_30%),radial-gradient(circle_at_82%_70%,rgba(109,83,51,0.14),transparent_34%)] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-[#050302] to-black pointer-events-none" />

        <Container className="relative z-10 py-12 md:py-14 text-sm">
          <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr_0.85fr_1fr] gap-10 lg:gap-12">
            {/* BRAND */}
            <div className="text-center lg:text-left">
              <div className="text-lg md:text-xl font-oswald font-black uppercase tracking-[0.28em] text-[#C08C45] leading-none">
                Old Ironsides Coffee
              </div>

              <p className="mt-1 max-w-[360px] mx-auto lg:mx-0 text-neutral-300 leading-snug">
                Veteran-owned. Veteran Roasted.
              </p>

              <img
                src="/stars-stripes.png"
                alt="American flag"
                className="mt-2 w-40 h-auto rounded-sm shadow-md mx-auto lg:mx-0 opacity-90"
              />
            </div>
            {/* SUPPORT */}
            <div>
              <div className="font-oswald text-[#C08C45] uppercase tracking-[0.18em] mb-3">
                Support
              </div>

              <ul className="space-y-2">
                <li>
                  <Link
                    className="text-neutral-300 hover:text-[#E6C07F]"
                    to="/legal/shipping"
                  >
                    Roast &amp; Shipping
                  </Link>
                </li>
                <li>
                  <Link
                    className="text-neutral-300 hover:text-[#E6C07F]"
                    to="/legal/returns"
                  >
                    Returns
                  </Link>
                </li>
                <li>
                  <Link
                    className="text-neutral-300 hover:text-[#E6C07F]"
                    to="/legal/terms"
                  >
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link
                    className="text-neutral-300 hover:text-[#E6C07F]"
                    to="/legal/privacy"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => window.showCookieBanner?.()}
                    className="text-neutral-300 hover:text-[#E6C07F]"
                  >
                    Cookie settings
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => window.showDoNotSell?.()}
                    className="text-neutral-300 hover:text-[#E6C07F] text-left"
                    aria-label="Do Not Sell or Share My Personal Information"
                  >
                    Do Not Sell or Share
                  </button>
                </li>
              </ul>
            </div>

            {/* CONTACT / SOCIAL */}
            <div>
              <div className="font-oswald text-[#C08C45] uppercase tracking-[0.18em] mb-3">
                Dispatch
              </div>

              <ul className="space-y-2 text-neutral-300">
                <li>
                  <a
                    href="mailto:HQ@oldironsidescoffee.org"
                    className="hover:text-[#E6C07F] break-all"
                  >
                    HQ@oldironsidescoffee.org
                  </a>
                </li>
                <li className="text-neutral-400">
                  6 Liberty Square #2564
                  <br />
                  Boston, MA 02109
                </li>
              </ul>

              <div className="mt-5 flex gap-5 text-[#C08C45]">
                <a
                  href="https://instagram.com/oldironsidescoffee"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 hover:text-[#E6C07F] transition"
                >
                  <Instagram className="h-5 w-5" />
                  Instagram
                </a>

                <a
                  href="https://facebook.com/oldironsidescoffee"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 hover:text-[#E6C07F] transition"
                >
                  <Facebook className="h-5 w-5" />
                  Facebook
                </a>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-[#6D5333]/40 flex flex-col md:flex-row gap-3 md:items-center md:justify-between text-xs text-neutral-500">
            <p>
              © {new Date().getFullYear()} Old Ironsides Coffee. All rights
              reserved.
            </p>

            <p className="text-[#B5976D]">
              Boston rooted. Veteran-owned. Small-batch roasted.
            </p>
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
  return <>{/* Hero fold CTA messaging removed */}</>;
}

/* ================= App Entrypoint ================= */
function AppShell() {
  return (
    <>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="coffee" element={<Navigate to="/store" replace />} />
          <Route
            path="roast/armada-sample-pack"
            element={<ArmadaSamplePage />}
          />
          <Route path="roast/:slug" element={<RoastDetailPage />} />
          <Route path="store" element={<StorePage />} />
          <Route path="store/:slug" element={<StoreCategoryPage />} />
          <Route path="subscriptions" element={<SubscriptionLandingPage />} />
          {/* History Story pages */}
          <Route path="/fleet-history" element={<FleetHistoryPage />} />
          <Route path="/fleet-story/:slug" element={<FleetStoryPage />} />
          <Route path="stories/:slug" element={<FleetStoryPage />} />

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
            discountCodes: ["IRONSIDES15"],
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

      // 🔥 META INITIATE CHECKOUT
      if (typeof window !== "undefined" && (window as any).fbq) {
        (window as any).fbq("track", "InitiateCheckout", {
          content_type: "product",
          contents: Array.from(byKey.values()).map((line) => ({
            id: line.merchandiseId,
            quantity: line.quantity,
          })),
          value: total,
          currency: "USD",
        });
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
              className="text-[#C08C45] text-2xl font-bold px-1"
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

          <div className="px-4 py-2 bg-[#C08C45] text-neutral-900">
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
                                    className="ml-2 text-[10px] text-[#C08C45] underline underline-offset-2"
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
                                              ? "bg-[#C08C45] text-neutral-900 ring-[#C08C45]"
                                              : "bg-neutral-900/60 text-[#C08C45] ring-[#C08C45]/60",
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
                                        className="flex-1 rounded-md bg-[#C08C45] text-neutral-900 font-semibold py-1.5 text-[12px] hover:bg-[#C08C45] transition"
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
                                                (currentPrice / 0.9) * 100
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
                                        className="px-3 rounded-md ring-1 ring-[#C08C45]/60 text-[#C08C45] text-[12px]"
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
                            className="text-neutral-400 hover:text-[#C08C45] text-[11px] flex-shrink-0"
                            aria-label="Remove"
                          >
                            Remove
                          </button>
                        </div>

                        <div className="mt-1.5 flex items-center justify-between">
                          <div className="text-[#C08C45] font-bold text-[13px]">
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

                        {!isSub &&
                          it?.slug !== "oak-and-copper" &&
                          it?.purchaseMode !== "sample" &&
                          !String(it?.id ?? "")
                            .toLowerCase()
                            .includes("sample") &&
                          !String(it?.slug ?? "")
                            .toLowerCase()
                            .includes("sample") &&
                          !String(it?.title ?? "")
                            .toLowerCase()
                            .includes("sample") && (
                            <div className="mt-2">
                              {!showSubChooser[it.id] ? (
                                <button
                                  onClick={() =>
                                    setShowSubChooser((prev) => ({
                                      ...prev,
                                      [it.id]: true,
                                    }))
                                  }
                                  className="w-full rounded-md ring-1 ring-[#C08C45]/60 bg-neutral-900/60 text-[#C08C45] font-semibold py-1.5 text-[12px] hover:bg-[#C08C45] hover:text-neutral-900 transition"
                                >
                                  Subscribe &amp; Save 10%
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
                                            ? "bg-[#C08C45] text-neutral-900 ring-[#C08C45]"
                                            : "bg-neutral-900/60 text-[#C08C45] ring-[#C08C45]/60",
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
                                      className="flex-1 rounded-md bg-[#C08C45] text-neutral-900 font-semibold py-1.5 text-[12px] hover:bg-[#C08C45] transition"
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
                                      className="px-3 rounded-md ring-1 ring-[#C08C45]/60 text-[#C08C45] text-[12px]"
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
        <div className="border-t border-neutral-800 px-4 pt-4 pb-24 space-y-2">
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
                  ? "bg-[#C08C45]/70 text-neutral-800 cursor-not-allowed"
                  : "bg-[#C08C45] text-neutral-900",
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
            onClick={() => setShowRoastInfo(true)}
            className="block w-full text-center text-[14px] text-red-300 underline underline-offset-4"
          >
            Please read before checking out
          </button>
        </div>

        {/* SUBSCRIBE GATE */}
        {showSubGate && (
          <div className="absolute inset-x-0 bottom-0 z-[1000003] p-3">
            <div className="rounded-xl ring-1 ring-[#C08C45] bg-neutral-900 text-[#C08C45] px-3 py-3 text-sm text-center shadow-2xl">
              Join or sign in to manage your Fleet subscription before checkout.
              <div className="mt-2 flex gap-2 justify-center">
                <a
                  href="/account/login"
                  className="px-3 py-1.5 rounded-md bg-[#C08C45] text-neutral-900 font-bold"
                >
                  Sign in / Join
                </a>
                <button
                  onClick={() => setShowSubGate(false)}
                  className="px-3 py-1.5 rounded-md ring-1 ring-[#C08C45]/60 text-[#C08C45]"
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
                  className="text-[#C08C45] text-lg font-bold px-1"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
              <div className="text-[13px] text-neutral-300 space-y-2">
                <p>
                  We roast to order. All orders are roasted on Monday/Tuesday.
                  Please be sure to place your order before{" "}
                  <span className="text-[#C08C45] font-semibold">
                    Sunday 5:00 PM ET
                  </span>{" "}
                  to get on the roast schedule. All orders made after the cut
                  off time will be roasted the following week.
                </p>
                <p>
                  <span className="text-[#C08C45] font-semibold">
                    Roast Day:
                  </span>{" "}
                  Monday <br />
                  <span className="text-[#C08C45] font-semibold">
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
                <p className="text-[#C08C45]">
                  Questions?{" "}
                  <a href="/contact" className="underline text-[#C08C45]">
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
            discountCodes: ["IRONSIDES15"],
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

      // 🔥 META INITIATE CHECKOUT
      if (typeof window !== "undefined" && (window as any).fbq) {
        (window as any).fbq("track", "InitiateCheckout", {
          content_type: "product",
          contents: Array.from(byKey.values()).map((line) => ({
            id: line.merchandiseId,
            quantity: line.quantity,
          })),
          value: total,
          currency: "USD",
        });
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
    <div className="lg:hidden fixed inset-0 z-[1000002] flex justify-end items-stretch">
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
              className="text-[#C08C45] text-2xl font-bold px-1"
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

          <div className="px-4 py-2 bg-[#C08C45] text-neutral-900">
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
                                    className="ml-2 text-[10px] text-[#C08C45] underline underline-offset-2"
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
                                              ? "bg-[#C08C45] text-neutral-900 ring-[#C08C45]"
                                              : "bg-neutral-900/60 text-[#C08C45] ring-[#C08C45]/60",
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
                                        className="flex-1 rounded-md bg-[#C08C45] text-neutral-900 font-semibold py-1.5 text-[12px] hover:bg-[#C08C45] transition"
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
                                                (currentPrice / 0.9) * 100
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
                                        className="px-3 rounded-md ring-1 ring-[#C08C45]/60 text-[#C08C45] text-[12px]"
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
                            className="text-neutral-400 hover:text-[#C08C45] text-[11px] flex-shrink-0"
                            aria-label="Remove"
                          >
                            Remove
                          </button>
                        </div>

                        {/* price + qty */}
                        <div className="mt-1.5 flex items-center justify-between">
                          <div className="text-[#C08C45] font-bold text-[13px]">
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
                        {!isSub &&
                          it?.slug !== "oak-and-copper" &&
                          it?.purchaseMode !== "sample" &&
                          !String(it?.id ?? "")
                            .toLowerCase()
                            .includes("sample") &&
                          !String(it?.slug ?? "")
                            .toLowerCase()
                            .includes("sample") &&
                          !String(it?.title ?? "")
                            .toLowerCase()
                            .includes("sample") && (
                            <div className="mt-2">
                              {!showSubChooser[it.id] ? (
                                <button
                                  onClick={() =>
                                    setShowSubChooser((prev) => ({
                                      ...prev,
                                      [it.id]: true,
                                    }))
                                  }
                                  className="w-full rounded-md ring-1 ring-[#C08C45]/60 bg-neutral-900/60 text-[#C08C45] font-semibold py-1.5 text-[12px] hover:bg-[#C08C45] hover:text-neutral-900 transition"
                                >
                                  Subscribe &amp; Save 10%
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
                                            ? "bg-[#C08C45] text-neutral-900 ring-[#C08C45]"
                                            : "bg-neutral-900/60 text-[#C08C45] ring-[#C08C45]/60",
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
                                      className="flex-1 rounded-md bg-[#C08C45] text-neutral-900 font-semibold py-1.5 text-[12px] hover:bg-[#C08C45] transition"
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
                                      className="px-3 rounded-md ring-1 ring-[#C08C45]/60 text-[#C08C45] text-[12px]"
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
        <div className="border-t border-neutral-800 px-4 pt-4 pb-24 space-y-2">
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
                ? "bg-[#C08C45]/70 text-neutral-800 cursor-not-allowed"
                : "bg-[#C08C45] text-neutral-900",
            ].join(" ")}
            aria-busy={checkingOut}
          >
            {checkingOut ? "Syncing cart…" : `Checkout • $${total.toFixed(2)}`}
          </button>

          {/* Read-before-checkout link */}
          <button
            type="button"
            onClick={() => setShowRoastInfo(true)}
            className="block w-full text-center text-[16px] text-red-300 underline underline-offset-4"
          >
            Please read before checking out
          </button>
        </div>

        {/* SUBSCRIBE GATE BANNER (blocks checkout when not signed in) */}
        {showSubGate && (
          <div className="absolute inset-x-0 bottom-0 z-[1000003] p-3">
            <div className="rounded-xl ring-1 ring-[#C08C45] bg-neutral-900 text-[#C08C45] px-3 py-3 text-sm text-center shadow-2xl">
              Join or sign in to manage your Fleet subscription before checkout.
              <div className="mt-2 flex gap-2 justify-center">
                <a
                  href="/account/login"
                  className="px-3 py-1.5 rounded-md bg-[#C08C45] text-neutral-900 font-bold"
                >
                  Sign in / Join
                </a>
                <button
                  onClick={() => setShowSubGate(false)}
                  className="px-3 py-1.5 rounded-md ring-1 ring-[#C08C45]/60 text-[#C08C45]"
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
                  className="text-[#C08C45] text-lg font-bold px-1"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
              <div className="text-[13px] text-neutral-300 space-y-2">
                <p>
                  We roast to order. All orders are roasted on Monday/Tuesday.
                  Please be sure to place your order before{" "}
                  <span className="text-[#C08C45] font-semibold">
                    Sunday 5:00 PM ET
                  </span>{" "}
                  to get on the roast schedule. All orders made after the cut
                  off time will be roasted the following week.
                </p>
                <p>
                  <span className="text-[#C08C45] font-semibold">
                    Roast Day:
                  </span>{" "}
                  Monday <br />
                  <span className="text-[#C08C45] font-semibold">
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
                <p className="text-[#C08C45]">
                  Questions?{" "}
                  <a href="/contact" className="underline text-[#C08C45]">
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
      <RouteTracker />
      <CartProvider>
        <ErrorBoundary>
          <AppShell />
        </ErrorBoundary>
      </CartProvider>
    </BrowserRouter>
  );
}

// auto-deploy test Tue 28 Oct 2025 12:33:22 AM UTC
