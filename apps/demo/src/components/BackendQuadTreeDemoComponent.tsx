import { useEffect, useRef, useState } from "react";
import {
  Sprite,
  SpritePulse,
  SpriteSheetBundle,
  StateBuffer,
  computeInterpolationAlpha,
  createReconnectingSocket,
  interpolatePoint,
  syncById,
  type ConnectionStatus,
} from "@bkelly0/sprite-pulse";
import { ENV, getWebSocketUrl } from "../config/env";

const TARGET_FPS = 60;
const SERVER_TICK_INTERVAL_MS = 1000 / 30;
const FPS_EMA_ALPHA = 0.15;
const FPS_UI_UPDATE_INTERVAL_MS = 500;
const MIN_INTERPOLATION_INTERVAL_MS = SERVER_TICK_INTERVAL_MS / 2;
const MAX_INTERPOLATION_INTERVAL_MS = SERVER_TICK_INTERVAL_MS * 3;
//matches closeCodeGameExpired on the Go backend
const CLOSE_CODE_GAME_EXPIRED = 4001;

type GameStateRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type GameStateSprite = {
  id: number;
  type?: number;
  state: number;
  rect: GameStateRect;
};

type GameState = {
  game_id: string;
  sprites: GameStateSprite[];
  debug: StateDebug;
};

type StateDebug = {
  qtBounds: GameStateRect[];
}

type StateUpdateMessage = {
  type: "state_update";
  state: GameState;
};

type ConnectionInfoMessage = {
  type: "connection_info";
  connection_id: string;
  game_id?: string;
};

type GameMessage = StateUpdateMessage | ConnectionInfoMessage;

type BackendQuadTreeDemoComponentProps = {
  gameId: string;
  onStatusChange: (status: string) => void;
  width?: number;
  height?: number;
};

