import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import './style.css';

const canvas = document.querySelector('#scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#315d55');
scene.fog = new THREE.FogExp2('#315d55', 0.018);

const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 130);
camera.position.set(22, 16, 26);

const controls = new OrbitControls(camera, canvas);
controls.target.set(1.5, 2.2, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.045;
controls.minDistance = 10;
controls.maxDistance = 48;
controls.maxPolarAngle = Math.PI * 0.47;
controls.autoRotate = false;

const hemi = new THREE.HemisphereLight('#cce3d3', '#18352d', 2.15);
scene.add(hemi);

const sun = new THREE.DirectionalLight('#ffe0a8', 4.2);
sun.position.set(-14, 23, 12);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -30;
sun.shadow.camera.right = 30;
sun.shadow.camera.top = 25;
sun.shadow.camera.bottom = -25;
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 70;
sun.shadow.bias = -0.0008;
scene.add(sun);

const fill = new THREE.DirectionalLight('#8bc7bd', 1.6);
fill.position.set(16, 8, -14);
scene.add(fill);

const palette = {
  grass: new THREE.MeshStandardMaterial({ color: '#386b55', roughness: 1 }),
  grassDark: new THREE.MeshStandardMaterial({ color: '#285746', roughness: 1 }),
  track: new THREE.MeshStandardMaterial({ color: '#b96f4d', roughness: 1 }),
  trackLight: new THREE.MeshStandardMaterial({ color: '#e7ba81', roughness: .95 }),
  cream: new THREE.MeshStandardMaterial({ color: '#eee7d6', roughness: .5, metalness: .42 }),
  dark: new THREE.MeshStandardMaterial({ color: '#142c2c', roughness: .34, metalness: .78 }),
  copper: new THREE.MeshStandardMaterial({ color: '#b95f36', roughness: .39, metalness: .72 }),
  copperLight: new THREE.MeshStandardMaterial({ color: '#e59755', roughness: .35, metalness: .68 }),
  orange: new THREE.MeshStandardMaterial({ color: '#ff623f', roughness: .3, metalness: .35 }),
  yellow: new THREE.MeshStandardMaterial({ color: '#ffb343', roughness: .45, metalness: .25 }),
  rubber: new THREE.MeshStandardMaterial({ color: '#18201f', roughness: .75 }),
  white: new THREE.MeshStandardMaterial({ color: '#fff6db', roughness: .75 }),
  wood: new THREE.MeshStandardMaterial({ color: '#643f32', roughness: .95 }),
};

function shadow(mesh, cast = true, receive = true) {
  mesh.castShadow = cast;
  mesh.receiveShadow = receive;
  return mesh;
}

function mesh(geometry, material, position, rotation, scale) {
  const item = shadow(new THREE.Mesh(geometry, material));
  if (position) item.position.set(...position);
  if (rotation) item.rotation.set(...rotation);
  if (scale) item.scale.set(...scale);
  return item;
}

// Ground and running circuit
const ground = mesh(new THREE.CircleGeometry(70, 96), palette.grass, [0, -0.09, 0], [-Math.PI / 2, 0, 0]);
scene.add(ground);

const trackShape = new THREE.Shape();
trackShape.absellipse(0, 0, 18.3, 11.4, 0, Math.PI * 2, false, 0);
const infield = new THREE.Path();
infield.absellipse(0, 0, 12.2, 5.9, 0, Math.PI * 2, true, 0);
trackShape.holes.push(infield);
const track = mesh(new THREE.ShapeGeometry(trackShape, 96), palette.track, [0, 0, 0], [-Math.PI / 2, 0, 0]);
scene.add(track);

const innerShape = new THREE.Shape();
innerShape.absellipse(0, 0, 11.9, 5.6, 0, Math.PI * 2, false, 0);
const innerField = mesh(new THREE.ShapeGeometry(innerShape, 72), palette.grassDark, [0, .012, 0], [-Math.PI / 2, 0, 0]);
scene.add(innerField);

class EllipsePath extends THREE.Curve {
  constructor(rx, rz, y = 0) { super(); this.rx = rx; this.rz = rz; this.y = y; }
  getPoint(t, target = new THREE.Vector3()) {
    const a = t * Math.PI * 2;
    return target.set(this.rx * Math.cos(a), this.y, this.rz * Math.sin(a));
  }
}

for (const [rx, rz, radius, color, opacity] of [
  [15.2, 8.6, .035, '#f5ddb8', .78],
  [17.55, 10.65, .025, '#f5ddb8', .42],
  [12.75, 6.45, .025, '#f5ddb8', .35],
]) {
  const lineMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity });
  const line = new THREE.Mesh(new THREE.TubeGeometry(new EllipsePath(rx, rz, .045), 160, radius, 5, true), lineMat);
  scene.add(line);
}

