import type { DawnRenderer } from './dawn-sky-renderer';

/** Resolves after the window `load` event, then on the next idle slot. */
function afterLoadIdle(signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const idle = () => {
      if (signal.aborted) return;
      if ('requestIdleCallback' in window)
        requestIdleCallback(
          () => {
            if (!signal.aborted) resolve();
          },
          { timeout: 1500 },
        );
      else
        setTimeout(() => {
          if (!signal.aborted) resolve();
        }, 0);
    };
    if (document.readyState === 'complete') idle();
    else window.addEventListener('load', idle, { once: true, signal });
  });
}

class DawnSky extends HTMLElement {
  private abort?: AbortController;
  private renderer?: DawnRenderer;
  private reduced = matchMedia('(prefers-reduced-motion: reduce)');
  private observer?: IntersectionObserver;
  private generation = 0;
  private fallbackFrame = 0;

  connectedCallback() {
    this.abort = new AbortController();
    const { signal } = this.abort;
    this.reduced.addEventListener('change', () => void this.configure(), {
      signal,
    });
    document.addEventListener('visibilitychange', () => this.syncPlayback(), {
      signal,
    });
    this.observer = new IntersectionObserver(([entry]) => {
      this.dataset.coverVisible = String(entry?.isIntersecting ?? false);
    });
    const hero = this.closest('[data-home-hero]');
    if (hero) this.observer.observe(hero);
    // The static/reduced-motion cover uses the same document anchoring as
    // the GPU scene; its independent reading fallback remains fixed below.
    const positionFallback = () => {
      this.fallbackFrame = 0;
      if (!hero) return;
      const readingStart = Math.max(0, hero.getBoundingClientRect().bottom);
      this.style.setProperty('--cover-shift', `${-window.scrollY}px`);
      this.style.setProperty('--reading-start', `${readingStart}px`);
    };
    const requestFallbackPosition = () => {
      if (!this.fallbackFrame)
        this.fallbackFrame = requestAnimationFrame(positionFallback);
    };
    window.addEventListener('scroll', requestFallbackPosition, {
      signal,
      passive: true,
    });
    window.addEventListener('resize', requestFallbackPosition, {
      signal,
      passive: true,
    });
    this.reduced.addEventListener('change', requestFallbackPosition, {
      signal,
    });
    positionFallback();
    void this.configure();
  }

  disconnectedCallback() {
    this.generation++;
    this.abort?.abort();
    this.observer?.disconnect();
    cancelAnimationFrame(this.fallbackFrame);
    this.renderer?.dispose();
  }

  private async configure() {
    const generation = ++this.generation;
    this.renderer?.dispose();
    this.renderer = undefined;
    delete this.dataset.renderer;
    this.dataset.state = 'still';
    if (this.reduced.matches) return;
    this.dataset.state = 'loading';
    if (this.abort) await afterLoadIdle(this.abort.signal);
    if (generation !== this.generation || !this.isConnected) return;
    try {
      const { createDawnRenderer } = await import('./dawn-sky-renderer');
      if (generation !== this.generation || !this.isConnected) return;
      const canvas = this.nextElementSibling;
      const clouds = this.querySelector<HTMLCanvasElement>('.dawn-sky__clouds');
      if (!(canvas instanceof HTMLCanvasElement) || !clouds) return;
      const renderer = await createDawnRenderer(clouds, canvas, this);
      if (generation !== this.generation || !this.isConnected) {
        renderer.dispose();
        return;
      }
      this.renderer = renderer;
      this.syncPlayback();
    } catch {
      // The complete CSS scene stays visible without WebGL or its texture.
      delete this.dataset.renderer;
      this.dataset.state = 'still';
    }
  }

  private syncPlayback() {
    this.renderer?.setPlaying(!document.hidden && !this.reduced.matches);
  }
}

if (!customElements.get('dawn-sky')) customElements.define('dawn-sky', DawnSky);
