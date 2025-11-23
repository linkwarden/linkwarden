module.exports = function withFileSharing(config) {
  config.ios = config.ios || {};
  config.ios.infoPlist = config.ios.infoPlist || {};
  config.ios.infoPlist.UIFileSharingEnabled = true;
  config.ios.infoPlist.LSSupportsOpeningDocumentsInPlace = true;
  return config;
};
