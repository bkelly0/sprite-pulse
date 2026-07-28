function isEnabled(value: string | undefined): boolean {
  if (!value) {
    return false;
  }

  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

export const ENV = {
  API_BASE_URL: "",
  WS_URL: "/ws",
  GAME_ENDPOINT: "/api/game",
  GO_BACKEND_AUTH_DISABLED: !isEnabled(process.env.GCP_BACKEND_AUTH_ENABLED)
} as const;

export function getWebSocketUrl(path = ENV.WS_URL): string {
  if (typeof window === "undefined") {
    return path;
  }

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}${path}`;
}
