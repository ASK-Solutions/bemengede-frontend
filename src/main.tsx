import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
// Fonts are self-hosted (bundled) so no visitor data goes to a font CDN.
import '@fontsource/manrope/400.css';
import '@fontsource/manrope/600.css';
import '@fontsource/manrope/700.css';
import '@fontsource/bricolage-grotesque/700.css';
import '@fontsource/bricolage-grotesque/800.css';
import '@fontsource/noto-sans-ethiopic/500.css';
import '@fontsource/noto-sans-ethiopic/700.css';
import './styles.css';
import App from './App';
import { ConsentProvider } from './lib/consent';
import { AuthProvider } from './lib/auth';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ConsentProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ConsentProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
