import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const status = z.enum([
  'official',
  'practical',
  'post-show',
  'pattern',
  'expected',
  'unpublished',
]);
const spoilerLevel = z.enum(['none', 'titles', 'full']);
const editorialDate = z
  .union([z.date(), z.iso.date(), z.iso.datetime({ offset: true })])
  .transform((value) =>
    value instanceof Date
      ? value
      : new Date(value.length === 10 ? `${value}T00:00:00+09:00` : value),
  );

const sources = defineCollection({
  loader: glob({ base: './src/data/sources', pattern: '**/*.json' }),
  schema: z.object({
    name: z.string(),
    url: z.url(),
    kind: z.enum([
      'official',
      'public-agency',
      'crowd-sourced',
      'editorial-reference',
    ]),
    lastCheckedAt: editorialDate,
  }),
});

const common = z.object({
  title: z.string(),
  summary: z.string(),
  body: z.string().optional(),
  status,
  lastVerifiedAt: editorialDate,
  sources: z.array(reference('sources')).min(1),
  relatedAlbums: z.array(z.string()).default([]),
  relatedSongs: z.array(z.string()).default([]),
  spoilerLevel,
});

const concert = defineCollection({
  loader: glob({ base: './src/data/concert', pattern: '**/*.json' }),
  schema: common.extend({
    venue: z.string(),
    ageRestriction: z.string(),
    opener: z.object({ name: z.string() }),
    shows: z
      .array(
        z.object({
          dateLabel: z.string(),
          openerStartsAt: z.iso.datetime({ offset: true }),
          startsAt: z.iso.datetime({ offset: true }),
        }),
      )
      .length(2),
    archivePublished: z.boolean(),
  }),
});

const showRecords = defineCollection({
  loader: glob({ base: './src/data/archive', pattern: '**/*.json' }),
  schema: common.extend({
    showDate: z.iso.date(),
    songs: z
      .array(
        z.object({
          order: z.number().int().positive(),
          title: z.string(),
          note: z.string().optional(),
        }),
      )
      .min(1),
  }),
});

const discover = defineCollection({
  loader: glob({ base: './src/data/discover', pattern: '**/*.md' }),
  schema: common.extend({
    order: z.number().int().positive(),
    section: z.enum(['intro', 'era', 'trilogy', 'glossary', 'visual']),
  }),
});

const guides = defineCollection({
  loader: glob({ base: './src/data/guides', pattern: '**/*.md' }),
  schema: common.extend({
    order: z.number().int().positive(),
    section: z.enum([
      'official',
      'transport',
      'arrival',
      'return',
      'packing',
      'pending',
      'seating',
      'tips',
    ]),
  }),
});

const setlist = defineCollection({
  loader: glob({ base: './src/data/setlist', pattern: '**/*.json' }),
  schema: common.extend({
    expectedOrder: z.number().int().positive(),
    songTitle: z.string(),
    album: z.string(),
    liveNote: z.string(),
    singAlongNote: z.string(),
    confidence: z.enum(['high', 'medium', 'low']),
    officialListenUrl: z.url().optional(),
    observedIn: z.array(reference('sources')).min(3),
  }),
});

const albums = defineCollection({
  loader: glob({ base: './src/data/albums', pattern: '**/*.json' }),
  schema: z.object({
    title: z.string(),
    year: z.number().int().min(2011),
    kind: z.enum(['mixtape', 'studio', 'ep']),
    era: z.enum(['night', 'red', 'blue', 'amber']),
    spotifyUrl: z
      .url()
      .regex(/^https:\/\/open\.spotify\.com\/album\/[A-Za-z0-9]+$/),
    cover: z.object({
      url: z
        .url()
        .regex(/^https:\/\/(image-cdn-[a-z]+\.spotifycdn\.com|i\.scdn\.co)\//),
      width: z.number().int().positive(),
      height: z.number().int().positive(),
      fetchedAt: editorialDate,
    }),
  }),
});

export const collections = {
  albums,
  concert,
  discover,
  guides,
  setlist,
  showRecords,
  sources,
};
