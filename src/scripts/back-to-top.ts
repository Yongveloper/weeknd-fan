class BackToTop extends HTMLElement {
  #button: HTMLButtonElement | null = null;
  #main: HTMLElement | null = null;
  #controller: AbortController | null = null;
  #frame = 0;

  connectedCallback() {
    this.#button = this.querySelector<HTMLButtonElement>('[data-back-to-top]');
    this.#main = document.querySelector<HTMLElement>('main');
    if (!this.#button || !this.#main) return;

    this.#controller = new AbortController();
    const { signal } = this.#controller;
    this.#button.addEventListener('click', this.#returnToTop, { signal });
    addEventListener('scroll', this.#scheduleVisibilityUpdate, {
      passive: true,
      signal,
    });
    addEventListener('resize', this.#scheduleVisibilityUpdate, {
      passive: true,
      signal,
    });
    this.#updateVisibility();
  }

  disconnectedCallback() {
    this.#controller?.abort();
    this.#controller = null;
    cancelAnimationFrame(this.#frame);
    this.#frame = 0;
  }

  #returnToTop = () => {
    this.#main?.focus({ preventScroll: true });
    window.scrollTo({
      top: 0,
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'auto'
        : 'smooth',
    });
  };

  #updateVisibility = () => {
    this.#frame = 0;
    if (!this.#button) return;
    const pastFirstViewport = window.scrollY > window.innerHeight;
    this.#button.hidden =
      !pastFirstViewport && document.activeElement !== this.#button;
  };

  #scheduleVisibilityUpdate = () => {
    if (this.#frame !== 0) return;
    this.#frame = requestAnimationFrame(this.#updateVisibility);
  };
}

if (!customElements.get('back-to-top')) {
  customElements.define('back-to-top', BackToTop);
}
