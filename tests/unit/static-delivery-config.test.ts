import { access, readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';

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

async function importAstroConfig(publicSiteUrl: string | undefined) {
  const previousValue = process.env.PUBLIC_SITE_URL;

  if (publicSiteUrl === undefined) {
    delete process.env.PUBLIC_SITE_URL;
  } else {
    process.env.PUBLIC_SITE_URL = publicSiteUrl;
  }

  try {
    const configUrl = new URL('../../astro.config.mjs', import.meta.url);
    configUrl.searchParams.set('static-config-test', randomUUID());
    return (await import(configUrl.href)).default;
  } finally {
    if (previousValue === undefined) {
      delete process.env.PUBLIC_SITE_URL;
    } else {
      process.env.PUBLIC_SITE_URL = previousValue;
    }
  }
}

function assertStaticAstroConfig(config: {
  output?: unknown;
  adapter?: unknown;
}) {
  expect(config.output).toBe('static');
  expect(config.adapter).toBeUndefined();
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
  const missingOriginAstroConfig = await importAstroConfig(undefined);
  const validOriginAstroConfig = await importAstroConfig(
    'https://fan-guide.test',
  );
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
  assertStaticAstroConfig(missingOriginAstroConfig);
  assertStaticAstroConfig(validOriginAstroConfig);
  expect(missingOriginAstroConfig.site).toBeUndefined();
  expect(validOriginAstroConfig.site).toBe('https://fan-guide.test/');
  expect(() => assertStaticAstroConfig({ output: 'server' })).toThrow();
  expect(() =>
    assertStaticAstroConfig({ output: 'static', adapter: {} }),
  ).toThrow();
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
