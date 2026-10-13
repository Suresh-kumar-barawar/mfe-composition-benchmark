/**
 * FakeStore API mock (https://fakestoreapi.com), used instead of the live API when we need
 * controlled, repeatable benchmarks (the live API sits behind a bot check that blocks cloud
 * and CI machines, and its latency varies). Same routes and JSON shapes as FakeStore:
 *
 *   GET  /products                       all 20 products (snapshot taken 14 Oct 2026)
 *   GET  /products/categories            the 4 categories
 *   GET  /products/:id                   one product (unknown id -> 200 with an empty body, like FakeStore)
 *   GET  /products/category/:category    products of one category
 *   POST /carts                          echoes the cart back with an id (like FakeStore)
 *   GET  /img/<file>.png                 synthetic product images: same file name, pixel size and
 *                                        byte size (+-0.5 %) as FakeStore's images
 *
 * Environment:
 *   MOCK_PUBLIC_URL  base URL written into product image links (default: the request's own origin)
 *   MOCK_DELAY_MS    optional artificial processing delay per API response (default 0)
 */
const path = require('path');
const express = require('express');
const compression = require('compression');

const products = require('./data/products.json');
const categories = require('./data/categories.json');

const DELAY = Number(process.env.MOCK_DELAY_MS || 0);
const app = express();
app.disable('x-powered-by');
app.use(compression());
app.use((req, res, next) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  // On Vercel the function may receive the path with an /api prefix.
  if (req.url.startsWith('/api/')) req.url = req.url.slice(4);
  next();
});
app.use('/img', express.static(path.join(__dirname, 'public', 'img'), { maxAge: '4h' })); // FakeStore: max-age=14400

const base = (req) => (process.env.MOCK_PUBLIC_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
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
app.get('/', (req, res) => res.type('text').send('FakeStore API mock – see /products'));

module.exports = app;
