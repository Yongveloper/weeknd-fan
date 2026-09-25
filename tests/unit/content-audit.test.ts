import { describe, expect, it } from 'vitest';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  auditAlbums,
  auditCoreContent,
  auditEssentialOrders,
  auditPublishedContent,
  auditSetlistRecords,
  auditTranslations,
  parseSeoulDate,
  formatSeoulDate,
} from '../../src/lib/content/audit';
import { STATUS_LABELS, TRUST_STATUSES } from '../../src/lib/content/contracts';
import { LOCALES } from '../../src/lib/i18n/locales';
import { collectTranslationRecords } from '../../src/lib/i18n/content/collect';

describe('content trust contract', () => {
  it('requires an all-or-nothing contiguous editorial essential order', () => {
    expect(auditEssentialOrders([])).toEqual([]);
    expect(auditEssentialOrders([1, 2, 2])).toEqual([
      { id: 'setlist', code: 'setlist-essential-orders-invalid' },
    ]);
    expect(auditEssentialOrders([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])).toEqual([]);
  });

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

  it('uses an official SMS received date when auditing volatile guidance', () => {
    const issues = auditPublishedContent({
      now: new Date('2026-09-05T12:00:00+09:00'),
      entries: [
        {
          id: 'transport',
          status: 'practical',
          lastVerifiedAt: new Date('2026-09-01T00:00:00+09:00'),
          sourceCount: 1,
          volatile: true,
          sources: [
            {
              id: 'nol-weeknd-transport-sms',
              receivedAt: new Date('2026-09-01T00:00:00+09:00'),
            },
          ],
        },
      ],
      concert: { primarySourceCount: 2, archivePublished: false },
      setlist: { status: 'expected', records: [] },
      showRecords: [],
    });

    expect(issues).toEqual([]);
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
          songOrders: Array.from({ length: 38 }, (_, index) => index + 1),
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

  it('reports unknown source references with the content id, field, and source id', () => {
    const issues = auditPublishedContent({
      now: new Date('2026-08-29T12:00:00+09:00'),
      knownSourceIds: ['known-source'],
      entries: [
        {
          id: 'guides/transport',
          status: 'practical',
          lastVerifiedAt: new Date('2026-08-29T00:00:00+09:00'),
          sourceCount: 2,
          sourceReferences: [
            { field: 'sources', sourceIds: ['known-source', 'missing-source'] },
            { field: 'observedIn', sourceIds: ['missing-observation'] },
          ],
        },
      ],
      concert: { primarySourceCount: 2, archivePublished: false },
      setlist: { status: 'expected', records: [] },
      showRecords: [],
    });

    expect(issues).toContainEqual({
      id: 'guides/transport',
      code: 'source-reference-missing',
      field: 'sources',
      sourceId: 'missing-source',
    });
    expect(issues).toContainEqual({
      id: 'guides/transport',
      code: 'source-reference-missing',
      field: 'observedIn',
      sourceId: 'missing-observation',
    });
  });

  it('keeps a practical guide fresh through exactly seven Seoul calendar days', () => {
    const transport = {
      id: 'transport',
      status: 'practical' as const,
      lastVerifiedAt: parseSeoulDate('2026-09-28'),
      sourceCount: 2,
      volatile: true,
    };
    const baseInput = {
      entries: [transport],
      concert: { primarySourceCount: 2, archivePublished: false },
      setlist: { status: 'expected' as const, records: [] },
      showRecords: [],
    };

    expect(
      auditPublishedContent({
        ...baseInput,
        now: new Date('2026-10-05T00:00:00+09:00'),
      }),
    ).toEqual([]);
    expect(
      auditPublishedContent({
        ...baseInput,
        entries: [
          {
            ...transport,
            lastVerifiedAt: new Date('2026-09-27T23:59:00+09:00'),
          },
        ],
        now: new Date('2026-10-05T00:00:00+09:00'),
      }),
    ).toEqual([{ id: 'transport', code: 'volatile-content-stale' }]);
  });

  it('formats date-only content using Seoul time in every process timezone', () => {
    expect(formatSeoulDate(new Date('2026-08-29T00:00:00Z'))).toBe(
      '2026.08.29',
    );
  });

  it('audits raw setlist essential-order fixtures through the publication gate', () => {
    const auditRawSetlist = (
      records: Array<{ id: string; essentialOrder?: number }>,
    ) =>
      auditPublishedContent({
        now: new Date('2026-09-01T00:00:00+09:00'),
        entries: [],
        concert: { primarySourceCount: 2, archivePublished: false },
        setlist: {
          status: 'expected',
          records: records.map((record, index) => ({
            ...record,
            status: 'expected' as const,
            observedInCount: 3,
            expectedOrder: index + 1,
          })),
        },
        showRecords: [],
      });

    expect(
      auditRawSetlist(
        Array.from({ length: 38 }, (_, index) => ({ id: `${index}` })),
      ),
    ).toEqual([]);
    expect(auditRawSetlist([{ id: 'one', essentialOrder: 1 }])).toEqual([
      { id: 'setlist', code: 'setlist-essential-orders-invalid' },
    ]);
    expect(
      auditRawSetlist([
        ...Array.from({ length: 9 }, (_, index) => ({
          id: `${index}`,
          essentialOrder: index + 1,
        })),
        { id: 'duplicate', essentialOrder: 9 },
      ]),
    ).toEqual([{ id: 'setlist', code: 'setlist-essential-orders-invalid' }]);
    expect(
      auditRawSetlist(
        Array.from({ length: 10 }, (_, index) => ({
          id: `${index}`,
          essentialOrder: index + 1,
        })),
      ),
    ).toEqual([]);
  });

  it('accepts both complete Goyang archive dates when publication is enabled', () => {
    const issues = auditPublishedContent({
      now: new Date('2026-10-09T00:00:00+09:00'),
      entries: [],
      concert: { primarySourceCount: 2, archivePublished: true },
      setlist: { status: 'expected', records: [] },
      showRecords: ['2026-10-07', '2026-10-08'].map((showDate) => ({
        showDate,
        status: 'post-show' as const,
        songCount: 3,
        songOrders: [1, 2, 3],
        sourceCount: 2,
      })),
    });

    expect(issues).toEqual([]);
  });

  it('rejects duplicate records for a supported archive date', () => {
    const issues = auditPublishedContent({
      now: new Date('2026-10-09T00:00:00+09:00'),
      entries: [],
      concert: { primarySourceCount: 2, archivePublished: false },
      setlist: { status: 'expected', records: [] },
      showRecords: ['2026-10-07', '2026-10-07', '2026-10-08'].map(
        (showDate) => ({
          showDate,
          status: 'post-show' as const,
          songCount: 1,
          songOrders: [1],
          sourceCount: 2,
        }),
      ),
    });

    expect(issues).toEqual([
      { id: 'archive:2026-10-07', code: 'archive-record-duplicate' },
    ]);
  });

  it('parses date-only Seoul values and offset ISO timestamps without NaN bypasses', () => {
    expect(parseSeoulDate('2026-10-05').toISOString()).toBe(
      '2026-10-04T15:00:00.000Z',
    );
    expect(parseSeoulDate('2026-10-05T12:00:00+09:00').toISOString()).toBe(
      '2026-10-05T03:00:00.000Z',
    );
    expect(
      auditPublishedContent({
        now: new Date('2026-10-05T12:00:00+09:00'),
        entries: [
          {
            id: 'transport',
            status: 'practical',
            lastVerifiedAt: parseSeoulDate('not-a-date'),
            sourceCount: 1,
            volatile: true,
            sources: [
              {
                id: 'transport-source',
                lastCheckedAt: parseSeoulDate('not-a-date'),
              },
            ],
          },
        ],
        concert: { primarySourceCount: 2, archivePublished: false },
        setlist: { status: 'expected', records: [] },
        showRecords: [],
      }),
    ).toEqual([
      { id: 'transport', code: 'content-date-invalid' },
      { id: 'transport', code: 'volatile-source-date-invalid' },
    ]);
  });

  it('rejects impossible calendar dates and offset timestamps', () => {
    for (const value of [
      '2026-02-29',
      '2026-04-31',
      '2026-10-05T24:00:00+09:00',
      '2026-02-29T12:00:00+09:00',
      '2026-10-05T12:61:00+09:00',
    ]) {
      expect(Number.isNaN(parseSeoulDate(value).getTime())).toBe(true);
    }
    expect(Number.isNaN(parseSeoulDate('2024-02-29').getTime())).toBe(false);
    expect(
      Number.isNaN(parseSeoulDate('2024-02-29T23:59:59.123+09:00').getTime()),
    ).toBe(false);
    for (const value of [
      '2024-02-29T23:59:59.123456+09:00',
      '2024-02-29T23:59:59.123456789012+09:00',
    ]) {
      expect(Number.isNaN(parseSeoulDate(value).getTime())).toBe(false);
    }
  });

  it('rejects future content and source checks, including aligned future timestamps', () => {
    const now = parseSeoulDate('2026-10-05T12:00:00+09:00');
    const entry = (lastVerifiedAt: Date, lastCheckedAt: Date) => ({
      id: 'transport',
      status: 'practical' as const,
      lastVerifiedAt,
      sourceCount: 1,
      volatile: true,
      sources: [{ id: 'transport-source', lastCheckedAt }],
    });
    const base = {
      now,
      concert: { primarySourceCount: 2, archivePublished: false },
      setlist: { status: 'expected' as const, records: [] },
      showRecords: [],
    };

    expect(
      auditPublishedContent({
        ...base,
        entries: [
          entry(parseSeoulDate('2026-10-06'), parseSeoulDate('2026-10-05')),
        ],
      }),
    ).toEqual([{ id: 'transport', code: 'content-verification-in-future' }]);
    expect(
      auditPublishedContent({
        ...base,
        entries: [
          entry(parseSeoulDate('2026-10-05'), parseSeoulDate('2026-10-06')),
        ],
      }),
    ).toEqual([{ id: 'transport', code: 'source-check-in-future' }]);
    expect(
      auditPublishedContent({
        ...base,
        entries: [
          entry(parseSeoulDate('2026-10-06'), parseSeoulDate('2026-10-06')),
        ],
      }),
    ).toEqual([
      { id: 'transport', code: 'content-verification-in-future' },
      { id: 'transport', code: 'source-check-in-future' },
    ]);
  });

  it('rejects duplicate, noncontiguous, and out-of-order archive song positions', () => {
    const issues = auditPublishedContent({
      now: new Date('2026-10-09T00:00:00+09:00'),
      entries: [],
      concert: { primarySourceCount: 2, archivePublished: true },
      setlist: { status: 'expected', records: [] },
      showRecords: [
        {
          showDate: '2026-10-07',
          status: 'post-show',
          songCount: 3,
          songOrders: [1, 1, 3],
          sourceCount: 2,
        },
        {
          showDate: '2026-10-08',
          status: 'post-show',
          songCount: 3,
          songOrders: [1, 3, 2],
          sourceCount: 2,
        },
      ],
    });

    expect(issues).toEqual([
      { id: 'archive:2026-10-07', code: 'archive-song-orders-invalid' },
      { id: 'archive:2026-10-08', code: 'archive-song-orders-invalid' },
    ]);
  });

  it('validates a partial archive even before the two-show archive is published', () => {
    const issues = auditPublishedContent({
      now: new Date('2026-10-08T00:00:00+09:00'),
      entries: [],
      concert: { primarySourceCount: 2, archivePublished: false },
      setlist: { status: 'expected', records: [] },
      showRecords: [
        {
          showDate: '2026-10-07',
          status: 'expected',
          songCount: 2,
          songOrders: [1, 1],
          sourceCount: 1,
        },
      ],
    });

    expect(issues).toEqual([
      { id: 'archive:2026-10-07', code: 'archive-record-invalid' },
      { id: 'archive:2026-10-07', code: 'archive-song-orders-invalid' },
    ]);
  });

  it('renders an actual show with its typed editorial status', async () => {
    const explorer = await readFile(
      join(process.cwd(), 'src/components/setlist/SetlistExplorer.astro'),
      'utf8',
    );
    expect(explorer).toContain(
      '<StatusBadge locale={locale} status={record.data.status} />',
    );
    expect(explorer).not.toContain('<StatusBadge status="post-show" />');
  });

  it('rejects an unsupported archive date and incomplete expected-setlist shape', () => {
    const issues = auditPublishedContent({
      now: new Date('2026-10-08T00:00:00+09:00'),
      entries: [],
      concert: { primarySourceCount: 2, archivePublished: false },
      setlist: {
        status: 'expected',
        current: true,
        records: [
          ...Array.from({ length: 37 }, (_, index) => ({
            id: `song-${index + 1}`,
            status: 'expected' as const,
            observedInCount: 3,
            expectedOrder: index + 1,
          })),
          {
            id: 'out-of-range',
            status: 'expected',
            observedInCount: 3,
            expectedOrder: 39,
          },
        ],
      },
      showRecords: [
        {
          showDate: '2026-10-09',
          status: 'post-show',
          songCount: 1,
          songOrders: [1],
          sourceCount: 2,
        },
      ],
    });

    expect(issues).toEqual([
      { id: 'setlist', code: 'setlist-expected-orders-invalid' },
      { id: 'archive:2026-10-09', code: 'archive-show-date-invalid' },
    ]);
  });

  it('rejects volatile content when referenced sources are stale or older than the claim', () => {
    const base = {
      now: new Date('2026-10-05T12:00:00+09:00'),
      concert: { primarySourceCount: 2, archivePublished: false },
      setlist: { status: 'expected' as const, records: [] },
      showRecords: [],
    };
    expect(
      auditPublishedContent({
        ...base,
        entries: [
          {
            id: 'transport',
            status: 'practical',
            lastVerifiedAt: parseSeoulDate('2026-10-05'),
            sourceCount: 1,
            volatile: true,
            sources: [
              {
                id: 'old-source',
                lastCheckedAt: parseSeoulDate('2026-09-27'),
              },
            ],
          },
        ],
      }),
    ).toEqual([{ id: 'transport', code: 'volatile-sources-stale' }]);
    expect(
      auditPublishedContent({
        ...base,
        entries: [
          {
            id: 'transport',
            status: 'practical',
            lastVerifiedAt: parseSeoulDate('2026-10-05'),
            sourceCount: 1,
            volatile: true,
            sources: [
              {
                id: 'laundered-source',
                lastCheckedAt: parseSeoulDate('2026-10-04'),
              },
            ],
          },
        ],
      }),
    ).toEqual([
      { id: 'transport', code: 'volatile-source-older-than-content' },
    ]);
  });

  it('accepts a current volatile claim when its referenced source was refreshed with it', () => {
    expect(
      auditPublishedContent({
        now: new Date('2026-10-05T12:00:00+09:00'),
        entries: [
          {
            id: 'transport',
            status: 'practical',
            lastVerifiedAt: parseSeoulDate('2026-10-05'),
            sourceCount: 1,
            volatile: true,
            sources: [
              {
                id: 'transport-source',
                lastCheckedAt: parseSeoulDate('2026-10-05'),
              },
            ],
          },
        ],
        concert: { primarySourceCount: 2, archivePublished: false },
        setlist: { status: 'expected', records: [] },
        showRecords: [],
      }),
    ).toEqual([]);
  });

  it('applies stale-source and laundering checks to full offset ISO timestamps', () => {
    const base = {
      now: new Date('2026-10-05T12:00:00+09:00'),
      concert: { primarySourceCount: 2, archivePublished: false },
      setlist: { status: 'expected' as const, records: [] },
      showRecords: [],
    };
    expect(
      auditPublishedContent({
        ...base,
        entries: [
          {
            id: 'transport',
            status: 'practical',
            lastVerifiedAt: parseSeoulDate('2026-10-05T10:00:00+09:00'),
            sourceCount: 1,
            volatile: true,
            sources: [
              {
                id: 'stale-source',
                lastCheckedAt: parseSeoulDate('2026-09-27T09:00:00+09:00'),
              },
            ],
          },
        ],
      }),
    ).toEqual([{ id: 'transport', code: 'volatile-sources-stale' }]);
    expect(
      auditPublishedContent({
        ...base,
        entries: [
          {
            id: 'transport',
            status: 'practical',
            lastVerifiedAt: parseSeoulDate('2026-10-05T10:00:00+09:00'),
            sourceCount: 1,
            volatile: true,
            sources: [
              {
                id: 'older-source',
                lastCheckedAt: parseSeoulDate('2026-10-05T09:00:00+09:00'),
              },
            ],
          },
        ],
      }),
    ).toEqual([
      { id: 'transport', code: 'volatile-source-older-than-content' },
    ]);
  });

  it('audits the current published collection data rather than an empty fixture', async () => {
    const auditCurrentData = async (now: Date = new Date()) => {
      const dataDirectory = join(process.cwd(), 'src/data');
      const sourceDirectory = join(dataDirectory, 'sources');
      const sourceFiles = await readdir(sourceDirectory);
      const sourceKinds = new Map(
        await Promise.all(
          sourceFiles.map(async (file) => {
            const source = JSON.parse(
              await readFile(join(sourceDirectory, file), 'utf8'),
            ) as {
              kind: string;
              lastCheckedAt?: string;
              receivedAt?: string;
            };
            return [
              file.replace(/\.json$/, ''),
              {
                kind: source.kind,
                lastCheckedAt: source.lastCheckedAt,
                receivedAt: source.receivedAt,
              },
            ] as const;
          }),
        ),
      );
      const readJsonDirectory = async (directory: string) =>
        Promise.all(
          (await readdir(join(dataDirectory, directory)))
            .filter((file) => file.endsWith('.json'))
            .map(async (file) => ({
              id: `${directory}/${file.replace(/\.json$/, '')}`,
              data: JSON.parse(
                await readFile(join(dataDirectory, directory, file), 'utf8'),
              ) as {
                status: 'official' | 'expected' | 'post-show';
                lastVerifiedAt: string;
                sources: string[];
                observedIn?: string[];
                expectedOrder?: number;
                essentialOrder?: number;
                archivePublished?: boolean;
                showDate?: string;
                songs?: Array<{ order: number }>;
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
            const lastVerifiedAt = metadata.match(
              /^lastVerifiedAt: (.+)$/m,
            )?.[1];
            const inlineSources = metadata.match(/^sources: \[(.*)\]$/m)?.[1];
            const blockSources = metadata.match(
              /^sources:\n((?: {2}- .+\n)+)/m,
            )?.[1];
            const sources = inlineSources
              ? inlineSources
                  .split(',')
                  .map((source) => source.trim())
                  .filter(Boolean)
              : (blockSources?.match(/^ {2}- (.+)$/gm) ?? []).map((source) =>
                  source.replace(/^ {2}- /, ''),
                );
            if (!status || !lastVerifiedAt || sources.length === 0) {
              throw new Error(`Incomplete audit metadata: ${file}`);
            }
            return {
              id: `${directory}/${file.replace(/\.md$/, '')}`,
              data: {
                status,
                lastVerifiedAt,
                sources,
              },
            };
          }),
        );

      const [concerts, setlist, discover, guides, showRecords] =
        await Promise.all([
          readJsonDirectory('concert'),
          readJsonDirectory('setlist'),
          readMarkdownDirectory('discover'),
          readMarkdownDirectory('guides'),
          readJsonDirectory('archive'),
        ]);
      const concert = concerts[0];
      if (!concert) throw new Error('Missing concert audit record');
      return auditPublishedContent({
        now,
        entries: [...concerts, ...setlist, ...discover, ...guides].map(
          (entry) => {
            const observedIn = (entry.data as { observedIn?: string[] })
              .observedIn;
            return {
              id: entry.id,
              status: entry.data.status as Parameters<
                typeof auditPublishedContent
              >[0]['entries'][number]['status'],
              lastVerifiedAt: parseSeoulDate(entry.data.lastVerifiedAt),
              sourceCount: entry.data.sources.length,
              volatile:
                entry.id.startsWith('guides/') &&
                entry.data.status === 'practical',
              sources: entry.data.sources.flatMap((source) => {
                const metadata = sourceKinds.get(source);
                return metadata
                  ? [
                      {
                        id: source,
                        ...(metadata.lastCheckedAt
                          ? {
                              lastCheckedAt: parseSeoulDate(
                                metadata.lastCheckedAt,
                              ),
                            }
                          : {
                              receivedAt: parseSeoulDate(
                                metadata.receivedAt ?? '',
                              ),
                            }),
                      },
                    ]
                  : [];
              }),
              sourceReferences: [
                { field: 'sources', sourceIds: entry.data.sources },
                ...(observedIn
                  ? [{ field: 'observedIn', sourceIds: observedIn }]
                  : []),
              ],
            };
          },
        ),
        concert: {
          primarySourceCount: concert.data.sources.filter(
            (source) => sourceKinds.get(source)?.kind === 'official',
          ).length,
          archivePublished: concert.data.archivePublished ?? false,
        },
        setlist: {
          status: 'expected',
          current: true,
          records: setlist.map((entry) => ({
            id: entry.id,
            status: entry.data.status,
            observedInCount: entry.data.observedIn?.length ?? 0,
            expectedOrder: entry.data.expectedOrder,
            essentialOrder: entry.data.essentialOrder,
          })),
        },
        showRecords: showRecords.map((record) => ({
          showDate: record.data.showDate ?? '',
          status: record.data.status,
          songCount: record.data.songs?.length ?? 0,
          songOrders: record.data.songs?.map((song) => song.order) ?? [],
          sourceCount: record.data.sources.length,
          sourceReferences: [
            { field: 'sources', sourceIds: record.data.sources },
          ],
        })),
        knownSourceIds: [...sourceKinds.keys()],
      });
    };

    expect(
      await auditCurrentData(new Date('2026-09-25T12:00:00+09:00')),
    ).toEqual([]);
    expect(await auditCurrentData()).toEqual([]);
  });

  it('keeps expected content visibly non-official', () => {
    expect(STATUS_LABELS.ko.expected).toBe('예상 · 보장 아님');
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

describe('album cover contract', () => {
  const now = new Date('2026-10-01T00:00:00+09:00');

  it('flags foreign hosts, stale or future fetches, and unregistered Spotify links', () => {
    const issues = auditAlbums({
      now,
      officialSourceUrls: ['https://open.spotify.com/album/ok'],
      albums: [
        {
          id: 'foreign',
          spotifyUrl: 'https://open.spotify.com/album/ok',
          coverUrl: 'https://example.com/cover.jpg',
          coverFetchedAt: new Date('2026-09-01T00:00:00+09:00'),
        },
        {
          id: 'stale',
          spotifyUrl: 'https://open.spotify.com/album/ok',
          coverUrl: 'https://image-cdn-ak.spotifycdn.com/image/abc',
          coverFetchedAt: new Date('2026-06-01T00:00:00+09:00'),
        },
        {
          id: 'future',
          spotifyUrl: 'https://open.spotify.com/album/ok',
          coverUrl: 'https://i.scdn.co/image/abc',
          coverFetchedAt: new Date('2026-10-02T00:00:00+09:00'),
        },
        {
          id: 'unregistered',
          spotifyUrl: 'https://open.spotify.com/album/missing',
          coverUrl: 'https://image-cdn-fa.spotifycdn.com/image/abc',
          coverFetchedAt: new Date('2026-09-01T00:00:00+09:00'),
        },
      ],
    });

    expect(issues).toEqual([
      { id: 'foreign', code: 'album-cover-host-invalid' },
      { id: 'stale', code: 'album-cover-stale' },
      { id: 'future', code: 'album-cover-fetched-in-future' },
      { id: 'unregistered', code: 'album-spotify-source-missing' },
    ]);
  });

  it('audits the committed album data against the committed sources', async () => {
    const dataDirectory = join(process.cwd(), 'src/data');
    const readJsonDirectory = async (directory: string) =>
      Promise.all(
        (await readdir(join(dataDirectory, directory)))
          .filter((file) => file.endsWith('.json'))
          .map(async (file) => ({
            id: file.replace(/\.json$/, ''),
            data: JSON.parse(
              await readFile(join(dataDirectory, directory, file), 'utf8'),
            ),
          })),
      );
    const albums = await readJsonDirectory('albums');
    const sources = await readJsonDirectory('sources');

    expect(albums).toHaveLength(10);
    expect(
      auditAlbums({
        now: new Date('2026-08-29T00:00:00Z'),
        albums: albums.map(({ id, data }) => ({
          id,
          spotifyUrl: data.spotifyUrl,
          coverUrl: data.cover.url,
          coverFetchedAt: parseSeoulDate(data.cover.fetchedAt),
        })),
        officialSourceUrls: sources
          .filter(({ data }) => data.kind === 'official')
          .map(({ data }) => data.url),
      }),
    ).toEqual([]);
  });
});

describe('status labels', () => {
  it('covers every status in every locale', () => {
    for (const locale of LOCALES)
      for (const status of TRUST_STATUSES)
        expect(STATUS_LABELS[locale][status]?.trim()).toBeTruthy();
  });

  it('keeps the expected label honest in both locales', () => {
    expect(STATUS_LABELS.ko.expected).toContain('보장 아님');
    expect(STATUS_LABELS.en.expected).toContain('not guaranteed');
  });

  it('keeps the unpublished label honest in both locales', () => {
    expect(STATUS_LABELS.ko.unpublished).toContain('확인 필요');
    expect(STATUS_LABELS.en.unpublished).toContain('needs checking');
  });
});

describe('translation audit', () => {
  const base = {
    id: 'guides/32-tips-entry',
    locale: 'en',
    sourceExists: true,
    sourceHash: 'aaaaaaaaaaaaaaaa',
    currentHash: 'aaaaaaaaaaaaaaaa',
    sourceUrls: ['https://a.test'],
    translatedUrls: ['https://a.test'],
  };

  it('passes a translation that matches its source', () => {
    expect(auditTranslations([base])).toEqual([]);
  });

  it('fails a translation whose source prose has moved on', () => {
    expect(
      auditTranslations([{ ...base, currentHash: 'bbbbbbbbbbbbbbbb' }]),
    ).toEqual([{ id: 'en/guides/32-tips-entry', code: 'translation-stale' }]);
  });

  it('fails a translation that dropped a citation', () => {
    expect(auditTranslations([{ ...base, translatedUrls: [] }])).toEqual([
      { id: 'en/guides/32-tips-entry', code: 'translation-url-mismatch' },
    ]);
  });

  it('fails a translation that invented a citation', () => {
    expect(
      auditTranslations([
        { ...base, translatedUrls: ['https://a.test', 'https://b.test'] },
      ]),
    ).toEqual([
      { id: 'en/guides/32-tips-entry', code: 'translation-url-mismatch' },
    ]);
  });

  it('fails an overlay with no source entry', () => {
    expect(auditTranslations([{ ...base, sourceExists: false }])).toEqual([
      { id: 'en/guides/32-tips-entry', code: 'translation-orphan' },
    ]);
  });

  it('has no stale, orphaned or under-cited translation on disk', async () => {
    const records = await collectTranslationRecords();
    expect(auditTranslations(records)).toEqual([]);
  });
});
