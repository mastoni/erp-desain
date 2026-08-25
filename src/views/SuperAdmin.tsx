import { useMemo, useState, type ReactNode } from "react";
import {
  MRR_TREND,
  SERVICE_TO_CAT,
  SYSTEM_SERVICES,
  svcPie,
  svcPlatformCut,
  svcTenantCut,
  type AuditAction,
  type AuditLog,
  type DigitalService,
  type Plan,
  type PlatformTx,
  type SaRole,
  type ServiceId,
  type SettlementCfg,
  type Tenant,
  type TenantStatus,
  type TenantUser,
} from "../superadmin";
import { cx, downloadCsv, idr, idrShort, num } from "../lib/format";
import { AreaChart, Donut, Sparkline } from "../components/charts";
import { Badge, Modal, ModalHead, Reveal, SectionHead, Switch, useCountUp } from "../components/ui";
import type { Toast } from "../components/ui";
import {
  IconActivity,
  IconBuilding,
  IconCheck,
  IconCoins,
  IconDatabase,
  IconDownload,
  IconGlobe,
  IconKey,
  IconPencil,
  IconPlus,
  IconSearch,
  IconServer,
  IconSliders,
  IconSwap,
  IconTrash,
  IconUsers,
  IconX,
  IconZap,
} from "../components/icons";

type Push = (msg: string, tone?: Toast["tone"]) => void;
type LogFn = (action: AuditAction, entity: string, detail: string) => void;
type Tab = "ikhtisar" | "tenants" | "digital" | "plans" | "users" | "schema" | "audit";

const ROLE_META: Record<SaRole, { label: string; tone: "honey" | "pine" | "tide" | "fog" }> = {
  super_admin: { label: "Super Admin", tone: "honey" },
  owner: { label: "Pemilik", tone: "pine" },
  manajer: { label: "Manajer", tone: "tide" },
  kasir: { label: "Kasir", tone: "fog" },
};

const STATUS_META: Record<TenantStatus, { label: string; tone: "pine" | "tide" | "clay" }> = {
  aktif: { label: "Aktif", tone: "pine" },
  trial: { label: "Trial", tone: "tide" },
  ditangguhkan: { label: "Ditangguhkan", tone: "clay" },
};

const ACTION_META: Record<AuditAction, { tone: "pine" | "tide" | "clay" | "fog" | "honey" }> = {
  CREATE: { tone: "pine" },
  UPDATE: { tone: "tide" },
  DELETE: { tone: "clay" },
  LOGIN: { tone: "fog" },
  SUSPEND: { tone: "honey" },
  AKTIVASI: { tone: "pine" },
};

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

/* ================= ERD ================= */

type Field = { n: string; tag?: "PK" | "UQ" | "FK" | "T" | "J" };
type DbTable = { name: string; note: string; fields: Field[]; x: number; y: number };

const W = 250;
const HDR = 26;
const RH = 19;
const h = (t: DbTable) => HDR + t.fields.length * RH;

const T1Y = 16;
const T2Y = 218;
const T3Y = 401;

const DB_TABLES: DbTable[] = [
  {
    name: "plans", note: "paket langganan", x: 20, y: T1Y,
    fields: [
      { n: "id", tag: "PK" }, { n: "name" }, { n: "price" }, { n: "max_users" }, { n: "max_products" }, { n: "features", tag: "J" },
    ],
  },
  {
    name: "tenants", note: "partisi utama", x: 355, y: T1Y,
    fields: [
      { n: "id", tag: "PK" }, { n: "subdomain", tag: "UQ" }, { n: "name" }, { n: "plan_id", tag: "FK" }, { n: "status" }, { n: "region" }, { n: "settings", tag: "J" }, { n: "created_at" },
    ],
  },
  {
    name: "users", note: "akses lintas tenant", x: 690, y: T1Y,
    fields: [
      { n: "id", tag: "PK" }, { n: "tenant_id", tag: "FK" }, { n: "role" }, { n: "name" }, { n: "email", tag: "UQ" }, { n: "status" },
    ],
  },
  {
    name: "products", note: "per tenant", x: 20, y: T2Y,
    fields: [
      { n: "id", tag: "PK" }, { n: "tenant_id", tag: "T" }, { n: "sku" }, { n: "name" }, { n: "category" }, { n: "price" }, { n: "stock" },
    ],
  },
  {
    name: "sales_transactions", note: "per tenant", x: 355, y: T2Y,
    fields: [
      { n: "id", tag: "PK" }, { n: "tenant_id", tag: "T" }, { n: "receipt_no" }, { n: "user_id", tag: "FK" }, { n: "total" }, { n: "method" }, { n: "created_at" },
    ],
  },
  {
    name: "purchase_orders", note: "per tenant", x: 690, y: T2Y,
    fields: [
      { n: "id", tag: "PK" }, { n: "tenant_id", tag: "T" }, { n: "supplier_id", tag: "FK" }, { n: "status" }, { n: "total" }, { n: "due" },
    ],
  },
  {
    name: "audit_logs", note: "tenant_id NULL = platform", x: 20, y: T3Y,
    fields: [
      { n: "id", tag: "PK" }, { n: "tenant_id", tag: "FK" }, { n: "actor_id", tag: "FK" }, { n: "action" }, { n: "entity" }, { n: "meta", tag: "J" }, { n: "ip" },
    ],
  },
  {
    name: "sales_items", note: "per tenant", x: 355, y: T3Y,
    fields: [
      { n: "id", tag: "PK" }, { n: "tx_id", tag: "FK" }, { n: "product_id", tag: "FK" }, { n: "qty" }, { n: "price" }, { n: "subtotal" },
    ],
  },
  {
    name: "ledger_entries", note: "per tenant", x: 690, y: T3Y,
    fields: [
      { n: "id", tag: "PK" }, { n: "tenant_id", tag: "T" }, { n: "type" }, { n: "ref" }, { n: "amount" }, { n: "created_at" },
    ],
  },
];

const RELS: [string, number, string, number][] = [
  ["plans", 0, "tenants", 3],
  ["tenants", 0, "users", 1],
  ["tenants", 0, "products", 1],
  ["tenants", 0, "sales_transactions", 1],
  ["tenants", 0, "purchase_orders", 1],
  ["users", 0, "sales_transactions", 3],
  ["sales_transactions", 0, "sales_items", 1],
  ["products", 0, "sales_items", 2],
];

function linkPath(from: DbTable, fi: number, to: DbTable, ti: number): { d: string; end: [number, number] } {
  const fy = from.y + HDR + fi * RH + RH / 2;
  const ty = to.y + HDR + ti * RH + RH / 2;
  if (from.y === to.y) {
    const right = from.x < to.x;
    const x1 = right ? from.x + W : from.x;
    const x2 = right ? to.x : to.x + W;
    const mid = (x1 + x2) / 2;
    return { d: `M ${x1} ${fy} H ${mid} V ${ty} H ${x2}`, end: [x2, ty] };
  }
  if (from.x === to.x) {
    const y1 = from.y + h(from);
    return { d: `M ${from.x + W / 2} ${y1} V ${to.y}`, end: [from.x + W / 2, to.y] };
  }
  const right = to.x > from.x;
  const x1 = right ? from.x + W : from.x;
  const x2 = right ? to.x : to.x + W;
  const mid = (x1 + x2) / 2;
  return { d: `M ${x1} ${fy} H ${mid} V ${ty} H ${x2}`, end: [x2, ty] };
}

const TAG_STYLE: Record<string, { bg: string; fg: string }> = {
  PK: { bg: "#d3921f", fg: "#1a2620" },
  UQ: { bg: "#e2e0d2", fg: "#68746c" },
  FK: { bg: "#dfe9f0", fg: "#35657f" },
  T: { bg: "#17593e", fg: "#f2efe2" },
  J: { bg: "#e2e0d2", fg: "#68746c" },
};

