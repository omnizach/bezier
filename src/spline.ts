import { IPoint } from './point'
import { Curve } from './curve'

export class Spline {
  private static ALMOST_ONE = 1 - 1e-6

  // adapted from https://www.particleincell.com/wp-content/uploads/2012/06/bezier-spline.js
  // computes control points given knots K, this is the brain of the operation
  private static computeControlPoints(k: number[]): {
    p1: number[]
    p2: number[]
  } {
    const n = k.length - 1,
      a = (i: number) => (i <= 0 ? 0 : i >= n - 1 ? 2 : 1),
      b = new Array(n),
      c = (i: number) => (i >= n - 1 ? 0 : 1),
      p1 = new Array(n - 1),
      p2 = new Array(n - 1)

    b.fill(4)
    b[0] = 2
    b[n - 1] = 7

    const r = k.slice(0, n).map((v, i) => v + 2 * k[i + 1])
    r.push(8 * k[n - 1] + k[n])

    for (let i = 0; i < b.length - 1; i++) {
      const m = a(i + 1) / b[i]
      b[i + 1] -= m * c(i)
      r[i + 1] -= m * r[i]
    }

    p1[n - 1] = r[n - 1] / b[n - 1]

    for (let i = b.length - 2; i > 0; i--) {
      p2[i] = 2 * k[i + 1] - p1[i + 1]
    }

    p2[n - 1] = 0.5 * (k[n] + p1[n - 1])

    return {
      p1: p1,
      p2: p2,
    }
  }

  // TODO: Probably should extract into a Math Extensions class.
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

  private static computeSpline(
    xs: number[],
    ys: number[],
    closed: boolean = false,
  ): Curve[] {
    if (closed) {
      xs = Spline.extendClosedSpline(xs)
      ys = Spline.extendClosedSpline(ys)
    }

    const cx = Spline.computeControlPoints(xs),
      cy = Spline.computeControlPoints(ys),
      result = []

    let startLength = 0

    if (closed) {
      xs = Spline.sliceClosedSpline(xs)
      ys = Spline.sliceClosedSpline(ys)
      cx.p1 = Spline.sliceClosedSpline(cx.p1)
      cx.p2 = Spline.sliceClosedSpline(cx.p2)
      cy.p1 = Spline.sliceClosedSpline(cy.p1)
      cy.p2 = Spline.sliceClosedSpline(cy.p2)
    }

    for (let i = 0; i < xs.length - 1; i++) {
      const c = new Curve(
        { x: xs[i], y: ys[i] },
        { x: cx.p1[i], y: cy.p1[i] },
        { x: cx.p2[i], y: cy.p2[i] },
        { x: xs[i + 1], y: ys[i + 1] },
      )

      c.startLength = startLength
      c.endLength = startLength + c.length
      c.segmentOffset = i / (xs.length - 1)
      c.index = i

      startLength += c.length

      result.push(c)
    }

    return result
  }

  private marshalCurve<T>(func: (t: number) => T): (t: number) => T {
    return t => {
      t =
        (t < 0 ? 0 : t > Spline.ALMOST_ONE ? Spline.ALMOST_ONE : t) *
          this.curves.length || 0
      const index = Math.trunc(t)
      return func.call(this.curves[index], t - index)
    }
  }

  private static findCurveIndex(
    lengths: number[],
    z: number,
    start: number,
    stop: number,
  ): number {
    const mid = (start + stop) >> 1

    if ((lengths[mid - 1] || 0) <= z && z <= lengths[mid]) {
      return mid
    }

    if (z < (lengths[mid - 1] || 0)) {
      return Spline.findCurveIndex(lengths, z, start, mid)
    }

    return Spline.findCurveIndex(lengths, z, mid + 1, stop)
  }

