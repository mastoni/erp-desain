import { Fragment, useState, type ReactNode } from "react";
import { poTotal, type PurchaseOrder, type Supplier } from "../data";
import { cx, idr, idrShort, num } from "../lib/format";
import { Badge, Modal, ModalHead, Reveal, SectionHead } from "../components/ui";
import type { Toast } from "../components/ui";
import { IconBuilding, IconChevronDown, IconPlus, IconSearch, IconStar, IconTruck } from "../components/icons";

type Push = (msg: string, tone?: Toast["tone"]) => void;

const PO_BADGE: Record<PurchaseOrder["status"], { label: string; tone: "fog" | "tide" | "pine" | "clay" }> = {
  draft: { label: "Draft", tone: "fog" },
  dikirim: { label: "Dikirim", tone: "tide" },
  diterima: { label: "Diterima", tone: "pine" },
  dibatalkan: { label: "Dibatalkan", tone: "clay" },
};

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <IconStar
          key={i}
          width={13}
          height={13}
          className={i <= Math.round(rating) ? "text-honey fill-honey" : "text-line fill-transparent"}
          strokeWidth={1.6}
        />
      ))}
      <span className="num ml-1 text-[11.5px] font-bold text-fog">{rating.toLocaleString("id-ID")}</span>
    </span>
  );
}

