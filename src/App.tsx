import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DEFAULT_CONFIG,
  DIGITAL_TXS,
  LEDGER,
  ORDERS,
  PAYABLES,
  PRODUCTS,
  PURCHASE_ORDERS,
  RECEIVABLES,
  SALES_SEED,
  SUPPLIERS,
  type Debt,
  type DigitalTx,
  type LedgerEntry,
  type Product,
  type PurchaseOrder,
  type SalesRecord,
  type StoreConfig,
  type Supplier,
} from "./data";
import { Sidebar, type View } from "./components/Sidebar";
import { Topbar } from "./components/Topbar";
import { idrShort } from "./lib/format";
import { ToastStack, type Toast } from "./components/ui";
import { Dashboard } from "./views/Dashboard";
import { POS } from "./views/POS";
import { Digital } from "./views/Digital";
import { Sales } from "./views/Sales";
import { Products } from "./views/Products";
import { Inventory } from "./views/Inventory";
import { Purchasing } from "./views/Purchasing";
import { Suppliers } from "./views/Suppliers";
import { Orders } from "./views/Orders";
import { Finance } from "./views/Finance";
import { Bookkeeping } from "./views/Bookkeeping";
import { Reports } from "./views/Reports";
import { Customers } from "./views/Customers";
import { SettingsView } from "./views/SettingsView";
import { SuperAdmin } from "./views/SuperAdmin";
import { MobileApp } from "./views/MobileApp";
import { Helpdesk } from "./support/Helpdesk";
import type { OcCtx } from "./support/openclaw";
import { Subscription } from "./views/Subscription";
import { WAGateway } from "./views/WAGateway";
import { SocialMedia } from "./views/SocialMedia";
import {
  CAMERAS_SEED,
  CCTV_EVENTS_SEED,
  INVOICES_SEED,
  MODULES_SEED,
  RTRW_CUSTOMERS_SEED,
  VOUCHERS_SEED,
  type Camera,
  type CctvEvent,
  type Invoice,
  type ModuleState,
  type RtrwCustomer,
  type Voucher,
} from "./subscription";
import {
  AUTOPOST_DEFAULT,
  POSTS_SEED,
  SOCIAL_ACCOUNTS_SEED,
  WA_CHANNELS_SEED,
  WA_MSGS_SEED,
  type AutoPostCfg,
  type ScheduledPost,
  type SocialAccount,
  type WaChannel,
  type WaMsg,
} from "./promosi";
import {
  AUDIT_SEED,
  DIGITAL_SERVICES,
  PLATFORM_TXS,
  PLANS,
  SA_USERS,
  SERVICE_TO_CAT,
  svcPlatformCut,
  svcTenantCut,
  TENANTS,
  type AuditAction,
  type AuditLog,
  type DigitalService,
  type Plan,
  type PlatformTx,
  type ServiceId,
  type SettlementCfg,
  type Tenant,
  type TenantUser,
} from "./superadmin";

const META: Record<View, { crumb: string; title: string }> = {
  dashboard: { crumb: "Dasbor", title: "Dasbor Operasional" },
  pos: { crumb: "Kasir", title: "Point of Sale" },
  digital: { crumb: "Layanan Digital", title: "Kios Agen & PPOB" },
  sales: { crumb: "Penjualan", title: "Transaksi Penjualan" },
  orders: { crumb: "Pesanan", title: "Pesanan Masuk" },
  products: { crumb: "Produk", title: "Katalog Produk" },
  purchasing: { crumb: "Pembelian", title: "Purchase Order Supplier" },
  suppliers: { crumb: "Supplier", title: "Manajemen Supplier" },
  inventory: { crumb: "Inventaris", title: "Manajemen Stok" },
  bookkeeping: { crumb: "Pembukuan", title: "Pembukuan Keuangan" },
  finance: { crumb: "Keuangan", title: "Arus Kas & Keuangan" },
  reports: { crumb: "Laporan", title: "Laporan & Analisis" },
  customers: { crumb: "Pelanggan", title: "Pelanggan & Member" },
  settings: { crumb: "Pengaturan", title: "Pengaturan Toko & Perangkat" },
  langganan: { crumb: "Langganan", title: "Langganan & Modul Layanan" },
  wagateway: { crumb: "Pesan & Promosi", title: "WhatsApp Gateway" },
  sosmed: { crumb: "Pesan & Promosi", title: "Autoposting Sosial Media" },
  superadmin: { crumb: "Platform", title: "Konsol Super Admin" },
  android: { crumb: "Platform", title: "Aplikasi Android Tenant" },
};

