import { describe, expect, it } from 'vitest';
import {
  auditCoreContent,
  auditSetlistRecords,
} from '../../src/lib/content/audit';
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
