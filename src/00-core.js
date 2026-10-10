(async()=>{'use strict';
const PP=window.PP={};
const {THREE,cloneSkinned,loadEmbeddedGLB}=Game3D;
const $=id=>document.getElementById(id),clamp=THREE.MathUtils.clamp,lerp=THREE.MathUtils.lerp,rad=THREE.MathUtils.degToRad,deg=THREE.MathUtils.radToDeg;
const CONFIG={flight:{threshold:5600,runwayEnd:6240,runwayHalfWidth:12,safeSpeedMin:28,safeSpeedMax:48,safeVertical:3.6,safeHeading:8,cruiseAltitude:90},drone:{rings:20,innerRadius:2.84,bodyClearance:.45,limitSeconds:210,maxSpeed:4.5}};
const DIFFICULTY={
  arcade:{label:'아케이드',thrust:5.2,aileronRate:1.25,maxBank:32,pitchRate:.6,climbHold:0,altHold:1,alphaUp:6.5,alphaDown:4,autoLevel:.7,stallFloor:.55,assistLift:1.12,turbulence:.12,wind:.5},
  standard:{label:'표준',thrust:4.2,aileronRate:1.6,maxBank:50,pitchRate:.5,climbHold:.35,altHold:.55,alphaUp:8,alphaDown:5,autoLevel:.3,stallFloor:.35,assistLift:1,turbulence:.3,wind:1},
  realistic:{label:'리얼리스틱',thrust:3.8,aileronRate:1.85,maxBank:67,pitchRate:.42,climbHold:1,altHold:0,alphaUp:8,alphaDown:6,autoLevel:0,stallFloor:.15,assistLift:1,turbulence:.55,wind:1.3}};
const error=e=>{$('errorMessage').textContent=String(e?.message||e);$('errorLayer').classList.remove('hidden');console.error(e)};
window.addEventListener('error',e=>error(e.error||e.message));window.addEventListener('unhandledrejection',e=>error(e.reason));$('reload').onclick=()=>location.reload();
let renderer;try{renderer=new THREE.WebGLRenderer({canvas:$('view'),antialias:true});}catch(e){error(e);return}
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(78,innerWidth/innerHeight,.3,13000);const hemi=new THREE.HemisphereLight(0xc8e6f4,0x243746,2);scene.add(hemi);const sun=new THREE.DirectionalLight(0xffe1bd,2.8);sun.position.set(-150,500,400);scene.add(sun);
const world=new THREE.Group(),flightWorld=new THREE.Group(),droneWorld=new THREE.Group(),cockpit=new THREE.Group(),plane=new THREE.Group(),drone=new THREE.Group();scene.add(world,flightWorld,droneWorld,cockpit,plane,drone);
const keyState=new Set(),mixers=[],assets={},events=[];let mode=null,state=null,active=false,paused=false,thirdPerson=false,seed=17003,toastTimer=0,audio=null,audioStarted=false,prevTime=0,rainParticles=null,course=[];
let engineOsc=null,engineGain=null,engineFilter=null;
function difficulty(){return DIFFICULTY[$('difficulty')?$('difficulty').value:'standard']||DIFFICULTY.standard}
function event(type,detail={}){events.push({type,time:state?.elapsed||0,...detail});if(events.length>300)events.shift()}
function sound(f=440,d=.10,v=.06){if(!audio)return;const o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(v,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+d);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+d)}
let noiseBuffer=null,windSource=null,windGain=null,windFilter=null;
function getNoiseBuffer(){if(!audio)return null;if(!noiseBuffer){noiseBuffer=audio.createBuffer(1,Math.floor(audio.sampleRate*2),audio.sampleRate);const d=noiseBuffer.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1}return noiseBuffer}
function noiseBurst(filterType,freq,dur,vol=.08){if(!audio)return;const src=audio.createBufferSource();src.buffer=getNoiseBuffer();const f=audio.createBiquadFilter();f.type=filterType;f.frequency.value=freq;const g=audio.createGain();g.gain.setValueAtTime(vol,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+dur);src.connect(f);f.connect(g);g.connect(audio.destination);src.start();src.stop(audio.currentTime+dur)}
function servoSound(){noiseBurst('bandpass',900,.35,.05)}
function screechSound(){noiseBurst('highpass',2200,.8,.09);noiseBurst('lowpass',300,.5,.06)}
function windSound(level){if(!audio)return;if(!windSource){windSource=audio.createBufferSource();windSource.buffer=getNoiseBuffer();windSource.loop=true;windFilter=audio.createBiquadFilter();windFilter.type='lowpass';windFilter.frequency.value=700;windGain=audio.createGain();windGain.gain.value=0;windSource.connect(windFilter);windFilter.connect(windGain);windGain.connect(audio.destination);windSource.start()}windGain.gain.setTargetAtTime(clamp(level,0,.06),audio.currentTime,.3);windFilter.frequency.setTargetAtTime(500+level*9000,audio.currentTime,.3)}
function startAudio(){if(!audioStarted){audioStarted=true;try{audio=new (window.AudioContext||window.webkitAudioContext)()}catch{}}if(audio?.state==='suspended')audio.resume().catch(()=>{});if(audio&&!engineOsc){try{engineOsc=audio.createOscillator();engineGain=audio.createGain();engineFilter=audio.createBiquadFilter();engineFilter.type='lowpass';engineFilter.frequency.value=380;engineOsc.type='sawtooth';engineOsc.frequency.value=60;engineGain.gain.value=0;engineOsc.connect(engineFilter);engineFilter.connect(engineGain);engineGain.connect(audio.destination);engineOsc.start()}catch{}}}
function setEngineSound(level,freq){if(!audio||!engineGain)return;const t=audio.currentTime;engineGain.gain.setTargetAtTime(clamp(level,0,.09),t,.25);if(engineOsc)engineOsc.frequency.setTargetAtTime(clamp(freq,40,320),t,.3)}
function toast(text,color='#5dd5f5'){$('toast').textContent=text;$('toast').style.borderColor=color;$('toast').style.opacity=1;toastTimer=3}
function heading(h){return ((deg(h)%360)+360)%360}function wrap(a){return Math.atan2(Math.sin(a),Math.cos(a))}
function random(s){return()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function material(c,rough=.75){return new THREE.MeshStandardMaterial({color:c,roughness:rough})}
function box(w,h,d,c,x,y,z,parent=world){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material(c));o.position.set(x,y,z);parent.add(o);return o}
function model(id,parent,pos=[0,0,0],scale=[1,1,1]){const obj=cloneSkinned(assets[id].scene);obj.position.set(...pos);obj.scale.set(...scale);parent.add(obj);return obj}
function rig(obj,id){const mixer=new THREE.AnimationMixer(obj);mixers.push(mixer);return{name:id,obj,mixer,play(name,loop=false,reverse=false){if(name.startsWith('Air_Gear'))for(const c of assets[id].animations)if(c.name.startsWith('Air_Gear')&&c.name!==name)mixer.existingAction(c)?.stop();const clip=assets[id].animations.find(c=>c.name===name);if(!clip)return;const action=mixer.clipAction(clip);action.reset();action.timeScale=reverse?-1:1;if(reverse)action.time=clip.duration;action.setLoop(loop?THREE.LoopRepeat:THREE.LoopOnce,loop?Infinity:1);action.clampWhenFinished=!loop;action.play();return action}}}
const input=(positive,negative)=>(keyState.has(positive)?1:0)-(keyState.has(negative)?1:0);
PP.core={$,clamp,lerp,rad,deg,event,sound,startAudio,toast,heading,wrap,random,material,box,model,rig,input,difficulty,DIFFICULTY,CONFIG,setEngineSound,servoSound,screechSound,windSound};
