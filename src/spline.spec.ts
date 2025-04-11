import test from 'ava'

import { Spline, spline } from './spline'

const near = (x: number, y: number) => Math.abs(x - y) < 1e-4

test('create spline', t => {
  const s = spline([
    [0, 0],
    [1, 0],
    [2, 0],
    [3, 0],
  ])

  t.true(s instanceof Spline)
})

test('endT matches number of curves (one less than points provided)', t => {
  const s = spline([
    [0, 0],
    [1, 0],
    [2, 0],
  ])

  t.true(near(s.endT, 2))
})

test('spline length is accurate', t => {
  const s = spline([
    [0, 0],
    [1, 1],
  ])

  t.true(near(s.length, Math.SQRT2))
})

test('spline is on the knot points', t => {
  const s = spline([
    [0, 0],
    [1, 1],
    [2, 0],
    [3, 1],
  ])

  t.true(near(s.x(0), 0))
  t.true(near(s.y(0), 0))
  t.true(near(s.x(1), 1))
  t.true(near(s.y(1), 1))
  t.true(near(s.x(2), 2))
  t.true(near(s.y(2), 0))
  t.true(near(s.x(3), 3))
  t.true(near(s.y(3), 1))
})

test('spline points are accurate at end points', t => {
  const c = spline([
    [1, 0],
    [1, 1],
    [2, 0],
    [3, 1],
  ])

  t.is(c.x(0), 1)
  t.is(c.y(0), 0)
  t.is(c.x(), 1)
  t.is(c.y(), 0)
  t.deepEqual(c.point(), [1, 0])
  t.deepEqual(c.point(0), [1, 0])
  t.is(c.x(1), 1)
  t.is(c.y(1), 1)
  t.deepEqual(c.point(1), [1, 1])
  t.is(c.x(2), 2)
  t.is(c.y(2), 0)
  t.deepEqual(c.point(2), [2, 0])
  t.true(near(c.x(3), 3))
  t.true(near(c.y(3), 1))
  c.point(3).map((d, i) => t.true(near(d, [3, 1][i])))
})

test('spline point and coordinates match', t => {
  const c = spline([
    [0, 0],
    [1, 0.5],
    [1, 1.5],
    [2, 2],
  ])

  for (let e = 0; e < 4; e += 0.1) {
    t.deepEqual(c.point(e), [c.x(e), c.y(e)])
  }
})

test('curve lengthAt is accurate', t => {
  const c = spline([
    [1, 1],
    [2, 2],
    [3, 3],
    [4, 4],
  ])

  for (let e = 0; e < 1; e += 0.5) {
    t.true(near(c.lengthAt(e), e * Math.SQRT2))
  }

  t.true(near(c.length, c.lengthAt()))
  t.true(near(c.length, Math.SQRT2 * 3))

  t.is(c.lengthAt(-1), c.lengthAt(0))
  t.is(c.lengthAt(4), c.lengthAt(3))
})

test('spline firstDerivative', t => {
  const c = spline([
    [1, 0],
    [0, 1],
    [-1, 0],
  ])

  t.deepEqual(c.firstDerivative(0), [-1, 1.5])
  t.deepEqual(c.firstDerivative(), [-1, 1.5])
  t.deepEqual(c.firstDerivative(1), [-1, 0])
})

test('spline secondDerivative', t => {
  const c = spline([
    [1, 0],
    [0, 1],
    [-1, 0],
  ])

  t.deepEqual(c.secondDerivative(0), [0, 0])
  t.deepEqual(c.secondDerivative(), [0, 0])
  t.deepEqual(c.secondDerivative(1), [0, -3])
})

test('spline curvature', t => {
  const c = spline([
    [1, 0],
    [0, 1],
    [-1, 0],
  ])

  t.deepEqual(c.curvature(0), -0)
  t.deepEqual(c.curvature(), -0)
  t.deepEqual(c.curvature(1), 3)
})

test('spline tangent', t => {
  const c = spline([
    [0, -1],
    [1, 0],
    [0, 1],
    [-1, 0],
  ])

  t.deepEqual(c.tangent(0), [0.8705628387201343, 0.49205725666790195])
  t.deepEqual(c.tangent(), [0.8705628387201343, 0.49205725666790195])
  t.deepEqual(c.tangent(1), [-0.05255883312276375, 0.9986178293325098])
})

