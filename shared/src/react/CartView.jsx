'use client';
import { useEffect, useState } from 'react';
import { getCart, subscribe, updateQuantity, removeFromCart, clearCart, cartTotals } from '../cart.js';
import { checkout } from '../api.js';
import { formatPrice } from '../format.js';

export default function CartView({ Link }) {
  const [items, setItems] = useState(null); // null until read from localStorage (client only)
  const [status, setStatus] = useState({ state: 'idle' });

  useEffect(() => {
    setItems(getCart());
    return subscribe(setItems);
  }, []);

  const placeOrder = async () => {
    setStatus({ state: 'loading' });
    try {
      const order = await checkout(items);
      clearCart();
      setStatus({ state: 'done', id: order.id });
    } catch {
      setStatus({ state: 'error' });
    }
  };

  if (items === null) return <div className="container page"><h1 className="page__title">Your cart</h1><div className="cart-skeleton" /></div>;

  if (status.state === 'done')
    return (
      <div className="container page">
        <h1 className="page__title">Order placed</h1>
        <p>Thank you! Your order reference is <strong>#{status.id}</strong>.</p>
        <Link href="/products" className="btn">Continue shopping</Link>
      </div>
    );

  if (items.length === 0)
    return (
      <div className="container page">
        <h1 className="page__title">Your cart</h1>
        <p className="empty">Your cart is empty.</p>
        <Link href="/products" className="btn">Browse products</Link>
      </div>
    );

  const t = cartTotals(items);
  return (
    <div className="container page">
      <h1 className="page__title">Your cart</h1>
      <div className="cart">
        <ul className="cart__items">
          {items.map((i) => (
            <li key={i.id} className="cart__item">
              <img src={i.image} alt="" width="80" height="80" />
              <div className="cart__meta">
                <Link href={`/product/${i.id}`} className="cart__title">{i.title}</Link>
                <span className="muted">{formatPrice(i.price)} each</span>
                <button type="button" className="link-btn" onClick={() => removeFromCart(i.id)}>Remove</button>
              </div>
              <div className="qty" role="group" aria-label={`Quantity for ${i.title}`}>
                <button type="button" onClick={() => updateQuantity(i.id, i.quantity - 1)} aria-label="Decrease quantity">−</button>
                <span>{i.quantity}</span>
                <button type="button" onClick={() => updateQuantity(i.id, i.quantity + 1)} aria-label="Increase quantity">+</button>
              </div>
              <strong className="cart__line">{formatPrice(i.price * i.quantity)}</strong>
            </li>
          ))}
        </ul>
        <aside className="summary">
          <h2>Order summary</h2>
          <dl>
            <div><dt>Subtotal</dt><dd>{formatPrice(t.subtotal)}</dd></div>
            <div><dt>Shipping</dt><dd>{t.shipping === 0 ? 'Free' : formatPrice(t.shipping)}</dd></div>
            <div><dt>Tax (10%)</dt><dd>{formatPrice(t.tax)}</dd></div>
            <div className="summary__total"><dt>Total</dt><dd>{formatPrice(t.total)}</dd></div>
          </dl>
          <button type="button" className="btn btn--block" onClick={placeOrder} disabled={status.state === 'loading'}>
            {status.state === 'loading' ? 'Placing order…' : 'Checkout'}
          </button>
          {status.state === 'error' && <p className="error">Checkout failed. Please try again.</p>}
        </aside>
      </div>
    </div>
  );
}
