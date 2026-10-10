// 리플레이 & 디브리핑: 5Hz 샘플 기록, 그래프, 궤적 재생
const replay={samples:[],playing:false,index:0,lastRec:0};
function replayReset(){replay.samples=[];replay.playing=false;replay.index=0;replay.lastRec=0}
function replayRecord(s,dt,modeNow){replay.lastRec+=dt;if(replay.lastRec<.2)return;replay.lastRec=0;
  if(modeNow==='flight')replay.samples.push({m:'f',t:s.elapsed,x:s.x,y:s.y,d:s.d,pitch:s.pitch,bank:s.bank,h:s.h,speed:s.speed,vy:s.vy,n1:s.n1,flap:s.flap,gear:s.gear,phase:s.phase});
  else replay.samples.push({m:'d',t:s.elapsed,x:s.x,y:s.y,z:s.z,pitch:s.pitch,bank:s.bank,h:s.h,speed:Math.hypot(s.vx,s.vz)});
  if(replay.samples.length>3000)replay.samples.shift()}
function drawDebriefChart(canvas,samples){if(!canvas)return;const ctx=canvas.getContext('2d'),W=canvas.width,H=canvas.height;
  ctx.clearRect(0,0,W,H);ctx.fillStyle='#08131f';ctx.fillRect(0,0,W,H);
  if(!samples||samples.length<2){ctx.fillStyle='#5e7787';ctx.font='16px Segoe UI';ctx.textAlign='center';ctx.fillText('기록 없음',W/2,H/2);return}
  const t0=samples[0].t,t1=samples[samples.length-1].t,span=Math.max(1,t1-t0);
  const maxSpeed=Math.max(1,...samples.map(v=>v.speed))*1.15,maxAlt=Math.max(1,...samples.map(v=>v.y))*1.2,maxVS=Math.max(2,...samples.map(v=>Math.abs(v.vy||0)))*1.2;
  const X=t=>44+(t-t0)/span*(W-80),Ys=v=>H-14-(v.speed/maxSpeed)*(H-46),Ya=v=>H-14-(v.y/maxAlt)*(H-46),Yv=v=>H/2-(v.vy||0)/maxVS*(H/2-30);
  ctx.strokeStyle='#1d344d';ctx.lineWidth=1;for(let i=0;i<=3;i++){const y=14+i*(H-30)/3;ctx.beginPath();ctx.moveTo(40,y);ctx.lineTo(W-16,y);ctx.stroke()}
  let lastPhase=null;for(const v of samples){if(v.m==='f'&&v.phase!==lastPhase){lastPhase=v.phase;const x=X(v.t);ctx.strokeStyle='#2d4a63';ctx.setLineDash([3,4]);ctx.beginPath();ctx.moveTo(x,14);ctx.lineTo(x,H-14);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle='#7d9bb0';ctx.font='10px Segoe UI';ctx.textAlign='left';ctx.fillText(v.phase,x+3,12)}}
  const line=(color,fn)=>{ctx.strokeStyle=color;ctx.lineWidth=2;ctx.beginPath();samples.forEach((v,i)=>{const x=X(v.t),y=fn(v);i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.stroke()};
  line('#81c8b1',Ys);line('#5dd5f5',Ya);line('#f5b653',Yv);
  ctx.font='11px Segoe UI';ctx.textAlign='right';ctx.fillStyle='#81c8b1';ctx.fillText('속도 '+Math.round(maxSpeed*1.944/1.15)+'kt',W-18,H-18);
  ctx.fillStyle='#5dd5f5';ctx.fillText('고도 '+Math.round(maxAlt/1.2)+'m',W-132,H-18);ctx.fillStyle='#f5b653';ctx.fillText('V/S '+Math.round(maxVS*196.85/1.2)+'fpm',W-246,H-18);
}
function startReplay(){if(replay.samples.length<2)return;replay.playing=true;replay.index=0;$('result').classList.add('hidden');$('replayLayer').classList.remove('hidden');$('hud').classList.add('hidden');plane.visible=true;cockpit.visible=false;drone.visible=true;mode=replay.samples[0].m==='f'?'flight':'drone';if(!state)state={};camera.up.set(0,1,0)}
function stopReplay(showResult){replay.playing=false;$('replayLayer').classList.add('hidden');if(showResult){$('result').classList.remove('hidden')}}
function replayTick(dt){const n=replay.samples.length;replay.index+=dt*5;const i=Math.floor(replay.index);
  if(i>=n-1){stopReplay(true);return}
  const a=replay.samples[i],b=replay.samples[Math.min(i+1,n-1)],f=replay.index-i,mi=(x,y)=>x+(y-x)*f;
  if(a.m==='f'){state.x=mi(a.x,b.x);state.y=mi(a.y,b.y);state.d=mi(a.d,b.d);state.pitch=mi(a.pitch,b.pitch);state.bank=mi(a.bank,b.bank);state.h=mi(a.h,b.h);state.speed=mi(a.speed,b.speed);state.vy=mi(a.vy,b.vy);state.n1=mi(a.n1,b.n1);state.flap=a.flap;state.gear=a.gear;state.phase=a.phase;state.ctrl={elevator:0,aileron:0,rudder:0};state.elapsed=a.t}
  else{state.x=mi(a.x,b.x);state.y=mi(a.y,b.y);state.z=mi(a.z,b.z);state.pitch=mi(a.pitch,b.pitch);state.bank=mi(a.bank,b.bank);state.h=mi(a.h,b.h);state.vx=0;state.vy=0;state.vz=0;state.elapsed=a.t}
  updateObjects(dt);
  const pos=a.m==='f'?new THREE.Vector3(state.x,state.y+2.13,-state.d):new THREE.Vector3(state.x,state.y,state.z);
  camera.position.copy(pos).add(new THREE.Vector3(-Math.sin(state.h)*20,7,Math.cos(state.h)*20));
  camera.lookAt(pos);
  const el=$('replayProgress');if(el)el.innerHTML=`<i style="width:${Math.min(100,i/n*100).toFixed(1)}%"></i>`}
PP.replay={data:replay,reset:replayReset,record:replayRecord,chart:drawDebriefChart,start:startReplay,stop:stopReplay,tick:replayTick};
