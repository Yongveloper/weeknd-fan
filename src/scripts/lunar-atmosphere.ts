import { atmosphereAt } from '../lib/moon-light';

class LunarAtmosphere extends HTMLElement {
  private abort?: AbortController;
  private resize?: ResizeObserver;
  private raf?: number;

  connectedCallback() {
    this.abort = new AbortController();
    const { signal } = this.abort;
    const schedule = () => {
      if (this.raf !== undefined) return;
      this.raf = requestAnimationFrame(() => {
        this.raf = undefined;
        this.update();
      });
    };
    window.addEventListener('scroll', schedule, { passive: true, signal });
    window.addEventListener('resize', schedule, { passive: true, signal });
    this.resize = new ResizeObserver(schedule);
    this.resize.observe(document.body);
    this.update();
  }

  disconnectedCallback() {
    this.abort?.abort();
    this.resize?.disconnect();
    if (this.raf !== undefined) cancelAnimationFrame(this.raf);
  }

  private update() {
    const range = document.documentElement.scrollHeight - window.innerHeight;
    const progress = range > 0 ? window.scrollY / range : 0;
    const state = atmosphereAt();
    this.dataset.progress = progress.toFixed(4);
    this.style.setProperty('--cloud-opacity', state.cloud.toFixed(4));
    this.style.setProperty('--dense-opacity', state.dense.toFixed(4));
    this.style.setProperty('--scroll-light', state.light.toFixed(4));
    const moon = document.querySelector<HTMLElement>('moon-light');
    moon?.style.setProperty('opacity', state.moon.toFixed(4));
    document
      .querySelector<HTMLElement>('[data-moon-occlusion]')
      ?.style.setProperty('opacity', state.moon.toFixed(4));
  }
}
if (!customElements.get('lunar-atmosphere'))
  customElements.define('lunar-atmosphere', LunarAtmosphere);
