import crypto from "crypto";
import http from "http";
import type { AddressInfo } from "net";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

// A stand-in S3 endpoint that keeps objects in memory and records the headers
// of every request, to check what the client sends S3-compatible services
const objects = new Map<string, Buffer>();
const requests: {
  method: string;
  url: string;
  headers: http.IncomingHttpHeaders;
  body: Buffer;
}[] = [];

const server = http.createServer((req, res) => {
  const chunks: Buffer[] = [];
  req.on("data", (chunk) => chunks.push(chunk));
  req.on("end", () => {
    const body = Buffer.concat(chunks);
    const url = new URL(req.url!, "http://s3.test");
    const key = decodeURIComponent(url.pathname.split("/").slice(2).join("/"));
    requests.push({
      method: req.method!,
      url: req.url!,
      headers: req.headers,
      body,
    });

    if (req.method === "PUT") {
      objects.set(key, body);
      return res.writeHead(200, { etag: '"etag"' }).end();
    }
    if (req.method === "HEAD") {
      const object = objects.get(key);
      return res
        .writeHead(
          object ? 200 : 404,
          object ? { "content-length": object.length } : {}
        )
        .end();
    }
    if (req.method === "GET" && key) {
      const object = objects.get(key);
      if (!object) return res.writeHead(404).end();
      return res
        .writeHead(200, { "content-length": object.length })
        .end(object);
    }
    if (req.method === "GET") {
      const prefix = url.searchParams.get("prefix") || "";
      const contents = [...objects.keys()]
        .filter((k) => k.startsWith(prefix))
        .map(
          (k) =>
            `<Contents><Key>${k}</Key><Size>${
              objects.get(k)!.length
            }</Size></Contents>`
        )
        .join("");
      return res
        .writeHead(200, { "content-type": "application/xml" })
        .end(
          `<ListBucketResult><IsTruncated>false</IsTruncated>${contents}</ListBucketResult>`
        );
    }
    if (req.method === "POST" && url.searchParams.has("delete")) {
      const keys = [...body.toString().matchAll(/<Key>([^<]*)<\/Key>/g)].map(
        (m) => m[1]
      );
      keys.forEach((k) => objects.delete(k));
      return res
        .writeHead(200, { "content-type": "application/xml" })
        .end(
          `<DeleteResult>${keys
            .map((k) => `<Deleted><Key>${k}</Key></Deleted>`)
            .join("")}</DeleteResult>`
        );
    }
    res.writeHead(400).end();
  });
});

const checksumHeaders = (headers: http.IncomingHttpHeaders) =>
  Object.keys(headers).filter(
    (h) => h.startsWith("x-amz-checksum") || h.startsWith("x-amz-sdk-checksum")
  );
const md5 = (data: Buffer | string) =>
  crypto.createHash("md5").update(data).digest("base64");

let fsHelpers: typeof import("./index");

beforeAll(async () => {
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  vi.stubEnv(
    "SPACES_ENDPOINT",
    `http://127.0.0.1:${(server.address() as AddressInfo).port}`
  );
  vi.stubEnv("SPACES_REGION", "us-east-1");
  vi.stubEnv("SPACES_KEY", "key");
  vi.stubEnv("SPACES_SECRET", "secret");
  vi.stubEnv("SPACES_BUCKET_NAME", "linkwarden");
  vi.stubEnv("SPACES_FORCE_PATH_STYLE", "true");
  vi.spyOn(console, "log").mockImplementation(() => {});
  fsHelpers = await import("./index");
});

afterAll(() => {
  server.close();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("s3Client", () => {
  it("uploads with Linkwarden's Content-MD5 and no newer checksum headers", async () => {
    requests.length = 0;

    expect(
      await fsHelpers.createFile({
        filePath: "archives/1/1.html",
        data: "<p>hi</p>",
      })
    ).toBe(true);

    const [put] = requests;
    expect(put.method).toBe("PUT");
    expect(put.headers["content-md5"]).toBe(md5("<p>hi</p>"));
    expect(checksumHeaders(put.headers)).toEqual([]);
  });

  it("reads and checks files without asking for checksum validation", async () => {
    objects.set("archives/2/2.html", Buffer.from("<p>hello</p>"));
    requests.length = 0;

    expect(await fsHelpers.fileExists("archives/2/2.html")).toBe(true);
    expect(await fsHelpers.fileExists("archives/2/missing.html")).toBe(false);
    const read = await fsHelpers.readFile("archives/2/2.html");

    expect(read.status).toBe(200);
    expect(String(read.file)).toBe("<p>hello</p>");
    for (const request of requests)
      expect(request.headers["x-amz-checksum-mode"]).toBeUndefined();
  });

  it("deletes a folder with Content-MD5 instead of a CRC32 checksum", async () => {
    objects.set("archives/3/3.html", Buffer.from("html"));
    objects.set("archives/3/3.pdf", Buffer.from("pdf"));
    requests.length = 0;

    await fsHelpers.removeFolder({ filePath: "archives/3" });

    const deleteObjects = requests.find((r) => r.method === "POST")!;
    expect(deleteObjects.headers["content-md5"]).toBe(md5(deleteObjects.body));
    expect(checksumHeaders(deleteObjects.headers)).toEqual([]);
    expect(
      [...objects.keys()].filter((k) => k.startsWith("archives/3/"))
    ).toEqual([]);
  });

  it("leaves folders whose names start with the deleted folder's name", async () => {
    objects.set("archives/4/4.html", Buffer.from("html"));
    objects.set("archives/40/40.html", Buffer.from("html"));
    objects.set("archives/preview/4/4.jpeg", Buffer.from("jpeg"));
    objects.set("archives/preview/40/40.jpeg", Buffer.from("jpeg"));

    await fsHelpers.removeFolder({ filePath: "archives/4" });
    await fsHelpers.removeFolder({ filePath: "archives/preview/4" });

    expect(
      [...objects.keys()].filter((k) => /^archives\/(preview\/)?40?\//.test(k))
    ).toEqual(["archives/40/40.html", "archives/preview/40/40.jpeg"]);
  });
});
