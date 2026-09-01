import {
  filterExpectedSetlist,
  type SetlistFilterState,
  type SetlistFilterable,
} from '../lib/setlist/filter';

type RowEntry = SetlistFilterable & { row: HTMLLIElement };

const root = document.querySelector<HTMLElement>('[data-setlist-filter]');
const list = document.querySelector<HTMLOListElement>('[data-setlist-list]');
const queryInput = root?.querySelector<HTMLInputElement>(
  '[data-setlist-query]',
);
const albumSelect = root?.querySelector<HTMLSelectElement>(
  '[data-setlist-album]',
);
const count = root?.querySelector<HTMLElement>('[data-setlist-count]');
const empty = root?.parentElement?.querySelector<HTMLElement>(
  '[data-setlist-empty]',
);
const reset = root?.querySelector<HTMLButtonElement>('[data-setlist-reset]');
const viewButtons = root
  ? [...root.querySelectorAll<HTMLButtonElement>('[data-setlist-view]')]
  : [];

if (root && list && queryInput && albumSelect && count && empty && reset) {
  root.hidden = false;
  const entries: RowEntry[] = [
    ...list.querySelectorAll<HTMLLIElement>(':scope > li'),
  ].map((row) => ({
    id: row.dataset.songId ?? '',
    row,
    data: {
      songTitle: row.dataset.songTitle ?? '',
      album: row.dataset.songAlbum ?? '',
      expectedOrder: Number(
        row.querySelector('summary')?.textContent?.trim().slice(0, 2),
      ),
      essentialOrder: row.dataset.essentialOrder
        ? Number(row.dataset.essentialOrder)
        : undefined,
    },
  }));
  const essentialAvailable = viewButtons.some(
    (button) => button.dataset.setlistView === 'essential',
  );
  let state: SetlistFilterState = { query: '', album: null, view: 'all' };
  let queryTimer: number | undefined;

  const readState = (): SetlistFilterState => {
    const params = new URLSearchParams(window.location.search);
    const view = params.get('view');
    return {
      query: params.get('q') ?? '',
      album: params.get('album') || null,
      view: essentialAvailable && view === 'essential' ? 'essential' : 'all',
    };
  };

  const writeState = (mode: 'push' | 'replace') => {
    const url = new URL(window.location.href);
    url.search = '';
    if (state.query) url.searchParams.set('q', state.query);
    if (state.album) url.searchParams.set('album', state.album);
    if (state.view !== 'all') url.searchParams.set('view', state.view);
    history[`${mode}State`](state, '', url);
  };

  const syncControls = () => {
    queryInput.value = state.query;
    albumSelect.value = state.album ?? '';
    for (const button of viewButtons) {
      button.setAttribute(
        'aria-pressed',
        String(button.dataset.setlistView === state.view),
      );
    }
  };

  const applyState = () => {
    const visible = filterExpectedSetlist(entries, state);
    const visibleIds = new Set(visible.map((entry) => entry.id));
    let shouldFocusCount = false;

    for (const entry of entries) {
      const hidden = !visibleIds.has(entry.id);
      if (hidden && entry.row.querySelector('details[open]')) {
        entry.row
          .querySelectorAll<HTMLDetailsElement>('details[open]')
          .forEach((details) => {
            details.open = false;
          });
        shouldFocusCount = true;
      }
      if (hidden && entry.row.contains(document.activeElement))
        shouldFocusCount = true;
      entry.row.hidden = hidden;
    }
    for (const entry of visible) list.append(entry.row);
    count.textContent = `${visible.length}곡 표시`;
    empty.hidden = visible.length !== 0;
    syncControls();
    if (shouldFocusCount) count.focus();
  };

  const setState = (
    next: SetlistFilterState,
    historyMode: 'push' | 'replace',
  ) => {
    state = next;
    applyState();
    writeState(historyMode);
  };

  state = readState();
  applyState();

  queryInput.addEventListener('input', () => {
    window.clearTimeout(queryTimer);
    state = { ...state, query: queryInput.value };
    applyState();
    queryTimer = window.setTimeout(() => writeState('replace'), 250);
  });
  albumSelect.addEventListener('change', () => {
    setState({ ...state, album: albumSelect.value || null }, 'push');
  });
  for (const button of viewButtons) {
    button.addEventListener('click', () => {
      const view = button.dataset.setlistView;
      if (view === 'all' || (view === 'essential' && essentialAvailable)) {
        setState({ ...state, view }, 'push');
      }
    });
  }
  reset.addEventListener('click', () => {
    window.clearTimeout(queryTimer);
    setState({ query: '', album: null, view: 'all' }, 'push');
  });
  window.addEventListener('popstate', () => {
    state = readState();
    applyState();
  });
}
