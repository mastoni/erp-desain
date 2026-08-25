import type { Product } from "./data";
import { idr, idrShort, num } from "./lib/format";

/* ================= WHATSAPP GATEWAY ================= */

export type WaChannel = {
  id: string;
  label: string;
  number: string;
  status: "terhubung" | "terputus";
  deviceId: string;
  linkedSince: string;
};

export type WaKind = "broadcast" | "pengingat" | "transaksi" | "auto-reply";
export type WaStatus = "antri" | "terkirim" | "dibaca" | "gagal";

export type WaMsg = {
  id: string;
  ts: number;
  time: string;
  to: string;
  kind: WaKind;
  content: string;
  status: WaStatus;
};

export type WaTemplate = { id: string; name: string; body: string };

export const WA_CHANNELS_SEED: WaChannel[] = [
  { id: "ch1", label: "Nomor Utama Toko", number: "+62 812-9000-4123", status: "terhubung", deviceId: "SKM-WA-01", linkedSince: "12 Jan 2026" },
  { id: "ch2", label: "Nomor RTRW-Net", number: "+62 857-2211-0934", status: "terhubung", deviceId: "SKM-WA-02", linkedSince: "02 Feb 2026" },
];

export const WA_TEMPLATES: WaTemplate[] = [
  {
    id: "tpl1",
    name: "Pengingat Tagihan",
    body: "Halo {{nama}}, tagihan layanan Anda sebesar {{nominal}} akan jatuh tempo pada {{tanggal}}. Mohon segera lakukan pembayaran ya. Terima kasih — {{toko}}",
  },
  {
    id: "tpl2",
    name: "Promo Mingguan",
    body: "🎉 Promo pekan ini di {{toko}}! {{produk}} hanya {{harga}} — berlaku s.d. hari Minggu. Balas PROMO untuk info lengkap.",
  },
  {
    id: "tpl3",
    name: "Pesanan Siap Diambil",
    body: "Halo {{nama}}, pesanan {{no_pesanan}} Anda sudah siap diambil di kasir. Tunjukkan pesan ini saat pengambilan ya!",
  },
  {
    id: "tpl4",
    name: "Ucapan Terima Kasih",
    body: "Terima kasih sudah berbelanja di {{toko}}! Poin member Anda bertambah {{poin}}. Sampai jumpa lagi 🙌",
  },
];

const m = (min: number) => Date.now() - min * 60_000;
const tOf = (ts: number) => new Date(ts).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

export const WA_MSGS_SEED: WaMsg[] = [
  { id: "wm1", ts: m(4), time: tOf(m(4)), to: "+62 812-3345-1908", kind: "transaksi", content: "Pesanan ORD-1048 sudah kami proses. Estimasi antar pukul 14:30.", status: "antri" },
  { id: "wm2", ts: m(16), time: tOf(m(16)), to: "+62 857-1102-3345", kind: "pengingat", content: "Tagihan internet RTRW-Net Rp 130.000 jatuh tempo 2 hari lagi.", status: "terkirim" },
  { id: "wm3", ts: m(31), time: tOf(m(31)), to: "+62 813-9034-2216", kind: "broadcast", content: "🎉 Promo pekan ini: Kopi Susu Aren hanya Rp 12.000!", status: "dibaca" },
  { id: "wm4", ts: m(47), time: tOf(m(47)), to: "+62 819-8823-7745", kind: "broadcast", content: "🎉 Promo pekan ini: Kopi Susu Aren hanya Rp 12.000!", status: "dibaca" },
  { id: "wm5", ts: m(63), time: tOf(m(63)), to: "+62 896-1120-3384", kind: "broadcast", content: "🎉 Promo pekan ini: Kopi Susu Aren hanya Rp 12.000!", status: "gagal" },
  { id: "wm6", ts: m(78), time: tOf(m(78)), to: "+62 821-7745-0912", kind: "pengingat", content: "Tagihan internet RTRW-Net Rp 175.000 jatuh tempo besok.", status: "dibaca" },
  { id: "wm7", ts: m(95), time: tOf(m(95)), to: "+62 812-3345-1908", kind: "auto-reply", content: "Terima kasih! Pesan Anda sudah kami terima — admin akan membalas pada jam operasional.", status: "terkirim" },
  { id: "wm8", ts: m(122), time: tOf(m(122)), to: "+62 852-6601-8873", kind: "transaksi", content: "Struk TRX-88225: total Rp 184.000 via QRIS. Terima kasih!", status: "dibaca" },
];

/* ================= SOCIAL MEDIA AUTOPOSTING ================= */

export type SocialPlatform = "instagram" | "facebook" | "tiktok" | "x";

export type SocialAccount = {
  id: SocialPlatform;
  label: string;
  handle: string;
  followers: number;
  connected: boolean;
  color: string;
};

