import type {
  AuditIssue,
  ContentAuditInput,
  SourceReferenceAudit,
  TrustStatus,
} from './contracts';

type SetlistAuditRecord = {
  id: string;
  expectedOrder: number;
  status: TrustStatus;
  observedInCount: number;
};

type PublishedEntryAuditRecord = {
  id: string;
  status: TrustStatus;
  lastVerifiedAt: Date;
  sourceCount: number;
  volatile?: boolean;
  sources?: Array<{ id: string; lastCheckedAt: Date }>;
  observedIn?: Array<{ id: string }>;
  sourceReferences?: SourceReferenceAudit[];
};

type PublishedSetlistAuditRecord = {
  id: string;
  status: TrustStatus;
  observedInCount: number;
  expectedOrder?: number;
  essentialOrder?: number;
};

type ArchiveAuditRecord = {
  showDate: string;
  status: TrustStatus;
  songCount: number;
  songOrders: number[];
  sourceCount: number;
  sourceReferences?: SourceReferenceAudit[];
};

export type PublishedContentAuditInput = {
  now: Date;
  knownSourceIds?: readonly string[] | ReadonlySet<string>;
  entries: PublishedEntryAuditRecord[];
  concert: { primarySourceCount: number; archivePublished: boolean };
  setlist: {
    status: TrustStatus;
    records: PublishedSetlistAuditRecord[];
    current?: boolean;
  };
  showRecords: ArchiveAuditRecord[];
};

function auditSourceReferences(
  id: string,
  references: SourceReferenceAudit[] | undefined,
  knownSourceIds: Set<string> | undefined,
): AuditIssue[] {
  if (!references || !knownSourceIds) return [];

  const issues: AuditIssue[] = [];
  const seen = new Set<string>();
  for (const { field, sourceIds } of references) {
    for (const sourceId of sourceIds) {
      const key = `${field}\u0000${sourceId}`;
      if (seen.has(key) || knownSourceIds.has(sourceId)) continue;
      seen.add(key);
      issues.push({
        id,
        code: 'source-reference-missing',
        field,
        sourceId,
      });
    }
  }
  return issues;
}

export function parseSeoulDate(date: string): Date {
  const dateOnly = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnly) {
    const year = Number(dateOnly[1]);
    const month = Number(dateOnly[2]);
    const day = Number(dateOnly[3]);
    return isCalendarDate(year, month, day)
      ? new Date(`${date}T00:00:00+09:00`)
      : new Date(Number.NaN);
  }

  const timestamp = date.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d+))?)?(Z|[+-](\d{2}):(\d{2}))$/i,
  );
  if (!timestamp) return new Date(Number.NaN);

  const year = timestamp[1] ?? '';
  const month = timestamp[2] ?? '';
  const day = timestamp[3] ?? '';
  const hours = timestamp[4] ?? '';
  const minutes = timestamp[5] ?? '';
  const seconds = timestamp[6] ?? '0';
  const fraction = timestamp[7] ?? '';
  const offset = timestamp[8] ?? '';
  const offsetHours = timestamp[9] ?? '';
  const offsetMinutes = timestamp[10] ?? '';
  if (
    !isCalendarDate(Number(year), Number(month), Number(day)) ||
    Number(hours) > 23 ||
    Number(minutes) > 59 ||
    Number(seconds) > 59 ||
    (offset.toUpperCase() !== 'Z' &&
      (Number(offsetHours) > 23 || Number(offsetMinutes) > 59))
  ) {
    return new Date(Number.NaN);
  }

  const parsed = new Date(
    fraction.length > 3
      ? date.replace(`.${fraction}`, `.${fraction.slice(0, 3)}`)
      : date,
  );
  return Number.isNaN(parsed.getTime()) ? new Date(Number.NaN) : parsed;
}

function isCalendarDate(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const candidate = new Date(Date.UTC(year, month - 1, day));
  return (
    candidate.getUTCFullYear() === year &&
    candidate.getUTCMonth() === month - 1 &&
    candidate.getUTCDate() === day
  );
}

export function formatSeoulDate(date: Date): string {
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(date)
    .replace(/\. /g, '.')
    .replace(/\.$/, '');
}

