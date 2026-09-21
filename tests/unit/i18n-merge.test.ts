import { describe, expect, it } from 'vitest';
import { overlayEntryKey, overlayId } from '../../src/lib/i18n/content/merge';

describe('overlayId', () => {
  it('joins the locale and a bare source id', () => {
    expect(overlayId('en', '32-tips-entry')).toBe('en/32-tips-entry');
  });

  it('joins the locale and a nested source id', () => {
    expect(overlayId('en', 'sub/entry')).toBe('en/sub/entry');
  });

  it('builds an overlay id from a bare json-bundle key', () => {
    // setlistOverlay/sourcesOverlay/concertOverlay are hand-authored objects
    // keyed by the bare source id; only markdown overlays go through
    // overlayEntryKey. overlayId still has to produce something sane if ever
    // pointed at one of these ids.
    expect(overlayId('en', 'blinding-lights')).toBe('en/blinding-lights');
  });
});

describe('overlayEntryKey', () => {
  it('strips the glob pattern collection segment from a real guide overlay id', () => {
    // The actual id the glob loader assigns to
    // `src/data/i18n/en/guides/32-tips-entry.md` (verified against Astro's
    // generateIdDefault, not asserted from the pattern alone).
    expect(overlayEntryKey('en/guides/32-tips-entry')).toBe('en/32-tips-entry');
  });

  it('strips only the collection segment from a nested overlay id', () => {
    expect(overlayEntryKey('en/guides/sub/entry')).toBe('en/sub/entry');
  });

  it('agrees with overlayId for the source id it was derived from', () => {
    const entryId = 'en/guides/32-tips-entry';
    expect(overlayEntryKey(entryId)).toBe(overlayId('en', '32-tips-entry'));
  });
});
