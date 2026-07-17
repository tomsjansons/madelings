import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import './style.css';

const mount = document.querySelector('#scene');
const strokeEl = document.querySelector('#strokes');
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(mount.clientWidth, mount.clientHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
mount.prepend(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0xeee8db, 0.035);
const camera = new THREE.PerspectiveCamera(31, mount.clientWidth / mount.clientHeight, 0.1, 100);
camera.position.set(1.1, 3.4, 11.2);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 7;
controls.maxDistance = 15;
controls.minPolarAngle = Math.PI * .28;
controls.maxPolarAngle = Math.PI * .56;
controls.target.set(1, 2.25, 0);

scene.add(new THREE.HemisphereLight(0xfff8e9, 0x65756d, 2.4));
const key = new THREE.DirectionalLight(0xffefd5, 4.2);
key.position.set(-4, 8, 7); key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
key.shadow.camera.left=-8; key.shadow.camera.right=8; key.shadow.camera.top=8; key.shadow.camera.bottom=-4;
scene.add(key);
const rim = new THREE.PointLight(0xe76d46, 55, 12); rim.position.set(5, 4, 3); scene.add(rim);

const mat = (color, roughness=.55, metalness=.35) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
const dark = mat(0x26322f, .38, .65), cream = mat(0xd8d0bd, .72, .3), orange = mat(0xd95b38,.5,.25);
const blue = mat(0x3f7280,.5,.35), wood = mat(0x8a6041,.82,.05), rubber = mat(0x18201e,.85,.1);
const geo = {
  sphere:r=>new THREE.SphereGeometry(r,24,16),
  cyl:(r,h)=>new THREE.CylinderGeometry(r,r,h,20)
};
function mesh(g,m,cast=true){ const o=new THREE.Mesh(g,m); o.castShadow=cast; o.receiveShadow=true; return o; }

// Studio floor and subtle backdrop grid.
const floor = mesh(new THREE.PlaneGeometry(30,22), mat(0xd9d3c5,.96,0), false);
floor.rotation.x=-Math.PI/2; floor.position.y=0; scene.add(floor);
const grid = new THREE.GridHelper(26,26,0xbdb7a9,0xd4cec0); grid.position.y=.008;
for(const material of Array.isArray(grid.material)?grid.material:[grid.material]){material.transparent=true;material.opacity=.2}
scene.add(grid);

// Two independent easels and live canvas textures.
const canvasW=2.25, canvasH=2.72;
const frameMat=mat(0x5d4433,.78,.05);
function createEasel(x){
 const surface=document.createElement('canvas'); surface.width=480; surface.height=580;
 const ctx=surface.getContext('2d'), texture=new THREE.CanvasTexture(surface); texture.colorSpace=THREE.SRGBColorSpace;
 const center=new THREE.Vector3(x,3.0,.06);
 const panel=mesh(new THREE.BoxGeometry(canvasW,canvasH,.11),new THREE.MeshStandardMaterial({map:texture,roughness:.92,metalness:0})); panel.position.copy(center);scene.add(panel);
 for(const [dx,dy,w,h] of [[0,1.43,2.5,.12],[0,-1.43,2.5,.12],[-1.19,0,.12,2.96],[1.19,0,.12,2.96]]){const f=mesh(new THREE.BoxGeometry(w,h,.19),frameMat);f.position.copy(center).add(new THREE.Vector3(dx,dy,.01));scene.add(f)}
 for(const dx of [-.9,.9]){const leg=mesh(new THREE.BoxGeometry(.12,4.15,.16),wood);leg.position.set(x+dx,2.0,-.34);leg.rotation.z=dx*.055;scene.add(leg)}
 const back=mesh(new THREE.BoxGeometry(.13,4,.15),wood);back.position.set(x,1.8,-1.15);back.rotation.x=-.32;scene.add(back);
 const shelf=mesh(new THREE.BoxGeometry(2.72,.16,.55),wood);shelf.position.set(x,1.5,.03);scene.add(shelf);
 return {surface,ctx,texture,center,last:null};
}
const easels=[createEasel(-1.15),createEasel(2.65)];

const colorFamilies=[
 ['#e64f32','#f28c38','#f5c447','#d83c66','#a93b52','#ef6d5a'],
 ['#176b78','#3fa7a3','#244d83','#6c5ca8','#2f8b65','#7db7b1']
 ];
function createRobot(name,x,bodyColor,facing,easel,index){
 const root=new THREE.Group();root.position.set(x,0,.68);
 // Rotate the whole robot toward its own canvas rather than toward the camera.
 const toCanvas=easel.center.clone().sub(root.position);root.rotation.y=Math.atan2(toCanvas.x,toCanvas.z);scene.add(root);
 for(const dx of [-.38,.38]){const foot=mesh(new THREE.BoxGeometry(.54,.25,.75),rubber);foot.position.set(dx,.14,.05);root.add(foot);const leg=mesh(geo.cyl(.16,.9),dark);leg.position.set(dx,.72,0);root.add(leg);const knee=mesh(geo.sphere(.22),bodyColor);knee.position.set(dx,.72,.02);root.add(knee)}
 const hips=mesh(new THREE.BoxGeometry(1.15,.36,.62),dark);hips.position.y=1.25;root.add(hips);
 const torso=mesh(new THREE.BoxGeometry(1.25,1.15,.76),bodyColor);torso.position.y=1.92;root.add(torso);
 const chest=mesh(new THREE.BoxGeometry(.76,.45,.05),dark);chest.position.set(0,1.98,.405);root.add(chest);
 for(let i=0;i<3;i++){const light=mesh(geo.sphere(.055),i===0?orange:(i===1?mat(0xe8c44b):mat(0x78aa8e)));light.position.set(-.21+i*.21,2.06,.45);root.add(light)}
 const neck=mesh(geo.cyl(.18,.2),dark);neck.position.y=2.62;root.add(neck);
 const headPivot=new THREE.Group();headPivot.position.y=3.08;root.add(headPivot);
 const head=mesh(new THREE.BoxGeometry(1.04,.78,.76),bodyColor);headPivot.add(head);
 const face=mesh(new THREE.BoxGeometry(.82,.4,.055),dark);face.position.z=.405;headPivot.add(face);
 const eyes=[];for(const dx of [-.23,.23]){const eye=mesh(geo.sphere(.085),new THREE.MeshBasicMaterial({color:0xffd868}));eye.scale.z=.42;eye.position.set(dx,.03,.45);headPivot.add(eye);eyes.push(eye)}
 const antenna=mesh(geo.cyl(.035,.46),dark);antenna.position.y=.6;headPivot.add(antenna);const bulb=mesh(geo.sphere(.09),orange);bulb.position.y=.84;headPivot.add(bulb);
 const shoulderLocal=new THREE.Vector3(facing*.71,2.35,.02);const shoulder=mesh(geo.sphere(.25),bodyColor);shoulder.position.copy(shoulderLocal);root.add(shoulder);
 const upper=mesh(geo.cyl(.13,1),bodyColor),lower=mesh(geo.cyl(.115,1),dark),elbow=mesh(geo.sphere(.19),orange),hand=mesh(geo.sphere(.18),bodyColor);root.add(upper,lower,elbow,hand);
 const brush=mesh(new THREE.CylinderGeometry(.035,.045,1.04,12),wood);root.add(brush);
 const bristleMat=mat(colorFamilies[index][0],.68,.05),bristles=mesh(new THREE.ConeGeometry(.09,.25,12),bristleMat);root.add(bristles);
 // The other hand carries a real palette with six color wells.
 const paletteLocal=new THREE.Vector3(-facing*.98,1.56,.5);
 const passiveShoulder=new THREE.Vector3(-facing*.71,2.32,0);const passiveUpper=mesh(geo.cyl(.13,.72),bodyColor);passiveUpper.position.copy(passiveShoulder).add(new THREE.Vector3(-facing*.18,-.34,.1));passiveUpper.rotation.z=-facing*.48;root.add(passiveUpper);
 const passiveHand=mesh(geo.sphere(.18),bodyColor);passiveHand.position.copy(paletteLocal).add(new THREE.Vector3(facing*.08,0,-.12));root.add(passiveHand);
 const palette=mesh(new THREE.CylinderGeometry(.46,.46,.065,24),wood);palette.rotation.x=Math.PI/2;palette.position.copy(paletteLocal);root.add(palette);
 const wells=colorFamilies[index].map((c,i)=>{const a=i/6*Math.PI*2;const p=mesh(geo.sphere(.07),mat(c,.72,0));p.position.copy(paletteLocal).add(new THREE.Vector3(Math.cos(a)*.28,Math.sin(a)*.28,.07));root.add(p);return p});
 return {name,index,root,easel,facing,headPivot,eyes,bulb,upper,lower,elbow,hand,brush,bristles,bristleMat,shoulderLocal,paletteLocal,wells,mode:'new',modeStart:0,currentTip:null,currentColor:colorFamilies[index][0],stroke:null};
}
const pip=createRobot('PIP',-3.05,cream,1,easels[0],0);
const dot=createRobot('DOT',4.55,blue,-1,easels[1],1);

function alignBetween(obj,a,b){const mid=a.clone().add(b).multiplyScalar(.5),d=a.distanceTo(b);obj.position.copy(mid);obj.scale.set(1,d,1);obj.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),b.clone().sub(a).normalize())}
const rand=(a,b)=>a+Math.random()*(b-a);
const smooth=x=>x*x*(3-2*x);
const mix=(a,b,t)=>a.clone().lerp(b,smooth(Math.max(0,Math.min(1,t))));
let strokes=0;

