function weather(){const wet=$('weather').value==='rain',tod=$('time')?$('time').value:'day';
  const sky={day:['#759bab','#172c43'],dusk:['#54617e','#1d2338'],night:['#060d19','#040910']}[tod];
  scene.background=new THREE.Color(wet?sky[1]:sky[0]);
  const fogCfg={day:[wet?850:4000,wet?3700:11500],dusk:[wet?650:2200,wet?3000:9000],night:[wet?480:1400,wet?2200:6500]}[tod];
  scene.fog=new THREE.Fog(wet?sky[1]:sky[0],fogCfg[0],fogCfg[1]);
  const sunCfg={day:[wet?1.25:2.8,wet?'#a2c2d5':'#ffdfb3'],dusk:[wet?.5:1.15,wet?'#7f8fb0':'#ff9a63'],night:[wet?.06:.14,wet?'#4a5f80':'#7fa0d0']}[tod];
  sun.intensity=sunCfg[0];sun.color.set(sunCfg[1]);
  sun.position.set(tod==='night'?-300:tod==='dusk'?-350:-150,tod==='night'?180:tod==='dusk'?90:500,tod==='night'?300:tod==='dusk'?350:400);
  hemi.intensity=({day:2,dusk:.85,night:.35})[tod];
  renderer.toneMappingExposure=({day:wet?1.3:1.15,dusk:1.1,night:.95})[tod];
  if(rainParticles)rainParticles.visible=wet;
  applyNight(tod);
}
function prepareLights(){const vis=PP.visual||(PP.visual={});const emitters=[],windows=[],screens=[];
  const tagEmitter=m=>{if(m&&!emitters.includes(m)){m.userData.baseEmissive=m.emissiveIntensity??1;emitters.push(m)}};
  flightWorld.traverse(o=>{if(!o.isMesh)return;const mats=Array.isArray(o.material)?o.material:[o.material];for(const m of mats){if(!m)continue;if(m.name==='WhiteLight'||m.name==='Amber'||m.name==='Red')tagEmitter(m);if(/Lamp|LightPole/i.test(o.name||''))tagEmitter(m)}});
  plane.traverse(o=>{if(!o.isMesh)return;if(/CabinWindow/.test(o.name||'')){const mats=Array.isArray(o.material)?o.material:[o.material];for(const m of mats){if(!m||!m.emissive)continue;if(!windows.includes(m)){m.userData.baseEmissive=m.emissiveIntensity??1;windows.push(m)}}}});
  cockpit.traverse(o=>{if(!o.isMesh)return;if(/ScreenGlass/.test(o.name||'')){const mats=Array.isArray(o.material)?o.material:[o.material];for(const m of mats){if(!m||!m.emissive)continue;if(!screens.includes(m)){m.userData.baseEmissive=m.emissiveIntensity??1;screens.push(m)}}}});
  if(!vis.landingLight){const l=new THREE.SpotLight(0xfff2d0,0,900,.34,.5,1);l.position.set(0,1.4,-2.2);plane.add(l);plane.add(l.target);l.target.position.set(0,-1,-140);vis.landingLight=l}
  if(!vis.cockpitLight){const p=new THREE.PointLight(0x8fd6ff,0,14,2);p.position.set(0,1.6,-.4);cockpit.add(p);vis.cockpitLight=p}
  vis.emitters=emitters;vis.windows=windows;vis.screens=screens;
}
function applyNight(tod){const vis=PP.visual||{};const night=tod==='night',dusk=tod==='dusk';
  for(const m of vis.emitters){m.emissiveIntensity=night?2.6:dusk?1.6:(m.userData.baseEmissive||1)}
  for(const m of vis.windows){m.emissive.set(0xffdf9e);m.emissiveIntensity=night?2.1:dusk?.5:0}
  for(const m of vis.screens){m.emissive.set(0x5dd5f5);m.emissiveIntensity=night?1.4:dusk?.7:.15}
  if(vis.landingLight){vis.landingBase=night?850:dusk?300:0;vis.landingLight.intensity=vis.landingBase}
  if(vis.cockpitLight)vis.cockpitLight.intensity=night?2.4:.4;
  vis.timeOfDay=tod;
}
function buildEnvironment(){
  box(19000,.2,19000,'#235166',0,-4,-2900);
  const land=new THREE.Mesh(new THREE.CircleGeometry(710,64),material('#536451'));land.rotation.x=-Math.PI/2;land.position.set(0,-.45,-5800);world.add(land);
  const land2=land.clone();land2.scale.set(1.4,1,1);land2.position.set(0,-.45,100);world.add(land2);
  const rand=random(9417);for(let i=0;i<32;i++){const cloud=new THREE.Mesh(new THREE.SphereGeometry(1,8,6),material('#afbdc5'));cloud.position.set((rand()-.5)*4200,230+rand()*140,-rand()*6600);cloud.scale.set(70+rand()*90,36+rand()*30,50+rand()*65);world.add(cloud)}
  model('airport_incheon',flightWorld,[70,0,-200]);model('airport_jeju',flightWorld,[72,0,-5900]);
  model('runway',flightWorld,[0,.04,-200],[1,1,10]);model('runway',flightWorld,[0,.04,-5920],[1,1,8]);
  model('airliner',flightWorld,[37,2.13,-250]);
  for(let d=-170;d<700;d+=20){box(.25,.22,.25,'#5dd5f5',-12,.15,-d,flightWorld);box(.25,.22,.25,'#5dd5f5',12,.15,-d,flightWorld)}
  for(let d=5600;d<=6240;d+=20){const m=new THREE.MeshBasicMaterial({color:'#f5b653'});for(const x of [-12,12]){const o=new THREE.Mesh(new THREE.SphereGeometry(.32,6,5),m);o.position.set(x,.25,-d);flightWorld.add(o)}}
  for(let d=5460;d<5600;d+=20)for(const x of [-2,0,2]){const o=new THREE.Mesh(new THREE.SphereGeometry(.28,6,5),new THREE.MeshBasicMaterial({color:'#dce7ee'}));o.position.set(x,.14,-d);flightWorld.add(o)}
  for(let i=0;i<4;i++){const o=new THREE.Mesh(new THREE.BoxGeometry(.7,.4,.5),new THREE.MeshBasicMaterial({color:i<2?'#e8473f':'#efe6d5'}));o.position.set(-8+i*5.4,.7,-5555);flightWorld.add(o)}
  box(180,.14,420,'#536454',0,0,-190,droneWorld);for(let d=0;d<400;d+=10){box(.15,.04,2,'#8fa19c',0,.09,-d,droneWorld)}
  for(const x of [-24,24]){box(.4,1,400,'#708a84',x,.5,-190,droneWorld);for(let d=10;d<400;d+=26)box(.1,3,.1,'#c1cdc8',x,1.5,-d,droneWorld)}
  const rp=new Float32Array(450*3);for(let i=0;i<450;i++){rp[i*3]=(rand()-.5)*70;rp[i*3+1]=rand()*45;rp[i*3+2]=(rand()-.5)*80}const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(rp,3));rainParticles=new THREE.Points(geo,new THREE.PointsMaterial({color:'#9ebccf',size:.11,transparent:true,opacity:.5}));scene.add(rainParticles);
  prepareLights();
}
