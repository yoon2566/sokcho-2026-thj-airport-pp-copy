let aircraftRig,cockpitRig,droneRig,ringRigs=[];
function resetRig(rg){if(rg){rg.mixer.stopAllAction();rg.mixer.update(0)}}
function analyzeClipTrack(clip,nodeName){const track=clip.tracks.find(t=>t.name===nodeName+'.quaternion');if(!track)return null;const v=track.values;let best=null;
  for(let i=0;i<v.length;i+=4){let x=v[i],y=v[i+1],z=v[i+2],w=v[i+3];if(w<0){x=-x;y=-y;z=-z;w=-w}const ang=2*Math.acos(clamp(w,-1,1));if(!best||ang>best.ang){const s=Math.sqrt(Math.max(1e-9,1-w*w));best={ang,axis:new THREE.Vector3(x/s||1,y/s,z/s)}}}
  return best}
function analyzeVisuals(){const vis=PP.visual={surfaces:[],doors:[],cockpit3d:{}};
  const clipCS=assets.airliner.animations.find(c=>c.name==='Air_ControlSurfaces'),clipFL=assets.airliner.animations.find(c=>c.name==='Air_FlapsDeploy');
  const surfaceMap={aileron:['AileronHinge_L','AileronHinge_R'],elevator:['ElevatorHinge_L','ElevatorHinge_R'],rudder:['RudderHinge'],flap:['FlapHinge_L','FlapHinge_R']};
  for(const key of Object.keys(surfaceMap)){const clip=key==='flap'?clipFL:clipCS;for(const name of surfaceMap[key]){const node=plane.getObjectByName(name);if(!node)continue;const a=clip&&analyzeClipTrack(clip,name);vis.surfaces.push({key,node,axis:a?a.axis.clone():new THREE.Vector3(1,0,0),max:a?a.ang:rad(15)})}}
  plane.updateWorldMatrix(true,true);
  for(const name of ['Door_L6.3','Door_L-6.8','Door_R6.3','Door_R-6.8','DoorInset_L6.3','DoorInset_L-6.8','DoorInset_R6.3','DoorInset_R-6.8']){const node=plane.getObjectByName(name);if(!node)continue;
    const box=new THREE.Box3().setFromObject(node),parent=node.parent,cornerA=parent.worldToLocal(new THREE.Vector3(box.min.x,box.min.y,box.min.z)),cornerB=parent.worldToLocal(new THREE.Vector3(box.max.x,box.max.y,box.max.z));
    const minY=Math.min(cornerA.y,cornerB.y),maxY=Math.max(cornerA.y,cornerB.y),minZ=Math.min(cornerA.z,cornerB.z);
    vis.doors.push({node,basePos:node.position.clone(),baseQuat:node.quaternion.clone(),pivot:new THREE.Vector3(node.position.x,(minY+maxY)/2,minZ),dir:node.position.x<0?-1:1})}
  for(const name of ['HorizonSky1','HorizonSky4','HorizonEarth1','HorizonEarth4','HorizonLine1','HorizonLine4']){const node=cockpit.getObjectByName(name);if(node)vis.cockpit3d[name]={node,basePos:node.position.clone(),baseQuat:node.quaternion.clone()}}
}
async function loadAssets(){
  for(const id of ['airliner','cockpit','drone','runway','ring','airport_incheon','airport_jeju'])assets[id]=await loadEmbeddedGLB(window.__ASSETS__,id);
  model('airliner',plane);model('cockpit',cockpit);model('drone',drone);
  aircraftRig=rig(plane,'airliner');cockpitRig=rig(cockpit,'cockpit');droneRig=rig(drone,'drone');
  analyzeVisuals();
}
