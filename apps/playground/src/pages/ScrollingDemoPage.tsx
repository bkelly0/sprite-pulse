import { useEffect, useRef, useState } from "react";
import {
  Sprite,
  SpritePulse,
  SpriteSheetBundle,
  Camera,
  SpritePulseLayer
} from "sprite-pulse";

type DemoPageProps = {
  title: string;
};

export function ScrollingDemoPage({ title }: DemoPageProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [status, setStatus] = useState("Initializing...");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    let isDisposed = false;
    let frameId: number | null = null;
    let tileLayer: SpritePulseLayer = { sprites: [], parallax: .5 };
    let tileLayer2: SpritePulseLayer = { sprites: [] };

    const sceneBundle = SpriteSheetBundle.fromImageFiles("scrolling-demo", [
      "/images/tile1.png",
      "/images/tile2.png"
    ]);
    const camera = new Camera(0, 0, canvas.width, canvas.height);
    const spritePulse = new SpritePulse(canvas, [sceneBundle], camera);

    void spritePulse
      .waitUntilReady()
      .then(() => {
        if (isDisposed) {
          return;
        }

        const tileSheet = sceneBundle.createSingleFrameSpriteSheet(
          "/images/tile1.png"
        );
        const markerSheet = sceneBundle.createSingleFrameSpriteSheet(
          "/images/tile2.png"
        );

        let counter = 0;
        for (let x = 0; x < canvas.width*3; x += 100) {
          for (let y = 0; y < canvas.height*3; y += 100) {
            counter++;
            tileLayer.sprites.push(new Sprite(x, y, 100, 100, tileSheet));
            if (counter % 2 == 0) {
              tileLayer2.sprites.push(new Sprite(x, y, 100, 100, markerSheet));
            }
          }
        }

        let dirX = 1;
        let dirY = 1;
        const loop = () => {
          if (isDisposed) {
            return;
          }

          try {
            camera.x += 2 * dirX;
            camera.y += 2 * dirY;
            if (camera.x <= 0 || camera.x >= canvas.width*2) {
              dirX *= -1;
            }
            if (camera.y <= 0 || camera.y >= canvas.height*2) {
              dirY *= -1;
            }
            spritePulse.render([tileLayer, tileLayer2]);
          } catch (error: unknown) {
            const message =
              error instanceof Error ? error.message : "Unexpected render error.";
            setStatus(`Loop recovered: ${message}`);
          } finally {
            if (!isDisposed) {
              frameId = requestAnimationFrame(loop);
            }
          }
        };

        setStatus("Running...");
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
      tileLayer.sprites = [];
      tileLayer2.sprites = [];
    };
  }, []);

  return (
    <section>
      <h1>{title}</h1>
      <p>{status}</p>
      <canvas ref={canvasRef} width={800} height={600} />
    </section>
  );
}
