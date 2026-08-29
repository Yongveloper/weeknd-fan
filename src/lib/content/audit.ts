import type { AuditIssue, ContentAuditInput, TrustStatus } from './contracts';

type SetlistAuditRecord = {
  id: string;
  expectedOrder: number;
  status: TrustStatus;
  observedInCount: number;
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
