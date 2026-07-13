import test from 'node:test';
import assert from 'node:assert/strict';
import { BRIDGE_TOP, WATER_NECK_DEPTH, getRobotSurfaceY } from '../src/terrain.js';

test('robot stands on the raised bridge', () => {
  assert.equal(getRobotSurfaceY(0, -63), BRIDGE_TOP);
  assert.ok(getRobotSurfaceY(0, -63) > 0.8);
});

test('robot sinks to neck depth when it enters moat water', () => {
  assert.equal(getRobotSurfaceY(8, -63), WATER_NECK_DEPTH);
  assert.ok(getRobotSurfaceY(8, -63) < -3.3);
});

test('robot remains at ground level away from moat', () => {
  assert.equal(getRobotSurfaceY(8, -40), 0);
});

test('western ramp rises continuously to the castle wall walk', () => {
  assert.equal(getRobotSurfaceY(-28, -118), 0);
  assert.equal(getRobotSurfaceY(-33, -118), 5);
  assert.equal(getRobotSurfaceY(-38, -118), 10);
});

test('robot can walk along the raised shooting gallery', () => {
  assert.equal(getRobotSurfaceY(-40, -135), 10);
});
