import curve from './moon-light-curve.json';

export type MoonPhase = 'intro' | 'loop';

/** The measured v8 light curve, shared by the moon and cloud illumination. */
export function moonLightAt(time: number, phase: MoonPhase): number {
  const seconds =
    phase === 'loop' ? curve.loopStart + (time % curve.loopDuration) : time;
  const frame = Math.max(
    0,
    Math.min(seconds * curve.fps, curve.values.length - 1),
  );
  const index = Math.floor(frame);
  const a = curve.values[index] ?? 0;
  const b = curve.values[index + 1] ?? a;
  return a + (b - a) * (frame - index);
}
