# spritePulse

SpritePulse is a TypeScript library for building sprite-based render pipelines, atlas-driven sprite sheets, and animation playback in browser-based game and UI scenes.

This repository is organized as a monorepo, with the library in `packages/sprite-pulse` and demo apps in separate workspace folders. The library is intended to be reused in other projects and is not focused on deployment-specific infrastructure.

## Packages

- `packages/sprite-pulse`: the reusable library package
- `apps/demo`: local demo/test app for experimentation
- `apps/go-backend`: backend app for managing demo game states

## Installation

```bash
npm install
```

## Building the library

```bash
npm run build
```

This builds the library package from `packages/sprite-pulse`.

## Usage

### 1. Create a sprite bundle from image files

```ts
import { SpritePulse, SpriteSheetBundle } from "@bkelly0/sprite-pulse";

const bundle = SpriteSheetBundle.fromImageFiles("particles", [
  "/images/particle1.png",
  "/images/particle2.png",
]);

const spritePulse = new SpritePulse(canvas, [bundle]);
```

### 2. Create a sprite bundle from atlas metadata

```ts
import { SpritePulse, SpriteSheetBundle } from "@bkelly0/sprite-pulse";

const bundle = SpriteSheetBundle.fromAtlasMetadata("world", {
  atlasImageFile: "/images/world-atlas.png",
  frames: {
    hero: { x: 0, y: 0, width: 32, height: 32 },
    tile: { x: 32, y: 0, width: 32, height: 32 },
  },
});

const spritePulse = new SpritePulse(canvas, [bundle]);
await spritePulse.waitUntilReady();

const tileSheet = bundle.createSingleFrameSpriteSheet("tile");
```

### 3. Pass atlas data directly

```ts
import { SpritePulse } from "@bkelly0/sprite-pulse";

const spritePulse = new SpritePulse(canvas, [
  {
    id: "world",
    atlasMetadata: {
      atlasImageFile: "/images/world-atlas.png",
      frames: {
        hero: { x: 0, y: 0, width: 32, height: 32 },
      },
    },
  },
]);
```

### 4. Render loop example

```ts
import { Sprite, SpritePulse, SpriteSheetBundle } from "@bkelly0/sprite-pulse";

const bundle = SpriteSheetBundle.fromImageFiles("player", [
  "/images/hero-walk-1.png",
  "/images/hero-walk-2.png",
  "/images/hero-walk-3.png",
]);

const spritePulse = new SpritePulse(canvas, [bundle]);
await spritePulse.waitUntilReady();

const heroSheet = bundle.createSingleFrameSpriteSheet("hero-walk-1");
const hero = new Sprite(60, 80, 32, 32, heroSheet);

spritePulse.startLoop(({ deltaMs }) => {
  hero.x += (40 * deltaMs) / 1000;

  if (hero.x > canvas.width) {
    hero.x = -32;
  }

  spritePulse.render([hero]);
}, {
  targetFps: 60,
});
```

### 5. Animation example

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

## Notes

- The library expects structured sprite sheet metadata and image assets.
- Demo applications and deployment-specific setup are intentionally kept separate from the library package.
- If you want to build and explore gameplay demos, use the workspace demo app locally or move those demos into a dedicated project repository.

## Scripts

```bash
npm install
npm run build
```