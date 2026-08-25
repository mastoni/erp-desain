import { useEffect, useState } from "react";
import JSZip from "jszip";
import { HOURLY, type Product, type SalesRecord, type StoreConfig } from "../data";
import { cx, downloadCsv, idr, idrShort, num } from "../lib/format";
import { Barcode } from "../components/charts";
import { Badge, Reveal, SectionHead } from "../components/ui";
import type { Toast } from "../components/ui";
import { FLUTTER_FILES } from "../mobile/flutterCode";
import {
  IconBasket,
  IconBox,
  IconCheck,
  IconChevronRight,
  IconDownload,
  IconLogout,
  IconMinus,
  IconPlus,
  IconQr,
  IconSearch,
  IconStore,
  IconUsers,
  IconX,
  IconZap,
} from "../components/icons";

type Push = (msg: string, tone?: Toast["tone"]) => void;

const IconHome = ({ s = 17 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="m3 10.5 9-7.5 9 7.5" /><path d="M5 9.5V21h14V9.5" /><path d="M10 21v-6h4v6" />
  </svg>
);
const IconBolt = ({ s = 17 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2 4.5 13.5H11L9.5 22 19 10h-6.5L13 2z" />
  </svg>
);
const IconPerson = ({ s = 17 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4" /><path d="M4.5 20.5c1.2-3.4 4.1-5 7.5-5s6.3 1.6 7.5 5" />
  </svg>
);

const SVCS = [
  { id: "pulsa", label: "Pulsa", fee: 2000, color: "#d92c20", nominals: [5_000, 10_000, 25_000, 50_000], ph: "08xxxxxxxxxx" },
  { id: "data", label: "Paket Data", fee: 2500, color: "#1268b3", nominals: [30_000, 52_000, 95_000], ph: "08xxxxxxxxxx" },
  { id: "ewallet", label: "E-Wallet", fee: 1500, color: "#00a4a0", nominals: [10_000, 50_000, 100_000, 200_000], ph: "08xxxxxxxxxx" },
  { id: "token", label: "Token PLN", fee: 2500, color: "#d3921f", nominals: [20_000, 50_000, 100_000], ph: "ID pelanggan / meter" },
  { id: "transfer", label: "Transfer", fee: 6500, color: "#6d3fa8", nominals: [100_000, 500_000, 1_000_000], ph: "No. rekening" },
];

const TABS = [
  { id: "home", label: "Beranda" },
  { id: "kasir", label: "Kasir" },
  { id: "ppob", label: "PPOB" },
  { id: "stok", label: "Stok" },
  { id: "profil", label: "Profil" },
] as const;
type TabId = (typeof TABS)[number]["id"];

/* ================= SIMULATOR PONSEL ================= */

function PhoneApp({
  products,
  sales,
  config,
  onSale,
  notify,
}: {
  products: Product[];
  sales: SalesRecord[];
  config: StoreConfig;
  onSale: (r: SalesRecord) => void;
  notify: (msg: string) => void;
}) {
  const [stage, setStage] = useState<"splash" | "login" | "app">("splash");
  const [tab, setTab] = useState<TabId>("home");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());

  const [cart, setCart] = useState<Record<string, number>>({});
  const [kq, setKq] = useState("");
  const [sheet, setSheet] = useState<null | "cart" | "pay" | "done">(null);
  const [method, setMethod] = useState<"Tunai" | "QRIS">("Tunai");
  const [cash, setCash] = useState(0);
  const [receipt, setReceipt] = useState<SalesRecord | null>(null);

  const [svcId, setSvcId] = useState<string | null>(null);
  const [target, setTarget] = useState("");
  const [nom, setNom] = useState<number | null>(null);
  const [proc, setProc] = useState(false);
  const [ppobDone, setPpobDone] = useState<{ ref: string; total: number } | null>(null);

  const [sq, setSq] = useState("");

  useEffect(() => {
    const c = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(c);
  }, []);

  useEffect(() => {
    if (stage !== "splash") return;
    const t = setTimeout(() => setStage("login"), 1500);
    return () => clearTimeout(t);
  }, [stage]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const showToast = (m: string) => setToast(m);

  const login = () => {
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      setStage("app");
      showToast(`Selamat datang di ${config.storeName}`);
      notify("Aplikasi Android tenant login — sesi JWT + X-Tenant-Id aktif.");
    }, 900);
  };

  /* ---- kasir ---- */
  const kProducts = products.filter(
    (p) => p.name.toLowerCase().includes(kq.toLowerCase()) || p.sku.toLowerCase().includes(kq.toLowerCase())
  );
  const cartLines = Object.entries(cart)
    .map(([id, qty]) => ({ p: products.find((pp) => pp.id === id)!, qty }))
    .filter((l) => l.p);
  const subtotal = cartLines.reduce((s, l) => s + l.p.price * l.qty, 0);
  const tax = Math.round((subtotal * config.taxRate) / 100);
  const total = subtotal + tax;
  const itemCount = cartLines.reduce((s, l) => s + l.qty, 0);

  const addToCart = (p: Product) => {
    const cur = cart[p.id] ?? 0;
    if (cur >= p.stock) {
      showToast(`Stok ${p.name} habis`);
      return;
    }
    setCart((c) => ({ ...c, [p.id]: cur + 1 }));
  };

  const confirmPay = () => {
    const rec: SalesRecord = {
      id: `APP-${String(Date.now()).slice(-6)}`,
      ts: Date.now(),
      time: now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      cashier: "Aplikasi Android",
      items: itemCount,
      method,
      total,
      status: "selesai",
      lines: cartLines.map((l) => ({ name: l.p.name, qty: l.qty, price: l.p.price })),
      fresh: true,
    };
    onSale(rec);
    setReceipt(rec);
    setSheet("done");
    setCart({});
    notify(`Penjualan ${rec.id} dari aplikasi Android tercatat (${idr(total)}).`);
  };

  /* ---- ppob ---- */
  const svc = SVCS.find((s) => s.id === svcId) ?? null;
  const ppobBuy = () => {
    if (!svc || !nom) return;
    if (target.replace(/\D/g, "").length < 8) {
      showToast("Nomor tujuan tidak valid");
      return;
    }
    setProc(true);
    setTimeout(() => {
      setProc(false);
      setPpobDone({ ref: `PTX-${Math.floor(10000 + Math.random() * 89999)}`, total: nom + svc.fee });
      notify(`PPOB ${svc.label} dari aplikasi Android sukses — profit share tercatat di platform.`);
    }, 1300);
  };

  const lowStock = [...products].sort((a, b) => a.stock / a.minStock - b.stock / b.minStock);
  const sProducts = lowStock.filter((p) => p.name.toLowerCase().includes(sq.toLowerCase()));

  const omzet = sales.reduce((s, r) => s + r.total, 0);

  /* ---------- render layar ---------- */
  const screen = () => {
    if (stage === "splash")
      return (
        <div className="flex h-full flex-col items-center justify-center bg-pine-deep">
          <div className="pop flex h-20 w-20 items-center justify-center rounded-[26px] bg-pine shadow-[0_18px_40px_-12px_rgba(0,0,0,0.6)]">
            <IconStore width={38} height={38} className="text-honey" />
          </div>
          <p className="font-display mt-5 text-[21px] font-bold text-[#f5f0df]">SKMNet Tenant</p>
          <p className="mt-1 text-[11px] text-white/50">Kasir & ERP dalam genggaman</p>
          <div className="mt-8 h-1 w-24 overflow-hidden rounded-full bg-white/10">
            <div className="bar-fill h-full w-full rounded-full bg-honey" style={{ animationDuration: "1.4s" }} />
          </div>
          <p className="num absolute bottom-6 text-[9px] tracking-[0.2em] text-white/30">v2.4.0 · BUILD 24</p>
        </div>
      );

    if (stage === "login")
      return (
        <div className="flex h-full flex-col bg-paper px-6 pt-14">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pine text-[#f2efe2]">
            <IconStore width={24} height={24} />
          </div>
          <h2 className="font-display mt-5 text-[22px] font-bold leading-tight">Selamat datang</h2>
          <p className="mt-1 text-[12px] text-fog">Masuk ke akun kasir tenant Anda.</p>
          <div className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full border border-pine/25 bg-pine-soft px-2.5 py-1 text-[10px] font-bold text-pine">
            <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-pine" /> {config.storeName} · T-001
          </div>
          <label className="label mt-6">Email</label>
          <input defaultValue="rani@skmmart.id" className="input bg-white" />
          <label className="label mt-3">PIN</label>
          <input defaultValue="••••••" type="password" className="input bg-white" />
          <button onClick={login} disabled={busy} className="btn-primary mt-6 w-full py-3">
            {busy ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : "Masuk"}
          </button>
          <p className="num mt-auto mb-5 text-center text-[9.5px] text-fog">
            JWT + X-Tenant-Id · data terisolasi per tenant
          </p>
        </div>
      );

    return (
      <div className="flex h-full flex-col bg-paper">
        <div className="min-h-0 flex-1 overflow-y-auto pb-2">
          {tab === "home" && (
            <div key="home" className="view-enter px-4 pt-3">
              <div className="rounded-2xl bg-pine-deep p-4 text-[#f2efe2] shadow-lg">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-white/55">Omzet Hari Ini</p>
                  <Badge tone="honey">Live</Badge>
                </div>
                <p className="num mt-1.5 text-[26px] font-bold leading-none">{idr(omzet)}</p>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {[
                    { l: "Transaksi", v: num(sales.length) },
                    { l: "Rata-rata", v: idrShort(sales.length ? Math.round(omzet / sales.length) : 0) },
                    { l: "SKU", v: num(products.length) },
                  ].map((s) => (
                    <div key={s.l} className="rounded-lg bg-white/[0.07] px-2 py-1.5">
                      <p className="num text-[12px] font-bold">{s.v}</p>
                      <p className="text-[9px] text-white/55">{s.l}</p>
                    </div>
                  ))}
                </div>
              </div>

              <p className="mt-4 text-[10.5px] font-bold uppercase tracking-[0.14em] text-fog">Aksi Cepat</p>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {[
                  { l: "Kasir", t: "kasir" as TabId, icon: <IconBasket width={16} height={16} />, c: "#17593e" },
                  { l: "PPOB", t: "ppob" as TabId, icon: <IconBolt s={16} />, c: "#d3921f" },
                  { l: "Stok", t: "stok" as TabId, icon: <IconBox width={16} height={16} />, c: "#35657f" },
                  { l: "Scan", t: "kasir" as TabId, icon: <IconQr width={16} height={16} />, c: "#bc4b2f" },
                ].map((a) => (
                  <button
                    key={a.l}
                    onClick={() => {
                      setTab(a.t);
                      if (a.l === "Scan") showToast("Pemindai barcode dibuka");
                    }}
                    className="card card-hover flex flex-col items-center gap-1.5 py-3 cursor-pointer"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: `${a.c}16`, color: a.c }}>
                      {a.icon}
                    </span>
                    <span className="text-[10px] font-bold">{a.l}</span>
                  </button>
                ))}
              </div>

              <p className="mt-4 text-[10.5px] font-bold uppercase tracking-[0.14em] text-fog">Penjualan per Jam</p>
              <div className="card mt-2 p-3">
                <div className="flex h-16 items-end gap-[3px]">
                  {HOURLY.map((h, i) => (
                    <div key={h.h} className="flex-1 rounded-t-[3px] bg-pine/70 bar-rise" style={{ height: `${(h.v / 1_620_000) * 100}%`, animationDelay: `${i * 40}ms` }} />
                  ))}
                </div>
                <div className="num mt-1 flex justify-between text-[8px] text-fog">
                  <span>08:00</span><span>13:00</span><span>18:00</span><span>21:00</span>
                </div>
              </div>

              <p className="mt-4 text-[10.5px] font-bold uppercase tracking-[0.14em] text-fog">Transaksi Terbaru</p>
              <div className="card mt-2 mb-3 divide-y divide-line/70">
                {sales.slice(0, 4).map((r) => (
                  <div key={r.id} className="row-in flex items-center gap-2.5 px-3 py-2.5">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-pine-soft text-pine">
                      <IconBasket width={13} height={13} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="num truncate text-[11px] font-bold">{r.id} {r.fresh && <span className="ml-1 rounded bg-honey-soft px-1 text-[8px] font-bold text-[#8a5f10]">BARU</span>}</p>
                      <p className="text-[9.5px] text-fog">{r.time} · {r.items} item · {r.cashier}</p>
                    </div>
                    <span className="num text-[11.5px] font-bold">{idr(r.total)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "kasir" && (
            <div key="kasir" className="view-enter px-4 pt-3">
              <div className="relative">
                <IconSearch width={14} height={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fog" />
                <input value={kq} onChange={(e) => setKq(e.target.value)} placeholder="Cari produk / scan SKU…" className="input bg-white pl-8.5 text-[12.5px]" />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2.5">
                {kProducts.map((p) => {
                  const qty = cart[p.id] ?? 0;
                  const out = p.stock <= 0;
                  return (
                    <button
                      key={p.id}
                      onClick={() => addToCart(p)}
                      disabled={out}
                      className={cx("card card-hover relative p-3 text-left cursor-pointer", out && "opacity-45", qty > 0 && "border-pine/50")}
                    >
                      {qty > 0 && (
                        <span className="num absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-pine px-1 text-[9.5px] font-bold text-white pop">
                          {qty}
                        </span>
                      )}
                      <p className="text-[9px] font-bold uppercase tracking-wider text-fog">{p.category}</p>
                      <p className="mt-0.5 min-h-[30px] text-[11.5px] font-semibold leading-snug">{p.name}</p>
                      <p className="num mt-1.5 text-[13px] font-bold">{idr(p.price)}</p>
                      <p className="num text-[9px] text-fog">stok {p.stock}</p>
                    </button>
                  );
                })}
              </div>
              {itemCount > 0 && sheet === null && (
                <div className="sticky bottom-2 mt-3">
                  <button onClick={() => setSheet("cart")} className="btn-primary w-full py-3 shadow-xl">
                    <IconBasket width={16} height={16} /> {itemCount} item · {idr(total)}
                  </button>
                </div>
              )}
            </div>
          )}

          {tab === "ppob" && (
            <div key="ppob" className="view-enter px-4 pt-3">
              <div className="rounded-xl border border-honey/40 bg-honey-soft/50 px-3 py-2.5 text-[10.5px] font-semibold text-[#8a5f10]">
                Harga mengikuti kontrak profit share platform
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2.5">
                {SVCS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => { setSvcId(s.id); setTarget(""); setNom(null); setPpobDone(null); }}
                    className={cx("card card-hover p-3 text-left cursor-pointer", svcId === s.id && "border-pine/60 bg-pine-soft/40")}
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: `${s.color}16`, color: s.color }}>
                      <IconBolt s={16} />
                    </span>
                    <p className="mt-2 text-[12px] font-bold">{s.label}</p>
                    <p className="num text-[9.5px] text-fog">admin {idr(s.fee)}</p>
                  </button>
                ))}
              </div>

              {svc && !ppobDone && (
                <div className="card pop mt-3 p-3.5">
                  <div className="flex items-center justify-between">
                    <p className="text-[12px] font-bold">{svc.label}</p>
                    <button onClick={() => setSvcId(null)} className="text-fog hover:text-ink cursor-pointer"><IconX width={14} height={14} /></button>
                  </div>
                  <input
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    placeholder={svc.ph}
                    className="input num mt-2.5 bg-white text-[13px]"
                  />
                  <div className="mt-2.5 grid grid-cols-2 gap-2">
                    {svc.nominals.map((n) => (
                      <button
                        key={n}
                        onClick={() => setNom(n)}
                        className={cx(
                          "rounded-lg border py-2 text-center transition-all cursor-pointer",
                          nom === n ? "border-pine bg-pine text-white" : "border-line bg-surface hover:border-pine/40"
                        )}
                      >
                        <span className="num block text-[12px] font-bold">{idrShort(n)}</span>
                        <span className={cx("num block text-[9px]", nom === n ? "text-white/70" : "text-fog")}>bayar {idrShort(n + svc.fee)}</span>
                      </button>
                    ))}
                  </div>
                  <button onClick={ppobBuy} disabled={proc || !nom} className="btn-primary mt-3 w-full py-2.5 text-[13px]">
                    {proc ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : `Bayar ${nom ? idr(nom + svc.fee) : ""}`}
                  </button>
                </div>
              )}

              {ppobDone && svc && (
                <div className="card pop mt-3 flex flex-col items-center p-5 text-center">
                  <span className="check-pop flex h-11 w-11 items-center justify-center rounded-full bg-pine text-white"><IconCheck width={20} height={20} /></span>
                  <p className="font-display mt-2.5 text-[15px] font-bold">{svc.label} Berhasil</p>
                  <p className="num mt-0.5 text-[10px] text-fog">{ppobDone.ref} · {target}</p>
                  <p className="num mt-2 rounded-lg bg-pine-soft px-3 py-1.5 text-[14px] font-bold text-pine">{idr(ppobDone.total)}</p>
                  <button onClick={() => { setSvcId(null); setPpobDone(null); }} className="btn-outline mt-3 w-full py-2 text-[12px]">Selesai</button>
                </div>
              )}
            </div>
          )}

          {tab === "stok" && (
            <div key="stok" className="view-enter px-4 pt-3">
              <div className="relative">
                <IconSearch width={14} height={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fog" />
                <input value={sq} onChange={(e) => setSq(e.target.value)} placeholder="Cari stok…" className="input bg-white pl-8.5 text-[12.5px]" />
              </div>
              <div className="card mt-3 mb-3 divide-y divide-line/70">
                {sProducts.map((p) => (
                  <div key={p.id} className="flex items-center gap-2.5 px-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11.5px] font-bold">{p.name}</p>
                      <p className="num text-[9.5px] text-fog">{p.sku} · {idr(p.price)}</p>
                    </div>
                    {p.stock === 0 ? (
                      <Badge tone="clay">Habis</Badge>
                    ) : p.stock <= p.minStock ? (
                      <Badge tone="honey">{p.stock} sisa</Badge>
                    ) : (
                      <span className="num text-[11.5px] font-bold text-pine">{p.stock}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "profil" && (
            <div key="profil" className="view-enter px-4 pt-4">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pine font-display text-[15px] font-bold text-[#f2efe2]">
                  {config.storeName.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                </span>
                <div>
                  <p className="font-display text-[15px] font-bold leading-tight">{config.storeName}</p>
                  <p className="num text-[10px] text-fog">skmmart.skmnet.cloud · Paket Pro</p>
                </div>
                <Badge tone="honey" className="ml-auto">Pro</Badge>
              </div>
              <div className="card mt-4 divide-y divide-line/70">
                {[
                  { l: "Pengaturan Kasir", d: "Printer, scanner, laci kasir", i: <IconZap width={15} height={15} /> },
                  { l: "Anggota Tim", d: "3 pengguna aktif", i: <IconUsers width={15} height={15} /> },
                  { l: "Notifikasi", d: "Pesanan & settlement PPOB", i: <IconBolt s={15} /> },
                  { l: "Sinkronisasi", d: "Tersinkron 12 detik lalu", i: <IconCheck width={15} height={15} /> },
                ].map((m) => (
                  <button key={m.l} onClick={() => showToast(`${m.l} — kelola di web app`)} className="flex w-full items-center gap-3 px-3.5 py-3 text-left transition-colors hover:bg-paper cursor-pointer">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-pine-soft text-pine">{m.i}</span>
                    <span className="flex-1">
                      <span className="block text-[12px] font-bold">{m.l}</span>
                      <span className="block text-[9.5px] text-fog">{m.d}</span>
                    </span>
                    <IconChevronRight width={13} height={13} className="text-fog" />
                  </button>
                ))}
              </div>
              <button
                onClick={() => { setStage("login"); setTab("home"); setCart({}); setSvcId(null); }}
                className="btn-outline mt-4 w-full py-2.5 text-[12.5px] text-clay hover:border-clay/50 hover:bg-clay-soft/50"
              >
                <IconLogout width={15} height={15} /> Keluar
              </button>
              <p className="num mt-3 text-center text-[9px] text-fog">SKMNet Tenant v2.4.0 (build 24) · Android 14</p>
            </div>
          )}
        </div>

        {/* bottom nav */}
        <nav className="grid grid-cols-5 border-t border-line bg-surface/95 px-1 pb-2.5 pt-1.5 backdrop-blur">
          {TABS.map((t) => {
            const on = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)} className="flex flex-col items-center gap-0.5 py-1 cursor-pointer">
                <span className={cx("flex h-7 w-12 items-center justify-center rounded-full transition-all duration-200", on ? "bg-pine text-[#f2efe2]" : "text-fog")}>
                  {t.id === "home" && <IconHome />}
                  {t.id === "kasir" && <IconBasket width={17} height={17} />}
                  {t.id === "ppob" && <IconBolt />}
                  {t.id === "stok" && <IconBox width={17} height={17} />}
                  {t.id === "profil" && <IconPerson />}
                </span>
                <span className={cx("text-[8.5px] font-bold", on ? "text-pine" : "text-fog")}>{t.label}</span>
              </button>
            );
          })}
        </nav>

        {/* sheet keranjang / bayar */}
        {sheet && (
          <div className="overlay-in absolute inset-0 z-20 bg-pine-deep/50" onMouseDown={() => sheet !== "done" && setSheet(null)}>
            <div className="sheet-up absolute inset-x-0 bottom-0 max-h-[80%] overflow-y-auto rounded-t-3xl bg-surface p-4 pb-5" onMouseDown={(e) => e.stopPropagation()}>
              <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-linedark" />
              {sheet === "cart" && (
                <>
                  <p className="font-display text-[15px] font-bold">Keranjang · {itemCount} item</p>
                  <div className="mt-3 space-y-2">
                    {cartLines.map((l) => (
                      <div key={l.p.id} className="row-in flex items-center gap-2 rounded-lg border border-line bg-paper/50 px-2.5 py-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[11.5px] font-bold">{l.p.name}</p>
                          <p className="num text-[9.5px] text-fog">{idr(l.p.price)}</p>
                        </div>
                        <div className="flex items-center gap-1.5 rounded-md border border-line bg-surface px-1.5 py-0.5">
                          <button onClick={() => setCart((c) => (l.qty <= 1 ? Object.fromEntries(Object.entries(c).filter(([k]) => k !== l.p.id)) : { ...c, [l.p.id]: l.qty - 1 }))} className="text-fog hover:text-pine cursor-pointer"><IconMinus width={11} height={11} /></button>
                          <span className="num w-4 text-center text-[11px] font-bold">{l.qty}</span>
                          <button onClick={() => addToCart(l.p)} className="text-fog hover:text-pine cursor-pointer"><IconPlus width={11} height={11} /></button>
                        </div>
                        <span className="num w-16 text-right text-[11px] font-bold">{idr(l.p.price * l.qty)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="num mt-3 space-y-1 text-[11.5px]">
                    <div className="flex justify-between text-fog"><span>Subtotal</span><span>{idr(subtotal)}</span></div>
                    <div className="flex justify-between text-fog"><span>PPN {config.taxRate}%</span><span>{idr(tax)}</span></div>
                    <div className="flex justify-between border-t border-dashed border-linedark pt-1.5 text-[15px] font-bold text-ink"><span>Total</span><span className="text-pine">{idr(total)}</span></div>
                  </div>
                  <button onClick={() => { setMethod("Tunai"); setCash(total); setSheet("pay"); }} className="btn-primary mt-3 w-full py-3">Bayar Sekarang</button>
                </>
              )}
              {sheet === "pay" && (
                <>
                  <p className="font-display text-[15px] font-bold">Metode Pembayaran</p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {(["Tunai", "QRIS"] as const).map((m) => (
                      <button key={m} onClick={() => setMethod(m)} className={cx("flex flex-col items-center gap-1 rounded-xl border py-3 text-[12px] font-bold transition-all cursor-pointer", method === m ? "border-pine bg-pine-soft text-pine" : "border-line text-fog")}>
                        {m === "Tunai" ? <IconBasket width={16} height={16} /> : <IconQr width={16} height={16} />}
                        {m}
                      </button>
                    ))}
                  </div>
                  {method === "Tunai" ? (
                    <>
                      <label className="label mt-3">Uang Diterima</label>
                      <input type="number" value={cash || ""} onChange={(e) => setCash(Math.max(0, Number(e.target.value) || 0))} className="input num bg-white text-[15px] font-bold" />
                      <div className="mt-2 flex gap-1.5">
                        {[total, Math.ceil(total / 50_000) * 50_000].map((q, i) => (
                          <button key={i} onClick={() => setCash(q)} className="btn-outline flex-1 py-1.5 text-[11px] num">{i === 0 ? "Uang Pas" : idrShort(q)}</button>
                        ))}
                      </div>
                      <div className={cx("num mt-2.5 flex justify-between rounded-lg px-3 py-2 text-[12px] font-bold", cash >= total ? "bg-pine-soft text-pine" : "bg-clay-soft text-clay")}>
                        <span>{cash >= total ? "Kembalian" : "Kurang"}</span>
                        <span>{idr(Math.abs(cash - total))}</span>
                      </div>
                    </>
                  ) : (
                    <div className="mt-3 flex flex-col items-center rounded-xl border border-dashed border-linedark bg-white py-3">
                      <IconQr width={64} height={64} className="text-pine-deep" />
                      <p className="num mt-1.5 text-[12px] font-bold">{idr(total)}</p>
                      <p className="text-[9.5px] text-fog">Pelanggan memindai dari aplikasi apa pun</p>
                    </div>
                  )}
                  <button onClick={confirmPay} disabled={method === "Tunai" && cash < total} className="btn-primary mt-3 w-full py-3">
                    <IconCheck width={16} height={16} /> Selesaikan
                  </button>
                </>
              )}
              {sheet === "done" && receipt && (
                <div className="flex flex-col items-center text-center">
                  <span className="check-pop flex h-12 w-12 items-center justify-center rounded-full bg-pine text-white"><IconCheck width={22} height={22} /></span>
                  <p className="font-display mt-2.5 text-[16px] font-bold">Pembayaran Berhasil</p>
                  <p className="num text-[10px] text-fog">{receipt.id} · {receipt.time} · {receipt.method}</p>
                  <div className="num mt-3 w-full rounded-lg border border-dashed border-linedark bg-white px-3.5 py-3 text-left text-[10.5px]">
                    {receipt.lines.map((l, i) => (
                      <div key={i} className="flex justify-between gap-2"><span className="truncate">{l.qty}× {l.name}</span><span>{num(l.qty * l.price)}</span></div>
                    ))}
                    <div className="mt-1.5 flex justify-between border-t border-dashed border-linedark pt-1.5 text-[13px] font-bold"><span>Total</span><span className="text-pine">{idr(receipt.total)}</span></div>
                  </div>
                  <button onClick={() => setSheet(null)} className="btn-primary mt-3 w-full py-2.5 text-[13px]">Transaksi Baru</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="phone-in relative mx-auto w-[340px] shrink-0">
      {/* tombol samping */}
      <span className="absolute -right-[3px] top-24 h-14 w-[3px] rounded-r bg-ink/40" />
      <span className="absolute -right-[3px] top-44 h-9 w-[3px] rounded-r bg-ink/40" />
      <div className="rounded-[3rem] border border-ink/25 bg-pine-deep p-[10px] shadow-[0_36px_70px_-24px_rgba(12,32,24,0.6)]">
        <div className="relative h-[660px] overflow-hidden rounded-[2.4rem] bg-paper">
          {/* status bar */}
          <div className={cx("absolute inset-x-0 top-0 z-30 flex items-center justify-between px-6 pt-2.5 text-[10px] font-bold", stage === "splash" ? "text-white/70" : "text-ink")}>
            <span className="num tabular-nums">{now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</span>
            <span className="absolute left-1/2 top-2 h-3 w-3 -translate-x-1/2 rounded-full bg-ink/85" />
            <span className="flex items-center gap-1.5">
              <svg width="13" height="10" viewBox="0 0 13 10" fill="currentColor"><rect x="0" y="6" width="2.4" height="4" rx="0.6" /><rect x="3.6" y="4" width="2.4" height="6" rx="0.6" /><rect x="7.2" y="1.5" width="2.4" height="8.5" rx="0.6" /><rect x="10.8" y="0" width="2.2" height="10" rx="0.6" opacity="0.35" /></svg>
              <svg width="13" height="10" viewBox="0 0 13 10" fill="none" stroke="currentColor" strokeWidth="1.3"><path d="M1 3.6a8.5 8.5 0 0 1 11 0" /><path d="M3 6a5.5 5.5 0 0 1 7 0" /><circle cx="6.5" cy="8.4" r="1" fill="currentColor" stroke="none" /></svg>
              <svg width="19" height="10" viewBox="0 0 19 10"><rect x="0.5" y="0.5" width="15" height="9" rx="2.5" fill="none" stroke="currentColor" opacity="0.5" /><rect x="2" y="2" width="10" height="6" rx="1.4" fill="currentColor" /><rect x="16.5" y="3" width="2" height="4" rx="1" fill="currentColor" opacity="0.5" /></svg>
            </span>
          </div>

          <div className="h-full pt-7">{screen()}</div>

          {/* toast internal */}
          {toast && (
            <div className="toast-in pointer-events-none absolute inset-x-5 top-10 z-40 rounded-xl bg-pine-deep px-3.5 py-2.5 text-center text-[11px] font-bold text-[#f2efe2] shadow-xl">
              {toast}
            </div>
          )}
        </div>
      </div>
      <p className="num mt-3 text-center text-[10.5px] text-fog">
        Pixel 8 · Android 14 · emulator interaktif — coba login, kasir, PPOB
      </p>
    </div>
  );
}

/* ================= DOKUMENTASI ================= */

const ENDPOINTS = [
  { m: "POST", p: "/v1/auth/login", d: "Login kasir — mengembalikan JWT + tenant_id" },
  { m: "GET", p: "/v1/dashboard/today", d: "Omzet, transaksi & komisi PPOB hari berjalan" },
  { m: "GET", p: "/v1/products", d: "Katalog produk tenant (RLS otomatis)" },
  { m: "POST", p: "/v1/transactions", d: "Catat penjualan & potong stok (idempoten, aman offline-sync)" },
  { m: "GET", p: "/v1/ppob/catalog", d: "Layanan digital sesuai kontrak profit share platform" },
  { m: "POST", p: "/v1/ppob/purchase", d: "Pembelian PPOB — antrian settlement terpusat" },
  { m: "GET", p: "/v1/stock/low", d: "Peringatan stok menipis untuk push notification" },
];

const STACK = [
  { n: "Flutter 3.16+", d: "UI toolkit · Material 3", c: "#35657f" },
  { n: "Dart 3.2", d: "Bahasa & runtime", c: "#17593e" },
  { n: "Provider", d: "State management", c: "#d3921f" },
  { n: "dio", d: "HTTP + interceptor JWT", c: "#bc4b2f" },
  { n: "sqflite", d: "Antrian offline-first", c: "#35657f" },
  { n: "Firebase Messaging", d: "Push pesanan & settlement", c: "#d3921f" },
  { n: "printing", d: "Struk printer bluetooth", c: "#17593e" },
  { n: "Min SDK 24 · Target 34", d: "Android 7.0 – 14", c: "#68746c" },
];

function ArchDiagram() {
  const box = "fill-surface stroke-line";
  return (
    <svg viewBox="0 0 460 330" className="w-full">
      <defs>
        <marker id="arr" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0 L8 4 L0 8 z" fill="#17593e" />
        </marker>
      </defs>
      {/* alur utama */}
      {[
        { y: 14, t1: "Aplikasi Android (Flutter)", t2: "UI kasir · PPOB · stok" },
        { y: 108, t1: "API Gateway", t2: "verifikasi JWT · X-Tenant-Id" },
        { y: 202, t1: "Layanan SKMNet Cloud", t2: "kasir · ppob · inventory · ledger" },
        { y: 282, t1: "PostgreSQL + Row-Level Security", t2: "satu database · partisi per tenant" },
      ].map((b) => (
        <g key={b.y}>
          <rect x="120" y={b.y} width="220" height="52" rx="10" className={box} strokeWidth="1.2" />
          <text x="230" y={b.y + 22} textAnchor="middle" fontSize="12.5" fontWeight="700" fill="#1a2620" fontFamily="Bricolage Grotesque, sans-serif">{b.t1}</text>
          <text x="230" y={b.y + 39} textAnchor="middle" fontSize="9.5" fill="#68746c" fontFamily="IBM Plex Mono, monospace">{b.t2}</text>
        </g>
      ))}
      {[76, 170, 264].map((y, i) => (
        <line key={y} x1="230" y1={y - 8} x2="230" y2={y + 2} stroke="#17593e" strokeWidth="1.6" strokeDasharray="4 6" className="dash-flow" markerEnd="url(#arr)" style={{ animationDelay: `${i * 0.2}s` }} />
      ))}
      {/* node samping */}
      <g>
        <rect x="10" y="118" width="94" height="34" rx="8" fill="#f8ecd2" stroke="#d3921f" strokeOpacity="0.5" />
        <text x="57" y="132" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#8a5f10">FCM Push</text>
        <text x="57" y="144" textAnchor="middle" fontSize="8" fill="#8a5f10" opacity="0.8">pesanan baru</text>
        <line x1="104" y1="135" x2="118" y2="134" stroke="#d3921f" strokeWidth="1.3" strokeDasharray="3 4" className="dash-flow" />
      </g>
      <g>
        <rect x="356" y="24" width="94" height="34" rx="8" fill="#e2ecdf" stroke="#17593e" strokeOpacity="0.4" />
        <text x="403" y="38" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#17593e">sqflite</text>
        <text x="403" y="50" textAnchor="middle" fontSize="8" fill="#17593e" opacity="0.8">antrian offline</text>
        <line x1="356" y1="46" x2="342" y2="42" stroke="#17593e" strokeWidth="1.3" strokeDasharray="3 4" className="dash-flow" />
      </g>
      <g>
        <rect x="356" y="212" width="94" height="34" rx="8" fill="#e2ecdf" stroke="#17593e" strokeOpacity="0.4" />
        <text x="403" y="226" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#17593e">Settlement</text>
        <text x="403" y="238" textAnchor="middle" fontSize="8" fill="#17593e" opacity="0.8">profit share PPOB</text>
        <line x1="356" y1="228" x2="342" y2="228" stroke="#17593e" strokeWidth="1.3" strokeDasharray="3 4" className="dash-flow" />
      </g>
    </svg>
  );
}

export function MobileApp({
  products,
  sales,
  config,
  onSale,
  push,
}: {
  products: Product[];
  sales: SalesRecord[];
  config: StoreConfig;
  onSale: (r: SalesRecord) => void;
  push: Push;
}) {
  const [fileIdx, setFileIdx] = useState(0);
  const file = FLUTTER_FILES[fileIdx];

  const downloadZip = async () => {
    const zip = new JSZip();
    for (const f of FLUTTER_FILES) zip.file(`skmnet_tenant/${f.path}`, f.code);
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "skmnet_tenant_flutter.zip";
    a.click();
    URL.revokeObjectURL(url);
    push("Proyek Flutter diunduh — ekstrak lalu jalankan `flutter pub get && flutter run`.");
  };

  const copyFile = () => {
    navigator.clipboard?.writeText(file.code).catch(() => {});
    push(`${file.path} disalin ke clipboard.`, "info");
  };

  const downloadFile = () => {
    const blob = new Blob([file.code], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.path.split("/").pop() ?? "file.txt";
    a.click();
    URL.revokeObjectURL(url);
    push(`${file.path} diunduh.`, "info");
  };

  const notify = (msg: string) => push(msg, "info");

  return (
    <div>
      <SectionHead
        title="Aplikasi Android Tenant"
        desc="Satu APK Flutter untuk seluruh tenant SKMNet Cloud — data terisolasi per tenant via JWT + X-Tenant-Id."
        action={
          <div className="flex items-center gap-2">
            <Badge tone="pine" className="px-2.5! py-1.5!">v2.4.0 · build 24</Badge>
            <button className="btn-primary px-4 py-2" onClick={downloadZip}>
              <IconDownload width={15} height={15} /> Unduh Proyek Flutter (.zip)
            </button>
          </div>
        }
      />

      <div className="grid gap-8 lg:grid-cols-[400px_1fr]">
        {/* ponsel */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <PhoneApp products={products} sales={sales} config={config} onSale={onSale} notify={notify} />
        </div>

        {/* dokumentasi */}
        <div className="min-w-0 space-y-5">
          <Reveal>
            <section className="card p-5">
              <h3 className="font-display text-[17px] font-bold">Spesifikasi Teknis</h3>
              <p className="mt-0.5 text-[12px] text-fog">Stack yang dipakai aplikasi tenant di Play Store.</p>
              <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {STACK.map((s) => (
                  <div key={s.n} className="card card-hover p-3">
                    <span className="h-2 w-2 rounded-full" style={{ background: s.c }} />
                    <p className="mt-2 text-[12.5px] font-bold leading-tight">{s.n}</p>
                    <p className="mt-0.5 text-[10.5px] text-fog">{s.d}</p>
                  </div>
                ))}
              </div>
            </section>
          </Reveal>

          <Reveal delay={70}>
            <section className="card p-5">
              <h3 className="font-display text-[17px] font-bold">Arsitektur Multi-Tenant</h3>
              <p className="mt-0.5 text-[12px] text-fog">Satu aplikasi, banyak tenant — isolasi data diverifikasi di gateway dan dikunci RLS di database.</p>
              <div className="mt-3 overflow-x-auto">
                <div className="min-w-[460px]"><ArchDiagram /></div>
              </div>
            </section>
          </Reveal>

          <Reveal delay={110}>
            <section className="card overflow-hidden">
              <div className="border-b border-line px-5 py-4">
                <h3 className="font-display text-[17px] font-bold">REST API yang Dipakai Aplikasi</h3>
                <p className="mt-0.5 text-[12px] text-fog">Setiap request membawa header <span className="num font-bold text-pine">X-Tenant-Id</span> — gateway menolak bila tidak cocok dengan klaim JWT.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px]">
                  <tbody>
                    {ENDPOINTS.map((e) => (
                      <tr key={e.p} className="transition-colors hover:bg-paper/60">
                        <td className="td w-16"><Badge tone={e.m === "GET" ? "pine" : "honey"}>{e.m}</Badge></td>
                        <td className="td num text-[12.5px] font-bold">{e.p}</td>
                        <td className="td text-[12px] text-fog">{e.d}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </Reveal>

          <Reveal delay={140}>
            <section className="card overflow-hidden">
              <div className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-4">
                <div>
                  <h3 className="font-display text-[17px] font-bold">Kode Sumber Flutter</h3>
                  <p className="mt-0.5 text-[12px] text-fog">{FLUTTER_FILES.length} file inti — siap jalan sebagai proyek Android.</p>
                </div>
                <div className="ml-auto flex gap-2">
                  <button className="btn-outline px-3 py-2 text-[12px]" onClick={copyFile}>Salin</button>
                  <button className="btn-outline px-3 py-2 text-[12px]" onClick={downloadFile}>
                    <IconDownload width={13} height={13} /> .dart
                  </button>
                </div>
              </div>
              <div className="grid md:grid-cols-[210px_1fr]">
                <ul className="max-h-[380px] overflow-y-auto border-b border-line bg-paper/50 py-2 md:border-b-0 md:border-r">
                  {FLUTTER_FILES.map((f, i) => (
                    <li key={f.path}>
                      <button
                        onClick={() => setFileIdx(i)}
                        className={cx(
                          "flex w-full items-center gap-2 px-4 py-2 text-left transition-colors cursor-pointer",
                          i === fileIdx ? "bg-pine-deep text-[#f2efe2]" : "text-fog hover:bg-ink/5 hover:text-ink"
                        )}
                      >
                        <span className={cx("num text-[9px] font-bold uppercase", i === fileIdx ? "text-honey" : "text-fog/60")}>
                          {f.path.endsWith(".dart") ? "dart" : f.path.endsWith(".yaml") ? "yaml" : "md"}
                        </span>
                        <span className="num truncate text-[11.5px] font-semibold">{f.path}</span>
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="relative bg-pine-deep">
                  <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
                    <p className="num text-[11px] font-bold text-[#f2d9a0]">{file.path}</p>
                    <p className="text-[10px] text-white/40">{file.desc}</p>
                  </div>
                  <pre className="num max-h-[330px] overflow-auto whitespace-pre p-4 text-[10.8px] leading-[1.65] text-[#d8e4d2]">
                    <code>{file.code}</code>
                  </pre>
                </div>
              </div>
            </section>
          </Reveal>

          <Reveal delay={170}>
            <section className="grid gap-4 md:grid-cols-2">
              <div className="card p-5">
                <h3 className="font-display text-[16px] font-bold">Build & Distribusi</h3>
                <div className="num mt-3 space-y-1.5 rounded-lg bg-pine-deep p-3.5 text-[11px] leading-relaxed text-[#d8e4d2]">
                  <p className="text-white/40"># dari folder proyek hasil unduhan</p>
                  <p><span className="text-honey">$</span> flutter pub get</p>
                  <p><span className="text-honey">$</span> flutter run</p>
                  <p><span className="text-honey">$</span> flutter build apk --release</p>
                  <p><span className="text-honey">$</span> flutter build appbundle</p>
                </div>
                <p className="mt-3 text-[11.5px] leading-relaxed text-fog">
                  APK release untuk sideload internal, App Bundle untuk Google Play. Tanda tangani dengan keystore tenant opsional.
                </p>
              </div>
              <div className="card p-5">
                <h3 className="font-display text-[16px] font-bold">Alur Rilis ke Play Store</h3>
                <ol className="mt-3 space-y-2.5">
                  {[
                    "Unggah App Bundle ke Google Play Console (internal track dulu).",
                    "Lengkapi data store: screenshot ponsel, kebijakan privasi, deklarasi data.",
                    "Rollout bertahap 10% → 50% → 100% sambil pantau crash rate Crashlytics.",
                  ].map((s, i) => (
                    <li key={i} className="flex gap-2.5 text-[12.5px] leading-relaxed">
                      <span className="num mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-pine text-[10px] font-bold text-[#f2efe2]">{i + 1}</span>
                      {s}
                    </li>
                  ))}
                </ol>
                <button
                  className="btn-outline mt-4 w-full py-2 text-[12px]"
                  onClick={() => {
                    downloadCsv("endpoint-api-skmnet-tenant", [
                      ["Metode", "Endpoint", "Deskripsi"],
                      ...ENDPOINTS.map((e) => [e.m, e.p, e.d]),
                    ]);
                    push("Daftar endpoint API diekspor ke CSV.", "info");
                  }}
                >
                  <IconDownload width={13} height={13} /> Ekspor Daftar Endpoint (CSV)
                </button>
              </div>
            </section>
          </Reveal>

          {/* strip barcode instalasi */}
          <Reveal delay={200}>
            <div className="card flex flex-wrap items-center gap-5 p-5">
              <div className="rounded-lg border-[1.5px] border-ink/70 bg-white p-3">
                <Barcode value="https://play.skmnet.cloud/tenant-app" className="h-12 w-36 fill-ink" />
                <p className="num mt-1 text-center text-[8.5px] tracking-[0.14em] text-fog">play.skmnet.cloud/tenant-app</p>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display text-[16px] font-bold">Instal di Perangkat Kasir</p>
                <p className="mt-1 max-w-md text-[12.5px] leading-relaxed text-fog">
                  Pindai dari ponsel Android untuk memasang aplikasi, atau bagikan tautan internal ke seluruh outlet tenant.
                  Login memakai akun yang sama dengan web app — sesi saling eksklusif per perangkat.
                </p>
              </div>
              <Badge tone="honey" className="px-2.5! py-1.5!">Android 7.0+</Badge>
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
