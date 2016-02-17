# Bezier
This is a small library that provides additional functionality for drawing [Bezier curves](https://en.wikipedia.org/wiki/B%C3%A9zier_curve).

For no external dependencies, use `bezier.min.js`.

If you use [D3](https://d3js.org/), use `bezier.d3.min.js`, which includes a D3 plugin.

## Getting Started

## Files

| File             | Description |
| ---------------- | ----------- |
| bezier.coffee    | Source file for `Point`, `BezierCurve`, and `BezierSpline`. |
| bezier.js        | Raw js of coffee source. |
| bezier.js.map    | Map file for bezier.js |
| bezier.min.js    | Minified bezier.js. |
| d3-plugin.coffee | Source file for `d3.bezier` extension for [d3](https://d3js.org/). |
| bezier.d3.coffee | Combined source file of bezier.coffee and d3-plugin.coffee |
| bezier.d3.js     | Full `.js` file for core and d3 functions. |
| bezier.d3.js.map | Map file for bezier.d3.js |
| bezier.d3.min.js | Minified version of bezier.d3.js |

## Examples

## API

### <a name="Point">[Point](Point)</a>

A Point object represents a location in space or a vector.

#### new Point(x, y)
* `x`: Number. The x coordinate
* `y`: Number. The y coordinate

##### Example
```
var p = new Point(35, 27); // { x: 35, y: 27 }
```

### <a name="BezierCurve">[BezierCurve](BezierCurve)</a>

A `BezierCurve` represents one segment of a spline.

#### new BezierCurve(p0, p1, p2, p3)
* `p0`: [Point](Point). start point
* `p1`: [Point](Point). control point 1
* `p2`: [Point](Point). control point 2
* `p3`: [Point](Point). end point

##### Example
```
var c = new BezierCurve(new Point(10,10), new Point(10,10), new Point(10,10), new Point(10,10));
```

#### lengthAt(t)
Computes the length at position t of the curve.

* `t`: Number. The portion of the curve to consider. The curve starts at t=0 and ends at t=1.
* Returns number, the length value.


#### point(t)
Computes the point at position t of the curve.

* `t`: number. The portion of the curve to consider. The curve starts at t=0 and ends at t=1.
* Returns: [Point](Point), the location point.


#### pointAtLength(z)
Computes the point at a length of the curve.

* `z`: number. The length of the curve to travel.
* Returns: [Point](Point) the location point.


#### firstDerivative(t)
Computes the first derivative at position t of the curve.

* `t`: number. The point of the curve to consider. The curve starts at t=0 and ends at t=1.
* Returns: [Point](Point), The derivative as a vector.


#### secondDerivative(t)
Computes the second derivative at position t of the curve.

* `t`: number. The point of the curve to consider. The curve starts at t=0 and ends at t=1.
* Returns: [Point](Point). The second derivative as a vector.


#### curvature(t)
Computes the curvature at position t of the curve. Curvature is 1/R where R is the instantaneous
radius of the curve.

* `t`: number. The point of the curve to consider. The curve starts at t=0 and ends at t=1.
* Returns: number, The curvature value.


#### tangent(t)
Computes the tangent at position t of the curve.

* `t`: number. The point of the curve to consider. The curve starts at t=0 and ends at t=1.
* Returns: [Point](Point). The tangent as a vector.


#### normal(t)
Computes the normal at position t of the curve.

* `t`: number The point of the curve to consider. The curve starts at t=0 and ends at t=1.
* Returns: [Point](Point). The normal as a vector.


### <a name="BezierSpline">[BezierSpline](BezierSpline)</a>

A series of [BezierCurve](BezierCurve)'s that connect end-to-end, smoothly transitioning from one to the next.

#### curves
List of curves that make up the spline.
`BezierCurve[]`

#### startLengths
The length of the whole spline up to the start of each segment curve.
`number[]`

#### endLengths
The length of the whole spline up to the end of each segment curve.
`number[]`

#### length
The length of the entire spline.
`number`

#### new BezierSpline(knots, closed)

* `knots`: [Point](Point)[]. Array of points that the spline passes through. A curve is generated connecting each knot point to the next.
* `closed`: Boolean. Default false. Indicates that the spline should connect its end point back to its start point, making a loop.


#### point(t)
Computes the point at position t of the curve.

* `t` The portion of the curve to consider. The spline starts at t=0 and ends at t=curves.length.
* Returns: [Point](Point). the location point.


#### pointAtLength(z)
Computes the point at length z of the curve.

* `z` The length of the curve to travel.
* Returns: [Point](Point). the location point.


#### firstDerivative(t)
Computes the first derivative at position t of the curve.

* `t` The point of the curve to consider. The curve starts at t=0 and ends at t=curves.length.
* Returns: [Point](Point). The derivative as a vector.


#### secondDerivative(t)
Computes the second derivative at position t of the curve.

* `t` The point of the curve to consider. The curve starts at t=0 and ends at t=curves.length.
* Returns: [Point](Point). The second derivative as a vector.


#### curvature(t)
Computes the curvature at position t of the curve. Curvature is 1/R where R is the instantaneous
radius of the curve.

* `t` The point of the curve to consider. The curve starts at t=0 and ends at t=curves.length.
* Returns: number. The curvature value.


#### tangent(t)
Computes the tangent at position t of the curve.

* `t` The point of the curve to consider. The curve starts at t=0 and ends at t=curves.length.
* Returns: [Point](Point). The tangent as a vector.


#### normal(t)
Computes the normal at position t of the curve.

* `t` The point of the curve to consider. The curve starts at t=0 and ends at t=curves.length.
* Returns: [Point](Point). The normal as a vector.


#### normalize(method, segmentLength, segmentCount)
Produces a new [BezierSpline](BezierSpline) with the points normalized.

* `method`: ('length', 'x'). Default 'length'. Option to indicate if the spline should be recomputed to smooth out numerical
properties or make drawing easier.
  * length: recompute the spline so that each curve is approximately the same length.
  * x: recompute the curve so that the x values are evenly distributed. Useful for when the knots define a function of y in terms of x coordinates.
* `segmentLength`: number. Defatul 1. If normalizing, sets the step interval for how close the normalized knot points should be.
* `segmentCount`: number. If normalizing, sets the number of knot points to use, evenly distributed based on the normalization strategy.


## Credits

* Function to create control points of a Bezier Spline: [particleincell.com](https://www.particleincell.com)
* Function to compute the length of a Bezier Curve: [raphael](https://github.com/DmitryBaranovskiy/raphael)

## License
[MIT](http://en.wikipedia.org/wiki/MIT_License)
