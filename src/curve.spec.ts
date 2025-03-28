import test from 'ava'

import { Curve, curve } from './curve'

const near = (x: number, y: number) => Math.abs(x - y) < 1e-3

test('create curve', t => {
  const c = curve([
    [0, 0],
    [1, 0],
    [2, 0],
    [3, 0],
  ])

  t.true(c instanceof Curve)
})

test('curve points are accurate at end points', t => {
  const c = curve([
    [1, 0],
    [1, 1],
    [1, 1],
    [0, 1],
  ])

  t.is(c.x(0), 1)
  t.is(c.y(0), 0)
  t.deepEqual(c.point(), [1, 0])
  t.deepEqual(c.point(0), [1, 0])
  t.is(c.x(1), 0)
  t.is(c.y(1), 1)
  t.deepEqual(c.point(1), [0, 1])
})

test('curve points are accurate through curve', t => {
  const c = curve([
    [1, 0],
    [1, 1],
    [1, 1],
    [0, 1],
  ])

  for (let e = 0; e < 1; e += 0.1) {
    //t.log(c.x(e), c.y(e), c.x(e) ** 2 + c.y(e) ** 2)
    t.true(c.x(e) >= 0 && c.x(e) <= 1)
    t.true(c.y(e) >= 0 && c.y(e) <= 1)
  }
})

test('curve point and coordinates match', t => {
  const c = curve([
    [0, 0],
    [1, 0.5],
    [1, 1.5],
    [2, 2],
  ])

  for (let e = 0; e < 1; e += 0.1) {
    t.deepEqual(c.point(e), [c.x(e), c.y(e)])
  }
})

test('curve lengthAt is accurate', t => {
  const c = curve([
    [1, 1],
    [1, 1],
    [3, 3],
    [3, 3],
  ])

  for (let e = 0; e < 1; e += 0.5) {
    //t.log(e, c.lengthAt(e), e * Math.SQRT2 * 2)
    t.true(near(c.lengthAt(e), e * Math.SQRT2 * 2))
  }
})

test('curve pointAtLength is accurate', t => {
  const c = curve([
    [1, 1],
    [1, 1],
    [3, 1],
    [3, 1],
  ])

  for (let z = 0; z <= 2; z += 0.5) {
    t.log(z, c.pointAtLength(z), z + 1)
    t.true(near(c.pointAtLength(z)[0], z + 1))
  }
})
