// Standalone mode: open http://localhost:3003/product/1
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import '@mfe/shared/styles.css';
import DetailPage from './DetailPage.jsx';

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <main>
      <Routes>
        <Route path="/product/:id" element={<DetailPage />} />
        <Route path="*" element={<p className="container page">Open /product/1 to preview this MFE.</p>} />
      </Routes>
    </main>
  </BrowserRouter>
);
