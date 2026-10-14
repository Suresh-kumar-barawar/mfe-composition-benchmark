/**
 * ShopMFE catalogue API – the data source for all three implementations.
 *
 * Data and product images are a copy of the open-source FakeStore API
 * (https://fakestoreapi.com, https://github.com/keikaavousi/fake-store-api), taken on
 * 14 Oct 2026 and served by us on the same routes with the same JSON. We host it ourselves
 * because the public fakestoreapi.com sits behind a bot check that blocks requests from cloud
 * and CI machines (GitHub Actions, Vercel), and its response time varies between runs.
 *
 *   GET  /products                       all 20 products
 *   GET  /products/categories            the 4 categories
 *   GET  /products/:id                   one product (unknown id -> 200 with an empty body, like FakeStore)
 *   GET  /products/category/:category    products of one category
 *   POST /carts                          echoes the cart back with an id (like FakeStore)
 *   GET  /img/<file>.png                 product images (FakeStore's originals)
 *
 * Environment:
 *   PUBLIC_URL      base URL written into product image links (default: the request's own origin)
 *   API_DELAY_MS    optional artificial processing delay per API response (default 0)
 */
const path = require('path');
const express = require('express');
const compression = require('compression');

const products = require('./data/products.json');
const categories = require('./data/categories.json');

const DELAY = Number(process.env.API_DELAY_MS || 0);
const app = express();
app.disable('x-powered-by');
app.use(compression());
app.use((req, res, next) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  // On Vercel every API route is rewritten to /api?__p=<original path> (see vercel.json):
  // restore the original path and query before routing.
  if (req.url === '/api' || req.url.startsWith('/api?') || req.url.startsWith('/api/')) {
    const u = new URL(req.url, 'http://local');
    const original = u.searchParams.get('__p');
    u.searchParams.delete('__p');
    const qs = u.searchParams.toString();
    req.url = (original ? encodeURI(original) : u.pathname.replace(/^\/api/, '') || '/') + (qs ? `?${qs}` : '');
    req.query = Object.fromEntries(u.searchParams);
  }
  next();
});
app.use('/img', express.static(path.join(__dirname, 'public', 'img'), { maxAge: '4h' })); // same as FakeStore: max-age=14400

const base = (req) => (process.env.PUBLIC_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
const withBase = (req, p) => ({ ...p, image: p.image.replace('{{BASE}}', base(req)) });
const send = (res, body) => setTimeout(() => (body === '' ? res.type('application/json').send('') : res.json(body)), DELAY);

app.set('trust proxy', true);
app.get('/products', (req, res) => {
  const limit = Number(req.query.limit) || undefined;
  let list = products.map((p) => withBase(req, p));
  if (req.query.sort === 'desc') list = list.reverse();
  send(res, limit ? list.slice(0, limit) : list);
});
app.get('/products/categories', (req, res) => send(res, categories));
app.get('/products/category/:category', (req, res) =>
  send(res, products.filter((p) => p.category === req.params.category).map((p) => withBase(req, p)))
);
app.get('/products/:id', (req, res) => {
  const p = products.find((x) => String(x.id) === req.params.id);
  send(res, p ? withBase(req, p) : '');
});
app.post('/carts', express.json(), (req, res) => send(res, { id: 11, ...req.body }));
app.get('/', (req, res) => res.type('text').send('ShopMFE catalogue API (data: FakeStore API) – see /products'));

module.exports = app;
