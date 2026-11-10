import { afterAll, beforeAll, describe, expect, it } from "vitest";
import http from "node:http";
import { AddressInfo } from "node:net";
import { Browser, chromium } from "playwright";
import protectPageRequests from "./protectPageRequests";

// Runs a real Chromium (skipped where none is installed) against a loopback
// server, the way the archiver preserves a page, and checks what reaches the
// server. Internal addresses are blocked unless ALLOW_PRIVATE_NETWORK_ACCESS is
// set, so nothing from the page may get through to 127.0.0.1.

let browser: Browser | null = null;
let server: http.Server;
let port: number;
let upgrades: string[] = [];
let requests: string[] = [];

const pageScript = (url: string, tag: string) => `
  window.__done = window.__done || [];
  const ws = new WebSocket(${JSON.stringify(url)});
  ws.onopen = () => { window.__done.push(${JSON.stringify(tag)} + " open"); ws.close(); };
  ws.onerror = () => window.__done.push(${JSON.stringify(tag)} + " error");
  ws.onclose = () => window.__done.push(${JSON.stringify(tag)} + " close");
`;

const workerScript = (url: string) => `
  window.__done = window.__done || [];
  const code = "const ws = new WebSocket(" + ${JSON.stringify(JSON.stringify(url))} + ");" +
    "ws.onopen = () => { postMessage('worker open'); ws.close(); };" +
    "ws.onerror = () => postMessage('worker error');" +
    "ws.onclose = () => postMessage('worker close');";
  const worker = new Worker(URL.createObjectURL(new Blob([code], { type: "text/javascript" })));
  worker.onmessage = (event) => window.__done.push(event.data);
`;

async function openPageAndRun(script: string) {
  const context = await browser!.newContext();
  await protectPageRequests(context);
  const page = await context.newPage();
  await page.setContent("<html><body>archived</body></html>");
  await page.evaluate(script);
  // Give the socket time to connect or be refused
  await page.waitForTimeout(1500);
  const done = await page.evaluate(() => (window as any).__done as string[]);
  await context.close();
  return done;
}

describe("protectPageRequests", () => {
  beforeAll(async () => {
    delete process.env.ALLOW_PRIVATE_NETWORK_ACCESS;
    delete process.env.PLAYWRIGHT_WS_URL;

    server = http.createServer((req, res) => {
      requests.push(req.url ?? "");
      res.writeHead(200, { "content-type": "text/plain" });
      res.end("internal");
    });
    server.on("upgrade", (req, socket) => {
      upgrades.push(req.url ?? "");
      socket.destroy();
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    port = (server.address() as AddressInfo).port;

    browser = await chromium.launch().catch(() => null);
  });

  afterAll(async () => {
    await browser?.close();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it("blocks a page's WebSocket to an internal address", async (ctx) => {
    if (!browser) return ctx.skip();
    upgrades = [];

    const done = await openPageAndRun(
      pageScript(`ws://127.0.0.1:${port}/page`, "page")
    );

    expect(done).not.toContain("page open");
    expect(upgrades).toEqual([]);
  });

  it("blocks a page's fetch to an internal address", async (ctx) => {
    if (!browser) return ctx.skip();
    requests = [];

    const done = await openPageAndRun(`
      window.__done = [];
      fetch("http://127.0.0.1:${port}/page-fetch").then(
        (res) => window.__done.push("fetch " + res.status),
        () => window.__done.push("fetch failed")
      );
    `);

    expect(done).toContain("fetch failed");
    expect(requests).toEqual([]);
  });

  // Open: Playwright's routeWebSocket replaces window.WebSocket with an init
  // script, which doesn't run inside Web Workers, so a socket opened from a
  // worker goes straight to the network.
  it.fails(
    "blocks a WebSocket opened from a Web Worker to an internal address",
    async (ctx) => {
      if (!browser) return ctx.skip();
      upgrades = [];

      const done = await openPageAndRun(
        workerScript(`ws://127.0.0.1:${port}/worker`)
      );

      expect(done).not.toContain("worker open");
      expect(upgrades).toEqual([]);
    }
  );
});
