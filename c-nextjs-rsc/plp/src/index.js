import { Suspense } from 'react';
import { ListingView, ProductGridSkeleton } from '@mfe/shared/react';
import { getCategories, getListingProducts, queryProducts } from '@mfe/shared/api';
import { fetchInit, failIfRequested } from 'c-common';
import Link from 'c-common/Link';
import ListingFiltersNav from './ListingFiltersNav.jsx';

/** Parses the listing query from the URL search params (same rules as A and B). */
export function parseListingQuery(sp = {}) {
  const one = (v) => (Array.isArray(v) ? v[0] : v) || '';
  return { category: one(sp.category), q: one(sp.q), sort: one(sp.sort), page: Number(one(sp.page)) || 1 };
}

async function ListingContent({ query }) {
  failIfRequested('plp');
  // FakeStore has no search/sort/paging: fetch the category, then query on the server.
  const [categories, products] = await Promise.all([getCategories(fetchInit), getListingProducts(query.category, fetchInit)]);
  return (
    <ListingView
      categories={categories}
      query={query}
      result={queryProducts(products, query)}
      Link={Link}
      filtersSlot={<ListingFiltersNav categories={categories} query={query} />}
    />
  );
}

function ListingSkeleton() {
  return (
    <div className="container page">
      <div className="page__head"><h1 className="page__title">Products</h1></div>
      <ProductGridSkeleton />
    </div>
  );
}

/** Product listing micro frontend (React Server Component, streamed through Suspense). */
export default function ListingMFE({ query }) {
  return (
    <Suspense key={JSON.stringify(query)} fallback={<ListingSkeleton />}>
      <ListingContent query={query} />
    </Suspense>
  );
}
