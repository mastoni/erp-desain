import { useState } from "react";
import { CUSTOMERS, type Customer } from "../data";
import { cx, idrShort, num } from "../lib/format";
import { Badge, Modal, ModalHead, Reveal, SectionHead } from "../components/ui";
import type { Toast } from "../components/ui";
import { IconPlus, IconSearch, IconUsers } from "../components/icons";

type Push = (msg: string, tone?: Toast["tone"]) => void;

const tierTone = (t: Customer["tier"]) => (t === "Gold" ? "honey" : t === "Silver" ? "tide" : "fog") as "honey" | "tide" | "fog";

const initials = (name: string) =>
  name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

export function Customers({ push }: { push: Push }) {
  const [list, setList] = useState<Customer[]>(CUSTOMERS);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [nf, setNf] = useState({ name: "", phone: "", tier: "Reguler" as Customer["tier"] });

  const filtered = list.filter(
    (c) => c.name.toLowerCase().includes(q.toLowerCase()) || c.phone.includes(q) || c.id.toLowerCase().includes(q.toLowerCase())
  );

  const addCustomer = () => {
    if (!nf.name.trim()) {
      push("Nama pelanggan wajib diisi.", "warn");
      return;
    }
    setList((l) => [
      {
        id: `CST-${String(l.length + 1).padStart(3, "0")}`,
        name: nf.name.trim(),
        phone: nf.phone.trim() || "—",
        tier: nf.tier,
        points: 0,
        spend: 0,
        last: "Hari ini",
      },
      ...l,
    ]);
    push(`Pelanggan "${nf.name}" terdaftar sebagai member ${nf.tier}.`, "success");
    setOpen(false);
    setNf({ name: "", phone: "", tier: "Reguler" });
  };

  const stats = [
    { label: "Total Pelanggan", value: num(list.length), cls: "text-ink" },
    { label: "Member Gold", value: num(list.filter((c) => c.tier === "Gold").length), cls: "text-[#8a5f10]" },
    { label: "Member Silver", value: num(list.filter((c) => c.tier === "Silver").length), cls: "text-tide" },
    { label: "Belanja Bulan Ini", value: idrShort(73_280_000), cls: "text-pine" },
  ];

  return (
    <div>
      <SectionHead
        title="Pelanggan"
        desc="Member terdaftar, poin loyalitas, dan riwayat belanja."
        action={
          <button className="btn-primary px-4 py-2" onClick={() => setOpen(true)}>
            <IconPlus width={15} height={15} /> Tambah Pelanggan
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s, i) => (
          <Reveal key={s.label} delay={i * 60}>
            <div className="card card-hover px-4 py-3.5">
              <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-fog">{s.label}</p>
              <p className={cx("num mt-1 text-xl font-bold", s.cls)}>{s.value}</p>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal delay={120}>
        <div className="card mt-4 flex items-center gap-3 p-3.5">
          <div className="relative flex-1">
            <IconSearch width={14} height={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fog" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama, telepon, atau ID…" className="input pl-9" />
          </div>
          <span className="num text-[12px] font-semibold text-fog">{filtered.length} member</span>
        </div>
      </Reveal>

      <Reveal delay={180}>
        <div className="card mt-4 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="bg-paper/60">
                  <th className="th">Pelanggan</th>
                  <th className="th">Telepon</th>
                  <th className="th">Tier</th>
                  <th className="th text-right">Poin</th>
                  <th className="th text-right">Total Belanja</th>
                  <th className="th">Kunjungan Terakhir</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="transition-colors hover:bg-paper/60">
                    <td className="td">
                      <div className="flex items-center gap-3">
                        <span
                          className={cx(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-display text-[12px] font-bold",
                            c.tier === "Gold" ? "bg-honey text-pine-deep" : c.tier === "Silver" ? "bg-tide-soft text-tide" : "bg-ink/8 text-fog"
                          )}
                        >
                          {initials(c.name)}
                        </span>
                        <div>
                          <p className="font-semibold leading-tight">{c.name}</p>
                          <p className="num text-[10.5px] text-fog">{c.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="td num text-[12.5px] text-fog">{c.phone}</td>
                    <td className="td"><Badge tone={tierTone(c.tier)}>{c.tier}</Badge></td>
                    <td className="td num text-right font-semibold">{num(c.points)}</td>
                    <td className="td num text-right font-bold text-pine">{idrShort(c.spend)}</td>
                    <td className="td text-[12.5px] text-fog">{c.last}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="px-5 py-10 text-center">
              <IconUsers width={22} height={22} className="mx-auto mb-2 text-fog" />
              <p className="text-sm font-semibold">Tidak ada pelanggan ditemukan</p>
              <p className="mt-1 text-xs text-fog">Coba kata kunci lain atau daftarkan member baru.</p>
            </div>
          )}
        </div>
      </Reveal>

      <Modal open={open} onClose={() => setOpen(false)}>
        <>
          <ModalHead title="Tambah Pelanggan" onClose={() => setOpen(false)} />
          <div className="p-5">
            <label className="label">Nama Lengkap</label>
            <input value={nf.name} onChange={(e) => setNf({ ...nf, name: e.target.value })} placeholder="cth: Sari Rahmawati" className="input mb-3" />
            <label className="label">No. Telepon</label>
            <input value={nf.phone} onChange={(e) => setNf({ ...nf, phone: e.target.value })} placeholder="08xx-xxxx-xxxx" className="input mb-3" />
            <label className="label">Tier Member</label>
            <div className="mb-4 grid grid-cols-3 gap-2">
              {(["Reguler", "Silver", "Gold"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setNf({ ...nf, tier: t })}
                  className={cx(
                    "rounded-lg border py-2 text-[12.5px] font-bold transition-all cursor-pointer",
                    nf.tier === t ? "border-pine bg-pine-soft text-pine" : "border-line text-fog hover:border-pine/40"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button className="btn-outline flex-1 py-2.5" onClick={() => setOpen(false)}>Batal</button>
              <button className="btn-primary flex-1 py-2.5" onClick={addCustomer}>Daftarkan</button>
            </div>
          </div>
        </>
      </Modal>
    </div>
  );
}
