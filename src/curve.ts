import { IPoint } from './point';

export class Curve {
  private static INTEGRATION_CONSTANTS = 
    [[-0.1252, 0.2491] , [ 0.1252, 0.2491] , [-0.3678, 0.2335],
     [ 0.3678, 0.2335] , [-0.5873, 0.2032] , [ 0.5873, 0.2032],
     [-0.7699, 0.1601] , [ 0.7699, 0.1601] , [-0.9041, 0.1069],
     [ 0.9041, 0.1069] , [-0.9816, 0.0472] , [ 0.9816, 0.0472]];

  private static base3(t : number, ps : number[]) : number {
    let t1 = -3 * ps[0] + 9 * ps[1] - 9 * ps[2] + 3 * ps[3],
        t2 = t * t1 + 6 * ps[0] - 12 * ps[1] + 6 * ps[2];
    return t * t2 - 3 * ps[0] + 3 * ps[1];
  }

  private findT(target : number, guess? : number) : number {
    target = Math.min(target, this.length);
    guess = guess || target / this.length;

    let error = (this.lengthAt(guess) - target) / this.length;

    return Math.abs(error) < 0.0001 ? guess : this.findT(target, guess - error / 2);
  }

  private xs() : number[] {
    return [this.p0.x, this.p1.x, this.p2.x, this.p3.x];
  }

  private ys() : number[] {
    return [this.p0.y, this.p1.y, this.p2.y, this.p3.y];
  }

  constructor(private p0 : IPoint, 
              private p1 : IPoint, 
              private p2 : IPoint, 
              private p3 : IPoint) {

    this.length = this.lengthAt(1);
  }

  startLength : number = 0;
  endLength : number = 1;
  segmentOffset : number = 0;
  index : number = 0;
  length : number;

  x(t : number = 0) : number {
    let omt = 1-t;
    return omt * omt * omt * this.p0.x +
           3 * omt * omt * t * this.p1.x +
           3 * omt * t * t * this.p2.x +
           t * t * t * this.p3.x;
  }

  y(t : number = 0) : number {
    let omt = 1-t;
    return omt * omt * omt * this.p0.y +
           3 * omt * omt * t * this.p1.y +
           3 * omt * t * t * this.p2.y +
           t * t * t * this.p3.y;
  }

  point(t : number = 0) : IPoint {
    return {
      x: this.x(t),
      y: this.y(t)
    };
  }

  lengthAt(t : number = 1) : number {
    t = t <= 0 ? 0 : t > 1 ? 1 : t;
    let t2 = t / 2;

    return Curve.INTEGRATION_CONSTANTS.map(d => {
      let ct = t2 * d[0] + t2,
          b3x = Curve.base3(ct, this.xs()),
          b3y = Curve.base3(ct, this.ys());
      return d[1] * Math.sqrt(b3x * b3x + b3y * b3y); 
    }).reduce((p, c) => p + c);
  }

  pointAtLength(z : number = 0) : IPoint {
    return this.point(this.findT(z));
  }

  firstDerivative(t : number = 0) : IPoint {
    const omt = 1 - t;
    return {
      x:  3 * omt * omt * (this.p1.x - this.p0.x) +
          6 * omt * t * (this.p2.x - this.p1.x) +
          3 * t * t * (this.p3.x - this.p2.x),
      y:  3 * omt * omt * (this.p1.y - this.p0.y) +
          6 * omt * t * (this.p2.y - this.p1.y) +
          3 * t * t * (this.p3.y - this.p2.y)
    };
  }

  secondDerivative(t : number = 0) : IPoint {
    const omt = 1 - t;
    return {
      x:  6 * omt * (this.p2.x - 2 * this.p1.x + this.p0.x) +
          6 * t * (this.p3.x - 2 * this.p2.x + this.p2.x),
      y:  6 * omt * (this.p2.y - 2 * this.p1.y + this.p0.y) +
          6 * t * (this.p3.y - 2 * this.p2.y + this.p2.y)
    };
  }

  curvature(t : number = 0) : number {
    let d1 = this.firstDerivative(t),
        d2 = this.secondDerivative(t);

    return (d1.x*d2.y - d1.y*d2.x) / (d1.x*d1.x + d1.y*d1.y) ** 1.5;
  }

  tangent(t : number = 0) : IPoint {
    let d1 = this.firstDerivative(t),
        d = Math.sqrt(d1.x*d1.x + d1.y*d1.y) || 1
    return {
      x: d1.x / d,
      y: d1.y / d
    };
  }

  normal(t: number = 0) : IPoint {
    let tan = this.tangent(t);
    return {
      x: -tan.y, 
      y: tan.x
    };
  }

  stroke() : string {
    return `M ${ this.p0.x }, ${ this.p0.y }
            C ${ this.p1.x }, ${ this.p1.y }
              ${ this.p2.x }, ${ this.p2.y }
              ${ this.p3.x }, ${ this.p3.y }`;
  }

  fill(width : number) : string {
    let w2 = width / 2,
        n0 = this.normal(0),
        n3 = this.normal(1);
    return `M ${ this.p0.x - n0.x*w2 }, ${ this.p0.y - n0.y*w2 }
            L ${ this.p0.x + n0.x*w2 }, ${ this.p0.y + n0.y*w2 }
            L ${ this.p3.x + n3.x*w2 }, ${ this.p3.y + n3.y*w2 }
            L ${ this.p3.x - n3.x*w2 }, ${ this.p3.y - n3.y*w2 } Z`;
  }

  /**
   * Creates a transform string to the point, rotated to point along the tangent of the curve.
   * @param t Parametric value along the curve in the range [0, 1].
   */
  pointTransform(t: number = 0): string {
    let p = this.point(t),
        tan = this.tangent(t);
    return `translate(${p.x},${p.y}) rotate(${ Math.atan2(tan.y, tan.x)*180/Math.PI})`;
  }
}