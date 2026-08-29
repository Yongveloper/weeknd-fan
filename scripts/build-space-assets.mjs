/* global Buffer, console, URL */
// One-off derivative builder for the home "space" scene.
// - Crops the eclipse source so the disc sits at the exact centre, then writes
//   responsive AVIF/WebP derivatives at or below the native crop size.
// - Renders a deterministic (seeded) SVG starfield and encodes it once.
// `sharp` comes in transitively through Astro's image pipeline.
//
//   node scripts/build-space-assets.mjs

import { mkdir } from 'node:fs/promises';
import sharp from 'sharp';

const outDir = new URL('../public/visual/', import.meta.url);
await mkdir(outDir, { recursive: true });

// Seeded PRNG shared by the rays and the star layers.
const mulberry32 = (seed) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

// --- eclipse ---------------------------------------------------------------
// Vector re-creation of src/assets/visual/eclipse-reference-2.png (total solar
// eclipse, gold corona, diamond-ring flare). Measured on the reference
// (disc centre (1915, 1148), R = 724 px): rim ≈ rgb(226 185 119) → 1.05R
// (93 65 41) → 1.12R (53 40 29) → 1.25R (34 30 23) → ≈background by 1.6R with
// streaky rays reaching 1.6–2.3R (longest on the left); flare sits on the rim
// at −39° with a white core (255 250 237) fading to (221 159 74) at 0.08R and
// (88 66 43) at 0.21R. Moon-surface texture is deliberately not reproduced:
// the disc is flat #000. Transparent background so the page starfield shows.
const eclipseSize = 2000;
const discRadius = eclipseSize * 0.225; // disc = 45% of the frame → room for rays to 2.2R
const centre = eclipseSize / 2;
const R = (f) => (discRadius * f).toFixed(1);
const coronaOuter = 2.2;
const cstop = (f, color, opacity) =>
  `<stop offset="${(f / coronaOuter).toFixed(4)}" stop-color="${color}" stop-opacity="${opacity}"/>`;

const rayRandom = mulberry32(20261010);
const rayBetween = (min, max) => min + (max - min) * rayRandom();
const rayColours = ['#d9944a', '#b8773a', '#8f5a30', '#e8b060'];
const rays = [];
for (let i = 0; i < 110; i++) {
  const angle = rayBetween(0, 360);
  const rad = (angle * Math.PI) / 180;
  // longer on the left (≈180°), shorter on top (≈270°), as in the reference
  const length =
    discRadius * rayBetween(0.55, 1.25) * (1 + 0.25 * Math.cos(rad - Math.PI));
  const start = discRadius * rayBetween(1.0, 1.03);
  rays.push(
    `<line x1="${(centre + start * Math.cos(rad)).toFixed(1)}" y1="${(centre + start * Math.sin(rad)).toFixed(1)}" x2="${(centre + (start + length) * Math.cos(rad)).toFixed(1)}" y2="${(centre + (start + length) * Math.sin(rad)).toFixed(1)}" stroke="${rayColours[Math.floor(rayRandom() * rayColours.length)]}" stroke-width="${rayBetween(14, 44).toFixed(1)}" stroke-opacity="${rayBetween(0.035, 0.1).toFixed(3)}" stroke-linecap="round"/>`,
  );
}
const streaks = [];
for (let i = 0; i < 40; i++) {
  const rad = (rayBetween(0, 360) * Math.PI) / 180;
  const length = discRadius * rayBetween(0.1, 0.3);
  streaks.push(
    `<line x1="${(centre + discRadius * 1.005 * Math.cos(rad)).toFixed(1)}" y1="${(centre + discRadius * 1.005 * Math.sin(rad)).toFixed(1)}" x2="${(centre + (discRadius + length) * Math.cos(rad)).toFixed(1)}" y2="${(centre + (discRadius + length) * Math.sin(rad)).toFixed(1)}" stroke="#f2b660" stroke-width="${rayBetween(3, 7).toFixed(1)}" stroke-opacity="${rayBetween(0.08, 0.2).toFixed(2)}" stroke-linecap="round"/>`,
  );
}

const flareAngle = (-38.9 * Math.PI) / 180;
const flareX = centre + discRadius * Math.cos(flareAngle);
const flareY = centre + discRadius * Math.sin(flareAngle);
const spikes = [];
for (let i = 0; i < 8; i++) {
  const rad = ((i * 45 + 12) * Math.PI) / 180;
  const half = discRadius * (i % 2 === 0 ? 0.42 : 0.24);
  spikes.push(
    `<line x1="${(flareX - half * Math.cos(rad)).toFixed(1)}" y1="${(flareY - half * Math.sin(rad)).toFixed(1)}" x2="${(flareX + half * Math.cos(rad)).toFixed(1)}" y2="${(flareY + half * Math.sin(rad)).toFixed(1)}" stroke="#ffe2a8" stroke-width="${i % 2 === 0 ? 3 : 2}" stroke-opacity="0.28" stroke-linecap="round"/>`,
  );
}

const eclipseSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${eclipseSize}" height="${eclipseSize}" viewBox="0 0 ${eclipseSize} ${eclipseSize}">
  <defs>
    <radialGradient id="corona" cx="0.5" cy="0.5" r="0.5">
      ${cstop(1.0, '#ffcf78', 1)}
      ${cstop(1.012, '#f0a94a', 0.98)}
      ${cstop(1.025, '#d98a3c', 0.82)}
      ${cstop(1.05, '#b46d34', 0.56)}
      ${cstop(1.08, '#8c5f3c', 0.5)}
      ${cstop(1.12, '#6e4e36', 0.42)}
      ${cstop(1.18, '#5c4636', 0.36)}
      ${cstop(1.25, '#4e3e32', 0.32)}
      ${cstop(1.35, '#40362e', 0.28)}
      ${cstop(1.5, '#302a26', 0.2)}
      ${cstop(1.8, '#221f1c', 0.1)}
      ${cstop(2.2, '#000000', 0)}
    </radialGradient>
    <radialGradient id="flare" gradientUnits="userSpaceOnUse" cx="${flareX.toFixed(1)}" cy="${flareY.toFixed(1)}" r="${R(0.5)}">
      <stop offset="0" stop-color="#fffaed" stop-opacity="1"/>
      <stop offset="0.08" stop-color="#f6dc97" stop-opacity="0.92"/>
      <stop offset="0.166" stop-color="#dd9f4a" stop-opacity="0.78"/>
      <stop offset="0.28" stop-color="#95693c" stop-opacity="0.5"/>
      <stop offset="0.42" stop-color="#58422b" stop-opacity="0.3"/>
      <stop offset="0.6" stop-color="#3a2c1e" stop-opacity="0.14"/>
      <stop offset="1" stop-color="#3a2c1e" stop-opacity="0"/>
    </radialGradient>
    <filter id="rays-blur" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="16"/>
    </filter>
    <filter id="streak-blur" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="5"/>
    </filter>
    <filter id="spike-blur" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="5"/>
    </filter>
    <filter id="band-blur" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="26"/>
    </filter>
    <filter id="haze-blur" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="60"/>
    </filter>
  </defs>
  <!-- cool, faint dust haze on the left as in the reference -->
  <g filter="url(#haze-blur)" fill="#6d8592">
    <ellipse cx="${(eclipseSize * 0.28).toFixed(0)}" cy="${(eclipseSize * 0.52).toFixed(0)}" rx="${(eclipseSize * 0.28).toFixed(0)}" ry="${(eclipseSize * 0.16).toFixed(0)}" opacity="0.06"/>
    <ellipse cx="${(eclipseSize * 0.42).toFixed(0)}" cy="${(eclipseSize * 0.3).toFixed(0)}" rx="${(eclipseSize * 0.2).toFixed(0)}" ry="${(eclipseSize * 0.1).toFixed(0)}" opacity="0.04"/>
  </g>
  <circle cx="50%" cy="50%" r="${R(coronaOuter)}" fill="url(#corona)"/>
  <!-- soft warm mass hugging the rim, like the inner corona in the reference -->
  <circle cx="50%" cy="50%" r="${R(1.1)}" fill="none" stroke="#c27a3a" stroke-width="${R(0.18)}" stroke-opacity="0.32" filter="url(#band-blur)"/>
  <g filter="url(#rays-blur)">
    ${rays.join('\n    ')}
  </g>
  <g filter="url(#streak-blur)">
    ${streaks.join('\n    ')}
  </g>
  <circle cx="${flareX.toFixed(1)}" cy="${flareY.toFixed(1)}" r="${R(0.5)}" fill="url(#flare)"/>
  <circle cx="50%" cy="50%" r="${R(1)}" fill="#000000"/>
  <g filter="url(#spike-blur)">
    ${spikes.join('\n    ')}
  </g>
  <circle cx="${flareX.toFixed(1)}" cy="${flareY.toFixed(1)}" r="${R(0.09)}" fill="#ffe0a0" opacity="0.5" filter="url(#spike-blur)"/>
  <circle cx="${flareX.toFixed(1)}" cy="${flareY.toFixed(1)}" r="${R(0.045)}" fill="#fff1cc" opacity="0.85" filter="url(#streak-blur)"/>
  <circle cx="${flareX.toFixed(1)}" cy="${flareY.toFixed(1)}" r="${R(0.022)}" fill="#fffaed"/>
