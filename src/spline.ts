import { Curve, Point } from './curve'

export class Spline {
  // adapted from https://www.particleincell.com/wp-content/uploads/2012/06/bezier-spline.js
  // computes control points given knots K, this is the brain of the operation
  private static computeControlPoints(K: number[]) {
    const p1 = new Array<number>()
    const p2 = new Array<number>()
    const n = K.length - 1

    /*rhs vector*/
    const a = new Array<number>(),
      b: number[] = [],
      c: number[] = [],
      r: number[] = []

    /*left most segment*/
    a[0] = 0
    b[0] = 2
    c[0] = 1
    r[0] = K[0] + 2 * K[1]

    /*internal segments*/
    for (let i = 1; i < n - 1; i++) {
      a[i] = 1
      b[i] = 4
      c[i] = 1
      r[i] = 4 * K[i] + 2 * K[i + 1]
    }

    /*right segment*/
    a[n - 1] = 2
    b[n - 1] = 7
    c[n - 1] = 0
    r[n - 1] = 8 * K[n - 1] + K[n]

    /*solves Ax=b with the Thomas algorithm (from Wikipedia)*/
    for (let i = 1; i < n; i++) {
      const m = a[i] / b[i - 1]
      b[i] = b[i] - m * c[i - 1]
      r[i] = r[i] - m * r[i - 1]
    }

    p1[n - 1] = r[n - 1] / b[n - 1]
    for (let i = n - 2; i >= 0; --i) p1[i] = (r[i] - c[i] * p1[i + 1]) / b[i]

    /*we have p1, now compute p2*/
    for (let i = 0; i < n - 1; i++) p2[i] = 2 * K[i + 1] - p1[i + 1]

    p2[n - 1] = 0.5 * (K[n] + p1[n - 1])

    return { p1: p1, p2: p2 }
  }

  private static mod = (n: number, m: number) => ((n % m) + m) % m

  private static extendClosedSpline<T>(xs: T[]): T[] {
    const left = [],
      right = []

    for (let i = 0; i < 12; i++) {
      left.push(xs[Spline.mod(xs.length - i - 1, xs.length)])
    }

    for (let i = 0; i < 12; i++) {
      right.push(xs[i % xs.length])
    }

    return left.concat(xs).concat(right)
  }

  private static sliceClosedSpline<T>(xs: T[]): T[] {
    return xs.slice(12, xs.length - 24)
  }

  private static computeSpline(xs: number[], ys: number[], closed: boolean = false): Curve[] {
    if (closed) {
      xs = Spline.extendClosedSpline(xs)
      ys = Spline.extendClosedSpline(ys)
    }

    const cx = Spline.computeControlPoints(xs),
      cy = Spline.computeControlPoints(ys),
      result = []

    if (closed) {
      xs = Spline.sliceClosedSpline(xs)
      ys = Spline.sliceClosedSpline(ys)
      cx.p1 = Spline.sliceClosedSpline(cx.p1)
      cx.p2 = Spline.sliceClosedSpline(cx.p2)
      cy.p1 = Spline.sliceClosedSpline(cy.p1)
      cy.p2 = Spline.sliceClosedSpline(cy.p2)
    }

    for (let i = 0, startLength = 0; i < xs.length - 1; i++) {
      const c = new Curve([
        [xs[i], ys[i]],
        [cx.p1[i], cy.p1[i]],
        [cx.p2[i], cy.p2[i]],
        [xs[i + 1], ys[i + 1]],
      ])

      c.startLength = startLength
      c.endLength = startLength + c.length
      c.segmentOffset = i / (xs.length - 1)
      c.index = i

      startLength += c.length

      result.push(c)
    }

    return result
  }

  private indexOffset(t: number): [number, number] {
    t = t < 0 ? 0 : t > this.endT ? this.endT : t
    return [t | 0, t % 1]
  }

  private static findCurveIndex(lengths: number[], z: number, start: number, stop: number): number {
    const mid = (start + stop) >>> 1

    return (lengths[mid - 1] ?? 0) <= z && z <= lengths[mid]
      ? mid
      : z < (lengths[mid - 1] ?? 0)
        ? Spline.findCurveIndex(lengths, z, start, mid)
        : Spline.findCurveIndex(lengths, z, mid + 1, stop)
  }

  constructor(
    public readonly knots: Point[],
    public readonly closed: boolean = false,
  ) {
    this.curves = Spline.computeSpline(
      knots.map(([x]) => x),
      knots.map(([, y]) => y),
      closed,
    )

    this.length = this.curves[this.curves.length - 1].endLength
    this.endT = this.curves.length - 1e-6
  }

  /**
   * The value of t that goes to the end of the Spline.
   */
  readonly endT: number

  /**
   * List of [[Curve]]s that make up the Spline.
   */
  readonly curves: Curve[]

  /**
   * Total length of the Spline.
   */
  readonly length: number

  /**
   * Get the x coordinate given t in the range [0, endT].
   */
  x(t: number = 0): number {
    const [i, o] = this.indexOffset(t)
    return this.curves[i].x(o)
  }

  /**
   * Get the y coordinate given t in the range [0, endT].
   */
  y(t: number = 0): number {
    const [i, o] = this.indexOffset(t)
    return this.curves[i].y(o)
  }

