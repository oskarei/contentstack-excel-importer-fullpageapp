import React, { useEffect, useState, ReactNode } from 'react';
import ContentstackAppSDK from '@contentstack/app-sdk';
import { MarketplaceContext, MarketplaceContextType } from '../contexts/marketplaceContext';

interface MarketplaceAppProviderProps {
  children: ReactNode;
}

export const MarketplaceAppProvider: React.FC<MarketplaceAppProviderProps> = ({ children }) => {
  const [sdk, setSdk] = useState<MarketplaceContextType['sdk']>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    if (hasInitialized) {
      return;
    }

    setHasInitialized(true);

    ContentstackAppSDK.init()
      .then((appSdk) => {
        setSdk(appSdk);
      })
      .catch((error) => {
        if (
          error instanceof Error &&
          !error.message.includes('_uiLocation') &&
          !error.message.includes('already exists')
        ) {
          console.error('Failed to initialize App SDK:', error);
        }
      })
      .finally(() => {
        setIsInitializing(false);
      });
  }, [hasInitialized]);

  const contextValue: MarketplaceContextType = {
    sdk,
  };

  if (isInitializing) {
    return (
      <MarketplaceContext.Provider value={contextValue}>
        <div style={{ padding: '20px' }}>Initializing SDK...</div>
      </MarketplaceContext.Provider>
    );
  }

  return <MarketplaceContext.Provider value={contextValue}>{children}</MarketplaceContext.Provider>;
};
