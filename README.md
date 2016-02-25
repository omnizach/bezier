# Bezier
This is a small library that provides additional functionality for drawing [Bezier curves](https://en.wikipedia.org/wiki/B%C3%A9zier_curve).

## Getting Started

Install via [Bower](http://bower.io/):

```
bower install bezier --save
```

Then, reference the script in html:

```
<script src="bower_components/bezier/bezier.min.js"></script>
```

## Examples

* [Gradient Along Stroke](http://bl.ocks.org/omnizach/0f93ca731883d601a114)
* [Rainbow Circle](http://bl.ocks.org/omnizach/209cf70cd9a377f5c224)

## API

### Spline

A series of [Curve](Curve)'s that connect end-to-end, smoothly transitioning from one to the next.

#### curves
List of curves that make up the spline.
`Curve[]`

#### startLengths
The length of the whole spline up to the start of each segment curve.
`number[]`

#### endLengths
The length of the whole spline up to the end of each segment curve.
`number[]`

#### length
The length of the entire spline.
`number`

#### new Spline(knots, closed)

* `knots`: Point[]. Array of points that the spline passes through. A curve is generated connecting each knot point to the next.
* `closed`: Boolean. Default false. Indicates that the spline should connect its end point back to its start point, making a loop.


#### point(t)
Computes the point at position t of the curve.

* `t` The portion of the curve to consider. The spline starts at t=0 and ends at t=curves.length.
* Returns: Point. the location point.


#### pointAtLength(z)
Computes the point at length z of the curve.

* `z` The length of the curve to travel.
* Returns: Point. the location point.


#### firstDerivative(t)
Computes the first derivative at position t of the curve.

* `t` The point of the curve to consider. The curve starts at t=0 and ends at t=curves.length.
* Returns: Point. The derivative as a vector.


#### secondDerivative(t)
Computes the second derivative at position t of the curve.

* `t` The point of the curve to consider. The curve starts at t=0 and ends at t=curves.length.
* Returns: Point. The second derivative as a vector.


#### curvature(t)
Computes the curvature at position t of the curve. Curvature is 1/R where R is the instantaneous
radius of the curve.

* `t` The point of the curve to consider. The curve starts at t=0 and ends at t=curves.length.
* Returns: number. The curvature value.


#### tangent(t)
Computes the tangent at position t of the curve.

* `t` The point of the curve to consider. The curve starts at t=0 and ends at t=curves.length.
* Returns: Point. The tangent as a vector.


#### normal(t)
Computes the normal at position t of the curve.

* `t` The point of the curve to consider. The curve starts at t=0 and ends at t=curves.length.
* Returns: Point. The normal as a vector.


#### normalize(segmentLength, segmentCount)
Produces a new Spline with the points normalized. Recomputes the
spline so that the points are evenly distributed and each curve
is approximately the same length. This has the side-effect of all
the properties (such as the derivatives) to be approximately
accurate with respect to the length of the curve when using the
`t` value, making many of these operations much more efficient.

* segmentLength: number. Default 1. If normalizing, sets the step
  interval for how close the normalized knot points should be.
* segmentCount: number. Default spline length / segmentLength.
  If normalizing, sets the number of knot
  points to use, evenly distributed based on the normalization
  strategy.

### Curve

A `Curve` represents one segment of a spline. You generally shouldn't need to create Curves directly, that's Spline's job.

#### Curve.penPath

Static function that will draw the curve using the SVG path mini-language. It's useful as a map function over a Spline's curves.

#### Curve.paintPath

* w: number. The width of each segment.

Static function factory that will draw the curve as a wedge that can be filled, using the SVG path mini-language.
It's useful as a map function over a Spline's curves.

Example using D3:

```
var path = bezier.Curve.paintPath(50); // each segment will have width 50

var spline = new bezier.Spline(points);

d3.selectAll('.curve')
  .data(spline.curves)
    .enter()
    .append('path')
    .attr('d', path);
```

#### new Curve(p0, p1, p2, p3)
* `p0`: Point. start point
* `p1`: Point. control point 1
* `p2`: Point. control point 2
* `p3`: Point. end point

##### Example
```
var c = new Curve(new Point(10,10), new Point(20,10), new Point(20,20), new Point(10,20));
```

#### lengthAt(t)
Computes the length at position t of the curve.

* `t`: Number. The portion of the curve to consider. The curve starts at t=0 and ends at t=1.
* Returns number, the length value.


#### point(t)
Computes the point at position t of the curve.

* `t`: number. The portion of the curve to consider. The curve starts at t=0 and ends at t=1.
* Returns: Point, the location point.


#### pointAtLength(z)
Computes the point at a length of the curve.

* `z`: number. The length of the curve to travel.
* Returns: Point the location point.


#### firstDerivative(t)
Computes the first derivative at position t of the curve.

* `t`: number. The point of the curve to consider. The curve starts at t=0 and ends at t=1.
* Returns: Point, The derivative as a vector.


#### secondDerivative(t)
Computes the second derivative at position t of the curve.

* `t`: number. The point of the curve to consider. The curve starts at t=0 and ends at t=1.
* Returns: Point. The second derivative as a vector.


#### curvature(t)
Computes the curvature at position t of the curve. Curvature is 1/R where R is the instantaneous
radius of the curve.

* `t`: number. The point of the curve to consider. The curve starts at t=0 and ends at t=1.
* Returns: number, The curvature value.


#### tangent(t)
Computes the tangent at position t of the curve.

* `t`: number. The point of the curve to consider. The curve starts at t=0 and ends at t=1.
* Returns: Point. The tangent as a vector.


#### normal(t)
Computes the normal at position t of the curve.

* `t`: number The point of the curve to consider. The curve starts at t=0 and ends at t=1.
* Returns: Point. The normal as a vector.

### Point</a>

A Point object represents a location in space or a vector. It exists mainly for documentation and
any object that conforms to `{ x: (number), y: (number) }` will work.

#### new Point(x, y)
* `x`: Number. The x coordinate
* `y`: Number. The y coordinate

##### Example
```
var p = Point(35, 27); // { x: 35, y: 27 }
```

## Credits

* Function to create control points of a Bezier Spline: [particleincell.com](https://www.particleincell.com)
* Function to compute the length of a Bezier Curve: [raphael](https://github.com/DmitryBaranovskiy/raphael)

## License
[MIT](http://en.wikipedia.org/wiki/MIT_License)
