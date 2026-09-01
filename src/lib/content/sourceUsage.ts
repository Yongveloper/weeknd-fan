import type { CollectionEntry } from 'astro:content';
import type { ConcertRecord, SetlistRecord, ShowRecord } from './contracts';

export type PrimaryContentRoute = '/' | '/discover/' | '/setlist/' | '/goyang/';

export interface SourceUsage {
  sourceId: string;
  routes: PrimaryContentRoute[];
}

type SourceReference = { id: string };

const ROUTE_ORDER: PrimaryContentRoute[] = [
  '/',
  '/discover/',
  '/setlist/',
  '/goyang/',
];

function addUsage(
  index: Map<string, SourceUsage>,
  references: readonly SourceReference[] | undefined,
  route: PrimaryContentRoute,
) {
  for (const { id } of references ?? []) {
    const usage = index.get(id) ?? { sourceId: id, routes: [] };
    if (!usage.routes.includes(route)) usage.routes.push(route);
    index.set(id, usage);
  }
}

export function buildSourceUsageIndex(input: {
  concert: ConcertRecord[];
  discover: CollectionEntry<'discover'>[];
  guides: CollectionEntry<'guides'>[];
  setlist: SetlistRecord[];
  showRecords: ShowRecord[];
}): Map<string, SourceUsage> {
  const index = new Map<string, SourceUsage>();

  for (const entry of input.concert) addUsage(index, entry.data.sources, '/');
  for (const entry of input.discover)
    addUsage(index, entry.data.sources, '/discover/');
  for (const entry of input.setlist) {
    addUsage(index, entry.data.sources, '/setlist/');
    addUsage(index, entry.data.observedIn, '/');
    addUsage(index, entry.data.observedIn, '/setlist/');
  }
  for (const entry of input.showRecords)
    addUsage(index, entry.data.sources, '/setlist/');
  for (const entry of input.guides)
    addUsage(index, entry.data.sources, '/goyang/');

  for (const usage of index.values()) {
    usage.routes.sort(
      (left, right) => ROUTE_ORDER.indexOf(left) - ROUTE_ORDER.indexOf(right),
    );
  }

  return index;
}
