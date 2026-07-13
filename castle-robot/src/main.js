import * as THREE from 'three';
import './style.css';
import { getRobotSurfaceY } from './terrain.js';

const canvas = document.querySelector('#scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x7b9290);
scene.fog = new THREE.Fog(0x728886, 95, 240);
const camera = new THREE.PerspectiveCamera(43, innerWidth / innerHeight, .1, 260);
const clock = new THREE.Clock();

const mat = (color, roughness = .8, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
const groundMat = mat(0x52634d, 1);
const roadMat = mat(0x686c68, .96);
const orange = mat(0x9b4d20, .85);
const orangeDark = mat(0x5f2c17, .9);
const stoneDark = mat(0x382d28, .9);
const firMat = mat(0x143f2a, .98);
const firLight = mat(0x1f5637, .96);
const trunkMat = mat(0x3e2b20, 1);
const waterMat = new THREE.MeshStandardMaterial({ color: 0x1c6471, roughness: .25, metalness: .15, transparent: true, opacity: .92 });

scene.add(new THREE.HemisphereLight(0xc9ddd4, 0x283426, 1.8));
const sun = new THREE.DirectionalLight(0xffd7a2, 3.4);
sun.position.set(-38, 58, 34); sun.castShadow = true; sun.shadow.mapSize.set(2048,2048);
sun.shadow.camera.left = -60; sun.shadow.camera.right = 60; sun.shadow.camera.top = 70; sun.shadow.camera.bottom = -55; sun.shadow.camera.far = 170;
scene.add(sun);

const ground = new THREE.Mesh(new THREE.PlaneGeometry(280,280), groundMat);
ground.rotation.x = -Math.PI/2; ground.receiveShadow = true; scene.add(ground);
const road = new THREE.Mesh(new THREE.PlaneGeometry(10,156), roadMat);
road.rotation.x = -Math.PI/2; road.position.set(0,.025,18); road.receiveShadow = true; scene.add(road);
// Road edge stones.
for (const x of [-5.25,5.25]) for (let z=-57; z<92; z+=4.6) {
  const curb = new THREE.Mesh(new THREE.BoxGeometry(.55,.18,3.8), mat(0x85847c,1));
  curb.position.set(x,.1,z); curb.receiveShadow = curb.castShadow = true; scene.add(curb);
}

// A broad moat and drawbridge guard the enlarged citadel.
const moat = new THREE.Mesh(new THREE.PlaneGeometry(125,18), waterMat);
moat.rotation.x = -Math.PI/2; moat.position.set(0,.04,-63); scene.add(moat);
const bridge = new THREE.Mesh(new THREE.BoxGeometry(10.5,.75,19), mat(0x574130,.95));
bridge.position.set(0,.32,-63); bridge.castShadow = bridge.receiveShadow = true; scene.add(bridge);
for (let z=-71; z<=-55; z+=2) { const plank = new THREE.Mesh(new THREE.BoxGeometry(10.3,.13,1.65), mat(0x75563c,1)); plank.position.set(0,.76,z); plank.castShadow = true; scene.add(plank); }
for (const x of [-5.05,5.05]) { const rail = new THREE.Mesh(new THREE.BoxGeometry(.18,1.3,18), stoneDark); rail.position.set(x,1,-63); scene.add(rail); }

// Emberkeep is a full citadel: 90 metres wide with a deep, explorable inner ward.
const castle = new THREE.Group();
function box(w,h,d,x,y,z,material=orange) { const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material); m.position.set(x,y,z); m.castShadow=m.receiveShadow=true; castle.add(m); return m; }
function cylinder(rt,rb,h,x,y,z,material=orange,segments=12) { const m=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,segments),material); m.position.set(x,y,z); m.castShadow=m.receiveShadow=true; castle.add(m); return m; }
const floorMat=mat(0x493e36,1), warmStone=mat(0x79411f,.92), creamStone=mat(0xb58c60,.95), timber=mat(0x4b2e1d,.95);

