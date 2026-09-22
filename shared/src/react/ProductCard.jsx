import Rating from './Rating.jsx';
import { formatPrice, categoryLabel } from '../format.js';

/** `Link` is supplied by each implementation (React Router, single-spa or Next.js link). */
export default function ProductCard({ product, Link, priority = false }) {
  return (
    <article className="card">
      <Link href={`/product/${product.id}`} className="card__link">
        <div className="card__media">
          <img
            src={product.image}
            alt={product.title}
            width="300"
            height="300"
            loading={priority ? 'eager' : 'lazy'}
            fetchpriority={priority ? 'high' : undefined}
          />
        </div>
        <div className="card__body">
          <span className="card__category">{categoryLabel(product.category)}</span>
          <h3 className="card__title">{product.title}</h3>
          <Rating rate={product.rating.rate} count={product.rating.count} />
          <span className="card__price">{formatPrice(product.price)}</span>
        </div>
      </Link>
    </article>
  );
}
