import { useCallback, useState } from "react";
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
import {
  AUDIT_SEED,
  PLANS,
  SA_USERS,
  TENANTS,
  type AuditAction,
  type AuditLog,
  type Plan,
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
  superadmin: { crumb: "Platform", title: "Konsol Super Admin" },
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
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [posQuery, setPosQuery] = useState("");
  const [sideOpen, setSideOpen] = useState(false);

  // ---- multi-tenant ----
  const [tenants, setTenants] = useState<Tenant[]>(TENANTS);
  const [plans, setPlans] = useState<Plan[]>(PLANS);
  const [saUsers, setSaUsers] = useState<TenantUser[]>(SA_USERS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(AUDIT_SEED);
  const [superMode, setSuperMode] = useState(false);

  const push = useCallback((msg: string, tone: Toast["tone"] = "success") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg, tone }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3600);
  }, []);

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
        push("Kembali ke mode tenant — Lumbung Mart.", "info");
      }
      return next;
    });
  }, [push, log]);

  const lowCount = products.filter((p) => p.stock <= p.minStock).length;
  const pendingOrders = ORDERS.filter((o) => o.status === "menunggu" || o.status === "diproses").length;
  const dueBills = payables.filter((p) => p.status === "jatuh tempo").length;

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
            <Dashboard products={products} digitalTxs={digitalTxs} dueBills={dueBills} sales={sales} onNavigate={setView} push={push} />
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
          {view === "digital" && <Digital txs={digitalTxs} setTxs={setDigitalTxs} push={push} />}
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
          {view === "settings" && <SettingsView config={config} onSave={(c) => setConfig(c)} push={push} />}
          {view === "superadmin" && (
            <SuperAdmin
              tenants={tenants}
              setTenants={setTenants}
              plans={plans}
              setPlans={setPlans}
              users={saUsers}
              setUsers={setSaUsers}
              logs={auditLogs}
              log={log}
              push={push}
            />
          )}
        </main>

        <footer className="mx-auto max-w-[1440px] px-4 pb-8 lg:px-8">
          <p className="num border-t border-line pt-4 text-center text-[11px] text-fog">
            Lumbung ERP &amp; POS v2.4 · Data tersinkron 2 menit lalu · {config.storeName} Yogyakarta
          </p>
        </footer>
      </div>

      <ToastStack toasts={toasts} onDismiss={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />
    </div>
  );
}
