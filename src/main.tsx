import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';

// Self-hosted fonts. No network, no font CDN: these files ship in the bundle.
import '@fontsource-variable/inter';
import '@fontsource/atkinson-hyperlegible/400.css';
import '@fontsource/atkinson-hyperlegible/700.css';
import './styles/arabic-font.css';

import './styles/tokens.css';
import './styles/base.css';
import './ui/ui.css';

import { AppRoutes } from './routes';
import { ErrorBoundary } from './app/ErrorBoundary';
import { registerServiceWorker } from './app/registerServiceWorker';
import { measureSafeAreas } from './platform/capabilities';

const container = document.getElementById('root');
if (!container) throw new Error('Root element missing from index.html');

measureSafeAreas();
registerServiceWorker();

createRoot(container).render(
  <StrictMode>
    <ErrorBoundary>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </ErrorBoundary>
  </StrictMode>,
);
