import { getCollection } from 'astro:content';

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

export async function getGuideContent() {
  return (await getCollection('guides')).sort(
    (a, b) => a.data.order - b.data.order,
  );
}
