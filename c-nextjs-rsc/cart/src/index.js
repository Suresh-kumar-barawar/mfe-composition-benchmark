import CartClient from './CartClient.jsx';

/**
 * Cart micro frontend. Cart state is client-only (localStorage + cart:updated event),
 * so unlike the other three MFEs it is a client component. The server still renders
 * the page shell and the same loading skeleton that A and B show.
 */
export default function CartMFE() {
  // The failure switch is read on the server and passed down, because process.env is not
  // available in the browser bundle.
  return <CartClient fail={process.env.C_FAIL_MFE === 'cart'} />;
}
