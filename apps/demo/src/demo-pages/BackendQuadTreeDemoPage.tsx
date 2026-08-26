import { useEffect, useState } from "react";
import { ENV } from "../config/env";
import { BackendQuadTreeDemoComponent } from "../components/BackendQuadTreeDemoComponent";

type DemoPageProps = {
  title: string;
};

type CreateGameResponse = {
  game_id: string;
};

export function BackendQuadTreeDemoPage({ title }: DemoPageProps) {
  const [status, setStatus] = useState("Creating session...");
  const [gameId, setGameId] = useState<string | null>(null);
  const [instanceIds] = useState<number[]>([0, 1]);

  useEffect(() => {
    const abortController = new AbortController();

    void fetch(ENV.GAME_ENDPOINT, {
      method: "POST",
      credentials: "include",
      signal: abortController.signal,
      body: JSON.stringify({demoID: 3})
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(
            `Game creation failed with status ${response.status}.`,
          );
        }

        const data = (await response.json()) as CreateGameResponse;
        setGameId(data.game_id);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setStatus(
          error instanceof Error
            ? error.message
            : "Failed to create game session.",
        );
      });

    return () => {
      abortController.abort();
    };
  }, []);

  return (
    <>
    <section>
      <h1>{title}</h1>
      <p>{status}</p>
      {gameId && (
        <BackendQuadTreeDemoComponent gameId={gameId} onStatusChange={setStatus}/>
      )}
    </section>
    <section>
      <h2>Overview</h2>
      <p>This demo shows a large, dynamic game state where the <strong>Go</strong> backend owns the simulation and runs collision detection using a quad tree, while the client is purely a renderer for the results it receives over a WebSocket. Every simulation tick, the server advances each sprite's position, rebuilds a quad tree over the current frame, and uses it to find overlapping pairs far faster than checking every sprite against every other sprite.</p>
      <p>To make the algorithm visible instead of just its outcome, the backend is returning the bounding box of every node it visited (root down to leaves) as part of the state payload. Sprites involved in a collision are flagged with a state value the client uses to change their appearance. The frontend draws each of those node boundaries so you can watch the tree subdivide more densely wherever sprites are clustered together.</p>
      <h3>How Sprite Pulse Handles the Network and Motion</h3>
      <ul>
        <li>
          A <code>createReconnectingSocket</code> helper opens the WebSocket, parses each incoming <code>state_update</code> message, and automatically re-establishes the connection if it drops, reporting status changes back to the page.
        </li>
        <li>
          Incoming states are pushed into a <code>StateBuffer</code> rather than applied immediately. The buffer keeps a short history of timestamped snapshots so the renderer always has a "previous" and "current" state to work from, decoupling the server's ~30Hz tick rate from the browser's render loop.
        </li>
        <li>
          Each render frame, <code>getInterpolationPair()</code> picks the two snapshots surrounding "now," and <code>computeInterpolationAlpha</code> turns the elapsed time since the current snapshot arrived into a 0-1 blend factor based on the expected server tick interval.
        </li>
        <li>
          <code>syncById</code> reconciles the sprite pool against the current/previous snapshot pairs by ID, creating new <code>Sprite</code> instances for new server IDs and reusing existing ones otherwise, and <code>interpolatePoint</code> blends each sprite's previous and current position by that alpha so motion stays smooth even though updates only arrive every ~33ms.
        </li>
      </ul>
      <p>The result is a clear separation of concerns: the Go backend is the single source of truth for positions, collisions, and the quad tree's internal structure, and the browser's only job is to interpolate between authoritative snapshots and draw both the sprites and the search structure that found their collisions.</p>
    </section>
    </>
  );
}
