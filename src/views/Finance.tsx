import { CASHFLOW, EXPENSES } from "../data";
import { cx, idr, idrShort, num } from "../lib/format";
import { PairBars } from "../components/charts";
import { Badge, Delta, Reveal, SectionHead, useCountUp } from "../components/ui";
import type { Toast } from "../components/ui";
import { IconDownload, IconWallet } from "../components/icons";

type Push = (msg: string, tone?: Toast["tone"]) => void;

function FinCard({
  label,
  value,
  note,
  delta,
  delay,
  accent,
}: {
  label: string;
  value: number;
  note: string;
  delta?: number;
  delay: number;
  accent: string;
}) {
  const v = useCountUp(value);
  return (
    <Reveal delay={delay}>
      <div className="card card-hover relative overflow-hidden p-4.5 h-full">
        <span className="absolute inset-y-0 left-0 w-[3.5px]" style={{ background: accent }} />
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-fog">{label}</p>
          {delta !== undefined && <Delta value={delta} />}
        </div>
        <p className="num mt-2.5 text-[22px] font-bold leading-none">{idr(v)}</p>
        <p className="mt-2 text-[11.5px] text-fog">{note}</p>
      </div>
    </Reveal>
  );
}

export function Finance({ push }: { push: Push }) {
  return (
    <div>
      <SectionHead
        title="Keuangan"
        desc="Arus kas, pengeluaran, dan kewajiban toko bulan Februari."
        action={
          <button className="btn-outline px-3.5 py-2" onClick={() => push("Rekening koran Februari diunduh (PDF).", "info")}>
            <IconDownload width={15} height={15} /> Rekening Koran
          </button>
        }
      />

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <FinCard label="Kas & Bank" value={46_200_000} note="Rekening utama + laci kasir" delta={6.8} delay={0} accent="#17593e" />
        </div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <FinCard label="Piutang" value={8_400_000} note="3 pelanggan grosir belum melunasi" delay={70} accent="#35657f" />
        </div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <FinCard label="Hutang" value={12_700_000} note="Jatuh tempo terdekat 15 Feb" delay={140} accent="#bc4b2f" />
        </div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <FinCard label="Laba Bersih Bulan Ini" value={21_900_000} note="Margin 37% dari omzet" delta={14.2} delay={210} accent="#d3921f" />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-12 gap-4">
        <Reveal className="col-span-12 xl:col-span-8" delay={100}>
          <div className="card p-5 h-full">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-display text-[16px] font-bold">Arus Kas 6 Bulan</h3>
                <p className="text-xs text-fog">Dalam jutaan rupiah · Sep – Feb</p>
              </div>
              <div className="flex items-center gap-4 text-[11.5px] font-semibold text-fog">
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-pine" /> Pemasukan</span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-honey" /> Pengeluaran</span>
              </div>
            </div>
            <PairBars data={CASHFLOW} />
            <p className="mt-4 rounded-lg bg-paper px-3.5 py-2.5 text-[12px] text-fog">
              Desember menjadi puncak penjualan (<span className="num font-bold text-pine">{idrShort(226_000_000)}</span>) didorong
              liburan &amp; pesanan parsel.
            </p>
          </div>
        </Reveal>

        <div className="col-span-12 xl:col-span-4 space-y-4">
          <Reveal delay={160}>
            <div className="card overflow-hidden">
              <div className="flex items-center justify-between px-5 pt-5 pb-3">
                <h3 className="font-display text-[16px] font-bold">Pengeluaran Terkini</h3>
                <Badge tone="fog">{EXPENSES.length} catatan</Badge>
              </div>
              <ul>
                {EXPENSES.map((e) => (
                  <li key={e.id} className="flex items-center gap-3 border-t border-line/70 px-5 py-3 transition-colors hover:bg-paper/60">
                    <span
                      className={cx(
                        "flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-lg",
                        e.status === "jatuh tempo" ? "bg-honey-soft text-[#8a5f10]" : "bg-pine-soft text-pine"
                      )}
                    >
                      <IconWallet width={15} height={15} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold leading-tight">{e.label}</p>
                      <p className="num text-[10.5px] text-fog">{e.date} · {e.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="num text-[13px] font-bold">{idr(e.amount)}</p>
                      {e.status === "jatuh tempo" ? (
                        <button
                          onClick={() => push(`Pembayaran "${e.label}" dijadwalkan.`, "info")}
                          className="mt-0.5 text-[10.5px] font-bold text-clay hover:underline cursor-pointer"
                        >
                          jatuh tempo — bayar
                        </button>
                      ) : (
                        <p className="text-[10.5px] font-semibold text-pine">lunas</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal delay={220}>
            <div className="card p-5">
              <h3 className="font-display text-[15px] font-bold">Jadwal Terdekat</h3>
              <ul className="mt-3 space-y-2.5">
                {[
                  { d: "15", b: "Feb", label: "Sewa gudang bulanan", val: 2_500_000 },
                  { d: "20", b: "Feb", label: "Listrik & air (estimasi)", val: 1_300_000 },
                  { d: "25", b: "Feb", label: "Internet & lisensi kasir", val: 349_000 },
                ].map((s) => (
                  <li key={s.label} className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg border border-line bg-paper leading-none">
                      <span className="num text-[14px] font-bold">{s.d}</span>
                      <span className="text-[8.5px] font-bold uppercase text-fog">{s.b}</span>
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12.5px] font-semibold">{s.label}</p>
                      <p className="num text-[11px] font-bold text-fog">{idr(s.val)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