function Erd() {
  const [hover, setHover] = useState<string | null>(null);
  const byName = useMemo(() => Object.fromEntries(DB_TABLES.map((t) => [t.name, t])), []);

  return (
    <div className="overflow-x-auto">
      <svg viewBox="0 0 960 578" className="min-w-[760px] w-full">
        {/* garis relasi */}
        {RELS.map(([f, fi, t, ti], i) => {
          const p = linkPath(byName[f], fi, byName[t], ti);
          const hot = hover === f || hover === t;
          return (
            <g key={i}>
              <path d={p.d} fill="none" stroke={hot ? "#d3921f" : "#17593e"} strokeOpacity={hot ? 0.95 : 0.4} strokeWidth={hot ? 2 : 1.4} strokeDasharray={f === "plans" ? "5 4" : undefined} style={{ transition: "all 0.2s" }} />
              <circle cx={p.end[0]} cy={p.end[1]} r="3.2" fill={hot ? "#d3921f" : "#17593e"} fillOpacity={hot ? 1 : 0.55} style={{ transition: "all 0.2s" }} />
            </g>
          );
        })}
        {/* tabel */}
        {DB_TABLES.map((t) => {
          const hot = hover === t.name;
          const related = RELS.some(([f, , tt]) => (f === t.name && hover === tt) || (tt === t.name && hover === f));
          return (
            <g
              key={t.name}
              onMouseEnter={() => setHover(t.name)}
              onMouseLeave={() => setHover(null)}
              style={{ cursor: "default" }}
            >
              <rect x={t.x} y={t.y} width={W} height={h(t)} rx="7" fill={hot ? "#ffffff" : "#fbfaf5"} stroke={hot ? "#d3921f" : related ? "#17593e" : "#cfcdbe"} strokeWidth={hot ? 1.8 : 1.1} style={{ transition: "all 0.2s", filter: hot ? "drop-shadow(0 8px 16px rgba(26,38,32,0.16))" : undefined }} />
              <rect x={t.x} y={t.y} width={W} height={HDR} rx="7" fill={hot ? "#10402c" : "#17593e"} style={{ transition: "fill 0.2s" }} />
              <rect x={t.x} y={t.y + HDR - 7} width={W} height={7} fill={hot ? "#10402c" : "#17593e"} />
              <text x={t.x + 10} y={t.y + 17} fontSize="11.5" fontWeight="700" fill="#f2efe2" fontFamily="IBM Plex Mono, monospace">{t.name}</text>
              <text x={t.x + W - 10} y={t.y + 16.5} fontSize="8" fill="#f2efe2" fillOpacity="0.65" textAnchor="end">{t.note}</text>
              {t.fields.map((fl, i) => {
                const ry = t.y + HDR + i * RH;
                const isTenant = fl.tag === "T";
                return (
                  <g key={fl.n}>
                    {isTenant && <rect x={t.x + 1} y={ry} width={W - 2} height={RH} fill="#e2ecdf" />}
                    <text x={t.x + 12} y={ry + 13} fontSize="10.5" fontFamily="IBM Plex Mono, monospace" fontWeight={isTenant ? 700 : 450} fill={isTenant ? "#10402c" : "#1a2620"}>
                      {fl.n}
                    </text>
                    {fl.tag && (
                      <>
                        <rect x={t.x + W - 42} y={ry + 3.5} width={30} height={12} rx="3" fill={TAG_STYLE[fl.tag].bg} />
                        <text x={t.x + W - 27} y={ry + 12.5} fontSize="7.5" fontWeight="700" fill={TAG_STYLE[fl.tag].fg} textAnchor="middle">{fl.tag}</text>
                      </>
                    )}
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

const STRATEGIES = [
  {
    id: "db", name: "Database per Tenant", bars: [5, 1, 2],
    desc: "Setiap tenant punya database fisik sendiri. Isolasi tertinggi — dipakai tenant Enterprise dengan kebutuhan kepatuhan khusus.",
  },
  {
    id: "schema", name: "Schema per Tenant", bars: [4, 3, 3],
    desc: "Satu database, schema terpisah per tenant (tenant_001.products, dst). Isolasi kuat dengan biaya operasional menengah.",
  },
  {
    id: "rls", name: "Row-Level Security (RLS)", bars: [3, 5, 4], rec: true,
    desc: "Satu database & schema bersama; setiap baris dipartisi oleh tenant_id dan dikunci policy RLS PostgreSQL. Paling hemat dan elastis — default Lumbung Cloud.",
  },
];

/* ================= Komponen utama ================= */

type TenantForm = {
  id: string | null;
  name: string;
  subdomain: string;
  planId: string;
  region: string;
  owner: string;
  email: string;
  status: TenantStatus;
};

export function SuperAdmin({
  tenants,
  setTenants,
  plans,
  setPlans,
  users,
  setUsers,
  services,
  setServices,
  platformTxs,
  setPlatformTxs,
  settlement,
  setSettlement,
  logs,
  log,
  push,
}: {
  tenants: Tenant[];
  setTenants: React.Dispatch<React.SetStateAction<Tenant[]>>;
  plans: Plan[];
  setPlans: React.Dispatch<React.SetStateAction<Plan[]>>;
  users: TenantUser[];
  setUsers: React.Dispatch<React.SetStateAction<TenantUser[]>>;
  services: DigitalService[];
  setServices: React.Dispatch<React.SetStateAction<DigitalService[]>>;
  platformTxs: PlatformTx[];
  setPlatformTxs: React.Dispatch<React.SetStateAction<PlatformTx[]>>;
  settlement: SettlementCfg;
  setSettlement: React.Dispatch<React.SetStateAction<SettlementCfg>>;
  logs: AuditLog[];
  log: LogFn;
  push: Push;
}) {
  const [tab, setTab] = useState<Tab>("ikhtisar");
  const [q, setQ] = useState("");
  const [fPlan, setFPlan] = useState("semua");
  const [fStatus, setFStatus] = useState("semua");
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [form, setForm] = useState<TenantForm>({ id: null, name: "", subdomain: "", planId: "starter", region: "", owner: "", email: "", status: "trial" });
  const [formErr, setFormErr] = useState<string | null>(null);
  const [delTarget, setDelTarget] = useState<Tenant | null>(null);
  const [userModal, setUserModal] = useState(false);
  const [uf, setUf] = useState({ name: "", email: "", tenantId: "T-001", role: "kasir" as SaRole });
  const [auditFilter, setAuditFilter] = useState<"semua" | AuditAction>("semua");
  const [strategy, setStrategy] = useState("rls");

  /* ---------- state transaksi digital ---------- */
  const [svcTenantFor, setSvcTenantFor] = useState<ServiceId | null>(null);
  const [simSvc, setSimSvc] = useState<ServiceId>("pulsa");
  const [settleFilter, setSettleFilter] = useState<"semua" | "berhasil" | "pending">("semua");
  const [settleTenant, setSettleTenant] = useState("semua");

  /* ---------- turunan ---------- */
  const activeTenants = tenants.filter((t) => t.status === "aktif");
  const mrr = activeTenants.reduce((s, t) => s + (plans.find((p) => p.id === t.planId)?.price ?? 0), 0);
  const mrrAnim = useCountUp(mrr);
  const activeUsers = users.filter((u) => u.active).length;
  const totalSku = tenants.reduce((s, t) => s + t.products, 0);

  const planName = (id: string) => plans.find((p) => p.id === id)?.name ?? "—";
  const planTone = (id: string) => (id === "enterprise" ? "honey" : id === "pro" ? "pine" : "tide") as "honey" | "pine" | "tide";

  const filteredTenants = tenants.filter(
    (t) =>
      (fPlan === "semua" || t.planId === fPlan) &&
      (fStatus === "semua" || t.status === fStatus) &&
      (t.name.toLowerCase().includes(q.toLowerCase()) || t.subdomain.includes(q.toLowerCase()) || t.region.toLowerCase().includes(q.toLowerCase()))
  );

  const donutItems = plans.map((p, i) => ({
    label: p.name,
    value: tenants.filter((t) => t.planId === p.id).length,
    color: ["#35657f", "#17593e", "#d3921f"][i] ?? "#9a937f",
  }));

  const topTenants = [...tenants].sort((a, b) => b.salesToday - a.salesToday).slice(0, 5);
  const maxSales = topTenants[0]?.salesToday || 1;

  /* ---------- CRUD tenant ---------- */
  const openAdd = () => {
    setForm({ id: null, name: "", subdomain: "", planId: "starter", region: "", owner: "", email: "", status: "trial" });
    setFormErr(null);
    setModal("add");
  };
  const openEdit = (t: Tenant) => {
    setForm({ id: t.id, name: t.name, subdomain: t.subdomain, planId: t.planId, region: t.region, owner: t.owner, email: t.email, status: t.status });
    setFormErr(null);
    setModal("edit");
  };

  const saveTenant = () => {
    if (!form.name.trim()) return setFormErr("Nama tenant wajib diisi.");
    const sub = form.subdomain.trim() || slugify(form.name);
    if (!/^[a-z0-9-]{3,}$/.test(sub)) return setFormErr("Subdomain minimal 3 karakter (huruf kecil, angka, tanda -).");
    if (tenants.some((t) => t.subdomain === sub && t.id !== form.id)) return setFormErr(`Subdomain "${sub}" sudah dipakai tenant lain.`);
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) return setFormErr("Format email tidak valid.");

    if (modal === "add") {
      const id = `T-${String(tenants.length + 1).padStart(3, "0")}`;
      setTenants((ts) => [
        {
          id, name: form.name.trim(), subdomain: sub, planId: form.planId, status: form.status,
          region: form.region.trim() || "—", owner: form.owner.trim() || "—", email: form.email.trim() || "—",
          users: 1, products: 0, salesToday: 0, storageMb: 8, storageLimitMb: 1_024,
          createdAt: new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }),
          spark: [0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05],
        },
        ...ts,
      ]);
      if (form.owner.trim()) {
        setUsers((us) => [
          ...us,
          { id: `U-${String(us.length + 1).padStart(2, "0")}`, tenantId: id, name: form.owner.trim(), email: form.email.trim() || "—", role: "owner", active: true, lastLogin: "Belum pernah" },
        ]);
      }
      log("CREATE", "tenants", `Tenant baru ${id} ${form.name} (${planName(form.planId)}, status ${form.status})`);
      push(`Tenant "${form.name}" berhasil dibuat — subdomain ${sub}.lumbung.cloud siap.`, "success");
    } else if (form.id) {
      setTenants((ts) => ts.map((t) => (t.id === form.id ? { ...t, ...{ name: form.name.trim(), subdomain: sub, planId: form.planId, region: form.region.trim(), owner: form.owner.trim(), email: form.email.trim(), status: form.status } } : t)));
      log("UPDATE", "tenants", `Memperbarui profil ${form.id} ${form.name} (paket → ${planName(form.planId)})`);
      push(`Tenant "${form.name}" diperbarui.`, "success");
    }
    setModal(null);
  };

  const toggleStatus = (t: Tenant) => {
    const next: TenantStatus = t.status === "ditangguhkan" ? "aktif" : "ditangguhkan";
    setTenants((ts) => ts.map((x) => (x.id === t.id ? { ...x, status: next } : x)));
    log(next === "ditangguhkan" ? "SUSPEND" : "AKTIVASI", "tenants", `${next === "ditangguhkan" ? "Menangguhkan" : "Mengaktifkan ulang"} ${t.id} ${t.name}`);
    push(
      next === "ditangguhkan" ? `${t.name} ditangguhkan — semua terminal kasirnya terkunci.` : `${t.name} diaktifkan kembali.`,
      next === "ditangguhkan" ? "warn" : "success"
    );
  };

  const deleteTenant = () => {
    if (!delTarget) return;
    setTenants((ts) => ts.filter((t) => t.id !== delTarget.id));
    setUsers((us) => us.filter((u) => u.tenantId !== delTarget.id));
    log("DELETE", "tenants", `Menghapus permanen ${delTarget.id} ${delTarget.name} beserta ${delTarget.users} pengguna`);
    push(`Tenant "${delTarget.name}" dan seluruh datanya dihapus.`, "warn");
    setDelTarget(null);
  };

  /* ---------- CRUD pengguna ---------- */
  const addUser = () => {
    if (!uf.name.trim() || !/^\S+@\S+\.\S+$/.test(uf.email)) {
      push("Lengkapi nama dan email yang valid.", "warn");
      return;
    }
    setUsers((us) => [
      ...us,
      { id: `U-${String(us.length + 1).padStart(2, "0")}`, tenantId: uf.tenantId, name: uf.name.trim(), email: uf.email.trim(), role: uf.role, active: true, lastLogin: "Belum pernah" },
    ]);
    log("CREATE", "users", `Menambah ${ROLE_META[uf.role].label.toLowerCase()} ${uf.name} pada ${uf.tenantId}`);
    push(`Pengguna "${uf.name}" ditambahkan.`, "success");
    setUserModal(false);
    setUf({ name: "", email: "", tenantId: "T-001", role: "kasir" });
  };

  const toggleUser = (u: TenantUser) => {
    setUsers((us) => us.map((x) => (x.id === u.id ? { ...x, active: !x.active } : x)));
    log(u.active ? "SUSPEND" : "AKTIVASI", "users", `${u.active ? "Menonaktifkan" : "Mengaktifkan"} ${u.name} (${u.email})`);
    push(`${u.name} ${u.active ? "dinonaktifkan" : "diaktifkan"}.`, u.active ? "warn" : "success");
  };

  const filteredLogs = logs.filter((l) => auditFilter === "semua" || l.action === auditFilter);

  /* ---------- transaksi digital: helper ---------- */
  const patchSvc = (id: ServiceId, patch: Partial<DigitalService>, silent = false) => {
    setServices((svcs) => svcs.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    if (!silent) {
      const s = services.find((x) => x.id === id);
      log("UPDATE", "digital_services", `Mengubah ${s?.label ?? id}: ${Object.keys(patch).join(", ")}`);
    }
  };

  const toggleSvcGlobal = (id: ServiceId) => {
    const s = services.find((x) => x.id === id);
    if (!s) return;
    const next = !s.enabled;
    patchSvc(id, { enabled: next }, true);
    log(next ? "AKTIVASI" : "SUSPEND", "digital_services", `${next ? "Mengaktifkan" : "Menonaktifkan"} layanan ${s.label} untuk semua tenant`);
    push(
      next ? `Layanan ${s.label} diaktifkan untuk semua tenant.` : `Layanan ${s.label} dimatikan — hilang dari kasir tenant pada sinkron berikutnya.`,
      next ? "success" : "warn"
    );
  };

  const svcEnabledFor = (s: DigitalService, tenantId: string) => s.enabled && !s.tenantOff.includes(tenantId);

  const toggleSvcTenant = (id: ServiceId, tenantId: string) => {
    const s = services.find((x) => x.id === id);
    const t = tenants.find((x) => x.id === tenantId);
    if (!s) return;
    const currentlyOff = s.tenantOff.includes(tenantId);
    patchSvc(
      id,
      { tenantOff: currentlyOff ? s.tenantOff.filter((x) => x !== tenantId) : [...s.tenantOff, tenantId] },
      true
    );
    log("UPDATE", "digital_services", `${currentlyOff ? "Mengaktifkan" : "Mematikan"} ${s.label} khusus tenant ${t?.name ?? tenantId}`);
    push(`${s.label} ${currentlyOff ? "diaktifkan" : "dimatikan"} untuk ${t?.name ?? tenantId}.`, currentlyOff ? "success" : "warn");
  };

  /* settlement */
  const settled = platformTxs.filter((t) => t.status === "berhasil");
  const pending = platformTxs.filter((t) => t.status === "pending");
  const platformRevenue = settled.reduce((s, t) => s + t.platformCut, 0);
  const pendingPayout = pending.reduce((s, t) => s + t.tenantCut, 0);
  const platformRevenueAnim = useCountUp(platformRevenue);
  const volumeToday = platformTxs.reduce((s, t) => s + t.nominal, 0);

  const processSettlement = () => {
    if (!pending.length) return;
    setPlatformTxs((txs) => txs.map((t) => (t.status === "pending" ? { ...t, status: "berhasil" as const } : t)));
    log("UPDATE", "settlement", `Memproses settlement ${pending.length} transaksi — membayarkan ${idr(pendingPayout)} ke tenant`);
    push(`Settlement ${pending.length} transaksi diproses · ${idr(pendingPayout)} diteruskan ke saldo tenant.`, "success");
  };

  const filteredSettle = platformTxs.filter(
    (t) => (settleFilter === "semua" || t.status === settleFilter) && (settleTenant === "semua" || t.tenantId === settleTenant)
  );

  /* simulator */
  const simService = services.find((s) => s.id === simSvc)!;
  const simHasMarkup = simService.hargaMax > simService.denom;
  const [simJual, setSimJual] = useState(simService.hargaJual);
  const simPie = (simJual - simService.hpp) + simService.adminFee;
  const simPlatform = Math.round((simPie * simService.platformShare) / 100);
  const simTenant = simPie - simPlatform;

  const svcIcon = (id: ServiceId) => {
    const map: Record<ServiceId, ReactNode> = {
      pulsa: <IconZap width={15} height={15} />, data: <IconZap width={15} height={15} />, ewallet: <IconCoins width={15} height={15} />,
      token: <IconZap width={15} height={15} />, tagihan: <IconZap width={15} height={15} />, bpjs: <IconCheck width={15} height={15} />, pdam: <IconZap width={15} height={15} />,
      transfer: <IconSwap width={15} height={15} />, tarik: <IconCoins width={15} height={15} />,
    };
    return map[id];
  };

  const pendingCount = platformTxs.filter((t) => t.status === "pending").length;

  const TABS: { id: Tab; label: string; icon: ReactNode; count?: number }[] = [
    { id: "ikhtisar", label: "Ikhtisar", icon: <IconActivity width={16} height={16} /> },
    { id: "tenants", label: "Penyewa (Tenant)", icon: <IconBuilding width={16} height={16} />, count: tenants.length },
    { id: "digital", label: "Transaksi Digital", icon: <IconZap width={16} height={16} />, count: pendingCount },
    { id: "plans", label: "Paket Langganan", icon: <IconKey width={16} height={16} /> },
    { id: "users", label: "Pengguna", icon: <IconUsers width={16} height={16} />, count: users.length },
    { id: "schema", label: "Skema Database", icon: <IconDatabase width={16} height={16} /> },
    { id: "audit", label: "Log Audit", icon: <IconServer width={16} height={16} />, count: logs.length },
  ];

  const Kpis = () => {
    const cards = [
      { label: "Tenant Aktif", value: num(activeTenants.length), sub: `${tenants.length} total · ${tenants.filter((t) => t.status === "trial").length} trial`, cls: "text-ink" },
      { label: "MRR (Pendapatan Berulang)", value: idr(Math.round(mrrAnim)), sub: "dari tagihan bulanan aktif", cls: "text-pine" },
      { label: "Pengguna Aktif", value: num(activeUsers), sub: `${users.length} akun terdaftar`, cls: "text-tide" },
      { label: "SKU Terkelola", value: num(totalSku), sub: "di seluruh tenant", cls: "text-[#8a5f10]" },
    ];
    return (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c, i) => (
          <Reveal key={c.label} delay={i * 60}>
            <div className="card card-hover px-4 py-3.5">
              <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-fog">{c.label}</p>
              <p className={cx("num mt-1 text-xl font-bold leading-tight", c.cls)}>{c.value}</p>
              <p className="mt-0.5 text-[11px] text-fog">{c.sub}</p>
            </div>
          </Reveal>
        ))}
      </div>
    );
  };

  return (
    <div>
      <SectionHead
        title="Konsol Super Admin"
        desc="Kendali platform multi-tenant Lumbung Cloud — provision tenant, paket, pengguna, dan skema database."
        action={
          <div className="flex items-center gap-2">
            <Badge tone="honey" className="px-2.5! py-1.5! uppercase tracking-wider">Akses Platform</Badge>
            <span className="num hidden items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-2 text-[12px] font-semibold text-fog sm:inline-flex">
              <IconGlobe width={13} height={13} /> region ap-southeast-1
            </span>
          </div>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[230px_1fr]">
        {/* rail tab */}
        <Reveal className="space-y-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cx(
                "flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-all cursor-pointer",
                tab === t.id
                  ? "border-honey/70 bg-pine-deep text-[#f2efe2] shadow-lg -translate-y-0.5"
                  : "border-line bg-surface text-fog hover:-translate-y-0.5 hover:border-pine/40 hover:text-ink"
              )}
            >
              <span className={tab === t.id ? "text-honey" : ""}>{t.icon}</span>
              <span className="flex-1 text-[13.5px] font-bold">{t.label}</span>
              {t.count !== undefined && (
                <span className={cx("num rounded-md px-1.5 py-0.5 text-[10.5px] font-bold", tab === t.id ? "bg-white/15" : "bg-ink/6")}>{t.count}</span>
              )}
            </button>
          ))}
          <div className="mt-3 rounded-xl border border-honey/40 bg-honey-soft/50 p-3.5">
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#8a5f10]">
              <IconKey width={12} height={12} /> Sesi Super Admin
            </p>
            <p className="mt-1 text-[12px] text-ink/80">Semua aksi tercatat di log audit dengan alamat IP Anda.</p>
          </div>
        </Reveal>

        {/* konten */}
        <div className="min-w-0">
          {/* ===== IKHTISAR ===== */}
          {tab === "ikhtisar" && (
            <div className="view-enter space-y-4">
              <Kpis />
              <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
                <Reveal delay={80}>
                  <div className="card h-full p-5">
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <h3 className="font-display text-[15px] font-bold">Tren MRR 12 Bulan</h3>
                        <p className="text-[11px] text-fog">Pendapatan berulang bulanan platform</p>
                      </div>
                      <Badge tone="pine">+181% YoY</Badge>
                    </div>
                    <AreaChart data={MRR_TREND} color="#d3921f" />
                  </div>
                </Reveal>
                <Reveal delay={140}>
                  <div className="card h-full p-5">
                    <h3 className="font-display mb-4 text-[15px] font-bold">Distribusi Paket</h3>
                    <Donut items={donutItems} centerLabel="Tenant" centerValue={num(tenants.length)} />
                    <div className="mt-4 space-y-1.5 border-t border-dashed border-linedark pt-3">
                      {plans.map((p) => (
                        <div key={p.id} className="num flex justify-between text-[12px]">
                          <span className="text-fog">{p.name}</span>
                          <span className="font-bold">{idrShort(tenants.filter((t) => t.planId === p.id && t.status === "aktif").reduce((s, t) => s + p.price, 0))}/bln</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Reveal>
              </div>
              <div className="grid gap-4 xl:grid-cols-[1.25fr_0.85fr_1fr]">
                <Reveal delay={100}>
                  <div className="card h-full p-5">
                    <h3 className="font-display mb-3 text-[15px] font-bold">Tenant Teratas Hari Ini</h3>
                    <ul className="space-y-3">
                      {topTenants.map((t, i) => (
                        <li key={t.id}>
                          <div className="mb-1 flex items-center justify-between gap-2">
                            <span className="flex items-center gap-2 text-[12.5px] font-bold">
                              <span className="num text-fog">{i + 1}</span> {t.name}
                              {t.current && <Badge tone="honey">Anda</Badge>}
                            </span>
                            <span className="num text-[12px] font-bold text-pine">{idrShort(t.salesToday)}</span>
                          </div>
                          <div className="flex items-center gap-2.5">
                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink/8">
                              <div className="bar-fill h-full rounded-full bg-pine" style={{ width: `${(t.salesToday / maxSales) * 100}%`, animationDelay: `${i * 90}ms` }} />
                            </div>
                            <Sparkline data={t.spark} color="#d3921f" className="h-5 w-16 shrink-0" />
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Reveal>
                <Reveal delay={160}>
                  <div className="card h-full p-5">
                    <h3 className="font-display mb-3 text-[15px] font-bold">Kesehatan Sistem</h3>
                    <ul className="space-y-3.5">
                      {SYSTEM_SERVICES.map((s) => (
                        <li key={s.id} className="flex items-center gap-3">
                          <span className={cx("h-2 w-2 shrink-0 rounded-full", s.ok ? "bg-pine pulse-dot" : "bg-clay")} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[12.5px] font-bold leading-tight">{s.name}</p>
                            <p className="text-[10.5px] text-fog">{s.region}</p>
                          </div>
                          <div className="text-right">
                            <p className="num text-[12px] font-bold">{s.latency} ms</p>
                            <p className="num text-[10px] text-fog">{s.uptime}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Reveal>
                <Reveal delay={220}>
                  <div className="card h-full overflow-hidden">
                    <div className="flex items-center justify-between px-5 pt-5 pb-3">
                      <h3 className="font-display text-[15px] font-bold">Aktivitas Terbaru</h3>
                      <button onClick={() => setTab("audit")} className="text-[11.5px] font-bold text-pine hover:underline cursor-pointer">Semua log</button>
                    </div>
                    <ul className="px-5 pb-4">
                      {logs.slice(0, 5).map((l) => (
                        <li key={l.id} className="flex gap-2.5 border-b border-line/60 py-2.5 text-[12px] last:border-0">
                          <Badge tone={ACTION_META[l.action].tone} className="h-fit shrink-0">{l.action}</Badge>
                          <div className="min-w-0">
                            <p className="truncate font-semibold leading-snug">{l.detail}</p>
                            <p className="num text-[10px] text-fog">{l.time} · {l.actor}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Reveal>
              </div>
            </div>
          )}

          {/* ===== TENANT ===== */}
          {tab === "tenants" && (
            <div className="view-enter space-y-4">
              <div className="card flex flex-wrap items-center gap-2.5 p-3.5">
                <div className="relative min-w-[200px] flex-1">
                  <IconSearch width={14} height={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fog" />
                  <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama, subdomain, atau region…" className="input pl-8.5" />
                </div>
                <select value={fPlan} onChange={(e) => setFPlan(e.target.value)} className="input w-auto py-2 text-[13px]">
                  <option value="semua">Semua Paket</option>
                  {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <select value={fStatus} onChange={(e) => setFStatus(e.target.value)} className="input w-auto py-2 text-[13px]">
                  <option value="semua">Semua Status</option>
                  <option value="aktif">Aktif</option>
                  <option value="trial">Trial</option>
                  <option value="ditangguhkan">Ditangguhkan</option>
                </select>
                <button className="btn-primary px-4 py-2" onClick={openAdd}>
                  <IconPlus width={15} height={15} /> Tambah Tenant
                </button>
              </div>

              <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[880px]">
                    <thead>
                      <tr className="bg-paper/60">
                        <th className="th">Tenant</th>
                        <th className="th">Paket</th>
                        <th className="th">Region</th>
                        <th className="th text-center">User / SKU</th>
                        <th className="th text-right">Omzet Hari Ini</th>
                        <th className="th">Penyimpanan</th>
                        <th className="th">Status</th>
                        <th className="th text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTenants.map((t) => {
                        const pctStore = Math.min(100, (t.storageMb / t.storageLimitMb) * 100);
                        return (
                          <tr key={t.id} className={cx("row-in transition-colors hover:bg-paper/60", t.status === "ditangguhkan" && "opacity-65")}>
                            <td className="td">
                              <div className="flex items-center gap-3">
                                <span className={cx("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-display text-[12px] font-bold", t.status === "ditangguhkan" ? "bg-ink/8 text-fog" : "bg-pine text-[#f2efe2]")}>
                                  {t.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                                </span>
                                <div className="min-w-0">
                                  <p className="flex items-center gap-1.5 font-bold leading-tight">
                                    {t.name}
                                    {t.current && <Badge tone="honey">Anda</Badge>}
                                  </p>
                                  <p className="num truncate text-[10.5px] text-fog">{t.subdomain}.lumbung.cloud · sejak {t.createdAt}</p>
                                </div>
                              </div>
                            </td>
                            <td className="td"><Badge tone={planTone(t.planId)}>{planName(t.planId)}</Badge></td>
                            <td className="td text-[12.5px] text-fog">{t.region}</td>
                            <td className="td num text-center text-[12.5px]">{t.users} / {num(t.products)}</td>
                            <td className="td">
                              <div className="flex items-center justify-end gap-2">
                                <Sparkline data={t.spark} color={t.status === "ditangguhkan" ? "#9a937f" : "#17593e"} className="h-5 w-14" />
                                <span className="num text-[13px] font-bold">{t.salesToday ? idrShort(t.salesToday) : "—"}</span>
                              </div>
                            </td>
                            <td className="td">
                              <div className="w-24">
                                <div className="h-1.5 overflow-hidden rounded-full bg-ink/8">
                                  <div className={cx("h-full rounded-full", pctStore > 80 ? "bg-clay" : "bg-honey")} style={{ width: `${pctStore}%` }} />
                                </div>
                                <p className="num mt-1 text-[10px] text-fog">{num(t.storageMb)} / {num(t.storageLimitMb)} MB</p>
                              </div>
                            </td>
                            <td className="td"><Badge tone={STATUS_META[t.status].tone}>{STATUS_META[t.status].label}</Badge></td>
                            <td className="td">
                              <div className="flex justify-end gap-1.5">
                                <button onClick={() => openEdit(t)} className="btn-outline px-2.5 py-1.5" title="Ubah tenant">
                                  <IconPencil width={13} height={13} />
                                </button>
                                <button
                                  onClick={() => toggleStatus(t)}
                                  className={cx("btn-outline px-2.5 py-1.5", t.status === "ditangguhkan" ? "text-pine hover:border-pine/50 hover:bg-pine-soft/60" : "text-[#8a5f10] hover:border-honey/60 hover:bg-honey-soft/60")}
                                  title={t.status === "ditangguhkan" ? "Aktifkan" : "Tangguhkan"}
                                >
                                  {t.status === "ditangguhkan" ? <IconCheck width={13} height={13} /> : <IconX width={13} height={13} />}
                                </button>
                                <button onClick={() => setDelTarget(t)} disabled={t.current} className="btn-outline px-2.5 py-1.5 text-clay hover:border-clay/50 hover:bg-clay-soft/60" title="Hapus tenant">
                                  <IconTrash width={13} height={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {filteredTenants.length === 0 && <p className="px-5 py-10 text-center text-sm text-fog">Tidak ada tenant yang cocok dengan filter.</p>}
              </div>
            </div>
          )}

          {/* ===== TRANSAKSI DIGITAL (TERPUSAT) ===== */}
          {tab === "digital" && (
            <div className="view-enter space-y-4">
              {/* KPI settlement */}
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {[
                  { label: "Transaksi Terpusat", value: num(platformTxs.length), sub: `${settled.length} selesai · ${pending.length} pending`, cls: "text-ink" },
                  { label: "Volume Nominal", value: idrShort(volumeToday), sub: "nilai produk hari ini", cls: "text-tide" },
                  { label: "Pendapatan Platform", value: idr(Math.round(platformRevenueAnim)), sub: "profit share terkumpul", cls: "text-pine" },
                  { label: "Menunggu Settlement", value: idrShort(pendingPayout), sub: `${pending.length} transaksi · porsi tenant`, cls: "text-[#8a5f10]" },
                ].map((c, i) => (
                  <Reveal key={c.label} delay={i * 60}>
                    <div className="card card-hover px-4 py-3.5">
                      <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-fog">{c.label}</p>
                      <p className={cx("num mt-1 text-xl font-bold leading-tight", c.cls)}>{c.value}</p>
                      <p className="mt-0.5 text-[11px] text-fog">{c.sub}</p>
                    </div>
                  </Reveal>
                ))}
              </div>

              <div className="grid gap-4 xl:grid-cols-[1.55fr_1fr]">
                {/* katalog layanan & profit share */}
                <Reveal delay={80}>
                  <div className="card overflow-hidden">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-paper/50 px-5 py-4">
                      <div>
                        <h3 className="font-display text-[15px] font-bold">Katalog Layanan &amp; Profit Share</h3>
                        <p className="text-[11px] text-fog">Kue margin = (harga jual − HPP) + biaya admin · dibagi platform vs tenant</p>
                      </div>
                      <Badge tone="honey">{services.filter((s) => s.enabled).length}/{services.length} aktif</Badge>
                    </div>
                    <ul className="divide-y divide-line">
                      {services.map((s) => {
                        const pie = svcPie(s);
                        const pcut = svcPlatformCut(s);
                        const tcut = svcTenantCut(s);
                        const onCount = tenants.filter((t) => svcEnabledFor(s, t.id)).length;
                        const hasMarkup = s.hargaMax > s.denom;
                        return (
                          <li key={s.id} className={cx("px-5 py-4 transition-colors", !s.enabled && "opacity-55")}>
                            <div className="flex flex-wrap items-center gap-3">
                              <span className={cx("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", s.enabled ? "bg-pine-soft text-pine" : "bg-ink/6 text-fog")}>
                                {svcIcon(s.id)}
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="text-[13.5px] font-bold leading-tight">{s.label}</p>
                                <p className="num text-[10.5px] text-fog">vol 30 hr {num(s.volume30d)} trx · margin {idrShort(pie * s.volume30d)}</p>
                              </div>
                              <button onClick={() => setSvcTenantFor(s.id)} className="btn-outline px-2.5 py-1.5 text-[11px]" title="Atur per tenant">
                                <IconBuilding width={12} height={12} /> {onCount}/{tenants.length} tenant
                              </button>
                              <span className="text-[10.5px] font-bold text-fog">Global</span>
                              <Switch on={s.enabled} onChange={() => toggleSvcGlobal(s.id)} />
                            </div>

                            <div className="mt-3 grid gap-3 md:grid-cols-[repeat(4,minmax(0,1fr))_1.4fr]">
                              <div>
                                <label className="label !mb-1">HPP (Rp)</label>
                                <input type="number" value={s.hpp} onChange={(e) => patchSvc(s.id, { hpp: Math.max(0, Number(e.target.value) || 0) }, true)}
                                  onBlur={() => { log("UPDATE", "digital_services", `Mengubah HPP ${s.label} → ${idr(s.hpp)}`); }} className="input num py-1.5 text-[12.5px] font-bold" />
                              </div>
                              <div>
                                <label className="label !mb-1">Harga Jual (Rp)</label>
                                <input type="number" value={s.hargaJual} onChange={(e) => patchSvc(s.id, { hargaJual: Math.max(0, Number(e.target.value) || 0) }, true)}
                                  onBlur={() => { log("UPDATE", "digital_services", `Mengubah harga jual ${s.label} → ${idr(s.hargaJual)}`); }} className="input num py-1.5 text-[12.5px] font-bold" />
                              </div>
                              <div>
                                <label className="label !mb-1">Biaya Admin (Rp)</label>
                                <input type="number" value={s.adminFee} onChange={(e) => patchSvc(s.id, { adminFee: Math.max(0, Number(e.target.value) || 0) }, true)}
                                  onBlur={() => { log("UPDATE", "digital_services", `Mengubah biaya admin ${s.label} → ${idr(s.adminFee)}`); }} className="input num py-1.5 text-[12.5px] font-bold" />
                              </div>
                              <div>
                                <label className="label !mb-1">Rentang Jual</label>
                                <div className="num flex items-center gap-1 text-[10.5px] text-fog">
                                  {hasMarkup ? (
                                    <>
                                      <input type="number" value={s.hargaMin} onChange={(e) => patchSvc(s.id, { hargaMin: Math.max(0, Number(e.target.value) || 0) }, true)} className="input num w-full py-1.5 text-[11px]" />
                                      <span>–</span>
                                      <input type="number" value={s.hargaMax} onChange={(e) => patchSvc(s.id, { hargaMax: Math.max(0, Number(e.target.value) || 0) }, true)} className="input num w-full py-1.5 text-[11px]" />
                                    </>
                                  ) : (
                                    <span className="py-1.5">tetap (tagihan)</span>
                                  )}
                                </div>
                              </div>
                              <div>
                                <label className="label !mb-1">
                                  Share Platform <span className="num text-pine">{s.platformShare}%</span>
                                </label>
                                <input type="range" min={10} max={60} step={5} value={s.platformShare}
                                  onChange={(e) => patchSvc(s.id, { platformShare: Number(e.target.value) }, true)}
                                  onMouseUp={() => log("UPDATE", "digital_services", `Profit share ${s.label} → platform ${s.platformShare}%`)}
                                  onTouchEnd={() => log("UPDATE", "digital_services", `Profit share ${s.label} → platform ${s.platformShare}%`)}
                                  className="w-full accent-[#d3921f]" />
                                <div className="mt-1 flex items-center gap-1.5">
                                  <div className="flex h-1.5 flex-1 overflow-hidden rounded-full bg-ink/8">
                                    <div className="h-full bg-honey transition-all" style={{ width: `${s.platformShare}%` }} />
                                    <div className="h-full bg-pine transition-all" style={{ width: `${100 - s.platformShare}%` }} />
                                  </div>
                                </div>
                                <p className="num mt-1 text-[10px] text-fog">
                                  kue {idr(pie)} → platform <span className="font-bold text-[#8a5f10]">{idr(pcut)}</span> · tenant <span className="font-bold text-pine">{idr(tcut)}</span>
                                </p>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </Reveal>

                {/* simulator + pengaturan settlement */}
                <div className="space-y-4">
                  <Reveal delay={140}>
                    <div className="card p-5">
                      <h3 className="font-display text-[15px] font-bold">Simulator Profit Share</h3>
                      <p className="text-[11px] text-fog">Contoh nyata pembagian per transaksi</p>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <div>
                          <label className="label !mb-1">Layanan</label>
                          <select value={simSvc} onChange={(e) => { const id = e.target.value as ServiceId; setSimSvc(id); const sv = services.find((x) => x.id === id)!; setSimJual(sv.hargaJual); }} className="input py-1.5 text-[12.5px]">
                            {services.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="label !mb-1">Nominal</label>
                          <input value={idr(simService.denom)} readOnly className="input num py-1.5 text-[12.5px] font-bold bg-paper/60" />
                        </div>
                      </div>
                      {simHasMarkup && (
                        <div className="mt-3">
                          <label className="label !mb-1">
                            Harga jual tenant <span className="num text-pine">{idr(simJual)}</span>
                          </label>
                          <input type="range" min={simService.hargaMin} max={simService.hargaMax} step={100} value={simJual} onChange={(e) => setSimJual(Number(e.target.value))} className="w-full accent-[#17593e]" />
                        </div>
                      )}
                      <div className="num mt-4 space-y-2 rounded-lg bg-paper/60 p-3.5 text-[12px]">
                        <div className="flex justify-between"><span className="text-fog">Dibayar pelanggan</span><span className="font-bold">{idr(simJual + simService.adminFee)}</span></div>
                        <div className="flex justify-between"><span className="text-fog">HPP platform (agregator)</span><span className="font-bold text-clay">−{idr(simService.hpp)}</span></div>
                        <div className="flex justify-between"><span className="text-fog">Biaya admin</span><span className="font-bold">+{idr(simService.adminFee)}</span></div>
                        <div className="flex justify-between border-t border-dashed border-linedark pt-2"><span className="font-bold">Kue margin</span><span className="font-bold">{idr(simPie)}</span></div>
                        <div className="flex justify-between"><span className="text-fog">Platform ({simService.platformShare}%)</span><span className="font-bold text-[#8a5f10]">{idr(simPlatform)}</span></div>
                        <div className="flex justify-between"><span className="text-fog">Tenant ({100 - simService.platformShare}%)</span><span className="font-bold text-pine">{idr(simTenant)}</span></div>
                      </div>
                      <div className="mt-3 flex h-2.5 overflow-hidden rounded-full">
                        <div className="bar-fill bg-honey" style={{ width: `${(simPlatform / (simPie || 1)) * 100}%` }} />
                        <div className="bar-fill bg-pine" style={{ width: `${(simTenant / (simPie || 1)) * 100}%`, animationDelay: "120ms" }} />
                      </div>
                      <p className="mt-1.5 text-[10px] text-fog">
                        <span className="font-bold text-[#8a5f10]">■</span> platform &nbsp; <span className="font-bold text-pine">■</span> tenant — tenant menjual di harga pasar, platform mengambil share dari margin.
                      </p>
                    </div>
                  </Reveal>

                  <Reveal delay={200}>
                    <div className="card p-5">
                      <h3 className="font-display mb-3 text-[15px] font-bold">Pengaturan Settlement</h3>
                      <div className="space-y-3">
                        <div>
                          <label className="label !mb-1">Jadwal Settlement ke Tenant</label>
                          <div className="flex rounded-lg border border-line bg-surface p-0.5">
                            {([["realtime", "Realtime"], ["h1", "H+1"], ["mingguan", "Mingguan"]] as const).map(([v, l]) => (
                              <button key={v} onClick={() => { setSettlement((c) => ({ ...c, mode: v })); log("UPDATE", "settlement", `Mengubah jadwal settlement → ${l}`); }}
                                className={cx("flex-1 rounded-md py-1.5 text-[12px] font-bold transition-all cursor-pointer", settlement.mode === v ? "bg-pine text-[#f2efe2] shadow-sm" : "text-fog hover:text-ink")}>
                                {l}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="label !mb-1">Minimum Payout (Rp)</label>
                          <input type="number" value={settlement.minPayout} onChange={(e) => setSettlement((c) => ({ ...c, minPayout: Math.max(0, Number(e.target.value) || 0) }), )}
                            onBlur={() => log("UPDATE", "settlement", `Minimum payout → ${idr(settlement.minPayout)}`)} className="input num text-[13px] font-bold" />
                        </div>
                        <div className="flex items-center justify-between rounded-lg border border-line bg-surface px-4 py-3">
                          <div>
                            <p className="text-[13px] font-bold leading-tight">Auto-settlement</p>
                            <p className="text-[11px] text-fog">Bayar otomatis saat melewati minimum payout.</p>
                          </div>
                          <Switch on={settlement.autoSettle} onChange={(v) => { setSettlement((c) => ({ ...c, autoSettle: v })); log("UPDATE", "settlement", `Auto-settlement ${v ? "diaktifkan" : "dimatikan"}`); }} />
                        </div>
                        <p className="rounded-lg bg-honey-soft/60 px-3.5 py-2.5 text-[11px] leading-relaxed text-[#8a5f10]">
                          Skema <b>H+1</b> aktif · {pending.length} transaksi menunggu · total {idr(pendingPayout)} akan diteruskan ke saldo tenant pada settlement berikutnya.
                        </p>
                      </div>
                    </div>
                  </Reveal>
                </div>
              </div>

              {/* log settlement terpusat */}
              <Reveal delay={120}>
                <div className="card overflow-hidden">
                  <div className="flex flex-wrap items-center gap-2 border-b border-line px-5 py-4">
                    <IconSwap width={17} height={17} className="text-pine" />
                    <h3 className="font-display text-[15px] font-bold">Log Transaksi Terpusat</h3>
                    <div className="ml-auto flex flex-wrap items-center gap-1.5">
                      <select value={settleTenant} onChange={(e) => setSettleTenant(e.target.value)} className="input w-auto py-1.5 text-[12px]">
                        <option value="semua">Semua Tenant</option>
                        {tenants.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                      {(["semua", "berhasil", "pending"] as const).map((f) => (
                        <button key={f} onClick={() => setSettleFilter(f)}
                          className={cx("rounded-full border px-3 py-1.5 text-[11.5px] font-bold transition-all cursor-pointer capitalize", settleFilter === f ? "border-pine bg-pine text-[#f2efe2]" : "border-line bg-surface text-fog hover:text-ink")}>
                          {f}
                        </button>
                      ))}
                      <button onClick={processSettlement} disabled={!pending.length} className="btn-primary ml-1 px-3.5 py-2 text-[12px]">
                        <IconCheck width={14} height={14} /> Proses Settlement ({pending.length})
                      </button>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px]">
                      <thead>
                        <tr className="bg-paper/60">
                          <th className="th">Waktu / ID</th>
                          <th className="th">Tenant</th>
                          <th className="th">Layanan</th>
                          <th className="th text-right">Nominal</th>
                          <th className="th text-right">Harga Jual</th>
                          <th className="th text-right">Kue Margin</th>
                          <th className="th text-right">Platform</th>
                          <th className="th text-right">Tenant</th>
                          <th className="th">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSettle.map((t) => {
                          const sv = services.find((s) => s.id === t.serviceId);
                          const tn = tenants.find((x) => x.id === t.tenantId);
                          return (
                            <tr key={t.id} className="row-in transition-colors hover:bg-paper/60">
                              <td className="td"><p className="num text-[13px] font-bold">{t.time}</p><p className="num text-[10.5px] text-fog">{t.id}</p></td>
                              <td className="td"><p className="text-[12.5px] font-semibold">{tn?.name ?? t.tenantId}</p><p className="num text-[10.5px] text-fog">{t.tenantId}</p></td>
                              <td className="td">
                                <div className="flex items-center gap-2">
                                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-pine-soft text-pine">{svcIcon(t.serviceId)}</span>
                                  <div><p className="text-[12.5px] font-semibold leading-tight">{sv?.label ?? t.serviceId}</p><p className="num text-[10px] text-fog">{t.target}</p></div>
                                </div>
                              </td>
                              <td className="td num text-right">{idr(t.nominal)}</td>
                              <td className="td num text-right">{idr(t.hargaJual)}</td>
                              <td className="td num text-right font-semibold">{idr(t.hargaJual - t.hpp + t.adminFee)}</td>
                              <td className="td num text-right font-bold text-[#8a5f10]">{idr(t.platformCut)}</td>
                              <td className="td num text-right font-bold text-pine">{idr(t.tenantCut)}</td>
                              <td className="td"><Badge tone={t.status === "berhasil" ? "pine" : "honey"}>{t.status === "berhasil" ? "Settled" : "Pending"}</Badge></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {filteredSettle.length === 0 && <p className="px-5 py-10 text-center text-sm text-fog">Tidak ada transaksi pada filter ini.</p>}
                </div>
              </Reveal>
            </div>
          )}

          {/* ===== PAKET ===== */}
          {tab === "plans" && (
            <div className="view-enter">
              <div className="grid gap-4 lg:grid-cols-3">
                {plans.map((p, i) => {
                  const count = tenants.filter((t) => t.planId === p.id).length;
                  const contrib = tenants.filter((t) => t.planId === p.id && t.status === "aktif").length * p.price;
                  return (
                    <Reveal key={p.id} delay={i * 80}>
                      <div className={cx("card card-hover relative flex h-full flex-col p-5", p.highlight && "border-pine/50 shadow-[0_10px_30px_-16px_rgba(23,89,62,0.4)]")}>
                        {p.highlight && (
                          <span className="absolute -top-2.5 left-5 rounded-md bg-pine px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#f2efe2]">Paling populer</span>
                        )}
                        <div className="flex items-center justify-between">
                          <h3 className="font-display text-lg font-bold">{p.name}</h3>
                          <Badge tone={planTone(p.id)}>{count} tenant</Badge>
                        </div>
                        <div className="mt-3">
                          <label className="label">Harga / Bulan (Rp)</label>
                          <input
                            type="number"
                            value={p.price}
                            onChange={(e) => setPlans((ps) => ps.map((x) => (x.id === p.id ? { ...x, price: Math.max(0, Number(e.target.value) || 0) } : x)))}
                            onBlur={() => { log("UPDATE", "plans", `Mengubah harga paket ${p.name} menjadi ${idr(p.price)}`); push(`Harga paket ${p.name} diperbarui — tenant aktif ditagih mulai siklus berikutnya.`, "info"); }}
                            className="input num text-[17px] font-bold"
                          />
                        </div>
                        <div className="mt-3 grid grid-cols-3 gap-2">
                          {[
                            { k: "maxUsers", l: "User" },
                            { k: "maxProducts", l: "SKU" },
                            { k: "maxOutlets", l: "Outlet" },
                          ].map((f) => (
                            <div key={f.k}>
                              <label className="label !mb-1">{f.l}</label>
                              <input
                                type="number"
                                value={(p as unknown as Record<string, number>)[f.k]}
                                onChange={(e) => setPlans((ps) => ps.map((x) => (x.id === p.id ? { ...x, [f.k]: Math.max(0, Number(e.target.value) || 0) } : x)))}
                                className="input num py-1.5 text-center text-[13px] font-bold"
                              />
                            </div>
                          ))}
                        </div>
                        <p className="num mt-1.5 text-[10.5px] text-fog">Isi 0 = tanpa batas</p>
                        <ul className="mt-4 flex-1 space-y-2 border-t border-dashed border-linedark pt-4">
                          {p.features.map((f) => (
                            <li key={f} className="flex items-start gap-2 text-[12.5px]">
                              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-pine-soft text-pine">
                                <IconCheck width={9} height={9} />
                              </span>
                              {f}
                            </li>
                          ))}
                        </ul>
                        <div className="num mt-4 flex items-baseline justify-between rounded-lg bg-paper px-3.5 py-2.5 text-[12.5px]">
                          <span className="text-fog">Kontribusi MRR</span>
                          <span className="text-[15px] font-bold text-pine">{idrShort(contrib)}</span>
                        </div>
                      </div>
                    </Reveal>
                  );
                })}
              </div>
              <p className="mt-4 rounded-lg border border-dashed border-linedark bg-white px-4 py-3 text-[12px] text-fog">
                Perubahan harga &amp; kuota berlaku untuk <span className="font-bold text-ink">siklus tagihan berikutnya</span> — tenant berjalan tidak terpotong di tengah periode.
              </p>
            </div>
          )}

          {/* ===== PENGGUNA ===== */}
          {tab === "users" && (
            <div className="view-enter space-y-4">
              <div className="card flex flex-wrap items-center justify-between gap-3 p-3.5">
                <p className="text-[13px] text-fog">
                  <span className="num font-bold text-ink">{users.length}</span> akun di seluruh tenant · <span className="num font-bold text-pine">{activeUsers}</span> aktif
                </p>
                <button className="btn-primary px-4 py-2" onClick={() => setUserModal(true)}>
                  <IconPlus width={15} height={15} /> Tambah Pengguna
                </button>
              </div>
              <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px]">
                    <thead>
                      <tr className="bg-paper/60">
                        <th className="th">Pengguna</th>
                        <th className="th">Tenant</th>
                        <th className="th">Peran</th>
                        <th className="th">Login Terakhir</th>
                        <th className="th text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => {
                        const t = tenants.find((x) => x.id === u.tenantId);
                        return (
                          <tr key={u.id} className="row-in transition-colors hover:bg-paper/60">
                            <td className="td">
                              <div className="flex items-center gap-3">
                                <span className={cx("flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-display text-[12px] font-bold", u.role === "super_admin" ? "bg-honey text-pine-deep" : "bg-pine-soft text-pine")}>
                                  {u.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                                </span>
                                <div>
                                  <p className="font-bold leading-tight">{u.name}</p>
                                  <p className="num text-[10.5px] text-fog">{u.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="td text-[12.5px]">
                              {u.tenantId ? (
                                <span className="font-semibold">{t?.name ?? u.tenantId}<span className="num ml-1.5 text-[10.5px] text-fog">{u.tenantId}</span></span>
                              ) : (
                                <Badge tone="honey">Platform</Badge>
                              )}
                            </td>
                            <td className="td"><Badge tone={ROLE_META[u.role].tone}>{ROLE_META[u.role].label}</Badge></td>
                            <td className="td text-[12px] text-fog">{u.lastLogin}</td>
                            <td className="td">
                              <div className="flex items-center justify-end gap-2">
                                <span className={cx("text-[11px] font-bold", u.active ? "text-pine" : "text-fog")}>{u.active ? "Aktif" : "Nonaktif"}</span>
                                <Switch on={u.active} onChange={() => toggleUser(u)} />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ===== SKEMA DB ===== */}
          {tab === "schema" && (
            <div className="view-enter space-y-4">
              <div className="card p-5">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="font-display text-[16px] font-bold">Entity Relationship Diagram</h3>
                    <p className="text-[12px] text-fog">Arahkan kursor ke tabel untuk melihat relasi · satu database bersama, dipartisi per tenant</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge tone="honey">PK</Badge>
                    <Badge tone="tide">FK</Badge>
                    <Badge tone="fog">UQ</Badge>
                    <Badge tone="pine">tenant_id</Badge>
                    <Badge tone="fog">JSONB</Badge>
                  </div>
                </div>
                <Erd />
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                {STRATEGIES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => { setStrategy(s.id); push(`Strategi isolasi dicatat: ${s.name}.`, "info"); }}
                    className={cx(
                      "card card-hover p-4.5 text-left cursor-pointer",
                      strategy === s.id ? "border-pine shadow-[0_10px_26px_-14px_rgba(23,89,62,0.45)]" : ""
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-display text-[14.5px] font-bold">{s.name}</p>
                      {s.rec && <Badge tone="pine">Default</Badge>}
                    </div>
                    <div className="mt-3 space-y-2">
                      {["Isolasi data", "Efisiensi biaya", "Skalabilitas"].map((m, i) => (
                        <div key={m} className="flex items-center gap-2">
                          <span className="w-24 text-[10.5px] font-semibold text-fog">{m}</span>
                          <div className="flex flex-1 gap-1">
                            {Array.from({ length: 5 }).map((_, b) => (
                              <span key={b} className={cx("h-1.5 flex-1 rounded-full", b < s.bars[i] ? "bg-pine" : "bg-ink/10")} />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="mt-3 text-[11.5px] leading-relaxed text-fog">{s.desc}</p>
                  </button>
                ))}
              </div>

              <div className="card p-5">
                <h3 className="font-display mb-3 text-[15px] font-bold">Cara Kerja Isolasi (Row-Level Security)</h3>
                <div className="num overflow-x-auto rounded-lg bg-pine-deep p-4 text-[12px] leading-relaxed text-[#d8e4d2]">
                  <p className="text-[#f2d9a0]">-- setiap koneksi kasir menyetel konteks tenant</p>
                  <p>SET app.tenant_id = 'T-001';</p>
                  <p className="mt-2 text-[#f2d9a0]">-- policy: baris hanya terlihat oleh tenant pemiliknya</p>
                  <p>CREATE POLICY tenant_isolation ON products</p>
                  <p>&nbsp;&nbsp;USING (tenant_id = current_setting('app.tenant_id'));</p>
                  <p className="mt-2 text-[#f2d9a0]">-- query kasir — mustahil bocor lintas tenant</p>
                  <p>SELECT * FROM products WHERE stock &lt; min_stock;</p>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {[
                    { t: "Provisioning", d: "Tenant baru mendapat subdomain, policy RLS, dan kuota paket dalam ±40 detik." },
                    { t: "Backup & Restore", d: "Backup harian per tenant (PITR 7 hari) — restore parsial tanpa mengganggu tenant lain." },
                    { t: "Eskalasi Isolasi", d: "Tenant Enterprise dapat dipindahkan ke skema/database khusus tanpa downtime (zero-downtime migration)." },
                  ].map((c) => (
                    <div key={c.t} className="rounded-lg border border-line bg-paper/50 px-4 py-3">
                      <p className="text-[12.5px] font-bold">{c.t}</p>
                      <p className="mt-1 text-[11.5px] leading-relaxed text-fog">{c.d}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ===== AUDIT ===== */}
          {tab === "audit" && (
            <div className="view-enter space-y-4">
              <div className="card flex flex-wrap items-center gap-2 p-3.5">
                <div className="flex flex-wrap gap-1.5">
                  {(["semua", "CREATE", "UPDATE", "DELETE", "LOGIN", "SUSPEND", "AKTIVASI"] as const).map((a) => (
                    <button
                      key={a}
                      onClick={() => setAuditFilter(a)}
                      className={cx(
                        "rounded-full border px-3 py-1.5 text-[11.5px] font-bold transition-all cursor-pointer",
                        auditFilter === a ? "border-pine bg-pine text-[#f2efe2]" : "border-line bg-surface text-fog hover:text-ink"
                      )}
                    >
                      {a === "semua" ? "Semua" : a}
                    </button>
                  ))}
                </div>
                <button
                  className="btn-outline ml-auto px-3.5 py-2 text-[12px]"
                  onClick={() => {
                    downloadCsv(`audit-log-${Date.now()}`, [
                      ["Waktu", "Aktor", "Aksi", "Entitas", "Detail", "IP"],
                      ...filteredLogs.map((l) => [l.time, l.actor, l.action, l.entity, l.detail, l.ip]),
                    ]);
                    push("Log audit diekspor ke CSV.", "info");
                  }}
                >
                  <IconDownload width={14} height={14} /> Ekspor CSV
                </button>
              </div>
              <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[780px]">
                    <thead>
                      <tr className="bg-paper/60">
                        <th className="th">Waktu</th>
                        <th className="th">Aktor</th>
                        <th className="th">Aksi</th>
                        <th className="th">Entitas</th>
                        <th className="th">Detail</th>
                        <th className="th">Alamat IP</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLogs.map((l) => (
                        <tr key={l.id} className="row-in transition-colors hover:bg-paper/60">
                          <td className="td num text-[12.5px] font-bold">{l.time}</td>
                          <td className="td text-[12.5px] font-semibold">{l.actor}</td>
                          <td className="td"><Badge tone={ACTION_META[l.action].tone}>{l.action}</Badge></td>
                          <td className="td num text-[12px] text-fog">{l.entity}</td>
                          <td className="td text-[12.5px]">{l.detail}</td>
                          <td className="td num text-[11.5px] text-fog">{l.ip}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredLogs.length === 0 && <p className="px-5 py-10 text-center text-sm text-fog">Tidak ada log untuk aksi ini.</p>}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===== modal tenant ===== */}
      <Modal open={modal !== null} onClose={() => setModal(null)} width="max-w-lg">
        <ModalHead title={modal === "add" ? "Provision Tenant Baru" : "Ubah Tenant"} onClose={() => setModal(null)} />
        <div className="p-5">
          <div className="mb-3 grid grid-cols-2 gap-3">
            <div>
              <label className="label">Nama Toko / Tenant</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, subdomain: form.id ? form.subdomain : slugify(e.target.value) })} placeholder="cth: Toko Makmur" className="input" />
            </div>
            <div>
              <label className="label">Subdomain</label>
              <div className="flex items-center gap-1">
                <input value={form.subdomain} onChange={(e) => setForm({ ...form, subdomain: slugify(e.target.value) })} className="input num" />
                <span className="num shrink-0 text-[11px] text-fog">.lumbung.cloud</span>
              </div>
            </div>
          </div>
          <div className="mb-3 grid grid-cols-2 gap-3">
            <div>
              <label className="label">Paket Langganan</label>
              <select value={form.planId} onChange={(e) => setForm({ ...form, planId: e.target.value })} className="input">
                {plans.map((p) => <option key={p.id} value={p.id}>{p.name} — {idr(p.price)}/bln</option>)}
              </select>
            </div>
            <div>
              <label className="label">Region</label>
              <select value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} className="input">
                {["Yogyakarta", "Jakarta", "Bandung", "Semarang", "Surabaya", "Denpasar", "Medan", "Makassar"].map((r) => <option key={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <div className="mb-3 grid grid-cols-2 gap-3">
            <div>
              <label className="label">Nama Pemilik</label>
              <input value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} placeholder="cth: Budi Makmur" className="input" />
            </div>
            <div>
              <label className="label">Email Pemilik</label>
              <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="budi@tokomakmur.id" className="input" />
            </div>
          </div>
          <div className="mb-4">
            <label className="label">Status Awal</label>
            <div className="flex gap-2">
              {(["trial", "aktif"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setForm({ ...form, status: s })}
                  className={cx(
                    "flex-1 rounded-lg border py-2 text-[12.5px] font-bold capitalize transition-all cursor-pointer",
                    form.status === s ? "border-pine bg-pine-soft text-pine" : "border-line text-fog hover:border-pine/40"
                  )}
                >
                  {s === "trial" ? "Trial 14 Hari" : "Langsung Aktif"}
                </button>
              ))}
            </div>
          </div>
          {formErr && <p className="mb-3 rounded-md bg-clay-soft px-3 py-2 text-[12px] font-semibold text-clay">{formErr}</p>}
          <div className="flex gap-2">
            <button className="btn-outline flex-1 py-2.5" onClick={() => setModal(null)}>Batal</button>
            <button className="btn-primary flex-1 py-2.5" onClick={saveTenant}>
              <IconCheck width={15} height={15} /> {modal === "add" ? "Provision Tenant" : "Simpan Perubahan"}
            </button>
          </div>
        </div>
      </Modal>

      {/* ===== modal hapus tenant ===== */}
      <Modal open={!!delTarget} onClose={() => setDelTarget(null)}>
        {delTarget && (
          <>
            <ModalHead title="Hapus Tenant" onClose={() => setDelTarget(null)} />
            <div className="p-5">
              <div className="flex items-start gap-3 rounded-lg border border-clay/30 bg-clay-soft/50 px-4 py-3.5">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-clay text-white">
                  <IconTrash width={15} height={15} />
                </span>
                <div>
                  <p className="text-[13.5px] font-bold">Hapus permanen "{delTarget.name}"?</p>
                  <p className="mt-1 text-[12px] leading-relaxed text-fog">
                    Seluruh data tenant ({num(delTarget.products)} SKU, riwayat penjualan, pembukuan) dan {delTarget.users} akun pengguna akan dihapus dari database setelah masa retensi 30 hari. Aksi ini tercatat di log audit.
                  </p>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button className="btn-outline flex-1 py-2.5" onClick={() => setDelTarget(null)}>Batal</button>
                <button className="btn flex-1 bg-clay py-2.5 text-white shadow-[0_2px_0_rgba(120,40,20,0.4)] hover:brightness-105 active:scale-[0.98]" onClick={deleteTenant}>
                  Ya, Hapus Tenant
                </button>
              </div>
            </div>
          </>
        )}
      </Modal>

      {/* ===== modal tambah pengguna ===== */}
      <Modal open={userModal} onClose={() => setUserModal(false)}>
        <ModalHead title="Tambah Pengguna" onClose={() => setUserModal(false)} />
        <div className="p-5">
          <label className="label">Nama Lengkap</label>
          <input value={uf.name} onChange={(e) => setUf({ ...uf, name: e.target.value })} placeholder="cth: Sari Rahmawati" className="input mb-3" />
          <label className="label">Email</label>
          <input value={uf.email} onChange={(e) => setUf({ ...uf, email: e.target.value })} placeholder="sari@tenant.id" className="input mb-3" />
          <div className="mb-3 grid grid-cols-2 gap-3">
            <div>
              <label className="label">Tenant</label>
              <select value={uf.tenantId} onChange={(e) => setUf({ ...uf, tenantId: e.target.value })} className="input">
                {tenants.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Peran</label>
              <select value={uf.role} onChange={(e) => setUf({ ...uf, role: e.target.value as SaRole })} className="input">
                <option value="owner">Pemilik</option>
                <option value="manajer">Manajer</option>
                <option value="kasir">Kasir</option>
              </select>
            </div>
          </div>
          <p className="num mb-4 rounded-lg bg-paper px-3.5 py-2.5 text-[11.5px] text-fog">
            Kuota terpakai: {tenants.find((t) => t.id === uf.tenantId)?.users ?? 0} user pada {planName(tenants.find((t) => t.id === uf.tenantId)?.planId ?? "")}.
          </p>
          <div className="flex gap-2">
            <button className="btn-outline flex-1 py-2.5" onClick={() => setUserModal(false)}>Batal</button>
            <button className="btn-primary flex-1 py-2.5" onClick={addUser}>
              <IconPlus width={15} height={15} /> Tambahkan
            </button>
          </div>
        </div>
      </Modal>

      {/* ===== modal layanan per tenant ===== */}
      <Modal open={!!svcTenantFor} onClose={() => setSvcTenantFor(null)}>
        {svcTenantFor && (() => {
          const sv = services.find((s) => s.id === svcTenantFor)!;
          return (
            <>
              <ModalHead title={`Ketersediaan · ${sv.label}`} onClose={() => setSvcTenantFor(null)} />
              <div className="p-5">
                <p className="mb-3 rounded-lg bg-paper px-3.5 py-2.5 text-[12px] text-fog">
                  Layanan global saat ini <b className={sv.enabled ? "text-pine" : "text-clay"}>{sv.enabled ? "AKTIF" : "NONAKTIF"}</b>.
                  Sakelar di bawah adalah override per tenant — tenant yang dimatikan tidak melihat layanan ini di kasirnya.
                </p>
                <ul className="max-h-72 divide-y divide-line overflow-y-auto rounded-lg border border-line">
                  {tenants.map((t) => {
                    const on = svcEnabledFor(sv, t.id);
                    return (
                      <li key={t.id} className="flex items-center justify-between gap-3 px-4 py-3">
                        <div className="min-w-0">
                          <p className="flex items-center gap-1.5 text-[13px] font-bold leading-tight">
                            {t.name} {t.current && <Badge tone="honey">Anda</Badge>}
                          </p>
                          <p className="num text-[10.5px] text-fog">{t.id} · {planName(t.planId)} · {t.region}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={cx("text-[11px] font-bold", on ? "text-pine" : "text-fog")}>{on ? "Aktif" : "Mati"}</span>
                          <Switch on={on} onChange={() => toggleSvcTenant(sv.id, t.id)} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
                <button className="btn-primary mt-4 w-full py-2.5" onClick={() => setSvcTenantFor(null)}>Selesai</button>
              </div>
            </>
          );
        })()}
      </Modal>
    </div>
  );
}