export function Suppliers({
  suppliers,
  setSuppliers,
  purchaseOrders,
  payables,
  push,
}: {
  suppliers: Supplier[];
  setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>;
  purchaseOrders: PurchaseOrder[];
  payables: { id: string; party: string; amount: number; status: string }[];
  push: Push;
}) {
  const [q, setQ] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [nf, setNf] = useState({ name: "", contact: "", phone: "", email: "", category: "Sembako", term: "Tempo 14" as Supplier["term"] });

  const filtered = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(q.toLowerCase()) ||
      s.category.toLowerCase().includes(q.toLowerCase()) ||
      s.code.toLowerCase().includes(q.toLowerCase())
  );

  const totalHutang = payables.filter((p) => p.status !== "lunas").reduce((s, p) => s + p.amount, 0);
  const poThisMonth = purchaseOrders.filter((po) => po.status !== "dibatalkan").length;
  const avgRating = suppliers.filter((s) => s.status === "aktif").reduce((s, x) => s + x.rating, 0) / Math.max(1, suppliers.filter((s) => s.status === "aktif").length);

  const addSupplier = () => {
    if (!nf.name.trim()) {
      push("Nama supplier wajib diisi.", "warn");
      return;
    }
    const code = nf.name
      .replace(/[^A-Za-z ]/g, "")
      .split(" ")
      .filter(Boolean)
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 3);
    setSuppliers((l) => [
      ...l,
      {
        id: `SUP-${String(l.length + 1).padStart(2, "0")}`,
        code,
        name: nf.name.trim(),
        contact: nf.contact.trim() || "—",
        phone: nf.phone.trim() || "—",
        email: nf.email.trim() || "—",
        category: nf.category,
        term: nf.term,
        rating: 0,
        balance: 0,
        lastOrder: "Belum ada",
        status: "aktif",
      },
    ]);
    push(`Supplier "${nf.name}" terdaftar dengan termin ${nf.term}.`, "success");
    setOpen(false);
    setNf({ name: "", contact: "", phone: "", email: "", category: "Sembako", term: "Tempo 14" });
  };

  const stats = [
    { label: "Supplier Aktif", value: num(suppliers.filter((s) => s.status === "aktif").length), cls: "text-ink", sub: `${suppliers.length} total terdaftar` },
    { label: "Hutang Supplier", value: idrShort(totalHutang), cls: "text-clay", sub: "belum dilunasi" },
    { label: "PO Bulan Ini", value: num(poThisMonth), cls: "text-tide", sub: "semua status" },
    { label: "Rating Rata-rata", value: avgRating.toLocaleString("id-ID", { maximumFractionDigits: 1 }), cls: "text-[#8a5f10]", sub: "dari penilaian pengiriman" },
  ];

  return (
    <div>
      <SectionHead
        title="Supplier"
        desc="Mitra pemasok barang, termin pembayaran, dan riwayat kerja sama."
        action={
          <button className="btn-primary px-4 py-2" onClick={() => setOpen(true)}>
            <IconPlus width={15} height={15} /> Tambah Supplier
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s, i) => (
          <Reveal key={s.label} delay={i * 60}>
            <div className="card card-hover px-4 py-3.5">
              <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-fog">{s.label}</p>
              <p className={cx("num mt-1 text-xl font-bold", s.cls)}>{s.value}</p>
              <p className="text-[11px] text-fog">{s.sub}</p>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal delay={120}>
        <div className="card mt-4 flex items-center gap-3 p-3.5">
          <div className="relative flex-1">
            <IconSearch width={14} height={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fog" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama, kode, atau kategori…" className="input pl-9" />
          </div>
          <span className="num text-[12px] font-semibold text-fog">{filtered.length} supplier</span>
        </div>
      </Reveal>

      <Reveal delay={180}>
        <div className="card mt-4 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px]">
              <thead>
                <tr className="bg-paper/60">
                  <th className="th w-8"></th>
                  <th className="th">Supplier</th>
                  <th className="th">Kategori</th>
                  <th className="th">Kontak</th>
                  <th className="th">Termin</th>
                  <th className="th">Rating</th>
                  <th className="th text-right">Hutang Berjalan</th>
                  <th className="th">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => {
                  const open2 = expanded === s.id;
                  const supHutang = payables.filter((p) => p.party === s.name && p.status !== "lunas").reduce((a, b) => a + b.amount, 0) || s.balance;
                  const supPOs = purchaseOrders.filter((po) => po.supplierId === s.id);
                  return (
                    <Fragment key={s.id}>
                      <tr
                        onClick={() => setExpanded(open2 ? null : s.id)}
                        className={cx("cursor-pointer transition-colors hover:bg-paper/60", open2 && "bg-paper/60", s.status === "nonaktif" && "opacity-60")}
                      >
                        <td className="td pl-4">
                          <IconChevronDown width={14} height={14} className={cx("text-fog transition-transform duration-200", open2 && "rotate-180 text-pine")} />
                        </td>
                        <td className="td">
                          <div className="flex items-center gap-3">
                            <span className="num flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-pine-deep text-[11px] font-bold text-honey">
                              {s.code}
                            </span>
                            <div>
                              <p className="font-semibold leading-tight">{s.name}</p>
                              <p className="num text-[10.5px] text-fog">{s.id} · order terakhir {s.lastOrder}</p>
                            </div>
                          </div>
                        </td>
                        <td className="td"><Badge tone="fog">{s.category}</Badge></td>
                        <td className="td">
                          <p className="text-[12.5px] font-semibold leading-tight">{s.contact}</p>
                          <p className="num text-[10.5px] text-fog">{s.phone}</p>
                        </td>
                        <td className="td"><Badge tone={s.term === "Tunai" ? "pine" : "tide"}>{s.term}</Badge></td>
                        <td className="td">{s.rating > 0 ? <Stars rating={s.rating} /> : <span className="text-[11px] text-fog">Belum ada</span>}</td>
                        <td className={cx("td num text-right font-bold", supHutang > 0 ? "text-clay" : "text-fog")}>
                          {supHutang > 0 ? idr(supHutang) : "—"}
                        </td>
                        <td className="td"><Badge tone={s.status === "aktif" ? "pine" : "fog"}>{s.status === "aktif" ? "Aktif" : "Nonaktif"}</Badge></td>
                      </tr>
                      {open2 && (
                        <tr className="bg-paper/40">
                          <td colSpan={8} className="px-6 pb-5 pt-1">
                            <div className="row-in grid gap-4 md:grid-cols-[1fr_260px]">
                              <div className="rounded-lg border border-line bg-surface">
                                <p className="flex items-center gap-2 border-b border-line px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-fog">
                                  <IconTruck width={13} height={13} /> Riwayat Purchase Order ({supPOs.length})
                                </p>
                                {supPOs.length === 0 ? (
                                  <p className="px-4 py-5 text-center text-[12.5px] text-fog">Belum pernah ada pesanan ke supplier ini.</p>
                                ) : (
                                  <ul>
                                    {supPOs.map((po) => (
                                      <li key={po.id} className="flex items-center justify-between gap-3 border-b border-line/60 px-4 py-2.5 text-[13px] last:border-0">
                                        <span className="num font-bold">{po.id}</span>
                                        <span className="min-w-0 flex-1 truncate text-fog">{po.items.map((i) => i.name).join(", ")}</span>
                                        <span className="num font-semibold">{idr(poTotal(po))}</span>
                                        <Badge tone={PO_BADGE[po.status].tone}>{PO_BADGE[po.status].label}</Badge>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                              <div className="space-y-2.5">
                                <div className="rounded-lg border border-line bg-surface px-3.5 py-3">
                                  <p className="mb-1 text-[10.5px] font-bold uppercase tracking-wider text-fog">Email Order</p>
                                  <p className="num text-[12.5px] font-semibold break-all">{s.email}</p>
                                </div>
                                <div className="rounded-lg border border-line bg-surface px-3.5 py-3">
                                  <p className="mb-1 text-[10.5px] font-bold uppercase tracking-wider text-fog">Termin Pembayaran</p>
                                  <p className="text-[12.5px] font-semibold">
                                    {s.term === "Tunai" ? "Bayar saat barang datang" : `Pembayaran ${s.term.replace("Tempo ", "")} hari setelah terima barang`}
                                  </p>
                                </div>
                                <button
                                  onClick={() => {
                                    setSuppliers((l) => l.map((x) => (x.id === s.id ? { ...x, status: x.status === "aktif" ? "nonaktif" : "aktif" } : x)));
                                    push(`${s.name} ${s.status === "aktif" ? "dinonaktifkan" : "diaktifkan kembali"}.`, "info");
                                  }}
                                  className="btn-outline w-full py-2 text-[12.5px]"
                                >
                                  {s.status === "aktif" ? "Nonaktifkan Supplier" : "Aktifkan Kembali"}
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="px-5 py-10 text-center">
              <IconBuilding width={22} height={22} className="mx-auto mb-2 text-fog" />
              <p className="text-sm font-semibold">Supplier tidak ditemukan</p>
            </div>
          )}
        </div>
      </Reveal>

      <Modal open={open} onClose={() => setOpen(false)}>
        <>
          <ModalHead title="Tambah Supplier" onClose={() => setOpen(false)} />
          <div className="p-5">
            <label className="label">Nama Perusahaan</label>
            <input value={nf.name} onChange={(e) => setNf({ ...nf, name: e.target.value })} placeholder="cth: UD Sumber Rejeki" className="input mb-3" />
            <div className="mb-3 grid grid-cols-2 gap-3">
              <div>
                <label className="label">Nama Kontak</label>
                <input value={nf.contact} onChange={(e) => setNf({ ...nf, contact: e.target.value })} placeholder="cth: Pak Budi" className="input" />
              </div>
              <div>
                <label className="label">Telepon</label>
                <input value={nf.phone} onChange={(e) => setNf({ ...nf, phone: e.target.value })} placeholder="08xx-xxxx-xxxx" className="input" />
              </div>
            </div>
            <label className="label">Email Order</label>
            <input value={nf.email} onChange={(e) => setNf({ ...nf, email: e.target.value })} placeholder="order@supplier.id" className="input mb-3" />
            <div className="mb-4 grid grid-cols-2 gap-3">
              <div>
                <label className="label">Kategori Pasokan</label>
                <select value={nf.category} onChange={(e) => setNf({ ...nf, category: e.target.value })} className="input">
                  {["Sembako", "Sembako Segar", "Minuman", "Snack", "Bakery", "Perawatan", "Rumah Tangga"].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Termin Pembayaran</label>
                <select value={nf.term} onChange={(e) => setNf({ ...nf, term: e.target.value as Supplier["term"] })} className="input">
                  {["Tunai", "Tempo 14", "Tempo 30"].map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="btn-outline flex-1 py-2.5" onClick={() => setOpen(false)}>Batal</button>
              <button className="btn-primary flex-1 py-2.5" onClick={addSupplier}>Daftarkan</button>
            </div>
          </div>
        </>
      </Modal>
    </div>
  );
}


