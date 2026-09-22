'use client';
import { useEffect, useState } from 'react';
import { cartCount, getCart, subscribe } from '../cart.js';

export default function CartBadge({ Link }) {
  // Start at 0 so server and client render the same markup (no hydration mismatch in C).
  const [count, setCount] = useState(0);
  useEffect(() => {
    setCount(cartCount(getCart()));
    return subscribe((items) => setCount(cartCount(items)));
  }, []);
  return (
    <Link href="/cart" className="cart-link" aria-label={`Cart, ${count} items`}>
      Cart <span className="badge">{count}</span>
    </Link>
  );
}
