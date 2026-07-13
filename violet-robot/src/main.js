import * as THREE from 'three';
import './style.css';
import { forwardFromYaw } from './movement.js';

const canvas = document.querySelector('#scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xd58aa6);
scene.fog = new THREE.FogExp2(0xc97898, 0.015);
const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.1, 180);

const hemi = new THREE.HemisphereLight(0xffd8e8, 0x54253b, 2.2);
scene.add(hemi);
const moon = new THREE.DirectionalLight(0xffedf5, 2.8);
moon.position.set(-18, 30, 18);
moon.castShadow = true;
moon.shadow.mapSize.set(2048, 2048);
moon.shadow.camera.left = -35; moon.shadow.camera.right = 35;
moon.shadow.camera.top = 35; moon.shadow.camera.bottom = -35;
scene.add(moon);

const mat = (color, roughness = .75, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
const violet = mat(0xe84f91, .3, .55);
const violetDark = mat(0x672044, .42, .45);
const violetLight = mat(0xff9fc6, .35, .25);
const jointMat = mat(0x3a1729, .28, .75);
const glowMat = new THREE.MeshStandardMaterial({ color: 0xffd4e6, emissive: 0xff4f9a, emissiveIntensity: 3 });

const ground = new THREE.Mesh(new THREE.PlaneGeometry(220, 220), mat(0x6f3450, .98));
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// A soft, winding woodland path.
const pathCurve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0, -2.0, 42), new THREE.Vector3(-2, -2.0, 25),
  new THREE.Vector3(2.5, -2.0, 8), new THREE.Vector3(-2.5, -2.0, -10),
  new THREE.Vector3(1.8, -2.0, -28), new THREE.Vector3(0, -2.0, -44)
]);
const path = new THREE.Mesh(new THREE.TubeGeometry(pathCurve, 90, 2.25, 12, false), mat(0xc47b98, 1));
path.receiveShadow = true;
scene.add(path);

// Deterministic natural scatter keeps the composition stable.
let seed = 14721;
const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const treeGroup = new THREE.Group();
const trunkMat = mat(0x6b3049, 1);
const leafMats = [mat(0x7d3155, .95), mat(0xa3446b, .95), mat(0x63304c, .95)];
function addTree(x, z, scale = 1) {
  const tree = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.42, .62, 5.5, 7), trunkMat);
  trunk.position.y = 2.7; trunk.castShadow = true;
  tree.add(trunk);
  const crown = new THREE.Mesh(new THREE.ConeGeometry(2.55, 5.8, 9), leafMats[Math.floor(random() * leafMats.length)]);
  crown.position.y = 6.4; crown.castShadow = true;
  const crown2 = new THREE.Mesh(new THREE.ConeGeometry(2.05, 4.5, 9), crown.material);
  crown2.position.y = 9; crown2.castShadow = true;
  tree.add(crown, crown2);
  tree.position.set(x, 0, z); tree.scale.setScalar(scale);
  tree.rotation.y = random() * Math.PI;
  treeGroup.add(tree);
}
for (let z = -60; z < 52; z += 7) {
  for (const side of [-1, 1]) {
    const x = side * (7 + random() * 11);
    addTree(x, z + (random() - .5) * 5, .75 + random() * .55);
    if (random() > .45) addTree(x + side * (5 + random() * 5), z + (random() - .5) * 7, .65 + random() * .5);
  }
}
scene.add(treeGroup);

// Small stones and pink woodland flowers.
const stoneMat = mat(0x9c6079, 1);
for (let i = 0; i < 58; i++) {
  const side = random() > .5 ? 1 : -1;
  const x = side * (3.4 + random() * 14), z = -56 + random() * 108;
  if (random() > .42) {
    const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(.16 + random() * .34, 0), stoneMat);
    stone.scale.y = .55; stone.position.set(x, .12, z); stone.rotation.set(random(), random(), random()); stone.castShadow = true;
    scene.add(stone);
  } else {
    const flower = new THREE.Group();
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(.018, .025, .42, 5), mat(0x88405d)); stem.position.y = .2;
    const bloom = new THREE.Mesh(new THREE.IcosahedronGeometry(.12, 0), glowMat); bloom.position.y = .46;
    flower.add(stem, bloom); flower.position.set(x, 0, z); scene.add(flower);
  }
}

