import { describe, expect, it } from 'vitest';
import { auditCoreContent } from '../../src/lib/content/audit';
import { STATUS_LABELS } from '../../src/lib/content/contracts';

describe('content trust contract', () => {
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
});
