'use client';
import { useState } from 'react';
import { addToCart } from '../cart.js';

export default function AddToCart({ product }) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const add = () => {
    addToCart({ id: product.id, title: product.title, price: product.price, image: product.image }, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };
  return (
    <div className="add-to-cart">
      <div className="qty" role="group" aria-label="Quantity">
        <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease quantity">−</button>
        <span aria-live="polite">{qty}</span>
        <button type="button" onClick={() => setQty((q) => q + 1)} aria-label="Increase quantity">+</button>
      </div>
      <button type="button" className="btn" onClick={add}>
        {added ? 'Added ✓' : 'Add to cart'}
      </button>
    </div>
  );
}
