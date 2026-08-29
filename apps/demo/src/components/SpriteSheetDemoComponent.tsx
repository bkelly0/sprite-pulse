import { useEffect, useRef, useState } from "react";
import {
  Rect,
  Sprite,
  SpriteAnimation,
  SpritePulse,
  SpriteSheetBundle,
  SpriteSheet,
  type SpriteFlipAxis,
} from "@bkelly0/sprite-pulse";

class BirdSprite extends Sprite {
  startingY: number;
  animationChangeThreshold: number;
  frameCount: number;

  constructor(
    x: number,
    y: number,
    width: number,
    height: number,
    shaderRefOrSpriteSheet: string | SpriteSheet,
    flipX: SpriteFlipAxis
  ) {
    super(x, y, width, height, shaderRefOrSpriteSheet, flipX, 1);
    this.startingY = y;
    this.animationChangeThreshold = 200+Math.round(Math.random() * 1000);
    this.frameCount = 0;
  }

  update(canvas:HTMLCanvasElement): void {
    this.x += 3 * this.flipX;

    if (this.flipX < 0 && this.x < -this.width) {
      this.x = canvas.width + this.width;
    } else if (
      this.flipX > 0 &&
      this.x > canvas.width + this.width
    ) {
      this.x = -this.width;
    }

    this.frameCount++;
    if (this.getAnimation() === "flap") {
      this.y = this.startingY + Math.sin(this.x*2);
      if (this.frameCount > this.animationChangeThreshold) {
        this.setAnimation("glide");
        this.frameCount /= 2;
      }
    } else {
      this.y = this.startingY + Math.sin((this.x/100)*2) * 20;
      if (this.frameCount > this.animationChangeThreshold && Math.abs(this.y-this.startingY) <= 1) {
          this.setAnimation("flap");
          this.frameCount = 0;
      }
    }

  }
}


export function SpriteSheetDemoComponent() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const spritePulseRef = useRef<SpritePulse | null>(null);
  const [status, setStatus] = useState("Initializing...");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    let isDisposed = false;
    let tileLayer: Sprite[] = [];
    let spriteLayer: BirdSprite[] = [];

    //load graphic assets into a bundle
    const sceneBundle = new SpriteSheetBundle("sprite-sheet-demo", [
      "/images/birdSprite.png",
      "/images/cloudTiles.png",
    ]);
    const spritePulse = new SpritePulse(canvas, [sceneBundle]);
    spritePulseRef.current = spritePulse;

    void spritePulse
      .waitUntilReady()
      .then(() => {
        if (isDisposed) {
          return;
        }

        // fetch the tileSheet background shader from the bundle.
        const tileSheet =
          sceneBundle.createSpriteSheet("/images/cloudTiles.png",Rect.fromGrid(100, 100, 1, 4));

        // layout a tiled background
        for (let x = 0; x < canvas.width; x += 100) {
          for (let y = 0; y < canvas.height; y += 100) {
            const s = new Sprite(x, y, 100, 100, tileSheet);
            s.setFrame(Math.floor(Math.random() * 4));
            if (Math.random() > .5) {
              s.setFlipX(-1)
            }
            tileLayer.push(s);
          }
        }

        // define the rectangular regions of the sprite sheet's animation frames
        const ssRects = [
          new Rect(0, 0, 60, 75),
          new Rect(60, 0, 60, 75)
        ];

        // 2 frame animation for flapping wings
        const flappingAnimation = new SpriteAnimation("flap", [
          [0, 12],
          [1, 6],
        ]);
        // single frame glide animation
        const glideAnimation = new SpriteAnimation("glide", [
          [0, 30]
        ])
        // use the bundle to create an animated sprite sheet
        // the image filename is the shader key 
        const spriteSheet = sceneBundle.createSpriteSheet(
          "/images/birdSprite.png",
          ssRects,
          [flappingAnimation, glideAnimation],
          6,
        );

        const rowHeight = 75;
        let rowCount = 0;
        
        for (let y = 0; y < canvas.height; y += rowHeight) {
          rowCount++;
          for (let x = 0; x < canvas.width - 75; x += 220) {
            const startX = x;
            const flipX: SpriteFlipAxis = rowCount % 2 === 0 ? 1 : -1;
            const sprite = new BirdSprite(startX, y, 60, 75, spriteSheet, flipX);
            spriteLayer.push(sprite);
          }
        }
         

        setStatus("Running...");
        spritePulse.startLoop(
          () => {
            if (isDisposed) {
              return;
            }

            for (const sprite of spriteLayer) {
              sprite.update(canvas); 
            }

            spritePulse.render([tileLayer, spriteLayer]);
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
      tileLayer = [];
      spriteLayer = [];
    };
  }, []);

  return (
    <>
      <section>
        <p className="status-display">{status}</p>
        <canvas ref={canvasRef} width={800} height={600} />
      </section>
    </>
  );
}
