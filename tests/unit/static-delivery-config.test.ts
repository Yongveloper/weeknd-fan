import { readFile } from 'node:fs/promises';

import { expect, test } from 'vitest';

const root = new URL('../..', import.meta.url);

async function readProjectFile(path: string) {
  return readFile(new URL(path, root), 'utf8');
}

test('keeps Cloudflare delivery static-only and serves the required headers', async () => {
  const config = await readProjectFile('wrangler.jsonc');
  const packageJson = JSON.parse(await readProjectFile('package.json')) as {
    dependencies?: Record<string, unknown>;
    devDependencies?: Record<string, unknown>;
  };
  const headers = await readProjectFile('public/_headers');

  expect(config).toMatch(
    /"assets": \{\s+"directory": "\.\/dist",\s+"run_worker_first": false,?\s+\},?/,
  );
  expect(config).not.toMatch(/"main"\s*:/);
  expect(config).not.toMatch(/"binding"\s*:/);
  expect(packageJson.dependencies).not.toHaveProperty('@astrojs/cloudflare');
  expect(packageJson.devDependencies).not.toHaveProperty('@astrojs/cloudflare');
  expect(headers).toContain('X-Content-Type-Options: nosniff');
  expect(headers).toContain('Referrer-Policy: strict-origin-when-cross-origin');
  expect(headers).toContain(
    'Permissions-Policy: camera=(), microphone=(), geolocation=()',
  );
  expect(headers).toContain(
    '/_astro/*\n  Cache-Control: public, max-age=31536000, immutable',
  );
});
