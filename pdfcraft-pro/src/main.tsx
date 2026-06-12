import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
// Note: index.css is intentionally NOT imported here when used as an embedded
// component inside omnigen-ai. The parent app handles Tailwind/CSS.
// Uncomment below only when running pdfcraft-pro as a standalone app:
// import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
