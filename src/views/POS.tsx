import { useMemo, useState } from "react";
import { CATEGORY_COLORS, CUSTOMERS, type Product, type Settings } from "../data";
import { cx, idr, idrShort, num } from "../lib/format";
import { Badge, EmptyState, Modal, ModalHead, SectionHead } from "../components/ui";
import type { Toast } from "../components/ui";
import {
  IconBasket,
  IconBookmark,
  IconCard,
  IconCash,
  IconCheck,
  IconMinus,
  IconPlus,
  IconPrinter,
  IconQr,
  IconSearch,
  IconTrash,
  IconX,
} from "../components/icons";

type Push = (msg: string, tone?: Toast["tone"]) => void;
type Method = "Tunai" | "QRIS" | "Debit";
type CartLine = { id: string; qty: number };
type Parked = { key: string; customer: string; discount: number; lines: CartLine[]; time: string };
type Receipt = {
  id: string;
  date: string;
  customer: string;
  lines: { name: string; qty: number; price: number }[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  method: Method;
  cash: number;
  change: number;
};

function nextTrxId() {
  return `TRX-${String(Date.now()).slice(-6)}`;
}

/* QR dekoratif deterministik */
function QrSvg({ seed }: { seed: string }) {
  const N = 21;
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  const rnd = () => {
    h ^= h << 13; h >>>= 0; h ^= h >>> 17; h ^= h << 5; h >>>= 0;
    return h / 4294967296;
  };
  const cells = Array.from({ length: N * N }, () => rnd() > 0.52);
  const finderAt = (fx: number, fy: number, x: number, y: number): boolean | null => {
    const dx = x - fx, dy = y - fy;
    if (dx < 0 || dy < 0 || dx > 6 || dy > 6) return null;
    const ring = dx === 0 || dy === 0 || dx === 6 || dy === 6;
    return ring || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4);
  };
  const rects: React.ReactNode[] = [];
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const f = finderAt(0, 0, x, y) ?? finderAt(14, 0, x, y) ?? finderAt(0, 14, x, y);
      const dark = f !== null ? f : cells[y * N + x];
      if (dark) rects.push(<rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" />);
    }
  }
  return (
    <svg viewBox="0 0 21 21" shapeRendering="crispEdges" className="h-40 w-40 fill-pine-deep">
      {rects}
    </svg>
  );
}

