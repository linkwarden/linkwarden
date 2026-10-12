import { spawn } from "child_process";
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { createFile } from "@linkwarden/filesystem";
import { prisma } from "@linkwarden/prisma";
import { Link } from "@linkwarden/prisma/client";
import sanitizeHtmlForMonolith from "./sanitizeHtmlForMonolith";
import { getSsrfProxyUrl } from "../ssrfProxy";

const TEMP_ROOT = path.join(os.tmpdir(), "linkwarden-monolith");

const STALE_RUN_MS = 60 * 60 * 1000;

async function createRunDir(): Promise<string | null> {
  try {
    await fs.mkdir(TEMP_ROOT, { recursive: true });
    return await fs.mkdtemp(path.join(TEMP_ROOT, "run-"));
  } catch {
    return null; // Read-only or full /tmp; fall back to monolith's default.
  }
}

async function removeStaleRunDirs(): Promise<void> {
  try {
    const cutoff = Date.now() - STALE_RUN_MS;

    for (const entry of await fs.readdir(TEMP_ROOT)) {
      const runDir = path.join(TEMP_ROOT, entry);
      if ((await fs.stat(runDir)).mtimeMs < cutoff) {
        await fs.rm(runDir, { recursive: true, force: true });
      }
    }
  } catch {}
}

export default async function handleMonolith(
  link: Link,
  htmlFromPage: string,
  signal: AbortSignal
): Promise<void> {
  if (!link.url) return;

  const pageContent = await sanitizeHtmlForMonolith(htmlFromPage, link.url);

  const proxyUrl =
    process.env.ALLOW_PRIVATE_NETWORK_ACCESS === "true"
      ? null
      : await getSsrfProxyUrl();

  await removeStaleRunDirs();
  const runDir = await createRunDir();
  const tempDirEnv = runDir ? { TMPDIR: runDir } : {};

  return new Promise<void>((resolve, reject) => {
    const args = [
      "-",
      "-I",
      "-b",
      link.url,
      ...(process.env.MONOLITH_CUSTOM_OPTIONS
        ? process.env.MONOLITH_CUSTOM_OPTIONS.split(" ")
        : ["-j", "-F", "-q"]),
      "-o",
      "-",
    ] as string[];

    const child = spawn("monolith", args, {
      stdio: ["pipe", "pipe", "inherit"],
      signal,
      killSignal: "SIGKILL",
      env: proxyUrl
        ? {
            ...process.env,
            HTTP_PROXY: proxyUrl,
            HTTPS_PROXY: proxyUrl,
            ALL_PROXY: proxyUrl,
            http_proxy: proxyUrl,
            https_proxy: proxyUrl,
            all_proxy: proxyUrl,
            NO_PROXY: "",
            no_proxy: "",
            ...tempDirEnv,
          }
        : { ...process.env, ...tempDirEnv },
    });

    child.stdin.write(pageContent);
    child.stdin.end();

    const chunks: Buffer[] = [];
    child.stdout.on("data", (c) => chunks.push(c));

    child.on("error", (err) => {
      reject(err);
    });

    child.on("close", async (code) => {
      if (code !== 0 && code !== null) {
        return reject(new Error(`Monolith exited with code ${code}`));
      }

      const html = Buffer.concat(chunks);
      if (!html.length) {
        return reject(new Error("Monolith produced an empty file"));
      }

      const max = 1024 * 1024 * Number(process.env.MONOLITH_MAX_BUFFER || 100);
      if (html.length > max) {
        return reject(new Error("Monolith output exceeded buffer limit"));
      }

      try {
        await createFile({
          data: html,
          filePath: `archives/${link.collectionId}/${link.id}.html`,
        });

        await prisma.link.update({
          where: { id: link.id },
          data: { monolith: `archives/${link.collectionId}/${link.id}.html` },
        });

        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }).finally(() => {
    if (runDir) {
      return fs.rm(runDir, { recursive: true, force: true }).catch(() => {});
    }
  });
}
