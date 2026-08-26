export class Rect {
  constructor(
    public x: number,
    public y: number,
    public readonly width: number,
    public readonly height: number,
  ) {}

  public static fromGrid(width: number, height: number, rows: number, cols: number) : Rect[] {
    const result = []
    for (let i=0; i<rows; i++) {
      for (let j=0; j<cols; j++) {
        result.push(new Rect(j*width, i*height, width, height));
      }
    }
    return result;
  }
}