// Lanterns make the final stretch feel warm and inhabited.
function addLantern(x, z) {
  const group = new THREE.Group();
  const post = new THREE.Mesh(new THREE.CylinderGeometry(.07, .09, 2.7, 8), jointMat); post.position.y = 1.35;
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(.3, .24, .12, 6), violetDark); cap.position.y = 2.75;
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(.16, 12, 8), glowMat); lamp.position.y = 2.55;
  group.add(post, cap, lamp); group.position.set(x, 0, z); scene.add(group);
  const light = new THREE.PointLight(0xff8abd, 2.8, 8, 2); light.position.set(x, 2.55, z); scene.add(light);
}
[[-4,-8],[4,-20],[-3.8,-32],[3.5,-41]].forEach(([x,z]) => addLantern(x,z));

// The pink cottage has a real doorway and a furnished interior.
const HOUSE_SCALE = 1.45;
const HOUSE_FRONT = -45.5;
const HOUSE_BACK = HOUSE_FRONT - 7 * HOUSE_SCALE;
const HOUSE_HALF_WIDTH = 4.5 * HOUSE_SCALE;
const HOUSE_CENTER_Z = (HOUSE_FRONT + HOUSE_BACK) / 2;
const house = new THREE.Group();
const wallMat = mat(0xb94a79, .82);
const addWall = (geometry, x, y, z) => {
  const piece = new THREE.Mesh(geometry, wallMat);
  piece.position.set(x, y, z); piece.castShadow = piece.receiveShadow = true;
  house.add(piece);
  return piece;
};
addWall(new THREE.BoxGeometry(9, 6.3, .3), 0, 3.15, -3.5);
addWall(new THREE.BoxGeometry(.3, 6.3, 7), -4.5, 3.15, 0);
addWall(new THREE.BoxGeometry(.3, 6.3, 7), 4.5, 3.15, 0);
addWall(new THREE.BoxGeometry(3.45, 6.3, .3), -2.78, 3.15, 3.5);
addWall(new THREE.BoxGeometry(3.45, 6.3, .3), 2.78, 3.15, 3.5);
addWall(new THREE.BoxGeometry(2.1, 2.8, .3), 0, 4.9, 3.5);
const cottageFloor = new THREE.Mesh(new THREE.BoxGeometry(8.7, .22, 6.7), mat(0x8d4664, .9));
cottageFloor.position.y = .08; cottageFloor.receiveShadow = true; house.add(cottageFloor);
const roof = new THREE.Mesh(new THREE.ConeGeometry(7, 4, 4), mat(0x74244f, .65)); roof.position.y = 7.4; roof.rotation.y = Math.PI / 4; roof.castShadow = true;
const doorPivot = new THREE.Group(); doorPivot.position.set(-1.05, 0, 3.68);
const door = new THREE.Mesh(new THREE.BoxGeometry(2.1, 3.5, .22), mat(0x541d3d, .65)); door.position.set(1.05, 1.75, 0); door.castShadow = true;
const knob = new THREE.Mesh(new THREE.SphereGeometry(.09, 8, 6), glowMat); knob.position.set(1.73, 1.8, .16);
doorPivot.add(door, knob); house.add(doorPivot);
const windowMat = new THREE.MeshStandardMaterial({ color: 0xffd8e8, emissive: 0xff5ba3, emissiveIntensity: 2.2, roughness: .3 });
for (const x of [-3, 3]) {
  const frame = new THREE.Mesh(new THREE.BoxGeometry(1.65, 1.65, .2), violetDark); frame.position.set(x, 3.2, 3.67);
  const glass = new THREE.Mesh(new THREE.BoxGeometry(1.32, 1.32, .23), windowMat); glass.position.set(x, 3.2, 3.8);
  house.add(frame, glass);
}
const chimney = new THREE.Mesh(new THREE.BoxGeometry(1.1, 3, 1.1), mat(0x813154)); chimney.position.set(2.5, 8.25, -1); chimney.castShadow = true;

