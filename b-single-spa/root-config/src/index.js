/**
 * Single-SPA root config: registers every micro frontend with the URL that activates it.
 * Single-SPA mounts/unmounts apps as the URL changes; SystemJS fetches each app on first use.
 */
import '@mfe/shared/styles.css';
import { registerApplication, start, addErrorHandler } from 'single-spa';

const PAGE_APPS = [
  { name: '@shop/home', activeWhen: (l) => l.pathname === '/' },
  { name: '@shop/plp', activeWhen: (l) => l.pathname === '/products' },
  { name: '@shop/pdp', activeWhen: (l) => /^\/product\/[^/]+\/?$/.test(l.pathname) },
  { name: '@shop/cart', activeWhen: (l) => l.pathname === '/cart' },
];

// Header + footer are always mounted.
registerApplication({ name: '@shop/navbar', app: () => window.System.import('@shop/navbar'), activeWhen: () => true });
PAGE_APPS.forEach(({ name, activeWhen }) =>
  registerApplication({ name, app: () => window.System.import(name), activeWhen })
);

// ---- Error isolation: a failing app shows a message; the other apps keep running. ----
const errorBox = document.getElementById('mfe-error');
const notFound = document.getElementById('mfe-not-found');

addErrorHandler((err) => {
  const name = err.appOrParcelName;
  console.error(`[${name}] failed:`, err);
  if (name === '@shop/navbar') return;
  const short = name.replace('@shop/', '');
  errorBox.innerHTML =
    '<h2>This section is temporarily unavailable.</h2>' +
    `<p class="muted">The “${short}” micro frontend failed to load. The rest of the site still works.</p>`;
  errorBox.hidden = false;
});

window.addEventListener('single-spa:before-routing-event', () => {
  errorBox.hidden = true;
});
window.addEventListener('single-spa:routing-event', () => {
  notFound.hidden = PAGE_APPS.some((a) => a.activeWhen(window.location));
});

start({ urlRerouteOnly: true });
