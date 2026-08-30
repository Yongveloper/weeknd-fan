export {};

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const running = new WeakMap<HTMLDetailsElement, Animation>();

function readToken(name: string, fallback: string) {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return value || fallback;
}

function setLabel(details: HTMLDetailsElement, open: boolean) {
  const label = details.querySelector<HTMLElement>(
    ':scope > summary .disclosure__label',
  );
  if (!label) return;
  const next = open ? label.dataset.labelOpen : label.dataset.labelClosed;
  if (next) label.textContent = next;
}

function finish(
  details: HTMLDetailsElement,
  panel: HTMLElement,
  willOpen: boolean,
) {
  running.delete(details);
  panel.style.removeProperty('height');
  panel.style.removeProperty('overflow');
  if (panel.getAttribute('style') === '') panel.removeAttribute('style');
  if (!willOpen) details.open = false;
  delete details.dataset.closing;
  details.dataset.state = willOpen ? 'open' : 'closed';
}

function animatePanel(
  details: HTMLDetailsElement,
  panel: HTMLElement,
  from: number,
  to: number,
  willOpen: boolean,
  fromOpacity: number,
) {
  panel.style.overflow = 'hidden';
  panel.style.height = `${from}px`;
  const animation = panel.animate(
    [
      { height: `${from}px`, opacity: willOpen ? fromOpacity : 1 },
      { height: `${to}px`, opacity: willOpen ? 1 : 0 },
    ],
    {
      duration: parseFloat(readToken('--motion-scene', '620ms')),
      easing: readToken('--ease-cinematic', 'ease-out'),
    },
  );
  running.set(details, animation);
  animation.onfinish = () => finish(details, panel, willOpen);
  animation.oncancel = () => running.delete(details);
}

if (!reduceMotion.matches) {
  document
    .querySelectorAll<HTMLDetailsElement>('details[data-disclosure][open]')
    .forEach((details) => setLabel(details, true));
}

document.addEventListener('click', (event) => {
  if (reduceMotion.matches) return;
  const summary = (event.target as Element | null)?.closest('summary');
  const details = summary?.parentElement;
  if (
    !(details instanceof HTMLDetailsElement) ||
    !details.hasAttribute('data-disclosure')
  )
    return;
  const panel = details.querySelector<HTMLElement>(
    ':scope > .disclosure__panel',
  );
  if (!panel) return;

  event.preventDefault();
  const currentHeight = panel.getBoundingClientRect().height;
  const fromOpacity = Number(getComputedStyle(panel).opacity) || 0;
  running.get(details)?.cancel();

  if (details.open && details.dataset.closing !== 'true') {
    details.dataset.closing = 'true';
    setLabel(details, false);
    animatePanel(details, panel, currentHeight, 0, false, fromOpacity);
    return;
  }

  delete details.dataset.closing;
  details.open = true;
  setLabel(details, true);
  panel.style.height = 'auto';
  const target = panel.scrollHeight;
  animatePanel(details, panel, currentHeight, target, true, fromOpacity);
});
