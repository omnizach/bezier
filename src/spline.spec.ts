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

test('length is accurate', t => {
  const s = spline([
    [0, 0],
    [1, 1],
  ])

  t.log(s.length)
  t.true(near(s.length, Math.SQRT2))
})

test('curve is on the knot points', t => {
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
