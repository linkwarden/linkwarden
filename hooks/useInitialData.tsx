import { useEffect } from "react";
import { useSession } from "next-auth/react";
import useLocalSettingsStore from "@/store/localSettings";
import { Config } from "@/store/config";
import useConfigStore from "@/store/config";

type UseInitialDataProps = {
  initialConfig: Config;
};

export default function useInitialData({ initialConfig }: UseInitialDataProps) {
  const { status, data } = useSession();
  const { setSettings } = useLocalSettingsStore();
  const { config, setConfig } = useConfigStore();

  useEffect(() => {
    setSettings();

    if (!config.ADMIN) {
      setConfig(initialConfig);
    }
  }, [status, data]);

  return status;
}
