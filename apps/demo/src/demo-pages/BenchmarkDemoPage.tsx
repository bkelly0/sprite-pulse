import { useEffect, useRef, useState } from "react";
import {
  Sprite,
  SpritePulse,
  SpriteSheet,
  SpriteSheetBundle,
} from "@bkelly0/sprite-pulse";

type DemoPageProps = {
  title: string;
};

type BenchmarkScenario = {
  name: string;
  spriteCount: number;
  layerCount: number;
  textureCount: number;
  useOffscreenBuffer: boolean;
  warmupMs: number;
  sampleMs: number;
};

type BenchmarkResult = {
  scenario: string;
  sprites: number;
  layers: number;
  meanFps: number;
  low1PercentFps: number;
  p50FrameMs: number;
  p95FrameMs: number;
  p99FrameMs: number;
  meanRenderMs: number;
};

type MovingSprite = {
  sprite: Sprite;
  vx: number;
  vy: number;
};

const SCENARIOS: BenchmarkScenario[] = [
  {
    name: "Baseline 1k / 1 layer / 1 texture",
    spriteCount: 1000,
    layerCount: 1,
    textureCount: 1,
    useOffscreenBuffer: false,
    warmupMs: 1200,
    sampleMs: 3500,
  },
  {
    name: "Stress 5k / 1 layer / 2 textures",
    spriteCount: 5000,
    layerCount: 1,
    textureCount: 2,
    useOffscreenBuffer: false,
    warmupMs: 1200,
    sampleMs: 3500,
  },
  {
    name: "Layered 8k / 3 layers / 3 textures",
    spriteCount: 8000,
    layerCount: 3,
    textureCount: 3,
    useOffscreenBuffer: false,
    warmupMs: 1200,
    sampleMs: 3500,
  },
  {
    name: "Layered + Offscreen 8k / 3 layers",
    spriteCount: 8000,
    layerCount: 3,
    textureCount: 3,
    useOffscreenBuffer: true,
    warmupMs: 1200,
    sampleMs: 3500,
  },
  {
    name: "Extreme 15k / 6 layers / 3 textures",
    spriteCount: 15000,
    layerCount: 6,
    textureCount: 3,
    useOffscreenBuffer: false,
    warmupMs: 1500,
    sampleMs: 4000,
  },
  {
    name: "Extreme + Offscreen 20k / 6 layers",
    spriteCount: 20000,
    layerCount: 6,
    textureCount: 3,
    useOffscreenBuffer: true,
    warmupMs: 1500,
    sampleMs: 4000,
  },
];

const TEXTURES = [
  "/images/particle1.png",
  "/images/particle2.png",
  "/images/tile1.png",
] as const;

