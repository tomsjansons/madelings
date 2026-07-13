import * as THREE from 'three';

// The robot model's face points along local +Z. Keeping this in one place
// prevents movement and the follow camera from disagreeing about "forward".
export function forwardFromYaw(yaw, target = new THREE.Vector3()) {
  return target.set(Math.sin(yaw), 0, Math.cos(yaw));
}
