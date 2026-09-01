import { describe, expect, it } from 'vitest';
import { buildSourceUsageIndex } from '../../src/lib/content/sourceUsage';

const references = (ids: string[]) => ids.map((id) => ({ id }));

const contentEntry = ({
  id,
  sources = [],
  observedIn,
}: {
  id: string;
  sources?: string[];
  observedIn?: string[];
}) =>
  ({
    id,
    data: {
      sources: references(sources),
      ...(observedIn ? { observedIn: references(observedIn) } : {}),
    },
  }) as never;

describe('buildSourceUsageIndex', () => {
  it('deduplicates source references and keeps routes in canonical order', () => {
    const usage = buildSourceUsageIndex({
      concert: [contentEntry({ id: 'goyang', sources: ['shared'] })],
      discover: [contentEntry({ id: 'intro', sources: ['shared'] })],
      guides: [contentEntry({ id: 'transport', sources: ['shared'] })],
      setlist: [
        contentEntry({
          id: 'song',
          sources: ['shared'],
          observedIn: ['shared', 'shared'],
        }),
      ],
      showRecords: [contentEntry({ id: 'archive', sources: ['shared'] })],
    });

    expect(usage.get('shared')).toEqual({
      sourceId: 'shared',
      routes: ['/', '/discover/', '/setlist/', '/goyang/'],
    });
  });

  it('includes observed setlist sources on the home prediction and setlist page', () => {
    const usage = buildSourceUsageIndex({
      concert: [],
      discover: [],
      guides: [],
      setlist: [contentEntry({ id: 'song', observedIn: ['observed-only'] })],
      showRecords: [],
    });

    expect(usage.get('observed-only')).toEqual({
      sourceId: 'observed-only',
      routes: ['/', '/setlist/'],
    });
  });

  it('does not invent usage for a source absent from content references', () => {
    const usage = buildSourceUsageIndex({
      concert: [],
      discover: [],
      guides: [],
      setlist: [],
      showRecords: [],
    });

    expect(usage.has('unused-source')).toBe(false);
  });
});
