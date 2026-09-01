import type { SetlistRecord } from '../content/contracts';

export interface SetlistFilterState {
  query: string;
  album: string | null;
  view: 'all' | 'essential';
}

export type SetlistFilterable = Pick<SetlistRecord, 'id'> & {
  data: Pick<
    SetlistRecord['data'],
    'songTitle' | 'album' | 'expectedOrder' | 'essentialOrder'
  >;
};

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase();
}

export function filterExpectedSetlist<T extends SetlistFilterable>(
  entries: T[],
  state: SetlistFilterState,
): T[] {
  const query = normalize(state.query);
  const filtered = entries.filter((entry) => {
    const titleMatches =
      !query || normalize(entry.data.songTitle).includes(query);
    const albumMatches = !state.album || entry.data.album === state.album;
    const essentialMatches =
      state.view !== 'essential' || entry.data.essentialOrder !== undefined;
    return titleMatches && albumMatches && essentialMatches;
  });

  if (state.view !== 'essential') return filtered;
  return filtered.toSorted(
    (left, right) =>
      (left.data.essentialOrder ?? Number.POSITIVE_INFINITY) -
      (right.data.essentialOrder ?? Number.POSITIVE_INFINITY),
  );
}
