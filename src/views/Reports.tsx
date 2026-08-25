import { useState } from "react";
import {
  CASHFLOW,
  CATEGORY_COLORS,
  poTotal,
  SALES_30,
  SALES_7,
  type Debt,
  type DigitalTx,
  type Product,
  type PurchaseOrder,
  type SalesRecord,
  type Supplier,
} from "../data";
import { cx, downloadCsv, idr, idrShort, num } from "../lib/format";
import { Donut, PairBars } from "../components/charts";
import { Badge, Reveal, SectionHead, useCountUp } from "../components/ui";
import type { Toast } from "../components/ui";
import {
  IconBasket,
  IconBook,
  IconBox,
  IconCoins,
  IconDownload,
  IconFile,
  IconReceipt,
  IconTrendUp,
  IconTruck,
  IconZap,
} from "../components/icons";

type Push = (msg: string, tone?: Toast["tone"]) => void;

type ReportId = "penjualan" | "labarugi" | "stok" | "pembelian" | "hutangpiutang" | "digital";

const REPORTS: { id: ReportId; label: string; desc: string; icon: React.ReactNode; color: string }[] = [
  { id: "penjualan", label: "Penjualan", desc: "Omzet harian & struk terinci", icon: <IconTrendUp width={16} height={16} />, color: "#17593e" },
  { id: "labarugi", label: "Laba Rugi", desc: "Pendapatan, HPP & beban", icon: <IconBook width={16} height={16} />, color: "#35657f" },
  { id: "stok", label: "Stok & Inventaris", desc: "Valuasi stok per kategori", icon: <IconBox width={16} height={16} />, color: "#d3921f" },
  { id: "pembelian", label: "Pembelian", desc: "Rekap PO ke supplier", icon: <IconTruck width={16} height={16} />, color: "#8a5f10" },
  { id: "hutangpiutang", label: "Hutang Piutang", desc: "Kewajiban & tagihan berjalan", icon: <IconCoins width={16} height={16} />, color: "#bc4b2f" },
  { id: "digital", label: "Layanan Digital", desc: "Volume & komisi PPOB", icon: <IconZap width={16} height={16} />, color: "#6d3fa8" },
];

