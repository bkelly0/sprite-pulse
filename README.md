# spritePulse Workspace

Monorepo containing:

- `packages/spritePulse`: TypeScript library package.
- `apps/playground`: Simple React app that imports `spritePulse` for development/testing.

## Scripts

- `npm install`: Install all workspace dependencies.
- `npm run build`: Build the `spritePulse` library.
- `npm run playground`: Run the playground through the Next.js proxy server.
- `npm run build:all`: Build all workspaces.

## Playground Proxy

The playground now serves its UI through a Next.js custom server and proxies backend
traffic to the Go service over same-origin paths:

- `POST /api/game`
- `WS /ws`

Set `GO_BACKEND_URL` on the playground server in Google Cloud to point at the Go backend
origin, for example `https://your-go-backend.example.com`.

## Google Cloud Deployment

When you deploy the playground, keep the browser-facing app and the proxy server on the
same origin. The proxy should forward requests to the Go backend using `GO_BACKEND_URL`,
while the browser only talks to `/api/game` and `/ws` on the playground host.

Recommended runtime environment variables for the playground service:

- `GO_BACKEND_URL`: Public or internal URL for the Go backend service.
- `PORT`: Port exposed by the playground container or service runtime.

If you terminate TLS at Google Cloud, the websocket connection will upgrade through the
same origin automatically as long as the playground host is serving the proxy.

## Asset Loading

`SpritePulse` requires structured asset input. Create it with either a bundle or atlas JSON data.

1. Runtime image bundle:

```ts
const bundle = SpriteSheetBundle.fromImageFiles("particles", [
	"/images/particle1.png",
	"/images/particle2.png"
]);

const spritePulse = new SpritePulse(canvas, [bundle]);
```

2. External atlas metadata via bundle:

```ts
const bundle = SpriteSheetBundle.fromAtlasMetadata("world", {
	atlasImageFile: "/images/world-atlas.png",
	frames: {
		hero: { x: 0, y: 0, width: 32, height: 32 },
		tile: { x: 32, y: 0, width: 32, height: 32 }
	}
});

const spritePulse = new SpritePulse(canvas, [bundle]);
await spritePulse.waitUntilReady();

const tileSheet = bundle.createSingleFrameSpriteSheet("tile");
```

3. External atlas JSON data directly:

```ts
const spritePulse = new SpritePulse(canvas, [
	{
		id: "world",
		atlasMetadata: {
			atlasImageFile: "/images/world-atlas.png",
			frames: {
				hero: { x: 0, y: 0, width: 32, height: 32 }
			}
		}
	}
]);
```