// Monumental front curtain wall and four corner towers.
box(34,21,10,-22,10.5,-7); box(34,21,10,22,10.5,-7); box(10,10,10,0,16,-7,orangeDark);
for (const [x,z] of [[-42,-7],[42,-7],[-42,-69],[42,-69]]) {
  cylinder(7.5,8.5,31,x,15.5,z,orange,16); cylinder(9,9,2,x,31,z,orangeDark,16);
  for(let a=0;a<Math.PI*2;a+=Math.PI/4) box(2.2,3,2.2,x+Math.cos(a)*7.3,33,z+Math.sin(a)*7.3,orangeDark);
}
box(4,12,67,-40,6,-38,orangeDark); box(4,12,67,40,6,-38,orangeDark); box(84,12,4,0,6,-71,orangeDark);
box(76,.35,66,0,.16,-38,floorMat);

// Crenellations ring the walls and make the castle feel truly massive.
for(let x=-37;x<=37;x+=6) { box(3.2,3,2.6,x,22.5,-2.7,orangeDark); box(3.2,3,2.6,x,13.5,-71,orangeDark); }
for(let z=-63;z<=-12;z+=6) { box(2.6,3,3.2,-40,13.5,z,orangeDark); box(2.6,3,3.2,40,13.5,z,orangeDark); }

// Two heavy gate leaves swing open when the robot approaches.
const leftGatePivot = new THREE.Group(); leftGatePivot.position.set(-5,0,-1.45);
const rightGatePivot = new THREE.Group(); rightGatePivot.position.set(5,0,-1.45);
const leftGate = new THREE.Mesh(new THREE.BoxGeometry(4.9,10,.65),stoneDark); leftGate.position.set(2.45,5,0); leftGate.castShadow=true;
const rightGate = new THREE.Mesh(new THREE.BoxGeometry(4.9,10,.65),stoneDark); rightGate.position.set(-2.45,5,0); rightGate.castShadow=true;
leftGatePivot.add(leftGate); rightGatePivot.add(rightGate); castle.add(leftGatePivot,rightGatePivot);
const arch = new THREE.Mesh(new THREE.TorusGeometry(5,1.2,8,28,Math.PI),orange); arch.rotation.z=Math.PI; arch.position.set(0,11,-1.2); castle.add(arch);

// Climbable western wall: a broad stone ramp reaches a raised shooting gallery.
const wallWalk=box(7,1,67,-39.5,9.5,-38,creamStone); wallWalk.receiveShadow=true;
const ramp=box(Math.sqrt(200),.6,14,-33,5,-44,creamStone); ramp.rotation.z=-Math.PI/4;
for(let z=-65;z<=-12;z+=5) box(2.2,2.4,1.2,-36.2,11.2,z,orangeDark);
for(let z=-62;z<=-18;z+=11) {
  const galleryTarget=cylinder(1.3,1.3,.25,-39.2,12.6,z,mat(0xd8c29b,.8),24); galleryTarget.rotation.x=Math.PI/2;
  cylinder(.72,.72,.28,-39.2,12.6,z,mat(0xa93425,.7),24).rotation.x=Math.PI/2;
}

// Ballroom in the western wing, with a patterned dance floor and chandeliers.
box(30,.22,26,-20,.34,-25,mat(0xc8a475,.88));
box(1,7,26,-35,3.5,-25,warmStone); box(30,7,1,-20,3.5,-38,warmStone);
for(let x=-32;x<=-10;x+=4) for(let z=-35;z<=-15;z+=4) if(((x+z)/4)%2===0) box(3.8,.05,3.8,x,.49,z,mat(0x6b3323,.95));
for(const x of [-28,-20,-12]) {
  box(.08,5,.08,x,8,-25,stoneDark);
  const chandelier=new THREE.Mesh(new THREE.TorusGeometry(1.7,.12,8,20),mat(0xb8893b,.35,.6)); chandelier.rotation.x=Math.PI/2; chandelier.position.set(x,5.6,-25); castle.add(chandelier);
  const glowLight=new THREE.PointLight(0xffbd65,3,13,2); glowLight.position.set(x,5.4,-25); castle.add(glowLight);
}

