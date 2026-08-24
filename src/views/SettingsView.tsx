import { useEffect, useRef, useState, type ReactNode } from "react";
import { DEFAULT_CONFIG, DEVICES, PRINTER_MODELS, PRODUCTS, type StoreConfig } from "../data";
import { cx, idr, num } from "../lib/format";
import { Barcode } from "../components/charts";
import { Reveal, SectionHead, Switch } from "../components/ui";
import type { Toast } from "../components/ui";
import {
  IconBarcode,
  IconBuilding,
  IconCheck,
  IconDrawer,
  IconPrinter,
  IconScan,
  IconSliders,
  IconStore,
} from "../components/icons";

type Push = (msg: string, tone?: Toast["tone"]) => void;

const SECTIONS = [
  { id: "toko", label: "Info Toko", icon: <IconStore width={16} height={16} /> },
  { id: "printer", label: "Struk & Printer", icon: <IconPrinter width={16} height={16} /> },
  { id: "barcode", label: "Barcode & Label", icon: <IconBarcode width={16} height={16} /> },
  { id: "scanner", label: "Scanner", icon: <IconScan width={16} height={16} /> },
  { id: "laci", label: "Laci Kasir", icon: <IconDrawer width={16} height={16} /> },
  { id: "perangkat", label: "Perangkat", icon: <IconSliders width={16} height={16} /> },
];

