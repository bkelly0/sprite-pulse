import http from "node:http";
import next from "next";
import { createProxyServer } from "http-proxy";

const port = Number(process.env.PORT ?? 3000);
const backendUrl = process.env.GO_BACKEND_URL ?? "http://localhost:8080";
const dev = process.env.NODE_ENV !== "production";

const app = next({ dev, hostname: "0.0.0.0", port });
const handle = app.getRequestHandler();
const proxy = createProxyServer({
  changeOrigin: true,
  target: backendUrl,
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

await app.prepare();

const server = http.createServer(async (req, res) => {
  if (!req.url) {
    res.statusCode = 400;
    res.end("Missing request URL.");
    return;
  }

  if (req.url === "/api/game" || req.url.startsWith("/api/game?")) {
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

  if (req.url.startsWith("/api/ws")) {
    req.url = req.url.replace(/^\/api/, "");
  }

  proxy.ws(req, socket, head);
});

server.listen(port, () => {
  console.log(`Playground proxy listening on http://localhost:${port}`);
  console.log(`Proxying Go backend traffic to ${backendUrl}`);
});