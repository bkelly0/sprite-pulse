export const ENV = {
  API_BASE_URL: "",
  WS_URL: "/ws",
  GAME_ENDPOINT: "/api/game"
} as const;

export function getWebSocketUrl(path = ENV.WS_URL): string {
  if (typeof window === "undefined") {
    return path;
  }

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}${path}`;
}
