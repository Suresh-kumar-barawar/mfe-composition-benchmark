'use client';
import { useRouter } from 'next/navigation';
import { ListingFilters } from '@mfe/shared/react';

/** Client island: category/sort selects navigate with the Next.js router (no full reload). */
export default function ListingFiltersNav({ categories, query }) {
  const router = useRouter();
  return (
    <ListingFilters
      categories={categories}
      category={query.category}
      sort={query.sort}
      q={query.q}
      onNavigate={(url) => router.push(url)}
    />
  );
}