export function POS({
  products,
  setProducts,
  settings,
  push,
  query,
  setQuery,
}: {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  settings: Settings;
  push: Push;
  query: string;
  setQuery: (v: string) => void;
}) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customer, setCustomer] = useState("Umum");
  const [discount, setDiscount] = useState(0);
  const [category, setCategory] = useState("Semua");
  const [addedId, setAddedId] = useState<string | null>(null);
  const [parked, setParked] = useState<Parked[]>([]);
  const [trxId, setTrxId] = useState(nextTrxId);

  const [payOpen, setPayOpen] = useState(false);
  const [method, setMethod] = useState<Method>("Tunai");
  const [cash, setCash] = useState(0);
  const [step, setStep] = useState<"pay" | "done">("pay");
  const [receipt, setReceipt] = useState<Receipt | null>(null);

  const categories = useMemo(() => ["Semua", ...Array.from(new Set(products.map((p) => p.category)))], [products]);

  const filtered = products.filter(
    (p) =>
      (category === "Semua" || p.category === category) &&
      (p.name.toLowerCase().includes(query.toLowerCase()) || p.sku.toLowerCase().includes(query.toLowerCase()))
  );

  const lines = cart
    .map((l) => ({ ...l, p: products.find((pp) => pp.id === l.id) }))
    .filter((l): l is CartLine & { p: Product } => Boolean(l.p));

  const subtotal = lines.reduce((s, l) => s + l.p.price * l.qty, 0);
  const discountVal = Math.round((subtotal * discount) / 100);
  const taxVal = Math.round(((subtotal - discountVal) * settings.taxRate) / 100);
  const total = subtotal - discountVal + taxVal;

  const add = (p: Product) => {
    if (p.stock <= 0) return;
    const line = cart.find((l) => l.id === p.id);
    if (line && line.qty >= p.stock) {
      push(`Stok ${p.name} tidak cukup — maksimum ${p.stock}.`, "warn");
      return;
    }
    setCart((c) => {
      const ex = c.find((l) => l.id === p.id);
      return ex ? c.map((l) => (l.id === p.id ? { ...l, qty: l.qty + 1 } : l)) : [...c, { id: p.id, qty: 1 }];
    });
    setAddedId(p.id);
    window.setTimeout(() => setAddedId((cur) => (cur === p.id ? null : cur)), 350);
  };

  const setQty = (id: string, qty: number) => {
    const p = products.find((pp) => pp.id === id);
    if (!p) return;
    if (qty > p.stock) {
      push(`Stok ${p.name} tersisa ${p.stock}.`, "warn");
      return;
    }
    setCart((c) => c.map((l) => (l.id === id ? { ...l, qty } : l)));
  };

  const remove = (id: string) => setCart((c) => c.filter((l) => l.id !== id));

  const clearAll = () => {
    setCart([]);
    setDiscount(0);
    setCustomer("Umum");
  };

  const park = () => {
    if (!lines.length) return;
    setParked((pk) => [
      ...pk,
      {
        key: `${Date.now()}`,
        customer,
        discount,
        lines: cart,
        time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    clearAll();
    push("Transaksi disimpan ke daftar tunggu.", "info");
  };

  const restore = (pk: Parked) => {
    if (cart.length) push("Keranjang aktif diganti dengan transaksi tersimpan.", "info");
    setCart(pk.lines);
    setCustomer(pk.customer);
    setDiscount(pk.discount);
    setParked((all) => all.filter((x) => x.key !== pk.key));
  };

  const quickCash = Array.from(
    new Set([
      total,
      Math.ceil(total / 20_000) * 20_000,
      Math.ceil(total / 50_000) * 50_000,
      Math.ceil(total / 100_000) * 100_000,
    ])
  ).sort((a, b) => a - b);

  const change = cash - total;

  const confirm = () => {
    const rec: Receipt = {
      id: trxId,
      date: new Date().toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }),
      customer,
      lines: lines.map((l) => ({ name: l.p.name, qty: l.qty, price: l.p.price })),
      subtotal,
      discount: discountVal,
      tax: taxVal,
      total,
      method,
      cash: method === "Tunai" ? cash : total,
      change: method === "Tunai" ? change : 0,
    };
    setReceipt(rec);
    setStep("done");
    setProducts((ps) =>
      ps.map((p) => {
        const l = cart.find((x) => x.id === p.id);
        return l ? { ...p, stock: Math.max(0, p.stock - l.qty), sold: p.sold + l.qty } : p;
      })
    );
    push(`Transaksi ${rec.id} berhasil — ${idr(rec.total)}.`, "success");
  };

  const newTransaction = () => {
    setPayOpen(false);
    setStep("pay");
    setReceipt(null);
    setCash(0);
    setMethod("Tunai");
    clearAll();
    setTrxId(nextTrxId());
  };

  const openPay = () => {
    setStep("pay");
    setMethod("Tunai");
    setCash(total);
    setPayOpen(true);
  };

  return (
    <div>
      <SectionHead
        title="Kasir"
        desc="Klik produk untuk menambah ke keranjang · Shift pagi — Rani Wijaya"
        action={
          <div className="flex items-center gap-2">
            <Badge tone="pine" className="px-2.5! py-1.5!">Hari ini: 164 trx · {idrShort(8_450_000)}</Badge>
            <button className="btn-outline px-3 py-2" onClick={clearAll} disabled={!lines.length}>
              <IconTrash width={14} height={14} /> Bersihkan
            </button>
          </div>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
        {/* ===== katalog produk ===== */}
        <section>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap gap-1.5">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={cx(
                    "rounded-full border px-3.5 py-1.5 text-[12.5px] font-semibold transition-all cursor-pointer",
                    category === c
                      ? "border-pine bg-pine text-[#f2efe2] shadow-sm"
                      : "border-line bg-surface text-fog hover:border-pine/40 hover:text-ink"
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="relative ml-auto w-full sm:w-60">
              <IconSearch width={14} height={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fog" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari nama / SKU…" className="input pl-8.5" />
            </div>
          </div>

          <p className="mb-3 text-[12px] font-semibold text-fog">
            {filtered.length} produk {category !== "Semua" && `· ${category}`}
          </p>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 2xl:grid-cols-4">
            {filtered.map((p) => {
              const out = p.stock <= 0;
              const low = !out && p.stock <= p.minStock;
              return (
                <button
                  key={p.id}
                  onClick={() => add(p)}
                  disabled={out}
                  className={cx(
                    "card card-hover group relative p-3.5 text-left",
                    out && "opacity-50 hover:translate-y-0",
                    addedId === p.id && "pop border-pine/60"
                  )}
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span
                      className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.08em]"
                      style={{ color: CATEGORY_COLORS[p.category] }}
                    >
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: CATEGORY_COLORS[p.category] }} />
                      {p.category}
                    </span>
                    {out ? (
                      <Badge tone="clay">Habis</Badge>
                    ) : low ? (
                      <Badge tone="honey">{p.stock}</Badge>
                    ) : (
                      <span className="num text-[10.5px] font-semibold text-fog">stok {p.stock}</span>
                    )}
                  </div>
                  <p className="min-h-[36px] text-[13px] font-semibold leading-snug">{p.name}</p>
                  <div className="mt-2.5 flex items-center justify-between">
                    <span className="num text-[15px] font-bold">{idr(p.price)}</span>
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-pine-soft text-pine transition-all group-hover:bg-pine group-hover:text-[#f2efe2] group-active:scale-90">
                      <IconPlus width={14} height={14} />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
          {filtered.length === 0 && (
            <div className="card mt-2">
              <EmptyState icon={<IconSearch width={20} height={20} />} title="Produk tidak ditemukan" desc={`Tidak ada hasil untuk "${query}". Coba kata kunci lain.`} />
            </div>
          )}
        </section>

        {/* ===== keranjang ===== */}
        <aside className="xl:sticky xl:top-[84px] xl:h-[calc(100vh-104px)]">
          <div className="card flex h-full flex-col overflow-hidden">
            <div className="border-b border-line px-4 py-3.5">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-[16px] font-bold">Keranjang</h3>
                <span className="num text-[11.5px] font-semibold text-fog">{trxId}</span>
              </div>
              <select value={customer} onChange={(e) => setCustomer(e.target.value)} className="input mt-2.5 py-1.5 text-[13px]">
                <option>Umum</option>
                {CUSTOMERS.map((c) => (
                  <option key={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {parked.length > 0 && (
              <div className="border-b border-line bg-honey-soft/40 px-4 py-2.5">
                <p className="mb-1.5 text-[10.5px] font-bold uppercase tracking-wider text-[#8a5f10]">Disimpan ({parked.length})</p>
                <div className="flex flex-wrap gap-1.5">
                  {parked.map((pk) => (
                    <span key={pk.key} className="inline-flex items-center gap-1.5 rounded-md border border-honey/50 bg-surface px-2 py-1 text-[11.5px] font-semibold">
                      <IconBookmark width={11} height={11} className="text-honey" />
                      <button onClick={() => restore(pk)} className="hover:text-pine cursor-pointer">
                        {pk.customer} · {pk.lines.length} item · {pk.time}
                      </button>
                      <button onClick={() => setParked((a) => a.filter((x) => x.key !== pk.key))} className="text-fog hover:text-clay cursor-pointer" aria-label="Hapus">
                        <IconX width={11} height={11} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
              {lines.length === 0 ? (
                <EmptyState
                  icon={<IconBasket width={20} height={20} />}
                  title="Keranjang kosong"
                  desc="Klik produk di sebelah kiri untuk menambahkan item."
                />
              ) : (
                <ul className="space-y-2.5">
                  {lines.map((l) => (
                    <li key={`${l.id}-${l.qty}`} className="row-in rounded-lg border border-line bg-paper/50 p-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-[12.5px] font-semibold">{l.p.name}</p>
                          <p className="num text-[10.5px] text-fog">{idr(l.p.price)} / item</p>
                        </div>
                        <button onClick={() => remove(l.id)} className="rounded p-1 text-fog transition hover:bg-clay-soft hover:text-clay cursor-pointer" aria-label="Hapus item">
                          <IconX width={13} height={13} />
                        </button>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center rounded-md border border-line bg-surface">
                          <button onClick={() => setQty(l.id, l.qty - 1)} disabled={l.qty <= 1} className="px-2 py-1 text-fog transition hover:text-pine disabled:opacity-30 cursor-pointer" aria-label="Kurangi">
                            <IconMinus width={12} height={12} />
                          </button>
                          <span className="num w-8 text-center text-[13px] font-bold">{l.qty}</span>
                          <button onClick={() => setQty(l.id, l.qty + 1)} className="px-2 py-1 text-fog transition hover:text-pine cursor-pointer" aria-label="Tambah">
                            <IconPlus width={12} height={12} />
                          </button>
                        </div>
                        <span className="num text-[13px] font-bold">{idr(l.p.price * l.qty)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="border-t border-line px-4 py-3.5">
              <div className="mb-3 flex items-center gap-2">
                <span className="text-[12px] font-semibold text-fog">Diskon</span>
                <div className="relative ml-auto w-24">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={discount || ""}
                    placeholder="0"
                    onChange={(e) => setDiscount(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                    className="input num py-1 pr-6 text-right text-[13px]"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[12px] font-bold text-fog">%</span>
                </div>
              </div>
              <dl className="space-y-1.5 text-[13px]">
                <div className="flex justify-between text-fog">
                  <dt>Subtotal</dt>
                  <dd className="num font-semibold text-ink">{idr(subtotal)}</dd>
                </div>
                {discountVal > 0 && (
                  <div className="flex justify-between text-clay">
                    <dt>Diskon {discount}%</dt>
                    <dd className="num font-semibold">−{idr(discountVal)}</dd>
                  </div>
                )}
                <div className="flex justify-between text-fog">
                  <dt>PPN {settings.taxRate}%</dt>
                  <dd className="num font-semibold text-ink">{idr(taxVal)}</dd>
                </div>
                <div className="mt-1 flex items-baseline justify-between border-t border-dashed border-linedark pt-2.5">
                  <dt className="font-display text-[15px] font-bold">Total</dt>
                  <dd className="num text-[21px] font-bold text-pine">{idr(total)}</dd>
                </div>
              </dl>
              <div className="mt-3.5 flex gap-2">
                <button onClick={park} disabled={!lines.length} className="btn-outline flex-1 py-2.5">
                  <IconBookmark width={15} height={15} /> Simpan
                </button>
                <button onClick={openPay} disabled={!lines.length} className="btn-primary flex-[1.5] py-2.5">
                  Bayar · {idrShort(total)}
                </button>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* ===== modal pembayaran ===== */}
      <Modal open={payOpen} onClose={() => (step === "done" ? newTransaction() : setPayOpen(false))} width="max-w-lg">
        {step === "pay" ? (
          <>
            <ModalHead title="Pembayaran" onClose={() => setPayOpen(false)} />
            <div className="p-5">
              <div className="mb-4 flex items-center justify-between rounded-lg bg-pine-deep px-4 py-3 text-[#f2efe2]">
                <div>
                  <p className="text-[10.5px] uppercase tracking-[0.16em] opacity-60">Total Tagihan</p>
                  <p className="num text-[22px] font-bold">{idr(total)}</p>
                </div>
                <p className="num text-[11.5px] opacity-70">{trxId}<br />{lines.length} item</p>
              </div>

              <div className="mb-4 grid grid-cols-3 gap-2">
                {(
                  [
                    { m: "Tunai" as Method, icon: <IconCash width={17} height={17} /> },
                    { m: "QRIS" as Method, icon: <IconQr width={17} height={17} /> },
                    { m: "Debit" as Method, icon: <IconCard width={17} height={17} /> },
                  ]
                ).map(({ m, icon }) => (
                  <button
                    key={m}
                    onClick={() => setMethod(m)}
                    className={cx(
                      "flex flex-col items-center gap-1.5 rounded-lg border py-3 text-[12.5px] font-bold transition-all cursor-pointer",
                      method === m ? "border-pine bg-pine-soft text-pine shadow-sm" : "border-line bg-surface text-fog hover:border-pine/40"
                    )}
                  >
                    {icon}
                    {m}
                  </button>
                ))}
              </div>

              {method === "Tunai" && (
                <div>
                  <label className="label">Uang Diterima</label>
                  <input
                    type="number"
                    value={cash || ""}
                    onChange={(e) => setCash(Math.max(0, Number(e.target.value) || 0))}
                    className="input num text-[16px] font-bold"
                    placeholder="0"
                  />
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {quickCash.map((q) => (
                      <button key={q} onClick={() => setCash(q)} className={cx("btn-outline px-2.5 py-1.5 text-[11.5px] num", cash === q && "border-pine! bg-pine-soft!")}>
                        {q === total ? "Uang Pas" : idrShort(q)}
                      </button>
                    ))}
                  </div>
                  <div
                    className={cx(
                      "mt-3 flex items-center justify-between rounded-lg px-3.5 py-2.5 text-[13px] font-bold",
                      change >= 0 ? "bg-pine-soft text-pine" : "bg-clay-soft text-clay"
                    )}
                  >
                    <span>{change >= 0 ? "Kembalian" : "Kurang"}</span>
                    <span className="num text-[16px]">{idr(Math.abs(change))}</span>
                  </div>
                </div>
              )}

              {method === "QRIS" && (
                <div className="flex flex-col items-center rounded-lg border border-dashed border-linedark bg-white py-4">
                  <QrSvg seed={trxId} />
                  <p className="mt-2 text-[12px] text-fog">Pelanggan dapat memindai dengan aplikasi apa pun</p>
                  <p className="num mt-1 text-[15px] font-bold text-pine">{idr(total)}</p>
                </div>
              )}

              {method === "Debit" && (
                <div className="flex items-center gap-3 rounded-lg border border-dashed border-linedark bg-white px-4 py-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-tide-soft text-tide">
                    <IconCard width={19} height={19} />
                  </span>
                  <div>
                    <p className="text-[13px] font-bold">Mesin EDC siap</p>
                    <p className="text-[12px] text-fog">Minta pelanggan memasukkan atau menempelkan kartu, lalu konfirmasi dari EDC.</p>
                  </div>
                </div>
              )}

              <button
                onClick={confirm}
                disabled={method === "Tunai" && cash < total}
                className="btn-primary mt-4 w-full py-3 text-[14.5px]"
              >
                <IconCheck width={16} height={16} />
                {method === "Tunai" ? "Selesaikan & Cetak Struk" : "Konfirmasi Pembayaran"}
              </button>
            </div>
          </>
        ) : (
          receipt && (
            <div className="p-6">
              <div className="flex flex-col items-center text-center">
                <span className="check-pop flex h-14 w-14 items-center justify-center rounded-full bg-pine text-[#f2efe2]">
                  <IconCheck width={26} height={26} />
                </span>
                <h3 className="font-display mt-3 text-xl font-bold">Pembayaran Berhasil</h3>
                <p className="text-[12.5px] text-fog">{receipt.method} · {receipt.id}</p>
                {receipt.method === "Tunai" && receipt.change > 0 && (
                  <p className="num mt-2 rounded-lg bg-honey-soft px-4 py-1.5 text-[17px] font-bold text-[#8a5f10]">
                    Kembalian {idr(receipt.change)}
                  </p>
                )}
              </div>

              {/* struk */}
              <div className="mx-auto mt-5 w-[280px] rounded-md border border-line bg-white p-4 shadow-sm">
                <div className="num text-center text-[11px] leading-relaxed">
                  <p className="text-[13px] font-bold tracking-wide">{settings.storeName.toUpperCase()}</p>
                  <p className="text-fog">{settings.address}</p>
                  <div className="my-2 border-t border-dashed border-linedark" />
                  <p className="flex justify-between"><span>{receipt.id}</span><span>{receipt.date}</span></p>
                  <p className="flex justify-between"><span>Kasir: Rani</span><span>{receipt.customer}</span></p>
                  <div className="my-2 border-t border-dashed border-linedark" />
                  {receipt.lines.map((l, i) => (
                    <div key={i} className="mb-1">
                      <p className="text-left">{l.name}</p>
                      <p className="flex justify-between text-fog">
                        <span>{l.qty} × {num(l.price)}</span>
                        <span className="font-semibold text-ink">{num(l.qty * l.price)}</span>
                      </p>
                    </div>
                  ))}
                  <div className="my-2 border-t border-dashed border-linedark" />
                  <p className="flex justify-between"><span>Subtotal</span><span>{num(receipt.subtotal)}</span></p>
                  {receipt.discount > 0 && (
                    <p className="flex justify-between"><span>Diskon</span><span>−{num(receipt.discount)}</span></p>
                  )}
                  <p className="flex justify-between"><span>PPN {settings.taxRate}%</span><span>{num(receipt.tax)}</span></p>
                  <p className="flex justify-between text-[13px] font-bold"><span>TOTAL</span><span>{num(receipt.total)}</span></p>
                  <p className="flex justify-between"><span>{receipt.method}</span><span>{num(receipt.cash)}</span></p>
                  {receipt.method === "Tunai" && (
                    <p className="flex justify-between"><span>Kembalian</span><span>{num(receipt.change)}</span></p>
                  )}
                  <div className="my-2 border-t border-dashed border-linedark" />
                  <p className="text-fog">{settings.footer}</p>
                  <p className="mt-1 font-bold">· terima kasih ·</p>
                </div>
              </div>

              <div className="mt-5 flex gap-2">
                <button className="btn-outline flex-1 py-2.5" onClick={() => push("Struk dikirim ke printer kasir.", "info")}>
                  <IconPrinter width={15} height={15} /> Cetak
                </button>
                <button className="btn-primary flex-1 py-2.5" onClick={newTransaction}>
                  Transaksi Baru
                </button>
              </div>
            </div>
          )
        )}
      </Modal>
    </div>
  );
}
