import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  BANKS,
  DATA_PACKAGES,
  EWALLET_NOMINALS,
  EWALLETS,
  OPERATORS,
  PULSA_NOMINALS,
  TARIK_NOMINALS,
  TOKEN_NOMINALS,
  TRANSFER_NOMINALS,
  type DigitalCat,
  type DigitalTx,
} from "../data";
import { cx, idr, idrShort, num } from "../lib/format";
import { Badge, Reveal, SectionHead, useCountUp } from "../components/ui";
import type { Toast } from "../components/ui";
import {
  IconCheck,
  IconDroplet,
  IconHistory,
  IconPlus,
  IconSend,
  IconShieldPlus,
  IconSmartphone,
  IconWallet,
  IconWifi,
  IconZap,
} from "../components/icons";

type Push = (msg: string, tone?: Toast["tone"]) => void;

const FEE: Record<string, number> = {
  pulsa: 2_000, data: 2_500, ewallet: 1_500, token: 2_500, tagihan: 3_000,
  bpjs: 2_500, pdam: 2_500, transfer: 6_500, tarik: 5_000,
};
const KOMISI: Record<string, number> = {
  pulsa: 1_200, data: 2_000, ewallet: 800, token: 1_000, tagihan: 1_500,
  bpjs: 1_500, pdam: 1_500, transfer: 4_000, tarik: 3_500,
};

type Summary = {
  sub: string;
  provider: string;
  target: string;
  nominal: number;
  fee: number;
  komisi: number;
  refPrefix: string;
  catKey: string;
};

const CATS: { id: DigitalCat; label: string; desc: string; color: string; icon: ReactNode }[] = [
  { id: "pulsa", label: "Pulsa", desc: "Semua operator prabayar", color: "#d92c20", icon: <IconSmartphone width={17} height={17} /> },
  { id: "data", label: "Paket Data", desc: "Internet & combo operator", color: "#1268b3", icon: <IconWifi width={17} height={17} /> },
  { id: "ewallet", label: "E-Wallet", desc: "GoPay, OVO, DANA, dll.", color: "#00a4a0", icon: <IconWallet width={17} height={17} /> },
  { id: "listrik", label: "Listrik PLN", desc: "Token & pascabayar", color: "#d3921f", icon: <IconZap width={17} height={17} /> },
  { id: "bpjs", label: "BPJS Kesehatan", desc: "Iuran bulanan peserta", color: "#17593e", icon: <IconShieldPlus width={17} height={17} /> },
  { id: "pdam", label: "Air / PDAM", desc: "Tagihan air daerah", color: "#35657f", icon: <IconDroplet width={17} height={17} /> },
  { id: "transfer", label: "Transfer & Tarik", desc: "Kirim ke bank, tarik tunai", color: "#6d3fa8", icon: <IconSend width={17} height={17} /> },
];

const formatId = (s: string) => s.replace(/\D/g, "").replace(/(.{4})/g, "$1-").replace(/-$/, "");

const billFrom = (idStr: string, kind: "tagihan" | "bpjs" | "pdam") => {
  let h = 7;
  for (const c of idStr) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  if (kind === "tagihan") {
    const month = h % 2 ? "Januari 2026" : "Desember 2025";
    return { label: `Tagihan ${month}`, detail: `Daya R1/1300 VA · ${month}`, amount: 118_000 + (h % 260) * 1_000 };
  }
  if (kind === "bpjs") {
    const n = 2 + (h % 3);
    return { label: `${n} Peserta · Kelas 3`, detail: `Iuran ${n} × Rp 35.000 · bulan berjalan`, amount: n * 35_000 };
  }
  return { label: "Tagihan Air", detail: `Pemakaian ${12 + (h % 18)} m³ · bulan berjalan`, amount: 32_000 + (h % 95) * 1_000 };
};

function NominalChips({ values, fee, value, onSelect }: { values: number[]; fee: number; value: number | null; onSelect: (n: number) => void }) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {values.map((n) => (
        <button
          key={n}
          onClick={() => onSelect(n)}
          className={cx(
            "rounded-lg border px-2 py-2 text-center transition-all cursor-pointer",
            value === n
              ? "border-pine bg-pine text-[#f2efe2] shadow-sm scale-[1.03]"
              : "border-line bg-surface hover:-translate-y-0.5 hover:border-pine/45"
          )}
        >
          <span className="num block text-[13px] font-bold">{idrShort(n)}</span>
          <span className={cx("num block text-[10px]", value === n ? "text-[#f2efe2]/75" : "text-fog")}>bayar {idrShort(n + fee)}</span>
        </button>
      ))}
    </div>
  );
}

