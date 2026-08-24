import { useState } from "react";
import { HOURLY, ORDERS, PAYMENTS, SALES_30, SALES_7, TRANSACTIONS, type DigitalTx, type Product } from "../data";
import { cx, idr, idrShort, num } from "../lib/format";
import { AreaChart, Donut, HourBars, Sparkline } from "../components/charts";
import { Badge, Delta, Reveal, SectionHead, useCountUp } from "../components/ui";
import type { Toast } from "../components/ui";
import type { View } from "../components/Sidebar";
import { IconArrowUpRight, IconBox, IconCheck, IconChevronRight, IconDownload, IconReceipt, IconTrendUp, IconZap } from "../components/icons";

const D_CAT_LABEL: Record<string, string> = {
  pulsa: "Pulsa", data: "Data", ewallet: "E-Wallet", listrik: "Listrik",
  bpjs: "BPJS", pdam: "PDAM", transfer: "Transfer",
};

type Push = (msg: string, tone?: Toast["tone"]) => void;

function KpiCard({
  label,
  value,
  format,
  delta,
  invert,
  spark,
  color,
  delay,
}: {
  label: string;
  value: number;
  format: (n: number) => string;
  delta: number;
  invert?: boolean;
  spark: number[];
  color: string;
  delay: number;
}) {
  const v = useCountUp(value);
  return (
    <Reveal delay={delay}>
      <div className="card card-hover p-4.5 h-full">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-fog">{label}</p>
          <Delta value={delta} invert={invert} />
        </div>
        <div className="mt-3 flex items-end justify-between gap-3">
          <p className="num text-[22px] font-bold leading-none">{format(v)}</p>
          <Sparkline data={spark} color={color} className="h-9 w-24 shrink-0" />
        </div>
      </div>
    </Reveal>
  );
}

