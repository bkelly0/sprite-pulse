export type ConnectionStatus =
  | { kind: "connecting"; attempt: number }
  | { kind: "open" }
  | { kind: "closed"; willRetry: boolean }
  | { kind: "error"; error: unknown }
  | { kind: "message-error"; error: unknown };

export type ReconnectingSocketOptions<TMessage> = {
  url: string | (() => string);
  parseMessage: (raw: string) => TMessage;
  onMessage: (message: TMessage) => void;
  onStatusChange?: (status: ConnectionStatus) => void;
  createSocket?: (url: string) => WebSocket;
  shouldReconnect?: (event: CloseEvent) => boolean;
  backoff?: { initialMs?: number; maxMs?: number };
};

export type ReconnectingSocketHandle = {
  close: () => void;
};

const DEFAULT_INITIAL_BACKOFF_MS = 1000;
const DEFAULT_MAX_BACKOFF_MS = 10000;

export function createReconnectingSocket<TMessage>(
  options: ReconnectingSocketOptions<TMessage>,
): ReconnectingSocketHandle {
  const {
    url,
    parseMessage,
    onMessage,
    onStatusChange,
    createSocket = (socketUrl: string) => new WebSocket(socketUrl),
    shouldReconnect = () => true,
    backoff,
  } = options;
  const initialBackoffMs = backoff?.initialMs ?? DEFAULT_INITIAL_BACKOFF_MS;
  const maxBackoffMs = backoff?.maxMs ?? DEFAULT_MAX_BACKOFF_MS;

  let cancelled = false;
  let socket: WebSocket | null = null;
  let reconnectTimeoutId: ReturnType<typeof setTimeout> | null = null;
  let reconnectAttempt = 0;

  function resolveUrl(): string {
    return typeof url === "function" ? url() : url;
  }

  function connect() {
    onStatusChange?.({ kind: "connecting", attempt: reconnectAttempt });

    const nextSocket = createSocket(resolveUrl());
    socket = nextSocket;

    nextSocket.onopen = () => {
      reconnectAttempt = 0;
      onStatusChange?.({ kind: "open" });
    };

    nextSocket.onmessage = (event) => {
      try {
        onMessage(parseMessage(event.data));
      } catch (error: unknown) {
        onStatusChange?.({ kind: "message-error", error });
      }
    };

    nextSocket.onerror = (event) => {
      onStatusChange?.({ kind: "error", error: event });
    };

    nextSocket.onclose = (event) => {
      if (cancelled) {
        return;
      }

      if (!shouldReconnect(event)) {
        cancelled = true;
        onStatusChange?.({ kind: "closed", willRetry: false });
        return;
      }

      //the connection dropped or never opened; retry with backoff
      const delayMs = Math.min(
        initialBackoffMs * 2 ** reconnectAttempt,
        maxBackoffMs,
      );
      reconnectAttempt += 1;
      onStatusChange?.({ kind: "closed", willRetry: true });
      reconnectTimeoutId = setTimeout(connect, delayMs);
    };
  }

  connect();

  return {
    close: () => {
      cancelled = true;
      if (reconnectTimeoutId !== null) {
        clearTimeout(reconnectTimeoutId);
      }
      if (socket) {
        socket.onopen = null;
        socket.onmessage = null;
        socket.onerror = null;
        socket.onclose = null;
        socket.close();
      }
    },
  };
}
