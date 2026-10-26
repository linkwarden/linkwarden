// Minimal SMTP server for e2e tests. Accepts every message and saves it as
// <dir>/<timestamp>-<n>.eml with an extra "X-Rcpt" header listing the recipients.
//
// Usage: node apps/web/e2e/support/mail-sink.mjs <port> <dir>
// Point the app at it with EMAIL_SERVER=smtp://127.0.0.1:<port>
import net from "node:net";
import fs from "node:fs";
import path from "node:path";

const port = Number(process.argv[2] || 2525);
const dir = process.argv[3];

if (!dir) {
  console.error("Usage: node mail-sink.mjs <port> <dir>");
  process.exit(1);
}

fs.mkdirSync(dir, { recursive: true });

let count = 0;

net
  .createServer((socket) => {
    let buffer = "";
    let inData = false;
    let lines = [];
    let recipients = [];

    const reply = (line) => socket.write(line + "\r\n");

    reply("220 mail-sink ESMTP");

    socket.on("data", (chunk) => {
      buffer += chunk.toString("utf8");

      let index;
      while ((index = buffer.indexOf("\r\n")) !== -1) {
        const line = buffer.slice(0, index);
        buffer = buffer.slice(index + 2);

        if (inData) {
          if (line === ".") {
            inData = false;
            count += 1;
            fs.writeFileSync(
              path.join(
                dir,
                `${Date.now()}-${String(count).padStart(5, "0")}.eml`
              ),
              `X-Rcpt: ${recipients.join(",")}\r\n` + lines.join("\r\n")
            );
            lines = [];
            recipients = [];
            reply("250 OK");
          } else lines.push(line.startsWith("..") ? line.slice(1) : line);
          continue;
        }

        const command = line.slice(0, 4).toUpperCase();

        if (command === "EHLO")
          socket.write("250-mail-sink\r\n250 8BITMIME\r\n");
        else if (command === "HELO") reply("250 mail-sink");
        else if (command === "RCPT") {
          recipients.push(
            line.replace(/^RCPT TO:\s*/i, "").replace(/[<>]/g, "")
          );
          reply("250 OK");
        } else if (command === "DATA") {
          inData = true;
          reply("354 End data with <CR><LF>.<CR><LF>");
        } else if (command === "QUIT") {
          reply("221 Bye");
          socket.end();
        } else if (["MAIL", "RSET", "NOOP"].includes(command)) reply("250 OK");
        else reply("502 Not implemented");
      }
    });

    socket.on("error", () => {});
  })
  .listen(port, "127.0.0.1", () =>
    console.log(`mail-sink listening on 127.0.0.1:${port}, writing to ${dir}`)
  );
