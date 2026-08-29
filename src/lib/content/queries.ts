import { getCollection, type ReferenceDataEntry } from 'astro:content';
import type { SourceRecord } from './contracts';

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
