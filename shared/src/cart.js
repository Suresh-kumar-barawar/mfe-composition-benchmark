// Framework-agnostic cart store.
// Micro frontends should not share in-memory state directly, so the cart is kept in
// localStorage and every change is broadcast as a DOM CustomEvent ("cart:updated").
// The header badge, the PDP add-to-cart button and the cart page subscribe independently.

const KEY = 'mfe-cart';
const EVENT = 'cart:updated';
const isBrowser = typeof window !== 'undefined';

export function getCart() {
  if (!isBrowser) return [];
  try {
    return JSON.parse(window.localStorage.getItem(KEY)) || [];
  } catch {
    return [];
  }
}

function save(items) {
  if (!isBrowser) return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    /* storage unavailable (e.g. private mode) */
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: items }));
}

export function addToCart(product, quantity = 1) {
  const items = getCart();
  const existing = items.find((i) => i.id === product.id);
  if (existing) existing.quantity += quantity;
  else items.push({ id: product.id, title: product.title, price: product.price, image: product.image, quantity });
  save(items);
}

export function updateQuantity(id, quantity) {
  save(getCart().map((i) => (i.id === id ? { ...i, quantity } : i)).filter((i) => i.quantity > 0));
}

export const removeFromCart = (id) => save(getCart().filter((i) => i.id !== id));
export const clearCart = () => save([]);
export const cartCount = (items = getCart()) => items.reduce((n, i) => n + i.quantity, 0);

export function cartTotals(items = getCart()) {
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const shipping = subtotal === 0 || subtotal >= 100 ? 0 : 7.99;
  const tax = subtotal * 0.1;
  return { subtotal, shipping, tax, total: subtotal + shipping + tax };
}

/** Subscribe to cart changes (including changes from other tabs). Returns an unsubscribe fn. */
export function subscribe(callback) {
  if (!isBrowser) return () => {};
  const onLocal = (e) => callback(e.detail);
  const onStorage = (e) => e.key === KEY && callback(getCart());
  window.addEventListener(EVENT, onLocal);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(EVENT, onLocal);
    window.removeEventListener('storage', onStorage);
  };
}
