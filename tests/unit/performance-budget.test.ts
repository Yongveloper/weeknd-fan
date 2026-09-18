import { execFile } from 'node:child_process';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { afterEach, expect, test } from 'vitest';

const execFileAsync = promisify(execFile);
const fixtures: string[] = [];

afterEach(async () => {
  await Promise.all(
    fixtures
      .splice(0)
      .map((fixture) => rm(fixture, { recursive: true, force: true })),
  );
});

async function createFixture(html: string) {
  const fixture = await mkdtemp(path.join(tmpdir(), 'goyang-budget-'));
  fixtures.push(fixture);
  await mkdir(path.join(fixture, '_astro'));
  await writeFile(path.join(fixture, 'index.html'), html);
  return fixture;
}

function runBudget(dist: string) {
  return execFileAsync(
    process.execPath,
    ['scripts/check-performance-budget.mjs'],
    {
      cwd: process.cwd(),
      env: { ...process.env, PERFORMANCE_BUDGET_DIST: dist },
    },
  );
}

test('rejects an unreferenced built raster that exceeds the aggregate budget', async () => {
  const fixture = await createFixture(
    '<!doctype html><html><body></body></html>',
  );
  await writeFile(path.join(fixture, 'og.jpg'), Buffer.alloc(1300 * 1024 + 1));

  await expect(runBudget(fixture)).rejects.toThrow(
    'Aggregate raster budget exceeded',
  );
});

test('rejects a page image reference whose candidate asset is missing', async () => {
  const fixture = await createFixture(
    '<!doctype html><html><body><img src="/_astro/missing.webp" alt=""></body></html>',
  );

  await expect(runBudget(fixture)).rejects.toThrow('Missing referenced asset');
});

test('budgets linked print originals separately without relaxing page-image limits', async () => {
  const fixture = await createFixture(
    '<!doctype html><html><body><a href="/downloads/print.png" download>Original</a></body></html>',
  );
  await mkdir(path.join(fixture, 'downloads'));
  await writeFile(
    path.join(fixture, 'downloads/print.png'),
    Buffer.alloc(3 * 1024 * 1024),
  );
  await expect(runBudget(fixture)).resolves.toBeDefined();
  await writeFile(
    path.join(fixture, 'index.html'),
    '<html><body><img src="/downloads/print.png" alt=""></body></html>',
  );
  await expect(runBudget(fixture)).rejects.toThrow('/ raster budget exceeded');
});
