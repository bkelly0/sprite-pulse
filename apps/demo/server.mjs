import http from "node:http";
import next from "next";
import httpProxy from "http-proxy";
import googleAuthLibrary from "google-auth-library";
import nextEnv from "@next/env";

const { createProxyServer } = httpProxy;
const { GoogleAuth } = googleAuthLibrary;
const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());

const demoLoaderOrigin = "https://sprite-pulse-demo-loader.bradfordkelly.com";

function isEnabled(value) {
  if (typeof value !== "string") {
    return false;
  }

  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

const port = Number(process.env.PORT ?? 4000);
const backendUrl = process.env.NEXT_GO_PRIVATE_BACKEND_URL ?? "http://localhost:8080";
const backendAuthEnabled = isEnabled(process.env.GCP_BACKEND_AUTH_ENABLED);
const backendAuthDisabled = !backendAuthEnabled;
const dev = process.env.NODE_ENV !== "production";
const backendTargetUrl = new URL(backendUrl);
const backendAudience = backendTargetUrl.origin;
const backendAuthClient = backendAuthDisabled ? null : new GoogleAuth();
let backendAuthClientPromise = null;

const app = next({ dev, hostname: "0.0.0.0", port });
const handle = app.getRequestHandler();
let handleUpgrade = null;
const proxy = createProxyServer({
  changeOrigin: true,
  target: backendTargetUrl.toString(),
  ws: true,
});

proxy.on("error", (error, req, res) => {
  const message = error instanceof Error ? error.message : "Proxy error";
  if (res && "writeHead" in res && !res.headersSent) {
    res.writeHead(502, { "Content-Type": "text/plain" });
    res.end(message);
  }
  console.error(`Proxy request failed for ${req?.url ?? "unknown"}:`, message);
});

async function applyBackendAuthorizationHeader(req) {
  if (!backendAuthClient) {
    return;
  }

  if (!backendAuthClientPromise) {
    backendAuthClientPromise =
      backendAuthClient.getIdTokenClient(backendAudience);
  }

  const authClient = await backendAuthClientPromise;
  const headers = await authClient.getRequestHeaders();
  const authorizationHeader = headers.get("authorization");

  if (authorizationHeader) {
    req.headers.authorization = authorizationHeader;
  }
}

await app.prepare();

if (typeof app.getUpgradeHandler === "function") {
  handleUpgrade = app.getUpgradeHandler();
}

const server = http.createServer(async (req, res) => {
  if (!req.url) {
    res.statusCode = 400;
    res.end("Missing request URL.");
    return;
  }

  if (req.headers.origin === demoLoaderOrigin) {
    res.setHeader("Access-Control-Allow-Origin", demoLoaderOrigin);
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Vary", "Origin");
  }

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.url === "/api/game" || req.url.startsWith("/api/game?")) {
    await applyBackendAuthorizationHeader(req);
    req.url = req.url.replace(/^\/api/, "");
    proxy.web(req, res);
    return;
  }

  await handle(req, res);
});

server.on("upgrade", (req, socket, head) => {
  if (!req.url) {
    socket.destroy();
    return;
  }

  if (!req.url.startsWith("/ws") && !req.url.startsWith("/api/ws")) {
    if (handleUpgrade) {
      handleUpgrade(req, socket, head);
      return;
    }

    socket.destroy();
    return;
  }

  void (async () => {
    try {
      await applyBackendAuthorizationHeader(req);

      if (req.url && req.url.startsWith("/api/ws")) {
        req.url = req.url.replace(/^\/api/, "");
      }

      proxy.ws(req, socket, head);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Proxy error";
      console.error(
        `WebSocket proxy failed for ${req.url ?? "unknown"}:`,
        message,
      );
      socket.destroy();
    }
  })();
});

server.listen(port, () => {
  console.log(`Demo proxy listening on http://localhost:${port}`);
  console.log(`Proxying Go backend traffic to ${backendUrl}`);
  console.log(
    backendAuthDisabled
      ? "Backend auth header injection is disabled (GCP_BACKEND_AUTH_ENABLED is not enabled)."
      : "Backend auth header injection is enabled via GCP_BACKEND_AUTH_ENABLED.",
  );
});
