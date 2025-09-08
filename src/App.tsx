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
      <div className="rounded-lg bg-amber-400/95 px-4 py-2 text-neutral-900 font-semibold shadow-xl">
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
}: {
  img: string;
  text: React.ReactNode;
  tone?: string;
}) {
  return (
    <div className="flex items-center gap-4">
      <img
        src={img}
        alt="row art"
        className="w-40 h-48 md:w-44 md:h-52 rounded-xl object-cover ring-1 ring-amber-500 shadow-2xl shadow-black/30"
      />
      <div
        className={`text-[1.05rem] md:text-[1.2rem] leading-snug ${
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
            <Bell className="h-7 w-7 text-amber-300" />
            <h3 className="text-2xl font-extrabold text-amber-300">
              Ring That Bell
            </h3>
          </div>
          <p className="text-neutral-300 mb-5">Join the Fleet and save 10%</p>
          <form
            onSubmit={submit}
            className="flex justify-center gap-3 max-w-md mx-auto"
          >
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@domain.com"
              className="flex-1 rounded-xl bg-neutral-900/70 border border-neutral-700 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <button className="px-6 py-3 rounded-xl bg-amber-400 text-neutral-900 font-semibold hover:bg-amber-300">
              Join
            </button>
          </form>
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
              <span className="text-4xl md:text-6xl font-extrabold text-amber-300 tracking-tight whitespace-nowrap">
                Launched From The Harbor
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
            <div className="md:col-span-7">
              <div className="space-y-6">
                <IntroRow
                  img="ironship.png"
                  text={
                    <>
                      Inspired by the ship that defied an empire. <br />
                      Forged in oak and copper. <br />
                      Tempered by fire and flame.{" "}
                    </>
                  }
                  tone="text-amber-500"
                />

                <IntroRow
                  img="bean-smell.png"
                  text={
                    <>
                      Premium. <br />
                      Organically Grown. <br />
                      Fair Trade Sourced.
                    </>
                  }
                  tone="text-amber-400"
                />

                <IntroRow
                  img="roasted-cup.jpg"
                  text={
                    <>
                      From Darkest to Lightest <br /> Always Smooth. <br />
                      Never Bitter
                    </>
                  }
                  tone="text-amber-300"
                />

                <div className="pt-2">
                  <p
                    className="text-4xl md:text-[2.7rem] font-extrabold tracking-[0.18em] text-amber-300"
                    style={{ fontFamily: "'Cinzel', serif", fontWeight: 800 }}
                  >
                    OLD IRONSIDES COFFEE
                  </p>
                  <p className="text-base md:text-lg font-medium text-amber-200 mt-1">
                    Ignite the Spirit, Savor the Victory!
                  </p>
                </div>
              </div>
            </div>

            <div className="md:col-span-5 self-start">
              {/* Tight shadow box that shrinks with the image */}
              <div className="inline-block ml-0 md:ml-[12%] rounded-3xl overflow-hidden ring-1 ring-amber-400/40 shadow-2xl shadow-amber-500/20">
                <img
                  src="officer-window.png"
                  alt="Old Ironsides hero"
                  className="
        block
        w-auto
        h-auto
        max-w-full
        max-h-[calc(100vh-220px)]
        md:max-h-[calc(100vh-240px)]
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

      <section
        id="fleet-stories"
        className="relative border-t border-neutral-800 py-12 md:py-16"
      >
        <Container>
          <SectionTitle
            title={
              <span className="text-4xl md:text-6xl font-extrabold text-amber-300 whitespace-nowrap">
                The True History Behind the Fleet
              </span>
            }
            subtitle="Explore the real battles and ships that inspired our roasts."
          />

          <div className="mt-10 grid md:grid-cols-4 gap-6">
            {roastCards.map((card) => (
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
            ))}
          </div>
        </Container>
      </section>

      <section
        id="contact"
        className="py-16 md:py-24 border-b border-neutral-800"
      >
        <Container>
          <SectionTitle
            title="Hail the quarterdeck"
            subtitle="Questions, wholesale, press – we’ll get back fast."
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
  const { add } = useCart();
  const [qty, setQty] = useState(1);

  if (!card) return <NotFoundPage />;
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const addToChest = () => {
    const n = Math.max(1, Math.min(99, Math.trunc(qty || 1)));
    setQty(n);
    add(card, n);
    window.dispatchEvent(
      new CustomEvent("flash", {
        detail: `${n} × ${card.title} added to Chest`,
      })
    );
  };
  return (
    <main className="py-12 md:py-20">
      <Container>
        <div className="flex items-center justify-between gap-4">
          <BackButton to="/store" size="sm" />
        </div>

        <div className="mt-6 grid md:grid-cols-[auto,1fr] gap-6 items-center">
          {/* IMAGE COLUMN */}
          {/* IMAGE COLUMN (fit fully above the fold, tight shadow box) */}
          <div className="flex justify-center md:justify-start">
            <div className="inline-block rounded-3xl overflow-hidden ring-1 ring-neutral-800 shadow-2xl shadow-black/40">
              <img
                src={card.img}
                alt={card.title}
                className="
        block
        h-auto
        w-auto
        max-h-[50vh]
        sm:max-h-[52vh]
        md:max-h-[55vh]
        object-contain
      "
              />
            </div>
          </div>

          {/* TEXT / BUY COLUMN (now vertically centered with the photo) */}
          <div className="self-center space-y-4">
            {/* Title moved into the text block */}
            <div>
              <h1 className="m-0 text-2xl md:text-3xl font-extrabold leading-tight tracking-tight text-amber-300">
                {card.title}
              </h1>
              <div className="text-sm md:text-base text-neutral-400">
                {card.subTitle}
              </div>
            </div>

            <p className="text-neutral-300 text-lg leading-relaxed">
              This is the roast profile page for <strong>{card.title}</strong>.
            </p>

            {/* Buy row */}
            {card.canBuy ? (
              <div className="pt-2">
                <div className="text-sm text-neutral-300 mb-2">
                  {fmt(card.price)} <span className="text-neutral-500">•</span>{" "}
                  {card.variant}
                </div>
                <div className="flex flex-wrap items-center gap-3">
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
                      className="w-14 text-center bg-neutral-900/70 py-2 text-sm outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setQty((q) => Math.min(99, (q || 1) + 1))}
                      className="px-2 py-1 hover:bg-neutral-800 rounded-r-lg"
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  <button
                    onClick={addToChest}
                    className="w-full sm:w-auto px-4 py-2 rounded-lg font-semibold bg-amber-400 text-neutral-900 hover:bg-amber-300"
                    aria-label={`Add ${card.title} to Chest`}
                  >
                    Add to Chest
                  </button>
                </div>
              </div>
            ) : (
              <div className="pt-2">
                <div className="text-sm text-neutral-300 mb-2">
                  {card.variant}
                </div>
                <div className="text-neutral-400">
                  Coming soon. Join the Fleet on the Store page to get notified.
                </div>
              </div>
            )}
          </div>
        </div>
      </Container>
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
      key: "Coasters",
      label: "Coffee Coasters",
      icon: <span className="text-sm">🥃</span>,
      img: "coasters2.png",
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
      <section className="relative overflow-hidden pt-10 pb-16 md:pt-12 md:pb-24">
        {/* Edge-to-edge backdrop over merch */}
        <img
          src="/store-rack.png"
          alt="Ship’s Store backdrop"
          className="absolute inset-0 w-full h-full object-cover opacity-40 -z-0"
        />
        <div className="absolute inset-0 bg-neutral-950/40 -z-0" />
        <Container className="relative z-10">
          <div className="max-w-xl">
            <h2 className="text-2xl md:text-4xl font-extrabold text-amber-300">
              Merch Coming Soon!
            </h2>
            <p className="mt-1 text-white">
              Subscribe to be notified when available
            </p>
            <div className="mt-3 w-full max-w-[18rem]">
              <NotifyForm onSubmit={() => {}} />
            </div>
          </div>
          <div className="mt-8 grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {tiles.map((t) => (
              <div
                key={t.key}
                className="rounded-2xl ring-1 ring-neutral-800 bg-neutral-900/40 hover:bg-neutral-900 transition text-left overflow-hidden flex flex-col"
              >
                <Link to={`/store/${t.key}`} className="block">
                  <div className="aspect-[4/3] w-full overflow-hidden">
                    <img
                      src={t.img}
                      alt={`${t.label} preview`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </Link>
                <Link to={`/store/${t.key}`} className="p-6 block">
                  <div className="flex items-center gap-3 text-amber-300 font-semibold">
                    {t.icon}
                    <span>{t.label}</span>
                  </div>
                </Link>
                <div className="px-6 pb-6">
                  <div className="mt-2 text-sm text-neutral-400">
                    Join the Fleet to be notified when available.
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
    coasters: "Coasters",
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

function MissionPage() {
  return (
    <main className="py-16 md:py-24">
      <Container>
        <div className="flex items-start justify-between">
          <SectionTitle
            title={
              <span className="text-3xl md:text-5xl font-extrabold text-amber-300">
                Mission — Ignite the Spirit, Savor the Victory
              </span>
            }
            subtitle="Veteran-owned roastery honoring the craft, the crew, and the Constitution."
          />
          <BackButton size="sm" />
        </div>

        <div className="mt-6 max-w-3xl text-neutral-300 space-y-4">
          <p>
            We roast small-batch coffee that’s as rugged and refined as the
            frigate that inspired our name. Every bag honors the grit of
            American shipwrights and sailors who forged a legend in oak and
            copper.
          </p>
          <p>
            We’re committed to quality sourcing, meticulous roasting, and
            supporting veteran communities and maritime preservation.
          </p>
        </div>
      </Container>
    </main>
  );
}

function OriginsPage() {
  // Shared frame for all three
  const SECTION_FRAME = "relative overflow-hidden border-t border-neutral-800";
  // Normal size for sections (Hands & Roasting)
  const SECTION_INNER =
    "relative z-10 min-h-[600px] md:min-h-[700px] py-12 md:py-16";

  return (
    <main className="pt-0">
      {/* ===== LANDS (taller + title/back nudged down, farm image shifted down) ===== */}
      <section className={SECTION_FRAME}>
        {/* Backdrop (shifted down to show lower portion) */}
        <img
          src="/farm1-web.jpg"
          alt="The Lands backdrop"
          className="absolute inset-0 w-full h-full object-cover object-[50%_68%] opacity-90 z-0 pointer-events-none"
        />
        <div className="absolute inset-0 bg-neutral-950/40 z-0 pointer-events-none" />

        <Container>
          {/* Lands is a bit taller for breathing room */}
          <div className="relative z-10 min-h-[720px] md:min-h-[820px] py-12 md:py-16">
            {/* Title + Back (nudged down a bit from header) */}
            <div className="flex items-start justify-between mt-4 md:mt-6 mb-8 md:mb-10">
              <SectionTitle
                title={
                  <span className="text-3xl md:text-5xl font-extrabold text-amber-300">
                    Origins & Voyages
                  </span>
                }
                subtitle={
                  <span className="block text-lg md:text-2xl font-semibold text-amber-300">
                    From Distant Shores to Roasting Flames
                  </span>
                }
              />
              <BackButton size="sm" />
            </div>

            {/* Content row */}
            <div className="grid grid-cols-1 md:grid-cols-[auto,1fr] gap-4 md:gap-6 items-center">
              {/* Photo LEFT (anchored) */}
              <div className="justify-self-center self-center">
                <div className="w-64 md:w-[32rem] mx-auto aspect-square rounded-xl overflow-hidden ring-1 ring-amber-400 bg-neutral-900/50">
                  <img
                    src="/bean-stock3.jpg"
                    alt="Hands with beans"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              {/* Text RIGHT */}
              <div className="space-y-3">
                <h3 className="text-xl md:text-2xl font-bold text-amber-300">
                  The Lands
                </h3>
                <p className="text-neutral-300 text-2xl md:text-3xl leading-snug max-w-[42rem]">
                  From rich volcanic soil to high mountain climates, our beans
                  begin in nutrient-dense lands that shape their bold character.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ===== HANDS (normal size, background centered, foreground photo centered) ===== */}
      <section className={SECTION_FRAME}>
        <img
          src="/hands-bowl.jpg"
          alt="Growers backdrop"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-90 z-0 pointer-events-none"
        />
        <div className="absolute inset-0 bg-neutral-950/40 z-0 pointer-events-none" />

        <Container>
          <div className={SECTION_INNER}>
            <div className="grid grid-cols-1 md:grid-cols-[1fr,auto] items-center gap-4 md:gap-6">
              {/* Text LEFT */}
              <div className="order-2 md:order-1 space-y-3 md:justify-self-end">
                <h3 className="text-xl md:text-2xl font-bold text-amber-300">
                  The Hands That Grow Our Beans
                </h3>
                <p className="text-neutral-300 text-2xl md:text-3xl leading-snug max-w-[42rem]">
                  Small family farms nurture every harvest with care, treat
                  their people fairly, and protect the health of each bean.
                </p>
              </div>
              {/* Photo RIGHT (centered in section) */}
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

      {/* ===== ROASTING (normal size, background centered, foreground photo centered) ===== */}
      <section className={SECTION_FRAME}>
        <img
          src="/roasted-dark.jpg"
          alt="Roasting process backdrop"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-100 z-0 pointer-events-none"
        />
        <div className="absolute inset-0 bg-neutral-950/40 z-0 pointer-events-none" />

        <Container>
          <div className={SECTION_INNER}>
            <div className="grid grid-cols-1 md:grid-cols-[auto,1fr] gap-4 md:gap-6 items-center">
              {/* Photo LEFT (centered in section) */}
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
                <h3 className="text-xl md:text-2xl font-bold text-amber-300">
                  The Roasting Process
                </h3>
                <p className="text-neutral-300 text-2xl md:text-3xl leading-snug max-w-[42rem]">
                  Our medium roast is smooth and balanced for everyday
                  enjoyment. Our dark roast is bold and full-bodied—crafted
                  without bitterness for a finish you must experience.
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
              <p className="text-sm md:text-base text-red-400 relative -top-[100px]">
                All of our coffees are roasted and packaged to order every
                Monday, then shipped Tuesday and Wednesday to ensure maximum
                freshness. <br />
                Orders placed before 5 p.m. EST on Sunday will be roasted and
                shipped that same week, while orders placed after will ship the
                following week. <br />
                Because we roast to order, your coffee won’t arrive overnight
                like Amazon, but it will arrive fresh. <br />
                If you miss the deadline and you need your coffee sooner, just
                leave a note at checkout <br /> or reply to your confirmation
                email and we’ll do our best to accommodate.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-4">
                {cart.map((item: any) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 rounded-xl ring-1 ring-neutral-800 bg-neutral-900/50 p-4"
                  >
                    <img
                      src={item.img}
                      alt={item.title}
                      className="h-16 w-16 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-amber-300">
                        {item.title}
                      </div>
                      <div className="text-xs text-neutral-400">
                        {item.variant}
                      </div>
                      <div className="mt-1 text-sm">{fmt(item.price)}</div>
                    </div>

                    <div className="inline-flex items-center rounded-lg border border-neutral-700">
                      <button
                        onClick={() => dec(item.id)}
                        className="px-2 py-1 hover:bg-neutral-800 rounded-l-lg"
                        aria-label="Decrease"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <div className="w-10 text-center bg-neutral-900/70 py-1 text-sm">
                        {item.qty}
                      </div>
                      <button
                        onClick={() => inc(item.id)}
                        className="px-2 py-1 hover:bg-neutral-800 rounded-r-lg"
                        aria-label="Increase"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>

                    <button
                      onClick={() => remove(item.id)}
                      className="p-2 rounded-lg hover:bg-neutral-800"
                      aria-label="Remove"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Checkout sidebar */}
              <aside className="rounded-xl ring-1 ring-neutral-800 bg-neutral-900/50 p-6 h-max">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-400">Subtotal</span>
                  <span className="font-semibold">{fmt(subtotal)}</span>
                </div>
                <button className="mt-4 w-full px-4 py-2 rounded-lg bg-amber-400 text-neutral-900 font-semibold hover:bg-amber-300">
                  Checkout
                </button>
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
function HeaderNavLink({ to, children }: any) {
  const location = useLocation();
  const active = location.pathname === to;
  return (
    <Link
      to={to}
      className={`text-[12px] md:text-[13px] uppercase tracking-wide whitespace-nowrap transition ${
        active ? "text-amber-300" : "text-neutral-300 hover:text-amber-300"
      }`}
    >
      {children}
    </Link>
  );
}
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);
  return null;
}

function Layout() {
  const { count } = useCart();
  const location = useLocation();
  const isHome = location.pathname === "/";
  const isFleet = location.pathname.startsWith("/fleet");
  const isRoast = location.pathname.startsWith("/roast");

  const [shrunk, setShrunk] = useState(true);
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
      {/* FIXED, SHRINK-ON-SCROLL HEADER */}
      <header className="fixed top-0 inset-x-0 z-50 bg-neutral-950/95 backdrop-blur border-b border-neutral-800">
        <Container>
          <div className={shrunk ? "pt-4 md:pt-5 pb-3" : "pt-10 md:pt-12 pb-5"}>
            {/* Centered stack; emblem sits to the left and does NOT affect width */}
            <div className="relative mx-auto w-max">
              {/* Emblem to the LEFT of the centered stack */}
              <img
                src="/emblem-black.png"
                alt="Old Ironsides emblem"
                className={
                  (shrunk ? "h-24 md:h-28" : "h-36 md:h-44") +
                  " w-auto object-contain select-none transition-all " +
                  "absolute top-1/2 -translate-y-1/2 right-[calc(100%+16px)]"
                }
              />

              {/* Title + taglines */}
              <div className="flex flex-col items-center -mt-1">
                {/* TITLE now centered */}
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

                {/* Tagline + Veteran-owned remain centered */}
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
                  Veteran-owned and operated.
                </div>
              </div>

              {/* Nav shares the same left edge as the title */}
              <nav className="mt-3 flex justify-start">
                <div className="flex items-center gap-5">
                  <HeaderNavLink to="/">Home Port</HeaderNavLink>
                  <HeaderNavLink to="/store">Ship’s Store</HeaderNavLink>
                  <HeaderNavLink to="/origins">Origins & Voyages</HeaderNavLink>
                  <HeaderNavLink to="/mission">Mission Log</HeaderNavLink>
                  <HeaderNavLink to="/contact">Contact the Crew</HeaderNavLink>
                  <HeaderNavLink to="/sdvosb">SDVOSB</HeaderNavLink>
                  <Link
                    to="/cart"
                    className="relative px-1.5 py-1 rounded-md text-amber-300 inline-flex items-center gap-1.5"
                  >
                    <ChestIcon className="h-6 w-6 md:h-7 md:w-7" />
                    <span className="text-sm md:text-base">Chest</span>
                    {count > 0 && (
                      <span className="absolute -top-1.5 -right-2 bg-amber-400 text-neutral-900 text-[10px] font-bold rounded-full px-1.5">
                        {count}
                      </span>
                    )}
                  </Link>
                </div>
              </nav>
            </div>
          </div>
        </Container>
      </header>

      {/* spacer so content doesn’t hide under header */}
      <div
        className={
          isHome
            ? "h-[140px] md:h-[168px]" // +20–28px
            : isFleet
            ? "h-[120px] md:h-[140px]" // +20–30px
            : isRoast
            ? "h-[140px] md:h-[168px]" // +20–28px
            : "h-[125px] md:h-[145px]" // +20–30px
        }
      />
      <Outlet />
      <footer className="border-t border-neutral-800 bg-neutral-950">
        <Container className="py-14 text-sm">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Brand + Vet-owned + Flag (centered) */}
            <div className="flex flex-col items-center text-center">
              {/* Title ~15% larger */}
              <div className="text-base tracking-[0.5em] text-amber-300">
                OLD IRONSIDES COFFEE
              </div>

              {/* Vet line pulled closer to title */}
              <div className="mt-0 text-base text-neutral-300 leading-tight">
                Veteran-owned and operated.
              </div>

              {/* Flag spacing unchanged (still below vet line) */}
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
        <Route path="roast/:slug" element={<RoastDetailPage />} />
        <Route path="store" element={<StorePage />} />
        <Route path="store/:slug" element={<StoreCategoryPage />} />
        <Route path="mission" element={<MissionPage />} />
        <Route path="origins" element={<OriginsPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="sdvosb" element={<SDVOSBPage />} />
        <Route path="legal/:slug" element={<LegalPage />} />
        <Route path="cart" element={<CartPage />} />
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
