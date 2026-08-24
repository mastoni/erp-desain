import { useEffect, useId, useRef, useState } from "react";
import { idrShort } from "../lib/format";

/* ============ Sparkline ============ */
export function Sparkline({ data, color = "#17593e", className = "" }: { data: number[]; color?: string; className?: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 28 - ((v - min) / (max - min || 1)) * 24 + 2;
    return `${x},${y}`;
  });
  return (
    <svg viewBox="0 0 100 32" preserveAspectRatio="none" className={className}>
      <polygon points={`0,32 ${pts.join(" ")} 100,32`} fill={color} opacity="0.12" />
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

/* ============ Area chart dengan hover ============ */
export function AreaChart({ data, color = "#17593e" }: { data: { label: string; value: number }[]; color?: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const [drawn, setDrawn] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const gid = useId().replace(/:/g, "");

  useEffect(() => {
    const t = setTimeout(() => setDrawn(true), 60);
    return () => clearTimeout(t);
  }, []);

  const n = data.length;
  const max = Math.max(...data.map((d) => d.value)) * 1.12;
  const X = (i: number) => (i / (n - 1)) * 100;
  const Y = (v: number) => 100 - (v / max) * 100;

  let d = `M ${X(0)} ${Y(data[0].value)}`;
  for (let i = 1; i < n; i++) {
    const dx = (X(i) - X(i - 1)) / 2;
    d += ` C ${X(i - 1) + dx} ${Y(data[i - 1].value)}, ${X(i) - dx} ${Y(data[i].value)}, ${X(i)} ${Y(data[i].value)}`;
  }
  const area = `${d} L 100 100 L 0 100 Z`;

  const onMove = (e: React.MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const idx = Math.round(((e.clientX - rect.left) / rect.width) * (n - 1));
    setHover(Math.max(0, Math.min(n - 1, idx)));
  };

  const hv = hover !== null ? data[hover] : null;
  const labelEvery = n > 10 ? 5 : 1;

  return (
    <div>
      <div ref={ref} className="relative h-56 cursor-crosshair" onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
        {/* grid + label sumbu Y */}
        {[0.25, 0.5, 0.75].map((g) => (
          <div key={g} className="absolute left-0 right-0 border-t border-dashed border-line" style={{ top: `${g * 100}%` }}>
            <span className="num absolute -top-2.5 right-0 text-[10px] text-fog/80 bg-surface/70 px-1 rounded">
              {idrShort(Math.round(max * (1 - g)))}
            </span>
          </div>
        ))}
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible">
          <defs>
            <linearGradient id={`ag-${gid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.28" />
              <stop offset="100%" stopColor={color} stopOpacity="0.02" />
            </linearGradient>
          </defs>
          <path d={area} fill={`url(#ag-${gid})`} style={{ opacity: drawn ? 1 : 0, transition: "opacity 1s ease 0.3s" }} />
          <path
            d={d}
            fill="none"
            stroke={color}
            strokeWidth="2.4"
            vectorEffect="non-scaling-stroke"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={drawn ? 0 : 1}
            style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)" }}
          />
        </svg>

        {hv && hover !== null && (
          <>
            <div className="absolute top-0 bottom-0 w-px bg-pine/35 pointer-events-none" style={{ left: `${X(hover)}%` }} />
            <div
              className="absolute h-3 w-3 rounded-full bg-pine border-[2.5px] border-surface shadow pointer-events-none"
              style={{ left: `${X(hover)}%`, top: `${Y(hv.value)}%`, transform: "translate(-50%,-50%)" }}
            />
            <div
              className="absolute z-10 pointer-events-none rounded-lg bg-pine-deep text-[#f2efe2] px-3 py-2 shadow-lg"
              style={{
                left: `${Math.max(8, Math.min(92, X(hover)))}%`,
                top: `${Math.max(6, Y(hv.value) - 8)}%`,
                transform: "translate(-50%,-100%)",
              }}
            >
              <div className="text-[10px] uppercase tracking-wider opacity-70">{hv.label}</div>
              <div className="num text-sm font-semibold">{idrShort(hv.value)}</div>
            </div>
          </>
        )}
      </div>
      <div className="mt-2 flex justify-between">
        {data.map((pt, i) => (
          <span key={i} className={`num text-[10px] ${i % labelEvery === 0 ? "text-fog" : "text-transparent select-none"}`}>
            {pt.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ============ Donut ============ */
export function Donut({
  items,
  centerLabel,
  centerValue,
}: {
  items: { label: string; value: number; color: string }[];
  centerLabel: string;
  centerValue: string;
}) {
  const [active, setActive] = useState<number | null>(null);
  const total = items.reduce((s, i) => s + i.value, 0);
  let acc = 0;

  return (
    <div className="flex items-center gap-5">
      <div className="relative h-36 w-36 shrink-0">
        <svg viewBox="0 0 42 42" className="h-full w-full -rotate-90">
          <circle cx="21" cy="21" r="15.915" fill="none" stroke="#e8e6d9" strokeWidth="4.5" />
          {items.map((it, i) => {
            const v = (it.value / total) * 100;
            const el = (
              <circle
                key={it.label}
                cx="21"
                cy="21"
                r="15.915"
                fill="none"
                stroke={it.color}
                strokeWidth={active === i ? 6 : 4.5}
                strokeDasharray={`${Math.max(v - 1.5, 0.5)} ${100 - Math.max(v - 1.5, 0.5)}`}
                strokeDashoffset={-acc - 0.75}
                strokeLinecap="round"
                opacity={active === null || active === i ? 1 : 0.3}
                style={{ transition: "all 0.25s ease" }}
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
              />
            );
            acc += v;
            return el;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[10px] uppercase tracking-wider text-fog">{active !== null ? items[active].label : centerLabel}</span>
          <span className="num text-lg font-bold">{active !== null ? `${items[active].value}%` : centerValue}</span>
        </div>
      </div>
      <ul className="min-w-0 flex-1 space-y-2">
        {items.map((it, i) => (
          <li
            key={it.label}
            className="flex items-center gap-2 text-sm cursor-default"
            onMouseEnter={() => setActive(i)}
            onMouseLeave={() => setActive(null)}
          >
            <span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ background: it.color }} />
            <span className="truncate text-ink/85">{it.label}</span>
            <span className="num ml-auto font-semibold">{it.value}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ============ Bar berpasangan (masuk vs keluar) ============ */
export function PairBars({ data }: { data: { m: string; masuk: number; keluar: number }[] }) {
  const [on, setOn] = useState(false);
  const [hover, setHover] = useState<number | null>(null);
  useEffect(() => {
    const t = setTimeout(() => setOn(true), 80);
    return () => clearTimeout(t);
  }, []);
  const max = Math.max(...data.map((d) => Math.max(d.masuk, d.keluar))) * 1.1;

  return (
    <div>
      <div className="flex h-48 items-end gap-3 sm:gap-5">
        {data.map((d, i) => (
          <div
            key={d.m}
            className="group relative flex flex-1 flex-col items-center gap-2"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          >
            {hover === i && (
              <div className="absolute -top-1 z-10 -translate-y-full rounded-lg bg-pine-deep px-3 py-2 text-[#f2efe2] shadow-lg whitespace-nowrap">
                <div className="text-[10px] uppercase tracking-wider opacity-70">{d.m}</div>
                <div className="num text-xs">Masuk&nbsp; {idrShort(d.masuk * 1_000_000)}</div>
                <div className="num text-xs">Keluar {idrShort(d.keluar * 1_000_000)}</div>
              </div>
            )}
            <div className="flex h-40 w-full items-end justify-center gap-1.5">
              <div
                className="w-full max-w-6 rounded-t-[5px] bg-pine bar-rise"
                style={{ height: on ? `${(d.masuk / max) * 100}%` : "0%", animationDelay: `${i * 70}ms`, transition: "height 0.7s ease" }}
              />
              <div
                className="w-full max-w-6 rounded-t-[5px] bg-honey/85 bar-rise"
                style={{ height: on ? `${(d.keluar / max) * 100}%` : "0%", animationDelay: `${i * 70 + 90}ms`, transition: "height 0.7s ease" }}
              />
            </div>
            <span className="num text-[11px] text-fog">{d.m}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============ Bar mini per jam ============ */
export function HourBars({ data }: { data: { h: string; v: number }[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(...data.map((d) => d.v));
  return (
    <div>
      <div className="flex h-28 items-end gap-[5px]">
        {data.map((d, i) => (
          <div
            key={d.h}
            className="group relative flex flex-1 items-end"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          >
            {hover === i && (
              <div className="absolute bottom-full left-1/2 z-10 mb-1.5 -translate-x-1/2 rounded-md bg-pine-deep px-2 py-1 text-[#f2efe2] shadow whitespace-nowrap">
                <span className="num text-[10px]">{d.h}:00 · {idrShort(d.v)}</span>
              </div>
            )}
            <div
              className={`w-full rounded-t-[4px] transition-all duration-300 bar-rise ${hover === i ? "bg-honey" : "bg-pine/65 group-hover:bg-pine"}`}
              style={{ height: `${(d.v / max) * 100}%`, animationDelay: `${i * 45}ms` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex justify-between">
        {data.map((d, i) => (
          <span key={d.h} className={`num text-[9px] ${i % 3 === 0 ? "text-fog" : "text-transparent select-none"}`}>{d.h}</span>
        ))}
      </div>
    </div>
  );
}
