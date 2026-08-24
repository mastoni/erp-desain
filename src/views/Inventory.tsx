import { useMemo, useState } from "react";
import { CATEGORY_COLORS, type Product } from "../data";
import { cx, idr, idrShort, num } from "../lib/format";
import { Badge, Modal, ModalHead, Reveal, SectionHead } from "../components/ui";
import type { Toast } from "../components/ui";
import { IconBox, IconMinus, IconPencil, IconPlus, IconSearch, IconSwap } from "../components/icons";

type Push = (msg: string, tone?: Toast["tone"]) => void;

const statusOf = (p: Product) => (p.stock === 0 ? "habis" : p.stock <= p.minStock ? "menipis" : "normal");

export function Inventory({
  products,
  setProducts,
  push,
}: {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  push: Push;
}) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("Semua");
  const [status, setStatus] = useState("Semua");
  const [adjust, setAdjust] = useState<Product | null>(null);
  const [mode, setMode] = useState<"in" | "out">("in");
  const [qty, setQty] = useState(10);
  const [reason, setReason] = useState("Restok dari supplier");
  const [addOpen, setAddOpen] = useState(false);
  const [np, setNp] = useState({ name: "", category: "Sembako", price: "", stock: "", minStock: "10" });

  const categories = useMemo(() => ["Semua", ...Array.from(new Set(products.map((p) => p.category)))], [products]);

  const filtered = products.filter(
    (p) =>
      (cat === "Semua" || p.category === cat) &&
      (status === "Semua" || statusOf(p) === status.toLowerCase()) &&
      (p.name.toLowerCase().includes(q.toLowerCase()) || p.sku.toLowerCase().includes(q.toLowerCase()))
  );

  const invValue = products.reduce((s, p) => s + p.price * p.stock, 0);
  const low = products.filter((p) => statusOf(p) === "menipis").length;
  const out = products.filter((p) => statusOf(p) === "habis").length;

  const applyAdjust = () => {
    if (!adjust || qty <= 0) return;
    setProducts((ps) =>
      ps.map((p) => {
        if (p.id !== adjust.id) return p;
        const next = mode === "in" ? p.stock + qty : Math.max(0, p.stock - qty);
        return { ...p, stock: next };
      })
    );
    push(`Stok ${adjust.name} ${mode === "in" ? "ditambah" : "dikurangi"} ${qty} — ${reason.toLowerCase()}.`, mode === "out" ? "warn" : "success");
    setAdjust(null);
  };

  const addProduct = () => {
    const price = Number(np.price);
    const stock = Number(np.stock);
    if (!np.name.trim() || !price || stock < 0) {
      push("Lengkapi nama, harga, dan stok produk terlebih dahulu.", "warn");
      return;
    }
    const prefix = { Sembako: "SMB", Minuman: "MNM", Snack: "SNK", Perawatan: "PRW", "Rumah Tangga": "RMT" }[np.category] ?? "BRG";
    setProducts((ps) => [
      ...ps,
      {
        id: `p${Date.now()}`,
        sku: `${prefix}-${String(ps.length + 1).padStart(2, "0")}`,
        name: np.name.trim(),
        category: np.category,
        price,
        cost: Math.round(price * 0.78),
        stock,
        minStock: Number(np.minStock) || 5,
        sold: 0,
      },
    ]);
    push(`Produk "${np.name}" ditambahkan ke inventaris.`, "success");
    setAddOpen(false);
    setNp({ name: "", category: "Sembako", price: "", stock: "", minStock: "10" });
  };

  const stats = [
    { label: "Total SKU", value: num(products.length), tone: "text-ink" },
    { label: "Nilai Stok", value: idrShort(invValue), tone: "text-pine" },
    { label: "Stok Menipis", value: num(low), tone: "text-[#8a5f10]" },
    { label: "Stok Habis", value: num(out), tone: "text-clay" },
  ];

  return (
    <div>
      <SectionHead
        title="Inventaris"
        desc="Kelola stok, harga, dan pergerakan barang di gudang toko."
        action={
          <button className="btn-primary px-4 py-2" onClick={() => setAddOpen(true)}>
            <IconPlus width={15} height={15} /> Tambah Produk
          </button>
        }
      />

      {/* ringkasan */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s, i) => (
          <Reveal key={s.label} delay={i * 60}>
            <div className="card card-hover px-4 py-3.5">
              <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-fog">{s.label}</p>
              <p className={cx("num mt-1 text-xl font-bold", s.tone)}>{s.value}</p>
            </div>
          </Reveal>
        ))}
      </div>

      {/* toolbar */}
      <Reveal delay={100}>
        <div className="card mt-4 flex flex-wrap items-center gap-2.5 p-3.5">
          <div className="relative min-w-[200px] flex-1">
            <IconSearch width={14} height={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fog" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama atau SKU…" className="input pl-8.5" />
          </div>
          <select value={cat} onChange={(e) => setCat(e.target.value)} className="input w-auto py-2 text-[13px]">
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="input w-auto py-2 text-[13px]">
            {["Semua", "Normal", "Menipis", "Habis"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <span className="num ml-auto text-[12px] font-semibold text-fog">{filtered.length} item</span>
        </div>
      </Reveal>

      {/* tabel */}
      <Reveal delay={160}>
        <div className="card mt-4 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="bg-paper/60">
                  <th className="th">SKU</th>
                  <th className="th">Produk</th>
                  <th className="th">Kategori</th>
                  <th className="th text-right">Harga</th>
                  <th className="th text-center">Stok / Min</th>
                  <th className="th">Status</th>
                  <th className="th text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const st = statusOf(p);
                  return (
                    <tr key={p.id} className="transition-colors hover:bg-paper/60">
                      <td className="td num text-[12px] font-semibold text-fog">{p.sku}</td>
                      <td className="td">
                        <div className="flex items-center gap-2.5">
                          <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: CATEGORY_COLORS[p.category] }} />
                          <div>
                            <p className="font-semibold leading-tight">{p.name}</p>
                            <p className="num text-[10.5px] text-fog">terjual {num(p.sold)}×</p>
                          </div>
                        </div>
                      </td>
                      <td className="td text-[13px] text-fog">{p.category}</td>
                      <td className="td num text-right font-semibold">{idr(p.price)}</td>
                      <td className="td num text-center">
                        <span className={cx("font-bold", st === "habis" ? "text-clay" : st === "menipis" ? "text-[#8a5f10]" : "text-ink")}>{p.stock}</span>
                        <span className="text-fog"> / {p.minStock}</span>
                      </td>
                      <td className="td">
                        <Badge tone={st === "normal" ? "pine" : st === "menipis" ? "honey" : "clay"}>
                          {st === "normal" ? "Normal" : st === "menipis" ? "Menipis" : "Habis"}
                        </Badge>
                      </td>
                      <td className="td text-right">
                        <button onClick={() => { setAdjust(p); setQty(10); setMode("in"); }} className="btn-outline px-3 py-1.5 text-[12px]">
                          <IconSwap width={13} height={13} /> Atur Stok
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <p className="px-5 py-8 text-center text-sm text-fog">Tidak ada produk yang cocok dengan filter.</p>
          )}
        </div>
      </Reveal>

      {/* modal atur stok */}
      <Modal open={!!adjust} onClose={() => setAdjust(null)}>
        {adjust && (
          <>
            <ModalHead title="Atur Stok" onClose={() => setAdjust(null)} />
            <div className="p-5">
              <div className="mb-4 flex items-center gap-3 rounded-lg bg-paper px-3.5 py-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-pine-soft text-pine">
                  <IconBox width={17} height={17} />
                </span>
                <div>
                  <p className="text-[13.5px] font-bold leading-tight">{adjust.name}</p>
                  <p className="num text-[11px] text-fog">{adjust.sku} · stok saat ini {adjust.stock}</p>
                </div>
              </div>

              <div className="mb-3 grid grid-cols-2 gap-2">
                <button
                  onClick={() => setMode("in")}
                  className={cx(
                    "flex items-center justify-center gap-2 rounded-lg border py-2.5 text-[13px] font-bold transition-all cursor-pointer",
                    mode === "in" ? "border-pine bg-pine-soft text-pine" : "border-line text-fog hover:border-pine/40"
                  )}
                >
                  <IconPlus width={14} height={14} /> Barang Masuk
                </button>
                <button
                  onClick={() => setMode("out")}
                  className={cx(
                    "flex items-center justify-center gap-2 rounded-lg border py-2.5 text-[13px] font-bold transition-all cursor-pointer",
                    mode === "out" ? "border-clay bg-clay-soft text-clay" : "border-line text-fog hover:border-clay/40"
                  )}
                >
                  <IconMinus width={14} height={14} /> Barang Keluar
                </button>
              </div>

              <label className="label">Jumlah</label>
              <input type="number" min={1} value={qty || ""} onChange={(e) => setQty(Math.max(0, Number(e.target.value) || 0))} className="input num mb-3 text-[15px] font-bold" />

              <label className="label">Alasan</label>
              <select value={reason} onChange={(e) => setReason(e.target.value)} className="input mb-4">
                {mode === "in"
                  ? ["Restok dari supplier", "Retur pelanggan", "Opname — selisih lebih"].map((r) => <option key={r}>{r}</option>)
                  : ["Rusak / kedaluwarsa", "Dipakai internal", "Opname — selisih kurang"].map((r) => <option key={r}>{r}</option>)}
              </select>

              <p className="num mb-4 rounded-lg bg-paper px-3.5 py-2.5 text-[12.5px] font-semibold">
                Stok baru: <span className={cx("font-bold", mode === "in" ? "text-pine" : "text-clay")}>
                  {mode === "in" ? adjust.stock + qty : Math.max(0, adjust.stock - qty)}
                </span>
              </p>

              <div className="flex gap-2">
                <button className="btn-outline flex-1 py-2.5" onClick={() => setAdjust(null)}>Batal</button>
                <button className="btn-primary flex-1 py-2.5" onClick={applyAdjust} disabled={qty <= 0}>Simpan Stok</button>
              </div>
            </div>
          </>
        )}
      </Modal>

      {/* modal tambah produk */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)}>
        <>
          <ModalHead title="Tambah Produk Baru" onClose={() => setAddOpen(false)} />
          <div className="p-5">
            <label className="label">Nama Produk</label>
            <input value={np.name} onChange={(e) => setNp({ ...np, name: e.target.value })} placeholder="cth: Kopi Bubuk 200 g" className="input mb-3" />
            <div className="mb-3 grid grid-cols-2 gap-3">
              <div>
                <label className="label">Kategori</label>
                <select value={np.category} onChange={(e) => setNp({ ...np, category: e.target.value })} className="input">
                  {["Sembako", "Minuman", "Snack", "Perawatan", "Rumah Tangga"].map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Harga (Rp)</label>
                <input type="number" value={np.price} onChange={(e) => setNp({ ...np, price: e.target.value })} placeholder="15000" className="input num" />
              </div>
            </div>
            <div className="mb-4 grid grid-cols-2 gap-3">
              <div>
                <label className="label">Stok Awal</label>
                <input type="number" value={np.stock} onChange={(e) => setNp({ ...np, stock: e.target.value })} placeholder="24" className="input num" />
              </div>
              <div>
                <label className="label">Batas Minimum</label>
                <input type="number" value={np.minStock} onChange={(e) => setNp({ ...np, minStock: e.target.value })} className="input num" />
              </div>
            </div>
            <div className="flex gap-2">
              <button className="btn-outline flex-1 py-2.5" onClick={() => setAddOpen(false)}>Batal</button>
              <button className="btn-primary flex-1 py-2.5" onClick={addProduct}>
                <IconPencil width={14} height={14} /> Simpan Produk
              </button>
            </div>
          </div>
        </>
      </Modal>
    </div>
  );
}
