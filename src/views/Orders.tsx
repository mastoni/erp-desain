import { Fragment, useMemo, useState } from "react";
import { ORDERS, type Order, type OrderStatus } from "../data";
import { cx, idr, num } from "../lib/format";
import { Badge, Reveal, SectionHead } from "../components/ui";
import type { Toast } from "../components/ui";
import { IconCheck, IconChevronDown, IconClock, IconReceipt, IconSearch, IconX } from "../components/icons";

type Push = (msg: string, tone?: Toast["tone"]) => void;

const STATUS_META: Record<OrderStatus, { label: string; tone: "honey" | "tide" | "pine" | "fog" | "clay" }> = {
  menunggu: { label: "Menunggu", tone: "honey" },
  diproses: { label: "Diproses", tone: "tide" },
  selesai: { label: "Selesai", tone: "pine" },
  dibatalkan: { label: "Dibatalkan", tone: "fog" },
  refund: { label: "Refund", tone: "clay" },
};

const orderTotal = (o: Order) => o.items.reduce((s, i) => s + i.qty * i.price, 0);

export function Orders({ push }: { push: Push }) {
  const [orders, setOrders] = useState<Order[]>(ORDERS);
  const [tab, setTab] = useState<"semua" | OrderStatus>("semua");
  const [q, setQ] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const tabs: { id: "semua" | OrderStatus; label: string }[] = [
    { id: "semua", label: "Semua" },
    { id: "menunggu", label: "Menunggu" },
    { id: "diproses", label: "Diproses" },
    { id: "selesai", label: "Selesai" },
    { id: "dibatalkan", label: "Dibatalkan" },
    { id: "refund", label: "Refund" },
  ];

  const counts = useMemo(() => {
    const c: Record<string, number> = { semua: orders.length };
    for (const t of tabs.slice(1)) c[t.id] = orders.filter((o) => o.status === t.id).length;
    return c;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders]);

  const filtered = orders.filter(
    (o) =>
      (tab === "semua" || o.status === tab) &&
      (o.id.toLowerCase().includes(q.toLowerCase()) || o.customer.toLowerCase().includes(q.toLowerCase()))
  );

  const setStatus = (id: string, status: OrderStatus, msg: string, tone: Toast["tone"]) => {
    setOrders((os) => os.map((o) => (o.id === id ? { ...o, status } : o)));
    push(msg, tone);
  };

  return (
    <div>
      <SectionHead
        title="Pesanan"
        desc="Pesanan online dan pembelian grosir yang perlu ditindaklanjuti."
        action={
          <div className="relative w-64">
            <IconSearch width={14} height={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fog" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari ID / pelanggan…" className="input pl-8.5" />
          </div>
        }
      />

      <Reveal>
        <div className="flex flex-wrap gap-1.5">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cx(
                "flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-[12.5px] font-bold transition-all cursor-pointer",
                tab === t.id ? "border-pine bg-pine text-[#f2efe2] shadow-sm" : "border-line bg-surface text-fog hover:border-pine/40 hover:text-ink"
              )}
            >
              {t.label}
              <span className={cx("num rounded px-1.5 py-0.5 text-[10.5px]", tab === t.id ? "bg-white/20" : "bg-ink/6")}>{counts[t.id]}</span>
            </button>
          ))}
        </div>
      </Reveal>

      <Reveal delay={100}>
        <div className="card mt-4 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px]">
              <thead>
                <tr className="bg-paper/60">
                  <th className="th w-8"></th>
                  <th className="th">ID Pesanan</th>
                  <th className="th">Pelanggan</th>
                  <th className="th">Waktu</th>
                  <th className="th text-center">Item</th>
                  <th className="th">Metode</th>
                  <th className="th text-right">Total</th>
                  <th className="th">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => {
                  const open = expanded === o.id;
                  const meta = STATUS_META[o.status];
                  const actionable = o.status === "menunggu" || o.status === "diproses";
                  return (
                    <Fragment key={o.id}>
                      <tr
                        onClick={() => setExpanded(open ? null : o.id)}
                        className={cx("cursor-pointer transition-colors hover:bg-paper/60", open && "bg-paper/60")}
                      >
                        <td className="td pl-4">
                          <IconChevronDown width={14} height={14} className={cx("text-fog transition-transform duration-200", open && "rotate-180 text-pine")} />
                        </td>
                        <td className="td num text-[12.5px] font-bold">{o.id}</td>
                        <td className="td font-semibold">{o.customer}</td>
                        <td className="td text-[12.5px] text-fog">{o.date}</td>
                        <td className="td num text-center">{o.items.reduce((s, i) => s + i.qty, 0)}</td>
                        <td className="td"><Badge tone="fog">{o.method}</Badge></td>
                        <td className="td num text-right font-bold">{idr(orderTotal(o))}</td>
                        <td className="td"><Badge tone={meta.tone}>{meta.label}</Badge></td>
                      </tr>
                      {open && (
                        <tr key={`${o.id}-detail`} className="bg-paper/40">
                          <td colSpan={8} className="px-6 pb-5 pt-1">
                            <div className="row-in grid gap-4 md:grid-cols-[1fr_260px]">
                              <div className="rounded-lg border border-line bg-surface">
                                <p className="border-b border-line px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-fog">Rincian Item</p>
                                <ul>
                                  {o.items.map((it, i) => (
                                    <li key={i} className="flex items-center justify-between gap-3 border-b border-line/60 px-4 py-2.5 text-[13px] last:border-0">
                                      <span className="font-semibold">{it.name}</span>
                                      <span className="num text-fog">{it.qty} × {num(it.price)}</span>
                                      <span className="num w-24 text-right font-bold">{num(it.qty * it.price)}</span>
                                    </li>
                                  ))}
                                  <li className="flex items-center justify-between px-4 py-2.5 text-[13px] font-bold">
                                    <span>Total</span>
                                    <span className="num text-pine">{idr(orderTotal(o))}</span>
                                  </li>
                                </ul>
                              </div>
                              <div className="space-y-3">
                                {o.note && (
                                  <div className="rounded-lg border border-honey/40 bg-honey-soft/50 px-3.5 py-3 text-[12.5px]">
                                    <p className="mb-0.5 text-[10.5px] font-bold uppercase tracking-wider text-[#8a5f10]">Catatan</p>
                                    {o.note}
                                  </div>
                                )}
                                {actionable ? (
                                  <div className="space-y-2">
                                    {o.status === "menunggu" && (
                                      <button
                                        onClick={(e) => { e.stopPropagation(); setStatus(o.id, "diproses", `${o.id} sedang diproses.`, "info"); }}
                                        className="btn-outline w-full py-2 text-[12.5px]"
                                      >
                                        <IconClock width={14} height={14} /> Proses Pesanan
                                      </button>
                                    )}
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setStatus(o.id, "selesai", `${o.id} ditandai selesai.`, "success"); }}
                                      className="btn-primary w-full py-2 text-[12.5px]"
                                    >
                                      <IconCheck width={14} height={14} /> Tandai Selesai
                                    </button>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setStatus(o.id, "dibatalkan", `${o.id} dibatalkan.`, "warn"); }}
                                      className="btn-outline w-full py-2 text-[12.5px] text-clay hover:border-clay/50 hover:bg-clay-soft/50"
                                    >
                                      <IconX width={14} height={14} /> Batalkan
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2.5 rounded-lg border border-line bg-surface px-3.5 py-3 text-[12.5px] text-fog">
                                    <IconReceipt width={15} height={15} className="text-fog" />
                                    Pesanan ini sudah final dan masuk ke laporan.
                                  </div>
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
          {filtered.length === 0 && <p className="px-5 py-10 text-center text-sm text-fog">Tidak ada pesanan pada filter ini.</p>}
        </div>
      </Reveal>
    </div>
  );
}
