import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { gzipSync } from 'node:zlib';

const distRoot = path.resolve('dist');
const pageBudgets = {
  '/': { raster: 700 * 1024 },
  nonHome: { raster: 400 * 1024 },
};
const javascriptBudget = 75 * 1024;
const aggregateRasterBudget = 1100 * 1024;
const htmlFiles = (await walk(distRoot))
  .filter((file) => file.endsWith('.html'))
  .sort();

if (htmlFiles.length === 0) {
  throw new Error(
    'No production HTML found. Run npm run build before npm run budget.',
  );
}

const allPageAssets = new Set();

for (const htmlFile of htmlFiles) {
  const html = await readFile(htmlFile, 'utf8');
  const route = routeFor(htmlFile);
  const initialJavaScript = await collectInitialJavaScript(html, htmlFile);
  const rasters = collectRenderedRasters(html, htmlFile);
  initialJavaScript.forEach((file) => allPageAssets.add(file));
  rasters.forEach((file) => allPageAssets.add(file));

  const [javascriptBytes, rasterBytes] = await Promise.all([
    gzipBytes(initialJavaScript),
    byteSize(rasters),
  ]);
  const rasterBudget =
    route === '/' ? pageBudgets['/'].raster : pageBudgets.nonHome.raster;

  process.stdout.write(
    `${route}\tjs-gzip=${formatBytes(javascriptBytes)}/${formatBytes(javascriptBudget)}\traster=${formatBytes(rasterBytes)}/${formatBytes(rasterBudget)}\n`,
  );
  if (javascriptBytes > javascriptBudget) {
    throw new Error(
      `${route} initial JavaScript gzip budget exceeded: ${formatBytes(javascriptBytes)} > ${formatBytes(javascriptBudget)}`,
    );
  }
  if (rasterBytes > rasterBudget) {
    throw new Error(
      `${route} raster budget exceeded: ${formatBytes(rasterBytes)} > ${formatBytes(rasterBudget)}`,
    );
  }
}

const aggregateRaster = await byteSize(
  [...allPageAssets].filter(isRasterAsset),
);
process.stdout.write(
  `aggregate\traster=${formatBytes(aggregateRaster)}/${formatBytes(aggregateRasterBudget)}\n`,
);
if (aggregateRaster > aggregateRasterBudget) {
  throw new Error(
    `Aggregate rendered raster budget exceeded: ${formatBytes(aggregateRaster)} > ${formatBytes(aggregateRasterBudget)}`,
  );
}

async function collectInitialJavaScript(html, htmlFile) {
  const initialScripts = [
    ...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+\.js)["'][^>]*>/gi),
  ]
    .map((match) => resolveAsset(match[1], htmlFile))
    .filter(Boolean);
  const visited = new Set();

  async function visit(file) {
    if (visited.has(file)) return;
    visited.add(file);
    const code = await readFile(file, 'utf8');
    for (const match of code.matchAll(/from["'](\.\.?\/[^"']+\.js)["']/g)) {
      const dependency = path.resolve(path.dirname(file), match[1]);
      await visit(dependency);
    }
  }

  for (const script of initialScripts) await visit(script);
  return visited;
}

function collectRenderedRasters(html, htmlFile) {
  const selected = new Set();
  const pictures = html.match(/<picture\b[\s\S]*?<\/picture>/gi) ?? [];
  for (const picture of pictures) {
    const avifSource = (picture.match(/<source\b[^>]*>/gi) ?? []).find(
      (source) => /\btype=["']image\/avif["']/i.test(source),
    );
    const avifSrcset = avifSource?.match(/\bsrcset=["']([^"']+)["']/i);
    const fallback = picture.match(/<img\b[^>]*\bsrc=["']([^"']+)["']/i);
    const candidate = avifSrcset?.[1] ?? fallback?.[1];
    if (candidate)
      selected.add(resolveAsset(firstSrcsetUrl(candidate), htmlFile));
  }
  return [...selected].filter(Boolean);
}

function firstSrcsetUrl(srcset) {
  return srcset.split(',')[0].trim().split(/\s+/)[0];
}

function resolveAsset(url, htmlFile) {
  if (!url || /^(?:https?:|data:|#)/i.test(url)) return undefined;
  const pathname = url.split(/[?#]/, 1)[0];
  return pathname.startsWith('/')
    ? path.join(distRoot, pathname)
    : path.resolve(path.dirname(htmlFile), pathname);
}

function routeFor(htmlFile) {
  const relative = path.relative(distRoot, htmlFile);
  if (relative === 'index.html') return '/';
  return `/${path.dirname(relative).replaceAll(path.sep, '/')}/`;
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
  return (await Promise.all(files.map((file) => stat(file)))).reduce(
    (sum, file) => sum + file.size,
    0,
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
