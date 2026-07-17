import * as THREE from 'three';
import './style.css';

const canvas = document.querySelector('#scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf1a2c3);
scene.fog = new THREE.Fog(0xe99abb, 25, 76);
const camera = new THREE.PerspectiveCamera(39, innerWidth / innerHeight, 0.1, 120);
const clock = new THREE.Clock();

const material = (color, roughness = 0.82, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
const shadow = mesh => { mesh.castShadow = true; mesh.receiveShadow = true; return mesh; };
const addMesh = (parent, geometry, mat, position, rotation) => {
  const mesh = shadow(new THREE.Mesh(geometry, mat));
  if (position) mesh.position.set(...position);
  if (rotation) mesh.rotation.set(...rotation);
  parent.add(mesh);
  return mesh;
};
const smooth = value => value * value * (3 - 2 * value);
const between = (value, start, end) => smooth(THREE.MathUtils.clamp((value - start) / (end - start), 0, 1));
const setCubicPosition = (target, a, b, c, d, t) => {
  const mt = 1 - t, mt2 = mt * mt, t2 = t * t;
  target.set(
    a.x * mt2 * mt + 3 * b.x * mt2 * t + 3 * c.x * mt * t2 + d.x * t2 * t,
    a.y * mt2 * mt + 3 * b.y * mt2 * t + 3 * c.y * mt * t2 + d.y * t2 * t,
    a.z * mt2 * mt + 3 * b.z * mt2 * t + 3 * c.z * mt * t2 + d.z * t2 * t,
  );
};
const turnToward = (current, target, amount) => current + Math.atan2(Math.sin(target - current), Math.cos(target - current)) * amount;

// Blush sunrise lighting and a soft rose sky.
scene.add(new THREE.HemisphereLight(0xffe8f1, 0x5d2147, 2.6));
const sun = new THREE.DirectionalLight(0xfff0da, 4.8);
sun.position.set(-18, 26, 18);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -25; sun.shadow.camera.right = 25;
sun.shadow.camera.top = 22; sun.shadow.camera.bottom = -16; sun.shadow.camera.far = 70;
scene.add(sun);
const rim = new THREE.DirectionalLight(0xff4f9b, 2.1);
rim.position.set(14, 8, -12);
scene.add(rim);

// Layered pink sky dome.
const sky = new THREE.Mesh(new THREE.SphereGeometry(85, 32, 16), new THREE.ShaderMaterial({
  side: THREE.BackSide,
  uniforms: { top: { value: new THREE.Color(0xa95082) }, bottom: { value: new THREE.Color(0xffd3df) } },
  vertexShader: 'varying vec3 vPos; void main(){vPos=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
  fragmentShader: 'varying vec3 vPos; uniform vec3 top; uniform vec3 bottom; void main(){float h=smoothstep(-0.18,0.72,normalize(vPos).y);gl_FragColor=vec4(mix(bottom,top,h),1.0);}'
}));
scene.add(sky);

const grassMat = material(0xa94f79, 1);
const grassLight = material(0xd978a0, 1);
const dirtMat = material(0x8e4169, 1);
const woodMat = material(0x8d315f, 0.96);
const woodLight = material(0xd06d98, 0.94);
const darkWood = material(0x541d42, 1);
const hayMat = material(0xff4f9b, 0.92);
const hayLight = material(0xffa5c7, 0.86);

const ground = new THREE.Mesh(new THREE.PlaneGeometry(130, 100), grassMat);
ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
const feedingPatch = new THREE.Mesh(new THREE.CircleGeometry(8.5, 48), dirtMat);
feedingPatch.rotation.x = -Math.PI / 2; feedingPatch.position.set(0, 0.015, 0); feedingPatch.scale.set(1.4, .75, 1); feedingPatch.receiveShadow = true; scene.add(feedingPatch);

// Soft rolling mauve hills on the horizon.
const hillMat = material(0x7b365e, 1);
for (const [x, z, sx, sy] of [[-25,-32,20,6],[2,-36,27,8],[32,-34,22,6]]) {
  const hill = new THREE.Mesh(new THREE.SphereGeometry(7, 24, 12), hillMat);
  hill.position.set(x, -2.5, z); hill.scale.set(sx / 7, sy / 7, 1.5); scene.add(hill);
}

// Split-rail paddock fence.
function fenceLine(start, end, posts) {
  const direction = new THREE.Vector3().subVectors(end, start);
  const length = direction.length();
  const angle = Math.atan2(direction.x, direction.z);
  for (let i = 0; i <= posts; i++) {
    const p = new THREE.Vector3().lerpVectors(start, end, i / posts);
    addMesh(scene, new THREE.CylinderGeometry(.13, .18, 2.5, 7), darkWood, [p.x, 1.2, p.z], [0, 0, .025 * (i % 2 ? 1 : -1)]);
  }
  for (const height of [.72, 1.62]) {
    const rail = addMesh(scene, new THREE.CylinderGeometry(.085, .11, length, 7), woodMat,
      [(start.x + end.x) / 2, height, (start.z + end.z) / 2], [Math.PI / 2, 0, angle]);
    rail.rotation.order = 'YXZ';
  }
}
fenceLine(new THREE.Vector3(-22,0,-10), new THREE.Vector3(19,0,-10), 9);
fenceLine(new THREE.Vector3(19,0,-10), new THREE.Vector3(19,0,15), 6);

// Pink barn beyond the fence.
const barn = new THREE.Group();
addMesh(barn, new THREE.BoxGeometry(10, 6.5, 7), material(0xc94e82, .95), [0, 3.25, 0]);
const roof = addMesh(barn, new THREE.ConeGeometry(7.2, 3.2, 4), material(0x6e2854, .92, .05), [0, 7.4, 0], [0, Math.PI / 4, 0]);
roof.scale.z = .72;
addMesh(barn, new THREE.BoxGeometry(3.5, 4.7, .15), darkWood, [0, 2.4, 3.56]);
for (const x of [-1.35, 1.35]) addMesh(barn, new THREE.BoxGeometry(.14, 4.7, .2), woodLight, [x, 2.4, 3.68]);
for (const y of [1.1, 3.6]) addMesh(barn, new THREE.BoxGeometry(3.5, .14, .2), woodLight, [0, y, 3.68]);
barn.position.set(11, 0, -22); barn.scale.setScalar(1.25); scene.add(barn);

// Trough and its growing pile of hay.
const trough = new THREE.Group();
addMesh(trough, new THREE.BoxGeometry(4.4, .18, 1.45), woodMat, [0, .48, 0]);
for (const z of [-.72, .72]) addMesh(trough, new THREE.BoxGeometry(4.7, .72, .16), woodLight, [0, .77, z], [z > 0 ? -.18 : .18, 0, 0]);
for (const x of [-1.75, 1.75]) for (const z of [-.52, .52]) addMesh(trough, new THREE.CylinderGeometry(.08,.1,.7,7), darkWood, [x,.25,z], [0,0,.12 * Math.sign(x)]);
trough.position.set(-.15, 0, .15); scene.add(trough);
const hayPile = new THREE.Group();
for (let i = 0; i < 38; i++) {
  const angle = (i * 2.399) % (Math.PI * 2);
  const radius = (i % 9) / 9 * 1.7;
  addMesh(hayPile, new THREE.CylinderGeometry(.018,.022,.8 + (i % 4) * .12,5), i % 3 ? hayMat : hayLight,
    [Math.cos(angle) * radius, .76 + (i % 5) * .055, Math.sin(angle) * radius * .3],
    [Math.PI / 2 + Math.sin(i) * .35, angle, .8 + Math.cos(i * 2) * .25]);
}
hayPile.position.copy(trough.position); scene.add(hayPile);

// Stylized pink pegasus rigs, with animated heads, ears, tails, legs and wings.
const horses = [];
const wingShape = new THREE.Shape();
wingShape.moveTo(0, 0);
wingShape.bezierCurveTo(.35, .45, .55, 1.05, 1.15, 1.42);
wingShape.bezierCurveTo(1.65, 1.72, 2.35, 1.78, 2.72, 1.62);
wingShape.bezierCurveTo(2.32, 1.25, 2.02, .8, 1.62, .48);
wingShape.bezierCurveTo(1.12, .08, .52, -.18, 0, 0);
const wingGeometry = new THREE.ExtrudeGeometry(wingShape, { depth: .1, bevelEnabled: true, bevelSize: .035, bevelThickness: .035, bevelSegments: 2 });
const flightRoutes = [
  { air: [0, 2.5, -2], approach: [3, 3.8, -6], depart: [7, 3.7, 1], radius: 1.1 },
  { air: [3.5, 2.8, -4], approach: [7, 4, -4], depart: [9, 3.8, 1], radius: 1.2 },
  { air: [6.5, 2.5, -5], approach: [9, 3.8, 0], depart: [4, 3.7, 7], radius: 1.1 },
];

function createHorse(name, color, maneColor, position, rotation, scale = 1) {
  const root = new THREE.Group();
  const coat = material(color, .72);
  const mane = material(maneColor, .86);
  const hoof = material(0x6a214d, .76);
  const wingMat = material(0xffc8df, .58, .08);
  const featherMat = material(0xffeef6, .62, .03);
  const body = addMesh(root, new THREE.CapsuleGeometry(.72, 2.1, 7, 12), coat, [0, 2.35, 0], [0, 0, Math.PI / 2]);
  body.scale.set(1, 1.12, 1.02);
  addMesh(root, new THREE.SphereGeometry(.64, 16, 12), coat, [-1.22, 2.38, 0]);

  const headRig = new THREE.Group(); headRig.position.set(1.2, 2.45, 0); root.add(headRig);
  addMesh(headRig, new THREE.CapsuleGeometry(.38, 1.02, 6, 10), coat, [0, .65, 0], [0, 0, 0]);
  addMesh(headRig, new THREE.BoxGeometry(.82, .72, .68), coat, [.17, 1.38, 0], [0, 0, -.08]);
  addMesh(headRig, new THREE.BoxGeometry(.68, .46, .58), material(color + 0x080300, .93), [.72, 1.27, 0], [0, 0, -.05]);
  for (const z of [-.24, .24]) {
    addMesh(headRig, new THREE.ConeGeometry(.13, .46, 7), coat, [-.02, 1.93, z], [0, 0, z > 0 ? -.12 : .12]);
    addMesh(headRig, new THREE.SphereGeometry(.055, 8, 6), hoof, [.48, 1.55, z > 0 ? .345 : -.345]);
  }
  for (let i = 0; i < 5; i++) addMesh(headRig, new THREE.ConeGeometry(.15,.48,6), mane, [-.34, .38 + i * .28, 0], [0,0,.25]);
  headRig.rotation.z = -.9;

  const wings = [];
  for (const side of [-1, 1]) {
    const wing = new THREE.Group();
    wing.position.set(-.2, 2.65, side * .58);
    wing.rotation.order = 'YXZ';
    wing.rotation.y = -side * Math.PI / 2;
    root.add(wing);
    addMesh(wing, wingGeometry, wingMat, [0, 0, -.05]);
    addMesh(wing, new THREE.SphereGeometry(.3, 12, 8), wingMat, [.08, .08, .05], null);
    for (let i = 0; i < 5; i++) {
      const feather = addMesh(wing, new THREE.CapsuleGeometry(.075, .72 + i * .12, 4, 8), featherMat,
        [.55 + i * .35, .35 + i * .19, .12], [0, 0, -.78 + i * .055]);
      feather.scale.x = 1 + i * .08;
    }
    wings.push({ rig: wing, side });
  }


  const legs = [];
  for (const x of [-.93, .93]) for (const z of [-.42, .42]) {
    const leg = new THREE.Group(); leg.position.set(x, 1.92, z); root.add(leg);
    addMesh(leg, new THREE.CylinderGeometry(.14,.18,1.42,8), coat, [0,-.7,0], [0,0,x * .025]);
    addMesh(leg, new THREE.CylinderGeometry(.1,.13,.68,7), coat, [.04,-1.68,0], [0,0,-.04]);
    addMesh(leg, new THREE.BoxGeometry(.34,.24,.34), hoof, [.08,-2.08,.02], [0,0,-.05]);
    legs.push(leg);
  }
  const tail = new THREE.Group(); tail.position.set(-1.42, 2.65, 0); root.add(tail);
  for (let i = 0; i < 4; i++) addMesh(tail, new THREE.CapsuleGeometry(.1 + i*.025,.52,4,7), mane, [-.1-i*.08,-.3-i*.42,0], [0,0,-.18]);

  const route = flightRoutes[horses.length];
  const landPosition = new THREE.Vector3(...position);
  const flightPoint = new THREE.Vector3(...route.air);
  const direction = new THREE.Vector3(Math.cos(rotation), 0, -Math.sin(rotation));
  const approachControlA = new THREE.Vector3(...route.approach);
  const approachControlB = landPosition.clone().addScaledVector(direction, -3); approachControlB.y = 3.4;
  const departControlA = landPosition.clone().addScaledVector(direction, 2.8); departControlA.y = 3.2;
  const departControlB = new THREE.Vector3(...route.depart);
  root.position.copy(flightPoint); root.rotation.y = rotation; root.scale.setScalar(scale); scene.add(root);
  horses.push({ name, root, headRig, tail, legs, wings, phase: horses.length * 1.7, landPosition, landRotation: rotation, flightPoint, approachControlA, approachControlB, departControlA, departControlB, loopRadius: route.radius });
  return root;
}
createHorse('Peony', 0xf05d9a, 0x8e285d, [3.9,0,1.3], 2.94, 1.04);
createHorse('Taffy', 0xff8ab7, 0xb62f6c, [2.6,0,-3.5], -1.98, .94);
createHorse('Rosette', 0xdb3f83, 0x741b50, [5.6,0,4.2], 2.55, .88);

// Rosie, the candy-pink agricultural robot.
const robot = new THREE.Group();
const black = material(0xe93f87, .3, .62);
const blackSoft = material(0xff82b2, .4, .42);
const rubber = material(0x6b1d4e, .72, .12);
const brass = material(0xffb0cc, .3, .58);
const eyeMat = new THREE.MeshStandardMaterial({ color: 0xfff7fb, emissive: 0xff4f9b, emissiveIntensity: 3.5, roughness: .28 });
addMesh(robot, new THREE.BoxGeometry(1.45,1.7,1.35), black, [0,2.85,0]);
addMesh(robot, new THREE.BoxGeometry(1.18,.28,1.15), brass, [.03,3.2,0]);
addMesh(robot, new THREE.CylinderGeometry(.22,.22,.24,12), rubber, [0,3.85,0]);
const head = new THREE.Group(); head.position.set(0,4.35,0); robot.add(head);
addMesh(head, new THREE.BoxGeometry(1.25,.92,1.05), blackSoft, [0,0,0]);
addMesh(head, new THREE.BoxGeometry(.08,.47,.76), rubber, [.665,-.02,0]);
for (const z of [-.25,.25]) addMesh(head, new THREE.SphereGeometry(.09,12,8), eyeMat, [.72,.05,z]);
addMesh(head, new THREE.CylinderGeometry(.025,.025,.55,6), brass, [0,.73,0]);
addMesh(head, new THREE.SphereGeometry(.08,9,7), eyeMat, [0,1.03,0]);

function makeArm(z) {
  const shoulder = new THREE.Group(); shoulder.position.set(0,3.45,z); robot.add(shoulder);
  addMesh(shoulder, new THREE.SphereGeometry(.25,12,8), brass, [0,0,0]);
  addMesh(shoulder, new THREE.CapsuleGeometry(.16,.72,5,8), black, [0,-.53,0]);
  const elbow = new THREE.Group(); elbow.position.set(0,-1.03,0); shoulder.add(elbow);
  addMesh(elbow, new THREE.SphereGeometry(.18,10,8), brass, [0,0,0]);
  addMesh(elbow, new THREE.CapsuleGeometry(.14,.62,5,8), blackSoft, [0,-.46,0]);
  const hand = addMesh(elbow, new THREE.BoxGeometry(.33,.27,.35), rubber, [0,-.92,0]);
  return { shoulder, elbow, hand };
}
const feedArm = makeArm(.8);
const carryArm = makeArm(-.8);
carryArm.shoulder.rotation.z = .42; carryArm.elbow.rotation.z = -.8;

const legs = [];
for (const z of [-.42,.42]) {
  const hip = new THREE.Group(); hip.position.set(0,1.96,z); robot.add(hip);
  addMesh(hip, new THREE.SphereGeometry(.22,10,8), brass, [0,0,0]);
  addMesh(hip, new THREE.CapsuleGeometry(.18,.74,5,8), black, [0,-.55,0]);
  addMesh(hip, new THREE.BoxGeometry(.62,.25,.45), rubber, [.18,-1.14,0]);
  legs.push(hip);
}
const chestBadge = addMesh(robot, new THREE.CircleGeometry(.16,20), eyeMat, [.736,2.85,0], [0,Math.PI/2,0]);
robot.position.set(-3.25,0,2.15); robot.rotation.y = .04; scene.add(robot);

// A bundle tucked under the robot's non-feeding arm.
const bundle = new THREE.Group();
for (let i = 0; i < 24; i++) {
  const a = i * 2.4;
  addMesh(bundle, new THREE.CylinderGeometry(.018,.02,1.4,5), i%3 ? hayMat : hayLight,
    [0, Math.cos(a)*.28, Math.sin(a)*.28], [0,0,Math.PI/2 + (i%4-.5)*.035]);
}
addMesh(bundle, new THREE.TorusGeometry(.34,.025,6,16), darkWood, [-.36,0,0], [0,Math.PI/2,0]);
addMesh(bundle, new THREE.TorusGeometry(.34,.025,6,16), darkWood, [.36,0,0], [0,Math.PI/2,0]);
bundle.position.set(.6,1.85,-.62); bundle.rotation.z = .15; robot.add(bundle);

// Wild rose grass and tiny blossoms, deterministic for a stable composition.
let seed = 73421;
const random = () => ((seed = seed * 16807 % 2147483647) - 1) / 2147483646;
const grassGeometry = new THREE.ConeGeometry(.025,.55,4);
const tuftCount = 380;
const tufts = new THREE.InstancedMesh(grassGeometry, grassLight, tuftCount);
const dummy = new THREE.Object3D();
let placed = 0;
while (placed < tuftCount) {
  const x = (random()-.5)*55, z = (random()-.5)*38;
  if ((x*x/100 + z*z/45) < 1 || z < -9.5) continue;
  dummy.position.set(x,.22 + random()*.12,z); dummy.rotation.set((random()-.5)*.16,random()*Math.PI,(random()-.5)*.16); dummy.scale.setScalar(.65+random()*.8); dummy.updateMatrix(); tufts.setMatrixAt(placed++,dummy.matrix);
}
tufts.receiveShadow = true; scene.add(tufts);
for (let i=0;i<42;i++) {
  const x=(random()-.5)*28, z=6+random()*12;
  const flower = addMesh(scene,new THREE.SphereGeometry(.045,7,5),i%3?hayLight:material(0xffeef5,1),[x,.38+random()*.16,z]);
  flower.castShadow=false;
}

// Drifting candy-pink pollen catches the sunlight.
const pollenCount = 110;
const pollenPositions = new Float32Array(pollenCount * 3);
for(let i=0;i<pollenCount;i++) { pollenPositions[i*3]=(random()-.5)*32; pollenPositions[i*3+1]=.5+random()*9; pollenPositions[i*3+2]=(random()-.5)*23; }
const pollenGeo = new THREE.BufferGeometry(); pollenGeo.setAttribute('position',new THREE.BufferAttribute(pollenPositions,3));
const pollen = new THREE.Points(pollenGeo,new THREE.PointsMaterial({color:0xffd3e2,size:.06,transparent:true,opacity:.66,depthWrite:false})); scene.add(pollen);

// Recyclable falling straw particles emitted from the robot's hand.
const straws = [];
for (let i=0;i<48;i++) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(.012,.016,.42,4), i%3 ? hayMat : hayLight);
  mesh.visible = false; scene.add(mesh);
  straws.push({ mesh, velocity:new THREE.Vector3(), life:0 });
}
let strawCursor=0, spawnTimer=0;
const handWorld = new THREE.Vector3();
function spawnStraw() {
  const straw=straws[strawCursor++%straws.length];
  feedArm.hand.getWorldPosition(handWorld);
  straw.mesh.position.copy(handWorld).add(new THREE.Vector3((random()-.5)*.25,(random()-.5)*.16,(random()-.5)*.24));
  straw.mesh.rotation.set(random()*Math.PI,random()*Math.PI,random()*Math.PI);
  straw.velocity.set(1.1+random()*.7,-.3-random()*.5,(random()-.5)*.8);
  straw.life=1.4; straw.mesh.visible=true;
}

