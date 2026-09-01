import { getCollection, type ReferenceDataEntry } from 'astro:content';
import type { SourceRecord } from './contracts';
import { buildSourceUsageIndex } from './sourceUsage';

type EditorialSetlistEntry = {
  data: { lastVerifiedAt: Date; observedIn: Array<{ id: string }> };
};

export function getSetlistEditorialMetadata(entries: EditorialSetlistEntry[]) {
  const latest = entries.reduce<Date | undefined>(
    (current, entry) =>
      !current || entry.data.lastVerifiedAt > current
        ? entry.data.lastVerifiedAt
        : current,
    undefined,
  );
  const observations = new Set(
    entries.flatMap((entry) => entry.data.observedIn.map(({ id }) => id)),
  );
  return {
    version: latest ? formatSeoulIsoDate(latest) : '',
    observationCount: observations.size,
  };
}

function formatSeoulIsoDate(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const value = Object.fromEntries(
    parts.map(({ type, value }) => [type, value]),
  );
  return `${value.year}-${value.month}-${value.day}`;
}

export async function getConcert() {
  const entries = await getCollection('concert');
  const concert = entries.find((entry) => entry.id === 'goyang-2026');
  if (!concert) throw new Error('Missing concert record: goyang-2026');
  return concert;
}

export async function getExpectedSetlist() {
  return (await getCollection('setlist')).sort(
    (a, b) => a.data.expectedOrder - b.data.expectedOrder,
  );
}

export async function getShowRecords() {
  return (await getCollection('showRecords')).sort((a, b) =>
    a.data.showDate.localeCompare(b.data.showDate),
  );
}

export async function getDiscoverContent() {
  return (await getCollection('discover')).sort(
    (a, b) => a.data.order - b.data.order,
  );
}

export function resolveSourceReferences(
  sourceRefs: ReferenceDataEntry<'sources'>[],
  sources: SourceRecord[],
): SourceRecord[] {
  const sourceById = new Map(sources.map((source) => [source.id, source]));

  return sourceRefs.map(({ id }) => {
    const source = sourceById.get(id);
    if (!source) {
      throw new Error(`Missing source record: ${id}`);
    }
    return source;
  });
}

export async function getGuideContent() {
  return (await getCollection('guides')).sort(
    (a, b) => a.data.order - b.data.order,
  );
}

export async function getSourceUsageIndex() {
  const [concert, discover, guides, setlist, showRecords] = await Promise.all([
    getCollection('concert'),
    getCollection('discover'),
    getCollection('guides'),
    getCollection('setlist'),
    getCollection('showRecords'),
  ]);
  return buildSourceUsageIndex({
    concert,
    discover,
    guides,
    setlist,
    showRecords,
  });
}

export async function getAlbums() {
  return (await getCollection('albums')).sort(
    (a, b) => a.data.year - b.data.year,
  );
}