// Stable in the eastern wing: timber stalls, hay and four stylised horses.
box(29,.25,26,22,.32,-25,mat(0x66513a,1)); box(1,7,26,36.5,3.5,-25,warmStone); box(29,7,1,22,3.5,-38,warmStone);
for(const x of [11,18,25,32]) { box(.3,3.4,11,x-2.8,1.7,-25,timber); box(5.3,1.2,.35,x,1,-18.5,timber); }
function createHorse(x,z,color) {
  const horse=new THREE.Group(); const horseMat=mat(color,.86);
  const body=new THREE.Mesh(new THREE.CapsuleGeometry(.75,2,6,10),horseMat); body.rotation.z=Math.PI/2; body.position.y=2.3;
  const neck=new THREE.Mesh(new THREE.CapsuleGeometry(.38,1.2,5,8),horseMat); neck.rotation.z=-.35; neck.position.set(1.25,3.2,0);
  const head=new THREE.Mesh(new THREE.BoxGeometry(1.1,.8,.7),horseMat); head.position.set(1.65,4.05,0);
  horse.add(body,neck,head); for(const lx of [-.85,.85]) for(const lz of [-.42,.42]) { const leg=new THREE.Mesh(new THREE.CylinderGeometry(.14,.18,2,7),horseMat); leg.position.set(lx,1,lz); horse.add(leg); }
  horse.position.set(x,0,z); horse.rotation.y=Math.PI/2; castle.add(horse); return horse;
}
const horses=[createHorse(11,-26,0x7a3f25),createHorse(18,-26,0x3e2a20),createHorse(25,-26,0xb27a4e),createHorse(32,-26,0xd1c0a0)];
for(const x of [11,18,25,32]) { const hay=new THREE.Mesh(new THREE.CylinderGeometry(.7,.7,1.8,12),mat(0xb6943d,1)); hay.rotation.z=Math.PI/2; hay.position.set(x,.75,-33); castle.add(hay); }

// Ground-level bow range: shooting lines, bow racks, arrows and layered targets.
box(29,.18,27,22,.3,-55,mat(0x5d513c,1)); box(1,6,27,36.5,3,-55,warmStone);
for(const x of [12,20,28,34]) {
  box(.08,.08,20,x,.48,-54,mat(0xd6b46a,.8));
  box(.18,3,.18,x,1.5,-64,timber);
  const target=cylinder(1.8,1.8,.35,x,3.3,-66.2,mat(0xdfc9a1,.8),28); target.rotation.x=Math.PI/2;
  const ring=cylinder(1.1,1.1,.38,x,3.3,-66,mat(0xb63b27,.75),28); ring.rotation.x=Math.PI/2;
  const bull=cylinder(.38,.38,.4,x,3.3,-65.8,mat(0xe9bd3c,.65),24); bull.rotation.x=Math.PI/2;
}
for(const x of [15,25,33]) { const bow=new THREE.Mesh(new THREE.TorusGeometry(.9,.06,6,20,Math.PI),timber); bow.rotation.z=Math.PI/2; bow.position.set(x,1.5,-43); castle.add(bow); }

// The king's throne room occupies the entire rear keep.
box(31,.26,28,0,.35,-55,mat(0x73503c,.95)); box(1.2,12,28,-15.5,6,-55,orangeDark); box(1.2,12,28,15.5,6,-55,orangeDark); box(32,12,1.2,0,6,-69,orangeDark);
box(6,.12,26,0,.52,-55,mat(0x862d22,.85));
for(const x of [-11,11]) for(const z of [-45,-54,-63]) cylinder(.7,.85,10,x,5,z,creamStone,12);
box(8,1.4,5,0,1,-64,orange); box(5.2,7,1,0,4.6,-67,orange);
const throneCrown=new THREE.Mesh(new THREE.TorusGeometry(2,.25,8,20,Math.PI),mat(0xd39a35,.4,.55)); throneCrown.position.set(0,7.8,-66.4); castle.add(throneCrown);
const throneGlow = new THREE.PointLight(0xff9b42,7,25,2); throneGlow.position.set(0,6,-62); castle.add(throneGlow);

