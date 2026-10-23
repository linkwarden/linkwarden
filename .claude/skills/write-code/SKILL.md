---
name: write-code
description: Use when a user or an agent runs /write-code or whenever you're prompted to write code.
---

# Write Code

Linkwarden has its own coding style. Follow the guidelines below when making changes to the codebase:

- **Avoid unnecessary or breaking changes:** Only make the changes you've been asked to make. If something needs attention, is unclear, or could be interpreted in multiple ways, ask for clarification first.
- **Test before and after your change:** Run the relevant unit, integration, and e2e tests before making a change (for example `yarn vitest run` from the root and `yarn workspace @linkwarden/web e2e`), then run them again afterwards to make sure nothing broke. Any new failure must be fixed before you're done.
- **Follow existing patterns in the codebase:** Look for similar implementations and use them as references. For example, when asked to add an API route, don't build one from scratch. Instead, find an existing route in the same category and use it as a template.
- **Keep documentation up to date:** When modifying an API route or adding an environment variable, make sure to update the relevant documentation and `.env.sample` accordingly.
