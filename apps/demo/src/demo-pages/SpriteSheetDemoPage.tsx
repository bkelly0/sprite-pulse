import { SpriteSheetDemoComponent } from "../components/SpriteSheetDemoComponent";

export function SpriteSheetDemoPage() {

  return (
    <>
      <h1>Sprite Sheet Demo</h1>
      <SpriteSheetDemoComponent />
      <section>
        <h2>Overview</h2>
        <p>
          This demos Sprite-Pulse's frame-by-frame animation capability using a sprite sheet. It
          defines a set of frame rectangles within a single source image and
          plays them in sequence to animate each character sprite while the
          sprites move across the canvas.
        </p>
        <h3>How Frame-by-Frame Animation Is Handled</h3>
        <ul>
          
          <li>
            Frame regions (Rect values) are created that map to individual
            poses in the sheet.
          </li>
          <li>
            A SpriteAnimation sequence defines frame order and per-frame timing.
          </li>
          <li>
            Each Sprite references the same SpriteSheet, so many sprites can
            animate from shared frame data.
          </li>
          <li>
            During rendering, Sprite-Pulse advances animation frames and updates
            UV coordinates so the correct sub-rectangle of the texture is
            sampled each frame.
          </li>
        </ul>
        <h3>Results</h3>
        <ul>
          <li>
            Consistent animation playback using timed frame sequences.
          </li>
          <li>
            Efficient reuse of one texture source for multiple animated
            instances.
          </li>
          <li>
            Independent per-sprite motion combined with shared animation
            definitions.
          </li>
        </ul>
      </section>
    </>
  );
}
