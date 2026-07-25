import type { Sprite } from "./scene";

export type SpriteShaderCacheEntry = {
  filename: string;
  image: TexImageSource;
  texture: WebGLTexture;
  width: number;
  height: number;
};

export type RenderOptions = {
  useOffscreenBuffer?: boolean;
  clearColor?: [number, number, number, number];
};

export type SpritePulseLayer = {
  sprites: Sprite[];
  parallax?: number;
};