// Dashes in the center lane
for (let i = 0; i < 44; i++) {
  if (i % 2) continue;
  const a = (i / 44) * Math.PI * 2;
  const next = a + .02;
  const dash = mesh(new THREE.BoxGeometry(.09, .018, .8), palette.trackLight, [15.2 * Math.cos(a), .055, 8.6 * Math.sin(a)]);
  dash.lookAt(15.2 * Math.cos(next), .055, 8.6 * Math.sin(next));
  scene.add(dash);
}

// Elliptical infield rail
const railMaterial = new THREE.MeshStandardMaterial({ color: '#dfd6be', roughness: .72 });
for (const h of [.45, .9]) {
  const rail = mesh(new THREE.TubeGeometry(new EllipsePath(11.35, 5.05, h), 140, .055, 6, true), railMaterial);
  scene.add(rail);
}
for (let i = 0; i < 44; i++) {
  const a = (i / 44) * Math.PI * 2;
  const post = mesh(new THREE.CylinderGeometry(.065, .08, 1.12, 7), railMaterial, [11.35 * Math.cos(a), .52, 5.05 * Math.sin(a)]);
  scene.add(post);
}

// Graphic infield marker
const marker = new THREE.Group();
marker.position.y = .055;
const markerRing = mesh(new THREE.RingGeometry(2.1, 2.22, 64), palette.trackLight, [0, 0, 0], [-Math.PI / 2, 0, 0]);
const markerLine = mesh(new THREE.BoxGeometry(5.5, .02, .11), palette.trackLight, [0, .01, 0]);
marker.add(markerRing, markerLine);
scene.add(marker);

function addHurdle(angle, accent, name) {
  const hurdle = new THREE.Group();
  const x = 15.2 * Math.cos(angle);
  const z = 8.6 * Math.sin(angle);
  hurdle.position.set(x, 0, z);
  hurdle.lookAt(15.2 * Math.cos(angle + .03), 0, 8.6 * Math.sin(angle + .03));
  const accentMat = accent === 'yellow' ? palette.yellow : accent === 'cream' ? palette.cream : palette.orange;

  for (const side of [-1, 1]) {
    const foot = mesh(new THREE.BoxGeometry(.75, .12, .5), palette.dark, [side * 1.85, .08, 0]);
    const post = mesh(new THREE.BoxGeometry(.15, 1.65, .15), palette.cream, [side * 1.85, .83, 0]);
    const cap = mesh(new THREE.SphereGeometry(.14, 12, 8), accentMat, [side * 1.85, 1.68, 0]);
    hurdle.add(foot, post, cap);
  }
  const topBar = mesh(new THREE.CylinderGeometry(.09, .09, 3.7, 10), accentMat, [0, 1.45, 0], [0, 0, Math.PI / 2]);
  const lowerBar = mesh(new THREE.CylinderGeometry(.065, .065, 3.7, 10), palette.cream, [0, .86, 0], [0, 0, Math.PI / 2]);
  hurdle.add(topBar, lowerBar);

  for (let i = -2; i <= 2; i++) {
    const panel = mesh(new THREE.BoxGeometry(.48, .36, .05), i % 2 ? palette.cream : accentMat, [i * .48, 1.12, .02]);
    hurdle.add(panel);
  }
  hurdle.userData = { angle, name };
  scene.add(hurdle);
  return hurdle;
}

