import { moonLightAt, type MoonPhase } from '../lib/moon-light';

class MoonLight extends HTMLElement {
  private abort?: AbortController;
  private frameVideo?: HTMLVideoElement;
  private frameId?: number;
  private animationId?: number;
  private phase: MoonPhase = 'intro';
  private switching = false;
  private reduced = matchMedia('(prefers-reduced-motion: reduce)');
  private hero?: HTMLElement;
  private atmosphere?: HTMLElement;
  private observer?: IntersectionObserver;
  private visible = true;

  connectedCallback() {
    this.abort = new AbortController();
    this.hero = this.closest<HTMLElement>('[data-home-hero]') ?? undefined;
    this.atmosphere =
      document.querySelector<HTMLElement>('lunar-atmosphere') ?? undefined;
    this.observer = new IntersectionObserver(([entry]) => {
      this.visible = entry?.isIntersecting ?? false;
      if (this.visible && !document.hidden && !this.reduced.matches)
        void this.start();
      else {
        this.setPaused(true);
        this.stopFrames();
        this.intro.pause();
        this.loop.pause();
      }
    });
    if (this.hero) this.observer.observe(this.hero);
    const { signal } = this.abort;
    // Each line takes four seconds to arrive: AFTER HOURS starts at two
    // seconds, TIL DAWN at four. Video loading does not control these delays.
    if (this.hero?.dataset.titlePhase === 'waiting')
      this.hero.dataset.titlePhase = 'revealing';
    this.hero?.querySelector('.home-hero__heading')?.addEventListener(
      'animationend',
      (event) => {
        if (
          (event as AnimationEvent).animationName === 'dawn-title-arrive' &&
          event.target === this.hero?.querySelector('.home-hero__dawn') &&
          this.hero?.dataset.titlePhase === 'revealing'
        )
          this.hero.dataset.titlePhase = 'shown';
      },
      { signal },
    );
    this.intro.addEventListener('ended', () => void this.switchToLoop(), {
      signal,
    });
    this.intro.addEventListener(
      'timeupdate',
      () => {
        if (this.intro.currentTime > 20) this.load(this.loop);
      },
      { signal },
    );
    for (const video of [this.intro, this.loop]) {
      video.addEventListener('error', () => this.poster(), { signal });
      // With <source>, an unavailable file reports its error on the source.
      const source = video.querySelector('source');
      source?.addEventListener(
        'error',
        () => {
          // The deferred loop has no src yet; that empty candidate is not a
          // failed asset and must not interrupt the valid intro on mobile.
          if (
            source.hasAttribute('src') &&
            video.networkState === HTMLMediaElement.NETWORK_NO_SOURCE
          )
            this.poster();
        },
        { signal },
      );
    }
    document.addEventListener(
      'visibilitychange',
      () => {
        const hidden = document.hidden;
        this.closest<HTMLElement>('[data-home-hero]')?.setAttribute(
          'data-paused',
          String(hidden),
        );
        this.setPaused(hidden);
        if (hidden) {
          this.stopFrames();
          this.intro.pause();
          this.loop.pause();
        } else if (!this.reduced.matches) void this.start();
      },
      { signal },
    );
    this.reduced.addEventListener(
      'change',
      () => {
        this.setPaused(document.hidden || this.reduced.matches);
        if (this.reduced.matches) this.poster();
        else void this.start();
      },
      { signal },
    );
    if (this.reduced.matches) this.poster();
    else void this.start();
  }

  disconnectedCallback() {
    this.abort?.abort();
    this.stopFrames();
    this.observer?.disconnect();
    this.intro.pause();
    this.loop.pause();
  }

  private get intro() {
    return this.querySelector<HTMLVideoElement>('[data-intro]')!;
  }
  private get loop() {
    return this.querySelector<HTMLVideoElement>('[data-loop]')!;
  }

