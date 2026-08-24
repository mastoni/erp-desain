import { useState } from "react";
import { Fragment } from "react";
import { poTotal, type Debt, type LedgerEntry, type Product, type PurchaseOrder, type Supplier } from "../data";
import { cx, idr, idrShort, num } from "../lib/format";
import { Badge, EmptyState, Modal, ModalHead, Reveal, SectionHead } from "../components/ui";
import type { Toast } from "../components/ui";
import { IconCheck, IconChevronDown, IconPlus, IconPrinter, IconSearch, IconTruck, IconX } from "../components/icons";

type Push = (msg: string, tone?: Toast["tone"]) => void;

const STATUS_META: Record<PurchaseOrder["status"], { label: string; tone: "fog" | "tide" | "pine" | "clay" }> = {
  draft: { label: "Draft", tone: "fog" },
  dikirim: { label: "Dikirim", tone: "tide" },
  diterima: { label: "Diterima", tone: "pine" },
  dibatalkan: { label: "Dibatalkan", tone: "clay" },
};

const costOf = (p: Product) => Math.round((p.price * 0.72) / 500) * 500;

export function Purchasing({
  suppliers,
  purchaseOrders,
  setPurchaseOrders,
  products,
  setProducts,
  setPayables,
  setLedger,
  push,
}: {
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  setPurchaseOrders: React.Dispatch<React.SetStateAction<PurchaseOrder[]>>;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  setPayables: React.Dispatch<React.SetStateAction<Debt[]>>;
  setLedger: React.Dispatch<React.SetStateAction<LedgerEntry[]>>;
  push: Push;
}) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("Semua");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  /* form PO baru */
  const [supplierId, setSupplierId] = useState("SUP-01");
  const [due, setDue] = useState("14 hari");
  const [note, setNote] = useState("");
  const [productId, setProductId] = useState("p01");
  const [qty, setQty] = useState(10);
  const [draftItems, setDraftItems] = useState<{ productId: string; qty: number }[]>([]);

  const activeSuppliers = suppliers.filter((s) => s.status === "aktif");
  const sup = suppliers.find((s) => s.id === supplierId);

  const filtered = purchaseOrders.filter(
    (po) =>
      (status === "Semua" || po.status === status.toLowerCase()) &&
      (po.id.toLowerCase().includes(q.toLowerCase()) ||
        (suppliers.find((s) => s.id === po.supplierId)?.name.toLowerCase() ?? "").includes(q.toLowerCase()))
  );

  const poAktif = purchaseOrders.filter((p) => p.status === "dikirim").length;
  const beliBulanIni = purchaseOrders.filter((p) => p.status !== "dibatalkan").reduce((s, p) => s + poTotal(p), 0);
  const itemBulanIni = purchaseOrders.filter((p) => p.status !== "dibatalkan").reduce((s, p) => s + p.items.reduce((a, i) => a + i.qty, 0), 0);

  /* form helpers */
  const addItem = () => {
    if (qty <= 0) {
      push("Jumlah pesanan harus lebih dari 0.", "warn");
      return;
    }
    setDraftItems((d) => {
      const ex = d.find((i) => i.productId === productId);
      return ex ? d.map((i) => (i.productId === productId ? { ...i, qty: i.qty + qty } : i)) : [...d, { productId, qty }];
    });
    push(`${products.find((p) => p.id === productId)?.name} ditambahkan ke PO.`, "info");
  };

  const draftTotal = draftItems.reduce((s, i) => {
    const p = products.find((x) => x.id === i.productId);
    return p ? s + costOf(p) * i.qty : s;
  }, 0);

  const resetForm = () => {
    setDraftItems([]);
    setNote("");
    setQty(10);
  };

  const savePO = (asStatus: "draft" | "dikirim") => {
    if (!draftItems.length) {
      push("Tambahkan minimal satu item ke PO.", "warn");
      return;
    }
    const id = `PO-${2203 + purchaseOrders.length}`;
    const po: PurchaseOrder = {
      id,
      supplierId,
      date: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
      due: due,
      items: draftItems.map((i) => {
        const p = products.find((x) => x.id === i.productId)!;
        return { productId: p.id, name: p.name, qty: i.qty, cost: costOf(p) };
      }),
      status: asStatus,
      paid: false,
      note: note.trim() || undefined,
    };
    setPurchaseOrders((l) => [po, ...l]);
    setCreateOpen(false);
    resetForm();
    push(
      asStatus === "draft" ? `${id} disimpan sebagai draft.` : `${id} senilai ${idr(poTotal(po))} dikirim ke ${sup?.name}.`,
      asStatus === "draft" ? "info" : "success"
    );
  };

  const sendPO = (id: string) => {
    setPurchaseOrders((l) => l.map((p) => (p.id === id ? { ...p, status: "dikirim" } : p)));
    push(`${id} dikirim ke supplier via email.`, "info");
  };

  const cancelPO = (id: string) => {
    setPurchaseOrders((l) => l.map((p) => (p.id === id ? { ...p, status: "dibatalkan" } : p)));
    push(`${id} dibatalkan.`, "warn");
  };

  const receivePO = (po: PurchaseOrder) => {
    const supplier = suppliers.find((s) => s.id === po.supplierId);
    const total = poTotal(po);

    // stok masuk gudang
    setProducts((ps) =>
      ps.map((p) => {
        const it = po.items.find((i) => i.productId === p.id);
        return it ? { ...p, stock: p.stock + it.qty } : p;
      })
    );
    setPurchaseOrders((l) => l.map((p) => (p.id === po.id ? { ...p, status: "diterima", paid: supplier?.term === "Tunai" } : p)));

    if (supplier?.term === "Tunai") {
      const entry: LedgerEntry = {
        id: `L-${1044 + Math.floor(Math.random() * 800)}`,
        date: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
        desc: `Pembelian stok ${supplier.name} (${po.id})`,
        category: "Pembelian",
        type: "keluar",
        amount: total,
        method: "Kas",
      };
      setLedger((l) => [entry, ...l]);
      push(`Barang ${po.id} diterima · dibayar tunai ${idr(total)} (masuk jurnal).`, "success");
    } else {
      const bill: Debt = {
        id: `AP-${312 + Math.floor(Math.random() * 80)}`,
        party: supplier?.name ?? "Supplier",
        desc: `${po.id} · ${supplier?.category ?? ""}`,
        amount: total,
        due: po.due,
        status: "berjalan",
      };
      setPayables((l) => [bill, ...l]);
      push(`Barang ${po.id} diterima · hutang ${idrShort(total)} jatuh tempo ${po.due}.`, "warn");
    }
  };

  return (
    <div>
      <SectionHead
        title="Pembelian"
        desc="Purchase order ke supplier — saat barang diterima, stok inventaris otomatis bertambah."
        action={
          <button className="btn-primary px-4 py-2" onClick={() => setCreateOpen(true)}>
            <IconPlus width={15} height={15} /> Buat PO Baru
          </button>
        }
      />

      {/* statistik */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "PO Dalam Pengiriman", value: num(poAktif), cls: "text-tide", sub: "menunggu kedatangan" },
          { label: "Nilai Belanja Bulan Ini", value: idrShort(beliBulanIni), cls: "text-pine", sub: "termasuk draft" },
          { label: "Item Dipesan", value: num(itemBulanIni), cls: "text-ink", sub: "unit barang" },
          { label: "Supplier Aktif", value: num(activeSuppliers.length), cls: "text-[#8a5f10]", sub: "mitra pasokan" },
        ].map((s, i) => (
          <Reveal key={s.label} delay={i * 60}>
            <div className="card card-hover px-4 py-3.5">
              <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-fog">{s.label}</p>
              <p className={cx("num mt-1 text-xl font-bold", s.cls)}>{s.value}</p>
              <p className="text-[11px] text-fog">{s.sub}</p>
            </div>
          </Reveal>
        ))}
      </div>

      {/* toolbar */}
      <Reveal delay={100}>
        <div className="card mt-4 flex flex-wrap items-center gap-2.5 p-3.5">
          <div className="relative min-w-[200px] flex-1">
            <IconSearch width={14} height={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fog" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari no. PO atau supplier…" className="input pl-9" />
          </div>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="input w-auto py-2 text-[13px]">
            {["Semua", "Draft", "Dikirim", "Diterima", "Dibatalkan"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <span className="num ml-auto text-[12px] font-semibold text-fog">{filtered.length} PO</span>
        </div>
      </Reveal>

      {/* tabel PO */}
      <Reveal delay={160}>
        <div className="card mt-4 overflow-hidden">
          {filtered.length === 0 ? (
            <EmptyState icon={<IconTruck width={20} height={20} />} title="Tidak ada purchase order" desc="Ubah filter atau buat PO baru ke supplier." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px]">
                <thead>
                  <tr className="bg-paper/60">
                    <th className="th w-8"></th>
                    <th className="th">No. PO</th>
                    <th className="th">Supplier</th>
                    <th className="th">Tanggal</th>
                    <th className="th">Jatuh Tempo</th>
                    <th className="th text-center">Item</th>
                    <th className="th text-right">Nilai</th>
                    <th className="th">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((po) => {
                    const s = suppliers.find((x) => x.id === po.supplierId);
                    const open = expanded === po.id;
                    const meta = STATUS_META[po.status];
                    return (
                      <Fragment key={po.id}>
                        <tr
                          onClick={() => setExpanded(open ? null : po.id)}
                          className={cx("cursor-pointer transition-colors hover:bg-paper/60", open && "bg-paper/60")}
                        >
                          <td className="td pl-4">
                            <IconChevronDown width={14} height={14} className={cx("text-fog transition-transform duration-200", open && "rotate-180 text-pine")} />
                          </td>
                          <td className="td num text-[12.5px] font-bold">{po.id}</td>
                          <td className="td font-semibold">{s?.name ?? "—"}</td>
                          <td className="td text-[12.5px] text-fog">{po.date}</td>
                          <td className="td text-[12.5px] text-fog">{po.due}</td>
                          <td className="td num text-center">{po.items.reduce((a, i) => a + i.qty, 0)}</td>
                          <td className="td num text-right font-bold">{idr(poTotal(po))}</td>
                          <td className="td">
                            <span className="inline-flex items-center gap-1.5">
                              <Badge tone={meta.tone}>{meta.label}</Badge>
                              {po.status === "diterima" && (
                                <Badge tone={po.paid ? "pine" : "honey"}>{po.paid ? "Lunas" : "Hutang"}</Badge>
                              )}
                            </span>
                          </td>
                        </tr>
                        {open && (
                          <tr className="bg-paper/40">
                            <td colSpan={8} className="px-6 pb-5 pt-1">
                              <div className="row-in grid gap-4 md:grid-cols-[1fr_280px]">
                                <div className="rounded-lg border border-line bg-surface">
                                  <p className="border-b border-line px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-fog">Item Pesanan</p>
                                  <ul>
                                    {po.items.map((it, i) => (
                                      <li key={i} className="flex items-center justify-between gap-3 border-b border-line/60 px-4 py-2.5 text-[13px] last:border-0">
                                        <span className="font-semibold">{it.name}</span>
                                        <span className="num text-fog">{it.qty} × {num(it.cost)}</span>
                                        <span className="num w-24 text-right font-bold">{num(it.qty * it.cost)}</span>
                                      </li>
                                    ))}
                                    <li className="flex items-center justify-between px-4 py-2.5 text-[13px] font-bold">
                                      <span>Total PO</span>
                                      <span className="num text-pine">{idr(poTotal(po))}</span>
                                    </li>
                                  </ul>
                                </div>
                                <div className="space-y-2.5">
                                  {po.note && (
                                    <div className="rounded-lg border border-honey/40 bg-honey-soft/50 px-3.5 py-3 text-[12.5px]">
                                      <p className="mb-0.5 text-[10.5px] font-bold uppercase tracking-wider text-[#8a5f10]">Catatan</p>
                                      {po.note}
                                    </div>
                                  )}
                                  <div className="rounded-lg border border-line bg-surface px-3.5 py-3">
                                    <p className="mb-1 text-[10.5px] font-bold uppercase tracking-wider text-fog">Termin</p>
                                    <p className="text-[12.5px] font-semibold">{s?.term ?? "—"} · {s?.contact ?? ""}</p>
                                  </div>
                                  {(po.status === "draft" || po.status === "dikirim") && (
                                    <div className="space-y-2">
                                      {po.status === "draft" && (
                                        <button onClick={(e) => { e.stopPropagation(); sendPO(po.id); }} className="btn-outline w-full py-2 text-[12.5px]">
                                          <IconPrinter width={14} height={14} /> Kirim ke Supplier
                                        </button>
                                      )}
                                      {po.status === "dikirim" && (
                                        <button onClick={(e) => { e.stopPropagation(); receivePO(po); }} className="btn-primary w-full py-2 text-[12.5px]">
                                          <IconCheck width={14} height={14} /> Terima Barang (+ Stok)
                                        </button>
                                      )}
                                      <button
                                        onClick={(e) => { e.stopPropagation(); cancelPO(po.id); }}
                                        className="btn-outline w-full py-2 text-[12.5px] text-clay hover:border-clay/50 hover:bg-clay-soft/50"
                                      >
                                        <IconX width={14} height={14} /> Batalkan PO
                                      </button>
                                    </div>
                                  )}
                                  {po.status === "diterima" && (
                                    <p className="flex items-center gap-2 rounded-lg border border-pine/30 bg-pine-soft/60 px-3.5 py-3 text-[12.5px] font-semibold text-pine">
                                      <IconCheck width={15} height={15} />
                                      {po.paid ? "Barang diterima & dibayar tunai." : "Barang diterima · tercatat sebagai hutang."}
                                    </p>
                                  )}
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
          )}
        </div>
      </Reveal>

      {/* modal buat PO */}
      <Modal open={createOpen} onClose={() => { setCreateOpen(false); resetForm(); }} width="max-w-2xl">
        <ModalHead title="Buat Purchase Order" onClose={() => { setCreateOpen(false); resetForm(); }} />
        <div className="max-h-[75vh] overflow-y-auto p-5">
          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <div className="sm:col-span-1">
              <label className="label">Supplier</label>
              <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className="input">
                {activeSuppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Jatuh Tempo</label>
              <select value={due} onChange={(e) => setDue(e.target.value)} className="input">
                {["Hari ini", "7 hari", "14 hari", "30 hari"].map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Termin Supplier</label>
              <div className="input flex items-center bg-paper/60 text-[13px] font-bold text-fog">{sup?.term ?? "—"}</div>
            </div>
          </div>

          {/* tambah item */}
          <div className="rounded-lg border border-dashed border-linedark bg-paper/40 p-3.5">
            <p className="label mb-2">Tambah Item (harga beli otomatis ±28% di bawah harga jual)</p>
            <div className="flex flex-wrap gap-2">
              <select value={productId} onChange={(e) => setProductId(e.target.value)} className="input min-w-0 flex-1">
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} · jual {idrShort(p.price)}</option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                value={qty || ""}
                onChange={(e) => setQty(Math.max(0, Number(e.target.value) || 0))}
                className="input num w-24"
                placeholder="Qty"
              />
              <button onClick={addItem} className="btn-outline px-4">
                <IconPlus width={14} height={14} /> Tambah
              </button>
            </div>
            {(() => {
              const p = products.find((x) => x.id === productId);
              return p ? (
                <p className="num mt-2 text-[11.5px] text-fog">
                  Harga beli: <span className="font-bold text-pine">{idr(costOf(p))}</span> / unit · subtotal {idr(costOf(p) * (qty || 0))}
                </p>
              ) : null;
            })()}
          </div>

          {/* daftar item */}
          {draftItems.length > 0 && (
            <div className="mt-3.5 overflow-hidden rounded-lg border border-line">
              <ul>
                {draftItems.map((i) => {
                  const p = products.find((x) => x.id === i.productId)!;
                  return (
                    <li key={i.productId} className="row-in flex items-center justify-between gap-3 border-b border-line/60 px-3.5 py-2.5 text-[13px] last:border-0">
                      <span className="min-w-0 flex-1 truncate font-semibold">{p.name}</span>
                      <span className="num text-fog">{i.qty} × {num(costOf(p))}</span>
                      <span className="num w-24 text-right font-bold">{num(costOf(p) * i.qty)}</span>
                      <button
                        onClick={() => setDraftItems((d) => d.filter((x) => x.productId !== i.productId))}
                        className="rounded p-1 text-fog transition hover:bg-clay-soft hover:text-clay cursor-pointer"
                        aria-label="Hapus item"
                      >
                        <IconX width={13} height={13} />
                      </button>
                    </li>
                  );
                })}
              </ul>
              <div className="flex items-center justify-between bg-paper/60 px-3.5 py-2.5">
                <span className="font-display text-[13.5px] font-bold">Total PO</span>
                <span className="num text-[16px] font-bold text-pine">{idr(draftTotal)}</span>
              </div>
            </div>
          )}

          <label className="label mt-4">Catatan untuk Supplier (opsional)</label>
          <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="cth: Kirim sebelum akhir pekan…" className="input resize-none" />

          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={() => savePO("draft")} disabled={!draftItems.length} className="btn-outline flex-1 py-2.5">
              Simpan Draft
            </button>
            <button onClick={() => savePO("dikirim")} disabled={!draftItems.length} className="btn-primary flex-1 py-2.5">
              <IconTruck width={15} height={15} /> Kirim Sekarang
            </button>
          </div>
          {sup?.term !== "Tunai" && (
            <p className="mt-2.5 text-center text-[11px] text-fog">
              Termin {sup?.term} — saat barang diterima, otomatis tercatat sebagai <span className="font-bold text-clay">hutang usaha</span>.
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}
