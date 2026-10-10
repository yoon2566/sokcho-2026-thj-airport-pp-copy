// ATC 무전: 단계별 관제 메시지, Enter 복창, 재송신, 무전 로그
const atc={log:[],expect:false,ack:0,miss:0,wait:0,last:'',callsign:'AIRPORT 1703',freq:'118.10'};
function atcReset(){atc.log=[];atc.expect=false;atc.ack=0;atc.miss=0;atc.wait=0;atc.last='';atcUI()}
function atcSay(text,opts={}){const ack=opts.ack!==false;atc.log.push({t:state&&state.elapsed||0,text,type:'atc'});if(atc.log.length>40)atc.log.shift();atc.last=text;if(ack){atc.expect=true;atc.wait=opts.repeat||12}sound(1180,.07,.05);setTimeout(()=>sound(880,.06,.04),90);atcUI()}
function atcReadback(){if(!atc.expect)return false;atc.expect=false;atc.ack++;atc.log.push({t:state&&state.elapsed||0,text:atc.callsign+' 복창: '+atc.last,type:'ack'});sound(760,.09,.05);atcUI();return true}
function atcUpdate(dt){if(!atc.expect)return;atc.wait-=dt;if(atc.wait<=0){if(atc.miss<2){atc.miss++;atc.log.push({t:state&&state.elapsed||0,text:'(재송신) '+atc.last,type:'miss'});sound(1180,.07,.05);atc.wait=10;atcUI()}else{atc.miss++;atc.log.push({t:state&&state.elapsed||0,text:'(복창 생략) '+atc.last,type:'miss'});atc.expect=false;atcUI()}}}
function atcFail(text){atcSay(text,{ack:false})}
function atcUI(){const log=$('radioLog'),exp=$('radioExpect');if(!log)return;log.innerHTML=atc.log.slice(-6).map(e=>`<div class="${e.type}">${e.type==='atc'?'☏ ':e.type==='ack'?'✓ ':e.type==='miss'?'! ':''}${e.text}</div>`).join('');exp.textContent=atc.expect?'▶ Enter 복창':''}
PP.atc={state:atc,reset:atcReset,say:atcSay,readback:atcReadback,update:atcUpdate,ui:atcUI};
