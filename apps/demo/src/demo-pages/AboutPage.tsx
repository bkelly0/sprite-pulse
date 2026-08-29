export function AboutPage() {
  return (
    <>
    <section>
      <h1>About</h1>
      <p>
        To showcase <strong>Go&apos;s low-latency concurrency</strong> alongside a{" "}
        <strong>TypeScript frontend</strong>, I built a real-time multiplayer 2D
        game architecture. The core requirement was high-throughput state
        synchronization, driving multiple client viewports at 60 FPS.
      </p>
      <p>
        The initial component, <strong>Sprite-Pulse</strong>, is a custom WebGL
        rendering engine built in TypeScript. Rather than using an off-the-shelf
        engine, I developed Sprite-Pulse to explore state interpolation algorithms
        and isolate state rendering from application logic.
      </p>
      <p>
        Note: Backend state demos are configured to have concurrency limits and game states expire to keep the resource cost down.
      </p>
    </section>
    <section className="github-links">
      <a
        className="source-link"
        href="https://github.com/bkelly0/sprite-pulse/"
        target="_blank"
        rel="noreferrer"
      >
        <i className="bi bi-github" aria-hidden="true"></i>
        Sources
      </a>
    </section>
    </>
  );
}