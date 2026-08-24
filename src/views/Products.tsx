import { useMemo, useState } from "react";
import { CATEGORY_COLORS, type Product, type StoreConfig } from "../data";
import { cx, idr, idrShort, num } from "../lib/format";
import { Barcode } from "../components/charts";
import { Badge, Modal, ModalHead, Reveal, SectionHead } from "../components/ui";
import type { Toast } from "../components/ui";
import { IconBarcode, IconPencil, IconPlus, IconPrinter, IconSearch, IconTag, IconTrash, IconX } from "../components/icons";

type Push = (msg: string, tone?: Toast["tone"]) => void;

const PREFIX: Record<string, string> = { Sembako: "SMB", Minuman: "MNM", Snack: "SNK", Perawatan: "PRW", "Rumah Tangga": "RMT" };
const CATS = ["Sembako", "Minuman", "Snack", "Perawatan", "Rumah Tangga"];

type Form = {
  id: string | null;
  name: string;
  category: string;
  price: string;
  cost: string;
  stock: string;
  minStock: string;
  sku: string;
};

const emptyForm = (sku: string): Form => ({
  id: null,
  name: "",
  category: "Sembako",
  price: "",
  cost: "",
  stock: "0",
  minStock: "10",
  sku,
});

export function Products({
  products,
  setProducts,
  config,
  push,
}: {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  config: StoreConfig;
  push: Push;
}) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("Semua");
  const [sort, setSort] = useState("nama");
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [form, setForm] = useState<Form>(emptyForm("SMB-27"));
  const [formErr, setFormErr] = useState<string | null>(null);
  const [delTarget, setDelTarget] = useState<Product | null>(null);
  const [labelFor, setLabelFor] = useState<Product | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  const categories = useMemo(() => ["Semua", ...CATS], []);

  const nextSku = (category: string) => {
    const prefix = PREFIX[category] ?? "BRG";
    const count = products.filter((p) => p.category === category).length;
    return `${prefix}-${String(count + 1).padStart(2, "0")}`;
  };

  const filtered = useMemo(() => {
    const f = products.filter(
      (p) =>
        (cat === "Semua" || p.category === cat) &&
        (p.name.toLowerCase().includes(q.toLowerCase()) || p.sku.toLowerCase().includes(q.toLowerCase()))
    );
    const by: Record<string, (a: Product, b: Product) => number> = {
      nama: (a, b) => a.name.localeCompare(b.name),
      "harga-asc": (a, b) => a.price - b.price,
      "harga-desc": (a, b) => b.price - a.price,
      margin: (a, b) => (b.price - b.cost) / b.price - (a.price - a.cost) / a.price,
      stok: (a, b) => a.stock / a.minStock - b.stock / b.minStock,
    };
    return [...f].sort(by[sort] ?? by.nama);
  }, [products, q, cat, sort]);

  const invValue = products.reduce((s, p) => s + p.price * p.stock, 0);
  const avgMargin = products.reduce((s, p) => s + (p.price - p.cost) / p.price, 0) / (products.length || 1);

  const openAdd = () => {
    setForm(emptyForm(nextSku("Sembako")));
    setFormErr(null);
    setModal("add");
  };

  const openEdit = (p: Product) => {
    setForm({
      id: p.id,
      name: p.name,
      category: p.category,
      price: String(p.price),
      cost: String(p.cost),
      stock: String(p.stock),
      minStock: String(p.minStock),
      sku: p.sku,
    });
    setFormErr(null);
    setModal("edit");
  };

  const saveForm = () => {
    const price = Number(form.price);
    const cost = Number(form.cost) || Math.round(price * 0.78);
    if (!form.name.trim()) return setFormErr("Nama produk wajib diisi.");
    if (!price || price <= 0) return setFormErr("Harga jual harus lebih dari 0.");
    if (cost > price) return setFormErr("HPP tidak boleh melebihi harga jual.");

    if (modal === "add") {
      const skuExists = products.some((p) => p.sku === form.sku);
      const sku = skuExists ? nextSku(form.category) : form.sku;
      const id = `p${Date.now()}`;
      setProducts((ps) => [
        ...ps,
        {
          id,
          sku,
          name: form.name.trim(),
          category: form.category,
          price,
          cost,
          stock: Math.max(0, Number(form.stock) || 0),
          minStock: Math.max(0, Number(form.minStock) || 5),
          sold: 0,
        },
      ]);
      setSavedId(id);
      push(`Produk "${form.name}" berhasil ditambahkan.`, "success");
    } else if (form.id) {
      setProducts((ps) =>
        ps.map((p) =>
          p.id === form.id
            ? {
                ...p,
                name: form.name.trim(),
                category: form.category,
                price,
                cost,
                sku: form.sku || p.sku,
                stock: Math.max(0, Number(form.stock) || 0),
                minStock: Math.max(0, Number(form.minStock) || 5),
              }
            : p
        )
      );
      setSavedId(form.id);
      push(`Produk "${form.name}" berhasil diperbarui.`, "success");
    }
    window.setTimeout(() => setSavedId(null), 900);
    setModal(null);
  };

  const doDelete = () => {
    if (!delTarget) return;
    setProducts((ps) => ps.filter((p) => p.id !== delTarget.id));
    push(`Produk "${delTarget.name}" dihapus dari katalog.`, "warn");
    setDelTarget(null);
  };

  const stats = [
    { label: "Total SKU", value: num(products.length), cls: "text-ink" },
    { label: "Nilai Stok (Harga Jual)", value: idrShort(invValue), cls: "text-pine" },
    { label: "Margin Rata-rata", value: `${(avgMargin * 100).toLocaleString("id-ID", { maximumFractionDigits: 1 })}%`, cls: "text-[#8a5f10]" },
    { label: "Kategori", value: num(CATS.length), cls: "text-tide" },
  ];

  const labelW = config.barcode.labelSize === "kecil" ? "w-[220px]" : "w-[260px]";

  return (
    <div>
      <SectionHead
        title="Katalog Produk"
        desc="Tambah, ubah, dan hapus produk — perubahan langsung berlaku di kasir dan laporan."
        action={
          <button className="btn-primary px-4 py-2" onClick={openAdd}>
            <IconPlus width={15} height={15} /> Tambah Produk
          </button>
        }
      />

      {/* statistik */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s, i) => (
          <Reveal key={s.label} delay={i * 60}>
            <div className="card card-hover px-4 py-3.5">
              <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-fog">{s.label}</p>
              <p className={cx("num mt-1 text-xl font-bold", s.cls)}>{s.value}</p>
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
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="input w-auto py-2 text-[13px]">
            <option value="nama">Urutkan: Nama A–Z</option>
            <option value="harga-asc">Harga Terendah</option>
            <option value="harga-desc">Harga Tertinggi</option>
            <option value="margin">Margin Tertinggi</option>
            <option value="stok">Stok Paling Kritis</option>
          </select>
          <span className="num text-[12px] font-semibold text-fog">{filtered.length} produk</span>
        </div>
      </Reveal>

      {/* chips kategori */}
      <div className="mt-3.5 flex flex-wrap gap-1.5">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={cx(
              "flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[12.5px] font-semibold transition-all cursor-pointer",
              cat === c ? "border-pine bg-pine text-[#f2efe2] shadow-sm" : "border-line bg-surface text-fog hover:border-pine/40 hover:text-ink"
            )}
          >
            {c !== "Semua" && <span className="h-1.5 w-1.5 rounded-full" style={{ background: cat === c ? "#f2d9a0" : CATEGORY_COLORS[c] }} />}
            {c}
          </button>
        ))}
      </div>

      {/* grid produk */}
      <div className="mt-4 grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {filtered.map((p, i) => {
          const margin = Math.round(((p.price - p.cost) / p.price) * 100);
          const low = p.stock <= p.minStock;
          return (
            <Reveal key={p.id} delay={Math.min(i, 8) * 45}>
              <div
                className={cx(
                  "card card-hover group relative flex h-full flex-col overflow-hidden p-4",
                  savedId === p.id && "pop border-pine/70"
                )}
              >
                <span className="absolute inset-y-0 left-0 w-1" style={{ background: CATEGORY_COLORS[p.category] }} />
                <div className="flex items-start justify-between gap-2 pl-2">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.1em]" style={{ color: CATEGORY_COLORS[p.category] }}>
                      {p.category}
                    </p>
                    <h3 className="mt-0.5 truncate text-[14.5px] font-bold leading-snug">{p.name}</h3>
                  </div>
                  {p.stock === 0 ? (
                    <Badge tone="clay">Habis</Badge>
                  ) : low ? (
                    <Badge tone="honey">Stok {p.stock}</Badge>
                  ) : (
                    <Badge tone="pine">Stok {p.stock}</Badge>
                  )}
                </div>

                <div className="mt-3 pl-2">
                  <Barcode value={`${config.barcode.prefix}${p.sku}`} className="h-7 w-full fill-ink/85" />
                  <p className="num mt-1 text-[10px] tracking-[0.14em] text-fog">
                    {config.barcode.prefix}
                    {p.sku} · {p.sku}
                  </p>
                </div>

                <div className="mt-auto flex items-end justify-between gap-2 pt-3 pl-2">
                  <div>
                    <p className="num text-[17px] font-bold leading-none">{idr(p.price)}</p>
                    <p className="num mt-1 text-[10.5px] text-fog">HPP {idr(p.cost)}</p>
                  </div>
                  <span className="num rounded-md bg-pine-soft px-1.5 py-1 text-[10.5px] font-bold text-pine">margin {margin}%</span>
                </div>

                {/* aksi */}
                <div className="mt-3 flex gap-1.5 border-t border-dashed border-line pt-3 pl-2 opacity-100 transition-opacity lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100">
                  <button
                    onClick={() => setLabelFor(p)}
                    className="btn-outline flex-1 py-1.5 text-[11.5px]"
                    title="Cetak label barcode"
                  >
                    <IconBarcode width={13} height={13} /> Label
                  </button>
                  <button onClick={() => openEdit(p)} className="btn-outline flex-1 py-1.5 text-[11.5px]" title="Ubah produk">
                    <IconPencil width={13} height={13} /> Ubah
                  </button>
                  <button
                    onClick={() => setDelTarget(p)}
                    className="btn-outline py-1.5 px-2.5 text-clay hover:border-clay/50 hover:bg-clay-soft/60"
                    title="Hapus produk"
                  >
                    <IconTrash width={13} height={13} />
                  </button>
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>
      {filtered.length === 0 && (
        <div className="card mt-4 px-5 py-10 text-center">
          <IconTag width={24} height={24} className="mx-auto mb-2 text-fog" />
          <p className="font-display font-semibold">Tidak ada produk ditemukan</p>
          <p className="mt-1 text-xs text-fog">Ubah kata kunci pencarian atau tambahkan produk baru.</p>
        </div>
      )}

      {/* ===== modal tambah / ubah ===== */}
      <Modal open={modal !== null} onClose={() => setModal(null)} width="max-w-lg">
        <ModalHead title={modal === "add" ? "Tambah Produk" : "Ubah Produk"} onClose={() => setModal(null)} />
        <div className="p-5">
          <label className="label">Nama Produk</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="cth: Kopi Bubuk Robusta 200 g"
            className="input mb-3"
          />
          <div className="mb-3 grid grid-cols-2 gap-3">
            <div>
              <label className="label">Kategori</label>
              <select
                value={form.category}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    category: e.target.value,
                    sku: f.id ? f.sku : nextSku(e.target.value),
                  }))
                }
                className="input"
              >
                {CATS.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">SKU</label>
              <input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="input num" />
            </div>
          </div>
          <div className="mb-3 grid grid-cols-2 gap-3">
            <div>
              <label className="label">Harga Jual (Rp)</label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="15000"
                className="input num"
              />
            </div>
            <div>
              <label className="label">HPP / Modal (Rp)</label>
              <input
                type="number"
                value={form.cost}
                onChange={(e) => setForm({ ...form, cost: e.target.value })}
                placeholder="kosong = 78% harga"
                className="input num"
              />
            </div>
          </div>
          <div className="mb-3 grid grid-cols-2 gap-3">
            <div>
              <label className="label">Stok Awal</label>
              <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="input num" />
            </div>
            <div>
              <label className="label">Batas Stok Minimum</label>
              <input type="number" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value })} className="input num" />
            </div>
          </div>

          {/* pratinjau label */}
          <div className="mb-4 flex items-center gap-3 rounded-lg border border-dashed border-linedark bg-white px-3.5 py-3">
            <IconBarcode width={18} height={18} className="shrink-0 text-fog" />
            <div className="min-w-0 flex-1">
              <Barcode value={`${config.barcode.prefix}${form.sku || "SKU-00"}`} className="h-5 w-full fill-ink/85" />
            </div>
            <span className="num shrink-0 text-[10.5px] font-bold text-fog">
              {config.barcode.prefix}
              {form.sku || "SKU-00"}
            </span>
          </div>

          {formErr && <p className="mb-3 rounded-md bg-clay-soft px-3 py-2 text-[12px] font-semibold text-clay">{formErr}</p>}

          <div className="flex gap-2">
            <button className="btn-outline flex-1 py-2.5" onClick={() => setModal(null)}>
              Batal
            </button>
            <button className="btn-primary flex-1 py-2.5" onClick={saveForm}>
              <IconPlus width={15} height={15} /> {modal === "add" ? "Simpan Produk" : "Simpan Perubahan"}
            </button>
          </div>
        </div>
      </Modal>

      {/* ===== modal hapus ===== */}
      <Modal open={!!delTarget} onClose={() => setDelTarget(null)}>
        {delTarget && (
          <>
            <ModalHead title="Hapus Produk" onClose={() => setDelTarget(null)} />
            <div className="p-5">
              <div className="flex items-start gap-3 rounded-lg border border-clay/30 bg-clay-soft/50 px-4 py-3.5">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-clay text-white">
                  <IconX width={15} height={15} />
                </span>
                <div>
                  <p className="text-[13.5px] font-bold leading-snug">
                    Hapus "{delTarget.name}"?
                  </p>
                  <p className="mt-1 text-[12px] text-fog">
                    Produk {delTarget.sku} akan hilang dari kasir, inventaris, dan laporan. Riwayat penjualan yang sudah tercatat tetap aman.
                  </p>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button className="btn-outline flex-1 py-2.5" onClick={() => setDelTarget(null)}>
                  Batal
                </button>
                <button
                  className="btn flex-1 bg-clay py-2.5 text-white hover:brightness-105 active:scale-[0.98] shadow-[0_2px_0_rgba(120,40,20,0.4)]"
                  onClick={doDelete}
                >
                  <IconTrash width={15} height={15} /> Ya, Hapus
                </button>
              </div>
            </div>
          </>
        )}
      </Modal>

      {/* ===== modal label ===== */}
      <Modal open={!!labelFor} onClose={() => setLabelFor(null)}>
        {labelFor && (
          <>
            <ModalHead title="Label Barcode" onClose={() => setLabelFor(null)} />
            <div className="flex flex-col items-center p-5">
              <div className={cx("rounded-md border-[1.5px] border-ink/70 bg-white p-3.5 text-center shadow-sm", labelW)}>
                <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-fog">{config.storeName}</p>
                <p className="mt-1.5 min-h-[34px] text-[12.5px] font-bold leading-snug">{labelFor.name}</p>
                <Barcode value={`${config.barcode.prefix}${labelFor.sku}`} className="mx-auto mt-2 h-11 w-[85%] fill-ink" />
                <p className="num mt-1 text-[10.5px] tracking-[0.18em]">
                  {config.barcode.prefix}
                  {labelFor.sku}
                </p>
                {config.barcode.showPrice && (
                  <p className="num mt-2 rounded border border-ink/60 px-2 py-0.5 text-[15px] font-bold">{idr(labelFor.price)}</p>
                )}
                <p className="mt-1.5 text-[8.5px] text-fog">
                  {config.barcode.format} · ukuran {config.barcode.labelSize}
                </p>
              </div>
              <p className="mt-3 text-[11px] text-fog">
                Mengikuti pengaturan <span className="font-semibold text-ink">Barcode &amp; Label</span> di Pengaturan Toko.
              </p>
              <div className="mt-4 flex w-full gap-2">
                <button className="btn-outline flex-1 py-2.5" onClick={() => setLabelFor(null)}>
                  Tutup
                </button>
                <button
                  className="btn-primary flex-1 py-2.5"
                  onClick={() => {
                    push(`1 label "${labelFor.name}" dikirim ke printer label.`, "info");
                    setLabelFor(null);
                  }}
                >
                  <IconPrinter width={15} height={15} /> Cetak Label
                </button>
              </div>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
