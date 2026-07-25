import { Rect } from "../geometry";
import { Matrix3 } from "../math";

export class Camera extends Rect {
  constructor(width: number, height: number);
  constructor(x: number, y: number, width: number, height: number);
  constructor(
    arg1: number,
    arg2: number,
    arg3?: number,
    arg4?: number
  ) {
    if (arg3 === undefined || arg4 === undefined) {
      super(0, 0, arg1, arg2);
      return;
    }

    super(arg1, arg2, arg3, arg4);
  }

  // Returns the view matrix. Moving the camera RIGHT moves the world LEFT.
  public getViewMatrix(): Float32Array {
    // Invert the coordinates to simulate camera movement.
    return Matrix3.translation(-this.x, -this.y);
  }
}
