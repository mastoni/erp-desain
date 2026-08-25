import { useEffect, useState } from "react";
import {
  AUTOPORT_SLOTS,
  compactFollowers,
  estimateReach,
  followersTotal,
  formatCountdown,
  genCaption,
  genTags,
  nextSlotDate,
  type AutoPostCfg,
  type PostStatus,
  type ScheduledPost,
  type SocialAccount,
  type SocialPlatform,
} from "../promosi";
import type { Product } from "../data";
import { cx, num } from "../lib/format";
import { Badge, Reveal, SectionHead, Switch } from "../components/ui";
import type { Toast } from "../components/ui";
import { ModuleGate } from "./WAGateway";
import { IconCheck, IconMegaphone, IconPlus, IconTrash, IconWhatsapp, IconZap } from "../components/icons";

type Push = (msg: string, tone?: Toast["tone"]) => void;

const PLATFORM_MONO: Record<SocialPlatform, string> = {
  instagram: "IG",
  facebook: "f",
  tiktok: "TT",
  x: "X",
};

const STATUS_META: Record<PostStatus, { label: string; tone: "honey" | "tide" | "pine" }> = {
  draf: { label: "Draf", tone: "honey" },
  terjadwal: { label: "Terjadwal", tone: "tide" },
  terbit: { label: "Terbit", tone: "pine" },
};

function Countdown({ slot }: { slot: string }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(i);
  }, []);
  const ms = nextSlotDate(slot).getTime() - Date.now();
  return <span className="num tabular-nums">{formatCountdown(ms)}</span>;
}