export default function App() {
  const [view, setView] = useState<View>("dashboard");
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [digitalTxs, setDigitalTxs] = useState<DigitalTx[]>(DIGITAL_TXS);
  const [sales, setSales] = useState<SalesRecord[]>(SALES_SEED);
  const [suppliers, setSuppliers] = useState<Supplier[]>(SUPPLIERS);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(PURCHASE_ORDERS);
  const [ledger, setLedger] = useState<LedgerEntry[]>(LEDGER);
  const [receivables, setReceivables] = useState<Debt[]>(RECEIVABLES);
  const [payables, setPayables] = useState<Debt[]>(PAYABLES);
  const [config, setConfig] = useState<StoreConfig>(DEFAULT_CONFIG);

  // ---- langganan & modul layanan ----
  const [modules, setModules] = useState<ModuleState[]>(MODULES_SEED);
  const [invoices, setInvoices] = useState<Invoice[]>(INVOICES_SEED);
  const [rtrwCustomers, setRtrwCustomers] = useState<RtrwCustomer[]>(RTRW_CUSTOMERS_SEED);
  const [vouchers, setVouchers] = useState<Voucher[]>(VOUCHERS_SEED);
  const [cameras, setCameras] = useState<Camera[]>(CAMERAS_SEED);
  const [cctvPlanId, setCctvPlanId] = useState("s2");
  const [cctvEvents] = useState<CctvEvent[]>(CCTV_EVENTS_SEED);

  // ---- pesan & promosi ----
  const [waChannels, setWaChannels] = useState<WaChannel[]>(WA_CHANNELS_SEED);
  const [waMsgs, setWaMsgs] = useState<WaMsg[]>(WA_MSGS_SEED);
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>(SOCIAL_ACCOUNTS_SEED);
  const [posts, setPosts] = useState<ScheduledPost[]>(POSTS_SEED);
  const [autoCfg, setAutoCfg] = useState<AutoPostCfg>(AUTOPOST_DEFAULT);

  const waActive = modules.some((m) => m.id === "wagateway" && m.active);
  const sosmedActive = modules.some((m) => m.id === "sosmed" && m.active);
  const activeModules = useMemo(() => modules.filter((m) => m.active).map((m) => m.id), [modules]);

  const waTimers = useRef<number[]>([]);
  useEffect(() => () => waTimers.current.forEach((t) => window.clearTimeout(t)), []);

  const [toasts, setToasts] = useState<Toast[]>([]);
  const [posQuery, setPosQuery] = useState("");
  const [sideOpen, setSideOpen] = useState(false);

  // ---- multi-tenant ----
  const [tenants, setTenants] = useState<Tenant[]>(TENANTS);
  const [plans, setPlans] = useState<Plan[]>(PLANS);
  const [saUsers, setSaUsers] = useState<TenantUser[]>(SA_USERS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(AUDIT_SEED);
  const [superMode, setSuperMode] = useState(false);

  // ---- transaksi digital terpusat (profit share) ----
  const [services, setServices] = useState<DigitalService[]>(DIGITAL_SERVICES);
  const [platformTxs, setPlatformTxs] = useState<PlatformTx[]>(PLATFORM_TXS);
  const [settlement, setSettlement] = useState<SettlementCfg>({ mode: "h1", minPayout: 100_000, autoSettle: true });

  /**
   * Kontrak platform → kasir tenant (SKM Mart = T-001).
   * - hiddenDigitalCats: kategori yang dimatikan platform untuk tenant ini.
   * - fee/komisi override: biaya admin & komisi agen mengikuti profit share platform.
   */
  const tenantContract = useMemo(() => {
    const svcFor = (id: ServiceId) => services.find((s) => s.id === id);
    const catOn: Record<string, boolean> = {};
    for (const s of services) {
      const cat = SERVICE_TO_CAT[s.id];
      const on = s.enabled && !s.tenantOff.includes("T-001");
      catOn[cat] = (catOn[cat] ?? false) || on;
    }
    const hidden = new Set<string>();
    for (const cat of Object.keys(catOn)) if (!catOn[cat]) hidden.add(cat);

    const feeOverrides: Record<string, number> = {};
    const komisiOverrides: Record<string, number> = {};
    for (const s of services) {
      feeOverrides[s.id] = s.adminFee;
      komisiOverrides[s.id] = svcTenantCut(s);
    }
    return { hidden: Array.from(hidden), feeOverrides, komisiOverrides, svcFor };
  }, [services]);

  /** Simulasi transaksi digital baru yang masuk dari tenant lain (setiap ~24 dtk). */
  const simTimer = useRef<number | null>(null);
  useEffect(() => {
    simTimer.current = window.setInterval(() => {
      const pool = services.filter((s) => s.enabled);
      if (!pool.length || tenants.length < 2) return;
      const s = pool[Math.floor(Math.random() * pool.length)];
      const others = tenants.filter((t) => t.id !== "T-001");
      const t = others[Math.floor(Math.random() * others.length)];
      if (!t) return;
      const cut = svcPlatformCut(s);
      const tx: PlatformTx = {
        id: `PTX-${Math.floor(90130 + Math.random() * 800)}`,
        time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        tenantId: t.id,
        serviceId: s.id,
        target: `08xx-${Math.floor(1000 + Math.random() * 8999)}-${Math.floor(1000 + Math.random() * 8999)}`,
        nominal: s.denom,
        hargaJual: s.hargaJual,
        hpp: s.hpp,
        adminFee: s.adminFee,
        platformCut: cut,
        tenantCut: svcTenantCut(s),
        status: "pending",
      };
      setPlatformTxs((prev) => [tx, ...prev].slice(0, 60));
      push(`Transaksi digital baru dari ${t.name} — ${s.label} masuk antrian settlement.`, "info");
    }, 24_000);
    return () => {
      if (simTimer.current) window.clearInterval(simTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [services, tenants]);

  const push = useCallback((msg: string, tone: Toast["tone"] = "success") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg, tone }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3600);
  }, []);

  /** Kirim satu pesan lewat WhatsApp Gateway tenant (dipakai lintas modul). */
  const sendWa = useCallback(
    (to: string, content: string, kind: WaMsg["kind"]): boolean => {
      if (!waActive) {
        push("Modul WhatsApp Gateway belum aktif — aktifkan di menu Langganan.", "warn");
        return false;
      }
      const id = `wm-${Date.now()}-${Math.floor(Math.random() * 999)}`;
      const msg: WaMsg = {
        id,
        ts: Date.now(),
        time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        to,
        kind,
        content,
        status: "antri",
      };
      setWaMsgs((prev) => [msg, ...prev].slice(0, 60));
      waTimers.current.push(window.setTimeout(() => setWaMsgs((prev) => prev.map((x) => (x.id === id ? { ...x, status: "terkirim" } : x))), 1100));
      waTimers.current.push(window.setTimeout(() => setWaMsgs((prev) => prev.map((x) => (x.id === id ? { ...x, status: "dibaca" } : x))), 2800));
      return true;
    },
    [waActive, push]
  );

  const log = useCallback((action: AuditAction, entity: string, detail: string) => {
    setAuditLogs((l) => [
      {
        id: `LOG-${Date.now()}`,
        time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        actor: "Aditya Pradana",
        action,
        entity,
        detail,
        ip: "103.10.64.21",
      },
      ...l,
    ]);
  }, []);

  const toggleSuper = useCallback(() => {
    setSuperMode((v) => {
      const next = !v;
      if (next) {
        setView("superadmin");
        push("Mode Super Admin aktif — Anda kini mengelola seluruh platform.", "info");
        log("LOGIN", "auth", "Eskalasi sesi ke Super Admin (2FA diverifikasi)");
      } else {
        setView("dashboard");
        push("Kembali ke mode tenant — SKM Mart.", "info");
      }
      return next;
    });
  }, [push, log]);

  const lowCount = products.filter((p) => p.stock <= p.minStock).length;
  const pendingOrders = ORDERS.filter((o) => o.status === "menunggu" || o.status === "diproses").length;
  const dueBills = payables.filter((p) => p.status === "jatuh tempo").length;

  // Konteks operasional tenant untuk personal AI OpenClaw (helpdesk).
  const ocCtx = useMemo<OcCtx>(
    () => ({
      storeName: config.storeName,
      subdomain: "skm-mart",
      plan: "Pro",
      superMode,
      salesToday: sales.reduce((s, r) => s + r.total, 0),
      salesCount: sales.length,
      lowStock: lowCount,
      dueBills,
      pendingOrders,
      digitalCommission: digitalTxs.filter((t) => t.status === "sukses").reduce((s, t) => s + t.commission, 0),
    }),
    [config.storeName, superMode, sales, lowCount, dueBills, pendingOrders, digitalTxs]
  );

  return (
    <div className="min-h-screen">
      <div className="bg-wash" />
      <Sidebar
        view={view}
        onNav={setView}
        open={sideOpen}
        onClose={() => setSideOpen(false)}
        lowCount={lowCount}
        pendingOrders={pendingOrders}
        digitalCount={digitalTxs.length}
        poOpenCount={purchaseOrders.filter((p) => p.status === "dikirim").length}
        dueBills={dueBills}
        activeModules={activeModules}
        onLogout={() => push("Ini aplikasi demo — sesi Anda tetap aman.", "info")}
      />

      <div className="lg:pl-[250px]">
        <Topbar
          crumb={META[view].crumb}
          title={META[view].title}
          onMenu={() => setSideOpen(true)}
          search={posQuery}
          setSearch={setPosQuery}
          onGoPos={() => setView("pos")}
          onSettings={() => setView("settings")}
          onLogout={() => push("Ini aplikasi demo — sesi Anda tetap aman.", "info")}
          superMode={superMode}
          onToggleSuper={toggleSuper}
        />

        <main key={view} className="view-enter mx-auto max-w-[1440px] px-4 py-6 lg:px-8">
          {view === "dashboard" && (
            <Dashboard
              products={products}
              digitalTxs={digitalTxs}
              dueBills={dueBills}
              sales={sales}
              onNavigate={setView}
              push={push}
              modules={modules}
              rtrwCustomers={rtrwCustomers}
              vouchers={vouchers}
              cameras={cameras}
              cctvPlanId={cctvPlanId}
              cctvEvents={cctvEvents}
            />
          )}
          {view === "pos" && (
            <POS
              products={products}
              setProducts={setProducts}
              settings={config}
              push={push}
              query={posQuery}
              setQuery={setPosQuery}
              onSale={(rec) => setSales((prev) => [rec, ...prev])}
            />
          )}
          {view === "digital" && (
            <Digital
              txs={digitalTxs}
              setTxs={setDigitalTxs}
              push={push}
              hiddenCats={tenantContract.hidden}
              feeOverrides={tenantContract.feeOverrides}
              komisiOverrides={tenantContract.komisiOverrides}
            />
          )}
          {view === "sales" && <Sales sales={sales} push={push} />}
          {view === "products" && <Products products={products} setProducts={setProducts} config={config} push={push} />}
          {view === "inventory" && <Inventory products={products} setProducts={setProducts} push={push} />}
          {view === "purchasing" && (
            <Purchasing
              suppliers={suppliers}
              purchaseOrders={purchaseOrders}
              setPurchaseOrders={setPurchaseOrders}
              products={products}
              setProducts={setProducts}
              setPayables={setPayables}
              setLedger={setLedger}
              push={push}
            />
          )}
          {view === "suppliers" && (
            <Suppliers suppliers={suppliers} setSuppliers={setSuppliers} purchaseOrders={purchaseOrders} payables={payables} push={push} />
          )}
          {view === "orders" && <Orders push={push} />}
          {view === "finance" && <Finance push={push} />}
          {view === "reports" && (
            <Reports
              products={products}
              sales={sales}
              purchaseOrders={purchaseOrders}
              suppliers={suppliers}
              receivables={receivables}
              payables={payables}
              digitalTxs={digitalTxs}
              push={push}
            />
          )}
          {view === "bookkeeping" && (
            <Bookkeeping
              ledger={ledger}
              setLedger={setLedger}
              receivables={receivables}
              setReceivables={setReceivables}
              payables={payables}
              setPayables={setPayables}
              push={push}
            />
          )}
          {view === "customers" && <Customers push={push} />}
          {view === "langganan" && (
            <Subscription
              plans={plans}
              tenants={tenants}
              modules={modules}
              setModules={setModules}
              invoices={invoices}
              setInvoices={setInvoices}
              customers={rtrwCustomers}
              setCustomers={setRtrwCustomers}
              vouchers={vouchers}
              setVouchers={setVouchers}
              cameras={cameras}
              cctvPlanId={cctvPlanId}
              setCctvPlanId={setCctvPlanId}
              events={cctvEvents}
              push={push}
              onOpenModule={(id) => setView(id === "wagateway" ? "wagateway" : "sosmed")}
              onWaRemind={(name, nominal) => {
                const ok = sendWa(
                  "+62 8xx-xxxx-" + String(name.length * 137).padStart(4, "0"),
                  `Halo ${name.split(" ")[0]}, tagihan RTRW-Net Anda sebesar ${idrShort(nominal)} akan segera jatuh tempo. Mohon segera lakukan pembayaran ya. Terima kasih — SKM Mart`,
                  "pengingat"
                );
                if (ok) push(`Pengingat tagihan ${name} dikirim via WhatsApp Gateway.`);
              }}
            />
          )}
          {view === "settings" && <SettingsView config={config} onSave={(c) => setConfig(c)} push={push} />}
          {view === "superadmin" && (
            <SuperAdmin
              tenants={tenants}
              setTenants={setTenants}
              plans={plans}
              setPlans={setPlans}
              users={saUsers}
              setUsers={setSaUsers}
              services={services}
              setServices={setServices}
              platformTxs={platformTxs}
              setPlatformTxs={setPlatformTxs}
              settlement={settlement}
              setSettlement={setSettlement}
              logs={auditLogs}
              log={log}
              push={push}
            />
          )}
          {view === "android" && (
            <MobileApp
              products={products}
              sales={sales}
              config={config}
              onSale={(rec) => setSales((prev) => [rec, ...prev])}
              push={push}
            />
          )}
          {view === "wagateway" && (
            <WAGateway
              active={waActive}
              channels={waChannels}
              setChannels={setWaChannels}
              msgs={waMsgs}
              setMsgs={setWaMsgs}
              rtrwCustomers={rtrwCustomers}
              sendWa={sendWa}
              push={push}
              onGoLangganan={() => setView("langganan")}
            />
          )}
          {view === "sosmed" && (
            <SocialMedia
              active={sosmedActive}
              accounts={socialAccounts}
              setAccounts={setSocialAccounts}
              posts={posts}
              setPosts={setPosts}
              autoCfg={autoCfg}
              setAutoCfg={setAutoCfg}
              products={products}
              storeName={config.storeName}
              waActive={waActive}
              onBroadcast={(caption) => {
                const ok = sendWa("Pelanggan terpilih", `📣 ${caption.split("\n")[0]} — info lengkap di media sosial kami ya!`, "broadcast");
                if (ok) push("Promo dibroadcast ke pelanggan via WhatsApp Gateway.");
              }}
              push={push}
              onGoLangganan={() => setView("langganan")}
            />
          )}
        </main>

        <footer className="mx-auto max-w-[1440px] px-4 pb-8 lg:px-8">
          <p className="num border-t border-line pt-4 text-center text-[11px] text-fog">
            SKMNet ERP &amp; POS v2.4 · Data tersinkron 2 menit lalu · {config.storeName} Yogyakarta
          </p>
        </footer>
      </div>

      <Helpdesk ctx={ocCtx} push={push} />
      <ToastStack toasts={toasts} onDismiss={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />
    </div>
  );
}
