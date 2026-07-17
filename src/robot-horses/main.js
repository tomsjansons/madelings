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
scene.background = new THREE.Color(0x9ba98e);
scene.fog = new THREE.Fog(0x9ba58c, 25, 76);
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

// Warm, low morning light.
scene.add(new THREE.HemisphereLight(0xdce3c4, 0x273021, 2.25));
const sun = new THREE.DirectionalLight(0xffd99a, 4.5);
sun.position.set(-18, 26, 18);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -25; sun.shadow.camera.right = 25;
sun.shadow.camera.top = 22; sun.shadow.camera.bottom = -16; sun.shadow.camera.far = 70;
scene.add(sun);

// Layered sky dome.
const sky = new THREE.Mesh(new THREE.SphereGeometry(85, 32, 16), new THREE.ShaderMaterial({
  side: THREE.BackSide,
  uniforms: { top: { value: new THREE.Color(0x789088) }, bottom: { value: new THREE.Color(0xe7d2a6) } },
  vertexShader: 'varying vec3 vPos; void main(){vPos=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
  fragmentShader: 'varying vec3 vPos; uniform vec3 top; uniform vec3 bottom; void main(){float h=smoothstep(-0.18,0.72,normalize(vPos).y);gl_FragColor=vec4(mix(bottom,top,h),1.0);}'
}));
scene.add(sky);

const grassMat = material(0x536b48, 1);
const grassLight = material(0x708258, 1);
const dirtMat = material(0x776347, 1);
const woodMat = material(0x60412b, 0.96);
const woodLight = material(0x87623e, 0.94);
const darkWood = material(0x392a20, 1);
const hayMat = material(0xd5a83f, 0.98);
const hayLight = material(0xf0c95d, 0.92);

const ground = new THREE.Mesh(new THREE.PlaneGeometry(130, 100), grassMat);
ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
const feedingPatch = new THREE.Mesh(new THREE.CircleGeometry(8.5, 48), dirtMat);
feedingPatch.rotation.x = -Math.PI / 2; feedingPatch.position.set(0, 0.015, 0); feedingPatch.scale.set(1.4, .75, 1); feedingPatch.receiveShadow = true; scene.add(feedingPatch);

// Soft rolling hills on the horizon.
const hillMat = material(0x40563d, 1);
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

// Barn beyond the fence.
const barn = new THREE.Group();
addMesh(barn, new THREE.BoxGeometry(10, 6.5, 7), material(0x6d382d, .95), [0, 3.25, 0]);
const roof = addMesh(barn, new THREE.ConeGeometry(7.2, 3.2, 4), material(0x343832, .92, .05), [0, 7.4, 0], [0, Math.PI / 4, 0]);
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

