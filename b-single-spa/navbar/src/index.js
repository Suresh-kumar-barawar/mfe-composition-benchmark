import { createLifecycles } from '../../common/lifecycles.jsx';
import Navbar from './Navbar.jsx';

export const { bootstrap, mount, unmount } = createLifecycles('navbar', Navbar, 'mfe-header');
