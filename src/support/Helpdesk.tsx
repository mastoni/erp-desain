import { useEffect, useRef, useState } from "react";
import { cx } from "../lib/format";
import {
  loadHistory,
  loadTickets,
  newTicket,
  OPENCLAW_CONFIG,
  OpenClawClient,
  saveHistory,
  saveTickets,
  type OcCtx,
  type OcMessage,
  type OcReply,
  type OcTicket,
} from "./openclaw";
import type { Toast } from "../components/ui";
import { IconChevronDown, IconSend, IconX } from "../components/icons";

type Push = (msg: string, tone?: Toast["tone"]) => void;

const ClawIcon = ({ s = 18, className = "" }: { s?: number; className?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" className={className}>
    <path d="M6.5 3.5c-2.2 4.2-2 8.6 1 12.5" />
    <path d="M12 2.5c-1.6 5-1 9.5 2 13.5" />
    <path d="M17.5 4.5c-1 4.2 0 8.3 2.5 11.5" />
    <path d="M4 19.5c5 1.6 10.5 1.6 16 0" opacity="0.5" />
  </svg>
);

const WELCOME: OcMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Halo! Saya OpenClaw — asisten AI pribadi untuk toko Anda. Saya terhubung ke data operasional secara langsung: omzet, stok, PPOB, hingga pembukuan. Ada yang bisa saya bantu?",
  ts: Date.now(),
  source: "local-router",
};

const QUICK = ["Laporan hari ini", "Stok menipis", "Cara settlement PPOB", "Buat tiket"];

