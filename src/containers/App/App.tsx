import React, { useEffect } from 'react';
import { MarketplaceAppProvider } from '../../common/providers/MarketplaceAppProvider';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import FullPageApp from '../FullPageApp/FullPageApp';

const OAuthCallback: React.FC = () => {
  useEffect(() => {
    if (window.opener) {
      window.opener.postMessage({ type: 'oauth-callback-complete' }, '*');
      window.close();
    }
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h1>OAuth Authorization Complete</h1>
      <p>You can close this window.</p>
    </div>
  );
};

const App: React.FC = () => {
  const pathname = window.location.pathname;

  if (pathname.includes('/oauth/callback')) {
    return <OAuthCallback />;
  }

  if (pathname.includes('/excel-importer')) {
    return (
      <ErrorBoundary>
        <MarketplaceAppProvider>
          <FullPageApp />
        </MarketplaceAppProvider>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div style={{ padding: '20px' }}>
        <h1>Excel Importer</h1>
        <p>Path: {pathname}</p>
        <p style={{ marginTop: '8px' }}>Available locations:</p>
        <ul style={{ marginTop: '4px', paddingLeft: '20px' }}>
          <li>
            <a href="/excel-importer">/excel-importer</a> — Full page: Excel import
          </li>
        </ul>
      </div>
    </ErrorBoundary>
  );
};

export default App;