function paper(easel){
 const {ctx,texture}=easel;ctx.fillStyle='#eee8d8';ctx.fillRect(0,0,480,580);
 for(let i=0;i<800;i++){ctx.fillStyle=`rgba(92,72,54,${Math.random()*.035})`;ctx.fillRect(Math.random()*480,Math.random()*580,Math.random()*2+1,1)}
 texture.needsUpdate=true;easel.last=null;
}
function randomColor(bot,well){
 const c=new THREE.Color(colorFamilies[bot.index][well]);const hsl={};c.getHSL(hsl);
 c.setHSL((hsl.h+rand(-.035,.035)+1)%1,Math.min(1,hsl.s*rand(.8,1.2)),Math.min(.72,Math.max(.3,hsl.l+rand(-.08,.1))));
 return `#${c.getHexString()}`;
}
function newStroke(bot){
 const kinds=['swoop','wave','spiral','zigzag','dabs'];const kind=kinds[Math.floor(Math.random()*kinds.length)];
 const s={kind,duration:rand(2.4,5.3),width:rand(5,18),alpha:rand(.56,.94),jitter:rand(.001,.009),phase:rand(0,Math.PI*2),turns:rand(1.2,3.4),
  a:{u:rand(.13,.87),v:rand(.14,.86)},b:{u:rand(.13,.87),v:rand(.14,.86)},c:{u:rand(.12,.88),v:rand(.12,.88)}};
 bot.stroke=s;bot.easel.last=null;return s;
}
function pathAt(s,p){
 let u,v;
 if(s.kind==='swoop'){const q=1-p;u=q*q*s.a.u+2*q*p*s.c.u+p*p*s.b.u;v=q*q*s.a.v+2*q*p*s.c.v+p*p*s.b.v}
 else if(s.kind==='wave'){u=s.a.u+(s.b.u-s.a.u)*p;v=s.a.v+(s.b.v-s.a.v)*p+Math.sin(p*Math.PI*s.turns*2+s.phase)*.13}
 else if(s.kind==='spiral'){const r=.31*(1-p)+.025,a=p*Math.PI*2*s.turns+s.phase;u=s.c.u+Math.cos(a)*r;v=s.c.v+Math.sin(a)*r}
 else if(s.kind==='zigzag'){u=s.a.u+(s.b.u-s.a.u)*p;v=s.a.v+(s.b.v-s.a.v)*p+(Math.asin(Math.sin(p*Math.PI*s.turns*2))/Math.PI)*.25}
 else {u=s.a.u+(s.b.u-s.a.u)*p+Math.sin(p*31+s.phase)*.05;v=s.a.v+(s.b.v-s.a.v)*p+Math.cos(p*23+s.phase)*.05}
 return {u:Math.max(.07,Math.min(.93,u)),v:Math.max(.07,Math.min(.93,v))};
}
function canvasPoint(bot,uv,lift=0){return new THREE.Vector3(bot.easel.center.x+(uv.u-.5)*canvasW,bot.easel.center.y+(uv.v-.5)*canvasH,.17+lift)}
function paint(bot,uv,p){
 const e=bot.easel,x=uv.u*480,y=(1-uv.v)*580,last=e.last;
 if(last&&Math.hypot(x-last.x,y-last.y)>1){const {ctx}=e,s=bot.stroke;jitterLine(ctx,last.x,last.y,x,y,bot.currentColor,s,p);e.texture.needsUpdate=true}
 e.last={x,y};
}
function jitterLine(ctx,x1,y1,x2,y2,color,s,p){
 ctx.save();ctx.globalAlpha=s.alpha*rand(.88,1.05);ctx.strokeStyle=color;ctx.lineCap=s.kind==='dabs'?'round':'square';ctx.lineJoin='round';
 if(s.kind==='dabs'){if(Math.floor(p*90)%3===0){ctx.fillStyle=color;ctx.beginPath();ctx.arc(x2+rand(-4,4),y2+rand(-4,4),s.width*rand(.45,1.15),0,Math.PI*2);ctx.fill();if(Math.random()<.18){ctx.beginPath();ctx.arc(x2+rand(-22,22),y2+rand(-22,22),rand(1,3),0,Math.PI*2);ctx.fill()}}}
 else {ctx.lineWidth=s.width*rand(.72,1.22)*(s.kind==='zigzag'?.75:1);ctx.beginPath();ctx.moveTo(x1+rand(-2,2),y1+rand(-2,2));ctx.quadraticCurveTo((x1+x2)/2+rand(-3,3),(y1+y2)/2+rand(-3,3),x2,y2);ctx.stroke();
  if(Math.random()<.4){ctx.globalAlpha*=.28;ctx.strokeStyle='#fff7e8';ctx.lineWidth=Math.max(1,s.width*.14);ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke()}}ctx.restore();
}
function resetPainting(){easels.forEach(paper);for(const bot of [pip,dot]){bot.mode='new';bot.modeStart=0;bot.currentTip=null}strokes=0;strokeEl.textContent='000'}
document.querySelector('#repaint').addEventListener('click',resetPainting);resetPainting();