// Camera orbit is deliberately restrained to preserve the editorial composition.
const cameraTarget = new THREE.Vector3(.5,2.25,.15);
let yaw=0, pitch=0, dragging=false, lastX=0, lastY=0;
canvas.addEventListener('pointerdown', event => { dragging=true; lastX=event.clientX; lastY=event.clientY; canvas.setPointerCapture(event.pointerId); });
canvas.addEventListener('pointermove', event => { if(!dragging)return; yaw=THREE.MathUtils.clamp(yaw-(event.clientX-lastX)*.003,-.55,.55); pitch=THREE.MathUtils.clamp(pitch+(event.clientY-lastY)*.002,-.2,.22); lastX=event.clientX; lastY=event.clientY; });
const stopDrag=event=>{dragging=false;if(canvas.hasPointerCapture(event.pointerId))canvas.releasePointerCapture(event.pointerId);};
canvas.addEventListener('pointerup',stopDrag); canvas.addEventListener('pointercancel',stopDrag);

let feedStart=0, feedTime=0, supply=82, paused=false;
const feedButton=document.querySelector('#feed');
const supplyText=document.querySelector('#supply');
const supplyBar=document.querySelector('#supply-bar');
function restartFeed(){
  feedStart=feedTime; supply=Math.max(28,supply-4); supplyText.textContent=`${supply}%`; supplyBar.style.width=`${supply}%`;
  feedButton.firstChild.textContent='FEEDING NOW ';
  setTimeout(()=>{feedButton.firstChild.textContent='FEED AGAIN ';},2600);
}
feedButton.addEventListener('click',restartFeed);
document.querySelector('#sound').addEventListener('click',()=>{
  paused=!paused; document.querySelector('#sound').classList.toggle('paused',paused); document.querySelector('#sound span').textContent=paused?'RESUME':'PAUSE';
});

