const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
export const formatPrice = (n) => fmt.format(n);

export const CATEGORY_LABELS = {
  electronics: 'Electronics',
  jewelery: 'Jewellery',
  "men's clothing": "Men's Clothing",
  "women's clothing": "Women's Clothing",
};
export const categoryLabel = (c) => CATEGORY_LABELS[c] || c;

export const SORT_OPTIONS = [
  { value: '', label: 'Featured' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
];

/** Build a listing URL from query params, dropping empty values and page 1. */
export function listingHref({ category = '', q = '', sort = '', page = 1 } = {}) {
  const p = new URLSearchParams();
  if (category) p.set('category', category);
  if (q) p.set('q', q);
  if (sort) p.set('sort', sort);
  if (Number(page) > 1) p.set('page', String(page));
  const s = p.toString();
  return s ? `/products?${s}` : '/products';
}
