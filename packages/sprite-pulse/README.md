# SpritePulse

SpritePulse is a TypeScript library for sprite rendering, sprite-sheet management, and animation playback in browser-based scenes.

It is designed to be used as a reusable rendering dependency in other apps, rather than as a deployment-specific service or demo app.

## Features

- **WebGL2 sprite rendering** — draws textured and solid-color/rectangle sprites via a shared shader/geometry cache.
- **Sprite-sheet bundles** — build sheets from plain image files or TexturePacker-style atlas metadata.
- **Frame-based animation** — define named animations with per-frame durations and step through them each frame.
- **Scene primitives** — `Sprite`, `Camera`, and `Rect`/`Matrix3` helpers for positioning and transforms.
- **Render loop management** — `startLoop`/`stopLoop` with target-FPS throttling and error handling built in.
- **Reconnecting WebSocket client** — `createReconnectingSocket` handles connect/backoff/retry for any client-defined message type, independent of any framework.
- **State interpolation utilities** — `StateBuffer`, `syncById`, and `computeInterpolationAlpha`/`interpolatePoint` smooth out sprite motion between server or generator ticks.

## Installation

```bash
npm install @bkelly0/sprite-pulse
```

## Basic usage

```ts
import { SpritePulse, SpriteSheetBundle } from "@bkelly0/sprite-pulse";

const bundle = SpriteSheetBundle.fromImageFiles("particles", [
  "/images/particle1.png",
  "/images/particle2.png",
]);

const spritePulse = new SpritePulse(canvas, [bundle]);
```

## Atlas metadata usage

```ts
import {
  Sprite,
  SpritePulse,
  SpriteSheetBundle,
  type SpritePulseAtlasMetadata,
} from "@bkelly0/sprite-pulse";

const atlasMetadata: SpritePulseAtlasMetadata = {
  $schema: "./sprite-pulse-atlas.schema.json",
  version: 1,
  atlasImageFile: "/images/world-atlas.png",
  frames: {
    hero: { x: 0, y: 0, width: 32, height: 32 },
    tile: { x: 32, y: 0, width: 32, height: 32 },
  },
};

const bundle = SpriteSheetBundle.fromAtlasMetadata("world", atlasMetadata);
const spritePulse = new SpritePulse(canvas, [bundle]);
await spritePulse.waitUntilReady();

const heroSheet = bundle.createSingleFrameSpriteSheet("hero");
const hero = new Sprite(100, 100, 32, 32, heroSheet);

spritePulse.render([hero]);
```

## Render loop example

```ts
import { Sprite, SpritePulse, SpriteSheetBundle } from "@bkelly0/sprite-pulse";

const bundle = SpriteSheetBundle.fromImageFiles("player", [
  "/images/hero-walk-1.png",
  "/images/hero-walk-2.png",
  "/images/hero-walk-3.png",
]);

const spritePulse = new SpritePulse(canvas, [bundle]);
await spritePulse.waitUntilReady();

const playerSheet = bundle.createSingleFrameSpriteSheet("hero-walk-1");
const player = new Sprite(60, 80, 32, 32, playerSheet);

spritePulse.startLoop(({ deltaMs }) => {
  player.x += (40 * deltaMs) / 1000;

  if (player.x > canvas.width) {
    player.x = -32;
  }

  spritePulse.render([player]);
}, {
  targetFps: 60,
});
```

## Animation example

```ts
import {
  Sprite,
  SpriteAnimation,
  SpritePulse,
  SpriteSheetBundle,
} from "@bkelly0/sprite-pulse";

const bundle = SpriteSheetBundle.fromAtlasMetadata("enemy", {
  atlasImageFile: "/images/enemy-sheet.png",
  frames: {
    walk_0: { x: 0, y: 0, width: 32, height: 32 },
    walk_1: { x: 32, y: 0, width: 32, height: 32 },
    walk_2: { x: 64, y: 0, width: 32, height: 32 },
    walk_3: { x: 96, y: 0, width: 32, height: 32 },
  },
});

const spritePulse = new SpritePulse(canvas, [bundle]);
await spritePulse.waitUntilReady();

const spriteSheet = bundle.createSpriteSheet("enemy-sheet.png", [
  bundle.getAtlasFrame("walk_0"),
  bundle.getAtlasFrame("walk_1"),
  bundle.getAtlasFrame("walk_2"),
  bundle.getAtlasFrame("walk_3"),
  [
    new SpriteAnimation("walk", [
      [0, 8],
      [1, 8],
      [2, 8],
      [3, 8],
    ]),
  ],
]);

const enemy = new Sprite(320, 200, 32, 32, spriteSheet);
enemy.setAnimation("walk");

spritePulse.startLoop(() => {
  enemy.advanceAnimationFrame();
  spritePulse.render([enemy]);
}, {
  targetFps: 30,
});
```

## Recommended pattern

1. Group related art into a bundle.
2. Prefer atlas metadata for production assets.
3. Use runtime image bundling when you need a quick local setup.
4. Reuse sprite sheets and animation definitions across many sprites.
5. Keep rendering in a single animation loop for predictable updates.

## Notes

- The library expects structured atlas metadata or image files as input.
- Demo apps and deployment-specific infrastructure should live in separate projects.
- This package is intended to be consumed by other applications, not to serve as a hosted app itself.
