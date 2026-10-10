// 오토파일럿: MCP SPD/HDG/ALT/VS 모드와 플라이트 디렉터
const ap={on:false,fd:true,field:'spd',spd:0,hdg:0,alt:90,vs:0,modes:{spd:false,hdg:false,alt:false,vs:false},engageAt:-9};
function apReset(){ap.on=false;ap.fd=true;ap.field='spd';ap.spd=0;ap.hdg=0;ap.alt=90;ap.vs=0;ap.modes={spd:false,hdg:false,alt:false,vs:false};ap.engageAt=-9;apUpdateUI()}
function apNotify(text,color='#5dd5f5'){toast(text,color);sound(color==='#f5b653'?220:660,.12)}
function apDisengage(reason){if(ap.on)apNotify(reason,'#f5b653');ap.on=false;apUpdateUI()}
function apToggle(){if(mode!=='flight'||!state)return;if(!ap.on){ap.on=true;ap.engageAt=state.elapsed;ap.spd=state.speed;ap.hdg=state.h;ap.alt=Math.round(state.y);ap.vs=clamp(state.vy,-8,8);apNotify('A/P 연결 · 현재 자세 유지')}else apDisengage('A/P 해제 · 수동 비행');apUpdateUI()}
function apSetMode(m){if(mode!=='flight'||!state)return;if(m==='alt'&&!ap.modes.alt)ap.modes.vs=false;if(m==='vs'&&!ap.modes.vs)ap.modes.alt=false;ap.modes[m]=!ap.modes[m];ap.field=m;if(ap.modes[m]){if(m==='spd')ap.spd=state.speed;if(m==='hdg')ap.hdg=state.h;if(m==='alt')ap.alt=Math.round(state.y/100)*100;if(m==='vs')ap.vs=clamp(state.vy,-8,8)}if(!ap.on){ap.on=true;ap.engageAt=state.elapsed;apNotify('A/P 연결 · '+m.toUpperCase()+' 모드')}else apNotify(m.toUpperCase()+' '+(ap.modes[m]?'설정':'해제'));apUpdateUI()}
function apAdjust(m,dir){if(mode!=='flight'||!state)return;ap.field=m;if(m==='spd')ap.spd=clamp(ap.spd+dir*2.572,25,140);if(m==='hdg')ap.hdg=wrap(ap.hdg+dir*rad(5));if(m==='alt')ap.alt=clamp(Math.round(ap.alt+dir*100),0,3000);if(m==='vs')ap.vs=clamp(ap.vs+dir*.508,-8,8);apUpdateUI()}
function apUpdate(s,dt){s.ap={on:ap.on,fd:ap.fd,field:ap.field,spd:ap.spd,hdg:ap.hdg,alt:ap.alt,vs:ap.vs,modes:{...ap.modes}};if(!ap.on)return;
  if(s.engFail){apDisengage('엔진 고장 · A/P 해제');s.ap.on=false;return}
  const manual=keyState.has('ArrowUp')||keyState.has('ArrowDown')||keyState.has('ArrowLeft')||keyState.has('ArrowRight')||keyState.has('KeyW')||keyState.has('KeyS')||keyState.has('KeyA')||keyState.has('KeyD');
  if(manual&&s.elapsed-ap.engageAt>1.2){apDisengage('수동 입력 · A/P 해제');s.ap.on=false;return}
  if(ap.modes.spd){const err=ap.spd-s.speed;s.throttle=clamp(s.throttle+clamp(err*.5,-1,1)*dt*.8,0,1)}
  if(ap.modes.hdg){const tb=clamp(2.6*wrap(ap.hdg-s.h),-rad(25),rad(25));s.ctrl.aileron=clamp((tb-s.bank)*1.6,-1,1)}
  let vsT=null;
  if(ap.modes.alt)vsT=clamp((ap.alt-s.y)*.5,-5,5);
  else if(ap.modes.vs)vsT=clamp(ap.vs,-8,8);
  if(vsT!==null){const rate=(s.vy-(s.prevVy||0))/Math.max(dt,.001);s.prevVy=s.vy;s.ctrl.elevator=clamp((vsT-s.vy)*.07-rate*.04,-1,1)}
  if(!ap.modes.hdg)s.ctrl.aileron=0;
  s.ctrl.rudder=0;
}
function apUpdateUI(){const set=(id,on)=>{const el=$(id);if(el)el.classList.toggle('on',!!on)};set('apToggle',ap.on);set('apFD',ap.fd);for(const m of ['spd','hdg','alt','vs'])set('ap'+m[0].toUpperCase()+m.slice(1),ap.modes[m]);const d=$('apDisplay');if(d)d.textContent=`SPD ${Math.round(ap.spd*1.944)}kt · HDG ${Math.round(heading(ap.hdg))}° · ALT ${Math.round(ap.alt)}m · VS ${ap.vs>=0?'+':''}${Math.round(ap.vs*196.85)}fpm`}
function apBindUI(){$('apToggle').onclick=()=>apToggle();$('apFD').onclick=()=>{ap.fd=!ap.fd;apUpdateUI();toast('플라이트 디렉터 '+(ap.fd?'표시':'숨김'))};for(const m of ['spd','hdg','alt','vs'])$('ap'+m[0].toUpperCase()+m.slice(1)).onclick=()=>apSetMode(m);$('apMinus').onclick=()=>apAdjust(ap.field,-1);$('apPlus').onclick=()=>apAdjust(ap.field,1);apUpdateUI()}
PP.ap={ap,update:apUpdate,reset:apReset,toggle:apToggle,setMode:apSetMode,adjust:apAdjust,bindUI:apBindUI};