  constructor(
    public knots: IPoint[],
    public closed: boolean = false,
  ) {
    this.curves = Spline.computeSpline(
      knots.map(p => p.x),
      knots.map(p => p.y),
      closed,
    )

    this.length = this.curves[this.curves.length - 1].endLength
    this.endT = this.curves.length
  }

  /**
   * The value of t that goes to the end of the Spline.
   */
  endT: number

  /**
   * List of [[Curve]]s that make up the Spline.
   */
  curves: Curve[]

  /**
   * Total length of the Spline.
   */
  length: number

  /**
   * Get the x coordinate given t in the range [0, endT].
   */
  x: (t: number) => number = this.marshalCurve(Curve.prototype.x)

  /**
   * Get the y coordinate given t in the range [0, endT].
   */
  y: (t: number) => number = this.marshalCurve(Curve.prototype.y)

  /**
   * Get the [[IPoint]] given t in the range [0, endT].
   */
  point: (t: number) => IPoint = this.marshalCurve(Curve.prototype.point)

  /**
   * Get the component-wise first derivative at the given t in the range [0, endT].
   * Returns as an [[IPoint]] representing the derivatives with respect to x and y.
   */
  firstDerivative: (t: number) => IPoint = this.marshalCurve(
    Curve.prototype.firstDerivative,
  )

  /**
   * Get the component-wise second derivative at the given t in the range [0, endT].
   * Returns as an [[IPoint]] representing the 2nd derivatives with respect to x and y.
   */
  secondDerivative: (t: number) => IPoint = this.marshalCurve(
    Curve.prototype.secondDerivative,
  )

  /**
   * Get the curvature at the given t in the range [0, endT].
   * Curvature is the inverse of the instantaneous radius.
   * Note: for a straight line, curvature will return either Infinity or -Infinity.
   */
  curvature: (t: number) => number = this.marshalCurve(
    Curve.prototype.curvature,
  )

  /**
   * Get the tangent at the given t in the range [0, endT]. The direction will be in the
   * increasing-t direction.
   * Returns as an [[IPoint]] representing the unit vector direction of the tangent.
   */
  tangent: (t: number) => IPoint = this.marshalCurve(Curve.prototype.tangent)

  /**
   * Get the normal at the given t in the range [0, endT]. The direction points to the left
   * with respect to the tangent direction.
   * Returns as an [[IPoint]] respresenting the unit vector direction of the normal.
   */
  normal: (t: number) => IPoint = this.marshalCurve(Curve.prototype.normal)

  /**
   * Get the transform string at the given t in the range [0, endT]. This will result in an SVG/CSS
   * transform that translates to the resulting point and is rotated along the direction of the
   * tangent. This is analogous to a particle traveling along the spline at position t.
   */
  pointTransform: (t: number) => string = this.marshalCurve(
    Curve.prototype.pointTransform,
  )

  /**
   * Get the point along the Spline at length z. Note that this operation is much more expensive
   * than the others that take the 't' parameter. If using this frequently, consider [[normalize]]ing
   * the Spline and using the [[point]] function.
   * Returns the [[IPoint]] representing the coordinates of the Spline at the given length.
   * @param z The length along the Spline to find.
   */
  pointAtLength(z: number = 0): IPoint {
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
   * let s1 = new Spline([{ x:0, y:0 }, { x:1, y:0 }, { x:30, y:0 }]); // non-uniform linear spline.
   * console.log(s1.x(0), s1.x(1), s1.x(2)); // 0, 1, 30
   *
   * let s2 = s1.normalize(3); // s2's t-values increase by 1 for every 3 units along its length.
   * console.log(s2.x(0), s2.x(1), s1.x(2)); // 0, 3, 6
   */
  normalize(curveLength?: number, curveCount?: number): Spline {
    curveLength = curveLength || this.length / curveCount! || 1
    curveCount = Math.ceil(this.length / curveLength)

    return new Spline(
      Array(curveCount).map((_, i) => this.pointAtLength(i * curveLength!)),
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
}
