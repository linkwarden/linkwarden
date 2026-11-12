import { describe, expect, it } from "vitest";
import { addIgnoreRestoredShare } from "./with-ignore-restored-share";

// onCreate as Expo SDK 57's prebuild writes it, after expo-splash-screen
const mainActivity = `class MainActivity : ReactActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    // @generated begin expo-splashscreen - expo prebuild (DO NOT MODIFY) sync-f3ff59a738c56c9a6119210cb55f0b613eb8b6af
    SplashScreenManager.registerOnActivity(this)
    // @generated end expo-splashscreen
    super.onCreate(null)
  }

  override fun getMainComponentName(): String = "main"
}
`;

const onCreateBody = (src: string) =>
  src
    .split("override fun onCreate(savedInstanceState: Bundle?) {\n")[1]
    .split("\n  }\n")[0]
    .split("\n")
    .filter((line) => !line.trim().startsWith("//"));

describe("ignoring a restored share in MainActivity", () => {
  it("clears a share intent's data and type before super.onCreate", () => {
    expect(onCreateBody(addIgnoreRestoredShare(mainActivity))).toEqual([
      "    SplashScreenManager.registerOnActivity(this)",
      "    if (savedInstanceState != null && intent?.type != null) {",
      "      intent.setDataAndType(null, null)",
      "    }",
      "    super.onCreate(null)",
    ]);
  });

  it("adds it once when prebuild runs again", () => {
    const once = addIgnoreRestoredShare(mainActivity);
    expect(addIgnoreRestoredShare(once)).toBe(once);
  });

  it("fails instead of skipping it when onCreate changes", () => {
    expect(() =>
      addIgnoreRestoredShare(
        mainActivity.replace("super.onCreate(null)", "super.onCreate(state)")
      )
    ).toThrow(/Failed to match/);
  });
});