const bed = new THREE.Group();
const bedFrame = new THREE.Mesh(new THREE.BoxGeometry(2.8, .38, 4.5), mat(0x6d2849, .7)); bedFrame.position.y = .48;
const mattress = new THREE.Mesh(new THREE.BoxGeometry(2.5, .45, 4.05), mat(0xffc1d9, .9)); mattress.position.y = .82; mattress.castShadow = true;
const blanket = new THREE.Mesh(new THREE.BoxGeometry(2.54, .12, 2.25), mat(0xd94d88, .86)); blanket.position.set(0, 1.09, .78);
const pillow = new THREE.Mesh(new THREE.BoxGeometry(1.65, .28, .72), mat(0xffe0ec, .95)); pillow.position.set(0, 1.15, -1.35);
const headboard = new THREE.Mesh(new THREE.BoxGeometry(2.9, 2.0, .28), violetDark); headboard.position.set(0, 1.15, -2.18);
bed.add(bedFrame, mattress, blanket, pillow, headboard); bed.position.set(2.35, 0, -.2); bed.scale.setScalar(.85); house.add(bed);
const rug = new THREE.Mesh(new THREE.CircleGeometry(1.45, 24), mat(0xe870a3, 1)); rug.rotation.x = -Math.PI / 2; rug.position.set(-1.7, .21, -.4); house.add(rug);
const bedsideLamp = new THREE.PointLight(0xff91bd, 4.5, 11, 2); bedsideLamp.position.set(3.3, 2.3, -2.5); house.add(bedsideLamp);
house.add(roof, chimney);
house.scale.setScalar(HOUSE_SCALE);
house.position.set(0, 0, HOUSE_CENTER_Z);
scene.add(house);
const porchLight = new THREE.PointLight(0xffa6ce, 9, 20, 2); porchLight.position.set(0, 5.2, HOUSE_FRONT + .8); scene.add(porchLight);

// A second destination: a flyable pink helicopter across the road.
const HELIPAD = new THREE.Vector3(-10.5, 0, 30);
for (const tree of treeGroup.children) {
  if (Math.hypot(tree.position.x - HELIPAD.x, tree.position.z - HELIPAD.z) < 6.8) tree.visible = false;
}
const pad = new THREE.Mesh(new THREE.CircleGeometry(4.1, 40), mat(0x8f4564, 1));
pad.rotation.x = -Math.PI / 2; pad.position.copy(HELIPAD).setY(.025); pad.receiveShadow = true; scene.add(pad);
const padRing = new THREE.Mesh(new THREE.RingGeometry(3.25, 3.55, 40), mat(0xff9fc5, .7));
padRing.rotation.x = -Math.PI / 2; padRing.position.copy(HELIPAD).setY(.045); scene.add(padRing);

