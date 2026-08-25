/* ============ Data & tipe untuk lapisan multi-tenant (Konsol Super Admin) ============ */

export type Plan = {
  id: string;
  name: string;
  price: number; // 0 = custom
  maxUsers: number; // 0 = tanpa batas
  maxProducts: number; // 0 = tanpa batas
  maxOutlets: number; // 0 = tanpa batas
  features: string[];
  highlight?: boolean;
};

export const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    price: 99_000,
    maxUsers: 2,
    maxProducts: 500,
    maxOutlets: 1,
    features: ["Kasir (POS) & Inventaris", "Laporan harian", "1 terminal kasir", "Dukungan email"],
  },
  {
    id: "pro",
    name: "Pro",
    price: 249_000,
    maxUsers: 10,
    maxProducts: 5_000,
    maxOutlets: 3,
    features: ["Semua fitur Starter", "Pembelian & Supplier", "Pembukuan & hutang-piutang", "Layanan digital (PPOB)", "Backup otomatis harian"],
    highlight: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 799_000,
    maxUsers: 0,
    maxProducts: 0,
    maxOutlets: 0,
    features: ["Semua fitur Pro", "Multi-outlet tanpa batas", "API & integrasi ERP", "SLA 99,9% + manajer akun", "Skema database terisolasi"],
  },
];

export type TenantStatus = "aktif" | "trial" | "ditangguhkan";

export type Tenant = {
  id: string;
  name: string;
  subdomain: string;
  planId: string;
  status: TenantStatus;
  region: string;
  owner: string;
  email: string;
  users: number;
  products: number;
  salesToday: number;
  storageMb: number;
  storageLimitMb: number;
  createdAt: string;
  spark: number[];
  current?: boolean;
};

export const TENANTS: Tenant[] = [
  {
    id: "T-001", name: "Lumbung Mart", subdomain: "lumbung-mart", planId: "pro", status: "aktif", region: "Yogyakarta",
    owner: "Rani Wijaya", email: "rani@lumbungmart.id", users: 4, products: 26, salesToday: 8_450_000,
    storageMb: 184, storageLimitMb: 5_120, createdAt: "12 Jan 2025", spark: [4.1, 4.6, 4.4, 5.2, 5.8, 6.9, 8.45], current: true,
  },
  {
    id: "T-002", name: "Bali Minimart", subdomain: "bali-minimart", planId: "enterprise", status: "aktif", region: "Denpasar",
    owner: "Made Wirata", email: "made@baliminimart.id", users: 18, products: 4_310, salesToday: 12_800_000,
    storageMb: 2_940, storageLimitMb: 20_480, createdAt: "03 Nov 2024", spark: [8.2, 9.1, 8.8, 10.4, 11.2, 12.1, 12.8],
  },
  {
    id: "T-003", name: "Toko Sinar Jaya", subdomain: "toko-sinar", planId: "pro", status: "aktif", region: "Semarang",
    owner: "Hendra Gunawan", email: "hendra@tokosinar.id", users: 6, products: 1_240, salesToday: 5_200_000,
    storageMb: 640, storageLimitMb: 5_120, createdAt: "28 Feb 2025", spark: [3.4, 3.9, 4.2, 4.0, 4.6, 4.9, 5.2],
  },
  {
    id: "T-004", name: "Warung Berkah", subdomain: "warung-berkah", planId: "starter", status: "aktif", region: "Bandung",
    owner: "Budi Santoso", email: "budi@warungberkah.id", users: 2, products: 148, salesToday: 1_900_000,
    storageMb: 96, storageLimitMb: 1_024, createdAt: "19 Apr 2025", spark: [1.1, 1.3, 1.2, 1.5, 1.6, 1.8, 1.9],
  },
  {
    id: "T-005", name: "Swalayan Anggrek", subdomain: "swalayan-anggrek", planId: "pro", status: "ditangguhkan", region: "Malang",
    owner: "Dewi Anggraini", email: "dewi@anggrek.id", users: 5, products: 890, salesToday: 0,
    storageMb: 410, storageLimitMb: 5_120, createdAt: "07 Jul 2025", spark: [2.8, 3.1, 2.9, 3.3, 2.4, 1.2, 0],
  },
  {
    id: "T-006", name: "Kios Rejeki", subdomain: "kios-rejeki", planId: "starter", status: "trial", region: "Surabaya",
    owner: "Agus Prasetyo", email: "agus@kiosrejeki.id", users: 1, products: 86, salesToday: 640_000,
    storageMb: 42, storageLimitMb: 1_024, createdAt: "02 Feb 2026", spark: [0.2, 0.3, 0.3, 0.4, 0.5, 0.6, 0.64],
  },
  {
    id: "T-007", name: "Toko Barokah", subdomain: "toko-barokah", planId: "starter", status: "trial", region: "Medan",
    owner: "Siti Rahma", email: "siti@barokah.id", users: 2, products: 64, salesToday: 410_000,
    storageMb: 31, storageLimitMb: 1_024, createdAt: "09 Feb 2026", spark: [0.1, 0.2, 0.2, 0.3, 0.3, 0.4, 0.41],
  },
];

