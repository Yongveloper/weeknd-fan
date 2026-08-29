import type { ContentAuditInput } from './contracts';

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
