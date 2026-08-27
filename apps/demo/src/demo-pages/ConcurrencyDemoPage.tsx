import { useEffect, useState } from "react";
import { ConcurrencyGameCanvas } from "../components/ConcurrencyGameCanvas";
import { ENV } from "../config/env";

type DemoPageProps = {
  title: string;
};

type CreateGameResponse = {
  game_id: string;
};

export function ConcurrencyDemoPage({ title }: DemoPageProps) {
  const [status, setStatus] = useState("Creating session...");
  const [gameId, setGameId] = useState<string | null>(null);
  const [instanceIds] = useState<number[]>([0, 1]);

  useEffect(() => {
    const abortController = new AbortController();

    void fetch(ENV.GAME_ENDPOINT, {
      method: "POST",
      credentials: "include",
      signal: abortController.signal,
      body: JSON.stringify({demoID: 2})
    })
      .then(async (response) => {
        if (response.status === 503) {
          throw new Error(
            "The demo backend is at capacity right now. Please try again in a few minutes.",
          );
        }

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

      <div className="concurrency-canvas-grid">
        {gameId
          ? instanceIds.map((instanceId) => (
              <ConcurrencyGameCanvas
                key={instanceId}
                gameId={gameId}
                onStatusChange={setStatus}
              />
            ))
          : null}
      </div>
    </section>
    <section>
      <h2>Overview</h2>
      <p>This demo shows a shared multiplayer game state where the backend owns the simulation and the UI is only a renderer. The Go server updates the authoritative world at a fixed simulation tick, while each browser canvas renders on its own local frame rate, so the UI receives state updates asynchronously and interpolates between snapshots to smooth motion. The frontend React app does not compute game logic; it simply displays the latest server state and blends movement between received updates to keep the animation fluid across different timing constraints.</p>      <p>The experience is built around two browser canvases that represent two separate clients connected to the same backend game instance. Each client opens its own WebSocket connection, but they are both subscribed to the same shared runtime. As a result, both users should see the same rendered game state, even though each client is rendering independently from the server’s authoritative updates.</p> 
      <p>The backend is implemented in <strong>Go</strong> and is designed to handle multiple game states concurrently, with multiple users able to connect to the same game session. It runs in a managed cloud environment, is deployed through CI/CD, and is kept private through a direct VPC connection so it is not publicly exposed. Only the UI gateway is allowed to reach it.</p> 
      <p>On the frontend, the <strong>React + TypeScript</strong> app runs through a Next.js server that acts as a secure gateway and proxies requests to the Go backend. This keeps the backend isolated while still allowing the UI to access the game session safely.</p>
    </section>
    </>
  );
}
