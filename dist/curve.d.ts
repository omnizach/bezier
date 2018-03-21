import { IPoint } from './point';
export declare class Curve {
    private p0;
    private p1;
    private p2;
    private p3;
    private static INTEGRATION_CONSTANTS;
    private static base3(t, ps);
    private findT(target, guess?);
    private xs();
    private ys();
    constructor(p0: IPoint, p1: IPoint, p2: IPoint, p3: IPoint);
    startLength: number;
    endLength: number;
    segmentOffset: number;
    index: number;
    length: number;
    x(t?: number): number;
    y(t?: number): number;
    point(t?: number): IPoint;
    lengthAt(t?: number): number;
    pointAtLength(z?: number): IPoint;
    firstDerivative(t?: number): IPoint;
    secondDerivative(t?: number): IPoint;
    curvature(t?: number): number;
    tangent(t?: number): IPoint;
    normal(t?: number): IPoint;
    stroke(): string;
    fill(width: number): string;
    /**
     * Creates a transform string to the point, rotated to point along the tangent of the curve.
     * @param t Parametric value along the curve in the range [0, 1].
     */
    pointTransform(t?: number): string;
}
