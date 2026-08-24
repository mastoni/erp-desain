export type Product = {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  sold: number;
};

export const PRODUCTS: Product[] = [
  { id: "p01", sku: "SMB-01", name: "Beras Rojolele 5 kg", category: "Sembako", price: 68000, cost: 59500, stock: 42, minStock: 10, sold: 86 },
  { id: "p02", sku: "SMB-02", name: "Minyak Goreng Fortune 2 L", category: "Sembako", price: 36500, cost: 32400, stock: 18, minStock: 12, sold: 132 },
  { id: "p03", sku: "SMB-03", name: "Gula Pasir Gulaku 1 kg", category: "Sembako", price: 17500, cost: 15200, stock: 55, minStock: 15, sold: 210 },
  { id: "p04", sku: "SMB-04", name: "Telur Ayam Negeri 1 kg", category: "Sembako", price: 28500, cost: 24800, stock: 9, minStock: 12, sold: 174 },
  { id: "p05", sku: "SMB-05", name: "Tepung Segitiga Biru 1 kg", category: "Sembako", price: 12500, cost: 10600, stock: 40, minStock: 10, sold: 96 },
  { id: "p06", sku: "SMB-06", name: "Indomie Goreng (pcs)", category: "Sembako", price: 3500, cost: 2850, stock: 240, minStock: 60, sold: 940 },
  { id: "p07", sku: "MNM-01", name: "Air Mineral 600 ml", category: "Minuman", price: 4000, cost: 2400, stock: 180, minStock: 48, sold: 720 },
  { id: "p08", sku: "MNM-02", name: "Kopi Susu Aren 250 ml", category: "Minuman", price: 15000, cost: 9800, stock: 26, minStock: 12, sold: 388 },
  { id: "p09", sku: "MNM-03", name: "Teh Botol 450 ml", category: "Minuman", price: 5500, cost: 3900, stock: 64, minStock: 24, sold: 410 },
  { id: "p10", sku: "MNM-04", name: "Susu UHT Cokelat 250 ml", category: "Minuman", price: 6000, cost: 4400, stock: 11, minStock: 24, sold: 356 },
  { id: "p11", sku: "MNM-05", name: "Jus Jeruk Peras 1 L", category: "Minuman", price: 18000, cost: 12500, stock: 0, minStock: 6, sold: 120 },
  { id: "p12", sku: "MNM-06", name: "Sparkling Water 330 ml", category: "Minuman", price: 12000, cost: 7800, stock: 33, minStock: 10, sold: 84 },
  { id: "p13", sku: "SNK-01", name: "Keripik Singkong Balado", category: "Snack", price: 9500, cost: 6400, stock: 47, minStock: 15, sold: 264 },
  { id: "p14", sku: "SNK-02", name: "Cokelat Silverqueen 65 g", category: "Snack", price: 17500, cost: 13400, stock: 29, minStock: 12, sold: 190 },
  { id: "p15", sku: "SNK-03", name: "Biskuit Kaleng 700 g", category: "Snack", price: 32000, cost: 25600, stock: 14, minStock: 8, sold: 62 },
  { id: "p16", sku: "SNK-04", name: "Kacang Garuda 250 g", category: "Snack", price: 13500, cost: 10200, stock: 38, minStock: 12, sold: 148 },
  { id: "p17", sku: "SNK-05", name: "Roti Tawar Sari Roti", category: "Snack", price: 14000, cost: 10800, stock: 7, minStock: 10, sold: 205 },
  { id: "p18", sku: "SNK-06", name: "Wafer Cokelat Tango", category: "Snack", price: 8500, cost: 5900, stock: 72, minStock: 20, sold: 318 },
  { id: "p19", sku: "PRW-01", name: "Sabun Mandi Lifebuoy 100 g", category: "Perawatan", price: 6500, cost: 4700, stock: 88, minStock: 24, sold: 296 },
  { id: "p20", sku: "PRW-02", name: "Sampo Pantene 170 ml", category: "Perawatan", price: 23500, cost: 18200, stock: 21, minStock: 10, sold: 118 },
  { id: "p21", sku: "PRW-03", name: "Pasta Gigi Pepsodent 190 g", category: "Perawatan", price: 12500, cost: 9600, stock: 45, minStock: 15, sold: 232 },
  { id: "p22", sku: "PRW-04", name: "Tisu Wajah 250 sheet", category: "Perawatan", price: 15500, cost: 11300, stock: 52, minStock: 15, sold: 186 },
  { id: "p23", sku: "RMT-01", name: "Deterjen Rinso 770 g", category: "Rumah Tangga", price: 24500, cost: 19400, stock: 34, minStock: 12, sold: 154 },
  { id: "p24", sku: "RMT-02", name: "Sabun Cuci Sunlight 755 ml", category: "Rumah Tangga", price: 11500, cost: 8800, stock: 41, minStock: 15, sold: 268 },
  { id: "p25", sku: "RMT-03", name: "Kantong Sampah 60×100", category: "Rumah Tangga", price: 9000, cost: 5900, stock: 60, minStock: 20, sold: 92 },
  { id: "p26", sku: "RMT-04", name: "Karbol Wangi 800 ml", category: "Rumah Tangga", price: 15500, cost: 11800, stock: 27, minStock: 10, sold: 104 },
];

