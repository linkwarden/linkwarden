---
name: dependency-management
description: Use when adding, removing, upgrading, or changing a dependency in any workspace of the Linkwarden monorepo.
---

# Dependency Management

A dependency change affects the whole monorepo, not just the workspace you're editing. Follow the guidelines below:

- **Check every workspace first:** Before adding or upgrading a package, search the root `package.json` and every `apps/*/package.json` and `packages/*/package.json` for it. If it's already used, reuse the same version.
- **Keep shared versions aligned:** A dependency should have the same version in every workspace that uses it. If you upgrade it in one place, upgrade it everywhere.
- **Be careful with React:** `react` and `react-dom` are pinned in the root `resolutions` to match the Expo SDK used by the mobile app. Don't bump React, `@types/react`, `react-native`, `expo`, or `next` unless every framework supports the new version.
- **Let Expo pick mobile versions:** Add or upgrade packages in `apps/mobile` with `npx expo install <pkg>` so the version matches the Expo SDK.
- **Check sibling and peer dependencies:** Read the peer dependency ranges of the package and of the libraries around it, and upgrade related packages together (for example `expo`, `expo-router`, and `react-native`). Never assume a newer version is compatible.
- **No breaking changes:** A dependency change must not break existing behavior. Check the library's changelog for breaking changes, then run the relevant unit, integration, and e2e tests before the change (for example `yarn vitest run` from the root and `yarn workspace @linkwarden/web e2e`). Run them again after the change and compare. Any new failure must be fixed before you're done.
- **Bump major versions one at a time:** When an upgrade crosses more than one major version, go through each major in order (for example 3 to 4, then 4 to 5) instead of jumping straight to the latest. Follow that version's migration guide, apply its changes, and get the tests passing before moving on to the next major.
- **Don't hide conflicts:** Don't add `resolutions` or ignore peer warnings to force an unsupported combination. If two frameworks really need different versions, keep both and explain why.
- **Use Yarn 4:** Install with `yarn workspace @linkwarden/<name> add <pkg>@<version>`, then run `yarn` from the root. Never edit `yarn.lock` by hand, and commit it together with the manifest changes.

## Before You Finish

- [ ] Searched all workspaces for the dependency.
- [ ] Versions match across workspaces, or the difference is explained.
- [ ] Peer dependency ranges are satisfied, with no new warnings from `yarn`.
- [ ] `yarn.lock` was updated by Yarn.
- [ ] Ran the relevant tests before and after the change, with no new failures.
- [ ] Multi-major upgrades went one major version at a time, with tests passing at each step.
- [ ] Type checks and builds pass in every affected workspace.
