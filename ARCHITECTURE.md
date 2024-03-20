# Architecture

This is a summary of the architecture of Linkwarden. It's intended as a primer for collaborators to get a high-level understanding of the project.

When you start Linkwarden, there are mainly two components that run:

- The NextJS app, This is the main app and it's responsible for serving the frontend and handling the API routes.
- [The Background Worker](https://github.com/linkwarden/linkwarden/blob/main/scripts/worker.ts), This is a separate `ts-node` process that runs in the background and is responsible for archiving links.

## Main Tech Stack

- [NextJS](https://github.com/vercel/next.js)
- [TypeScript](https://github.com/microsoft/TypeScript)
- [Tailwind](https://github.com/tailwindlabs/tailwindcss)
- [DaisyUI](https://github.com/saadeghi/daisyui)
- [Prisma](https://github.com/prisma/prisma)
- [Playwright](https://github.com/microsoft/playwright)
- [Zustand](https://github.com/pmndrs/zustand)

## Folder Structure

Here's a summary of the main files and folders in the project:

```
linkwarden
├── components         # React components
├── hooks              # React reusable hooks
├── layouts            # Layouts for pages
├── lib
│   ├── api            # Server-side functions (controllers, etc.)
│   ├── client         # Client-side functions
│   └── shared         # Shared functions between client and server
├── pages              # Pages and API routes
├── prisma             # Prisma schema and migrations
├── scripts
│   ├── migration      # Scripts for breaking changes
│   └── worker.ts      # Background worker for archiving links
├── store              # Zustand stores
├── styles             # Styles
└── types              # TypeScript types
```

## Versioning

We use semantic versioning for the project. You can track the changes from the [Releases](https://github.com/linkwarden/linkwarden/releases).
