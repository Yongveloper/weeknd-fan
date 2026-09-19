// Subsets the fontsource slices that the site header needs down to the exact
// chrome glyphs. Re-run whenever src/components/chrome/navigation.ts changes:
//   npm run fonts:header
// Requires Node 22 type stripping to import the .ts helpers.
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import process from 'node:process';
import subsetFont from 'subset-font';
import { chromeText } from '../src/components/chrome/navigation.ts';
import {
  charactersCoveredBy,
  facesCovering,
  parseFontFaces,
} from '../src/lib/fonts/headerFonts.ts';

const require = createRequire(import.meta.url);
const outDir = path.resolve('src/assets/fonts/header');

const sources = [
  {
    family: 'display',
    css: '@fontsource/bebas-neue/index.css',
    files: '@fontsource/bebas-neue/files/',
    text: chromeText.display,
  },
  {
    family: 'body',
    css: '@fontsource-variable/noto-sans-kr/index.css',
    files: '@fontsource-variable/noto-sans-kr/files/',
    text: chromeText.body,
  },
];

await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });

const files = [];
for (const { family, css, files: filesSpecifier, text } of sources) {
  const faces = parseFontFaces(await readFile(require.resolve(css), 'utf8'));
  for (const face of facesCovering(faces, text)) {
    const characters = charactersCoveredBy(face, text);
    const input = await readFile(
      require.resolve(`${filesSpecifier}${face.file}`),
    );
    const output = await subsetFont(input, characters, {
      targetFormat: 'woff2',
    });
    await writeFile(path.join(outDir, face.file), output);
    files.push({ file: face.file, family, characters, bytes: output.length });
    process.stdout.write(
      `${face.file}\t${input.length}→${output.length} bytes\t${characters}\n`,
    );
  }
}

await writeFile(
  path.join(outDir, 'manifest.json'),
  `${JSON.stringify({ text: chromeText, files }, null, 2)}\n`,
);
process.stdout.write(
  `wrote ${(await readdir(outDir)).length} files to ${outDir}\n`,
);
