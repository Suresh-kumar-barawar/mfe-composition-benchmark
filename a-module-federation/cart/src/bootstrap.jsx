// Standalone mode for independent development of the cart MFE.
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import '@mfe/shared/styles.css';
import CartPage from './CartPage.jsx';

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <main><CartPage /></main>
  </BrowserRouter>
);