function ProviderChips<T extends { id: string; label: string; color: string }>({
  items,
  active,
  onSelect,
}: {
  items: T[];
  active: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((o) => {
        const on = active === o.id;
        return (
          <button
            key={o.id}
            onClick={() => onSelect(o.id)}
            className={cx(
              "flex items-center gap-2 rounded-lg border px-3 py-2 text-[12.5px] font-bold transition-all cursor-pointer",
              on ? "border-transparent text-white shadow-sm" : "border-line bg-surface text-fog hover:-translate-y-0.5 hover:border-pine/40 hover:text-ink"
            )}
            style={on ? { background: o.color } : undefined}
          >
            <span
              className="num flex h-5 w-5 items-center justify-center rounded-full text-[9.5px] font-bold"
              style={{ background: on ? "rgba(255,255,255,0.28)" : `${o.color}20`, color: on ? "#fff" : o.color }}
            >
              {o.label[0]}
            </span>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Digital({
  txs,
  setTxs,
  push,
}: {
  txs: DigitalTx[];
  setTxs: React.Dispatch<React.SetStateAction<DigitalTx[]>>;
  push: Push;
}) {
  const [cat, setCat] = useState<DigitalCat>("pulsa");
  const [subMode, setSubMode] = useState<"token" | "tagihan">("token");
  const [trMode, setTrMode] = useState<"transfer" | "tarik">("transfer");
  const [operator, setOperator] = useState("telkomsel");
  const [wallet, setWallet] = useState("gopay");
  const [bank, setBank] = useState("bri");
  const [phone, setPhone] = useState("");
  const [custId, setCustId] = useState("");
  const [acct, setAcct] = useState("");
  const [nominal, setNominal] = useState<number | null>(null);
  const [pkgId, setPkgId] = useState<string | null>(null);
  const [amount, setAmount] = useState<number | null>(null);
  const [bill, setBill] = useState<ReturnType<typeof billFrom> | null>(null);
  const [checking, setChecking] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [stage, setStage] = useState<"form" | "processing" | "done">("form");
  const [procStep, setProcStep] = useState(0);
  const [lastTx, setLastTx] = useState<DigitalTx | null>(null);
  const [filter, setFilter] = useState<"semua" | DigitalCat>("semua");
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  // reset saat ganti layanan
  useEffect(() => {
    setStage("form");
    setErr(null);
    setBill(null);
    setNominal(null);
    setPkgId(null);
    setAmount(null);
  }, [cat, subMode, trMode, operator]);

  const operatorL = OPERATORS.find((o) => o.id === operator)?.label ?? "";
  const walletL = EWALLETS.find((w) => w.id === wallet)?.label ?? "";
  const bankL = BANKS.find((b) => b.id === bank)?.label ?? "";
  const packages = DATA_PACKAGES[operator] ?? [];
  const pkg = packages.find((p) => p.id === pkgId) ?? null;

  const buildSummary = (): Summary => {
    switch (cat) {
      case "pulsa":
        return { sub: `Pulsa ${operatorL}`, provider: operatorL, target: phone || "—", nominal: nominal ?? 0, fee: FEE.pulsa, komisi: KOMISI.pulsa, refPrefix: "PUL", catKey: "pulsa" };
      case "data":
        return { sub: pkg ? `Paket ${pkg.quota} ${operatorL}` : `Paket Data ${operatorL}`, provider: operatorL, target: phone || "—", nominal: pkg?.price ?? 0, fee: FEE.data, komisi: KOMISI.data, refPrefix: "DTA", catKey: "data" };
      case "ewallet":
        return { sub: `Top Up ${walletL}`, provider: walletL, target: phone || "—", nominal: nominal ?? 0, fee: FEE.ewallet, komisi: KOMISI.ewallet, refPrefix: "EWT", catKey: "ewallet" };
      case "listrik":
        return subMode === "token"
          ? { sub: "Token PLN", provider: "PLN", target: custId ? formatId(custId) : "—", nominal: nominal ?? 0, fee: FEE.token, komisi: KOMISI.token, refPrefix: "PLN", catKey: "token" }
          : { sub: "Tagihan PLN", provider: "PLN", target: custId ? formatId(custId) : "—", nominal: bill?.amount ?? 0, fee: FEE.tagihan, komisi: KOMISI.tagihan, refPrefix: "PLN", catKey: "tagihan" };
      case "bpjs":
        return { sub: "BPJS Kesehatan", provider: "BPJS", target: custId ? formatId(custId) : "—", nominal: bill?.amount ?? 0, fee: FEE.bpjs, komisi: KOMISI.bpjs, refPrefix: "BJS", catKey: "bpjs" };
      case "pdam":
        return { sub: "Tagihan PDAM", provider: "PDAM", target: custId ? formatId(custId) : "—", nominal: bill?.amount ?? 0, fee: FEE.pdam, komisi: KOMISI.pdam, refPrefix: "PDN", catKey: "pdam" };
      case "transfer":
        return trMode === "transfer"
          ? { sub: `Transfer ${bankL}`, provider: bankL, target: acct ? formatId(acct) : "—", nominal: amount ?? 0, fee: FEE.transfer, komisi: KOMISI.transfer, refPrefix: "TRF", catKey: "transfer" }
          : { sub: "Tarik Tunai", provider: "Kas Agen", target: "Kas Agen", nominal: amount ?? 0, fee: FEE.tarik, komisi: KOMISI.tarik, refPrefix: "TRK", catKey: "tarik" };
    }
  };

  const sum = buildSummary();
  const total = sum.nominal + sum.fee;

  const fail = (m: string) => {
    setErr(m);
    push(m, "warn");
  };

  const submit = () => {
    const phoneCats = cat === "pulsa" || cat === "data" || cat === "ewallet";
    if (phoneCats && !/^08\d{8,11}$/.test(phone)) return fail("Masukkan nomor HP yang valid (awali 08, 10–13 digit).");
    if ((cat === "listrik" || cat === "bpjs" || cat === "pdam") && !/^\d{9,16}$/.test(custId))
      return fail("Masukkan ID pelanggan / nomor meter yang valid (9–16 digit).");
    if (cat === "pulsa" && !nominal) return fail("Pilih nominal pulsa terlebih dahulu.");
    if (cat === "data" && !pkg) return fail("Pilih paket data terlebih dahulu.");
    if (cat === "ewallet" && !nominal) return fail("Pilih nominal top up terlebih dahulu.");
    if (cat === "listrik" && subMode === "token" && !nominal) return fail("Pilih nominal token terlebih dahulu.");
    if (((cat === "listrik" && subMode === "tagihan") || cat === "bpjs" || cat === "pdam") && !bill)
      return fail('Tekan tombol "Cek Tagihan" terlebih dahulu.');
    if (cat === "transfer" && trMode === "transfer") {
      if (!/^\d{8,16}$/.test(acct)) return fail("Masukkan nomor rekening yang valid (8–16 digit).");
      if (!amount || amount < 50_000) return fail("Nominal transfer minimal Rp 50.000.");
    }
    if (cat === "transfer" && trMode === "tarik" && !amount) return fail("Pilih nominal tarik tunai terlebih dahulu.");

    setErr(null);
    setStage("processing");
    setProcStep(0);
    timers.current.push(window.setTimeout(() => setProcStep(1), 550));
    timers.current.push(window.setTimeout(() => setProcStep(2), 1250));
    timers.current.push(
      window.setTimeout(() => {
        setProcStep(3);
        const token = sum.catKey === "token" ? Array.from({ length: 5 }, () => String(Math.floor(1000 + Math.random() * 9000))).join("-") : undefined;
        const tx: DigitalTx = {
          id: `DIG-${String(Date.now()).slice(-4)}`,
          ref: `${sum.refPrefix}-${Math.floor(10_000_000 + Math.random() * 89_999_999)}`,
          time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
          cat,
          sub: sum.sub,
          provider: sum.provider,
          target: sum.target,
          nominal: sum.nominal,
          fee: sum.fee,
          commission: sum.komisi,
          total,
          status: "sukses",
          token,
        };
        setTxs((prev) => [tx, ...prev]);
        setLastTx(tx);
        setStage("done");
        push(`Transaksi ${tx.ref} sukses · total ${idr(tx.total)}.`, "success");
      }, 1950)
    );
  };

  const resetForm = (clearTarget = false) => {
    setStage("form");
    setErr(null);
    setNominal(null);
    setPkgId(null);
    setAmount(null);
    setBill(null);
    if (clearTarget) {
      setCustId("");
      setAcct("");
    }
  };

  const checkBill = () => {
    if (!/^\d{9,16}$/.test(custId)) return fail("Masukkan ID pelanggan yang valid (9–16 digit).");
    setErr(null);
    setChecking(true);
    timers.current.push(
      window.setTimeout(() => {
        const kind = cat === "listrik" ? "tagihan" : cat === "bpjs" ? "bpjs" : "pdam";
        setBill(billFrom(custId, kind));
        setChecking(false);
        push("Tagihan ditemukan.", "info");
      }, 850)
    );
  };

  const copy = (text: string) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    push("Token disalin ke clipboard.", "info");
  };

  /* ---------- statistik ---------- */
  const sukses = txs.filter((t) => t.status === "sukses");
  const komisiTotal = sukses.reduce((s, t) => s + t.commission, 0);
  const komisiAnim = useCountUp(komisiTotal);
  const deposit = 15_000_000 - sukses.reduce((s, t) => s + t.nominal, 0);
  const countByCat = (c: DigitalCat) => txs.filter((t) => t.cat === c).length;
  const topCat = [...CATS].sort((a, b) => countByCat(b.id) - countByCat(a.id))[0];

  const procSteps = [
    "Memverifikasi data pelanggan",
    `Menghubungi server ${sum.provider || "provider"}`,
    sum.catKey === "token" ? "Menerbitkan token listrik" : "Menyelesaikan transaksi",
  ];

  const billCats = (cat === "listrik" && subMode === "tagihan") || cat === "bpjs" || cat === "pdam";
  const filteredTxs = txs.filter((t) => filter === "semua" || t.cat === filter);
  const activeCat = CATS.find((c) => c.id === cat)!;

  /* ---------- form per kategori ---------- */
  const renderForm = () => (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <div className="space-y-5">
        {(cat === "pulsa" || cat === "data") && (
          <div>
            <p className="label">Operator</p>
            <ProviderChips items={OPERATORS} active={operator} onSelect={setOperator} />
          </div>
        )}
        {cat === "ewallet" && (
          <div>
            <p className="label">Pilih E-Wallet</p>
            <ProviderChips items={EWALLETS} active={wallet} onSelect={setWallet} />
          </div>
        )}
        {cat === "transfer" && trMode === "transfer" && (
          <div>
            <p className="label">Bank Tujuan</p>
            <ProviderChips items={BANKS} active={bank} onSelect={setBank} />
          </div>
        )}

        {(cat === "pulsa" || cat === "data" || cat === "ewallet") && (
          <div>
            <p className="label">Nomor HP Pelanggan</p>
            <input
              inputMode="numeric"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 13))}
              placeholder="08xxxxxxxxxx"
              className="input num max-w-xs text-[15px] font-semibold"
            />
          </div>
        )}

        {(cat === "listrik" || cat === "bpjs" || cat === "pdam") && (
          <div>
            <p className="label">
              {cat === "listrik" ? "ID Pelanggan / No. Meter" : cat === "bpjs" ? "No. Virtual Account (VA)" : "No. Pelanggan PDAM"}
            </p>
            <div className="flex max-w-md gap-2">
              <input
                inputMode="numeric"
                value={custId}
                onChange={(e) => {
                  setCustId(e.target.value.replace(/\D/g, "").slice(0, 16));
                  setBill(null);
                }}
                placeholder={cat === "bpjs" ? "0001xxxxxxxxxxxx" : "5371xxxxxxxx"}
                className="input num text-[15px] font-semibold"
              />
              {billCats && (
                <button onClick={checkBill} disabled={checking} className="btn-outline shrink-0 px-4">
                  {checking ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-pine/30 border-t-pine" />
                  ) : (
                    "Cek Tagihan"
                  )}
                </button>
              )}
            </div>
            {bill && (
              <div className="pop mt-3 flex max-w-md items-center justify-between gap-3 rounded-lg border border-pine/30 bg-pine-soft/60 px-4 py-3">
                <div>
                  <p className="text-[13px] font-bold">{bill.label}</p>
                  <p className="text-[11.5px] text-fog">{bill.detail}</p>
                </div>
                <p className="num text-[15px] font-bold text-pine">{idr(bill.amount)}</p>
              </div>
            )}
          </div>
        )}

        {cat === "transfer" && trMode === "transfer" && (
          <div>
            <p className="label">Nomor Rekening Tujuan</p>
            <input
              inputMode="numeric"
              value={acct}
              onChange={(e) => setAcct(e.target.value.replace(/\D/g, "").slice(0, 16))}
              placeholder="8830xxxxxxxx"
              className="input num max-w-xs text-[15px] font-semibold"
            />
          </div>
        )}

        {cat === "pulsa" && (
          <div>
            <p className="label">Nominal Pulsa</p>
            <NominalChips values={PULSA_NOMINALS} fee={FEE.pulsa} value={nominal} onSelect={setNominal} />
          </div>
        )}

        {cat === "data" && (
          <div>
            <p className="label">Paket Data {operatorL}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {packages.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPkgId(p.id)}
                  className={cx(
                    "rounded-lg border p-3 text-left transition-all cursor-pointer",
                    pkgId === p.id ? "border-pine bg-pine-soft/70 shadow-sm scale-[1.01]" : "border-line bg-surface hover:-translate-y-0.5 hover:border-pine/40"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13.5px] font-bold">{p.quota}</span>
                    <span className="num text-[13.5px] font-bold text-pine">{idr(p.price)}</span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-fog">{p.name} · aktif {p.valid}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {cat === "ewallet" && (
          <div>
            <p className="label">Nominal Top Up</p>
            <NominalChips values={EWALLET_NOMINALS} fee={FEE.ewallet} value={nominal} onSelect={setNominal} />
          </div>
        )}

        {cat === "listrik" && subMode === "token" && (
          <div>
            <p className="label">Nominal Token</p>
            <NominalChips values={TOKEN_NOMINALS} fee={FEE.token} value={nominal} onSelect={setNominal} />
          </div>
        )}

        {cat === "transfer" && trMode === "transfer" && (
          <div>
            <p className="label">Nominal Transfer (min. Rp 50 rb)</p>
            <input
              inputMode="numeric"
              value={amount ?? ""}
              onChange={(e) => setAmount(e.target.value ? Math.max(0, Number(e.target.value)) : null)}
              placeholder="0"
              className="input num max-w-xs text-[15px] font-bold"
            />
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {TRANSFER_NOMINALS.map((n) => (
                <button
                  key={n}
                  onClick={() => setAmount(n)}
                  className={cx(
                    "btn-outline px-3 py-1.5 text-[11.5px] num",
                    amount === n && "border-pine! bg-pine-soft!"
                  )}
                >
                  {idrShort(n)}
                </button>
              ))}
            </div>
          </div>
        )}

        {cat === "transfer" && trMode === "tarik" && (
          <div>
            <p className="label">Nominal Tarik Tunai</p>
            <NominalChips values={TARIK_NOMINALS} fee={FEE.tarik} value={amount} onSelect={setAmount} />
            <p className="mt-2.5 rounded-lg bg-honey-soft/60 px-3.5 py-2.5 text-[12px] font-medium text-[#8a5f10]">
              Pelanggan menerima uang tunai dari kas agen sebesar nominal yang dipilih, lalu membayar nominal + biaya admin.
            </p>
          </div>
        )}
      </div>

      {/* ringkasan */}
      <div className="lg:sticky lg:top-4">
        <div className="rounded-xl border border-dashed border-linedark bg-white p-4">
          <p className="mb-3 text-[10.5px] font-bold uppercase tracking-[0.14em] text-fog">Ringkasan</p>
          <dl className="space-y-2 text-[13px]">
            <div className="flex justify-between gap-3"><dt className="text-fog">Layanan</dt><dd className="text-right font-bold">{sum.sub}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-fog">Tujuan</dt><dd className="num text-right font-semibold">{sum.target}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-fog">Nominal</dt><dd className="num text-right font-semibold">{sum.nominal ? idr(sum.nominal) : "—"}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-fog">Biaya admin</dt><dd className="num text-right font-semibold">{idr(sum.fee)}</dd></div>
            <div className="flex items-baseline justify-between gap-3 border-t border-dashed border-linedark pt-2.5">
              <dt className="font-display font-bold">Total</dt>
              <dd className="num text-[19px] font-bold text-pine">{idr(total)}</dd>
            </div>
          </dl>
          <p className="mt-2.5 inline-flex rounded-md bg-honey-soft px-2 py-1 text-[11px] font-bold text-[#8a5f10]">
            Komisi agen +{idr(sum.komisi)}
          </p>
          {err && <p className="mt-3 rounded-md bg-clay-soft px-3 py-2 text-[12px] font-semibold text-clay">{err}</p>}
          <button onClick={submit} className="btn-primary mt-3.5 w-full py-2.5">
            <IconZap width={15} height={15} /> Proses Transaksi
          </button>
          <p className="mt-2.5 text-center text-[10.5px] text-fog">Dana dipotong dari saldo deposit agen</p>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <SectionHead
        title="Layanan Digital"
        desc="Kios agen ala BRILink — pulsa, PPOB, e-wallet, dan transfer dengan komisi otomatis."
        action={<Badge tone="pine" className="px-2.5! py-1.5!">Saldo deposit {idrShort(deposit)}</Badge>}
      />

      {/* statistik */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Reveal>
          <div className="card card-hover px-4 py-3.5">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-fog">Transaksi Hari Ini</p>
            <p className="num mt-1 text-xl font-bold">{num(txs.length)}</p>
            <p className="text-[11px] text-fog">di kios ini</p>
          </div>
        </Reveal>
        <Reveal delay={60}>
          <div className="card card-hover px-4 py-3.5">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-fog">Komisi Hari Ini</p>
            <p className="num mt-1 text-xl font-bold text-pine">{idr(Math.round(komisiAnim))}</p>
            <p className="text-[11px] text-fog">pendapatan agen</p>
          </div>
        </Reveal>
        <Reveal delay={120}>
          <div className="card card-hover px-4 py-3.5">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-fog">Saldo Deposit Agen</p>
            <p className="num mt-1 text-xl font-bold">{idrShort(deposit)}</p>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink/8">
              <div className="bar-fill h-full rounded-full bg-pine" style={{ width: `${Math.max(4, (deposit / 15_000_000) * 100)}%` }} />
            </div>
          </div>
        </Reveal>
        <Reveal delay={180}>
          <div className="card card-hover px-4 py-3.5">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-fog">Layanan Terlaris</p>
            <p className="mt-1 flex items-center gap-2 text-[17px] font-bold" style={{ color: topCat.color }}>
              {topCat.icon}
              {topCat.label}
            </p>
            <p className="text-[11px] text-fog">{countByCat(topCat.id)} transaksi hari ini</p>
          </div>
        </Reveal>
      </div>

      {/* panel utama */}
      <div className="mt-5 grid gap-5 lg:grid-cols-[290px_1fr]">
        {/* rail kategori */}
        <Reveal className="space-y-2">
          {CATS.map((c) => (
            <button
              key={c.id}
              onClick={() => setCat(c.id)}
              className={cx(
                "flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-all cursor-pointer",
                cat === c.id
                  ? "border-pine-deep bg-pine-deep text-[#f2efe2] shadow-lg -translate-y-0.5"
                  : "border-line bg-surface hover:-translate-y-0.5 hover:border-pine/40"
              )}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                style={{ background: cat === c.id ? "rgba(255,255,255,0.12)" : `${c.color}18`, color: cat === c.id ? "#f2d9a0" : c.color }}
              >
                {c.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13.5px] font-bold leading-tight">{c.label}</span>
                <span className={cx("block text-[10.5px]", cat === c.id ? "text-[#f2efe2]/60" : "text-fog")}>{c.desc}</span>
              </span>
              <span className={cx("num rounded-md px-1.5 py-0.5 text-[10.5px] font-bold", cat === c.id ? "bg-white/15 text-[#f2efe2]" : "bg-ink/6 text-fog")}>
                {countByCat(c.id)}
              </span>
            </button>
          ))}
        </Reveal>

        {/* panel transaksi */}
        <Reveal delay={100}>
          <section className="card overflow-hidden">
            <div className="flex flex-wrap items-center gap-3 border-b border-line bg-paper/50 px-5 py-4">
              <div className="min-w-0">
                <p className="font-display text-[17px] font-bold leading-tight">{activeCat.label}</p>
                <p className="text-[11.5px] text-fog">
                  {cat === "transfer" && trMode === "tarik"
                    ? "Tarik tunai tanpa kartu lewat kas agen"
                    : `Biaya admin dibebankan ke pelanggan · ${activeCat.desc}`}
                </p>
              </div>
              {cat === "listrik" && (
                <div className="ml-auto flex rounded-lg border border-line bg-surface p-0.5">
                  {(["token", "tagihan"] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setSubMode(m)}
                      className={cx(
                        "rounded-md px-3.5 py-1.5 text-[12px] font-bold capitalize transition-all cursor-pointer",
                        subMode === m ? "bg-pine text-[#f2efe2] shadow-sm" : "text-fog hover:text-ink"
                      )}
                    >
                      {m === "token" ? "Token Prabayar" : "Pascabayar"}
                    </button>
                  ))}
                </div>
              )}
              {cat === "transfer" && (
                <div className="ml-auto flex rounded-lg border border-line bg-surface p-0.5">
                  {(["transfer", "tarik"] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setTrMode(m)}
                      className={cx(
                        "rounded-md px-3.5 py-1.5 text-[12px] font-bold transition-all cursor-pointer",
                        trMode === m ? "bg-pine text-[#f2efe2] shadow-sm" : "text-fog hover:text-ink"
                      )}
                    >
                      {m === "transfer" ? "Kirim ke Bank" : "Tarik Tunai"}
                    </button>
                  ))}
                </div>
              )}
              {(cat !== "listrik" && cat !== "transfer") && (
                <Badge tone="honey" className="ml-auto">Admin {idr(sum.fee)}</Badge>
              )}
            </div>

            {stage === "form" && <div className="p-5">{renderForm()}</div>}

            {stage === "processing" && (
              <div className="flex flex-col items-center px-5 py-14 text-center">
                <div className="relative h-16 w-16">
                  <div className="absolute inset-0 animate-spin rounded-full border-[3px] border-dashed border-pine/40" style={{ animationDuration: "1.4s" }} />
                  <div className="absolute inset-0 flex items-center justify-center text-pine">
                    <IconZap width={26} height={26} />
                  </div>
                </div>
                <p className="font-display mt-4 text-lg font-bold">Memproses {sum.sub}…</p>
                <p className="num text-[13px] text-fog">Total {idr(total)} · {sum.target}</p>
                <ul className="mt-5 space-y-2.5 text-left">
                  {procSteps.map((s, i) => (
                    <li key={s} className={cx("flex items-center gap-2.5 text-[13px] transition-colors duration-300", procStep > i ? "text-ink" : "text-fog/45")}>
                      <span
                        className={cx(
                          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all duration-300",
                          procStep > i ? "border-pine bg-pine text-[#f2efe2]" : "border-linedark bg-surface"
                        )}
                      >
                        {procStep > i && <IconCheck width={11} height={11} />}
                      </span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {stage === "done" && lastTx && (
              <div className="mx-auto max-w-sm px-5 py-8">
                <div className="flex flex-col items-center text-center">
                  <span className="check-pop flex h-14 w-14 items-center justify-center rounded-full bg-pine text-[#f2efe2]">
                    <IconCheck width={26} height={26} />
                  </span>
                  <h3 className="font-display mt-3 text-xl font-bold">{lastTx.sub} Berhasil</h3>
                  <p className="num mt-0.5 text-[12px] text-fog">{lastTx.ref} · {lastTx.time} WIB</p>
                </div>
                <div className="num mt-5 rounded-xl border border-dashed border-linedark bg-white p-4 text-[12.5px]">
                  <div className="flex justify-between gap-3"><span className="text-fog">Tujuan</span><span className="font-semibold">{lastTx.target}</span></div>
                  <div className="flex justify-between gap-3"><span className="text-fog">Nominal</span><span className="font-semibold">{idr(lastTx.nominal)}</span></div>
                  <div className="flex justify-between gap-3"><span className="text-fog">Biaya admin</span><span className="font-semibold">{idr(lastTx.fee)}</span></div>
                  <div className="mt-2 flex justify-between gap-3 border-t border-dashed border-linedark pt-2 text-[14px] font-bold">
                    <span>Total Dibayar</span><span className="text-pine">{idr(lastTx.total)}</span>
                  </div>
                  <p className="mt-2.5 inline-flex rounded-md bg-honey-soft px-2 py-1 text-[11px] font-bold text-[#8a5f10]">
                    Komisi agen +{idr(lastTx.commission)}
                  </p>
                  {lastTx.token && (
                    <>
                      <div className="my-3 border-t border-dashed border-linedark" />
                      <p className="text-center text-[10px] font-bold uppercase tracking-[0.2em] text-fog">Token / Stroom</p>
                      <p className="mt-1 text-center text-[17px] font-bold tracking-wide text-pine">{lastTx.token}</p>
                      <button onClick={() => copy(lastTx.token!)} className="btn-outline mt-3 w-full py-2 text-[12px]">
                        Salin Token
                      </button>
                    </>
                  )}
                </div>
                <button className="btn-primary mt-4 w-full py-2.5" onClick={() => resetForm(true)}>
                  <IconPlus width={15} height={15} /> Transaksi Baru
                </button>
              </div>
            )}
          </section>
        </Reveal>
      </div>

      {/* riwayat */}
      <Reveal delay={120}>
        <section className="card mt-5 overflow-hidden">
          <div className="flex flex-wrap items-center gap-2 border-b border-line px-5 py-4">
            <IconHistory width={17} height={17} className="text-pine" />
            <h3 className="font-display text-[16px] font-bold">Riwayat Transaksi Digital</h3>
            <div className="ml-auto flex flex-wrap gap-1.5">
              <button
                onClick={() => setFilter("semua")}
                className={cx(
                  "rounded-full border px-3 py-1 text-[11.5px] font-bold transition-all cursor-pointer",
                  filter === "semua" ? "border-pine bg-pine text-[#f2efe2]" : "border-line bg-surface text-fog hover:text-ink"
                )}
              >
                Semua
              </button>
              {CATS.filter((c) => countByCat(c.id) > 0).map((c) => (
                <button
                  key={c.id}
                  onClick={() => setFilter(c.id)}
                  className={cx(
                    "rounded-full border px-3 py-1 text-[11.5px] font-bold transition-all cursor-pointer",
                    filter === c.id ? "border-pine bg-pine text-[#f2efe2]" : "border-line bg-surface text-fog hover:text-ink"
                  )}
                >
                  {c.label} · {countByCat(c.id)}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px]">
              <thead>
                <tr className="bg-paper/60">
                  <th className="th">Waktu / Ref</th>
                  <th className="th">Layanan</th>
                  <th className="th">Tujuan</th>
                  <th className="th text-right">Nominal</th>
                  <th className="th text-right">Admin</th>
                  <th className="th text-right">Komisi</th>
                  <th className="th">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredTxs.map((t) => {
                  const meta = CATS.find((c) => c.id === t.cat)!;
                  return (
                    <tr key={t.id} className="row-in transition-colors hover:bg-paper/60">
                      <td className="td">
                        <p className="num text-[13px] font-bold">{t.time}</p>
                        <p className="num text-[10.5px] text-fog">{t.ref}</p>
                      </td>
                      <td className="td">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md" style={{ background: `${meta.color}16`, color: meta.color }}>
                            {meta.icon}
                          </span>
                          <div>
                            <p className="text-[13px] font-semibold leading-tight">{t.sub}</p>
                            <p className="text-[10.5px] text-fog">{t.provider}</p>
                          </div>
                        </div>
                      </td>
                      <td className="td num text-[12px] text-fog">{t.target}</td>
                      <td className="td num text-right font-semibold">{idr(t.nominal)}</td>
                      <td className="td num text-right text-fog">{idr(t.fee)}</td>
                      <td className="td num text-right font-bold text-pine">+{idr(t.commission)}</td>
                      <td className="td">
                        <Badge tone={t.status === "sukses" ? "pine" : t.status === "diproses" ? "honey" : "clay"}>
                          {t.status === "sukses" ? "Sukses" : t.status === "diproses" ? "Diproses" : "Gagal"}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredTxs.length === 0 && (
            <p className="px-5 py-10 text-center text-sm text-fog">Belum ada transaksi pada kategori ini.</p>
          )}
        </section>
      </Reveal>
    </div>
  );
}
