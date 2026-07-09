const {
  withAndroidManifest,
  withDangerousMod,
  AndroidConfig,
} = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const FILE_NAME = "network_security_config.xml";

// Trust user-installed CAs in addition to the system ones, so the app can
// reach self-hosted instances that use a self-signed / private-CA certificate
// once the user installs it on the device.
// cleartextTrafficPermitted="true" preserves the existing HTTP-by-IP behavior
// (expo-build-properties already sets usesCleartextTraffic: true).
const XML = `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
  <base-config cleartextTrafficPermitted="true">
    <trust-anchors>
      <certificates src="system" />
      <certificates src="user" />
    </trust-anchors>
  </base-config>
</network-security-config>
`;

// Write the XML resource into android/app/src/main/res/xml/
function withNetworkSecurityXmlFile(config) {
  return withDangerousMod(config, [
    "android",
    async (c) => {
      const xmlDir = path.join(
        c.modRequest.platformProjectRoot,
        "app/src/main/res/xml"
      );
      fs.mkdirSync(xmlDir, { recursive: true });
      fs.writeFileSync(path.join(xmlDir, FILE_NAME), XML);
      return c;
    },
  ]);
}

// Reference the config from the <application> tag in AndroidManifest.xml
function withNetworkSecurityManifest(config) {
  return withAndroidManifest(config, (c) => {
    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(c.modResults);
    app.$["android:networkSecurityConfig"] = "@xml/network_security_config";
    return c;
  });
}

module.exports = function withAndroidNetworkSecurityConfig(config) {
  return withNetworkSecurityManifest(withNetworkSecurityXmlFile(config));
};
