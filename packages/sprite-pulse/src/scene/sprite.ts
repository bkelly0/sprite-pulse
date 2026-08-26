import { Rect } from "../geometry";
import type { AnimationFrameState } from "./sprite-animation";
import type { SpriteSheet } from "./sprite-sheet";

export type SpriteFlipAxis = 1 | -1;
export type SpriteKind = "image" | "rectangle";
export type SpriteColor = [number, number, number, number];

export type RectangleSpriteStyle = {
  fillColor?: SpriteColor;
  strokeColor?: SpriteColor | null;
  strokeWidth?: number;
  cornerRadius?: number;
};

const DEFAULT_RECTANGLE_FILL: SpriteColor = [1, 1, 1, 1];

export class Sprite extends Rect {
  public readonly kind: SpriteKind;
  private _shaderRef: string;
  private _spriteSheet: SpriteSheet | null = null;
  public flipX: SpriteFlipAxis;
  public flipY: SpriteFlipAxis;
  public fillColor: SpriteColor;
  public strokeColor: SpriteColor | null;
  public strokeWidth: number;
  public cornerRadius: number;
  private fixedFrameIndex: number | null = null;
  private animationIndex: number = 0;
  private readonly animationState: AnimationFrameState = {
    frameIndex: 0,
    frameCount: 0,
    playbackDirection: 1,
  };

  constructor(
    x: number,
    y: number,
    width: number,
    height: number,
    shaderRefOrSpriteSheet: string | SpriteSheet,
    flipX: SpriteFlipAxis = 1,
    flipY: SpriteFlipAxis = 1,
    kind: SpriteKind = "image",
    rectangleStyle: RectangleSpriteStyle = {},
  ) {
    super(x, y, width, height);
    this.kind = kind;
    this.flipX = flipX;
    this.flipY = flipY;
    this.fillColor = Sprite.normalizeColor(
      rectangleStyle.fillColor,
      DEFAULT_RECTANGLE_FILL,
    );
    this.strokeColor = rectangleStyle.strokeColor
      ? Sprite.normalizeColor(
          rectangleStyle.strokeColor,
          DEFAULT_RECTANGLE_FILL,
        )
      : null;
    this.strokeWidth = Math.max(0, rectangleStyle.strokeWidth ?? 0);
    this.cornerRadius = Math.max(0, rectangleStyle.cornerRadius ?? 0);

    if (kind === "rectangle") {
      this._shaderRef = "";
      return;
    }

    if (typeof shaderRefOrSpriteSheet === "string") {
      this._shaderRef = shaderRefOrSpriteSheet;
    } else {
      this._shaderRef = shaderRefOrSpriteSheet.shaderRef;
      this._spriteSheet = shaderRefOrSpriteSheet;
    }
  }

  public static rectangle(
    x: number,
    y: number,
    width: number,
    height: number,
    style: RectangleSpriteStyle = {},
  ): Sprite {
    return new Sprite(x, y, width, height, "", 1, 1, "rectangle", style);
  }

  public setPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }

  public setFlipX(flipX: SpriteFlipAxis): void {
    this.flipX = flipX;
  }

  public setFlipY(flipY: SpriteFlipAxis): void {
    this.flipY = flipY;
  }

  public setSpriteSheet(spriteSheet: SpriteSheet): void {
    this._spriteSheet = spriteSheet;
    this._shaderRef = spriteSheet.shaderRef;
    this.fixedFrameIndex = null;
    this.animationIndex = 0;
    this.animationState.frameIndex = 0;
    this.animationState.frameCount = 0;
    this.animationState.playbackDirection = 1;
  }

  public get shaderRef(): string {
    return this._shaderRef;
  }

  public get spriteSheet(): SpriteSheet | null {
    return this._spriteSheet;
  }

  public get currentAnimationName(): string | null {
    return this.getAnimation();
  }

  public get currentAnimationRect(): Rect | null {
    if (this.fixedFrameIndex !== null) {
      return this.spriteSheet?.getFrameRect(this.fixedFrameIndex) ?? null;
    }

    return (
      this.spriteSheet?.getCurrentAnimationRect(
        this.animationState,
        this.animationIndex,
      ) ?? null
    );
  }

  public setFrame(frameIndex: number | null): boolean {
    if (frameIndex === null) {
      this.fixedFrameIndex = null;
      return true;
    }

    if (
      !Number.isInteger(frameIndex) ||
      !this.spriteSheet?.getFrameRect(frameIndex)
    ) {
      return false;
    }

    this.fixedFrameIndex = frameIndex;
    return true;
  }

  public getAnimation(): string | null {
    return this.spriteSheet?.getAnimation(this.animationIndex) ?? null;
  }

  public setAnimation(animationName: string): boolean {
    if (!this.spriteSheet) {
      return false;
    }

    const nextAnimationIndex = this.spriteSheet.animations.findIndex(
      (animation) => animation.name === animationName,
    );

    if (nextAnimationIndex < 0) {
      return false;
    }

    this.animationIndex = nextAnimationIndex;
    this.spriteSheet.animations[this.animationIndex].resetFrameState(
      this.animationState,
    );
    return true;
  }

  public advanceAnimationFrame(): void {
    this.spriteSheet?.advanceAnimationFrame(
      this.animationState,
      this.animationIndex,
    );
  }

  private static normalizeColor(
    color: SpriteColor | undefined,
    fallback: SpriteColor,
  ): SpriteColor {
    if (!color || color.length !== 4) {
      return [...fallback];
    }

    return [
      Sprite.clamp(color[0]),
      Sprite.clamp(color[1]),
      Sprite.clamp(color[2]),
      Sprite.clamp(color[3]),
    ];
  }

  private static clamp(value: number): number {
    return Math.max(0, Math.min(1, value));
  }
}
