// 부트스트랩, 입력 바인딩, 텔레메트리, 메인 루프
document.addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)&&active)e.preventDefault();if(e.repeat)return;if(e.code==='Escape'){if(replay.playing){stopReplay(true);return}togglePause();return}if(replay.playing)return;if(paused)return;if(e.code==='Enter'&&active){e.preventDefault();enter();return}if(e.code==='KeyG'){gear();return}if(e.code==='KeyF'){flap();return}if(e.code==='KeyT'){trim(e.shiftKey?-1:1);return}if(e.code==='KeyY'){trim(-1);return}if(e.code==='KeyP'){apToggle();return}if(e.code==='KeyV'&&active&&mode==='drone'){thirdPerson=!thirdPerson;event('view',{thirdPerson});return}if(e.code==='KeyH'&&active&&mode==='drone'){finish(droneResult(state.passed),'미션 종료 시점의 고유 링 통과 수를 기록했습니다.');return}keyState.add(e.code)});
document.addEventListener('keyup',e=>keyState.delete(e.code));window.addEventListener('blur',()=>{if(active&&!paused)togglePause()});
function resize(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)}window.addEventListener('resize',resize);resize();
$('startFlight').onclick=()=>start('flight');$('startDrone').onclick=()=>start('drone');$('retry').onclick=()=>start(mode);$('newRoute').onclick=()=>{seed+=37;$('seedLabel').textContent='경로 '+seed};$('weather').onchange=weather;$('time').onchange=weather;$('pause').onclick=togglePause;$('resume').onclick=togglePause;for(const id of ['exit','pauseMenu','resultMenu'])$(id).onclick=menu;$('replayBtn').onclick=startReplay;$('replayStop').onclick=()=>stopReplay(true);
apBindUI();instInit();atcUI();
await loadAssets();buildEnvironment();weather();menu();$('startFlight').disabled=false;$('startDrone').disabled=false;$('loading').textContent='운항 준비 완료 · 계기·오토파일럿 활성';
Object.defineProperty(window,'__pilotEvidence',{get(){return JSON.parse(JSON.stringify({ready:true,protocol:location.protocol,mode,active,paused,thirdPerson,seed,state,ap:PP.ap.ap,atc:{ack:atc.ack,miss:atc.miss,expect:atc.expect,logLength:atc.log.length},replay:{samples:replay.samples.length,playing:replay.playing},visual:{surfaces:(PP.visual&&PP.visual.surfaces||[]).length,doors:(PP.visual&&PP.visual.doors||[]).length,cockpit3d:Object.keys((PP.visual&&PP.visual.cockpit3d)||{}).length,emitters:(PP.visual&&PP.visual.emitters||[]).length,timeOfDay:PP.visual&&PP.visual.timeOfDay},course:course.map(c=>({id:c.id,x:c.pos.x,y:c.pos.y,z:c.pos.z,normal:c.normal.toArray(),passed:c.passed,missed:c.missed})),events,assetNames:Object.keys(assets),loadedAnimationCounts:Object.fromEntries(Object.entries(assets).map(([k,v])=>[k,v.animations.length])),rigTelemetry:{dronePropeller:drone.getObjectByName('PropellerPivot_FL')?.quaternion.toArray(),droneClipTime:droneRig.mixer.time,airFan:plane.getObjectByName('EngineFanPivot_L')?.quaternion.toArray(),airClipTime:aircraftRig.mixer.time,cockpitYoke:cockpit.getObjectByName('YokePitchPivot-1')?.quaternion.toArray()},config:CONFIG,difficulty:DIFFICULTY}))}});
window.__pilotRules=Object.freeze({ringCrossing,droneResult,referenceAltitude,routeX,liftCoefficient,dragCoefficient,stallSpeed,airDensity,CLMAX,FLAPS,ALPHA_STALL,CONFIG,DIFFICULTY,heading,wrap});
function runSelfTest(){const out=[],ok=(name,cond,detail='')=>out.push({name,pass:!!cond,detail:String(detail)});
  ok('liftCoefficient(0)=0.2',Math.abs(liftCoefficient(0)-.2)<1e-9,liftCoefficient(0));
  ok('stallSpeed(3) 18~26m/s',stallSpeed(3)>18&&stallSpeed(3)<26,stallSpeed(3).toFixed(2));
  ok('Vs(3) < Vs(0)',stallSpeed(3)<stallSpeed(0));
  ok('post-stall lift drop',liftCoefficient(ALPHA_STALL*1.6)<liftCoefficient(ALPHA_STALL));
  ok('routeX(0)=0',routeX(0)===0,routeX(0));
  ok('routeX(1500)=45',Math.abs(routeX(1500)-45)<1e-9,routeX(1500));
  ok('referenceAltitude(700)=90',referenceAltitude(700)===90,referenceAltitude(700));
  const rc=ringCrossing(new THREE.Vector3(0,0,1),new THREE.Vector3(0,0,-1),{pos:new THREE.Vector3(0,0,0),normal:new THREE.Vector3(0,0,-1)});
  ok('ringCrossing 통과 판정',rc.crossed&&Math.abs(rc.radial)<1e-9,JSON.stringify(rc));
  ok('droneResult(20)=success',droneResult(20)==='success',droneResult(20));
  ok('droneResult(14)=incomplete',droneResult(14)==='incomplete',droneResult(14));
  ok('difficulty 3단계',Object.keys(DIFFICULTY).join(',')==='arcade,standard,realistic',Object.keys(DIFFICULTY).join(','));
  const passed=out.filter(o=>o.pass).length;window.__selfTestResults=out;console.table(out);
  const el=document.createElement('div');el.id='selftestPanel';el.style.cssText='position:fixed;left:12px;top:12px;z-index:99;background:#0a1b2be8;border:2px solid '+(passed===out.length?'#41d97f':'#e8473f')+';border-radius:8px;padding:12px 16px;font:12px Segoe UI;color:#dce7ee;pointer-events:none;white-space:pre';
  el.textContent=`SELFTEST ${passed}/${out.length} ${passed===out.length?'PASS':'FAIL'}\n`+out.map(o=>(o.pass?'OK  ':'FAIL')+' '+o.name).join('\n');document.body.appendChild(el)}
