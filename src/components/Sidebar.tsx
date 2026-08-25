import { cx } from "../lib/format";
import {
  IconBasket,
  IconBook,
  IconBox,
  IconBuilding,
  IconFile,
  IconGrid,
  IconLogout,
  IconReceipt,
  IconShieldPlus,
  IconSliders,
  IconTag,
  IconTrendUp,
  IconTruck,
  IconUsers,
  IconWallet,
  IconX,
  IconZap,
} from "./icons";

export type View =
  | "dashboard"
  | "pos"
  | "digital"
  | "sales"
  | "orders"
  | "products"
  | "inventory"
  | "purchasing"
  | "suppliers"
  | "finance"
  | "bookkeeping"
  | "reports"
  | "customers"
  | "settings"
  | "superadmin";

type NavItem = {
  id: View;
  label: string;
  icon: (p: { width?: number; height?: number }) => React.ReactNode;
  badge?: number;
  badgeTone?: "honey" | "plain";
};

function BarnMark() {
  return (
    <svg width="34" height="34" viewBox="0 0 32 32" aria-hidden>
      <path d="M3 13.5L16 3.5l13 10h-2.6L16 5.9 5.6 13.5H3z" fill="#d3921f" />
      <rect x="6" y="13.5" width="20" height="15" rx="1.2" fill="#efe9d6" />
      <path d="M10 14.5v13M14 14.5v13M18 14.5v13M22 14.5v13" stroke="#17593e" strokeOpacity="0.25" strokeWidth="1.1" />
      <rect x="13.2" y="19.5" width="5.6" height="9" rx="0.8" fill="#17593e" />
      <circle cx="17.6" cy="24" r="0.7" fill="#d3921f" />
    </svg>
  );
}

