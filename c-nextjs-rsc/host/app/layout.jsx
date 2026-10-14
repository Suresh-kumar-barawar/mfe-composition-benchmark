import '@mfe/shared/styles.css';
import { HeaderView, Footer } from '@mfe/shared/react';
import Link from 'c-common/Link';
import HeaderSearch from './_components/HeaderSearch.jsx';
import HeaderCart from './_components/HeaderCart.jsx';

export const metadata = {
  title: 'ShopMFE – Next.js RSC',
  description: 'ShopMFE: e-commerce benchmark app composed on the server with React Server Components (Next.js 15).',
};

/** Host layout: header and footer are rendered on the server; search and cart badge are small client islands. */
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="app">
          <HeaderView Link={Link} searchSlot={<HeaderSearch />} cartSlot={<HeaderCart />} />
          <main>{children}</main>
          <Footer strategy="React Server Components (Next.js 15, server-side)" />
        </div>
      </body>
    </html>
  );
}