const hurdles = [
  addHurdle(.42, 'orange', 'COPPER RAIL'),
  addHurdle(1.92, 'cream', 'IVORY OXER'),
  addHurdle(3.42, 'yellow', 'SOLAR GATE'),
  addHurdle(5.05, 'orange', 'EMBER DOUBLE'),
];

// Trees and background structures
function makeTree(x, z, scale = 1) {
  const tree = new THREE.Group();
  const trunk = mesh(new THREE.CylinderGeometry(.16 * scale, .24 * scale, 1.7 * scale, 7), palette.wood, [0, .8 * scale, 0]);
  tree.add(trunk);
  const leafMat = new THREE.MeshStandardMaterial({ color: Math.random() > .45 ? '#17483b' : '#245a45', roughness: 1 });
  const crown1 = mesh(new THREE.IcosahedronGeometry(1.05 * scale, 1), leafMat, [0, 2 * scale, 0]);
  const crown2 = mesh(new THREE.IcosahedronGeometry(.75 * scale, 1), leafMat, [.45 * scale, 2.35 * scale, .05]);
  const crown3 = mesh(new THREE.IcosahedronGeometry(.72 * scale, 1), leafMat, [-.5 * scale, 2.25 * scale, .1]);
  tree.add(crown1, crown2, crown3);
  tree.position.set(x, 0, z);
  tree.rotation.y = Math.random() * Math.PI;
  scene.add(tree);
}

const treePositions = [
  [-25, -10, 1.3], [-23, -15, 1], [-17, -17, 1.2], [-10, -18, .85], [20, -15, 1.1], [26, -10, 1.4],
  [25, 12, .9], [21, 16, 1.2], [14, 18, 1], [-15, 18, 1.25], [-22, 14, .9], [-27, 8, 1.15],
];
treePositions.forEach((p) => makeTree(...p));

const grandstand = new THREE.Group();
grandstand.position.set(-2, 0, -19);
const standBase = mesh(new THREE.BoxGeometry(10, 1.3, 2.3), palette.dark, [0, .62, 0]);
const standTier = mesh(new THREE.BoxGeometry(9.5, .28, 2.4), palette.cream, [0, 1.42, -.25], [-.14, 0, 0]);
const standRoof = mesh(new THREE.BoxGeometry(11, .18, 3.5), palette.yellow, [0, 4.35, -.1], [0, 0, 0]);
grandstand.add(standBase, standTier, standRoof);
for (const x of [-4.5, 4.5]) {
  const support = mesh(new THREE.CylinderGeometry(.09, .09, 3.1, 6), palette.cream, [x, 2.9, -.8]);
  grandstand.add(support);
}
for (let i = 0; i < 18; i++) {
  const spectator = mesh(new THREE.SphereGeometry(.11, 8, 6), i % 3 === 0 ? palette.orange : palette.cream, [-4.1 + (i % 9) * 1.02, 1.95 + Math.floor(i / 9) * .5, -.2 - Math.floor(i / 9) * .3]);
  grandstand.add(spectator);
}
scene.add(grandstand);

function makePivotLimb(material, length, radius, endMaterial = material) {
  const pivot = new THREE.Group();
  const segment = mesh(new THREE.CylinderGeometry(radius * .82, radius, length, 9), material, [0, -length / 2, 0]);
  const joint = mesh(new THREE.SphereGeometry(radius * 1.13, 10, 7), endMaterial, [0, 0, 0]);
  pivot.add(segment, joint);
  return pivot;
}