const windowMat = new THREE.MeshStandardMaterial({color:0xf2b34f,emissive:0xff7a20,emissiveIntensity:2.2});
for (const x of [-42,-22,0,22,42]) for (const y of [11,17]) { const win=box(1.5,2.8,.2,x,y,-1.85,windowMat); win.castShadow=false; }
const flags=[];
for (const x of [-42,0,42]) { box(.18,8,.18,x,x===0?30:37,-7,stoneDark); const flag=new THREE.Mesh(new THREE.PlaneGeometry(5,2.5),mat(0xd69a39,.55)); flag.position.set(x+2.5,x===0?33:40,-7); castle.add(flag); flags.push(flag); }
castle.position.z=-75; scene.add(castle);

// Fir-lined avenue.
let seed=91827; const random=()=>((seed=(seed*16807)%2147483647)-1)/2147483646;
const trees=[];
function addFir(x,z,s=1) { const tree=new THREE.Group(); const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.35,.5,4,7),trunkMat); trunk.position.y=2; trunk.castShadow=true; tree.add(trunk); for(let i=0;i<3;i++){ const crown=new THREE.Mesh(new THREE.ConeGeometry(2.5-i*.38,4.4,9),i%2?firLight:firMat); crown.position.y=3.9+i*2; crown.castShadow=true; tree.add(crown); } tree.position.set(x,0,z); tree.scale.setScalar(s); tree.rotation.y=random()*Math.PI; scene.add(tree); trees.push(tree); }
for(let z=-48;z<94;z+=8){ for(const side of [-1,1]){ addFir(side*(9+random()*2),z+(random()-.5)*2,.85+random()*.3); if(random()>.2)addFir(side*(15+random()*5),z+(random()-.5)*5,.75+random()*.45); } }

// Yellow walking robot rig.
const yellow=mat(0xf0b51c,.3,.45), yellowLight=mat(0xffdc44,.28,.3), joint=mat(0x2b3030,.25,.75);
const glow=new THREE.MeshStandardMaterial({color:0xbfeeff,emissive:0x43cfff,emissiveIntensity:3});
const robot=new THREE.Group();
function robotMesh(geo,material,x,y,z=0){const m=new THREE.Mesh(geo,material);m.position.set(x,y,z);m.castShadow=true;robot.add(m);return m;}
robotMesh(new THREE.BoxGeometry(2.25,2.35,1.35),yellow,0,4.1);
robotMesh(new THREE.BoxGeometry(1.75,.65,1.1),joint,0,2.65);
robotMesh(new THREE.CylinderGeometry(.25,.25,.35,10),joint,0,5.45);
robotMesh(new THREE.BoxGeometry(1.9,1.5,1.5),yellowLight,0,6.35);
robotMesh(new THREE.BoxGeometry(1.45,.65,.08),joint,0,6.3,.79);
for(const x of [-.42,.42]) robotMesh(new THREE.SphereGeometry(.12,10,7),glow,x,6.35,.86);
robotMesh(new THREE.CylinderGeometry(.035,.035,.62,6),joint,0,7.4); robotMesh(new THREE.SphereGeometry(.11,8,6),yellowLight,0,7.75);
const limbs={};
function limb(name,x,y,arm=false){const pivot=new THREE.Group();pivot.position.set(x,y,0);robot.add(pivot);const upper=new THREE.Mesh(new THREE.CapsuleGeometry(arm?.24:.3,arm?1:1.05,4,8),yellow);upper.position.y=arm?-.68:-.75;upper.castShadow=true;const lower=new THREE.Mesh(new THREE.CapsuleGeometry(arm?.2:.27,arm?.75:.82,4,8),yellowLight);lower.position.y=arm?-1.7:-1.88;lower.castShadow=true;pivot.add(upper,lower);if(!arm){const foot=new THREE.Mesh(new THREE.BoxGeometry(.7,.36,1),joint);foot.position.set(0,-2.48,.2);foot.castShadow=true;pivot.add(foot);}limbs[name]=pivot;}
limb('la',-1.35,4.95,true);limb('ra',1.35,4.95,true);limb('ll',-.55,2.55);limb('rl',.55,2.55);
robot.scale.setScalar(.62); robot.position.set(0,0,86); robot.rotation.y=Math.PI; scene.add(robot);

