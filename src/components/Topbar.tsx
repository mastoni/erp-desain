import { useEffect, useRef, useState } from "react";
import { cx } from "../lib/format";
import { NOTIFICATIONS } from "../data";
import { IconBell, IconCheck, IconChevronDown, IconLogout, IconMenu, IconSearch, IconSliders, IconUsers } from "./icons";

function LiveClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const i = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(i);
  }, []);
  return (
    <div className="hidden text-right leading-tight xl:block">
      <p className="num text-sm font-bold tabular-nums">
        {now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
      </p>
      <p className="text-[11px] text-fog">
        {now.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })}
      </p>
    </div>
  );
}

export function Topbar({
  crumb,
  title,
  onMenu,
  search,
  setSearch,
  onGoPos,
  onSettings,
  onLogout,
}: {
  crumb: string;
  title: string;
  onMenu: () => void;
  search: string;
  setSearch: (v: string) => void;
  onGoPos: () => void;
  onSettings: () => void;
  onLogout: () => void;
}) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [read, setRead] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (e.key === "/" && tag !== "INPUT" && tag !== "TEXTAREA") {
        e.preventDefault();
        onGoPos();
        setTimeout(() => searchRef.current?.focus(), 50);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onGoPos]);

  const unread = read ? 0 : NOTIFICATIONS.length;

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper/92 backdrop-blur-sm">
      <div className="mx-auto flex h-[64px] max-w-[1440px] items-center gap-3 px-4 lg:px-8">
        <button onClick={onMenu} className="btn-outline h-9 w-9 rounded-md lg:hidden" aria-label="Buka menu">
          <IconMenu />
        </button>

        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-fog">Lumbung / {crumb}</p>
          <h2 className="font-display truncate text-[17px] font-bold leading-tight">{title}</h2>
        </div>

        {/* pencarian global → kasir */}
        <div className="relative ml-2 hidden flex-1 max-w-sm md:block">
          <IconSearch width={15} height={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fog" />
          <input
            ref={searchRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={onGoPos}
            placeholder="Cari produk… (membuka kasir)"
            className="input pl-9 pr-10"
          />
          <kbd className="num pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-line bg-paper px-1.5 py-0.5 text-[10px] font-semibold text-fog">
            /
          </kbd>
        </div>

        <div className="ml-auto flex items-center gap-2.5 sm:gap-4">
          <LiveClock />

          <span className="hidden items-center gap-1.5 rounded-full border border-pine/25 bg-pine-soft px-2.5 py-1 text-[11px] font-bold text-pine sm:inline-flex">
            <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-pine" />
            Toko Buka
          </span>

          {/* notifikasi */}
          <div className="relative">
            <button
              onClick={() => setNotifOpen((v) => !v)}
              className={cx("btn-outline relative h-9 w-9 rounded-md", notifOpen && "border-pine/50 bg-pine-soft/60")}
              aria-label="Notifikasi"
            >
              <IconBell width={17} height={17} />
              {unread > 0 && (
                <span className="num absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-clay px-1 text-[9.5px] font-bold text-white">
                  {unread}
                </span>
              )}
            </button>
            {notifOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setNotifOpen(false)} />
                <div className="absolute right-0 z-20 mt-2 w-[330px] overflow-hidden rounded-xl border border-line bg-surface shadow-xl">
                  <div className="flex items-center justify-between border-b border-line px-4 py-3">
                    <p className="font-display text-sm font-bold">Notifikasi</p>
                    <button onClick={() => setRead(true)} className="text-[11.5px] font-semibold text-pine hover:underline cursor-pointer">
                      Tandai dibaca
                    </button>
                  </div>
                  <ul className="max-h-80 overflow-y-auto">
                    {NOTIFICATIONS.map((n) => (
                      <li key={n.id} className="flex gap-3 border-b border-line/60 px-4 py-3 last:border-0 hover:bg-paper/70 transition-colors">
                        <span
                          className={cx(
                            "mt-1 flex h-2 w-2 shrink-0 rounded-full",
                            n.tone === "warn" ? "bg-honey" : n.tone === "ok" ? "bg-pine" : "bg-tide",
                            read && "opacity-30"
                          )}
                        />
                        <div className="min-w-0">
                          <p className={cx("text-[13px] font-semibold leading-snug", read && "text-fog")}>{n.title}</p>
                          <p className="mt-0.5 text-xs text-fog">{n.desc}</p>
                          <p className="num mt-1 text-[10.5px] text-fog/70">{n.time}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </div>

          <div className="hidden h-6 w-px bg-line sm:block" />

          {/* profil */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen((v) => !v)}
              className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 transition hover:bg-ink/5 cursor-pointer"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-pine font-display text-xs font-bold text-[#f2efe2]">RW</span>
              <span className="hidden text-left leading-tight sm:block">
                <span className="block text-[12.5px] font-bold">Rani Wijaya</span>
                <span className="block text-[10.5px] text-fog">Manajer</span>
              </span>
              <IconChevronDown width={13} height={13} className="text-fog" />
            </button>
            {profileOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                <div className="absolute right-0 z-20 mt-2 w-52 overflow-hidden rounded-xl border border-line bg-surface py-1.5 shadow-xl">
                  {[
                    { label: "Profil Saya", icon: <IconUsers width={15} height={15} />, act: () => {} },
                    { label: "Pengaturan Toko", icon: <IconSliders width={15} height={15} />, act: onSettings },
                    { label: "Keluar", icon: <IconLogout width={15} height={15} />, act: onLogout, danger: true },
                  ].map((m) => (
                    <button
                      key={m.label}
                      onClick={() => {
                        setProfileOpen(false);
                        m.act();
                      }}
                      className={cx(
                        "flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-[13px] font-semibold transition-colors cursor-pointer",
                        m.danger ? "text-clay hover:bg-clay-soft/60" : "text-ink hover:bg-paper"
                      )}
                    >
                      <span className={m.danger ? "text-clay" : "text-fog"}>{m.icon}</span>
                      {m.label}
                      {m.label === "Profil Saya" && <IconCheck width={13} height={13} className="ml-auto text-pine" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