function createHorseAndRider() {
  const runner = new THREE.Group();
  const horse = new THREE.Group();
  runner.add(horse);

  const body = mesh(new THREE.CapsuleGeometry(.7, 1.65, 8, 16), palette.copper, [0, 2.05, 0], [Math.PI / 2, 0, 0], [1.08, 1, 1]);
  const chest = mesh(new THREE.SphereGeometry(.82, 18, 12), palette.copperLight, [0, 2.18, 1.02], [0, 0, 0], [1, 1.05, .8]);
  const rear = mesh(new THREE.SphereGeometry(.78, 18, 12), palette.copper, [0, 2.13, -1.07], [0, 0, 0], [1, 1.03, .85]);
  horse.add(body, chest, rear);

  // Brass body armor and saddle
  const sidePlate = mesh(new THREE.BoxGeometry(1.52, .78, 1.18), palette.copperLight, [0, 2.18, -.05]);
  sidePlate.geometry.translate(0, 0, 0);
  horse.add(sidePlate);
  for (const side of [-1, 1]) {
    const bolt = mesh(new THREE.CylinderGeometry(.1, .1, .06, 12), palette.dark, [side * .79, 2.18, -.05], [0, 0, Math.PI / 2]);
    horse.add(bolt);
  }
  const saddle = mesh(new THREE.BoxGeometry(1.22, .18, 1.08), palette.dark, [0, 2.86, -.2], [0, 0, 0]);
  const saddlePad = mesh(new THREE.BoxGeometry(1.48, .1, 1.45), palette.orange, [0, 2.76, -.16], [0, 0, 0]);
  horse.add(saddle, saddlePad);

  const neck = mesh(new THREE.CapsuleGeometry(.43, 1.15, 7, 14), palette.copper, [0, 3.05, 1.48], [Math.PI * .22, 0, 0]);
  const neckPlate = mesh(new THREE.BoxGeometry(1.02, .48, .75), palette.copperLight, [0, 3.05, 1.45], [Math.PI * .22, 0, 0]);
  const head = mesh(new THREE.CapsuleGeometry(.42, .72, 7, 14), palette.copperLight, [0, 3.75, 2.05], [Math.PI / 2, 0, 0], [1, 1, .9]);
  const muzzle = mesh(new THREE.BoxGeometry(.76, .48, .75), palette.dark, [0, 3.56, 2.72]);
  horse.add(neck, neckPlate, head, muzzle);

  for (const side of [-1, 1]) {
    const ear = mesh(new THREE.ConeGeometry(.18, .62, 7), palette.copper, [side * .28, 4.25, 1.87], [0, 0, side * -.11]);
    const eye = mesh(new THREE.SphereGeometry(.085, 10, 7), palette.yellow, [side * .4, 3.92, 2.31]);
    eye.material = new THREE.MeshStandardMaterial({ color: '#ffb343', emissive: '#ff6a2b', emissiveIntensity: 2.1, metalness: .25 });
    horse.add(ear, eye);
  }
  const bridle = mesh(new THREE.TorusGeometry(.46, .035, 6, 18), palette.orange, [0, 3.72, 2.43], [Math.PI / 2, 0, 0]);
  horse.add(bridle);

  const legs = [];
  const legData = [
    [-.48, 1.72, .9, 0], [.48, 1.72, .9, 1], [-.48, 1.72, -.92, 2], [.48, 1.72, -.92, 3],
  ];
  legData.forEach(([x, y, z, phase]) => {
    const upper = makePivotLimb(palette.copper, .9, .18, palette.dark);
    upper.position.set(x, y, z);
    const lower = makePivotLimb(palette.copperLight, .78, .145, palette.dark);
    lower.position.y = -.84;
    const hoof = mesh(new THREE.BoxGeometry(.35, .22, .48), palette.rubber, [0, -.8, .11]);
    lower.add(hoof);
    upper.add(lower);
    horse.add(upper);
    legs.push({ upper, lower, phase });
  });

  const tailPivot = new THREE.Group();
  tailPivot.position.set(0, 2.52, -1.72);
  tailPivot.rotation.x = -.55;
  const tail1 = makePivotLimb(palette.dark, .95, .12);
  const tail2 = makePivotLimb(palette.dark, .72, .1);
  tail2.position.y = -.9;
  tail1.add(tail2);
  tailPivot.add(tail1);
  horse.add(tailPivot);

  // Robot jockey
  const robot = new THREE.Group();
  const pelvis = mesh(new THREE.BoxGeometry(.78, .42, .63), palette.dark, [0, 3.16, -.08]);
  const waist = mesh(new THREE.CylinderGeometry(.25, .3, .35, 10), palette.orange, [0, 3.53, -.02]);
  const torso = mesh(new THREE.BoxGeometry(1.02, 1.12, .62), palette.cream, [0, 4.18, .05]);
  torso.geometry.translate(0, 0, 0);
  const chestPanel = mesh(new THREE.BoxGeometry(.6, .34, .08), palette.orange, [0, 4.25, .39]);
  const core = mesh(new THREE.CircleGeometry(.105, 16), new THREE.MeshStandardMaterial({ color: '#ffe1a3', emissive: '#ff693e', emissiveIntensity: 2 }), [0, 4.25, .435]);
  robot.add(pelvis, waist, torso, chestPanel, core);

  const neckJoint = mesh(new THREE.CylinderGeometry(.17, .17, .25, 9), palette.dark, [0, 4.87, .03]);
  const robotHead = mesh(new THREE.BoxGeometry(.82, .7, .7), palette.cream, [0, 5.28, .1]);
  const face = mesh(new THREE.BoxGeometry(.6, .29, .08), palette.dark, [0, 5.3, .48]);
  robot.add(neckJoint, robotHead, face);
  for (const side of [-1, 1]) {
    const robotEye = mesh(new THREE.BoxGeometry(.17, .055, .04), palette.yellow, [side * .18, 5.31, .53]);
    robotEye.material = new THREE.MeshStandardMaterial({ color: '#ffc14a', emissive: '#ff7b34', emissiveIntensity: 2.4 });
    const antenna = mesh(new THREE.CylinderGeometry(.025, .025, .48, 6), palette.dark, [side * .23, 5.84, .04], [0, 0, side * .16]);
    const antennaTip = mesh(new THREE.SphereGeometry(.07, 8, 6), palette.orange, [side * .27, 6.07, .04]);
    robot.add(robotEye, antenna, antennaTip);
  }

  const arms = [];
  for (const side of [-1, 1]) {
    const shoulder = makePivotLimb(palette.cream, .7, .16, palette.orange);
    shoulder.position.set(side * .62, 4.57, .08);
    shoulder.rotation.z = side * -.28;
    shoulder.rotation.x = -1.05;
    const forearm = makePivotLimb(palette.dark, .68, .125, palette.orange);
    forearm.position.y = -.64;
    forearm.rotation.x = -1.05;
    shoulder.add(forearm);
    robot.add(shoulder);
    arms.push({ shoulder, forearm, side });

    const thigh = makePivotLimb(palette.cream, .82, .18, palette.orange);
    thigh.position.set(side * .36, 3.25, -.08);
    thigh.rotation.z = side * -.53;
    thigh.rotation.x = -.48;
    const shin = makePivotLimb(palette.dark, .78, .14, palette.orange);
    shin.position.y = -.76;
    shin.rotation.x = 1.02;
    thigh.add(shin);
    robot.add(thigh);
  }

  // reins
  const reinMat = new THREE.LineBasicMaterial({ color: '#f26a45', transparent: true, opacity: .85 });
  for (const side of [-1, 1]) {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * .47, 4.0, .56),
      new THREE.Vector3(side * .56, 3.65, 1.3),
      new THREE.Vector3(side * .35, 3.72, 2.45),
    ]);
    horse.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 18, .022, 5, false), reinMat));
  }

  horse.add(robot);
  runner.scale.setScalar(.82);
  runner.userData = { horse, body, legs, tailPivot, tail2, robot, torso, head: robotHead, arms };
  return runner;
}

