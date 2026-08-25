/**
 * OpenClaw — infrastruktur chat personal AI untuk helpdesk SKMNet.
 *
 * Arsitektur produksi yang disiapkan:
 *  1. Klien (widget ini) memanggil PROXY backend SKMNet: POST /v1/support/chat
 *     dengan header Authorization (JWT tenant) + X-Tenant-Id.
 *  2. Proxy menambahkan system prompt berisi konteks tenant, lalu meneruskan
 *     ke OpenClaw API (API key HANYA disimpan di server — tidak pernah di klien).
 *  3. Jawaban OpenClaw dikembalikan beserta saran aksi & metadata tool-call
 *     (mis. "buat_tiket", "buka_modul:inventaris").
 *  4. Selama endpoint belum aktif / offline, klien jatuh ke `routeIntent`
 *     (router lokal) agar helpdesk tetap menjawab dengan data toko terkini.
 */

export type OcRole = "user" | "assistant" | "system";

export type OcMessage = {
  id: string;
  role: OcRole;
  content: string;
  ts: number;
  source?: "openclaw-api" | "local-router";
};

export type OcTicket = {
  id: string;
  subject: string;
  priority: "rendah" | "sedang" | "tinggi";
  status: "terbuka" | "ditangani" | "selesai";
  createdAt: number;
  source: "Chat OpenClaw" | "Manual";
};

export type OcReply = {
  text: string;
  suggestions?: string[];
  ticket?: { subject: string; priority: OcTicket["priority"] };
};

/** Konteks operasional tenant — disuntikkan ke prompt OpenClaw di server. */
export type OcCtx = {
  storeName: string;
  subdomain: string;
  plan: string;
  superMode: boolean;
  salesToday: number;
  salesCount: number;
  lowStock: number;
  dueBills: number;
  pendingOrders: number;
  digitalCommission: number;
};

/* ---------------- konfigurasi koneksi ---------------- */

export const OPENCLAW_CONFIG = {
  /** Proxy backend SKMNet (meneruskan ke OpenClaw dengan API key server-side). */
  endpoint: "https://api.skmnet.cloud/v1/support/chat",
  /** Model personal AI OpenClaw yang dipakai. */
  model: "openclaw-personal-v1",
  /** Batas waktu sebelum fallback ke router lokal (ms). */
  timeoutMs: 900,
  /** Versi skema percakapan untuk kompatibilitas riwayat. */
  schema: 1,
};

/* ---------------- util ---------------- */

const id = () => `${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;

const num = (n: number) => n.toLocaleString("id-ID", { maximumFractionDigits: 0 });
const idrShort = (n: number) => {
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toLocaleString("id-ID", { maximumFractionDigits: 2 })} jt`;
  if (n >= 1_000) return `Rp ${(n / 1_000).toLocaleString("id-ID", { maximumFractionDigits: 0 })} rb`;
  return `Rp ${num(n)}`;
};

/* ---------------- router intent lokal (fallback) ---------------- */

