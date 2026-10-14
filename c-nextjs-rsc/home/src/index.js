import { Suspense } from 'react';
import { Hero, Carousel, ProductCard, CategoryGrid } from '@mfe/shared/react';
import { getFeatured, getCategories } from '@mfe/shared/api';
import { fetchInit, failIfRequested } from 'c-common';
import Link from 'c-common/Link';

/** Data part of the Home MFE: fetched and rendered on the server, streamed when ready. */
async function HomeContent() {
  failIfRequested('home');
  const [featured, categories] = await Promise.all([getFeatured(8, fetchInit), getCategories(fetchInit)]);
  return (
    <>
      <Carousel title="Featured products">
        {featured.map((p, i) => (
          <ProductCard key={p.id} product={p} Link={Link} priority={i < 4} />
        ))}
      </Carousel>
      <CategoryGrid categories={categories} Link={Link} />
    </>
  );
}

function HomeSkeleton() {
  return (
    <>
      <Carousel title="Featured products">
        {Array.from({ length: 4 }, (_, i) => <div key={i} className="card card--skeleton" />)}
      </Carousel>
      <CategoryGrid categories={[]} Link={Link} />
    </>
  );
}

/**
 * Home micro frontend (React Server Component). The static hero is sent immediately;
 * the product carousel and category grid stream in through their own Suspense boundary.
 */
export default function HomeMFE() {
  return (
    <>
      <Hero Link={Link} />
      <Suspense fallback={<HomeSkeleton />}>
        <HomeContent />
      </Suspense>
    </>
  );
}
