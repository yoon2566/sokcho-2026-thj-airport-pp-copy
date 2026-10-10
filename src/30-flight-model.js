// 6DOF 계열 비행 모델: 양력/항력/추력/중량, 받음각과 실속, 측풍/난류, 지상 활주
const ALPHA_STALL=rad(15),CL0=.2,CL_ALPHA=4.2,CL_MAX_CLEAN=CL0+CL_ALPHA*ALPHA_STALL;
const FLAPS=[{cl:0,drag:0,vfe:999},{cl:.15,drag:.008,vfe:75},{cl:.35,drag:.02,vfe:65},{cl:.55,drag:.045,vfe:55}];
function CLMAX(flap=0){return CL0+CL_ALPHA*ALPHA_STALL+FLAPS[clamp(Math.round(flap),0,3)].cl}
function airDensity(y){return 1.225*Math.exp(-Math.max(0,y)/8500)}
function liftCoefficient(alpha,flap=0){const f=FLAPS[clamp(Math.round(flap),0,3)];const a=clamp(alpha,-.4,.7);const cl=a<=ALPHA_STALL?CL0+CL_ALPHA*a:Math.max(.22,CL_MAX_CLEAN*(1-2.4*(a-ALPHA_STALL)));return cl+f.cl}
function dragCoefficient(cl,o={}){const f=FLAPS[clamp(Math.round(o.flap||0),0,3)];return .042+.045*cl*cl+f.drag+(o.gear?.02:0)+(o.spoiler?.07:0)}
function stallSpeed(flap=0,y=0){return Math.sqrt(2*57*9.81/(airDensity(y)*CLMAX(flap)))}
function routeX(d){const points=[[-200,0],[700,0],[1500,45],[2600,-35],[3800,30],[4500,0],[6300,0]];for(let i=1;i<points.length;i++)if(d<points[i][0])return lerp(points[i-1][1],points[i][1],clamp((d-points[i-1][0])/(points[i][0]-points[i-1][0]),0,1));return 0}
function referenceAltitude(d){return d<650?clamp(d*.16,15,90):d<4500?90:Math.max(0,(5600-d)*.085)}
function updateFlight(dt){
  const s=state;const D=difficulty();s.elapsed+=dt;
  if(s.phase==='boarding'){if(s.boardingStarted){s.boarded=Math.min(120,s.boarded+dt*24);if(s.boarded>=120){s.phase='clearance';event('boarding_complete');toast('관제: 활주로 00 이륙 허가 · Enter로 복창');atcSay('인천 타워: AIRPORT 1703, 이륙 허가, 활주로 00, 풍향 000도 3m/s')}}return}
  if(s.phase==='clearance'||s.phase==='stopped')return;
  if(s.phase==='disembarking'){s.disembark+=dt;if(s.disembark>=5)finish('success','120명의 승객을 인천에서 제주까지 운송하고, 안전 정지 후 하차를 마쳤습니다.');return}
  s.throttle=clamp(s.throttle+input('KeyW','KeyS')*dt*.4,0,1);
  s.ctrl={elevator:input('ArrowUp','ArrowDown'),aileron:input('ArrowRight','ArrowLeft'),rudder:input('KeyD','KeyA')};
  s.speedbrake=keyState.has('Space');s.spoiler=false;
  if(s.failPlan&&!s.failPlan.done&&s.d>=s.failPlan.d){s.failPlan.done=true;applyFailure(s,s.failPlan.type)}
  PP.ap.update(s,dt);
  const ctl=s.ctrl,rho=airDensity(s.y),authMul=s.hydFail?.45:1;
  s.n1=clamp(s.n1+(Math.min(s.throttle,1)-s.n1)*Math.min(1,dt/2.6),0,1.02);
  if(s.engFail){s.n1=Math.max(0,s.n1-dt*.5);s.throttle=Math.min(s.throttle,.05)}
  const thrustAcc=D.thrust*Math.min(s.n1,1)*rho*(s.spoiler?.94:1);
  s.egt=lerp(s.egt,180+s.n1*640,Math.min(1,dt*.6));
  s.fuel=Math.max(0,s.fuel-s.n1*1.15*dt);
  const gust=Math.sin(s.elapsed*.37)*D.wind*.9+Math.sin(s.elapsed*2.3)*D.turbulence*1.2;
  s.wind=($('weather').value==='rain'?-3.2:-.8)*D.wind+gust*.5;
  const windVec=new THREE.Vector3(s.wind,Math.sin(s.elapsed*.61)*D.turbulence*.7,0);
  if(!s.airborne){
    const air=new THREE.Vector3(Math.sin(s.h)*s.speed,0,-Math.cos(s.h)*s.speed).sub(windVec);
    const qd=.5*rho*Math.max(air.lengthSq(),.01);
    const clg=liftCoefficient(s.groundPitch,s.flap);
    const dragAcc=qd*dragCoefficient(clg,{flap:s.flap,gear:true})/57;
    const brake=s.speedbrake?3.1:0;
    s.speed=Math.max(0,s.speed+(thrustAcc-dragAcc-.22-.012*s.speed-brake)*dt);
    const steer=clamp(1-s.speed/60,.15,1);
    s.h+=ctl.rudder*.95*steer*dt+ctl.aileron*.12*steer*dt;
    const rotAuth=clamp(s.speed/44,.25,1);
    s.groundPitch=clamp(s.groundPitch+(ctl.elevator*.3*rotAuth-s.groundPitch*.55)*dt,0,.21);
    s.pitch=s.groundPitch;s.alpha=s.groundPitch;s.bank*=Math.exp(-dt*2);s.slip=0;s.gLoad=1;
    s.x+=Math.sin(s.h)*s.speed*dt;s.d+=Math.cos(s.h)*s.speed*dt;s.vy=0;s.y=0;
    s.vel.set(Math.sin(s.h)*s.speed,0,-Math.cos(s.h)*s.speed);
    const liftG=qd*clg/57;
    if(s.phase==='takeoff'&&s.speed>30&&s.pitch>.03&&liftG>9.2){s.airborne=true;s.phase='climb';s.vel.y=Math.max(1.4,(liftG-9.81)*dt);s.pitch=Math.max(s.groundPitch,rad(8));event('liftoff');toast('이륙 · 고도 90m로 상승 · G 기어 · F 플랩');sound(520);atcSay('인천 디파처: 레이더 접촉, 항로 유지',{ack:false})}
    if(s.phase==='takeoff'&&(s.d>620||Math.abs(s.x)>18)){finish('failed','활주로를 벗어났습니다. 충분한 속도에서 기수를 올리고 중심선을 유지하세요.');return}
    if(s.phase==='rollout'&&(s.d>6240||Math.abs(s.x)>12)){finish('failed','접지 후 활주로를 벗어났습니다. 출력 감소와 브레이크로 활주로 안에서 정지하세요.');return}
    if(s.phase==='rollout'&&s.speed<1&&s.speedbrake){s.speed=0;s.throttle=0;s.n1=Math.min(s.n1,.2);s.phase='stopped';event('safe_stop');toast('완전히 정지했습니다 · Enter로 승객 하차');atcSay('주기 완료 · 승객 하차 승인',{ack:false})}
    updateFlightWarnings(s,D);
    return;
  }
  const vel=s.vel,air=vel.clone().sub(windVec),V=Math.max(air.length(),.1),fdir=air.clone().multiplyScalar(1/V);
  const authority=clamp(V/70,.4,1.1);
  const gamma=Math.asin(clamp(vel.y/V,-1,1));
  s.pitch=clamp(s.pitch+ctl.elevator*D.pitchRate*authority*authMul*dt,-.6,1.35);
  if(!ctl.elevator&&!(ap.on&&(ap.modes.alt||ap.modes.vs)))s.pitch=clamp(s.pitch+((gamma*D.climbHold+s.trim-s.vy*.018*D.altHold)-s.pitch)*(1-Math.exp(-dt*(.6+D.autoLevel+.6*D.altHold))),-.6,1.35);
  s.alpha=clamp(s.pitch-gamma,rad(-8),rad(18));
  const qd=.5*rho*V*V,clMax=CLMAX(s.flap),clReq=9.81*57/Math.max(qd,.01);
  s.stall=clReq>clMax*.985||s.alpha>ALPHA_STALL;
  let cl=liftCoefficient(s.alpha,s.flap);
  if(s.stall)cl=Math.max(cl,clMax*D.stallFloor);
  const buffet=s.stall||clReq>clMax*.86;
  const liftAcc=qd*cl/57*D.assistLift;
  const right=fdir.clone().cross(new THREE.Vector3(0,1,0));if(right.lengthSq()<1e-6)right.set(1,0,0);else right.normalize();
  const liftDir=new THREE.Vector3(0,Math.cos(s.bank),0).addScaledVector(right,Math.sin(s.bank)).normalize();
  const dragAcc=qd*dragCoefficient(cl,{flap:s.flap,gear:s.gear,spoiler:s.spoiler})/57;
  const cp=Math.cos(s.pitch),sp=Math.sin(s.pitch);
  const nose=new THREE.Vector3(Math.sin(s.h)*cp,sp,-Math.cos(s.h)*cp);
  const acc=new THREE.Vector3(0,-9.81,0);
  acc.addScaledVector(liftDir,liftAcc);acc.addScaledVector(fdir,-dragAcc);acc.addScaledVector(nose,thrustAcc);
  if(D.autoLevel===0)acc.addScaledVector(right,-qd*.3*s.slip/57);
  vel.addScaledVector(acc,dt);
  s.bank=clamp(s.bank+ctl.aileron*D.aileronRate*authority*authMul*dt,-rad(D.maxBank),rad(D.maxBank));
  if(!ctl.aileron&&D.autoLevel>0)s.bank*=Math.exp(-dt*D.autoLevel);
  s.slip+=(ctl.rudder*authMul*rad(7)-s.slip)*Math.min(1,dt*2);
  s.pathHdg=Math.atan2(air.x,-air.z);s.h=s.pathHdg+s.slip;
  s.vy=vel.y;s.gLoad=liftAcc/9.81;s.buffet=buffet?1:0;
  s.speed=Math.hypot(vel.x,vel.z);
  s.overspeed=s.speed>115;
  s.x+=vel.x*dt;s.y+=vel.y*dt;s.d+=-vel.z*dt;
  s.maxDeviation=Math.max(s.maxDeviation,Math.abs(s.x-routeX(s.d)));
  if(s.phase==='climb'&&s.d>700){s.phase='route';event('route');toast('관제: 항로를 따라 진행 · 고도 90m 유지')}
  if((s.phase==='route'||s.phase==='climb')&&s.d>4500&&(!s.reApproach||s.reArmed)){s.phase='approach';s.gpws={};if(s.flap<3)s.flap=3;event('approach');toast('제주 관제: 기어 · 54~93kt · 중심선과 하강 경로 확인','#f5b653');atcSay('제주 어프로치: ILS 접근 허가, 활주로 06, 54~93kt 유지')}
  if(s.phase==='approach'&&s.d>5100&&!s.goAroundDone){const ref=referenceAltitude(s.d);if(s.speed>52||s.y>ref+15||!s.gear){s.phase='goaround';s.goAroundDone=true;s.gpws={};s.reArmed=false;event('go_around');atcSay('제주 타워: 복행 지시 · 출력 최대, 기어 업, 300m 상승 후 재접근');toast('복행 · W 최대 출력, G 기어 업, 상승 후 선회','#f5b653');sound(320)}}
  if(s.phase==='goaround'&&s.y>300&&s.vy>0){s.phase='route';s.reApproach=true;toast('재접근 준비 · 선회 후 항로로 복귀하세요')}
  if(s.phase==='route'&&s.reApproach&&s.d<4400)s.reArmed=true;
  if(s.phase==='route'&&s.reApproach&&s.reArmed&&s.d>4500){s.phase='approach';s.gpws={};s.reApproach=false;s.reArmed=false;if(s.flap<3)s.flap=3;event('approach_again');atcSay('제주 어프로치: 재접근 허가, ILS 정렬');toast('재접근 · 기어/플랩 확인','#f5b653')}
  if(s.phase==='approach'){for(const th of [250,100,50,40,30,20,10])if(s.y<=th&&!s.gpws[th]){s.gpws[th]=1;gpwsCall(th)}if(s.y<=20&&!s.gpws.retard&&s.throttle>.25){s.gpws.retard=1;gpwsCall('retard')}}
  if(s.y<=0&&s.phase!=='approach'){finish('failed','지면에 재접촉했습니다. 기수를 유지하고 출력을 올리세요.');}
  else if(s.y<=0){
    const gsDev=s.y-referenceAltitude(s.d);
    s.landing={speed:s.speed,vertical:Math.abs(s.vy),x:s.x,d:s.d,heading:heading(s.h),gear:s.gear,fpm:Math.round(Math.abs(s.vy)*196.85),gsDev:gsDev};
    const valid=s.d>=CONFIG.flight.threshold&&s.d<=CONFIG.flight.runwayEnd&&Math.abs(s.x)<=12&&s.speed>=CONFIG.flight.safeSpeedMin&&s.speed<=CONFIG.flight.safeSpeedMax&&Math.abs(s.vy)<=CONFIG.flight.safeVertical&&Math.abs(wrap(s.h))<=rad(CONFIG.flight.safeHeading)&&s.gear;
    event('touchdown',{valid,...s.landing});
    if(valid){s.airborne=false;s.phase='rollout';s.y=0;s.pitch=0;s.groundPitch=0;s.bank=0;s.alpha=0;s.slip=0;s.vel.y=0;aircraftRig.play('Air_TaxiWheels',true);toast('안전 접지 · S 출력 줄이기 + Space 브레이크');sound(520);screechSound();atcSay('제주 타워: 착륙 확인 · 게이트로 진행',{ack:false})}
    else{const reasons=[];if(s.d<5600||s.d>6240||Math.abs(s.x)>12)reasons.push('활주로 위치');if(s.speed<28||s.speed>48)reasons.push('접지 속도');if(Math.abs(s.vy)>3.6)reasons.push('하강률');if(!s.gear)reasons.push('기어');if(Math.abs(wrap(s.h))>rad(8))reasons.push('진입 방향');finish('failed',`안전 착륙 조건을 맞추지 못했습니다: ${reasons.join(' · ')}. 항로·출력·기수를 다시 조절하세요.`)}
  }
  if(s.y>(s.goAroundDone?420:230)||Math.abs(s.x)>650||s.d>(s.goAroundDone?7600:6600)||s.d< -300)finish('failed','운항 구역을 벗어났습니다. 지도와 관제 지시로 항로를 다시 맞추세요.');
  updateFlightWarnings(s,D);
}
PP.flight={ALPHA_STALL,FLAPS,CLMAX,airDensity,liftCoefficient,dragCoefficient,stallSpeed,routeX,referenceAltitude,updateFlight};