export function BackendQuadTreeDemoComponent({
  gameId,
  onStatusChange,
  width = 800,
  height = 600,
}: BackendQuadTreeDemoComponentProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const stateBufferRef = useRef(new StateBuffer<GameState>());
  const spriteMapRef = useRef<Map<number, Sprite>>(new Map<number, Sprite>());
  const stateFPSRef = useRef(0);
  const [renderFPSState, setRenderFPS] = useState(0);
  const [stateFPSState, setStateFPS] = useState(0);
  const [connectionId, setConnectionId] = useState<string | null>(null);

  useEffect(() => {
    let lastStateUpdateTime: number | null = null;
    let lastStateFpsUiUpdateTime = 0;
    let stateDeltaEma = 0;
    stateFPSRef.current = 0;
    function updateStateFPS(now: number) {
        //average the arrival interval rather than the instantaneous rate; 1/dt is convex, so bursty
        //frame delivery would otherwise bias the reported FPS far above the real 30Hz server tick
        if (lastStateUpdateTime !== null) {
          const stateDeltaMs = now - lastStateUpdateTime;
          if (stateDeltaMs > 0 && Number.isFinite(stateDeltaMs)) {
            stateDeltaEma =
              stateDeltaEma === 0
                ? stateDeltaMs
                : stateDeltaEma +
                  FPS_EMA_ALPHA * (stateDeltaMs - stateDeltaEma);
            stateFPSRef.current = 1000 / stateDeltaEma;

            if (
              now - lastStateFpsUiUpdateTime >= FPS_UI_UPDATE_INTERVAL_MS
            ) {
              setStateFPS(stateFPSRef.current);
              lastStateFpsUiUpdateTime = now;
            }
          }
        }
        lastStateUpdateTime = now;
    }

    function describeStatus(status: ConnectionStatus): string | null {
      switch (status.kind) {
        case "error":
          return `WebSocket connection failed for game ${gameId}.`;
        case "closed":
          setConnectionId(null);
          return status.willRetry
            ? null
            : `Game session ${gameId} expired. Reload to start a new one.`;
        case "message-error": {
          const error = status.error;
          return error instanceof Error
            ? `WebSocket parse error: ${error.message}`
            : "WebSocket parse error.";
        }
        default:
          return null;
      }
    }

    const handle = createReconnectingSocket<GameMessage>({
      url: () => getWebSocketUrl(ENV.WS_URL),
      parseMessage: (raw) => JSON.parse(raw) as GameMessage,
      shouldReconnect: (event) => event.code !== CLOSE_CODE_GAME_EXPIRED,
      onMessage: (message) => {
        if (message.type === "connection_info") {
          setConnectionId(message.connection_id);
          return;
        }

        //the state FPS counter
        const now = performance.now();
        updateStateFPS(now);
        stateBufferRef.current.push(message.state, now);
      },
      onStatusChange: (status) => {
        const description = describeStatus(status);
        if (description) {
          onStatusChange(description);
        }
      },
    });

    return () => {
      handle.close();
    };
  }, [gameId, onStatusChange]);

  useEffect(() => {
    let renderDeltaEma = 0;
    let lastRenderFpsUiUpdate = 0;

    const container = containerRef.current;
    if (!container) {
      return;
    }

    let isDisposed = false;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    container.replaceChildren(canvas);

    const bundle = SpriteSheetBundle.fromImageFiles("particles", [
      "/images/particle3.png",
      "/images/particle4.png",
      "/images/particle5.png",
      "/images/particle6.png",
    ]);
    const spritePulse = new SpritePulse(canvas, [bundle]);

    void spritePulse
      .waitUntilReady()
      .then(() => {
        if (isDisposed) {
          return;
        }

        const spriteSheets = [
          bundle.createSingleFrameSpriteSheet("/images/particle3.png"),
          bundle.createSingleFrameSpriteSheet("/images/particle4.png"),
          bundle.createSingleFrameSpriteSheet("/images/particle5.png"),
          bundle.createSingleFrameSpriteSheet("/images/particle6.png")
        ];


        if (spriteSheets.length === 0) {
          onStatusChange("No sprite sheets were created.");
          return;
        }

        onStatusChange(`Running game ${gameId}...`);

        spritePulse.startLoop(
          ({ timestamp, deltaMs }) => {
            if (isDisposed) {
              return;
            }

            updateRenderFPS(timestamp, deltaMs);

            const interpolationPair = stateBufferRef.current.getInterpolationPair();
            const spritesToRender: Sprite[] = Array.from(spriteMapRef.current.values());

            if (interpolationPair) {
              const previousState = interpolationPair.previous;
              const currentState = interpolationPair.current;
              //use the observed spacing between snapshots so network jitter does not desync interpolation
              const stateIntervalMs = Math.min(
                MAX_INTERPOLATION_INTERVAL_MS,
                Math.max(
                  MIN_INTERPOLATION_INTERVAL_MS,
                  currentState.receivedAt - previousState.receivedAt,
                ),
              );
              const interpolationAlpha = computeInterpolationAlpha(
                Math.max(0, timestamp - currentState.receivedAt),
                stateIntervalMs,
              );

              syncById({
                currentItems: currentState.state.sprites,
                previousItems: previousState.state.sprites,
                targetsById: spriteMapRef.current,
                createTarget: (spriteData) => {
                  let spriteSheet = spriteSheets[spriteData.type ?? 0];
                  
                  return new Sprite(
                    spriteData.rect.x,
                    spriteData.rect.y,
                    spriteData.rect.width,
                    spriteData.rect.height,
                    spriteSheet,
                  );
                },
                updateTarget: (sprite, spriteData, previousSpriteData) => {
                  if (spriteData.state == 1 && sprite.spriteSheet !== spriteSheets[0]) {
                    sprite.setSpriteSheet(spriteSheets[0]);
                  } else if (sprite.spriteSheet == spriteSheets[0]) {
                    sprite.setSpriteSheet(spriteSheets[spriteData.type ?? 0])
                  }
                  
                  if (!previousSpriteData) {
                    sprite.setPosition(spriteData.rect.x, spriteData.rect.y);
                    return;
                  }

                  const interpolatedPosition = interpolatePoint(
                    {
                      x: previousSpriteData.rect.x,
                      y: previousSpriteData.rect.y,
                    },
                    {
                      x: spriteData.rect.x,
                      y: spriteData.rect.y,
                    },
                    interpolationAlpha,
                  );

                  sprite.setPosition(
                    interpolatedPosition.x,
                    interpolatedPosition.y,
                  );
                },
              });

              for (const r of currentState.state.debug.qtBounds) {
                spritesToRender.push(
                  Sprite.rectangle(r.x, r.y, r.width, r.height, {
                    fillColor: [0,0,0,0],
                    strokeColor: [1,1,1,1],
                    strokeWidth: 1
                  })
                );
              }
            }
            spritePulse.render(spritesToRender);
          },
          {
            targetFps: TARGET_FPS,
            onError: (error: unknown) => {
              const message =
                error instanceof Error
                  ? error.message
                  : "Unexpected render error.";
              onStatusChange(`Loop stopped: ${message}`);
            },
          },
        );
      })
      .catch((error: unknown) => {
        if (isDisposed) {
          return;
        }

        onStatusChange(
          error instanceof Error ? error.message : "Unexpected loading error.",
        );
      });

      //method for updating the FPS display for the render
      function updateRenderFPS(timestamp: number, deltaMs: number) {
            if (deltaMs > 0) {
              renderDeltaEma =
                renderDeltaEma === 0
                  ? deltaMs
                  : renderDeltaEma + FPS_EMA_ALPHA * (deltaMs - renderDeltaEma);

              if (
                timestamp - lastRenderFpsUiUpdate >= FPS_UI_UPDATE_INTERVAL_MS
              ) {
                setRenderFPS(1000 / renderDeltaEma);
                lastRenderFpsUiUpdate = timestamp;
              }
            }
      }

    return () => {
      isDisposed = true;
      spritePulse.stopLoop();
      spritePulse.dispose();
      container.replaceChildren();
      spriteMapRef.current.clear();
      stateBufferRef.current.clear();
    };
  }, [gameId, height, onStatusChange, width]);

  return <div>
      <div ref={containerRef} />
      <div>Connection ID: {connectionId ?? "Connecting..."}</div>
      <div>Render FPS: {renderFPSState.toFixed(2)}</div>  
      <div>State update FPS: {stateFPSState.toFixed(2)}</div>
    </div>;
}
