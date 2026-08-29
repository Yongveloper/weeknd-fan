import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const status = z.enum([
  'official',
  'post-show',
  'pattern',
  'expected',
  'unpublished',
]);
const spoilerLevel = z.enum(['none', 'titles', 'full']);

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
    lastCheckedAt: z.coerce.date(),
  }),
});

const common = z.object({
  title: z.string(),
  summary: z.string(),
  body: z.string().optional(),
  status,
  lastVerifiedAt: z.coerce.date(),
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

export const collections = {
  concert,
  discover,
  guides,
  setlist,
  showRecords,
  sources,
};
