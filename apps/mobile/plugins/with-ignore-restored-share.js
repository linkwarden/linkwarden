const { withMainActivity } = require("@expo/config-plugins");
const {
  mergeContents,
} = require("@expo/config-plugins/build/utils/generateCode");

// When Android brings back the app's task after killing the process in the
// background, it recreates MainActivity with the intent that first started it.
// If that was a share, the link was saved back then, so expo-share-intent must
// not get it again. MainActivity passes null to super.onCreate, so only it can
// tell a restored activity from a new one.
const IGNORE_RESTORED_SHARE = [
  "    if (savedInstanceState != null && intent?.type != null) {",
  "      intent.setDataAndType(null, null)",
  "    }",
].join("\n");

function addIgnoreRestoredShare(mainActivity) {
  return mergeContents({
    src: mainActivity,
    newSrc: IGNORE_RESTORED_SHARE,
    tag: "linkwarden-ignore-restored-share",
    anchor: /super\.onCreate\(null\)/,
    offset: 0,
    comment: "    //",
  }).contents;
}

module.exports = function withIgnoreRestoredShare(config) {
  return withMainActivity(config, (c) => {
    if (c.modResults.language !== "kt") {
      throw new Error(
        "with-ignore-restored-share only supports a Kotlin MainActivity"
      );
    }
    c.modResults.contents = addIgnoreRestoredShare(c.modResults.contents);
    return c;
  });
};

module.exports.addIgnoreRestoredShare = addIgnoreRestoredShare;