if(new URLSearchParams(location.search).has('selftest')){runSelfTest();runScenarioTests();}
function runDebug(kind){try{$('hud').classList.add('hidden');$('menu').classList.add('hidden');$('flightPanel').classList.add('hidden');
  if(kind==='surfaces'){start('flight');paused=true;$('hud').classList.add('hidden');$('flightPanel').classList.add('hidden');const s=state;s.boardingStarted=true;s.boarded=120;s.phase='route';s.airborne=true;s.x=0;s.y=60;s.d=1200;s.speed=50;s.vel.set(0,0,-50);s.pitch=0;s.h=0;s.ctrl={elevator:1,aileron:1,rudder:1};s.slip=.2;s.flap=3;s.gear=false;updateObjects(.016);plane.visible=true;cockpit.visible=false;camera.up.set(0,1,0);camera.position.set(9,64.5,-1189);camera.lookAt(0,61,-1202);renderer.render(scene,camera)}
  else if(kind==='doors'){start('flight');paused=true;$('hud').classList.add('hidden');$('flightPanel').classList.add('hidden');const s=state;s.boardingStarted=true;s.phase='boarding';updateObjects(.016);animateDoors(s,.5);animateDoors(s,.5);animateDoors(s,.5);camera.up.set(0,1,0);camera.position.set(6.5,4.2,98.5);camera.lookAt(-1.6,2.6,93.5);renderer.render(scene,camera)}
  else if(kind==='night'){$('time').value='night';weather();menu();$('menu').classList.add('hidden');camera.up.set(0,1,0);camera.position.set(34,9,-5375);camera.lookAt(0,1,-5700);updateObjects(0);renderer.render(scene,camera)}
  else if(kind==='nightmenu'){$('time').value='night';weather();menu();camera.up.set(0,1,0);camera.position.set(130,30,-260);camera.lookAt(60,4,-200);updateObjects(0);renderer.render(scene,camera)}
  else if(kind==='cockpit'){start('flight');paused=true;$('hud').classList.add('hidden');$('flightPanel').classList.add('hidden');const s=state;s.boardingStarted=true;s.boarded=120;s.phase='climb';s.airborne=true;s.pitch=rad(10);s.bank=rad(18);s.y=80;updateObjects(.016);cockpit.visible=true;camera.up.set(0,1,0).applyQuaternion(cockpit.quaternion);camera.position.copy(cockpit.localToWorld(new THREE.Vector3(0,1.42,.55)));camera.lookAt(cockpit.localToWorld(new THREE.Vector3(0,.88,-.7)));renderer.render(scene,camera)}
  else if(kind==='debrief'){start('flight');paused=true;const s=state;s.boardingStarted=true;s.boarded=120;s.phase='route';s.airborne=true;
    for(let i=0;i<300;i++){const t=i*.2;replay.samples.push({m:'f',t,x:Math.sin(t*.1)*30,y:20+80*Math.min(1,t/40)+Math.sin(t*.4)*2,d:600*i,speed:50+Math.cos(t*.2)*15,vy:Math.sin(t*.3)*3,n1:.6,flap:t>30?3:2,gear:t>35,phase:t<10?'takeoff':t<30?'climb':t<40?'route':t<55?'approach':'rollout'})}
    drawDebriefChart($('debrief'),replay.samples);$('resultEyebrow').textContent='FLIGHT REPORT · ICN → CJU';$('resultTitle').textContent='승객 운송 완료';$('resultScore').textContent='제주 · 안전 하차 완료';$('resultMessage').textContent='120명의 승객을 안전하게 운송했습니다.';$('resultStats').textContent='운항 148초 · 항로 최대 이탈 12.4m · 접지 190ft/min (A) · 무전 복창 4회 · 고장 대응: 계기 고장 성공';$('result').classList.remove('hidden')}
}catch(e){console.error('debug',e)}document.title=JSON.stringify({kind,plane:plane.position.toArray().map(v=>+v.toFixed(1)),cam:camera.position.toArray().map(v=>+v.toFixed(1)),visible:plane.visible,phase:state&&state.phase,ail:(PP.visual&&PP.visual.surfaces||[]).map(sf=>+deg(2*Math.acos(Math.min(1,Math.abs(sf.node.quaternion.w)))).toFixed(1))})}
const dbgKind=new URLSearchParams(location.search).get('debug');
if(dbgKind)runDebug(dbgKind);
async function runScenarioTests(){const out=[],ok=(name,cond,detail='')=>out.push({name,pass:!!cond,detail:String(detail)});const dt=1/60;
  const report=()=>{const passed=out.filter(o=>o.pass).length;let el=document.getElementById('scenarioPanel');if(!el){el=document.createElement('div');el.id='scenarioPanel';el.style.cssText='position:fixed;left:12px;top:230px;z-index:99;background:#0a1b2be8;border:2px solid '+(passed===out.length?'#41d97f':'#e8473f')+';border-radius:8px;padding:12px 16px;font:12px Segoe UI;color:#dce7ee;pointer-events:none;white-space:pre';document.body.appendChild(el)}el.textContent=`FLIGHT SCENARIO ${passed}/${out.length} ${passed===out.length?'PASS':'FAIL'}\n`+out.map(o=>(o.pass?'OK  ':'FAIL')+' '+o.name+'  ['+o.detail+']').join('\n');console.table(out)};
  const step=()=>{updateFlight(dt);updateObjects(dt);updateCamera(dt);PP.instruments.frame(dt);replayRecord(state,dt,mode)};
  try{
    $('weather').value='clear';weather();paused=true;
    start('flight');const s=state;
    s.boardingStarted=true;s.boarded=120;s.phase='clearance';enter();
    const wl0=(PP.visual&&PP.visual.emitters||[])[0];
    $('time').value='night';weather();
    ok('시나리오: 야간 조명',!!(wl0&&wl0.emissiveIntensity>2&&PP.visual.timeOfDay==='night'),`emit=${wl0?wl0.emissiveIntensity.toFixed(1):'x'} · bg=${scene.background.getHexString()}`);
    $('time').value='day';weather();
    const sky=cockpit.getObjectByName('HorizonSky1'),skyP=sky.position.clone(),skyQ=sky.quaternion.clone();
    animateCockpit3D({pitch:rad(12),bank:rad(15)});
    const skyMoved=Math.abs(sky.quaternion.dot(skyQ))<.99999;
    animateCockpit3D({pitch:0,bank:0});
    ok('시나리오: 3D 자세계 연동',skyMoved,`q변화=${(1-Math.abs(sky.quaternion.dot(skyQ))).toFixed(4)}`);
    const ack0=atc.ack;atcSay('시나리오 점검 메시지');const rb=atcReadback();
    ok('시나리오: ATC 복창',rb&&atc.ack===ack0+1,`ack=${atc.ack} · miss=${atc.miss}`);
    atc.expect=false;
    keyState.add('KeyW');let f=0;while(!s.airborne&&f<3600&&active){step();f++;if(s.speed>31&&f>20)keyState.add('ArrowUp')}
    ok('시나리오: 이륙',s.airborne,`${f}프레임 · ${(s.speed*1.944).toFixed(0)}kt · y=${s.y.toFixed(1)}`);
    keyState.add('ArrowRight');step();keyState.delete('ArrowRight');
    const hinge=plane.getObjectByName('AileronHinge_L');let hai=0;if(hinge)hai=2*Math.acos(Math.min(1,Math.abs(hinge.quaternion.w)));
    ok('시나리오: 조종면 에일러론',!!(hinge&&hai>rad(5)),`${deg(hai).toFixed(1)}°`);
    const flapKeep=s.flap;s.flap=3;step();const fh=plane.getObjectByName('FlapHinge_L');let fhi=0;if(fh)fhi=2*Math.acos(Math.min(1,Math.abs(fh.quaternion.w)));
    ok('시나리오: 플랩 구동',!!(fh&&fhi>rad(15)),`${deg(fhi).toFixed(1)}°`);s.flap=flapKeep;
    keyState.delete('ArrowUp');keyState.add('KeyW');keyState.add('ArrowUp');f=0;while(s.y<30&&f<1800&&active){step();f++}
    keyState.delete('ArrowUp');
    ok('시나리오: 이륙 후 상승',s.y>=30,`y=${s.y.toFixed(1)} · vy=${s.vy.toFixed(1)}`);
    keyState.clear();ap.on=true;ap.engageAt=s.elapsed;ap.spd=s.speed;ap.hdg=s.h;ap.alt=90;ap.vs=0;ap.modes.alt=true;ap.modes.hdg=true;ap.modes.spd=true;
    f=0;let maxErr=0;while(f<2400&&active){step();f++;maxErr=Math.max(maxErr,Math.abs(s.y-90));if(s.ap&&!s.ap.on)break}
    ok('시나리오: A/P 고도 90m 유지',s.ap&&s.ap.on&&Math.abs(s.y-90)<8,`y=${s.y.toFixed(1)} · 최대오차 ${maxErr.toFixed(1)}m · ${Math.round(s.speed*1.944)}kt`);
    ap.on=false;keyState.clear();f=0;while(f<300&&active){step();f++}
    const yHold=s.y;f=0;let holdDrift=0;while(f<300&&active){step();f++;holdDrift=Math.max(holdDrift,Math.abs(s.y-yHold))}
    ok('시나리오: 무입력 고도 유지',Math.abs(s.y-yHold)<6&&Math.abs(s.vy)<2.5,`${yHold.toFixed(1)}m → ${s.y.toFixed(1)}m · 최대변동 ${holdDrift.toFixed(1)}m · vy=${s.vy.toFixed(1)}`);
    keyState.clear();f=0;while(f<60&&active){step();f++}
    const a0=s.speed;f=0;while(f<60&&active){step();f++}const dNo=s.speed-a0;
    const b0=s.speed;keyState.add('Space');f=0;while(f<60&&active){step();f++}keyState.delete('Space');const dSp=s.speed-b0;
    ok('시나리오: 공중 Space 무영향',Math.abs(dSp-dNo)<.35,`Δ일반 ${dNo.toFixed(2)} · ΔSpace ${dSp.toFixed(2)}m/s`);
    keyState.add('ArrowUp');let peak=0;f=0;while(f<90&&active){step();f++;peak=Math.max(peak,s.pitch)}
    keyState.delete('ArrowUp');f=0;while(f<360&&active){step();f++}
    ok('시나리오: 수동 피치 안정',s.pitch<peak-rad(1)&&Math.abs(s.vy)<3,`peak=${deg(peak).toFixed(1)}° · 최종 ${deg(s.pitch).toFixed(1)}° · vy=${s.vy.toFixed(1)}`);
    applyFailure(s,'hyd');const hydSet=s.hydFail;applyFailure(s,'instr');const insSet=s.instrFail;s.hydFail=false;s.instrFail=false;
    ok('시나리오: 고장 플래그',hydSet&&insSet,`hyd=${hydSet} · instr=${insSet}`);
    applyFailure(s,'engine');f=0;while(f<120&&active){step();f++}
    ok('시나리오: 엔진 고장 활공',s.engFail&&s.n1<.1&&!(s.ap&&s.ap.on),`n1=${s.n1.toFixed(2)} · vy=${s.vy.toFixed(1)}`);
    Object.assign(s,{airborne:true,gear:true,flap:3,y:.01,d:5599.9,x:0,h:0,bank:0,alpha:rad(4),slip:0,trim:rad(4)});
    s.vel.set(0,-2,-35);s.n1=.3;s.throttle=.1;
    step();
    ok('시나리오: 정상 착륙 판정',s.phase==='rollout',`phase=${s.phase} · ${s.speed.toFixed(1)}m/s · vy=${s.vy.toFixed(2)}`);
    keyState.add('Space');f=0;while(s.phase==='rollout'&&f<2400&&active){step();f++}
    ok('시나리오: 활주로 정지',s.phase==='stopped',`phase=${s.phase} · d=${s.d.toFixed(0)} · x=${s.x.toFixed(1)}`);
    keyState.clear();if(s.phase==='stopped')enter();
    f=0;while(active&&f<600){step();f++}
    ok('시나리오: 하차 완료',!active&&s.phase==='success',`phase=${s.phase}`);
    const e=events.find(e=>e.type==='touchdown');
    ok('시나리오: 착륙 텔레메트리',e&&e.valid===true&&typeof e.fpm==='number',e?`fpm=${e.fpm} · x=${e.x.toFixed(1)}`:'' );
    ok('시나리오: 리플레이 기록',replay.samples.length>30,`samples=${replay.samples.length}`);
    drawDebriefChart($('debrief'),replay.samples);
    startReplay();f=0;while(replay.playing&&f<400){replayTick(dt);f++}if(replay.playing)stopReplay(true);
    ok('시나리오: 리플레이 재생',f>0&&!replay.playing,`${f}프레임 재생`);
    $('result').classList.add('hidden');
    start('drone');f=0;keyState.add('KeyW');while(f<180&&active){updateDrone(dt);updateObjects(dt);updateCamera(dt);f++}keyState.clear();
    ok('시나리오: 드론 프레임',state.mode==='drone'&&state.elapsed>2.9&&state.battery<100&&course.length===20,`z=${state.z.toFixed(1)} · battery=${state.battery.toFixed(1)} · rings=${course.length}`);
  }catch(err){ok('시나리오 예외',false,String(err&&err.stack||err))}
  mode=null;active=false;state=null;paused=false;menu();report();
}
let hudClock=0;
function frame(t){const dt=Math.min((t-prevTime)/1000,.05);prevTime=t;requestAnimationFrame(frame);
  if(replay.playing){replayTick(dt);renderer.render(scene,camera);return}
  if(active&&!paused){if(mode==='flight')updateFlight(dt);else updateDrone(dt);atcUpdate(dt);replayRecord(state,dt,mode);for(const m of mixers)m.update(dt);updateObjects(dt);updateCamera(dt);PP.instruments.frame(dt);hudClock+=dt;if(hudClock>.08){updateHUD();hudClock=0}if(toastTimer>0){toastTimer-=dt;if(toastTimer<=0)$('toast').style.opacity=0}}
  else if(!paused){for(const m of mixers)m.update(Math.min(dt,.025));if(mode){updateObjects(dt);updateCamera(dt)}}
  if(audio){if(active&&!paused&&mode==='flight'){setEngineSound(.02+state.n1*.05,55+state.n1*170);windSound(state.airborne?.004+state.speed*.0007:.001)}else if(active&&!paused&&mode==='drone'){setEngineSound(.018,140);windSound(.002)}else{setEngineSound(0,60);windSound(0)}}
  renderer.render(scene,camera)}
requestAnimationFrame(t=>{prevTime=t;frame(t)});
})().catch(e=>{document.getElementById('errorMessage').textContent=String(e);document.getElementById('errorLayer').classList.remove('hidden');console.error(e)});
