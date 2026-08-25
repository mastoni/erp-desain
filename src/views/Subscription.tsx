import { useEffect, useState } from "react";
import {
  CCTV_PLANS,
  MODULES_CATALOG,
  RTRW_BW,
  RTRW_PACKAGES,
  VOUCHER_PRESETS,
  type Camera,
  type CctvEvent,
  type Invoice,
  type ModuleDef,
  type ModuleId,
  type ModuleState,
  type RtrwCustomer,
  type Voucher,
} from "../subscription";
import type { Plan, Tenant } from "../superadmin";
import { cx, idr, idrShort, num } from "../lib/format";
import { Badge, Modal, ModalHead, Reveal, SectionHead } from "../components/ui";
import type { Toast } from "../components/ui";
import { IconCctv, IconCheck, IconPlus, IconReceipt, IconRouter, IconWallet, IconZap } from "../components/icons";

type Push = (msg: string, tone?: Toast["tone"]) => void;

const moduleIcon = (id: ModuleId, s = 18) =>
  id === "rtrw" ? <IconRouter width={s} height={s} /> : <IconCctv width={s} height={s} />;

const CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const seg = () => Array.from({ length: 4 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join("");
const genCode = () => `SKM-${seg()}-${Math.floor(1000 + Math.random() * 9000)}`;

const pkgOf = (id: string) => RTRW_PACKAGES.find((p) => p.id === id) ?? RTRW_PACKAGES[0];

function nextDue(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

/* grafik bandwidth sederhana */
function BwChart() {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(...RTRW_BW.map((d) => d.v));
  return (
    <div>
      <div className="flex h-32 items-end gap-[5px]">
        {RTRW_BW.map((d, i) => (
          <div key={d.h} className="group relative flex flex-1 items-end" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
            {hover === i && (
              <div className="absolute bottom-full left-1/2 z-10 mb-1.5 -translate-x-1/2 rounded-md bg-pine-deep px-2 py-1 text-[#f2efe2] shadow whitespace-nowrap">
                <span className="num text-[10px]">{d.h}:00 · {num(d.v)} Mbps</span>
              </div>
            )}
            <div
              className={cx("w-full rounded-t-[4px] transition-all duration-300 bar-rise", hover === i ? "bg-[#d3921f]" : "bg-[#35657f]/70 group-hover:bg-[#35657f]")}
              style={{ height: `${(d.v / max) * 100}%`, animationDelay: `${i * 40}ms` }}
            />
          </div>
        ))}
      </div>
      <div className="num mt-1.5 flex justify-between text-[9px] text-fog">
        {RTRW_BW.map((d, i) => (
          <span key={d.h} className={i % 3 === 0 ? "text-fog" : "text-transparent select-none"}>{d.h}</span>
        ))}
      </div>
    </div>
  );
}

export function Subscription({
  plans,
  tenants,
  modules,
  setModules,
  invoices,
  setInvoices,
  customers,
  setCustomers,
  vouchers,
  setVouchers,
  cameras,
  cctvPlanId,
  setCctvPlanId,
  events,
  push,
}: {
  plans: Plan[];
  tenants: Tenant[];
  modules: ModuleState[];
  setModules: React.Dispatch<React.SetStateAction<ModuleState[]>>;
  invoices: Invoice[];
  setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
  customers: RtrwCustomer[];
  setCustomers: React.Dispatch<React.SetStateAction<RtrwCustomer[]>>;
  vouchers: Voucher[];
  setVouchers: React.Dispatch<React.SetStateAction<Voucher[]>>;
  cameras: Camera[];
  cctvPlanId: string;
  setCctvPlanId: (id: string) => void;
  events: CctvEvent[];
  push: Push;
}) {
  const [tab, setTab] = useState<"tagihan" | ModuleId>("tagihan");
  const [activating, setActivating] = useState<ModuleDef | null>(null);
  const [actStage, setActStage] = useState<"confirm" | "processing" | "done">("confirm");
  const [presetIdx, setPresetIdx] = useState(1);

  useEffect(() => {
    if (tab !== "tagihan" && !modules.find((m) => m.id === tab)?.active) setTab("tagihan");
  }, [modules, tab]);

  const me = tenants.find((t) => t.id === "T-001");
  const myPlan = plans.find((p) => p.id === (me?.planId ?? "pro"));
  const isOn = (id: ModuleId) => modules.find((m) => m.id === id)?.active ?? false;
  const def = (id: ModuleId) => MODULES_CATALOG.find((m) => m.id === id)!;

  /* ---------- aktivasi modul ---------- */
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const remain = daysInMonth - now.getDate() + 1;
  const prorate = activating ? Math.round(((remain / daysInMonth) * activating.price) / 1000) * 1000 : 0;

  const startActivate = (d: ModuleDef) => {
    setActivating(d);
    setActStage("confirm");
  };

  const confirmActivate = () => {
    if (!activating) return;
    setActStage("processing");
    window.setTimeout(() => {
      setActStage("done");
      window.setTimeout(() => {
        const d = activating;
        setModules((ms) => ms.map((m) => (m.id === d.id ? { ...m, active: true, activatedAt: now.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) } : m)));
        setInvoices((inv) => [
          {
            id: `INV-${String(Date.now()).slice(-4)}`,
            label: `Modul ${d.name} (prorata ${remain} hari)`,
            period: now.toLocaleDateString("id-ID", { month: "short", year: "numeric" }),
            date: now.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }),
            due: "Hari ini",
            amount: prorate,
            status: "lunas",
          },
          ...inv,
        ]);
        setTab(d.id);
        push(`Modul ${d.name} aktif — widget ditambahkan ke dasbor.`, "success");
        setActivating(null);
      }, 900);
    }, 1100);
  };

  const deactivate = (id: ModuleId) => {
    setModules((ms) => ms.map((m) => (m.id === id ? { ...m, active: false } : m)));
    push(`Modul ${def(id).name} dinonaktifkan — widget dasbor disembunyikan.`, "warn");
  };

  /* ---------- RTRW ---------- */
  const aktif = customers.filter((c) => c.status === "aktif");
  const nunggak = customers.filter((c) => c.status === "menunggak");
  const mrr = aktif.reduce((s, c) => s + pkgOf(c.packageId).price, 0);
  const tunggakan = nunggak.reduce((s, c) => s + pkgOf(c.packageId).price, 0);
  const vTersedia = vouchers.filter((v) => v.status === "tersedia").length;

  const setStatus = (id: string, status: RtrwCustomer["status"], msg: string, tone: Toast["tone"]) => {
    setCustomers((cs) => cs.map((c) => (c.id === id ? { ...c, status, due: status === "aktif" ? nextDue() : c.due } : c)));
    push(msg, tone);
  };

  const makeVoucher = () => {
    const p = VOUCHER_PRESETS[presetIdx];
    setVouchers((vs) => [{ code: genCode(), ...p, status: "tersedia" }, ...vs]);
    push("Voucher hotspot baru berhasil dibuat.", "success");
  };

  const copyVoucher = (code: string) => {
    navigator.clipboard?.writeText(code).catch(() => {});
    push(`${code} disalin.`, "info");
  };

  /* ---------- CCTV ---------- */
  const cctvPlan = CCTV_PLANS.find((p) => p.id === cctvPlanId) ?? CCTV_PLANS[1];
  const usedTotal = cameras.reduce((s, c) => s + c.usedGb, 0);
  const camOnline = cameras.filter((c) => c.online).length;

  const tabs: { id: "tagihan" | ModuleId; label: string }[] = [
    { id: "tagihan", label: "Tagihan & Paket" },
    ...(isOn("rtrw") ? [{ id: "rtrw" as ModuleId, label: "Billing RTRW-Net" }] : []),
    ...(isOn("cctv") ? [{ id: "cctv" as ModuleId, label: "CCTV Cloud" }] : []),
  ];

  return (
    <div>
      <SectionHead
        title="Langganan & Modul Layanan"
        desc="Kelola paket SKMNet Cloud dan tambah layanan bisnis — aktifkan modul untuk memunculkannya di dasbor."
        action={
          <Badge tone="pine" className="px-2.5! py-1.5!">
            Siklus tagihan: tiap tanggal 28
          </Badge>
        }
      />

      {/* paket berjalan + katalog */}
      <div className="grid gap-4 xl:grid-cols-[330px_1fr]">
        <Reveal>
          <div className="relative h-full overflow-hidden rounded-xl border border-pine/40 bg-pine-deep p-5 text-[#f2efe2] shadow-[0_18px_40px_-18px_rgba(12,32,24,0.65)]">
            <div className="absolute -right-10 -top-14 h-44 w-44 rounded-full bg-pine/50 blur-2xl" />
            <p className="relative text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#f2efe2]/55">Paket Berjalan</p>
            <div className="relative mt-2 flex items-baseline gap-2">
              <h3 className="font-display text-[24px] font-bold">{myPlan?.name ?? "Pro"}</h3>
              <Badge tone="honey">{me?.subdomain}.skmnet.cloud</Badge>
            </div>
            <p className="num relative mt-1 text-[13px] text-[#f2efe2]/75">{idr(myPlan?.price ?? 299_000)} / bulan</p>
            <dl className="num relative mt-4 space-y-1.5 border-t border-white/10 pt-3.5 text-[12px]">
              <div className="flex justify-between"><dt className="text-[#f2efe2]/55">Perpanjangan</dt><dd className="font-bold">28 Mar 2026</dd></div>
              <div className="flex justify-between"><dt className="text-[#f2efe2]/55">Pengguna</dt><dd className="font-bold">{me?.users ?? 4} / {myPlan?.maxUsers ?? 5}</dd></div>
              <div className="flex justify-between"><dt className="text-[#f2efe2]/55">Produk</dt><dd className="font-bold">{num(me?.products ?? 26)} SKU</dd></div>
              <div className="flex justify-between"><dt className="text-[#f2efe2]/55">Modul aktif</dt><dd className="font-bold text-[#f2d9a0]">{modules.filter((m) => m.active).length} dari {modules.length}</dd></div>
            </dl>
            <div className="relative mt-4 rounded-lg bg-white/[0.07] px-3.5 py-2.5 text-[11px] leading-relaxed text-[#f2efe2]/70">
              Modul tambahan ditagih prorata saat aktivasi, lalu menyatu ke invoice bulanan.
            </div>
          </div>
        </Reveal>

        {/* katalog layanan */}
        <div className="grid gap-4 md:grid-cols-2">
          {MODULES_CATALOG.map((m, i) => {
            const st = modules.find((x) => x.id === m.id)!;
            return (
              <Reveal key={m.id} delay={i * 80}>
                <div className={cx("card card-hover relative flex h-full flex-col p-5", st.active && "shadow-[0_14px_34px_-18px_rgba(23,89,62,0.5)]")}>
                  <div className="flex items-start justify-between gap-2">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: `${m.color}16`, color: m.color }}>
                      {moduleIcon(m.id, 22)}
                    </span>
                    {st.active ? (
                      <Badge tone="pine">
                        <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-pine" /> Aktif · {st.activatedAt}
                      </Badge>
                    ) : (
                      <Badge tone="fog">Belum aktif</Badge>
                    )}
                  </div>
                  <h3 className="font-display mt-3 text-[17px] font-bold leading-tight">{m.name}</h3>
                  <p className="text-[11.5px] font-semibold" style={{ color: m.color }}>{m.tagline}</p>
                  <p className="mt-1.5 text-[12px] leading-relaxed text-fog">{m.desc}</p>
                  <ul className="mt-3 flex-1 space-y-1.5">
                    {m.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-[12px]">
                        <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full" style={{ background: `${m.color}18`, color: m.color }}>
                          <IconCheck width={9} height={9} />
                        </span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 flex items-center justify-between gap-3 border-t border-dashed border-line pt-3.5">
                    <p className="num text-[16px] font-bold">{idrShort(m.price)}<span className="text-[10.5px] font-semibold text-fog">/bln</span></p>
                    {st.active ? (
                      <div className="flex gap-2">
                        <button onClick={() => setTab(m.id)} className="btn-primary px-3.5 py-2 text-[12px]">Kelola</button>
                        <button onClick={() => deactivate(m.id)} className="btn-outline px-3 py-2 text-[12px] text-clay hover:border-clay/50 hover:bg-clay-soft/50">Matikan</button>
                      </div>
                    ) : (
                      <button onClick={() => startActivate(m)} className="btn-primary px-4 py-2 text-[12.5px]">
                        <IconPlus width={14} height={14} /> Tambah Layanan
                      </button>
                    )}
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>

      {/* tabs */}
      <div className="mt-6 flex flex-wrap gap-1.5">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cx(
              "flex items-center gap-2 rounded-lg border px-4 py-2.5 text-[13px] font-bold transition-all cursor-pointer",
              tab === t.id ? "border-pine-deep bg-pine-deep text-[#f2efe2] shadow-md -translate-y-0.5" : "border-line bg-surface text-fog hover:border-pine/40 hover:text-ink"
            )}
          >
            {t.id === "rtrw" && <IconRouter width={15} height={15} />}
            {t.id === "cctv" && <IconCctv width={15} height={15} />}
            {t.id === "tagihan" && <IconReceipt width={15} height={15} />}
            {t.label}
          </button>
        ))}
      </div>

      {/* ===== TAB TAGIHAN ===== */}
      {tab === "tagihan" && (
        <div className="view-enter mt-4 grid gap-4 xl:grid-cols-[1.55fr_1fr]">
          <Reveal>
            <div className="card overflow-hidden">
              <div className="flex items-center justify-between border-b border-line px-5 py-4">
                <h3 className="font-display text-[16px] font-bold">Riwayat Invoice</h3>
                <span className="num text-[11.5px] font-semibold text-fog">{invoices.length} invoice</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px]">
                  <thead>
                    <tr className="bg-paper/60">
                      <th className="th">Invoice</th>
                      <th className="th">Periode</th>
                      <th className="th text-right">Jumlah</th>
                      <th className="th">Jatuh Tempo</th>
                      <th className="th">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="row-in transition-colors hover:bg-paper/60">
                        <td className="td">
                          <p className="num text-[12.5px] font-bold">{inv.id}</p>
                          <p className="text-[11px] text-fog">{inv.label}</p>
                        </td>
                        <td className="td text-[12.5px] text-fog">{inv.period}</td>
                        <td className="td num text-right font-bold">{idr(inv.amount)}</td>
                        <td className="td text-[12px] text-fog">{inv.due}</td>
                        <td className="td">
                          <Badge tone={inv.status === "lunas" ? "pine" : inv.status === "menunggu" ? "honey" : "clay"}>{inv.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <div className="space-y-4">
              <div className="card p-5">
                <h3 className="font-display text-[15px] font-bold">Total Berlangganan / Bulan</h3>
                <p className="num mt-2 text-[26px] font-bold text-pine">
                  {idrShort((myPlan?.price ?? 299_000) + modules.filter((m) => m.active).reduce((s, m) => s + def(m.id).price, 0))}
                </p>
                <ul className="mt-3 space-y-1.5 border-t border-dashed border-line pt-3 text-[12.5px]">
                  <li className="num flex justify-between"><span className="text-fog">Paket {myPlan?.name ?? "Pro"}</span><span className="font-semibold">{idr(myPlan?.price ?? 299_000)}</span></li>
                  {modules.filter((m) => m.active).map((m) => (
                    <li key={m.id} className="num flex justify-between">
                      <span className="text-fog">{def(m.id).name}</span>
                      <span className="font-semibold">{idr(def(m.id).price)}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="card p-5">
                <h3 className="font-display text-[15px] font-bold">Metode Pembayaran</h3>
                <ul className="mt-3 space-y-2.5">
                  {[
                    { n: "Virtual Account BCA", d: "8808 0921 4482 11", utama: true },
                    { n: "QRIS SKMNet", d: "Scan dari aplikasi bank apa pun", utama: false },
                    { n: "Kartu Kredit •••• 4417", d: "Autodebet setiap tanggal 28", utama: false },
                  ].map((p) => (
                    <li key={p.n} className={cx("flex items-center gap-3 rounded-lg border px-3.5 py-3", p.utama ? "border-pine/40 bg-pine-soft/50" : "border-line")}>
                      <span className={cx("flex h-8 w-8 items-center justify-center rounded-lg", p.utama ? "bg-pine text-[#f2efe2]" : "bg-ink/6 text-fog")}>
                        <IconWallet width={15} height={15} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[12.5px] font-bold">{p.n}</p>
                        <p className="num truncate text-[10.5px] text-fog">{p.d}</p>
                      </div>
                      {p.utama && <Badge tone="pine">Utama</Badge>}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Reveal>
        </div>
      )}

      {/* ===== TAB RTRW ===== */}
      {tab === "rtrw" && (
        <div className="view-enter mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { l: "Pelanggan Aktif", v: num(aktif.length), s: `dari ${customers.length} sambungan`, c: "text-ink" },
              { l: "Pendapatan Jaringan", v: idrShort(mrr), s: "berulang / bulan", c: "text-[#35657f]" },
              { l: "Tunggakan", v: idrShort(tunggakan), s: `${nunggak.length} pelanggan`, c: "text-clay" },
              { l: "Voucher Tersedia", v: num(vTersedia), s: `${vouchers.length} total dibuat`, c: "text-[#8a5f10]" },
            ].map((k, i) => (
              <Reveal key={k.l} delay={i * 60}>
                <div className="card card-hover px-4 py-3.5">
                  <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-fog">{k.l}</p>
                  <p className={cx("num mt-1 text-xl font-bold", k.c)}>{k.v}</p>
                  <p className="text-[11px] text-fog">{k.s}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
            <Reveal>
              <div className="card h-full p-5">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h3 className="font-display text-[15px] font-bold">Pemakaian Bandwidth Hari Ini</h3>
                    <p className="text-[11px] text-fog">Total trafik jaringan RT/RW-Net · kapasitas 250 Mbps</p>
                  </div>
                  <Badge tone="tide">Puncak 218 Mbps</Badge>
                </div>
                <BwChart />
              </div>
            </Reveal>
            <Reveal delay={90}>
              <div className="card h-full p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-display text-[15px] font-bold">Voucher Hotspot</h3>
                  <Badge tone="honey">{vTersedia} siap jual</Badge>
                </div>
                <p className="label">Preset Voucher</p>
                <div className="grid grid-cols-2 gap-2">
                  {VOUCHER_PRESETS.map((p, i) => (
                    <button
                      key={i}
                      onClick={() => setPresetIdx(i)}
                      className={cx(
                        "rounded-lg border px-2 py-2 text-center transition-all cursor-pointer",
                        presetIdx === i ? "border-[#35657f] bg-tide-soft scale-[1.02]" : "border-line bg-surface hover:border-[#35657f]/50"
                      )}
                    >
                      <span className="num block text-[12.5px] font-bold">{p.speed} · {p.duration}</span>
                      <span className="num block text-[10.5px] text-fog">{idr(p.price)}</span>
                    </button>
                  ))}
                </div>
                <button onClick={makeVoucher} className="btn-primary mt-3 w-full py-2.5">
                  <IconZap width={15} height={15} /> Buat Voucher Baru
                </button>
                <ul className="mt-3 max-h-40 space-y-1.5 overflow-y-auto pr-1">
                  {vouchers.slice(0, 8).map((v) => (
                    <li key={v.code} className="row-in flex items-center gap-2 rounded-lg border border-line/70 bg-paper/50 px-2.5 py-1.5">
                      <button onClick={() => copyVoucher(v.code)} className="num flex-1 truncate text-left text-[11.5px] font-bold hover:text-[#35657f] cursor-pointer" title="Salin kode">
                        {v.code}
                      </button>
                      <span className="num text-[10px] text-fog">{v.speed}</span>
                      <Badge tone={v.status === "tersedia" ? "pine" : v.status === "terjual" ? "honey" : "fog"}>{v.status}</Badge>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>

          {/* pelanggan */}
          <Reveal delay={120}>
            <div className="card overflow-hidden">
              <div className="flex items-center justify-between border-b border-line px-5 py-4">
                <div>
                  <h3 className="font-display text-[16px] font-bold">Pelanggan Jaringan</h3>
                  <p className="text-[11.5px] text-fog">Tagihan bulanan, isolir, dan pemulihan sambungan.</p>
                </div>
                <Badge tone="tide">{customers.length} sambungan</Badge>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px]">
                  <thead>
                    <tr className="bg-paper/60">
                      <th className="th">Pelanggan</th>
                      <th className="th">Paket</th>
                      <th className="th text-right">Tagihan</th>
                      <th className="th">Jatuh Tempo</th>
                      <th className="th">Status</th>
                      <th className="th text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((c) => {
                      const p = pkgOf(c.packageId);
                      return (
                        <tr key={c.id} className="row-in transition-colors hover:bg-paper/60">
                          <td className="td">
                            <p className="font-bold leading-tight">{c.name}</p>
                            <p className="text-[10.5px] text-fog">{c.address} · sejak {c.joined}</p>
                          </td>
                          <td className="td">
                            <p className="text-[12.5px] font-semibold">{p.name}</p>
                            <p className="num text-[10.5px] text-fog">{p.speed}</p>
                          </td>
                          <td className="td num text-right font-bold">{idr(p.price)}</td>
                          <td className="td num text-[12px] text-fog">{c.due}</td>
                          <td className="td">
                            <Badge tone={c.status === "aktif" ? "pine" : c.status === "menunggak" ? "honey" : "clay"}>{c.status}</Badge>
                          </td>
                          <td className="td">
                            <div className="flex justify-end gap-1.5">
                              {c.status === "menunggak" && (
                                <>
                                  <button onClick={() => setStatus(c.id, "aktif", `Pembayaran ${c.name} diterima — sambungan normal.`, "success")} className="btn-outline px-2.5 py-1.5 text-[11.5px] text-pine hover:border-pine/50 hover:bg-pine-soft/60">
                                    Tandai Lunas
                                  </button>
                                  <button onClick={() => setStatus(c.id, "terisolir", `${c.name} diisolir — akses jaringan diputus sementara.`, "warn")} className="btn-outline px-2.5 py-1.5 text-[11.5px] text-clay hover:border-clay/50 hover:bg-clay-soft/50">
                                    Isolir
                                  </button>
                                </>
                              )}
                              {c.status === "terisolir" && (
                                <button onClick={() => setStatus(c.id, "aktif", `Sambungan ${c.name} dipulihkan.`, "success")} className="btn-outline px-2.5 py-1.5 text-[11.5px] text-pine hover:border-pine/50 hover:bg-pine-soft/60">
                                  Pulihkan
                                </button>
                              )}
                              {c.status === "aktif" && (
                                <button onClick={() => push(`Pengingat tagihan ${c.name} dikirim via WhatsApp.`, "info")} className="btn-outline px-2.5 py-1.5 text-[11.5px]">
                                  Kirim Tagihan
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </Reveal>
        </div>
      )}

      {/* ===== TAB CCTV ===== */}
      {tab === "cctv" && (
        <div className="view-enter mt-4 space-y-4">
          <div className="grid gap-4 xl:grid-cols-[1fr_1.4fr]">
            {/* rencana penyimpanan */}
            <Reveal>
              <div className="card h-full p-5">
                <h3 className="font-display text-[15px] font-bold">Rencana Penyimpanan</h3>
                <p className="mt-0.5 text-[11.5px] text-fog">Retensi rekaman seluruh kamera · upgrade berlaku instan.</p>
                <div className="mt-3.5 space-y-2">
                  {CCTV_PLANS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setCctvPlanId(p.id);
                        push(`Rencana penyimpanan berubah ke ${p.retention} (${p.capacityGb} GB).`, "info");
                      }}
                      className={cx(
                        "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all cursor-pointer",
                        cctvPlanId === p.id ? "border-[#bc4b2f] bg-clay-soft/50 shadow-sm" : "border-line bg-surface hover:-translate-y-0.5 hover:border-[#bc4b2f]/40"
                      )}
                    >
                      <span className={cx("flex h-9 w-9 items-center justify-center rounded-lg", cctvPlanId === p.id ? "bg-[#bc4b2f] text-white" : "bg-clay-soft text-clay")}>
                        <IconCctv width={17} height={17} />
                      </span>
                      <span className="flex-1">
                        <span className="block text-[13px] font-bold">Retensi {p.retention}</span>
                        <span className="num block text-[10.5px] text-fog">{num(p.capacityGb)} GB cloud</span>
                      </span>
                      <span className="num text-[13.5px] font-bold">{idrShort(p.price)}<span className="text-[10px] text-fog">/bln</span></span>
                    </button>
                  ))}
                </div>
                <div className="mt-4 rounded-xl border border-dashed border-linedark bg-white p-4">
                  <div className="flex items-baseline justify-between">
                    <p className="text-[12px] font-bold">Terpakai</p>
                    <p className="num text-[13px] font-bold">{num(usedTotal)} / {num(cctvPlan.capacityGb)} GB</p>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-ink/8">
                    <div className="bar-fill h-full rounded-full bg-[#bc4b2f]" style={{ width: `${Math.min(100, (usedTotal / cctvPlan.capacityGb) * 100)}%` }} />
                  </div>
                  <p className="mt-2 text-[10.5px] text-fog">Rekaman tertua otomatis dihapus setelah {cctvPlan.retention.toLowerCase()}.</p>
                </div>
              </div>
            </Reveal>

            {/* kamera */}
            <Reveal delay={80}>
              <div className="card h-full p-5">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h3 className="font-display text-[15px] font-bold">Kamera Terpasang</h3>
                    <p className="text-[11px] text-fog">{camOnline} dari {cameras.length} kamera online</p>
                  </div>
                  <Badge tone="clay">
                    <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-clay" /> {camOnline} REC
                  </Badge>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {cameras.map((c) => {
                    const share = cctvPlan.capacityGb / cameras.length;
                    return (
                      <div key={c.id} className={cx("rounded-xl border p-3.5 transition-all", c.online ? "border-line bg-surface hover:-translate-y-0.5 hover:shadow-md" : "border-dashed border-linedark bg-paper/60 opacity-75")}>
                        <div className="flex items-center justify-between">
                          <p className="num text-[10.5px] font-bold text-fog">{c.id}</p>
                          {c.online ? (
                            <span className="flex items-center gap-1.5 rounded-md bg-clay-soft px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-clay">
                              <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-clay" /> REC
                            </span>
                          ) : (
                            <span className="rounded-md bg-ink/8 px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-fog">Offline</span>
                          )}
                        </div>
                        <p className="mt-1.5 text-[13.5px] font-bold leading-tight">{c.name}</p>
                        <p className="text-[10.5px] text-fog">{c.location} · {c.resolution}</p>
                        <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-ink/8">
                          <div className={cx("h-full rounded-full", c.online ? "bg-[#bc4b2f]/80" : "bg-ink/20")} style={{ width: `${Math.min(100, (c.usedGb / share) * 100)}%` }} />
                        </div>
                        <p className="num mt-1 text-[10px] text-fog">{c.usedGb} GB tersimpan</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Reveal>
          </div>

          {/* event */}
          <Reveal delay={120}>
            <div className="card overflow-hidden">
              <div className="flex items-center justify-between border-b border-line px-5 py-4">
                <h3 className="font-display text-[16px] font-bold">Log Kejadian</h3>
                <button onClick={() => push("Tautan playback dibuka di aplikasi Android.", "info")} className="text-[12px] font-bold text-pine hover:underline cursor-pointer">
                  Buka Playback
                </button>
              </div>
              <ul className="divide-y divide-line/70">
                {events.map((e, i) => (
                  <li key={i} className="row-in flex items-center gap-3 px-5 py-3">
                    <span className={cx("flex h-2 w-2 shrink-0 rounded-full", e.tone === "warn" ? "bg-honey" : e.tone === "ok" ? "bg-pine" : "bg-tide")} />
                    <p className="flex-1 text-[13px]">{e.type}</p>
                    <span className="num text-[11px] font-bold text-fog">{e.cam}</span>
                    <span className="num text-[11px] text-fog">{e.time}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      )}

      {/* ===== modal aktivasi ===== */}
      <Modal open={!!activating} onClose={() => actStage === "confirm" && setActivating(null)} width="max-w-md">
        {activating && (
          <>
            <ModalHead title="Tambah Layanan" onClose={() => actStage === "confirm" && setActivating(null)} />
            <div className="p-5">
              {actStage === "confirm" && (
                <>
                  <div className="flex items-center gap-3 rounded-xl border border-line bg-paper/60 px-4 py-3.5">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: `${activating.color}16`, color: activating.color }}>
                      {moduleIcon(activating.id, 22)}
                    </span>
                    <div>
                      <p className="font-display text-[15.5px] font-bold leading-tight">{activating.name}</p>
                      <p className="text-[11.5px] text-fog">{activating.tagline}</p>
                    </div>
                  </div>
                  <dl className="num mt-4 space-y-2 text-[13px]">
                    <div className="flex justify-between"><dt className="text-fog">Harga modul</dt><dd className="font-bold">{idr(activating.price)} / bulan</dd></div>
                    <div className="flex justify-between"><dt className="text-fog">Prorata {remain} hari tersisa</dt><dd className="font-bold text-pine">{idr(prorate)}</dd></div>
                    <div className="flex justify-between border-t border-dashed border-linedark pt-2 text-[14.5px] font-bold"><dt>Ditagih hari ini</dt><dd className="text-pine">{idr(prorate)}</dd></div>
                  </dl>
                  <p className="mt-3 rounded-lg bg-pine-soft/60 px-3.5 py-2.5 text-[11.5px] leading-relaxed text-pine">
                    Setelah aktif, widget {activating.name} langsung muncul di dasbor dan menu pengelolaannya tersedia di halaman ini.
                  </p>
                  <div className="mt-4 flex gap-2">
                    <button className="btn-outline flex-1 py-2.5" onClick={() => setActivating(null)}>Batal</button>
                    <button className="btn-primary flex-1 py-2.5" onClick={confirmActivate}>
                      <IconZap width={15} height={15} /> Aktifkan Sekarang
                    </button>
                  </div>
                </>
              )}
              {actStage === "processing" && (
                <div className="flex flex-col items-center py-8 text-center">
                  <div className="relative h-14 w-14">
                    <div className="absolute inset-0 animate-spin rounded-full border-[3px] border-dashed border-pine/40" style={{ animationDuration: "1.3s" }} />
                    <div className="absolute inset-0 flex items-center justify-center" style={{ color: activating.color }}>
                      {moduleIcon(activating.id, 24)}
                    </div>
                  </div>
                  <p className="font-display mt-4 text-[16px] font-bold">Mengaktifkan {activating.name}…</p>
                  <p className="mt-1 text-[12px] text-fog">Menyiapkan workspace, webhook billing, dan widget dasbor.</p>
                </div>
              )}
              {actStage === "done" && (
                <div className="flex flex-col items-center py-8 text-center">
                  <span className="check-pop flex h-14 w-14 items-center justify-center rounded-full bg-pine text-[#f2efe2]">
                    <IconCheck width={26} height={26} />
                  </span>
                  <p className="font-display mt-4 text-[17px] font-bold">{activating.name} Aktif!</p>
                  <p className="mt-1 text-[12px] text-fog">Invoice prorata {idr(prorate)} diterbitkan & lunas.</p>
                </div>
              )}
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
