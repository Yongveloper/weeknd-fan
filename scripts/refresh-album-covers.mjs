/* global console, fetch, process */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { coverFromOEmbed } from './lib/album-cover.mjs';

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
  if (verifyOnly) {
    const changed = cover.url !== album.cover?.url ? 'CHANGED' : 'same';
    console.log(`${file}\t${changed}\t${cover.url}`);
    continue;
  }
  album.cover = { ...cover, fetchedAt: today };
  await writeFile(filePath, `${JSON.stringify(album, null, 2)}\n`);
  console.log(`${file}\tupdated`);
}