  private load(video: HTMLVideoElement) {
    const source = video.querySelector('source');
    if (!source || source.hasAttribute('src')) return;
    source.src = source.dataset.src ?? '';
    video.muted = true;
    video.preload = 'auto';
    video.load();
  }

  private setLight(value: number) {
    this.dataset.light = value.toFixed(4);
    const atmosphere = this.atmosphere;
    atmosphere?.style.setProperty('--moon-light', value.toFixed(4));
    if (atmosphere) atmosphere.dataset.light = value.toFixed(4);
    this.hero?.style.setProperty(
      '--scene-energy',
      Math.max(0, Math.min(value, 1)).toFixed(4),
    );
    // Keep the base title outline steady; only its faint reflected light changes.
    this.hero?.style.setProperty(
      '--dawn-glow',
      (0.08 + 0.1 * Math.max(0, Math.min(value, 1))).toFixed(4),
    );
  }

  private setPaused(paused: boolean) {
    if (this.atmosphere) this.atmosphere.dataset.paused = String(paused);
    if (this.hero) this.hero.dataset.dawnPaused = String(paused);
  }

  private async start() {
    if (
      document.hidden ||
      !this.visible ||
      this.reduced.matches ||
      !this.isConnected
    )
      return;
    this.setPaused(false);
    this.dataset.fallback = 'false';
    if (this.dataset.phase === 'poster') {
      this.dataset.phase = 'loading';
      this.setLight(0);
    }
    const video = this.phase === 'intro' ? this.intro : this.loop;
    this.load(video);
    // The unmodified source reveals its rim over its first seven seconds.
    // Native playback preserves that full reveal instead of compressing it.
    video.playbackRate = this.phase === 'intro' ? 1 : 1.35;
    try {
      await video.play();
      if (
        !this.isConnected ||
        !this.visible ||
        this.reduced.matches ||
        document.hidden
      ) {
        video.pause();
        return;
      }
      this.dataset.phase = this.phase;
      this.watchFrames(video);
    } catch {
      this.poster();
    }
  }

  private stopFrames() {
    if (this.frameId !== undefined)
      this.frameVideo?.cancelVideoFrameCallback(this.frameId);
    if (this.animationId !== undefined) cancelAnimationFrame(this.animationId);
    this.frameId = undefined;
    this.animationId = undefined;
  }

  private watchFrames(video: HTMLVideoElement) {
    this.stopFrames();
    this.frameVideo = video;
    const tick = () => {
      if (!this.isConnected || this.reduced.matches) return;
      this.setLight(moonLightAt(video.currentTime, this.phase));
      if ('requestVideoFrameCallback' in video)
        this.frameId = video.requestVideoFrameCallback(tick);
      else this.animationId = requestAnimationFrame(tick);
    };
    tick();
  }

  private async switchToLoop() {
    if (this.switching || this.reduced.matches) return;
    this.switching = true;
    this.load(this.loop);
    this.loop.playbackRate = 1.35;
    try {
      await this.loop.play();
      // Retain the final intro frame until the loop has a decoded frame to show.
      if ('requestVideoFrameCallback' in this.loop) {
        await new Promise<void>((resolve) =>
          this.loop.requestVideoFrameCallback(() => resolve()),
        );
      }
      if (
        !this.isConnected ||
        !this.visible ||
        this.reduced.matches ||
        document.hidden
      ) {
        this.loop.pause();
        return;
      }
      this.intro.pause();
      this.phase = 'loop';
      this.dataset.phase = 'loop';
      this.watchFrames(this.loop);
    } catch {
      this.poster();
    } finally {
      this.switching = false;
    }
  }

  private poster() {
    this.stopFrames();
    this.intro.pause();
    this.loop.pause();
    this.dataset.fallback = 'true';
    this.dataset.phase = 'poster';
    // Reduced motion and failed video playback show a complete readable hero.
    if (this.hero) this.hero.dataset.titlePhase = 'static';
    this.setLight(1);
    this.setPaused(true);
  }
}
if (!customElements.get('moon-light'))
  customElements.define('moon-light', MoonLight);
