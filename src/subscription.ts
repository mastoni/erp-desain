/* ============ Langganan & Modul Layanan SKMNet ============ */

export type ModuleId = "rtrw" | "cctv";

export type ModuleDef = {
  id: ModuleId;
  name: string;
  tagline: string;
  desc: string;
  price: number;
  color: string;
  features: string[];
};

export type ModuleState = { id: ModuleId; active: boolean; activatedAt: string | null };

export const MODULES_CATALOG: ModuleDef[] = [
  {
    id: "rtrw",
    name: "Billing RTRW-Net",
    tagline: "Kelola pelanggan internet lingkungan",
    desc: "Tagihan bulanan, paket bandwidth, voucher hotspot, dan isolir otomatis untuk usaha RT/RW-Net Anda.",
    price: 99_000,
    color: "#35657f",
    features: [
      "Tagihan & paket bandwidth pelanggan",
      "Generator voucher hotspot",
      "Isolir otomatis saat menunggak",
      "Laporan pendapatan jaringan",
    ],
  },
  {
    id: "cctv",
    name: "CCTV Cloud Storage",
    tagline: "Rekaman kamera aman di cloud",
    desc: "Retensi rekaman hingga 30 hari, notifikasi gerakan real-time, dan playback dari aplikasi Android SKMNet.",
    price: 149_000,
    color: "#bc4b2f",
    features: [
      "Retensi rekaman 7–30 hari",
      "Notifikasi gerakan real-time",
      "Playback dari aplikasi Android",
      "Enkripsi penyimpanan AES-256",
    ],
  },
];

export const MODULES_SEED: ModuleState[] = [
  { id: "rtrw", active: true, activatedAt: "12 Jan 2026" },
  { id: "cctv", active: false, activatedAt: null },
];

/* ---------- invoice langganan ---------- */

export type Invoice = {
  id: string;
  label: string;
  period: string;
  date: string;
  due: string;
  amount: number;
  status: "lunas" | "menunggu" | "jatuh tempo";
};

export const INVOICES_SEED: Invoice[] = [
  { id: "INV-2603", label: "Paket Pro — SKMNet Cloud", period: "Mar 2026", date: "28 Feb 2026", due: "05 Mar 2026", amount: 299_000, status: "lunas" },
  { id: "INV-2602", label: "Paket Pro — SKMNet Cloud", period: "Feb 2026", date: "28 Jan 2026", due: "05 Feb 2026", amount: 299_000, status: "lunas" },
  { id: "INV-2601", label: "Modul Billing RTRW-Net", period: "Feb 2026", date: "28 Jan 2026", due: "05 Feb 2026", amount: 99_000, status: "lunas" },
  { id: "INV-2600", label: "Paket Pro — SKMNet Cloud", period: "Jan 2026", date: "28 Des 2025", due: "05 Jan 2026", amount: 299_000, status: "lunas" },
];

/* ---------- Billing RTRW-Net ---------- */

export type RtrwPackage = { id: string; name: string; speed: string; price: number; quota: string };

export const RTRW_PACKAGES: RtrwPackage[] = [
  { id: "pkt1", name: "Rumahan Hemat", speed: "10 Mbps", price: 150_000, quota: "Unlimited · FUP 300 GB" },
  { id: "pkt2", name: "Rumahan Plus", speed: "20 Mbps", price: 200_000, quota: "Unlimited" },
  { id: "pkt3", name: "Warung / Usaha", speed: "30 Mbps", price: 300_000, quota: "Unlimited · prioritas bisnis" },
  { id: "pkt4", name: "Kos & Kontrakan", speed: "50 Mbps", price: 450_000, quota: "Unlimited · +2 access point" },
];

export type RtrwCustomer = {
  id: string;
  name: string;
  address: string;
  packageId: string;
  status: "aktif" | "menunggak" | "terisolir";
  due: string;
  joined: string;
};

export const RTRW_CUSTOMERS_SEED: RtrwCustomer[] = [
  { id: "RT-01", name: "Budi Santoso", address: "Blok A-12", packageId: "pkt2", status: "aktif", due: "05 Mar 2026", joined: "Mar 2025" },
  { id: "RT-02", name: "Siti Aminah", address: "Blok C-03", packageId: "pkt1", status: "menunggak", due: "20 Feb 2026", joined: "Agu 2025" },
  { id: "RT-03", name: "Warung Berkah", address: "Ruko No. 2", packageId: "pkt3", status: "aktif", due: "08 Mar 2026", joined: "Jan 2025" },
  { id: "RT-04", name: "Kos Melati", address: "Jl. Anggrek 8", packageId: "pkt4", status: "aktif", due: "12 Mar 2026", joined: "Nov 2024" },
  { id: "RT-05", name: "Agus Riyadi", address: "Blok B-21", packageId: "pkt1", status: "menunggak", due: "25 Feb 2026", joined: "Jun 2025" },
  { id: "RT-06", name: "Rina Kartika", address: "Blok D-07", packageId: "pkt2", status: "terisolir", due: "10 Feb 2026", joined: "Feb 2025" },
  { id: "RT-07", name: "Yanto Prasetya", address: "Blok A-05", packageId: "pkt1", status: "aktif", due: "03 Mar 2026", joined: "Sep 2025" },
  { id: "RT-08", name: "Laundry Kiloan 88", address: "Ruko No. 5", packageId: "pkt3", status: "aktif", due: "15 Mar 2026", joined: "Apr 2025" },
];

