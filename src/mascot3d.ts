import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {mascotKind} from './mascots';
import {MANAGER_ID,type Agent} from './domain';

/** Volumetric companions matching the SVGs; never flat sprites in the office. */
export function createMascot3D(agent:Agent){
 const root=new T.Group(),head=new T.Group(),arms:T.Group[]=[],feet:T.Mesh[]=[];
 const kind=mascotKind(agent);
 const shell=new T.MeshStandardMaterial({color:agent.color,roughness:.48,metalness:.015});
 const cream=new T.MeshStandardMaterial({color:'#fff0d8',roughness:.78});
 const ink=new T.MeshStandardMaterial({color:'#253d42',roughness:.24});
 const white=new T.MeshStandardMaterial({color:'#ffffff',roughness:.2});
 const blush=new T.MeshStandardMaterial({color:'#e6aaa5',roughness:.7});
 const gold=new T.MeshStandardMaterial({color:'#f4d699',roughness:.4});
 function ellipsoid(x:number,y:number,z:number,sx:number,sy:number,sz:number,material:T.Material,parent:T.Object3D=root){const mesh=new T.Mesh(new T.SphereGeometry(1,24,16),material);mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
 function rounded(w:number,h:number,d:number,r:number,material:T.Material,parent:T.Object3D){const mesh=new T.Mesh(new RoundedBoxGeometry(w,h,d,4,r),material);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
 const body=ellipsoid(0,.99,0,.38,.37,.31,shell);
 ellipsoid(0,.98,.25,.22,.25,.07,cream);
 for(const side of [-1,1]){
  feet.push(ellipsoid(side*.23,.61,.16,.21,.12,.25,shell));
  const arm=new T.Group();arm.position.set(side*.4,1.13,0);root.add(arm);ellipsoid(0,-.11,.04,.13,.20,.14,shell,arm);arms.push(arm);
 }
 root.add(head);head.position.y=1.52;head.scale.set(1.08,1.02,1.04);
 rounded(.98,.77,.7,.28,shell,head);
 for(const side of [-1,1]){
  if(kind==='bunny'){const ear=ellipsoid(side*.25,.6,0,.13,.41,.13,shell,head);ear.rotation.z=-side*.15;const inner=ellipsoid(side*.25,.61,.105,.062,.27,.035,cream,head);inner.rotation.z=-side*.15;}
  else if(kind==='bear'){ellipsoid(side*.43,.32,0,.21,.22,.16,shell,head);ellipsoid(side*.43,.32,.125,.12,.13,.045,cream,head);}
  else {const ear=new T.Mesh(new T.ConeGeometry(.23,kind==='owl'?.29:.4,4),shell);ear.position.set(side*.34,.43,0);ear.rotation.z=-side*.23;ear.rotation.y=Math.PI/4;ear.castShadow=true;head.add(ear);if(kind!=='owl'){const inner=new T.Mesh(new T.ConeGeometry(.12,.23,3),cream);inner.position.set(side*.34,.45,.15);head.add(inner);}}
 }
 if(kind==='owl')for(const side of [-1,1])ellipsoid(side*.22,-.01,.32,.225,.245,.075,cream,head);
 if(kind==='fox')for(const side of [-1,1]){const cheek=ellipsoid(side*.2,-.14,.31,.26,.19,.08,cream,head);cheek.rotation.z=-side*.4;}
 if(kind!=='owl'&&kind!=='fox')ellipsoid(0,-.16,.345,.19,.14,.045,cream,head);
 for(const side of [-1,1]){
  ellipsoid(side*.205,.035,.424,.058,.078,.032,ink,head);
  ellipsoid(side*.205-.013,.061,.451,.019,.023,.009,white,head);
  ellipsoid(side*.205+.017,.009,.452,.008,.01,.006,white,head);
  ellipsoid(side*.33,-.09,.418,.07,.032,.013,blush,head);
 }
 ellipsoid(0,-.12,.447,kind==='owl'?.043:.041,kind==='owl'?.055:.029,.025,kind==='owl'?gold:ink,head);
 const smilePath=new T.CatmullRomCurve3([new T.Vector3(-.065,-.207,.438),new T.Vector3(0,-.229,.447),new T.Vector3(.065,-.215,.387)]);
 head.add(new T.Mesh(new T.TubeGeometry(smilePath,12,.011,6,false),ink));
 if(kind==='bear'){
  const band=new T.Mesh(new T.TorusGeometry(.51,.045,8,32,Math.PI),ink);band.position.set(0,.06,0);head.add(band);
  for(const side of [-1,1])ellipsoid(side*.49,0,.02,.075,.15,.13,cream,head);
  const mic=rounded(.17,.065,.07,.03,ink,head);mic.position.set(.17,-.27,.4);
 }
 if(kind==='cat'){
  for(const side of [-1,1]){const whisker=rounded(.14,.018,.02,.008,ink,head);whisker.position.set(side*.35,-.18,.35);whisker.rotation.z=-side*.2;}
  const badge=rounded(.19,.12,.025,.025,ink,root);badge.position.set(0,1.03,.305);
  for(const side of [-1,1]){const code=rounded(.012,.06,.012,.004,white,root);code.position.set(side*.045,1.03,.323);code.rotation.z=side*.4;}
 }
 if(kind==='bunny'){
  const shape=new T.Shape();for(let i=0;i<10;i++){const a=i*Math.PI/5-Math.PI/2,r=i%2?.045:.1;const x=Math.cos(a)*r,y=Math.sin(a)*r;if(i===0)shape.moveTo(x,y);else shape.lineTo(x,y);}shape.closePath();const star=new T.Mesh(new T.ExtrudeGeometry(shape,{depth:.025,bevelEnabled:true,bevelSize:.006,bevelThickness:.006,bevelSegments:2,steps:1}),gold);star.position.set(0,1.05,.3);root.add(star);
 }
 if(kind==='owl')for(let i=0;i<3;i++){const chart=rounded(.035,.06+i*.04,.025,.01,gold,root);chart.position.set((i-1)*.07,.98+i*.02,.31);}
 if(kind==='fox'){
  const tail=ellipsoid(.46,.9,-.17,.22,.31,.2,shell);tail.rotation.z=-.6;ellipsoid(.62,1.02,-.17,.14,.16,.14,cream);
  const brush=rounded(.04,.31,.04,.015,gold,root);brush.position.set(.44,.98,.18);brush.rotation.z=-.5;ellipsoid(.52,1.15,.18,.07,.095,.06,blush);
 }
 if(agent.id===MANAGER_ID){const tie=rounded(.09,.17,.026,.015,ink,root);tie.position.set(0,1.05,.327);const pin=rounded(.12,.038,.025,.012,gold,root);pin.position.set(.14,1.08,.321);}
 root.rotation.y=.25;
 // A compact plush silhouette: the tummy meets short paws when standing.
 const torso=new T.Group();
 for(const child of [...root.children])if(!feet.includes(child as T.Mesh))torso.add(child);
 root.add(torso);
 const legs=[-1,1].map(side=>ellipsoid(side*.22,.32,.035,.15,.14,.16,shell));
 function setStanding(progress:number){const p=T.MathUtils.clamp(progress,0,1);torso.position.y=-.36*p;feet.forEach(foot=>{foot.position.y=.61-.4*p;foot.position.z=.16-.1*p;});legs.forEach(leg=>{leg.visible=p>.001;leg.scale.y=.14*p;});}
 setStanding(0);
 return {root,head,arms,body,setStanding};
}
