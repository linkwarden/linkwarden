const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);
const nestedWorkspaceNodeModules = /[/\\]packages[/\\][^/\\]+[/\\]node_modules[/\\].*/;

config.resolver.blockList = [
  ...(Array.isArray(config.resolver.blockList)
    ? config.resolver.blockList
    : config.resolver.blockList
      ? [config.resolver.blockList]
      : []),
  nestedWorkspaceNodeModules,
];

module.exports = withNativeWind(config, { input: "./styles/global.css" });
