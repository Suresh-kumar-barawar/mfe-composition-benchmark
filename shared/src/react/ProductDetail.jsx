import Rating from './Rating.jsx';
import { formatPrice, categoryLabel, listingHref } from '../format.js';

/** PDP body. Add-to-cart is a slot (interactive), everything else is static markup. Reviews = FakeStore rating only. */
export default function ProductDetail({ product, Link, addToCartSlot }) {
  return (
    <div className="container page">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Home</Link> / <Link href={listingHref({ category: product.category })}>{categoryLabel(product.category)}</Link> /{' '}
        <span>{product.title}</span>
      </nav>
      <div className="pdp">
        <div className="pdp__media">
          <img src={product.image} alt={product.title} width="500" height="500" fetchpriority="high" />
        </div>
        <div className="pdp__info">
          <span className="card__category">{categoryLabel(product.category)}</span>
          <h1 className="pdp__title">{product.title}</h1>
          <Rating rate={product.rating.rate} count={product.rating.count} />
          <p className="pdp__price">{formatPrice(product.price)}</p>
          <p className="pdp__desc">{product.description}</p>
          {addToCartSlot}
          <section className="pdp__reviews">
            <h2>Customer ratings</h2>
            <p>
              <strong>{product.rating.rate.toFixed(1)} out of 5</strong> based on {product.rating.count} ratings.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className="container page">
      <div className="pdp" aria-busy="true">
        <div className="pdp__media skeleton-block" />
        <div className="pdp__info">
          <div className="skeleton-line" style={{ width: '40%' }} />
          <div className="skeleton-line skeleton-line--lg" />
          <div className="skeleton-line" style={{ width: '60%' }} />
        </div>
      </div>
    </div>
  );
}
