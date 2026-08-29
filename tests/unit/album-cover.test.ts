import { describe, expect, it } from 'vitest';
// @ts-expect-error plain ESM script module without type declarations
import { coverFromOEmbed } from '../../scripts/lib/album-cover.mjs';

const payload = {
  title: 'House Of Balloons (Original)',
  thumbnail_url:
    'https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e02274b406a7e18acebcf743079',
  thumbnail_width: 300,
  thumbnail_height: 300,
};

describe('coverFromOEmbed', () => {
  it('accepts a Spotify CDN cover whose title matches ignoring case and "(Original)"', () => {
    expect(coverFromOEmbed(payload, 'House of Balloons')).toEqual({
      url: payload.thumbnail_url,
      width: 300,
      height: 300,
    });
  });

  it('rejects a title mismatch so a wrong album id cannot slip in', () => {
    expect(() => coverFromOEmbed(payload, 'Hurry Up Tomorrow')).toThrow(
      /title mismatch/,
    );
  });

  it('rejects covers hosted outside Spotify', () => {
    expect(() =>
      coverFromOEmbed(
        { ...payload, thumbnail_url: 'https://example.com/x.jpg' },
        'House of Balloons',
      ),
    ).toThrow(/cover host/);
  });
});
