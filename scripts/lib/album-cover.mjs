const COVER_HOST =
  /^https:\/\/(image-cdn-[a-z]+\.spotifycdn\.com|i\.scdn\.co)\//;

export function normalizeTitle(title) {
  return String(title)
    .normalize('NFKC')
    .toLowerCase()
    .replace(/\(original\)/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '');
}

export function coverFromOEmbed(payload, expectedTitle) {
  if (!payload || typeof payload.thumbnail_url !== 'string') {
    throw new Error('oEmbed payload has no thumbnail_url');
  }
  if (!COVER_HOST.test(payload.thumbnail_url)) {
    throw new Error(`unexpected cover host: ${payload.thumbnail_url}`);
  }
  if (normalizeTitle(payload.title ?? '') !== normalizeTitle(expectedTitle)) {
    throw new Error(
      `title mismatch: expected "${expectedTitle}", got "${payload.title}"`,
    );
  }
  return {
    url: payload.thumbnail_url,
    width: Number(payload.thumbnail_width),
    height: Number(payload.thumbnail_height),
  };
}