const chapter=document.querySelector('#chapter'), actionTitle=document.querySelector('#action-title'), actionCopy=document.querySelector('#action-copy');
let lastChapter='';
const herdStatuses=[...document.querySelectorAll('.horse-row em')];
function updateCaption(p){
  const entry=p<.18?['01','CIRCLING THE PADDOCK','Pegasus formation · airborne','AIRBORNE']:p<.43?['02','COMING IN TO LAND','Wings wide · hooves down','LANDING']:p<.67?['03','PINK HAY BREAKFAST','Peony, Taffy & Rosette','EATING']:p<.88?['04','WINGS UP, LIFT OFF','Breakfast complete · ascending','TAKEOFF']:['05','A VICTORY LAP','Full bellies · open sky','AIRBORNE'];
  if(entry[0]===lastChapter)return; lastChapter=entry[0]; chapter.textContent=entry[0]; actionTitle.textContent=entry[1]; actionCopy.textContent=entry[2]; herdStatuses.forEach(status=>status.textContent=entry[3]);
}

const targetCamera = new THREE.Vector3();
function animate(){
  requestAnimationFrame(animate);
  const dt=Math.min(clock.getDelta(),.04);
  if(!paused) feedTime+=dt;
  const t=feedTime;
  const p=((t-feedStart)%16+16)%16/16;
  updateCaption(p);

  // Rosie waits for the landing, serves breakfast, then waves the pegasi off.
  const lift=between(p,.28,.38)*(1-between(p,.68,.80));
  const offer=between(p,.38,.44)*(1-between(p,.62,.70));
  feedArm.shoulder.rotation.z=.08+lift*.55+offer*.72;
  feedArm.shoulder.rotation.x=Math.sin(t*1.4)*.035;
  feedArm.elbow.rotation.z=-.12+lift*.35-offer*.2;
  feedArm.hand.rotation.z=Math.sin(t*3)*.08;
  carryArm.shoulder.rotation.z=.42+Math.sin(t*1.2)*.025;
  head.rotation.z=Math.sin(t*.7)*.025;
  head.rotation.y=-.12+offer*.2;
  robot.position.y=Math.sin(t*1.7)*.025;
  robot.rotation.z=Math.sin(t*1.1)*.008;
  legs[0].rotation.z=Math.sin(t*.8)*.025; legs[1].rotation.z=-Math.sin(t*.8)*.025;
  chestBadge.material.emissiveIntensity=2.7+Math.sin(t*3)*.7;

  if(p>.41&&p<.65&&!paused){spawnTimer+=dt;while(spawnTimer>.055){spawnStraw();spawnTimer-=.055;}}
  for(const straw of straws){
    if(!straw.mesh.visible||paused)continue;
    straw.life-=dt; straw.velocity.y-=4.2*dt; straw.mesh.position.addScaledVector(straw.velocity,dt); straw.mesh.rotation.x+=dt*5; straw.mesh.rotation.z+=dt*3;
    if(straw.mesh.position.y<.78||straw.life<=0){straw.mesh.visible=false;}
  }
  hayPile.scale.y=1+offer*.08;

  horses.forEach((horse,index)=>{
    const previousX=horse.root.position.x, previousY=horse.root.position.y, previousZ=horse.root.position.z;
    const grounded=between(p,.35,.43)*(1-between(p,.67,.76));
    const airborne=1-grounded;

    if(p<.18||p>=.88){
      // One continuous victory lap wraps seamlessly across the end of the cycle.
      const q=p>=.88?(p-.88)/.30:(.12+p)/.30;
      const angle=q*Math.PI*2;
      horse.root.position.copy(horse.flightPoint);
      horse.root.position.x+=Math.sin(angle)*horse.loopRadius;
      horse.root.position.z+=(Math.cos(angle)-1)*horse.loopRadius;
      horse.root.position.y+=Math.sin(angle*2+horse.phase)*.45;
    }else if(p<.43){
      setCubicPosition(horse.root.position,horse.flightPoint,horse.approachControlA,horse.approachControlB,horse.landPosition,between(p,.18,.43));
    }else if(p<.67){
      horse.root.position.copy(horse.landPosition);
      horse.root.position.y+=Math.sin(t*.8+horse.phase)*.012;
    }else if(p<.88){
      setCubicPosition(horse.root.position,horse.landPosition,horse.departControlA,horse.departControlB,horse.flightPoint,between(p,.67,.88));
    }

    const dx=horse.root.position.x-previousX, dy=horse.root.position.y-previousY, dz=horse.root.position.z-previousZ;
    let desiredHeading=horse.landRotation;
    if(airborne>.15&&Math.hypot(dx,dz)>.0001) desiredHeading=Math.atan2(-dz,dx);
    horse.root.rotation.y=turnToward(horse.root.rotation.y,desiredHeading,1-Math.pow(.001,dt));
    horse.root.rotation.z=airborne*THREE.MathUtils.clamp(dy*2.2,-.28,.28);

    const chew=Math.sin(t*5+horse.phase);
    const curiosity=index===2?Math.sin(t*.38)*.1:0;
    const eating=grounded*between(p,.41,.47)*(1-between(p,.64,.68));
    horse.headRig.rotation.z=THREE.MathUtils.lerp(-.2+Math.sin(t*.9+horse.phase)*.06,-1.04+Math.sin(t*.72+horse.phase)*.075+curiosity,eating);
    horse.headRig.rotation.x=Math.sin(t*.53+horse.phase)*.035;
    horse.headRig.children[2].scale.y=1+chew*.025*eating;
    horse.tail.rotation.x=Math.sin(t*1.3+horse.phase)*(.12+airborne*.2);
    horse.tail.rotation.z=.1+Math.sin(t*1.55+horse.phase)*(.08+airborne*.12);
    horse.legs.forEach((leg,i)=>leg.rotation.z=airborne*(i<2?-.62:.62)+grounded*Math.sin(t*.7+horse.phase+i)*.015);
    horse.wings.forEach(wing => {
      const flightFlap=.12+Math.sin(t*5.2+horse.phase)*.48;
      const folded=1.08+Math.sin(t*.8+horse.phase)*.025;
      wing.rig.rotation.x=wing.side*THREE.MathUtils.lerp(flightFlap,folded,grounded);
      wing.rig.rotation.z=Math.sin(t*1.4+horse.phase)*.025*airborne;
    });
  });

  pollen.rotation.y=t*.018;
  pollen.position.x=Math.sin(t*.09)*1.2;
  const positions=pollen.geometry.attributes.position.array;
  for(let i=0;i<pollenCount;i++){positions[i*3+1]+=.0025;if(positions[i*3+1]>10)positions[i*3+1]=.4;}
  pollen.geometry.attributes.position.needsUpdate=true;

  const radius=19.5, baseAngle=.69+yaw;
  targetCamera.set(Math.sin(baseAngle)*radius,7.1+pitch*13,Math.cos(baseAngle)*radius);
  camera.position.lerp(targetCamera,1-Math.pow(.0008,dt));
  camera.lookAt(cameraTarget.x,cameraTarget.y+pitch*1.5,cameraTarget.z);
  renderer.render(scene,camera);
}
camera.position.set(12.5,7.1,15); camera.lookAt(cameraTarget); animate();

window.addEventListener('resize',()=>{
  camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight); renderer.setPixelRatio(Math.min(devicePixelRatio,2));
});
