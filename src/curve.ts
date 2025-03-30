export type Point = [number, number]

export type CubicCurveControl = [Point, Point, Point, Point]

export class Curve {
  private static INTEGRATION_CONSTANTS: Point[] = [
    [-0.1252, 0.2491],
    [0.1252, 0.2491],
    [-0.3678, 0.2335],
    [0.3678, 0.2335],
    [-0.5873, 0.2032],
    [0.5873, 0.2032],
    [-0.7699, 0.1601],
    [0.7699, 0.1601],
    [-0.9041, 0.1069],
    [0.9041, 0.1069],
    [-0.9816, 0.0472],
    [0.9816, 0.0472],
  ]

  private static base3(t: number, ps: number[]): number {
    const t1 = -3 * ps[0] + 9 * ps[1] - 9 * ps[2] + 3 * ps[3],
      t2 = t * t1 + 6 * ps[0] - 12 * ps[1] + 6 * ps[2]
    return t * t2 - 3 * ps[0] + 3 * ps[1]
  }

  private findT(target: number, guess?: number): number {
    target = Math.min(target, this.length)
    guess = guess ?? target / this.length

    const error = (this.lengthAt(guess) - target) / this.length

    return Math.abs(error) < 0.0001
      ? guess
      : this.findT(target, guess - error / 2)
  }

  private xs(): number[] {
    return this.cs.map(([x]) => x)
  }

  private ys(): number[] {
    return this.cs.map(([, y]) => y)
  }

  constructor(private cs: CubicCurveControl) {
    this.length = this.lengthAt(1)
  }

  startLength: number = 0
  endLength: number = 1
  segmentOffset: number = 0
  index: number = 0
  length: number

  x(t: number = 0): number {
    const omt = 1 - t
    return (
      omt ** 3 * this.cs[0][0] +
      3 * omt ** 2 * t * this.cs[1][0] +
      3 * omt * t ** 2 * this.cs[2][0] +
      t ** 3 * this.cs[3][0]
    )
  }

  y(t: number = 0): number {
    const omt = 1 - t
    return (
      omt ** 3 * this.cs[0][1] +
      3 * omt ** 2 * t * this.cs[1][1] +
      3 * omt * t ** 2 * this.cs[2][1] +
      t ** 3 * this.cs[3][1]
    )
  }

  point(t: number = 0): Point {
    return [this.x(t), this.y(t)]
  }

  lengthAt(t: number = 1): number {
    t = t <= 0 ? 0 : t > 1 ? 1 : t
    const t2 = t / 2

    return (
      t2 *
      Curve.INTEGRATION_CONSTANTS.map(d => {
        const ct = t2 * d[0] + t2
        return (
          d[1] *
          Math.sqrt(
            Curve.base3(ct, this.xs()) ** 2 + Curve.base3(ct, this.ys()) ** 2,
          )
        )
      }).reduce((p, c) => p + c, 0)
    )
  }

  pointAtLength(z: number = 0): Point {
    return this.point(this.findT(z))
  }

  firstDerivative(t: number = 0): Point {
    const omt = 1 - t
    return [
      3 * omt ** 2 * (this.cs[1][0] - this.cs[0][0]) +
        6 * omt * t * (this.cs[2][0] - this.cs[1][0]) +
        3 * t ** 2 * (this.cs[3][0] - this.cs[2][0]),
      3 * omt ** 2 * (this.cs[1][1] - this.cs[0][1]) +
        6 * omt * t * (this.cs[2][1] - this.cs[1][1]) +
        3 * t ** 2 * (this.cs[3][1] - this.cs[2][1]),
    ]
  }

  secondDerivative(t: number = 0): Point {
    const omt = 1 - t
    return [
      6 * omt * (this.cs[2][0] - 2 * this.cs[1][0] + this.cs[0][0]) +
        6 * t * (this.cs[3][0] - 2 * this.cs[2][0] + this.cs[2][0]),
      6 * omt * (this.cs[2][1] - 2 * this.cs[1][1] + this.cs[0][1]) +
        6 * t * (this.cs[3][1] - 2 * this.cs[2][1] + this.cs[2][1]),
    ]
  }

  curvature(t: number = 0): number {
    const d1 = this.firstDerivative(t),
      d2 = this.secondDerivative(t)

    return (
      (d1[0] * d2[1] - d1[1] * d2[0]) / (d1[0] * d1[0] + d1[1] * d1[1]) ** 1.5
    )
  }

  tangent(t: number = 0): Point {
    const d1 = this.firstDerivative(t),
      d = Math.sqrt(d1[0] ** 2 + d1[1] ** 2) || 1
    return [d1[0] / d, d1[1] / d]
  }

  normal(t: number = 0): Point {
    const tan = this.tangent(t)
    return [-tan[1], tan[0]]
  }

  stroke(): string {
    const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = this.cs
    return `M${x0},${y0}C${x1},${y1} ${x2},${y2} ${x3},${y3}`
  }

  fill(width: number): string {
    const w2 = width / 2,
      [n0x, n0y] = this.normal(0),
      [n1x, n1y] = this.normal(1),
      [[x0, y0], , [x1, y1]] = this.cs
    return `M${x0 - n0x * w2},${y0 - n0y * w2}L${x0 + n0x * w2},${y0 + n0y * w2}L${x1 + n1x * w2},${y1 + n1y * w2}L${x1 - n1x * w2},${y1 - n1y * w2}Z`
  }

  /**
   * Creates a transform string to the point, rotated to point along the tangent of the curve.
   * @param t Parametric value along the curve in the range [0, 1].
   */
  pointTransform(t: number = 0): string {
    const [px, py] = this.point(t),
      [tx, ty] = this.tangent(t)
    return `translate(${px},${py}) rotate(${(Math.atan2(ty, tx) * 180) / Math.PI})`
  }

  toString(): string {
    const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = this.cs
    return `[[${x0}, ${y0}], [${x1}, ${y1}], [${x2}, ${y2}], [${x3}, ${y3}]]`
  }
}

export const curve = (cs: CubicCurveControl) => new Curve(cs)
