#!/usr/bin/env node
/**
 * Build a static isometric SVG skyline preview from contribution JSON.
 * Used for the GitHub profile README (no JS / no hosting cost).
 */
import { readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "data");
const OUT = join(__dirname, "preview.svg");

const LEVELS = [
  { min: 0.01, fill: "#0e4429", side: "#0a3320", top: "#126e3a" },
  { min: 0.25, fill: "#006d32", side: "#005428", top: "#0e8a42" },
  { min: 0.5, fill: "#26a641", side: "#1d8534", top: "#3cc456" },
  { min: 0.75, fill: "#39d353", side: "#2bb344", top: "#56e06c" },
];

function level(t) {
  let L = LEVELS[0];
  for (const x of LEVELS) if (t >= x.min) L = x;
  return L;
}

function towerHeight(count, max) {
  if (count <= 0) return 0;
  const t = Math.sqrt(count) / Math.sqrt(max);
  return 4 + t * 72;
}

function project(x, y, z) {
  const isoX = (x - y) * Math.cos(Math.PI / 6);
  const isoY = (x + y) * Math.sin(Math.PI / 6) - z;
  return [isoX, isoY];
}

/** Box with corner at (x,y,z0), size (w,d,h). Returns [right, left, top] faces. */
function boxFaces(x, y, z0, w, d, h, colors) {
  const p = (dx, dy, dz) => project(x + dx, y + dy, z0 + dz);
  const [x0, y0] = p(0, 0, 0);
  const [x1, y1] = p(w, 0, 0);
  const [x2, y2] = p(w, d, 0);
  const [x4, y4] = p(0, 0, h);
  const [x5, y5] = p(w, 0, h);
  const [x6, y6] = p(w, d, h);
  const [x7, y7] = p(0, d, h);

  return [
    { d: `M${x1},${y1} L${x2},${y2} L${x6},${y6} L${x5},${y5} Z`, fill: colors.side },
    { d: `M${x0},${y0} L${x1},${y1} L${x5},${y5} L${x4},${y4} Z`, fill: colors.fill },
    { d: `M${x4},${y4} L${x5},${y5} L${x6},${y6} L${x7},${y7} Z`, fill: colors.top },
  ];
}

async function loadLatestYear() {
  const files = (await readdir(DATA_DIR))
    .filter((f) => /^\d{4}\.json$/.test(f))
    .sort();
  if (!files.length) throw new Error("No year JSON in data/");
  return JSON.parse(await readFile(join(DATA_DIR, files.at(-1)), "utf8"));
}

function buildSvg(data) {
  const weeks = data.weeks;
  const counts = weeks.flatMap((w) => w.days.map((d) => d.count));
  const max = Math.max(1, ...counts);

  const cell = 10;
  const gap = 1.2;
  const size = cell - gap;
  const basePad = 14;
  const baseH = 8;
  const gridW = weeks.length * cell;
  const gridD = 7 * cell;

  const boxes = [
    {
      x: -basePad,
      y: -basePad,
      z0: 0,
      w: gridW + basePad * 2,
      d: gridD + basePad * 2,
      h: baseH,
      colors: { fill: "#161b22", side: "#0d1117", top: "#238636" },
      order: -1,
    },
  ];

  for (let wi = 0; wi < weeks.length; wi++) {
    for (let di = 0; di < weeks[wi].days.length; di++) {
      const c = weeks[wi].days[di].count;
      if (c <= 0) continue;
      const t = Math.sqrt(c) / Math.sqrt(max);
      boxes.push({
        x: wi * cell,
        y: di * cell,
        z0: baseH,
        w: size,
        d: size,
        h: towerHeight(c, max),
        colors: level(t),
        order: wi + di,
      });
    }
  }

  boxes.sort((a, b) => a.order - b.order || a.x + a.y - (b.x + b.y));

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const pathLines = [];

  for (const b of boxes) {
    for (const face of boxFaces(b.x, b.y, b.z0, b.w, b.d, b.h, b.colors)) {
      pathLines.push(`<path d="${face.d}" fill="${face.fill}"/>`);
      for (const m of face.d.matchAll(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g)) {
        const px = +m[1];
        const py = +m[2];
        minX = Math.min(minX, px);
        minY = Math.min(minY, py);
        maxX = Math.max(maxX, px);
        maxY = Math.max(maxY, py);
      }
    }
  }

  const pad = 36;
  const width = Math.ceil(maxX - minX + pad * 2);
  const height = Math.ceil(maxY - minY + pad * 2 + 52);
  const tx = -minX + pad;
  const ty = -minY + pad + 52;
  const total = data.total.toLocaleString("en-US");
  const title = `${data.username} · ${data.year} · ${total} contributions`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${title}">
  <title>${title}</title>
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0a121c"/>
      <stop offset="100%" stop-color="#070b12"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <text x="${pad}" y="28" fill="#3fb950" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="14" font-weight="700">GitHub Skyline</text>
  <text x="${pad}" y="50" fill="#8aa094" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="12">${title}</text>
  <g transform="translate(${tx}, ${ty})">
    ${pathLines.join("\n    ")}
  </g>
</svg>
`;
}

const data = await loadLatestYear();
await writeFile(OUT, buildSvg(data));
console.log(`Wrote ${OUT} (${data.year}, ${data.total} contributions)`);