export function auditCoreContent(input: ContentAuditInput): string[] {
  const issues: string[] = [];
  if (input.concertPrimarySourceCount < 2) {
    issues.push('concert:primary-sources-below-2');
  }
  if (input.setlistSnapshotCount < 3) {
    issues.push('setlist:snapshots-below-3');
  }
  if (input.setlistStatus === 'official') {
    issues.push('setlist:must-not-be-official');
  }
  return issues;
}

export function auditSetlistRecords(
  records: SetlistAuditRecord[],
): AuditIssue[] {
  const issues: AuditIssue[] = [];
  const seenOrders = new Set<number>();

  for (const record of records) {
    if (seenOrders.has(record.expectedOrder)) {
      issues.push({ id: record.id, code: 'duplicate-expected-order' });
    }
    seenOrders.add(record.expectedOrder);

    if (record.status !== 'expected') {
      issues.push({ id: record.id, code: 'setlist-must-be-expected' });
    }
    if (record.observedInCount < 3) {
      issues.push({ id: record.id, code: 'setlist-observations-below-3' });
    }
  }

  return issues;
}

export function auditEssentialOrders(
  orders: Array<number | undefined>,
): AuditIssue[] {
  const populated = orders.filter(
    (order): order is number => order !== undefined,
  );
  if (populated.length === 0) return [];
  const valid =
    populated.length === 10 &&
    populated.every(
      (order) => Number.isInteger(order) && order >= 1 && order <= 10,
    ) &&
    new Set(populated).size === 10;
  return valid
    ? []
    : [{ id: 'setlist', code: 'setlist-essential-orders-invalid' }];
}

