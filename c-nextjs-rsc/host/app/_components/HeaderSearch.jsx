'use client';
import { useRouter } from 'next/navigation';
import { SearchBox } from '@mfe/shared/react';
import { listingHref } from '@mfe/shared/format';

/** Header search island: navigates with the Next.js router instead of a full page load. */
export default function HeaderSearch() {
  const router = useRouter();
  return <SearchBox onSearch={(q) => router.push(listingHref({ q }))} />;
}
