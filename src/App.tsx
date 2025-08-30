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

const BackButton = () => {
  const navigate = useNavigate();
  return (
    <div className="mb-6">
      <button
        onClick={() => {
          try {
            if (
              typeof window !== "undefined" &&
              window.history &&
              window.history.length <= 1
            ) {
              navigate("/");
            } else {
              navigate(-1);
            }
          } catch {
            navigate("/");
          }
        }}
        className="inline-flex items-center gap-3 rounded-2xl border-2 border-amber-400 bg-amber-500/20 px-6 py-4 text-lg font-bold text-amber-300 hover:bg-amber-400 hover:text-neutral-900"
      >
        <ArrowLeft className="h-7 w-7" /> Back
      </button>
    </div>
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
    img: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=1400&auto=format&fit=crop",
    price: 20.0,
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
    img: "https://images.unsplash.com/photo-1527168027773-0cc890c4f42d?q=80&w=1400&auto=format&fit=crop",
    price: 20.0,
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
    img: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1400&auto=format&fit=crop",
    price: 20.0,
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
    img: "Copper-deck.png",
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

function IntroRow({ img, text, tone }: any) {
  return (
    <div className="flex items-center gap-10">
      <img
        src={img}
        alt="row art"
        className="w-52 h-52 md:w-56 md:h-56 rounded-xl object-cover ring-1 ring-amber-500"
      />
      <p className={`text-2xl md:text-3xl font-bold tracking-tight ${tone}`}>
        {text}
      </p>
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

function LaunchedFromHarbor() {
  const { add } = useCart();
  const [qty, setQty] = useState(() =>
    Object.fromEntries(roastCards.map((r) => [r.id, 1]))
  );
  const setQ = (id: string, v: number) =>
    setQty((prev) => ({ ...prev, [id]: Math.max(1, v | 0) }));
  return (
    <section id="fleet" className="border-b border-neutral-800 py-12 md:py-20">
      <Container>
        <SectionTitle
          title="Launched From The Harbor"
          subtitle={
            <>
              <div className="text-amber-300 font-semibold">
                Our premium roasts, crafted for modern legends.
              </div>
              <div className="text-amber-300 mt-3">
                Choose your roast from the fleet.
              </div>
            </>
          }
        />
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
                  className="h-56 w-full object-cover"
                />
              </Link>

              <div className="p-5 flex flex-col flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-extrabold text-amber-300">
                    {card.title}
                  </h3>
                  {SHOW_DATES_IN_BUY_CARDS && (
                    <span className="text-xs text-neutral-400">
                      {card.battleDate}
                    </span>
                  )}
                </div>
                <p className="text-base italic text-neutral-500">
                  {card.subTitle}
                </p>
                <p className="text-sm text-neutral-400">{card.variant}</p>
                <p className="text-sm text-neutral-400 flex-1">{card.note}</p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="text-sm text-neutral-300">
                    {card.slug === "oak-and-copper" ? (
                      <span className="text-neutral-500">—</span>
                    ) : (
                      fmt(card.price)
                    )}
                  </div>
                  {card.canBuy ? (
                    <div className="ml-auto inline-flex items-center gap-2">
                      <div className="inline-flex items-center rounded-lg border border-neutral-700">
                        <button
                          onClick={() =>
                            setQ(
                              card.id,
                              Math.max(1, (qty as any)[card.id] || 1 - 1)
                            )
                          }
                          className="px-2 py-1 hover:bg-neutral-800 rounded-l-lg"
                          aria-label="Decrease"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <input
                          value={(qty as any)[card.id] || 1}
                          onChange={(e) =>
                            setQ(card.id, parseInt(e.target.value) || 1)
                          }
                          className="w-10 text-center bg-neutral-900/70 py-1 text-sm"
                        />
                        <button
                          onClick={() =>
                            setQ(card.id, ((qty as any)[card.id] || 1) + 1)
                          }
                          className="px-2 py-1 hover:bg-neutral-800 rounded-r-lg"
                          aria-label="Increase"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <button
                        onClick={() => {
                          add(card, (qty as any)[card.id] || 1);
                          window.dispatchEvent(
                            new CustomEvent("flash", {
                              detail: `${card.title} added to War Chest`,
                            })
                          );
                        }}
                        className="px-3 py-2 rounded-lg font-semibold bg-amber-400 text-neutral-900 hover:bg-amber-300"
                      >
                        Add to Chest
                      </button>
                    </div>
                  ) : (
                    <Link
                      to={`/fleet/${card.slug}`}
                      className="ml-auto px-3 py-2 rounded-lg font-semibold border border-neutral-700 hover:border-amber-400/50 hover:text-amber-300"
                    >
                      Reserve / Learn
                    </Link>
                  )}
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
          src="https://images.unsplash.com/photo-1518837695005-2083093ee35b?q=80&w=2000&auto=format&fit=crop"
          alt="Stormy sea"
          className="absolute inset-0 h-full w-full object-cover opacity-40 contrast-125"
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,193,7,0.10),transparent_60%)]" />
        <div className="absolute inset-0 bg-neutral-950/40 mix-blend-multiply" />
        <Container className="relative py-24 md:py-32">
          <div className="grid md:grid-cols-12 gap-10 items-center">
            <div className="md:col-span-7">
              <div className="space-y-10">
                <IntroRow
                  img="ironship.png"
                  text="Inspired by the ship that defied an empire."
                  tone="text-amber-200"
                />
                <IntroRow
                  img="oak-copper-table.png"
                  text="Forged in oak & copper, tempered by fire and flame."
                  tone="text-amber-300"
                />
                <IntroRow
                  img="bean-smell.png"
                  text="Only premium roasted coffee, crafted for modern legends."
                  tone="text-amber-400"
                />
                <div className="pt-2">
                  <p className="text-3xl md:text-4xl font-extrabold tracking-[0.18em] text-amber-300">
                    OLD IRONSIDES COFFEE
                  </p>
                  <p className="text-base md:text-lg font-medium text-amber-200 mt-1">
                    Ignite the Spirit, Savor the Victory!
                  </p>
                </div>
              </div>
            </div>
            <div className="md:col-span-5">
              <div className="relative aspect-[3/4] rounded-3xl overflow-hidden ring-1 ring-amber-400/40 shadow-2xl shadow-amber-500/20">
                <img
                  src="officer-window.png"
                  alt="Old Ironsides hero"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>
        </Container>
      </header>

      <LaunchedFromHarbor />
      <RingThatBellBox />

      <section
        id="fleet-stories"
        className="border-t border-neutral-800 py-16 md:py-24"
      >
        <Container>
          <SectionTitle
            title="The True History Behind the Fleet"
            subtitle="Explore the real battles and ships that inspired our roasts."
          />
          <div className="mt-10 grid md:grid-cols-4 gap-6">
            {roastCards.map((card) => (
              <Link
                key={`story-${card.slug}`}
                to={`/fleet/${card.slug}`}
                className="group relative overflow-hidden rounded-2xl ring-1 ring-neutral-800 bg-neutral-900/40 hover:bg-neutral-900 transition shadow-lg flex flex-col"
              >
                <img
                  src={card.img}
                  alt={String(card.title)}
                  className="h-56 w-full object-cover"
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
    <main className="py-16">
      <Container>
        <BackButton />
        <SectionTitle title="The Fleet" subtitle="Choose your roast." />
        <LaunchedFromHarbor />
      </Container>
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
    <main className="py-12 md:py-20">
      <Container>
        <BackButton />
        <SectionTitle
          title={card.storyTitle}
          subtitle={
            <span className="text-amber-300 font-semibold">
              {card.battleDate}
            </span>
          }
        />
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

  return (
    <main className="py-12 md:py-20">
      <Container>
        <SectionTitle title={card.title} subtitle={card.subTitle} />

        <div className="mt-6 grid md:grid-cols-2 gap-8 items-start">
          <div>
            <BackButton /> {/* moved here so it’s right above the image */}
            <div className="rounded-3xl overflow-hidden ring-1 ring-neutral-800">
              <img
                src={card.img}
                alt={card.title}
                className="w-full h-[520px] object-cover"
              />
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-neutral-300 text-lg leading-relaxed">
              This is the roast profile page for <strong>{card.title}</strong>.
            </p>
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
      img: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=1200&auto=format&fit=crop",
    },
    {
      key: "mugs",
      label: "Mugs",
      icon: <span className="text-sm">☕</span>,
      img: "https://images.unsplash.com/photo-1503481766315-7a586b20f66b?q=80&w=1200&auto=format&fit=crop",
    },
    {
      key: "coasters",
      label: "Coasters",
      icon: <span className="text-sm">◼︎</span>,
      img: "https://images.unsplash.com/photo-1518005020951-eccb494ad742?q=80&w=1200&auto=format&fit=crop",
    },
    {
      key: "shot",
      label: "Shot Glasses",
      icon: <span className="text-sm">🥃</span>,
      img: "https://images.unsplash.com/photo-1541976076758-347942db1973?q=80&w=1200&auto=format&fit=crop",
    },
    {
      key: "accessories",
      label: "Coffee Accessories",
      icon: <PackageOpen className="h-5 w-5" />,
      img: "https://images.unsplash.com/photo-1523365280197-f1783db9fe62?q=80&w=1200&auto=format&fit=crop",
    },
  ];

  return (
    <main className="py-16 md:py-24">
      <Container>
        <BackButton />
        <SectionTitle
          title={
            <span className="text-3xl md:text-5xl font-extrabold text-amber-300">
              Ship’s Store — Coming Soon
            </span>
          }
          subtitle="Browse categories and join the Fleet to get notified when drops go live."
        />
        <div className="mt-4 max-w-xl">
          <div className="rounded-2xl ring-1 ring-amber-400/50 bg-neutral-900/60 p-5">
            <div className="text-sm text-neutral-200">
              Want first dibs on merch?
            </div>
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
        <BackButton />
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
        <BackButton />
        <SectionTitle
          title={
            <span className="text-3xl md:text-5xl font-extrabold text-amber-300">
              Mission — Ignite the Spirit, Savor the Victory
            </span>
          }
          subtitle="Veteran-owned roastery honoring the craft, the crew, and the Constitution."
        />
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
  return (
    <main className="py-16 md:py-24">
      <Container>
        <BackButton />
        <SectionTitle
          title={
            <span className="text-3xl md:text-5xl font-extrabold text-amber-300">
              Origins & Voyages
            </span>
          }
          subtitle="Stories from the land and the hands that grow our beans."
        />
        <div className="mt-6 max-w-3xl text-neutral-300 space-y-6">
          <p>
            Paragraph 1 — your origin/voyage intro copy goes here. Talk region,
            altitude, varietals, and harvest practices.
          </p>
          <div className="aspect-[16/9] rounded-2xl ring-1 ring-neutral-800 bg-neutral-900/50 grid place-content-center text-neutral-500">
            Photo slot
          </div>
          <p>
            Paragraph 2 — describe processing (washed, natural, honey), drying
            beds, and farmer partnerships.
          </p>
          <div className="aspect-[16/9] rounded-2xl ring-1 ring-neutral-800 bg-neutral-900/50 grid place-content-center text-neutral-500">
            Photo slot
          </div>
          <p>
            Paragraph 3 — tasting notes, cupping scores, and how origin
            influences roast decisions.
          </p>
        </div>
      </Container>
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
        <BackButton />
        <SectionTitle
          title={
            <span className="text-3xl md:text-5xl font-extrabold text-amber-300">
              Contact — Hail the quarterdeck
            </span>
          }
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
        <BackButton />
        <SectionTitle
          title="DoD / Government Contracting Profile"
          subtitle="Central repository for CAGE, SAM, NAICS, UEI, and capability statements."
        />
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
    shipping: "Shipping",
    privacy: "Privacy Policy",
    terms: "Terms of Service",
  };
  const title = titles[slug as string] || "Policy";
  return (
    <main className="py-16">
      <Container>
        <BackButton />
        <SectionTitle
          title={title}
          subtitle="Fill in with your official policy text."
        />
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
  const { cart, inc, dec, remove, clear, subtotal } = useCart();
  return (
    <main className="py-16 md:py-24">
      <Container>
        <BackButton />
        <SectionTitle
          title="War Chest"
          subtitle={
            cart.length ? `${cart.length} item(s)` : "Your chest is empty."
          }
        />
        {cart.length ? (
          <div className="mt-6 grid md:grid-cols-3 gap-6">
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
            <aside className="rounded-xl ring-1 ring-neutral-800 bg-neutral-900/50 p-6 h-max">
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-400">Subtotal</span>
                <span className="font-semibold">{fmt(subtotal)}</span>
              </div>
              <button className="mt-4 w-full px-4 py-2 rounded-lg bg-amber-400 text-neutral-900 font-semibold hover:bg-amber-300">
                Checkout
              </button>
              <button
                onClick={clear}
                className="mt-3 w-full px-4 py-2 rounded-lg border border-neutral-700 text-neutral-300 hover:text-amber-300 hover:border-amber-400/50"
              >
                Clear Chest
              </button>
            </aside>
          </div>
        ) : (
          <div className="mt-6 rounded-2xl ring-1 ring-neutral-800 bg-neutral-900/40 p-10 text-center">
            <p className="text-neutral-400">
              No items yet. Return to the{" "}
              <Link to="/fleet" className="text-amber-300 hover:underline">
                Fleet
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
        <div className="rounded-2xl ring-1 ring-neutral-800 bg-neutral-900/40 p-10 text-center">
          <h1 className="text-3xl font-extrabold text-amber-300">
            Page not found
          </h1>
          <p className="mt-2 text-neutral-400">
            The page you’re looking for was sunk by the British!
          </p>
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

function Layout() {
  const { count } = useCart();
  const [shrunk, setShrunk] = useState(false);
  useEffect(() => {
    const onScroll = () => setShrunk(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 overflow-x-hidden">
      <FlashToast />
      {/* FIXED, SHRINK-ON-SCROLL HEADER */}
      <header className="fixed top-0 inset-x-0 z-50 bg-neutral-950/95 backdrop-blur border-b border-neutral-800">
        <Container>
          <div className={shrunk ? "pt-2 md:pt-3" : "pt-6 md:pt-8"}>
            {/* Top row: Emblem + Title */}
            <div className="flex items-center gap-4 justify-center">
              <img
                src="/emblem-black.png"
                alt="Old Ironsides emblem"
                className={
                  shrunk
                    ? "h-20 md:h-24 w-auto object-contain select-none transition-all"
                    : "h-28 md:h-36 w-auto object-contain select-none transition-all"
                }
              />
              <div className="flex flex-col text-left -mt-1">
                <div
                  className={
                    shrunk
                      ? "text-2xl md:text-4xl font-extrabold tracking-[0.18em] text-neutral-300"
                      : "text-3xl md:text-5xl font-extrabold tracking-[0.18em] text-neutral-300"
                  }
                >
                  OLD IRONSIDES COFFEE
                </div>
                <div
                  className={
                    shrunk
                      ? "text-[10px] md:text-xs text-amber-200"
                      : "text-xs md:text-base text-amber-200"
                  }
                >
                  Ignite the Spirit, Savor the Victory!
                </div>
                <div
                  className={
                    shrunk
                      ? "hidden md:block text-[10px] text-neutral-300"
                      : "text-[10px] md:text-xs text-neutral-300"
                  }
                >
                  Veteran-owned and operated.
                </div>
              </div>
            </div>

            {/* Bottom row: Nav */}
            <nav className="mt-4 flex justify-center">
              <div className="flex items-center gap-5">
                <HeaderNavLink to="/">Home Port</HeaderNavLink>
                <HeaderNavLink to="/fleet">The Fleet</HeaderNavLink>
                <HeaderNavLink to="/store">Ship’s Store</HeaderNavLink>
                <HeaderNavLink to="/mission">Admiral’s Log</HeaderNavLink>
                <HeaderNavLink to="/origins">Origins & Voyages</HeaderNavLink>
                <HeaderNavLink to="/contact">Contact the Crew</HeaderNavLink>
                <HeaderNavLink to="/sdvosb">SDVOSB</HeaderNavLink>
                <Link
                  to="/cart"
                  className="relative px-1.5 py-1 rounded-md text-amber-300 inline-flex items-center gap-1.5"
                >
                  <ChestIcon className="h-6 w-6 md:h-7 md:w-7" />
                  <span className="text-sm md:text-base">War Chest</span>
                  {count > 0 && (
                    <span className="absolute -top-1.5 -right-2 bg-amber-400 text-neutral-900 text-[10px] font-bold rounded-full px-1.5">
                      {count}
                    </span>
                  )}
                </Link>
              </div>
            </nav>
          </div>
        </Container>
      </header>

      {/* spacer so content doesn’t hide under header */}
      <div className={shrunk ? "h-[120px]" : "h-[180px] md:h-[200px]"} />

      <Outlet />

      <footer className="border-t border-neutral-800 bg-neutral-950">
        <Container className="py-10 text-sm">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="text-sm tracking-[0.2em] text-amber-300">
                OLD IRONSIDES COFFEE
              </div>
              <div className="text-neutral-300 mt-2">
                Veteran-owned and operated.
              </div>
            </div>
            <div>
              <div className="text-neutral-400 font-semibold mb-2">Support</div>
              <ul className="space-y-1">
                <li>
                  <Link
                    className="text-neutral-300 hover:text-amber-300"
                    to="/legal/privacy"
                  >
                    Privacy Policy
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
                    to="/legal/returns"
                  >
                    Returns
                  </Link>
                </li>
                <li>
                  <Link
                    className="text-neutral-300 hover:text-amber-300"
                    to="/legal/shipping"
                  >
                    Shipping
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <div className="text-neutral-400 font-semibold mb-2">Contact</div>
              <ul className="space-y-1 text-neutral-300">
                <li>HQ@oldironsidescoffee.org</li>
                <li>6 Liberty Square #2564, Boston, MA 02109</li>
              </ul>
            </div>
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
        <Route path="fleet" element={<FleetPage />} />
        <Route path="fleet/:slug" element={<FleetStoryPage />} />
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