export type SaRole = "super_admin" | "owner" | "manajer" | "kasir";

export type TenantUser = {
  id: string;
  tenantId: string | null;
  name: string;
  email: string;
  role: SaRole;
  active: boolean;
  lastLogin: string;
};

export const SA_USERS: TenantUser[] = [
  { id: "U-01", tenantId: null, name: "Aditya Pradana", email: "aditya@lumbung.cloud", role: "super_admin", active: true, lastLogin: "Baru saja" },
  { id: "U-02", tenantId: "T-001", name: "Rani Wijaya", email: "rani@lumbungmart.id", role: "owner", active: true, lastLogin: "5 mnt lalu" },
  { id: "U-03", tenantId: "T-001", name: "Dimas Saputra", email: "dimas@lumbungmart.id", role: "kasir", active: true, lastLogin: "2 jam lalu" },
  { id: "U-04", tenantId: "T-001", name: "Sri Handayani", email: "sri@lumbungmart.id", role: "kasir", active: false, lastLogin: "3 hari lalu" },
  { id: "U-05", tenantId: "T-002", name: "Made Wirata", email: "made@baliminimart.id", role: "owner", active: true, lastLogin: "1 jam lalu" },
  { id: "U-06", tenantId: "T-002", name: "Komang Ayu", email: "komang@baliminimart.id", role: "manajer", active: true, lastLogin: "4 jam lalu" },
  { id: "U-07", tenantId: "T-003", name: "Hendra Gunawan", email: "hendra@tokosinar.id", role: "owner", active: true, lastLogin: "30 mnt lalu" },
  { id: "U-08", tenantId: "T-003", name: "Lina Marlina", email: "lina@tokosinar.id", role: "manajer", active: true, lastLogin: "6 jam lalu" },
  { id: "U-09", tenantId: "T-004", name: "Budi Santoso", email: "budi@warungberkah.id", role: "owner", active: true, lastLogin: "1 hari lalu" },
  { id: "U-10", tenantId: "T-005", name: "Dewi Anggraini", email: "dewi@anggrek.id", role: "owner", active: false, lastLogin: "12 hari lalu" },
];

export type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "SUSPEND" | "AKTIVASI";

export type AuditLog = {
  id: string;
  time: string;
  actor: string;
  action: AuditAction;
  entity: string;
  detail: string;
  ip: string;
};

