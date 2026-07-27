import { useEffect, useRef, useState } from "react";
import { SpritePulse, SpriteSheetBundle } from "sprite-pulse";

type DemoPageProps = {
  title: string;
};

export function ScrollingDemoPage({ title }: DemoPageProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const spritePulseRef = useRef<SpritePulse | null>(null);
  const [status, setStatus] = useState("Initializing...");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const bundle = SpriteSheetBundle.fromImageFiles("scrolling", [
      "/images/tile1.png"
    ]);
    const spritePulse = new SpritePulse(canvas, [bundle]);
    spritePulseRef.current = spritePulse;

    let isDisposed = false;
    let frameId: number | null = null;
    let offset = 0;

    void spritePulse.waitUntilReady().then(() => {
      if (isDisposed) {
        return;
      }

      const sheet = bundle.createSingleFrameSpriteSheet("/images/tile1.png");
      const loop = () => {
        if (isDisposed) {
          return;
        }

        offset = (offset + 1) % canvas.width;
        spritePulse.render([]);
        setStatus(`Scrolling offset: ${offset}`);
        frameId = requestAnimationFrame(loop);
      };

      setStatus("Running scrolling demo...");
      frameId = requestAnimationFrame(loop);
      void sheet;
    });

    return () => {
      isDisposed = true;
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
      }
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