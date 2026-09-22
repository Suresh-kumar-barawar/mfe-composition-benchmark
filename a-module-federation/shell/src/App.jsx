import { lazy, Suspense } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { HeaderView, SearchBox, CartBadge, Footer, ErrorBoundary } from '@mfe/shared/react';
import { listingHref } from '@mfe/shared/format';
import Link from '../../common/RouterLink.jsx';

// Each page is a separately built and deployed remote, fetched at runtime via remoteEntry.js.
const HomePage = lazy(() => import('home/HomePage'));
const ListingPage = lazy(() => import('plp/ListingPage'));
const DetailPage = lazy(() => import('pdp/DetailPage'));
const CartPage = lazy(() => import('cart/CartPage'));

/** Error boundary + suspense per remote: one failing MFE does not take down the shell. */
function Remote({ name, children }) {
  const { pathname } = useLocation();
  return (
    <ErrorBoundary name={name} key={pathname}>
      <Suspense fallback={<div className="mfe-loading" aria-busy="true" />}>{children}</Suspense>
    </ErrorBoundary>
  );
}

export default function App() {
  const navigate = useNavigate();
  return (
    <div className="app">
      <HeaderView
        Link={Link}
        searchSlot={<SearchBox onSearch={(q) => navigate(listingHref({ q }))} />}
        cartSlot={<CartBadge Link={Link} />}
      />
      <main>
        <Routes>
          <Route path="/" element={<Remote name="home"><HomePage /></Remote>} />
          <Route path="/products" element={<Remote name="plp"><ListingPage /></Remote>} />
          <Route path="/product/:id" element={<Remote name="pdp"><DetailPage /></Remote>} />
          <Route path="/cart" element={<Remote name="cart"><CartPage /></Remote>} />
          <Route path="*" element={<div className="container page"><h1 className="page__title">Page not found</h1></div>} />
        </Routes>
      </main>
      <Footer strategy="Webpack Module Federation (build-time)" />
    </div>
  );
}