export const AUDIT_SEED: AuditLog[] = [
  { id: "LOG-901", time: "09:47", actor: "Aditya Pradana", action: "AKTIVASI", entity: "tenants", detail: "Mengaktifkan ulang tenant T-004 Warung Berkah", ip: "103.10.64.21" },
  { id: "LOG-900", time: "09:31", actor: "Aditya Pradana", action: "SUSPEND", entity: "tenants", detail: "Menangguhkan T-005 Swalayan Anggrek — tagihan gagal 3×", ip: "103.10.64.21" },
  { id: "LOG-899", time: "09:12", actor: "Rani Wijaya", action: "LOGIN", entity: "auth", detail: "Masuk dari lumbung-mart.lumbung.cloud (Yogyakarta)", ip: "182.2.114.87" },
  { id: "LOG-898", time: "08:58", actor: "Aditya Pradana", action: "CREATE", entity: "users", detail: "Menambah kasir U-003 dim as@lumbungmart.id pada T-001", ip: "103.10.64.21" },
  { id: "LOG-897", time: "08:40", actor: "Sistem", action: "UPDATE", entity: "billing", detail: "Invoice INV-2291 Pro diterbitkan untuk T-002 (Rp 249.000)", ip: "—" },
  { id: "LOG-896", time: "08:26", actor: "Aditya Pradana", action: "CREATE", entity: "tenants", detail: "Tenant baru T-007 Toko Barokah (trial 14 hari, Starter)", ip: "103.10.64.21" },
  { id: "LOG-895", time: "08:02", actor: "Sistem", action: "UPDATE", entity: "backup", detail: "Backup harian 7 tenant selesai — 412 MB ke S3 (ap-southeast-1)", ip: "—" },
  { id: "LOG-894", time: "07:44", actor: "Aditya Pradana", action: "UPDATE", entity: "plans", detail: "Menyesuaikan kuota produk paket Pro: 4.000 → 5.000 SKU", ip: "103.10.64.21" },
  { id: "LOG-893", time: "07:15", actor: "Made Wirata", action: "LOGIN", entity: "auth", detail: "Masuk dari bali-minimart.lumbung.cloud (Denpasar)", ip: "36.72.91.15" },
  { id: "LOG-892", time: "06:58", actor: "Sistem", action: "DELETE", entity: "sessions", detail: "Membersihkan 42 sesi kadaluarsa (rotasi token)", ip: "—" },
];

/* ---------- tren MRR 12 bulan (dalam juta) ---------- */
export const MRR_TREND = [
  { label: "Mar", value: 620_000 },
  { label: "Apr", value: 745_000 },
  { label: "Mei", value: 810_000 },
  { label: "Jun", value: 964_000 },
  { label: "Jul", value: 1_090_000 },
  { label: "Agu", value: 1_180_000 },
  { label: "Sep", value: 1_296_000 },
  { label: "Okt", value: 1_345_000 },
  { label: "Nov", value: 1_494_000 },
  { label: "Des", value: 1_580_000 },
  { label: "Jan", value: 1_673_000 },
  { label: "Feb", value: 1_745_000 },
];

/* ========== transaksi digital terpusat (profit share) ========== */

export type ServiceId = "pulsa" | "data" | "ewallet" | "token" | "tagihan" | "bpjs" | "pdam" | "transfer" | "tarik";

/** pemetaan layanan platform → kategori di modul Layanan Digital tenant */
export const SERVICE_TO_CAT: Record<ServiceId, string> = {
  pulsa: "pulsa", data: "data", ewallet: "ewallet", token: "listrik", tagihan: "listrik",
  bpjs: "bpjs", pdam: "pdam", transfer: "transfer", tarik: "transfer",
};

export type DigitalService = {
  id: ServiceId;
  label: string;
  /** nominal referensi (pulsa 5000, token 100000, dst) */
  denom: number;
  /** harga jual pasar tenant (all-in yang dibayar pelanggan utk produk) */
  hargaJual: number;
  /** HPP platform dari agregator (termasuk pokok utk tagihan/transfer) */
  hpp: number;
  /** biaya admin platform yg dibebankan ke pelanggan */
  adminFee: number;
  /** % kue margin utk platform; sisanya utk tenant */
  platformShare: number;
  /** rentang harga jual yg diizinkan utk tenant (produk dgn markup) */
  hargaMin: number;
  hargaMax: number;
  /** aktif utk semua tenant (bisa di-override per tenant) */
  enabled: boolean;
  /** id tenant yang menonaktifkan layanan ini */
  tenantOff: string[];
  volume30d: number;
};

