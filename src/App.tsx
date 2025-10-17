import React, {
  useState,
  useMemo,
  useContext,
  createContext,
  useEffect,
  useRef,
} from "react";
import {
  MemoryRouter,
  Routes,
  Route,
  Link,
  useLocation,
  Outlet,
  useNavigate,
  useParams,
} from "react-router-dom";
import { DateTime } from "luxon";
// ---------- TESTIMONIAL REVIEWS (8 per page UI) ----------
type Review = {
  id: string;
  name: string;
  date: string; // "October 3, 2025"
  rating: number; // 1..5
  title?: string;
  body: string;
};

/* ================= Flash Toast (global 2s banner) ================= */
function FlashToast() {
  const [msg, setMsg] = React.useState("");
  const [show, setShow] = React.useState(false);

  React.useEffect(() => {
    const onFlash = (e: any) => {
      setMsg(String((e as CustomEvent).detail || ""));
      setShow(true);
      const t = setTimeout(() => setShow(false), 2000);
      return () => clearTimeout(t);
    };
    window.addEventListener("flash", onFlash as any);
    return () => window.removeEventListener("flash", onFlash as any);
  }, []);

  return (
    <div
      className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] transition-all duration-200 ${
        show
          ? "opacity-100 scale-100"
          : "opacity-0 scale-95 pointer-events-none"
      }`}
    >
      <div
        className="rounded-lg bg-amber-400/95 px-4 py-2 text-neutral-900 font-semibold shadow-xl"
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
const Youtube = (p?: any) => (
  <svg viewBox="0 0 24 24" {...iconBase(p)}>
    <path d="M22.54 6.42A2.78 2.78 0 0020.77 4.7C19.2 4.25 12 4.25 12 4.25s-7.2 0-8.77.45A2.78 2.78 0 001.46 6.42 29.94 29.94 0 001 12a29.94 29.94 0 00.46 5.58 2.78 2.78 0 001.77 1.72C4.8 19.75 12 19.75 12 19.75s7.2 0 8.77-.45a2.78 2.78 0 001.77-1.72A29.94 29.94 0 0023 12a29.94 29.94 0 00-.46-5.58z" />
    <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" />
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

/* ================= Data ================= */
const roastCards = [
  {
    id: "flagship-12oz-ground",
    slug: "flagship",
    title: "Flagship",
    subTitle: "Medium Roast",
    note: "Balanced, Enduring, Everyday",
    img: "Flagship-web.png",
    price: 22.0,
    canBuy: true,
    variant: "12oz • Ground",
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
      "Launched in 1797, the heavy frigate earned the nickname ‘Old Ironsides’ in the War of 1812 after enemy cannonballs allegedly bounced off her tough live-oak hull.",
  },
  {
    id: "baptism-dark-12oz-ground",
    slug: "baptism-by-fire",
    title: "Baptism by Fire",
    subTitle: "Dark Roast",
    note: "Bold, Smooth, Unyielding",
    img: "baptism-web.png",
    price: 22.0,
    canBuy: true,
    variant: "12oz • Ground",
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
      "In August 1812, Constitution fought HMS Guerriere. The British frigate was reduced to a dismasted wreck in thirty minutes — America’s first great frigate victory.",
  },
  {
    id: "java-action-12oz-ground",
    slug: "java-action",
    title: "The Java Action",
    subTitle: "Medium Roast",
    note: "Captivating, Decisive Finish.",
    img: "java-web.png",
    price: 22.0,
    canBuy: true,
    variant: "12oz • Ground",
    battleDate: "December 29, 1812",
    storyTitle: (
      <>
        <div className="text-2xl font-bold text-amber-300">The Java Action</div>
        <div className="text-white text-base">USS Constitution vs HMS Java</div>
      </>
    ),
    story:
      "In December 1812, Constitution met HMS Java off Brazil. After a fierce duel, Constitution dismasted and captured Java — a defining American naval victory.",
  },
  {
    id: "oak-copper-coming-soon",
    slug: "oak-and-copper",
    title: "Oak & Copper",
    subTitle: "Medium Roast",
    note: "Bourbon barrel-aged seasonal.",
    img: "oak-copper-deck.png",
    price: 0,
    canBuy: false,
    variant: "Limited Release",
    battleDate: "Design Era 1790s",
    storyTitle: (
      <>
        <div className="text-2xl font-bold text-amber-300">Oak & Copper</div>
        <div className="text-white text-base">Bones of Oak, Skin of Copper</div>
      </>
    ),
    story:
      "A nod to live-oak planking and copper sheathing that made American frigates rugged, fast, and seaworthy across unforgiving oceans. Barrel beans aging now. Limited batch. Join the Fleet to secure your share.",
  },
];

/* ================= Cart Context ================= */
const CartCtx = createContext<any>(null);
function useCart() {
  const ctx = useContext(CartCtx);
  return (
    ctx ?? {
      cart: [],
      add: () => {},
      inc: () => {},
      dec: () => {},
      remove: () => {},
      clear: () => {},
      count: 0,
      subtotal: 0,
    }
  );
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
  const persist = (next: any[]) => {
    setCart(next);
    try {
      localStorage.setItem("oi_cart", JSON.stringify(next));
    } catch {}
  };
  const count = useMemo(
    () => cart.reduce((s: number, i: any) => s + i.qty, 0),
    [cart]
  );
  const subtotal = useMemo(
    () => cart.reduce((s: number, i: any) => s + i.price * i.qty, 0),
    [cart]
  );
  const add = (item: any, qty = 1) => {
    // Make variants unique in the cart by encoding beanType into the stored id
    const variantLabel =
      item?.beanType === "whole"
        ? "Whole Bean"
        : item?.beanType === "ground"
        ? "Ground"
        : null;

    const storedId = variantLabel
      ? `${String(item.id)}__${item.beanType}`
      : String(item.id);

    // Ensure the title shows the bean type in the cart/checkout
    const displayTitle =
      variantLabel &&
      typeof item.title === "string" &&
      !item.title.includes("(")
        ? `${item.title} (${variantLabel})`
        : item.title;

    const normalized = {
      ...item,
      id: storedId, // unique per bean type
      sku: item.sku || storedId, // fallback SKU
      title: displayTitle, // include bean type in title
    };

    persist(
      (() => {
        const copy = [...cart];
        const idx = copy.findIndex((x) => x.id === normalized.id);
        if (idx >= 0) {
          copy[idx] = { ...copy[idx], qty: copy[idx].qty + qty };
        } else {
          copy.push({ ...normalized, qty });
        }
        return copy;
      })()
    );
  };

  const inc = (id: string) =>
    persist(cart.map((x: any) => (x.id === id ? { ...x, qty: x.qty + 1 } : x)));
  const dec = (id: string) =>
    persist(
      cart
        .map((x: any) =>
          x.id === id ? { ...x, qty: Math.max(0, x.qty - 1) } : x
        )
        .filter((x: any) => x.qty > 0)
    );
  const remove = (id: string) => persist(cart.filter((x: any) => x.id !== id));
  const clear = () => persist([]);
  const value = { cart, add, inc, dec, remove, clear, count, subtotal };
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
    <div className={`flex items-center gap-4 ${className ?? ""}`}>
      <img
        src={img}
        alt="row art"
        className={`w-[12.5rem] h-[15rem] md:w-[13.75rem] md:h-[16.25rem] translate-y-4 md:translate-y-6 transform rounded-xl object-cover ring-1 ring-amber-500 shadow-2xl shadow-black/30 ${
          imgClassName ?? ""
        }`}
      />
      <div
        className={`text-[1.20rem] md:text-[1.6rem] leading-snug ${
          tone ?? ""
        } font-bold`}
        style={{ fontFamily: "'Cinzel', serif", fontWeight: 700 }}
      >
        {text}
      </div>
    </div>
  );
}

function RingThatBellBox() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const submit = (e: any) => {
    e.preventDefault();
    if (!emailOk(email)) return alert("Enter a valid email.");
    setSubmitted(true);
  };
  return (
    <section className="py-10 md:py-14 border-b border-neutral-800">
      <Container>
        <div className="max-w-xl mx-auto rounded-2xl ring-1 ring-amber-400/60 bg-neutral-900/60 p-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Bell className="h-11 w-11 text-amber-300" />
            <h3 className="text-4xl font-extrabold text-amber-300">
              Ring That Bell
            </h3>
          </div>
          <p className="text-neutral-300 mb-5 text-lg md:text-xl">
            Join the Fleet and save 15%
          </p>

          <form
            onSubmit={submit}
            className="flex justify-center gap-3 max-w-md mx-auto"
          >
            <input
              type="email"
              autoComplete="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@domain.com"
              className="flex-1 rounded-xl bg-neutral-900/70 border border-neutral-700 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <button className="px-6 py-3 rounded-xl bg-amber-400 text-neutral-900 font-semibold hover:bg-amber-300">
              Join
            </button>
          </form>
          <div className="mt-8 text-s text-neutral-400">
            Already a member?{" "}
            <Link
              to="/account/login"
              className="text-amber-300 hover:underline"
            >
              Sign in
            </Link>
          </div>

          {submitted && (
            <p className="mt-3 text-sm text-emerald-400">
              Welcome aboard — your discount is on the way.
            </p>
          )}
        </div>
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
}: {
  email: string;
  setEmail: (v: string) => void;
  done: boolean;
  onSubmit: (e: any) => void;
  title?: string;
  subtitle?: string;
  buttonText?: string;
}) {
  const heading = title ?? "Ring That Bell";
  const sub = subtitle ?? "Join the Fleet and save 15%";
  const btn = buttonText ?? "Join";

  return (
    <div className="w-full lg:w-[36rem]">
      <div className="rounded-2xl ring-1 ring-amber-400/60 bg-neutral-900/60 p-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-3">
          <Bell className="h-7 w-7 text-amber-300" />
          <h3 className="text-2xl font-extrabold text-amber-300">{heading}</h3>
        </div>
        <p className="text-neutral-300 mb-5 text-lg md:text-xl">{sub}</p>

        <form
          onSubmit={onSubmit}
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
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@domain.com"
            className="flex-1 rounded-xl bg-neutral-900/70 border border-neutral-700 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <button className="px-6 py-3 rounded-xl bg-amber-400 text-neutral-900 font-semibold hover:bg-amber-300">
            {btn}
          </button>
        </form>
        <div className="mt-3 text-xs text-neutral-400">
          Already a member?{" "}
          <Link to="/account/login" className="text-amber-300 hover:underline">
            Sign in
          </Link>
        </div>

        {done && (
          <p className="mt-3 text-sm text-emerald-400">
            Welcome aboard — your discount is on the way.
          </p>
        )}
      </div>
    </div>
  );
}
function CompactSubscribeBox() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOk(email)) return alert("Enter a valid email.");
    setDone(true);
    // TODO: integrate with your ESP/signup endpoint
  };

  return (
    <div className="rounded-2xl ring-1 ring-amber-400/60 bg-neutral-900/60 p-5 text-center">
      <div className="flex items-center justify-center gap-2 mb-2">
        <Bell className="h-5 w-5 text-amber-300" />
        <h4 className="text-lg font-extrabold text-amber-300">
          Ring That Bell
        </h4>
      </div>
      <p className="text-neutral-300 text-sm mb-3">
        Join the Fleet and save 15%
      </p>
      <form onSubmit={onSubmit} className="flex gap-2">
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@domain.com"
          className="flex-1 rounded-lg bg-neutral-900/70 border border-neutral-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
        <button className="px-4 py-2 rounded-lg bg-amber-400 text-neutral-900 text-sm font-semibold hover:bg-amber-300">
          Join
        </button>
      </form>
      <div className="mt-2 text-[11px] text-neutral-400">
        Already a member?{" "}
        <Link to="/account/login" className="text-amber-300 hover:underline">
          Sign in
        </Link>
      </div>
      {done && (
        <p className="mt-2 text-xs text-emerald-400">
          Welcome aboard — your discount is on the way.
        </p>
      )}
    </div>
  );
}

function GovXLoginBox() {
  return (
    <div className="rounded-2xl ring-1 ring-amber-400/60 bg-neutral-900/60 p-5 text-center">
      <div className="flex items-center justify-center gap-2 mb-2">
        {/* reuse Bell or swap to a shield icon if you add one later */}
        <Bell className="h-5 w-5 text-amber-300" />
        <h4 className="text-lg font-extrabold text-amber-300">GovX Login</h4>
      </div>
      <p className="text-neutral-300 text-sm">
        Enjoy <span className="font-semibold text-amber-300">15% off</span> both
        coffee and merch — plus{" "}
        <span className="font-semibold text-amber-300">$1 extra per bag</span>{" "}
        is donated to trusted organizations that help veterans.
      </p>
      <button
        // TODO: point this to your GovX verification route or modal
        onClick={() => window.location.assign("/account?govx=1")}
        className="mt-3 w-full px-4 py-2 rounded-lg bg-amber-400 text-neutral-900 text-sm font-semibold hover:bg-amber-300"
        aria-label="Verify with GovX"
      >
        Verify with GovX
      </button>
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
      alert("Enter a valid email.");
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
        placeholder="you@domain.com"
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
  return (
    <section
      id="fleet"
      className={`relative overflow-hidden ${
        isHome
          ? "py-10 md:py-14 min-h-[820px]" // HOME size
          : isStore
          ? "py-10 md:py-14 min-h-[1000px]" // STORE size
          : "py-12 md:py-20 min-h-[1100px]" // default elsewhere
      }`}
    >
      {/* Background image just for this section */}
      {!noBg && (
        <img
          src="/old-boston-harbor.png"
          alt="Boston Harbor backdrop"
          className="absolute inset-0 w-full h-full object-cover opacity-40 -z-0"
        />
      )}
      <Container className={`relative z-10 ${isStore ? "pt-10 md:pt-16" : ""}`}>
        <div className="flex items-start justify-between">
          <SectionTitle
            title={
              <span
                className="text-3xl md:text-5xl font-bold text-amber-300 tracking-tight whitespace-nowrap"
                style={{ fontFamily: "'Cinzel', serif", fontWeight: 700 }}
              >
                LAUNCHED FROM THE HARBOR
              </span>
            }
            subtitle={
              <>
                <div className="text-neutral-300 font-normal mb-4 text-lg md:text-xl tracking-tight">
                  Our premium roasts, crafted for modern legends.
                </div>
                <div className="text-amber-300 font-normal text-lg md:text-xl tracking-tight">
                  Choose your roast from the fleet.
                </div>
              </>
            }
          />

          {!isHome && <BackButton size="sm" />}
        </div>

        <div className="mt-2 grid md:grid-cols-4 gap-6">
          {roastCards.map((card) => (
            <Link
              key={card.id}
              to={`/roast/${card.slug}`}
              aria-label={`${card.title} details`}
              className="group relative overflow-hidden rounded-2xl ring-1 ring-amber-400/60 hover:ring-amber-300 bg-neutral-900/40 hover:bg-neutral-900 transition shadow-lg shadow-amber-400/10 flex flex-col"
            >
              <img
                src={card.img}
                alt={card.title}
                className="h-80 sm:h-96 md:h-[28rem] w-full object-cover"
              />

              <div className="p-5 flex flex-col flex-1">
                <h3
                  className="text-3xl md:text-4xl font-extrabold text-amber-300"
                  style={{ fontFamily: "'Cinzel', serif", fontWeight: 800 }}
                >
                  {card.title}
                </h3>
                <p className="text-[1.15rem] italic text-neutral-500">
                  {card.subTitle}
                </p>

                <p className="text-lg text-neutral-400 flex-1">{card.note}</p>

                <div className="mt-4 flex items-center gap-3">
                  <div className="text-m font-semibold text-amber-400">
                    From{" "}
                    {fmt(
                      card.slug === "oak-and-copper" ? 25 : card.price ?? 22
                    )}
                  </div>

                  <div className="text-m text-neutral-300">
                    12 oz. Ground/Whole Bean
                  </div>
                </div>
              </div>
            </Link>
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
      className="py-12 border-t border-neutral-800"
    >
      <Container>
        <div className="max-w-xl mx-auto rounded-2xl ring-1 ring-amber-400/60 bg-neutral-900/60 p-8 text-center">
          <h3 className="text-2xl font-extrabold text-amber-300">SDVOSB</h3>
          <p className="text-neutral-300 mt-2">
            Government contract information.
          </p>
          <Link
            to="/sdvosb"
            className="inline-block mt-4 px-4 py-2 rounded-lg bg-amber-400 text-neutral-900 font-semibold hover:bg-amber-300"
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
        className="relative overflow-hidden border-b border-neutral-800"
      >
        <img
          src="emblem-black.png"
          alt="Stormy sea"
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] max-w-[900px] object-contain opacity-10 pointer-events-none select-none"
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,193,7,0.10),transparent_60%)]" />
        <div className="absolute inset-0 bg-neutral-950/10 mix-blend-multiply" />

        <Container className="relative py-14 md:py-18">
          <div className="grid md:grid-cols-12 gap-8 items-start">
            {/* LEFT COLUMN — photo, then headline/subline/CTA */}
            <div className="md:col-span-7">
              <div className="space-y-0">
                <div className="relative z-0 transform scale-110 origin-center">
                  <div className="inline-flex flex-col items-start">
                    {/* INTRO PHOTO — lower it slightly for breathing room from banner */}
                    <img
                      src="bean-smell.png"
                      alt="Smelling beans"
                      className="self-start w-[15.125rem] h-[18.975rem] md:w-[16.6375rem] md:h-[20.55625rem] translate-y-6 md:translate-y-8 rounded-xl object-cover ring-1 ring-amber-500 shadow-2xl shadow-black/30"
                    />

                    {/* bring photo down tighter to headline */}
                    <div aria-hidden className="h-8 md:h-10" />

                    {/* 1) HEADLINE */}
                    <h2
                      className="text-amber-400 font-extrabold leading-snug tracking-tight text-[1.7rem] md:text-[2.1rem]"
                      style={{ fontFamily: "'Cinzel', serif" }}
                    >
                      PREMIUM, SMALL-BATCH COFFEE
                    </h2>

                    <div className="mt-1 text-neutral-300 text-sm md:text-lg">
                      <span>Ethically Sourced</span>
                      <span className="mx-1.5 text-amber-400/70" aria-hidden>
                        •
                      </span>
                      <span>Roasted to Order</span>
                      <span className="mx-1.5 text-amber-400/70" aria-hidden>
                        •
                      </span>
                      <span>Veteran-owned</span>
                      <span className="mx-1.5 text-amber-400/70" aria-hidden>
                        •
                      </span>
                      <a
                        href="/govx" /* swap to your real GovX URL if needed */
                        className="text-amber-200/90 hover:text-amber-300 hover:underline underline-offset-2"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        GovX Partner
                      </a>
                    </div>

                    <div aria-hidden className="h-5 md:h-6" />
                    <div className="w-full max-w-[24rem]">
                      <Link
                        to="/coffee"
                        className="w-full inline-flex items-center justify-center gap-2 px-8 py-4 
           rounded-xl bg-neutral-900 text-amber-400 font-extrabold text-lg md:text-2xl tracking-wide
           border border-amber-500 shadow-xl shadow-amber-500/20 
           hover:bg-amber-400 hover:text-neutral-900 transition-all duration-200"
                      >
                        <span aria-hidden>⚓</span>
                        SHOP COFFEE NOW
                      </Link>
                      <RoastCTAInfo />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN — officer image (unchanged) */}
            <div className="md:col-span-5 self-start">
              <div className="inline-block ml-0 md:ml-[12%] rounded-3xl overflow-hidden ring-1 ring-amber-400/40 shadow-2xl shadow-amber-500/20">
                <img
                  src="officer-window.png"
                  alt="Old Ironsides hero"
                  className="
              block
              w-auto
              h-auto
              max-w-full
              max-h-[calc(100vh-340px)]
              md:max-h-[calc(100vh-300px)]
              object-contain
            "
                />
              </div>
            </div>
          </div>
        </Container>
      </header>

      <LaunchedFromHarbor noBg />
      <RingThatBellBox />
      {/* ===== GIVING BACK (copied from Origins) ===== */}
      <section className="relative overflow-hidden border-t border-neutral-800">
        <img
          src="/flags-ground.jpg"
          alt="Giving back backdrop"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-30 z-0 pointer-events-none"
        />
        <div className="absolute inset-0 bg-neutral-950/40 z-0 pointer-events-none" />

        <Container>
          <div className="relative z-10 min-h-[600px] md:min-h-[700px] py-12 md:py-16 flex flex-col items-center justify-center text-center">
            <div className="grid grid-cols-1 md:grid-cols-[auto,1fr] gap-4 md:gap-6 items-center">
              <div className="justify-self-center self-center">
                <div className="w-64 md:w-[32rem] mx-auto aspect-square rounded-xl overflow-hidden ring-1 ring-amber-400 bg-neutral-900/50">
                  <img
                    src="/veteran-chair.jpg"
                    alt="Giving back"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="font-cinzel text-3xl md:text-4xl font-extrabold text-amber-300 tracking-wide uppercase">
                  Giving Back To Those Who Served
                </h3>
                <p className="text-neutral-300 text-xl md:text-2xl leading-relaxed tracking-[0.02em]">
                  Even as a startup with thin profits, giving back is at the
                  core of Old Ironsides Coffee. As a combat veteran, I believe
                  supporting organizations that focus on veterans’ health and
                  well-being is not optional, it is who we are. <br /> <br />{" "}
                  With every bag sold, we donate a portion of profits to trusted
                  organizations that provide real help to the veterans who need
                  it most.
                </p>
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
          <div className="mt-8 grid md:grid-cols-3 gap-6 text-sm">
            <div className="rounded-2xl ring-1 ring-neutral-800 bg-neutral-900/40 p-6">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-amber-300" />
                <span className="text-neutral-300">
                  HQ@oldironsidescoffee.org
                </span>
              </div>
              <div className="mt-2 flex items-center gap-3">
                <Phone className="h-5 w-5 text-amber-300" />
                <span className="text-neutral-300">(—) ——— ————</span>
              </div>
              <div className="mt-2 text-neutral-400">
                6 Liberty Square #2564, Boston, MA 02109
              </div>
            </div>
            <div className="rounded-2xl ring-1 ring-neutral-800 bg-neutral-900/40 p-6">
              <h4 className="font-semibold text-amber-300">Follow</h4>
              <div className="mt-3 flex gap-4 text-neutral-300">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 hover:text-amber-300"
                >
                  <Instagram className="h-5 w-5" />
                  Instagram
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 hover:text-amber-300"
                >
                  <Youtube className="h-5 w-5" />
                  YouTube
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 hover:text-amber-300"
                >
                  <span className="h-5 w-5 grid place-content-center">f</span>
                  Facebook
                </button>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <SDVOSBHighlight />
    </>
  );
}
function ShopCoffeeCard({ className = "" }: { className?: string }) {
  const flagship = roastCards.find((c) => c.slug === "flagship");
  return (
    <Link
      to="/coffee"
      className={[
        "group relative inline-block align-top overflow-hidden rounded-xl",
        "ring-1 ring-amber-500 shadow-2xl shadow-black/30",
        // EXACTLY mirror the intro photo sizes
        "w-[12.5rem] h-[15rem] md:w-[13.75rem] md:h-[16.25rem]",
        // subtle lift to visually align with intro image’s translate-y
        "translate-y-4 md:translate-y-6",
        "bg-neutral-900/40 hover:bg-neutral-900 transition",
        className,
      ].join(" ")}
    >
      <img
        src={flagship?.img || "Flagship-web.png"}
        alt="Shop Coffee"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-x-0 bottom-0 p-3 bg-neutral-950/40 backdrop-blur-sm">
        <div className="text-center text-lg md:text-xl text-amber-300 font-bold group-hover:underline">
          SHOP COFFEE
        </div>
      </div>
    </Link>
  );
}

function FleetPage() {
  return (
    <main className="py-6 md:py-8">
      <LaunchedFromHarbor />
    </main>
  );
}

function FleetStoryPage() {
  const { slug } = useParams();
  const card = roastCards.find((c) => c.slug === slug);
  if (!card) return <NotFoundPage />;
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <main className="relative py-12 md:py-20 overflow-hidden">
      <img
        src="/maps-books.png"
        alt="Fleet story backdrop"
        className="absolute inset-0 w-full h-full object-cover opacity-40 z-0"
      />
      <Container className="relative z-10">
        <div className="flex items-start justify-between">
          <SectionTitle
            title={card.storyTitle}
            subtitle={
              <span className="text-amber-300 font-semibold">
                {card.battleDate}
              </span>
            }
          />
          <BackButton size="sm" />
        </div>
        <div className="mt-6 grid md:grid-cols-2 gap-8 items-start">
          <img
            src={card.img}
            alt={card.title}
            className="w-full h-[420px] object-cover rounded-2xl ring-1 ring-neutral-800"
          />
          <div className="space-y-4">
            <p className="text-neutral-300 text-lg leading-relaxed">
              {card.story}
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-40 rounded-xl ring-1 ring-neutral-800 bg-neutral-900/50 grid place-content-center text-neutral-500 text-sm">
                Add Image
              </div>
              <div className="h-40 rounded-xl ring-1 ring-neutral-800 bg-neutral-900/50 grid place-content-center text-neutral-500 text-sm">
                Add Image
              </div>
            </div>
            <div className="mt-2 text-sm text-neutral-400">
              Variant: {card.variant}
            </div>
          </div>
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
  };

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
        From the volcanic highlands of El Salvador to the islands of Indonesia,
        Flagship is a balanced roast, smooth, reliable, and crafted for those
        who lead from the front.
      </>
    ),
    "baptism-by-fire": (
      <>
        From the fertile soils of Sumatra to the mountains of Colombia, Baptism
        by Fire is a dark roast, bold, smooth, and forged for those who thrive
        under pressure.
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
        Aged in American bourbon barrels, Oak &amp; Copper is a full-bodied
        roast with deep oak richness and a smooth, bourbon-kissed finish.
      </>
    ),
  };
  const craftSubtitle = craftSubtitleMap[card.slug] ?? null;

  // Roast flags
  const isFlagship = card.slug === "flagship";
  const isBaptism = card.title === "Baptism by Fire";
  const isJava = card.slug === "java-action";
  const isOak = card.slug === "oak-and-copper";

  // ⬇️ INSERT THIS BLOCK RIGHT HERE ⬇️
  const AMBER_DESC = isFlagship
    ? "Our everyday staple, Flagship is a breakfast-style medium roast that is smooth, reliable, and never bitter. A roast you can reach for day after day."
    : isBaptism
    ? "Our darkest and most intense roast in the fleet — full-bodied and unyielding, with a finish so smooth you have to taste it to believe it."
    : isOak
    ? "Oak & Copper pours a steady bourbon barrel aged cup of caramel, warm vanilla, and toasted oak with a calm finish you’ll want every morning."
    : "";

  // review data used for stars + counts beside the subtitle and in the histogram
  const reviewDataBySlug: Record<
    string,
    { avg: number; count: number; breakdown: Record<number, number> }
  > = {
    flagship: {
      avg: 4.9,
      count: 128,
      breakdown: { 5: 110, 4: 12, 3: 4, 2: 1, 1: 1 },
    },
    "baptism-by-fire": {
      avg: 4.8,
      count: 96,
      breakdown: { 5: 80, 4: 10, 3: 4, 2: 1, 1: 1 },
    },
    "java-action": {
      avg: 4.7,
      count: 64,
      breakdown: { 5: 50, 4: 9, 3: 3, 2: 1, 1: 1 },
    },
    "oak-and-copper": {
      avg: 4.9,
      count: 72,
      breakdown: { 5: 62, 4: 7, 3: 2, 2: 1, 1: 0 },
    },
  };

  const reviewData = reviewDataBySlug[card.slug] ?? {
    avg: 0,
    count: 0,
    breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  };

  const reviewListBySlug: Record<string, Review[]> = {
    flagship: [
      {
        id: "f1",
        name: "Jacob S.",
        date: "October 12, 2025",
        rating: 5,
        title: "Best flavor",
        body: "Smooth, balanced, never bitter. This is my daily cup.",
      },
      {
        id: "f2",
        name: "Megan T.",
        date: "October 9, 2025",
        rating: 5,
        body: "Great with cream or black. Reliable roast.",
      },
      {
        id: "f3",
        name: "Paul R.",
        date: "October 7, 2025",
        rating: 4,
        body: "Nice balance. Would buy again.",
      },
      {
        id: "f4",
        name: "Nate D.",
        date: "October 5, 2025",
        rating: 5,
        body: "Fresh and clean finish. Ships fast.",
      },
      {
        id: "f5",
        name: "Erika L.",
        date: "October 4, 2025",
        rating: 5,
        body: "Crowd pleaser at our office.",
      },
      {
        id: "f6",
        name: "Kate W.",
        date: "October 2, 2025",
        rating: 5,
        body: "Balanced and smooth. Hits the mark.",
      },
      {
        id: "f7",
        name: "Victor H.",
        date: "September 30, 2025",
        rating: 5,
        body: "Exactly what I want in a medium roast.",
      },
      {
        id: "f8",
        name: "Ryan C.",
        date: "September 28, 2025",
        rating: 5,
        body: "Rich aroma and consistent flavor.",
      },
      {
        id: "f9",
        name: "Amanda G.",
        date: "September 27, 2025",
        rating: 4,
        body: "Very good daily drinker.",
      },
      {
        id: "f10",
        name: "Chris P.",
        date: "September 25, 2025",
        rating: 5,
        body: "Smooth from first sip to last.",
      },
      {
        id: "f11",
        name: "Lindsay K.",
        date: "September 23, 2025",
        rating: 5,
        body: "My new go to.",
      },
      {
        id: "f12",
        name: "Derek B.",
        date: "September 20, 2025",
        rating: 5,
        body: "Balanced and flavorful.",
      },
    ],
    "baptism-by-fire": [
      {
        id: "b1",
        name: "Tom O.",
        date: "October 10, 2025",
        rating: 5,
        body: "Bold and smooth without harsh bite.",
      },
      {
        id: "b2",
        name: "Sarah V.",
        date: "October 8, 2025",
        rating: 5,
        body: "Dark chocolate notes. Excellent.",
      },
      {
        id: "b3",
        name: "Nick F.",
        date: "October 6, 2025",
        rating: 4,
        body: "Great dark roast for mornings.",
      },
      {
        id: "b4",
        name: "Jose M.",
        date: "October 4, 2025",
        rating: 5,
        body: "Deep flavor with a clean finish.",
      },
      {
        id: "b5",
        name: "Evan J.",
        date: "October 3, 2025",
        rating: 5,
        body: "Powerful and smooth.",
      },
      {
        id: "b6",
        name: "Cara S.",
        date: "October 1, 2025",
        rating: 5,
        body: "Perfect dark cup.",
      },
      {
        id: "b7",
        name: "Walt A.",
        date: "September 29, 2025",
        rating: 4,
        body: "Rich and satisfying.",
      },
      {
        id: "b8",
        name: "Helen D.",
        date: "September 27, 2025",
        rating: 5,
        body: "My favorite of the lineup.",
      },
      {
        id: "b9",
        name: "Ivy N.",
        date: "September 26, 2025",
        rating: 5,
        body: "Smooth for a dark roast.",
      },
      {
        id: "b10",
        name: "Zack T.",
        date: "September 24, 2025",
        rating: 5,
        body: "Lives up to the name.",
      },
      {
        id: "b11",
        name: "Anna R.",
        date: "September 22, 2025",
        rating: 5,
        body: "Fantastic body and aroma.",
      },
      {
        id: "b12",
        name: "Peter Q.",
        date: "September 20, 2025",
        rating: 4,
        body: "Solid dark roast.",
      },
    ],
    "java-action": [
      {
        id: "j1",
        name: "Mark S.",
        date: "October 9, 2025",
        rating: 5,
        body: "Full bodied and smooth. Great mornings.",
      },
      {
        id: "j2",
        name: "Jen L.",
        date: "October 7, 2025",
        rating: 5,
        body: "Hazelnut and caramel pop.",
      },
      {
        id: "j3",
        name: "Omar H.",
        date: "October 6, 2025",
        rating: 4,
        body: "Nice daily medium.",
      },
      {
        id: "j4",
        name: "Theo B.",
        date: "October 5, 2025",
        rating: 5,
        body: "Balanced and rich.",
      },
      {
        id: "j5",
        name: "Gina P.",
        date: "October 3, 2025",
        rating: 5,
        body: "Smooth and consistent.",
      },
      {
        id: "j6",
        name: "Sam W.",
        date: "October 1, 2025",
        rating: 4,
        body: "Reliable cup.",
      },
      {
        id: "j7",
        name: "Iris K.",
        date: "September 29, 2025",
        rating: 5,
        body: "Lovely finish.",
      },
      {
        id: "j8",
        name: "Caleb D.",
        date: "September 28, 2025",
        rating: 5,
        body: "Goes great with breakfast.",
      },
      {
        id: "j9",
        name: "Noah M.",
        date: "September 26, 2025",
        rating: 4,
        body: "Smooth ride.",
      },
      {
        id: "j10",
        name: "Rae C.",
        date: "September 25, 2025",
        rating: 5,
        body: "Buying again.",
      },
      {
        id: "j11",
        name: "Luis V.",
        date: "September 23, 2025",
        rating: 5,
        body: "Great flavor.",
      },
      {
        id: "j12",
        name: "Becca Y.",
        date: "September 21, 2025",
        rating: 5,
        body: "Solid medium roast.",
      },
    ],
    "oak-and-copper": [
      {
        id: "o1",
        name: "Quinn P.",
        date: "October 11, 2025",
        rating: 5,
        body: "Oak and caramel show up nicely.",
      },
      {
        id: "o2",
        name: "Dana S.",
        date: "October 9, 2025",
        rating: 5,
        body: "Smooth bourbon kissed finish.",
      },
      {
        id: "o3",
        name: "Harper G.",
        date: "October 8, 2025",
        rating: 4,
        body: "Unique and rich.",
      },
      {
        id: "o4",
        name: "Kurt E.",
        date: "October 7, 2025",
        rating: 5,
        body: "New favorite special roast.",
      },
      {
        id: "o5",
        name: "Elle F.",
        date: "October 6, 2025",
        rating: 5,
        body: "Deep oak notes without bitterness.",
      },
      {
        id: "o6",
        name: "Sean R.",
        date: "October 4, 2025",
        rating: 5,
        body: "Great weekend treat.",
      },
      {
        id: "o7",
        name: "Yara T.",
        date: "October 3, 2025",
        rating: 5,
        body: "Delicious and smooth.",
      },
      {
        id: "o8",
        name: "Vlad K.",
        date: "October 2, 2025",
        rating: 5,
        body: "Awesome barrel character.",
      },
      {
        id: "o9",
        name: "Mia C.",
        date: "September 30, 2025",
        rating: 4,
        body: "Nice twist on medium roast.",
      },
      {
        id: "o10",
        name: "Iain D.",
        date: "September 28, 2025",
        rating: 5,
        body: "Rich and balanced.",
      },
      {
        id: "o11",
        name: "Nora H.",
        date: "September 26, 2025",
        rating: 5,
        body: "Love the finish.",
      },
      {
        id: "o12",
        name: "Zoe N.",
        date: "September 24, 2025",
        rating: 5,
        body: "Fantastic flavor.",
      },
    ],
  };

  const reviews: Review[] = reviewListBySlug[card.slug] ?? [];

  const { add } = useCart();
  const [purchaseMode, setPurchaseMode] = useState<"one" | "sub">("one");
  const [subEvery, setSubEvery] = useState<14 | 30 | 60>(30);
  const [qty, setQty] = useState(1);
  const [beanType, setBeanType] = useState<"" | "whole" | "ground">("");
  const [showBeanError, setShowBeanError] = useState(false);

  // Reset Bean Type selector whenever you navigate to a different roast page
  useEffect(() => {
    setBeanType(""); // back to "Choose..."
    setShowBeanError(false);
  }, [slug]);

  // Mirror BUY BOX width/height so Bean Type box matches exactly
  const buyBoxRef = useRef<HTMLDivElement>(null);
  const [buyBoxDims, setBuyBoxDims] = useState<{ w: number; h: number }>({
    w: 0,
    h: 0,
  });
  const BEAN_BOX_RATIO = 0.83; // width = 83% of buy box

  useEffect(() => {
    const measure = () => {
      if (!buyBoxRef.current) return;
      const r = buyBoxRef.current.getBoundingClientRect();
      setBuyBoxDims({ w: Math.round(r.width), h: Math.round(r.height) });
    };
    measure();
    requestAnimationFrame(measure);
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);
  const basePrice = isOak ? 25 : card.price; // Oak & Copper single price
  const discounted = Number((basePrice * 0.85).toFixed(2));

  const addToChest = () => {
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

    const variantLabel = beanType === "whole" ? "Whole Bean" : "Ground";
    const variantId = `${card.slug}-12oz-${beanType}`;
    const variantSku = `${card.slug}-12oz-${beanType}`;

    // Build a variant-specific item so it does not merge with the other bean type
    const itemToAdd = {
      ...card,
      id: variantId, // unique per variant so the cart keeps separate lines
      sku: variantSku, // useful if your checkout uses SKU
      title: `${card.title} (${variantLabel})`, // shows the type in cart/checkout
      price: purchaseMode === "sub" ? discounted : basePrice,
      beanType, // keep explicit for rendering
      purchaseMode, // keep subscription state with the line item
      subEvery: purchaseMode === "sub" ? subEvery : undefined,
    };

    add(itemToAdd, n);

    window.dispatchEvent(
      new CustomEvent("flash", {
        detail: `${n} × ${card.title} (${variantLabel}) added to Chest`,
      })
    );
  };

  return (
    <main className="relative overflow-hidden min-h-[calc(100vh-140px)] py-10 md:py-16">
      <div className="absolute inset-0 z-0 bg-neutral-950/30" aria-hidden />

      <Container className="relative z-10">
        {/* ===== HERO ===== */}
        <div className="relative">
          <div
            className="pointer-events-none select-none absolute left-1/2 top-[45%] -translate-x-1/2 -translate-y-1/2 z-0"
            aria-hidden
          >
            <img
              src="/emblem-black.png"
              alt=""
              className="w-[58vw] max-w-[720px] opacity-15 object-contain"
            />
          </div>

          <div className="relative z-10 mt-2 md:mt-3 grid md:grid-cols-[auto,1fr] gap-4 md:gap-6 items-start">
            {/* HERO IMAGE */}
            <div className="flex flex-col items-center md:items-start">
              <div className="inline-block rounded-3xl overflow-hidden ring-1 ring-amber-400/40 shadow-2xl shadow-amber-500/20 bg-neutral-900/40">
                {/* Fixed, tall frame that the image fully fills */}
                <div className="flex flex-col items-center md:items-start">
                  <img
                    src={card.img}
                    alt={card.title}
                    loading="eager"
                    decoding="async"
                    className="block h-auto w-auto max-h-[61vh] md:max-h-[65vh] object-contain
               rounded-2xl md:rounded-3xl ring-1 ring-amber-400/60
               shadow-2xl shadow-amber-500/20"
                  />
                </div>
              </div>
            </div>

            {/* TEXT COLUMN */}
            <div className="self-start space-y-4">
              {/* Title row */}
              <div className="mb-1 flex items-start justify-between gap-3">
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

                  {/* Subtitle + stars + count (subtitle + right-aligned reviews; line matches this width) */}
                  <div className="mt-1 max-w-[72ch]">
                    <div className="flex items-baseline justify-between gap-3 text-neutral-400">
                      {/* 20% larger subtitle */}
                      <div className="text-[1.05rem] md:text-[1.2rem]">
                        {isFlagship
                          ? "Medium Roast"
                          : isBaptism
                          ? "Dark Roast"
                          : card.subTitle}
                      </div>

                      {/* stars + count aligned to the right edge (REVIEWS ends at line end) */}
                      <div className="flex items-center gap-2 shrink-0">
                        <a
                          href="#reviews"
                          onClick={(e) => {
                            e.preventDefault();
                            const el = document.getElementById("reviews");
                            if (!el) return;
                            const mobileOffset = 200; // was 80
                            const desktopOffset = 260; // was 100
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
                          className="group inline-flex items-center gap-1 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                          aria-label="Jump to customer reviews"
                          title="Jump to customer reviews"
                        >
                          {[...Array(5)].map((_, i) => (
                            <svg
                              key={i}
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              className="h-5 w-5 text-amber-400 group-hover:text-amber-300"
                              aria-hidden
                            >
                              <path d="M12 .587l3.668 7.568L24 9.753l-6 5.854L19.335 24 12 19.771 4.665 24 6 15.607 0 9.753l8.332-1.598z" />
                            </svg>
                          ))}
                        </a>

                        <span className="text-xs md:text-sm text-neutral-400/80 tracking-wide whitespace-nowrap">
                          {reviewData.count} REVIEWS
                        </span>
                      </div>
                    </div>

                    {/* faint amber line sized to story text width */}
                    <div className="h-px w-full bg-amber-400/30 mt-2" />
                  </div>
                </div>

                <BackButton to="/store" size="sm" />
              </div>

              {/* SHIP STORY / HERO COPY — tightened measure + smarter wrapping */}
              <div
                className="max-w-[64ch] sm:max-w-[68ch] md:max-w-[70ch] lg:max-w-[72ch] text-pretty leading-[1.85]"
                lang="en"
                style={{ hyphens: "auto", textWrap: "balance" as any }}
              >
                {isFlagship && (
                  <div className="space-y-6">
                    <div className="space-y-3 text-neutral-300 text-lg leading-relaxed">
                      <p className="text-amber-300">
                        USS Constitution - Old Ironsides
                      </p>
                      <p>Commissioned October 21, 1797</p>
                      <p>
                        Manned by the spirit of a new nation, she defied the
                        world’s greatest navy. British cannonballs struck her
                        hull with fury but bounced away as one sailor was heard
                        to say, “Her sides are made of iron!”
                      </p>
                      <p>
                        This roast honors the ship and the souls who sailed her
                        into history. Balanced, bold, and enduring, our Flagship
                        Medium Roast carries her legacy in every cup.
                      </p>
                      <p>
                        Old Ironsides Coffee - Ignite the Spirit, Savor the
                        Victory!
                      </p>
                    </div>

                    {/* AMBER DESCRIPTION (kept as-is) */}
                    <div className="mt-2 text-amber-300/90 text-base md:text-lg">
                      {AMBER_DESC}
                    </div>
                    <div className="h-1 md:h-2" />
                  </div>
                )}

                {isBaptism && (
                  <div className="space-y-6">
                    <div className="space-y-3 text-neutral-300 text-lg leading-relaxed">
                      <p className="text-amber-300">
                        USS Constitution vs HMS Guerriere — August 19, 1812
                      </p>
                      <p>
                        The Constitution’s first great reckoning came in a
                        deadly duel at sea. British shot struck her hull with
                        fury yet bounced away as a sailor cried, “Her sides are
                        made of iron!”
                      </p>
                      <p>
                        The Guerriere was left wrecked, and at last claimed by
                        the sea.
                      </p>
                      <p>
                        This bold roast pays tribute to the day a legend was
                        born — fierce, proud, and forged in victory.
                      </p>
                      <p>
                        Old Ironsides Coffee - Ignite the Spirit, Savor the
                        Victory!
                      </p>
                    </div>

                    {/* AMBER DESCRIPTION (kept as-is) */}
                    <div className="mt-2 text-amber-300/90 text-base md:text-lg">
                      {AMBER_DESC}
                    </div>
                    <div className="h-1 md:h-2" />
                  </div>
                )}

                {/* Java story */}
                {isJava && (
                  <div className="space-y-6">
                    <div className="space-y-3 text-neutral-300 text-lg leading-relaxed">
                      <p className="text-amber-300">
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
                      <p>
                        Old Ironsides Coffee - Ignite the Spirit, Savor the
                        Victory!
                      </p>
                    </div>

                    {/* AMBER DESCRIPTION (kept consistent with other roasts) */}
                    <div className="mt-2 text-amber-300/90 text-base md:text-lg">
                      {AMBER_DESC}
                    </div>
                    <div className="h-1 md:h-2" />
                  </div>
                )}
                {/* Oak & Copper story */}
                {isOak && (
                  <div className="space-y-6">
                    <div className="space-y-3 text-neutral-300 text-lg leading-relaxed">
                      <p className="text-amber-300">
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
                        waves, mastered the cannons, and sailed her name into
                        history.
                      </p>
                      <p>
                        Aged in bourbon barrels, this roast honors the
                        shipwrights that built her, with notes of smooth
                        caramel, warm vanilla, and toasted oak.
                      </p>
                      <p>
                        Old Ironsides Coffee - Ignite the Spirit, Savor the
                        Victory!
                      </p>
                    </div>

                    <div className="mt-2 text-amber-300/90 text-base md:text-lg">
                      {AMBER_DESC}
                    </div>
                    <div className="h-1 md:h-2" />
                  </div>
                )}
              </div>
              {/* Purchase mode selector */}
              <div className="mt-6 w-full max-w-[36rem]">
                <div className="rounded-full border border-amber-400/60 bg-black/60 p-1 inline-flex shadow-md shadow-amber-400/10">
                  <button
                    type="button"
                    onClick={() => setPurchaseMode("one")}
                    className={
                      "px-6 py-3 rounded-full text-sm md:text-base font-semibold transition " +
                      (purchaseMode === "one"
                        ? "bg-amber-400 text-neutral-900"
                        : "text-amber-300 hover:text-amber-200")
                    }
                    aria-pressed={purchaseMode === "one"}
                  >
                    Single Purchase
                  </button>
                  <button
                    type="button"
                    onClick={() => setPurchaseMode("sub")}
                    className={
                      "px-6 py-3 rounded-full text-sm md:text-base font-semibold transition " +
                      (purchaseMode === "sub"
                        ? "bg-amber-400 text-neutral-900"
                        : "text-amber-300 hover:text-amber-200")
                    }
                    aria-pressed={purchaseMode === "sub"}
                  >
                    Join the Fleet &amp; Save 15%
                  </button>
                </div>
              </div>

              {/* Subscription frequency */}
              {purchaseMode === "sub" && (
                <div className="mt-3 mb-4 w-full max-w-[36rem]">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="text-[1.15rem] text-amber-300 font-medium">
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

              {/* Add to Chest */}
              {(card.canBuy || isOak) && (
                // allow two full-size boxes side-by-side without shrinking the original buy box
                <div className="mt-10 w-auto">
                  <div className="flex items-stretch gap-4">
                    {/* === BUY BOX — UNTOUCHED, just add ref to read width/height === */}
                    <div
                      ref={buyBoxRef}
                      className="inline-flex items-center gap-4 rounded-xl border border-amber-400/60 bg-black/70 p-3 px-4 shadow-md shadow-amber-400/10"
                    >
                      {/* Price on the LEFT (matches Harbor) */}
                      <div className="text-sm text-neutral-300">
                        {purchaseMode === "sub" ? (
                          <>
                            <span className="line-through text-amber-300/80 mr-1">
                              {fmt(basePrice)}
                            </span>
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

                      {/* Quantity + Add grouped and right-aligned (like Harbor) */}
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
                            value={qty}
                            onChange={(e) => setQty(Number(e.target.value))}
                            inputMode="numeric"
                            pattern="[0-9]*"
                            className="w-12 text-center bg-neutral-900/70 py-1.5 text-sm outline-none"
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
                          onClick={addToChest}
                          className="px-6 py-3 rounded-lg text-base font-semibold border border-amber-400/70 text-amber-300 bg-black hover:bg-amber-400 hover:text-neutral-900 transition shadow-md shadow-amber-400/10"
                          aria-label={`Add ${card.title} to Chest`}
                        >
                          Add to Chest
                        </button>
                      </div>
                    </div>

                    {/* === BEAN TYPE BOX — exact same height and border thickness; width = 83% of buy box === */}
                    <div
                      className={
                        "group inline-flex items-center justify-between gap-4 rounded-xl p-3 px-4 shadow-md transition " +
                        (showBeanError
                          ? "border border-red-500 ring-2 ring-red-500 animate-pulse"
                          : "border border-amber-400/60 bg-black/70 shadow-amber-400/10 hover:border-amber-400/80 hover:shadow-[0_0_0_2px_rgba(251,191,36,0.25)]")
                      }
                      style={{
                        minHeight: buyBoxDims.h
                          ? `${buyBoxDims.h}px`
                          : undefined,
                        height: buyBoxDims.h ? `${buyBoxDims.h}px` : undefined,
                        width: buyBoxDims.w
                          ? `${Math.round(buyBoxDims.w * 0.83)}px`
                          : undefined,
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

                      <label htmlFor="beanTypeSelect" className="sr-only">
                        Bean Type
                      </label>
                      <select
                        id="beanTypeSelect"
                        value={beanType}
                        onChange={(e) => {
                          setBeanType(
                            e.target.value as "" | "whole" | "ground"
                          );
                          setShowBeanError(false);
                        }}
                        className={
                          "min-w-[12rem] rounded-lg border px-3 py-2 text-sm outline-none bg-black/70 " +
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

                  <div className="mt-2 text-lg text-neutral-400">
                    <span className="text-amber-300 font-semibold">
                      3+ bags ship free
                    </span>{" "}
                  </div>
                </div>
              )}
            </div>
            {/* end text column */}
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
    default:
      return null;
  }
}

/* ================== SHARED PARTS ================== */
function OriginImg({
  name,
  bumpIndonesia = false,
}: {
  name: string;
  bumpIndonesia?: boolean;
}) {
  const FILE_ALIAS: Record<string, string> = {
    Colombia: "columbia", // your filename
    "El Salvador": "el-salvador",
    Ethiopia: "ethiopia",
    Guatemala: "guatemala",
    Indonesia: "indonesia",
  };
  const SCALE_BY_COUNTRY: Record<string, string> = {
    "El Salvador": "scale-[0.70] md:scale-[0.65]",
    Guatemala: "scale-[0.85] md:scale-[0.80]",
    Ethiopia: "scale-[0.82] md:scale-[0.78]",
    Colombia: "scale-[0.85] md:scale-[0.82]",
    Indonesia: "scale-[0.90]",
  };
  const fileKey = FILE_ALIAS[name] || name.toLowerCase().replace(/\s+/g, "-");
  const scaleCls = SCALE_BY_COUNTRY[name] || "scale-100";
  const nudge =
    bumpIndonesia && name === "Indonesia"
      ? "-translate-y-12 md:-translate-y-16"
      : "";

  return (
    <div className="flex flex-col items-center text-center">
      <img
        src={`/${fileKey}.png`}
        alt={name}
        className={`h-auto max-w-[9.5rem] md:max-w-[11rem] ${scaleCls} drop-shadow-[0_0_14px_rgba(251,191,36,0.25)] ${nudge}`}
      />
      <div className="mt-2 text-amber-400/90 tracking-wider text-sm font-semibold uppercase">
        {name}
      </div>
    </div>
  );
}
function RoastLevelAnchors({
  level,
  reviewData,
  reviews,
  roastTitle,
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

  // NEW: expandable tiles + write modal
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const toggleExpand = (id: string) =>
    setExpandedId((prev) => (prev === id ? null : id));

  const [showModal, setShowModal] = useState(false);
  const [rating, setRating] = useState<number>(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const submitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1) {
      window.dispatchEvent(
        new CustomEvent("flash", { detail: "Please select a star rating." })
      );
      return;
    }
    // TODO: wire to your backend/provider
    window.dispatchEvent(
      new CustomEvent("flash", { detail: "Thanks for your review!" })
    );
    setShowModal(false);
    setRating(0);
    setTitle("");
    setBody("");
    setName("");
    setEmail("");
  };

  return (
    <section id="reviews" className="text-center max-w-[980px] mx-auto px-4">
      {/* Title + Write box centered over histogram width */}
      <div className="relative mx-auto max-w-[780px] mb-4">
        <h2 className="text-xl md:text-2xl font-bold text-amber-300 text-center m-0">
          CUSTOMER REVIEWS
        </h2>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="absolute right-0 top-1/2 -translate-y-1/2 px-4 py-2 rounded-lg text-sm md:text-base font-semibold border border-amber-400/70 text-amber-300 bg-black hover:bg-amber-400 hover:text-neutral-900 transition shadow-md shadow-amber-400/10"
          aria-label="Write a review"
        >
          Write a Review
        </button>
      </div>

      {/* Overall stars + count */}
      <div className="mt-2 md:mt-3 flex items-center justify-center gap-2 mb-2">
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <svg
              key={i}
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-6 w-6 text-amber-400"
              aria-hidden
            >
              <path d="M12 .587l3.668 7.568L24 9.753l-6 5.854L19.335 24 12 19.771 4.665 24 6 15.607 0 9.753l8.332-1.598z" />
            </svg>
          ))}
        </div>
        <div className="text-neutral-400 text-sm">{total} REVIEWS</div>
      </div>

      {/* Histogram box */}
      <div className="mt-4 mx-auto max-w-[780px] w-full rounded-xl border border-amber-400/40 bg-black/40 p-4 md:p-6">
        {[5, 4, 3, 2, 1].map((s) => (
          <div key={s} className="flex items-center gap-3 py-1">
            <div className="w-8 text-right text-sm text-neutral-300">{s}★</div>
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

      {/* Testimonials grid (8 per page) — tiles clickable to expand */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 overflow-visible">
        {pageItems.map((r) => {
          const isOpen = expandedId === r.id;
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
              {/* Compact tile content (preview) */}
              <div className="flex items-center justify-between">
                <div className="font-semibold text-amber-300">{r.name}</div>
                <div className="text-xs text-neutral-400">{r.date}</div>
              </div>

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

              {r.title && (
                <div className="mt-2 text-sm font-semibold text-neutral-200">
                  {r.title}
                </div>
              )}

              <p className="mt-1 text-sm text-neutral-300 leading-relaxed overflow-hidden max-h-16">
                {r.body}
              </p>

              {/* Verified badge at bottom */}
              <div className="mt-3 text-[11px] uppercase tracking-wide text-amber-300/90">
                Verified Buyer
              </div>

              {/* Pop-out banner overlay on top of this tile */}
              {isOpen && (
                <div
                  className="absolute left-0 right-0 -top-2 z-50 rounded-xl border border-amber-400/70 bg-neutral-950 shadow-2xl shadow-amber-500/20 p-4 md:p-5"
                  style={{ minHeight: 280 }} /* ~2x the tile height */
                  onClick={() => toggleExpand(r.id)}
                >
                  {/* Full review content */}
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-amber-300">{r.name}</div>
                    <div className="text-xs text-neutral-400">{r.date}</div>
                  </div>

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

                  {r.title && (
                    <div className="mt-2 text-sm font-semibold text-neutral-200">
                      {r.title}
                    </div>
                  )}

                  <div className="mt-2 text-sm text-neutral-300 leading-relaxed overflow-auto max-h-40">
                    {r.body}
                  </div>

                  <div className="mt-3 text-[11px] uppercase tracking-wide text-amber-300/90">
                    Verified Buyer
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
      {expandedId && (
        <div
          className="fixed inset-0 z-40 bg-black/40"
          onClick={() => toggleExpand(expandedId)}
          aria-hidden
        />
      )}

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

      {/* WRITE A REVIEW MODAL */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setShowModal(false)}
            aria-hidden
          />
          <div className="relative z-10 w-[92vw] max-w-[720px] rounded-xl border border-amber-400/60 bg-neutral-950 p-5 md:p-6 shadow-2xl shadow-amber-500/20 text-left">
            <div className="flex items-center justify-between mb-3">
              <div className="text-lg md:text-xl font-bold text-amber-300">
                WRITE A REVIEW
              </div>
              <button
                className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-neutral-700 hover:border-amber-400/60"
                onClick={() => setShowModal(false)}
                aria-label="Close write a review"
              >
                ×
              </button>
            </div>

            <form onSubmit={submitReview} className="space-y-3">
              {/* SCORE */}
              <div className="space-y-1">
                <div className="text-sm text-neutral-300">
                  SCORE*{" "}
                  {rating < 1 && (
                    <span className="text-red-400 text-xs ml-1">required</span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setRating(n)}
                      className="p-1"
                      aria-label={`Rate ${n} star${n > 1 ? "s" : ""}`}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill={n <= rating ? "currentColor" : "none"}
                        className={
                          "h-6 w-6 " +
                          (n <= rating ? "text-amber-400" : "text-neutral-600")
                        }
                        stroke="currentColor"
                      >
                        <path d="M12 .587l3.668 7.568L24 9.753l-6 5.854L19.335 24 12 19.771 4.665 24 6 15.607 0 9.753l8.332-1.598z" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>

              {/* TITLE */}
              <div>
                <div className="text-sm text-neutral-300 mb-1">TITLE*</div>
                <input
                  className="w-full rounded-md border border-neutral-700 bg-black/70 px-3 py-2 outline-none focus:border-amber-400/70"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="Give your review a title"
                />
              </div>

              {/* CONTENT */}
              <div>
                <div className="text-sm text-neutral-300 mb-1">
                  What did you think of {roastTitle}?*
                </div>
                <textarea
                  className="w-full min-h-[120px] rounded-md border border-neutral-700 bg-black/70 px-3 py-2 outline-none focus:border-amber-400/70"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  required
                  placeholder="Write your comments here"
                />
              </div>

              {/* NAME / EMAIL */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <div className="text-sm text-neutral-300 mb-1">NAME*</div>
                  <input
                    className="w-full rounded-md border border-neutral-700 bg-black/70 px-3 py-2 outline-none focus:border-amber-400/70"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Enter your name"
                  />
                </div>
                <div>
                  <div className="text-sm text-neutral-300 mb-1">EMAIL*</div>
                  <input
                    type="email"
                    className="w-full rounded-md border border-neutral-700 bg-black/70 px-3 py-2 outline-none focus:border-amber-400/70"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              {/* POST */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={rating < 1 || !title || !body || !name || !email}
                  className={
                    "w-full px-4 py-3 rounded-lg text-base font-semibold border border-amber-400/70 text-amber-300 bg-black transition shadow-md shadow-amber-400/10 " +
                    (rating < 1 || !title || !body || !name || !email
                      ? "opacity-60 cursor-not-allowed"
                      : "hover:bg-amber-400 hover:text-neutral-900")
                  }
                >
                  POST
                </button>
              </div>

              {/* Verified badge on modal too */}
              <div className="text-center text-[11px] uppercase tracking-wide text-amber-300/90 mt-2">
                Verified Buyer
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
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
          <div className="max-w-[80ch]">
            <h2 className="text-xl md:text-2xl font-bold text-amber-300">
              THE CRAFT IN THE CUP
            </h2>
            {craftSubtitle && (
              <div className="mt-1 text-neutral-300 text-base md:text-lg leading-relaxed max-w-[68ch]">
                {craftSubtitle}
              </div>
            )}
            <div className="w-full max-w-4xl mx-auto h-px bg-amber-400/30 my-3" />

            <div className="mt-1">
              <h3 className="text-base md:text-lg font-semibold text-amber-300/90">
                Signature Notes
              </h3>
              <div className="mt-1 text-neutral-300 text-lg leading-relaxed">
                {notes.join(", ")}
              </div>
            </div>

            <div className="w-full max-w-4xl mx-auto h-px bg-amber-400/30 my-3" />

            <h3 className="text-base md:text-lg font-semibold text-amber-300/90 mb-4">
              Bean Origins
            </h3>
            <div
              className={`inline-grid ${GRID} gap-4 md:gap-6 items-end justify-center mx-auto`}
            >
              {origins.map((name) => (
                <OriginImg key={name} name={name} />
              ))}
            </div>

            <div className="w-full max-w-4xl mx-auto h-px bg-amber-400/30 my-3" />
            {/* Roast Level — between Bean Origins divider and Reviews */}
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
          </div>{" "}
          {/* end .max-w-[80ch] */}
        </Container>

        {/* full-bleed divider + centered reviews (mirrors the top border) */}
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
          <div className="max-w-[80ch]">
            <h2 className="text-xl md:text-2xl font-bold text-amber-300">
              THE CRAFT IN THE CUP
            </h2>
            {craftSubtitle && (
              <div className="mt-1 text-neutral-300 text-base md:text-lg leading-relaxed max-w-[68ch]">
                {craftSubtitle}
              </div>
            )}
            <div className="w-full max-w-4xl mx-auto h-px bg-amber-400/30 my-3" />

            <div className="mt-1">
              <h3 className="text-base md:text-lg font-semibold text-amber-300/90">
                Signature Notes
              </h3>
              <div className="mt-1 text-neutral-300 text-lg leading-relaxed">
                {notes.join(", ")}
              </div>
            </div>

            <div className="w-full max-w-4xl mx-auto h-px bg-amber-400/30 my-3" />

            <h3 className="text-base md:text-lg font-semibold text-amber-300/90 mb-4">
              Bean Origins
            </h3>
            <div
              className={`inline-grid ${GRID} gap-4 md:gap-6 items-end justify-center mx-auto`}
            >
              {origins.map((name) => (
                <OriginImg key={name} name={name} bumpIndonesia />
              ))}
            </div>

            <div className="w-full max-w-4xl mx-auto h-px bg-amber-400/30 my-3" />
            {/* Roast Level — between Bean Origins divider and Reviews */}
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
          </div>{" "}
          {/* end .max-w-[80ch] */}
        </Container>

        {/* full-bleed divider + centered reviews (mirrors the top border) */}
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
          <div className="max-w-[80ch]">
            <h2 className="text-xl md:text-2xl font-bold text-amber-300">
              THE CRAFT IN THE CUP
            </h2>
            {craftSubtitle && (
              <div className="mt-1 text-neutral-300 text-base md:text-lg leading-relaxed max-w-[68ch]">
                {craftSubtitle}
              </div>
            )}
            <div className="w-full max-w-4xl mx-auto h-px bg-amber-400/30 my-3" />

            <div className="mt-1">
              <h3 className="text-base md:text-lg font-semibold text-amber-300/90">
                Signature Notes
              </h3>
              <div className="mt-1 text-neutral-300 text-lg leading-relaxed">
                {notes.join(", ")}
              </div>
            </div>

            <div className="w-full max-w-4xl mx-auto h-px bg-amber-400/30 my-3" />

            <h3 className="text-base md:text-lg font-semibold text-amber-300/90 mb-4">
              Bean Origins
            </h3>
            <div
              className={`inline-grid ${GRID} gap-4 md:gap-6 items-end justify-center mx-auto`}
            >
              {origins.map((name) => (
                <OriginImg key={name} name={name} />
              ))}
            </div>
            <div className="w-full max-w-4xl mx-auto h-px bg-amber-400/30 my-3" />
            {/* Roast Level — between Bean Origins divider and Reviews */}
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
          </div>{" "}
          {/* end .max-w-[80ch] */}
        </Container>

        {/* full-bleed divider + centered reviews (mirrors the top border) */}
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
  const origins = ["Colombia", "Indonesia"];
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
          <div className="max-w-[80ch]">
            <h2 className="text-xl md:text-2xl font-bold text-amber-300">
              THE CRAFT IN THE CUP
            </h2>
            {craftSubtitle && (
              <div className="mt-1 text-neutral-300 text-base md:text-lg leading-relaxed max-w-[68ch]">
                {craftSubtitle}
              </div>
            )}
            <div className="w-full max-w-4xl mx-auto h-px bg-amber-400/30 my-3" />

            <div className="mt-1">
              <h3 className="text-base md:text-lg font-semibold text-amber-300/90">
                Signature Notes
              </h3>
              <div className="mt-1 text-neutral-300 text-lg leading-relaxed">
                {notes.join(", ")}
              </div>
            </div>

            <div className="w-full max-w-4xl mx-auto h-px bg-amber-400/30 my-3" />

            <h3 className="text-base md:text-lg font-semibold text-amber-300/90 mb-4">
              Bean Origins
            </h3>
            <div
              className={`inline-grid ${GRID} gap-4 md:gap-6 items-end justify-center mx-auto`}
            >
              {origins.map((name) => (
                <OriginImg key={name} name={name} bumpIndonesia />
              ))}
            </div>

            <div className="w-full max-w-4xl mx-auto h-px bg-amber-400/30 my-3" />
            {/* Roast Level — between Bean Origins divider and Reviews */}
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
          </div>{" "}
          {/* end .max-w-[80ch] */}
        </Container>

        {/* full-bleed divider + centered reviews (mirrors the top border) */}
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
      img: "Mugs-deck.png",
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
            title="Launching Winter 2025!"
            subtitle="Apparel, mugs, hats, and gear for the Fleet."
          />
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
                    Join the Fleet to get first access on gear — plus save 15%
                    on coffee.
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
              Get an alert when {title.toLowerCase()} drop.
            </div>
            <NotifyForm onSubmit={() => {}} />
          </div>
        </div>
      </Container>
    </main>
  );
}

// ===== PASTE THIS NEW VERSION OF MissionPage =====
function MissionPage() {
  // Match the Origins page frame/sizing
  const SECTION_FRAME = "relative overflow-hidden border-t border-neutral-800";
  const SECTION_INNER =
    "relative z-10 min-h-[600px] md:min-h-[700px] py-12 md:py-16";

  return (
    <main className="pt-0">
      {/* ===== SECTION 1: Title + intro alternating (photo LEFT, text RIGHT) ===== */}
      <section className={SECTION_FRAME}>
        {/* Backdrop emblem centered */}
        <div className="absolute inset-0 flex items-center justify-center z-0 pointer-events-none">
          <img
            src="/emblem-black.png"
            alt="Mission backdrop"
            className="max-w-[90%] max-h-[90%] object-contain opacity-20"
          />
        </div>

        <div className="absolute inset-0 bg-neutral-950/40 z-0 pointer-events-none" />

        <Container>
          <div className="relative z-10 min-h-[720px] md:min-h-[820px] py-12 md:py-16">
            <div className="flex items-start justify-between mt-4 md:mt-6 mb-8 md:mb-10">
              <SectionTitle
                title={
                  <span className="text-3xl md:text-5xl font-extrabold text-amber-300">
                    Mission Log
                  </span>
                }
                subtitle={
                  <span className="block text-lg md:text-2xl font-semibold text-amber-300">
                    Revive our history. Strengthen our spirit. Honor those who
                    served.
                  </span>
                }
              />
              <BackButton size="sm" />
            </div>

            {/* PHOTO LEFT / TEXT RIGHT */}
            <div className="grid grid-cols-1 md:grid-cols-[auto,1fr] gap-4 md:gap-6 items-center">
              <div className="justify-self-center self-center">
                <div className="w-64 md:w-[32rem] mx-auto aspect-square rounded-xl overflow-hidden ring-1 ring-amber-400 bg-neutral-900/50">
                  <img
                    src="/flag-close.jpg" // swap later
                    alt="Mission intro"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-cinzel text-3xl md:text-4xl font-extrabold text-amber-300 tracking-wide uppercase">
                  THE HEART OF OLD IRONSIDES COFFEE
                </h3>

                <p className="text-neutral-300 text-xl md:text-2xl leading-relaxed tracking-[0.02em]">
                  At Old Ironsides Coffee, our mission is to do more than serve
                  an amazing cup of coffee. We aim to strengthen American pride
                  and spirit while preserving our history, all of which are in
                  danger of being lost. We carry forward the legacy of
                  resilience and courage to overcome adversity. This is the
                  heart of Old Ironsides Coffee.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>
      {/* ===== SECTION 2: Hero (LEFT) + Text (CENTER) + Alternating half-offset stack (RIGHT) ===== */}
      <section className={SECTION_FRAME}>
        {/* Backdrop */}
        <img
          src="/iraq-moon.JPG"
          alt="Craft backdrop"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-90 z-0 pointer-events-none"
        />
        <div className="absolute inset-0 bg-neutral-950/40 z-0 pointer-events-none" />

        <Container>
          {/* Make this section taller so the top/bottom cards can hug the edges */}
          <div className="relative z-10 min-h-[900px] md:min-h-[960px] py-12 md:py-16">
            {/* Three columns: hero | text | photo stack */}
            <div className="grid grid-cols-1 md:grid-cols-[auto,1fr,auto] items-center gap-8">
              {/* LEFT: HERO (vertically centered with text & middle-right photo) */}
              <div className="justify-self-center md:justify-self-start self-center">
                <div className="w-56 sm:w-64 md:w-[19.5rem] lg:w-[22rem] aspect-[4/5] rounded-2xl overflow-hidden ring-1 ring-amber-400 bg-neutral-900/50 shadow-2xl shadow-black/40">
                  <img
                    src="/officer-window.png"
                    alt="Hero"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* CENTER: TEXT */}
              <div className="text-center md:text-left self-center">
                <h3 className="font-cinzel text-2xl md:text-3xl font-extrabold text-amber-300 tracking-wide uppercase">
                  FROM THE SAND TO THE SEA
                </h3>

                <p className="mt-3 text-neutral-300 text-xl md:text-2xl leading-relaxed tracking-[0.02em]">
                  Although my boots were in the sand, not on the deck, the
                  spirit of Old Ironsides has always inspired me. She is a
                  reminder that grit, sacrifice, and courage win the day. Those
                  same values carried me through my service and are now at the
                  heart of Old Ironsides Coffee. Building this company is my way
                  of honoring that spirit and sharing it with others.
                </p>
              </div>

              {/* RIGHT: ALTERNATING STACK (Top Left / Middle Right / Bottom Left) */}
              <div className="justify-self-center md:justify-self-end">
                {/* The stack canvas is exactly 2× the card width so half-offsets are exact.
              Top and bottom cards are pinned to edges for separation. */}
                <div className="relative w-[36rem] h-[48rem]">
                  {/* Shared card size: 18rem wide (Tailwind w-72) with 4:3 ratio */}

                  {/* TOP (LEFT): right edge on centerline, pinned to top */}
                  <div className="absolute left-1/2 top-0 -translate-x-full w-72 aspect-[4/3] rounded-xl overflow-hidden ring-1 ring-amber-400 bg-neutral-900/60 shadow-xl">
                    <img
                      src="/humvee-turret.jpg"
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* MIDDLE (RIGHT): left edge on centerline, centered vertically */}
                  <div className="absolute left-1/2 top-1/2 -translate-y-1/2 w-72 aspect-[4/3] rounded-xl overflow-hidden ring-1 ring-amber-400 bg-neutral-900/60 shadow-2xl">
                    <img
                      src="/iraq-self1.JPG"
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* BOTTOM (LEFT): right edge on centerline, pinned to bottom */}
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

      {/* ===== SECTION 3: Standard alternating (photo LEFT, text RIGHT) ===== */}
      <section className={SECTION_FRAME}>
        <img
          src="/flags-ground.jpg" // swap later
          alt="Service backdrop"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-40 z-0 pointer-events-none"
        />
        <div className="absolute inset-0 bg-neutral-950/40 z-0 pointer-events-none" />

        <Container>
          <div className={SECTION_INNER}>
            <div className="grid grid-cols-1 md:grid-cols-[auto,1fr] gap-4 md:gap-6 items-center">
              <div className="justify-self-center self-center">
                <div className="w-64 md:w-[32rem] mx-auto aspect-square rounded-xl overflow-hidden ring-1 ring-amber-400 bg-neutral-900/50">
                  <img
                    src="/veteran-chair.jpg"
                    alt="Roaster"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="font-cinzel text-3xl md:text-4xl font-extrabold text-amber-300 tracking-wide uppercase">
                  Giving Back To Those Who Served
                </h3>
                <p className="text-neutral-300 text-xl md:text-2xl leading-relaxed tracking-[0.02em]">
                  Even as a startup with thin profits, giving back is at the
                  core of Old Ironsides Coffee. As a combat veteran, I believe
                  supporting organizations that focus on veterans’ health and
                  well-being is not optional, it is who we are. <br /> <br />{" "}
                  With every bag sold, we donate a portion of profits to trusted
                  organizations that provide real help to the veterans who need
                  it most.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
// ===== END NEW VERSION =====

function OriginsPage() {
  // Shared frame for all sections
  const SECTION_FRAME = "relative overflow-hidden border-t border-neutral-800";
  const SECTION_INNER =
    "relative z-10 min-h-[600px] md:min-h-[700px] py-12 md:py-16";

  return (
    <main className="pt-0">
      {/* ===== ROASTING PROCESS (buy box + fonts ~15% larger) ===== */}
      <section
        id="origins-roasting"
        className={`${SECTION_FRAME} scroll-mt-28 md:scroll-mt-36`}
      >
        <img
          src="/roasted-dark.jpg"
          alt="Roasting process backdrop"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-50 z-0 pointer-events-none"
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
                <h3 className="font-bold text-amber-300 text-[1.7rem] md:text-[2.6rem]">
                  ROASTING PROCESS
                </h3>
                <p className="text-neutral-300 leading-relaxed tracking-[0.02em] text-[1.4375rem] md:text-[1.725rem]">
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
                  to="/coffee"
                  className="mt-7 inline-block rounded-xl ring-1 ring-amber-400/60 
                       text-amber-400 font-semibold text-[1.15rem] md:text-[1.3rem]
                       px-[1.45rem] py-[0.6rem]
                       hover:bg-amber-400 hover:text-neutral-900 transition-all"
                >
                  ⚓ SHOP OUR FRESHLY ROASTED COFFEE
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
          className="absolute inset-0 w-full h-full object-cover object-[50%_68%] opacity-80 z-0 pointer-events-none"
        />
        <div className="absolute inset-0 bg-neutral-950/40 z-0 pointer-events-none" />

        <Container>
          <div className="relative z-10 flex items-center min-h-[720px] md:min-h-[820px] py-12 md:py-16">
            <div className="grid w-full grid-cols-1 md:grid-cols-[1fr,auto] gap-4 md:gap-6 items-center">
              {/* Text LEFT */}
              <div className="space-y-3">
                <h3 className="font-cinzel text-3xl md:text-4xl font-extrabold text-amber-300 tracking-wide uppercase">
                  The Lands Where Our Beans Are Grown
                </h3>
                <p className="text-neutral-300 text-xl md:text-2xl leading-relaxed tracking-[0.02em]">
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
        <img
          src="/hands-bowl.jpg"
          alt="Growers backdrop"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-70 z-0 pointer-events-none"
        />
        <div className="absolute inset-0 bg-neutral-950/40 z-0 pointer-events-none" />

        <Container>
          <div
            className={`${SECTION_INNER} flex items-center min-h-[720px] md:min-h-[820px]`}
          >
            <div className="grid w-full grid-cols-1 md:grid-cols-[auto,1fr] items-center gap-3 md:gap-4">
              {/* 3-stack LEFT (top/bottom pinned LEFT, middle offset RIGHT) */}
              <div className="justify-self-center md:justify-self-start self-center">
                <div className="relative w-[22rem] sm:w-[28rem] md:w-[36rem] h-[30rem] sm:h-[40rem] md:h-[48rem]">
                  {/* Top card (far LEFT) */}
                  <div className="absolute left-0 top-0 w-64 md:w-72 aspect-[4/3] rounded-xl overflow-hidden ring-1 ring-amber-400 bg-neutral-900/60 shadow-xl">
                    <img
                      src="/workergirl1.jpg"
                      alt="Harvest and selection"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {/* Middle card (offset to RIGHT) — existing hands pic */}
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

              {/* Text RIGHT (snug to image stack) */}
              <div className="space-y-3 md:justify-self-start">
                <h3 className="font-cinzel text-3xl md:text-4xl font-extrabold text-amber-300 tracking-wide uppercase">
                  The Hands That Grow Our Beans
                </h3>
                <p className="text-neutral-300 text-xl md:text-2xl leading-relaxed tracking-[0.02em]">
                  Behind every harvest are the families who make it possible.
                  Generations of farmers rise before dawn, nurturing each tree
                  by hand and protecting the land that sustains them. Their
                  knowledge, patience, and respect for nature give our coffee
                  its strength and character. <br /> <br />
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
                className="text-3xl md:text-5xl font-bold text-amber-300 tracking-tight whitespace-nowrap"
                style={{ fontFamily: "'Cinzel', serif", fontWeight: 700 }}
              >
                The History Behind The Fleet
              </span>
            }
            subtitle="Explore the history of the USS Constitution and her victories that inspired our roasts."
          />
          <div className="mt-10 grid md:grid-cols-4 gap-6">
            {[
              "java-action",
              "baptism-by-fire",
              "flagship",
              "oak-and-copper",
            ].map((slug) => {
              const card = roastCards.find((c) => c.slug === slug);
              if (!card) return null;
              return (
                <Link
                  key={`story-${card.slug}`}
                  to={`/roast/${card.slug}`}
                  className="group relative overflow-hidden rounded-2xl ring-1 ring-neutral-800 bg-neutral-900/40 hover:bg-neutral-900 transition shadow-lg flex flex-col"
                >
                  <img
                    src={card.img}
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
        </Container>
      </section>

      {/* ===== FROM THE SAND TO THE SEA (unchanged) ===== */}
      <section
        id="origins-service"
        className={`${SECTION_FRAME} scroll-mt-28 md:scroll-mt-36`}
      >
        <img
          src="/iraq-moon.JPG"
          alt="Service backdrop"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-70 z-0 pointer-events-none"
        />
        <div className="absolute inset-0 bg-neutral-950/40 z-0 pointer-events-none" />

        <Container>
          <div className="relative z-10 flex items-center min-h-[900px] md:min-h-[960px] py-12 md:py-16">
            <div className="grid w-full grid-cols-1 md:grid-cols-[auto,1fr,auto] items-center gap-8">
              {/* LEFT HERO */}
              <div className="justify-self-center md:justify-self-start self-center">
                <div className="w-56 sm:w-64 md:w-[19.5rem] lg:w-[22rem] aspect-[4/5] rounded-2xl overflow-hidden ring-1 ring-amber-400 bg-neutral-900/50 shadow-2xl shadow-black/40">
                  <img
                    src="/officer-window.png"
                    alt="Founder portrait"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* CENTER TEXT */}
              <div className="text-center md:text-left self-center">
                <h3 className="font-cinzel text-2xl md:text-3xl font-extrabold text-amber-300 tracking-wide uppercase">
                  From The Sand To The Sea
                </h3>
                <p className="mt-3 text-neutral-300 text-xl md:text-2xl leading-relaxed tracking-[0.02em]">
                  Although my boots were in the sand, not on the deck, the
                  spirit of Old Ironsides has always inspired me. She is a
                  reminder that grit, sacrifice, and courage win the day. Those
                  same values carried me through my service and are now at the
                  heart of Old Ironsides Coffee.
                </p>
              </div>

              {/* RIGHT STACK */}
              <div className="justify-self-center md:justify-self-end">
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
        <img
          src="/flags-ground.jpg"
          alt="Giving back backdrop"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-30 z-0 pointer-events-none"
        />
        <div className="absolute inset-0 bg-neutral-950/40 z-0 pointer-events-none" />

        <Container>
          <div className="relative z-10 min-h-[600px] md:min-h-[700px] py-12 md:py-16 flex items-center">
            <div className="grid grid-cols-1 md:grid-cols-[1fr,auto] gap-4 md:gap-6 items-center w-full">
              {/* Text LEFT */}
              <div className="space-y-3 md:text-left text-center">
                <h3 className="font-cinzel text-3xl md:text-4xl font-extrabold text-amber-300 tracking-wide uppercase">
                  Giving Back To Those Who Served
                </h3>
                <p className="text-neutral-300 text-xl md:text-2xl leading-relaxed tracking-[0.02em]">
                  Even as a startup with thin profits, giving back is at the
                  core of Old Ironsides Coffee. As a combat veteran, I believe
                  supporting organizations that focus on veterans’ health and
                  well-being is not optional, it is who we are. <br /> <br />
                  With every bag sold, we donate a portion of profits to trusted
                  organizations that provide real help to the veterans who need
                  it most.
                </p>
              </div>

              {/* Hero RIGHT */}
              <div className="justify-self-center self-center">
                <div className="w-64 md:w-[32rem] mx-auto aspect-square rounded-xl overflow-hidden ring-1 ring-amber-400 bg-neutral-900/50">
                  <img
                    src="/veteran-chair.jpg"
                    alt="Giving back"
                    className="w-full h-full object-cover"
                  />
                </div>
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
          src="/flag-close.jpg"
          alt="About backdrop"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-30 z-0 pointer-events-none"
        />
        <div className="absolute inset-0 bg-neutral-950/40 z-0 pointer-events-none" />

        <Container>
          <div className="relative z-10 flex items-center min-h-[720px] md:min-h-[820px] py-12 md:py-16">
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
                <h3 className="font-cinzel text-3xl md:text-4xl font-extrabold text-amber-300 tracking-wide uppercase">
                  About Old Ironsides Coffee
                </h3>
                <p className="text-neutral-300 text-xl md:text-2xl leading-relaxed tracking-[0.02em]">
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
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const submit = (e: any) => {
    e.preventDefault();
    if (!emailOk(email)) return alert("Enter a valid email.");
    setSubmitted(true);
  };
  return (
    <main className="py-16 md:py-24">
      <Container>
        <div className="flex items-start justify-between">
          <SectionTitle
            title={
              <span className="text-3xl md:text-5xl font-extrabold text-amber-300">
                Contact — Hail the quarterdeck
              </span>
            }
            subtitle="Questions, wholesale, press – we’ll get back fast."
          />
          <BackButton size="sm" />
        </div>

        <div className="mt-8 grid md:grid-cols-3 gap-6 text-sm">
          <div className="rounded-2xl ring-1 ring-neutral-800 bg-neutral-900/40 p-6">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-amber-300" />
              <span className="text-neutral-300">
                HQ@oldironsidescoffee.org
              </span>
            </div>
            <div className="mt-2 flex items-center gap-3">
              <Phone className="h-5 w-5 text-amber-300" />
              <span className="text-neutral-300">(—) ——— ————</span>
            </div>
            <div className="mt-2 text-neutral-400">
              6 Liberty Square #2564, Boston, MA 02109
            </div>
          </div>
          <div className="rounded-2xl ring-1 ring-neutral-800 bg-neutral-900/40 p-6">
            <h4 className="font-semibold text-amber-300">Ring That Bell</h4>
            <p className="mt-1 text-neutral-400">Join the Fleet and save 10%</p>
            <form onSubmit={submit} className="mt-3 flex gap-3">
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="flex-1 rounded-xl bg-neutral-900/70 border border-neutral-700 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <button className="px-5 py-3 rounded-xl bg-amber-400 text-neutral-900 font-semibold hover:bg-amber-300">
                Join
              </button>
            </form>
            {submitted && (
              <p className="mt-3 text-sm text-emerald-400">
                Welcome aboard — your discount is on the way.
              </p>
            )}
          </div>
          <div className="rounded-2xl ring-1 ring-neutral-800 bg-neutral-900/40 p-6">
            <h4 className="font-semibold text-amber-300">Follow</h4>
            <div className="mt-3 flex gap-4 text-neutral-300">
              <button
                type="button"
                className="inline-flex items-center gap-2 hover:text-amber-300"
              >
                <Instagram className="h-5 w-5" />
                Instagram
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 hover:text-amber-300"
              >
                <Youtube className="h-5 w-5" />
                YouTube
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 hover:text-amber-300"
              >
                <span className="h-5 w-5 grid place-content-center">f</span>
                Facebook
              </button>
            </div>
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

  return (
    <main className="py-16">
      <Container>
        <div className="flex items-start justify-between">
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

          <BackButton size="sm" />
        </div>

        {/* Live roast schedule notice only on Roast & Shipping */}
        {slug === "shipping" && (
          <>
            <div className="mt-6 mb-6 rounded-2xl ring-1 ring-neutral-800 bg-neutral-900/50 p-6">
              <p className="text-sm md:text-base text-neutral-200">
                <>
                  All of our coffees are roasted fresh every Monday and ship
                  Tuesday/Wednesday. <br />
                  <br />
                  Your next eligible roast date is{" "}
                  <span className="font-semibold text-amber-300">
                    {nextRoastLabel()}
                  </span>
                  . <br />
                  <br />
                  Orders placed before 5 p.m. EST on Sunday make that week’s
                  roast; after that, they roll to the following week. <br />
                  Because we roast to order, your coffee won’t arrive overnight
                  like Amazon, but it will arrive fresh. <br />
                  Need it sooner? Leave a note at checkout or reply to your
                  confirmation email — we’ll do our best to accommodate.
                  <br />
                  <br />
                  We use UPS standard shipping for all orders.
                </>
              </p>
            </div>
          </>
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
                    cannot accept returns on roasted coffee. If your order
                    arrives damaged or something is wrong, we will make it
                    right.
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
                    We’ll always make it right
                  </h3>
                  <p className="mt-1">
                    If your package is damaged, the coffee is defective in any
                    way, or we made a mistake, contact us. We will replace it or
                    refund you.
                  </p>
                </div>

                <div>
                  <h3 className="text-amber-300 font-semibold">
                    If you’re unhappy
                  </h3>
                  <p className="mt-1">
                    Email us and we will not leave you at the harbor. We can
                    recommend a better fit, credit your account, or find a fix.
                  </p>
                </div>

                <div>
                  <h3 className="text-amber-300 font-semibold">
                    How to report an issue (quick steps)
                  </h3>
                  <ol className="mt-1 list-decimal list-outside pl-5 space-y-1">
                    <li>Contact us within 7 days of delivery.</li>
                    <li>
                      Include your order number, a brief note on the issue, and
                      photos if the package or bag is damaged.
                    </li>
                    <li>We’ll reply with a replacement or refund plan.</li>
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
                      href="mailto:HQ@oldironsidescoffee.org"
                      className="text-amber-300 hover:underline"
                    >
                      HQ@oldironsidescoffee.org
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
                      Not happy? Email us. We can recommend a better fit, credit
                      your account, or find a solution.
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
                    agreement to arbitrate. Arbitration will take place in
                    Suffolk County, Massachusetts, unless we agree otherwise,
                    and may be conducted by telephone or video when appropriate.
                    You and we each waive the right to a jury trial and to
                    participate in a class action or class-wide arbitration;
                    claims must be brought individually. Either party may bring
                    an individual claim in small-claims court if eligible. You
                    may opt out by sending written notice to{" "}
                    <a
                      href="mailto:hq@oldironsidescoffee.org"
                      className="text-amber-300 hover:underline"
                    >
                      hq@oldironsidescoffee.org
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
                    These Terms are governed by the laws of the Commonwealth of
                    Massachusetts, without regard to conflict-of-laws rules. The
                    Federal Arbitration Act governs the arbitration provision.
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
                      href="mailto:hq@oldironsidescoffee.org"
                      className="text-amber-300 hover:underline"
                    >
                      hq@oldironsidescoffee.org
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

            {/* Contact */}
            <div className="space-y-2">
              <h3 className="text-amber-300 font-semibold">
                Contact for privacy questions and requests
              </h3>
              <p className="text-neutral-300">
                Email:{" "}
                <a
                  href="mailto:HQ@oldironsidescoffee.org"
                  className="text-amber-300 hover:underline"
                >
                  HQ@oldironsidescoffee.org
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
                  as defined by applicable law. If you provide any such
                  information to us, we will handle it as required by law and
                  will delete or restrict it when appropriate.
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
                  products and services (<em>legitimate interests</em>
                  ).
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
                  <span className="font-semibold">Business partners:</span> for
                  joint promotions or collaborations.
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
                    href="mailto:HQ@oldironsidescoffee.org"
                    className="text-amber-300 hover:underline"
                  >
                    HQ@oldironsidescoffee.org
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
                <span className="font-semibold">How to submit a request:</span>{" "}
                email{" "}
                <a
                  href="mailto:HQ@oldironsidescoffee.org"
                  className="text-amber-300 hover:underline"
                >
                  HQ@oldironsidescoffee.org
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
                such as 20 percent off, we collect your email and marketing
                preferences in exchange for the incentive. You can withdraw at
                any time by unsubscribing or canceling the subscription. We
                estimate the value of the incentive based on the cost of running
                the program and expected revenue from increased engagement.
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
                We are based in the United States. If you access the services
                from outside the United States, your information may be
                transferred to, stored in, or processed in the United States or
                other countries that may not provide the same level of data
                protection as your home jurisdiction. We will protect your
                information as described in this Policy and as required by
                applicable law.
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
                  href="mailto:HQ@oldironsidescoffee.org"
                  className="text-amber-300 hover:underline"
                >
                  HQ@oldironsidescoffee.org
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

function CartPage() {
  const { cart, inc, dec, remove, subtotal } = useCart();
  // Sidebar "Ring That Bell" state/submit (mimics MegaSubscribeBox)
  const [sbEmail, setSbEmail] = useState("");
  const [sbDone, setSbDone] = useState(false);
  const onSbSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOk(sbEmail)) return alert("Enter a valid email.");
    setSbDone(true);
    window.dispatchEvent(
      new CustomEvent("flash", {
        detail: "Welcome aboard — your discount is on the way.",
      })
    );
    setSbEmail("");
  };

  return (
    <main className="pt-28 md:pt-36 pb-16 md:pb-24">
      <Container>
        <div className="flex items-start justify-between">
          <SectionTitle title="Chest" />
          <BackButton size="sm" />
        </div>

        {cart.length ? (
          <div>
            {/* Message centered, nudged upward toward banner */}
            <div className="mb-6 text-center relative">
              <p className="text-sm md:text-base text-blue-300 relative -top-[50px]">
                <>
                  All of our coffees are roasted fresh every Monday and ship
                  Tuesday/Wednesday. <br />
                  Your next eligible roast date is{" "}
                  <span className="font-semibold text-amber-300">
                    {nextRoastLabel()}
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
                      <div className="text-xs text-neutral-400">
                        {item.variant}
                      </div>
                      <div className="mt-1 text-sm">{fmt(item.price)}</div>
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
              </div>

              {/* Checkout sidebar */}
              <aside className="space-y-6">
                {/* Checkout box */}
                <div className="rounded-xl ring-1 ring-neutral-800 bg-neutral-900/50 p-6 h-max">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-400">Subtotal</span>
                    <span className="font-semibold">{fmt(subtotal)}</span>
                  </div>
                  <button className="mt-4 w-full px-4 py-2 rounded-lg bg-amber-400 text-neutral-900 font-semibold hover:bg-amber-300">
                    Checkout
                  </button>
                </div>

                {/* Ring That Bell subscribe box — EXACT mimic of MegaSubscribeBox visual */}
                <div className="rounded-2xl ring-1 ring-amber-400/60 bg-neutral-900/60 p-8 text-center">
                  <div className="flex items-center justify-center gap-3 mb-3">
                    <Bell className="h-7 w-7 text-amber-300" />
                    <h3 className="text-2xl font-extrabold text-amber-300">
                      Ring That Bell
                    </h3>
                  </div>
                  <p className="text-neutral-300 mb-5 text-lg md:text-xl">
                    Join the Fleet and save 15%
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
                      placeholder="you@domain.com"
                      className="flex-1 rounded-xl bg-neutral-900/70 border border-neutral-700 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                    <button className="px-6 py-3 rounded-xl bg-amber-400 text-neutral-900 font-semibold hover:bg-amber-300">
                      Join
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
                      Welcome aboard — your discount is on the way.
                    </p>
                  )}
                </div>
              </aside>
            </div>
          </div>
        ) : (
          <div className="mt-6 rounded-2xl ring-1 ring-neutral-800 bg-neutral-900/40 p-10 text-center">
            <p className="text-neutral-400">
              No items yet. Sail back to the{" "}
              <Link to="/store" className="text-amber-300 hover:underline">
                Harbor
              </Link>
              .
            </p>
          </div>
        )}
      </Container>
    </main>
  );
}
/* ===================== Account / Subscribe & Manage ===================== */
function SubscribeManagePage({
  initialTab = "overview",
}: {
  initialTab?: "overview" | "login";
}) {
  // super-light “auth” using localStorage (swap later)
  const [user, setUser] = useState<any>(() => {
    try {
      return JSON.parse(localStorage.getItem("oi_user") || "null");
    } catch {
      return null;
    }
  });
  const [tab, setTab] = useState<
    "overview" | "login" | "subscriptions" | "orders" | "profile"
  >(initialTab ?? (user ? "overview" : "login"));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Mock data so the UI works now
  const [subs, setSubs] = useState<any[]>([
    {
      id: "sub_1",
      product: "Flagship Medium Roast",
      nextCharge: "2025-10-10",
      frequency: "Monthly",
      status: "active",
    },
  ]);
  const [orders, setOrders] = useState<any[]>([
    {
      id: "ORD-10001",
      date: "2025-08-01",
      total: 44.0,
      items: [{ title: "Flagship Medium Roast", qty: 2 }],
    },
  ]);

  useEffect(() => {
    if (!user) setTab("login");
  }, [user]);

  // ---------- Auth (mock today) ----------
  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") || "");
    const password = String(fd.get("password") || "");
    try {
      if (!emailOk(email) || !password)
        throw new Error("Check your email and password.");
      // INTEGRATE HERE: call Shopify Storefront (customerAccessTokenCreate) or Jack's backend login.
      await new Promise((r) => setTimeout(r, 400));
      const u = { id: "c1", email, name: email.split("@")[0] };
      localStorage.setItem("oi_user", JSON.stringify(u));
      setUser(u);
      setTab("overview");
      window.dispatchEvent(
        new CustomEvent("flash", { detail: "Welcome back!" })
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
    const password = String(fd.get("password") || "");
    try {
      if (!name || !emailOk(email) || !password)
        throw new Error("Fill all fields.");
      // INTEGRATE HERE: call Shopify Storefront customerCreate OR Jack's signup endpoint.
      await new Promise((r) => setTimeout(r, 500));
      const u = { id: "c1", email, name };
      localStorage.setItem("oi_user", JSON.stringify(u));
      setUser(u);
      setTab("overview");
      window.dispatchEvent(
        new CustomEvent("flash", { detail: "Account created!" })
      );
    } catch (err: any) {
      setError(err?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("oi_user");
    setUser(null);
    setTab("login");
  }

  // ---------- Subscription actions (mock today) ----------
  async function skipNextCharge(subId: string) {
    // INTEGRATE HERE: call Recharge/Skio/Bold or Jack’s subscription API.
    setSubs((list) =>
      list.map((s) => (s.id === subId ? { ...s, nextCharge: "2025-11-10" } : s))
    );
    window.dispatchEvent(
      new CustomEvent("flash", { detail: "Next delivery skipped." })
    );
  }
  async function pauseSub(subId: string) {
    setSubs((list) =>
      list.map((s) => (s.id === subId ? { ...s, status: "paused" } : s))
    );
    window.dispatchEvent(
      new CustomEvent("flash", { detail: "Subscription paused." })
    );
  }
  async function cancelSub(subId: string) {
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

  if (!user && tab === "login") {
    return (
      <main className="py-16 md:py-24">
        <Container>
          <div className="flex items-start justify-between">
            <SectionTitle
              title={
                <span className="text-3xl md:text-5xl font-extrabold text-amber-300">
                  Account
                </span>
              }
              subtitle="Log in or create an account to manage subscriptions and orders."
            />
            <BackButton size="sm" />
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
                  placeholder="you@domain.com"
                  className="w-full rounded-lg bg-neutral-900/70 border border-neutral-700 px-3 py-2 text-sm"
                />
                <input
                  name="password"
                  type="password"
                  placeholder="password"
                  className="w-full rounded-lg bg-neutral-900/70 border border-neutral-700 px-3 py-2 text-sm"
                />
                {error && <div className="text-sm text-red-300">{error}</div>}
                <button
                  disabled={loading}
                  className="w-full px-4 py-2 rounded-lg bg-amber-400 text-neutral-900 font-semibold hover:bg-amber-300"
                >
                  {loading ? "…" : "Log in"}
                </button>
              </div>
            </form>

            {/* Register */}
            <form
              onSubmit={handleRegister}
              className="rounded-2xl ring-1 ring-neutral-800 bg-neutral-900/50 p-6"
            >
              <div className="text-lg font-semibold text-amber-300 mb-3">
                Create account
              </div>
              <div className="space-y-3">
                <input
                  name="name"
                  placeholder="Your name"
                  className="w-full rounded-lg bg-neutral-900/70 border border-neutral-700 px-3 py-2 text-sm"
                />
                <input
                  name="email"
                  type="email"
                  placeholder="you@domain.com"
                  className="w-full rounded-lg bg-neutral-900/70 border border-neutral-700 px-3 py-2 text-sm"
                />
                <input
                  name="password"
                  type="password"
                  placeholder="password"
                  className="w-full rounded-lg bg-neutral-900/70 border border-neutral-700 px-3 py-2 text-sm"
                />
                <button
                  disabled={loading}
                  className="w-full px-4 py-2 rounded-lg bg-amber-400 text-neutral-900 font-semibold hover:bg-amber-300"
                >
                  {loading ? "…" : "Create account"}
                </button>
              </div>
            </form>
          </div>
        </Container>
      </main>
    );
  }

  // ---------- Logged-in view ----------
  return (
    <main className="py-16 md:py-24">
      <Container>
        <div className="flex items-start justify-between">
          <SectionTitle
            title={
              <span className="text-3xl md:text-5xl font-extrabold text-amber-300">
                Account
              </span>
            }
            subtitle={
              <span className="text-neutral-300">
                Welcome,{" "}
                <span className="text-amber-300 font-semibold">
                  {user?.name || user?.email}
                </span>
              </span>
            }
          />
          <BackButton size="sm" />
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

        {/* PANELS */}
        {tab === "overview" && (
          <div className="mt-6 grid md:grid-cols-3 gap-6">
            <div className="rounded-2xl ring-1 ring-neutral-800 bg-neutral-900/50 p-6">
              <div className="text-amber-300 font-semibold">Next Delivery</div>
              <div className="mt-2 text-neutral-300 text-sm">
                {subs[0]
                  ? `${subs[0].product} — ${subs[0].nextCharge}`
                  : "No active subscriptions."}
              </div>
              <Link
                to="#"
                onClick={() => setTab("subscriptions")}
                className="mt-3 inline-block text-amber-300 text-sm"
              >
                Manage subscription →
              </Link>
            </div>
            <div className="rounded-2xl ring-1 ring-neutral-800 bg-neutral-900/50 p-6">
              <div className="text-amber-300 font-semibold">Recent Order</div>
              <div className="mt-2 text-neutral-300 text-sm">
                {orders[0]
                  ? `${orders[0].id} — ${orders[0].date}`
                  : "No orders yet."}
              </div>
              <Link
                to="#"
                onClick={() => setTab("orders")}
                className="mt-3 inline-block text-amber-300 text-sm"
              >
                View orders →
              </Link>
            </div>
            <div className="rounded-2xl ring-1 ring-neutral-800 bg-neutral-900/50 p-6">
              <div className="text-amber-300 font-semibold">Payment Method</div>
              <div className="mt-2 text-neutral-300 text-sm">
                Update your card securely.
              </div>
              {/* INTEGRATE HERE: link to hosted card update (Recharge/Skio/Bold) or Jack’s PCI-compliant page */}
              <button className="mt-3 px-3 py-2 rounded-lg bg-amber-400 text-neutral-900 text-sm font-semibold">
                Update card
              </button>
            </div>
          </div>
        )}

        {tab === "subscriptions" && (
          <div className="mt-6 grid gap-4">
            {subs.length === 0 && (
              <div className="text-neutral-400">No active subscriptions.</div>
            )}
            {subs.map((s) => (
              <div
                key={s.id}
                className="rounded-2xl ring-1 ring-neutral-800 bg-neutral-900/50 p-6"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <div className="font-semibold text-amber-300">
                    {s.product}
                  </div>
                  <div className="text-sm text-neutral-400">
                    • Next: {s.nextCharge}
                  </div>
                  <div className="text-sm text-neutral-400">
                    • {s.frequency}
                  </div>
                  <div className="text-xs ml-auto rounded px-2 py-1 ring-1 ring-neutral-700 text-neutral-300">
                    {s.status}
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => skipNextCharge(s.id)}
                    className="px-3 py-2 rounded-lg border border-neutral-700 hover:border-amber-400/50 text-sm"
                  >
                    Skip next
                  </button>
                  <button
                    onClick={() => pauseSub(s.id)}
                    className="px-3 py-2 rounded-lg border border-neutral-700 hover:border-amber-400/50 text-sm"
                  >
                    Pause
                  </button>
                  <button
                    onClick={() => cancelSub(s.id)}
                    className="px-3 py-2 rounded-lg border border-red-800 text-red-300 hover:border-red-600 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "orders" && (
          <div className="mt-6 grid gap-4">
            {orders.map((o) => (
              <div
                key={o.id}
                className="rounded-2xl ring-1 ring-neutral-800 bg-neutral-900/50 p-6"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <div className="font-semibold text-amber-300">{o.id}</div>
                  <div className="text-sm text-neutral-400">• {o.date}</div>
                  <div className="text-sm text-neutral-400">
                    • {fmt(o.total)}
                  </div>
                </div>
                <ul className="mt-2 text-sm text-neutral-300 list-disc list-inside">
                  {o.items.map((it: any, i: number) => (
                    <li key={i}>
                      {it.title} × {it.qty}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {tab === "profile" && (
          <div className="mt-6 grid md:grid-cols-2 gap-6">
            <div className="rounded-2xl ring-1 ring-neutral-800 bg-neutral-900/50 p-6">
              <div className="text-amber-300 font-semibold">Contact</div>
              <div className="mt-2 text-sm text-neutral-300">
                Email: {user?.email}
              </div>
              {/* INTEGRATE HERE: addresses from Shopify Storefront API or Jack's backend */}
              <div className="mt-4 text-sm text-neutral-400">
                Addresses coming soon.
              </div>
            </div>
            <div className="rounded-2xl ring-1 ring-neutral-800 bg-neutral-900/50 p-6">
              <div className="text-amber-300 font-semibold">Security</div>
              <div className="mt-2 text-sm text-neutral-300">
                Change password (coming soon).
              </div>
              {/* INTEGRATE HERE: password update via backend */}
            </div>
          </div>
        )}
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
  const [open, setOpen] = React.useState(false);
  const [email, setEmail] = React.useState("");

  React.useEffect(() => {
    const onOpen = () => {
      setOpen(true);
      setEmail("");
    };

    // Listen on BOTH window and document for maximum reliability
    window.addEventListener("promo-subscribe", onOpen as any);
    document.addEventListener("promo-subscribe", onOpen as any);

    return () => {
      window.removeEventListener("promo-subscribe", onOpen as any);
      document.removeEventListener("promo-subscribe", onOpen as any);
    };
  }, []);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOk(email)) return alert("Enter a valid email.");

    // mark as subscribed so the banner will not show again
    localStorage.setItem("promo_subscribed", "1");

    setOpen(false);
    setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent("flash", {
          detail: "Welcome aboard - your 20% code is on the way.",
        })
      );
    }, 75);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Get 20% off your first order"
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative z-10 w-[98vw] max-w-6xl">
        <div className="relative rounded-2xl ring-1 ring-amber-400/60 bg-neutral-900/60 overflow-hidden">
          {/* Body: LEFT hero, RIGHT content */}
          <div className="grid md:grid-cols-[auto,1fr] items-center gap-0">
            {/* LEFT: hero image in a bordered card (no crop) */}
            <div className="hidden md:flex items-center justify-start pl-6 pr-0 py-6">
              <div className="rounded-2xl ring-1 ring-amber-400 bg-neutral-900/60 p-2 shadow-2xl shadow-black/40">
                <div className="w-[18rem] lg:w-[20rem] aspect-[4/5]">
                  <img
                    src="/captain-deck.png"
                    alt="Hero"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            </div>

            {/* RIGHT: centered content, snug to hero */}
            <div className="py-8 md:py-10 pl-3 md:pl-4 pr-8 md:pr-10 md:-ml-8">
              <div className="h-full w-full flex flex-col items-center justify-center text-center">
                <div className="flex items-center justify-center gap-3 mb-3">
                  {/* 50% larger icon and title */}
                  <Bell className="h-12 w-12 text-amber-300" />
                  <h3 className="font-extrabold text-amber-300 text-[2.5875rem] leading-tight">
                    Ring That Bell
                  </h3>
                </div>

                {/* Keep on one line on md+ */}
                <p className="text-neutral-300 mb-5 text-lg md:text-xl md:whitespace-nowrap">
                  Join the Fleet and save 20% on your first order
                </p>

                <div className="w-full max-w-lg mx-auto">
                  <form
                    onSubmit={onSubmit}
                    className="flex gap-3 justify-center"
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
                      placeholder="you@domain.com"
                      className="flex-1 rounded-xl bg-neutral-900/70 border border-neutral-700 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                    <button className="px-6 py-3 rounded-xl bg-amber-400 text-neutral-900 font-semibold hover:bg-amber-300">
                      Join
                    </button>
                  </form>

                  {/* 25% larger + centered; cancel line below */}
                  <div className="mt-3 text-[0.9375rem] text-neutral-400 text-center">
                    Already a member?{" "}
                    <Link
                      to="/account/login"
                      className="text-amber-300 hover:underline"
                      onClick={() => {
                        localStorage.setItem("promo_subscribed", "1");
                        setOpen(false);
                      }}
                    >
                      Sign in
                    </Link>
                  </div>

                  <div className="mt-1 text-xs text-neutral-400 text-center">
                    Cancel anytime
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* FOOTER: centered “closer” buy-box button */}
          <div className="border-t border-neutral-800 p-4 md:p-5 flex justify-center bg-neutral-900/40">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex items-center justify-center px-5 py-2 rounded-xl ring-1 ring-amber-400/60 
                         text-amber-400 font-semibold text-base md:text-lg
                         hover:bg-amber-400 hover:text-neutral-900 transition-all"
              aria-label="Close banner"
            >
              Tax me like it&apos;s 1773. Give my 20% to the Redcoats.
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
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
  const isFleet = location.pathname.startsWith("/coffee");
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
  // Close the mega panel whenever the route changes
  useEffect(() => {
    setOpenMega(null);
  }, [location.pathname, location.search, location.hash]);

  // Inline subscribe state for Origins mega panel
  const [mmEmail, setMmEmail] = useState("");
  const [mmDone, setMmDone] = useState(false);
  const submitMegaSubscribe = (e: any) => {
    e.preventDefault();
    if (!emailOk(mmEmail)) return alert("Enter a valid email.");
    setMmDone(true);
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
    { key: "mugs", label: "Mugs", img: "Mugs-deck.png" },
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
      <header className="fixed top-0 inset-x-0 z-50 bg-neutral-950/95 backdrop-blur border-b border-neutral-800">
        {/* === TOP BAR (40px) === */}
        <div className="border-b border-neutral-800">
          <Container>
            <div className="h-10 flex items-center relative">
              {/* Centered promo text */}
              <div className="absolute left-1/2 -translate-x-1/2 text-amber-300 text-xs md:text-sm font-semibold tracking-wide text-center space-x-3">
                {/* First Order button now opens modal */}
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

                {/* Subscribe & Save link */}
                <Link to="/account/login" className="hover:text-amber-200">
                  15% OFF Subscribe &amp; Save
                </Link>

                <span>|</span>

                {/* Free Shipping link */}
                <Link to="/legal/shipping" className="hover:text-amber-200">
                  Free Shipping on 3+ Bags
                </Link>
              </div>

              {/* Right-aligned My Fleet login */}
              <Link
                to="/account"
                className="ml-auto inline-flex items-center gap-2 text-amber-300 hover:text-amber-200 text-sm md:text-base font-semibold"
                aria-label="My Fleet"
                title="My Fleet"
              >
                <span aria-hidden className="text-lg md:text-xl">
                  ⚓
                </span>
                <span>My Fleet</span>
              </Link>
            </div>
          </Container>
        </div>

        <Container>
          <div
            className={
              (shrunk ? "pt-2 md:pt-3 pb-2" : "pt-6 md:pt-8 pb-3") + " relative"
            }
          >
            {/* ===== HEADER STACK + NAV (fixed CHEST) ===== */}

            {/* Centered stack; emblem sits to the left and does NOT affect width */}
            <div className="relative mx-auto w-max">
              {/* Emblem to the LEFT of the centered stack (clickable) */}
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

              {/* Title + taglines */}
              <div className="flex flex-col items-center">
                <div
                  className={
                    shrunk
                      ? "text-2xl md:text-4xl font-bold tracking-[0.18em] text-neutral-300 text-center"
                      : "text-3xl md:text-5xl font-bold tracking-[0.18em] text-neutral-300 text-center"
                  }
                  style={{ fontFamily: "'Cinzel', serif", fontWeight: 700 }}
                >
                  OLD IRONSIDES COFFEE
                </div>

                <div
                  className={
                    shrunk
                      ? "text-xs md:text-sm text-amber-200 text-center"
                      : "text-sm md:text-lg text-amber-200 text-center"
                  }
                >
                  Ignite the Spirit, Savor the Victory!
                </div>
                <div
                  className={
                    shrunk
                      ? "hidden md:block md:text-sm text-neutral-300 text-center"
                      : "text-sm md:text-base text-neutral-300 text-center"
                  }
                >
                  Proudly Veteran-owned
                </div>
              </div>
            </div>

            {/* === NAV ROW (relative wrapper) ===
   - nav is centered
   - CHEST is absolutely pinned to the right INSIDE this row
   - No padding shims, no overlap math */}
            <div
              className="relative mt-3"
              onMouseEnter={cancelClose}
              onMouseLeave={scheduleClose}
            >
              {/* CHEST pinned to the right of this row */}
              <Link
                to="/cart"
                className="hidden md:flex items-center gap-3 h-11 px-4 rounded-xl
             ring-1 ring-amber-400/60 bg-neutral-900/60 text-amber-300
             hover:bg-amber-400 hover:text-neutral-900 transition shadow-lg
             divide-x divide-neutral-700 z-30 absolute right-0 top-1/2 -translate-y-1/2"
                aria-label="Open Chest (Cart)"
                title="Chest"
              >
                <span className="flex items-center gap-2 pr-3">
                  <ChestIcon className="h-6 w-6" />
                  <span className="uppercase tracking-wide font-bold text-base md:text-lg">
                    CHEST
                  </span>
                </span>
                <span className="pl-3 font-bold tabular-nums text-base md:text-lg">
                  {count ?? 0}
                </span>
              </Link>

              {/* Centered nav */}
              <nav className="flex justify-center">
                <div className="flex items-center gap-6">
                  {/* COFFEE */}
                  <div
                    onMouseEnter={() => {
                      cancelClose();
                      setOpenMega("coffee");
                    }}
                    className="relative"
                  >
                    <HeaderNavLink to="/coffee">SHOP COFFEE</HeaderNavLink>
                  </div>

                  {/* MERCH */}
                  <div
                    onMouseEnter={() => {
                      cancelClose();
                      setOpenMega("merch");
                    }}
                    className="relative"
                  >
                    <HeaderNavLink to="/store#merch">GEAR</HeaderNavLink>
                  </div>

                  {/* ORIGINS */}
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

                  {/* CONTACT */}
                  <HeaderNavLink to="/contact">CONTACT THE CREW</HeaderNavLink>
                </div>
              </nav>

              {/* Mega menu panel (full content, unchanged except wrapper positioning) */}
              {openMega && (
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
                          (panelRef.current as any).matches?.(":focus-within"));
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
                          (panelRef.current as any).matches?.(":focus-within"));
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
                        {/* COFFEE PANEL */}
                        {openMega === "coffee" && (
                          <div className="grid lg:grid-cols-[1fr,auto] gap-8 items-start">
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                              {roastCards.map((card) => (
                                <Link
                                  key={`mega-roast-${card.id}`}
                                  to={`/roast/${card.slug}`}
                                  onClick={() => setOpenMega(null)}
                                  className="group relative overflow-hidden rounded-2xl ring-1 ring-neutral-800 bg-neutral-900/40 hover:bg-neutral-900 transition shadow-lg flex flex-col"
                                >
                                  <img
                                    src={card.img}
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
                                    <div className="text-xs text-neutral-400">
                                      {card.variant}
                                    </div>
                                    <div className="text-xs md:text-sm text-neutral-300">
                                      {card.subTitle}
                                    </div>
                                  </div>
                                </Link>
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

                        {/* MERCH PANEL */}
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
                              title="Ring That Bell"
                              subtitle="Get first access to gear — plus 15% off your coffee."
                              buttonText="Join"
                            />
                          </div>
                        )}

                        {/* ORIGINS PANEL */}
                        {openMega === "origins" && (
                          <div className="grid md:grid-cols-[auto,1fr,auto] gap-8 items-start">
                            <Link
                              to="/coffee"
                              onClick={() => setOpenMega(null)}
                              className="group block rounded-2xl overflow-hidden ring-1 ring-neutral-800 bg-neutral-900/40 hover:bg-neutral-900 transition text-center justify-self-center md:justify-self-start w-40 sm:w-48 md:w-56"
                            >
                              <div className="aspect-[4/3] w-full overflow-hidden">
                                <img
                                  src={flagship?.img || "Flagship-web.png"}
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
      </header>

      {/* spacer so content doesn’t hide under header */}
      <div
        className={
          isHome
            ? "h-[175px] md:h-[205px]" // HOME
            : isFleet
            ? "h-[130px] md:h-[150px]" // FLEET
            : isRoast
            ? "h-[160px] md:h-[190px]" // ROAST
            : isOrigins
            ? "h-[180px] md:h-[210px]" // ORIGINS
            : isSupport
            ? "h-[170px] md:h-[200px]" // SUPPORT (legal/contact)
            : "h-[140px] md:h-[160px]" // Default
        }
      />

      <Outlet />
      <footer className="border-t border-neutral-800 bg-neutral-950">
        <Container className="py-14 text-sm">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Brand + Vet-owned + Flag (centered and nudged up) */}
            <div className="relative -top-4 md:-top-5 flex flex-col items-center text-center">
              {/* Title */}
              <div className="text-base tracking-[0.5em] text-amber-300">
                OLD IRONSIDES COFFEE
              </div>

              {/* Vet line (aligned with Support) */}
              <div className="mt-0 text-base text-neutral-300 leading-tight">
                Veteran-owned and operated.
              </div>

              {/* Flag, centered just below vet line */}
              <img
                src="/stars-stripes.png"
                alt="American flag"
                className="mt-1 w-44 h-auto rounded-sm shadow-md"
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
                    Roast & Shipping
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
              </ul>
            </div>

            {/* Contact */}
            <div>
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
            <div>
              <div className="text-neutral-400 font-semibold mb-2">Follow</div>
              <div className="flex gap-4 text-neutral-300">
                <a
                  href="https://instagram.com/oldironsidescoffee"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-amber-300"
                >
                  Instagram
                </a>
                <a
                  href="https://youtube.com/@oldironsidescoffee"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-amber-300"
                >
                  YouTube
                </a>
                <a
                  href="https://facebook.com/oldironsidescoffee"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-amber-300"
                >
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
    <div className="mt-3 text-center leading-tight">
      {state === "countdown" ? (
        <div className="space-y-1">
          <div className="text-xs md:text-sm text-neutral-300 font-medium">
            Next batch roasts:{" "}
            <span className="text-amber-300">{dateLabel}</span>{" "}
            <span className="text-neutral-400"></span>
          </div>
          <div className="text-xs md:text-sm text-neutral-400">
            Time left to make the next roast:{" "}
            <span className="text-amber-300">{left}</span> <br /> Secure your
            fresh order now.
          </div>
        </div>
      ) : state === "closed" ? (
        <div className="space-y-1">
          <div className="text-xs md:text-sm text-neutral-300 font-medium">
            Next batch roasts:{" "}
            <span className="text-amber-300">{dateLabel}</span>{" "}
            <span className="text-neutral-400"></span>
          </div>
          <div className="text-xs md:text-sm text-neutral-400">
            Reserve your bag today.
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
  );
}

/* ================= App Entrypoint ================= */
function AppShell() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="coffee" element={<FleetPage />} />
        <Route path="roast/:slug" element={<RoastDetailPage />} />
        <Route path="store" element={<StorePage />} />
        <Route path="store/:slug" element={<StoreCategoryPage />} />
        {/* mission removed; merged into Origins */}
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
    <MemoryRouter initialEntries={["/"]}>
      <CartProvider>
        <ErrorBoundary>
          <AppShell />
        </ErrorBoundary>
      </CartProvider>
    </MemoryRouter>
  );
}
