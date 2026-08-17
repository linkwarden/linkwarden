const { withGradleProperties } = require("@expo/config-plugins");

// The Expo template defaults to -Xmx2048m -XX:MaxMetaspaceSize=512m, which makes lintVitalAnalyzeRelease crash with OutOfMemoryError: Metaspace on CI.
const JVM_ARGS =
  "-Xmx4096m -XX:MaxMetaspaceSize=1024m -XX:+HeapDumpOnOutOfMemoryError";

module.exports = function withGradleMemory(config) {
  return withGradleProperties(config, (c) => {
    c.modResults = c.modResults.filter(
      (item) => !(item.type === "property" && item.key === "org.gradle.jvmargs")
    );
    c.modResults.push({
      type: "property",
      key: "org.gradle.jvmargs",
      value: JVM_ARGS,
    });
    return c;
  });
};
