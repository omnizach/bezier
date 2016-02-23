###

# Bezier
A library for generating smooth Bezier curves and splines. This
contains extra functionality missing from SVG.

## Credits

* Function to create control points of a Bezier Spline:
  [particleincell.com](https://www.particleincell.com)
* Function to compute the length of a Bezier Curve:
  [raphael](https://github.com/DmitryBaranovskiy/raphael)

## License
[MIT](http://en.wikipedia.org/wiki/MIT_License)

###

_zip = () ->
  lengthArray = (arr.length for arr in arguments)
  length = Math.min(lengthArray...)
  for i in [0...length]
    arr[i] for arr in arguments

Function::_getter = (prop, get) ->
  Object.defineProperty @prototype, prop, {get, configurable: yes}

#Function::_setter = (prop, set) ->
#  ### Utility function for defining object property setter. ###
#  Object.defineProperty @prototype, prop, {set, configurable: yes}

ALMOST_ONE = 1 - 1e-6

class Point

  constructor: (x, y) ->
    return new Point(x, y) unless this instanceof Point

    @x = x
    @y = y


class Curve

  @penPath = (c) ->
    "M #{ c.p0.x }, #{ c.p0.y }
     C #{ c.p1.x }, #{ c.p1.y }
       #{ c.p2.x }, #{ c.p2.y }
       #{ c.p3.x }, #{ c.p3.y }"

  @paintPath = (w) ->
    w2 = w / 2
    (c) ->
      n0 = c.normal(0)
      n3 = c.normal(1)

      "M #{ c.p0.x - n0.x*w2 }, #{ c.p0.y - n0.y*w2 }
       L #{ c.p0.x + n0.x*w2 }, #{ c.p0.y + n0.y*w2 }
       L #{ c.p3.x + n3.x*w2 }, #{ c.p3.y + n3.y*w2 }
       L #{ c.p3.x - n3.x*w2 }, #{ c.p3.y - n3.y*w2 } Z"

  constructor: (p0, p1, p2, p3) ->
    return new Curve(p0, p1, p2, p3) unless this instanceof Curve

    @p0 = p0
    @p1 = p1
    @p2 = p2
    @p3 = p3

  _findT: (target, guess) ->
    target = Math.min(target, @length)
    guess = guess || target / @length

    error = (@lengthAt(guess) - target) / @length

    if Math.abs(error) < 0.0001
      guess
    else
      @_findT(target, guess - error / 2)

  @_base3 = (t, p1, p2, p3, p4) ->
    t1 = -3 * p1 + 9 * p2 - 9 * p3 + 3 * p4
    t2 = t * t1 + 6 * p1 - 12 * p2 + 6 * p3
    t * t2 - 3 * p1 + 3 * p2

  # adapted from:
  # https://github.com/DmitryBaranovskiy/raphael/blob/c47c077368c1113e1ed653376415961749de5466/dev/raphael.core.js
  lengthAt: (t = 1) ->
    t = if t > 1 then 1 else if t < 0 then 0 else t
    t2 = t / 2

    integrate = (d) ->
      ct = t2 * d[0] + t2
      d[1] * Math.sqrt(Curve._base3(ct, @p0.x, @p1.x, @p2.x, @p3.x) ** 2 +
                       Curve._base3(ct, @p0.y, @p1.y, @p2.y, @p3.y) ** 2)

    t2 * [[-0.1252, 0.2491],[0.1252, 0.2491],[-0.3678, 0.2335],
          [0.3678, 0.2335],[-0.5873, 0.2032],[0.5873, 0.2032],
          [-0.7699, 0.1601],[0.7699, 0.1601],[-0.9041, 0.1069],
          [0.9041, 0.1069],[-0.9816, 0.0472],[0.9816, 0.0472]
    ].map integrate, this
    .reduce (p, c) -> p + c

  @_getter 'length', -> @_length ?= @lengthAt(1)

  x: (t = 0) ->
    (1-t)**3 * @p0.x +
    3 * (1-t)**2 * t * @p1.x +
    3 * (1-t) * t**2 * @p2.x +
    t**3 * @p3.x

  y: (t = 0) ->
    (1-t)**3 * @p0.y +
    3 * (1-t)**2 * t * @p1.y +
    3 * (1-t) * t**2 * @p2.y +
    t**3 * @p3.y

  point: (t = 0) ->
    Point(@x(t), @y(t))

  pointAtLength: (z = 0) ->
    @point @_findT z

  firstDerivative: (t = 0) ->
    new Point(3 * (1-t) ** 2 * (@p1.x - @p0.x) +
              6 * (1-t) * t * (@p2.x - @p1.x) +
              3 * t**2 * (@p3.x - @p2.x),
              3 * (1-t) ** 2 * (@p1.y - @p0.y) +
              6 * (1-t) * t * (@p2.y - @p1.y) +
              3 * t**2 * (@p3.y - @p2.y))

  secondDerivative: (t = 0) ->
    new Point(6 * (1-t) * (@p2.x - 2*@p1.x + @p0.x) +
              6 * t * (@p3.x - 2*@p2.x + @p2.x),
              6 * (1-t) * (@p2.y - 2*@p1.y + @p0.y) +
              6 * t *   (@p3.y - 2*@p2.y + @p2.y))


  curvature: (t = 0) ->
    d1 = @firstDerivative(t) || 0
    d2 = @secondDerivative(t) || 0
    (d1.x*d2.y - d1.y*d2.x) / (d1.x ** 2 + d1.y ** 2) ** 1.5

  tangent: (t = 0) ->
    d1 = @firstDerivative(t)
    d = Math.sqrt(d1.x*d1.x + d1.y*d1.y) || 1
    new Point(d1.x/d, d1.y/d)

  normal: (t = 0) ->
    tan = @tangent t
    new Point(-tan.y, tan.x)

  pointTransform: (t = 0) ->
    [x, y] = [@x(t), @y(t)]
    tan = @tangent(t)
    "translate(#{ x }, #{ y }) rotate(#{ Math.atan2(tan.y, tan.x)*180/Math.PI })"

class Spline

  # adapted from https://www.particleincell.com/wp-content/uploads/2012/06/bezier-spline.js
  # computes control points given knots K, this is the brain of the
  # operation
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

  @computeSpline = (xs, ys, closed) ->
    extend = 12

    if closed
      extendRight = (ns) ->
        (ns[i %% ns.length] for i in [0...extend])

      extendLeft = (ns) ->
        (ns[(ns.length-i) %% ns.length] for i in [extend...0])

      xs = [extendLeft(xs)..., xs..., extendRight(xs)...]
      ys = [extendLeft(ys)..., ys..., extendRight(ys)...]

    cx = Spline.computeControlPoints xs
    cy = Spline.computeControlPoints ys
    startLength = 0

    if closed
      xs = xs[extend..-extend]
      ys = ys[extend..-extend]
      cx.p1 = cx.p1[extend..-extend]
      cy.p1 = cy.p1[extend..-extend]
      cx.p2 = cx.p2[extend..-extend]
      cy.p2 = cy.p2[extend..-extend]

    for [p0x, p0y, p1x, p1y, p2x, p2y, p3x, p3y], i in \
    _zip(xs[...-1], ys[...-1], cx.p1, cy.p1, cx.p2, cy.p2, xs[1..], ys[1..])
      c = new Curve(new Point(p0x, p0y),
                    new Point(p1x, p1y),
                    new Point(p2x, p2y),
                    new Point(p3x, p3y))
      c.startLength = startLength
      c.endLength = startLength + c.length
      c.segmentOffset = i / (xs.length-1)
      c.index = i

      startLength += c.length

      c

  constructor: (knots, closed = false) ->
    return new Spline(knots, closed) unless this instanceof Spline

    @closed = closed
    @curves = Spline.computeSpline(knots.map((p) -> p.x),
                                   knots.map((p) -> p.y),
                                   closed)
    @startLengths = (c.startLength for c in @curves)
    @endLengths = (c.endLength for c in @curves)
    @length = @endLengths[-1..][0]

  @_marshalCurve: (funcName) -> (t) ->
    t = (if t < 0 then 0 else if t > ALMOST_ONE then ALMOST_ONE else t) * @curves.length || 0

    index = Math.trunc t

    @curves[index][funcName](t-index)

  x: @_marshalCurve 'x'

  y: @_marshalCurve 'y'

  point: @_marshalCurve 'point'

  pointAtLength: (z = 0) ->

    findCurveIndex = (lengths, z, start, stop) ->
      mid = start + stop >>> 1
      switch
        when (lengths[mid-1] || 0) <= z <= lengths[mid] then mid
        when z < (lengths[mid-1] || 0) then findCurveIndex(lengths, z, start, mid)
        else findCurveIndex(lengths, z, mid+1, stop)

    i = findCurveIndex(@endLengths,
                       Math.min(z, @endLengths[@endLengths.length-1]),
                       0, @endLengths.length)
    @curves[i].pointAtLength(z - @startLengths[i])

  firstDerivative: @_marshalCurve 'firstDerivative'

  secondDerivative: @_marshalCurve 'secondDerivative'

  curvature: @_marshalCurve 'curvature'

  tangent: @_marshalCurve 'tangent'

  normal: @_marshalCurve 'normal'

  pointTransform: @_marshalCurve 'pointTransform'

  normalize: (segmentLength = @length / segmentCount || 1,
              segmentCount = Math.ceil(@length / segmentLength)) ->
    ps = (@pointAtLength(i * segmentLength) for i in [0...segmentCount])
    Spline(ps, @closed)

interpolateX = (spline) -> spline.x.bind(spline)

interpolateY = (spline) -> spline.y.bind(spline)

interpolateTransform = (spline) -> spline.pointTransform.bind(spline)

this.bezier =
  Point: Point
  Curve: Curve
  Spline: Spline
  interpolateX: interpolateX
  interpolateY: interpolateY
  interpolateTransform: interpolateTransform

