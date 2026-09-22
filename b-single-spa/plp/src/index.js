import { createLifecycles } from '../../common/lifecycles.jsx';
import ListingPage from './ListingPage.jsx';

export const { bootstrap, mount, unmount } = createLifecycles('plp', ListingPage);
