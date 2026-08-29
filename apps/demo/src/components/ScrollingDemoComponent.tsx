import { useEffect, useRef, useState } from "react";
import {
  Sprite,
  SpritePulse,
  SpriteSheetBundle,
  Camera,
  SpritePulseLayer,
  Rect
} from "@bkelly0/sprite-pulse";


export function ScrollingDemoComponent() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [status, setStatus] = useState("Initializing...");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    let isDisposed = false;
    let skyLayer: SpritePulseLayer = { sprites: [], parallax: .25}
    let tileLayer: SpritePulseLayer = { sprites: [], parallax: 0.5 };
    let tileLayer2: SpritePulseLayer = { sprites: [] };

    const sceneBundle = SpriteSheetBundle.fromImageFiles("scrolling-demo", [
      "/images/tile1.png",
      "/images/tile2.png",
      "/images/cloudTiles.png",
    ]);
    const camera = new Camera(0, 0, canvas.width, canvas.height);
    const spritePulse = new SpritePulse(canvas, [sceneBundle], camera);

    void spritePulse
      .waitUntilReady()
      .then(() => {
        if (isDisposed) {
          return;
        }

        const skySheet =
          sceneBundle.createSpriteSheet("/images/cloudTiles.png",Rect.fromGrid(100, 100, 1, 4));
        const tileSheet =
          sceneBundle.createSingleFrameSpriteSheet("/images/tile1.png");
        const markerSheet =
          sceneBundle.createSingleFrameSpriteSheet("/images/tile2.png");

        let counter = 0;
        for (let x = 0; x < canvas.width * 3; x += 100) {
          for (let y = 0; y < canvas.height * 3; y += 100) {
            counter++;
            const skyTileSprite = new Sprite(x, y, 100, 100, skySheet);
            skyTileSprite.setFrame(Math.round(Math.random()*3));
            skyLayer.sprites.push(skyTileSprite);
            
            //randomly exclude some tiles
            if (Math.random() > .2) {
              tileLayer.sprites.push(new Sprite(x, y, 100, 100, tileSheet));
            }
            if (counter % 2 == 0) {
              tileLayer2.sprites.push(new Sprite(x, y, 100, 100, markerSheet));
            }
          }
        }

        let dirX = 1;
        let dirY = 1;

        setStatus("Running...");
        spritePulse.startLoop(
          () => {
            if (isDisposed) {
              return;
            }

            camera.x += 2 * dirX;
            camera.y += 2 * dirY;
            if (camera.x <= 0 || camera.x >= canvas.width * 2) {
              dirX *= -1;
            }
            if (camera.y <= 0 || camera.y >= canvas.height * 2) {
              dirY *= -1;
            }
            spritePulse.render([skyLayer, tileLayer, tileLayer2]);
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
      tileLayer.sprites = [];
      tileLayer2.sprites = [];
    };
  }, []);

  return (    
    <>
        <p className="status-display">{status}</p>
        <canvas ref={canvasRef} width={800} height={600} />
    </>
  );
}
