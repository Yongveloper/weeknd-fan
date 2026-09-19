// Re-encodes the moon hero video for viewports at or below 42rem (672px). The
// moon occupies 0.68 × viewport width there, so 720×720 covers 3× DPR phones.
// Run once after the source videos change:  node scripts/build-compact-moon-video.mjs
import { execFileSync } from 'node:child_process';
import { statSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = path.resolve('public/visual/moon-v8');
const encodes = [
  ['intro.mp4', 'intro-720.mp4'],
  ['loop.mp4', 'loop-720.mp4'],
];

for (const [source, target] of encodes) {
  const input = path.join(root, source);
  const output = path.join(root, target);
  execFileSync(
    'ffmpeg',
    [
      '-y',
      '-i',
      input,
      '-vf',
      'scale=720:720:flags=lanczos',
      '-c:v',
      'libx264',
      '-profile:v',
      'high',
      '-preset',
      'slow',
      '-crf',
      '27',
      '-pix_fmt',
      'yuv420p',
      '-movflags',
      '+faststart',
      '-an',
      output,
    ],
    { stdio: 'inherit' },
  );
  const kib = (statSync(output).size / 1024).toFixed(1);
  process.stdout.write(`${target}\t${kib}KiB\n`);
}
