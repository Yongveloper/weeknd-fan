import { z } from 'astro/zod';
import { DEFAULT_LOCALE, type Locale } from '../locales';
import enConcert from '../../../data/i18n/en/concert.json';
import enSetlist from '../../../data/i18n/en/setlist.json';
import enSources from '../../../data/i18n/en/sources.json';

export type OverlayMeta = { sourceHash: string; translatedAt: string };

const meta = {
  sourceHash: z.string().regex(/^[0-9a-f]{16}$/),
  translatedAt: z.iso.date(),
};

const setlistSchema = z.record(
  z.string(),
  z.object({
    title: z.string(),
    summary: z.string(),
    liveNote: z.string(),
    singAlongNote: z.string(),
    ...meta,
  }),
);

const sourcesSchema = z.record(
  z.string(),
  z.object({ name: z.string(), ...meta }),
);

const concertSchema = z.record(
  z.string(),
  z.object({
    title: z.string(),
    summary: z.string(),
    ageRestriction: z.string(),
    shows: z.array(z.object({ dateLabel: z.string() })).length(2),
    ...meta,
  }),
);

export type SetlistOverlay = z.infer<typeof setlistSchema>[string];
export type SourceOverlay = z.infer<typeof sourcesSchema>[string];
export type ConcertOverlay = z.infer<typeof concertSchema>[string];

const BUNDLES = {
  en: { setlist: enSetlist, sources: enSources, concert: enConcert },
};

function bundle<T>(
  schema: z.ZodType<T>,
  locale: Locale,
  key: 'setlist' | 'sources' | 'concert',
): T {
  if (locale === DEFAULT_LOCALE) return schema.parse({});
  return schema.parse(BUNDLES[locale as 'en'][key]);
}

export const setlistOverlay = (locale: Locale) =>
  bundle(setlistSchema, locale, 'setlist');
export const sourcesOverlay = (locale: Locale) =>
  bundle(sourcesSchema, locale, 'sources');
export const concertOverlay = (locale: Locale) =>
  bundle(concertSchema, locale, 'concert');