// Low mist particles.
const dustGeo=new THREE.BufferGeometry(), dustCount=90, positions=new Float32Array(dustCount*3);
for(let i=0;i<dustCount;i++){positions[i*3]=(random()-.5)*55;positions[i*3+1]=.5+random()*8;positions[i*3+2]=-45+random()*145;}dustGeo.setAttribute('position',new THREE.BufferAttribute(positions,3));
const dust=new THREE.Points(dustGeo,new THREE.PointsMaterial({color:0xffd69b,size:.1,transparent:true,opacity:.55,depthWrite:false}));scene.add(dust);

// The ground range and wall gallery are playable: press Space to loose an arrow.
const arrows=[];
const atShootingRange=()=> (robot.position.x>7&&robot.position.z<-115) || (robot.position.x<-35&&robot.position.z<-90);
function fireArrow(){
  if(!atShootingRange()) return;
  const direction=new THREE.Vector3(Math.sin(robot.rotation.y),.04,Math.cos(robot.rotation.y)).normalize();
  const arrow=new THREE.Group();
  const shaft=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,1.7,6),timber);
  const tip=new THREE.Mesh(new THREE.ConeGeometry(.09,.3,6),stoneDark); tip.position.y=.98;
  arrow.add(shaft,tip); arrow.position.copy(robot.position).add(new THREE.Vector3(0,2.8,0)).addScaledVector(direction,1.2);
  arrow.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction); scene.add(arrow); arrows.push({mesh:arrow,velocity:direction.multiplyScalar(22),life:0});
}

const keys={}; let walk=0, arrived=false, cameraPitch=0, resetCamera=false;
const intro=document.querySelector('#intro');
function begin(){intro.classList.add('hidden');canvas.focus();}
document.querySelector('#start').addEventListener('click',begin);
window.addEventListener('keydown',e=>{
  if(e.key.startsWith('Arrow')){e.preventDefault();keys[e.code]=true;begin();}
  if(e.code==='Space'&&!e.repeat){e.preventDefault();begin();fireArrow();}
});
window.addEventListener('keyup',e=>{keys[e.code]=false;});
document.querySelectorAll('[data-key]').forEach(button=>{const key=button.dataset.key;const down=e=>{e.preventDefault();keys[key]=true;begin();};const up=e=>{e.preventDefault();keys[key]=false;};button.addEventListener('pointerdown',down);button.addEventListener('pointerup',up);button.addEventListener('pointercancel',up);button.addEventListener('pointerleave',up);});

// Drag horizontally to turn exactly as the arrow keys do; drag vertically to tilt the chase camera.
let dragging=false,lastPointerX=0,lastPointerY=0;
canvas.addEventListener('pointerdown',event=>{if(event.button!==0)return;dragging=true;lastPointerX=event.clientX;lastPointerY=event.clientY;canvas.setPointerCapture(event.pointerId);begin();});
canvas.addEventListener('pointermove',event=>{if(!dragging)return;const dx=event.clientX-lastPointerX,dy=event.clientY-lastPointerY;robot.rotation.y-=dx*.008;cameraPitch=THREE.MathUtils.clamp(cameraPitch-dy*.035,-4.5,7);lastPointerX=event.clientX;lastPointerY=event.clientY;});
const stopDrag=event=>{dragging=false;if(canvas.hasPointerCapture(event.pointerId))canvas.releasePointerCapture(event.pointerId);};
canvas.addEventListener('pointerup',stopDrag);canvas.addEventListener('pointercancel',stopDrag);
document.querySelector('#camera-reset').addEventListener('click',()=>{cameraPitch=0;resetCamera=true;});
document.querySelector('#mobile-shoot').addEventListener('click',()=>{begin();fireArrow();});

