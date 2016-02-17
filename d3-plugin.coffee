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
        .style('fill', 'none') #color)
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