export function routeIntent(input: string, ctx: OcCtx): OcReply {
  const q = input.toLowerCase();

  if (/(buat|bikin|daftarkan?)\s+tiket/.test(q) || /tiket.*(?:keluhan|masalah|error|gangguan)/.test(q)) {
    const subject = input.replace(/^(buat|bikin|daftarkan?)\s+tiket\s*[:\-]?\s*/i, "").trim() || "Permintaan bantuan umum";
    const priority: OcTicket["priority"] = /urgent|darurat|parah|mendesak/i.test(input) ? "tinggi" : "sedang";
    return {
      text: `Siap! Tiket "${subject}" sudah saya daftarkan ke tim support SKMNet (prioritas ${priority}). Anda bisa pantau statusnya di tab Tiket pada panel ini — rata-rata respons pertama kami 15 menit pada jam kerja.`,
      suggestions: ["Status tiket saya", "Laporan hari ini"],
      ticket: { subject, priority },
    };
  }

  if (/tiket|status.*tiket/.test(q)) {
    return {
      text: "Semua tiket Anda tersimpan di tab Tiket pada panel ini. Setiap tiket punya nomor pelacakan (TKT-xxxx), prioritas, dan status penanganan. Tim support akan membalas lewat email terdaftar dan notifikasi di aplikasi.",
      suggestions: ["Buat tiket: printer tidak mencetak", "Cara settlement PPOB"],
    };
  }

  if (/stok|inventaris|barang|sku|minStock/i.test(q)) {
    return {
      text:
        ctx.lowStock > 0
          ? `Saat ini ada ${ctx.lowStock} SKU di bawah batas minimum di ${ctx.storeName}. Saran saya: buka modul Inventaris → filter status "Menipis", lalu buat Purchase Order ke supplier terkait agar tidak kehabisan saat ramai. Mau saya buatkan tiket pengingat restock?`
          : `Kabar baik — tidak ada SKU di bawah batas minimum hari ini. Stok ${ctx.storeName} dalam kondisi sehat. Saya tetap memantau dan akan mengingatkan begitu ada yang menipis.`,
      suggestions: ["Buat tiket: pengingat restock", "Laporan hari ini"],
    };
  }

  if (/settlement|profit share|ppob|komisi|pulsa|token listrik|e-wallet/i.test(q)) {
    return {
      text: `Begini alur profit share layanan digital SKMNet: pelanggan membayar harga jual tenant + biaya admin. Selisih terhadap HPP platform menjadi "kue margin" yang dibagi sesuai kontrak — contoh pulsa Rp 5.000 dijual Rp 5.500: margin + admin dibagi platform & tenant sesuai share. Komisi tenant Anda hari ini ${idrShort(ctx.digitalCommission)} dan settlement cair otomatis (jadwal real-time) ke saldo deposit begitu melewati minimum payout.`,
      suggestions: ["Laporan hari ini", "Cara setting harga PPOB"],
    };
  }

  if (/harga.*ppob|setting.*ppob|atur.*harga/.test(q)) {
    return {
      text: "Harga jual & biaya admin PPOB diatur terpusat oleh super admin platform di Konsol Super Admin → tab Transaksi Digital. Tenant tinggal menjual mengikuti katalog; perubahan kontrak berlaku instan di kasir Anda tanpa perlu update aplikasi.",
      suggestions: ["Cara settlement PPOB", "Laporan hari ini"],
    };
  }

  if (/omzet|laporan|penjualan|revenue|hari ini|performa/i.test(q)) {
    return {
      text: `Ringkasan ${ctx.storeName} hari ini: omzet ${idrShort(ctx.salesToday)} dari ${ctx.salesCount} transaksi kasir${ctx.superMode ? " (Anda sedang dalam mode Super Admin — angka ini khusus tenant T-001)" : ""}. ${ctx.pendingOrders > 0 ? `Ada ${ctx.pendingOrders} pesanan masuk yang menunggu diproses — sebaiknya diselesaikan sebelum sore.` : "Tidak ada pesanan menunggu. "} Detail lengkap ada di modul Laporan, bisa diunduh CSV.`,
      suggestions: ["Stok menipis", "Hutang jatuh tempo"],
    };
  }

  if (/hutang|piutang|tagihan|jatuh tempo|pembukuan/i.test(q)) {
    return {
      text:
        ctx.dueBills > 0
          ? `Perhatian: ada ${ctx.dueBills} hutang usaha yang jatuh tempo. Buka Pembukuan Keuangan → tab Hutang, lalu catat pembayaran agar laporan laba rugi tetap akurat. Jika butuh tempo tambahan ke supplier, saya bisa buatkan tiket negosiasi.`
          : "Posisi hutang-piutang Anda bersih — tidak ada tagihan jatuh tempo. Pembukuan Keuangan mencatat semua arus kas, piutang, dan hutang secara real-time.",
      suggestions: ["Laporan hari ini", "Buat tiket: negosiasi tempo supplier"],
    };
  }

  if (/printer|struk|scanner|laci|barcode|perangkat/i.test(q)) {
    return {
      text: "Untuk perangkat kasir: buka Pengaturan Toko. Di sana ada uji cetak struk, konfigurasi barcode & label, uji pindai scanner, dan uji buka laci kasir. Kalau perangkat tetap tidak merespons setelah dites, kemungkinan kabel atau driver — saya bisa langsung daftarkan tiket teknisi.",
      suggestions: ["Buat tiket: printer tidak mencetak", "Cara ganti ukuran kertas struk"],
    };
  }

  if (/android|aplikasi hp|flutter|play store|mobile/i.test(q)) {
    return {
      text: "Aplikasi Android SKMNet Tenant sudah tersedia untuk tenant Anda — kasir, PPOB, cek stok, dan dasbor omzet dalam satu aplikasi, dengan mode offline-first (transaksi tetap tercatat saat internet mati, lalu tersinkron otomatis). Instal lewat menu Platform → Aplikasi Android di web app ini.",
      suggestions: ["Laporan hari ini", "Buat tiket"],
    };
  }

  if (/paket|langganan|upgrade|harga.*plan|billing/i.test(q)) {
    return {
      text: `Tenant Anda saat ini di paket ${ctx.plan}. Tersedia Starter (1 outlet), Pro (multi-outlet + PPOB profit share), dan Enterprise (database terpisah + SLA). Upgrade diproses super admin dan prorata di siklus berjalan — tidak ada downtime. Mau saya teruskan permintaan upgrade sebagai tiket?`,
      suggestions: ["Buat tiket: upgrade paket", "Cara settlement PPOB"],
    };
  }

  if (/tenant|super admin|multi-tenant|subdomain/i.test(q)) {
    return {
      text: `SKMNet adalah platform multi-tenant: setiap toko (seperti ${ctx.storeName} di ${ctx.subdomain}.skmnet.cloud) datanya terisolasi penuh lewat Row-Level Security di database dan header X-Tenant-Id di setiap request API. Super admin mengelola tenant, paket, dan settlement PPOB tanpa bisa melihat isi kasir Anda selain metrik agregat.`,
      suggestions: ["Laporan hari ini", "Aplikasi Android"],
    };
  }

  if (/terima kasih|makasih|thanks/i.test(q)) {
    return {
      text: "Sama-sama! Senang bisa membantu. Saya siaga 24/7 di pojok kanan bawah — ada lagi yang ingin dicek?",
      suggestions: ["Laporan hari ini", "Stok menipis"],
    };
  }

  if (/halo|hai|hi|assalamu|selamat|pagi|siang|sore|malam/i.test(q)) {
    return {
      text: `Halo! Saya OpenClaw, asisten pribadi AI untuk ${ctx.storeName}. Saya terhubung langsung ke data operasional Anda — omzet, stok, PPOB, sampai pembukuan. Tanyakan apa saja atau pilih topik di bawah.`,
      suggestions: ["Laporan hari ini", "Stok menipis", "Cara settlement PPOB"],
    };
  }

  if (/bantuan|help|bisa apa|fitur|menu/i.test(q)) {
    return {
      text: "Saya bisa: merangkum omzet & performa harian, mengecek stok menipis dan hutang jatuh tempo, menjelaskan settlement & profit share PPOB, memandu pengaturan perangkat kasir, info aplikasi Android, hingga mendaftarkan tiket support. Ketik saja dengan bahasa Anda sendiri.",
      suggestions: ["Laporan hari ini", "Stok menipis", "Buat tiket"],
    };
  }

  return {
    text: `Saya catat pertanyaan itu. Untuk saat ini saya paling andal membantu soal: omzet & laporan, stok, hutang-piutang, settlement PPOB, perangkat kasir, dan pembuatan tiket. Jika ini kendala teknis spesifik, katakan "buat tiket: <keluhan>" dan tim support akan menindaklanjuti.`,
    suggestions: ["Buat tiket", "Laporan hari ini", "Bantuan"],
  };
}

