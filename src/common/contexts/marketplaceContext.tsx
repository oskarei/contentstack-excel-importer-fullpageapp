import { createContext } from 'react';
import UiLocation from '@contentstack/app-sdk/dist/src/uiLocation';

export interface MarketplaceContextType {
  sdk: UiLocation | null;
}

export const MarketplaceContext = createContext<MarketplaceContextType | null>(null);
