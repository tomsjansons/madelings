import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import './style.css';

const host = document.querySelector('#scene');
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x070a0f, 0.028);

const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 60);
camera.position.set(11.8, 9.8, 15.2);
camera.lookAt(0, 0.8, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(host.clientWidth, host.clientHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
host.prepend(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 0.8, 0);
controls.minDistance = 8;
controls.maxDistance = 22;
controls.maxPolarAngle = Math.PI * 0.47;
controls.minPolarAngle = 0.3;
controls.enablePan = false;

const hemi = new THREE.HemisphereLight(0xbad8ed, 0x211712, 1.75);
scene.add(hemi);
const key = new THREE.SpotLight(0xffdfc5, 120, 32, Math.PI / 4, 0.62, 1.15);
key.position.set(5, 12, 8); key.castShadow = true; key.shadow.mapSize.set(1024, 1024); scene.add(key);
const blueLight = new THREE.PointLight(0x39aadd, 20, 14); blueLight.position.set(-5, 4, -4); scene.add(blueLight);
const orangeLight = new THREE.PointLight(0xff542b, 18, 13); orangeLight.position.set(5, 3, 4); scene.add(orangeLight);

const MAT = {
  dark: new THREE.MeshStandardMaterial({ color: 0x14191f, metalness: .75, roughness: .3 }),
  black: new THREE.MeshStandardMaterial({ color: 0x20252b, metalness: .82, roughness: .23 }),
  white: new THREE.MeshStandardMaterial({ color: 0xd8d5cc, metalness: .55, roughness: .3 }),
  orange: new THREE.MeshStandardMaterial({ color: 0xef5427, metalness: .62, roughness: .25, emissive: 0x3b0b02 }),
  blue: new THREE.MeshStandardMaterial({ color: 0x3195c7, metalness: .65, roughness: .24, emissive: 0x031b2a }),
  rubber: new THREE.MeshStandardMaterial({ color: 0x080a0d, roughness: .72 }),
  brass: new THREE.MeshStandardMaterial({ color: 0xb88b4b, metalness: .9, roughness: .24 })
};
const mesh = (geo, mat, shadows = true) => { const m = new THREE.Mesh(geo, mat); m.castShadow = shadows; m.receiveShadow = shadows; return m; };

// Arena platform and chess table
const floor = mesh(new THREE.CylinderGeometry(9, 9.5, .28, 64), MAT.dark);
floor.position.y = -.35; scene.add(floor);
for (const [r, color] of [[8.25, 0x29313a], [7.7, 0x161c23]]) {
  const ring = mesh(new THREE.TorusGeometry(r, .018, 8, 128), new THREE.MeshBasicMaterial({ color }));
  ring.rotation.x = Math.PI / 2; ring.position.y = -.19; scene.add(ring);
}
const table = mesh(new THREE.BoxGeometry(8.2, .45, 8.2), MAT.black);
table.position.y = .05; scene.add(table);
const edge = mesh(new THREE.BoxGeometry(7.68, .08, 7.68), MAT.brass);
edge.position.y = .315; scene.add(edge);
const boardBase = mesh(new THREE.BoxGeometry(7.48, .18, 7.48), MAT.dark);
boardBase.position.y = .39; scene.add(boardBase);

const squareSize = .9;
const lightSquare = new THREE.MeshStandardMaterial({ color: 0xb8b4a9, roughness: .55, metalness: .13 });
const darkSquare = new THREE.MeshStandardMaterial({ color: 0x30363b, roughness: .58, metalness: .2 });
const squareGeo = new THREE.BoxGeometry(squareSize, .08, squareSize);
for (let file = 0; file < 8; file++) for (let rank = 0; rank < 8; rank++) {
  const sq = mesh(squareGeo, (file + rank) % 2 ? lightSquare : darkSquare);
  sq.position.set((file - 3.5) * squareSize, .53, (3.5 - rank) * squareSize);
  scene.add(sq);
}

function squarePos(notation) {
  return new THREE.Vector3((notation.charCodeAt(0) - 97 - 3.5) * squareSize, .7, (3.5 - (Number(notation[1]) - 1)) * squareSize);
}

function pieceGeometry(kind) {
  const profiles = {
    pawn: [[0,.18],[.28,.18],[.32,.25],[.20,.32],[.15,.58],[.28,.72],[.24,.85],[0,.99]],
    rook: [[0,.18],[.34,.18],[.38,.28],[.24,.36],[.21,.82],[.34,.87],[.34,1.02],[.25,1.1],[0,1.1]],
    knight: [[0,.18],[.34,.18],[.37,.27],[.23,.37],[.25,.74],[.13,.98],[.28,1.18],[.10,1.24],[0,1.18]],
    bishop: [[0,.18],[.34,.18],[.38,.27],[.22,.37],[.17,.82],[.27,1.02],[.13,1.21],[0,1.28]],
    queen: [[0,.18],[.37,.18],[.4,.28],[.23,.38],[.18,.9],[.35,1.08],[.29,1.18],[.38,1.3],[.16,1.25],[0,1.38]],
    king: [[0,.18],[.38,.18],[.41,.28],[.24,.38],[.19,.94],[.32,1.08],[.25,1.2],[.08,1.2],[.08,1.32],[.18,1.32],[.18,1.4],[0,1.4]]
  };
  return new THREE.LatheGeometry(profiles[kind].map(([x,y]) => new THREE.Vector2(x,y)), 20);
}

const pieces = new Map();
function addPiece(kind, color, at) {
  const material = color === 'white' ? MAT.white : MAT.black;
  const p = mesh(pieceGeometry(kind), material); p.scale.setScalar(.72);
  p.position.copy(squarePos(at)); p.userData = { kind, color, square: at };
  scene.add(p); pieces.set(at, p);
  if (kind === 'knight') {
    const ear = mesh(new THREE.ConeGeometry(.075, .25, 5), material);
    ear.position.set(.07, .9, -.05); ear.rotation.z = -.25; p.add(ear);
  }
  return p;
}
const back = ['rook','knight','bishop','queen','king','bishop','knight','rook'];
for (let f = 0; f < 8; f++) {
  const file = String.fromCharCode(97 + f);
  addPiece(back[f], 'white', `${file}1`); addPiece('pawn', 'white', `${file}2`);
  addPiece(back[f], 'black', `${file}8`); addPiece('pawn', 'black', `${file}7`);
}

// Robots are assembled from simple industrial forms.
function createRobot(name, accent, position, facing) {
  const g = new THREE.Group(); g.position.copy(position); g.rotation.y = facing; scene.add(g);
  const base = mesh(new THREE.CylinderGeometry(.72, .9, .32, 16), MAT.rubber); base.position.y = .02; g.add(base);
  const column = mesh(new THREE.CylinderGeometry(.42, .55, 1.12, 12), MAT.dark); column.position.y = .7; g.add(column);
  const chest = mesh(new THREE.BoxGeometry(1.45, 1.35, .82), MAT.black); chest.position.y = 1.62; chest.geometry.translate(0, .05, 0); g.add(chest);
  const panel = mesh(new THREE.BoxGeometry(.86, .55, .06), accent); panel.position.set(0, 1.66, -.44); g.add(panel);
  for (let i = -1; i <= 1; i++) { const slit = mesh(new THREE.BoxGeometry(.15,.035,.025), MAT.rubber,false); slit.position.set(i*.23,1.68,-.48); g.add(slit); }
  const neck = mesh(new THREE.CylinderGeometry(.2,.25,.28,12), MAT.brass); neck.position.y=2.45; g.add(neck);
  const headPivot = new THREE.Group(); headPivot.position.y=2.7; g.add(headPivot);
  const head = mesh(new THREE.BoxGeometry(1.02,.68,.78), MAT.black); headPivot.add(head);
  const brow = mesh(new THREE.BoxGeometry(.82,.13,.07), accent); brow.position.set(0,.08,-.42); headPivot.add(brow);
  for (const x of [-.23,.23]) { const eye = mesh(new THREE.SphereGeometry(.055,12,8), new THREE.MeshBasicMaterial({color:0xeef8ff})); eye.position.set(x,.08,-.48); headPivot.add(eye); }
  const antenna = mesh(new THREE.CylinderGeometry(.025,.025,.38,8), MAT.brass); antenna.position.set(.3,.52,0); headPivot.add(antenna);
  const tip = mesh(new THREE.SphereGeometry(.07,10,8), accent); tip.position.set(.3,.73,0); headPivot.add(tip);
  const shoulderDecor = [];
  for (const x of [-.93,.93]) { const s=mesh(new THREE.SphereGeometry(.32,16,10),accent); s.position.set(x,2.05,0);g.add(s); shoulderDecor.push(s); }
  const staticArm = mesh(new THREE.CylinderGeometry(.15,.19,1.25,10),MAT.dark); staticArm.position.set(-.95,1.35,0); staticArm.rotation.z=-.13; g.add(staticArm);
  const hand = mesh(new THREE.BoxGeometry(.35,.3,.4),accent); hand.position.set(-1.03,.7,-.03);g.add(hand);
  const badge = document.querySelector(`.${name === 'AXIOM' ? 'player-a' : 'player-b'} .portrait`);
  badge.title = name;
  return { group:g, head:headPivot, accent, shoulderLocal:new THREE.Vector3(.93,2.05,0), idlePhase:Math.random()*4 };
}
// Robot faces point along local -Z, so each unit looks toward the board.
const robotWhite = createRobot('AXIOM', MAT.orange, new THREE.Vector3(0, .15, 6.1), 0);
const robotBlack = createRobot('VEKTOR', MAT.blue, new THREE.Vector3(0, .15, -6.1), Math.PI);

function createActiveArm(robot) {
  const upper = mesh(new THREE.CylinderGeometry(.18,.22,1,10), MAT.dark);
  const lower = mesh(new THREE.CylinderGeometry(.14,.18,1,10), MAT.black);
  const elbow = mesh(new THREE.SphereGeometry(.24,14,10), robot.accent);
  const hand = mesh(new THREE.BoxGeometry(.38,.28,.48), robot.accent);
  scene.add(upper,lower,elbow,hand); return {upper,lower,elbow,hand};
}
robotWhite.arm=createActiveArm(robotWhite); robotBlack.arm=createActiveArm(robotBlack);
function alignRod(rod,a,b){const d=b.clone().sub(a);rod.position.copy(a).addScaledVector(d,.5);rod.scale.set(1,d.length(),1);rod.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());}
function poseArm(robot,target,reach=1){
  const shoulder=robot.shoulderLocal.clone().applyMatrix4(robot.group.matrixWorld);
  const rest=new THREE.Vector3(shoulder.x+(robot===robotWhite?-.1:.1),1.3,shoulder.z+(robot===robotWhite?-.35:.35));
  const hand=rest.lerp(target,reach);
  const outward=robot===robotWhite?1:-1;
  const elbow=shoulder.clone().lerp(hand,.48); elbow.x+=.42*outward; elbow.y+=.45;
  alignRod(robot.arm.upper,shoulder,elbow);alignRod(robot.arm.lower,elbow,hand);
  robot.arm.elbow.position.copy(elbow);robot.arm.hand.position.copy(hand);robot.arm.hand.rotation.y=robot.group.rotation.y;
}

// Move choreography
const moves=[
  {from:'e2',to:'e4',robot:robotWhite,label:'E2 — E4'},
  {from:'e7',to:'e5',robot:robotBlack,label:'E7 — E5'},
  {from:'g1',to:'f3',robot:robotWhite,label:'G1 — F3'},
  {from:'b8',to:'c6',robot:robotBlack,label:'B8 — C6'}
];
let elapsed=0, paused=false, lastMove=-1, initialized=false, lightMode=false;
const moveDuration=7.5;
const smooth=t=>t*t*(3-2*t);
function resetMatch(){
  for(const move of moves){const piece=pieces.get(move.to);if(piece&&piece.userData.square===move.to){pieces.delete(move.to);piece.userData.square=move.from;piece.position.copy(squarePos(move.from));pieces.set(move.from,piece);}}
  elapsed=0;lastMove=-1;initialized=true;
}
function choreograph(t){
  const index=Math.min(Math.floor(t/moveDuration),moves.length-1); const local=(t%moveDuration)/moveDuration; const move=moves[index];
  if(index!==lastMove){ lastMove=index; document.querySelector('#move-number').textContent=`MOVE ${String(index+1).padStart(2,'0')}`;document.querySelector('#move-label').textContent=move.label; }
  const piece=pieces.get(move.from)||pieces.get(move.to); if(!piece)return;
  const start=squarePos(move.from),end=squarePos(move.to); let progress=0;
  if(local>.28)progress=smooth(Math.min(1,(local-.28)/.42));
  piece.position.lerpVectors(start,end,progress);piece.position.y+=Math.sin(progress*Math.PI)*.8;
  const target=piece.position.clone().add(new THREE.Vector3(0,.65,0));
  const reach=local<.25?smooth(local/.25):local>.75?smooth((1-local)/.25):1;
  poseArm(move.robot,target,reach);poseArm(move.robot===robotWhite?robotBlack:robotWhite,new THREE.Vector3(0,1,0),0);
  move.robot.head.rotation.y=Math.sin(local*Math.PI)*.12*(move.robot===robotWhite?1:-1);
  if(local>.72&&piece.userData.square===move.from){pieces.delete(move.from);pieces.set(move.to,piece);piece.userData.square=move.to;}
}

const clock=new THREE.Clock();
function animate(){
  requestAnimationFrame(animate); const dt=Math.min(clock.getDelta(),.05);
  if(!paused){elapsed+=dt;if(elapsed>=moves.length*moveDuration+1.5)resetMatch();}
  if(initialized)choreograph(elapsed);
  const breathe=performance.now()*.001;
  robotWhite.group.position.y=.15+Math.sin(breathe*1.2)*.025;robotBlack.group.position.y=.15+Math.sin(breathe*1.1+2)*.025;
  const glowScale=lightMode?.72:1;
  blueLight.intensity=(14+Math.sin(breathe*1.7)*2)*glowScale;orangeLight.intensity=(13+Math.sin(breathe*1.5)*2)*glowScale;
  controls.update();renderer.render(scene,camera);
}

function resize(){const w=host.clientWidth,h=host.clientHeight;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h);}
function applyTheme(useLight, persist=false){
  lightMode=useLight;
  document.body.classList.toggle('light-mode',useLight);
  scene.fog.color.set(useLight?0xdde3e4:0x070a0f);
  scene.fog.density=useLight?.018:.028;
  renderer.toneMappingExposure=useLight?1.3:1.15;
  hemi.color.set(useLight?0xffffff:0xa8c8de);
  hemi.groundColor.set(useLight?0x8f989c:0x16100d);
  hemi.intensity=useLight?2.15:1.75;
  key.intensity=useLight?145:120;
  const button=document.querySelector('#theme-toggle');
  button.innerHTML=useLight?'<span>☾</span> DARK MODE':'<span>☼</span> LIGHT MODE';
  button.setAttribute('aria-label',useLight?'Switch to dark mode':'Switch to light mode');
  if(persist)localStorage.setItem('robot-chess-theme',useLight?'light':'dark');
}
window.addEventListener('resize',resize);
document.querySelector('#toggle').addEventListener('click',e=>{paused=!paused;e.currentTarget.innerHTML=paused?'<span>▶</span> RESUME':'<span>Ⅱ</span> PAUSE';});
document.querySelector('#restart').addEventListener('click',resetMatch);
document.querySelector('#theme-toggle').addEventListener('click',()=>applyTheme(!lightMode,true));
const savedTheme=localStorage.getItem('robot-chess-theme');
applyTheme(savedTheme?savedTheme==='light':matchMedia('(prefers-color-scheme: light)').matches);
resetMatch();resize();animate();