/** kue margin per transaksi = (hargaJual − HPP) + biaya admin */
export const svcPie = (s: DigitalService) => (s.hargaJual - s.hpp) + s.adminFee;
export const svcPlatformCut = (s: DigitalService) => Math.round((svcPie(s) * s.platformShare) / 100);
export const svcTenantCut = (s: DigitalService) => svcPie(s) - svcPlatformCut(s);

export const DIGITAL_SERVICES: DigitalService[] = [
  { id: "pulsa", label: "Pulsa", denom: 5000, hargaJual: 5500, hpp: 4850, adminFee: 2000, platformShare: 30, hargaMin: 5000, hargaMax: 7000, enabled: true, tenantOff: [], volume30d: 1240 },
  { id: "data", label: "Paket Data", denom: 65000, hargaJual: 67500, hpp: 61900, adminFee: 2500, platformShare: 30, hargaMin: 65000, hargaMax: 75000, enabled: true, tenantOff: [], volume30d: 486 },
  { id: "ewallet", label: "E-Wallet", denom: 50000, hargaJual: 51000, hpp: 49750, adminFee: 1500, platformShare: 30, hargaMin: 50000, hargaMax: 54000, enabled: true, tenantOff: ["T-006"], volume30d: 730 },
  { id: "token", label: "Token PLN", denom: 100000, hargaJual: 102500, hpp: 99100, adminFee: 2500, platformShare: 35, hargaMin: 100000, hargaMax: 106000, enabled: true, tenantOff: [], volume30d: 388 },
  { id: "tagihan", label: "Tagihan PLN", denom: 200000, hargaJual: 200000, hpp: 201200, adminFee: 3000, platformShare: 30, hargaMin: 200000, hargaMax: 200000, enabled: true, tenantOff: [], volume30d: 214 },
  { id: "bpjs", label: "BPJS Kesehatan", denom: 105000, hargaJual: 105000, hpp: 106000, adminFee: 2500, platformShare: 25, hargaMin: 105000, hargaMax: 105000, enabled: true, tenantOff: [], volume30d: 162 },
  { id: "pdam", label: "Air / PDAM", denom: 67500, hargaJual: 67500, hpp: 68800, adminFee: 2500, platformShare: 25, hargaMin: 67500, hargaMax: 67500, enabled: false, tenantOff: ["T-008"], volume30d: 143 },
  { id: "transfer", label: "Transfer Bank", denom: 500000, hargaJual: 500000, hpp: 502500, adminFee: 6500, platformShare: 40, hargaMin: 500000, hargaMax: 500000, enabled: true, tenantOff: [], volume30d: 96 },
  { id: "tarik", label: "Tarik Tunai", denom: 300000, hargaJual: 300000, hpp: 300000, adminFee: 5000, platformShare: 40, hargaMin: 300000, hargaMax: 300000, enabled: true, tenantOff: ["T-007"], volume30d: 84 },
];

export type PlatformTx = {
  id: string;
  time: string;
  tenantId: string;
  serviceId: ServiceId;
  target: string;
  nominal: number;
  hargaJual: number;
  hpp: number;
  adminFee: number;
  platformCut: number;
  tenantCut: number;
  status: "berhasil" | "pending";
};