const targetCamera=new THREE.Vector3(), lookTarget=new THREE.Vector3(), forward=new THREE.Vector3();
function animate(){requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.04),t=clock.elapsedTime;const turn=(keys.ArrowLeft?1:0)-(keys.ArrowRight?1:0),move=(keys.ArrowUp?1:0)-(keys.ArrowDown?1:0);
  robot.rotation.y+=turn*dt*1.65;
  if(move){forward.set(Math.sin(robot.rotation.y),0,Math.cos(robot.rotation.y));robot.position.addScaledVector(forward,move*dt*6);robot.position.x=THREE.MathUtils.clamp(robot.position.x,-44,44);robot.position.z=THREE.MathUtils.clamp(robot.position.z,-150,92);walk+=dt*9*move;}
  const stride=move?Math.sin(walk)*.6:Math.sin(t*2)*.02;limbs.ll.rotation.x=stride;limbs.rl.rotation.x=-stride;limbs.la.rotation.x=-stride*.8;limbs.ra.rotation.x=stride*.8;
  const surfaceY=getRobotSurfaceY(robot.position.x,robot.position.z);const bob=move?Math.abs(Math.sin(walk*2))*.07:Math.sin(t*2)*.02;robot.position.y=THREE.MathUtils.lerp(robot.position.y,surfaceY+bob,1-Math.pow(.00001,dt));
  const gateOpen=robot.position.z<-67;leftGatePivot.rotation.y=THREE.MathUtils.lerp(leftGatePivot.rotation.y,gateOpen?Math.PI*.52:0,1-Math.pow(.001,dt));rightGatePivot.rotation.y=THREE.MathUtils.lerp(rightGatePivot.rotation.y,gateOpen?-Math.PI*.52:0,1-Math.pow(.001,dt));
  forward.set(Math.sin(robot.rotation.y),0,Math.cos(robot.rotation.y));targetCamera.copy(robot.position).addScaledVector(forward,-12).add(new THREE.Vector3(0,7.7+cameraPitch,0));lookTarget.copy(robot.position).add(new THREE.Vector3(0,3+cameraPitch*.28,0)).addScaledVector(forward,3.5);if(resetCamera){camera.position.copy(targetCamera);resetCamera=false;}else camera.position.lerp(targetCamera,1-Math.pow(.001,dt));camera.lookAt(lookTarget);
  flags.forEach((f,i)=>{f.rotation.y=Math.sin(t*2+i)*.09;f.scale.x=1+Math.sin(t*2.7+i)*.04;});waterMat.color.setHSL(.52,.55,.25+Math.sin(t*1.2)*.012);dust.rotation.y=t*.012;
  horses.forEach((horse,i)=>{horse.children[1].rotation.z=-.35+Math.sin(t*1.1+i)*.06;horse.children[2].position.y=4.05+Math.sin(t*1.1+i)*.06;});
  for(let i=arrows.length-1;i>=0;i--){const arrow=arrows[i];arrow.life+=dt;arrow.velocity.y-=dt*2.5;arrow.mesh.position.addScaledVector(arrow.velocity,dt);arrow.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),arrow.velocity.clone().normalize());if(arrow.life>4||arrow.mesh.position.y<-.5){scene.remove(arrow.mesh);arrows.splice(i,1);}}
  const location=robot.position.z>-73?'NORTH APPROACH':robot.position.z>-84?'GATEHOUSE':robot.position.x<-35?'WALL SHOOTING GALLERY':robot.position.z<-116&&robot.position.x>7?'BOW RANGE':robot.position.z<-116&&Math.abs(robot.position.x)<=16?"KING'S THRONE ROOM":robot.position.x<-5?'GRAND BALLROOM':robot.position.x>5?'ROYAL STABLES':'INNER WARD';
  document.querySelector('#location').textContent=location;document.querySelector('#activity-hint').textContent=atShootingRange()?'SPACE · SHOOT ARROW':surfaceY>5?'WEST WALL · ELEVATED':'EXPLORE THE CITADEL';
  const remaining=Math.max(0,robot.position.z+73);document.querySelector('#distance').textContent=Math.round(remaining);document.querySelector('#progress').style.width=`${THREE.MathUtils.clamp((86-robot.position.z)/159*100,0,100)}%`;
  if(!arrived&&robot.position.z<-78){arrived=true;document.querySelector('#arrival').classList.add('show');setTimeout(()=>document.querySelector('#arrival').classList.remove('show'),4000);}if(robot.position.z>-72)arrived=false;
  renderer.render(scene,camera);
}
camera.position.set(0,8,98);animate();
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,2));});