export function Helpdesk({ ctx, push }: { ctx: OcCtx; push: Push }) {
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState(() => localStorage.getItem("skmnet_openclaw_seen") === "1");
  const [tab, setTab] = useState<"chat" | "tiket">("chat");
  const [msgs, setMsgs] = useState<OcMessage[]>(() => {
    const h = loadHistory();
    return h.length ? h : [WELCOME];
  });
  const [tickets, setTickets] = useState<OcTicket[]>(loadTickets);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>(QUICK);
  const [tSubject, setTSubject] = useState("");
  const [tPriority, setTPriority] = useState<OcTicket["priority"]>("sedang");
  const [minimized, setMinimized] = useState(false);

  const client = useRef(new OpenClawClient()).current;
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    saveHistory(msgs);
  }, [msgs]);
  useEffect(() => {
    saveTickets(tickets);
  }, [tickets]);

  useEffect(() => {
    if (open && listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [msgs, typing, open, tab]);

  useEffect(() => {
    if (open) {
      localStorage.setItem("skmnet_openclaw_seen", "1");
      setSeen(true);
      setTimeout(() => inputRef.current?.focus(), 250);
    }
  }, [open]);

  const ask = async (text: string) => {
    const value = text.trim();
    if (!value || typing) return;
    setInput("");
    setMsgs((m) => [...m, client.userMessage(value)]);
    setTyping(true);
    const reply: OcReply = await client.chat(value, msgs, ctx);
    const assistantMsg = client.markSource(reply);
    setMsgs((m) => [...m, assistantMsg]);
    setTyping(false);
    if (reply.suggestions?.length) setSuggestions(reply.suggestions);
    if (reply.ticket) {
      const t = newTicket(reply.ticket.subject, reply.ticket.priority, "Chat OpenClaw");
      setTickets((ts) => [t, ...ts]);
      push(`Tiket ${t.id} terdaftar: "${t.subject}".`, "info");
    }
  };

  const createTicket = () => {
    if (!tSubject.trim()) {
      push("Isi subjek tiket terlebih dahulu.", "warn");
      return;
    }
    const t = newTicket(tSubject.trim(), tPriority, "Manual");
    setTickets((ts) => [t, ...ts]);
    setTSubject("");
    push(`Tiket ${t.id} terkirim ke tim support SKMNet.`);
  };

  const resetChat = () => {
    setMsgs([{ ...WELCOME, ts: Date.now() }]);
    setSuggestions(QUICK);
    push("Percakapan OpenClaw direset.", "info");
  };

  const timeOf = (ts: number) => new Date(ts).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  const openCount = tickets.filter((t) => t.status !== "selesai").length;

  return (
    <>
      {/* ===== panel ===== */}
      {open && (
        <div
          className={cx(
            "pop-in fixed right-4 z-50 flex w-[372px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_30px_70px_-20px_rgba(12,32,24,0.5)]",
            minimized ? "bottom-4 h-[54px]" : "bottom-24 h-[600px] max-h-[calc(100vh-8rem)]"
          )}
        >
          {/* header */}
          <div className="flex items-center gap-3 bg-pine-deep px-4 py-3 text-[#f2efe2]">
            <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-honey text-pine-deep">
              <ClawIcon s={19} />
              <span className="pulse-dot absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-pine-deep bg-[#5ec98a]" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-[14.5px] font-bold leading-tight">OpenClaw</p>
              <p className="text-[10.5px] text-[#f2efe2]/60">
                {typing ? "sedang mengetik…" : "Personal AI · online"} · {ctx.storeName}
              </p>
            </div>
            <button
              onClick={() => setMinimized((m) => !m)}
              className="rounded-md p-1.5 transition hover:bg-white/10 cursor-pointer"
              aria-label="Minimalkan"
            >
              <IconChevronDown width={15} height={15} className={cx("transition-transform", minimized && "rotate-180")} />
            </button>
            <button onClick={() => setOpen(false)} className="rounded-md p-1.5 transition hover:bg-white/10 cursor-pointer" aria-label="Tutup">
              <IconX width={15} height={15} />
            </button>
          </div>

          {!minimized && (
            <>
              {/* tabs */}
              <div className="grid grid-cols-2 border-b border-line bg-paper/60">
                {(["chat", "tiket"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={cx(
                      "relative py-2.5 text-[12.5px] font-bold transition-colors cursor-pointer",
                      tab === t ? "text-pine" : "text-fog hover:text-ink"
                    )}
                  >
                    {t === "chat" ? "Chat AI" : `Tiket${openCount ? ` (${openCount})` : ""}`}
                    {tab === t && <span className="absolute inset-x-6 bottom-0 h-[2.5px] rounded-full bg-honey" />}
                  </button>
                ))}
              </div>

              {tab === "chat" ? (
                <>
                  {/* pesan */}
                  <div ref={listRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
                    {msgs.map((m) =>
                      m.role === "user" ? (
                        <div key={m.id} className="row-in flex justify-end">
                          <div className="max-w-[82%] rounded-2xl rounded-br-md bg-pine px-3.5 py-2.5 text-[12.5px] leading-relaxed text-[#f2efe2] shadow-sm">
                            {m.content}
                            <span className="num mt-1 block text-right text-[9px] text-[#f2efe2]/50">{timeOf(m.ts)}</span>
                          </div>
                        </div>
                      ) : (
                        <div key={m.id} className="row-in flex gap-2">
                          <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-honey text-pine-deep">
                            <ClawIcon s={13} />
                          </span>
                          <div className="max-w-[86%] rounded-2xl rounded-tl-md border border-line bg-white px-3.5 py-2.5 text-[12.5px] leading-relaxed shadow-sm">
                            {m.content}
                            <span className="num mt-1 flex items-center justify-between gap-3 text-[9px] text-fog/70">
                              <span>{timeOf(m.ts)}</span>
                              <span className="uppercase tracking-wider">{m.source === "openclaw-api" ? "openclaw api" : "mesin lokal"}</span>
                            </span>
                          </div>
                        </div>
                      )
                    )}
                    {typing && (
                      <div className="flex gap-2">
                        <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-honey text-pine-deep">
                          <ClawIcon s={13} />
                        </span>
                        <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-md border border-line bg-white px-4 py-3.5 shadow-sm">
                          <span className="typing-dot h-1.5 w-1.5 rounded-full bg-pine/60" />
                          <span className="typing-dot h-1.5 w-1.5 rounded-full bg-pine/60" style={{ animationDelay: "0.15s" }} />
                          <span className="typing-dot h-1.5 w-1.5 rounded-full bg-pine/60" style={{ animationDelay: "0.3s" }} />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* saran cepat */}
                  <div className="flex gap-1.5 overflow-x-auto border-t border-line/70 px-4 pb-2 pt-2.5">
                    {suggestions.map((s) => (
                      <button
                        key={s}
                        onClick={() => ask(s)}
                        disabled={typing}
                        className="shrink-0 rounded-full border border-pine/30 bg-pine-soft/60 px-3 py-1.5 text-[11px] font-bold text-pine transition-all hover:-translate-y-0.5 hover:bg-pine hover:text-[#f2efe2] disabled:opacity-50 cursor-pointer"
                      >
                        {s}
                      </button>
                    ))}
                  </div>

                  {/* input */}
                  <div className="border-t border-line bg-paper/50 p-3">
                    <div className="flex items-center gap-2">
                      <input
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && ask(input)}
                        placeholder="Tanya OpenClaw… (mis. 'buat tiket: printer rusak')"
                        className="input flex-1 bg-white py-2.5 text-[12.5px]"
                      />
                      <button
                        onClick={() => ask(input)}
                        disabled={!input.trim() || typing}
                        className="btn-primary h-10 w-10 shrink-0 rounded-xl"
                        aria-label="Kirim"
                      >
                        <IconSend width={16} height={16} />
                      </button>
                    </div>
                    <p className="num mt-2 flex items-center justify-between text-[9px] text-fog/70">
                      <span>{OPENCLAW_CONFIG.model} · schema v{OPENCLAW_CONFIG.schema}</span>
                      <span className="flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-pine" /> X-Tenant-Id: {ctx.subdomain}
                      </span>
                    </p>
                  </div>
                </>
              ) : (
                /* ===== tiket ===== */
                <div className="flex min-h-0 flex-1 flex-col">
                  <div className="border-b border-line p-4">
                    <label className="label">Subjek Kendala</label>
                    <input
                      value={tSubject}
                      onChange={(e) => setTSubject(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && createTicket()}
                      placeholder="cth: Printer struk tidak merespons"
                      className="input bg-white text-[12.5px]"
                    />
                    <div className="mt-2.5 flex items-center gap-2">
                      <div className="flex flex-1 gap-1.5">
                        {(["rendah", "sedang", "tinggi"] as const).map((p) => (
                          <button
                            key={p}
                            onClick={() => setTPriority(p)}
                            className={cx(
                              "flex-1 rounded-lg border py-1.5 text-[11px] font-bold capitalize transition-all cursor-pointer",
                              tPriority === p
                                ? p === "tinggi"
                                  ? "border-clay bg-clay-soft text-clay"
                                  : p === "sedang"
                                    ? "border-honey bg-honey-soft text-[#8a5f10]"
                                    : "border-pine bg-pine-soft text-pine"
                                : "border-line text-fog hover:text-ink"
                            )}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                      <button onClick={createTicket} className="btn-primary px-4 py-2 text-[12px]">
                        <IconSend width={13} height={13} /> Kirim
                      </button>
                    </div>
                  </div>
                  <div className="min-h-0 flex-1 overflow-y-auto p-4">
                    {tickets.length === 0 ? (
                      <div className="flex h-full flex-col items-center justify-center text-center">
                        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-pine-soft text-pine">
                          <ClawIcon s={20} />
                        </span>
                        <p className="font-display mt-3 text-[14px] font-bold">Belum ada tiket</p>
                        <p className="mt-1 max-w-[220px] text-[11.5px] text-fog">
                          Keluhan dari chat AI atau formulir di atas akan muncul di sini dengan nomor pelacakan.
                        </p>
                      </div>
                    ) : (
                      <ul className="space-y-2.5">
                        {tickets.map((t) => (
                          <li key={t.id} className="row-in rounded-xl border border-line bg-white p-3.5 transition-colors hover:border-pine/35">
                            <div className="flex items-center justify-between gap-2">
                              <span className="num text-[10.5px] font-bold text-fog">{t.id}</span>
                              <span
                                className={cx(
                                  "rounded-md px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider",
                                  t.status === "terbuka" && "bg-honey-soft text-[#8a5f10]",
                                  t.status === "ditangani" && "bg-tide-soft text-tide",
                                  t.status === "selesai" && "bg-pine-soft text-pine"
                                )}
                              >
                                {t.status}
                              </span>
                            </div>
                            <p className="mt-1.5 text-[12.5px] font-bold leading-snug">{t.subject}</p>
                            <div className="num mt-1.5 flex items-center justify-between text-[10px] text-fog">
                              <span>
                                prioritas{" "}
                                <span className={cx("font-bold", t.priority === "tinggi" ? "text-clay" : t.priority === "sedang" ? "text-[#8a5f10]" : "text-pine")}>
                                  {t.priority}
                                </span>{" "}
                                · {t.source}
                              </span>
                              <span>{new Date(t.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ===== FAB ===== */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={cx(
          "group fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-full py-3 pl-4 pr-5 font-bold text-[#f2efe2] shadow-[0_14px_34px_-8px_rgba(12,32,24,0.55)] transition-all duration-200 cursor-pointer",
          open ? "bg-clay hover:brightness-105" : "bg-pine-deep hover:-translate-y-0.5 hover:bg-pine"
        )}
        aria-label="Buka helpdesk OpenClaw"
      >
        <span className={cx("relative flex h-7 w-7 items-center justify-center rounded-full", open ? "bg-white/15" : "bg-honey text-pine-deep")}>
          {open ? <IconX width={16} height={16} /> : <ClawIcon s={16} />}
          {!open && !seen && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-pine-deep bg-clay pulse-dot" />}
        </span>
        <span className="text-[13px]">{open ? "Tutup" : "Bantuan AI"}</span>
      </button>
    </>
  );
}

export function HelpdeskCtxSummary() {
  return null;
}

export { OPENCLAW_CONFIG as OC_CONFIG };
export function resetChatStorage() {
  try {
    localStorage.removeItem("skmnet_openclaw_history_v1");
  } catch {
    /* abaikan */
  }
}
