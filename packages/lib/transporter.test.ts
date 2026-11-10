import net from "net";
import type { AddressInfo } from "net";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";

// A stand-in SMTP server that offers AUTH, the way many relays do even when
// they also accept mail without it, and records what the client does
let commands: string[] = [];

const server = net.createServer((socket) => {
  let buffer = "";
  let inData = false;
  socket.write("220 smtp.test ESMTP\r\n");
  socket.on("data", (chunk) => {
    buffer += chunk.toString();
    let end;
    while ((end = buffer.indexOf("\r\n")) !== -1) {
      const line = buffer.slice(0, end);
      buffer = buffer.slice(end + 2);
      if (inData) {
        if (line === ".") {
          inData = false;
          socket.write("250 queued\r\n");
        }
        continue;
      }
      const command = line.split(" ")[0].toUpperCase();
      if (command === "EHLO") {
        socket.write("250-smtp.test\r\n250 AUTH PLAIN LOGIN\r\n");
      } else if (command === "AUTH") {
        const [user] = Buffer.from(line.split(" ")[2] || "", "base64")
          .toString()
          .split("\0")
          .slice(1);
        commands.push(`AUTH ${user}`);
        socket.write("235 ok\r\n");
      } else if (command === "DATA") {
        inData = true;
        socket.write("354 go\r\n");
      } else if (command === "QUIT") {
        socket.end("221 bye\r\n");
      } else {
        commands.push(command);
        socket.write("250 ok\r\n");
      }
    }
  });
});

let port: number;

beforeAll(async () => {
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  port = (server.address() as AddressInfo).port;
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

afterAll(() => {
  server.close();
});

const send = async (emailServer: string) => {
  vi.stubEnv("EMAIL_FROM", "linkwarden@lab.test");
  vi.stubEnv("EMAIL_SERVER", emailServer);
  commands = [];
  const transporter = (await import("./transporter")).default;
  await transporter.sendMail({
    from: "linkwarden@lab.test",
    to: "user@lab.test",
    subject: "Test",
    text: "Hello",
  });
  return commands;
};

describe("transporter", () => {
  it("sends without logging in when EMAIL_SERVER has no credentials", async () => {
    expect(await send(`smtp://127.0.0.1:${port}`)).toEqual(["MAIL", "RCPT"]);
  });

  it("logs in with the credentials in EMAIL_SERVER", async () => {
    expect(await send(`smtp://smtp-user:smtp-pass@127.0.0.1:${port}`)).toEqual([
      "AUTH smtp-user",
      "MAIL",
      "RCPT",
    ]);
  });
});
