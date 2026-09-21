import { z } from 'astro/zod';
import { DEFAULT_LOCALE, type Locale } from '../locales';
import enConcert from '../../../data/i18n/en/concert.json';
import enSetlist from '../../../data/i18n/en/setlist.json';
import enSources from '../../../data/i18n/en/sources.json';

export type OverlayMeta = { sourceHash: string; translatedAt: string };

// JSON never carries a `Date`, but this stays tolerant of one (and
// normalizes to the plain ISO date string `OverlayMeta` promises) so it
// matches `overlayCommon` in content.config.ts and can be exercised with
// the same fixtures a test constructs directly.
const overlayTranslatedAt = z
  .union([z.date(), z.iso.date()])
  .transform((value) =>
    value instanceof Date ? value.toISOString().slice(0, 10) : value,
  );

const meta = {
  sourceHash: z.string().regex(/^[0-9a-f]{16}$/),
  translatedAt: overlayTranslatedAt,
};

// .strict() so a stray or misspelled key in a hand-written JSON bundle entry
// (e.g. a leftover `status`) fails the build instead of vanishing silently.
export const setlistEntrySchema = z
  .object({
    title: z.string(),
    summary: z.string(),
    liveNote: z.string(),
    singAlongNote: z.string(),
    ...meta,
  })
  .strict();

export const sourceEntrySchema = z
  .object({ name: z.string(), ...meta })
  .strict();

export const concertEntrySchema = z
  .object({
    title: z.string(),
    summary: z.string(),
    ageRestriction: z.string(),
    shows: z.array(z.object({ dateLabel: z.string() })).length(2),
    ...meta,
  })
  .strict();

const setlistSchema = z.record(z.string(), setlistEntrySchema);
const sourcesSchema = z.record(z.string(), sourceEntrySchema);
const concertSchema = z.record(z.string(), concertEntrySchema);

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
