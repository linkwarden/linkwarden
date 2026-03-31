const { withAndroidManifest, withDangerousMod } = require("@expo/config-plugins");
const path = require("path");
const fs = require("fs");

module.exports = function withNetworkSecurityConfig(config) {
  // Copy network_security_config.xml to android/app/src/main/res/xml/
  config = withDangerousMod(config, [
    "android",
    async (config) => {
      const xmlDir = path.join(
        config.modRequest.platformProjectRoot,
        "app/src/main/res/xml"
      );
      const xmlSource = path.join(__dirname, "network_security_config.xml");
      const xmlDest = path.join(xmlDir, "network_security_config.xml");

      if (!fs.existsSync(xmlDir)) {
        fs.mkdirSync(xmlDir, { recursive: true });
      }

      fs.copyFileSync(xmlSource, xmlDest);

      return config;
    },
  ]);

  // Add android:networkSecurityConfig to AndroidManifest.xml
  config = withAndroidManifest(config, (config) => {
    const mainApplication = config.modResults.manifest.application[0];
    mainApplication.$["android:networkSecurityConfig"] =
      "@xml/network_security_config";
    return config;
  });

  return config;
};
