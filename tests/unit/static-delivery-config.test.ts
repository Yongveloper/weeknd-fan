import { access, readFile } from 'node:fs/promises';

import { parse } from 'jsonc-parser';
import { expect, test } from 'vitest';

const root = new URL('../..', import.meta.url);

async function readProjectFile(path: string) {
  return readFile(new URL(path, root), 'utf8');
}

async function projectPathExists(path: string) {
  try {
    await access(new URL(path, root));
    return true;
  } catch {
    return false;
  }
}

test('keeps Cloudflare delivery static-only and serves the required headers', async () => {
  const config = parse(await readProjectFile('wrangler.jsonc')) as {
    $schema?: unknown;
    name?: unknown;
    compatibility_date?: unknown;
    assets?: Record<string, unknown>;
  };
  const packageJson = JSON.parse(await readProjectFile('package.json')) as {
    dependencies?: Record<string, unknown>;
    devDependencies?: Record<string, unknown>;
  };
  const astroConfig = await readProjectFile('astro.config.mjs');
  const headers = await readProjectFile('public/_headers');

  expect(Object.keys(config).sort()).toEqual([
    '$schema',
    'assets',
    'compatibility_date',
    'name',
  ]);
  expect(config.assets).toEqual({
    directory: './dist',
    run_worker_first: false,
  });
  expect(config).not.toHaveProperty('main');
  expect(config.assets).not.toHaveProperty('binding');
  expect(astroConfig).toMatch(/output:\s*'static'/);
  expect(astroConfig).not.toContain('@astrojs/cloudflare');
  expect(packageJson.dependencies).not.toHaveProperty('@astrojs/cloudflare');
  expect(packageJson.devDependencies).not.toHaveProperty('@astrojs/cloudflare');
  await expect(
    Promise.all(
      [
        'functions/',
        'src/functions/',
        'worker.js',
        'worker.mjs',
        'worker.ts',
        'src/worker.js',
        'src/worker.mjs',
        'src/worker.ts',
      ].map(projectPathExists),
    ),
  ).resolves.toEqual(Array(8).fill(false));
  expect(headers).toContain('X-Content-Type-Options: nosniff');
  expect(headers).toContain('Referrer-Policy: strict-origin-when-cross-origin');
  expect(headers).toContain(
    'Permissions-Policy: camera=(), microphone=(), geolocation=()',
  );
  expect(headers).toContain(
    '/_astro/*\n  Cache-Control: public, max-age=31536000, immutable',
  );
});
