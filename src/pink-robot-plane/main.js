import * as THREE from 'three';
import './style.css';

const canvas = document.querySelector('#scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.18;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#f4aec6');
scene.fog = new THREE.Fog('#f4aec6', 17, 42);

const camera = new THREE.PerspectiveCamera(34, innerWidth / innerHeight, .1, 100);
camera.position.set(11, 6.4, 14.5);
camera.lookAt(1.2, .2, 0);

const hemi = new THREE.HemisphereLight('#fff8fb', '#d6578d', 3.0);
scene.add(hemi);
const sun = new THREE.DirectionalLight('#fff7ee', 5.2);
sun.position.set(-7, 13, 10);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.left = -12;
sun.shadow.camera.right = 12;
sun.shadow.camera.top = 12;
sun.shadow.camera.bottom = -12;
scene.add(sun);
const rim = new THREE.DirectionalLight('#ff5a9a', 2.5);
rim.position.set(10, 2, -9);
scene.add(rim);

const mat = (color, roughness = .55, metalness = .05, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra });
const pink = mat('#ef4f8d', .32, .22);
const hotPink = mat('#ff2879', .28, .3);
const palePink = mat('#ff9fc1', .47, .05);
const darkPink = mat('#5a173b', .32, .4);
const roseMetal = mat('#a82b62', .24, .68);
const cream = mat('#fff5f7', .64, 0);
const glass = new THREE.MeshPhysicalMaterial({ color: '#ffc1d7', roughness: .08, metalness: 0, transmission: .25, transparent: true, opacity: .62 });
const black = mat('#24101d', .45, .3);