const helicopter = new THREE.Group();
const helicopterShell = mat(0xe94f91, .28, .55);
const helicopterTrim = mat(0x7a214b, .35, .55);
const glassMat = new THREE.MeshStandardMaterial({ color: 0xffbed8, roughness: .15, metalness: .2, transparent: true, opacity: .72 });
const cabin = new THREE.Mesh(new THREE.SphereGeometry(1.35, 24, 16), helicopterShell); cabin.scale.set(1.15, .85, 1.45); cabin.position.y = 1.2; cabin.castShadow = true;
const cockpit = new THREE.Mesh(new THREE.SphereGeometry(1.12, 20, 14), glassMat); cockpit.scale.set(.94, .7, .78); cockpit.position.set(0, 1.35, 1.12);
const tailBoom = new THREE.Mesh(new THREE.BoxGeometry(.38, .38, 5.1), helicopterShell); tailBoom.position.set(0, 1.4, -3.2); tailBoom.rotation.x = -.08; tailBoom.castShadow = true;
const tailFin = new THREE.Mesh(new THREE.BoxGeometry(.18, 1.55, 1.25), helicopterTrim); tailFin.position.set(0, 2.05, -5.55);
const rotorMast = new THREE.Mesh(new THREE.CylinderGeometry(.1, .13, .85, 10), jointMat); rotorMast.position.y = 2.65;
const mainRotor = new THREE.Group(); mainRotor.position.y = 3.08;
const rotorBladeA = new THREE.Mesh(new THREE.BoxGeometry(8.2, .08, .22), jointMat);
const rotorBladeB = new THREE.Mesh(new THREE.BoxGeometry(.22, .08, 8.2), jointMat);
mainRotor.add(rotorBladeA, rotorBladeB);
const tailRotor = new THREE.Group(); tailRotor.position.set(.24, 1.75, -5.75); tailRotor.rotation.y = Math.PI / 2;
const tailBladeA = new THREE.Mesh(new THREE.BoxGeometry(.08, 1.8, .14), jointMat);
const tailBladeB = new THREE.Mesh(new THREE.BoxGeometry(.08, .14, 1.8), jointMat); tailRotor.add(tailBladeA, tailBladeB);
for (const x of [-.82, .82]) {
  const skid = new THREE.Mesh(new THREE.CapsuleGeometry(.09, 3.15, 5, 8), helicopterTrim);
  skid.rotation.x = Math.PI / 2; skid.position.set(x, .05, .1); helicopter.add(skid);
  for (const z of [-1, 1]) { const brace = new THREE.Mesh(new THREE.CylinderGeometry(.045, .045, .75, 7), helicopterTrim); brace.position.set(x, .45, z); brace.rotation.z = x > 0 ? -.25 : .25; helicopter.add(brace); }
}
helicopter.add(cabin, cockpit, tailBoom, tailFin, rotorMast, mainRotor, tailRotor);
helicopter.position.copy(HELIPAD).setY(.48); helicopter.rotation.y = Math.PI; scene.add(helicopter);

// Pink robot, built as a rig so limbs can walk independently.
const robot = new THREE.Group();
const pelvis = new THREE.Mesh(new THREE.BoxGeometry(2.0, .8, 1.15), violetDark); pelvis.position.y = 2.55; pelvis.castShadow = true; robot.add(pelvis);
const torso = new THREE.Mesh(new THREE.BoxGeometry(2.45, 2.35, 1.35), violet); torso.position.y = 4.05; torso.castShadow = true; robot.add(torso);
const chest = new THREE.Mesh(new THREE.CircleGeometry(.34, 24), glowMat); chest.position.set(0, 4.2, .686); robot.add(chest);
const neck = new THREE.Mesh(new THREE.CylinderGeometry(.28, .28, .35, 12), jointMat); neck.position.y = 5.45; robot.add(neck);
const head = new THREE.Mesh(new THREE.BoxGeometry(2.05, 1.55, 1.55), violetLight); head.position.y = 6.35; head.castShadow = true; robot.add(head);
const face = new THREE.Mesh(new THREE.BoxGeometry(1.55, .72, .08), jointMat); face.position.set(0, 6.34, .8); robot.add(face);
for (const x of [-.43,.43]) { const eye = new THREE.Mesh(new THREE.SphereGeometry(.12, 12, 8), glowMat); eye.position.set(x, 6.38, .87); robot.add(eye); }
const antenna = new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, .65, 7), jointMat); antenna.position.y = 7.45; robot.add(antenna);
const antennaTip = new THREE.Mesh(new THREE.SphereGeometry(.11, 10, 8), glowMat); antennaTip.position.y = 7.82; robot.add(antennaTip);

const limbs = {};
function makeLimb(name, x, y, isArm) {
  const pivot = new THREE.Group(); pivot.position.set(x, y, 0); robot.add(pivot);
  const upper = new THREE.Mesh(new THREE.CapsuleGeometry(isArm ? .25 : .32, isArm ? 1.05 : 1.15, 5, 10), violet); upper.position.y = isArm ? -.72 : -.8; upper.castShadow = true;
  const joint = new THREE.Mesh(new THREE.SphereGeometry(isArm ? .27 : .32, 12, 8), jointMat); joint.position.y = isArm ? -1.4 : -1.57;
  const lower = new THREE.Mesh(new THREE.CapsuleGeometry(isArm ? .22 : .28, isArm ? .8 : .9, 5, 10), violetLight); lower.position.y = isArm ? -1.82 : -2.05; lower.castShadow = true;
  pivot.add(upper, joint, lower);
  if (!isArm) { const foot = new THREE.Mesh(new THREE.BoxGeometry(.75, .4, 1.05), violetDark); foot.position.set(0, -2.67, .18); foot.castShadow = true; pivot.add(foot); }
  limbs[name] = pivot;
}
makeLimb('leftArm', -1.48, 4.95, true); makeLimb('rightArm', 1.48, 4.95, true);
makeLimb('leftLeg', -.58, 2.45, false); makeLimb('rightLeg', .58, 2.45, false);
robot.scale.setScalar(.62); robot.position.set(0, 0, 37); robot.rotation.y = Math.PI; scene.add(robot);

