'use client';
import { useRef } from 'react';

/** Horizontal scroll carousel. Items are passed as children so they can be server-rendered in C. */
export default function Carousel({ title, children }) {
  const track = useRef(null);
  const scroll = (dir) => track.current?.scrollBy({ left: dir * track.current.clientWidth * 0.8, behavior: 'smooth' });
  return (
    <section className="section">
      <div className="section__head">
        <h2 className="section__title">{title}</h2>
        <div className="carousel__controls">
          <button type="button" className="icon-btn" onClick={() => scroll(-1)} aria-label="Previous">‹</button>
          <button type="button" className="icon-btn" onClick={() => scroll(1)} aria-label="Next">›</button>
        </div>
      </div>
      <div className="carousel" ref={track}>
        {children}
      </div>
    </section>
  );
}