export function BenchmarkDemoPage({ title }: DemoPageProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const spritePulseRef = useRef<SpritePulse | null>(null);
  const spriteSheetsRef = useRef<SpriteSheet[]>([]);
  const runIdRef = useRef(0);

  const [status, setStatus] = useState("Initializing...");
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<BenchmarkResult[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    let isDisposed = false;
    const benchmarkBundle = SpriteSheetBundle.fromImageFiles("benchmark", [
      "/images/particle1.png",
      "/images/particle2.png",
      "/images/tile1.png",
    ]);
    const spritePulse = new SpritePulse(canvas, [benchmarkBundle]);
    spritePulseRef.current = spritePulse;

    void spritePulse
      .waitUntilReady()
      .then(() => {
        if (isDisposed) {
          return;
        }
        spriteSheetsRef.current = TEXTURES.map((texture) =>
          benchmarkBundle.createSingleFrameSpriteSheet(texture),
        );
        setStatus("Ready. Click run benchmark.");
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
      runIdRef.current += 1;
      spritePulse.dispose();
      spritePulseRef.current = null;
    };
  }, []);

  const runBenchmark = async () => {
    const spritePulse = spritePulseRef.current;
    if (!spritePulse) {
      setStatus("Renderer is not ready yet.");
      return;
    }

    if (spriteSheetsRef.current.length === 0) {
      setStatus("Sprite sheets are not ready yet.");
      return;
    }

    await spritePulse.waitUntilReady();

    setRunning(true);
    setResults([]);
    setStatus("Running benchmark scenarios...");

    const runId = runIdRef.current + 1;
    runIdRef.current = runId;
    const nextResults: BenchmarkResult[] = [];

    for (let i = 0; i < SCENARIOS.length; i++) {
      if (runIdRef.current !== runId) {
        setRunning(false);
        return;
      }

      const scenario = SCENARIOS[i];
      setStatus(`Running ${i + 1}/${SCENARIOS.length}: ${scenario.name}`);

      const result = await runScenario(
        spritePulse,
        scenario,
        spriteSheetsRef.current,
        runIdRef,
        runId,
      );
      if (!result) {
        setRunning(false);
        return;
      }

      nextResults.push(result);
      setResults([...nextResults]);
    }

    setStatus("Benchmark complete.");
    setRunning(false);
  };

  return (
    <section>
      <h1>{title}</h1>
      <p className="status-display">{status}</p>
      <div className="benchmark-controls">
        <button
          type="button"
          onClick={() => void runBenchmark()}
          disabled={running}
        >
          {running ? "Running..." : "Run Benchmark"}
        </button>
      </div>

      <canvas
        ref={canvasRef}
        width={960}
        height={540}
        className="benchmark-canvas"
      />

      <div className="benchmark-table-wrap">
        <table className="benchmark-table">
          <thead>
            <tr>
              <th>Scenario</th>
              <th>Sprites</th>
              <th>Layers</th>
              <th>Mean FPS</th>
              <th>1% Low FPS</th>
              <th>P50 (ms)</th>
              <th>P95 (ms)</th>
              <th>P99 (ms)</th>
              <th>Mean Render (ms)</th>
            </tr>
          </thead>
          <tbody>
            {results.map((result) => (
              <tr key={result.scenario}>
                <td>{result.scenario}</td>
                <td>{result.sprites}</td>
                <td>{result.layers}</td>
                <td>{result.meanFps.toFixed(1)}</td>
                <td>{result.low1PercentFps.toFixed(1)}</td>
                <td>{result.p50FrameMs.toFixed(2)}</td>
                <td>{result.p95FrameMs.toFixed(2)}</td>
                <td>{result.p99FrameMs.toFixed(2)}</td>
                <td>{result.meanRenderMs.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

async function runScenario(
  spritePulse: SpritePulse,
  scenario: BenchmarkScenario,
  spriteSheets: SpriteSheet[],
  runIdRef: { current: number },
  runId: number,
): Promise<BenchmarkResult | null> {
  const layers: MovingSprite[][] = Array.from(
    { length: scenario.layerCount },
    () => [],
  );

  for (let i = 0; i < scenario.spriteCount; i++) {
    const layerIndex = i % scenario.layerCount;
    const texture = spriteSheets[i % scenario.textureCount];
    const sprite = new Sprite(
      Math.random() * (spritePulse.canvas.width - 20),
      Math.random() * (spritePulse.canvas.height - 20),
      8 + Math.random() * 18,
      8 + Math.random() * 18,
      texture,
    );

    layers[layerIndex].push({
      sprite,
      vx: -1.4 + Math.random() * 2.8,
      vy: -1.4 + Math.random() * 2.8,
    });
  }

  const renderLayers = layers.map((layer) =>
    layer.map((entry) => entry.sprite),
  );
  const renderOptions = {
    useOffscreenBuffer: scenario.useOffscreenBuffer,
  };

  const warmupUntil = performance.now() + scenario.warmupMs;
  while (performance.now() < warmupUntil) {
    if (runIdRef.current !== runId) {
      return null;
    }

    stepSprites(layers, spritePulse.canvas.width, spritePulse.canvas.height);
    spritePulse.render(renderLayers, renderOptions);
    await delayFrame();
  }

  const sampleEnd = performance.now() + scenario.sampleMs;
  const frameTimes: number[] = [];
  const renderTimes: number[] = [];
  let frameCount = 0;

  while (performance.now() < sampleEnd) {
    if (runIdRef.current !== runId) {
      return null;
    }

    const frameStart = performance.now();
    stepSprites(layers, spritePulse.canvas.width, spritePulse.canvas.height);

    const renderStart = performance.now();
    spritePulse.render(renderLayers, renderOptions);
    const renderDuration = performance.now() - renderStart;

    renderTimes.push(renderDuration);
    frameTimes.push(performance.now() - frameStart);
    frameCount += 1;

    await delayFrame();
  }

  const sortedFrameTimes = [...frameTimes].sort((left, right) => left - right);
  const sortedRenderTimes = [...renderTimes].sort(
    (left, right) => left - right,
  );

  return {
    scenario: scenario.name,
    sprites: scenario.spriteCount,
    layers: scenario.layerCount,
    meanFps: frameCount / (scenario.sampleMs / 1000),
    low1PercentFps: 1000 / percentile(sortedFrameTimes, 0.99),
    p50FrameMs: percentile(sortedFrameTimes, 0.5),
    p95FrameMs: percentile(sortedFrameTimes, 0.95),
    p99FrameMs: percentile(sortedFrameTimes, 0.99),
    meanRenderMs: average(sortedRenderTimes),
  };
}

function stepSprites(
  layers: MovingSprite[][],
  canvasWidth: number,
  canvasHeight: number,
): void {
  for (const layer of layers) {
    for (const entry of layer) {
      entry.sprite.x += entry.vx;
      entry.sprite.y += entry.vy;
      if (entry.sprite.x < 0 || entry.sprite.x > canvasWidth) {
        entry.vx *= -1;
      }
      if (entry.sprite.y < 0 || entry.sprite.y > canvasHeight) {
        entry.vy *= -1;
      }
    }
  }
}

function percentile(values: number[], ratio: number): number {
  if (values.length === 0) {
    return 0;
  }

  const index = Math.min(
    values.length - 1,
    Math.max(0, Math.floor(values.length * ratio)),
  );
  return values[index];
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((total, value) => total + value, 0) / values.length;
}

function delayFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}