export function auditPublishedContent(
  input: PublishedContentAuditInput,
): AuditIssue[] {
  const issues: AuditIssue[] = [];
  const staleAfterMilliseconds = 7 * 24 * 60 * 60 * 1000;
  const knownSourceIds = input.knownSourceIds
    ? new Set(input.knownSourceIds)
    : undefined;

  for (const entry of input.entries) {
    const sourceReferences = entry.sourceReferences ?? [
      {
        field: 'sources',
        sourceIds: entry.sources?.map((source) => source.id) ?? [],
      },
      {
        field: 'observedIn',
        sourceIds: entry.observedIn?.map((source) => source.id) ?? [],
      },
    ];
    issues.push(
      ...auditSourceReferences(entry.id, sourceReferences, knownSourceIds),
    );
    const hasValidContentDate = !Number.isNaN(entry.lastVerifiedAt.getTime());
    if (!hasValidContentDate) {
      issues.push({ id: entry.id, code: 'content-date-invalid' });
    } else if (entry.lastVerifiedAt > input.now) {
      issues.push({ id: entry.id, code: 'content-verification-in-future' });
    }
    if (entry.status !== 'unpublished' && entry.sourceCount < 1) {
      issues.push({ id: entry.id, code: 'published-content-missing-sources' });
    }
    if (
      hasValidContentDate &&
      entry.status === 'practical' &&
      entry.volatile &&
      input.now.getTime() - entry.lastVerifiedAt.getTime() >
        staleAfterMilliseconds
    ) {
      issues.push({ id: entry.id, code: 'volatile-content-stale' });
    }
    if (entry.status === 'practical' && entry.volatile && entry.sources) {
      if (
        entry.sources.some((source) =>
          Number.isNaN(source.lastCheckedAt.getTime()),
        )
      ) {
        issues.push({ id: entry.id, code: 'volatile-source-date-invalid' });
      } else if (
        entry.sources.some((source) => source.lastCheckedAt > input.now)
      ) {
        issues.push({ id: entry.id, code: 'source-check-in-future' });
      } else if (
        hasValidContentDate &&
        entry.lastVerifiedAt <= input.now &&
        entry.sources.some(
          (source) =>
            input.now.getTime() - source.lastCheckedAt.getTime() >
            staleAfterMilliseconds,
        )
      ) {
        issues.push({ id: entry.id, code: 'volatile-sources-stale' });
      } else if (
        hasValidContentDate &&
        entry.lastVerifiedAt <= input.now &&
        entry.sources.some(
          (source) => source.lastCheckedAt < entry.lastVerifiedAt,
        )
      ) {
        issues.push({
          id: entry.id,
          code: 'volatile-source-older-than-content',
        });
      }
    }
  }

  for (const record of input.showRecords) {
    issues.push(
      ...auditSourceReferences(
        `archive:${record.showDate}`,
        record.sourceReferences,
        knownSourceIds,
      ),
    );
  }

  if (input.concert.primarySourceCount < 2) {
    issues.push({ id: 'concert', code: 'concert-primary-sources-below-2' });
  }

  if (input.setlist.status !== 'expected') {
    issues.push({ id: 'setlist', code: 'setlist-must-be-expected' });
  }
  for (const record of input.setlist.records) {
    if (record.status !== 'expected') {
      issues.push({ id: record.id, code: 'setlist-must-be-expected' });
    }
    if (record.observedInCount < 3) {
      issues.push({ id: record.id, code: 'setlist-observations-below-3' });
    }
  }

  const expectedOrders = input.setlist.records.map(
    (record) => record.expectedOrder,
  );
  if (
    input.setlist.current &&
    (input.setlist.records.length !== 38 ||
      expectedOrders.some((order) => order === undefined) ||
      new Set(expectedOrders).size !== 38 ||
      expectedOrders.some(
        (order) => !Number.isInteger(order) || order! < 1 || order! > 38,
      ))
  ) {
    issues.push({ id: 'setlist', code: 'setlist-expected-orders-invalid' });
  }

  issues.push(
    ...auditEssentialOrders(
      input.setlist.records.map((record) => record.essentialOrder),
    ),
  );

  const archiveDateCounts = new Map<string, number>();
  for (const record of input.showRecords) {
    archiveDateCounts.set(
      record.showDate,
      (archiveDateCounts.get(record.showDate) ?? 0) + 1,
    );
  }
  for (const [showDate, count] of archiveDateCounts) {
    if (count > 1 && ['2026-10-07', '2026-10-08'].includes(showDate)) {
      issues.push({
        id: `archive:${showDate}`,
        code: 'archive-record-duplicate',
      });
    }
  }

  for (const record of input.showRecords) {
    const id = `archive:${record.showDate}`;
    if (!['2026-10-07', '2026-10-08'].includes(record.showDate)) {
      issues.push({ id, code: 'archive-show-date-invalid' });
      continue;
    }
    if (
      record.status !== 'post-show' ||
      record.songCount < 1 ||
      record.sourceCount < 2
    ) {
      issues.push({ id, code: 'archive-record-invalid' });
    }
    if (
      record.songOrders.length !== record.songCount ||
      record.songOrders.some((order, index) => order !== index + 1)
    ) {
      issues.push({ id, code: 'archive-song-orders-invalid' });
    }
  }

  if (input.concert.archivePublished) {
    for (const showDate of ['2026-10-07', '2026-10-08']) {
      const record = input.showRecords.find(
        (showRecord) => showRecord.showDate === showDate,
      );
      if (!record) {
        issues.push({
          id: `archive:${showDate}`,
          code: 'archive-record-missing',
        });
        continue;
      }
    }
  }

  return issues;
}

type AlbumAuditRecord = {
  id: string;
  spotifyUrl: string;
  coverUrl: string;
  coverFetchedAt: Date;
};

const COVER_HOST =
  /^https:\/\/(image-cdn-[a-z]+\.spotifycdn\.com|i\.scdn\.co)\//;
const COVER_STALE_AFTER_MS = 90 * 24 * 60 * 60 * 1000;

export function auditAlbums(input: {
  now: Date;
  albums: AlbumAuditRecord[];
  officialSourceUrls: string[];
}): AuditIssue[] {
  const issues: AuditIssue[] = [];
  const registered = new Set(input.officialSourceUrls);

  for (const album of input.albums) {
    if (!COVER_HOST.test(album.coverUrl)) {
      issues.push({ id: album.id, code: 'album-cover-host-invalid' });
    }
    const fetchedAt = album.coverFetchedAt.getTime();
    if (Number.isNaN(fetchedAt) || fetchedAt > input.now.getTime()) {
      issues.push({ id: album.id, code: 'album-cover-fetched-in-future' });
    } else if (input.now.getTime() - fetchedAt > COVER_STALE_AFTER_MS) {
      issues.push({ id: album.id, code: 'album-cover-stale' });
    }
    if (!registered.has(album.spotifyUrl)) {
      issues.push({ id: album.id, code: 'album-spotify-source-missing' });
    }
  }

  return issues;
}