export const CATEGORY_COLORS: Record<string, string> = {
  Sembako: "#17593e",
  Minuman: "#35657f",
  Snack: "#d3921f",
  Perawatan: "#bc4b2f",
  "Rumah Tangga": "#5e7d5a",
};

/* ---------- seri waktu ---------- */

export const SALES_7 = [
  { label: "Sen", value: 5_800_000 },
  { label: "Sel", value: 6_400_000 },
  { label: "Rab", value: 6_100_000 },
  { label: "Kam", value: 7_200_000 },
  { label: "Jum", value: 8_900_000 },
  { label: "Sab", value: 9_800_000 },
  { label: "Min", value: 8_450_000 },
];

export const SALES_30 = Array.from({ length: 30 }, (_, i) => {
  const weekly = [0.86, 0.94, 0.9, 1.02, 1.18, 1.34, 1.2][i % 7];
  const wave = Math.sin(i / 4.2) * 0.09;
  const v = 6_400_000 * weekly * (1 + wave) + (i % 5) * 120_000;
  return { label: `${i + 1}`, value: Math.round(v / 1000) * 1000 };
});

export const HOURLY = [
  { h: "08", v: 320_000 },
  { h: "09", v: 540_000 },
  { h: "10", v: 460_000 },
  { h: "11", v: 690_000 },
  { h: "12", v: 940_000 },
  { h: "13", v: 1_180_000 },
  { h: "14", v: 820_000 },
  { h: "15", v: 700_000 },
  { h: "16", v: 640_000 },
  { h: "17", v: 890_000 },
  { h: "18", v: 1_340_000 },
  { h: "19", v: 1_620_000 },
  { h: "20", v: 1_150_000 },
  { h: "21", v: 760_000 },
];

export const PAYMENTS = [
  { label: "Tunai", value: 46, color: "#17593e" },
  { label: "QRIS", value: 31, color: "#d3921f" },
  { label: "Kartu Debit", value: 15, color: "#35657f" },
  { label: "Piutang Member", value: 8, color: "#9a937f" },
];

export const CASHFLOW = [
  { m: "Sep", masuk: 168, keluar: 121 },
  { m: "Okt", masuk: 176, keluar: 128 },
  { m: "Nov", masuk: 192, keluar: 134 },
  { m: "Des", masuk: 226, keluar: 151 },
  { m: "Jan", masuk: 204, keluar: 139 },
  { m: "Feb", masuk: 118, keluar: 74 },
];

/* ---------- transaksi & pesanan ---------- */

export type TxMethod = "Tunai" | "QRIS" | "Debit";

export type SalesRecord = {
  id: string;
  ts: number;
  time: string;
  cashier: string;
  items: number;
  method: TxMethod;
  total: number;
  status: "selesai" | "refund";
  lines: { name: string; qty: number; price: number }[];
  fresh?: boolean;
};

