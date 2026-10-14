import CartMFE from 'c-cart';
import Mfe from '../_components/Mfe.jsx';

export const dynamic = 'force-dynamic';

export default function CartPage() {
  return <Mfe name="cart"><CartMFE /></Mfe>;
}
