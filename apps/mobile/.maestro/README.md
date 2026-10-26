# Mobile e2e tests

End-to-end tests for the mobile app use [Maestro](https://docs.maestro.dev). Each top-level `.yaml` file in this folder is a flow, and `subflows/` holds steps shared between flows.

## Setup

1. Install Maestro (it needs Java 17 or newer):

   ```bash
   brew tap mobile-dev-inc/tap
   brew install mobile-dev-inc/tap/maestro
   ```

2. Start a Linkwarden server the simulator can reach. The flows sign in to `http://localhost:3000` as `user1` / `11111111`, the first user created by `packages/prisma/seed.js`. To use another account, pass the variables listed under Running.

3. Install a build of the app on a booted iOS simulator. A Release build has the JS bundle embedded, so it runs without Metro:

   ```bash
   cd apps/mobile/ios
   SENTRY_DISABLE_AUTO_UPLOAD=true xcodebuild -workspace Linkwarden.xcworkspace -scheme Linkwarden -configuration Release -sdk iphonesimulator -derivedDataPath build/e2e build
   xcrun simctl install booted build/e2e/Build/Products/Release-iphonesimulator/Linkwarden.app
   ```

   If Xcode is set to a custom build location (Settings > Locations), the `.app` ends up there instead.

   To test a development build instead, install it with `yarn ios`, keep Metro running and pass `-e METRO_URL=http://localhost:8081`. The flows open the app through the dev launcher and turn off the dev menu's auto-launch and floating button.

## Running

```bash
yarn workspace @linkwarden/mobile e2e
```

Run a single flow with `maestro test .maestro/login-and-save-link.yaml` from `apps/mobile`, or open `maestro studio` to inspect the screen and try selectors.

Every flow starts from a fresh install: the app's data and the simulator's keychain are cleared on launch. `login-and-save-link` adds a link named `Maestro <timestamp>` to the test account on each run.

| Variable        | Default                 | Purpose                                   |
| --------------- | ----------------------- | ----------------------------------------- |
| `E2E_BASE_URL`  | `http://localhost:3000` | Linkwarden server to sign in to           |
| `TEST_USERNAME` | `user1`                 | Account to sign in with                   |
| `TEST_PASSWORD` | `11111111`              | Password for that account                 |
| `METRO_URL`     | unset                   | Load the bundle from Metro in a dev build |

Pass them with `-e`, for example `yarn workspace @linkwarden/mobile e2e -e TEST_USERNAME=me -e TEST_PASSWORD=secret`. Don't set defaults in a flow's `env:` block: those take precedence over `-e`.

## Writing flows

- Prefer `id:` selectors backed by a `testID` prop over visible text, so copy changes don't break flows. Icon-only buttons should get an `accessibilityLabel` instead, which screen readers use too.
- zeego menu triggers render inside a native button that hides the trigger's own label and `testID`, so put the `testID` on a `View` around `DropdownMenu.Root` (see `server-picker` in `app/index.tsx`).
- On iOS 26 and later the native tab bar doesn't expose a tab's `testID`. Match the tab's label inside the tab bar instead: `text: "Links"` with `childOf: { text: "Tab Bar" }`.
- Action sheets slide up after the keyboard opens, and Maestro can tap where a field used to be. Close each field with `pressKey: Enter` and `waitForAnimationToEnd` before the next tap.
- A link row is one accessibility element whose text is `<name>, <host>, <collection>, <date>`, so match it with a regex such as `"${output.linkName},.*"`.

The flows have only been run on iOS. On Android the tab bar has no "Tab Bar" label, so selecting the Links tab needs a different selector there.
