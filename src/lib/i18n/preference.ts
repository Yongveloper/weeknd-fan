/**
 * Remembering the reader's edition.
 *
 * The site is static, so nothing on the server knows who is asking. The only
 * place a choice can live is the reader's own browser, and the only moment it
 * can be acted on is before the page paints — which is why this ships as a
 * string, inlined into <head>, rather than as a module. A bundled module is
 * deferred until after parsing, and the reader would watch the korean page
 * render and then jump.
 *
 * It is deliberately narrow:
 *
 * - Nothing is stored until the reader clicks the switcher. A first visit is
 *   korean, whatever the browser's language is, so a shared link opens as its
 *   sender saw it.
 * - `location.replace`, not `assign`: the redirect must not sit in history,
 *   or Back would land on the page that redirects and bounce forward again.
 * - Every storage access is wrapped. `localStorage` throws outright in some
 *   privacy modes, and an exception here would take the whole page down.
 */

export const LOCALE_PREFERENCE_KEY = 'into-dawn:locale';

/** Inlined into <head> by BaseLayout. Tested in tests/unit/i18n-preference.test.ts. */
export const localePreferenceScript = `(function () {
  var KEY = ${JSON.stringify(LOCALE_PREFERENCE_KEY)};
  function read() {
    try {
      return localStorage.getItem(KEY);
    } catch (error) {
      return null;
    }
  }
  var want = read();
  if (want === 'en' || want === 'ko') {
    var path = location.pathname;
    var isEnglish = path === '/en' || path.indexOf('/en/') === 0;
    var target = null;
    if (want === 'en' && !isEnglish) target = '/en' + path;
    else if (want === 'ko' && isEnglish) target = path.slice(3) || '/';
    if (target) {
      location.replace(target + location.search + location.hash);
      return;
    }
  }
  document.addEventListener('click', function (event) {
    var target = event.target;
    if (!target || !target.closest) return;
    var link = target.closest('a[hreflang]');
    if (!link) return;
    var picked = link.getAttribute('hreflang');
    if (picked !== 'en' && picked !== 'ko') return;
    try {
      localStorage.setItem(KEY, picked);
    } catch (error) {}
  });
})();`;
