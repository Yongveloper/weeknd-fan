import type { CollectionEntry } from 'astro:content';

export const TRUST_STATUSES = [
  'official',
  'practical',
  'post-show',
  'pattern',
  'expected',
  'unpublished',
] as const;

export type TrustStatus = (typeof TRUST_STATUSES)[number];

export const STATUS_LABELS: Record<TrustStatus, string> = {
  official: '공식 확정',
  practical: '실용 안내',
  'post-show': '공연 후 확인',
  pattern: '반복 패턴',
  expected: '예상 · 보장 아님',
  unpublished: '미공개 · 확인 필요',
};

export type SourceRecord = CollectionEntry<'sources'>;
export type AlbumRecord = CollectionEntry<'albums'>;
export type ConcertRecord = CollectionEntry<'concert'>;
export type SetlistRecord = CollectionEntry<'setlist'>;
export type ShowRecord = CollectionEntry<'showRecords'>;

export type ContentAuditInput = {
  concertPrimarySourceCount: number;
  setlistSnapshotCount: number;
  setlistStatus: TrustStatus;
};

export type AuditIssue = {
  id: string;
  code: string;
  field?: string;
  sourceId?: string;
};

export type SourceReferenceAudit = {
  field: string;
  sourceIds: readonly string[];
};
