import { getCollection, type ReferenceDataEntry } from 'astro:content';
import type { SourceRecord } from './contracts';
import { buildSourceUsageIndex } from './sourceUsage';
import { DEFAULT_LOCALE, type Locale } from '../i18n/locales';
import {
  concertOverlay,
  setlistOverlay,
  sourcesOverlay,
} from '../i18n/content/overlays';
import { overlayId, type Localized } from '../i18n/content/merge';

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

// The glob loader keeps the pattern's collection-name segment in the id (a
// file at `src/data/i18n/en/guides/32-tips-entry.md` gets the id
// `en/guides/32-tips-entry`, not `en/32-tips-entry`), so a lookup keyed by
// `overlayId(locale, sourceId)` (`<locale>/<id>`) has to drop that middle
// segment before it can match.
function overlayEntryKey(id: string): string {
  const [locale, , ...rest] = id.split('/');
  return `${locale}/${rest.join('/')}`;
}

type ConcertEntry = Awaited<
  ReturnType<typeof getCollection<'concert'>>
>[number];

export type LocalizedConcert = {
  entry: ConcertEntry;
  data: ConcertEntry['data'];
  translated: boolean;
};

export async function getConcert(
  locale: Locale = DEFAULT_LOCALE,
): Promise<LocalizedConcert> {
  const entries = await getCollection('concert');
  const entry = entries.find((item) => item.id === 'goyang-2026');
  if (!entry) throw new Error('Missing concert record: goyang-2026');

  // Korean is the source of record; skip the overlay lookup entirely so its
  // code path stays what it was before translation existed.
  if (locale === DEFAULT_LOCALE)
    return { entry, data: entry.data, translated: false };

  const translation = concertOverlay(locale)[entry.id];
  if (!translation) return { entry, data: entry.data, translated: false };

  return {
    entry,
    data: {
      ...entry.data,
      title: translation.title,
      summary: translation.summary,
      ageRestriction: translation.ageRestriction,
      shows: entry.data.shows.map((show, index) => ({
        ...show,
        dateLabel: translation.shows[index]?.dateLabel ?? show.dateLabel,
      })),
    },
    translated: true,
  };
}

type SetlistEntry = Awaited<
  ReturnType<typeof getCollection<'setlist'>>
>[number];

export type LocalizedSetlist = {
  entry: SetlistEntry;
  data: SetlistEntry['data'];
  translated: boolean;
};

export async function getExpectedSetlist(
  locale: Locale = DEFAULT_LOCALE,
): Promise<LocalizedSetlist[]> {
  const entries = (await getCollection('setlist')).sort(
    (a, b) => a.data.expectedOrder - b.data.expectedOrder,
  );

  if (locale === DEFAULT_LOCALE)
    return entries.map((entry) => ({
      entry,
      data: entry.data,
      translated: false,
    }));

  const overlay = setlistOverlay(locale);
  return entries.map((entry) => {
    const translation = overlay[entry.id];
    if (!translation) return { entry, data: entry.data, translated: false };
    return {
      entry,
      data: {
        ...entry.data,
        title: translation.title,
        summary: translation.summary,
        liveNote: translation.liveNote,
        singAlongNote: translation.singAlongNote,
      },
      translated: true,
    };
  });
}

export async function getShowRecords() {
  return (await getCollection('showRecords')).sort((a, b) =>
    a.data.showDate.localeCompare(b.data.showDate),
  );
}

type DiscoverEntry = Awaited<
  ReturnType<typeof getCollection<'discover'>>
>[number];
type DiscoverOverlayEntry = Awaited<
  ReturnType<typeof getCollection<'discoverI18n'>>
>[number];

export type LocalizedDiscover = Localized<
  DiscoverEntry['data'],
  DiscoverEntry | DiscoverOverlayEntry
> & { entry: DiscoverEntry };

export async function getDiscoverContent(
  locale: Locale = DEFAULT_LOCALE,
): Promise<LocalizedDiscover[]> {
  const entries = (await getCollection('discover')).sort(
    (a, b) => a.data.order - b.data.order,
  );

  // Korean is the source of record; skip the overlay lookup entirely so its
  // code path stays what it was before translation existed.
  if (locale === DEFAULT_LOCALE)
    return entries.map((entry) => ({
      entry,
      data: entry.data,
      renderEntry: entry,
      translated: false,
    }));

  const overlays = new Map(
    (await getCollection('discoverI18n')).map((entry) => [
      overlayEntryKey(entry.id),
      entry,
    ]),
  );

  return entries.map((entry) => {
    const overlay = overlays.get(overlayId(locale, entry.id));
    if (!overlay)
      return {
        entry,
        data: entry.data,
        renderEntry: entry,
        translated: false,
      };
    return {
      entry,
      data: {
        ...entry.data,
        title: overlay.data.title,
        summary: overlay.data.summary,
      },
      renderEntry: overlay,
      translated: true,
    };
  });
}

export function resolveSourceReferences(
  sourceRefs: ReferenceDataEntry<'sources'>[],
  sources: SourceRecord[],
  locale: Locale = DEFAULT_LOCALE,
): SourceRecord[] {
  const sourceById = new Map(sources.map((source) => [source.id, source]));
  const resolve = (id: string): SourceRecord => {
    const source = sourceById.get(id);
    if (!source) {
      throw new Error(`Missing source record: ${id}`);
    }
    return source;
  };

  // Korean is the source of record; skip the overlay lookup entirely so its
  // code path stays what it was before translation existed.
  if (locale === DEFAULT_LOCALE) return sourceRefs.map(({ id }) => resolve(id));

  const overlay = sourcesOverlay(locale);
  return sourceRefs.map(({ id }) => {
    const source = resolve(id);
    const translation = overlay[id];
    if (!translation) return source;
    return { ...source, data: { ...source.data, name: translation.name } };
  });
}

type GuideEntry = Awaited<ReturnType<typeof getCollection<'guides'>>>[number];
type GuideOverlayEntry = Awaited<
  ReturnType<typeof getCollection<'guidesI18n'>>
>[number];

export type LocalizedGuide = Localized<
  GuideEntry['data'],
  GuideEntry | GuideOverlayEntry
> & { entry: GuideEntry };

export async function getGuideContent(
  locale: Locale = DEFAULT_LOCALE,
): Promise<LocalizedGuide[]> {
  const entries = (await getCollection('guides')).sort(
    (a, b) => a.data.order - b.data.order,
  );

  // Korean is the source of record; skip the overlay lookup entirely so its
  // code path stays what it was before translation existed.
  if (locale === DEFAULT_LOCALE)
    return entries.map((entry) => ({
      entry,
      data: entry.data,
      renderEntry: entry,
      translated: false,
    }));

  const overlays = new Map(
    (await getCollection('guidesI18n')).map((entry) => [
      overlayEntryKey(entry.id),
      entry,
    ]),
  );

  return entries.map((entry) => {
    const overlay = overlays.get(overlayId(locale, entry.id));
    if (!overlay)
      return {
        entry,
        data: entry.data,
        renderEntry: entry,
        translated: false,
      };
    return {
      entry,
      data: {
        ...entry.data,
        title: overlay.data.title,
        summary: overlay.data.summary,
      },
      renderEntry: overlay,
      translated: true,
    };
  });
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
