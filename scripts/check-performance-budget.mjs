import { access, readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { gzipSync } from 'node:zlib';

const distRoot = path.resolve(process.env.PERFORMANCE_BUDGET_DIST ?? 'dist');
const javascriptBudget = 75 * 1024;
// 좌석 안내도 원본 PNG(사용자 결정: 재인코딩 없이 그대로 사용) 수용을 위해 1100→1300
const aggregateRasterBudget = 1300 * 1024;
const pageRasterBudgets = { home: 700 * 1024, other: 400 * 1024 };
const viewport = { width: 390, deviceScaleFactor: 3 };
const files = await walk(distRoot);
const htmlFiles = files.filter((file) => file.endsWith('.html')).sort();
const builtJavaScript = files.filter((file) => file.endsWith('.js'));
const builtRasters = files.filter(isRasterAsset);

if (htmlFiles.length === 0) {
  throw new Error(
    'No production HTML found. Run npm run build before npm run budget.',
  );
}

const [aggregateJavaScript, aggregateRaster] = await Promise.all([
  gzipBytes(builtJavaScript),
  byteSize(builtRasters),
]);
writeBudget(
  'aggregate',
  aggregateJavaScript,
  javascriptBudget,
  aggregateRaster,
  aggregateRasterBudget,
);
assertWithinBudget(
  'Aggregate JavaScript gzip',
  aggregateJavaScript,
  javascriptBudget,
);
assertWithinBudget('Aggregate raster', aggregateRaster, aggregateRasterBudget);

for (const htmlFile of htmlFiles) {
  const html = await readFile(htmlFile, 'utf8');
  const route = routeFor(htmlFile);
  const [initialJavaScript, rasters] = await Promise.all([
    collectInitialJavaScript(html, htmlFile),
    collectPageRasters(html, htmlFile),
  ]);
  const [javascriptBytes, rasterBytes] = await Promise.all([
    gzipBytes(initialJavaScript),
    byteSize(rasters),
  ]);
  const rasterBudget =
    route === '/' ? pageRasterBudgets.home : pageRasterBudgets.other;

  writeBudget(
    route,
    javascriptBytes,
    javascriptBudget,
    rasterBytes,
    rasterBudget,
  );
  assertWithinBudget(
    `${route} initial JavaScript gzip`,
    javascriptBytes,
    javascriptBudget,
  );
  assertWithinBudget(`${route} raster`, rasterBytes, rasterBudget);
}

async function collectInitialJavaScript(html, htmlFile) {
  const scripts = [
    ...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi),
  ].map((match) => resolveReferencedAsset(match[1], htmlFile));
  const visited = new Set();

  async function visit(file) {
    if (visited.has(file)) return;
    await ensureExists(file);
    visited.add(file);
    const code = await readFile(file, 'utf8');
    for (const match of code.matchAll(/from["'](\.\.?\/[^"']+\.js)["']/g)) {
      await visit(path.resolve(path.dirname(file), match[1]));
    }
  }

  for (const script of scripts) await visit(script);
  return visited;
}

async function collectPageRasters(html, htmlFile) {
  const rasters = new Set();
  const pictures = html.match(/<picture\b[\s\S]*?<\/picture>/gi) ?? [];
  const pictureImages = new Set();

  for (const picture of pictures) {
    const image = picture.match(/<img\b[^>]*>/i)?.[0];
    if (!image) throw new Error(`Malformed picture without img in ${htmlFile}`);
    pictureImages.add(image);
    rasters.add(await resolvePictureCandidate(picture, image, htmlFile));
  }

  for (const image of html.match(/<img\b[^>]*>/gi) ?? []) {
    if (pictureImages.has(image)) continue;
    const src = readAttribute(image, 'src');
    if (!src) throw new Error(`Malformed img without src in ${htmlFile}`);
    // Hotlinked images (e.g. Spotify album covers) are not local raster assets and are excluded from the budget.
    if (/^https?:/i.test(src)) continue;
    const asset = resolveReferencedAsset(src, htmlFile);
    if (!isRasterAsset(asset))
      throw new Error(`Unparseable raster asset reference: ${src}`);
    await ensureExists(asset);
    rasters.add(asset);
  }

  return rasters;
}

