import { Suspense } from 'react';
import { ProductDetail, ProductDetailSkeleton, AddToCart } from '@mfe/shared/react';
import { getProduct } from '@mfe/shared/api';
import { fetchInit, failIfRequested, imageComponent } from 'c-common';
import Link from 'c-common/Link';

function NotFound() {
  return (
    <div className="container page">
      <h1 className="page__title">Product not found</h1>
      <Link href="/products" className="btn">Back to products</Link>
    </div>
  );
}

async function DetailContent({ id }) {
  failIfRequested('pdp');
  let product;
  try {
    product = await getProduct(id, fetchInit);
  } catch {
    return <NotFound />; // FakeStore answers unknown ids with an empty body
  }
  if (!product?.id) return <NotFound />;
  // Only the add-to-cart button is a client component; the rest of the page is server HTML.
  const Img = await imageComponent();
  return <ProductDetail product={product} Link={Link} Img={Img} addToCartSlot={<AddToCart product={product} />} />;
}

/** Product detail micro frontend (React Server Component, streamed through Suspense). */
export default function DetailMFE({ id }) {
  return (
    <Suspense key={id} fallback={<ProductDetailSkeleton />}>
      <DetailContent id={id} />
    </Suspense>
  );
}
