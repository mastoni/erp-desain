import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;

function base(p: P): P {
  return {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    ...p,
  };
}

export const IconGrid = (p: P) => (
  <svg {...base(p)}><rect x="3" y="3" width="7.5" height="7.5" rx="1.5" /><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" /><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" /><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" /></svg>
);
export const IconScan = (p: P) => (
  <svg {...base(p)}><path d="M3 7V5a2 2 0 0 1 2-2h2" /><path d="M17 3h2a2 2 0 0 1 2 2v2" /><path d="M21 17v2a2 2 0 0 1-2 2h-2" /><path d="M7 21H5a2 2 0 0 1-2-2v-2" /><path d="M7 12h10" /></svg>
);
export const IconBox = (p: P) => (
  <svg {...base(p)}><path d="M21 8l-9-5-9 5v8l9 5 9-5V8z" /><path d="M3.3 8.3L12 13l8.7-4.7" /><path d="M12 13v9" /></svg>
);
export const IconReceipt = (p: P) => (
  <svg {...base(p)}><path d="M6 2h12v20l-3-2-3 2-3-2-3 2V2z" /><path d="M9.5 7.5h5" /><path d="M9.5 11h5" /></svg>
);
export const IconWallet = (p: P) => (
  <svg {...base(p)}><path d="M20 7H5a2 2 0 0 1 0-4h13v4" /><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1" /><path d="M16.5 13.5h.01" /></svg>
);
export const IconUsers = (p: P) => (
  <svg {...base(p)}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.8-3.2 3.4-5 6.5-5s5.7 1.8 6.5 5" /><path d="M16 4.8a3.5 3.5 0 0 1 0 6.4" /><path d="M18.5 15.6c1.6.8 2.7 2.3 3 4.4" /></svg>
);
export const IconSearch = (p: P) => (
  <svg {...base(p)}><circle cx="11" cy="11" r="7" /><path d="M16.5 16.5L21 21" /></svg>
);
export const IconBell = (p: P) => (
  <svg {...base(p)}><path d="M18 9a6 6 0 1 0-12 0c0 5-2 6.5-2 6.5h16S18 14 18 9" /><path d="M10 19.5a2.2 2.2 0 0 0 4 0" /></svg>
);
export const IconSliders = (p: P) => (
  <svg {...base(p)}><path d="M4 6h9" /><circle cx="16.5" cy="6" r="2.2" /><path d="M20 12h-9" /><circle cx="7.5" cy="12" r="2.2" /><path d="M4 18h9" /><circle cx="16.5" cy="18" r="2.2" /></svg>
);
export const IconChevronDown = (p: P) => (
  <svg {...base(p)}><path d="M6 9l6 6 6-6" /></svg>
);
export const IconChevronRight = (p: P) => (
  <svg {...base(p)}><path d="M9 6l6 6-6 6" /></svg>
);
export const IconPlus = (p: P) => (
  <svg {...base(p)}><path d="M12 5v14" /><path d="M5 12h14" /></svg>
);
export const IconMinus = (p: P) => (
  <svg {...base(p)}><path d="M5 12h14" /></svg>
);
export const IconTrash = (p: P) => (
  <svg {...base(p)}><path d="M4 7h16" /><path d="M9 7V4h6v3" /><path d="M6 7l1 13.5h10L18 7" /><path d="M10 11v6" /><path d="M14 11v6" /></svg>
);
export const IconX = (p: P) => (
  <svg {...base(p)}><path d="M6 6l12 12" /><path d="M18 6L6 18" /></svg>
);
export const IconCheck = (p: P) => (
  <svg {...base(p)}><path d="M4 12.5l5 5L20 6.5" /></svg>
);
export const IconPrinter = (p: P) => (
  <svg {...base(p)}><path d="M6 9V3h12v6" /><rect x="3.5" y="9" width="17" height="8" rx="1.5" /><path d="M6.5 14h11v7h-11z" /></svg>
);
export const IconDownload = (p: P) => (
  <svg {...base(p)}><path d="M12 3v12" /><path d="M7 10l5 5 5-5" /><path d="M4 21h16" /></svg>
);
export const IconArrowUpRight = (p: P) => (
  <svg {...base(p)}><path d="M7 17L17 7" /><path d="M8 7h9v9" /></svg>
);
export const IconArrowDownRight = (p: P) => (
  <svg {...base(p)}><path d="M7 7l10 10" /><path d="M17 8v9H8" /></svg>
);
export const IconCash = (p: P) => (
  <svg {...base(p)}><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="2.5" /><path d="M5.5 12h.01" /><path d="M18.5 12h.01" /></svg>
);
export const IconQr = (p: P) => (
  <svg {...base(p)}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><path d="M14 14h3v3h-3z" /><path d="M20 14v2" /><path d="M14 20h2" /><path d="M19 19.5h2v2h-2z" /></svg>
);
export const IconCard = (p: P) => (
  <svg {...base(p)}><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /><path d="M6 15h4" /></svg>
);
export const IconClock = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></svg>
);
export const IconStore = (p: P) => (
  <svg {...base(p)}><path d="M3.5 9L5 3.5h14L20.5 9" /><path d="M3.5 9a2.8 2.8 0 0 0 5.7 0 2.8 2.8 0 0 0 5.6 0 2.8 2.8 0 0 0 5.7 0" /><path d="M5 12.5V20h14v-7.5" /><path d="M9.5 20v-4.5h5V20" /></svg>
);
export const IconMenu = (p: P) => (
  <svg {...base(p)}><path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h16" /></svg>
);
export const IconPencil = (p: P) => (
  <svg {...base(p)}><path d="M4 20l4.5-1L19.5 8a2.1 2.1 0 0 0-3-3L5.5 16 4 20z" /><path d="M14.5 7l3 3" /></svg>
);
export const IconAlert = (p: P) => (
  <svg {...base(p)}><path d="M10.3 4.2L2.8 17.5A2 2 0 0 0 4.5 20.5h15a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0z" /><path d="M12 9.5v4.5" /><path d="M12 17.2h.01" /></svg>
);
export const IconLogout = (p: P) => (
  <svg {...base(p)}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></svg>
);
export const IconBookmark = (p: P) => (
  <svg {...base(p)}><path d="M6 3h12v18l-6-4.2L6 21V3z" /></svg>
);
export const IconBasket = (p: P) => (
  <svg {...base(p)}><path d="M4 9.5h16l-1.6 11H5.6L4 9.5z" /><path d="M8.5 9.5L12 3l3.5 6.5" /><path d="M9.5 13.5v3.5" /><path d="M14.5 13.5v3.5" /></svg>
);
export const IconFile = (p: P) => (
  <svg {...base(p)}><path d="M6 2.5h8.5L20 8v13.5H6z" /><path d="M14 2.5V8h5.5" /><path d="M9 13h7" /><path d="M9 16.5h7" /></svg>
);
export const IconTrendUp = (p: P) => (
  <svg {...base(p)}><path d="M3 17l6-6 4 4 8-8" /><path d="M15 7h6v6" /></svg>
);
export const IconHistory = (p: P) => (
  <svg {...base(p)}><path d="M3.5 12a8.5 8.5 0 1 1 2.5 6" /><path d="M3.5 12H7" /><path d="M3.5 12V8.5" /><path d="M12 8v4l3 2" /></svg>
);
export const IconSwap = (p: P) => (
  <svg {...base(p)}><path d="M7 4v13" /><path d="M3.5 7.5L7 4l3.5 3.5" /><path d="M17 20V7" /><path d="M13.5 16.5L17 20l3.5-3.5" /></svg>
);
export const IconTruck = (p: P) => (
  <svg {...base(p)}><path d="M2.5 6.5h12V17h-12z" /><path d="M14.5 9.5h3.4l3.1 3.3V17h-2.4" /><circle cx="7" cy="18.3" r="1.9" /><circle cx="17.2" cy="18.3" r="1.9" /><path d="M9 17h6.2" /></svg>
);
export const IconBuilding = (p: P) => (
  <svg {...base(p)}><rect x="5" y="3.5" width="14" height="17" rx="1.2" /><path d="M9 7.5h2M13 7.5h2M9 11.5h2M13 11.5h2M9 15.5h2M13 15.5h2" /><path d="M10.5 20.5v-2.8h3v2.8" /></svg>
);
export const IconBook = (p: P) => (
  <svg {...base(p)}><path d="M4.5 19.2V5.3a1.8 1.8 0 0 1 1.8-1.8h13.2v15.7H6.3a1.8 1.8 0 0 0-1.8 1.8z" /><path d="M4.5 19.2a1.8 1.8 0 0 0 1.8 1.8h13.2" /><path d="M9 3.5v15.7" /></svg>
);
export const IconStar = (p: P) => (
  <svg {...base(p)}><path d="M12 3.6l2.5 5.2 5.7.8-4.1 4 1 5.7-5.1-2.7-5.1 2.7 1-5.7-4.1-4 5.7-.8L12 3.6z" /></svg>
);
export const IconCoins = (p: P) => (
  <svg {...base(p)}><ellipse cx="9" cy="7" rx="6" ry="3" /><path d="M3 7v5c0 1.7 2.7 3 6 3s6-1.3 6-3V7" /><path d="M3 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5" /><path d="M21 10.5v5c0 1.4-1.8 2.5-4.2 2.9" /></svg>
);
export const IconZap = (p: P) => (
  <svg {...base(p)}><path d="M13 2 4.5 13.5H11L9.5 22 19 10h-6.5L13 2z" /></svg>
);
export const IconSmartphone = (p: P) => (
  <svg {...base(p)}><rect x="7" y="2.5" width="10" height="19" rx="2.5" /><path d="M10.5 18.5h3" /></svg>
);
export const IconWifi = (p: P) => (
  <svg {...base(p)}><path d="M2.5 9.2a15 15 0 0 1 19 0" /><path d="M5.5 12.6a10.5 10.5 0 0 1 13 0" /><path d="M8.6 15.9a6 6 0 0 1 6.8 0" /><path d="M12 19.5h.01" /></svg>
);
export const IconDroplet = (p: P) => (
  <svg {...base(p)}><path d="M12 3s6.5 7 6.5 11.5a6.5 6.5 0 0 1-13 0C5.5 10 12 3 12 3z" /></svg>
);
export const IconSend = (p: P) => (
  <svg {...base(p)}><path d="m21.5 2.5-8 19-3.5-7.5L2.5 10.5l19-8z" /><path d="M21.5 2.5 10 14" /></svg>
);
export const IconShieldPlus = (p: P) => (
  <svg {...base(p)}><path d="M12 2.5 20 6v6c0 5-3.4 8-8 9.5C7.4 20 4 17 4 12V6l8-3.5z" /><path d="M12 9v6" /><path d="M9 12h6" /></svg>
);
