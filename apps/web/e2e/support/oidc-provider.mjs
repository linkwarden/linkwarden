// Minimal OpenID Connect provider for e2e tests of the generic "oidc" sign-in.
// It signs in whoever the test asked for: POST /__identity with
// { sub, email, email_verified, name } sets the identity returned by the next
// sign-in. /authorize redirects straight back without any login screen.
//
// Usage: node apps/web/e2e/support/oidc-provider.mjs <port>
// App env: NEXT_PUBLIC_OIDC_ENABLED=true, OIDC_CLIENT_ID=linkwarden-e2e,
//   OIDC_CLIENT_SECRET=linkwarden-e2e-secret,
//   OIDC_WELLKNOWN_URL=http://127.0.0.1:<port>/.well-known/openid-configuration
import http from "node:http";
import { randomBytes } from "node:crypto";
import { exportJWK, generateKeyPair, SignJWT } from "jose";

const port = Number(process.argv[2] || 3999);
const issuer = `http://127.0.0.1:${port}`;

const { publicKey, privateKey } = await generateKeyPair("RS256");
const jwk = {
  ...(await exportJWK(publicKey)),
  kid: "e2e",
  alg: "RS256",
  use: "sig",
};

let nextIdentity = null;
const codes = new Map();

const json = (res, status, body) => {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
};

const readBody = (req) =>
  new Promise((resolve) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => resolve(data));
  });

const idToken = (identity, clientId, nonce) =>
  new SignJWT({ ...identity, ...(nonce ? { nonce } : {}) })
    .setProtectedHeader({ alg: "RS256", kid: "e2e" })
    .setIssuer(issuer)
    .setAudience(clientId)
    .setSubject(identity.sub)
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(privateKey);

http
  .createServer(async (req, res) => {
    const url = new URL(req.url, issuer);

    if (url.pathname === "/.well-known/openid-configuration")
      return json(res, 200, {
        issuer,
        authorization_endpoint: `${issuer}/authorize`,
        token_endpoint: `${issuer}/token`,
        userinfo_endpoint: `${issuer}/userinfo`,
        jwks_uri: `${issuer}/jwks`,
        response_types_supported: ["code"],
        subject_types_supported: ["public"],
        id_token_signing_alg_values_supported: ["RS256"],
        token_endpoint_auth_methods_supported: [
          "client_secret_basic",
          "client_secret_post",
        ],
        code_challenge_methods_supported: ["S256"],
      });

    if (url.pathname === "/jwks") return json(res, 200, { keys: [jwk] });

    if (url.pathname === "/__identity" && req.method === "POST") {
      nextIdentity = JSON.parse(await readBody(req));
      return json(res, 200, { ok: true });
    }

    if (url.pathname === "/authorize") {
      if (!nextIdentity) return json(res, 400, { error: "no identity set" });

      const code = randomBytes(16).toString("hex");
      codes.set(code, {
        identity: nextIdentity,
        clientId: url.searchParams.get("client_id"),
        nonce: url.searchParams.get("nonce"),
      });

      const redirect = new URL(url.searchParams.get("redirect_uri"));
      redirect.searchParams.set("code", code);
      if (url.searchParams.get("state"))
        redirect.searchParams.set("state", url.searchParams.get("state"));

      res.writeHead(302, { Location: redirect.toString() });
      return res.end();
    }

    if (url.pathname === "/token" && req.method === "POST") {
      const params = new URLSearchParams(await readBody(req));
      const grant = codes.get(params.get("code"));
      if (!grant) return json(res, 400, { error: "invalid_grant" });
      codes.delete(params.get("code"));

      return json(res, 200, {
        access_token: `at-${grant.identity.sub}`,
        token_type: "Bearer",
        expires_in: 300,
        id_token: await idToken(grant.identity, grant.clientId, grant.nonce),
      });
    }

    if (url.pathname === "/userinfo") {
      const sub = (req.headers.authorization || "").replace(/^Bearer at-/, "");
      return json(res, 200, { ...(nextIdentity || {}), sub });
    }

    json(res, 404, { error: "not_found" });
  })
  .listen(port, "127.0.0.1", () =>
    console.log(`oidc-provider listening on ${issuer}`)
  );
