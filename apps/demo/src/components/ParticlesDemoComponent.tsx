import { useEffect, useRef, useState } from "react";
import {
  Sprite,
  SpritePulse,
  SpriteSheet,
  SpriteSheetBundle,
} from "@bkelly0/sprite-pulse";

const FPS_EMA_ALPHA = 0.15;
const FPS_UI_UPDATE_INTERVAL_MS = 500;

class VelocitySprite extends Sprite {
  vx: number;
  vy: number;

  constructor(
    x: number,
    y: number,
    width: number,
    height: number,
    shaderRefOrSpriteSheet: string | SpriteSheet,
    vx: number,
    vy: number,
  ) {
    super(x, y, width, height, shaderRefOrSpriteSheet);
    this.vx = vx;
    this.vy = vy;
  }
}

export function ParticlesDemoComponent() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const spritePulseRef = useRef<SpritePulse | null>(null);
  const [status, setStatus] = useState("Initializing...");
  const [intensity, setIntensity] = useState(0.5);
  const intensityRef = useRef(intensity);
  const [numSprites, setNumSprites] = useState(0);
  const numSpritesRef = useRef(0);
  const [renderFPS, setRenderFPS] = useState(0);

  useEffect(() => {
    intensityRef.current = intensity;
  }, [intensity]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    let isDisposed = false;
    let uiUpdateFrameCount = 0;
    let sprites: VelocitySprite[] = [];
    let renderDeltaEma = 0;
    let lastRenderFpsUiUpdate = 0;

    const particleBundle = SpriteSheetBundle.fromImageFiles("particles", [
      "/images/particle1.png",
      "/images/particle2.png",
      "/images/particle3.png",
      "/images/particle4.png",
      "/images/particle5.png",
      "/images/particle6.png"
    ]);
    const spritePulse = new SpritePulse(canvas, [particleBundle]);
    spritePulseRef.current = spritePulse;

    void spritePulse
      .waitUntilReady()
      .then(() => {
        if (isDisposed) {
          return;
        }

        const particleSheets = [
          particleBundle.createSingleFrameSpriteSheet("/images/particle1.png"),
          particleBundle.createSingleFrameSpriteSheet("/images/particle2.png"),
          particleBundle.createSingleFrameSpriteSheet("/images/particle3.png"),
          particleBundle.createSingleFrameSpriteSheet("/images/particle4.png"),
          particleBundle.createSingleFrameSpriteSheet("/images/particle5.png"),
          particleBundle.createSingleFrameSpriteSheet("/images/particle6.png"),
        ];

        setStatus("Running...");
        spritePulse.startLoop(
          ({ timestamp, deltaMs }) => {
          if (isDisposed) {
            return;
          }

            if (deltaMs > 0) {
              renderDeltaEma =
                renderDeltaEma === 0
                  ? deltaMs
                  : renderDeltaEma + FPS_EMA_ALPHA * (deltaMs - renderDeltaEma);

              if (timestamp - lastRenderFpsUiUpdate >= FPS_UI_UPDATE_INTERVAL_MS) {
                setRenderFPS(1000 / renderDeltaEma);
                lastRenderFpsUiUpdate = timestamp;
              }
            }

            for (let i = 0; i < 40 * intensityRef.current; i++) {
              const texture = particleSheets[Math.floor(Math.random() * 6)];
              const scale = 0.5 + Math.random();
              const vs = new VelocitySprite(
                canvas.width / 2,
                canvas.height / 2,
                15 * scale,
                15 * scale,
                texture,
                getRandomRange(-5.5, 5.5),
                getRandomRange(-8.5, 5.5),
              );
              sprites.push(vs);
            }

            numSpritesRef.current = sprites.length;
            uiUpdateFrameCount += 1;
            if (uiUpdateFrameCount % 60 === 0) {
              setNumSprites(numSpritesRef.current);
            }

            for (const sprite of sprites) {
              sprite.vy += 0.1;
              sprite.x += sprite.vx;
              sprite.y += sprite.vy;
              if (sprite.x < 0 || sprite.x > canvas.width) {
                sprite.vx *= -1;
              }
            }

            sprites = sprites.filter((sprite) => sprite.y <= canvas.height);
            spritePulse.render(sprites);
          },
          {
            targetFps: 60,
            onError: (error: unknown) => {
              const message =
                error instanceof Error
                  ? error.message
                  : "Unexpected render error.";
              setStatus(`Loop stopped: ${message}`);
            },
          },
        );
      })
      .catch((error: unknown) => {
        if (isDisposed) {
          return;
        }

        setStatus(
          error instanceof Error ? error.message : "Unexpected loading error.",
        );
      });

    return () => {
      isDisposed = true;
      spritePulse.stopLoop();
      spritePulse.dispose();
      spritePulseRef.current = null;
      sprites = [];
    };
  }, []);

  function getRandomRange(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  return (
    <section>
      <p>{status}</p>
      <canvas ref={canvasRef} width={800} height={600} />
      <div>Render FPS: {renderFPS.toFixed(2)}</div>
      <div>Number of Sprites: {numSprites}</div>
      <label>
        Intensity
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={intensity}
          onChange={(event) => setIntensity(Number(event.target.value))}
        />
      </label>
     </section>
  );
}