export const PLATFORM_TXS: PlatformTx[] = [
  { id: "PTX-90121", time: "09:47", tenantId: "T-001", serviceId: "pulsa", target: "0812-9934-1120", nominal: 5000, hargaJual: 5500, hpp: 4850, adminFee: 2000, platformCut: 795, tenantCut: 1855, status: "berhasil" },
  { id: "PTX-90120", time: "09:44", tenantId: "T-004", serviceId: "ewallet", target: "0857-2210-4471", nominal: 50000, hargaJual: 51000, hpp: 49750, adminFee: 1500, platformCut: 825, tenantCut: 1925, status: "berhasil" },
  { id: "PTX-90119", time: "09:41", tenantId: "T-006", serviceId: "token", target: "5371-0921-4482", nominal: 100000, hargaJual: 102500, hpp: 99100, adminFee: 2500, platformCut: 2065, tenantCut: 3835, status: "berhasil" },
  { id: "PTX-90118", time: "09:38", tenantId: "T-001", serviceId: "data", target: "0819-0023-7745", nominal: 65000, hargaJual: 67500, hpp: 61900, adminFee: 2500, platformCut: 2430, tenantCut: 5670, status: "berhasil" },
  { id: "PTX-90117", time: "09:35", tenantId: "T-002", serviceId: "transfer", target: "0038-01-882341", nominal: 500000, hargaJual: 500000, hpp: 502500, adminFee: 6500, platformCut: 1600, tenantCut: 2400, status: "berhasil" },
  { id: "PTX-90116", time: "09:31", tenantId: "T-008", serviceId: "pdam", target: "1044-8821-33", nominal: 67500, hargaJual: 67500, hpp: 68800, adminFee: 2500, platformCut: 300, tenantCut: 900, status: "berhasil" },
  { id: "PTX-90115", time: "09:28", tenantId: "T-003", serviceId: "pulsa", target: "0856-1190-2231", nominal: 5000, hargaJual: 5500, hpp: 4850, adminFee: 2000, platformCut: 795, tenantCut: 1855, status: "berhasil" },
  { id: "PTX-90114", time: "09:24", tenantId: "T-005", serviceId: "bpjs", target: "0001-3388-2210", nominal: 105000, hargaJual: 105000, hpp: 106000, adminFee: 2500, platformCut: 375, tenantCut: 1125, status: "berhasil" },
  { id: "PTX-90113", time: "09:20", tenantId: "T-001", serviceId: "tarik", target: "Kas Agen", nominal: 300000, hargaJual: 300000, hpp: 300000, adminFee: 5000, platformCut: 2000, tenantCut: 3000, status: "berhasil" },
  { id: "PTX-90112", time: "09:16", tenantId: "T-004", serviceId: "tagihan", target: "5371-4402-9917", nominal: 200000, hargaJual: 200000, hpp: 201200, adminFee: 3000, platformCut: 540, tenantCut: 1260, status: "berhasil" },
  { id: "PTX-90111", time: "09:11", tenantId: "T-007", serviceId: "ewallet", target: "0813-5567-0912", nominal: 50000, hargaJual: 51000, hpp: 49750, adminFee: 1500, platformCut: 825, tenantCut: 1925, status: "berhasil" },
  { id: "PTX-90110", time: "09:05", tenantId: "T-006", serviceId: "pulsa", target: "0821-7745-0912", nominal: 5000, hargaJual: 5500, hpp: 4850, adminFee: 2000, platformCut: 795, tenantCut: 1855, status: "pending" },
  { id: "PTX-90109", time: "09:02", tenantId: "T-002", serviceId: "token", target: "1420-8837-2265", nominal: 100000, hargaJual: 102500, hpp: 99100, adminFee: 2500, platformCut: 2065, tenantCut: 3835, status: "pending" },
  { id: "PTX-90108", time: "08:58", tenantId: "T-008", serviceId: "data", target: "0895-2211-8876", nominal: 65000, hargaJual: 67500, hpp: 61900, adminFee: 2500, platformCut: 2430, tenantCut: 5670, status: "pending" },
];

export type SettlementCfg = { mode: "realtime" | "h1" | "mingguan"; minPayout: number; autoSettle: boolean };

export const SYSTEM_SERVICES = [
  { id: "api", name: "API Gateway", region: "ap-southeast-1", latency: 38, uptime: "99,98%", ok: true },
  { id: "db", name: "PostgreSQL Utama (RLS)", region: "ap-southeast-1", latency: 12, uptime: "99,99%", ok: true },
  { id: "queue", name: "Antrian Sinkronisasi", region: "ap-southeast-1", latency: 210, uptime: "99,95%", ok: true },
  { id: "cdn", name: "CDN & Media", region: "global", latency: 24, uptime: "100%", ok: true },
];
