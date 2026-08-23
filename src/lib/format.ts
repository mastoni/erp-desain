export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

const idrFull = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const numFmt = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 });

/** "Rp 8.450.000" */
export function idr(n: number): string {
  return idrFull.format(n);
}

/** "8.450.000" tanpa simbol */
export function num(n: number): string {
  return numFmt.format(n);
}

/** "Rp 8,45 jt" / "Rp 845 rb" — untuk angka ringkas */
export function idrShort(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  const f = (v: number) =>
    v.toLocaleString("id-ID", { maximumFractionDigits: v >= 100 ? 0 : v >= 10 ? 1 : 2 });
  if (abs >= 1_000_000_000) return `Rp ${sign}${f(abs / 1_000_000_000)} M`;
  if (abs >= 1_000_000) return `Rp ${sign}${f(abs / 1_000_000)} jt`;
  if (abs >= 1_000) return `Rp ${sign}${f(abs / 1_000)} rb`;
  return `Rp ${sign}${abs}`;
}

export function pct(n: number, signed = true): string {
  const s = n.toLocaleString("id-ID", { maximumFractionDigits: 1 });
  return signed && n > 0 ? `+${s}%` : `${s}%`;
}