// Floating forest motes.
const moteCount = 110, motePositions = new Float32Array(moteCount * 3);
for (let i=0; i<moteCount; i++) { motePositions[i*3]=(random()-.5)*45; motePositions[i*3+1]=.6+random()*8; motePositions[i*3+2]=-60+random()*110; }
const moteGeo = new THREE.BufferGeometry(); moteGeo.setAttribute('position', new THREE.BufferAttribute(motePositions,3));
const motes = new THREE.Points(moteGeo, new THREE.PointsMaterial({color:0xffbfd8,size:.08,transparent:true,opacity:.75,blending:THREE.AdditiveBlending,depthWrite:false})); scene.add(motes);

const keys = {};
let started = false, arrived = false, walkTime = 0;
let doorOpen = false, lyingInBed = false, insideHouse = false, pilotingHelicopter = false;
const startZ = 37, destinationZ = -44;
const startButton = document.querySelector('#start');
const intro = document.querySelector('#intro');
const actionPrompt = document.querySelector('#action-prompt');
const controlTitle = document.querySelector('#control-title');
const controlDetail = document.querySelector('#control-detail');
const helicopterDistance = document.querySelector('#helicopter-distance');
const doorPosition = new THREE.Vector3(0, 0, HOUSE_CENTER_Z + 3.68 * HOUSE_SCALE);
const bedPosition = new THREE.Vector3(2.35 * HOUSE_SCALE, 0, HOUSE_CENTER_Z - .2 * HOUSE_SCALE);

const planarDistance = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const isInsideHouse = position => Math.abs(position.x) < HOUSE_HALF_WIDTH && position.z < HOUSE_FRONT && position.z > HOUSE_BACK;
function useAction() {
  if (pilotingHelicopter) {
    if (helicopter.position.y > .78) return;
    pilotingHelicopter = false;
    const exitSide = forwardFromYaw(helicopter.rotation.y + Math.PI / 2).multiplyScalar(2.4);
    robot.position.copy(helicopter.position).add(exitSide).setY(0);
    robot.rotation.set(0, helicopter.rotation.y, 0);
    robot.visible = true;
    return;
  }
  if (lyingInBed) {
    lyingInBed = false;
    robot.rotation.set(0, Math.PI, 0);
    robot.position.set(.4, 0, HOUSE_CENTER_Z);
    return;
  }
  if (insideHouse && planarDistance(robot.position, bedPosition) < 3.8) {
    lyingInBed = true;
    robot.position.set(bedPosition.x, 1.72, bedPosition.z + 1.8);
    robot.rotation.set(-Math.PI / 2, 0, 0);
    return;
  }
  if (!insideHouse && planarDistance(robot.position, helicopter.position) < 3.5 && helicopter.position.y < .8) {
    pilotingHelicopter = true;
    robot.visible = false;
    return;
  }
  if (planarDistance(robot.position, doorPosition) < 3.25) doorOpen = !doorOpen;
}
startButton.addEventListener('click', () => { started = true; intro.classList.add('hidden'); canvas.focus(); });
window.addEventListener('keydown', (event) => {
  if (event.key.startsWith('Arrow')) { event.preventDefault(); keys[event.code] = true; started = true; intro.classList.add('hidden'); }
  if (event.code === 'Comma' || event.code === 'Period') { event.preventDefault(); keys[event.code] = true; }
  if (event.code === 'KeyE' && !event.repeat) { event.preventDefault(); useAction(); }
});
window.addEventListener('keyup', event => { keys[event.code] = false; });
document.querySelectorAll('[data-key]').forEach(button => {
  const key = button.dataset.key;
  const press = e => { e.preventDefault(); keys[key] = true; started = true; intro.classList.add('hidden'); };
  const release = e => { e.preventDefault(); keys[key] = false; };
  button.addEventListener('pointerdown', press); button.addEventListener('pointerup', release); button.addEventListener('pointercancel', release); button.addEventListener('pointerleave', release);
});
document.querySelector('#mobile-action').addEventListener('click', useAction);
document.querySelector('#sound').addEventListener('click', e => e.currentTarget.classList.toggle('muted'));

