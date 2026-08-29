import type { AuditIssue, ContentAuditInput, TrustStatus } from './contracts';

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
};

type PublishedSetlistAuditRecord = {
  id: string;
  status: TrustStatus;
  observedInCount: number;
};

type ArchiveAuditRecord = {
  showDate: string;
  status: TrustStatus;
  songCount: number;
  sourceCount: number;
};

export type PublishedContentAuditInput = {
  now: Date;
  entries: PublishedEntryAuditRecord[];
  concert: { primarySourceCount: number; archivePublished: boolean };
  setlist: { status: TrustStatus; records: PublishedSetlistAuditRecord[] };
  showRecords: ArchiveAuditRecord[];
};

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

export function auditPublishedContent(
  input: PublishedContentAuditInput,
): AuditIssue[] {
  const issues: AuditIssue[] = [];
  const staleAfterMilliseconds = 7 * 24 * 60 * 60 * 1000;

  for (const entry of input.entries) {
    if (entry.status !== 'unpublished' && entry.sourceCount < 1) {
      issues.push({ id: entry.id, code: 'published-content-missing-sources' });
    }
    if (
      entry.status === 'practical' &&
      entry.volatile &&
      input.now.getTime() - entry.lastVerifiedAt.getTime() >
        staleAfterMilliseconds
    ) {
      issues.push({ id: entry.id, code: 'volatile-content-stale' });
    }
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
      if (
        record.status !== 'post-show' ||
        record.songCount < 1 ||
        record.sourceCount < 2
      ) {
        issues.push({
          id: `archive:${showDate}`,
          code: 'archive-record-invalid',
        });
      }
    }
  }

  return issues;
}
