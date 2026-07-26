function required(key: string, value: string | undefined): string {
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
}

function resolveEnvValue(
  key: string,
  value: string | undefined,
  developmentDefault: string
): string {
  if (value && value.trim().length > 0) {
    return value;
  }

  if (import.meta.env.DEV) {
    return developmentDefault;
  }

  return required(key, value);
}

function trimTrailingSlash(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

const apiBaseUrl = trimTrailingSlash(
  resolveEnvValue("API_BASE_URL", import.meta.env.API_BASE_URL, "http://localhost:8080")
);
const wsUrl = resolveEnvValue("WS_URL", import.meta.env.WS_URL, "ws://localhost:8080/ws");

export const ENV = {
  API_BASE_URL: apiBaseUrl,
  WS_URL: wsUrl,
  GAME_ENDPOINT: `${apiBaseUrl}/game`
} as const;
