import { ScrollingDemoComponent } from "../components/ScrollingDemoComponent";


export function ScrollingDemoPage() {

  return (
    <>
      <section>
        <h1>Scrolling and Parallax Demo</h1>
        <ScrollingDemoComponent />
      </section>
      <section>
        <h2>Scrolling Demo Overview</h2>{" "}
        <p>
          This demo shows camera-based world scrolling with layered sprites.
          Instead of moving every sprite each frame, it moves a camera across a
          larger tile map, and Sprite-Pulse renders the visible portion of the
          scene.
        </p>
        <h3>What the Demo Is Doing</h3>
        <ul>
          <li>
            Builds a world that is larger than the canvas (a 3x area in both
            directions).
          </li>
          <li>Creates two tile layers from a shared image bundle.</li>
          <li>
            Moves the camera in both X and Y, reversing direction at bounds for
            continuous panning.
          </li>
          <li>
            Renders layers each frame through the Sprite-Pulse loop callback.
          </li>
        </ul>
        <h3>Key Concepts</h3>
        <ul>
          <li>
            Camera-driven rendering: world coordinates stay stable while the
            viewport moves.
          </li>
          <li>
            Layered composition: a base tile layer plus a marker layer rendered on top.
          </li>
          <li>
            Parallax support: one layer uses a lower parallax factor (0.5), so
            it scrolls more slowly and creates depth.
          </li>
          <li>
            Sprite bundle reuse: both tile textures come from one
            SpriteSheetBundle for efficient texture management.
          </li>
        </ul>
      </section>
    </>
  );
}
