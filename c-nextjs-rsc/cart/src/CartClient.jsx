'use client';
import { CartView } from '@mfe/shared/react';
import Link from 'c-common/Link';

/** The cart lives in localStorage, so this MFE is a client component (server sends the skeleton). */
export default function CartClient({ fail }) {
  // Error-isolation test only (C_FAIL_MFE=cart, read on the server and passed as a prop).
  if (fail) throw new Error('[cart] simulated failure (C_FAIL_MFE)');
  return <CartView Link={Link} />;
}
