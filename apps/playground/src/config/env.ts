function isEnabled(value: string | undefined): boolean {
  if (!value) {
    return false;
  }

  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function toWebSocketOrigin(httpOrigin: string): string {
  if (httpOrigin.startsWith("https://")) {
    return `wss://${httpOrigin.slice("https://".length)}`;
  }

  if (httpOrigin.startsWith("http://")) {
    return `ws://${httpOrigin.slice("http://".length)}`;
  }

  return httpOrigin;
}

const useProxy = isEnabled(process.env.NEXT_PUBLIC_ENABLE_PROXY);
const backendHttpOrigin = trimTrailingSlash(
  process.env.GO_BACKEND_URL ??
    process.env.NEXT_PUBLIC_GO_BACKEND_URL ??
    "http://localhost:8080"
);
const backendWebSocketOrigin = toWebSocketOrigin(backendHttpOrigin);

export const ENV = {
  API_BASE_URL: useProxy ? "" : backendHttpOrigin,
  WS_URL: useProxy ? "/ws" : `${backendWebSocketOrigin}/ws`,
  GAME_ENDPOINT: useProxy ? "/api/game" : `${backendHttpOrigin}/game`,
  PROXY_ENABLED: useProxy,
  GO_BACKEND_AUTH_DISABLED: !isEnabled(process.env.GCP_BACKEND_AUTH_ENABLED)
} as const;

export function getWebSocketUrl(path = ENV.WS_URL): string {
  if (/^wss?:\/\//i.test(path)) {
    return path;
  }

  if (typeof window === "undefined") {
    return path;
  }

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}${path}`;
}
