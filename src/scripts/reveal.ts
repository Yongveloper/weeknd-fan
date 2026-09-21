export {};

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!reduce) {
  document.documentElement.dataset.motionReady = 'true';

  const scenes = document.querySelectorAll<HTMLElement>(
    '[data-motion-scene-enter]',
  );
  if (scenes.length > 0) {
    const sceneObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          (entry.target as HTMLElement).dataset.motionState = 'entered';
          sceneObserver.unobserve(entry.target);
        }
      },
      { threshold: 0.2 },
    );
    scenes.forEach((scene) => sceneObserver.observe(scene));
  }

  // Reveal work is attached to containers only. In particular, a repeated
  // setlist row is marked with data-song-id and must never become its own
  // observer/animation target.
  const groups = document.querySelectorAll<HTMLElement>(
    '[data-enter-group]:not([data-song-id])',
  );
  for (const group of groups) {
    Array.from(group.children).forEach((child, index) => {
      (child as HTMLElement).style.setProperty('--enter-i', String(index));
    });
  }

  // Nodes inserted after load are never observed (static site, no
  // ClientRouter). Never combine data-enter and data-enter-group on the
  // same element — their opacity transitions would stack.
  const targets = document.querySelectorAll<HTMLElement>(
    '[data-enter]:not([data-enter="in"]):not([data-song-id]), [data-enter-group]:not([data-enter="in"]):not([data-song-id])',
  );
  if (targets.length > 0) {
    const enterObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          (entry.target as HTMLElement).dataset.enter = 'in';
          enterObserver.unobserve(entry.target);
        }
      },
      { threshold: 0, rootMargin: '0px 0px -10% 0px' },
    );
    targets.forEach((target) => enterObserver.observe(target));
  }
}