export function Reports({
  products,
  sales,
  purchaseOrders,
  suppliers,
  receivables,
  payables,
  digitalTxs,
  push,
}: {
  products: Product[];
  sales: SalesRecord[];
  purchaseOrders: PurchaseOrder[];
  suppliers: Supplier[];
  receivables: Debt[];
  payables: Debt[];
  digitalTxs: DigitalTx[];
  push: Push;
}) {
  const [range, setRange] = useState<"7" | "30">("30");
  const [active, setActive] = useState<ReportId>("penjualan");

  const series = range === "7" ? SALES_7 : SALES_30;
  const omzet = series.reduce((s, d) => s + d.value, 0);
  const hpp = Math.round(omzet * 0.72);
  const labaKotor = omzet - hpp;
  const beban = Math.round((74_000_000 / 28) * (range === "7" ? 7 : 28));
  const komisiDigital = digitalTxs.filter((t) => t.status === "sukses").reduce((s, t) => s + t.commission, 0);
  const labaBersih = labaKotor + komisiDigital - beban;

  const omzetAnim = useCountUp(omzet);
  const labaAnim = useCountUp(labaBersih);

  /* donat penjualan per kategori — live dari produk */
  const catSales = Object.entries(
    products.reduce<Record<string, number>>((acc, p) => {
      acc[p.category] = (acc[p.category] ?? 0) + p.sold * p.price;
      return acc;
    }, {})
  );
  const catTotal = catSales.reduce((s, [, v]) => s + v, 0) || 1;
  const catDonut = catSales
    .sort((a, b) => b[1] - a[1])
    .map(([label, v]) => ({ label, value: Math.round((v / catTotal) * 100), color: CATEGORY_COLORS[label] ?? "#68746c" }));

  const invValue = products.reduce((s, p) => s + p.price * p.stock, 0);
  const piutangAktif = receivables.filter((r) => r.status !== "lunas");
  const hutangAktif = payables.filter((p) => p.status !== "lunas");

  const exportActive = () => {
    const stamp = new Date().toISOString().slice(0, 10);
    if (active === "penjualan") {
      downloadCsv(`laporan-penjualan-${stamp}.csv`, [
        ["Periode", range === "7" ? "7 hari terakhir" : "30 hari terakhir"],
        [],
        ["No. Struk", "Waktu", "Kasir", "Metode", "Total", "Status"],
        ...sales.map((s) => [s.id, s.time, s.cashier, s.method, s.total, s.status]),
      ]);
    } else if (active === "labarugi") {
      downloadCsv(`laba-rugi-${stamp}.csv`, [
        ["Komponen", "Nilai (Rp)"],
        ["Pendapatan Penjualan", omzet],
        ["Komisi Layanan Digital", komisiDigital],
        ["HPP (72%)", -hpp],
        ["Laba Kotor", labaKotor + komisiDigital],
        ["Beban Operasional", -beban],
        ["Laba Bersih", labaBersih],
      ]);
    } else if (active === "stok") {
      downloadCsv(`valuasi-stok-${stamp}.csv`, [
        ["SKU", "Produk", "Kategori", "Stok", "Harga", "Nilai Stok"],
        ...products.map((p) => [p.sku, p.name, p.category, p.stock, p.price, p.price * p.stock]),
        [],
        ["Total Nilai Stok", "", "", "", "", invValue],
      ]);
    } else if (active === "pembelian") {
      downloadCsv(`pembelian-${stamp}.csv`, [
        ["No. PO", "Supplier", "Tanggal", "Jatuh Tempo", "Item", "Total", "Status"],
        ...purchaseOrders.map((po) => [po.id, suppliers.find((s) => s.id === po.supplierId)?.name ?? "-", po.date, po.due, po.items.length, poTotal(po), po.status]),
      ]);
    } else if (active === "hutangpiutang") {
      downloadCsv(`hutang-piutang-${stamp}.csv`, [
        ["Jenis", "ID", "Pihak", "Keterangan", "Jatuh Tempo", "Nominal", "Status"],
        ...piutangAktif.map((r) => ["Piutang", r.id, r.party, r.desc, r.due, r.amount, r.status]),
        ...hutangAktif.map((p) => ["Hutang", p.id, p.party, p.desc, p.due, p.amount, p.status]),
      ]);
    } else {
      downloadCsv(`layanan-digital-${stamp}.csv`, [
        ["Ref", "Waktu", "Layanan", "Tujuan", "Nominal", "Admin", "Komisi", "Status"],
        ...digitalTxs.map((t) => [t.ref, t.time, t.sub, t.target, t.nominal, t.fee, t.commission, t.status]),
      ]);
    }
    push("Laporan diunduh sebagai CSV.");
  };

  const panelHead = (r: (typeof REPORTS)[number]) => (
    <div className="flex flex-wrap items-center gap-3 border-b border-line bg-paper/50 px-5 py-4">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: `${r.color}16`, color: r.color }}>
        {r.icon}
      </span>
      <div className="min-w-0">
        <h3 className="font-display text-[16px] font-bold leading-tight">Laporan {r.label}</h3>
        <p className="text-[11.5px] text-fog">{r.desc} · periode {range} hari</p>
      </div>
      <button className="btn-primary ml-auto px-3.5 py-2 text-[12.5px]" onClick={exportActive}>
        <IconDownload width={14} height={14} /> Unduh CSV
      </button>
    </div>
  );

  return (
    <div>
      <SectionHead
        title="Laporan & Analisis"
        desc="Seluruh laporan dihitung langsung dari data transaksi, stok, dan pembukuan."
        action={
          <div className="flex rounded-lg border border-line bg-surface p-0.5">
            {(["7", "30"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={cx(
                  "rounded-md px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer",
                  range === r ? "bg-pine text-[#f2efe2] shadow-sm" : "text-fog hover:text-ink"
                )}
              >
                {r} Hari
              </button>
            ))}
          </div>
        }
      />

      {/* ringkasan eksekutif */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Reveal>
          <div className="card card-hover px-4 py-3.5">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-fog">Omzet</p>
            <p className="num mt-1 text-xl font-bold text-pine">{idrShort(Math.round(omzetAnim))}</p>
          </div>
        </Reveal>
        <Reveal delay={60}>
          <div className="card card-hover px-4 py-3.5">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-fog">Laba Kotor</p>
            <p className="num mt-1 text-xl font-bold">{idrShort(labaKotor)}</p>
            <p className="text-[11px] text-fog">margin 28%</p>
          </div>
        </Reveal>
        <Reveal delay={120}>
          <div className="card card-hover px-4 py-3.5">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-fog">Beban Operasional</p>
            <p className="num mt-1 text-xl font-bold text-clay">{idrShort(beban)}</p>
          </div>
        </Reveal>
        <Reveal delay={180}>
          <div className="card card-hover border-pine/30 bg-pine-soft/40 px-4 py-3.5">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-pine/70">Laba Bersih</p>
            <p className="num mt-1 text-xl font-bold text-pine">{idrShort(Math.round(labaAnim))}</p>
            <p className="text-[11px] text-pine/70">termasuk komisi digital {idrShort(komisiDigital)}</p>
          </div>
        </Reveal>
      </div>

      {/* arus kas + komposisi */}
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <Reveal>
          <div className="card h-full p-5">
            <h3 className="font-display text-[16px] font-bold">Arus Kas Bulanan</h3>
            <p className="mb-4 text-[11.5px] text-fog">Dalam jutaan rupiah · masuk vs keluar</p>
            <PairBars data={CASHFLOW} />
            <div className="mt-3 flex gap-4 text-[11.5px] font-semibold text-fog">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-pine" /> Kas Masuk</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-honey/85" /> Kas Keluar</span>
            </div>
          </div>
        </Reveal>
        <Reveal delay={100}>
          <div className="card h-full p-5">
            <h3 className="font-display text-[16px] font-bold">Komposisi Penjualan</h3>
            <p className="mb-4 text-[11.5px] text-fog">Berdasarkan unit terjual per kategori produk</p>
            <Donut items={catDonut} centerLabel="Kategori" centerValue={`${catDonut.length}`} />
          </div>
        </Reveal>
      </div>

      {/* pilihan laporan */}
      <Reveal delay={80}>
        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
          {REPORTS.map((r) => (
            <button
              key={r.id}
              onClick={() => setActive(r.id)}
              className={cx(
                "card card-hover flex flex-col items-start gap-2 p-3.5 text-left",
                active === r.id && "border-pine-deep bg-pine-deep !translate-y-0"
              )}
            >
              <span
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ background: active === r.id ? "rgba(255,255,255,0.12)" : `${r.color}16`, color: active === r.id ? "#f2d9a0" : r.color }}
              >
                {r.icon}
              </span>
              <span>
                <span className={cx("block text-[12.5px] font-bold leading-tight", active === r.id && "text-[#f5f0df]")}>{r.label}</span>
                <span className={cx("block text-[10px]", active === r.id ? "text-[#f5f0df]/55" : "text-fog")}>{r.desc}</span>
              </span>
            </button>
          ))}
        </div>
      </Reveal>

      {/* panel laporan aktif */}
      <Reveal delay={120}>
        <section key={active} className="card view-enter mt-4 overflow-hidden">
          {active === "penjualan" && (
            <>
              {panelHead(REPORTS[0])}
              <div className="grid gap-0 lg:grid-cols-[1fr_320px]">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[520px]">
                    <thead>
                      <tr className="bg-paper/60">
                        <th className="th">No. Struk</th>
                        <th className="th">Waktu</th>
                        <th className="th">Kasir</th>
                        <th className="th">Metode</th>
                        <th className="th text-right">Total</th>
                        <th className="th">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sales.slice(0, 10).map((s) => (
                        <tr key={s.id} className="transition-colors hover:bg-paper/60">
                          <td className="td num text-[12.5px] font-bold">{s.id}</td>
                          <td className="td num text-[12.5px]">{s.time}</td>
                          <td className="td text-[13px]">{s.cashier}</td>
                          <td className="td text-[12.5px]">{s.method}</td>
                          <td className="td num text-right font-bold">{idr(s.total)}</td>
                          <td className="td"><Badge tone={s.status === "selesai" ? "pine" : "clay"}>{s.status}</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="border-t border-line bg-paper/40 p-5 lg:border-l lg:border-t-0">
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-fog">Produk Terlaris</p>
                  <ul className="space-y-3">
                    {[...products].sort((a, b) => b.sold - a.sold).slice(0, 5).map((p, i) => (
                      <li key={p.id}>
                        <div className="mb-1 flex items-center justify-between gap-2 text-[12.5px]">
                          <span className="truncate font-semibold">{i + 1}. {p.name}</span>
                          <span className="num shrink-0 font-bold text-pine">{idrShort(p.sold * p.price)}</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-ink/8">
                          <div className="bar-fill h-full rounded-full bg-honey" style={{ width: `${(p.sold / products[0].sold) * 100}%`, animationDelay: `${i * 90}ms` }} />
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </>
          )}

          {active === "labarugi" && (
            <>
              {panelHead(REPORTS[1])}
              <div className="mx-auto max-w-xl p-5">
                <p className="mb-4 text-center text-[11.5px] font-semibold uppercase tracking-[0.16em] text-fog">
                  Laporan Laba Rugi · Periode {range} hari · SKM Mart
                </p>
                <dl className="num text-[14px]">
                  <div className="flex justify-between py-2 font-semibold"><dt>Pendapatan Penjualan</dt><dd>{idr(omzet)}</dd></div>
                  <div className="flex justify-between py-2 font-semibold text-pine"><dt>Komisi Layanan Digital</dt><dd>+{idr(komisiDigital)}</dd></div>
                  <div className="flex justify-between py-2 text-clay"><dt>Harga Pokok Penjualan (72%)</dt><dd>−{idr(hpp)}</dd></div>
                  <div className="flex justify-between border-t-2 border-ink/60 py-2.5 font-bold"><dt>Laba Kotor</dt><dd>{idr(labaKotor + komisiDigital)}</dd></div>
                  <div className="flex justify-between py-2 text-clay"><dt>Beban Gaji & Operasional</dt><dd>−{idr(Math.round(beban * 0.68))}</dd></div>
                  <div className="flex justify-between py-2 text-clay"><dt>Beban Sewa & Utilitas</dt><dd>−{idr(Math.round(beban * 0.32))}</dd></div>
                  <div className="mt-1 flex items-baseline justify-between rounded-lg bg-pine-deep px-4 py-3 text-[#f2efe2]">
                    <dt className="font-display text-[15px] font-bold">Laba Bersih</dt>
                    <dd className="text-[18px] font-bold text-honey">{idr(labaBersih)}</dd>
                  </div>
                  <p className="mt-3 text-center text-[11px] text-fog">Margin bersih {((labaBersih / (omzet + komisiDigital)) * 100).toLocaleString("id-ID", { maximumFractionDigits: 1 })}% dari pendapatan</p>
                </dl>
              </div>
            </>
          )}

          {active === "stok" && (
            <>
              {panelHead(REPORTS[2])}
              <div className="grid gap-0 lg:grid-cols-[300px_1fr]">
                <div className="border-b border-line bg-paper/40 p-5 lg:border-b-0 lg:border-r">
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-fog">Valuasi per Kategori</p>
                  <ul className="space-y-3">
                    {Object.entries(
                      products.reduce<Record<string, { qty: number; val: number; n: number }>>((acc, p) => {
                        const e = (acc[p.category] ??= { qty: 0, val: 0, n: 0 });
                        e.qty += p.stock; e.val += p.stock * p.price; e.n += 1;
                        return acc;
                      }, {})
                    )
                      .sort((a, b) => b[1].val - a[1].val)
                      .map(([cat, v]) => (
                        <li key={cat}>
                          <div className="mb-1 flex items-center justify-between text-[12.5px]">
                            <span className="flex items-center gap-2 font-semibold">
                              <span className="h-2 w-2 rounded-full" style={{ background: CATEGORY_COLORS[cat] }} />
                              {cat} <span className="text-fog">({v.n} SKU)</span>
                            </span>
                            <span className="num font-bold">{idrShort(v.val)}</span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-ink/8">
                            <div className="bar-fill h-full rounded-full" style={{ width: `${(v.val / invValue) * 100}%`, background: CATEGORY_COLORS[cat] }} />
                          </div>
                        </li>
                      ))}
                  </ul>
                  <div className="mt-4 rounded-lg bg-pine-deep px-4 py-3 text-[#f2efe2]">
                    <p className="text-[10.5px] uppercase tracking-[0.14em] opacity-60">Total Nilai Stok</p>
                    <p className="num text-[19px] font-bold text-honey">{idr(invValue)}</p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[520px]">
                    <thead>
                      <tr className="bg-paper/60">
                        <th className="th">SKU</th>
                        <th className="th">Produk</th>
                        <th className="th text-center">Stok</th>
                        <th className="th text-right">Harga</th>
                        <th className="th text-right">Nilai</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...products].sort((a, b) => b.stock * b.price - a.stock * a.price).slice(0, 10).map((p) => (
                        <tr key={p.id} className="transition-colors hover:bg-paper/60">
                          <td className="td num text-[11.5px] font-semibold text-fog">{p.sku}</td>
                          <td className="td text-[13px] font-semibold">{p.name}</td>
                          <td className={cx("td num text-center font-bold", p.stock <= p.minStock && "text-clay")}>{p.stock}</td>
                          <td className="td num text-right">{idr(p.price)}</td>
                          <td className="td num text-right font-bold">{idr(p.stock * p.price)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {active === "pembelian" && (
            <>
              {panelHead(REPORTS[3])}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px]">
                  <thead>
                    <tr className="bg-paper/60">
                      <th className="th">No. PO</th>
                      <th className="th">Supplier</th>
                      <th className="th">Tanggal</th>
                      <th className="th">Jatuh Tempo</th>
                      <th className="th text-center">Item</th>
                      <th className="th text-right">Total</th>
                      <th className="th">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchaseOrders.map((po) => (
                      <tr key={po.id} className="transition-colors hover:bg-paper/60">
                        <td className="td num text-[12.5px] font-bold">{po.id}</td>
                        <td className="td text-[13px] font-semibold">{suppliers.find((s) => s.id === po.supplierId)?.name ?? "—"}</td>
                        <td className="td text-[12.5px] text-fog">{po.date}</td>
                        <td className="td num text-[12.5px] text-fog">{po.due}</td>
                        <td className="td num text-center">{po.items.length}</td>
                        <td className="td num text-right font-bold">{idr(poTotal(po))}</td>
                        <td className="td">
                          <Badge tone={po.status === "diterima" ? "pine" : po.status === "dikirim" ? "tide" : po.status === "draft" ? "honey" : "fog"}>
                            {po.status === "draft" ? "Draft" : po.status === "dikirim" ? "Dikirim" : po.status === "diterima" ? "Diterima" : "Dibatalkan"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="border-t border-line bg-paper/40 px-5 py-3 text-[12px] font-semibold text-fog">
                Total pembelian tercatat: <span className="num text-ink">{idr(purchaseOrders.filter((p) => p.status !== "dibatalkan").reduce((s, p) => s + poTotal(p), 0))}</span>
                {" "}· PO diterima otomatis menambah stok & mencatat hutang usaha.
              </p>
            </>
          )}

          {active === "hutangpiutang" && (
            <>
              {panelHead(REPORTS[4])}
              <div className="grid gap-0 lg:grid-cols-2">
                <div className="border-b border-line p-5 lg:border-b-0 lg:border-r">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-fog">Piutang (Uang Masuk)</p>
                    <span className="num text-[15px] font-bold text-pine">{idr(piutangAktif.reduce((s, r) => s + r.amount, 0))}</span>
                  </div>
                  <ul className="space-y-2">
                    {receivables.map((r) => (
                      <li key={r.id} className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface px-3.5 py-2.5">
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-bold">{r.party}</p>
                          <p className="truncate text-[11px] text-fog">{r.desc} · jt {r.due}</p>
                        </div>
                        <div className="text-right">
                          <p className={cx("num text-[13px] font-bold", r.status === "lunas" ? "text-fog line-through" : "text-ink")}>{idr(r.amount)}</p>
                          <Badge tone={r.status === "lunas" ? "pine" : r.status === "jatuh tempo" ? "clay" : "honey"}>
                            {r.status === "lunas" ? "Lunas" : r.status === "jatuh tempo" ? "Jatuh tempo" : "Berjalan"}
                          </Badge>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-fog">Hutang (Kewajiban)</p>
                    <span className="num text-[15px] font-bold text-clay">{idr(hutangAktif.reduce((s, r) => s + r.amount, 0))}</span>
                  </div>
                  <ul className="space-y-2">
                    {payables.map((p) => (
                      <li key={p.id} className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface px-3.5 py-2.5">
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-bold">{p.party}</p>
                          <p className="truncate text-[11px] text-fog">{p.desc} · jt {p.due}</p>
                        </div>
                        <div className="text-right">
                          <p className={cx("num text-[13px] font-bold", p.status === "lunas" ? "text-fog line-through" : "text-ink")}>{idr(p.amount)}</p>
                          <Badge tone={p.status === "lunas" ? "pine" : p.status === "jatuh tempo" ? "clay" : "honey"}>
                            {p.status === "lunas" ? "Lunas" : p.status === "jatuh tempo" ? "Jatuh tempo" : "Berjalan"}
                          </Badge>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </>
          )}

          {active === "digital" && (
            <>
              {panelHead(REPORTS[5])}
              <div className="grid gap-0 lg:grid-cols-[300px_1fr]">
                <div className="border-b border-line bg-paper/40 p-5 lg:border-b-0 lg:border-r">
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-fog">Ringkasan Agen</p>
                  <div className="space-y-3">
                    <div className="rounded-lg bg-pine-deep px-4 py-3 text-[#f2efe2]">
                      <p className="text-[10.5px] uppercase tracking-[0.14em] opacity-60">Total Komisi</p>
                      <p className="num text-[19px] font-bold text-honey">{idr(komisiDigital)}</p>
                    </div>
                    <div className="flex justify-between rounded-lg border border-line bg-surface px-4 py-3 text-[13px]">
                      <span className="text-fog">Transaksi sukses</span>
                      <span className="num font-bold">{digitalTxs.filter((t) => t.status === "sukses").length}</span>
                    </div>
                    <div className="flex justify-between rounded-lg border border-line bg-surface px-4 py-3 text-[13px]">
                      <span className="text-fog">Biaya admin terkumpul</span>
                      <span className="num font-bold">{idr(digitalTxs.reduce((s, t) => s + t.fee, 0))}</span>
                    </div>
                    <div className="flex justify-between rounded-lg border border-line bg-surface px-4 py-3 text-[13px]">
                      <span className="text-fog">Volume nominal</span>
                      <span className="num font-bold">{idrShort(digitalTxs.reduce((s, t) => s + t.nominal, 0))}</span>
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[520px]">
                    <thead>
                      <tr className="bg-paper/60">
                        <th className="th">Layanan</th>
                        <th className="th text-center">Jumlah</th>
                        <th className="th text-right">Volume</th>
                        <th className="th text-right">Admin</th>
                        <th className="th text-right">Komisi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(
                        digitalTxs.reduce<Record<string, { n: number; vol: number; fee: number; kom: number }>>((acc, t) => {
                          const e = (acc[t.cat] ??= { n: 0, vol: 0, fee: 0, kom: 0 });
                          e.n += 1; e.vol += t.nominal; e.fee += t.fee; e.kom += t.commission;
                          return acc;
                        }, {})
                      )
                        .sort((a, b) => b[1].kom - a[1].kom)
                        .map(([cat, v]) => (
                          <tr key={cat} className="transition-colors hover:bg-paper/60">
                            <td className="td text-[13px] font-semibold capitalize">{cat === "ewallet" ? "E-Wallet" : cat}</td>
                            <td className="td num text-center font-bold">{v.n}</td>
                            <td className="td num text-right">{idr(v.vol)}</td>
                            <td className="td num text-right text-fog">{idr(v.fee)}</td>
                            <td className="td num text-right font-bold text-pine">+{idr(v.kom)}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </section>
      </Reveal>

      <Reveal delay={140}>
        <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-dashed border-linedark bg-surface/60 px-4 py-3 text-[12px] text-fog">
          <IconFile width={15} height={15} className="shrink-0 text-pine" />
          Laporan laba rugi & valuasi stok diperbarui otomatis saat ada transaksi kasir, penerimaan PO, atau penyesuaian stok.
          <span className="ml-auto hidden items-center gap-1.5 sm:flex">
            <IconBasket width={13} height={13} /> <IconReceipt width={13} height={13} />
          </span>
        </div>
      </Reveal>
    </div>
  );
}