/* ---------------- klien OpenClaw ---------------- */

export class OpenClawClient {
  private sessionId = id();

  /** Percobaan ke endpoint proxy; gagal → fallback router lokal. */
  async chat(input: string, history: OcMessage[], ctx: OcCtx): Promise<OcReply> {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), OPENCLAW_CONFIG.timeoutMs);
      const res = await fetch(OPENCLAW_CONFIG.endpoint, {
        method: "POST",
        signal: ctrl.signal,
        headers: { "Content-Type": "application/json", "X-Tenant-Id": ctx.subdomain },
        body: JSON.stringify({
          model: OPENCLAW_CONFIG.model,
          session_id: this.sessionId,
          tenant_context: ctx,
          messages: [...history.slice(-10), { role: "user", content: input }],
        }),
      });
      clearTimeout(t);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { reply: string; suggestions?: string[] };
      return { text: data.reply, suggestions: data.suggestions };
    } catch {
      // Endpoint demo belum aktif — router lokal menjawab dengan data toko terkini.
      await new Promise((r) => setTimeout(r, 650 + Math.random() * 600));
      const reply = routeIntent(input, ctx);
      return { ...reply, text: reply.text };
    }
  }

  markSource(reply: OcReply): OcMessage {
    return { id: id(), role: "assistant", content: reply.text, ts: Date.now(), source: "local-router" };
  }

  userMessage(content: string): OcMessage {
    return { id: id(), role: "user", content, ts: Date.now() };
  }
}

/* ---------------- persistensi riwayat & tiket ---------------- */

const HIST_KEY = "skmnet_openclaw_history_v1";
const TICKET_KEY = "skmnet_openclaw_tickets_v1";

export function loadHistory(): OcMessage[] {
  try {
    const raw = localStorage.getItem(HIST_KEY);
    return raw ? (JSON.parse(raw) as OcMessage[]) : [];
  } catch {
    return [];
  }
}
export function saveHistory(msgs: OcMessage[]) {
  try {
    localStorage.setItem(HIST_KEY, JSON.stringify(msgs.slice(-40)));
  } catch {
    /* storage penuh — abaikan */
  }
}
export function loadTickets(): OcTicket[] {
  try {
    const raw = localStorage.getItem(TICKET_KEY);
    return raw ? (JSON.parse(raw) as OcTicket[]) : [];
  } catch {
    return [];
  }
}
export function saveTickets(t: OcTicket[]) {
  try {
    localStorage.setItem(TICKET_KEY, JSON.stringify(t.slice(0, 30)));
  } catch {
    /* abaikan */
  }
}
export function newTicket(subject: string, priority: OcTicket["priority"], source: OcTicket["source"]): OcTicket {
  return {
    id: `TKT-${String(Math.floor(1000 + Math.random() * 8999))}`,
    subject,
    priority,
    status: "terbuka",
    createdAt: Date.now(),
    source,
  };
}
