import { useEffect, useState } from 'react';
import { ProductDetail, ProductDetailSkeleton, AddToCart } from '@mfe/shared/react';
import { getProduct } from '@mfe/shared/api';
import Link from '../../common/Link.jsx';
import useLocation from '../../common/useLocation.js';

export default function DetailPage() {
  const { pathname } = useLocation();
  const id = pathname.split('/').filter(Boolean)[1];
  const [product, setProduct] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    setProduct(null);
    setError(null);
    getProduct(id)
      .then((p) => alive && setProduct(p))
      .catch((e) => alive && setError(e));
    return () => { alive = false; };
  }, [id]);

  if (error)
    return (
      <div className="container page">
        <h1 className="page__title">Product not found</h1>
        <Link href="/products" className="btn">Back to products</Link>
      </div>
    );
  if (!product) return <ProductDetailSkeleton />;
  return <ProductDetail product={product} Link={Link} addToCartSlot={<AddToCart product={product} />} />;
}
