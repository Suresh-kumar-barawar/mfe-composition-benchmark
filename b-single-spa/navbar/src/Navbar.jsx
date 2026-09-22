import { createPortal } from 'react-dom';
import { navigateToUrl } from 'single-spa';
import { HeaderView, SearchBox, CartBadge, Footer } from '@mfe/shared/react';
import { listingHref } from '@mfe/shared/format';
import Link from '../../common/Link.jsx';

/** Always-mounted app: header in the top slot, footer portalled into the bottom slot. */
export default function Navbar() {
  const footerSlot = document.getElementById('mfe-footer');
  return (
    <>
      <HeaderView
        Link={Link}
        searchSlot={<SearchBox onSearch={(q) => navigateToUrl(listingHref({ q }))} />}
        cartSlot={<CartBadge Link={Link} />}
      />
      {footerSlot && createPortal(<Footer strategy="Single-SPA (runtime)" />, footerSlot)}
    </>
  );
}