/* log penjualan hari ini — dibangkitkan deterministik agar padat & konsisten */
function lcg(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export const SALES_SEED: SalesRecord[] = (() => {
  const rnd = lcg(20260214);
  const methods: TxMethod[] = ["Tunai", "QRIS", "Tunai", "QRIS", "Debit", "Tunai", "QRIS"];
  const cashiers = ["Rani", "Dimas", "Rani", "Rani", "Dimas"];
  let minutes = 9 * 60 + 41;
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  return Array.from({ length: 34 }, (_, i) => {
    minutes -= 4 + Math.floor(rnd() * 9);
    const lineCount = 2 + Math.floor(rnd() * 5);
    const picks = new Set<number>();
    while (picks.size < lineCount) picks.add(Math.floor(rnd() * PRODUCTS.length));
    const lines = Array.from(picks).map((idx) => ({
      name: PRODUCTS[idx].name,
      qty: 1 + Math.floor(rnd() * 3),
      price: PRODUCTS[idx].price,
    }));
    const total = lines.reduce((s, l) => s + l.qty * l.price, 0);
    const hh = String(Math.floor(minutes / 60)).padStart(2, "0");
    const mm = String(minutes % 60).padStart(2, "0");
    return {
      id: `TRX-${88231 - i}`,
      ts: base.getTime() + minutes * 60_000,
      time: `${hh}:${mm}`,
      cashier: cashiers[i % cashiers.length],
      items: lines.reduce((s, l) => s + l.qty, 0),
      method: methods[Math.floor(rnd() * methods.length)],
      total,
      status: (i % 9 === 4 ? "refund" : "selesai") as SalesRecord["status"],
      lines,
    };
  });
})();

export type OrderStatus = "menunggu" | "diproses" | "selesai" | "dibatalkan" | "refund";

export type Order = {
  id: string;
  customer: string;
  date: string;
  items: { name: string; qty: number; price: number }[];
  method: string;
  status: OrderStatus;
  note?: string;
};

export const ORDERS: Order[] = [
  {
    id: "ORD-1048", customer: "Dewi Lestari", date: "Hari ini · 09:20", method: "QRIS", status: "menunggu",
    items: [
      { name: "Beras Rojolele 5 kg", qty: 2, price: 68_000 },
      { name: "Minyak Goreng 2 L", qty: 1, price: 36_500 },
      { name: "Gula Pasir 1 kg", qty: 1, price: 17_500 },
      { name: "Telur Ayam 1 kg", qty: 1, price: 28_000 },
    ],
    note: "Antar sebelum pukul 15:00",
  },
  {
    id: "ORD-1047", customer: "CV Sinar Jaya", date: "Kemarin · 16:42", method: "Transfer", status: "diproses",
    items: [
      { name: "Indomie Goreng (dus)", qty: 10, price: 112_000 },
      { name: "Air Mineral 600 ml (dus)", qty: 6, price: 48_000 },
      { name: "Deterjen Rinso 770 g", qty: 12, price: 24_500 },
    ],
    note: "PO rutin bulanan — faktur pajak",
  },
  {
    id: "ORD-1046", customer: "Andi Prasetyo", date: "Kemarin · 11:05", method: "Tunai", status: "diproses",
    items: [
      { name: "Kopi Susu Aren 250 ml", qty: 6, price: 15_000 },
      { name: "Roti Tawar", qty: 2, price: 14_000 },
      { name: "Susu UHT 250 ml", qty: 4, price: 6_000 },
    ],
  },
  {
    id: "ORD-1045", customer: "Kafe Kopi Kita", date: "2 hari lalu · 14:18", method: "Transfer", status: "selesai",
    items: [
      { name: "Kopi Susu Aren 250 ml", qty: 48, price: 15_000 },
      { name: "Gula Pasir 1 kg", qty: 10, price: 17_500 },
      { name: "Tisu Wajah 250s", qty: 6, price: 15_500 },
    ],
  },
  {
    id: "ORD-1044", customer: "Rina Marlina", date: "2 hari lalu · 10:31", method: "QRIS", status: "selesai",
    items: [
      { name: "Sampo Pantene 170 ml", qty: 2, price: 23_500 },
      { name: "Sabun Mandi 100 g", qty: 3, price: 6_500 },
      { name: "Pasta Gigi 190 g", qty: 1, price: 12_500 },
    ],
  },
  {
    id: "ORD-1043", customer: "Yoga Pratama", date: "3 hari lalu · 19:56", method: "Tunai", status: "dibatalkan",
    items: [{ name: "Jus Jeruk Peras 1 L", qty: 2, price: 18_000 }],
    note: "Stok kosong — dibatalkan sistem",
  },
  {
    id: "ORD-1042", customer: "Warung Bu Tini", date: "3 hari lalu · 08:12", method: "Tunai", status: "selesai",
    items: [
      { name: "Telur Ayam 1 kg", qty: 5, price: 28_500 },
      { name: "Tepung Terigu 1 kg", qty: 4, price: 12_500 },
      { name: "Gula Pasir 1 kg", qty: 3, price: 17_500 },
    ],
  },
  {
    id: "ORD-1041", customer: "Hasan Basri", date: "4 hari lalu · 13:44", method: "QRIS", status: "refund",
    items: [{ name: "Biskuit Kaleng 700 g", qty: 1, price: 32_000 }],
    note: "Kemasan penyok — refund diproses",
  },
];

/* ---------- keuangan ---------- */

export const EXPENSES = [
  { id: "EXP-092", date: "02 Feb", label: "Listrik & Air Toko", category: "Utilitas", amount: 1_240_000, status: "lunas" },
  { id: "EXP-091", date: "01 Feb", label: "Gaji Karyawan (2 orang)", category: "Gaji", amount: 8_600_000, status: "lunas" },
  { id: "EXP-090", date: "15 Feb", label: "Sewa Gudang Bulanan", category: "Sewa", amount: 2_500_000, status: "jatuh tempo" },
  { id: "EXP-089", date: "28 Jan", label: "Supplier Sembako UD Makmur", category: "Barang", amount: 6_120_000, status: "lunas" },
  { id: "EXP-088", date: "25 Jan", label: "Internet & Lisensi Kasir", category: "Utilitas", amount: 349_000, status: "lunas" },
  { id: "EXP-087", date: "22 Jan", label: "Plastik & Kemasan", category: "Operasional", amount: 210_000, status: "lunas" },
];

/* ---------- pelanggan ---------- */

export type Customer = {
  id: string;
  name: string;
  phone: string;
  tier: "Gold" | "Silver" | "Reguler";
  points: number;
  spend: number;
  last: string;
};

export const CUSTOMERS: Customer[] = [
  { id: "CST-001", name: "Dewi Lestari", phone: "0812-3345-1908", tier: "Gold", points: 2450, spend: 12_450_000, last: "Hari ini" },
  { id: "CST-002", name: "CV Sinar Jaya", phone: "0274-556-810", tier: "Gold", points: 5120, spend: 28_900_000, last: "Kemarin" },
  { id: "CST-003", name: "Andi Prasetyo", phone: "0857-2210-4471", tier: "Silver", points: 980, spend: 4_860_000, last: "Kemarin" },
  { id: "CST-004", name: "Kafe Kopi Kita", phone: "0819-8823-7745", tier: "Gold", points: 3210, spend: 16_700_000, last: "2 hari lalu" },
  { id: "CST-005", name: "Rina Marlina", phone: "0813-9034-2216", tier: "Silver", points: 720, spend: 3_540_000, last: "3 hari lalu" },
  { id: "CST-006", name: "Yoga Pratama", phone: "0896-1120-3384", tier: "Reguler", points: 140, spend: 890_000, last: "4 hari lalu" },
  { id: "CST-007", name: "Warung Bu Tini", phone: "0821-7745-0912", tier: "Silver", points: 1150, spend: 5_620_000, last: "5 hari lalu" },
  { id: "CST-008", name: "Hasan Basri", phone: "0852-6601-8873", tier: "Reguler", points: 60, spend: 320_000, last: "6 hari lalu" },
];

/* ---------- pengaturan toko ---------- */

export type StoreConfig = {
  storeName: string;
  address: string;
  phone: string;
  taxRate: number;
  footer: string;
  autoPrint: boolean;
  printer: {
    model: string;
    paper: "58mm" | "80mm";
    copies: number;
    autoCut: boolean;
    printLogo: boolean;
  };
  barcode: {
    format: "EAN-13" | "CODE128";
    prefix: string;
    autoGenerate: boolean;
    labelSize: "kecil" | "sedang";
    showPrice: boolean;
  };
  scanner: {
    type: "USB HID" | "Bluetooth";
    autoEnter: boolean;
    sound: boolean;
  };
  drawer: {
    openOnPayment: boolean;
    openOnShift: boolean;
    delayMs: number;
  };
};

export type Settings = StoreConfig;

export const DEFAULT_CONFIG: StoreConfig = {
  storeName: "Lumbung Mart",
  address: "Jl. Melati No. 12, Yogyakarta",
  phone: "0274-556-810",
  taxRate: 11,
  footer: "Barang dapat ditukar dalam 1×24 jam dengan menunjukkan struk.",
  autoPrint: true,
  printer: { model: "Epson TM-T82", paper: "80mm", copies: 1, autoCut: true, printLogo: true },
  barcode: { format: "CODE128", prefix: "2891", autoGenerate: true, labelSize: "sedang", showPrice: true },
  scanner: { type: "USB HID", autoEnter: true, sound: true },
  drawer: { openOnPayment: true, openOnShift: false, delayMs: 300 },
};

export const PRINTER_MODELS = [
  "Epson TM-T82",
  "Epson TM-T88VI",
  "TPPOS TP-80C",
  "Xprinter XP-58IIH",
  "Bluebam BTP-R580",
];

export const DEVICES = [
  { id: "printer", name: "Printer Struk Epson TM-T82", port: "USB001", status: "terhubung" as const },
  { id: "scanner", name: "Barcode Scanner Honeywell Voyager", port: "COM3 · USB HID", status: "terhubung" as const },
  { id: "drawer", name: "Laci Kasir EPSON UB-E04", port: "RJ11 · Pin 2", status: "terhubung" as const },
  { id: "scale", name: "Timbangan Digital CAS SW-1", port: "COM5", status: "offline" as const },
];

/* ---------- layanan digital (kios agen / PPOB) ---------- */

export type DigitalCat = "pulsa" | "data" | "ewallet" | "listrik" | "bpjs" | "pdam" | "transfer";

export type DigitalTx = {
  id: string;
  ref: string;
  time: string;
  cat: DigitalCat;
  sub: string;
  provider: string;
  target: string;
  nominal: number;
  fee: number;
  commission: number;
  total: number;
  status: "sukses" | "diproses" | "gagal";
  token?: string;
};

export const OPERATORS = [
  { id: "telkomsel", label: "Telkomsel", color: "#d92c20" },
  { id: "indosat", label: "Indosat", color: "#e11d63" },
  { id: "xl", label: "XL Axiata", color: "#1268b3" },
  { id: "tri", label: "Tri", color: "#e8760c" },
  { id: "smartfren", label: "Smartfren", color: "#7c3aed" },
];

export const PULSA_NOMINALS = [5_000, 10_000, 15_000, 20_000, 25_000, 50_000, 100_000];

export const DATA_PACKAGES: Record<string, { id: string; name: string; quota: string; price: number; valid: string }[]> = {
  telkomsel: [
    { id: "t1", name: "Internet Max", quota: "3 GB", price: 30_000, valid: "30 hari" },
    { id: "t2", name: "Internet Max", quota: "6 GB", price: 52_000, valid: "30 hari" },
    { id: "t3", name: "Internet Max", quota: "15 GB", price: 95_000, valid: "30 hari" },
    { id: "t4", name: "Internet Sakti", quota: "25 GB", price: 125_000, valid: "30 hari" },
  ],
  indosat: [
    { id: "i1", name: "Freedom Internet", quota: "2 GB", price: 15_000, valid: "30 hari" },
    { id: "i2", name: "Freedom Internet", quota: "7 GB", price: 40_000, valid: "30 hari" },
    { id: "i3", name: "Freedom Internet", quota: "14 GB", price: 75_000, valid: "30 hari" },
    { id: "i4", name: "Freedom U", quota: "28 GB", price: 110_000, valid: "30 hari" },
  ],
  xl: [
    { id: "x1", name: "Xtra Combo", quota: "4 GB", price: 40_000, valid: "30 hari" },
    { id: "x2", name: "Xtra Combo", quota: "9 GB", price: 65_000, valid: "30 hari" },
    { id: "x3", name: "Xtra Unlimited", quota: "20 GB", price: 105_000, valid: "30 hari" },
  ],
  tri: [
    { id: "r1", name: "Always On", quota: "3 GB", price: 28_000, valid: "Selamanya" },
    { id: "r2", name: "Happy", quota: "12 GB", price: 50_000, valid: "30 hari" },
    { id: "r3", name: "Happy", quota: "25 GB", price: 90_000, valid: "30 hari" },
  ],
  smartfren: [
    { id: "s1", name: "Unlimited Harian", quota: "1 GB/hari", price: 40_000, valid: "28 hari" },
    { id: "s2", name: "Unlimited Harian", quota: "2 GB/hari", price: 80_000, valid: "28 hari" },
    { id: "s3", name: "Volume", quota: "30 GB", price: 60_000, valid: "30 hari" },
  ],
};

export const EWALLETS = [
  { id: "gopay", label: "GoPay", color: "#00a4a0" },
  { id: "ovo", label: "OVO", color: "#6d3fa8" },
  { id: "dana", label: "DANA", color: "#118ee9" },
  { id: "shopeepay", label: "ShopeePay", color: "#ee4d2d" },
  { id: "linkaja", label: "LinkAja", color: "#c0392b" },
];
export const EWALLET_NOMINALS = [10_000, 20_000, 50_000, 100_000, 150_000, 200_000, 300_000, 500_000];

export const TOKEN_NOMINALS = [20_000, 50_000, 100_000, 200_000, 500_000, 1_000_000];

export const BANKS = [
  { id: "bca", label: "BCA", color: "#0060af" },
  { id: "bri", label: "BRI", color: "#00529c" },
  { id: "bni", label: "BNI", color: "#f05a22" },
  { id: "mandiri", label: "Mandiri", color: "#b28c1e" },
  { id: "bsi", label: "BSI", color: "#00a39d" },
  { id: "cimb", label: "CIMB Niaga", color: "#ec1c24" },
];
export const TRANSFER_NOMINALS = [100_000, 250_000, 500_000, 1_000_000, 2_000_000, 5_000_000];
export const TARIK_NOMINALS = [50_000, 100_000, 200_000, 300_000, 500_000];

export const DIGITAL_TXS: DigitalTx[] = [
  { id: "DIG-7301", ref: "PUL-88231140", time: "09:41", cat: "pulsa", sub: "Pulsa Telkomsel", provider: "Telkomsel", target: "0812-9934-1120", nominal: 25_000, fee: 2_000, commission: 1_200, total: 27_000, status: "sukses" },
  { id: "DIG-7300", ref: "PLN-55120937", time: "09:26", cat: "listrik", sub: "Token PLN", provider: "PLN", target: "5371-0921-4482", nominal: 100_000, fee: 2_500, commission: 1_000, total: 102_500, status: "sukses", token: "4521-8834-9067-1290-3345" },
  { id: "DIG-7299", ref: "EWT-10228814", time: "09:12", cat: "ewallet", sub: "Top Up GoPay", provider: "GoPay", target: "0857-2210-4471", nominal: 50_000, fee: 1_500, commission: 800, total: 51_500, status: "sukses" },
  { id: "DIG-7298", ref: "TRF-77451230", time: "08:58", cat: "transfer", sub: "Transfer BRI", provider: "BRI", target: "0038-01-882341-53-1", nominal: 500_000, fee: 6_500, commission: 4_000, total: 506_500, status: "sukses" },
  { id: "DIG-7297", ref: "PDN-90112245", time: "08:44", cat: "pdam", sub: "PDAM Sleman", provider: "PDAM", target: "1044-8821-33", nominal: 67_500, fee: 2_500, commission: 1_500, total: 70_000, status: "sukses" },
  { id: "DIG-7296", ref: "DTA-33291807", time: "08:31", cat: "data", sub: "Paket Data XL 9 GB", provider: "XL Axiata", target: "0819-0023-7745", nominal: 65_000, fee: 2_500, commission: 2_000, total: 67_500, status: "sukses" },
  { id: "DIG-7295", ref: "BJS-44120985", time: "08:19", cat: "bpjs", sub: "BPJS Kesehatan", provider: "BPJS", target: "0001-3388-2210-9", nominal: 105_000, fee: 2_500, commission: 1_500, total: 107_500, status: "sukses" },
  { id: "DIG-7294", ref: "TRK-66120743", time: "08:05", cat: "transfer", sub: "Tarik Tunai", provider: "Agen", target: "Kas Agen", nominal: 300_000, fee: 5_000, commission: 3_500, total: 305_000, status: "sukses" },
  { id: "DIG-7293", ref: "EWT-99812306", time: "07:52", cat: "ewallet", sub: "Top Up DANA", provider: "DANA", target: "0813-5567-0912", nominal: 100_000, fee: 1_500, commission: 800, total: 101_500, status: "sukses" },
  { id: "DIG-7292", ref: "PLN-10293874", time: "07:40", cat: "listrik", sub: "Tagihan PLN", provider: "PLN", target: "5371-4402-9917", nominal: 214_300, fee: 3_000, commission: 1_500, total: 217_300, status: "sukses" },
  { id: "DIG-7291", ref: "PUL-88230417", time: "07:24", cat: "pulsa", sub: "Pulsa Indosat", provider: "Indosat", target: "0856-1190-2231", nominal: 10_000, fee: 2_000, commission: 1_200, total: 12_000, status: "diproses" },
  { id: "DIG-7290", ref: "TRF-66310028", time: "07:11", cat: "transfer", sub: "Transfer BCA", provider: "BCA", target: "8830-2214-905", nominal: 1_000_000, fee: 6_500, commission: 4_000, total: 1_006_500, status: "gagal" },
];

/* ---------- supplier ---------- */

export type Supplier = {
  id: string;
  code: string;
  name: string;
  contact: string;
  phone: string;
  email: string;
  category: string;
  term: "Tunai" | "Tempo 14" | "Tempo 30";
  rating: number;
  balance: number;
  lastOrder: string;
  status: "aktif" | "nonaktif";
};

export const SUPPLIERS: Supplier[] = [
  { id: "SUP-01", code: "MKM", name: "UD Makmur Sembako", contact: "Pak Darmawan", phone: "0812-2745-9012", email: "order@makmur.id", category: "Sembako", term: "Tempo 14", rating: 4.8, balance: 6_120_000, lastOrder: "28 Jan", status: "aktif" },
  { id: "SUP-02", code: "TRK", name: "CV Tirta Kencana", contact: "Bu Santi", phone: "0813-9021-4478", email: "sales@tirtakencana.co.id", category: "Minuman", term: "Tempo 30", rating: 4.6, balance: 3_480_000, lastOrder: "1 Feb", status: "aktif" },
  { id: "SUP-03", code: "SNK", name: "PT Snack Nusantara", contact: "Pak Rendra", phone: "0857-1102-3390", email: "po@snacknusantara.com", category: "Snack", term: "Tunai", rating: 4.4, balance: 0, lastOrder: "25 Jan", status: "aktif" },
  { id: "SUP-04", code: "BKF", name: "UD Berkah Farm", contact: "Pak Yusuf", phone: "0819-3345-8812", email: "berkah.farm@gmail.com", category: "Sembako Segar", term: "Tunai", rating: 4.9, balance: 0, lastOrder: "2 Feb", status: "aktif" },
  { id: "SUP-05", code: "SHG", name: "CV Sinar Higienis", contact: "Bu Maya", phone: "0821-6678-0912", email: "order@sinarhigienis.id", category: "Perawatan", term: "Tempo 14", rating: 4.2, balance: 1_250_000, lastOrder: "26 Jan", status: "aktif" },
  { id: "SUP-06", code: "GRB", name: "PT Griya Bersih", contact: "Pak Anton", phone: "0856-2214-7703", email: "sales@griyabersih.co.id", category: "Rumah Tangga", term: "Tempo 30", rating: 4.5, balance: 2_890_000, lastOrder: "27 Jan", status: "aktif" },
  { id: "SUP-07", code: "RTM", name: "UD Roti Melati", contact: "Bu Melati", phone: "0812-5560-1187", email: "rotimelati@gmail.com", category: "Bakery", term: "Tunai", rating: 4.7, balance: 0, lastOrder: "3 Feb", status: "aktif" },
  { id: "SUP-08", code: "KWJ", name: "CV Kawista Jaya", contact: "Pak Haris", phone: "0852-9903-2245", email: "kawista.jaya@yahoo.com", category: "Minuman", term: "Tempo 14", rating: 4.1, balance: 0, lastOrder: "12 Des", status: "nonaktif" },
];

/* ---------- purchase order ---------- */

export type POStatus = "draft" | "dikirim" | "diterima" | "dibatalkan";

export type PurchaseOrder = {
  id: string;
  supplierId: string;
  date: string;
  due: string;
  items: { productId: string; name: string; qty: number; cost: number }[];
  status: POStatus;
  paid: boolean;
  note?: string;
};

export const poTotal = (po: PurchaseOrder) => po.items.reduce((s, i) => s + i.qty * i.cost, 0);

export const PURCHASE_ORDERS: PurchaseOrder[] = [
  {
    id: "PO-2202", supplierId: "SUP-01", date: "4 Feb", due: "18 Feb", status: "draft", paid: false,
    items: [
      { productId: "p03", name: "Gula Pasir Gulaku 1 kg", qty: 24, cost: 15_000 },
      { productId: "p05", name: "Tepung Segitiga Biru 1 kg", qty: 30, cost: 10_000 },
    ],
    note: "Restok rutin mingguan",
  },
  {
    id: "PO-2201", supplierId: "SUP-01", date: "3 Feb", due: "17 Feb", status: "dikirim", paid: false,
    items: [
      { productId: "p01", name: "Beras Rojolele 5 kg", qty: 20, cost: 61_000 },
      { productId: "p02", name: "Minyak Goreng Fortune 2 L", qty: 24, cost: 32_000 },
      { productId: "p06", name: "Indomie Goreng (pcs)", qty: 200, cost: 2_900 },
    ],
    note: "Prioritas — stok mie menipis",
  },
  {
    id: "PO-2200", supplierId: "SUP-02", date: "1 Feb", due: "3 Mar", status: "dikirim", paid: false,
    items: [
      { productId: "p07", name: "Air Mineral 600 ml", qty: 120, cost: 3_100 },
      { productId: "p09", name: "Teh Botol 450 ml", qty: 48, cost: 4_400 },
      { productId: "p10", name: "Susu UHT Cokelat 250 ml", qty: 48, cost: 4_900 },
    ],
  },
  {
    id: "PO-2199", supplierId: "SUP-04", date: "31 Jan", due: "31 Jan", status: "diterima", paid: true,
    items: [{ productId: "p04", name: "Telur Ayam Negeri 1 kg", qty: 30, cost: 25_000 }],
  },
  {
    id: "PO-2198", supplierId: "SUP-03", date: "25 Jan", due: "25 Jan", status: "diterima", paid: true,
    items: [
      { productId: "p13", name: "Keripik Singkong Balado", qty: 40, cost: 7_600 },
      { productId: "p18", name: "Wafer Cokelat Tango", qty: 60, cost: 6_800 },
      { productId: "p14", name: "Cokelat Silverqueen 65 g", qty: 24, cost: 14_000 },
    ],
  },
  {
    id: "PO-2197", supplierId: "SUP-06", date: "27 Jan", due: "26 Feb", status: "diterima", paid: false,
    items: [
      { productId: "p23", name: "Deterjen Rinso 770 g", qty: 30, cost: 19_500 },
      { productId: "p24", name: "Sabun Cuci Sunlight 755 ml", qty: 36, cost: 9_200 },
    ],
  },
  {
    id: "PO-2196", supplierId: "SUP-05", date: "20 Jan", due: "3 Feb", status: "dibatalkan", paid: false,
    items: [
      { productId: "p19", name: "Sabun Mandi Lifebuoy 100 g", qty: 60, cost: 5_200 },
      { productId: "p21", name: "Pasta Gigi Pepsodent 190 g", qty: 40, cost: 10_000 },
    ],
    note: "Dibatalkan — harga naik sepihak",
  },
];

/* ---------- pembukuan ---------- */

export type LedgerEntry = {
  id: string;
  date: string;
  desc: string;
  category: string;
  type: "masuk" | "keluar";
  amount: number;
  method: string;
};

export const LEDGER: LedgerEntry[] = [
  { id: "L-1043", date: "3 Feb", desc: "Penjualan tunai harian", category: "Penjualan", type: "masuk", amount: 6_840_000, method: "Kasir" },
  { id: "L-1042", date: "3 Feb", desc: "Komisi layanan digital (PPOB)", category: "Komisi Agen", type: "masuk", amount: 96_500, method: "Sistem" },
  { id: "L-1041", date: "2 Feb", desc: "Listrik & air toko", category: "Utilitas", type: "keluar", amount: 1_240_000, method: "Transfer" },
  { id: "L-1040", date: "2 Feb", desc: "Settlement QRIS H-1", category: "Penjualan", type: "masuk", amount: 2_410_000, method: "QRIS" },
  { id: "L-1039", date: "1 Feb", desc: "Gaji karyawan (2 orang)", category: "Gaji", type: "keluar", amount: 8_600_000, method: "Transfer" },
  { id: "L-1038", date: "31 Jan", desc: "Pembelian stok UD Makmur (PO-2195)", category: "Pembelian", type: "keluar", amount: 6_120_000, method: "Transfer" },
  { id: "L-1037", date: "31 Jan", desc: "Penjualan tunai harian", category: "Penjualan", type: "masuk", amount: 7_120_000, method: "Kasir" },
  { id: "L-1036", date: "30 Jan", desc: "Plastik & kemasan", category: "Operasional", type: "keluar", amount: 210_000, method: "Kas" },
  { id: "L-1035", date: "30 Jan", desc: "Cicilan piutang CV Sinar Jaya", category: "Piutang", type: "masuk", amount: 1_500_000, method: "Transfer" },
  { id: "L-1034", date: "29 Jan", desc: "Internet & lisensi kasir", category: "Utilitas", type: "keluar", amount: 349_000, method: "Debit" },
];

export type Debt = {
  id: string;
  party: string;
  desc: string;
  amount: number;
  due: string;
  status: "berjalan" | "jatuh tempo" | "lunas";
};

export const RECEIVABLES: Debt[] = [
  { id: "AR-208", party: "CV Sinar Jaya", desc: "Pembelian grosir Januari (ORD-0988)", amount: 4_350_000, due: "10 Feb", status: "berjalan" },
  { id: "AR-207", party: "Kafe Kopi Kita", desc: "Pasokan kopi mingguan", amount: 1_720_000, due: "7 Feb", status: "jatuh tempo" },
  { id: "AR-206", party: "Warung Bu Tini", desc: "Sembako mingguan", amount: 640_000, due: "12 Feb", status: "berjalan" },
  { id: "AR-205", party: "Andi Prasetyo", desc: "Pesanan katering kecil", amount: 380_000, due: "28 Jan", status: "lunas" },
];

export const PAYABLES: Debt[] = [
  { id: "AP-311", party: "UD Makmur Sembako", desc: "PO-2195 · Sembako", amount: 6_120_000, due: "11 Feb", status: "jatuh tempo" },
  { id: "AP-310", party: "CV Tirta Kencana", desc: "PO-2200 · Minuman", amount: 3_480_000, due: "3 Mar", status: "berjalan" },
  { id: "AP-309", party: "PT Griya Bersih", desc: "PO-2197 · Rumah tangga", amount: 2_890_000, due: "27 Feb", status: "berjalan" },
  { id: "AP-308", party: "CV Sinar Higienis", desc: "PO-2194 · Perawatan", amount: 1_250_000, due: "9 Feb", status: "jatuh tempo" },
  { id: "AP-307", party: "UD Berkah Farm", desc: "PO-2193 · Telur & segar", amount: 980_000, due: "20 Jan", status: "lunas" },
];

/* ---------- notifikasi ---------- */

export const NOTIFICATIONS = [
  { id: 1, tone: "warn" as const, title: "Stok telur ayam menipis", desc: "Sisa 9 kg — di bawah batas minimum 12 kg.", time: "5 mnt lalu" },
  { id: 2, tone: "info" as const, title: "Pesanan ORD-1048 menunggu", desc: "Pesanan baru dari Dewi Lestari · Rp 218.000", time: "18 mnt lalu" },
  { id: 3, tone: "ok" as const, title: "Backup harian selesai", desc: "Data toko ter-backup otomatis pukul 02:00 WIB.", time: "7 jam lalu" },
  { id: 4, tone: "info" as const, title: "Settlement QRIS malam ini", desc: "Rp 2,4 jt akan masuk ke rekening pukul 23:00.", time: "9 jam lalu" },
];