export type Voucher = {
  code: string;
  speed: string;
  duration: string;
  price: number;
  status: "tersedia" | "terjual" | "dipakai";
};

export const VOUCHERS_SEED: Voucher[] = [
  { code: "SKM-8F3K-2211", speed: "5 Mbps", duration: "1 hari", price: 5_000, status: "tersedia" },
  { code: "SKM-2T9M-8830", speed: "5 Mbps", duration: "1 hari", price: 5_000, status: "dipakai" },
  { code: "SKM-7Q1Z-4402", speed: "10 Mbps", duration: "3 hari", price: 12_000, status: "tersedia" },
  { code: "SKM-K9D2-1178", speed: "10 Mbps", duration: "7 hari", price: 25_000, status: "terjual" },
  { code: "SKM-4X6B-9930", speed: "3 Mbps", duration: "6 jam", price: 3_000, status: "tersedia" },
  { code: "SKM-M2P8-5561", speed: "5 Mbps", duration: "30 hari", price: 75_000, status: "terjual" },
];

export const VOUCHER_PRESETS = [
  { speed: "3 Mbps", duration: "6 jam", price: 3_000 },
  { speed: "5 Mbps", duration: "1 hari", price: 5_000 },
  { speed: "10 Mbps", duration: "3 hari", price: 12_000 },
  { speed: "10 Mbps", duration: "7 hari", price: 25_000 },
];

/** pemakaian bandwidth jaringan (Mbps) per jam */
export const RTRW_BW = [
  { h: "08", v: 84 },
  { h: "09", v: 96 },
  { h: "10", v: 110 },
  { h: "11", v: 122 },
  { h: "12", v: 148 },
  { h: "13", v: 139 },
  { h: "14", v: 128 },
  { h: "15", v: 118 },
  { h: "16", v: 134 },
  { h: "17", v: 156 },
  { h: "18", v: 182 },
  { h: "19", v: 204 },
  { h: "20", v: 218 },
  { h: "21", v: 196 },
];

/* ---------- CCTV Cloud Storage ---------- */

export type CctvPlan = { id: string; retention: string; capacityGb: number; price: number };

export const CCTV_PLANS: CctvPlan[] = [
  { id: "s1", retention: "7 Hari", capacityGb: 120, price: 59_000 },
  { id: "s2", retention: "14 Hari", capacityGb: 240, price: 99_000 },
  { id: "s3", retention: "30 Hari", capacityGb: 500, price: 169_000 },
];

export type Camera = {
  id: string;
  name: string;
  location: string;
  online: boolean;
  resolution: string;
  usedGb: number;
};

export const CAMERAS_SEED: Camera[] = [
  { id: "CAM-01", name: "Kasir Depan", location: "Area kasir utama", online: true, resolution: "1080p", usedGb: 42 },
  { id: "CAM-02", name: "Gudang Belakang", location: "Pintu bongkar muat", online: true, resolution: "720p", usedGb: 38 },
  { id: "CAM-03", name: "Parkir", location: "Halaman depan", online: false, resolution: "1080p", usedGb: 12 },
  { id: "CAM-04", name: "Rak Sembako", location: "Lorong 2", online: true, resolution: "1080p", usedGb: 51 },
];

export type CctvEvent = { time: string; cam: string; type: string; tone: "ok" | "warn" | "info" };

export const CCTV_EVENTS_SEED: CctvEvent[] = [
  { time: "09:41", cam: "CAM-01", type: "Gerakan terdeteksi di area kasir", tone: "info" },
  { time: "09:12", cam: "CAM-04", type: "Listrik pulih — rekaman dilanjutkan", tone: "ok" },
  { time: "08:55", cam: "CAM-03", type: "Kamera offline — periksa koneksi PoE", tone: "warn" },
  { time: "08:30", cam: "CAM-02", type: "Rekasan harian tersimpan ke cloud", tone: "ok" },
  { time: "07:58", cam: "CAM-01", type: "Shift pagi dimulai — penanda bookmark", tone: "info" },
];
