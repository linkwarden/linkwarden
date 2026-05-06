import { useEffect } from "react";
import { useConfig } from "@linkwarden/router/config";
import useAuthStore from "@/store/auth";
import useDataStore from "@/store/data";
import {
  recomputeStorage,
  startSync,
  stopSync,
  subscribeToConnectivity,
  subscribeToQueryCache,
  unsubscribeFromConnectivity,
  unsubscribeFromQueryCache,
} from "@/lib/offlineSync";

export default function OfflineSyncProvider() {
  const { auth } = useAuthStore();
  const { data } = useDataStore();
  const config = useConfig(auth);

  useEffect(() => {
    subscribeToConnectivity();
    recomputeStorage();

    return () => unsubscribeFromConnectivity();
  }, []);

  useEffect(() => {
    if (auth.status !== "authenticated") {
      stopSync();
      unsubscribeFromQueryCache();
      return;
    }

    if (!data.offlineEnabled) {
      stopSync();
      unsubscribeFromQueryCache();
      return;
    }

    if (config.isLoading) return;

    startSync(auth, config.data?.USER_CONTENT_DOMAIN);
    subscribeToQueryCache();

    return () => stopSync();
  }, [
    auth.status,
    auth.instance,
    auth.session,
    data.offlineEnabled,
    config.isLoading,
    config.data?.USER_CONTENT_DOMAIN,
  ]);

  return null;
}
