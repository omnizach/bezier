###

# Bezier
A library for generating smooth Bezier curves and splines. This contains extra functionality missing from SVG.

## Credits

* Function to create control points of a Bezier Spline: [particleincell.com](https://www.particleincell.com)
* Function to compute the length of a Bezier Curve: [raphael](https://github.com/DmitryBaranovskiy/raphael)

## License
[MIT](http://en.wikipedia.org/wiki/MIT_License)

###

_zip = () ->
  ### Utility function for array zip. ###
  lengthArray = (arr.length for arr in arguments)
  length = Math.min(lengthArray...)
  for i in [0...length]
    arr[i] for arr in arguments

Function::_getter = (prop, get) ->
  ### Utility function for defining object property getter. ###
  Object.defineProperty @prototype, prop, {get, configurable: yes}

Function::_setter = (prop, set) ->
  ### Utility function for defining object property setter. ###
  Object.defineProperty @prototype, prop, {set, configurable: yes}

class Point
  ### A Point object represents a location in space or a vector. ###

  constructor: (@x, @y) ->
    ###
    * x: Number. The x coordinate
    * y: Number. The y coordinate

    ```
    var p = new Point(35, 27); // { x: 35, y: 27 }
    ```
    ###


class BezierCurve
  ###
  A BezierCurve represents one segment of a spline.
  ###

  @_base3 = (t, p1, p2, p3, p4) ->
    t1 = -3 * p1 + 9 * p2 - 9 * p3 + 3 * p4
    t2 = t * t1 + 6 * p1 - 12 * p2 + 6 * p3
    return t * t2 - 3 * p1 + 3 * p2;

  constructor: (@p0, @p1, @p2, @p3) ->
    ###
    * p0: Point. start point
    * p1: Point. control point 1
    * p2: Point. control point 2
    * p3: Point. end point
    ###

  _findT: (target, guess) ->
    target = Math.min(target, @length)
    guess = guess || target / @length

    error = (@lengthAt(guess) - target) / @length;

    if Math.abs(error) < 0.0001
      guess
    else
      @_findT(target, guess - error / 2);

  # adapted from: https://github.com/DmitryBaranovskiy/raphael/blob/c47c077368c1113e1ed653376415961749de5466/dev/raphael.core.js
  lengthAt: (t = 1) ->
    ###
    Computes the length at position t of the curve.

    * t: Number. The portion of the curve to consider. The curve starts at t=0 and ends at t=1.
    * Returns number, the length value.
    ###
    t = if t > 1 then 1 else if t < 0 then 0 else t
    t2 = t / 2

    integrate = (d) ->
      ct = t2 * d[0] + t2
      d[1] * Math.sqrt(BezierCurve._base3(ct, @p0.x, @p1.x, @p2.x, @p3.x) ** 2 +
                       BezierCurve._base3(ct, @p0.y, @p1.y, @p2.y, @p3.y) ** 2)

    t2 * [[-0.1252, 0.2491],[0.1252, 0.2491],[-0.3678, 0.2335],[0.3678, 0.2335],[-0.5873, 0.2032],
                 [0.5873, 0.2032],[-0.7699, 0.1601],[0.7699, 0.1601],[-0.9041, 0.1069],[0.9041, 0.1069],
                 [-0.9816, 0.0472],[0.9816, 0.0472]]
    .map integrate, this
    .reduce (p, c) -> p + c

  @_getter 'length', -> @_length ?= @lengthAt(1)
  ###
  The full length of the curve
  ###

  point: (t) ->
    ###
    Computes the point at position t of the curve.

    * t: number. The portion of the curve to consider. The curve starts at t=0 and ends at t=1.
    * Returns: Point, the location point.
    ###
    new Point((1-t)**3 * @p0.x +
              3 * (1-t)**2 * t * @p1.x +
              3 * (1-t) * t**2 * @p2.x +
              t**3 * @p3.x,
              (1-t)**3 * @p0.y +
              3 * (1-t)**2 * t * @p1.y +
              3 * (1-t) * t**2 * @p2.y +
              t**3 * @p3.y)

  pointAtLength: (z) ->
    ###
    Computes the point at a length of the curve.

    * z: number. The length of the curve to travel.
    * Returns: {Point} the location point.
    ###
    @point @_findT z

  firstDerivative: (t) ->
    ###
    Computes the first derivative at position t of the curve.

    * t: number. The point of the curve to consider. The curve starts at t=0 and ends at t=1.
    * Returns: Point, The derivative as a vector.
    ###
    new Point(3 * (1-t) ** 2 * (@p1.x - @p0.x) +
              6 * (1-t) * t * (@p2.x - @p1.x) +
              3 * t**2 * (@p3.x - @p2.x),
              3 * (1-t) ** 2 * (@p1.y - @p0.y) +
              6 * (1-t) * t * (@p2.y - @p1.y) +
              3 * t**2 * (@p3.y - @p2.y))

  secondDerivative: (t) ->
    ###
    Computes the second derivative at position t of the curve.

    * t: number. The point of the curve to consider. The curve starts at t=0 and ends at t=1.
    * Returns: Point. The second derivative as a vector.
    ###
    new Point(6 * (1-t) * (@p2.x - 2*@p1.x + @p0.x) +
              6 * t * (@p3.x - 2*@p2.x + @p2.x),
              6 * (1-t) * (@p2.y - 2*@p1.y + @p0.y) +
              6 * t *   (@p3.y - 2*@p2.y + @p2.y))


  curvature: (t) ->
    ###
    Computes the curvature at position t of the curve. Curvature is 1/R where R is the instantaneous
    radius of the curve.

    * t: number. The point of the curve to consider. The curve starts at t=0 and ends at t=1.
    * Returns: number, The curvature value.
    ###
    d1 = @firstDerivative(t) || 0
    d2 = @secondDerivative(t) || 0
    (d1.x*d2.y - d1.y*d2.x) / (d1.x*d1.x + d1.y*d1.y) ** 1.5

  tangent: (t) ->
    ###
    Computes the tangent at position t of the curve.

    * t: number. The point of the curve to consider. The curve starts at t=0 and ends at t=1.
    * Returns: Point. The tangent as a vector.
    ###
    d1 = @firstDerivative(t)
    d = Math.sqrt(d1.x*d1.x + d1.y*d1.y) || 1
    new Point(d1.x/d, d1.y/d)

  normal: (t) ->
    ###
    Computes the normal at position t of the curve.

    * t: number The point of the curve to consider. The curve starts at t=0 and ends at t=1.
    * Returns: Point. The normal as a vector.
    ###
    tan = @tangent t
    new Point(-tan.y, tan.x)

class BezierSpline
  ###
  A series of BezierCurve's that connect end-to-end, smoothly transitioning from one to the next.

  * curves: BezierCurve[]. List of curves that make up the spline
  * startLengths: number[]. The length of the whole spline up to the start of each segment curve
  * endLengths: number[]. The length of the whole spline up to the end of each segment curve
  * length: number. The length of the entire spline
  ###
  # adapted from https://www.particleincell.com/wp-content/uploads/2012/06/bezier-spline.js
  # computes control points given knots K, this is the brain of the operation
  @computeControlPoints = (k) ->
    a = (i) -> if i <= 0 then 0 else if i >= n-1 then 2 else 1
    c = (i) -> if i >= n-1 then 0 else 1

    n = k.length-1
    p1 = new Array(n-1)
    p2 = new Array(n-1)

    b = (4 for i in [0...n])
    b[0] = 2
    b[n-1] = 7

    r = (4 * k[i] + 2 * k[i+1] for i in [0...n-1])
    r[0] = k[0] + 2*k[1]
    r.push 8*k[n-1] + k[n]

    for i in [0...b.length-1]
      m = a(i+1) / b[i]
      b[i+1] -= m * c(i)
      r[i+1] -= m * r[i]

    p1[n-1] = r[n-1] / b[n-1]

    for i in [b.length-2..0]
      p1[i] = (r[i] - c(i) * p1[i+1]) / b[i]

    for i in [0...b.length-1]
      p2[i] = 2 * k[i+1] - p1[i+1]

    p2[n-1] = 0.5 * (k[n] + p1[n-1])

    { p1: p1, p2: p2 }

  @computeBezierSpline = (xs, ys, closed) ->
    extend = 12

    if closed
      extendRight = (ns) -> (ns[i %% ns.length] for i in [0...extend])

      extendLeft = (ns) -> (ns[(ns.length-i) %% ns.length] for i in [extend...0])

      xs = [extendLeft(xs)..., xs..., extendRight(xs)...]
      ys = [extendLeft(ys)..., ys..., extendRight(ys)...]

    cx = BezierSpline.computeControlPoints xs
    cy = BezierSpline.computeControlPoints ys
    startLength = 0

    if closed
      xs = xs[extend..-extend]
      ys = ys[extend..-extend]
      cx.p1 = cx.p1[extend..-extend]
      cy.p1 = cy.p1[extend..-extend]
      cx.p2 = cx.p2[extend..-extend]
      cy.p2 = cy.p2[extend..-extend]

    for [p0x, p0y, p1x, p1y, p2x, p2y, p3x, p3y], i in _zip(xs[...-1], ys[...-1], cx.p1, cy.p1, cx.p2, cy.p2, xs[1..], ys[1..])
      c = new BezierCurve(new Point(p0x, p0y), new Point(p1x, p1y), new Point(p2x, p2y), new Point(p3x, p3y))
      c.startLength = startLength;
      c.endLength = startLength + c.length;
      c.segmentOffset = i / (xs.length-1);
      c.index = i;

      startLength += c.length;

      c

  constructor: (knots, closed) ->
    ###

    * knots: Point[]. Array of points that the spline passes through. A curve is generated connecting each knot point to the next.
    * closed: Boolean. Default false. Indicates that the spline should connect its end point back to its start point, making a loop.
    ###
    @closed = closed;
    @curves = BezierSpline.computeBezierSpline(knots.map((p) -> p.x), knots.map((p) -> p.y), closed);
    @startLengths = (c.startLength for c in @curves)
    @endLengths = (c.endLength for c in @curves)
    @length = @endLengths[-1..][0];

  _curveIndex: (t) ->
    i = Math.trunc(t)
    t = t % 1

    if i < 0 || i > @curves.length
      null
    else if i == @curves.length
      { i: i-1, t: t+1 }
    else
      { i:i, t:t }

  point: (t) ->
    ###
    Computes the point at position t of the curve.

    * t The portion of the curve to consider. The spline starts at t=0 and ends at t=curves.length.
    * Returns: Point. the location point.
    ###
    a = @_curveIndex(t)
    @curves[a.i].point(a.t)

  pointAtLength: (z) ->
    ###
    Computes the point at length z of the curve.

    * z The length of the curve to travel.
    * Returns: Point. the location point.
    ###
    findCurveIndex = (lengths, z, start, stop) ->
      mid = start + stop >>> 1
      switch
        when (lengths[mid-1] || 0) <= z <= lengths[mid] then mid
        when z < (lengths[mid-1] || 0) then findCurveIndex(lengths, z, start, mid)
        else findCurveIndex(lengths, z, mid+1, stop)

    i = findCurveIndex(@endLengths, Math.min(z, @endLengths[@endLengths.length-1]), 0, @endLengths.length)
    @curves[i].pointAtLength(z - @startLengths[i])

  firstDerivative: (t) ->
    ###
    Computes the first derivative at position t of the curve.

    * t The point of the curve to consider. The curve starts at t=0 and ends at t=curves.length.
    * Returns: Point. The derivative as a vector.
    ###
    a = @_curveIndex(t)
    @curves[a.i].firstDerivative(a.t)

  secondDerivative: (t) ->
    ###
    Computes the second derivative at position t of the curve.

    * t The point of the curve to consider. The curve starts at t=0 and ends at t=curves.length.
    * Returns: Point. The second derivative as a vector.
    ###
    a = @_curveIndex(t)
    @curves[a.i].secondDerivative(a.t)

  curvature: (t) ->
    ###
    Computes the curvature at position t of the curve. Curvature is 1/R where R is the instantaneous
    radius of the curve.

    * t The point of the curve to consider. The curve starts at t=0 and ends at t=curves.length.
    * Returns: number. The curvature value.
    ###
    a = @_curveIndex(t)
    @curves[a.i].curvature(a.t)

  tangent: (t) ->
    ###
    Computes the tangent at position t of the curve.

    * t The point of the curve to consider. The curve starts at t=0 and ends at t=curves.length.
    * Returns: Point. The tangent as a vector.
    ###
    a = this._curveIndex(t)
    return this.curves[a.i].tangent(a.t)

  normal: (t) ->
    ###
    Computes the normal at position t of the curve.

    * t The point of the curve to consider. The curve starts at t=0 and ends at t=curves.length.
    * Returns: Point. The normal as a vector.
    ###
    a = @_curveIndex(t)
    @curves[a.i].normal(a.t)

  normalize: (method, segmentLength, segmentCount) ->
    ###
    Produces a new BezierSpline with the points normalized.

    * method: ('length', 'x'). Default 'length'. Option to indicate if the spline should be recomputed to smooth out numerical
    properties or make drawing easier.
      * length: recompute the spline so that each curve is approximately the same length.
      * x: recompute the curve so that the x values are evenly distributed. Useful for when the knots define a function of y in terms of x coordinates.
    * segmentLength: number. Defatul 1. If normalizing, sets the step interval for how close the normalized knot points should be.
    * segmentCount: number. If normalizing, sets the number of knot points to use, evenly distributed based on the normalization strategy.
    ###
    segmentCount = segmentCount || Math.ceil(@length / (segmentLength || 1))

    switch method
      when 'length'
        segmentLength = @length / segmentCount
        ps = (@pointAtLength(i * segmentLength) for i in [0...segmentCount])
        new BezierSpline(ps, @closed)

      when 'x'
        this # TODO

      else
        this

# DEPRICATED CODE, NEEDS REWRITE
#// assumes that knots defines a function, so sorted by x values
#var tScale = d3.scale.linear()
#                .domain(knots.map(function(p) { return p.x; }))
#                .range(d3.range(knots.length)),
#  step = knots[knots.length-1].x / segmentCount;
#
#this.curves = BezierSpline.computeBezierSpline(d3.range(0, segmentCount+step, step)
#.map(tScale)
#.map(this.pointAtLength));
d3.bezier = ->

  paintPath = (c) ->
    w = width(c) / 2
    n0 = c.normal(0)
    n3 = c.normal(1)

    "M #{ c.p0.x - n0.x*w }, #{ c.p0.y - n0.y*w }
     L #{ c.p0.x + n0.x*w }, #{ c.p0.y + n0.y*w }
     L #{ c.p3.x + n3.x*w }, #{ c.p3.y + n3.y*w }
     L #{ c.p3.x - n3.x*w }, #{ c.p3.y - n3.y*w } Z"

  drawPath = (c) ->
    "M #{ c.p0.x }, #{ c.p0.y }
     C #{ c.p1.x }, #{ c.p1.y }
       #{ c.p2.x }, #{ c.p2.y }
       #{ c.p3.x }, #{ c.p3.y }"

  x = (d) -> d[0]
  y = (d) -> d[1]

  colorScale = d3.scale.linear()
              .domain([0,1])
              .interpolate(d3.interpolateHsl)
              .range(['#c00000', '#008000'])

  color = (c) -> colorScale(c.segmentOffset)
  closed = false
  normalize = 'none' # none, x, length
  width = -> 1
  segmentLength = 10
  segmentCount = 1
  drawSegment = drawPath
  fill = 'none'

  my = (selection) ->
    selection.each (data) ->
      knots = d3.zip(data.map(x), data.map(y)).map((p) -> { x: p[0], y: p[1] })
      spline = (new BezierSpline(knots, closed)).normalize(normalize, segmentLength, segmentCount)
      g = d3.select(this)
            .append('g')
            .classed('bezier-path', true)
            .datum(spline)

      g.selectAll('path')
        .data(spline.curves)
        .enter()
        .append('path')
        .attr('d', drawSegment)
        .style('fill', fill)
        .style('stroke', color)

  ###
  x coordinate accessor property
  @param {function} [_] Set value. The value should be a function that accepts each point in the bound data and
  returns the x coordinate. Defaults to `function(p) { return p[0]; }`
  @returns {(function|Object)}
  ###
  my.x = (_) -> if !arguments.length then x else x = _; my

  my.y = (_) -> if !arguments.length then y else y = _; my

  my.color = (_) -> if !arguments.length then color else color = d3.functor(_); my

  my.closed = (_) -> if !arguments.length then closed else closed = _; my

  my.normalize = (_) -> if !arguments.length then normalize else normalize = _; my

  my.width = (_) -> if !arguments.length then width else width = d3.functor(_); my

  my.segmentLength = (_) -> if !arguments.length then segmentLength else segmentLength = _; segmentCount = undefined; my

  my.segmentCount = (_) -> if !arguments.length then segmentCount else segmentCount = _; segmentLength = undefined; my

  my.fill = (_) -> if !arguments.length then fill else fill = _; my

  my.drawSegment = (_) ->
    if !arguments.length
      drawSegment
    else
      drawSegment = switch _
        when 'draw' then drawPath
        when 'paint' then paintPath
        else d3.functor(_)
      my

  my
