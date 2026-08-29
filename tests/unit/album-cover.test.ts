import { describe, expect, it } from 'vitest';
import {
  coverFromOEmbed,
  coverIdentity,
} from '../../scripts/lib/album-cover.mjs';

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

  it('rejects a payload with no thumbnail_url', () => {
    expect(() =>
      coverFromOEmbed(
        { ...payload, thumbnail_url: undefined },
        'House of Balloons',
      ),
    ).toThrow(/thumbnail_url/);
  });

  it('rejects a payload missing thumbnail_width', () => {
    expect(() =>
      coverFromOEmbed(
        { ...payload, thumbnail_width: undefined },
        'House of Balloons',
      ),
    ).toThrow(/invalid cover dimensions/);
  });
});

describe('coverIdentity', () => {
  it('treats different Spotify CDN edge subdomains with the same image id as the same identity', () => {
    const ak = coverIdentity(
      'https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e02274b406a7e18acebcf743079',
    );
    const fa = coverIdentity(
      'https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e02274b406a7e18acebcf743079',
    );
    const scdn = coverIdentity(
      'https://i.scdn.co/image/ab67616d00001e02274b406a7e18acebcf743079',
    );
    expect(ak).toBe(fa);
    expect(ak).toBe(scdn);
  });

  it('treats different image ids as different identities', () => {
    const a = coverIdentity(
      'https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e02274b406a7e18acebcf743079',
    );
    const b = coverIdentity(
      'https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e028863bc11d2aa12b54f5aeb36',
    );
    expect(a).not.toBe(b);
  });
});
