import { useContext } from 'react';
import { MarketplaceContext } from '../contexts/marketplaceContext';

export const useAppSdk = () => {
  const context = useContext(MarketplaceContext);
  if (!context) {
    throw new Error('useAppSdk must be used within MarketplaceAppProvider');
  }
  return context.sdk;
};