// Stylized brown horse rig, with individually animated head, ears, tail and legs.
const horses = [];
function createHorse(name, color, maneColor, position, rotation, scale = 1) {
  const root = new THREE.Group();
  const coat = material(color, .88);
  const mane = material(maneColor, .96);
  const hoof = material(0x29231f, .86);
  const body = addMesh(root, new THREE.CapsuleGeometry(.72, 2.1, 7, 12), coat, [0, 2.35, 0], [0, 0, Math.PI / 2]);
  body.scale.set(1, 1.12, 1.02);
  addMesh(root, new THREE.SphereGeometry(.64, 16, 12), coat, [-1.22, 2.38, 0]);

  const headRig = new THREE.Group(); headRig.position.set(1.2, 2.45, 0); root.add(headRig);
  addMesh(headRig, new THREE.CapsuleGeometry(.38, 1.02, 6, 10), coat, [0, .65, 0], [0, 0, 0]);
  addMesh(headRig, new THREE.BoxGeometry(.82, .72, .68), coat, [.17, 1.38, 0], [0, 0, -.08]);
  addMesh(headRig, new THREE.BoxGeometry(.68, .46, .58), material(color + 0x080300, .93), [.72, 1.27, 0], [0, 0, -.05]);
  const jaw = addMesh(headRig, new THREE.BoxGeometry(.62, .16, .5), coat, [.75, 1.08, 0], [0, 0, .04]);
  const mouthHay = new THREE.Group(); mouthHay.position.set(1.03, 1.13, 0); headRig.add(mouthHay);
  for (let i = 0; i < 7; i++) addMesh(mouthHay, new THREE.CylinderGeometry(.009,.012,.34 + (i%3)*.08,4), i%2 ? hayMat : hayLight,
    [0, (i-3)*.025, (i%3-1)*.07], [Math.PI/2 + (i%2)*.18, 0, .3 + i*.2]);
  for (const z of [-.24, .24]) {
    addMesh(headRig, new THREE.ConeGeometry(.13, .46, 7), coat, [-.02, 1.93, z], [0, 0, z > 0 ? -.12 : .12]);
    addMesh(headRig, new THREE.SphereGeometry(.055, 8, 6), hoof, [.48, 1.55, z > 0 ? .345 : -.345]);
  }
  for (let i = 0; i < 5; i++) addMesh(headRig, new THREE.ConeGeometry(.15,.48,6), mane, [-.34, .38 + i * .28, 0], [0,0,.25]);
  headRig.rotation.z = -2.02;

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

  root.position.set(...position); root.rotation.y = rotation; root.scale.setScalar(scale); scene.add(root);
  horses.push({ name, root, headRig, jaw, mouthHay, tail, legs, phase: horses.length * 1.7, crumbTimer: 0 });
  return root;
}
createHorse('Chestnut', 0x824727, 0x3b241b, [3.55,0,.62], Math.PI, 1.04);
createHorse('Maple', 0x5b3424, 0x241d18, [.2,0,-2.45], -Math.PI/2, .94);
createHorse('Bramble', 0xa56335, 0x4a291d, [.5,0,1.85], 2.33, .88);

// Matte-black agricultural robot.
const robot = new THREE.Group();
const black = material(0x111512, .32, .68);
const blackSoft = material(0x252a25, .46, .5);
const rubber = material(0x090b0a, .85, .05);
const brass = material(0xa87d38, .34, .72);
const eyeMat = new THREE.MeshStandardMaterial({ color: 0xf8d67b, emissive: 0xffb62e, emissiveIntensity: 3.3, roughness: .35 });
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

// Wild grass and buttercups, deterministic for a stable composition.
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
  const flower = addMesh(scene,new THREE.SphereGeometry(.045,7,5),i%3?hayLight:material(0xf0e7bf,1),[x,.38+random()*.16,z]);
  flower.castShadow=false;
}

// Drifting pollen catches the sunlight.
const pollenCount = 110;
const pollenPositions = new Float32Array(pollenCount * 3);
for(let i=0;i<pollenCount;i++) { pollenPositions[i*3]=(random()-.5)*32; pollenPositions[i*3+1]=.5+random()*9; pollenPositions[i*3+2]=(random()-.5)*23; }
const pollenGeo = new THREE.BufferGeometry(); pollenGeo.setAttribute('position',new THREE.BufferAttribute(pollenPositions,3));
const pollen = new THREE.Points(pollenGeo,new THREE.PointsMaterial({color:0xffe0a0,size:.055,transparent:true,opacity:.55,depthWrite:false})); scene.add(pollen);