const runner = createHorseAndRider();
scene.add(runner);

// Soft dust puffs trail the hooves.
const dustMaterial = new THREE.MeshBasicMaterial({ color: '#e9bd88', transparent: true, opacity: .2, depthWrite: false });
const dust = [];
for (let i = 0; i < 22; i++) {
  const puff = new THREE.Mesh(new THREE.SphereGeometry(.14, 7, 5), dustMaterial.clone());
  puff.visible = false;
  scene.add(puff);
  dust.push({ mesh: puff, life: 0, velocity: new THREE.Vector3() });
}
let dustCursor = 0;

function emitDust(position, tangent) {
  const particle = dust[dustCursor++ % dust.length];
  particle.life = 1;
  particle.mesh.visible = true;
  particle.mesh.position.copy(position).add(new THREE.Vector3((Math.random() - .5) * .7, .18, (Math.random() - .5) * .7));
  particle.mesh.scale.setScalar(.45 + Math.random() * .6);
  particle.mesh.material.opacity = .23;
  particle.velocity.set(-tangent.x * .35 + (Math.random() - .5) * .2, .22, -tangent.z * .35 + (Math.random() - .5) * .2);
}

const gateNumber = document.querySelector('#gate-number');
const gateName = document.querySelector('#gate-name');
const gateProgress = document.querySelector('#gate-progress');
const speedEl = document.querySelector('#speed');
const strideEl = document.querySelector('#stride');
const balanceEl = document.querySelector('#balance');
const courseToggle = document.querySelector('#course-toggle');
const cameraButton = document.querySelector('#camera-mode');