function mesh(geometry, material, parent, position, rotation, scale) {
  const m = new THREE.Mesh(geometry, material);
  if (position) m.position.set(...position);
  if (rotation) m.rotation.set(...rotation);
  if (scale) m.scale.set(...scale);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

const plane = new THREE.Group();
plane.position.set(1.65, .25, 0);
plane.rotation.y = -.12;
scene.add(plane);

// Fuselage and nose
mesh(new THREE.CapsuleGeometry(1.15, 3.5, 8, 24), pink, plane, [0, 0, 0], [0, 0, -Math.PI / 2], [1, .68, .72]);
mesh(new THREE.SphereGeometry(.86, 24, 16), hotPink, plane, [2.15, 0, 0], null, [1.15, .72, .72]);
mesh(new THREE.CylinderGeometry(.28, .34, .3, 20), roseMetal, plane, [2.94, 0, 0], [0, 0, -Math.PI / 2]);

// Wings
mesh(new THREE.BoxGeometry(2.4, .15, 7.8), pink, plane, [-.15, -.1, 0], [0, 0, -.05]);
mesh(new THREE.BoxGeometry(1.75, .09, 7.2), palePink, plane, [-.05, .015, 0], [0, 0, -.05]);
mesh(new THREE.BoxGeometry(1.25, .11, 3.65), hotPink, plane, [-2.25, .38, 0]);

// Wing tips
for (const z of [-3.95, 3.95]) mesh(new THREE.SphereGeometry(.2, 16, 10), cream, plane, [-.2, -.06, z], null, [1.5, .55, 1]);

// Tail fin (triangular silhouette)
const finGeo = new THREE.BufferGeometry();
finGeo.setAttribute('position', new THREE.Float32BufferAttribute([
  -2.6, .25, 0, -1.65, .25, 0, -2.45, 2.05, 0,
], 3));
finGeo.computeVertexNormals();
mesh(finGeo, hotPink, plane, null, null, [1, 1, 1]);
mesh(new THREE.SphereGeometry(.16, 14, 10), cream, plane, [-2.45, 2.02, 0]);

// Cockpit rim and windscreen
mesh(new THREE.TorusGeometry(.83, .11, 10, 32, Math.PI), darkPink, plane, [.1, .57, 0], [Math.PI / 2, 0, Math.PI / 2]);
mesh(new THREE.SphereGeometry(.9, 24, 16, 0, Math.PI), glass, plane, [.65, .82, 0], [0, 0, 0], [.62, .85, .86]);
mesh(new THREE.BoxGeometry(.12, .86, .07), roseMetal, plane, [.63, 1.1, 0], [0, 0, -.25]);

// Landing gear
for (const z of [-.63, .63]) {
  mesh(new THREE.CylinderGeometry(.045, .045, .7, 10), darkPink, plane, [-.25, -.65, z], [0, 0, -.28]);
  mesh(new THREE.TorusGeometry(.25, .09, 10, 20), black, plane, [-.43, -1.0, z], [Math.PI / 2, 0, 0]);
  mesh(new THREE.CircleGeometry(.15, 20), palePink, plane, [-.43, -1.0, z], [0, z > 0 ? Math.PI : 0, 0]);
}

// Propeller
const propeller = new THREE.Group();
propeller.position.set(3.14, 0, 0);
plane.add(propeller);
mesh(new THREE.BoxGeometry(.1, 2.9, .27), cream, propeller, [0, 0, 0], [0, 0, .18]);
mesh(new THREE.BoxGeometry(.1, .27, 2.9), cream, propeller, [0, 0, 0], [.18, 0, 0]);
mesh(new THREE.SphereGeometry(.25, 18, 12), hotPink, propeller);

// Robot pilot
const robot = new THREE.Group();
robot.position.set(-.1, .8, 0);
plane.add(robot);
mesh(new THREE.CapsuleGeometry(.48, .65, 6, 16), palePink, robot, [0, .12, 0]);
mesh(new THREE.BoxGeometry(.72, .13, .5), roseMetal, robot, [.02, .32, 0]);
mesh(new THREE.CylinderGeometry(.12, .12, .2, 12), darkPink, robot, [0, .78, 0]);
const head = mesh(new THREE.BoxGeometry(.96, .72, .78, 4, 4, 4), pink, robot, [0, 1.17, 0], [0, 0, -.04]);
mesh(new THREE.BoxGeometry(.74, .29, .08), darkPink, head, [.1, .06, .405]);
const eyeMat = mat('#fff5fb', .2, 0, { emissive: '#ff6eaa', emissiveIntensity: 2 });
for (const x of [-.2, .2]) mesh(new THREE.CircleGeometry(.075, 16), eyeMat, head, [x + .1, .07, .452]);
mesh(new THREE.CylinderGeometry(.055, .055, .4, 8), roseMetal, head, [0, .54, 0]);
mesh(new THREE.SphereGeometry(.11, 12, 8), eyeMat, head, [0, .77, 0]);

// Arms, hands, and control yoke
const leftArm = mesh(new THREE.CapsuleGeometry(.12, .58, 5, 10), pink, robot, [.1, .35, .53], [.55, 0, -.7]);
const rightArm = mesh(new THREE.CapsuleGeometry(.12, .58, 5, 10), pink, robot, [.1, .35, -.53], [-.55, 0, -.7]);
for (const z of [-.43, .43]) mesh(new THREE.SphereGeometry(.15, 14, 10), palePink, robot, [.55, .17, z]);
const yoke = new THREE.Group();
yoke.position.set(.72, .18, 0);
yoke.rotation.y = Math.PI / 2;
robot.add(yoke);
mesh(new THREE.TorusGeometry(.39, .055, 8, 20, Math.PI * 1.45), darkPink, yoke, null, [0, 0, .86]);
mesh(new THREE.CylinderGeometry(.045, .045, .46, 8), darkPink, yoke, [0, -.23, 0]);

// Scarf streaming behind
const scarf = new THREE.Group();
scarf.position.set(-.42, 1.28, -.1);
robot.add(scarf);
for (let i = 0; i < 5; i++) mesh(new THREE.BoxGeometry(.48, .22, .08), cream, scarf, [-.22 - i * .4, Math.sin(i) * .05, 0], [0, 0, -.1 + i * .06]);

// Clouds and things to fly past
const clouds = [];
const flybys = [];
function createCloud(x, y, z, scale = 1) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  group.scale.setScalar(scale);
  group.userData = { speed: .7 + Math.random() * .55, startX: x };
  const cloudMat = mat('#ffe7f0', .9, 0, { transparent: true, opacity: .82 });
  const blobs = [[0,0,0,1], [1.05,.12,0,.72], [-1,.04,.05,.78], [.35,.48,.05,.73], [-.45,.37,0,.65]];
  blobs.forEach(([bx,by,bz,s]) => mesh(new THREE.SphereGeometry(.82, 16, 11), cloudMat, group, [bx,by,bz], null, [1.35,s,s]));
  scene.add(group);
  clouds.push(group);
}
[
  [8,-3.2,-8,2.2], [-8,4.2,-10,1.7], [14,5,-18,2.4], [-14,-3,-13,2.1],
  [2,-6,-16,2.8], [18,.5,-22,2.5], [26,3,-5,1.15], [32,-1,5,1.35],
  [39,6,2,1.7], [47,-4,-3,1.3], [55,2,7,1.55]
].forEach(args => createCloud(...args));

