import { useEffect, useRef, useState, type ReactNode } from "react";
import { cx } from "../lib/format";
import { IconAlert, IconCheck, IconX } from "./icons";

/* ---------- count-up ---------- */
export function useCountUp(target: number, duration = 900): number {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      setV(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return v;
}

/* ---------- scroll reveal ---------- */
export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVis(true);
          io.disconnect();
        }
      },
      { threshold: 0.08 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ transitionDelay: `${delay}ms` }} className={cx("reveal", vis && "reveal-in", className)}>
      {children}
    </div>
  );
}

/* ---------- badge ---------- */
type Tone = "pine" | "honey" | "clay" | "tide" | "fog";
const TONES: Record<Tone, string> = {
  pine: "bg-pine-soft text-pine border-pine/25",
  honey: "bg-honey-soft text-[#8a5f10] border-honey/35",
  clay: "bg-clay-soft text-clay border-clay/30",
  tide: "bg-tide-soft text-tide border-tide/30",
  fog: "bg-ink/5 text-fog border-ink/10",
};
export function Badge({ tone = "fog", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cx("inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-semibold", TONES[tone], className)}>
      {children}
    </span>
  );
}

/* ---------- delta ---------- */
export function Delta({ value, invert = false }: { value: number; invert?: boolean }) {
  const good = invert ? value < 0 : value > 0;
  return (
    <span
      className={cx(
        "num inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-bold",
        good ? "bg-pine-soft text-pine" : "bg-clay-soft text-clay"
      )}
    >
      {value > 0 ? "▲" : "▼"} {Math.abs(value).toLocaleString("id-ID", { maximumFractionDigits: 1 })}%
    </span>
  );
}

/* ---------- section head ---------- */
export function SectionHead({ title, desc, action }: { title: string; desc?: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-[26px] font-bold leading-tight tracking-tight">{title}</h1>
        {desc && <p className="mt-1 text-sm text-fog">{desc}</p>}
      </div>
      {action}
    </div>
  );
}

/* ---------- modal ---------- */
export function Modal({
  open,
  onClose,
  children,
  width = "max-w-md",
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  width?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="overlay-in fixed inset-0 z-50 flex items-center justify-center bg-pine-deep/55 p-4 backdrop-blur-[2px]"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={cx("modal-in w-full rounded-xl border border-line bg-surface shadow-2xl", width)}>{children}</div>
    </div>
  );
}

export function ModalHead({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between border-b border-line px-5 py-4">
      <h3 className="font-display text-lg font-bold">{title}</h3>
      <button onClick={onClose} className="btn-outline h-8 w-8 rounded-md" aria-label="Tutup">
        <IconX width={15} height={15} />
      </button>
    </div>
  );
}

/* ---------- switch ---------- */
export function Switch({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className={cx(
        "relative h-6 w-11 rounded-full transition-colors duration-200 cursor-pointer",
        on ? "bg-pine" : "bg-ink/15"
      )}
      aria-pressed={on}
    >
      <span
        className={cx(
          "absolute top-0.5 h-5 w-5 rounded-full bg-surface shadow transition-all duration-200",
          on ? "left-[22px]" : "left-0.5"
        )}
      />
    </button>
  );
}

/* ---------- toast ---------- */
export type Toast = { id: number; msg: string; tone: "success" | "warn" | "info" };

export function ToastStack({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  return (
    <div className="fixed right-4 top-[76px] z-[60] flex w-[320px] max-w-[calc(100vw-2rem)] flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cx(
            "toast-in flex items-start gap-2.5 rounded-lg border px-3.5 py-3 shadow-lg backdrop-blur bg-surface/95",
            t.tone === "success" && "border-pine/30",
            t.tone === "warn" && "border-honey/50",
            t.tone === "info" && "border-tide/30"
          )}
        >
          <span
            className={cx(
              "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
              t.tone === "success" && "bg-pine text-[#f2efe2]",
              t.tone === "warn" && "bg-honey text-pine-deep",
              t.tone === "info" && "bg-tide text-white"
            )}
          >
            {t.tone === "warn" ? <IconAlert width={11} height={11} /> : <IconCheck width={11} height={11} />}
          </span>
          <p className="flex-1 text-[13px] font-medium leading-snug">{t.msg}</p>
          <button onClick={() => onDismiss(t.id)} className="text-fog hover:text-ink transition-colors cursor-pointer" aria-label="Tutup notifikasi">
            <IconX width={13} height={13} />
          </button>
        </div>
      ))}
    </div>
  );
}

/* ---------- empty state ---------- */
export function EmptyState({ icon, title, desc }: { icon: ReactNode; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-pine-soft text-pine">{icon}</div>
      <p className="font-display font-semibold">{title}</p>
      <p className="mt-1 max-w-[240px] text-xs text-fog">{desc}</p>
    </div>
  );
}
