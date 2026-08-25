import { useEffect, useMemo, useRef, useState } from "react";
import { CUSTOMERS } from "../data";
import { WA_TEMPLATES, type WaChannel, type WaMsg, type WaStatus } from "../promosi";
import type { RtrwCustomer } from "../subscription";
import { cx, idr, num } from "../lib/format";
import { Badge, Reveal, SectionHead } from "../components/ui";
import type { Toast } from "../components/ui";
import {
  IconCheck,
  IconKey,
  IconMegaphone,
  IconPlus,
  IconQr,
  IconRefresh,
  IconSend,
  IconTrash,
  IconWhatsapp,
} from "../components/icons";

type Push = (msg: string, tone?: Toast["tone"]) => void;

const STATUS_META: Record<WaStatus, { label: string; tone: "fog" | "tide" | "pine" | "clay" }> = {
  antri: { label: "Antri", tone: "fog" },
  terkirim: { label: "Terkirim", tone: "tide" },
  dibaca: { label: "Dibaca", tone: "pine" },
  gagal: { label: "Gagal", tone: "clay" },
};

function hashPhone(name: string): string {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const d = (n: number) => String(1000 + (h % n)).slice(-4);
  return `+62 8${12 + (h % 8)}-${d(9000)}-${d(7000)}`;
}

export function ModuleGate({
  name,
  desc,
  color,
  icon,
  onGoLangganan,
}: {
  name: string;
  desc: string;
  color: string;
  icon: React.ReactNode;
  onGoLangganan: () => void;
}) {
  return (
    <div className="view-enter mx-auto max-w-xl">
      <div className="card relative overflow-hidden p-8 text-center">
        <span className="absolute inset-x-0 top-0 h-1.5" style={{ background: color }} />
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: `${color}16`, color }}>
          {icon}
        </span>
        <h2 className="font-display mt-4 text-[22px] font-bold">{name}</h2>
        <p className="mx-auto mt-2 max-w-md text-[13.5px] leading-relaxed text-fog">{desc}</p>
        <p className="mt-4 inline-flex items-center gap-2 rounded-lg border border-honey/50 bg-honey-soft px-3.5 py-2 text-[12px] font-bold text-[#8a5f10]">
          Modul belum aktif untuk tenant ini
        </p>
        <div className="mt-5 flex justify-center gap-2">
          <button className="btn-primary px-5 py-2.5" onClick={onGoLangganan}>
            Aktifkan di Menu Langganan
          </button>
        </div>
        <p className="num mt-4 text-[10.5px] text-fog">Aktivasi prorata · langsung menyatu dengan dasbor tenant yang sama</p>
      </div>
    </div>
  );
}

