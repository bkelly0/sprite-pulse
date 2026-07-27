import { useEffect, useRef, useState } from "react";
import { SpritePulse, SpriteSheetBundle } from "sprite-pulse";

type DemoPageProps = {
  title: string;
};

export function SpriteSheetDemoPage({ title }: DemoPageProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const spritePulseRef = useRef<SpritePulse | null>(null);
  const [status, setStatus] = useState("Initializing...");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    let isDisposed = false;
    const bundle = SpriteSheetBundle.fromImageFiles("sprites", [
      "/images/particle1.png",
      "/images/particle2.png",
      "/images/tile1.png"
    ]);
    const spritePulse = new SpritePulse(canvas, [bundle]);
    spritePulseRef.current = spritePulse;

    void spritePulse
      .waitUntilReady()
      .then(() => {
        if (isDisposed) {
          return;
        }

        setStatus("Sprite sheet demo ready.");
        spritePulse.render([]);
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
      spritePulse.dispose();
      spritePulseRef.current = null;
    };
  }, []);

  return (
    <section>
      <h1>{title}</h1>
      <p>{status}</p>
      <canvas ref={canvasRef} width={960} height={540} />
    </section>
  );
}