async function resolvePictureCandidate(picture, image, htmlFile) {
  const avifSource = (picture.match(/<source\b[^>]*>/gi) ?? []).find(
    (source) => readAttribute(source, 'type') === 'image/avif',
  );
  const source = avifSource ?? image;
  const srcset = readAttribute(source, 'srcset');
  const fallback = readAttribute(image, 'src');
  const candidate = srcset
    ? selectSrcsetCandidate(srcset, readAttribute(source, 'sizes'))
    : fallback;
  if (!candidate) throw new Error(`Malformed image candidate in ${htmlFile}`);
  const asset = resolveReferencedAsset(candidate, htmlFile);
  if (!isRasterAsset(asset))
    throw new Error(`Unparseable raster asset reference: ${candidate}`);
  await ensureExists(asset);
  return asset;
}

function selectSrcsetCandidate(srcset, sizes) {
  if (!srcset.includes(',')) {
    const single = srcset.trim();
    if (/^\S+$/.test(single)) return single;
  }
  const candidates = srcset.split(',').map((entry) => {
    const match = entry.trim().match(/^(\S+)\s+(\d+)w$/);
    if (!match)
      throw new Error(`Unparseable srcset candidate: ${entry.trim()}`);
    return { url: match[1], width: Number(match[2]) };
  });
  const sourceWidth = cssSourceWidth(sizes) * viewport.deviceScaleFactor;
  return (
    candidates.find((candidate) => candidate.width >= sourceWidth) ??
    candidates.at(-1)
  )?.url;
}

function cssSourceWidth(sizes) {
  if (!sizes) return viewport.width;
  const rules = sizes.split(',').map((rule) => rule.trim());
  for (const rule of rules) {
    const match = rule.match(/^\(max-width:\s*([\d.]+)rem\)\s+([\d.]+)vw$/);
    if (match && viewport.width <= Number(match[1]) * 16)
      return (viewport.width * Number(match[2])) / 100;
    if (/^[\d.]+vw$/.test(rule))
      return (viewport.width * Number.parseFloat(rule)) / 100;
  }
  throw new Error(`Unparseable sizes attribute: ${sizes}`);
}

function readAttribute(tag, attribute) {
  return tag.match(new RegExp(`\\b${attribute}=["']([^"']+)["']`, 'i'))?.[1];
}

function resolveReferencedAsset(url, htmlFile) {
  if (!url || /^(?:https?:|data:|#)/i.test(url))
    throw new Error(`Unsupported referenced asset URL: ${url}`);
  const pathname = url.split(/[?#]/, 1)[0];
  return pathname.startsWith('/')
    ? path.join(distRoot, pathname)
    : path.resolve(path.dirname(htmlFile), pathname);
}

async function ensureExists(file) {
  try {
    await access(file);
  } catch {
    throw new Error(`Missing referenced asset: ${file}`);
  }
}

function routeFor(htmlFile) {
  const relative = path.relative(distRoot, htmlFile);
  return relative === 'index.html'
    ? '/'
    : `/${path.dirname(relative).replaceAll(path.sep, '/')}/`;
}

function isRasterAsset(file) {
  return /\.(?:avif|webp|png|jpe?g)$/i.test(file);
}

async function gzipBytes(files) {
  return (await Promise.all([...files].map((file) => readFile(file)))).reduce(
    (sum, contents) => sum + gzipSync(contents).byteLength,
    0,
  );
}

async function byteSize(files) {
  return (await Promise.all([...files].map((file) => stat(file)))).reduce(
    (sum, file) => sum + file.size,
    0,
  );
}

function writeBudget(label, js, jsLimit, raster, rasterLimit) {
  process.stdout.write(
    `${label}\tjs-gzip=${formatBytes(js)}/${formatBytes(jsLimit)}\traster=${formatBytes(raster)}/${formatBytes(rasterLimit)}\n`,
  );
}

function assertWithinBudget(label, bytes, limit) {
  if (bytes > limit)
    throw new Error(
      `${label} budget exceeded: ${formatBytes(bytes)} > ${formatBytes(limit)}`,
    );
}

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (
    await Promise.all(
      entries.map((entry) => {
        const target = path.join(directory, entry.name);
        return entry.isDirectory() ? walk(target) : target;
      }),
    )
  ).flat();
}

function formatBytes(bytes) {
  return `${(bytes / 1024).toFixed(1)}KiB`;
}