export function WAGateway({
  active,
  channels,
  setChannels,
  msgs,
  setMsgs,
  rtrwCustomers,
  sendWa,
  push,
  onGoLangganan,
}: {
  active: boolean;
  channels: WaChannel[];
  setChannels: React.Dispatch<React.SetStateAction<WaChannel[]>>;
  msgs: WaMsg[];
  setMsgs: React.Dispatch<React.SetStateAction<WaMsg[]>>;
  rtrwCustomers: RtrwCustomer[];
  sendWa: (to: string, content: string, kind: WaMsg["kind"]) => boolean;
  push: Push;
  onGoLangganan: () => void;
}) {
  const [tplId, setTplId] = useState("tpl2");
  const [body, setBody] = useState(WA_TEMPLATES[1].body);
  const [audience, setAudience] = useState("semua");
  const [apiKey, setApiKey] = useState("skm_wa_live_9f2k••••••••3f9a");
  const [autoReply, setAutoReply] = useState(true);
  const [filter, setFilter] = useState<"semua" | WaStatus>("semua");
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  const audiences = useMemo(
    () => [
      { id: "semua", label: `Semua Pelanggan (${CUSTOMERS.length})` },
      { id: "gold", label: `Member Gold (${CUSTOMERS.filter((c) => c.tier === "Gold").length})` },
      { id: "rtrw", label: `Pelanggan RTRW Aktif (${rtrwCustomers.filter((c) => c.status === "aktif").length})` },
      { id: "nunggak", label: `RTRW Menunggak (${rtrwCustomers.filter((c) => c.status === "menunggak").length})` },
    ],
    [rtrwCustomers]
  );

  const stats = useMemo(() => {
    const out = msgs.filter((x) => x.status !== "antri");
    const read = msgs.filter((x) => x.status === "dibaca").length;
    const fail = msgs.filter((x) => x.status === "gagal").length;
    return {
      sent: out.length,
      rate: out.length ? Math.round(((read + out.length - read - fail) / out.length) * 100) : 0,
      readRate: out.length ? Math.round((read / out.length) * 100) : 0,
      channels: channels.filter((c) => c.status === "terhubung").length,
    };
  }, [msgs, channels]);

  const filtered = msgs.filter((x) => filter === "semua" || x.status === filter);

  const recipientPool = useMemo(() => {
    switch (audience) {
      case "gold":
        return CUSTOMERS.filter((c) => c.tier === "Gold").map((c) => ({ name: c.name, phone: c.phone.replace(/^0/, "+62 ") }));
      case "rtrw":
        return rtrwCustomers.filter((c) => c.status === "aktif").map((c) => ({ name: c.name, phone: hashPhone(c.name) }));
      case "nunggak":
        return rtrwCustomers.filter((c) => c.status === "menunggak").map((c) => ({ name: c.name, phone: hashPhone(c.name) }));
      default:
        return CUSTOMERS.map((c) => ({ name: c.name, phone: c.phone.replace(/^0/, "+62 ") }));
    }
  }, [audience, rtrwCustomers]);

  const broadcast = () => {
    const text = body.trim();
    if (!text) {
      push("Isi pesan broadcast terlebih dahulu.", "warn");
      return;
    }
    const targets = recipientPool.slice(0, 8);
    const created: WaMsg[] = targets.map((t, i) => ({
      id: `wm-${Date.now()}-${i}`,
      ts: Date.now(),
      time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      to: t.phone,
      kind: "broadcast",
      content: text.replace(/\{\{nama\}\}/g, t.name.split(" ")[0]).replace(/\{\{toko\}\}/g, "SKM Mart"),
      status: "antri",
    }));
    setMsgs((prev) => [...created, ...prev].slice(0, 60));
    push(`Broadcast masuk antrian — ${recipientPool.length} penerima (batch ${targets.length} ditampilkan).`, "info");

    const ids = created.map((c) => c.id);
    timers.current.push(
      window.setTimeout(() => setMsgs((prev) => prev.map((x) => (ids.includes(x.id) ? { ...x, status: "terkirim" } : x))), 1000)
    );
    timers.current.push(
      window.setTimeout(
        () =>
          setMsgs((prev) =>
            prev.map((x, i) => (ids.includes(x.id) ? { ...x, status: i % 7 === 3 ? "gagal" : "dibaca" } : x))
          ),
        2600
      )
    );
  };

  const retry = (id: string) => {
    setMsgs((prev) => prev.map((x) => (x.id === id ? { ...x, status: "antri" } : x)));
    timers.current.push(window.setTimeout(() => setMsgs((prev) => prev.map((x) => (x.id === id ? { ...x, status: "terkirim" } : x))), 1100));
    push("Pesan dikirim ulang.", "info");
  };

  const regenKey = () => {
    const sfx = Math.random().toString(16).slice(2, 6);
    setApiKey(`skm_wa_live_${sfx}••••••••${sfx.split("").reverse().join("")}`);
    push("API key baru diterbitkan — key lama langsung tidak berlaku.");
  };

  if (!active)
    return (
      <ModuleGate
        name="WhatsApp Gateway"
        desc="Broadcast promo, pengingat tagihan RTRW, notifikasi pesanan, dan auto-reply — semua keluar dari nomor resmi tenant Anda dan tercatat di satu dasbor."
        color="#1f8f5f"
        icon={<IconWhatsapp width={30} height={30} />}
        onGoLangganan={onGoLangganan}
      />
    );

  return (
    <div>
      <SectionHead
        title="WhatsApp Gateway"
        desc="Pesan keluar tenant: broadcast, pengingat, transaksi, dan auto-reply."
        action={
          <div className="flex items-center gap-2">
            <Badge tone="pine" className="px-2.5! py-1.5!">
              <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-pine" /> Gateway Online
            </Badge>
            <button
              onClick={() => {
                setAutoReply((v) => !v);
                push(autoReply ? "Auto-reply dimatikan." : "Auto-reply aktif di luar jam operasional.");
              }}
              className={cx("btn-outline px-3.5 py-2 text-[12px]", autoReply && "border-pine/50 bg-pine-soft/70 text-pine")}
            >
              Auto-Reply: {autoReply ? "Aktif" : "Mati"}
            </button>
          </div>
        }
      />

      {/* KPI */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { l: "Pesan Keluar", v: num(stats.sent), s: "hari ini", cls: "text-ink" },
          { l: "Tingkat Terkirim", v: `${stats.rate}%`, s: "dari antrian", cls: "text-[#1f8f5f]" },
          { l: "Tingkat Dibaca", v: `${stats.readRate}%`, s: "centang biru", cls: "text-tide" },
          { l: "Kanal Terhubung", v: `${stats.channels}/${channels.length}`, s: "nomor WhatsApp", cls: "text-[#8a5f10]" },
        ].map((k, i) => (
          <Reveal key={k.l} delay={i * 60}>
            <div className="card card-hover px-4 py-3.5">
              <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-fog">{k.l}</p>
              <p className={cx("num mt-1 text-xl font-bold", k.cls)}>{k.v}</p>
              <p className="text-[11px] text-fog">{k.s}</p>
            </div>
          </Reveal>
        ))}
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[360px_1fr]">
        {/* kolom kiri */}
        <div className="space-y-4">
          <Reveal delay={80}>
            <section className="card p-4.5 p-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-display text-[15px] font-bold">Perangkat & Nomor</h3>
                <button
                  className="btn-outline px-3 py-1.5 text-[11.5px]"
                  onClick={() => {
                    setChannels((cs) => cs.map((c) => ({ ...c, status: "terputus" })));
                    window.setTimeout(() => {
                      setChannels((cs) => cs.map((c) => ({ ...c, status: "terhubung" })));
                      push("Sesi perangkat diperbarui — semua nomor terhubung ulang.");
                    }, 1200);
                  }}
                >
                  <IconRefresh width={13} height={13} /> Scan Ulang
                </button>
              </div>
              <ul className="space-y-2.5">
                {channels.map((c) => (
                  <li key={c.id} className="flex items-center gap-3 rounded-lg border border-line bg-paper/50 px-3.5 py-3">
                    <span className={cx("relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", c.status === "terhubung" ? "bg-[#1f8f5f]/12 text-[#1f8f5f]" : "bg-ink/6 text-fog")}>
                      <IconWhatsapp width={17} height={17} />
                      <span className={cx("absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-surface", c.status === "terhubung" ? "pulse-dot bg-[#1f8f5f]" : "bg-ink/25")} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[12.5px] font-bold leading-tight">{c.label}</p>
                      <p className="num text-[10.5px] text-fog">{c.number} · {c.deviceId}</p>
                    </div>
                    <Badge tone={c.status === "terhubung" ? "pine" : "fog"}>{c.status === "terhubung" ? "Terhubung" : "Terputus"}</Badge>
                  </li>
                ))}
              </ul>
            </section>
          </Reveal>

          <Reveal delay={140}>
            <section className="card p-5">
              <div className="mb-3 flex items-center gap-2">
                <IconKey width={15} height={15} className="text-pine" />
                <h3 className="font-display text-[15px] font-bold">API & Webhook</h3>
              </div>
              <label className="label">API Key Gateway</label>
              <div className="flex gap-1.5">
                <code className="num flex-1 truncate rounded-lg border border-line bg-pine-deep px-3 py-2 text-[11px] text-[#d8e4d2]">{apiKey}</code>
                <button className="btn-outline px-2.5" onClick={() => { navigator.clipboard?.writeText(apiKey).catch(() => {}); push("API key disalin.", "info"); }} title="Salin">
                  <IconQr width={14} height={14} />
                </button>
                <button className="btn-outline px-2.5" onClick={regenKey} title="Terbitkan ulang">
                  <IconRefresh width={14} height={14} />
                </button>
              </div>
              <label className="label mt-3">Webhook Transaksi</label>
              <code className="num block truncate rounded-lg border border-line bg-paper px-3 py-2 text-[10.5px] text-fog">
                https://hook.skmnet.cloud/wa/T-001
              </code>
              <p className="mt-2.5 rounded-lg bg-paper/70 px-3 py-2 text-[11px] leading-relaxed text-fog">
                Setiap penjualan POS & perubahan status pesanan memicu webhook ini — pesan notifikasi otomatis dikirim ke pelanggan.
              </p>
            </section>
          </Reveal>
        </div>

        {/* kolom kanan */}
        <div className="space-y-4">
          <Reveal delay={100}>
            <section className="card overflow-hidden">
              <div className="flex flex-wrap items-center gap-3 border-b border-line bg-paper/50 px-5 py-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1f8f5f]/12 text-[#1f8f5f]">
                  <IconMegaphone width={17} height={17} />
                </span>
                <div>
                  <h3 className="font-display text-[15px] font-bold leading-tight">Kirim Broadcast</h3>
                  <p className="text-[11.5px] text-fog">Pesan personal otomatis menyapa nama penerima</p>
                </div>
              </div>
              <div className="grid gap-4 p-5 md:grid-cols-[1fr_240px]">
                <div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="label">Template</label>
                      <select
                        value={tplId}
                        onChange={(e) => {
                          setTplId(e.target.value);
                          const t = WA_TEMPLATES.find((x) => x.id === e.target.value);
                          if (t) setBody(t.body);
                        }}
                        className="input"
                      >
                        {WA_TEMPLATES.map((t) => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                        <option value="kosong">— Pesan Kosong —</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">Audiens</label>
                      <select value={audience} onChange={(e) => setAudience(e.target.value)} className="input">
                        {audiences.map((a) => (
                          <option key={a.id} value={a.id}>{a.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <label className="label mt-3">Isi Pesan</label>
                  <textarea rows={4} value={body} onChange={(e) => setBody(e.target.value)} className="input resize-none text-[13px] leading-relaxed" />
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {["{{nama}}", "{{toko}}", "{{nominal}}", "{{tanggal}}", "{{no_pesanan}}"].map((v) => (
                      <button
                        key={v}
                        onClick={() => setBody((b) => `${b} ${v}`)}
                        className="num rounded-md border border-line bg-paper px-2 py-1 text-[10.5px] font-semibold text-fog transition hover:border-pine/50 hover:text-pine cursor-pointer"
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                  <button className="btn-primary mt-3.5 w-full py-2.5 sm:w-auto sm:px-6" onClick={broadcast}>
                    <IconSend width={15} height={15} /> Kirim ke {recipientPool.length} Penerima
                  </button>
                </div>

                {/* pratinjau bubble */}
                <div className="rounded-xl border border-dashed border-linedark bg-[#e7e4d5] p-3">
                  <p className="mb-2 text-center text-[9.5px] font-bold uppercase tracking-wider text-fog">Pratinjau · {recipientPool[0]?.name ?? "Penerima"}</p>
                  <div className="relative ml-auto max-w-[95%] rounded-xl rounded-tr-sm bg-[#d9f4c8] px-3 py-2.5 shadow-sm">
                    <p className="whitespace-pre-wrap text-[11.5px] leading-relaxed text-[#1a2620]">
                      {(body || "Tulis pesan Anda…").replace(/\{\{nama\}\}/g, (recipientPool[0]?.name ?? "Nama").split(" ")[0]).replace(/\{\{toko\}\}/g, "SKM Mart")}
                    </p>
                    <p className="num mt-1 text-right text-[8.5px] text-[#1a2620]/45">
                      {new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} ✓✓
                    </p>
                  </div>
                  <p className="num mt-2 text-center text-[9px] text-fog">via {channels[0]?.number ?? "nomor utama"}</p>
                </div>
              </div>
            </section>
          </Reveal>

          <Reveal delay={160}>
            <section className="card overflow-hidden">
              <div className="flex flex-wrap items-center gap-2 border-b border-line px-5 py-3.5">
                <h3 className="font-display text-[15px] font-bold">Antrian Pesan</h3>
                <div className="ml-auto flex flex-wrap gap-1.5">
                  {(["semua", "antri", "terkirim", "dibaca", "gagal"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={cx(
                        "rounded-full border px-3 py-1 text-[11px] font-bold capitalize transition-all cursor-pointer",
                        filter === f ? "border-pine bg-pine text-[#f2efe2]" : "border-line bg-surface text-fog hover:text-ink"
                      )}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px]">
                  <thead>
                    <tr className="bg-paper/60">
                      <th className="th">Waktu</th>
                      <th className="th">Penerima</th>
                      <th className="th">Jenis</th>
                      <th className="th">Pesan</th>
                      <th className="th">Status</th>
                      <th className="th text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.slice(0, 12).map((x) => (
                      <tr key={x.id} className="row-in transition-colors hover:bg-paper/60">
                        <td className="td num text-[12px] font-bold">{x.time}</td>
                        <td className="td num text-[12px]">{x.to}</td>
                        <td className="td">
                          <Badge tone={x.kind === "broadcast" ? "honey" : x.kind === "pengingat" ? "tide" : x.kind === "transaksi" ? "pine" : "fog"}>
                            {x.kind}
                          </Badge>
                        </td>
                        <td className="td max-w-[260px] truncate text-[12px] text-fog">{x.content}</td>
                        <td className="td"><Badge tone={STATUS_META[x.status].tone}>{STATUS_META[x.status].label}</Badge></td>
                        <td className="td text-right">
                          {x.status === "gagal" ? (
                            <button onClick={() => retry(x.id)} className="btn-outline px-2.5 py-1.5 text-[11px] text-clay hover:border-clay/50 hover:bg-clay-soft/50">
                              <IconRefresh width={12} height={12} /> Ulangi
                            </button>
                          ) : x.status === "dibaca" ? (
                            <IconCheck width={14} height={14} className="ml-auto text-pine" />
                          ) : (
                            <span className="num text-[10px] text-fog/60">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filtered.length === 0 && <p className="px-5 py-10 text-center text-sm text-fog">Tidak ada pesan pada filter ini.</p>}
              <div className="flex items-center justify-between border-t border-line bg-paper/40 px-5 py-2.5">
                <p className="num text-[10.5px] text-fog">Menampilkan {Math.min(12, filtered.length)} dari {filtered.length} pesan · biaya per pesan mengikuti paket gateway</p>
                <button
                  className="flex items-center gap-1 text-[11px] font-bold text-clay hover:underline cursor-pointer"
                  onClick={() => { setMsgs([]); push("Antrian pesan dibersihkan.", "warn"); }}
                >
                  <IconTrash width={12} height={12} /> Bersihkan
                </button>
              </div>
            </section>
          </Reveal>
        </div>
      </div>

      {/* strip keterkaitan */}
      <Reveal delay={200}>
        <div className="card mt-5 flex flex-wrap items-center gap-4 px-5 py-4">
          <IconPlus width={16} height={16} className="text-pine" />
          <p className="text-[12.5px] text-fog">
            <span className="font-bold text-ink">Terhubung otomatis:</span> pengingat tunggakan RTRW (menu Langganan), invoice tagihan, dan broadcast postingan sosmed semua tercatat di antrian ini.
          </p>
          <Badge tone="pine" className="ml-auto">1 tenant · semua kanal</Badge>
        </div>
      </Reveal>
    </div>
  );
}
