import { Fragment, useMemo, useState } from "react";
import { SALES_30, SALES_7, type SalesRecord, type TxMethod } from "../data";
import { cx, downloadCsv, idr, idrShort, num } from "../lib/format";
import { AreaChart, Donut } from "../components/charts";
import { Badge, Reveal, SectionHead, useCountUp } from "../components/ui";
import type { Toast } from "../components/ui";
import { IconChevronDown, IconDownload, IconReceipt, IconSearch } from "../components/icons";

type Push = (msg: string, tone?: Toast["tone"]) => void;

const METHOD_COLORS: Record<TxMethod, string> = { Tunai: "#17593e", QRIS: "#d3921f", Debit: "#35657f" };

export function Sales({ sales, push }: { sales: SalesRecord[]; push: Push }) {
  const [range, setRange] = useState<"7" | "30">("7");
  const [q, setQ] = useState("");
  const [method, setMethod] = useState<"Semua" | TxMethod>("Semua");
  const [expanded, setExpanded] = useState<string | null>(null);

  const series = range === "7" ? SALES_7 : SALES_30;
  const omzet = series.reduce((s, d) => s + d.value, 0);

  const selesai = sales.filter((s) => s.status === "selesai");
  const recorded = selesai.reduce((s, t) => s + t.total, 0);
  const recordedAnim = useCountUp(recorded);
  const avg = selesai.length ? recorded / selesai.length : 0;
  const refundCount = sales.length - selesai.length;

  const methodShare = useMemo(() => {
    const count: Record<TxMethod, number> = { Tunai: 0, QRIS: 0, Debit: 0 };
    sales.forEach((s) => (count[s.method] += 1));
    const total = sales.length || 1;
    return (Object.keys(count) as TxMethod[]).map((m) => ({
      label: m,
      value: Math.round((count[m] / total) * 100),
      color: METHOD_COLORS[m],
    }));
  }, [sales]);

  const filtered = sales.filter(
    (s) =>
      (method === "Semua" || s.method === method) &&
      (s.id.toLowerCase().includes(q.toLowerCase()) || s.cashier.toLowerCase().includes(q.toLowerCase()))
  );

  const exportCsv = () => {
    downloadCsv("laporan-penjualan.csv", [
      ["No. Struk", "Waktu", "Kasir", "Item", "Metode", "Total", "Status"],
      ...filtered.map((s) => [s.id, s.time, s.cashier, s.items, s.method, s.total, s.status]),
    ]);
    push("Laporan penjualan diunduh (CSV).");
  };

  return (
    <div>
      <SectionHead
        title="Penjualan"
        desc="Log seluruh transaksi kasir — struk baru dari POS otomatis masuk ke daftar ini."
        action={
          <button className="btn-outline px-3.5 py-2" onClick={exportCsv}>
            <IconDownload width={15} height={15} /> Ekspor CSV
          </button>
        }
      />

      {/* KPI */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Reveal>
          <div className="card card-hover px-4 py-3.5">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-fog">Transaksi Tercatat</p>
            <p className="num mt-1 text-xl font-bold">{num(sales.length)}</p>
            <p className="text-[11px] text-fog">sejak toko buka</p>
          </div>
        </Reveal>
        <Reveal delay={60}>
          <div className="card card-hover px-4 py-3.5">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-fog">Nilai Tercatat</p>
            <p className="num mt-1 text-xl font-bold text-pine">{idr(Math.round(recordedAnim))}</p>
            <p className="text-[11px] text-fog">di luar proyeksi pesanan</p>
          </div>
        </Reveal>
        <Reveal delay={120}>
          <div className="card card-hover px-4 py-3.5">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-fog">Rata-rata Struk</p>
            <p className="num mt-1 text-xl font-bold">{idr(Math.round(avg))}</p>
            <p className="text-[11px] text-fog">per transaksi selesai</p>
          </div>
        </Reveal>
        <Reveal delay={180}>
          <div className="card card-hover px-4 py-3.5">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-fog">Refund</p>
            <p className="num mt-1 text-xl font-bold text-clay">{num(refundCount)}</p>
            <p className="text-[11px] text-fog">perlu pengecekan stok</p>
          </div>
        </Reveal>
      </div>

      {/* grafik */}
      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <Reveal className="lg:col-span-2">
          <div className="card h-full p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-display text-[16px] font-bold">Tren Omzet</h3>
                <p className="text-[11.5px] text-fog">
                  Total {range === "7" ? "7 hari" : "30 hari"} · {idrShort(omzet)}
                </p>
              </div>
              <div className="flex rounded-lg border border-line bg-surface p-0.5">
                {(["7", "30"] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRange(r)}
                    className={cx(
                      "rounded-md px-3 py-1.5 text-xs font-bold transition-all cursor-pointer",
                      range === r ? "bg-pine text-[#f2efe2] shadow-sm" : "text-fog hover:text-ink"
                    )}
                  >
                    {r} Hari
                  </button>
                ))}
              </div>
            </div>
            <AreaChart data={series} />
          </div>
        </Reveal>
        <Reveal delay={100}>
          <div className="card h-full p-5">
            <h3 className="font-display text-[16px] font-bold">Metode Pembayaran</h3>
            <p className="mb-4 text-[11.5px] text-fog">Dihitung live dari log transaksi</p>
            <Donut items={methodShare} centerLabel="Total" centerValue={`${sales.length} trx`} />
          </div>
        </Reveal>
      </div>

      {/* log transaksi */}
      <Reveal delay={120}>
        <div className="card mt-5 overflow-hidden">
          <div className="flex flex-wrap items-center gap-2.5 border-b border-line px-5 py-4">
            <IconReceipt width={17} height={17} className="text-pine" />
            <h3 className="font-display text-[16px] font-bold">Log Transaksi Hari Ini</h3>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <div className="relative">
                <IconSearch width={13} height={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-fog" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari struk / kasir…" className="input w-48 py-1.5 pl-8 text-[12.5px]" />
              </div>
              <div className="flex gap-1">
                {(["Semua", "Tunai", "QRIS", "Debit"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMethod(m)}
                    className={cx(
                      "rounded-full border px-3 py-1.5 text-[11.5px] font-bold transition-all cursor-pointer",
                      method === m ? "border-pine bg-pine text-[#f2efe2]" : "border-line bg-surface text-fog hover:text-ink"
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="bg-paper/60">
                  <th className="th w-8"></th>
                  <th className="th">No. Struk</th>
                  <th className="th">Waktu</th>
                  <th className="th">Kasir</th>
                  <th className="th text-center">Item</th>
                  <th className="th">Metode</th>
                  <th className="th text-right">Total</th>
                  <th className="th">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => {
                  const open = expanded === s.id;
                  return (
                    <FragmentRow key={s.id}>
                      <tr
                        onClick={() => setExpanded(open ? null : s.id)}
                        className={cx("cursor-pointer transition-colors hover:bg-paper/60", open && "bg-paper/60", s.fresh && "bg-pine-soft/30")}
                      >
                        <td className="td pl-4">
                          <IconChevronDown width={14} height={14} className={cx("text-fog transition-transform duration-200", open && "rotate-180 text-pine")} />
                        </td>
                        <td className="td">
                          <span className="num text-[12.5px] font-bold">{s.id}</span>
                          {s.fresh && <Badge tone="pine" className="ml-2">baru</Badge>}
                        </td>
                        <td className="td num text-[12.5px]">{s.time}</td>
                        <td className="td text-[13px]">{s.cashier}</td>
                        <td className="td num text-center">{s.items}</td>
                        <td className="td">
                          <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold">
                            <span className="h-2 w-2 rounded-full" style={{ background: METHOD_COLORS[s.method] }} />
                            {s.method}
                          </span>
                        </td>
                        <td className="td num text-right font-bold">{idr(s.total)}</td>
                        <td className="td">
                          <Badge tone={s.status === "selesai" ? "pine" : "clay"}>{s.status === "selesai" ? "Selesai" : "Refund"}</Badge>
                        </td>
                      </tr>
                      {open && (
                        <tr className="bg-paper/40">
                          <td colSpan={8} className="px-6 pb-5 pt-1">
                            <div className="row-in mx-auto max-w-xl rounded-lg border border-line bg-surface">
                              <p className="border-b border-line px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-fog">Rincian Struk {s.id}</p>
                              <ul>
                                {s.lines.map((l, i) => (
                                  <li key={i} className="flex items-center justify-between gap-3 border-b border-line/60 px-4 py-2 text-[13px] last:border-0">
                                    <span className="font-semibold">{l.name}</span>
                                    <span className="num text-fog">{l.qty} × {num(l.price)}</span>
                                    <span className="num w-24 text-right font-bold">{num(l.qty * l.price)}</span>
                                  </li>
                                ))}
                                <li className="flex items-center justify-between px-4 py-2.5 text-[13px] font-bold">
                                  <span>Total (PPN {11}% termasuk)</span>
                                  <span className="num text-pine">{idr(s.total)}</span>
                                </li>
                              </ul>
                            </div>
                          </td>
                        </tr>
                      )}
                    </FragmentRow>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && <p className="px-5 py-10 text-center text-sm text-fog">Tidak ada transaksi yang cocok dengan filter.</p>}
        </div>
      </Reveal>
    </div>
  );
}

function FragmentRow({ children }: { children: React.ReactNode }) {
  return <Fragment>{children}</Fragment>;
}
