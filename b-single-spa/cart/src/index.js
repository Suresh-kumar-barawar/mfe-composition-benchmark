import { createLifecycles } from '../../common/lifecycles.jsx';
import CartPage from './CartPage.jsx';

export const { bootstrap, mount, unmount } = createLifecycles('cart', CartPage);
