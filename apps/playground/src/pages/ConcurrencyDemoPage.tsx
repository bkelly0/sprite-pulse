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
  const [instanceIds, setInstanceIds] = useState<number[]>([0]);

  useEffect(() => {
    const abortController = new AbortController();
    let isDisposed = false;

    void fetch(ENV.GAME_ENDPOINT, {
      method: "POST",
      credentials: "include",
      signal: abortController.signal
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Game creation failed with status ${response.status}.`);
        }

        const data = (await response.json()) as CreateGameResponse;
        if (isDisposed) {
          return;
        }

        setGameId(data.game_id);
      })
      .catch((error: unknown) => {
        if (
          isDisposed ||
          (error instanceof DOMException && error.name === "AbortError")
        ) {
          return;
        }

        setStatus(
          error instanceof Error
            ? error.message
            : "Failed to create game session."
        );
      });

    return () => {
      isDisposed = true;
      abortController.abort();
    };
  }, []);

  const addInstance = () => {
    setInstanceIds((current) => [...current, current.length]);
  };

  return (
    <section>
      <h1>{title}</h1>
      <p>{status}</p>
      <p>Game ID: {gameId ?? "Creating session..."}</p>
      <button type="button" onClick={addInstance} disabled={!gameId}>
        Add Instance
      </button>
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
  );
}