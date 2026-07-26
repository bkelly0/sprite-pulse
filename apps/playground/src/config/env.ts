function required(key: string, value: string | undefined): string {
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
}

function trimTrailingSlash(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

const apiBaseUrl = trimTrailingSlash(
  required("API_BASE_URL", import.meta.env.API_BASE_URL)
);
const wsUrl = required("WS_URL", import.meta.env.WS_URL);

export const ENV = {
  API_BASE_URL: apiBaseUrl,
  WS_URL: wsUrl,
  GAME_ENDPOINT: `${apiBaseUrl}/game`
} as const;
