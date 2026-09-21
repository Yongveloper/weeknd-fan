import { describe, expect, it } from 'vitest';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { auditTranslations } from '../../src/lib/content/audit';
import { collectTranslationRecords } from '../../src/lib/i18n/content/collect';
import { translatableHash } from '../../src/lib/i18n/content/hash';
import { jsonTranslatableText } from '../../src/lib/i18n/content/json-text';

// The real repo's JSON overlay bundles (setlist.json, sources.json,
// concert.json) are all `{}` right now, so `collectTranslationRecords()`
// against the real tree exercises zero entries through the JSON branch —
// the markdown branch (guides/32-tips-entry.md) is the only one covered.
// A synthetic fixture tree is what actually proves that branch works,
// rather than only proving it doesn't crash on an empty bundle.
describe('collectTranslationRecords (JSON collection branch)', () => {
  it('walks a JSON bundle overlay and flags a stale hash and an orphan', async () => {
    const root = await mkdtemp(join(tmpdir(), 'i18n-collect-'));
    try {
      await mkdir(join(root, 'src/data/setlist'), { recursive: true });
      await mkdir(join(root, 'src/data/i18n/en'), { recursive: true });

      const sourceA = {
        title: 'Song A',
        summary: 'Summary A',
        body: 'Body A',
        liveNote: 'Live A',
        singAlongNote: 'Sing A',
      };
      const sourceB = { ...sourceA, title: 'Song B' };
      await writeFile(
        join(root, 'src/data/setlist/song-a.json'),
        JSON.stringify(sourceA),
      );
      await writeFile(
        join(root, 'src/data/setlist/song-b.json'),
        JSON.stringify(sourceB),
      );
      const currentHashA = translatableHash(
        jsonTranslatableText('setlist', sourceA, 'setlist/song-a'),
      );

      await writeFile(
        join(root, 'src/data/i18n/en/setlist.json'),
        JSON.stringify({
          'song-a': {
            title: 'Song A (EN)',
            summary: 'Summary A (EN)',
            liveNote: 'Live A (EN)',
            singAlongNote: 'Sing A (EN)',
            sourceHash: currentHashA,
            translatedAt: '2026-09-20',
          },
          'song-b': {
            title: 'Song B (EN)',
            summary: 'Summary B (EN)',
            liveNote: 'Live B (EN)',
            singAlongNote: 'Sing B (EN)',
            sourceHash: 'deadbeefdeadbeef', // deliberately stale
            translatedAt: '2026-09-20',
          },
          orphan: {
            title: 'Orphan (EN)',
            summary: '',
            liveNote: '',
            singAlongNote: '',
            sourceHash: 'deadbeefdeadbeef',
            translatedAt: '2026-09-20',
          },
        }),
      );

      const records = await collectTranslationRecords(root);
      expect(records.length).toBeGreaterThan(0);
      const byId = new Map(records.map((record) => [record.id, record]));

      expect(byId.get('setlist/song-a')).toMatchObject({
        locale: 'en',
        sourceExists: true,
        sourceHash: currentHashA,
        currentHash: currentHashA,
      });
      expect(byId.get('setlist/song-b')).toMatchObject({
        sourceExists: true,
        sourceHash: 'deadbeefdeadbeef',
      });
      expect(byId.get('setlist/orphan')).toMatchObject({ sourceExists: false });

      expect(auditTranslations(records)).toEqual(
        expect.arrayContaining([
          { id: 'en/setlist/song-b', code: 'translation-stale' },
          { id: 'en/setlist/orphan', code: 'translation-orphan' },
        ]),
      );
      expect(auditTranslations(records)).not.toContainEqual(
        expect.objectContaining({ id: 'en/setlist/song-a' }),
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});

// The Astro content loaders walk every collection with a `**` glob
// (`content.config.ts`), recursively. A flat `readdir` here would silently
// stop seeing an overlay the moment a guide moved into a subdirectory,
// while the build's own orphan guard (queries.ts) kept seeing it fine —
// two "every overlay" that would then only agree because the tree is flat.
describe('collectTranslationRecords (nested markdown ids)', () => {
  it('finds a source/overlay pair nested in a subdirectory', async () => {
    const root = await mkdtemp(join(tmpdir(), 'i18n-collect-nested-'));
    try {
      await mkdir(join(root, 'src/data/guides/sub'), { recursive: true });
      await mkdir(join(root, 'src/data/i18n/en/guides/sub'), {
        recursive: true,
      });

      await writeFile(
        join(root, 'src/data/guides/sub/nested.md'),
        '---\ntitle: 제목\nsummary: 요약\n---\n\n본문입니다.\n',
      );
      await writeFile(
        join(root, 'src/data/i18n/en/guides/sub/nested.md'),
        '---\ntitle: Title\nsummary: Summary\nsourceHash: 0000000000000000\ntranslatedAt: 2026-09-20\n---\n\nBody.\n',
      );

      const records = await collectTranslationRecords(root);
      const nested = records.find(
        (record) => record.id === 'guides/sub/nested',
      );
      expect(nested).toMatchObject({ sourceExists: true });
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
