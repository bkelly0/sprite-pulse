import { useEffect, useRef, useState } from "react";
import { Sprite, SpritePulse, SpriteSheet, SpriteSheetBundle } from "sprite-pulse";

type DemoPageProps = {
  title: string;
};

type MovingSprite = {
  sprite: Sprite;
  vx: number;
  vy: number;
};

export function VectorShapesDemoPage({ title }: DemoPageProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [status, setStatus] = useState("Initializing...");
  const [overlayAlpha, setOverlayAlpha] = useState(0.75);
  const [cornerRadius, setCornerRadius] = useState(14);

  const overlayAlphaRef = useRef(overlayAlpha);
  const cornerRadiusRef = useRef(cornerRadius);

  useEffect(() => {
    overlayAlphaRef.current = overlayAlpha;
  }, [overlayAlpha]);

  useEffect(() => {
    cornerRadiusRef.current = cornerRadius;
  }, [cornerRadius]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    let isDisposed = false;
    let frameId: number | null = null;
    let elapsed = 0;

    const bundle = SpriteSheetBundle.fromImageFiles("vector-shapes-demo", [
      "/images/particle1.png",
      "/images/particle2.png"
    ]);
    const spritePulse = new SpritePulse(canvas, [bundle]);

    void spritePulse
      .waitUntilReady()
      .then(() => {
        if (isDisposed) {
          return;
        }

        const sheets: SpriteSheet[] = [
          bundle.createSingleFrameSpriteSheet("/images/particle1.png"),
          bundle.createSingleFrameSpriteSheet("/images/particle2.png")
        ];

        const texturedLayer: MovingSprite[] = [];
        for (let i = 0; i < 90; i++) {
          const sheet = sheets[i % sheets.length];
          const size = 10 + Math.random() * 20;
          texturedLayer.push({
            sprite: new Sprite(
              Math.random() * (canvas.width - size),
              Math.random() * (canvas.height - size),
              size,
              size,
              sheet
            ),
            vx: -1.2 + Math.random() * 2.4,
            vy: -1.2 + Math.random() * 2.4
          });
        }

        const overlayLayer: Sprite[] = [
          Sprite.rectangle(20, 20, 320, 96, {
            fillColor: [0.05, 0.12, 0.2, overlayAlphaRef.current],
            strokeColor: [0.56, 0.82, 1, 1],
            strokeWidth: 3,
            cornerRadius: cornerRadiusRef.current
          }),
          Sprite.rectangle(44, 48, 272, 40, {
            fillColor: [0.08, 0.5, 0.35, overlayAlphaRef.current * 0.8],
            strokeColor: [0.56, 0.95, 0.78, 0.9],
            strokeWidth: 2,
            cornerRadius: Math.max(4, cornerRadiusRef.current - 6)
          }),
          Sprite.rectangle(560, 440, 220, 132, {
            fillColor: [0.2, 0.08, 0.28, overlayAlphaRef.current],
            strokeColor: [0.92, 0.74, 1, 1],
            strokeWidth: 4,
            cornerRadius: cornerRadiusRef.current
          }),
          Sprite.rectangle(590, 468, 160, 24, {
            fillColor: [0.94, 0.79, 0.26, overlayAlphaRef.current],
            strokeColor: null,
            strokeWidth: 0,
            cornerRadius: Math.max(2, cornerRadiusRef.current - 10)
          })
        ];

        const loop = () => {
          if (isDisposed) {
            return;
          }

          elapsed += 0.016;

          for (const entry of texturedLayer) {
            const sprite = entry.sprite;
            sprite.x += entry.vx;
            sprite.y += entry.vy;

            if (sprite.x <= 0 || sprite.x + sprite.width >= canvas.width) {
              entry.vx *= -1;
            }
            if (sprite.y <= 0 || sprite.y + sprite.height >= canvas.height) {
              entry.vy *= -1;
            }
          }

          const pulse = 0.7 + Math.sin(elapsed * 1.4) * 0.2;
          overlayLayer[0].fillColor = [0.05, 0.12, 0.2, overlayAlphaRef.current];
          overlayLayer[0].cornerRadius = cornerRadiusRef.current;
          overlayLayer[1].fillColor = [0.08, 0.5, 0.35, overlayAlphaRef.current * pulse];
          overlayLayer[1].cornerRadius = Math.max(4, cornerRadiusRef.current - 6);
          overlayLayer[2].fillColor = [0.2, 0.08, 0.28, overlayAlphaRef.current];
          overlayLayer[2].cornerRadius = cornerRadiusRef.current;
          overlayLayer[3].fillColor = [0.94, 0.79, 0.26, overlayAlphaRef.current * pulse];
          overlayLayer[3].cornerRadius = Math.max(2, cornerRadiusRef.current - 10);

          spritePulse.render([
            texturedLayer.map((entry) => entry.sprite),
            overlayLayer
          ]);

          frameId = requestAnimationFrame(loop);
        };

        setStatus("Running: textured sprites + rectangle overlays.");
        frameId = requestAnimationFrame(loop);
      })
      .catch((error: unknown) => {
        if (isDisposed) {
          return;
        }

        setStatus(
          error instanceof Error ? error.message : "Unexpected loading error."
        );
      });

    return () => {
      isDisposed = true;
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
      }
      spritePulse.dispose();
    };
  }, []);

  return (
    <section>
      <h1>{title}</h1>
      <p>{status}</p>
      <canvas ref={canvasRef} width={800} height={600} />
      <label>
        Overlay Alpha
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={overlayAlpha}
          onChange={(event) => setOverlayAlpha(Number(event.target.value))}
        />
      </label>
      <label>
        Corner Radius
        <input
          type="range"
          min="0"
          max="36"
          step="1"
          value={cornerRadius}
          onChange={(event) => setCornerRadius(Number(event.target.value))}
        />
      </label>
    </section>
  );
}
