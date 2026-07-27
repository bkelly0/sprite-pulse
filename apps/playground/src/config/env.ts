export const ENV = {
  API_BASE_URL: "",
  WS_URL: "/ws",
  GAME_ENDPOINT: "/api/game",
  PLAYGROUND_PROFILE: process.env.NEXT_PUBLIC_PLAYGROUND_PROFILE ?? "production",
  GO_BACKEND_AUTH_DISABLED:
    (process.env.NEXT_PUBLIC_PLAYGROUND_PROFILE ?? "production") === "local"
} as const;

export function getWebSocketUrl(path = ENV.WS_URL): string {
  if (typeof window === "undefined") {
    return path;
  }

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}${path}`;
}
