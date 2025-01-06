import { useEffect } from "react";
import { useSession } from "next-auth/react";
import useLocalSettingsStore from "@/store/localSettings";

export default function useInitialData() {
  const { status, data } = useSession();
  const { setSettings } = useLocalSettingsStore();
  useEffect(() => {
    setSettings();
  }, [status, data]);

  return status;
}