export function SocialMedia({
  active,
  accounts,
  setAccounts,
  posts,
  setPosts,
  autoCfg,
  setAutoCfg,
  products,
  storeName,
  waActive,
  onBroadcast,
  push,
  onGoLangganan,
}: {
  active: boolean;
  accounts: SocialAccount[];
  setAccounts: React.Dispatch<React.SetStateAction<SocialAccount[]>>;
  posts: ScheduledPost[];
  setPosts: React.Dispatch<React.SetStateAction<ScheduledPost[]>>;
  autoCfg: AutoPostCfg;
  setAutoCfg: React.Dispatch<React.SetStateAction<AutoPostCfg>>;
  products: Product[];
  storeName: string;
  waActive: boolean;
  onBroadcast: (caption: string) => void;
  push: Push;
  onGoLangganan: () => void;
}) {
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [caption, setCaption] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [picked, setPicked] = useState<SocialPlatform[]>(["instagram"]);
  const [postTime, setPostTime] = useState("16:00");

  const connected = accounts.filter((a) => a.connected);
  const scheduled = posts.filter((p) => p.status === "terjadwal").length;
  const published = posts.filter((p) => p.status === "terbit");
  const reach = published.reduce((s, p) => s + p.reach, 0);

  const generate = () => {
    const p = products.find((x) => x.id === productId);
    if (!p) return;
    setCaption(genCaption(p, storeName));
    setTags(genTags(p));
    push(`Caption untuk "${p.name}" dibuat oleh generator.`, "info");
  };

  const togglePick = (id: SocialPlatform) => {
    const acc = accounts.find((a) => a.id === id);
    if (!acc?.connected) {
      push(`${acc?.label ?? "Akun"} belum terhubung — hubungkan dulu di daftar akun.`, "warn");
      return;
    }
    setPicked((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  };

  const save = (status: PostStatus) => {
    if (!caption.trim()) {
      push("Tulis atau buat caption terlebih dahulu.", "warn");
      return;
    }
    if (status === "terjadwal" && picked.length === 0) {
      push("Pilih minimal satu platform tujuan.", "warn");
      return;
    }
    const post: ScheduledPost = {
      id: `sp-${Date.now()}`,
      caption: caption.trim(),
      tags,
      platforms: status === "terjadwal" ? picked : [],
      date: status === "terjadwal" ? "Hari ini" : "—",
      time: status === "terjadwal" ? postTime : "—",
      status,
      reach: 0,
      kind: "promo",
    };
    setPosts((prev) => [post, ...prev]);
    setCaption("");
    setTags([]);
    push(
      status === "terjadwal"
        ? `Postingan terjadwal pukul ${postTime} ke ${picked.length} platform.`
        : "Draf postingan disimpan.",
      "success"
    );
  };

  const publishNow = (id: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, status: "terbit", reach: estimateReach(followersTotal(accounts)), date: "Hari ini", time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) }
          : p
      )
    );
    push("Postingan diterbitkan sekarang ke semua platform terpilih.");
  };

  const remove = (id: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
    push("Postingan dihapus dari antrian.", "warn");
  };

  if (!active)
    return (
      <ModuleGate
        name="Social Media Autoposting"
        desc="Jadwalkan sekali, terbit otomatis ke Instagram, Facebook, TikTok, dan X. Generator caption mengubah produk toko Anda menjadi konten promosi harian."
        color="#e1306c"
        icon={<IconMegaphone width={30} height={30} />}
        onGoLangganan={onGoLangganan}
      />
    );

  return (
    <div>
      <SectionHead
        title="Social Media Autoposting"
        desc="Promosi tenant: konten terjadwal & mesin autopost multi-platform."
        action={
          <div className="flex items-center gap-2">
            <Badge tone="honey" className="px-2.5! py-1.5!">
              <IconZap width={12} height={12} /> Autopost berikutnya: <Countdown slot={autoCfg.slot} />
            </Badge>
            <Badge tone="pine" className="px-2.5! py-1.5!">{connected.length} akun terhubung</Badge>
          </div>
        }
      />

      {/* KPI */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { l: "Terjadwal", v: num(scheduled), s: "menunggu terbit", cls: "text-tide" },
          { l: "Terbit Bulan Ini", v: num(published.length), s: "semua platform", cls: "text-pine" },
          { l: "Estimasi Jangkauan", v: num(reach), s: "akun terjangkau", cls: "text-[#e1306c]" },
          { l: "Total Pengikut", v: compactFollowers(followersTotal(accounts)), s: "akun terhubung", cls: "text-[#8a5f10]" },
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
        {/* kolom kiri: akun + mesin autopost */}
        <div className="space-y-4">
          <Reveal delay={80}>
            <section className="card p-5">
              <h3 className="font-display mb-3 text-[15px] font-bold">Akun Terhubung</h3>
              <ul className="space-y-2.5">
                {accounts.map((a) => (
                  <li key={a.id} className={cx("flex items-center gap-3 rounded-lg border px-3.5 py-3 transition-colors", a.connected ? "border-line bg-paper/50" : "border-dashed border-linedark bg-white/60 opacity-80")}>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-display text-[12px] font-bold text-white" style={{ background: a.color, opacity: a.connected ? 1 : 0.45 }}>
                      {PLATFORM_MONO[a.id]}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[12.5px] font-bold leading-tight">{a.label}</p>
                      <p className="num truncate text-[10.5px] text-fog">{a.handle} · {compactFollowers(a.followers)} pengikut</p>
                    </div>
                    <Switch
                      on={a.connected}
                      onChange={(v) => {
                        setAccounts((acc) => acc.map((x) => (x.id === a.id ? { ...x, connected: v } : x)));
                        if (!v) setPicked((p) => p.filter((x) => x !== a.id));
                        push(v ? `${a.label} terhubung via OAuth.` : `${a.label} diputus.`, v ? "success" : "info");
                      }}
                    />
                  </li>
                ))}
              </ul>
            </section>
          </Reveal>

          <Reveal delay={140}>
            <section className="card p-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-display text-[15px] font-bold">Mesin Autopost</h3>
                <span className="num rounded-md bg-pine-deep px-2.5 py-1 text-[12px] font-bold text-honey">
                  <Countdown slot={autoCfg.slot} />
                </span>
              </div>
              {[
                { k: "katalogHarian" as const, l: "Katalog produk harian", d: "Produk terlaris jadi postingan tiap hari" },
                { k: "promoStok" as const, l: "Promo stok menipis", d: "Otomat saat SKU menyentuh batas minimum" },
                { k: "storyOmzet" as const, l: "Story rekap omzet", d: "Ringkasan mingguan ke Instagram Story" },
              ].map((r) => (
                <div key={r.k} className="flex items-center justify-between gap-3 border-b border-line/60 py-2.5 last:border-0">
                  <div>
                    <p className="text-[12.5px] font-bold leading-tight">{r.l}</p>
                    <p className="text-[10.5px] text-fog">{r.d}</p>
                  </div>
                  <Switch on={autoCfg[r.k]} onChange={(v) => { setAutoCfg((c) => ({ ...c, [r.k]: v })); push(`${r.l} ${v ? "diaktifkan" : "dimatikan"}.`); }} />
                </div>
              ))}
              <label className="label mt-3.5">Jam Terbit Otomatis</label>
              <div className="grid grid-cols-4 gap-1.5">
                {AUTOPORT_SLOTS.map((s) => (
                  <button
                    key={s}
                    onClick={() => { setAutoCfg((c) => ({ ...c, slot: s })); push(`Jam autopost diubah ke ${s}.`); }}
                    className={cx(
                      "num rounded-lg border py-2 text-[12px] font-bold transition-all cursor-pointer",
                      autoCfg.slot === s ? "border-pine bg-pine text-[#f2efe2] shadow-sm" : "border-line bg-surface text-fog hover:border-pine/40"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <p className="mt-3 rounded-lg bg-paper/70 px-3 py-2 text-[11px] leading-relaxed text-fog">
                Konten autopost mengambil data langsung dari inventaris & penjualan tenant — tidak perlu bikin materi manual.
              </p>
            </section>
          </Reveal>
        </div>

        {/* kolom kanan: composer + antrian */}
        <div className="space-y-4">
          <Reveal delay={100}>
            <section className="card overflow-hidden">
              <div className="flex flex-wrap items-center gap-3 border-b border-line bg-paper/50 px-5 py-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#e1306c]/12 text-[#e1306c]">
                  <IconPlus width={17} height={17} />
                </span>
                <div>
                  <h3 className="font-display text-[15px] font-bold leading-tight">Buat Postingan</h3>
                  <p className="text-[11.5px] text-fog">Generator caption memakai data produk asli tenant</p>
                </div>
              </div>
              <div className="p-5">
                <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                  <div>
                    <label className="label">Dari Produk</label>
                    <select value={productId} onChange={(e) => setProductId(e.target.value)} className="input">
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>{p.name} — {num(p.price)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button className="btn-honey w-full px-5 py-2 sm:w-auto" onClick={generate}>
                      <IconZap width={14} height={14} /> Buat Caption
                    </button>
                  </div>
                </div>

                <label className="label mt-3">Caption</label>
                <textarea rows={4} value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Tulis caption, atau pakai generator di atas…" className="input resize-none text-[13px] leading-relaxed" />

                {tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {tags.map((t) => (
                      <span key={t} className="num rounded-md bg-tide-soft px-2 py-1 text-[10.5px] font-bold text-tide">{t}</span>
                    ))}
                  </div>
                )}

                <div className="mt-3.5 grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="label">Platform Tujuan</label>
                    <div className="flex flex-wrap gap-1.5">
                      {accounts.map((a) => (
                        <button
                          key={a.id}
                          onClick={() => togglePick(a.id)}
                          className={cx(
                            "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11.5px] font-bold transition-all cursor-pointer",
                            picked.includes(a.id) ? "border-transparent text-white shadow-sm" : a.connected ? "border-line bg-surface text-fog hover:border-pine/40" : "border-dashed border-linedark text-fog/50"
                          )}
                          style={picked.includes(a.id) ? { background: a.color } : undefined}
                        >
                          <span className="font-display">{PLATFORM_MONO[a.id]}</span>
                          {a.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="label">Jam Terbit (Hari Ini)</label>
                    <select value={postTime} onChange={(e) => setPostTime(e.target.value)} className="input num">
                      {["09:00", "10:30", "13:00", "16:00", "19:30", "20:00"].map((t) => (
                        <option key={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <button className="btn-outline flex-1 py-2.5" onClick={() => save("draf")}>Simpan Draf</button>
                  <button className="btn-primary flex-[1.4] py-2.5" onClick={() => save("terjadwal")}>
                    <IconCheck width={15} height={15} /> Jadwalkan Postingan
                  </button>
                </div>
              </div>
            </section>
          </Reveal>

          <Reveal delay={160}>
            <section className="card overflow-hidden">
              <div className="border-b border-line px-5 py-3.5">
                <h3 className="font-display text-[15px] font-bold">Antrian Konten</h3>
              </div>
              <ul className="divide-y divide-line/70">
                {posts.map((p) => (
                  <li key={p.id} className="row-in px-5 py-3.5 transition-colors hover:bg-paper/50">
                    <div className="flex flex-wrap items-start gap-3">
                      <div className="flex gap-1 pt-0.5">
                        {p.platforms.length ? (
                          p.platforms.map((pl) => {
                            const acc = accounts.find((a) => a.id === pl);
                            return (
                              <span key={pl} className="flex h-6 w-6 items-center justify-center rounded-md font-display text-[9.5px] font-bold text-white" style={{ background: acc?.color ?? "#68746c" }}>
                                {PLATFORM_MONO[pl]}
                              </span>
                            );
                          })
                        ) : (
                          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-ink/8 font-display text-[9.5px] font-bold text-fog">?</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-semibold leading-snug">{p.caption}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          <Badge tone={STATUS_META[p.status].tone}>{STATUS_META[p.status].label}</Badge>
                          {p.status === "terjadwal" && (
                            <span className="num text-[11px] font-bold text-tide">{p.date} · {p.time}</span>
                          )}
                          {p.status === "terbit" && (
                            <span className="num text-[11px] text-fog">{p.date} · jangkauan {num(p.reach)}</span>
                          )}
                          {p.tags.slice(0, 3).map((t) => (
                            <span key={t} className="num text-[10px] text-tide">{t}</span>
                          ))}
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-1.5">
                        {p.status !== "terbit" && (
                          <button onClick={() => publishNow(p.id)} className="btn-outline px-2.5 py-1.5 text-[11px]" title="Terbitkan sekarang">
                            <IconZap width={12} height={12} /> Terbitkan
                          </button>
                        )}
                        {p.status === "terjadwal" && (
                          <button
                            onClick={() => onBroadcast(p.caption)}
                            className={cx("btn-outline px-2.5 py-1.5 text-[11px]", waActive ? "text-[#1f8f5f] hover:border-[#1f8f5f]/50 hover:bg-[#1f8f5f]/10" : "")}
                            title={waActive ? "Broadcast promo ini via WhatsApp Gateway" : "Aktifkan WhatsApp Gateway dulu"}
                          >
                            <IconWhatsapp width={12} height={12} /> Broadcast WA
                          </button>
                        )}
                        <button onClick={() => remove(p.id)} className="btn-outline px-2 py-1.5 text-clay hover:border-clay/50 hover:bg-clay-soft/50" title="Hapus">
                          <IconTrash width={12} height={12} />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              {posts.length === 0 && <p className="px-5 py-10 text-center text-sm text-fog">Antrian kosong — buat postingan pertama Anda.</p>}
            </section>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