export function Dashboard({
  products,
  digitalTxs,
  dueBills,
  onNavigate,
  push,
}: {
  products: Product[];
  digitalTxs: DigitalTx[];
  dueBills: number;
  onNavigate: (v: View) => void;
  push: Push;
}) {
  const [range, setRange] = useState<"7" | "30">("7");

  /* ringkasan layanan digital */
  const dKomisi = digitalTxs.filter((t) => t.status === "sukses").reduce((s, t) => s + t.commission, 0);
  const dKomisiAnim = useCountUp(dKomisi);
  const dCounts = Object.entries(
    digitalTxs.reduce<Record<string, number>>((acc, t) => ((acc[t.cat] = (acc[t.cat] ?? 0) + 1), acc), {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const series = range === "7" ? SALES_7 : SALES_30;
  const total = series.reduce((s, d) => s + d.value, 0);
  const best = series.reduce((a, b) => (b.value > a.value ? b : a));

  const lowStock = products
    .filter((p) => p.stock <= p.minStock)
    .sort((a, b) => a.stock / a.minStock - b.stock / b.minStock);
  const invValue = products.reduce((s, p) => s + p.price * p.stock, 0);
  const pending = ORDERS.filter((o) => o.status === "menunggu" || o.status === "diproses").length;

  const topProducts = [...products].sort((a, b) => b.sold - a.sold).slice(0, 5);
  const maxSold = topProducts[0]?.sold ?? 1;

  const dateStr = new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const tickerItems = [
    `Pendapatan hari ini ${idrShort(8_450_000)}`,
    "164 transaksi tercatat",
    "Rata-rata belanja Rp 51,5 rb / struk",
    `Stok menipis: ${lowStock.length} SKU`,
    `${pending} pesanan menunggu diproses`,
    dueBills > 0 ? `${dueBills} tagihan hutang jatuh tempo` : "Semua hutang usaha terkendali",
    "Kasir aktif: Rani · Dimas",
    "Settlement QRIS pukul 23:00 WIB",
    "Backup otomatis berikutnya 02:00 WIB",
  ];

  return (
    <div>
      <SectionHead
        title="Dasbor Operasional"
        desc={`${dateStr} · Ringkasan performa Lumbung Mart hari ini.`}
        action={
          <div className="flex items-center gap-2">
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
            <button className="btn-outline px-3.5 py-2" onClick={() => push("Laporan PDF sedang disiapkan — cek email Anda.", "info")}>
              <IconDownload width={15} height={15} />
              <span className="hidden sm:inline">Ekspor</span>
            </button>
          </div>
        }
      />

      {/* ticker */}
      <Reveal>
        <div className="ticker overflow-hidden rounded-lg border border-line bg-surface/85">
          <div className="ticker-track flex w-max items-center gap-8 px-4 py-2">
            {[...tickerItems, ...tickerItems].map((t, i) => (
              <span key={i} className="flex items-center gap-2 whitespace-nowrap text-[12px] font-medium text-fog">
                <IconTrendUp width={13} height={13} className={i % 2 === 0 ? "text-pine" : "text-honey"} />
                {t}
                <span className="ml-4 h-1 w-1 rounded-full bg-linedark" />
              </span>
            ))}
          </div>
        </div>
      </Reveal>

      {/* KPI */}
      <div className="mt-5 grid grid-cols-12 gap-4">
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <KpiCard label="Pendapatan Hari Ini" value={8_450_000} format={idrShort} delta={12.4} spark={[4.1, 4.6, 4.4, 5.2, 5.8, 6.9, 8.45]} color="#17593e" delay={0} />
        </div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <KpiCard label="Transaksi" value={164} format={(n) => num(Math.round(n))} delta={8.1} spark={[96, 110, 104, 121, 138, 150, 164]} color="#35657f" delay={70} />
        </div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <KpiCard label="Rata-rata Transaksi" value={51_524} format={(n) => idr(Math.round(n))} delta={3.9} spark={[42.8, 44.1, 43.6, 45.9, 47.2, 49.8, 51.5]} color="#d3921f" delay={140} />
        </div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <KpiCard label="Nilai Inventaris" value={invValue} format={idrShort} delta={-1.2} spark={[132, 131, 130.4, 129.8, 129.2, 128.9, invValue / 1_000_000]} color="#bc4b2f" delay={210} />
        </div>
      </div>

      {/* grafik utama */}
      <div className="mt-5 grid grid-cols-12 gap-4">
        <Reveal className="col-span-12 xl:col-span-8" delay={80}>
          <div className="card p-5 h-full">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-display text-[16px] font-bold">Pendapatan</h3>
                <p className="text-xs text-fog">
                  Total {range} hari terakhir ·{" "}
                  <span className="num font-bold text-pine">{idrShort(total)}</span>
                </p>
              </div>
              <div className="flex items-center gap-4 text-[11.5px] font-semibold text-fog">
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-pine" /> Pendapatan</span>
                <Badge tone="pine">Puncak: {idrShort(best.value)}</Badge>
              </div>
            </div>
            <AreaChart data={series} />
          </div>
        </Reveal>

        <Reveal className="col-span-12 xl:col-span-4" delay={160}>
          <div className="card p-5 h-full">
            <h3 className="font-display text-[16px] font-bold">Metode Pembayaran</h3>
            <p className="mb-5 text-xs text-fog">Distribusi 164 transaksi hari ini</p>
            <Donut items={PAYMENTS} centerLabel="Transaksi" centerValue="164" />
            <div className="mt-5 rounded-lg bg-paper px-3.5 py-2.5 text-[12px] text-fog">
              QRIS naik <span className="num font-bold text-pine">+4,2%</span> minggu ini — pertimbangkan promo scan di kasir.
            </div>
          </div>
        </Reveal>
      </div>

      {/* layanan digital */}
      <Reveal delay={60}>
        <div className="card mt-5 flex flex-wrap items-center gap-x-6 gap-y-3 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-honey-soft text-[#8a5f10]">
              <IconZap width={19} height={19} />
              <span className="pulse-dot absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-pine" />
            </span>
            <div>
              <p className="font-display text-[15px] font-bold leading-tight">Layanan Digital Aktif</p>
              <p className="text-[11.5px] text-fog">Kios agen · PPOB · Pulsa · E-Wallet · Transfer</p>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="num text-[20px] font-bold text-pine">{idr(Math.round(dKomisiAnim))}</span>
            <span className="text-[11px] text-fog">komisi agen · {digitalTxs.length} transaksi hari ini</span>
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-1.5">
            {dCounts.map(([c, n]) => (
              <Badge key={c} tone="fog">
                {D_CAT_LABEL[c] ?? c} · {n}
              </Badge>
            ))}
            <button onClick={() => onNavigate("digital")} className="btn-primary ml-1 px-3.5 py-2 text-[12.5px]">
              Buka Kios <IconChevronRight width={13} height={13} />
            </button>
          </div>
        </div>
      </Reveal>

      {/* baris bawah */}
      <div className="mt-5 grid grid-cols-12 gap-4">
        {/* produk terlaris */}
        <Reveal className="col-span-12 md:col-span-6 xl:col-span-4" delay={80}>
          <div className="card p-5 h-full">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-[16px] font-bold">Produk Terlaris</h3>
              <button onClick={() => onNavigate("inventory")} className="flex items-center gap-1 text-xs font-bold text-pine hover:underline cursor-pointer">
                Inventaris <IconArrowUpRight width={12} height={12} />
              </button>
            </div>
            <ul className="space-y-3.5">
              {topProducts.map((p, i) => (
                <li key={p.id}>
                  <div className="mb-1.5 flex items-baseline justify-between gap-2">
                    <p className="flex min-w-0 items-baseline gap-2 text-[13px] font-semibold">
                      <span className="num text-[11px] font-bold text-fog">{i + 1}</span>
                      <span className="truncate">{p.name}</span>
                    </p>
                    <span className="num shrink-0 text-[12px] font-bold text-fog">{num(p.sold)}×</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink/8">
                      <div
                        className="bar-fill h-full rounded-full bg-pine"
                        style={{ width: `${(p.sold / maxSold) * 100}%`, animationDelay: `${i * 110}ms` }}
                      />
                    </div>
                    <span className="num w-16 text-right text-[11px] font-semibold text-pine">{idrShort(p.sold * p.price)}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>

        {/* transaksi terbaru */}
        <Reveal className="col-span-12 md:col-span-6 xl:col-span-5" delay={140}>
          <div className="card h-full overflow-hidden">
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <h3 className="font-display text-[16px] font-bold">Transaksi Terbaru</h3>
              <button onClick={() => onNavigate("orders")} className="flex items-center gap-1 text-xs font-bold text-pine hover:underline cursor-pointer">
                Semua <IconArrowUpRight width={12} height={12} />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-paper/60">
                    <th className="th">No. Struk</th>
                    <th className="th">Waktu</th>
                    <th className="th">Kasir</th>
                    <th className="th">Metode</th>
                    <th className="th text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {TRANSACTIONS.map((t) => (
                    <tr key={t.id} className="transition-colors hover:bg-paper/60">
                      <td className="td">
                        <span className="num text-[12.5px] font-semibold">{t.id}</span>
                        {t.status === "refund" && <Badge tone="clay" className="ml-2">refund</Badge>}
                      </td>
                      <td className="td num text-fog">{t.time}</td>
                      <td className="td">{t.cashier}</td>
                      <td className="td">
                        <Badge tone={t.method === "Tunai" ? "pine" : t.method === "QRIS" ? "honey" : "tide"}>{t.method}</Badge>
                      </td>
                      <td className="td num text-right font-bold">{idr(t.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Reveal>

        {/* kanan: stok + per jam */}
        <div className="col-span-12 xl:col-span-3 space-y-4">
          <Reveal delay={200}>
            <div className="card p-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-display text-[15px] font-bold">Peringatan Stok</h3>
                <Badge tone={lowStock.length ? "honey" : "pine"}>{lowStock.length} SKU</Badge>
              </div>
              {lowStock.length === 0 ? (
                <div className="flex items-center gap-2 rounded-lg bg-pine-soft px-3 py-2.5 text-[12.5px] font-semibold text-pine">
                  <IconCheck width={14} height={14} /> Semua stok di atas batas minimum
                </div>
              ) : (
                <ul className="space-y-2.5">
                  {lowStock.slice(0, 4).map((p) => (
                    <li key={p.id} className="rounded-lg border border-line bg-paper/60 px-3 py-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-[12.5px] font-semibold">{p.name}</p>
                        <Badge tone={p.stock === 0 ? "clay" : "honey"}>{p.stock === 0 ? "Habis" : `sisa ${p.stock}`}</Badge>
                      </div>
                      <p className="num mt-1 text-[10.5px] text-fog">min. {p.minStock} · {p.sku}</p>
                    </li>
                  ))}
                </ul>
              )}
              <button onClick={() => onNavigate("inventory")} className="btn-outline mt-3.5 w-full py-2 text-[12.5px]">
                <IconBox width={14} height={14} /> Atur Stok
              </button>
            </div>
          </Reveal>

          <Reveal delay={260}>
            <div className="card p-5">
              <h3 className="font-display text-[15px] font-bold">Penjualan per Jam</h3>
              <p className="mb-3 text-[11px] text-fog">Puncak 19:00 · {idrShort(1_620_000)}</p>
              <HourBars data={HOURLY} />
            </div>
          </Reveal>

          <Reveal delay={320}>
            <button
              onClick={() => onNavigate("pos")}
              className="card card-hover group flex w-full items-center gap-3 p-4 text-left cursor-pointer"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-honey text-pine-deep transition-transform group-hover:scale-105">
                <IconReceipt width={18} height={18} />
              </span>
              <span>
                <span className="block font-display text-[14px] font-bold">Buka Kasir</span>
                <span className="block text-[11.5px] text-fog">Mulai transaksi baru · tekan / untuk cari</span>
              </span>
            </button>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
