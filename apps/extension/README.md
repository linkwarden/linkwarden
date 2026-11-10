# Linkwarden Browser Extension

The Official Browser Extension for [Linkwarden](https://github.com/linkwarden/linkwarden).

## Features

- Add and organize new links to Linkwarden with a single click.
- Upload screenshots of the current page to Linkwarden.
- Save all tabs in the current window to Linkwarden.
- Sign in using API key or Username/Password.

![Image](/assets/linkwarden-extension.png)

## Installation

You can get the browser extension from both the Chrome Web Store and Firefox Add-ons:

<a href="https://chrome.google.com/webstore/detail/linkwarden/pnidmkljnhbjfffciajlcpeldoljnidn"><img src="/assets/chrome.png" alt="Chrome Web Store"></a>
<a href="https://addons.mozilla.org/en-US/firefox/addon/linkwarden"><img src="/assets/firefox.png" alt="Firefox Add-ons"></a>

## Issues and Feature Requests

Please report any issues or feature requests by starting the title with "[Browser Extension]" [here](https://github.com/linkwarden/linkwarden/issues/new/choose).

## Build From Source

### Requirements

- NodeJS 20.19.x or later
- Yarn 4.x, enabled with `corepack enable`
- Bash
- Git

### Step 1: Clone this repo

Clone this repository by running the following in your terminal:

```
git clone https://github.com/linkwarden/browser-extension.git
```

### Step 2: Build

Head to the generated folder:

```
cd browser-extension
```

And run:

```
yarn install
yarn build
```

After the above command, use the `/dist` folder as an unpacked extension in your browser.

## Development

For live reload in Chrome or Firefox:

```
yarn dev:chrome
yarn dev:firefox
```

## Testing

Unit tests use Vitest, with [`@webext-core/fake-browser`](https://webext-core.aklinker1.io/fake-browser/installation) standing in for the browser APIs. They sit next to the code as `*.test.ts` and run from the repository root:

```
yarn vitest run apps/extension
```

End-to-end tests use Playwright and load the built extension into Playwright's own Chromium. Playwright can't load extensions into Firefox or Safari. The tests need a running Linkwarden instance with registration open, and they create their own accounts on it:

```
yarn playwright install chromium
E2E_BASE_URL=http://127.0.0.1:3000 yarn e2e
```

`yarn e2e` builds `dist/` first. Playwright can't open the toolbar popup, so the tests open the popup page in a tab and point its active-tab lookup at the page under test.

For Firefox, check the build with Mozilla's linter:

```
yarn build
yarn lint:firefox
```

Safari has no automated tests, so check changes there by hand (see below).

## Safari

```
yarn build:safari
```

Then Cmd+R to run it, or Product → Archive to build for the App Store.

Cmd+R launches `Linkwarden for Safari.app`. Launching it registers the extension with Safari.

### First run

Safari hides locally built extensions until the developer settings are on:

1. Safari → Settings → Advanced → **Show features for web developers**
2. The new Develop menu → **Allow unsigned extensions**
3. Safari → Settings → Extensions → enable **Linkwarden**

Step 2 resets every time Safari restarts, so expect to repeat it. Steps 1 and 3 are
one-time.

### Iterating

There is no live reload here, unlike `yarn dev:chrome` and `yarn dev:firefox`. The
build output is copied into the app extension at compile time, so every change to
`src/` means `yarn build:safari` followed by another Cmd+R. Develop against Chrome or
Firefox and use Safari to verify, rather than working in it directly.