function createBird(x, y, z, scale = 1, phase = 0) {
  const bird = new THREE.Group();
  bird.position.set(x, y, z);
  bird.scale.setScalar(scale);
  bird.userData = { speed: 2.6 + Math.random() * 1.3, phase, kind: 'bird' };
  mesh(new THREE.CapsuleGeometry(.12, .46, 4, 8), darkPink, bird, [0, 0, 0], [0, 0, -Math.PI / 2]);
  mesh(new THREE.SphereGeometry(.17, 10, 7), pink, bird, [.38, .05, 0]);
  mesh(new THREE.ConeGeometry(.09, .28, 8), cream, bird, [.61, .04, 0], [0, 0, -Math.PI / 2]);
  const leftWing = new THREE.Group();
  const rightWing = new THREE.Group();
  leftWing.position.z = .08; rightWing.position.z = -.08;
  bird.add(leftWing, rightWing);
  mesh(new THREE.SphereGeometry(.44, 10, 6), palePink, leftWing, [-.05, .03, .28], null, [1, .12, .85]);
  mesh(new THREE.SphereGeometry(.44, 10, 6), palePink, rightWing, [-.05, .03, -.28], null, [1, .12, .85]);
  bird.userData.wings = [leftWing, rightWing];
  scene.add(bird); flybys.push(bird);
}
[[23,3,-2,.7,0],[31,-1,4,.52,1.5],[43,5,1,.85,3],[52,1,-6,.6,4.2],[63,-3,3,.75,2.3]].forEach(args => createBird(...args));

function createBalloon(x, y, z, scale, color) {
  const balloon = new THREE.Group();
  balloon.position.set(x, y, z); balloon.scale.setScalar(scale);
  balloon.userData = { speed: .48, phase: x, kind: 'balloon' };
  const balloonMat = mat(color, .48, .08);
  mesh(new THREE.SphereGeometry(.72, 18, 14), balloonMat, balloon, [0,.45,0], null, [1,1.35,1]);
  mesh(new THREE.TorusGeometry(.74,.035,6,24), cream, balloon, [0,.45,0], [Math.PI / 2,0,0]);
  mesh(new THREE.BoxGeometry(.46,.3,.42), darkPink, balloon, [0,-.72,0]);
  for (const zLine of [-.24,.24]) mesh(new THREE.CylinderGeometry(.012,.012,.72,5), cream, balloon, [0,-.25,zLine], [0,0,.15 * Math.sign(zLine)]);
  scene.add(balloon); flybys.push(balloon);
}
createBalloon(32, 4.8, -7, 1.05, '#ff5b98');
createBalloon(58, -1.6, 6, .72, '#fff0f5');

function createRing(x, y, z) {
  const ring = new THREE.Group();
  ring.position.set(x,y,z);
  ring.userData = { speed: 2.1, phase: x, kind: 'ring' };
  mesh(new THREE.TorusGeometry(1.25,.1,10,36), cream, ring, null, [0,Math.PI/2,0]);
  for (let i=0;i<8;i++) {
    const a = i / 8 * Math.PI * 2;
    mesh(new THREE.SphereGeometry(.09,8,6), hotPink, ring, [0,Math.cos(a)*1.25,Math.sin(a)*1.25]);
  }
  scene.add(ring); flybys.push(ring);
}
createRing(27, .3, 1); createRing(49, 2.2, -3.5);
// Passing air specks
const speckGeo = new THREE.BufferGeometry();
const positions = [];
for (let i = 0; i < 140; i++) positions.push((Math.random() - .5) * 48, (Math.random() - .5) * 24, (Math.random() - .5) * 34);
speckGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
const specks = new THREE.Points(speckGeo, new THREE.PointsMaterial({ color: '#fff4f8', size: .045, transparent: true, opacity: .7 }));
scene.add(specks);

