import { createLifecycles } from '../../common/lifecycles.jsx';
import HomePage from './HomePage.jsx';

export const { bootstrap, mount, unmount } = createLifecycles('home', HomePage);