let running = true;
let followCamera = false;
let angle = 3.92;
let elapsed = 0;
let dustTimer = 0;
let currentGate = -1;
const clock = new THREE.Clock();
const runnerPos = new THREE.Vector3();
const nextPos = new THREE.Vector3();
const tangent = new THREE.Vector3();
const desiredCamera = new THREE.Vector3();
const desiredTarget = new THREE.Vector3();

function wrapAngle(value) {
  return ((value + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
}

function nextHurdleInfo(currentAngle) {
  let bestIndex = 0;
  let smallest = Infinity;
  hurdles.forEach((hurdle, index) => {
    const delta = (hurdle.userData.angle - currentAngle + Math.PI * 2) % (Math.PI * 2);
    if (delta < smallest) { smallest = delta; bestIndex = index; }
  });
  return { index: bestIndex, delta: smallest, hurdle: hurdles[bestIndex] };
}

function updateRunner(dt) {
  if (running) {
    elapsed += dt;
    angle = (angle + dt * .31) % (Math.PI * 2);
  }

  const jumpWindow = .19;
  let jump = 0;
  let nearestJumpDelta = 10;
  hurdles.forEach((hurdle) => {
    const diff = wrapAngle(angle - hurdle.userData.angle);
    if (Math.abs(diff) < jumpWindow && Math.abs(diff) < Math.abs(nearestJumpDelta)) nearestJumpDelta = diff;
  });
  if (Math.abs(nearestJumpDelta) < jumpWindow) {
    const jumpPhase = (nearestJumpDelta + jumpWindow) / (jumpWindow * 2);
    jump = Math.sin(jumpPhase * Math.PI);
  }

  runnerPos.set(15.2 * Math.cos(angle), .06 + jump * 2.0, 8.6 * Math.sin(angle));
  nextPos.set(15.2 * Math.cos(angle + .015), runnerPos.y, 8.6 * Math.sin(angle + .015));
  tangent.copy(nextPos).sub(runnerPos).setY(0).normalize();
  runner.position.copy(runnerPos);
  runner.lookAt(nextPos);

  const stride = elapsed * 9.2;
  const { horse, body, legs, tailPivot, tail2, robot, torso, head, arms } = runner.userData;
  horse.position.y = jump ? Math.sin(jump * Math.PI) * .06 : Math.abs(Math.sin(stride * 2)) * .055;
  horse.rotation.x = jump ? -.18 + nearestJumpDelta / jumpWindow * .23 : Math.sin(stride) * .025;
  body.rotation.z = Math.sin(stride * 2) * .018;

  legs.forEach(({ upper, lower, phase }, index) => {
    if (jump > .08) {
      upper.rotation.x = THREE.MathUtils.lerp(upper.rotation.x, index < 2 ? -.62 : .55, .14);
      lower.rotation.x = THREE.MathUtils.lerp(lower.rotation.x, index < 2 ? 1.0 : -.75, .14);
    } else {
      const gait = Math.sin(stride + phase * Math.PI);
      upper.rotation.x = gait * .72;
      lower.rotation.x = Math.max(0, -gait) * .95 - .18;
    }
  });

  tailPivot.rotation.z = Math.sin(elapsed * 4.5) * .3;
  tail2.rotation.x = -.25 + Math.sin(elapsed * 5.2) * .18;
  robot.rotation.x = jump * .2 - .04;
  robot.position.y = Math.abs(Math.sin(stride * 2)) * .025;
  torso.rotation.z = Math.sin(stride) * .018;
  head.rotation.y = Math.sin(elapsed * .8) * .06;
  arms.forEach(({ shoulder, forearm, side }) => {
    shoulder.rotation.z = side * (-.28 - jump * .16);
    shoulder.rotation.x = -1.05 - jump * .15;
    forearm.rotation.x = -1.05 + jump * .3;
  });

  dustTimer -= dt;
  if (running && jump < .05 && dustTimer <= 0) {
    emitDust(runnerPos, tangent);
    dustTimer = .09;
  }
  dust.forEach((particle) => {
    if (particle.life <= 0) return;
    particle.life -= dt * 1.15;
    particle.mesh.position.addScaledVector(particle.velocity, dt);
    particle.mesh.scale.multiplyScalar(1 + dt * 1.4);
    particle.mesh.material.opacity = Math.max(0, particle.life * .18);
    if (particle.life <= 0) particle.mesh.visible = false;
  });

  const info = nextHurdleInfo(angle);
  if (info.index !== currentGate) {
    currentGate = info.index;
    gateNumber.textContent = String(info.index + 1).padStart(2, '0');
    gateName.textContent = info.hurdle.userData.name;
  }
  gateProgress.style.width = `${THREE.MathUtils.clamp(100 - info.delta / 1.5 * 100, 7, 100)}%`;
  speedEl.textContent = String(Math.round(42 + Math.sin(elapsed * 2.2) * 3 - jump * 5));
  strideEl.textContent = `${Math.round(94 + Math.sin(elapsed * 1.6) * 3)}%`;
  balanceEl.textContent = (99.4 - jump * .7 + Math.sin(elapsed) * .15).toFixed(1);
}

function updateCamera(dt) {
  if (followCamera) {
    desiredCamera.copy(runnerPos).addScaledVector(tangent, -7.8).add(new THREE.Vector3(0, 4.7, 0));
    desiredTarget.copy(runnerPos).addScaledVector(tangent, 3).add(new THREE.Vector3(0, 2.3, 0));
    const damping = 1 - Math.exp(-dt * 2.8);
    camera.position.lerp(desiredCamera, damping);
    controls.target.lerp(desiredTarget, damping);
  }
  controls.update();
}

courseToggle.addEventListener('click', () => {
  running = !running;
  courseToggle.classList.toggle('paused', !running);
  courseToggle.querySelector('span').textContent = running ? 'PAUSE RUN' : 'RESUME RUN';
});

cameraButton.addEventListener('click', () => {
  followCamera = !followCamera;
  controls.enabled = !followCamera;
  cameraButton.childNodes[0].nodeValue = followCamera ? 'RIDER CAM ' : 'TRACK VIEW ';
  if (!followCamera) {
    camera.position.set(22, 16, 26);
    controls.target.set(1.5, 2.2, 0);
    controls.enabled = true;
  }
});

window.addEventListener('keydown', (event) => {
  if (event.code === 'Space') {
    event.preventDefault();
    courseToggle.click();
  }
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) clock.stop(); else clock.start();
});

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), .05);
  updateRunner(dt);
  updateCamera(dt);
  marker.rotation.y = elapsed * .03;
  renderer.render(scene, camera);
}

animate();
