// Standalone mode for independent development of the listing MFE.
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import '@mfe/shared/styles.css';
import ListingPage from './ListingPage.jsx';

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <main><ListingPage /></main>
  </BrowserRouter>
);
