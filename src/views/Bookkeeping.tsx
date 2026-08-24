import { useState } from "react";
import type { Debt, LedgerEntry } from "../data";
import { cx, idr, idrShort, num } from "../lib/format";
import { Badge, Modal, ModalHead, Reveal, SectionHead, useCountUp } from "../components/ui";
import type { Toast } from "../components/ui";
import { IconBook, IconCheck, IconCoins, IconPlus, IconSearch } from "../components/icons";

type Push = (msg: string, tone?: Toast["tone"]) => void;

const CASH_BASE = 21_300_000;
const CATEGORIES = ["Penjualan", "Pembelian", "Gaji", "Utilitas", "Operasional", "Komisi Agen", "Piutang", "Hutang", "Lainnya"];
const METHODS = ["Kas", "Transfer", "QRIS", "Debit", "Kasir", "Sistem"];

type Tab = "jurnal" | "piutang" | "hutang";

function DebtTable({
  items,
  kind,
  onSettle,
}: {
  items: Debt[];
  kind: "piutang" | "hutang";
  onSettle: (d: Debt) => void;
}) {
  const totalAktif = items.filter((d) => d.status !== "lunas").reduce((s, d) => s + d.amount, 0);
  const totalJt = items.filter((d) => d.status === "jatuh tempo").reduce((s, d) => s + d.amount, 0);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="rounded-lg bg-paper px-4 py-2.5">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-fog">{kind === "piutang" ? "Piutang Berjalan" : "Hutang Berjalan"}</p>
          <p className={cx("num text-[17px] font-bold", kind === "piutang" ? "text-pine" : "text-clay")}>{idr(totalAktif)}</p>
        </div>
        <div className="rounded-lg bg-paper px-4 py-2.5">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-fog">Sudah Jatuh Tempo</p>
          <p className="num text-[17px] font-bold text-[#8a5f10]">{idr(totalJt)}</p>
        </div>
        <p className="ml-auto text-[11.5px] text-fog">
          {kind === "piutang" ? "Uang pelanggan yang belum kita terima." : "Kewajiban kita ke supplier & pihak lain."}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px]">
          <thead>
            <tr className="bg-paper/60">
              <th className="th">ID</th>
              <th className="th">{kind === "piutang" ? "Pelanggan" : "Pihak"}</th>
              <th className="th">Keterangan</th>
              <th className="th text-right">Nominal</th>
              <th className="th">Jatuh Tempo</th>
              <th className="th">Status</th>
              <th className="th text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {items.map((d) => (
              <tr key={d.id} className={cx("transition-colors hover:bg-paper/60", d.status === "jatuh tempo" && "bg-honey-soft/25")}>
                <td className="td num text-[12px] font-bold text-fog">{d.id}</td>
                <td className="td font-semibold">{d.party}</td>
                <td className="td text-[12.5px] text-fog">{d.desc}</td>
                <td className="td num text-right font-bold">{idr(d.amount)}</td>
                <td className={cx("td num text-[12.5px]", d.status === "jatuh tempo" ? "font-bold text-clay" : "text-fog")}>{d.due}</td>
                <td className="td">
                  <Badge tone={d.status === "lunas" ? "pine" : d.status === "jatuh tempo" ? "clay" : "tide"}>
                    {d.status === "lunas" ? "Lunas" : d.status === "jatuh tempo" ? "Jatuh Tempo" : "Berjalan"}
                  </Badge>
                </td>
                <td className="td text-right">
                  {d.status !== "lunas" ? (
                    <button onClick={() => onSettle(d)} className="btn-primary px-3 py-1.5 text-[12px]">
                      <IconCheck width={13} height={13} /> {kind === "piutang" ? "Terima Pembayaran" : "Lunasi"}
                    </button>
                  ) : (
                    <span className="text-[11.5px] font-semibold text-fog">Selesai</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function Bookkeeping({
  ledger,
  setLedger,
  receivables,
  setReceivables,
  payables,
  setPayables,
  push,
}: {
  ledger: LedgerEntry[];
  setLedger: React.Dispatch<React.SetStateAction<LedgerEntry[]>>;
  receivables: Debt[];
  setReceivables: React.Dispatch<React.SetStateAction<Debt[]>>;
  payables: Debt[];
  setPayables: React.Dispatch<React.SetStateAction<Debt[]>>;
  push: Push;
}) {
  const [tab, setTab] = useState<Tab>("jurnal");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [nf, setNf] = useState({ type: "masuk" as "masuk" | "keluar", desc: "", category: "Penjualan", amount: "", method: "Kas" });

  const masuk = ledger.filter((e) => e.type === "masuk").reduce((s, e) => s + e.amount, 0);
  const keluar = ledger.filter((e) => e.type === "keluar").reduce((s, e) => s + e.amount, 0);
  const saldo = CASH_BASE + masuk - keluar;
  const saldoAnim = useCountUp(saldo);
  const totalPiutang = receivables.filter((d) => d.status !== "lunas").reduce((s, d) => s + d.amount, 0);
  const totalHutang = payables.filter((d) => d.status !== "lunas").reduce((s, d) => s + d.amount, 0);
  const hutangJt = payables.filter((d) => d.status === "jatuh tempo").length;

  const filtered = ledger.filter((e) => e.desc.toLowerCase().includes(q.toLowerCase()) || e.category.toLowerCase().includes(q.toLowerCase()));

  const addEntry = () => {
    const amount = Number(nf.amount);
    if (!nf.desc.trim() || !amount || amount <= 0) {
      push("Lengkapi keterangan dan nominal yang valid.", "warn");
      return;
    }
    setLedger((l) => [
      {
        id: `L-${1100 + l.length}`,
        date: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
        desc: nf.desc.trim(),
        category: nf.category,
        type: nf.type,
        amount,
        method: nf.method,
      },
      ...l,
    ]);
    push(`Catatan ${nf.type === "masuk" ? "pemasukan" : "pengeluaran"} ${idr(amount)} tersimpan.`, "success");
    setOpen(false);
    setNf({ type: "masuk", desc: "", category: "Penjualan", amount: "", method: "Kas" });
  };

  const settle = (kind: "piutang" | "hutang") => (d: Debt) => {
    const setter = kind === "piutang" ? setReceivables : setPayables;
    setter((l) => l.map((x) => (x.id === d.id ? { ...x, status: "lunas" } : x)));
    setLedger((l) => [
      {
        id: `L-${1200 + l.length}`,
        date: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
        desc: kind === "piutang" ? `Pelunasan piutang ${d.party} (${d.id})` : `Pembayaran hutang ${d.party} (${d.id})`,
        category: kind === "piutang" ? "Piutang" : "Hutang",
        type: kind === "piutang" ? "masuk" : "keluar",
        amount: d.amount,
        method: "Transfer",
      },
      ...l,
    ]);
    push(
      kind === "piutang"
        ? `Piutang ${d.party} ${idrShort(d.amount)} diterima — kas bertambah.`
        : `Hutang ke ${d.party} ${idrShort(d.amount)} dilunasi.`,
      "success"
    );
  };

  const tabs: { id: Tab; label: string; badge?: number; badgeCls?: string }[] = [
    { id: "jurnal", label: "Jurnal Kas", badge: ledger.length },
    { id: "piutang", label: "Piutang", badge: receivables.filter((d) => d.status !== "lunas").length },
    { id: "hutang", label: "Hutang", badge: payables.filter((d) => d.status !== "lunas").length, badgeCls: hutangJt > 0 ? "bg-clay text-white" : undefined },
  ];

  return (
    <div>
      <SectionHead
        title="Pembukuan"
        desc="Pencatatan kas sederhana: jurnal harian, piutang pelanggan, dan hutang usaha."
        action={
          <button className="btn-primary px-4 py-2" onClick={() => setOpen(true)}>
            <IconPlus width={15} height={15} /> Catat Transaksi
          </button>
        }
      />

      {/* ringkasan */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Reveal>
          <div className="card card-hover relative overflow-hidden px-4 py-3.5">
            <span className="absolute right-3 top-3 text-pine/15"><IconCoins width={52} height={52} /></span>
            <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-fog">Saldo Kas & Bank</p>
            <p className="num mt-1 text-xl font-bold text-pine">{idr(Math.round(saldoAnim))}</p>
            <p className="text-[11px] text-fog">kasir + rekening toko</p>
          </div>
        </Reveal>
        <Reveal delay={60}>
          <div className="card card-hover px-4 py-3.5">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-fog">Piutang Berjalan</p>
            <p className="num mt-1 text-xl font-bold text-tide">{idrShort(totalPiutang)}</p>
            <p className="text-[11px] text-fog">{receivables.filter((d) => d.status === "jatuh tempo").length} sudah jatuh tempo</p>
          </div>
        </Reveal>
        <Reveal delay={120}>
          <div className="card card-hover px-4 py-3.5">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-fog">Hutang Usaha</p>
            <p className="num mt-1 text-xl font-bold text-clay">{idrShort(totalHutang)}</p>
            <p className="text-[11px] text-fog">{hutangJt} tagihan perlu segera dibayar</p>
          </div>
        </Reveal>
        <Reveal delay={180}>
          <div className="card card-hover px-4 py-3.5">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-fog">Laba Bersih Periode Ini</p>
            <p className={cx("num mt-1 text-xl font-bold", masuk - keluar >= 0 ? "text-pine" : "text-clay")}>{idrShort(masuk - keluar)}</p>
            <p className="text-[11px] text-fog">masuk {idrShort(masuk)} · keluar {idrShort(keluar)}</p>
          </div>
        </Reveal>
      </div>

      {/* tabs + konten */}
      <Reveal delay={120}>
        <div className="card mt-4 overflow-hidden">
          <div className="flex flex-wrap items-center gap-2 border-b border-line bg-paper/50 px-4 py-3">
            <div className="flex rounded-lg border border-line bg-surface p-0.5">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={cx(
                    "flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-[12.5px] font-bold transition-all cursor-pointer",
                    tab === t.id ? "bg-pine text-[#f2efe2] shadow-sm" : "text-fog hover:text-ink"
                  )}
                >
                  {t.label}
                  {t.badge !== undefined && (
                    <span className={cx("num rounded px-1.5 py-0.5 text-[10px]", tab === t.id ? "bg-white/20" : t.badgeCls ?? "bg-ink/6")}>{t.badge}</span>
                  )}
                </button>
              ))}
            </div>
            {tab === "jurnal" && (
              <div className="relative ml-auto w-60">
                <IconSearch width={13} height={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fog" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari keterangan / kategori…" className="input py-1.5 pl-8 text-[12.5px]" />
              </div>
            )}
          </div>

          <div className="p-4 sm:p-5">
            {tab === "jurnal" && (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px]">
                  <thead>
                    <tr className="bg-paper/60">
                      <th className="th">ID</th>
                      <th className="th">Tanggal</th>
                      <th className="th">Keterangan</th>
                      <th className="th">Kategori</th>
                      <th className="th">Metode</th>
                      <th className="th text-right">Masuk</th>
                      <th className="th text-right">Keluar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((e, i) => (
                      <tr key={e.id} className="row-in transition-colors hover:bg-paper/60" style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}>
                        <td className="td num text-[12px] font-bold text-fog">{e.id}</td>
                        <td className="td num text-[12.5px] text-fog">{e.date}</td>
                        <td className="td font-semibold">{e.desc}</td>
                        <td className="td"><Badge tone="fog">{e.category}</Badge></td>
                        <td className="td text-[12.5px] text-fog">{e.method}</td>
                        <td className={cx("td num text-right font-bold", e.type === "masuk" ? "text-pine" : "text-transparent")}>
                          {e.type === "masuk" ? `+${num(e.amount)}` : "·"}
                        </td>
                        <td className={cx("td num text-right font-bold", e.type === "keluar" ? "text-clay" : "text-transparent")}>
                          {e.type === "keluar" ? `−${num(e.amount)}` : "·"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-paper/70">
                      <td colSpan={5} className="td font-display text-[13px] font-bold">Total Periode</td>
                      <td className="td num text-right font-bold text-pine">+{num(masuk)}</td>
                      <td className="td num text-right font-bold text-clay">−{num(keluar)}</td>
                    </tr>
                  </tfoot>
                </table>
                {filtered.length === 0 && (
                  <p className="py-8 text-center text-sm text-fog">Tidak ada catatan yang cocok dengan pencarian.</p>
                )}
              </div>
            )}

            {tab === "piutang" && <DebtTable items={receivables} kind="piutang" onSettle={settle("piutang")} />}
            {tab === "hutang" && <DebtTable items={payables} kind="hutang" onSettle={settle("hutang")} />}
          </div>
        </div>
      </Reveal>

      {/* catatan kaki edukatif */}
      <Reveal delay={160}>
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-dashed border-linedark bg-white/60 px-4 py-3.5">
          <IconBook width={17} height={17} className="mt-0.5 shrink-0 text-pine" />
          <p className="text-[12px] leading-relaxed text-fog">
            <span className="font-bold text-ink">Tips pembukuan:</span> penerimaan PO bertempo otomatis masuk ke tab Hutang, pelunasan piutang/hutang
            otomatis menambah catatan jurnal, dan penjualan kasir tercatat sebagai pemasukan. Rekonsiliasi kas idealnya dilakukan setiap tutup shift.
          </p>
        </div>
      </Reveal>

      {/* modal catat */}
      <Modal open={open} onClose={() => setOpen(false)}>
        <ModalHead title="Catat Transaksi Kas" onClose={() => setOpen(false)} />
        <div className="p-5">
          <div className="mb-4 grid grid-cols-2 gap-2">
            <button
              onClick={() => setNf({ ...nf, type: "masuk" })}
              className={cx(
                "flex items-center justify-center gap-2 rounded-lg border py-2.5 text-[13px] font-bold transition-all cursor-pointer",
                nf.type === "masuk" ? "border-pine bg-pine-soft text-pine" : "border-line text-fog hover:border-pine/40"
              )}
            >
              <IconPlus width={14} height={14} /> Pemasukan
            </button>
            <button
              onClick={() => setNf({ ...nf, type: "keluar" })}
              className={cx(
                "flex items-center justify-center gap-2 rounded-lg border py-2.5 text-[13px] font-bold transition-all cursor-pointer",
                nf.type === "keluar" ? "border-clay bg-clay-soft text-clay" : "border-line text-fog hover:border-clay/40"
              )}
            >
              Pengeluaran
            </button>
          </div>
          <label className="label">Keterangan</label>
          <input value={nf.desc} onChange={(e) => setNf({ ...nf, desc: e.target.value })} placeholder="cth: Servis freezer & chiller" className="input mb-3" />
          <div className="mb-3 grid grid-cols-2 gap-3">
            <div>
              <label className="label">Kategori</label>
              <select value={nf.category} onChange={(e) => setNf({ ...nf, category: e.target.value })} className="input">
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Metode</label>
              <select value={nf.method} onChange={(e) => setNf({ ...nf, method: e.target.value })} className="input">
                {METHODS.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>
          <label className="label">Nominal (Rp)</label>
          <input
            type="number"
            value={nf.amount}
            onChange={(e) => setNf({ ...nf, amount: e.target.value })}
            placeholder="0"
            className="input num mb-4 text-[15px] font-bold"
          />
          <div className="flex gap-2">
            <button className="btn-outline flex-1 py-2.5" onClick={() => setOpen(false)}>Batal</button>
            <button className="btn-primary flex-1 py-2.5" onClick={addEntry}>Simpan Catatan</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
