import http from "node:http";
import next from "next";
import httpProxy from "http-proxy";
import googleAuthLibrary from "google-auth-library";
import nextEnv from "@next/env";

const { createProxyServer } = httpProxy;
const { GoogleAuth } = googleAuthLibrary;
const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());

const port = Number(process.env.PORT ?? 4000);
const backendUrl = process.env.GO_BACKEND_URL ?? "http://localhost:8080";
const playgroundProfile = process.env.NEXT_PUBLIC_PLAYGROUND_PROFILE ?? "production";
const backendAuthDisabled = playgroundProfile === "local";
const dev = process.env.NODE_ENV !== "production";
const backendTargetUrl = new URL(backendUrl);
const backendAudience = backendTargetUrl.origin;
const backendAuthClient = backendAuthDisabled ? null : new GoogleAuth();
let backendAuthClientPromise = null;

const app = next({ dev, hostname: "0.0.0.0", port });
const handle = app.getRequestHandler();
const proxy = createProxyServer({
  changeOrigin: true,
  target: backendTargetUrl.toString(),
  ws: true
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
    backendAuthClientPromise = backendAuthClient.getIdTokenClient(backendAudience);
  }

  const authClient = await backendAuthClientPromise;
  const headers = await authClient.getRequestHeaders();
  const authorizationHeader = headers.authorization ?? headers.Authorization;

  if (typeof authorizationHeader === "string" && authorizationHeader.length > 0) {
    req.headers.authorization = authorizationHeader;
  }
}

await app.prepare();

const server = http.createServer(async (req, res) => {
  if (!req.url) {
    res.statusCode = 400;
    res.end("Missing request URL.");
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
  if (!req.url || (!req.url.startsWith("/ws") && !req.url.startsWith("/api/ws"))) {
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
      console.error(`WebSocket proxy failed for ${req.url ?? "unknown"}:`, message);
      socket.destroy();
    }
  })();
});

server.listen(port, () => {
  console.log(`Playground proxy listening on http://localhost:${port}`);
  console.log(`Proxying Go backend traffic to ${backendUrl}`);
  console.log(
    backendAuthDisabled
      ? `Backend auth header injection is disabled for profile ${playgroundProfile}.`
      : `Backend auth header injection is enabled for profile ${playgroundProfile}.`
  );
});