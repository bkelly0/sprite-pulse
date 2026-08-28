"use client";

import { useEffect, useState } from "react";
import { BenchmarkDemoPage } from "./demo-pages/BenchmarkDemoPage";
import { ConcurrencyDemoPage } from "./demo-pages/ConcurrencyDemoPage";
import { ParticlesDemoPage } from "./demo-pages/ParticlesDemoPage";
import { SpriteSheetDemoPage } from "./demo-pages/SpriteSheetDemoPage";
import { ScrollingDemoPage } from "./demo-pages/ScrollingDemoPage";
import { BackendQuadTreeDemoPage } from "./demo-pages/BackendQuadTreeDemoPage";
import { AboutPage } from "./demo-pages/AboutPage";

type Tab =
  | "about"
  | "particles"
  | "sprite-sheets"
  | "benchmark"
  | "scrolling"
  | "concurrency"
  | "backend-state";

const tabToPath: Record<Tab, string> = {
  about: "/about",
  particles: "/particles",
  "sprite-sheets": "/sprite-sheets",
  benchmark: "/benchmark",
  scrolling: "/scrolling",
  concurrency: "/concurrency",
  "backend-state": "/backend-state",
};

function getTabFromPath(): Tab {
  if (typeof window === "undefined") {
    return "about";
  }

  const rawPath = window.location.pathname.replace(/\/+$/, "") || "/";
  const path = rawPath === "/" ? "about" : rawPath.slice(1);

  const matchedTab = Object.entries(tabToPath).find(([, value]) => value === `/${path}`);
  return matchedTab ? (matchedTab[0] as Tab) : "about";
}

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("about");

  useEffect(() => {
    setActiveTab(getTabFromPath());

    const handlePopState = () => {
      setActiveTab(getTabFromPath());
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigateToTab = (tab: Tab) => {
    const nextPath = tabToPath[tab];
    const url = new URL(window.location.href);
    url.pathname = nextPath;
    url.search = "";
    window.history.pushState({}, "", url);
    setActiveTab(tab);
  };

  return (
    <main>
      <h1>Sprite-Pulse Demos</h1>
      <nav className="tabs" aria-label="Demo pages">
        <button
          type="button"
          className={activeTab === "about" ? "tab active" : "tab"}
          onClick={() => navigateToTab("about")}
        >
          About
        </button>
        <button
          type="button"
          className={activeTab === "particles" ? "tab active" : "tab"}
          onClick={() => navigateToTab("particles")}
        >
          Particles
        </button>
        <button
          type="button"
          className={activeTab === "backend-state" ? "tab active" : "tab"}
          onClick={() => navigateToTab("backend-state")}
        >
          Backend State
        </button>
        <button
          type="button"
          className={activeTab === "concurrency" ? "tab active" : "tab"}
          onClick={() => navigateToTab("concurrency")}
        >
          Concurrency
        </button>
        <button
          type="button"
          className={activeTab === "sprite-sheets" ? "tab active" : "tab"}
          onClick={() => navigateToTab("sprite-sheets")}
        >
          Sprite Sheets
        </button>
        <button
          type="button"
          className={activeTab === "scrolling" ? "tab active" : "tab"}
          onClick={() => navigateToTab("scrolling")}
        >
          Scrolling and Parallax
        </button>
        <button
          type="button"
          className={activeTab === "benchmark" ? "tab active" : "tab"}
          onClick={() => navigateToTab("benchmark")}
        >
          Benchmark
        </button>
      </nav>

      {activeTab === "about" ? (
        <AboutPage key="about" />
      ) : activeTab === "particles" ? (
        <ParticlesDemoPage
          key="particles"
        />
      ) : activeTab === "sprite-sheets" ? (
        <SpriteSheetDemoPage
          key="sprite-sheets"
        />
      ) : activeTab === "scrolling" ? (
        <ScrollingDemoPage
          key="scrolling"
        />
      ) : activeTab === "concurrency" ? (
        <ConcurrencyDemoPage
          key="concurrency"
          title="Concurrency Demo"
        />
      ) : activeTab === "benchmark" ? (
        <BenchmarkDemoPage
          key="benchmark"
          title="Benchmark Demo"
        />
      ) : (
        <BackendQuadTreeDemoPage
          key="backend-state"
          title="Backend State"
        />
      )}
    </main>
  );
}
