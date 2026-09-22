import ProductCard from './ProductCard.jsx';

export default function ProductGrid({ products, Link, priorityCount = 4 }) {
  if (!products.length) return <p className="empty">No products match your filters.</p>;
  return (
    <div className="grid">
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} Link={Link} priority={i < priorityCount} />
      ))}
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }) {
  return (
    <div className="grid" aria-busy="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="card card--skeleton" />
      ))}
    </div>
  );
}
