import { useCallback, useEffect, useState } from "react";
import { ORDERS, PRODUCTS, type Product, type Settings as StoreSettings } from "./data";
import { Sidebar, type View } from "./components/Sidebar";
import { Topbar } from "./components/Topbar";
import { Modal, ModalHead, Switch, ToastStack, type Toast } from "./components/ui";
import { Dashboard } from "./views/Dashboard";
import { POS } from "./views/POS";
import { Inventory } from "./views/Inventory";
import { Orders } from "./views/Orders";
import { Finance } from "./views/Finance";
import { Customers } from "./views/Customers";

const META: Record<View, { crumb: string; title: string }> = {
  dashboard: { crumb: "Dasbor", title: "Dasbor Operasional" },
  pos: { crumb: "Kasir", title: "Point of Sale" },
  inventory: { crumb: "Inventaris", title: "Manajemen Stok" },
  orders: { crumb: "Pesanan", title: "Pesanan Masuk" },
  finance: { crumb: "Keuangan", title: "Arus Kas & Keuangan" },
  customers: { crumb: "Pelanggan", title: "Pelanggan & Member" },
};

function SettingsModal({
  open,
  onClose,
  settings,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  settings: StoreSettings;
  onSave: (s: StoreSettings) => void;
}) {
  const [f, setF] = useState(settings);
  useEffect(() => {
    if (open) setF(settings);
  }, [open, settings]);

  return (
    <Modal open={open} onClose={onClose}>
      <ModalHead title="Pengaturan Toko" onClose={onClose} />
      <div className="p-5">
        <div className="mb-3 grid grid-cols-[1fr_110px] gap-3">
          <div>
            <label className="label">Nama Toko</label>
            <input value={f.storeName} onChange={(e) => setF({ ...f, storeName: e.target.value })} className="input" />
          </div>
          <div>
            <label className="label">PPN (%)</label>
            <input
              type="number"
              min={0}
              max={30}
              value={f.taxRate}
              onChange={(e) => setF({ ...f, taxRate: Math.max(0, Math.min(30, Number(e.target.value) || 0)) })}
              className="input num"
            />
          </div>
        </div>
        <label className="label">Alamat</label>
        <input value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} className="input mb-3" />
        <label className="label">Pesan Footer Struk</label>
        <textarea
          rows={2}
          value={f.footer}
          onChange={(e) => setF({ ...f, footer: e.target.value })}
          className="input mb-4 resize-none"
        />
        <div className="mb-5 flex items-center justify-between rounded-lg bg-paper px-3.5 py-3">
          <div>
            <p className="text-[13px] font-bold">Cetak struk otomatis</p>
            <p className="text-[11.5px] text-fog">Kirim struk ke printer setelah pembayaran berhasil.</p>
          </div>
          <Switch on={f.autoPrint} onChange={(v) => setF({ ...f, autoPrint: v })} />
        </div>
        <div className="flex gap-2">
          <button className="btn-outline flex-1 py-2.5" onClick={onClose}>Batal</button>
          <button className="btn-primary flex-1 py-2.5" onClick={() => onSave(f)}>Simpan Pengaturan</button>
        </div>
      </div>
    </Modal>
  );
}

export default function App() {
  const [view, setView] = useState<View>("dashboard");
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [settings, setSettings] = useState<StoreSettings>({
    storeName: "Lumbung Mart",
    address: "Jl. Melati No. 12, Yogyakarta",
    taxRate: 11,
    footer: "Barang dapat ditukar dalam 1×24 jam dengan menunjukkan struk.",
    autoPrint: true,
  });
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [posQuery, setPosQuery] = useState("");
  const [sideOpen, setSideOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const push = useCallback((msg: string, tone: Toast["tone"] = "success") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg, tone }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3600);
  }, []);

  const lowCount = products.filter((p) => p.stock <= p.minStock).length;
  const pendingOrders = ORDERS.filter((o) => o.status === "menunggu" || o.status === "diproses").length;

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
        onSettings={() => setSettingsOpen(true)}
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
          onSettings={() => setSettingsOpen(true)}
          onLogout={() => push("Ini aplikasi demo — sesi Anda tetap aman.", "info")}
        />

        <main key={view} className="view-enter mx-auto max-w-[1440px] px-4 py-6 lg:px-8">
          {view === "dashboard" && <Dashboard products={products} onNavigate={setView} push={push} />}
          {view === "pos" && (
            <POS products={products} setProducts={setProducts} settings={settings} push={push} query={posQuery} setQuery={setPosQuery} />
          )}
          {view === "inventory" && <Inventory products={products} setProducts={setProducts} push={push} />}
          {view === "orders" && <Orders push={push} />}
          {view === "finance" && <Finance push={push} />}
          {view === "customers" && <Customers push={push} />}
        </main>

        <footer className="mx-auto max-w-[1440px] px-4 pb-8 lg:px-8">
          <p className="num border-t border-line pt-4 text-center text-[11px] text-fog">
            Lumbung ERP &amp; POS v2.4 · Data tersinkron 2 menit lalu · Lumbung Mart Yogyakarta
          </p>
        </footer>
      </div>

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onSave={(s) => {
          setSettings(s);
          setSettingsOpen(false);
          push("Pengaturan toko disimpan — PPN kasir diperbarui.");
        }}
      />

      <ToastStack toasts={toasts} onDismiss={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />
    </div>
  );
}
