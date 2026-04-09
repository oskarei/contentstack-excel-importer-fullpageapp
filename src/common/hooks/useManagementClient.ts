import { useState, useEffect } from 'react';
import { client } from '@contentstack/management';
import { useAppSdk } from './useAppSdk';

/**
 * Requires App Permissions (entries:write, content_types:read) on the app in Developer Hub;
 * reinstall the app on the stack after enabling permissions.
 */
export const useManagementClient = () => {
  const appSdk = useAppSdk();
  const [managementClient, setManagementClient] = useState<ReturnType<typeof client> | null>(null);

  useEffect(() => {
    if (!appSdk) {
      setManagementClient(null);
      return;
    }

    try {
      const contentstackAdapter = appSdk.createAdapter();
      const instance = client({
        adapter: contentstackAdapter,
        baseURL: `${appSdk.endpoints.CMA}/v3`,
      });
      setManagementClient(instance);
    } catch (error) {
      console.error('Failed to initialize Management Client:', error);
      setManagementClient(null);
    }
  }, [appSdk]);

  return managementClient;
};
