'use client';
import { CartBadge } from '@mfe/shared/react';
import Link from 'c-common/Link';

/** Live cart count island (reads localStorage after hydration, like A and B). */
export default function HeaderCart() {
  return <CartBadge Link={Link} />;
}
