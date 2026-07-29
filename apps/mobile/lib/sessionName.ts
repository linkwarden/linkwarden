import Constants from "expo-constants";
import { Platform } from "react-native";

const MAX_LENGTH = 50;

const osLabel = () => {
  const name = Platform.select({ ios: "iOS", android: "Android" }) ?? "";
  const version =
    Platform.OS === "android"
      ? Platform.constants.Release
      : String(Platform.Version || "");

  return [name, version].filter(Boolean).join(" ").trim();
};

const truncate = (name: string) =>
  name.length > MAX_LENGTH
    ? `${name.slice(0, MAX_LENGTH - 1).trimEnd()}…`
    : name;

export const getSessionName = () => {
  const device = Constants.deviceName?.trim();
  const os = osLabel();

  const name = [device && os ? `${device} (${os})` : "", device, os].find(
    (candidate) => candidate && candidate.length <= MAX_LENGTH
  );

  return name || truncate(device || os || "Mobile Device");
};