function SettingCard({
  id,
  icon,
  title,
  desc,
  children,
  side,
}: {
  id: string;
  icon: ReactNode;
  title: string;
  desc: string;
  children: ReactNode;
  side?: ReactNode;
}) {
  return (
    <section id={id} className="card scroll-mt-24 overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 border-b border-line bg-paper/50 px-5 py-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-pine-soft text-pine">{icon}</span>
        <div className="min-w-0">
          <h3 className="font-display text-[16px] font-bold leading-tight">{title}</h3>
          <p className="text-[11.5px] text-fog">{desc}</p>
        </div>
        {side && <div className="ml-auto">{side}</div>}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function ToggleRow({
  label,
  desc,
  on,
  onChange,
}: {
  label: string;
  desc: string;
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-line bg-surface px-4 py-3 transition-colors hover:border-pine/30">
      <div>
        <p className="text-[13.5px] font-bold leading-tight">{label}</p>
        <p className="mt-0.5 text-[11.5px] text-fog">{desc}</p>
      </div>
      <Switch on={on} onChange={onChange} />
    </div>
  );
}

export function SettingsView({
  config,
  onSave,
  push,
}: {
  config: StoreConfig;
  onSave: (c: StoreConfig) => void;
  push: Push;
}) {
  const [draft, setDraft] = useState<StoreConfig>(config);
  const [active, setActive] = useState("toko");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [lastScan, setLastScan] = useState<string | null>(null);
  const drawerTimer = useRef<number | null>(null);

  useEffect(() => {
    setDraft(config);
  }, [config]);

  useEffect(() => () => {
    if (drawerTimer.current) window.clearTimeout(drawerTimer.current);
  }, []);

  const dirty = JSON.stringify(draft) !== JSON.stringify(config);
  const set = (patch: Partial<StoreConfig>) => setDraft((d) => ({ ...d, ...patch }));

  const goto = (id: string) => {
    setActive(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const testDrawer = () => {
    setDrawerOpen(true);
    if (drawerTimer.current) window.clearTimeout(drawerTimer.current);
    drawerTimer.current = window.setTimeout(() => setDrawerOpen(false), 1500);
    push(`Perintah buka laci dikirim (${draft.drawer.delayMs} ms) — laci kasir terbuka.`, "info");
  };

  const testScan = () => {
    const p = PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)];
    setLastScan(`${draft.barcode.prefix}${p.sku} · ${p.name}`);
    push(draft.scanner.sound ? "Pindai berhasil (bunyi aktif)." : "Pindai berhasil.", "info");
  };

  const paperW = draft.printer.paper === "58mm" ? "w-[190px]" : "w-[252px]";

  return (
    <div>
      <SectionHead
        title="Pengaturan Toko"
        desc="Konfigurasi perangkat kasir: struk, barcode, scanner, dan laci kasir."
        action={
          dirty ? (
            <span className="flex items-center gap-2 rounded-lg border border-honey/50 bg-honey-soft px-3 py-2 text-[12px] font-bold text-[#8a5f10]">
              <span className="h-1.5 w-1.5 rounded-full bg-honey" /> Perubahan belum disimpan
            </span>
          ) : (
            <span className="flex items-center gap-1.5 rounded-lg border border-pine/25 bg-pine-soft px-3 py-2 text-[12px] font-bold text-pine">
              <IconCheck width={13} height={13} /> Tersinkron
            </span>
          )
        }
      />

      <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
        {/* nav seksi */}
        <Reveal>
          <nav className="lg:sticky lg:top-24 space-y-1">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => goto(s.id)}
                className={cx(
                  "flex w-full items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-left text-[13px] font-semibold transition-all cursor-pointer",
                  active === s.id
                    ? "bg-pine-deep text-[#f2efe2] shadow-md -translate-y-0.5"
                    : "bg-surface border border-line text-fog hover:border-pine/40 hover:text-ink"
                )}
              >
                <span className={active === s.id ? "text-honey" : ""}>{s.icon}</span>
                {s.label}
              </button>
            ))}
            <div className="mt-3 rounded-xl border border-dashed border-linedark bg-white p-3.5">
              <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-fog">Kasir Aktif</p>
              <p className="mt-1 text-[12.5px] font-bold">Rani Wijaya · Shift Pagi</p>
              <p className="num text-[11px] text-fog">Terminal KSR-01 · online</p>
            </div>
          </nav>
        </Reveal>

        {/* konten */}
        <div className="space-y-5">
          {/* info toko */}
          <Reveal>
            <SettingCard id="toko" icon={<IconStore width={17} height={17} />} title="Info Toko" desc="Identitas yang tercetak di struk dan label.">
              <div className="grid gap-3.5 sm:grid-cols-2">
                <div>
                  <label className="label">Nama Toko</label>
                  <input value={draft.storeName} onChange={(e) => set({ storeName: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="label">Telepon</label>
                  <input value={draft.phone} onChange={(e) => set({ phone: e.target.value })} className="input num" />
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Alamat</label>
                  <input value={draft.address} onChange={(e) => set({ address: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="label">PPN / Pajak (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={30}
                    value={draft.taxRate}
                    onChange={(e) => set({ taxRate: Math.max(0, Math.min(30, Number(e.target.value) || 0)) })}
                    className="input num"
                  />
                </div>
                <div>
                  <label className="label">Pesan Footer Struk</label>
                  <input value={draft.footer} onChange={(e) => set({ footer: e.target.value })} className="input" />
                </div>
              </div>
            </SettingCard>
          </Reveal>

          {/* printer */}
          <Reveal delay={60}>
            <SettingCard
              id="printer"
              icon={<IconPrinter width={17} height={17} />}
              title="Struk & Printer"
              desc="Ukuran kertas, pemotong otomatis, dan tampilan struk."
              side={
                <button
                  className="btn-outline px-3.5 py-2 text-[12px]"
                  onClick={() => push(`Tes cetak dikirim ke ${draft.printer.model}.`, "info")}
                >
                  <IconPrinter width={14} height={14} /> Tes Cetak
                </button>
              }
            >
              <div className="grid gap-5 md:grid-cols-[1fr_260px]">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Model Printer</label>
                      <select value={draft.printer.model} onChange={(e) => setDraft((d) => ({ ...d, printer: { ...d.printer, model: e.target.value } }))} className="input">
                        {PRINTER_MODELS.map((m) => (
                          <option key={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="label">Ukuran Kertas</label>
                      <div className="flex rounded-lg border border-line bg-surface p-0.5">
                        {(["58mm", "80mm"] as const).map((s) => (
                          <button
                            key={s}
                            onClick={() => setDraft((d) => ({ ...d, printer: { ...d.printer, paper: s } }))}
                            className={cx(
                              "flex-1 rounded-md py-1.5 text-[12px] font-bold transition-all cursor-pointer",
                              draft.printer.paper === s ? "bg-pine text-[#f2efe2] shadow-sm" : "text-fog hover:text-ink"
                            )}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="label">Jumlah Rangkap: <span className="num text-pine">{draft.printer.copies}×</span></label>
                    <input
                      type="range"
                      min={1}
                      max={3}
                      value={draft.printer.copies}
                      onChange={(e) => setDraft((d) => ({ ...d, printer: { ...d.printer, copies: Number(e.target.value) } }))}
                      className="w-full accent-[#17593e]"
                    />
                  </div>
                  <div className="space-y-2">
                    <ToggleRow label="Cetak logo toko" desc="Logo tampil di kepala struk." on={draft.printer.printLogo} onChange={(v) => setDraft((d) => ({ ...d, printer: { ...d.printer, printLogo: v } }))} />
                    <ToggleRow label="Potong kertas otomatis" desc="Auto-cutter aktif setelah struk selesai." on={draft.printer.autoCut} onChange={(v) => setDraft((d) => ({ ...d, printer: { ...d.printer, autoCut: v } }))} />
                    <ToggleRow label="Cetak struk otomatis" desc="Struk langsung dicetak saat pembayaran sukses." on={draft.autoPrint} onChange={(v) => set({ autoPrint: v })} />
                  </div>
                </div>

                {/* pratinjau struk */}
                <div className="flex flex-col items-center">
                  <p className="mb-2 text-[10.5px] font-bold uppercase tracking-[0.14em] text-fog">Pratinjau · {draft.printer.paper}</p>
                  <div className={cx("num rounded-sm border border-line bg-white px-3 py-3.5 text-[10px] leading-relaxed shadow-sm transition-all duration-300", paperW)}>
                    {draft.printer.printLogo && (
                      <div className="mx-auto mb-1.5 flex h-8 w-8 items-center justify-center rounded bg-pine-deep text-[8px] font-bold text-honey">LM</div>
                    )}
                    <p className="text-center text-[11px] font-bold">{draft.storeName.toUpperCase()}</p>
                    <p className="text-center text-fog">{draft.address}</p>
                    <p className="text-center text-fog">{draft.phone}</p>
                    <div className="my-1.5 border-t border-dashed border-linedark" />
                    <p className="flex justify-between"><span>Beras Rojolele 5 kg</span><span>68.000</span></p>
                    <p className="flex justify-between"><span>Kopi Susu Aren ×2</span><span>30.000</span></p>
                    <div className="my-1.5 border-t border-dashed border-linedark" />
                    <p className="flex justify-between"><span>PPN {draft.taxRate}%</span><span>{num(Math.round(98000 * draft.taxRate / 100))}</span></p>
                    <p className="flex justify-between text-[11px] font-bold"><span>TOTAL</span><span>{num(98000 + Math.round(98000 * draft.taxRate / 100))}</span></p>
                    <div className="my-1.5 border-t border-dashed border-linedark" />
                    <p className="text-center text-fog">{draft.footer}</p>
                    {draft.printer.copies > 1 && <p className="mt-1 text-center font-bold">— rangkap {draft.printer.copies} —</p>}
                  </div>
                </div>
              </div>
            </SettingCard>
          </Reveal>

          {/* barcode */}
          <Reveal delay={90}>
            <SettingCard id="barcode" icon={<IconBarcode width={17} height={17} />} title="Barcode & Label" desc="Format barcode dan tampilan label harga produk.">
              <div className="grid gap-5 md:grid-cols-[1fr_260px]">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Format Barcode</label>
                      <div className="flex rounded-lg border border-line bg-surface p-0.5">
                        {(["EAN-13", "CODE128"] as const).map((s) => (
                          <button
                            key={s}
                            onClick={() => setDraft((d) => ({ ...d, barcode: { ...d.barcode, format: s } }))}
                            className={cx(
                              "flex-1 rounded-md py-1.5 text-[12px] font-bold transition-all cursor-pointer",
                              draft.barcode.format === s ? "bg-pine text-[#f2efe2] shadow-sm" : "text-fog hover:text-ink"
                            )}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="label">Prefiks Toko</label>
                      <input
                        value={draft.barcode.prefix}
                        onChange={(e) => setDraft((d) => ({ ...d, barcode: { ...d.barcode, prefix: e.target.value.replace(/\D/g, "").slice(0, 6) } }))}
                        className="input num"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="label">Ukuran Label</label>
                    <div className="flex rounded-lg border border-line bg-surface p-0.5">
                      {(["kecil", "sedang"] as const).map((s) => (
                        <button
                          key={s}
                          onClick={() => setDraft((d) => ({ ...d, barcode: { ...d.barcode, labelSize: s } }))}
                          className={cx(
                            "flex-1 rounded-md py-1.5 text-[12px] font-bold capitalize transition-all cursor-pointer",
                            draft.barcode.labelSize === s ? "bg-pine text-[#f2efe2] shadow-sm" : "text-fog hover:text-ink"
                          )}
                        >
                          {s} · {s === "kecil" ? "30×20" : "40×30"} mm
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <ToggleRow label="Buat barcode otomatis" desc="SKU baru langsung mendapat nomor barcode berprefiks." on={draft.barcode.autoGenerate} onChange={(v) => setDraft((d) => ({ ...d, barcode: { ...d.barcode, autoGenerate: v } }))} />
                    <ToggleRow label="Tampilkan harga di label" desc="Harga jual tercetak di bawah barcode." on={draft.barcode.showPrice} onChange={(v) => setDraft((d) => ({ ...d, barcode: { ...d.barcode, showPrice: v } }))} />
                  </div>
                </div>

                {/* pratinjau label */}
                <div className="flex flex-col items-center">
                  <p className="mb-2 text-[10.5px] font-bold uppercase tracking-[0.14em] text-fog">Pratinjau Label</p>
                  <div
                    className={cx(
                      "rounded-md border-[1.5px] border-ink/70 bg-white text-center shadow-sm transition-all duration-300",
                      draft.barcode.labelSize === "kecil" ? "w-[210px] p-2.5" : "w-[250px] p-3.5"
                    )}
                  >
                    <p className="text-[8.5px] font-bold uppercase tracking-[0.2em] text-fog">{draft.storeName}</p>
                    <p className="mt-1 text-[12px] font-bold leading-snug">Beras Rojolele 5 kg</p>
                    <Barcode value={`${draft.barcode.prefix}SMB-01`} className="mx-auto mt-2 h-10 w-[85%] fill-ink" />
                    <p className="num mt-1 text-[10px] tracking-[0.16em]">{draft.barcode.prefix}SMB-01</p>
                    {draft.barcode.showPrice && <p className="num mt-1.5 inline-block rounded border border-ink/60 px-2 py-0.5 text-[14px] font-bold">{idr(68000)}</p>}
                  </div>
                </div>
              </div>
            </SettingCard>
          </Reveal>

          {/* scanner */}
          <Reveal delay={120}>
            <SettingCard
              id="scanner"
              icon={<IconScan width={17} height={17} />}
              title="Barcode Scanner"
              desc="Perangkat pemindai di meja kasir."
              side={
                <button className="btn-outline px-3.5 py-2 text-[12px]" onClick={testScan}>
                  <IconScan width={14} height={14} /> Uji Pindai
                </button>
              }
            >
              <div className="space-y-3">
                <div>
                  <label className="label">Tipe Koneksi</label>
                  <div className="flex max-w-xs rounded-lg border border-line bg-surface p-0.5">
                    {(["USB HID", "Bluetooth"] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => setDraft((d) => ({ ...d, scanner: { ...d.scanner, type: s } }))}
                        className={cx(
                          "flex-1 rounded-md py-1.5 text-[12px] font-bold transition-all cursor-pointer",
                          draft.scanner.type === s ? "bg-pine text-[#f2efe2] shadow-sm" : "text-fog hover:text-ink"
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <ToggleRow label="Enter otomatis setelah pindai" desc="Produk langsung masuk keranjang tanpa tekan Enter." on={draft.scanner.autoEnter} onChange={(v) => setDraft((d) => ({ ...d, scanner: { ...d.scanner, autoEnter: v } }))} />
                  <ToggleRow label="Bunyi beep" desc="Umpan balik suara saat barcode terbaca." on={draft.scanner.sound} onChange={(v) => setDraft((d) => ({ ...d, scanner: { ...d.scanner, sound: v } }))} />
                </div>
                <div className="flex items-center gap-3 rounded-lg border border-dashed border-linedark bg-white px-4 py-3">
                  <span className={cx("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors", lastScan ? "bg-pine text-[#f2efe2]" : "bg-ink/6 text-fog")}>
                    <IconScan width={17} height={17} />
                  </span>
                  {lastScan ? (
                    <p key={lastScan} className="num pop text-[13px] font-bold">{lastScan}</p>
                  ) : (
                    <p className="text-[12.5px] text-fog">Belum ada pindai pada sesi ini — tekan "Uji Pindai".</p>
                  )}
                </div>
              </div>
            </SettingCard>
          </Reveal>

          {/* laci kasir */}
          <Reveal delay={150}>
            <SettingCard
              id="laci"
              icon={<IconDrawer width={17} height={17} />}
              title="Laci Kasir (Cash Drawer)"
              desc="Kapan laci terbuka dan delay solenoid."
              side={
                <button className="btn-honey px-3.5 py-2 text-[12px]" onClick={testDrawer}>
                  <IconDrawer width={14} height={14} /> Uji Buka Laci
                </button>
              }
            >
              <div className="grid gap-5 md:grid-cols-[1fr_240px]">
                <div className="space-y-2">
                  <ToggleRow label="Buka saat pembayaran sukses" desc="Laci terbuka otomatis setelah struk terbit." on={draft.drawer.openOnPayment} onChange={(v) => setDraft((d) => ({ ...d, drawer: { ...d.drawer, openOnPayment: v } }))} />
                  <ToggleRow label="Buka saat shift dimulai" desc="Untuk menghitung modal awal kasir." on={draft.drawer.openOnShift} onChange={(v) => setDraft((d) => ({ ...d, drawer: { ...d.drawer, openOnShift: v } }))} />
                  <div className="mt-3">
                    <label className="label">
                      Delay solenoid: <span className="num text-pine">{draft.drawer.delayMs} ms</span>
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={1000}
                      step={100}
                      value={draft.drawer.delayMs}
                      onChange={(e) => setDraft((d) => ({ ...d, drawer: { ...d.drawer, delayMs: Number(e.target.value) } }))}
                      className="w-full accent-[#d3921f]"
                    />
                  </div>
                </div>

                {/* ilustrasi laci */}
                <div className="flex flex-col items-center justify-center">
                  <div className="relative h-28 w-44 overflow-visible rounded-lg border-2 border-ink/25 bg-[linear-gradient(180deg,#e8e5d6,#d9d5c2)] shadow-inner">
                    <div className="absolute left-1/2 top-3 h-1.5 w-16 -translate-x-1/2 rounded-full bg-ink/25" />
                    <div
                      className={cx(
                        "absolute inset-x-2 bottom-1.5 h-14 rounded-md border border-ink/20 bg-[linear-gradient(180deg,#f5f2e4,#e2ddc9)] shadow-md transition-transform duration-500 ease-out",
                        drawerOpen && "translate-y-[46px]"
                      )}
                    >
                      <div className="mx-auto mt-2 h-1.5 w-14 rounded-full bg-pine/50" />
                      <div className="mx-auto mt-2 grid grid-cols-4 gap-1 px-3">
                        {Array.from({ length: 8 }).map((_, i) => (
                          <span key={i} className="h-2 rounded-[2px] bg-honey/60" />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className={cx("num mt-3 text-[11px] font-bold uppercase tracking-wider transition-colors", drawerOpen ? "text-pine" : "text-fog")}>
                    {drawerOpen ? "Terbuka" : "Terkunci"}
                  </p>
                </div>
              </div>
            </SettingCard>
          </Reveal>

          {/* perangkat */}
          <Reveal delay={180}>
            <SettingCard id="perangkat" icon={<IconBuilding width={17} height={17} />} title="Perangkat Terhubung" desc="Semua periferal yang terdaftar di terminal kasir ini.">
              <ul className="divide-y divide-line">
                {DEVICES.map((d) => (
                  <li key={d.id} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <span
                      className={cx(
                        "h-2.5 w-2.5 rounded-full",
                        d.status === "terhubung" ? "bg-pine pulse-dot" : "bg-ink/20"
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] font-bold leading-tight">{d.name}</p>
                      <p className="num text-[11px] text-fog">{d.port}</p>
                    </div>
                    <span
                      className={cx(
                        "rounded-md px-2 py-1 text-[10.5px] font-bold uppercase tracking-wider",
                        d.status === "terhubung" ? "bg-pine-soft text-pine" : "bg-ink/6 text-fog"
                      )}
                    >
                      {d.status}
                    </span>
                    <button
                      className="btn-outline px-3 py-1.5 text-[11.5px]"
                      onClick={() =>
                        d.status === "terhubung"
                          ? push(`Tes koneksi ${d.name} — OK (12 ms).`, "success")
                          : push(`${d.name} tidak merespons. Periksa kabel dan daya.`, "warn")
                      }
                    >
                      Tes
                    </button>
                  </li>
                ))}
              </ul>
            </SettingCard>
          </Reveal>

          {/* bar simpan */}
          <div className="sticky bottom-4 z-20">
            <div
              className={cx(
                "flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur transition-colors",
                dirty ? "border-honey/60 bg-[#fdf6e3]/95" : "border-line bg-surface/95"
              )}
            >
              <p className="text-[12.5px] font-bold">
                {dirty ? "Ada perubahan yang belum disimpan." : "Semua pengaturan tersimpan."}
              </p>
              <div className="ml-auto flex gap-2">
                <button
                  className="btn-outline px-4 py-2"
                  disabled={!dirty}
                  onClick={() => setDraft(config)}
                >
                  Buang Perubahan
                </button>
                <button
                  className="btn-primary px-5 py-2"
                  disabled={!dirty}
                  onClick={() => {
                    onSave(draft);
                    push("Pengaturan toko disimpan dan diterapkan ke semua terminal.");
                  }}
                >
                  <IconCheck width={15} height={15} /> Simpan Pengaturan
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
