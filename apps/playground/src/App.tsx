"use client";

import { useState } from "react";
import { BenchmarkDemoPage } from "./demo-pages/BenchmarkDemoPage";
import { ConcurrencyDemoPage } from "./demo-pages/ConcurrencyDemoPage";
import { ParticlesDemoPage } from "./demo-pages/ParticlesDemoPage";
import { SpriteSheetDemoPage } from "./demo-pages/SpriteSheetDemoPage";
import { ScrollingDemoPage } from "./demo-pages/ScrollingDemoPage";
import { VectorShapesDemoPage } from "./demo-pages/VectorShapesDemoPage";

export default function App() {
  const [activeTab, setActiveTab] = useState<
    | "particles"
    | "sprite-sheets"
    | "benchmark"
    | "scrolling"
    | "concurrency"
    | "vector-shapes"
  >("particles");

  return (
    <main>
      <nav className="tabs" aria-label="Demo pages">
        <button
          type="button"
          className={activeTab === "particles" ? "tab active" : "tab"}
          onClick={() => setActiveTab("particles")}
        >
          SpritePulse Demo: Particles
        </button>
        <button
          type="button"
          className={activeTab === "sprite-sheets" ? "tab active" : "tab"}
          onClick={() => setActiveTab("sprite-sheets")}
        >
          SpritePulse Demo: Sprite Sheets
        </button>
        <button
          type="button"
          className={activeTab === "scrolling" ? "tab active" : "tab"}
          onClick={() => setActiveTab("scrolling")}
        >
          SpritePulse Demo: Scrolling and Parallax
        </button>
        <button
          type="button"
          className={activeTab === "vector-shapes" ? "tab active" : "tab"}
          onClick={() => setActiveTab("vector-shapes")}
        >
          SpritePulse Demo: Vector Shapes
        </button>
        <button
          type="button"
          className={activeTab === "benchmark" ? "tab active" : "tab"}
          onClick={() => setActiveTab("benchmark")}
        >
          SpritePulse Demo: Benchmark
        </button>
        <button
          type="button"
          className={activeTab === "concurrency" ? "tab active" : "tab"}
          onClick={() => setActiveTab("concurrency")}
        >
          SpritePulse Demo: Concurrency
        </button>
      </nav>

      {activeTab === "particles" ? (
        <ParticlesDemoPage key="particles" title="SpritePulse Demo: Particles" />
      ) : activeTab === "sprite-sheets" ? (
        <SpriteSheetDemoPage
          key="sprite-sheets"
          title="SpritePulse Demo: Sprite Sheets"
        />
      ) : activeTab === "scrolling" ? (
        <ScrollingDemoPage
          key="scrolling"
          title="SpritePulse Demo: Scrolling and Parallax"
        />
      ) : activeTab === "concurrency" ? (
        <ConcurrencyDemoPage
          key="concurrency"
          title="SpritePulse Demo: Concurrency"
        />
      ) : activeTab === "vector-shapes" ? (
        <VectorShapesDemoPage
          key="vector-shapes"
          title="SpritePulse Demo: Vector Shapes"
        />
      ) : (
        <BenchmarkDemoPage
          key="benchmark"
          title="SpritePulse Demo: Benchmark"
        />
      )}
    </main>
  );
}
