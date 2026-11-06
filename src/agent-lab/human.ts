import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

export interface HumanAppearance {skin:string;hair:string;jacket:string;glasses:boolean;}
export type HumanPose='idle'|'wave'|'walk';
export const defaultAppearance:HumanAppearance={skin:'#b57c5c',hair:'#292323',jacket:'#29545f',glasses:true};

/** Articulated, entirely local geometry. Dimensions are in metres. */
export function createHumanAgent(appearance:HumanAppearance=defaultAppearance){
 const root=new T.Group();root.name='Nexo_Human_01';
 const material=(color:string,roughness=.6,metalness=0)=>new T.MeshPhysicalMaterial({color,roughness,metalness,clearcoat:metalness?.25:.04,clearcoatRoughness:.5});
 const skin=material(appearance.skin,.68),skinShade=material(appearance.skin,.76);skinShade.color.multiplyScalar(.79);
 const lip=material('#85574f',.57),mouthInk=material('#4b3030',.85),nail=material('#d7ac98',.4);
 const hair=material(appearance.hair,.53),hairLight=material(appearance.hair,.46);hairLight.color.multiplyScalar(1.22);
 const jacket=material(appearance.jacket,.76),seam=material(appearance.jacket,.85);seam.color.multiplyScalar(.72);
 const shirt=material('#e4e8e1',.88),trouser=material('#293341',.9),shoe=material('#ece9df',.52),sole=material('#afb5b0',.82);
 const ink=material('#161f2b',.4),eyeWhite=material('#e8e7db',.28),iris=material('#56645b',.3),pupil=material('#10191d',.18);
 const metal=material('#b7b4a7',.29,.8),gold=material('#c4a575',.34,.6);
 const cornea=new T.MeshPhysicalMaterial({color:'#ffffff',transparent:true,opacity:.13,roughness:.06,clearcoat:1,depthWrite:false});
 const materials=[skin,skinShade,lip,mouthInk,nail,hair,hairLight,jacket,seam,shirt,trouser,shoe,sole,ink,eyeWhite,iris,pupil,metal,gold,cornea];
 function add(geometry:T.BufferGeometry,mat:T.Material,parent:T.Object3D,name?:string){const mesh=new T.Mesh(geometry,mat);mesh.castShadow=true;mesh.receiveShadow=true;if(name)mesh.name=name;parent.add(mesh);return mesh;}
 function ellipsoid(parent:T.Object3D,mat:T.Material,x:number,y:number,z:number,sx:number,sy:number,sz:number,name?:string){const m=add(new T.SphereGeometry(1,32,24),mat,parent,name);m.position.set(x,y,z);m.scale.set(sx,sy,sz);return m;}
 function box(parent:T.Object3D,mat:T.Material,w:number,h:number,d:number,x:number,y:number,z:number,r=.01,name?:string){const m=add(new RoundedBoxGeometry(w,h,d,3,Math.min(r,w/3,h/3,d/3)),mat,parent,name);m.position.set(x,y,z);return m;}
 function tube(parent:T.Object3D,mat:T.Material,points:number[][],radius:number,name?:string){return add(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p as [number,number,number]))),Math.max(12,points.length*8),radius,8,false),mat,parent,name);}
 function limb(parent:T.Object3D,mat:T.Material,start:T.Vector3,end:T.Vector3,radius:number,name?:string){const delta=end.clone().sub(start);const length=delta.length();const m=add(new T.CapsuleGeometry(radius,Math.max(.001,length-radius*2),8,20),mat,parent,name);m.position.copy(start).add(end).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());return m;}
 function patch(parent:T.Object3D,mat:T.Material,points:number[][],depth=.005,name?:string){const shape=new T.Shape();points.forEach((p,i)=>i?shape.lineTo(p[0],p[1]):shape.moveTo(p[0],p[1]));shape.closePath();return add(new T.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSize:.0015,bevelThickness:.0015,bevelSegments:2,steps:1}),mat,parent,name);}
 function ringSurface(rings:number[][],segments=64){
  const vertices:number[]=[],uvs:number[]=[],indices:number[]=[];
  rings.forEach(([y,rx,rz,offset=0],i)=>{for(let j=0;j<=segments;j++){const a=j/segments*Math.PI*2;vertices.push(Math.sin(a)*rx,y,Math.cos(a)*rz+offset);uvs.push(j/segments,i/(rings.length-1));}});
  for(let i=0;i<rings.length-1;i++)for(let j=0;j<segments;j++){const a=i*(segments+1)+j,b=a+segments+1;indices.push(a,a+1,b,b,a+1,b+1);}
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;
 }
 // Tailored silhouette: trousers, articulated knees and layered sneakers.
 ellipsoid(root,trouser,0,.935,0,.172,.115,.108,'Pelvis');
 box(root,ink,.318,.029,.2,0,1.002,0,.008,'Belt');box(root,metal,.034,.023,.009,0,1.003,.108,.003,'Belt_buckle');
 const legs:{hip:T.Group;knee:T.Group;foot:T.Group}[]=[];
 for(const side of [-1,1]){
  const hip=new T.Group();hip.name=side<0?'Leg_L':'Leg_R';hip.position.set(side*.097,.9185,0);root.add(hip);
  limb(hip,trouser,new T.Vector3(0,-.018,0),new T.Vector3(side*.008,-.395,0),.072,'Trouser_thigh');
  tube(hip,seam,[[side*.059,-.06,.017],[side*.061,-.2,.015],[side*.054,-.36,.01]],.0012,'Trouser_outer_seam');
  const knee=new T.Group();knee.position.set(side*.008,-.395,0);hip.add(knee);
  limb(knee,trouser,new T.Vector3(0,0,0),new T.Vector3(0,-.365,0),.052,'Trouser_calf');
  box(knee,trouser,.105,.028,.105,0,-.342,0,.008,'Trouser_cuff');
  const foot=new T.Group();foot.position.y=-.365;knee.add(foot);
  box(foot,sole,.139,.033,.284,0,-.142,.068,.01,'Sneaker_sole');
  box(foot,shoe,.133,.068,.27,0,-.104,.065,.02,'Sneaker_upper');
  ellipsoid(foot,shoe,0,-.067,-.005,.057,.057,.065,'Sneaker_heel');
  box(foot,shirt,.065,.009,.11,0,-.063,.065,.003,'Sneaker_tongue');
  for(let i=0;i<5;i++)tube(foot,shirt,[[-.027,-.054-i*.003,.027+i*.019],[0,-.05-i*.003,.034+i*.019],[.027,-.054-i*.003,.027+i*.019]],.0022,'Shoelace');
  tube(foot,seam,[[-.062,-.119,-.023],[-.063,-.115,.08],[-.045,-.118,.18],[0,-.12,.197],[.045,-.118,.18],[.063,-.115,.08],[.062,-.119,-.023]],.0009,'Sneaker_stitch');
  legs.push({hip,knee,foot});
 }
 const torso=new T.Group();torso.name='Torso';torso.position.y=1;root.add(torso);
 add(ringSurface([[-.025,.157,.097],[.06,.164,.101],[.19,.157,.105],[.35,.207,.111],[.45,.232,.1],[.49,.13,.075],[.495,.01,.01]]),jacket,torso,'Jacket_body');
 const front=patch(torso,shirt,[[-.061,.467],[-.08,.32],[-.057,.034],[.057,.034],[.08,.32],[.061,.467]],.004,'Shirt_front');front.position.z=.114;
 for(const side of [-1,1]){
  const lapel=patch(torso,jacket,[[side*.052,.478],[side*.142,.434],[side*.101,.342],[side*.073,.37],[side*.032,.24]],.006,'Jacket_lapel');lapel.position.z=.126;
  tube(torso,seam,[[side*.133,.432,.135],[side*.09,.347,.139],[side*.034,.243,.134]],.0012,'Lapel_stitch');
  const collar=patch(torso,shirt,[[side*.005,.477],[side*.043,.51],[side*.066,.473],[side*.045,.421]],.004,'Shirt_collar');collar.position.z=.112;
  box(torso,seam,.076,.009,.01,side*.111,.122,.107,.002,'Pocket_opening');
  tube(torso,seam,[[side*.128,.42,-.081],[side*.153,.27,-.09],[side*.126,.06,-.084]],.0011,'Jacket_back_seam');
 }
 for(let i=0;i<4;i++)ellipsoid(torso,metal,0,.38-i*.084,.132,.0032,.0032,.002,'Shirt_button');
 box(torso,metal,.065,.025,.006,.123,.327,.121,.003,'Agent_badge');box(torso,shirt,.039,.009,.002,.123,.327,.126,.002,'Badge_inset');
 ellipsoid(torso,gold,.147,.372,.114,.006,.006,.002,'Lapel_pin');
 // Hands have separate palms, knuckles, thumbs, finger segments and nails.
 const arms:{shoulder:T.Group;elbow:T.Group;hand:T.Group;fingers:T.Group[]}[]=[];
 for(const side of [-1,1]){
  const shoulder=new T.Group();shoulder.name=side<0?'Arm_L':'Arm_R';shoulder.position.set(side*.218,.438,0);torso.add(shoulder);
  limb(shoulder,jacket,new T.Vector3(0,0,0),new T.Vector3(side*.036,-.25,.008),.059,'Sleeve_upper');
  const elbow=new T.Group();elbow.position.set(side*.036,-.25,.008);shoulder.add(elbow);
  limb(elbow,jacket,new T.Vector3(0,.015,0),new T.Vector3(side*.014,-.225,.025),.043,'Sleeve_lower');
  box(elbow,shirt,.077,.027,.077,side*.014,-.219,.025,.008,'Shirt_cuff');ellipsoid(elbow,metal,side*.05,-.217,.029,.0035,.0035,.0035,'Cuff_button');
  const hand=new T.Group();hand.name=side<0?'Hand_L':'Hand_R';hand.position.set(side*.014,-.236,.025);elbow.add(hand);
  limb(hand,skin,new T.Vector3(0,.014,0),new T.Vector3(0,-.027,0),.025,'Wrist');
  ellipsoid(hand,skin,0,-.052,0,.036,.041,.018,'Palm');
  const fingers:T.Group[]=[];
  for(let i=0;i<4;i++){
   const finger=new T.Group();finger.name='Finger_'+i;finger.position.set((i-1.5)*.018,-.076,.002);hand.add(finger);
   const length=[.055,.069,.064,.049][i];
   limb(finger,skin,new T.Vector3(0,0,0),new T.Vector3(0,-length*.55,.003),.0078,'Finger_proximal');
   limb(finger,skin,new T.Vector3(0,-length*.55,.003),new T.Vector3(0,-length,.009),.0068,'Finger_distal');
   ellipsoid(finger,skin,0,-length*.53,.004,.0083,.008,.008,'Knuckle');
   box(finger,nail,.009,.014,.0017,0,-length+.009,.016,.001,'Fingernail');
   tube(finger,skinShade,[[-.005,-length*.48,.010],[0,-length*.5,.012],[.005,-length*.48,.01]],.00065,'Finger_crease');fingers.push(finger);
  }
  limb(hand,skin,new T.Vector3(side*.028,-.032,0),new T.Vector3(side*.048,-.06,.012),.0105,'Thumb_base');
  limb(hand,skin,new T.Vector3(side*.048,-.06,.012),new T.Vector3(side*.043,-.084,.026),.0086,'Thumb_tip');
  ellipsoid(hand,nail,side*.043,-.08,.033,.006,.009,.0015,'Thumbnail');
  tube(hand,skinShade,[[-.018,-.034,.016],[-.006,-.045,.019],[.013,-.04,.017]],.0008,'Palm_crease');
  arms.push({shoulder,elbow,hand,fingers});
 }
 // Face shell is contoured through jaw, cheekbones, temples and forehead.
 limb(torso,skin,new T.Vector3(0,.49,0),new T.Vector3(0,.65,0),.043,'Neck');
 const head=new T.Group();head.name='Head';head.position.set(0,.785,0);torso.add(head);
 add(ringSurface([[-.151,.008,.012,.013],[-.14,.049,.057,.013],[-.115,.077,.077,.012],[-.065,.104,.092,.003],[-.015,.117,.102,-.003],[.05,.116,.104,-.012],[.107,.096,.089,-.015],[.145,.052,.055,-.019],[.155,.001,.001,-.019]]),skin,head,'Face_contour');
 ellipsoid(head,skin,0,.003,.107,.012,.033,.019,'Nose_bridge');ellipsoid(head,skin,0,-.024,.131,.019,.015,.021,'Nose_tip');
 for(const side of [-1,1]){ellipsoid(head,skin,side*.016,-.028,.12,.01,.009,.014,'Nose_ala');ellipsoid(head,skinShade,side*.012,-.034,.133,.0045,.0024,.003,'Nostril');tube(head,skinShade,[[side*.005,-.042,.11],[side*.006,-.05,.11]],.0007,'Philtrum');}
 const eyes:{lid:T.Mesh;gaze:T.Group}[]=[];
 for(const side of [-1,1]){
  const x=side*.046,y=.026;
  ellipsoid(head,skin,x,.057,.085,.032,.012,.015,'Brow_ridge');
  ellipsoid(head,eyeWhite,x,y,.103,.025,.012,.014,'Eye_sclera');
  const gaze=new T.Group();gaze.position.set(x,y,.117);head.add(gaze);
  ellipsoid(gaze,iris,0,0,0,.009,.009,.0026,'Iris');ellipsoid(gaze,pupil,0,0,.0028,.0042,.0048,.0012,'Pupil');
  ellipsoid(gaze,cornea,0,0,.004,.01,.01,.003,'Cornea');ellipsoid(gaze,shirt,-.003,.003,.007,.0018,.0018,.0005,'Eye_catchlight');
  tube(head,skin,[[x-.025,y,.104],[x-.014,y+.012,.112],[x,y+.013,.115],[x+.015,y+.01,.112],[x+.025,y,.104]],.0027,'Upper_eyelid');
  tube(head,skinShade,[[x-.025,y-.001,.103],[x-.012,y-.01,.11],[x+.009,y-.011,.112],[x+.025,y-.001,.103]],.0018,'Lower_eyelid');
  tube(head,hair,[[x-.023,y+.002,.106],[x-.012,y+.012,.114],[x+.01,y+.011,.116],[x+.024,y+.001,.105]],.0008,'Eyelash_line');
  const lid=ellipsoid(head,skin,x,y,.113,.026,.014,.009,'Blink_lid');lid.visible=false;eyes.push({lid,gaze});
  for(let i=0;i<12;i++){const bx=x-.027+i*.0045;tube(head,i%3?hair:hairLight,[[bx,.058-Math.abs(i-5.5)*.0007,.105],[bx+side*.003,.063-Math.abs(i-5.5)*.0007,.105]],.0008,'Eyebrow_hair');}
  ellipsoid(head,skin,side*.119,-.004,-.01,.021,.037,.019,'Ear');ellipsoid(head,skinShade,side*.135,-.004,-.001,.005,.023,.013,'Ear_concha');
  tube(head,skin,[[side*.135,-.027,.003],[side*.141,-.015,.009],[side*.142,.011,.006],[side*.135,.027,-.002],[side*.128,.018,-.011]],.0032,'Ear_helix');
  ellipsoid(head,skin,side*.13,-.012,.014,.005,.009,.006,'Ear_tragus');
 }
 const mouth=new T.Group();mouth.position.set(0,-.064,.106);head.add(mouth);
 function setExpression(smile:number){for(const child of [...mouth.children]){if(child instanceof T.Mesh)child.geometry.dispose();mouth.remove(child);}const s=T.MathUtils.clamp(smile,0,1);
  tube(mouth,mouthInk,[[-.028,.003+s*.007,0],[-.014,-.001,.006],[0,-.002,.007],[.014,-.001,.006],[.028,.003+s*.007,0]],.0018,'Mouth_line');
  tube(mouth,lip,[[-.028,.004+s*.007,0],[-.013,.004,.006],[0,.006,.006],[.013,.004,.006],[.028,.004+s*.007,0]],.0024,'Upper_lip');
  tube(mouth,lip,[[-.027,.001+s*.007,0],[-.013,-.007-s*.002,.006],[0,-.009-s*.002,.008],[.013,-.007-s*.002,.006],[.027,.001+s*.007,0]],.003,'Lower_lip');
  if(s>.25)box(mouth,eyeWhite,.034,.004+s*.003,.002,0,-.002,.008,.001,'Teeth');
 }
 setExpression(.45);
 // Swept hair with separate fine strands and cropped sides.
 const scalp=add(new T.SphereGeometry(.121,48,32,0,Math.PI*2,0,1.13),hair,head,'Hair_cap');scalp.position.set(0,.037,-.014);scalp.scale.set(1,1.09,.9);
 ellipsoid(head,hair,0,.024,-.088,.103,.092,.034,'Hair_back');
 for(const side of [-1,1]){ellipsoid(head,hair,side*.104,.027,-.035,.015,.066,.061,'Hair_temple');box(head,hair,.012,.037,.023,side*.108,-.025,-.002,.005,'Sideburn');}
 for(let i=0;i<42;i++){const t=i/41;const x=-.095+t*.19;tube(head,i%4?hair:hairLight,[[x*.75,.125-Math.abs(x)*.15,-.063],[x-.025,.173-Math.abs(x)*.19,-.014],[x+.013,.151-Math.abs(x)*.16,.059],[x+.009,.094+Math.abs(x)*.1,.089]],.0017+(i%3)*.0002,'Hair_strand');}
 const glasses=new T.Group();glasses.name='Glasses';head.add(glasses);
 for(const side of [-1,1]){const rim=add(new T.TorusGeometry(.027,.0018,8,48),ink,glasses,'Glasses_rim');rim.position.set(side*.046,.026,.124);rim.scale.y=.72;tube(glasses,metal,[[side*.072,.035,.12],[side*.115,.033,.066],[side*.131,.018,-.009]],.0016,'Glasses_temple');}
 tube(glasses,metal,[[-.019,.032,.125],[0,.039,.133],[.019,.032,.125]],.0015,'Glasses_bridge');
 glasses.visible=appearance.glasses;
 function setAppearance(next:Partial<HumanAppearance>){if(next.skin){skin.color.set(next.skin);skinShade.color.set(next.skin).multiplyScalar(.79);nail.color.set(next.skin).lerp(new T.Color('#efd8c6'),.35);}if(next.hair){hair.color.set(next.hair);hairLight.color.set(next.hair).multiplyScalar(1.22);}if(next.jacket){jacket.color.set(next.jacket);seam.color.set(next.jacket).multiplyScalar(.72);}if(next.glasses!==undefined)glasses.visible=next.glasses;}
 function update(t:number,pose:HumanPose='idle',motion=true){const clock=motion?t:0;torso.scale.y=1+Math.sin(clock*1.65)*.002;head.rotation.set(Math.sin(clock*.7)*.012,Math.sin(clock*.45)*.045,Math.sin(clock*.9)*.008);root.position.y=pose==='walk'&&motion?Math.abs(Math.sin(clock*5.7))*.008:0;
  legs.forEach(({hip,knee,foot},i)=>{const phase=clock*5.7+i*Math.PI;hip.rotation.x=pose==='walk'?Math.sin(phase)*.31:0;knee.rotation.x=pose==='walk'?Math.max(0,-Math.sin(phase))*.47:0;foot.rotation.x=pose==='walk'?-Math.sin(phase)*.09:0;});
  arms.forEach(({shoulder,elbow,hand,fingers},i)=>{const side=i?1:-1;shoulder.rotation.set(pose==='walk'?-Math.sin(clock*5.7+i*Math.PI)*.25:Math.sin(clock*1.2+i)*.018,0,side*.055);elbow.rotation.set(-.09,0,0);hand.rotation.set(.03,0,0);fingers.forEach((f,j)=>f.rotation.x=.04+Math.sin(clock*.8+j)*.02);if(pose==='wave'&&i===1){shoulder.rotation.z=2.15;shoulder.rotation.x=-.12;elbow.rotation.z=.2+Math.sin(clock*4)*.13;hand.rotation.z=Math.sin(clock*4)*.18;fingers.forEach(f=>f.rotation.x=-.025);}});
  const blink=motion?Math.pow(Math.max(0,Math.cos((clock%4.7-2.9)*Math.PI*6)),18):0;
  eyes.forEach(({lid,gaze})=>{const amount=clock%4.7>2.73&&clock%4.7<3.07?blink:0;lid.visible=amount>.04;lid.scale.y=.014*amount;lid.position.y=.026+.014*(1-amount);gaze.position.x=Math.sign(gaze.position.x)*.046+Math.sin(clock*.45)*.001;});
 }
 update(0);
 function dispose(){const geometries=new Set<T.BufferGeometry>();root.traverse(o=>{if(o instanceof T.Mesh)geometries.add(o.geometry);});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());}
 return {root,head,arms,legs,setExpression,setAppearance,update,dispose};
}