function moveArm(bot,tipWorld,t){
 const shoulder=bot.root.localToWorld(bot.shoulderLocal.clone()),elbow=shoulder.clone().lerp(tipWorld,.52);elbow.y+=.27+Math.sin(t*2.1+bot.index)*.06;elbow.z+=.22;
 const hand=tipWorld.clone();const towardBot=bot.root.position.clone().sub(tipWorld).normalize();hand.add(towardBot.multiplyScalar(.33));
 const localS=bot.root.worldToLocal(shoulder.clone()),localE=bot.root.worldToLocal(elbow.clone()),localH=bot.root.worldToLocal(hand.clone()),localTip=bot.root.worldToLocal(tipWorld.clone());
 alignBetween(bot.upper,localS,localE);alignBetween(bot.lower,localE,localH);bot.elbow.position.copy(localE);bot.hand.position.copy(localH);
 const brushTop=localH.clone().add(localH.clone().sub(localTip).normalize().multiplyScalar(.72));alignBetween(bot.brush,brushTop,localTip);bot.bristles.position.copy(localTip);bot.bristles.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),localTip.clone().sub(brushTop).normalize());
 bot.currentTip=tipWorld.clone();bot.headPivot.rotation.y=Math.sin(t*.6+bot.index)*.045;bot.headPivot.rotation.x=-.06;bot.eyes.forEach(e=>e.scale.set(1+Math.sin(t*2)*.04,1,.42));bot.bulb.scale.setScalar(1+Math.sin(t*2.4)*.11);
}
function animateRobot(bot,t){
 if(bot.mode==='new'){newStroke(bot);bot.mode='paint';bot.modeStart=t;bot.currentTip=canvasPoint(bot,pathAt(bot.stroke,0));strokes++;strokeEl.textContent=String(strokes).padStart(3,'0')}
 const elapsed=t-bot.modeStart;let tip;
 if(bot.mode==='paint'){const p=Math.min(1,elapsed/bot.stroke.duration),uv=pathAt(bot.stroke,p);tip=canvasPoint(bot,uv);paint(bot,uv,p);if(p>=1){bot.mode='lift';bot.modeStart=t;bot.fromTip=tip.clone();bot.easel.last=null}}
 else if(bot.mode==='lift'){const p=elapsed/.48;tip=bot.fromTip.clone();tip.z+=smooth(Math.min(1,p))*.72;if(p>=1){bot.mode='reach';bot.modeStart=t;bot.fromTip=tip.clone();bot.well=Math.floor(Math.random()*bot.wells.length)}}
 else if(bot.mode==='reach'){const target=bot.root.localToWorld(bot.wells[bot.well].position.clone()).add(new THREE.Vector3(0,0,.09)),p=elapsed/.9;tip=mix(bot.fromTip,target,p);tip.y+=Math.sin(Math.min(1,p)*Math.PI)*.38;if(p>=1){bot.currentColor=randomColor(bot,bot.well);bot.bristleMat.color.set(bot.currentColor);newStroke(bot);bot.mode='return';bot.modeStart=t;bot.fromTip=target.clone();bot.toTip=canvasPoint(bot,pathAt(bot.stroke,0),.7)}}
 else {const p=elapsed/.9,target=canvasPoint(bot,pathAt(bot.stroke,0),.7*(1-smooth(Math.min(1,p))));tip=mix(bot.fromTip,target,p);tip.y+=Math.sin(Math.min(1,p)*Math.PI)*.3;if(p>=1){bot.mode='paint';bot.modeStart=t;bot.easel.last=null;strokes++;strokeEl.textContent=String(strokes).padStart(3,'0')}}
 moveArm(bot,tip,t);
}
const clock=new THREE.Clock();
function loop(){const t=clock.getElapsedTime();animateRobot(pip,t);animateRobot(dot,t);controls.update();renderer.render(scene,camera);requestAnimationFrame(loop)}
loop();
function resize(){const w=mount.clientWidth,h=mount.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix()}
window.addEventListener('resize',resize);
