export type Product = {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  minStock: number;
  sold: number;
};

export const PRODUCTS: Product[] = [
  { id: "p01", sku: "SMB-01", name: "Beras Rojolele 5 kg", category: "Sembako", price: 68000, stock: 42, minStock: 10, sold: 86 },
  { id: "p02", sku: "SMB-02", name: "Minyak Goreng Fortune 2 L", category: "Sembako", price: 36500, stock: 18, minStock: 12, sold: 132 },
  { id: "p03", sku: "SMB-03", name: "Gula Pasir Gulaku 1 kg", category: "Sembako", price: 17500, stock: 55, minStock: 15, sold: 210 },
  { id: "p04", sku: "SMB-04", name: "Telur Ayam Negeri 1 kg", category: "Sembako", price: 28500, stock: 9, minStock: 12, sold: 174 },
  { id: "p05", sku: "SMB-05", name: "Tepung Segitiga Biru 1 kg", category: "Sembako", price: 12500, stock: 40, minStock: 10, sold: 96 },
  { id: "p06", sku: "SMB-06", name: "Indomie Goreng (pcs)", category: "Sembako", price: 3500, stock: 240, minStock: 60, sold: 940 },
  { id: "p07", sku: "MNM-01", name: "Air Mineral 600 ml", category: "Minuman", price: 4000, stock: 180, minStock: 48, sold: 720 },
  { id: "p08", sku: "MNM-02", name: "Kopi Susu Aren 250 ml", category: "Minuman", price: 15000, stock: 26, minStock: 12, sold: 388 },
  { id: "p09", sku: "MNM-03", name: "Teh Botol 450 ml", category: "Minuman", price: 5500, stock: 64, minStock: 24, sold: 410 },
  { id: "p10", sku: "MNM-04", name: "Susu UHT Cokelat 250 ml", category: "Minuman", price: 6000, stock: 11, minStock: 24, sold: 356 },
  { id: "p11", sku: "MNM-05", name: "Jus Jeruk Peras 1 L", category: "Minuman", price: 18000, stock: 0, minStock: 6, sold: 120 },
  { id: "p12", sku: "MNM-06", name: "Sparkling Water 330 ml", category: "Minuman", price: 12000, stock: 33, minStock: 10, sold: 84 },
  { id: "p13", sku: "SNK-01", name: "Keripik Singkong Balado", category: "Snack", price: 9500, stock: 47, minStock: 15, sold: 264 },
  { id: "p14", sku: "SNK-02", name: "Cokelat Silverqueen 65 g", category: "Snack", price: 17500, stock: 29, minStock: 12, sold: 190 },
  { id: "p15", sku: "SNK-03", name: "Biskuit Kaleng 700 g", category: "Snack", price: 32000, stock: 14, minStock: 8, sold: 62 },
  { id: "p16", sku: "SNK-04", name: "Kacang Garuda 250 g", category: "Snack", price: 13500, stock: 38, minStock: 12, sold: 148 },
  { id: "p17", sku: "SNK-05", name: "Roti Tawar Sari Roti", category: "Snack", price: 14000, stock: 7, minStock: 10, sold: 205 },
  { id: "p18", sku: "SNK-06", name: "Wafer Cokelat Tango", category: "Snack", price: 8500, stock: 72, minStock: 20, sold: 318 },
  { id: "p19", sku: "PRW-01", name: "Sabun Mandi Lifebuoy 100 g", category: "Perawatan", price: 6500, stock: 88, minStock: 24, sold: 296 },
  { id: "p20", sku: "PRW-02", name: "Sampo Pantene 170 ml", category: "Perawatan", price: 23500, stock: 21, minStock: 10, sold: 118 },
  { id: "p21", sku: "PRW-03", name: "Pasta Gigi Pepsodent 190 g", category: "Perawatan", price: 12500, stock: 45, minStock: 15, sold: 232 },
  { id: "p22", sku: "PRW-04", name: "Tisu Wajah 250 sheet", category: "Perawatan", price: 15500, stock: 52, minStock: 15, sold: 186 },
  { id: "p23", sku: "RMT-01", name: "Deterjen Rinso 770 g", category: "Rumah Tangga", price: 24500, stock: 34, minStock: 12, sold: 154 },
  { id: "p24", sku: "RMT-02", name: "Sabun Cuci Sunlight 755 ml", category: "Rumah Tangga", price: 11500, stock: 41, minStock: 15, sold: 268 },
  { id: "p25", sku: "RMT-03", name: "Kantong Sampah 60×100", category: "Rumah Tangga", price: 9000, stock: 60, minStock: 20, sold: 92 },
  { id: "p26", sku: "RMT-04", name: "Karbol Wangi 800 ml", category: "Rumah Tangga", price: 15500, stock: 27, minStock: 10, sold: 104 },
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

export const TRANSACTIONS = [
  { id: "TRX-88231", time: "09:14", cashier: "Rani", items: 6, method: "Tunai" as TxMethod, total: 148_500, status: "selesai" },
  { id: "TRX-88230", time: "09:02", cashier: "Rani", items: 3, method: "QRIS" as TxMethod, total: 56_000, status: "selesai" },
  { id: "TRX-88229", time: "08:47", cashier: "Dimas", items: 9, method: "Tunai" as TxMethod, total: 232_000, status: "selesai" },
  { id: "TRX-88228", time: "08:31", cashier: "Dimas", items: 2, method: "Debit" as TxMethod, total: 41_000, status: "refund" },
  { id: "TRX-88227", time: "08:12", cashier: "Rani", items: 5, method: "QRIS" as TxMethod, total: 97_500, status: "selesai" },
  { id: "TRX-88226", time: "07:58", cashier: "Rani", items: 4, method: "Tunai" as TxMethod, total: 63_500, status: "selesai" },
  { id: "TRX-88225", time: "07:41", cashier: "Dimas", items: 7, method: "QRIS" as TxMethod, total: 184_000, status: "selesai" },
];

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

export type Settings = {
  storeName: string;
  address: string;
  taxRate: number;
  footer: string;
  autoPrint: boolean;
};

/* ---------- notifikasi ---------- */

export const NOTIFICATIONS = [
  { id: 1, tone: "warn" as const, title: "Stok telur ayam menipis", desc: "Sisa 9 kg — di bawah batas minimum 12 kg.", time: "5 mnt lalu" },
  { id: 2, tone: "info" as const, title: "Pesanan ORD-1048 menunggu", desc: "Pesanan baru dari Dewi Lestari · Rp 218.000", time: "18 mnt lalu" },
  { id: 3, tone: "ok" as const, title: "Backup harian selesai", desc: "Data toko ter-backup otomatis pukul 02:00 WIB.", time: "7 jam lalu" },
  { id: 4, tone: "info" as const, title: "Settlement QRIS malam ini", desc: "Rp 2,4 jt akan masuk ke rekening pukul 23:00.", time: "9 jam lalu" },
];
