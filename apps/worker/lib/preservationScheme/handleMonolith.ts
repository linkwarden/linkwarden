import { spawn } from "child_process";
import { createFile } from "@linkwarden/filesystem";
import { prisma } from "@linkwarden/prisma";
import { Link } from "@linkwarden/prisma/client";

export default async function handleMonolith(
  link: Link,
  htmlFromPage: string,
  signal: AbortSignal
): Promise<void> {
  if (!link.url) return;

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
      detached: true,
    });

    const abortListener = () => {
      try {
        if (child.pid) killProcess(child.pid);
      } catch {}
      reject(new Error("Monolith aborted"));
    };
    signal?.addEventListener("abort", abortListener);

    child.stdin.write(htmlFromPage);
    child.stdin.end();

    const chunks: Buffer[] = [];
    child.stdout.on("data", (c) => chunks.push(c));

    child.on("error", (err) => {
      cleanup();
      reject(err);
    });

    child.on("close", async (code) => {
      cleanup();

      if (code !== 0) {
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

      await createFile({
        data: html,
        filePath: `archives/${link.collectionId}/${link.id}.html`,
      });

      await prisma.link.update({
        where: { id: link.id },
        data: { monolith: `archives/${link.collectionId}/${link.id}.html` },
      });

      resolve();
    });

    function cleanup() {
      signal?.removeEventListener("abort", abortListener);
    }
  });
}

const killProcess = async (PID: number) => {
  if (process.platform === "win32") {
    process.kill(PID, "SIGKILL");
  } else {
    process.kill(-PID, "SIGKILL");
  }
};
