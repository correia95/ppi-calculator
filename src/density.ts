// Pixel-density engine: screen PPI and print DPI/size conversions. Pure.

export const MM_PER_IN = 25.4;
const ARCMIN_RAD = Math.PI / (180 * 60); // one arc-minute in radians

export function gcd(a: number, b: number): number {
  a = Math.abs(Math.round(a));
  b = Math.abs(Math.round(b));
  while (b) [a, b] = [b, a % b];
  return a || 1;
}

export function aspectRatio(w: number, h: number): string {
  if (!(w > 0) || !(h > 0)) return '—';
  const g = gcd(w, h);
  let rw = w / g;
  let rh = h / g;
  // collapse very large tuples to a decimal:1 form
  if (rw > 40 || rh > 40) {
    return `${(w / h).toFixed(2)} : 1`;
  }
  return `${rw} : ${rh}`;
}

export interface ScreenResult {
  ok: boolean;
  error?: string;
  ppi: number;
  dotPitchMm: number;
  diagonalPx: number;
  widthIn: number;
  heightIn: number;
  widthCm: number;
  heightCm: number;
  megapixels: number;
  aspect: string;
  retinaDistanceCm: number; // distance where pixels stop being individually resolvable (~1 arcmin)
  retinaDistanceIn: number;
}

export function screenDensity(wPx: number, hPx: number, diagIn: number): ScreenResult {
  const blank: ScreenResult = {
    ok: false,
    ppi: NaN,
    dotPitchMm: NaN,
    diagonalPx: NaN,
    widthIn: NaN,
    heightIn: NaN,
    widthCm: NaN,
    heightCm: NaN,
    megapixels: NaN,
    aspect: '—',
    retinaDistanceCm: NaN,
    retinaDistanceIn: NaN,
  };
  if (!(wPx > 0) || !(hPx > 0)) return { ...blank, error: 'Enter the horizontal and vertical resolution in pixels' };
  if (!(diagIn > 0)) return { ...blank, error: 'Enter the screen diagonal in inches' };

  const diagonalPx = Math.hypot(wPx, hPx);
  const ppi = diagonalPx / diagIn;
  const widthIn = wPx / ppi;
  const heightIn = hPx / ppi;
  const dotPitchMm = MM_PER_IN / ppi;
  const pixelSizeMm = dotPitchMm;
  const retinaDistanceMm = pixelSizeMm / ARCMIN_RAD;

  return {
    ok: true,
    ppi,
    dotPitchMm,
    diagonalPx,
    widthIn,
    heightIn,
    widthCm: widthIn * 2.54,
    heightCm: heightIn * 2.54,
    megapixels: (wPx * hPx) / 1_000_000,
    aspect: aspectRatio(wPx, hPx),
    retinaDistanceCm: retinaDistanceMm / 10,
    retinaDistanceIn: retinaDistanceMm / MM_PER_IN,
  };
}

// --- print ---------------------------------------------------------

export type PrintMode = 'toSize' | 'toPixels' | 'toDpi';
export type LengthUnit = 'in' | 'cm';

const toIn = (v: number, u: LengthUnit) => (u === 'in' ? v : v / 2.54);
const fromIn = (v: number, u: LengthUnit) => (u === 'in' ? v : v * 2.54);

export interface PrintResult {
  ok: boolean;
  error?: string;
  widthPx?: number;
  heightPx?: number;
  widthOut?: number; // in the chosen unit
  heightOut?: number;
  dpi?: number;
  quality?: 'excellent' | 'good' | 'acceptable' | 'low';
}

function qualityFor(dpi: number): PrintResult['quality'] {
  if (dpi >= 300) return 'excellent';
  if (dpi >= 200) return 'good';
  if (dpi >= 150) return 'acceptable';
  return 'low';
}

export interface PrintInput {
  mode: PrintMode;
  unit: LengthUnit;
  widthPx: number;
  heightPx: number;
  widthLen: number;
  heightLen: number;
  dpi: number;
}

export function printCalc(i: PrintInput): PrintResult {
  if (i.mode === 'toSize') {
    if (!(i.widthPx > 0) || !(i.heightPx > 0)) return { ok: false, error: 'Enter the image width and height in pixels' };
    if (!(i.dpi > 0)) return { ok: false, error: 'Enter the print resolution (DPI)' };
    const wIn = i.widthPx / i.dpi;
    const hIn = i.heightPx / i.dpi;
    return {
      ok: true,
      widthOut: fromIn(wIn, i.unit),
      heightOut: fromIn(hIn, i.unit),
      dpi: i.dpi,
      quality: qualityFor(i.dpi),
    };
  }
  if (i.mode === 'toPixels') {
    if (!(i.widthLen > 0) || !(i.heightLen > 0)) return { ok: false, error: 'Enter the printed width and height' };
    if (!(i.dpi > 0)) return { ok: false, error: 'Enter the print resolution (DPI)' };
    return {
      ok: true,
      widthPx: Math.round(toIn(i.widthLen, i.unit) * i.dpi),
      heightPx: Math.round(toIn(i.heightLen, i.unit) * i.dpi),
      dpi: i.dpi,
      quality: qualityFor(i.dpi),
    };
  }
  // toDpi
  if (!(i.widthPx > 0)) return { ok: false, error: 'Enter the image width in pixels' };
  if (!(i.widthLen > 0)) return { ok: false, error: 'Enter the printed width' };
  const dpi = i.widthPx / toIn(i.widthLen, i.unit);
  return { ok: true, dpi, quality: qualityFor(dpi) };
}

// --- presets ------------------------------------------------------

export interface ScreenPreset {
  name: string;
  w: number;
  h: number;
  diag: number;
}

export const PRESETS: ScreenPreset[] = [
  { name: 'Phone — 1080 × 2400, 6.1″', w: 1080, h: 2400, diag: 6.1 },
  { name: 'Phone — 1284 × 2778, 6.7″', w: 1284, h: 2778, diag: 6.7 },
  { name: 'Tablet — 1640 × 2360, 11″', w: 1640, h: 2360, diag: 11 },
  { name: 'Laptop — 1920 × 1080, 15.6″', w: 1920, h: 1080, diag: 15.6 },
  { name: 'Laptop — 2560 × 1600, 13.3″', w: 2560, h: 1600, diag: 13.3 },
  { name: 'Monitor — 2560 × 1440, 27″', w: 2560, h: 1440, diag: 27 },
  { name: 'Monitor — 3840 × 2160, 27″ (4K)', w: 3840, h: 2160, diag: 27 },
  { name: 'Monitor — 3840 × 2160, 32″ (4K)', w: 3840, h: 2160, diag: 32 },
  { name: 'TV — 3840 × 2160, 55″', w: 3840, h: 2160, diag: 55 },
];

// --- URL state ---------------------------------------------------

export interface ShareState {
  t: string;
  w: string;
  h: string;
  d: string;
}

export function encodeState(s: ShareState): string {
  const p = new URLSearchParams();
  p.set('t', s.t);
  if (s.w) p.set('w', s.w);
  if (s.h) p.set('h', s.h);
  if (s.d) p.set('d', s.d);
  return p.toString();
}

export function decodeState(query: string): Partial<ShareState> | null {
  const p = new URLSearchParams(query);
  if (![...p.keys()].length) return null;
  return { t: p.get('t') ?? undefined, w: p.get('w') ?? undefined, h: p.get('h') ?? undefined, d: p.get('d') ?? undefined };
}
