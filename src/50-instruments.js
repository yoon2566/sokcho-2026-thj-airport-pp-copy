// PFD/EICAS 계기와 경고 시스템 (2D 캔버스 오버레이)
let pfdCtx=null,eicasCtx=null,pfdClock=0,eicasClock=0,gpwsTimer=0;
function instInit(){const p=$('pfd'),e=$('eicas');pfdCtx=p.getContext('2d');eicasCtx=e.getContext('2d');pfdCtx.setTransform(2,0,0,2,0,0);eicasCtx.setTransform(2,0,0,2,0,0)}
function txt(c,str,x,y,font,color,align='left'){c.font=font;c.fillStyle=color;c.textAlign=align;c.textBaseline='middle';c.fillText(str,x,y)}
function drawPFD(){const c=pfdCtx,s=state;if(!c||!s)return;c.clearRect(0,0,260,260);
  const cx=120,cy=120,R=78,pitchDeg=s.pitch*180/Math.PI,rollDeg=-s.bank*180/Math.PI,horizon=pitchDeg*2.6;
  c.save();c.beginPath();c.arc(cx,cy,R,0,Math.PI*2);c.clip();
  c.translate(cx,cy);c.rotate(rollDeg);
  c.fillStyle='#7a5230';c.fillRect(-R-20,-R-20,2*R+40,2*R+40);
  c.fillStyle='#1d6fae';c.fillRect(-R-20,-R-20,2*R+40,R+20+horizon);
  c.strokeStyle='#dce7ee';c.lineWidth=1;c.textAlign='center';c.textBaseline='middle';c.font='9px Segoe UI';
  c.beginPath();c.moveTo(-R-10,horizon);c.lineTo(R+10,horizon);c.stroke();
  for(let a=-30;a<=30;a+=5){if(a===0)continue;const y=horizon-a*2.6;if(y<-R||y>R)continue;const w=a%10===0?18:9;c.beginPath();c.moveTo(-w,y);c.lineTo(w,y);c.stroke();if(a%10===0){c.fillStyle='#dce7ee';c.fillText(Math.abs(a),w+9,y)}}
  c.restore();
  c.save();c.beginPath();c.arc(cx,cy,R,0,Math.PI*2);c.clip();c.translate(cx,cy);
  c.fillStyle='#f5b653';c.beginPath();c.moveTo(0,-R+2);c.lineTo(-5,-R+12);c.lineTo(5,-R+12);c.closePath();c.fill();
  c.save();c.rotate(rollDeg);c.strokeStyle='#dce7ee';c.lineWidth=1.5;
  for(const a of [-60,-45,-30,-20,-10,0,10,20,30,45,60]){const ang=a*Math.PI/180,l=a%30===0?10:6,x1=Math.sin(ang)*(R-4),y1=-Math.cos(ang)*(R-4);c.beginPath();c.moveTo(x1,y1);c.lineTo(Math.sin(ang)*(R-4-l),-Math.cos(ang)*(R-4-l));c.stroke()}
  c.restore();
  c.strokeStyle='#f5b653';c.lineWidth=3;c.beginPath();c.moveTo(-40,0);c.lineTo(-13,0);c.moveTo(13,0);c.lineTo(40,0);c.stroke();
  c.lineWidth=2;c.strokeRect(-5,-5,10,10);
  const slip=clamp(Math.sin(s.bank)*s.gLoad*26,-15,15);
  c.fillStyle='#0a2032';c.fillRect(-18,50,36,7);c.strokeStyle='#dce7ee';c.lineWidth=1;c.strokeRect(-18,50,36,7);
  c.fillStyle='#dce7ee';c.beginPath();c.arc(slip,53.5,3,0,Math.PI*2);c.fill();
  if(s.phase==='approach'){c.strokeStyle='#c85ce0';c.lineWidth=1.5;c.beginPath();c.moveTo(-30,66);c.lineTo(30,66);c.stroke();for(const t of [-15,15]){c.beginPath();c.moveTo(t,62);c.lineTo(t,70);c.stroke()}const loc=clamp(-s.x/12,-1,1)*30;c.fillStyle='#c85ce0';c.beginPath();c.moveTo(loc,66);c.lineTo(loc-5,74);c.lineTo(loc+5,74);c.closePath();c.fill();
  c.beginPath();c.moveTo(62,-22);c.lineTo(62,22);c.stroke();for(const t of [-11,11]){c.beginPath();c.moveTo(58,t);c.lineTo(66,t);c.stroke()}const gs=clamp((s.y-referenceAltitude(s.d))/4,-1,1)*22;c.beginPath();c.moveTo(62,gs);c.lineTo(70,gs-5);c.lineTo(70,gs+5);c.closePath();c.fill()}
  c.restore();
  if(s.ap&&s.ap.fd&&(s.ap.on||s.ap.modes.hdg||s.ap.modes.alt||s.ap.modes.vs)){
    c.strokeStyle='#41d97f';c.lineWidth=2;
    let fdPitch=null;if(s.ap.modes.alt)fdPitch=clamp((s.ap.alt-s.y)*.5,-5,5);else if(s.ap.modes.vs)fdPitch=clamp(s.ap.vs,-8,8);
    if(fdPitch!==null){const y=cy-clamp((fdPitch-s.vy)*14,-60,60);c.beginPath();c.moveTo(cx-52,y);c.lineTo(cx+52,y);c.stroke()}
    if(s.ap.modes.hdg){const x=cx+clamp(wrap(s.ap.hdg-s.h)*140,-60,60);c.beginPath();c.moveTo(x,cy-46);c.lineTo(x,cy+46);c.stroke()}
  }
  txt(c,'kt',22,26,'9px Segoe UI','#aec8d7','center');
  const drift=s.instrFail?{spd:Math.sin(performance.now()/1300)*16+Math.sin(performance.now()/410)*6,alt:Math.sin(performance.now()/900)*70+Math.sin(performance.now()/330)*25}:{spd:0,alt:0};
  const spd=s.speed*1.944+drift.spd;
  c.fillStyle='#0a2032';c.fillRect(4,110,40,20);c.strokeStyle='#dce7ee';c.lineWidth=1;c.strokeRect(4,110,40,20);
  txt(c,String(Math.round(spd)),24,120,'16px Segoe UI','#8fe3ff','center');
  for(let k=Math.floor((spd-50)/10)*10;k<=spd+50;k+=10){const y=120-(k-spd)*3.1;if(y<32||y>210)continue;c.strokeStyle='#9fb6c4';c.lineWidth=1;c.beginPath();c.moveTo(30,y);c.lineTo(44,y);c.stroke();if(k%20===0)txt(c,String(k),26,y,'9px Segoe UI','#c6d6df','right')}
  const bug=(v,color)=>{const y=clamp(120-(v-spd)*3.1,34,208);c.fillStyle=color;c.fillRect(4,y-2,7,4)};
  bug(64,'#41d97f');bug(75,'#8fe3ff');bug(FLAPS[clamp(s.flap,0,3)].vfe,'#f5b653');bug(stallSpeed(s.flap)*1.944,'#e8473f');
  txt(c,'m',236,26,'9px Segoe UI','#aec8d7','center');
  const alt=s.y+drift.alt;
  c.fillStyle='#0a2032';c.fillRect(200,110,38,20);c.strokeStyle='#dce7ee';c.strokeRect(200,110,38,20);
  txt(c,String(Math.round(alt)),219,120,'14px Segoe UI','#8fe3ff','center');
  for(let a=Math.floor((alt-200)/50)*50;a<=alt+200;a+=50){const y=120-(a-alt)*.42;if(y<32||y>210)continue;c.strokeStyle='#9fb6c4';c.beginPath();c.moveTo(200,y);c.lineTo(214,y);c.stroke();if(a%100===0)txt(c,String(a),215,y,'9px Segoe UI','#c6d6df','left')}
  if(s.ap&&s.ap.modes&&(s.ap.modes.alt||s.ap.on)&&s.ap.alt>0){const y=clamp(120-(s.ap.alt-alt)*.42,34,208);c.fillStyle='#41d97f';c.fillRect(233,y-2,5,4)}
  txt(c,'V/S',247,26,'8px Segoe UI','#aec8d7','center');
  const vs=s.vy;c.strokeStyle='#9fb6c4';c.beginPath();c.moveTo(246,50);c.lineTo(246,190);c.stroke();
  for(let v=-10;v<=10;v+=5){const y=120-v*7;c.beginPath();c.moveTo(243,y);c.lineTo(249,y);c.stroke()}
  const vy=120-clamp(vs,-10,10)*7;c.strokeStyle='#41d97f';c.lineWidth=2;c.beginPath();c.moveTo(246,120);c.lineTo(246,vy);c.stroke();c.lineWidth=1;
  txt(c,String(Math.round(vs*196.85)),247,205,'9px Segoe UI','#8fe3ff','center');
  c.fillStyle='#0a2032';c.fillRect(42,206,156,26);c.strokeStyle='#dce7ee';c.strokeRect(42,206,156,26);
  const hdg=heading(s.h);
  for(let a=-60;a<=60;a+=5){const x=120+a*2.2;if(x<44||x>196)continue;c.strokeStyle='#9fb6c4';c.beginPath();c.moveTo(x,206);c.lineTo(x,a%10===0?214:210);c.stroke();if(a%10===0)txt(c,String(Math.round(heading(s.h+rad(a))/10)*10%360).padStart(3,'0'),x,221,'8px Segoe UI','#c6d6df','center')}
  c.fillStyle='#0a2032';c.fillRect(106,206,28,20);c.strokeStyle='#8fe3ff';c.strokeRect(106,206,28,20);txt(c,String(Math.round(hdg)).padStart(3,'0'),120,216,'12px Segoe UI','#8fe3ff','center');
  if(s.ap&&s.ap.modes&&s.ap.modes.hdg){const a=wrap(s.ap.hdg-s.h)*180/Math.PI;const x=clamp(120+a*2.2,46,194);c.fillStyle='#41d97f';c.beginPath();c.moveTo(x,206);c.lineTo(x-4,200);c.lineTo(x+4,200);c.closePath();c.fill()}
  const fma=[['A/T',s.ap? s.ap.modes.spd||s.throttle>.05:false],['AP',s.ap&&s.ap.on],['SPD',s.ap&&s.ap.modes.spd],['HDG',s.ap&&s.ap.modes.hdg],['ALT',s.ap&&s.ap.modes.alt],['V/S',s.ap&&s.ap.modes.vs]];
  let fx=6;for(const [label,on] of fma){c.strokeStyle=on?'#41d97f':'#3d5566';c.lineWidth=1;c.strokeRect(fx,4,38,16);txt(c,label,fx+19,12.5,'9px Segoe UI',on?'#41d97f':'#5e7787','center');fx+=40}
  const flash=(Math.floor(performance.now()/280)%2)===0;
  let fx2=6;const flag=(t,col)=>{c.fillStyle=col;c.fillRect(fx2,22,44,14);txt(c,t,fx2+22,29,'9px Segoe UI','#fff','center');fx2+=48};
  if(s.engFail)flag('ENG FAIL','#e8473f');if(s.hydFail)flag('HYD','#f5b653');if(s.instrFail)flag('ADC FAIL','#f5b653');if(s.phase==='goaround')flag('GO AROUND','#41d97f');
  if(s.stall&&flash){c.fillStyle='#e8473f';c.fillRect(4,232,70,22);txt(c,'STALL',39,243,'14px Segoe UI','#fff','center')}
  if(s.overspeed&&flash){c.fillStyle='#f5b653';c.fillRect(80,232,84,22);txt(c,'OVERSPEED',122,243,'12px Segoe UI','#3a2607','center')}
  if(s.phase==='approach'&&!s.gear&&flash){c.fillStyle='#e8473f';c.fillRect(170,232,86,22);txt(c,'GEAR UP',213,243,'12px Segoe UI','#fff','center')}
}
function drawEICAS(){const c=eicasCtx,s=state;if(!c||!s)return;c.clearRect(0,0,200,260);
  txt(c,'EICAS · ICN-CJU',8,10,'10px Segoe UI','#5dd5f5');
  const n1=s.n1*100;
  txt(c,'N1',8,34,'10px Segoe UI','#aec8d7');txt(c,Math.round(n1)+'%',80,34,'18px Segoe UI','#8fe3ff');
  c.fillStyle='#12293c';c.fillRect(8,46,184,10);c.fillStyle=n1>96?'#f5b653':'#41d97f';c.fillRect(8,46,184*clamp(n1/100,0,1),10);
  c.strokeStyle='#476272';c.strokeRect(8,46,184,10);
  txt(c,'EGT',8,70,'10px Segoe UI','#aec8d7');txt(c,Math.round(s.egt)+'°C',80,70,'14px Segoe UI','#8fe3ff');
  const fuelPct=clamp(s.fuel/2400*100,0,100);
  txt(c,'FUEL',8,94,'10px Segoe UI','#aec8d7');txt(c,Math.round(s.fuel)+'kg',80,94,'14px Segoe UI','#8fe3ff');
  c.fillStyle='#12293c';c.fillRect(8,106,184,8);c.fillStyle=fuelPct<20?'#f5b653':'#41d97f';c.fillRect(8,106,184*fuelPct/100,8);c.strokeStyle='#476272';c.strokeRect(8,106,184,8);
  const aoa=s.alpha*180/Math.PI;
  txt(c,'AOA',8,130,'10px Segoe UI','#aec8d7');txt(c,aoa.toFixed(1)+'°',80,130,'14px Segoe UI',s.stall?'#ff5a45':'#8fe3ff');
  const ax=8+clamp(aoa/20,0,1)*184;c.fillStyle='#12293c';c.fillRect(8,142,184,8);c.fillStyle='#e8473f';c.fillRect(8+15/20*184,142,184-15/20*184,8);c.fillStyle='#8fe3ff';c.fillRect(ax-1,140,2,12);
  txt(c,'G',8,166,'10px Segoe UI','#aec8d7');txt(c,s.gLoad.toFixed(2),80,166,'14px Segoe UI',s.gLoad>2.4?'#f5b653':'#8fe3ff');
  txt(c,'FLAP',8,190,'10px Segoe UI','#aec8d7');
  for(let i=0;i<4;i++){const x=52+i*22;c.strokeStyle='#476272';c.strokeRect(x,182,18,16);if(i<=clamp(s.flap,0,3)){c.fillStyle='#41d97f';c.fillRect(x+2,184,14,12);txt(c,String(i),x+9,190,'10px Segoe UI','#0a2032','center')}else txt(c,String(i),x+9,190,'10px Segoe UI','#5e7787','center')}
  txt(c,'GEAR',8,214,'10px Segoe UI','#aec8d7');
  for(let i=0;i<3;i++){const x=52+i*22;c.fillStyle=s.gear?'#41d97f':'#e8473f';c.beginPath();c.arc(x+9,210,6,0,Math.PI*2);c.fill()}
  const pos=(s.trim+rad(2))/rad(8);
  txt(c,'TRIM',8,238,'10px Segoe UI','#aec8d7');c.fillStyle='#12293c';c.fillRect(52,232,140,10);c.strokeStyle='#476272';c.strokeRect(52,232,140,10);c.fillStyle='#8fe3ff';c.fillRect(52+clamp(pos,0,1)*136,230,4,14);
  const warn=[];
  if(s.stall)warn.push(['STALL','#e8473f']);if(s.overspeed)warn.push(['OVERSPEED','#f5b653']);
  if(s.engFail)warn.push(['ENG FAIL','#e8473f']);if(s.hydFail)warn.push(['HYD FAIL','#e8473f']);if(s.instrFail)warn.push(['ADC FAIL','#f5b653']);
  if(s.airborne&&s.speed>FLAPS[clamp(s.flap,0,3)].vfe)warn.push(['FLAP SPEED','#f5b653']);
  if(s.phase==='approach'&&!s.gear)warn.push(['GEAR','#e8473f']);if(s.fuel<300)warn.push(['LOW FUEL','#f5b653']);
  if(warn.length){const w=warn[warn.length-1];c.fillStyle=w[1];c.fillRect(4,246,192,12);txt(c,w[0],100,252,'10px Segoe UI','#0a2032','center')}
  txt(c,'WIND '+Math.round(Math.abs(s.wind)*1.944)+'kt '+(s.wind>=0?'→':'←'),196,10,'9px Segoe UI','#c6d6df','right');
}
function gpwsCall(th){const el=$('gpws');if(!el)return;el.textContent=th==='retard'?'RETARD':String(th);el.style.opacity=1;gpwsTimer=th==='retard'?1.6:1;sound(th==='retard'?300:520,.18,.08)}
function applyFailure(s,type){
  if(type==='engine'){s.engFail=true;atcFail('관제: 비상 접수 · 활공으로 접근하세요, 활주로는 5600m 지점입니다');toast('엔진 고장! 활공합니다 · 출력 없음','#ff947b');sound(180,.6,.1);event('failure',{type});return}
  if(type==='hyd'){s.hydFail=true;atcFail('관제: 유압 저하 접수 · 조작이 무거워집니다');toast('유압 저하 · 조종 반응이 느려집니다','#ff947b');sound(200,.4,.08);event('failure',{type});return}
  if(type==='instr'){s.instrFail=true;atcFail('관제: 계기 고장 접수 · 자세와 출력으로 비행하세요');toast('계기 고장 · 표시 값이 불안정합니다','#ff947b');sound(220,.3,.07);event('failure',{type})}
}
function updateFlightWarnings(s,D){let msg='';
  if(s.stall)msg='실속 경고 · 기수를 낮추고 출력을 올리세요';else if(s.overspeed)msg='과속 경고 · 출력을 줄이세요';
  if(s.airborne&&!msg&&s.speed>FLAPS[clamp(s.flap,0,3)].vfe)msg=`플랩 ${s.flap} 속도 초과 · 플랩을 올리세요`;
  if(s.phase==='approach'&&!msg&&!s.gear)msg='기어 미전개 · G로 기어를 내리세요';
  if(msg&&s.elapsed-(s.warnAt||0)>2.5){s.warnAt=s.elapsed;toast(msg,'#ff947b');sound(150,.2,.06)}
}
function instrumentsFrame(dt){if(gpwsTimer>0){gpwsTimer=Math.max(0,gpwsTimer-dt);if(gpwsTimer===0&&$('gpws'))$('gpws').style.opacity=0}
  if(mode!=='flight'||!state||!active)return;
  pfdClock+=dt;eicasClock+=dt;
  if(pfdClock>=1/30){pfdClock=0;drawPFD()}
  if(eicasClock>=1/10){eicasClock=0;drawEICAS()}
}
PP.instruments={init:instInit,drawPFD,drawEICAS,frame:instrumentsFrame,gpwsCall,warnings:updateFlightWarnings};
