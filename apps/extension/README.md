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

Either command builds the extension, launches the browser with it already installed,
and reloads it whenever a file under `src/` changes. Both run off the same
`manifest.json` and `dist/` folder, so there is nothing else to set up. Firefox
reports that `background.service_worker` is ignored, which is expected: it uses
`background.scripts` from that same manifest.

The browser starts from a temporary profile, so your Linkwarden server settings are
gone on the next start. Add `--keep-profile-changes --chromium-profile ./.profile`
(or `--firefox-profile`) to the relevant script if you would rather keep them.

To load the extension into a browser yourself, `yarn dev` runs only the watching
build and keeps `dist/` up to date.

## Safari

Safari is built through the Xcode project in `safari/`, which is committed to this
repository and maintained by hand.

```
yarn build:safari
open safari/Linkwarden/Linkwarden.xcodeproj
```

Then Product → Archive in Xcode.

The Xcode project references `dist-safari/` directly rather than holding its own copy
of the extension, so `yarn build:safari` has to run first or you will archive a
stale build. There is no conversion step: running `safari-web-extension-converter`
against `safari/` would replace the committed project and its signing configuration.
