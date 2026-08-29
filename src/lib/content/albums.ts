export function normalizeAlbumTitle(title: string): string {
  return title
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '');
}

export function findAlbumByTitle<T extends { data: { title: string } }>(
  albums: T[],
  title: string,
): T | undefined {
  const key = normalizeAlbumTitle(title);
  return albums.find((album) => normalizeAlbumTitle(album.data.title) === key);
}
