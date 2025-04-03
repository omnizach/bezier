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

  t.log(s.length)
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