</svg>`;
const eclipse = sharp(Buffer.from(eclipseSvg), { density: 96 });

// AVIF carries the full ladder. WebP is only the fallback for browsers without
// AVIF, and alpha WebP of the streaky corona is ~8× larger, so it ships two
// sizes at lower quality to stay inside the raster budget.
for (const size of [400, 700, 1000, 1400, eclipseSize]) {
  const base = new URL(`eclipse-${size}`, outDir).pathname;
  await eclipse
    .clone()
    .resize(size, size)
    .avif({ quality: 48, effort: 6 })
    .toFile(`${base}.avif`);
}
for (const size of [700, 1400]) {
  const base = new URL(`eclipse-${size}`, outDir).pathname;
  await eclipse
    .clone()
    .resize(size, size)
    .webp({ quality: 60, effort: 6 })
    .toFile(`${base}.webp`);
}

// --- starfield -------------------------------------------------------------

const width = 2048;
const height = 1365;
const tints = ['#ffffff', '#ffffff', '#ffffff', '#dfe8ff', '#fff1dc'];

// One layer of stars. `faint`/`bright` are counts; `gain` lifts opacity so the
// scroll-revealed layers read as "more stars", not just more noise.
const starLayer = (seed, faint, brightCount, gain = 1) => {
  const random = mulberry32(seed);
  const between = (min, max) => min + (max - min) * random();
  const stars = [];
  for (let i = 0; i < faint; i++) {
    stars.push(
      `<circle cx="${between(0, width).toFixed(1)}" cy="${between(0, height).toFixed(1)}" r="${between(0.35, 1.15).toFixed(2)}" fill="${tints[Math.floor(random() * tints.length)]}" opacity="${Math.min(1, between(0.18, 0.8) * gain).toFixed(2)}"/>`,
    );
  }
  const bright = [];
  for (let i = 0; i < brightCount; i++) {
    const cx = between(0, width).toFixed(1);
    const cy = between(0, height).toFixed(1);
    const r = between(1.1, 1.9).toFixed(2);
    bright.push(
      `<circle cx="${cx}" cy="${cy}" r="${(r * 3).toFixed(2)}" fill="#ffffff" opacity="0.10" filter="url(#soft)"/>`,
      `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#ffffff" opacity="${between(0.75, 1).toFixed(2)}"/>`,
    );
  }
  return `${stars.join('\n  ')}\n  ${bright.join('\n  ')}`;
};

const defs = `<defs>
    <filter id="soft" x="-100%" y="-100%" width="300%" height="300%">
      <feGaussianBlur stdDeviation="2.4"/>
    </filter>
    <radialGradient id="haze-a" cx="0.68" cy="0.22" r="0.5">
      <stop offset="0" stop-color="#9aa7b8" stop-opacity="0.10"/>
      <stop offset="1" stop-color="#9aa7b8" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="haze-b" cx="0.22" cy="0.72" r="0.55">
      <stop offset="0" stop-color="#7d8aa6" stop-opacity="0.07"/>
      <stop offset="1" stop-color="#7d8aa6" stop-opacity="0"/>
    </radialGradient>
  </defs>`;

const svgOf = (body, opaque) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  ${defs}
  ${
    opaque
      ? `<rect width="100%" height="100%" fill="#050507"/>
  <rect width="100%" height="100%" fill="url(#haze-a)"/>
  <rect width="100%" height="100%" fill="url(#haze-b)"/>`
      : ''
  }
  ${body}
</svg>`;

// Base: opaque Night Black + haze + sparse stars (always visible).
// Mid / dense: transparent layers the home page fades in while scrolling.
const layers = {
  [`starfield-${width}`]: svgOf(starLayer(20261007, 1150, 24), true),
  [`stars-mid-${width}`]: svgOf(starLayer(20261008, 1750, 30, 1.15), false),
  [`stars-dense-${width}`]: svgOf(starLayer(20261009, 3000, 45, 1.25), false),
};

for (const [name, svg] of Object.entries(layers)) {
  const image = sharp(Buffer.from(svg), { density: 96 });
  const base = new URL(name, outDir).pathname;
  await image.clone().avif({ quality: 68, effort: 6 }).toFile(`${base}.avif`);
  await image.clone().webp({ quality: 86, effort: 6 }).toFile(`${base}.webp`);
}

// Coverage guard: at the bottom of the page all three layers are fully
// visible. Star pixels (any layer brighter than the threshold) must stay well
// under 20% of the screen.
const threshold = 40;
const luminance = async (svg) => {
  const { data, info } = await sharp(Buffer.from(svg), { density: 96 })
    .flatten({ background: '#050507' })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, size: info.width * info.height };
};
const lit = await Promise.all(Object.values(layers).map(luminance));
let covered = 0;
for (let i = 0; i < lit[0].size; i++) {
  if (lit.some((layer) => layer.data[i] > threshold)) covered++;
}
const coverage = covered / lit[0].size;
console.log(`star coverage at page bottom: ${(coverage * 100).toFixed(2)}%`);
if (coverage > 0.2) {
  throw new Error('star coverage exceeds the 20% ceiling');
}

console.log('space assets written to public/visual/');
