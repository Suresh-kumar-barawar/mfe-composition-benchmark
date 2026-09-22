import { createLifecycles } from '../../common/lifecycles.jsx';
import DetailPage from './DetailPage.jsx';

export const { bootstrap, mount, unmount } = createLifecycles('pdp', DetailPage);