export function Sidebar({
  view,
  onNav,
  open,
  onClose,
  lowCount,
  pendingOrders,
  digitalCount,
  poOpenCount,
  dueBills,
  onLogout,
}: {
  view: View;
  onNav: (v: View) => void;
  open: boolean;
  onClose: () => void;
  lowCount: number;
  pendingOrders: number;
  digitalCount: number;
  poOpenCount: number;
  dueBills: number;
  onLogout: () => void;
}) {
  const groups: { title: string; items: NavItem[] }[] = [
    {
      title: "Operasional",
      items: [
        { id: "dashboard", label: "Dasbor", icon: (p) => <IconGrid {...p} /> },
        { id: "pos", label: "Kasir (POS)", icon: (p) => <IconBasket {...p} /> },
        { id: "digital", label: "Layanan Digital", icon: (p) => <IconZap {...p} />, badge: digitalCount, badgeTone: "plain" },
      ],
    },
    {
      title: "Transaksi",
      items: [
        { id: "sales", label: "Penjualan", icon: (p) => <IconTrendUp {...p} /> },
        { id: "orders", label: "Pesanan", icon: (p) => <IconReceipt {...p} />, badge: pendingOrders, badgeTone: "plain" },
      ],
    },
    {
      title: "Pasokan",
      items: [
        { id: "products", label: "Produk", icon: (p) => <IconTag {...p} /> },
        { id: "purchasing", label: "Pembelian", icon: (p) => <IconTruck {...p} />, badge: poOpenCount, badgeTone: "plain" },
        { id: "suppliers", label: "Supplier", icon: (p) => <IconBuilding {...p} /> },
        { id: "inventory", label: "Inventaris", icon: (p) => <IconBox {...p} />, badge: lowCount, badgeTone: "honey" },
      ],
    },
    {
      title: "Keuangan",
      items: [
        { id: "bookkeeping", label: "Pembukuan Keuangan", icon: (p) => <IconBook {...p} />, badge: dueBills, badgeTone: "honey" },
        { id: "finance", label: "Laporan Keuangan", icon: (p) => <IconWallet {...p} /> },
        { id: "reports", label: "Laporan", icon: (p) => <IconFile {...p} /> },
      ],
    },
    {
      title: "Relasi",
      items: [{ id: "customers", label: "Pelanggan", icon: (p) => <IconUsers {...p} /> }],
    },
    {
      title: "Sistem",
      items: [{ id: "settings", label: "Pengaturan Toko", icon: (p) => <IconSliders {...p} /> }],
    },
    {
      title: "Platform",
      items: [{ id: "superadmin", label: "Konsol Super Admin", icon: (p) => <IconShieldPlus {...p} /> }],
    },
  ];

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-pine-deep/50 lg:hidden" onClick={onClose} />}
      <aside
        className={cx(
          "fixed inset-y-0 left-0 z-40 flex w-[250px] flex-col border-r border-black/25 transition-transform duration-300",
          "bg-[linear-gradient(175deg,#0b1e15_0%,#0e2a1d_55%,#123527_100%)]",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* logo */}
        <div className="flex items-center gap-3 px-5 pt-5 pb-4">
          <BarnMark />
          <div className="min-w-0">
            <p className="font-display text-[19px] font-bold leading-none tracking-tight text-[#f5f0df]">Lumbung</p>
            <p className="num mt-1 text-[9.5px] font-semibold uppercase tracking-[0.28em] text-honey">ERP · POS</p>
          </div>
          <button onClick={onClose} className="ml-auto rounded-md p-1.5 text-white/50 hover:bg-white/10 hover:text-white lg:hidden cursor-pointer" aria-label="Tutup menu">
            <IconX width={16} height={16} />
          </button>
        </div>

        <div className="mx-5 border-t border-white/10" />

        {/* nav */}
        <nav className="flex-1 overflow-y-auto px-3.5 py-4">
          {groups.map((g, gi) => (
            <div key={g.title}>
              <p className={cx("px-2.5 pb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-white/30", gi > 0 && "pt-5")}>{g.title}</p>
              <ul className="space-y-1">
                {g.items.map((it) => {
              const active = view === it.id;
              return (
                <li key={it.id}>
                  <button
                    onClick={() => {
                      onNav(it.id);
                      onClose();
                    }}
                    className={cx(
                      "group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13.5px] font-semibold transition-all duration-150 cursor-pointer",
                      active
                        ? "bg-white/[0.09] text-[#f5f0df]"
                        : "text-white/55 hover:bg-white/[0.05] hover:text-white/90"
                    )}
                  >
                    {active && <span className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-full bg-honey" />}
                    <span className={cx("transition-colors", active ? "text-honey" : "text-white/45 group-hover:text-white/80")}>
                      {it.icon({ width: 17, height: 17 })}
                    </span>
                    <span className="truncate">{it.label}</span>
                    {it.badge !== undefined && it.badge > 0 && (
                      <span
                        className={cx(
                          "num ml-auto rounded-md px-1.5 py-0.5 text-[10.5px] font-bold",
                          it.badgeTone === "honey" ? "bg-honey text-pine-deep" : "bg-white/12 text-white/80"
                        )}
                      >
                        {it.badge}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
              </ul>
            </div>
          ))}

          {/* shift */}
          <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.04] p-3.5">
            <div className="flex items-center gap-2">
              <span className="pulse-dot h-2 w-2 rounded-full bg-[#5ec98f]" />
              <p className="text-xs font-bold text-[#f5f0df]">Shift Pagi Aktif</p>
            </div>
            <p className="num mt-1.5 text-[11px] text-white/50">08:00 – 16:00 WIB</p>
            <div className="mt-2.5 flex items-baseline justify-between">
              <span className="text-[11px] text-white/45">Kas aktif</span>
              <span className="num text-sm font-bold text-honey">Rp 2,3 jt</span>
            </div>
          </div>
        </nav>

        {/* user */}
        <div className="border-t border-white/10 p-3.5">
          <div className="flex items-center gap-3 rounded-lg px-2 py-1.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-honey font-display text-[13px] font-bold text-pine-deep">
              RW
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-bold text-[#f5f0df]">Rani Wijaya</p>
              <p className="text-[11px] text-white/45">Manajer Toko</p>
            </div>
            <button onClick={onLogout} className="rounded-md p-2 text-white/45 transition hover:bg-white/10 hover:text-white cursor-pointer" aria-label="Keluar">
              <IconLogout width={16} height={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
