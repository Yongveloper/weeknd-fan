import { describe, expect, it } from 'vitest';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  auditCoreContent,
  auditPublishedContent,
  auditSetlistRecords,
} from '../../src/lib/content/audit';
import { STATUS_LABELS } from '../../src/lib/content/contracts';

describe('content trust contract', () => {
  it('flags stale volatile practical guidance without treating it as official', () => {
    const issues = auditPublishedContent({
      now: new Date('2026-10-05T00:00:00+09:00'),
      entries: [
        {
          id: 'transport',
          status: 'practical',
          lastVerifiedAt: new Date('2026-09-27T00:00:00+09:00'),
          sourceCount: 2,
          volatile: true,
        },
      ],
      concert: { primarySourceCount: 2, archivePublished: false },
      setlist: { status: 'expected', records: [] },
      showRecords: [],
    });

    expect(issues).toEqual([
      { id: 'transport', code: 'volatile-content-stale' },
    ]);
  });

  it('flags published entries without sources and incomplete archive publication', () => {
    const issues = auditPublishedContent({
      now: new Date('2026-10-05T00:00:00+09:00'),
      entries: [
        {
          id: 'arrival',
          status: 'unpublished',
          lastVerifiedAt: new Date('2026-10-01T00:00:00+09:00'),
          sourceCount: 0,
        },
        {
          id: 'concert',
          status: 'official',
          lastVerifiedAt: new Date('2026-10-01T00:00:00+09:00'),
          sourceCount: 0,
        },
      ],
      concert: { primarySourceCount: 1, archivePublished: true },
      setlist: {
        status: 'official',
        records: [
          { id: 'one', status: 'expected', observedInCount: 2 },
          { id: 'two', status: 'pattern', observedInCount: 3 },
        ],
      },
      showRecords: [
        {
          showDate: '2026-10-07',
          status: 'post-show',
          songCount: 38,
          sourceCount: 2,
        },
      ],
    });

    expect(issues).toEqual([
      { id: 'concert', code: 'published-content-missing-sources' },
      { id: 'concert', code: 'concert-primary-sources-below-2' },
      { id: 'setlist', code: 'setlist-must-be-expected' },
      { id: 'one', code: 'setlist-observations-below-3' },
      { id: 'two', code: 'setlist-must-be-expected' },
      { id: 'archive:2026-10-08', code: 'archive-record-missing' },
    ]);
  });

  it('accepts a complete representative publication audit', () => {
    const issues = auditPublishedContent({
      now: new Date('2026-08-29T12:00:00+09:00'),
      entries: [
        {
          id: 'transport',
          status: 'practical',
          lastVerifiedAt: new Date('2026-08-29T00:00:00+09:00'),
          sourceCount: 3,
          volatile: true,
        },
        {
          id: 'pending',
          status: 'unpublished',
          lastVerifiedAt: new Date('2026-08-29T00:00:00+09:00'),
          sourceCount: 0,
          volatile: true,
        },
      ],
      concert: { primarySourceCount: 4, archivePublished: false },
      setlist: {
        status: 'expected',
        records: [{ id: 'one', status: 'expected', observedInCount: 3 }],
      },
      showRecords: [],
    });

    expect(issues).toEqual([]);
  });

  it('audits the current published collection data rather than an empty fixture', async () => {
    const dataDirectory = join(process.cwd(), 'src/data');
    const sourceDirectory = join(dataDirectory, 'sources');
    const sourceFiles = await readdir(sourceDirectory);
    const sourceKinds = new Map(
      await Promise.all(
        sourceFiles.map(async (file) => {
          const source = JSON.parse(
            await readFile(join(sourceDirectory, file), 'utf8'),
          ) as { kind: string };
          return [file.replace(/\.json$/, ''), source.kind] as const;
        }),
      ),
    );
    const readJsonDirectory = async (directory: string) =>
      Promise.all(
        (await readdir(join(dataDirectory, directory))).map(async (file) => ({
          id: `${directory}/${file.replace(/\.json$/, '')}`,
          data: JSON.parse(
            await readFile(join(dataDirectory, directory, file), 'utf8'),
          ) as {
            status: 'official' | 'expected';
            lastVerifiedAt: string;
            sources: string[];
            observedIn?: string[];
            archivePublished?: boolean;
          },
        })),
      );
    const readMarkdownDirectory = async (directory: string) =>
      Promise.all(
        (await readdir(join(dataDirectory, directory))).map(async (file) => {
          const text = await readFile(
            join(dataDirectory, directory, file),
            'utf8',
          );
          const frontmatter = text.match(/^---\n([\s\S]*?)\n---/);
          if (!frontmatter) throw new Error(`Missing frontmatter: ${file}`);
          const metadata = frontmatter[1];
          if (!metadata) throw new Error(`Empty frontmatter: ${file}`);
          const status = metadata.match(/^status: (.+)$/m)?.[1];
          const lastVerifiedAt = metadata.match(/^lastVerifiedAt: (.+)$/m)?.[1];
          const inlineSources = metadata.match(/^sources: \[(.*)\]$/m)?.[1];
          const blockSources = metadata.match(
            /^sources:\n((?: {2}- .+\n)+)/m,
          )?.[1];
          const sourceCount = inlineSources
            ? inlineSources.split(',').filter(Boolean).length
            : (blockSources?.match(/^ {2}- .+$/gm) ?? []).length;
          if (!status || !lastVerifiedAt || sourceCount === 0) {
            throw new Error(`Incomplete audit metadata: ${file}`);
          }
          return {
            id: `${directory}/${file.replace(/\.md$/, '')}`,
            data: {
              status,
              lastVerifiedAt,
              sources: Array.from({ length: sourceCount }),
            },
          };
        }),
      );

    const [concerts, setlist, discover, guides] = await Promise.all([
      readJsonDirectory('concert'),
      readJsonDirectory('setlist'),
      readMarkdownDirectory('discover'),
      readMarkdownDirectory('guides'),
    ]);
    const concert = concerts[0];
    if (!concert) throw new Error('Missing concert audit record');
    const issues = auditPublishedContent({
      now: new Date('2026-08-29T12:00:00+09:00'),
      entries: [...concerts, ...setlist, ...discover, ...guides].map(
        (entry) => ({
          id: entry.id,
          status: entry.data.status as Parameters<
            typeof auditPublishedContent
          >[0]['entries'][number]['status'],
          lastVerifiedAt: new Date(entry.data.lastVerifiedAt),
          sourceCount: entry.data.sources.length,
          volatile:
            entry.id.startsWith('guides/') && entry.data.status === 'practical',
        }),
      ),
      concert: {
        primarySourceCount: concert.data.sources.filter(
          (source) => sourceKinds.get(source) === 'official',
        ).length,
        archivePublished: concert.data.archivePublished ?? false,
      },
      setlist: {
        status: 'expected',
        records: setlist.map((entry) => ({
          id: entry.id,
          status: entry.data.status,
          observedInCount: entry.data.observedIn?.length ?? 0,
        })),
      },
      showRecords: [],
    });

    expect(issues).toEqual([]);
  });

  it('keeps expected content visibly non-official', () => {
    expect(STATUS_LABELS.expected).toBe('예상 · 보장 아님');
  });

  it('requires two primary sources for concert facts', () => {
    const issues = auditCoreContent({
      concertPrimarySourceCount: 1,
      setlistSnapshotCount: 3,
      setlistStatus: 'expected',
    });
    expect(issues).toContain('concert:primary-sources-below-2');
  });

  it('requires three snapshots and an expected status for the setlist', () => {
    const issues = auditCoreContent({
      concertPrimarySourceCount: 2,
      setlistSnapshotCount: 2,
      setlistStatus: 'official',
    });
    expect(issues).toEqual([
      'setlist:snapshots-below-3',
      'setlist:must-not-be-official',
    ]);
  });

  it('rejects duplicate orders, official status, and fewer than three observations', () => {
    const issues = auditSetlistRecords([
      { id: 'one', expectedOrder: 1, status: 'expected', observedInCount: 3 },
      { id: 'two', expectedOrder: 1, status: 'official', observedInCount: 2 },
    ]);

    expect(issues).toEqual([
      { id: 'two', code: 'duplicate-expected-order' },
      { id: 'two', code: 'setlist-must-be-expected' },
      { id: 'two', code: 'setlist-observations-below-3' },
    ]);
  });
});