const clock = new THREE.Clock();
const targetCamera = new THREE.Vector3(), lookTarget = new THREE.Vector3();
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), .04);
  const elapsed = clock.elapsedTime;
  const turning = (keys.ArrowLeft ? 1 : 0) - (keys.ArrowRight ? 1 : 0);
  const moving = (keys.ArrowUp ? 1 : 0) - (keys.ArrowDown ? 1 : 0);
  if (pilotingHelicopter) {
    helicopter.rotation.y += turning * dt * 1.25;
    helicopter.position.addScaledVector(forwardFromYaw(helicopter.rotation.y), moving * dt * 8);
    helicopter.position.y += ((keys.Period ? 1 : 0) - (keys.Comma ? 1 : 0)) * dt * 5;
    helicopter.position.x = THREE.MathUtils.clamp(helicopter.position.x, -48, 48);
    helicopter.position.z = THREE.MathUtils.clamp(helicopter.position.z, -68, 58);
    helicopter.position.y = THREE.MathUtils.clamp(helicopter.position.y, .48, 30);
    cabin.rotation.z = THREE.MathUtils.lerp(cabin.rotation.z, -turning * .12, .08);
  } else if (!lyingInBed) {
    robot.rotation.y += turning * dt * 1.75;
    if (moving) {
      const previousPosition = robot.position.clone();
      const direction = forwardFromYaw(robot.rotation.y);
      robot.position.addScaledVector(direction, moving * dt * 5.1);
      robot.position.x = THREE.MathUtils.clamp(robot.position.x, -19, 19);
      robot.position.z = THREE.MathUtils.clamp(robot.position.z, HOUSE_BACK + .35, 44);
      const wasInside = isInsideHouse(previousPosition);
      const enteringOrLeaving = wasInside !== isInsideHouse(robot.position);
      const throughOpenDoor = doorOpen && Math.abs(robot.position.x) < 1.0 && (previousPosition.z >= HOUSE_FRONT || robot.position.z >= HOUSE_FRONT);
      if (enteringOrLeaving && !throughOpenDoor) robot.position.copy(previousPosition);
      walkTime += dt * 9 * moving;
    }
  }
  insideHouse = !pilotingHelicopter && (isInsideHouse(robot.position) || lyingInBed);
  const stride = moving ? Math.sin(walkTime) * .58 : Math.sin(elapsed * 2) * .025;
  limbs.leftLeg.rotation.x = lyingInBed ? 0 : stride; limbs.rightLeg.rotation.x = lyingInBed ? 0 : -stride;
  limbs.leftArm.rotation.x = lyingInBed ? -.08 : -stride * .8; limbs.rightArm.rotation.x = lyingInBed ? .08 : stride * .8;
  if (!lyingInBed) robot.position.y = moving ? Math.abs(Math.sin(walkTime * 2)) * .07 : Math.sin(elapsed * 2) * .025;
  torso.rotation.z = moving ? Math.sin(walkTime) * .025 : 0;

  doorPivot.rotation.y = THREE.MathUtils.lerp(doorPivot.rotation.y, doorOpen ? Math.PI * .52 : 0, 1 - Math.pow(.0001, dt));
  mainRotor.rotation.y += dt * (pilotingHelicopter ? 24 : 2.2);
  tailRotor.rotation.z += dt * (pilotingHelicopter ? 32 : 3.5);
  roof.visible = !insideHouse;
  const nearBed = insideHouse && planarDistance(robot.position, bedPosition) < 3.8;
  const nearDoor = planarDistance(robot.position, doorPosition) < 3.25;
  const nearHelicopter = !pilotingHelicopter && !insideHouse && planarDistance(robot.position, helicopter.position) < 3.5;
  const actionLabel = pilotingHelicopter ? (helicopter.position.y <= .78 ? 'EXIT HELICOPTER' : 'LAND TO EXIT') : lyingInBed ? 'GET UP' : nearBed ? 'LIE IN BED' : nearHelicopter ? 'ENTER HELICOPTER' : nearDoor ? (doorOpen ? 'CLOSE DOOR' : 'OPEN DOOR') : '';
  actionPrompt.querySelector('span').textContent = actionLabel;
  actionPrompt.classList.toggle('show', Boolean(actionLabel));
  controlTitle.textContent = pilotingHelicopter ? 'ARROWS · , · .' : 'ARROWS · E';
  controlDetail.textContent = pilotingHelicopter ? 'FLY · DOWN · UP' : 'MOVE · ACTION';

  const forward = pilotingHelicopter ? forwardFromYaw(helicopter.rotation.y) : forwardFromYaw(robot.rotation.y);
  if (pilotingHelicopter) {
    targetCamera.copy(helicopter.position).addScaledVector(forward, -11).add(new THREE.Vector3(0, 6.5, 0));
    lookTarget.copy(helicopter.position).add(new THREE.Vector3(0, 1.3, 0)).addScaledVector(forward, 3.2);
  } else if (lyingInBed) {
    // A fixed interior angle keeps the bed, robot, and room in view.
    targetCamera.set(-2.4, 6.4, HOUSE_FRONT - 2.1);
    lookTarget.set(bedPosition.x, 1.25, bedPosition.z);
  } else if (insideHouse) {
    // Follow normally, then constrain the camera to the room so it never
    // slips back through a wall or doorway into the exterior.
    targetCamera.copy(robot.position).addScaledVector(forward, -5.2).add(new THREE.Vector3(0, 5.2, 0));
    targetCamera.x = THREE.MathUtils.clamp(targetCamera.x, -HOUSE_HALF_WIDTH + 1.1, HOUSE_HALF_WIDTH - 1.1);
    targetCamera.z = THREE.MathUtils.clamp(targetCamera.z, HOUSE_BACK + 1.1, HOUSE_FRONT - 1.1);
    lookTarget.copy(robot.position).add(new THREE.Vector3(0, 2.6, 0)).addScaledVector(forward, 1.1);
  } else {
    targetCamera.copy(robot.position).addScaledVector(forward, -10).add(new THREE.Vector3(0, 7.2, 0));
    lookTarget.copy(robot.position).add(new THREE.Vector3(0, 3.2, 0)).addScaledVector(forward, 2.8);
  }
  camera.position.lerp(targetCamera, 1 - Math.pow(.001, dt));
  camera.lookAt(lookTarget);

  const remaining = robot.position.distanceTo(new THREE.Vector3(0,0,-44));
  const progress = THREE.MathUtils.clamp((startZ - robot.position.z) / (startZ - destinationZ), 0, 1);
  document.querySelector('#progress').style.width = `${Math.round(progress * 100)}%`;
  document.querySelector('#distance').textContent = Math.max(0, Math.round(remaining));
  helicopterDistance.textContent = Math.max(0, Math.round(planarDistance(robot.position, helicopter.position)));
  if (!arrived && remaining < 5.2) { arrived = true; document.querySelector('#arrival').classList.add('show'); setTimeout(() => document.querySelector('#arrival').classList.remove('show'), 4000); }
  if (remaining > 8) arrived = false;

  motes.rotation.y = Math.sin(elapsed * .08) * .06;
  const positions = motes.geometry.attributes.position.array;
  for (let i=0; i<moteCount; i++) positions[i*3+1] += Math.sin(elapsed*1.2+i)*.0007;
  motes.geometry.attributes.position.needsUpdate = true;
  glowMat.emissiveIntensity = 2.6 + Math.sin(elapsed * 2.2) * .45;
  renderer.render(scene, camera);
}
camera.position.set(0, 7, 47);
animate();

window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight); renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
});
