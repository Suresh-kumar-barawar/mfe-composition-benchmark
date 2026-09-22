// Standalone mode: the home MFE can be developed and tested without the shell.
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import '@mfe/shared/styles.css';
import HomePage from './HomePage.jsx';

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <main><HomePage /></main>
  </BrowserRouter>
);
