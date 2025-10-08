import React, {
  useState,
  useMemo,
  useContext,
  createContext,
  useEffect,
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
    subTitle: "Coming Soon",
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
    persist(
      (() => {
        const copy = [...cart];
        const idx = copy.findIndex((x) => x.id === item.id);
        if (idx >= 0) copy[idx] = { ...copy[idx], qty: copy[idx].qty + qty };
        else copy.push({ ...item, qty });
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
  const { add } = useCart();
  const [qtyById, setQtyById] = useState<Record<string, number>>({});
  const getQty = (id: string) => Math.max(1, qtyById[id] ?? 1);
  const setQty = (id: string, next: number) =>
    setQtyById((q) => ({
      ...q,
      [id]: Math.max(1, Math.min(99, Math.trunc(next || 1))),
    }));
  const handleAdd = (card: any) => {
    const qty = getQty(card.id);
    add(card, qty);
    window.dispatchEvent(
      new CustomEvent("flash", {
        detail: `${qty} × ${card.title} added to Chest`,
      })
    );
  };
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
                LAUNCHED FROM HARBOR
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
            <div
              key={card.id}
              className="group relative overflow-hidden rounded-2xl ring-1 ring-neutral-800 bg-neutral-900/40 hover:bg-neutral-900 transition shadow-lg flex flex-col"
            >
              <Link to={`/roast/${card.slug}`}>
                <img
                  src={card.img}
                  alt={card.title}
                  className="h-72 sm:h-80 md:h-96 w-full object-cover"
                />
              </Link>

              <div className="p-5 flex flex-col flex-1">
                <div className="flex items-center justify-between">
                  <h3
                    className="text-3xl md:text-4xl font-extrabold text-amber-300"
                    style={{ fontFamily: "'Cinzel', serif", fontWeight: 800 }}
                  >
                    {card.title}
                  </h3>
                </div>
                <p className="text-base italic text-neutral-500">
                  {card.subTitle}
                </p>
                <p className="text-sm text-neutral-400">{card.variant}</p>
                <p className="text-sm text-neutral-400 flex-1">{card.note}</p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="mt-4 flex items-center gap-3">
                    <div className="text-sm text-neutral-300">
                      {card.slug === "oak-and-copper" ? (
                        <span className="text-neutral-500">—</span>
                      ) : (
                        fmt(card.price)
                      )}
                    </div>

                    {card.canBuy ? (
                      <>
                        <div className="ml-auto inline-flex items-center rounded-lg border border-neutral-700">
                          <button
                            type="button"
                            onClick={() => setQty(card.id, getQty(card.id) - 1)}
                            className="px-2 py-1 hover:bg-neutral-800 rounded-l-lg"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <input
                            value={getQty(card.id)}
                            onChange={(e) =>
                              setQty(card.id, Number(e.target.value))
                            }
                            inputMode="numeric"
                            pattern="[0-9]*"
                            className="w-12 text-center bg-neutral-900/70 py-1 text-sm outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setQty(card.id, getQty(card.id) + 1)}
                            className="px-2 py-1 hover:bg-neutral-800 rounded-r-lg"
                            aria-label="Increase quantity"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>

                        <button
                          onClick={() => handleAdd(card)}
                          className="px-3 py-2 rounded-lg font-semibold bg-amber-400 text-neutral-900 hover:bg-amber-300"
                          aria-label={`Add ${card.title} to Chest`}
                        >
                          Add to Chest
                        </button>
                      </>
                    ) : (
                      <Link
                        to={`/roast/${card.slug}`}
                        className="ml-auto px-3 py-2 rounded-lg font-semibold border border-neutral-700 hover:border-amber-400/50 hover:text-amber-300"
                      >
                        Reserve / Learn
                      </Link>
                    )}
                  </div>
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
                      className="self-start w-[12.5rem] h-[15rem] md:w-[13.75rem] md:h-[16.25rem] translate-y-6 md:translate-y-8 rounded-xl object-cover ring-1 ring-amber-500 shadow-2xl shadow-black/30"
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

                    <div className="mt-1 text-neutral-300 text-base md:text-xl">
                      Ethically Sourced • Roasted to Order • Veteran Owned
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
function RoastDetailPage() {
  const { slug } = useParams();
  const card = roastCards.find((c) => c.slug === slug);
  if (!card) return <NotFoundPage />;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const isFlagship = card.slug === "flagship";
  const isBaptism = card.title === "Baptism by Fire";
  const isJava = card.slug === "java-action";
  const isOak = card.slug === "oak-and-copper";

  const { add } = useCart();
  const [purchaseMode, setPurchaseMode] = useState<"one" | "sub">("one");
  const [subEvery, setSubEvery] = useState<14 | 30 | 60>(30);
  const [qty, setQty] = useState(1);
  const discounted = Number((card.price * 0.85).toFixed(2));

  const addToChest = () => {
    const n = Math.max(1, Math.min(99, Math.trunc(qty || 1)));
    setQty(n);
    add(
      { ...card, price: purchaseMode === "sub" ? discounted : card.price },
      n
    );
    window.dispatchEvent(
      new CustomEvent("flash", {
        detail: `${n} × ${card.title} added to Chest`,
      })
    );
  };

  const AMBER_DESC = isFlagship
    ? "Our everyday staple, Flagship is a breakfast-style medium roast that is smooth, reliable, and never bitter. A roast you can reach for day after day."
    : isBaptism
    ? "Our darkest and most intense roast in the fleet — full-bodied and unyielding, with a finish so smooth you have to taste it to believe it."
    : isJava
    ? "Medium roast description placeholder — balanced, decisive finish. (Update copy)"
    : isOak
    ? "Barrel-aged description placeholder — oak, vanilla, caramel notes. (Update copy)"
    : "";
  // Origins by roast
  let origins: string[] = [];
  if (isFlagship) origins = ["El Salvador", "Indonesia"];
  else if (isBaptism) origins = ["Indonesia", "Colombia"];
  else if (isJava) origins = ["Guatemala", "Ethiopia", "Colombia"];
  else if (isOak) origins = ["Colombia", "Indonesia"];

  // Roast level by roast (1–5)
  const roastLevel = isBaptism ? 4 : 3; // Flagship, Java, Oak = 3; Baptism = 4

  // Map display name -> file slug (handles your columbia.png upload)
  const FILE_ALIAS: Record<string, string> = {
    Colombia: "columbia", // your file name
    "El Salvador": "el-salvador",
    Ethiopia: "ethiopia",
    Guatemala: "guatemala",
    Indonesia: "indonesia",
  };

  const SCALE_BY_COUNTRY: Record<string, string> = {
    "El Salvador": "scale-[0.80] md:scale-[0.75]",
    Guatemala: "scale-[0.95] md:scale-[0.90]",
    Ethiopia: "scale-[0.92] md:scale-[0.88]",
    Colombia: "scale-[0.95] md:scale-[0.92]",
    Indonesia: "scale-100",
  };

  // Placeholder notes (you can override per roast later)
  const signatureNotes = isBaptism
    ? ["Dark chocolate", "Molasses", "Smoke"]
    : isOak
    ? ["Oak", "Vanilla", "Caramel"]
    : isJava
    ? ["Citrus", "Cocoa", "Stone fruit"]
    : ["Hazelnut", "Caramel", "Apple"]; // Flagship default

  return (
    <main className="relative overflow-hidden min-h-[calc(100vh-140px)] py-10 md:py-16">
      {/* subtle dark wash */}
      <div className="absolute inset-0 z-0 bg-neutral-950/30" aria-hidden />

      <Container className="relative z-10">
        {/* ===== HERO WRAPPER — emblem centered INSIDE the hero box ===== */}
        <div className="relative">
          {/* Nudge with top-[..%] if needed */}
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

          {/* Hero grid above emblem */}
          <div className="relative z-10 mt-2 md:mt-3 grid md:grid-cols-[auto,1fr] gap-4 md:gap-6 items-start">
            {/* HERO IMAGE */}
            <div className="flex flex-col items-center md:items-start">
              <div className="inline-block rounded-3xl overflow-hidden ring-1 ring-amber-400/40 shadow-2xl shadow-amber-500/20 bg-neutral-900/40">
                <img
                  src={card.img}
                  alt={card.title}
                  className="block h-auto w-auto max-h-[61vh] md:max-h-[65vh] object-contain scale-[1.1]"
                />
              </div>
            </div>

            {/* TEXT COLUMN */}
            <div className="self-start space-y-4">
              {/* Title row */}
              <div className="mb-1 flex items-center justify-between gap-3">
                <div>
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
                  <div className="text-sm md:text-base text-neutral-400">
                    {isFlagship
                      ? "Medium Roast"
                      : isBaptism
                      ? "Dark Roast"
                      : card.subTitle}
                  </div>
                </div>
                <BackButton to="/store" size="sm" />
              </div>

              {/* SHIP STORY / HERO COPY */}
              <div className="max-w-[76ch] md:max-w-[82ch] leading-relaxed">
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

                    {/* AMBER DESCRIPTION (replaces old standalone price block) */}
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

                    {/* AMBER DESCRIPTION (replaces old standalone price block) */}
                    <div className="mt-2 text-amber-300/90 text-base md:text-lg">
                      {AMBER_DESC}
                    </div>
                    <div className="h-1 md:h-2" />
                  </div>
                )}

                {/* Java & Oak: amber placeholders under story (also replaces price) */}
                {!isFlagship && !isBaptism && AMBER_DESC && (
                  <>
                    <div className="mt-2 text-amber-300/90 text-base md:text-lg">
                      {AMBER_DESC}
                    </div>
                    <div className="h-4 md:h-6" />
                  </>
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
              <div className="h-1 md:h-2" />

              {/* Subscription frequency */}
              {purchaseMode === "sub" && (
                <div className="mt-3 mb-4 w-full max-w-[36rem]">
                  <div className="text-sm text-neutral-300 mb-2">
                    Deliver every
                  </div>
                  <div className="flex flex-wrap gap-2">
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
              )}

              {/* Add to Chest */}
              {card.canBuy && (
                <div className="mt-10 w-full max-w-[36rem]">
                  <div className="inline-flex items-center gap-4 rounded-xl border border-amber-400/60 bg-black/70 p-3 px-4 shadow-md shadow-amber-400/10">
                    <div className="inline-flex items-center rounded-lg border border-neutral-700">
                      <button
                        type="button"
                        onClick={() => setQty((q) => Math.max(1, (q || 1) - 1))}
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

                    {/* Price echo stays by the button */}
                    <div className="ml-2 text-sm text-neutral-300">
                      {purchaseMode === "sub" ? (
                        <>
                          <span className="line-through text-amber-300/80 mr-1">
                            {fmt(card.price)}
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
                            {fmt(card.price)}
                          </span>
                          <span className="text-xs text-neutral-400 ml-1">
                            / bag
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 text-lg text-neutral-400">
                    <span className="text-amber-300 font-semibold">
                      3+ bags ship free
                    </span>{" "}
                  </div>
                </div>
              )}

              {/* Coming soon */}
              {!card.canBuy && (
                <div className="pt-2">
                  <div className="text-sm text-neutral-300 mb-8">
                    {card.variant}
                  </div>
                  <div className="text-neutral-400">
                    Coming soon. Join the Fleet on the Store page to get
                    notified.
                  </div>
                </div>
              )}
            </div>
            {/* end text column */}
          </div>
          {/* end hero grid */}
        </div>
      </Container>

      {/* ===== THE COFFEE (notes, origins with outlines, roast level) ===== */}
      {(isFlagship || isBaptism || isJava || isOak) && (
        <section className="relative left-1/2 right-1/2 -mx-[50vw] w-screen">
          <div className="border-t-2 border-amber-400/70 relative translate-y-3 md:translate-y-6 w-[110%] -ml-[5%]" />

          <div className="bg-neutral-950 mt-[-1px]">
            <Container className="pt-6 md:pt-8 pb-6 md:pb-10">
              <div className="max-w-[80ch]">
                <h2 className="text-xl md:text-2xl font-bold text-amber-300">
                  THE COFFEE
                </h2>

                {/* Signature Notes */}
                <div className="mt-3">
                  <h3 className="text-base md:text-lg font-semibold text-amber-300/90">
                    Signature Notes
                  </h3>
                  <div className="mt-1 text-neutral-300 text-lg leading-relaxed">
                    {signatureNotes.join(", ")}
                  </div>
                </div>

                {/* faint amber divider */}
                {/* faint amber divider (extended width) */}
                {/* faint amber divider — full bleed */}
                <div className="relative left-1/2 right-1/2 -mx-[50vw] w-screen h-px bg-amber-400/30 my-5" />

                {/* Coffee Bean Origins — images, bottom-aligned, scaled */}
                <div className="mt-0">
                  <h3 className="text-base md:text-lg font-semibold text-amber-300/90 mb-4">
                    Coffee Bean Origins
                  </h3>

                  {/* 3-up on desktop, 2-up on small screens; align to bottom */}
                  <div
                    className={`grid ${
                      origins.length === 2
                        ? "grid-cols-2 md:grid-cols-2 gap-12 md:gap-20"
                        : "grid-cols-2 md:grid-cols-3 gap-8 md:gap-12"
                    } items-end justify-items-center`}
                  >
                    {origins.map((name) => {
                      const fileKey =
                        FILE_ALIAS[name] ||
                        name.toLowerCase().replace(/\s+/g, "-");
                      const scaleCls = SCALE_BY_COUNTRY[name] || "scale-100";
                      return (
                        <div
                          key={name}
                          className="flex flex-col items-center text-center w-[16rem] md:w-[20rem]"
                        >
                          <img
                            src={`/${fileKey}.png`}
                            alt={name}
                            className={`w-full h-auto brightness-110 contrast-125 opacity-95 hover:opacity-100 transition ${scaleCls} drop-shadow-[0_0_14px_rgba(251,191,36,0.25)] ${
                              (card?.title === "Baptism by Fire" ||
                                card?.title === "Oak & Copper") &&
                              name === "Indonesia"
                                ? "-translate-y-20 md:-translate-y-24"
                                : ""
                            }`}
                          />
                          <div className="mt-2 text-amber-400/90 tracking-wider text-sm font-semibold uppercase">
                            {name}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* faint amber divider */}
                {/* faint amber divider (extended width) */}
                {/* faint amber divider — full bleed */}
                <div className="relative left-1/2 right-1/2 -mx-[50vw] w-screen h-px bg-amber-400/30 my-5" />

                {/* Roast Level (anchors 1–5) */}
                <div className="mt-2">
                  <h3 className="text-base md:text-lg font-semibold text-amber-300/90">
                    Roast Level
                  </h3>

                  <div className="mt-2 flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <span
                        key={n}
                        className={
                          "inline-block h-4 w-4 md:h-5 md:w-5 rounded-[2px] " +
                          (n <= roastLevel ? "bg-amber-300" : "bg-neutral-700")
                        }
                        aria-hidden
                      />
                    ))}
                    <span className="ml-2 text-sm text-neutral-400">
                      {roastLevel} / 5
                    </span>
                  </div>
                </div>
              </div>
            </Container>
          </div>
        </section>
      )}
    </main>
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

function StoreCategoryPage() {
  const { slug } = useParams();
  const titleMap: any = {
    tees: "Tees",
    mugs: "Mugs",
    shot: "Shot Glasses",
    accessories: "Coffee Accessories",
  };
  const title = titleMap[slug as string] || "Store";
  return (
    <main className="py-16 md:py-24">
      <Container>
        <BackButton to="/store" size="sm" />
        <SectionTitle
          title={
            <span className="text-3xl md:text-5xl font-extrabold text-amber-300">{`${title} — Coming Soon`}</span>
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
      {/* ===== ROASTING PROCESS ===== */}
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
          {/* Make the inner wrapper a flex container and center its content vertically */}
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

              {/* Text RIGHT */}
              <div className="space-y-3">
                <h3 className="text-2xl md:text-4xl font-bold text-amber-300">
                  ROASTING PROCESS
                </h3>
                <p className="text-neutral-300 text-xl md:text-2xl leading-relaxed tracking-[0.02em]">
                  Coffee is at its best in the first days after roasting when
                  the oils are alive, the aroma is full, and the flavor is at
                  its peak. That is why we roast to order every Monday and
                  Tuesday and ship Wednesday. <br /> <br />
                  No months-old roasted beans sitting on supermarket shelves or
                  in an Amazon warehouse. Our coffee is battle fresh, hitting
                  your cup at its prime exactly the way it was meant to be
                  experienced.
                  <br /> <br />
                </p>
                <Link
                  to="/coffee"
                  className="mt-6 inline-block px-5 py-2 rounded-lg ring-1 ring-amber-400/60 
             text-amber-400 font-semibold text-base md:text-lg 
             hover:bg-amber-400 hover:text-neutral-900 transition-all"
                >
                  ⚓ SHOP OUR FRESHLY ROASTED COFFEE
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ===== THE LANDS WHERE OUR BEANS ARE GROWN ===== */}
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
          {/* Flex wrapper vertically centers the grid */}
          <div className="relative z-10 flex items-center min-h-[720px] md:min-h-[820px] py-12 md:py-16">
            <div className="grid w-full grid-cols-1 md:grid-cols-[auto,1fr] gap-4 md:gap-6 items-center">
              {/* Photo LEFT */}
              <div className="justify-self-center self-center">
                <div className="w-64 md:w-[32rem] mx-auto aspect-square rounded-xl overflow-hidden ring-1 ring-amber-400 bg-neutral-900/50">
                  <img
                    src="/bean-stock3.jpg"
                    alt="Beans lands"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Text RIGHT */}
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
            </div>
          </div>
        </Container>
      </section>

      {/* ===== THE HANDS THAT GROW OUR BEANS ===== */}
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
          {/* Flex wrapper vertically centers the grid */}
          <div
            className={`${SECTION_INNER} flex items-center min-h-[720px] md:min-h-[820px]`}
          >
            <div className="grid w-full grid-cols-1 md:grid-cols-[1fr,auto] items-center gap-4 md:gap-6">
              {/* Text LEFT */}
              <div className="order-2 md:order-1 space-y-3 md:justify-self-end">
                <h3 className="font-cinzel text-3xl md:text-4xl font-extrabold text-amber-300 tracking-wide uppercase">
                  The Hands That Grow Our Beans
                </h3>
                <p className="text-neutral-300 text-xl md:text-2xl leading-relaxed tracking-[0.02em]">
                  Behind every harvest are the families who make it possible.
                  Generations of farmers rise before dawn, nurturing each tree
                  by hand and protecting the land that sustains them. Their
                  knowledge, patience, and respect for nature give our coffee
                  its strength and character. <br /> <br /> These small family
                  farms are the heart of what we do. Every bean is ethically
                  sourced, every grower treated with fairness and dignity. Their
                  craftsmanship and pride live on in every roast, carrying
                  forward the spirit of Old Ironsides Coffee.
                </p>
              </div>

              {/* Photo RIGHT */}
              <div className="order-1 md:order-2 justify-self-center self-center">
                <div className="relative w-64 md:w-[32rem] mx-auto aspect-square rounded-xl overflow-hidden ring-1 ring-amber-400 bg-neutral-900/50">
                  <img
                    src="/hands-beans.jpg"
                    alt="Hands with beans"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
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
            subtitle="Explore the hisory of the USS Constitution and her victoires that inspired our roasts."
          />
          <div className="mt-10 grid md:grid-cols-4 gap-6">
            {/* Order: Java Action, Baptism by Fire, Flagship */}
            {["java-action", "baptism-by-fire", "flagship"].map((slug) => {
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

      {/* ===== FROM THE SAND TO THE SEA ===== */}
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
          {/* Flex wrapper vertically centers the grid */}
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

      {/* ===== GIVING BACK (copied from Origins) — placed between Service and About ===== */}
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
                  well-being is not optional, it is who we are. <br /> <br />
                  With every bag sold, we donate a portion of profits to trusted
                  organizations that provide real help to the veterans who need
                  it most.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>
      {/* ===== ABOUT OLD IRONSIDES COFFEE ===== */}
      <section
        id="origins-about"
        className={`${SECTION_FRAME} scroll-mt-28 md:scroll-mt-36`}
      >
        {/* Backdrop emblem centered */}
        <div className="absolute inset-0 flex items-center justify-center z-0 pointer-events-none">
          <img
            src="/emblem-black.png"
            alt="About backdrop"
            className="max-w-[90%] max-h-[90%] object-contain opacity-20"
          />
        </div>
        <div className="absolute inset-0 bg-neutral-950/40 z-0 pointer-events-none" />

        <Container>
          {/* Flex + items-center vertically centers the grid in this section */}
          <div className="relative z-10 flex items-center min-h-[720px] md:min-h-[820px] py-12 md:py-16">
            <div className="grid w-full grid-cols-1 md:grid-cols-[auto,1fr] gap-4 md:gap-6 items-center">
              {/* Photo LEFT */}
              <div className="justify-self-center self-center">
                <div className="w-64 md:w-[32rem] mx-auto aspect-square rounded-xl overflow-hidden ring-1 ring-amber-400 bg-neutral-900/50">
                  <img
                    src="/flag-close.jpg"
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
    returns: "Return Policy",
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
            subtitle="Fill in with your official policy text."
          />
          <BackButton size="sm" />
        </div>
        <div className="mt-6 space-y-4 text-neutral-300">
          <p>
            Placeholder content for {title}. Replace with your finalized policy
            language.
          </p>
        </div>
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
                {(() => {
                  const now = new Date();
                  const day = now.getDay(); // 0=Sunday, 1=Monday...
                  const nextMonday = new Date(now);
                  nextMonday.setDate(now.getDate() + ((1 - day + 7) % 7 || 7));

                  const roastDate = nextMonday.toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                  });

                  return (
                    <>
                      All of our coffees are roasted fresh every Monday and ship
                      Tuesday/Wednesday. <br />
                      Your next eligible roast date is{" "}
                      <span className="font-semibold text-amber-300">
                        {roastDate}
                      </span>
                      . <br />
                      Orders placed before 5 p.m. EST on Sunday make that week’s
                      roast; after that, they roll to the following week. <br />
                      Because we roast to order, your coffee won’t arrive
                      overnight like Amazon, but it will arrive fresh. <br />
                      Need it sooner? Leave a note at checkout or reply to your
                      confirmation email — we’ll do our best to accommodate.
                    </>
                  );
                })()}
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
              No items yet. Return to the{" "}
              <Link to="/store" className="text-amber-300 hover:underline">
                Ship’s Store
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
/* ================= Promo Subscribe Modal (global) ================= */
function PromoSubscribeModal() {
  const [open, setOpen] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [done, setDone] = React.useState(false);

  React.useEffect(() => {
    const onOpen = () => {
      setOpen(true);
      setDone(false);
      setEmail("");
    };
    window.addEventListener("promo-subscribe", onOpen as any);
    return () => window.removeEventListener("promo-subscribe", onOpen as any);
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
    setDone(true);
    window.dispatchEvent(
      new CustomEvent("flash", {
        detail: "Welcome aboard — your 20% code is on the way.",
      })
    );
    // TODO: integrate with your ESP endpoint
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Get 20% off your first order"
      onClick={(e) => {
        // click backdrop to close
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative z-10 w-[92vw] max-w-md">
        <div className="rounded-2xl ring-1 ring-amber-400/60 bg-neutral-900/60 p-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Bell className="h-7 w-7 text-amber-300" />
            <h3 className="text-2xl font-extrabold text-amber-300">
              Ring That Bell
            </h3>
          </div>
          <p className="text-neutral-300 mb-5 text-lg md:text-xl">
            Join the Fleet and save 20% on your first order
          </p>

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
              Get Code
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

          {done && (
            <p className="mt-3 text-sm text-emerald-400">
              Welcome aboard — your discount is on the way.
            </p>
          )}

          {/* Close button */}
          <button
            onClick={() => setOpen(false)}
            className="absolute top-2 right-2 px-2 py-1 rounded-md text-neutral-300 hover:text-amber-300"
            aria-label="Close modal"
          >
            ✕
          </button>
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
  const panelRef = React.useRef<HTMLDivElement | null>(null);

  const [shrunk, setShrunk] = useState(true);
  const [stickyOpen, setStickyOpen] = useState(false);
  const megaRef = React.useRef<HTMLDivElement | null>(null);
  // Mega menu: null | 'coffee' | 'merch' | 'origins'
  const [openMega, setOpenMega] = useState<
    null | "coffee" | "merch" | "origins"
  >(null);
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
                    window.dispatchEvent(new CustomEvent("promo-subscribe"))
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
            ? "h-[180px] md:h-[210px]" // ORIGINS (new)
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
                <li>HQ@oldironsidescoffee.org</li>
                <li>6 Liberty Square #2564, Boston, MA 02109</li>
              </ul>
            </div>

            {/* Follow */}
            <div>
              <div className="text-neutral-400 font-semibold mb-2">Follow</div>
              <div className="flex gap-4 text-neutral-300">
                <span>Instagram</span>
                <span>YouTube</span>
                <span>Facebook</span>
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
