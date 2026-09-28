import { useMemo } from "react";
import type { ComponentPropsWithoutRef } from "react";

function hashFNV1a(str: string) {
  let h = 0x811c9dc5 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function makeRng(seed: number) {
  let s = (seed + 0x9e3779b9) >>> 0;
  return function next() {
    s = (s + 0x9e3779b9) >>> 0;
    let z = s;
    z = (z ^ (z >>> 16)) >>> 0;
    z = Math.imul(z, 0x85ebca6b) >>> 0;
    z = (z ^ (z >>> 13)) >>> 0;
    z = Math.imul(z, 0xc2b2ae35) >>> 0;
    z = (z ^ (z >>> 16)) >>> 0;
    return z / 0x100000000;
  };
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const normHue = (h: number) => ((h % 360) + 360) % 360;

const oklchStr = (L: number, C: number, H: number, a = 1) =>
  `oklch(${L.toFixed(3)} ${C.toFixed(3)} ${normHue(H).toFixed(1)}${a !== 1 ? ` / ${a}` : ""})`;

const hslStr = (H: number, S: number, L: number, a = 1) =>
  `hsl(${normHue(H).toFixed(1)} ${clamp(S, 0, 100).toFixed(1)}% ${clamp(L, 0, 100).toFixed(1)}%${a !== 1 ? ` / ${a}` : ""})`;

const BAYER_4X4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
] as const;
type BayerIndex = 0 | 1 | 2 | 3;
const toBayerIndex = (n: number) => (n & 3) as BayerIndex;

function makeAtariDitherPath(seed: number, size = 40) {
  const rnd = makeRng(seed);
  const ox = Math.floor(rnd() * 4);
  const oy = Math.floor(rnd() * 4);
  const lift = (rnd() - 0.5) * 0.14;
  let d = "";

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const t = clamp((x - y + (size - 1)) / (2 * (size - 1)) + lift, 0, 1);
      const threshold = BAYER_4X4[toBayerIndex(y + oy)][toBayerIndex(x + ox)] / 15;
      if (t > threshold) {
        d += `M${x} ${y}h1v1h-1z`;
      }
    }
  }

  return d;
}

function derivePalette(name?: string | null) {
  const n = (name ?? "").trim().toLowerCase();
  const baseSeed = hashFNV1a(n || "∅");
  const rnd = makeRng(baseSeed);

  const r1 = rnd();
  const r2 = rnd();
  const r3 = rnd();
  const r4 = rnd();

  const h1 = r1 * 360;
  const h2 = h1 + (80 + r2 * 160);

  let L1 = 0.7 + r3 * 0.16;
  let C1 = 0.12 + r4 * 0.14;

  const len = Math.max(1, n.length);
  const vows = (n.match(/[aeiou]/g) || []).length;
  const vowRatio = vows / len;
  L1 = clamp(L1 + (vowRatio - 0.5) * 0.06, 0.6, 0.9);
  C1 = clamp(C1 + ((len % 7) / 7 - 0.5) * 0.06, 0.1, 0.3);

  const L2 = clamp(L1 - 0.06, 0, 1);
  const C2 = clamp(C1 + 0.02, 0, 0.32);

  return { seed: baseSeed, h1, h2, L1, L2, C1, C2 };
}

export type ColorIconProps = ComponentPropsWithoutRef<"svg"> & {
  name?: string | null;
  mode?: "oklch" | "hsl" | "atari";
};

export const ColorIcon = ({ name, mode = "oklch", ...svgProps }: ColorIconProps) => {
  const { seed, h1, h2, L1, L2, C1, C2 } = useMemo(() => derivePalette(name ?? ""), [name]);

  const gradId = `team-grad-${seed.toString(36)}`;

  const hMix1 = h1 + (h2 - h1) * 0.33;
  const hMix2 = h1 + (h2 - h1) * 0.66;

  const stop0 = mode === "oklch" ? oklchStr(L1 + 0.01, C1, h1) : hslStr(h1, 78, 62);
  const stop1 = mode === "oklch" ? oklchStr(L1, C1 + 0.01, hMix1) : hslStr(hMix1, 84, 58);
  const stop2 = mode === "oklch" ? oklchStr(L2, C2, hMix2) : hslStr(hMix2, 86, 53);
  const stop3 = mode === "oklch" ? oklchStr(L2 - 0.01, C2, h2) : hslStr(h2, 80, 50);

  const atariPath = useMemo(() => makeAtariDitherPath(seed ^ 0x9e3779b9), [seed]);
  const atariTones = useMemo(() => {
    const rnd = makeRng(seed ^ 0x517cc1b7);
    const hue = rnd() * 360;
    const sat = 76 + rnd() * 14;
    const light = 68 + rnd() * 10;
    const dark = 34 + rnd() * 8;
    return {
      base: hslStr(hue, sat, light),
      pixel: hslStr(hue, sat, dark),
    };
  }, [seed]);

  if (mode === "atari") {
    return (
      <svg
        viewBox="0 0 80 80"
        aria-hidden
        focusable="false"
        shapeRendering="crispEdges"
        {...svgProps}
      >
        <rect width="80" height="80" fill={atariTones.base} rx="12" />
        <path fill={atariTones.pixel} transform="scale(2.5)" d={atariPath} />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 80 80" aria-hidden focusable="false" {...svgProps}>
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={stop0} />
          <stop offset="35%" stopColor={stop1} />
          <stop offset="70%" stopColor={stop2} />
          <stop offset="100%" stopColor={stop3} />
        </linearGradient>
      </defs>
      <rect width="80" height="80" fill={`url(#${gradId})`} rx="12" />
    </svg>
  );
};
