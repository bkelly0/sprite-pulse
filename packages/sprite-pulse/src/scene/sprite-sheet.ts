import { Rect } from "../geometry";
import { SpriteAnimation, type AnimationFrameState } from "./sprite-animation";

export class SpriteSheet {
  public readonly shaderRef: string;
  public readonly bounds: Rect[];
  public animations: SpriteAnimation[] = [];
  private animationIndex: number = 0;
  private readonly fallbackFrameState: AnimationFrameState = {
    frameIndex: 0,
    frameCount: 0,
    playbackDirection: 1,
  };

  constructor(
    shaderRef: string,
    bounds: Rect[],
    animations: SpriteAnimation[] = [],
    defaultFrameDuration: number = 1,
  ) {
    this.shaderRef = shaderRef;
    this.bounds = bounds;
    this.animations = animations;
    if (this.animations.length === 0) {
      const frames: number[][] = [];
      for (let i = 0; i < this.bounds.length; i++) {
        frames.push([i, defaultFrameDuration]);
      }
      const defaultAnimation = new SpriteAnimation("default", frames);
      this.animations.push(defaultAnimation);
    }
  }

  public get currentAnimationName(): string {
    return this.getAnimation();
  }

  public get currentAnimationRect(): Rect {
    return this.getCurrentAnimationRect(this.fallbackFrameState);
  }

  public getAnimation(animationIndex: number = this.animationIndex): string {
    return this.animations[animationIndex]?.name ?? "default";
  }

  public getFrameRect(frameIndex: number): Rect | null {
    return this.bounds[frameIndex] ?? null;
  }

  public getCurrentAnimationRect(
    state: AnimationFrameState,
    animationIndex: number = this.animationIndex,
  ): Rect {
    const safeAnimationIndex = Math.max(
      0,
      Math.min(animationIndex, this.animations.length - 1),
    );
    const animation = this.animations[safeAnimationIndex];
    const frameIndex = Math.max(
      0,
      Math.min(state.frameIndex, animation.frames.length - 1),
    );
    const frame = animation.frames[frameIndex];
    return this.bounds[frame?.[0] ?? 0];
  }

  public setAnimation(
    animationName: string,
    state: AnimationFrameState = this.fallbackFrameState,
  ): boolean {
    const nextAnimationIndex = this.animations.findIndex(
      (animation) => animation.name === animationName,
    );

    if (nextAnimationIndex < 0) {
      return false;
    }

    this.animationIndex = nextAnimationIndex;
    const animation = this.animations[this.animationIndex];
    animation.resetFrameState(state);
    return true;
  }

  public advanceAnimationFrame(
    state: AnimationFrameState,
    animationIndex: number = this.animationIndex,
  ): void {
    const safeAnimationIndex = Math.max(
      0,
      Math.min(animationIndex, this.animations.length - 1),
    );
    const animation = this.animations[safeAnimationIndex];
    animation.nextFrame(state);
  }
}
