export {};

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
type RunningAnimation = {
  animation: Animation;
  panel: HTMLElement;
};

const running = new WeakMap<HTMLDetailsElement, RunningAnimation>();

function readToken(name: string, fallback: string) {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return value || fallback;
}

function readDuration(name: string, fallbackMs: number) {
  const raw = readToken(name, `${fallbackMs}ms`);
  const n = parseFloat(raw);
  if (Number.isNaN(n)) return fallbackMs;
  return /ms\s*$/.test(raw) ? n : n * 1000;
}

function setLabel(details: HTMLDetailsElement, open: boolean) {
  const label = details.querySelector<HTMLElement>(
    ':scope > summary .disclosure__label',
  );
  if (!label) return;
  const next = open ? label.dataset.labelOpen : label.dataset.labelClosed;
  if (next) label.textContent = next;
}

function clearPanel(panel: HTMLElement) {
  panel.style.removeProperty('height');
  panel.style.removeProperty('overflow');
  if (panel.getAttribute('style') === '') panel.removeAttribute('style');
}

function cancelAnimation(details: HTMLDetailsElement) {
  const current = running.get(details);
  if (!current) return;
  running.delete(details);
  current.animation.cancel();
}

function settleWithoutMotion(details: HTMLDetailsElement) {
  const current = running.get(details);
  const panel =
    current?.panel ??
    details.querySelector<HTMLElement>(':scope > .disclosure__panel');
  const willOpen = details.open && details.dataset.closing !== 'true';

  cancelAnimation(details);
  details.open = willOpen;
  if (panel) clearPanel(panel);
  delete details.dataset.closing;
  delete details.dataset.state;
}

function finish(
  details: HTMLDetailsElement,
  panel: HTMLElement,
  willOpen: boolean,
  animation: Animation,
) {
  const current = running.get(details);
  if (!current || current.animation !== animation) return;
  running.delete(details);
  clearPanel(panel);
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
  motion: 'scene' | 'fast',
) {
  panel.style.overflow = 'hidden';
  panel.style.height = `${from}px`;
  // 패널은 border-box 라 height 가 0 이어도 padding 만큼 남는다(약 27px).
  // 닫힐 때 padding 도 0 으로 접어야 open=false 순간 점프가 없다. 열릴 때는 반대.
  const { paddingTop, paddingBottom } = getComputedStyle(panel);
  const openPad = { paddingTop, paddingBottom };
  const closedPad = { paddingTop: '0px', paddingBottom: '0px' };
  const animation = panel.animate(
    [
      {
        height: `${from}px`,
        opacity: willOpen ? fromOpacity : fromOpacity || 1,
        ...(willOpen ? closedPad : openPad),
      },
      {
        height: `${to}px`,
        opacity: willOpen ? 1 : 0,
        ...(willOpen ? openPad : closedPad),
      },
    ],
    {
      duration: readDuration(
        motion === 'fast' ? '--motion-fast' : '--motion-scene',
        motion === 'fast' ? 180 : 620,
      ),
      easing: readToken('--ease-cinematic', 'ease-out'),
    },
  );
  running.set(details, { animation, panel });
  animation.onfinish = () => finish(details, panel, willOpen, animation);
  animation.oncancel = () => {
    if (running.get(details)?.animation === animation) {
      running.delete(details);
    }
  };
}

if (!reduceMotion.matches) {
  document
    .querySelectorAll<HTMLDetailsElement>('details[data-disclosure][open]')
    .forEach((details) => setLabel(details, true));
}

reduceMotion.addEventListener('change', () => {
  if (reduceMotion.matches) {
    // A media-query change can happen during a panel animation. Snap every
    // disclosure to its intended state and remove WAAPI's inline footprint.
    document
      .querySelectorAll<HTMLDetailsElement>('details[data-disclosure]')
      .forEach(settleWithoutMotion);
    return;
  }

  document
    .querySelectorAll<HTMLDetailsElement>('details[data-disclosure][open]')
    .forEach((details) => setLabel(details, true));
});

document.addEventListener('click', (event) => {
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

  const motion = details.dataset.motion;
  if (reduceMotion.matches || motion === 'none') return;
  const mode = motion === 'fast' ? 'fast' : 'scene';

  event.preventDefault();
  // 닫힌 <details>의 내용은 Chromium에서 content-visibility: hidden 으로 감춰져
  // getBoundingClientRect 가 마지막 레이아웃 값을 돌려준다(0이 아님). 닫힌 상태는 0으로 고정.
  const currentHeight = details.open ? panel.getBoundingClientRect().height : 0;
  const fromOpacity = Number(getComputedStyle(panel).opacity) || 0;
  cancelAnimation(details);

  if (details.open && details.dataset.closing !== 'true') {
    details.dataset.closing = 'true';
    setLabel(details, false);
    animatePanel(details, panel, currentHeight, 0, false, fromOpacity, mode);
    return;
  }

  delete details.dataset.closing;
  details.open = true;
  setLabel(details, true);
  panel.style.height = 'auto';
  const target = panel.scrollHeight;
  animatePanel(details, panel, currentHeight, target, true, fromOpacity, mode);
});
