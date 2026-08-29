/* global console, fetch, process */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { coverFromOEmbed, coverIdentity } from './lib/album-cover.mjs';

const albumsDirectory = path.resolve('src/data/albums');
const verifyOnly = process.argv.includes('--verify');
const today = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Seoul',
}).format(new Date());

const files = (await readdir(albumsDirectory)).filter((file) =>
  file.endsWith('.json'),
);

for (const file of files) {
  const filePath = path.join(albumsDirectory, file);
  const album = JSON.parse(await readFile(filePath, 'utf8'));
  const endpoint = `https://open.spotify.com/oembed?url=${encodeURIComponent(album.spotifyUrl)}`;
  const response = await fetch(endpoint);
  if (!response.ok) {
    throw new Error(`${file}: oEmbed responded ${response.status}`);
  }
  const cover = coverFromOEmbed(await response.json(), album.title);
  const sameIdentity =
    album.cover?.url != null &&
    coverIdentity(cover.url) === coverIdentity(album.cover.url);
  if (verifyOnly) {
    console.log(`${file}\t${sameIdentity ? 'same' : 'CHANGED'}\t${cover.url}`);
    continue;
  }
  album.cover = {
    url: sameIdentity ? album.cover.url : cover.url,
    width: cover.width,
    height: cover.height,
    fetchedAt: today,
  };
  await writeFile(filePath, `${JSON.stringify(album, null, 2)}\n`);
  console.log(`${file}\tupdated`);
}
