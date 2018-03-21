import { IPoint } from './point';
import { Curve } from './curve';
export declare class Spline {
    knots: IPoint[];
    closed: boolean;
    private static ALMOST_ONE;
    private static computeControlPoints(k);
    private static mod;
    private static extendClosedSpline<T>(xs);
    private static sliceClosedSpline<T>(xs);
    private static computeSpline(xs, ys, closed?);
    private marshalCurve<T>(func);
    private static findCurveIndex(lengths, z, start, stop);
    constructor(knots: IPoint[], closed?: boolean);
    /**
     * The value of t that goes to the end of the Spline.
     */
    endT: number;
    /**
     * List of [[Curve]]s that make up the Spline.
     */
    curves: Curve[];
    /**
     * Total length of the Spline.
     */
    length: number;
    /**
     * Get the x coordinate given t in the range [0, endT].
     */
    x: (t: number) => number;
    /**
     * Get the y coordinate given t in the range [0, endT].
     */
    y: (t: number) => number;
    /**
     * Get the [[IPoint]] given t in the range [0, endT].
     */
    point: (t: number) => IPoint;
    /**
     * Get the component-wise first derivative at the given t in the range [0, endT].
     * Returns as an [[IPoint]] representing the derivatives with respect to x and y.
     */
    firstDerivative: (t: number) => IPoint;
    /**
     * Get the component-wise second derivative at the given t in the range [0, endT].
     * Returns as an [[IPoint]] representing the 2nd derivatives with respect to x and y.
     */
    secondDerivative: (t: number) => IPoint;
    /**
     * Get the curvature at the given t in the range [0, endT].
     * Curvature is the inverse of the instantaneous radius.
     * Note: for a straight line, curvature will return either Infinity or -Infinity.
     */
    curvature: (t: number) => number;
    /**
     * Get the tangent at the given t in the range [0, endT]. The direction will be in the
     * increasing-t direction.
     * Returns as an [[IPoint]] representing the unit vector direction of the tangent.
     */
    tangent: (t: number) => IPoint;
    /**
     * Get the normal at the given t in the range [0, endT]. The direction points to the left
     * with respect to the tangent direction.
     * Returns as an [[IPoint]] respresenting the unit vector direction of the normal.
     */
    normal: (t: number) => IPoint;
    /**
     * Get the transform string at the given t in the range [0, endT]. This will result in an SVG/CSS
     * transform that translates to the resulting point and is rotated along the direction of the
     * tangent. This is analogous to a particle traveling along the spline at position t.
     */
    pointTransform: (t: number) => string;
    /**
     * Get the point along the Spline at length z. Note that this operation is much more expensive
     * than the others that take the 't' parameter. If using this frequently, consider [[normalize]]ing
     * the Spline and using the [[point]] function.
     * Returns the [[IPoint]] representing the coordinates of the Spline at the given length.
     * @param z The length along the Spline to find.
     */
    pointAtLength(z?: number): IPoint;
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
    normalize(curveLength?: number, curveCount?: number): Spline;
    /**
     * Creates a path string that draws the Spline.
     */
    stroke(): string;
    /**
     * Creates a path string that draws filled rectangles along the path.
     * @param width
     */
    fill(width: number): string;
}
