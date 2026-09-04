import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Register the service worker so UrbanEye AI can be installed as a PWA and
// keep working (last-seen pages) when connectivity drops. Skipped in local
// dev (vite dev server) since HMR and SW caching don't mix well.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Non-fatal - the app works fine without offline support.
    });
  });
}
