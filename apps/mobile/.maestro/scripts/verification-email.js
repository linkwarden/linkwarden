// Reads the latest verification email sent to EMAIL from the web e2e mail sink
// (apps/web/e2e/support/mail-sink.mjs, started with an HTTP port as MAIL_SINK_URL).
// Sets output.code for a 6-digit code. Servers before v2.17 send a link instead:
// then output.appLink is the app link their /auth/verify page opens on a phone.
const response = http.get(
  MAIL_SINK_URL + "/messages?to=" + encodeURIComponent(EMAIL)
);
const messages = json(response.body).messages;
const latest = messages.length ? messages[messages.length - 1] : "";

const code = latest.match(/verification code(?: is|:)\s*(\d{6})/i);
const link = latest.match(
  /(https?:\/\/[^\s"<>\/]+)\/auth\/verify\?token=([0-9a-f]+)&email=([^\s"<>&]+)/
);

output.code = code ? code[1] : "";
output.wrongCode = output.code === "000000" ? "000001" : "000000";
output.appLink = link
  ? "linkwarden://verify-email?token=" +
    link[2] +
    "&email=" +
    link[3] +
    "&instance=" +
    encodeURIComponent(link[1])
  : "";