export const SOCIAL_ACCOUNTS_SEED: SocialAccount[] = [
  { id: "instagram", label: "Instagram", handle: "@skmmart.jogja", followers: 4820, connected: true, color: "#e1306c" },
  { id: "facebook", label: "Facebook Page", handle: "SKM Mart Yogyakarta", followers: 2140, connected: true, color: "#1877f2" },
  { id: "tiktok", label: "TikTok", handle: "@skmmart.jogja", followers: 1315, connected: false, color: "#161823" },
  { id: "x", label: "X (Twitter)", handle: "@skmnet_id", followers: 640, connected: false, color: "#1a2620" },
];

export type PostStatus = "draf" | "terjadwal" | "terbit";

export type ScheduledPost = {
  id: string;
  caption: string;
  tags: string[];
  platforms: SocialPlatform[];
  date: string; // label: "Hari ini" | "Besok" | "12 Feb"
  time: string;
  status: PostStatus;
  reach: number;
  kind: "promo" | "katalog" | "info";
};

export const POSTS_SEED: ScheduledPost[] = [
  {
    id: "sp1",
    caption: "Gajian tiba, waktunya nyetok sembako! Beras Rojolele 5 kg cuma Rp 68.000 — khusus pekan ini.",
    tags: ["#gajian", "#skmmart", "#sembakomurah"],
    platforms: ["instagram", "facebook"],
    date: "Hari ini", time: "16:00", status: "terjadwal", reach: 0, kind: "promo",
  },
  {
    id: "sp2",
    caption: "Stok Kopi Susu Aren menipis! Amankan punyamu sebelum kehabisan — Rp 15.000 saja.",
    tags: ["#kopisusaren", "#promoharian"],
    platforms: ["instagram"],
    date: "Hari ini", time: "10:30", status: "terbit", reach: 1_840, kind: "promo",
  },
  {
    id: "sp3",
    caption: "Katalog Jumat: 6 produk terlaris pekan ini, dari Indomie sampai Silverqueen. Geser untuk lihat harga!",
    tags: ["#katalogjumat", "#skmmart"],
    platforms: ["instagram", "facebook", "x"],
    date: "Kemarin", time: "16:00", status: "terbit", reach: 2_410, kind: "katalog",
  },
  {
    id: "sp4",
    caption: "Sekarang bayar di SKM Mart bisa pakai QRIS semua bank & e-wallet. Belanja makin gampang!",
    tags: ["#qris", "#skmnet"],
    platforms: ["instagram", "facebook"],
    date: "Kemarin", time: "09:00", status: "terbit", reach: 1_205, kind: "info",
  },
  {
    id: "sp5",
    caption: "Rekap omzet minggu ini naik 12%! Terima kasih pelanggan setia SKM Mart 🙌",
    tags: ["#skmmart", "#umkmnaikkelas"],
    platforms: ["instagram"],
    date: "2 hari lalu", time: "20:00", status: "terbit", reach: 980, kind: "info",
  },
  {
    id: "sp6",
    caption: "Draf: Paket hemat anak kos — Indomie + telur + kopi mulai Rp 12.000.",
    tags: ["#anakos", "#pakethemat"],
    platforms: ["instagram", "tiktok"],
    date: "—", time: "—", status: "draf", reach: 0, kind: "promo",
  },
];

export type AutoPostCfg = {
  katalogHarian: boolean;
  promoStok: boolean;
  storyOmzet: boolean;
  slot: string; // "16:00"
};

export const AUTOPOST_DEFAULT: AutoPostCfg = { katalogHarian: true, promoStok: true, storyOmzet: false, slot: "16:00" };

export const AUTOPORT_SLOTS = ["09:00", "13:00", "16:00", "20:00"];

/* ================= helpers ================= */

export function nextSlotDate(slot: string): Date {
  const [h, mi] = slot.split(":").map(Number);
  const d = new Date();
  d.setHours(h, mi, 0, 0);
  if (d.getTime() <= Date.now()) d.setDate(d.getDate() + 1);
  return d;
}

export function formatCountdown(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const mn = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, "0")}:${String(mn).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export function genCaption(p: Product, store: string): string {
  return `Siapa cepat dia dapat! 🛒\n${p.name} sekarang cuma ${idr(p.price)} di ${store} — sisa ${p.stock} pcs hari ini. Mampir sebelum kehabisan ya!`;
}

export function genTags(p: Product): string[] {
  return [
    "#promoharian",
    "#skmmart",
    `#${p.category.replace(/\s+/g, "").toLowerCase()}`,
    "#belanjamurah",
    "#jogja",
  ];
}

export function estimateReach(followers: number): number {
  return Math.round(followers * (0.32 + Math.random() * 0.2));
}

export function compactFollowers(n: number): string {
  return n >= 1000 ? `${(n / 1000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} rb` : num(n);
}

export const waStatsOf = (msgs: WaMsg[]) => {
  const out = msgs.filter((x) => x.status !== "antri");
  const read = msgs.filter((x) => x.status === "dibaca").length;
  return {
    sent: out.length,
    rate: out.length ? Math.round((read / out.length) * 100) : 0,
    last: [...msgs].sort((a, b) => b.ts - a.ts)[0] ?? null,
  };
};
export const followersTotal = (accounts: SocialAccount[]) =>
  accounts.filter((a) => a.connected).reduce((s, a) => s + a.followers, 0);
export const reachShort = idrShort;
