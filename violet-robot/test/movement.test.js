import test from 'node:test';
import assert from 'node:assert/strict';
import { forwardFromYaw } from '../src/movement.js';

test('the starting robot faces and walks toward the cottage', () => {
  const forward = forwardFromYaw(Math.PI);
  assert.ok(Math.abs(forward.x) < 1e-10);
  assert.ok(forward.z < -0.999);
});

test('turning left from the starting direction points west', () => {
  const forwardAfterLeftTurn = forwardFromYaw(Math.PI + Math.PI / 2);
  assert.ok(forwardAfterLeftTurn.x < -0.999);
  assert.ok(Math.abs(forwardAfterLeftTurn.z) < 1e-10);
});

test('the follow camera offset stays behind the robot', () => {
  const forward = forwardFromYaw(Math.PI / 3);
  const cameraOffset = forward.clone().multiplyScalar(-10);
  assert.ok(cameraOffset.dot(forward) < 0);
});
