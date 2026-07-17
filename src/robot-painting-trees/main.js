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
const dark = mat(0x26322f, .38, .65), orange = mat(0xd95b38,.5,.25);
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
 ['#c9342f','#e24b3f','#ad242d','#f06b5b','#7f1d2d','#487044'],
 ['#3f7045','#5b873c','#2e5f36','#88a94f','#7a4b2a','#9a6238']
 ];

const stroke=(kind,color,well,width,duration,data={})=>({kind,color,well,width,duration,alpha:.9,jitter:.003,phase:0,turns:4,...data});
const flowerPlan=()=>{
 const green=colorFamilies[0][5], plans=[];
 const flower=(base,bloom,red,well,lean=0)=>{
  plans.push(stroke('bezier',green,5,8,1.05,{a:base,b:bloom,c:{u:(base.u+bloom.u)/2+lean,v:(base.v+bloom.v)/2}}));
  plans.push(stroke('flower',red,well,13,1.35,{c:bloom,radius:.075,petalRx:.055,petalRy:.082}));
  plans.push(stroke('ellipse',colorFamilies[0][4],4,11,.55,{c:bloom,rx:.036,ry:.036,render:'dabs'}));
 };
 flower({u:.27,v:.16},{u:.29,v:.64},colorFamilies[0][0],0,.035);
 flower({u:.51,v:.14},{u:.54,v:.78},colorFamilies[0][1],1,-.035);
 flower({u:.73,v:.16},{u:.72,v:.58},colorFamilies[0][2],2,.02);
 plans.push(
  stroke('bezier',green,5,9,.65,{a:{u:.40,v:.36},b:{u:.29,v:.43},c:{u:.32,v:.38}}),
  stroke('bezier',green,5,9,.65,{a:{u:.55,v:.43},b:{u:.67,v:.49},c:{u:.62,v:.44}}),
  stroke('bezier',green,5,9,.65,{a:{u:.71,v:.31},b:{u:.80,v:.37},c:{u:.77,v:.32}})
 );
 return plans;
};
const treePlan=()=>{
 const [g1,g2,g3,g4,b1,b2]=colorFamilies[1], plans=[];
 const trunk=(x,bottom,top,size)=>{
  plans.push(stroke('bezier',b1,4,size,1.15,{a:{u:x-.018,v:bottom},b:{u:x+.012,v:top},c:{u:x+.025,v:(bottom+top)/2}}));
  return stroke('bezier',b2,5,Math.max(5,size*.24),.7,{a:{u:x-.028,v:bottom+.015},b:{u:x-.006,v:top},c:{u:x-.01,v:(bottom+top)/2}});
 };
 const mainHighlight=trunk(.61,.13,.55,27);
 plans.push(stroke('leaf',g2,1,15,1.3,{c:{u:.61,v:.70},rx:.25,ry:.18,turns:6,render:'dabs'}),mainHighlight);
 plans.push(
  stroke('bezier',b1,4,11,.7,{a:{u:.61,v:.40},b:{u:.43,v:.63},c:{u:.51,v:.52}}),
  stroke('bezier',b1,4,11,.7,{a:{u:.61,v:.43},b:{u:.78,v:.65},c:{u:.71,v:.54}}),
  stroke('leaf',g1,0,13,1.05,{c:{u:.44,v:.67},rx:.14,ry:.12,turns:5,render:'dabs'}),
  stroke('leaf',g3,2,13,1.05,{c:{u:.76,v:.68},rx:.14,ry:.12,turns:5,render:'dabs'}),
  stroke('leaf',g4,3,12,.95,{c:{u:.61,v:.80},rx:.14,ry:.10,turns:5,render:'dabs'})
 );
 const smallHighlight=trunk(.27,.13,.40,19);
 plans.push(
  stroke('leaf',g1,0,12,1.1,{c:{u:.27,v:.52},rx:.17,ry:.14,turns:5.5,render:'dabs'}),
  smallHighlight,
  stroke('bezier',b2,5,8,.6,{a:{u:.27,v:.31},b:{u:.17,v:.48},c:{u:.21,v:.40}}),
  stroke('bezier',b1,4,8,.6,{a:{u:.27,v:.32},b:{u:.37,v:.49},c:{u:.33,v:.41}}),
  stroke('leaf',g4,3,11,.85,{c:{u:.17,v:.51},rx:.10,ry:.09,turns:4.5,render:'dabs'}),
  stroke('leaf',g3,2,11,.85,{c:{u:.37,v:.53},rx:.10,ry:.09,turns:4.5,render:'dabs'}),
  stroke('bezier',g3,2,7,.8,{a:{u:.10,v:.12},b:{u:.88,v:.12},c:{u:.50,v:.16}})
 );
 return plans;
};
const paintingPlans=[flowerPlan(),treePlan()];
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
 return {name,index,root,easel,facing,headPivot,eyes,bulb,upper,lower,elbow,hand,brush,bristles,bristleMat,shoulderLocal,paletteLocal,wells,plan:paintingPlans[index],planIndex:0,mode:'new',modeStart:0,currentTip:null,currentColor:colorFamilies[index][0],stroke:null};
}
const pip=createRobot('PIP',-3.05,orange,1,easels[0],0);
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
function newStroke(bot){
 const source=bot.plan[bot.planIndex%bot.plan.length];
 bot.planIndex++;
 bot.stroke={...source};
 bot.currentColor=source.color;
 bot.bristleMat.color.set(source.color);
 bot.easel.last=null;
 return bot.stroke;
}
function pathAt(s,p){
 let u,v;
 if(s.kind==='bezier'){const q=1-p;u=q*q*s.a.u+2*q*p*s.c.u+p*p*s.b.u;v=q*q*s.a.v+2*q*p*s.c.v+p*p*s.b.v}
 else if(s.kind==='ellipse'){const a=p*Math.PI*2;u=s.c.u+Math.cos(a)*s.rx;v=s.c.v+Math.sin(a)*s.ry}
 else if(s.kind==='leaf'){const a=p*Math.PI*2*s.turns+s.phase,r=Math.sqrt(1-p);u=s.c.u+Math.cos(a)*s.rx*r;v=s.c.v+Math.sin(a)*s.ry*r}
 else if(s.kind==='flower'){const scaled=Math.min(p*.99999,4.9999)*5,petal=Math.floor(scaled),local=scaled-petal,a=petal/5*Math.PI*2-Math.PI/2,loop=local*Math.PI*2;const cx=s.c.u+Math.cos(a)*s.radius,cy=s.c.v+Math.sin(a)*s.radius;u=cx+Math.cos(loop)*s.petalRx;v=cy+Math.sin(loop)*s.petalRy}
 else {u=s.a.u+(s.b.u-s.a.u)*p;v=s.a.v+(s.b.v-s.a.v)*p}
 return {u:Math.max(.07,Math.min(.93,u)),v:Math.max(.07,Math.min(.93,v))};
}
function canvasPoint(bot,uv,lift=0){return new THREE.Vector3(bot.easel.center.x+(uv.u-.5)*canvasW,bot.easel.center.y+(uv.v-.5)*canvasH,.17+lift)}
function paint(bot,uv,p){
 const e=bot.easel,x=uv.u*480,y=(1-uv.v)*580,last=e.last,s=bot.stroke;
 if(!last){e.last={x,y,p};return}
 if(s.render==='dabs'||s.kind==='flower'){
  const steps=Math.max(1,Math.ceil((p-last.p)*240));let px=last.x,py=last.y;
  for(let i=1;i<=steps;i++){const q=last.p+(p-last.p)*i/steps,point=pathAt(s,q),nx=point.u*480,ny=(1-point.v)*580;jitterLine(e.ctx,px,py,nx,ny,bot.currentColor,s,q);px=nx;py=ny}
  e.texture.needsUpdate=true;e.last={x,y,p};return;
 }
 if(Math.hypot(x-last.x,y-last.y)>.35){jitterLine(e.ctx,last.x,last.y,x,y,bot.currentColor,s,p);e.texture.needsUpdate=true;e.last={x,y,p}}
}
function jitterLine(ctx,x1,y1,x2,y2,color,s,p){
 const dabs=s.render==='dabs'||s.kind==='flower';
 ctx.save();ctx.globalAlpha=s.alpha*rand(.88,1.05);ctx.strokeStyle=color;ctx.lineCap=dabs?'round':'square';ctx.lineJoin='round';
 if(dabs){ctx.fillStyle=color;ctx.beginPath();ctx.arc(x2+rand(-3,3),y2+rand(-3,3),s.width*rand(.55,1.05),0,Math.PI*2);ctx.fill()}
 else {ctx.lineWidth=s.width*rand(.82,1.14);ctx.beginPath();ctx.moveTo(x1+rand(-1.5,1.5),y1+rand(-1.5,1.5));ctx.quadraticCurveTo((x1+x2)/2+rand(-2,2),(y1+y2)/2+rand(-2,2),x2,y2);ctx.stroke();
  if(Math.random()<.3){ctx.globalAlpha*=.25;ctx.strokeStyle='#fff7e8';ctx.lineWidth=Math.max(1,s.width*.12);ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke()}}ctx.restore();
}
function resetPainting(){easels.forEach(paper);for(const bot of [pip,dot]){bot.mode='new';bot.modeStart=0;bot.currentTip=null;bot.planIndex=0;bot.easel.last=null}strokes=0;strokeEl.textContent='000'}
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
 else if(bot.mode==='lift'){const p=elapsed/.2;tip=bot.fromTip.clone();tip.z+=smooth(Math.min(1,p))*.55;if(p>=1){newStroke(bot);bot.mode='reach';bot.modeStart=t;bot.fromTip=tip.clone();bot.well=bot.stroke.well}}
 else if(bot.mode==='reach'){const target=bot.root.localToWorld(bot.wells[bot.well].position.clone()).add(new THREE.Vector3(0,0,.09)),p=elapsed/.38;tip=mix(bot.fromTip,target,p);tip.y+=Math.sin(Math.min(1,p)*Math.PI)*.3;if(p>=1){bot.mode='return';bot.modeStart=t;bot.fromTip=target.clone();bot.toTip=canvasPoint(bot,pathAt(bot.stroke,0),.55)}}
 else {const p=elapsed/.42,target=canvasPoint(bot,pathAt(bot.stroke,0),.55*(1-smooth(Math.min(1,p))));tip=mix(bot.fromTip,target,p);tip.y+=Math.sin(Math.min(1,p)*Math.PI)*.24;if(p>=1){bot.mode='paint';bot.modeStart=t;bot.easel.last=null;strokes++;strokeEl.textContent=String(strokes).padStart(3,'0')}}
 moveArm(bot,tip,t);
}
const clock=new THREE.Clock();
function loop(){const t=clock.getElapsedTime();animateRobot(pip,t);animateRobot(dot,t);controls.update();renderer.render(scene,camera);requestAnimationFrame(loop)}
loop();
function resize(){const w=mount.clientWidth,h=mount.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix()}
window.addEventListener('resize',resize);