  /**
   * Get the [[Point]] given t in the range [0, endT].
   */
  point(t: number = 0): Point {
    const [i, o] = this.indexOffset(t)
    return this.curves[i].point(o)
  }

  lengthAt(t: number = this.endT): number {
    const [i, o] = this.indexOffset(t)
    return this.curves[i].startLength + this.curves[i].lengthAt(o)
  }

  /**
   * Get the component-wise first derivative at the given t in the range [0, endT].
   * Returns as an [[Point]] representing the derivatives with respect to x and y.
   */
  firstDerivative(t: number = 0): Point {
    const [i, o] = this.indexOffset(t)
    return this.curves[i].firstDerivative(o)
  }

  /**
   * Get the component-wise second derivative at the given t in the range [0, endT].
   * Returns as an [[Point]] representing the 2nd derivatives with respect to x and y.
   */
  secondDerivative(t: number = 0): Point {
    const [i, o] = this.indexOffset(t)
    return this.curves[i].secondDerivative(o)
  }

  /**
   * Get the curvature at the given t in the range [0, endT].
   * Curvature is the inverse of the instantaneous radius.
   * Note: for a straight line, curvature will return either Infinity or -Infinity.
   */
  curvature(t: number = 0): number {
    const [i, o] = this.indexOffset(t)
    return this.curves[i].curvature(o)
  }

  /**
   * Get the tangent at the given t in the range [0, endT]. The direction will be in the
   * increasing-t direction.
   * Returns as an [[Point]] representing the unit vector direction of the tangent.
   */
  tangent(t: number = 0): Point {
    const [i, o] = this.indexOffset(t)
    return this.curves[i].tangent(o)
  }

  /**
   * Get the normal at the given t in the range [0, endT]. The direction points to the left
   * with respect to the tangent direction.
   * Returns as an [[Point]] respresenting the unit vector direction of the normal.
   */
  normal(t: number = 0): Point {
    const [i, o] = this.indexOffset(t)
    return this.curves[i].normal(o)
  }

  /**
   * Get the transform string at the given t in the range [0, endT]. This will result in an SVG/CSS
   * transform that translates to the resulting point and is rotated along the direction of the
   * tangent. This is analogous to a particle traveling along the spline at position t.
   */
  pointTransform(t: number = 0): string {
    const [i, o] = this.indexOffset(t)
    return this.curves[i].pointTransform(o)
  }

  /**
   * Get the point along the Spline at length z. Note that this operation is much more expensive
   * than the others that take the 't' parameter. If using this frequently, consider [[normalize]]ing
   * the Spline and using the [[point]] function.
   * Returns the [[Point]] representing the coordinates of the Spline at the given length.
   * @param z The length along the Spline to find.
   */
  pointAtLength(z: number = 0): Point {
    z = z < 0 ? 0 : z > this.length ? this.length : z
    const i = Spline.findCurveIndex(
      this.curves.map(c => c.endLength),
      z,
      0,
      this.curves.length,
    )
    return this.curves[i].pointAtLength(z - this.curves[i].startLength)
  }

  /**
   * Computes a new [[Spline]] with the knots (end points of the individual curves) evenly spaced
   * along the Spline. The result will be a Spline with the same shape, but with each curve approximately
   * [[curveLength]] long or contain exactly [[curveCount]] [[Curve]]s.
   *
   * Note: This is a fairly expensive operation because it computes lengths along the Spline. However, the
   * resulting Spline will have t values that are approximately proportional to length along the curve
   * (scaled by the curveLength parameter), making such calculations much more efficient going forward.
   *
   * @param curveLength Default 1. The desired length of all [[Curve]]s in the Spline.
   * @param curveCount Defaults to the Spline [[length]] / curveLength. If curveLength is specified, this
   * parameter is ignored.
   *
   * @example
   * let s1 = new Spline([[0, 0], [1, 0], [30, 0]]) // non-uniform linear spline.
   * console.log(s1.x(0), s1.x(1), s1.x(2)); // 0, 1, 30
   *
   * let s2 = s1.normalize(3); // s2's t-values increase by 1 for every 3 units along its length.
   * console.log(s2.x(0), s2.x(1), s1.x(2)); // 0, 3, 6
   */
  normalize(curveLength?: number, curveCount?: number): Spline {
    curveLength = curveLength || this.length / curveCount! || 1
    curveCount = Math.ceil(this.length / curveLength) + 1

    return new Spline(
      [...Array(curveCount).keys()].map(d => this.pointAtLength(d * curveLength!)),
      this.closed,
    )
  }

  /**
   * Creates a path string that draws the Spline.
   */
  stroke(): string {
    return this.curves.map(c => c.stroke()).join(' ')
  }

  /**
   * Creates a path string that draws filled rectangles along the path.
   * @param width
   */
  fill(width: number): string {
    return this.curves.map(c => c.fill(width)).join(' ')
  }

  toString(): string {
    return this.curves.map(c => c.toString()).join(' ')
  }
}

/**
 * Convenience function for [[Spline]] constructor.
 * @param knots List of [[Point]]s that the [[Spline]] will go through smoothly.
 * @param closed Flag for if the [[Spline]] should connect its end back to its start point.
 * @returns [[Spline]]
 */
export const spline = (knots: Point[], closed = false) => new Spline(knots, closed)