test('spline normal', t => {
  const c = spline([
    [0, -1],
    [1, 0],
    [0, 1],
    [-1, 0],
  ])

  t.deepEqual(c.normal(0), [-0.49205725666790195, 0.8705628387201343])
  t.deepEqual(c.normal(), [-0.49205725666790195, 0.8705628387201343])
  t.deepEqual(c.normal(1), [-0.9986178293325098, -0.05255883312276375])
})

test('spline stroke', t => {
  const c = spline([
    [0, -1],
    [1, 0],
    [0, 1],
    [-1, 0],
  ])

  t.deepEqual(
    c.stroke(),
    `M0,-1C0.5111111111111111,-0.7111111111111111 1.0222222222222221,-0.4222222222222222 1,0 M1,0C0.9777777777777777,0.4222222222222222 0.4222222222222222,0.9777777777777779 0,1 M0,1C-0.4222222222222222,1.0222222222222221 -0.7111111111111111,0.5111111111111111 -1,0`,
  )
})

test('spline fill', t => {
  const c = spline([
    [0, -1],
    [1, 0],
    [0, 1],
    [-1, 0],
  ])

  t.deepEqual(
    c.fill(2),
    `M0.49205725666790195,-1.8705628387201343L-0.49205725666790195,-0.1294371612798657L0.02360439288971239,-0.4747810553449857L2.020840051554732,-0.36966338909945873Z M1.9986178293325096,0.05255883312276375L0.0013821706674902456,-0.05255883312276375L0.36966338909945873,-0.020840051554731898L0.4747810553449857,1.9763956071102875Z M0.052558833122763486,1.9986178293325096L-0.052558833122763486,0.0013821706674902456L0.15945172760902315,0.019053854443209117L-1.5816739498312455,1.003168367779013Z`,
  )
})

test('spline pointTransform', t => {
  const c = spline([
    [0, -1],
    [1, 0],
    [0, 1],
    [-1, 0],
  ])

  t.deepEqual(c.pointTransform(0), 'translate(0,-1) rotate(29.47588900324574)')
  t.deepEqual(c.pointTransform(), 'translate(0,-1) rotate(29.47588900324574)')
  t.deepEqual(c.pointTransform(1), 'translate(1,0) rotate(93.01278750418335)')
})

test('spline toString', t => {
  const c = spline([
    [0, -1],
    [1, 0],
    [0, 1],
    [-1, 0],
  ])

  t.deepEqual(
    c.toString(),
    `[[0, -1], [0.5111111111111111, -0.7111111111111111], [1.0222222222222221, -0.4222222222222222], [1, 0]] [[1, 0], [0.9777777777777777, 0.4222222222222222], [0.4222222222222222, 0.9777777777777779], [0, 1]] [[0, 1], [-0.4222222222222222, 1.0222222222222221], [-0.7111111111111111, 0.5111111111111111], [-1, 0]]`,
  )
})

test('spline pointAtLength', t => {
  const c = spline([
    [0, -1],
    [1, 0],
    [0, 1],
    [-1, 0],
  ])

  t.deepEqual(c.pointAtLength(0), [0, -1])
  t.deepEqual(c.pointAtLength(), c.pointAtLength(0))
  t.deepEqual(c.pointAtLength(-1), c.pointAtLength(0))
  t.deepEqual(c.pointAtLength(2), [0.8043456684694749, 0.47048782508258996])
  t.deepEqual(c.pointAtLength(c.length), c.pointAtLength(c.length + 1))
})

test('spline normalize', t => {
  const c = spline([
      [1, 1],
      [4, 5],
      [7, 9],
      [7.1, 9.1],
    ]),
    n = c.normalize()

  t.deepEqual(n.x(), 1)
  t.deepEqual(Math.round(n.endT), 11)
  t.deepEqual(Math.round(n.x(n.endT) * 10), 7.1 * 10)
  t.deepEqual(n.y(), 1)
})
