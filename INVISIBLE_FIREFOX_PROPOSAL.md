# Firefox-based stealth archiver backend (proposal)

> Status: Draft proposal
> Created: 2026-05-31
> Tracking issue: TBD

## Goal

Optional Firefox-based stealth backend for the archiver in `apps/worker/lib/browser.ts`, parallel to the current Chromium path. Selected via env, no change to defaults.

## Motivation

The archiver drives a headless browser to capture each saved link (screenshot, PDF, single-file HTML, readable view). On sites behind Cloudflare, Turnstile, or other anti-bot WAFs the capture comes back as a "Just a moment..." interstitial or a blank/login page instead of the real content. This is the recurring pain in #1237 and the reason the FlareSolverr integration in PR #1251 exists. FlareSolverr only handles the older IUAM challenge, not Turnstile or fingerprint-level checks.

A Firefox build with fingerprint patches at the C++ source code level avoids the JS-shim detection surface that the standard headless Chromium archiver trips, so the page renders normally and the archive captures the real content.

## Proposed change

A small branch in `apps/worker/lib/browser.ts` so that, when `ARCHIVE_BROWSER=invisible_firefox` is set, the archiver launches `firefox` with `executablePath` pointing at the patched binary plus a prefs map, instead of the default Chromium. The returned page is a standard Playwright page, so the screenshot / PDF / single-file / readability paths are unchanged.

The patched Firefox 150 binary lives at https://github.com/feder-cr/invisible_firefox (MPL-2.0, same license as Firefox upstream). It auto-downloads to a cache dir on first run.

## Out of scope

No change to the default Chromium archiver. No change to the FlareSolverr path. No change to screenshot/PDF/readability logic. Backend stays user-driven via env.

## Maintenance

Issues against the backend route to feder-cr/invisible_playwright. Only ask of this repo would be the env-gated branch in `apps/worker/lib/browser.ts` plus a self-hosting doc note. Honest caveat: linkwarden is Node/TS and the wrapper is Python, so the wrapper itself does not drop in; the binary is language-agnostic and launches from playwright-node with executablePath + firefoxUserPrefs.
