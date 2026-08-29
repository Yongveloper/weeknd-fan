export {};

const scenes = document.querySelectorAll<HTMLElement>(
  '[data-motion-scene-enter]',
);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!reduce && scenes.length > 0) {
  const { inView } = await import('motion');
  document.documentElement.dataset.motionReady = 'true';

  for (const scene of scenes) {
    const stop = inView(
      scene,
      () => {
        scene.dataset.motionState = 'entered';
        stop();
      },
      { amount: 0.35 },
    );
  }
}
