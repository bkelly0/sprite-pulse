import { useEffect, useRef } from "react";
import { Sprite, SpritePulse, SpriteSheetBundle } from "@bkelly0/sprite-pulse";
import { ENV, getWebSocketUrl } from "../config/env";

const TARGET_FPS = 60;
const FRAME_INTERVAL_MS = 1000 / TARGET_FPS;
const SERVER_TICK_INTERVAL_MS = 1000 / 30;

type GameStateRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type GameStateSprite = {
  id: number;
  type?: number;
  rect: GameStateRect;
};

type GameState = {
  game_id: string;
  sprites: GameStateSprite[];
};

type StateUpdateMessage = {
  type: "state_update";
  state: GameState;
};

type ReceivedGameState = {
  receivedAt: number;
  state: GameState;
};

type ConcurrencyGameCanvasProps = {
  gameId: string;
  onStatusChange: (status: string) => void;
  width?: number;
  height?: number;
};

export function ConcurrencyGameCanvas({
  gameId,
  onStatusChange,
  width = 400,
  height = 300
}: ConcurrencyGameCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const recentGameStatesRef = useRef<ReceivedGameState[]>([]);
  const spriteMap = new Map<number, Sprite>();

  useEffect(() => {
    const socket = new WebSocket(getWebSocketUrl(ENV.WS_URL));

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as StateUpdateMessage;
        if (message.type !== "state_update") {
          return;
        }

        recentGameStatesRef.current = [
          ...recentGameStatesRef.current,
          {
            receivedAt: performance.now(),
            state: message.state
          }
        ].slice(-2);
      } catch (error: unknown) {
        onStatusChange(
          error instanceof Error
            ? `WebSocket parse error: ${error.message}`
            : "WebSocket parse error."
        );
      }
    };

    socket.onerror = () => {
      onStatusChange(`WebSocket connection failed for game ${gameId}.`);
    };

    return () => {
      socket.close();
    };
  }, [gameId, onStatusChange]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    let isDisposed = false;
    let frameId: number | null = null;
    let lastFrameTime = 0;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    container.replaceChildren(canvas);

    const particleBundle = SpriteSheetBundle.fromImageFiles("particles", [
      "/images/particle1.png",
      "/images/particle2.png"
    ]);
    const spritePulse = new SpritePulse(canvas, [particleBundle]);


    void spritePulse
      .waitUntilReady()
      .then(() => {
        if (isDisposed) {
          return;
        }

      const particleSheets = [
        particleBundle.createSingleFrameSpriteSheet("/images/particle1.png"),
        particleBundle.createSingleFrameSpriteSheet("/images/particle2.png")
      ];

      if (spriteMap.size === 0) {
        for (const spriteData of recentGameStatesRef.current[recentGameStatesRef.current.length - 1]?.state.sprites ?? []) {
            if (spriteData.type === undefined || spriteData.type < 3) {
const sprite = new Sprite(
          spriteData.rect.x,
          spriteData.rect.y,
          spriteData.rect.width,
          spriteData.rect.height,
          particleSheets[spriteData.id % particleSheets.length]
        );
            spriteMap.set(spriteData.id, sprite);
            }
        }
      }

        onStatusChange(`Running game ${gameId}...`);

        const loop = (timestamp: number) => {
          if (isDisposed) {
            return;
          }

          if (timestamp-lastFrameTime < FRAME_INTERVAL_MS) {
            frameId = requestAnimationFrame(loop);
            return;
          }

          lastFrameTime = timestamp;

          try {
            const recentStates = recentGameStatesRef.current;
            if (recentStates.length === 2) {
              const previousState = recentStates[0];
              const currentState = recentStates[1];
              const elapsedSinceCurrentState = Math.max(
                0,
                timestamp - currentState.receivedAt
              );
              const interpolationAlpha = Math.min(
                1,
                elapsedSinceCurrentState / SERVER_TICK_INTERVAL_MS
              );

              for (const spriteData of currentState.state.sprites) {
                const previousSpriteData = previousState.state.sprites.find(
                  (candidate) => candidate.id === spriteData.id
                );
                const sprite = spriteMap.get(spriteData.id);

                if (!sprite) {
                  spriteMap.set(
                    spriteData.id,
                    new Sprite(
                      spriteData.rect.x,
                      spriteData.rect.y,
                      spriteData.rect.width,
                      spriteData.rect.height,
                    particleSheets[spriteData.id % particleSheets.length]
                    )
                  );
                  continue;
                }

                if (!previousSpriteData) {
                  sprite.setPosition(spriteData.rect.x, spriteData.rect.y);
                  continue;
                }

                sprite.setPosition(
                  lerp(
                    previousSpriteData.rect.x,
                    spriteData.rect.x,
                    interpolationAlpha
                  ),
                  lerp(
                    previousSpriteData.rect.y,
                    spriteData.rect.y,
                    interpolationAlpha
                  )
                );
              }
            }

            spritePulse.render(Array.from(spriteMap.values()));
          } catch (error: unknown) {
            const message =
              error instanceof Error ? error.message : "Unexpected render error.";
            onStatusChange(`Loop recovered: ${message}`);
          } finally {
            if (!isDisposed) {
              frameId = requestAnimationFrame(loop);
            }
          }
        };

        frameId = requestAnimationFrame(loop);
      })
      .catch((error: unknown) => {
        if (isDisposed) {
          return;
        }

        onStatusChange(
          error instanceof Error ? error.message : "Unexpected loading error."
        );
      });

    return () => {
      isDisposed = true;
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
      }
      spritePulse.dispose();
      container.replaceChildren();
    };
  }, [gameId, height, onStatusChange, width]);

  return <div ref={containerRef} />;
}

function lerp(start: number, end: number, alpha: number): number {
  return start + (end - start) * alpha;
}