// Recyclable falling straw particles emitted from the robot's hand.
const straws = [];
for (let i=0;i<48;i++) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(.012,.016,.42,4), i%3 ? hayMat : hayLight);
  mesh.visible = false; scene.add(mesh);
  straws.push({ mesh, velocity:new THREE.Vector3(), life:0 });
}
let strawCursor=0, spawnTimer=0, hayLevel=.96;
const strawWorld = new THREE.Vector3();
function spawnStraw(source=feedArm.hand, eating=false) {
  const straw=straws[strawCursor++%straws.length];
  source.getWorldPosition(strawWorld);
  straw.mesh.position.copy(strawWorld).add(new THREE.Vector3((random()-.5)*.18,(random()-.5)*.1,(random()-.5)*.18));
  straw.mesh.rotation.set(random()*Math.PI,random()*Math.PI,random()*Math.PI);
  straw.mesh.scale.setScalar(eating?.45:1);
  straw.velocity.set(eating?(random()-.5)*.22:1.1+random()*.7,eating?-.18-random()*.25:-.3-random()*.5,(random()-.5)*(eating?.22:.8));
  straw.life=eating?.75:1.4; straw.mesh.visible=true;
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
function updateCaption(p){
  const entry=p<.18?['01','GATHERING A HANDFUL','Fresh hay · north paddock']:p<.42?['02','A GENTLE OFFERING','Unit 04 · feeding protocol']:p<.68?['03','BREAKFAST IS SERVED','Chestnut, Maple & Bramble']:['04','A QUIET THANK YOU','Routine complete · all fed'];
  if(entry[0]===lastChapter)return; lastChapter=entry[0]; chapter.textContent=entry[0]; actionTitle.textContent=entry[1]; actionCopy.textContent=entry[2];
}

const targetCamera = new THREE.Vector3();
function animate(){
  requestAnimationFrame(animate);
  const dt=Math.min(clock.getDelta(),.04);
  if(!paused) feedTime+=dt;
  const t=feedTime;
  const p=((t-feedStart)%10+10)%10/10;
  updateCaption(p);

  // Pick up, extend, pour, and return in one continuous feeding cycle.
  const lift=between(p,.12,.28)*(1-between(p,.70,.88));
  const offer=between(p,.28,.43)*(1-between(p,.62,.78));
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

  if(p>.43&&p<.66&&!paused){spawnTimer+=dt;while(spawnTimer>.055){spawnStraw();spawnTimer-=.055;}}
  for(const straw of straws){
    if(!straw.mesh.visible||paused)continue;
    straw.life-=dt; straw.velocity.y-=4.2*dt; straw.mesh.position.addScaledVector(straw.velocity,dt); straw.mesh.rotation.x+=dt*5; straw.mesh.rotation.z+=dt*3;
    if(straw.mesh.position.y<.78||straw.life<=0){straw.mesh.visible=false;}
  }
  if(!paused) hayLevel=THREE.MathUtils.clamp(hayLevel-dt*.006+offer*dt*.12,.58,1.04);
  hayPile.scale.y=hayLevel;
  hayPile.position.y=(hayLevel-1)*.12;

  horses.forEach((horse,index)=>{
    const chew=Math.sin(t*6.2+horse.phase);
    const restCycle=(t+horse.phase*1.4)%8;
    const headLift=between(restCycle,5.5,6.15)*(1-between(restCycle,7.1,7.7));
    const eating=headLift<.18 && hayLevel>.57;
    horse.headRig.rotation.z=-2.02+headLift*.62+Math.sin(t*1.15+horse.phase)*.025;
    horse.headRig.rotation.x=Math.sin(t*.53+horse.phase)*.025;
    horse.jaw.rotation.z=.04+(eating?(chew+1)*.055:0);
    horse.jaw.position.y=1.08-(eating?(chew+1)*.018:0);
    horse.headRig.children[2].scale.y=1+(eating?chew*.018:0);
    horse.mouthHay.visible=eating && chew>-.45;
    if(eating&&!paused){
      horse.crumbTimer+=dt;
      if(horse.crumbTimer>.24){ if(random()>.28)spawnStraw(horse.mouthHay,true); horse.crumbTimer=0; }
    }
    horse.tail.rotation.x=Math.sin(t*1.3+horse.phase)*.24;
    horse.tail.rotation.z=.1+Math.sin(t*1.55+horse.phase)*.12;
    horse.legs.forEach((leg,i)=>leg.rotation.z=Math.sin(t*.7+horse.phase+i)*.015);
    horse.root.position.y=Math.sin(t*.8+horse.phase)*.012;
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
