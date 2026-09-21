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

/** Resolves once the hero's moon video is playing (`intro` or `loop`). */
function moonPlaying(moon: HTMLElement, signal: AbortSignal): Promise<void> {
  const playing = () =>
    moon.dataset.phase === 'intro' || moon.dataset.phase === 'loop';
  return new Promise((resolve) => {
    if (playing()) return resolve();
    const observer = new MutationObserver(() => {
      if (!playing()) return;
      observer.disconnect();
      if (!signal.aborted) resolve();
    });
    observer.observe(moon, { attributeFilter: ['data-phase'] });
    signal.addEventListener('abort', () => observer.disconnect(), {
      once: true,
    });
  });
}

class DawnSky extends HTMLElement {
  private abort?: AbortController;
  private renderer?: DawnRenderer;
  private reduced = matchMedia('(prefers-reduced-motion: reduce)');
  private observer?: IntersectionObserver;
  private generation = 0;
  private coverVisible = true;
  private focused = true;

  connectedCallback() {
    this.abort = new AbortController();
    const { signal } = this.abort;
    this.reduced.addEventListener('change', () => void this.configure(), {
      signal,
    });
    document.addEventListener('visibilitychange', () => this.syncPlayback(), {
      signal,
    });
    // A window left behind another application stays "visible" to the
    // document, yet nobody watches its clouds drift. Rest while the window
    // has no focus and resume the moment it is brought back.
    window.addEventListener(
      'blur',
      () => {
        this.focused = false;
        this.syncPlayback();
      },
      { signal },
    );
    window.addEventListener(
      'focus',
      () => {
        this.focused = true;
        this.syncPlayback();
      },
      { signal },
    );
    // The cover sky scrolls away with the hero. Once the hero has left the
    // viewport there is nothing of it to draw, and the fixed reading sky is
    // already running behind the programme sheet.
    const hero = this.closest('[data-home-hero]');
    if (hero) {
      this.observer = new IntersectionObserver(
        ([entry]) => {
          this.coverVisible = entry?.isIntersecting ?? true;
          this.syncPlayback();
        },
        { rootMargin: '25% 0px' },
      );
      this.observer.observe(hero);
    }
    void this.configure();
  }

  disconnectedCallback() {
    this.generation++;
    this.abort?.abort();
    this.observer?.disconnect();
    this.renderer?.dispose();
  }

  /**
   * The renderer boots after `load` and an idle slot, so its chunk, texture
   * decode and shader compile stay clear of the page's critical path. The
   * cover has one more trigger: the moon. Its video starts as soon as it has
   * buffered, well before `load` on a first visit over a fast network, and
   * the clouds are meant to arrive with it, not seconds later once every
   * font has landed. Whichever signal comes first boots the cover.
   */
  private readyToBoot(signal: AbortSignal): Promise<void> {
    const idle = afterLoadIdle(signal);
    const moon =
      this.closest('[data-home-hero]')?.querySelector<HTMLElement>(
        'moon-light',
      );
    return moon ? Promise.race([idle, moonPlaying(moon, signal)]) : idle;
  }

  private async configure() {
    const generation = ++this.generation;
    this.renderer?.dispose();
    this.renderer = undefined;
    delete this.dataset.renderer;
    this.dataset.state = 'still';
    if (this.reduced.matches) return;
    this.dataset.state = 'loading';
    if (this.abort) await this.readyToBoot(this.abort.signal);
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
    this.renderer?.setPlaying(
      !document.hidden &&
        this.focused &&
        !this.reduced.matches &&
        this.coverVisible,
    );
  }
}

if (!customElements.get('dawn-sky')) customElements.define('dawn-sky', DawnSky);
