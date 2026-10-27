# Mobile e2e tests

End-to-end tests for the mobile app use [Maestro](https://docs.maestro.dev). Each top-level `.yaml` file in this folder is a flow, and `subflows/` holds steps shared between flows. The same flows run on iOS and Android.

## Setup

1. Install Maestro (it needs Java 17 or newer):

   ```bash
   brew tap mobile-dev-inc/tap
   brew install mobile-dev-inc/tap/maestro
   ```

2. Start a Linkwarden server on this machine at port 3000. The flows sign in as `user1` / `11111111`, the first user created by `packages/prisma/seed.js`. The iOS simulator reaches the server at `http://localhost:3000` and the Android emulator at `http://10.0.2.2:3000`. To use another server or account, pass the variables listed under Running.

3. Install a Release build of the app on a booted simulator or emulator, as described below. Release builds have the JS bundle embedded, so they run without Metro.

### iOS

```bash
cd apps/mobile/ios
SENTRY_DISABLE_AUTO_UPLOAD=true xcodebuild -workspace Linkwarden.xcworkspace -scheme Linkwarden -configuration Release -sdk iphonesimulator -derivedDataPath build/e2e build
xcrun simctl install booted build/e2e/Build/Products/Release-iphonesimulator/Linkwarden.app
```

If Xcode is set to a custom build location (Settings > Locations), the `.app` ends up there instead.

### Android

Gradle needs Java 17, for example `export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home`.

```bash
cd apps/mobile/android
SENTRY_DISABLE_AUTO_UPLOAD=true ./gradlew app:createBundleReleaseJsAndAssets --rerun app:assembleRelease -PreactNativeArchitectures=arm64-v8a
adb install -r app/build/outputs/apk/release/app-release.apk
```

`--rerun` rebuilds the JS bundle every time. Gradle doesn't notice dependency changes in `node_modules` on its own and would keep packaging the old bundle.

### Development builds

To skip the Release build, install a development build (`yarn ios`, or `./gradlew app:installDebug` on Android), keep Metro running with `yarn workspace @linkwarden/mobile start` and pass `METRO_URL`: `http://localhost:8081` on iOS, `http://10.0.2.2:8081` on the Android emulator. The flows open the app through the dev launcher and turn off the dev menu's auto-launch and floating button.

## Running

```bash
yarn workspace @linkwarden/mobile e2e
```

If more than one simulator or emulator is running, pick one with `--device`, for example `maestro --device emulator-5554 test .maestro` from `apps/mobile` (`adb devices` and `xcrun simctl list devices booted` list the ids). Open `maestro studio` to inspect the screen and try selectors.

Every flow starts from a fresh install: the app's data, and on iOS the simulator's keychain, are cleared on launch. `login-and-save-link` adds a link named `Maestro <timestamp>` to the test account on each run.

| Variable        | Default                                                         | Purpose                                   |
| --------------- | --------------------------------------------------------------- | ----------------------------------------- |
| `E2E_BASE_URL`  | `http://localhost:3000` (iOS), `http://10.0.2.2:3000` (Android) | Linkwarden server to sign in to           |
| `TEST_USERNAME` | `user1`                                                         | Account to sign in with                   |
| `TEST_PASSWORD` | `11111111`                                                      | Password for that account                 |
| `METRO_URL`     | unset                                                           | Load the bundle from Metro in a dev build |

Pass them with `-e`, for example `yarn workspace @linkwarden/mobile e2e -e TEST_USERNAME=me -e TEST_PASSWORD=secret`. Don't set defaults in a flow's `env:` block: those take precedence over `-e`.

## Writing flows

- Prefer `id:` selectors backed by a `testID` prop over visible text, so copy changes don't break flows. Icon-only buttons should get an `accessibilityLabel` instead, which screen readers use too.
- When a step needs a different selector per platform, wrap each version in `runFlow` with `when: platform: iOS` or `when: platform: Android`. In scripts, `maestro.platform` is `"ios"` or `"android"`.
- zeego menu triggers render inside a native button that hides the trigger's own label and `testID` on iOS, so put the `testID` on a `View` around `DropdownMenu.Root` (see `server-picker` in `app/index.tsx`).
- Native tab bars don't expose a tab's `testID` to Maestro (iOS 26 and later drop it, and Android keeps it in a view tag). Match the tab's label instead: inside `text: "Tab Bar"` on iOS, and with `id: ".*navigation_bar_item_.*_label_view"` on Android.
- Action sheets slide up after the keyboard opens, and Maestro can tap where a field used to be. Close each field with `pressKey: Enter` and `waitForAnimationToEnd` before the next tap.
- A link row is one accessibility element whose text is `<name>, <host>, <collection>, <date>` on both platforms, so match it with a regex such as `"${output.linkName},.*"`.