const pointer = new THREE.Vector2();
const target = new THREE.Vector2();
let dragging = false;
function setPointer(event) {
  target.x = THREE.MathUtils.clamp((event.clientX / innerWidth) * 2 - 1, -.95, .95);
  target.y = THREE.MathUtils.clamp(-(event.clientY / innerHeight) * 2 + 1, -.88, .88);
}
canvas.addEventListener('pointerdown', e => { dragging = true; canvas.setPointerCapture(e.pointerId); setPointer(e); });
canvas.addEventListener('pointermove', e => { if (dragging) setPointer(e); });
canvas.addEventListener('pointerup', () => dragging = false);
canvas.addEventListener('pointerleave', () => dragging = false);

let soundOn = true;
document.querySelector('#sound').addEventListener('click', e => {
  soundOn = !soundOn;
  e.currentTarget.classList.toggle('muted', !soundOn);
});

const clock = new THREE.Clock();
const altitude = document.querySelector('#altitude');
const speed = document.querySelector('#speed');
let hudTick = 0;

function animate() {
  const dt = Math.min(clock.getDelta(), .04);
  const t = clock.elapsedTime;
  if (!dragging) {
    target.x = Math.sin(t * .24) * .12;
    target.y = Math.sin(t * .31) * .1;
  }
  pointer.lerp(target, dragging ? .105 : .025);

  const bob = Math.sin(t * 1.25) * .12;
  plane.position.y = .3 + bob + pointer.y * 2.15;
  plane.position.x = 1.65 + pointer.x * 1.15 + Math.sin(t * .55) * .08;
  plane.position.z = pointer.x * 2.25;
  plane.rotation.z = THREE.MathUtils.lerp(plane.rotation.z, pointer.y * .3 - Math.sin(t * 1.25) * .018, .065);
  plane.rotation.y = THREE.MathUtils.lerp(plane.rotation.y, -.12 - pointer.x * .28, .06);
  plane.rotation.x = THREE.MathUtils.lerp(plane.rotation.x, -pointer.x * .3, .06);

  propeller.rotation.x = t * 30;
  yoke.rotation.z = .86 + pointer.y * .25;
  head.rotation.y = Math.sin(t * .62) * .08 + pointer.x * .1;
  leftArm.rotation.z = -.7 + Math.sin(t * 2.1) * .025;
  rightArm.rotation.z = -.7 - Math.sin(t * 2.1) * .025;
  scarf.children.forEach((piece, i) => {
    piece.position.y = Math.sin(t * 5 - i * .65) * (.045 + i * .012);
    piece.rotation.z = -.1 + Math.sin(t * 4.4 - i * .55) * .08;
  });

  clouds.forEach((cloud, i) => {
    cloud.position.x -= dt * cloud.userData.speed;
    if (cloud.position.x < -22) {
      cloud.position.x = 38 + Math.random() * 22;
      cloud.position.y = (Math.random() - .5) * 12;
      cloud.position.z = (Math.random() - .5) * 18;
    }
    cloud.position.y += Math.sin(t * .2 + i) * dt * .025;
  });
  flybys.forEach((object, i) => {
    object.position.x -= dt * object.userData.speed;
    if (object.position.x < -18) {
      object.position.x = 38 + i * 6 + Math.random() * 12;
      object.position.y = (Math.random() - .5) * 9;
      object.position.z = (Math.random() - .5) * 12;
    }
    if (object.userData.kind === 'bird') {
      const flap = Math.sin(t * 7 + object.userData.phase) * .72;
      object.userData.wings[0].rotation.x = flap;
      object.userData.wings[1].rotation.x = -flap;
      object.position.y += Math.sin(t * 2 + i) * dt * .16;
    } else if (object.userData.kind === 'balloon') {
      object.position.y += Math.sin(t * .65 + object.userData.phase) * dt * .12;
      object.rotation.z = Math.sin(t * .5 + i) * .035;
    } else {
      object.rotation.x = Math.sin(t * .7 + i) * .08;
    }
  });
  specks.rotation.y = t * .012;
  specks.position.x = ((-t * 1.5) % 8);

  camera.position.x = 11 + pointer.x * .55;
  camera.position.y = 6.4 + pointer.y * .6;
  camera.position.z = 14.5 + pointer.x * .45;
  camera.lookAt(1.25 + pointer.x * .35, .35 + pointer.y * .7, pointer.x * 1.25);

  if (++hudTick % 20 === 0) {
    altitude.innerHTML = `${Math.round(2400 + pointer.y * 170 + Math.sin(t) * 18).toLocaleString()} <small>FT</small>`;
    speed.innerHTML = `${Math.round(128 + Math.sin(t * 1.8) * 3)} <small>KT</small>`;
  }
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
});
