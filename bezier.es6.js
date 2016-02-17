/* global d3:false */
/* jshint esnext:true */

/**
 * @brief Bezier curve and spline plugin for D3.
 *
 * Credits:
 * Function to create control points of a Bezier Spline: https://www.particleincell.com
 * Function to compute the length of a Bezier Curve: https://github.com/DmitryBaranovskiy/raphael
 *
 * @author Zach Young <zach.young@gmail.com>
 * @license http://en.wikipedia.org/wiki/MIT_License MIT License
 *
 * @requires d3
 */
(function() {
  'use strict';

  var times = function(n, v) {
    var r = new Array(n);
    r.fill(v);
    return r;
  };//5034455061

  var zip = function() {
    var args = [].slice.apply(arguments);
    return args[0].map(function(d, i) {
      return args.map(function(a) { return a[i]; });
    });
  };

  var pairs = function(a) {
    return a.slice(1).map(function(d, i) {
      return [a[i], d];
    });
  };

  /**
   * A Point object represents a location in space or a vector.
   * @class
   * @property {number} x The x coordinate
   * @property {number} y The y coordinate
   */
  class Point {
    /**
     * @param {number} x The x coordinate
     * @param {number} y The y coordinate
     */
    constructor(x, y) {
      this.x = x;
      this.y = y;
    }

    static x(p) { return p.x; }

    static y(p) { return p.y; }
  }

  class BezierCurve {
    static base3(t, p1, p2, p3, p4) {
      var t1 = -3 * p1 + 9 * p2 - 9 * p3 + 3 * p4,
        t2 = t * t1 + 6 * p1 - 12 * p2 + 6 * p3;
      return t * t2 - 3 * p1 + 3 * p2;
    }

    /*
    static findT(curve, target, guess) {
      target = Math.min(target, curve.length);
      guess = guess || target / curve.length;

      var error = (curve.lengthAt(guess) - target) / curve.length;

      if (Math.abs(error) < 0.0001) {
        return guess;
      }

      return BezierCurve.findT(curve, target, guess - error);
    }
    */
    /**
     * A BezierCurve represents one segment of a spline.
     * @param {point} p0 start point
     * @param {point} p1 control point 1
     * @param {point} p2 control point 2
     * @param {point} p3 end point
     * @returns {BezierCurve}
     * @property {Point} p0 Start point
     * @property {Point} p1 Control point 1
     * @property {Point} p2 Control point 2
     * @property {Point} p3 End point
     * @property {number} length Length of the curve
     */
    constructor(p0, p1, p2, p3) {
      this.p0 = p0;
      this.p1 = p1;
      this.p2 = p2;
      this.p3 = p3;

      this.length = this.lengthAt(1);
    }

    _findT(target, guess) {
      target = Math.min(target, this.length);
      guess = guess || target / this.length;

      var error = (this.lengthAt(guess) - target) / this.length;

      if (Math.abs(error) < 0.0001) {
        return guess;
      }

      return this._findT(target, guess - error);
    }

    // adapted from: https://github.com/DmitryBaranovskiy/raphael/blob/c47c077368c1113e1ed653376415961749de5466/dev/raphael.core.js
    /**
     * Computes the length at position t of the curve.
     * @param {number} t The portion of the curve to consider. The curve starts at t=0 and ends at t=1.
     * @returns {number} the length value.
     */
    lengthAt(t) {
      t = t === undefined ? 1 :
        t > 1       ? 1 :
        t < 0       ? 0 : t;

      var t2 = t/2;

      return t2 * [[-0.1252, 0.2491],[0.1252, 0.2491],[-0.3678, 0.2335],[0.3678, 0.2335],[-0.5873, 0.2032],
                   [0.5873, 0.2032],[-0.7699, 0.1601],[0.7699, 0.1601],[-0.9041, 0.1069],[0.9041, 0.1069],
                   [-0.9816, 0.0472],[0.9816, 0.0472]].map(function(d) {
        var ct = t2 * d[0] + t2;
        return d[1] * Math.sqrt(Math.pow(BezierCurve.base3(ct, this.p0.x, this.p1.x, this.p2.x, this.p3.x), 2) +
                                Math.pow(BezierCurve.base3(ct, this.p0.y, this.p1.y, this.p2.y, this.p3.y), 2));
      }, this).reduce(function(p, c) { return p + c; }, 0);
    }

    /**
     * Computes the point at position t of the curve.
     * @param {number} t The portion of the curve to consider. The curve starts at t=0 and ends at t=1.
     * @returns {Point} the location point.
     */
    point(t) {
      return new Point(Math.pow(1-t,3) * this.p0.x +
                       3 * Math.pow(1-t,2) * t * this.p1.x +
                       3 * (1-t) * Math.pow(t, 2) * this.p2.x +
                       Math.pow(t, 3) * this.p3.x,

                       Math.pow(1-t,3) * this.p0.y +
                       3 * Math.pow(1-t,2) * t * this.p1.y +
                       3 * (1-t) * Math.pow(t, 2) * this.p2.y +
                       Math.pow(t, 3) * this.p3.y);
    }

    /**
     * Computes the point at a length of the curve.
     * @param {number} z The length of the curve to travel.
     * @returns {Point} the location point.
     */
    pointAtLength(z) {
      var t = this._findT(z);
      return this.point(t);
    }

    /**
     * Computes the first derivative at position t of the curve.
     * @param {number} t The point of the curve to consider. The curve starts at t=0 and ends at t=1.
     * @returns {Point} The derivative as a vector.
     */
    firstDerivative(t) {
      return new Point(3 * Math.pow(1-t, 2) * (this.p1.x - this.p0.x) +
                       6 * (1-t) * t * (this.p2.x - this.p1.x) +
                       3 * t * t * (this.p3.x - this.p2.x),

                       3 * Math.pow(1-t, 2) * (this.p1.y - this.p0.y) +
                       6 * (1-t) * t * (this.p2.y - this.p1.y) +
                       3 * t * t * (this.p3.y - this.p2.y));
    }

    /**
     * Computes the second derivative at position t of the curve.
     * @param {number} t The point of the curve to consider. The curve starts at t=0 and ends at t=1.
     * @returns {Point} The second derivative as a vector.
     */
    secondDerivative(t) {
      return new Point(6 * (1-t) * (this.p2.x - 2*this.p1.x + this.p0.x) +
                       6 * t *   (this.p3.x - 2*this.p2.x + this.p2.x),

                       6 * (1-t) * (this.p2.y - 2*this.p1.y + this.p0.y) +
                       6 * t *   (this.p3.y - 2*this.p2.y + this.p2.y));
    }

    /**
     * Computes the curvature at position t of the curve. Curvature is 1/R where R is the instantaneous
     * radius of the curve.
     * @param {number} t The point of the curve to consider. The curve starts at t=0 and ends at t=1.
     * @returns {number} The curvature value.
     */
    curvature(t) {
      var d1 = this.firstDerivative(t) || 0,
          d2 = this.secondDerivative(t) || 0;
      return (d1.x*d2.y - d1.y*d2.x) / Math.pow(d1.x*d1.x + d1.y*d1.y, 1.5);
    }

    /**
     * Computes the tangent at position t of the curve.
     * @param {number} t The point of the curve to consider. The curve starts at t=0 and ends at t=1.
     * @returns {Point} The tangent as a vector.
     */
    tangent(t) {
      var d1 = this.firstDerivative(t),
          d = Math.sqrt(d1.x*d1.x + d1.y*d1.y) || 1;
      return new Point(d1.x/d, d1.y/d);
    }

    /**
     * Computes the normal at position t of the curve.
     * @param {number} t The point of the curve to consider. The curve starts at t=0 and ends at t=1.
     * @returns {Point} The normal as a vector.
     */
    normal(t) {
      var tan = this.tangent(t);
      return new Point(-tan.y, tan.x);
    }
  }

  class BezierSpline {
    // adapted from https://www.particleincell.com/wp-content/uploads/2012/06/bezier-spline.js
    /*computes control points given knots K, this is the brain of the operation*/
    static computeControlPoints(k) {
      function a(i) {
        return i <= 0 ? 0 :
             i >= n-1 ? 2 : 1;
      }

      function c(i) {
        return i >= n-1 ? 0 : 1;
      }

      var n = k.length-1,
          p1 = new Array(n-1),
          p2 = new Array(n-1);

      // rhs vector, left most segment
      var b = times(n, 4),
          r = times(n-1).map(function(d, i) { return 4 * k[i] + 2 * k[i+1]; });

      b[0] = 2;
      b[n-1] = 7;

      r[0] = k[0] + 2*k[1];
      r.push(8*k[n-1] + k[n]);

      b.slice(1).forEach(function(d, i) {
        var m = a(i+1) / b[i];
        b[i+1] -= m*c(i);
        r[i+1] -= m*r[i];
      });

      p1[n-1] = r[n-1] / b[n-1];

      b.slice(1).forEach(function(d, i) {
        i = b.length - i - 2;
        p1[i] = (r[i] - c(i) * p1[i+1]) / b[i];
      });

      /*we have p1, now compute p2*/
      b.slice(1).forEach(function(d, i) {
        p2[i] = 2 * k[i+1] - p1[i+1];
      });
      p2[n-1] = 0.5 * (k[n] + p1[n-1]);

      return { p1:p1, p2:p2 };
    }

    static computeBezierSpline(xs, ys, closed) {
      var extend = 12;
      if (closed) {
        for (var i = 0; i < extend; i++) {
          xs.push(xs[i]);
          ys.push(ys[i]);
        }

        for (i = 0; i < extend; i++) {
          xs.splice(0, 0, xs[xs.length-extend-i-1]);
          ys.splice(0, 0, ys[ys.length-extend-i-1]);
        }
      }

      var cx = BezierSpline.computeControlPoints(xs),
          cy = BezierSpline.computeControlPoints(ys),
          startLength = 0;

      if (closed) {
        xs.splice(0, extend);
        xs.splice(-extend+1);
        ys.splice(0, extend);
        ys.splice(-extend+1);
        cx.p1.splice(0, extend);
        cx.p2.splice(0, extend);
        cy.p1.splice(0, extend);
        cy.p2.splice(0, extend);
      }

      return zip(pairs(xs), pairs(ys), cx.p1, cy.p1, cx.p2, cy.p2).map(function(d, i) {
        var c = new BezierCurve(new Point(d[0][0], d[1][0]),
                                new Point(d[2], d[3]),
                                new Point(d[4], d[5]),
                                new Point(d[0][1], d[1][1]));

        c.startLength = startLength;
        c.endLength = startLength + c.length;
        c.segmentOffset = i / (xs.length-1);
        c.index = i;

        startLength += c.length;

        return c;
      });
    }

    /**
     * A series of {@link BezierCurve}s that connect end-to-end, smoothly trnsistioning from one to the next.
     *
     * @param {Point[]} knots Array of points that the spline passes through. A curve is generated connecting each knot point to the next.
     * @param {boolean} [closed] Indicates that the spline should connect its end point back to its start point, making a loop.
     * @param {normalizeOptions} [normalize='none'] Option to indicate if the spline should be recomputed to smooth out numerical
     *  properties or make drawing easier.
     *  none: don't normalize the curve.
     *  length: recompute the spline so that each curve is approximately the same length.
     *  x: recompute the curve so that the x values are evenly distributed. Useful for when the knots define a function of y in terms of x coordinates.
     * @param {number} [segmentLength=1] If normalizing, sets the step interval for how close the normalized knot points should be.
     * @param {number} [segmentCount] If normalizing, sets the number of knot points to use, evenly distributed based on the normalization strategy.
     * @property {boolean} closed Indicates that the spline should connect its end point back to its start point, making a loop.
     * @property {BezierCurve[]} curves List of curves that make up the spline
     * @property {number[]} startLengths The length of the whole spline up to the start of each segment curve
     * @property {number[]} endLengths The length of the whole spline up to the end of each segment curve
     * @property {number} length The length of the entire spline
     */
    constructor(knots, closed) {
      this.closed = closed;
      this.curves = BezierSpline.computeBezierSpline(knots.map(Point.x), knots.map(Point.y), closed);
      this.startLengths = this.curves.map(function(c) { return c.startLength; });
      this.endLengths = this.curves.map(function(c) { return c.endLength; });
      this.length = this.curves[this.curves.length-1].endLength;
    }

    _curveIndex(t) {
      var i = Math.trunc(t);
      t = t % 1;

      if (i < 0 || i > this.curves.length) return null;
      if (i == this.curves.length) {
        i -= 1;
        t += 1;
      }

      return { i:i, t:t };
    }

    /**
     * Computes the point at position t of the curve.
     * @param {number} t The portion of the curve to consider. The spline starts at t=0 and ends at t=curves.length.
     * @returns {Point} the location point.
     */
    point(t) {
      var a = this._curveIndex(t);
      return this.curves[a.i].point(a.t);
    }

    /**
     * Computes the point at length z of the curve.
     * @param {number} z The length of the curve to travel.
     * @returns {Point} the location point.
     */
    pointAtLength(z) {
      function findCurveIndex(lengths, z, start, stop) {
        if (z > lengths[lengths.length-1]) {
          return lengths.length-1;
        }
        var guess = start + stop >>> 1;
        if ((guess === 0 || lengths[guess-1] < z) && lengths[guess] >= z) {
          return guess;
        }

        if (lengths[guess] < z) {
          return findCurveIndex(lengths, z, guess+1, stop);
        }

        return findCurveIndex(lengths, z, start, guess);
      }
      var i = findCurveIndex(this.endLengths, z, 0, this.endLengths.length);
      return this.curves[i].pointAtLength(z - this.startLengths[i]);
    }

    /**
     * Computes the first derivative at position t of the curve.
     * @param {number} t The point of the curve to consider. The curve starts at t=0 and ends at t=curves.length.
     * @returns {Point} The derivative as a vector.
     */
    firstDerivative(t) {
      var a = this._curveIndex(t);
      return this.curves[a.i].firstDerivative(a.t);
    }

    /**
     * Computes the second derivative at position t of the curve.
     * @param {number} t The point of the curve to consider. The curve starts at t=0 and ends at t=curves.length.
     * @returns {Point} The second derivative as a vector.
     */
    secondDerivative(t) {
      var a = this._curveIndex(t);
      return this.curves[a.i].secondDerivative(a.t);
    }

    /**
     * Computes the curvature at position t of the curve. Curvature is 1/R where R is the instantaneous
     * radius of the curve.
     * @param {number} t The point of the curve to consider. The curve starts at t=0 and ends at t=curves.length.
     * @returns {number} The curvature value.
     */
    curvature(t) {
      var a = this._curveIndex(t);
      return this.curves[a.i].curvature(a.t);
    }

    /**
     * Computes the tangent at position t of the curve.
     * @param {number} t The point of the curve to consider. The curve starts at t=0 and ends at t=curves.length.
     * @returns {Point} The tangent as a vector.
     */
    tangent(t) {
      var a = this._curveIndex(t);
      return this.curves[a.i].tangent(a.t);
    }

    /**
     * Computes the normal at position t of the curve.
     * @param {number} t The point of the curve to consider. The curve starts at t=0 and ends at t=curves.length.
     * @returns {Point} The normal as a vector.
     */
    normal(t) {
      var a = this._curveIndex(t);
      return this.curves[a.i].normal(a.t);
    }

    normalize(method, segmentLength, segmentCount) {
      segmentCount = segmentCount || Math.ceil(this.length / (segmentLength || 1));

      switch (method) {
        case 'length':
          segmentLength = this.length / segmentCount;

          // redistribute the knots along the path
          // this avoids having to find t at a length all the time because t now mimics length well enough
          // this also smooths out the derivatives since they are respective of t, not the length
          // now curves is based on the evenly distributed knots

          var ps = times(segmentCount).map(function(d, i) {
            return this.pointAtLength(segmentLength * i);
          }, this);

          return new BezierSpline(ps, this.closed);

        case 'x':
          /*
          // assumes that knots defines a function, so sorted by x values
          var tScale = d3.scale.linear()
                          .domain(knots.map(function(p) { return p.x; }))
                          .range(d3.range(knots.length)),
            step = knots[knots.length-1].x / segmentCount;

          this.curves = BezierSpline.computeBezierSpline(d3.range(0, segmentCount+step, step)
                                                           .map(tScale)
                                                           .map(this.pointAtLength));
          */

        default:
          return this;
      }
    }
  }

  /*
   * D3 plugin object that creates splines and curves based on bound data.
   *
   * @constructor
   * @returns {bezier} Bezier plugin object suitable for calling on a D3 selection with a dataset of points.
   */
  d3.bezier = function() {

    function paintPath(c) {
      var w = width(c) / 2,
        n0 = c.normal(0),
        n3 = c.normal(1);

      return 'M' + (c.p0.x - n0.x*w) + ',' + (c.p0.y - n0.y*w) +
           'L' + (c.p0.x + n0.x*w) + ',' + (c.p0.y + n0.y*w) +
           'L' + (c.p3.x + n3.x*w) + ',' + (c.p3.y + n3.y*w) +
           'L' + (c.p3.x - n3.x*w) + ',' + (c.p3.y - n3.y*w) + 'Z';
    }

    function drawPath(c) {
      return 'M' + c.p0.x + ',' + c.p0.y + ' ' +
           'C' + c.p1.x + ',' + c.p1.y + ' ' +
             c.p2.x + ',' + c.p2.y + ' ' +
             c.p3.x + ',' + c.p3.y;
    }

    var x = function(d) { return d[0]; },
        y = function(d) { return d[1]; },
        colorScale = d3.scale.linear()
              .domain([0,1])
              .interpolate(d3.interpolateHsl)
              .range(['#c00000', '#008000']),
        color = function(c) { return colorScale(c.segmentOffset); },
        closed = false,
        normalize = 'none', // none, x, length
        width = d3.functor(1),
        segmentLength = 10,
        segmentCount,
        drawSegment = drawPath;

    function my(selection) {
      selection.each(function(data) {
        var knots = d3.zip(data.map(x), data.map(y)).map(function(p) { return { x: p[0], y: p[1] }; }),
          spline = new BezierSpline(knots, closed).normalize(normalize, segmentLength, segmentCount),
          g = d3.select(this)
              .append('g')
              .classed('bezier-path', true)
              .datum(spline);

        g.selectAll('path')
          .data(spline.curves)
          .enter()
          .append('path')
            .attr('d', drawSegment)
            .style('fill', color)
            //.style('fill', 'none')
            .style('stroke', color);
      });
    }

    /**
     * x coordinate accessor property
     * @param {function} [_] Set value. The value should be a function that accepts each point in the bound data and
     *      returns the x coordinate. Defaults to `function(p) { return p[0]; }`
     * @returns {(function|Object)}
     */
    my.x = function(_) {
      if (!arguments.length) return x;
      x = _;
      return my;
    };

    my.y = function(_) {
      if (!arguments.length) return y;
      y = _;
      return my;
    };

    my.color = function(_) {
      if (!arguments.length) return color;
      color = d3.functor(_);
      return my;
    };

    my.closed = function(_) {
      if (!arguments.length) return closed;
      closed = _;
      return my;
    };

    my.normalize = function(_) {
      if (!arguments.length) return normalize;
      normalize = _;
      return my;
    };

    my.width = function(_) {
      if (!arguments.length) return width;
      width = d3.functor(_);
      return my;
    };

    my.segmentLength = function(_) {
      if (!arguments.length) return segmentLength;
      segmentLength = _;
      if (segmentLength) {
        segmentCount = undefined;
      }
      return my;
    };

    my.segmentCount = function(_) {
      if (!arguments.length) return segmentCount;
      segmentCount = _;
      if (segmentCount) {
        segmentLength = undefined;
      }
      return my;
    };

    my.drawSegment = function(_) {
      if (!arguments.length) return drawSegment;
      drawSegment = _ == 'draw' ? drawPath :
              _ == 'paint' ? paintPath :
              d3.functor(_);
      return my;
    };

    return my;
  };

})();
