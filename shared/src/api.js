// FakeStore API client (https://fakestoreapi.com), shared by all implementations.
// Works in the browser and on the server (Node 18+ fetch).
// Bundlers replace process.env.API_URL at build time; Next.js reads it on the server.
export const API_URL = process.env.API_URL || 'https://fakestoreapi.com';

async function get(path, init) {
  const res = await fetch(`${API_URL}${path}`, init);
  if (!res.ok) throw new Error(`FakeStore API ${res.status} for ${path}`);
  return res.json();
}

export const getAllProducts = (init) => get('/products', init);
export const getCategories = (init) => get('/products/categories', init);
export const getProduct = (id, init) => get(`/products/${id}`, init);
export const getProductsByCategory = (category, init) =>
  get(`/products/category/${encodeURIComponent(category)}`, init);

/** Products for the listing page: the whole catalogue or a single category. */
export const getListingProducts = (category, init) =>
  category ? getProductsByCategory(category, init) : getAllProducts(init);

/** Home page "featured" carousel: the top-rated products. */
export async function getFeatured(limit = 8, init) {
  const all = await getAllProducts(init);
  return [...all].sort((a, b) => b.rating.rate - a.rating.rate).slice(0, limit);
}

/**
 * FakeStore has no search, price sort or pagination endpoints, so the listing page
 * fetches the (small) catalogue and applies these in the app. Pure function, so
 * the same logic runs in the browser (A, B) and on the server (C).
 */
export function queryProducts(products, { q = '', sort = '', page = 1, pageSize = 8 } = {}) {
  let list = products;
  if (q) {
    const term = q.toLowerCase();
    list = list.filter((p) => p.title.toLowerCase().includes(term) || p.description.toLowerCase().includes(term));
  }
  if (sort === 'price-asc') list = [...list].sort((a, b) => a.price - b.price);
  if (sort === 'price-desc') list = [...list].sort((a, b) => b.price - a.price);
  if (sort === 'rating') list = [...list].sort((a, b) => b.rating.rate - a.rating.rate);

  const totalPages = Math.max(1, Math.ceil(list.length / pageSize));
  const current = Math.min(Math.max(1, Number(page) || 1), totalPages);
  const start = (current - 1) * pageSize;
  return { items: list.slice(start, start + pageSize), total: list.length, page: current, pageSize, totalPages };
}

/** Checkout: FakeStore accepts POST /carts and echoes the cart back with an id. */
export async function checkout(items) {
  const res = await fetch(`${API_URL}/carts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: 1,
      date: new Date().toISOString().slice(0, 10),
      products: items.map((i) => ({ productId: i.id, quantity: i.quantity })),
    }),
  });
  if (!res.ok) throw new Error('Checkout failed');
  return res.json();
}
