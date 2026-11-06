import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {SVGLoader} from 'three/addons/loaders/SVGLoader.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import viasoftLogo from '../public/viasoft-logo.svg?raw';
import {createMascot3D} from './mascot3d';
import {mascotKind,mascotSvg} from './mascots';
import {MANAGER_ID,type Agent,type RoomId} from './domain';
import {arrangeAgents,officeFootprint} from './agent-layout';
import {MEETING_ROOMS,meetingSeat,routeToMeeting,routeBackToDesk,type MeetingAssignment,type Point} from './meeting-layout';
export function createOffice(container:HTMLDivElement,agents:Agent[],onSelect:(id:string)=>void,getStatus:(id:string)=>string){
 agents=arrangeAgents(agents);
 const scene=new T.Scene();scene.background=null;scene.fog=new T.FogExp2('#10242e',.008);
 const renderer=new T.WebGLRenderer({antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;container.append(renderer.domElement);
 const environmentGenerator=new T.PMREMGenerator(renderer);const environmentRoom=new RoomEnvironment();const environmentTarget=environmentGenerator.fromScene(environmentRoom,.04);scene.environment=environmentTarget.texture;scene.environmentIntensity=.3;environmentRoom.dispose();environmentGenerator.dispose();
 // Start close to the desks, with the front-facing view used by the home control.
 const homeOffset=new T.Vector3(-1.5,12,22);
 const camera=new T.PerspectiveCamera(36,1,.1,150);camera.position.copy(homeOffset).add(new T.Vector3(5.5,0,0));
 const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(5.5,0,0);controls.enableDamping=true;controls.autoRotate=false;controls.minDistance=7;controls.maxDistance=70;controls.maxPolarAngle=Math.PI/2.3;controls.minPolarAngle=.3;
 let destination:T.Vector3=null;const home=camera.position.clone(),origin=new T.Vector3(5.5,0,0);let target=origin.clone();let layoutInitialized=false;let lastDepth=12;
 scene.add(new T.HemisphereLight('#e8f0ef','#323232',1.8));const sun=new T.DirectionalLight('#fff3e3',2.7);sun.position.set(-5,14,8);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-15,right:32,top:20,bottom:-20});sun.shadow.normalBias=.025;sun.shadow.bias=-.0002;sun.shadow.radius=4;scene.add(sun);const fill=new T.PointLight('#b8b8b8',45,24);fill.position.set(5,7,-3);scene.add(fill);const rim=new T.DirectionalLight('#c7e5ef',1.5);rim.position.set(7,7,-8);scene.add(rim);
 const mats=new Map<string,T.MeshStandardMaterial>();function mat(color:string){if(!mats.has(color))mats.set(color,new T.MeshStandardMaterial({color,roughness:.58}));return mats.get(color)!;}
 function box(w:number,h:number,d:number,color:string,x:number,y:number,z:number,parent:T.Object3D=scene){const radius=Math.min(w,h,d)*.17;const m=new T.Mesh(new RoundedBoxGeometry(w,h,d,2,radius),mat(color));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 const footprintMeshes:{mesh:T.Mesh;depth:number}[]=[];
 function slab(w:number,h:number,d:number,color:string,x:number,y:number,z:number){const mesh=box(w,h,d,color,x,y,z);footprintMeshes.push({mesh,depth:d});return mesh;}
 function cyl(r:number,rt:number,h:number,color:string,x:number,y:number,z:number,parent:T.Object3D=scene){const m=new T.Mesh(new T.CylinderGeometry(r,rt,h,24),mat(color));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 function sphere(r:number,color:string,x:number,y:number,z:number,parent:T.Object3D=scene){const m=new T.Mesh(new T.SphereGeometry(r,24,16),mat(color));m.position.set(x,y,z);m.castShadow=true;parent.add(m);return m;}
 // Floating architectural base with a warm stone floor and a recessed light seam.
 const ground=new T.Mesh(new T.PlaneGeometry(200,200),new T.ShadowMaterial({color:'#020d14',opacity:.28}));ground.rotation.x=-Math.PI/2;ground.position.y=-.84;ground.receiveShadow=true;scene.add(ground);
 slab(16.35,.3,12.35,'#173e49',0,-.42,0);slab(16.12,.09,12.12,'#cfbd9e',0,-.225,0);slab(16,.16,12,'#e4e2da',0,-.1,0);
 const glowMaterial=new T.MeshStandardMaterial({color:'#d7f1ef',emissive:'#c6e9e6',emissiveIntensity:1.3});
 const floorGlow=slab(16.17,.025,12.17,'#d7f1ef',0,-.27,0);floorGlow.material=glowMaterial;
 // Solid central wall gives the sculpted wordmark a calm, uninterrupted backdrop.
 box(16,3.7,.24,'#e4e7e1',0,1.8,-6);slab(.24,2.65,12,'#34606a',-8,1.275,0);
 box(16.1,.1,.32,'#f0ede5',0,3.68,-6);slab(.3,.1,12.05,'#c3d0cb',-8,2.62,0);
 box(15.8,.12,.08,'#254b55',0,.06,-5.83);slab(.08,.12,11.8,'#254b55',-7.83,.06,0);
 // Two tall window bays frame the brand wall instead of sitting behind the logo.
 for(const x of [-5.75,5.75]){box(3.2,2.8,.12,'#224b57',x,2.03,-5.82);const pane=box(3.01,2.6,.05,'#a3c4c6',x,2.03,-5.73);pane.material=new T.MeshPhysicalMaterial({color:'#a3c4c6',roughness:.22,metalness:.18,clearcoat:.8});for(const dx of [-.51,.51])box(.035,2.62,.065,'#dce7e3',x+dx,2.03,-5.68);box(3.12,.07,.24,'#e9e7df',x,.64,-5.67);}
 // Slim oak ribs add depth at both edges of the central plaster wall.
 for(const side of [-1,1])for(let i=0;i<5;i++)box(.065,3.27,.09,'#b99f78',side*(3.36+i*.13),1.91,-5.8);
 const wallWash=box(6.4,.035,.055,'#d7f1ef',0,3.46,-5.78);wallWash.material=glowMaterial;
 // Individual extruded logo shapes, including their counters, fixed directly to the wall.
 const brand=new T.Group();brand.position.set(-2.65,2.8,-5.835);scene.add(brand);
 const logoScale=5.3/158.153;
 const logoMaterial=new T.MeshStandardMaterial({color:'#003b49',roughness:.3,metalness:.32});
 const logoData=new SVGLoader().parse(viasoftLogo);
 for(const path of logoData.paths)for(const shape of SVGLoader.createShapes(path)){
  const geometry=new T.ExtrudeGeometry(shape,{depth:2.4,bevelEnabled:true,bevelThickness:.18,bevelSize:.12,bevelSegments:2,curveSegments:18,steps:1});
  const letter=new T.Mesh(geometry,logoMaterial);letter.scale.set(logoScale,-logoScale,logoScale);letter.castShadow=true;letter.receiveShadow=true;brand.add(letter);
 }
 // A low, floating credenza anchors the brand wall without framing the letters.
 box(5.9,.55,.6,'#285561',0,.53,-5.35);box(6.02,.065,.68,'#cdb793',0,.84,-5.35);
 for(const x of [-1.96,0,1.96]){box(1.9,.45,.025,'#396b76',x,.54,-5.035);box(.28,.018,.025,'#a5c0c2',x,.69,-5.01);}
 for(const x of [-2.5,2.5])box(.08,.23,.38,'#173f4b',x,.16,-5.35);
 // Acoustic timber now frames the manager's workstation instead of lounge seating.
 for(let i=0;i<17;i++)box(.045,1.95,.065,'#547a7d',-7.825,1.42,1.7+i*.22);
 // Coffee nook and a restrained equipment zone.
 box(2.5,.88,.62,'#285561',-5.55,.46,-5.25);box(2.6,.07,.72,'#cdb793',-5.55,.94,-5.25);box(.48,.45,.4,'#163b46',-5.92,1.2,-5.24);cyl(.12,.1,.17,'#eee7d9',-5.32,1.06,-5.2);
 function plant(x:number,z:number,size=1){cyl(.23*size,.18*size,.48*size,'#ddd7c9',x,.24*size,z);cyl(.035,.035,1.05*size,'#657348',x,.77*size,z);for(let i=0;i<7;i++){const a=i*2.4;const leaf=sphere(.21*size,i%2?'#688664':'#8fa77a',x+Math.cos(a)*.21*size,(.79+i*.085)*size,z+Math.sin(a)*.21*size);leaf.scale.set(1,1.7,.55);}}
 [[-7.25,-4.9,1.2],[7.25,-4.95,1.2],[7.4,5.5,.8],[-7,1.15,.8]].forEach(p=>plant(p[0],p[1],p[2]));
 for(const x of [5.85,6.9]){box(.8,2.15,.72,'#173b46',x,1.1,-5.03);box(.67,1.96,.035,'#244f5a',x,1.1,-4.65);for(let unit=0;unit<6;unit++){const y=.31+unit*.3;box(.59,.22,.04,'#102f39',x,y,-4.62);for(let vent=0;vent<4;vent++)box(.07,.016,.012,'#547984',x-.19+vent*.1,y,-4.592);const led=box(.024,.024,.012,'#d7f1ef',x+.24,y+.06,-4.59);led.material=glowMaterial;}}
 // Compact pendant fixtures keep the centre of the dollhouse unobstructed.
 for(const x of [-2.8,2.8]){const fixture=new T.Group();fixture.position.set(x,3.82,-.75);scene.add(fixture);for(const z of [-.42,.42]){box(2.85,.055,.045,'#204550',0,0,z,fixture);const strip=box(2.72,.018,.025,'#d7f1ef',0,-.036,z,fixture);strip.material=glowMaterial;}for(const side of [-1,1]){box(.045,.055,.88,'#204550',side*1.4,0,0,fixture);box(.012,.75,.012,'#6b8c91',side*1.15,.4,0,fixture);}}
 // The meeting wing continues the existing floor through an open circulation aisle.
 box(12.35,.3,12.35,'#173e49',14,-.42,0);box(12.12,.09,12.12,'#cfbd9e',14,-.225,0);box(12,.16,12,'#e4e2da',14,-.1,0);
 const wingGlow=box(12.17,.025,12.17,'#d7f1ef',14,-.27,0);wingGlow.material=glowMaterial;
 // Only the desk area and access aisle grow; the meeting wing keeps its footprint.
 const corridorExtension=[{mesh:box(2.6,.3,1,'#173e49',9.3,-.42,6.675),edge:6.175},{mesh:box(2.6,.09,1,'#cfbd9e',9.3,-.225,6.56),edge:6.06},{mesh:box(2.6,.16,1,'#e4e2da',9.3,-.1,6.5),edge:6}];
 box(12,3.35,.2,'#e4e7e1',14,1.625,-6);box(12.1,.1,.3,'#f0ede5',14,3.32,-6);
 const roomLabels:{room:typeof MEETING_ROOMS[number];node:HTMLButtonElement}[]=[];
 const glassMaterial=new T.MeshPhysicalMaterial({color:'#a1d7de',transparent:true,opacity:.13,roughness:.12,metalness:.05,depthWrite:false,side:T.DoubleSide});
 for(const room of MEETING_ROOMS){
  box(9.1,.018,5.35,room.id==='aurora'?'#91b7bb':'#aaa4bb',room.x,.012,room.z);
  // Door openings stay clear on the corridor side; low glass keeps both rooms visible.
  for(const side of [-1,1]){box(.07,2.7,1.75,'#416875',10.55,1.35,room.z+side*1.86);const pane=box(.025,2.48,1.58,'#a1d7de',10.55,1.35,room.z+side*1.86);pane.material=glassMaterial;}
  box(.09,.08,1.85,'#365e69',10.55,2.73,room.z);box(.09,2.7,.065,'#365e69',10.55,1.35,room.z-.93);box(.09,2.7,.065,'#365e69',10.55,1.35,room.z+.93);
  box(.07,1.05,5.65,'#416875',19.88,.525,room.z);const outer=box(.026,.86,5.48,'#a1d7de',19.88,.55,room.z);outer.material=glassMaterial;
  // A low oval-ended conference table with matching compact chairs.
  box(3.85,.12,1.35,'#d4c2a6',room.x,.98,room.z);for(const dx of [-1.25,1.25])box(.14,.89,.72,'#28535e',room.x+dx,.48,room.z);
  for(let i=0;i<5;i++){const seat=meetingSeat(room.id,i);const chair=new T.Group();chair.position.set(seat.x,0,seat.z);chair.rotation.y=seat.rotation-Math.PI;scene.add(chair);box(.82,.14,.7,'#214d5a',0,.605,0,chair);box(.76,.62,.12,'#315f6c',0,.98,.4,chair);cyl(.06,.08,.47,'#92acb1',0,.3,0,chair);box(.66,.06,.56,'#315f6c',0,.06,0,chair);}
  for(const dx of [-.9,.9]){box(.48,.035,.3,'#b9d4d6',room.x+dx,1.065,room.z+.14);cyl(.075,.065,.12,'#eee7d9',room.x+dx+.35,1.09,room.z+.1);}
  box(2.8,.78,.09,'#173e4b',room.x,1.95,room.z-2.76);box(2.57,.57,.025,'#93bbc2',room.x,1.95,room.z-2.7);for(let line=0;line<3;line++)box(1.3-line*.23,.025,.015,room.accent,room.x-.3,2.12-line*.14,room.z-2.68);
  box(9.35,.09,.11,'#365e69',15.2,2.75,room.z-2.85);
  const roomStrip=box(8.9,.018,.035,'#d7f1ef',15.2,2.69,room.z-2.85);roomStrip.material=glowMaterial;
  const label=document.createElement('button');label.className='meeting-room-label';label.innerHTML='<span></span><small>Livre</small>';label.querySelector('span').textContent=room.name;label.onclick=()=>focusRoom(room.id);container.append(label);roomLabels.push({room,node:label});
 }
 // Divider between the rooms: solid lower sill and a translucent upper partition.
 box(9.45,.16,.1,'#365e69',15.2,.1,0);const divider=box(9.35,2.45,.035,'#a1d7de',15.2,1.4,0);divider.material=glassMaterial;
 // Solid enclosure for Sala Horizonte. Its upper wall cuts away from outside views.
 box(9.45,.65,.16,'#365e69',15.2,.325,5.89);box(9.5,.08,.22,'#c5d1ce',15.2,.68,5.89);
 const horizonWallMaterial=new T.MeshStandardMaterial({color:'#dce3dd',roughness:.75,transparent:true,opacity:.22,depthWrite:false});
 const horizonWall=box(9.35,2,.13,'#dce3dd',15.2,1.72,5.89);horizonWall.material=horizonWallMaterial;
 box(9.5,.075,.2,'#c5d1ce',15.2,2.76,5.89);for(const x of [10.55,19.88])box(.09,2.72,.17,'#365e69',x,1.36,5.89);
 plant(9.1,-5.45,.75);
 let meetingGoals=new Map<string,MeetingAssignment>();
 let disposed=false;const sceneWaiters=new Set<()=>void>();
 function waitForCondition(check:()=>boolean,signal?:AbortSignal){return new Promise<void>((resolve,reject)=>{if(signal?.aborted){reject(new DOMException('Interrompido','AbortError'));return;}if(check()){resolve();return;}const started=Date.now();const done=(error?:Error)=>{clearInterval(timer);signal?.removeEventListener('abort',abort);sceneWaiters.delete(cleanup);error?reject(error):resolve();};const abort=()=>done(new DOMException('Interrompido','AbortError'));const cleanup=()=>done(Error('O escritório foi fechado.'));const timer=setInterval(()=>{if(disposed)cleanup();else if(check())done();else if(Date.now()-started>90000)done(Error('A equipe não conseguiu chegar ao destino. Retome o projeto para tentar novamente.'));},80);signal?.addEventListener('abort',abort,{once:true});sceneWaiters.add(cleanup);});}
 const floorGrid=new T.Group();scene.add(floorGrid);
 function updateFootprint(list:Agent[]){
  const bounds=officeFootprint(list);const extension=bounds.front-6;corridorExtension.forEach(({mesh,edge})=>{mesh.visible=extension>.001;mesh.scale.z=Math.max(.001,extension);mesh.position.z=edge+extension/2;});footprintMeshes.forEach(({mesh,depth})=>{mesh.scale.z=(bounds.depth+depth-12)/depth;mesh.position.z=bounds.centerZ;});
  release(floorGrid);floorGrid.clear();for(let x=-6;x<20;x+=2)box(.009,.003,x>10.6?11.8:bounds.depth-.2,'#c3c9c6',x,.002,x>10.6?0:bounds.centerZ,floorGrid);for(let z=-4;z<bounds.front;z+=2)box(z>=6?18.4:27.8,.003,.009,'#c3c9c6',z>=6?1.3:6,.002,z,floorGrid);
  origin.set(5.5,0,bounds.centerZ);home.copy(origin).add(homeOffset.clone().multiplyScalar(bounds.scale));controls.maxDistance=Math.max(70,home.distanceTo(origin)*1.5);camera.far=Math.max(150,controls.maxDistance*3);camera.updateProjectionMatrix();
  sun.shadow.camera.bottom=-Math.max(20,bounds.front+8);sun.shadow.camera.top=Math.max(20,bounds.front+8);sun.shadow.camera.updateProjectionMatrix();
  if(!layoutInitialized){camera.position.copy(home);controls.target.copy(origin);target.copy(origin);}else if(Math.abs(lastDepth-bounds.depth)>.01&&!conversationId&&!meetingGoals.size){const offset=camera.position.clone().sub(controls.target);const ratio=Math.min(1.06,Math.max(.94,(bounds.depth+28)/(lastDepth+28)));target.copy(origin);destination=origin.clone().add(offset.multiplyScalar(ratio));}
  lastDepth=bounds.depth;layoutInitialized=true;
 }
 const group=new T.Group();scene.add(group);let people:{hit:T.Mesh;person:T.Group;head:T.Group;arms:T.Group[];a:Agent;carpet:T.Mesh;halo:T.Mesh;stand:number;setStanding:(progress:number)=>void;mode:'desk'|'outbound'|'meeting'|'returning';goalKey:string;route:Point[];trail:Point[];meeting:MeetingAssignment|null}[]=[];let labels:HTMLButtonElement[]=[];let highlight:string=null;let selected:string=null;let conversationId:string=null;
 function release(root:T.Object3D){const materials=new Set<T.Material>();root.traverse(o=>{if(o instanceof T.Mesh){o.geometry.dispose();for(const material of Array.isArray(o.material)?o.material:[o.material]){if(![...mats.values()].includes(material)&&material!==glowMaterial)materials.add(material);}}});materials.forEach(m=>m.dispose());}
 function rebuild(list:Agent[]){list=arrangeAgents(list);const previous=new Map(people.map(p=>[p.a.id,{stand:p.stand,mode:p.mode,goalKey:p.goalKey,route:p.route.map(v=>({...v})),trail:p.trail.map(v=>({...v})),meeting:p.meeting,position:p.person.position.clone().add(p.person.parent.position),rotation:p.person.rotation.clone()}]));updateFootprint(list);release(group);group.clear();people=[];labels.forEach(l=>l.remove());labels=[];
 list.forEach((a,i)=>{const x=a.x??([-3,1,5,-2,3][i]??((i%4)*3.4-5));const z=a.z??([-2.5,-2.5,-2.5,2,2][i]??(Math.floor(i/4)*3.2-2));
 const station=new T.Group();station.position.set(x,0,z);group.add(station);
 const stationColor=a.color;
 if(a.id===MANAGER_ID){box(2.9,.025,.045,'#cdb079',0,1.18,.6,station);box(.7,.16,.035,'#214d5b',0,.97,.66,station);for(let n=0;n<3;n++)box(.06,.045+n*.025,.015,'#d6bf8e',-.1+n*.1,.98,.685,station);}
 const carpet=box(3.15,.012,2.75,'#a7bdbc',0,.018,.22,station);
 box(a.id===MANAGER_ID?2.95:2.65,.105,1.3,'#dcc8a7',0,1.12,0,station);box(2.49,.035,1.17,'#b6a17e',0,1.05,0,station);for(const dx of [-1.13,1.13]){for(const dz of [-.43,.43])box(.075,1.04,.075,'#28535e',dx,.55,dz,station);box(.09,.06,.93,'#214956',dx,.08,0,station);box(.075,.065,.93,'#28535e',dx,1.045,0,station);}
 box(.42,.61,.64,'#c6d3d2',.86,.65,0,station);for(let drawer=0;drawer<2;drawer++){box(.4,.29,.04,'#e0e5db',.86,.5+drawer*.32,.4,station);box(.13,.03,.035,'#6a9299',.86,.53+drawer*.32,.43,station);}
 box(.1,.35,.1,'#476c74',0,1.35,-.32,station);box(.6,.04,.3,'#385f69',0,1.2,-.3,station);box(1.3,.8,.1,'#163d47',0,1.68,-.37,station);const screen=box(1.17,.66,.015,'#96b6b6',0,1.68,-.31,station);screen.material=new T.MeshStandardMaterial({color:stationColor,emissive:stationColor,emissiveIntensity:.25,roughness:.25});
 for(let line=0;line<5;line++)box(.32+(line%3)*.15,.018,.018,line%2?'#a9dce3':'#4b929e',-.15,1.86-line*.085,-.292,station);
 box(.8,.025,.42,'#527f89',0,1.214,.28,station);box(.65,.035,.22,'#e0e5db',-.05,1.24,.25,station);for(let row=0;row<3;row++)for(let key=0;key<8;key++)box(.047,.006,.037,'#8cabae',-.3+key*.07,1.26,.18+row*.06,station);box(.15,.05,.21,'#d7e3df',.62,1.23,.28,station);cyl(.11,.09,.19,'#e8f0ef',-.91,1.27,.25,station);
 const handle=new T.Mesh(new T.TorusGeometry(.085,.02,8,16),mat('#e8f0ef'));handle.position.set(-1.02,1.29,.25);handle.rotation.y=Math.PI/2;station.add(handle);
 cyl(.13,.13,.035,'#385f69',1,1.23,-.3,station);cyl(.025,.025,.45,'#58838e',1,1.45,-.3,station);const lamp=cyl(.14,.23,.15,stationColor,1,1.73,-.3,station);lamp.rotation.z=-.2;box(.35,.025,.45,'#a5d4dc',-.85,1.23,-.2,station);box(.31,.015,.4,stationColor,-.85,1.25,-.2,station);
 // The seat supports the body; the backrest stays behind the mascot facing the desk.
 const chair=new T.Group();chair.position.z=1.05;station.add(chair);
 box(.92,.14,.78,'#123540',0,.605,0,chair);
 box(.84,.62,.12,'#163c46',0,.98,.47,chair);
 box(.68,.43,.035,'#315e69',0,1,.397,chair);
 cyl(.065,.085,.43,'#bcbcbc',0,.32,0,chair);
 for(const side of [-1,1]){box(.055,.28,.055,'#999999',side*.52,.77,.12,chair);box(.14,.07,.48,'#14313b',side*.52,.93,.02,chair);}
 for(let k=0;k<5;k++){const angle=k*Math.PI*2/5;const spoke=box(.52,.055,.07,'#999999',Math.cos(angle)*.23,.12,Math.sin(angle)*.23,chair);spoke.rotation.y=-angle;const wheel=cyl(.075,.075,.08,'#003b49',Math.cos(angle)*.48,.09,Math.sin(angle)*.48,chair);wheel.rotation.z=Math.PI/2;}
 const companion=createMascot3D(a);const person=companion.root;person.position.set(0,.085,1.05);person.rotation.y=Math.PI;station.add(person);

 const halo=new T.Mesh(new T.RingGeometry(.75,.79,48),new T.MeshBasicMaterial({color:stationColor,transparent:true,opacity:.25,side:T.DoubleSide,depthWrite:false}));halo.rotation.x=-Math.PI/2;halo.position.set(0,.075,.96);station.add(halo);
 const hit=box(1.4,2.7,1.4,'#ffffff',0,1.35,.95,station);hit.visible=false;hit.userData.agent=a.id;people.push({hit,person,head:companion.head,arms:companion.arms,a,carpet,halo,stand:conversationId===a.id?1:0,setStanding:companion.setStanding,mode:'desk',goalKey:'',route:[],trail:[],meeting:null});const saved=previous.get(a.id);if(saved){const p=people[people.length-1];p.stand=saved.stand;p.mode=saved.mode;p.goalKey=saved.goalKey;p.route=saved.route;p.trail=saved.trail;p.meeting=saved.meeting;p.person.position.copy(saved.position).sub(station.position);p.person.rotation.copy(saved.rotation);companion.setStanding(p.stand);}
 const label=document.createElement('button');label.className='agent-label';if(a.id===MANAGER_ID)label.classList.add('manager-label');label.innerHTML=`<span class="status-dot"></span><span></span><small></small>`;label.querySelector('span:nth-child(2)').textContent=a.name;label.querySelector('small').textContent=a.role;label.insertAdjacentHTML('afterbegin',mascotSvg(mascotKind(a),stationColor,`label-${i}`));label.setAttribute('aria-label',`Selecionar ${a.name}, ${a.role}`);label.onclick=()=>onSelect(a.id);container.append(label);labels.push(label);
 });}
 rebuild(agents);
 const ray=new T.Raycaster(),mouse=new T.Vector2();let down=null;renderer.domElement.addEventListener('pointerdown',e=>down={x:e.clientX,y:e.clientY});function pick(e){const r=renderer.domElement.getBoundingClientRect();mouse.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(mouse,camera);return ray.intersectObjects(people.map(p=>p.hit))[0]?.object.userData.agent;}
 renderer.domElement.addEventListener('pointermove',e=>{highlight=pick(e);renderer.domElement.style.cursor=highlight?'pointer':'grab';});renderer.domElement.addEventListener('pointerup',e=>{if(down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)<6){const id=pick(e);if(id)onSelect(id);}});

 const resize=()=>{renderer.setSize(container.clientWidth,container.clientHeight);camera.aspect=container.clientWidth/container.clientHeight;camera.updateProjectionMatrix();};const observer=new ResizeObserver(resize);observer.observe(container);resize();
 let frameId=0;const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const clock=new T.Clock();function frame(){frameId=requestAnimationFrame(frame);const delta=Math.min(clock.getDelta(),.05);const t=reduced?0:clock.elapsedTime;if(destination){camera.position.lerp(destination,.045);controls.target.lerp(target,.045);if(camera.position.distanceTo(destination)<.025)destination=null;}controls.update();
 const wallOpacity=camera.position.z>5.89?.2:1;horizonWallMaterial.opacity=T.MathUtils.damp(horizonWallMaterial.opacity,wallOpacity,8,delta);horizonWallMaterial.depthWrite=horizonWallMaterial.opacity>.97;
 people.forEach((p,i)=>{
 const station=p.person.parent.position;const status=getStatus(p.a.id),active=highlight===p.a.id||selected===p.a.id;const speaking=conversationId===p.a.id;
 const assignment=meetingGoals.get(p.a.id);const key=assignment?assignment.projectId+':'+assignment.roomId+':'+assignment.seat:'';
 if(key!==p.goalKey){p.goalKey=key;if(assignment){p.meeting=assignment;p.route=routeToMeeting({x:station.x,z:station.z},assignment);p.trail=[];p.mode='outbound';}else if(p.mode!=='desk'){p.route=routeBackToDesk({x:station.x,z:station.z},p.trail);p.mode='returning';p.meeting=null;}}
 const walking=p.mode==='outbound'||p.mode==='returning';const standTarget=walking||p.mode==='desk'&&speaking?1:0;
 p.stand=reduced?standTarget:T.MathUtils.damp(p.stand,standTarget,7,delta);if(Math.abs(p.stand-standTarget)<.001)p.stand=standTarget;
 const pose=p.stand*p.stand*(3-2*p.stand);p.setStanding(pose);
 if(p.mode==='outbound'&&!p.trail.length&&p.stand<=.94){p.person.position.x=.9*pose;p.person.position.z=1.05+.9*pose;}
 if(walking&&p.stand>.94){
  let remaining=reduced?Infinity:3.8*delta;
  while(p.route.length&&remaining>0){const next=p.route[0];const dx=next.x-(station.x+p.person.position.x),dz=next.z-(station.z+p.person.position.z);const distance=Math.hypot(dx,dz);if(distance<.025||remaining>=distance){p.person.position.x=next.x-station.x;p.person.position.z=next.z-station.z;remaining-=distance;p.route.shift();if(p.mode==='outbound')p.trail.push(next);}else{p.person.position.x+=dx/distance*remaining;p.person.position.z+=dz/distance*remaining;remaining=0;}
   if(distance>.025){const angle=Math.atan2(dx,dz);const turn=T.MathUtils.euclideanModulo(angle-p.person.rotation.y+Math.PI,Math.PI*2)-Math.PI;p.person.rotation.y+=turn*(reduced?1:Math.min(1,delta*12));}
  }
  if(!p.route.length)p.mode=p.mode==='outbound'?'meeting':'desk';
 }
 if(p.mode==='desk'){p.person.position.x=.9*pose;p.person.position.z=1.05+.9*pose;const world=p.person.getWorldPosition(new T.Vector3());const facing=Math.atan2(camera.position.x-world.x,camera.position.z-world.z);const turn=T.MathUtils.euclideanModulo(facing,Math.PI*2)-Math.PI;p.person.rotation.y=Math.PI+turn*pose;}
 if(p.mode==='meeting'&&p.meeting){const seat=meetingSeat(p.meeting.roomId,p.meeting.seat);p.person.position.x=seat.x-station.x;p.person.position.z=seat.z-station.z;p.person.rotation.y=seat.rotation;}
 p.person.position.y=.085-.175*pose+(walking&&!reduced?Math.abs(Math.sin(t*9+i))*.035:0);
 p.person.rotation.z=walking?Math.sin(t*9+i)*.035:Math.sin(t*1.6+i)*(speaking?.008:.025);
 p.head.rotation.y=Math.sin(t*.7+i)*.07;p.head.rotation.z=Math.sin(t*1.1+i)*.025;
 p.arms.forEach((arm,j)=>{arm.rotation.x=walking?Math.sin(t*9+i+j*Math.PI)*.22:!speaking&&status==='working'?Math.sin(t*7+j*2)*.15-.2:Math.sin(t*1.4+j+i)*.06;});
 p.hit.position.set(p.person.position.x,1.4,p.person.position.z);p.halo.position.set(p.person.position.x,.075,p.person.position.z);
 p.carpet.material=mat(active?'#c3d9d7':'#a7bdbc');const haloMaterial=p.halo.material as T.MeshBasicMaterial;haloMaterial.opacity=active?.8:.15;p.halo.scale.setScalar(active?1+Math.sin(t*2)*.035:1);
 const world=p.person.getWorldPosition(new T.Vector3());const v=new T.Vector3(world.x,p.mode==='desk'?3.15-.65*pose:2.7,world.z-.45).project(camera);const l=labels[i];l.style.left=`${(v.x*.5+.5)*container.clientWidth}px`;l.style.top=`${(-v.y*.5+.5)*container.clientHeight}px`;l.style.display=v.z>1||v.z< -1?'none':'';l.classList.toggle('hovered',active);l.setAttribute('aria-pressed',String(speaking));l.title=speaking?'Fechar conversa com '+p.a.name:'Conversar com '+p.a.name;l.querySelector<HTMLElement>('.status-dot')!.dataset.status=status;
 });
 roomLabels.forEach(({room,node})=>{const v=new T.Vector3(room.x,3.2,room.z-2.5).project(camera);node.style.left=`${(v.x*.5+.5)*container.clientWidth}px`;node.style.top=`${(-v.y*.5+.5)*container.clientHeight}px`;node.style.display=v.z>1||v.z< -1?'none':'';});
 renderer.render(scene,camera);}
 frame();controls.addEventListener('start',()=>destination=null);
 function focusRoom(id:RoomId){const room=MEETING_ROOMS.find(r=>r.id===id);if(room){target=new T.Vector3(room.x,1,room.z);destination=target.clone().add(new T.Vector3(8,7,10));}}
 return {rebuild,focusRoom,setMeetings(assignments:MeetingAssignment[],reservedRooms:RoomId[]=[]){meetingGoals=new Map(assignments.map(a=>[a.agentId,a]));roomLabels.forEach(({room,node})=>{const count=assignments.filter(a=>a.roomId===room.id).length;node.querySelector('small').textContent=count?count+' agentes em reunião':reservedRooms.includes(room.id)?'Voltando às mesas':'Livre';node.classList.toggle('occupied',count>0||reservedRooms.includes(room.id));});},waitForMeeting(id:string,signal:AbortSignal){return waitForCondition(()=>{const members=people.filter(p=>meetingGoals.get(p.a.id)?.projectId===id);return members.length>0&&members.every(p=>p.mode==='meeting'&&p.stand<.02);},signal);},waitForDesks(ids:string[]){return waitForCondition(()=>people.filter(p=>ids.includes(p.a.id)).every(p=>p.mode==='desk'&&(p.stand<.02||conversationId===p.a.id)));},setConversation(id:string|null){conversationId=id;selected=id;},home(){selected=null;destination=home.clone();target=origin.clone();},zoom(factor:number){destination=null;const offset=camera.position.clone().sub(controls.target);offset.setLength(T.MathUtils.clamp(offset.length()*factor,controls.minDistance,controls.maxDistance));camera.position.copy(controls.target).add(offset);},focus(id:string){const p=people.find(p=>p.a.id===id);if(p){selected=id;target=p.person.getWorldPosition(new T.Vector3()).add(new T.Vector3(1.8,1,0));destination=target.clone().add(new T.Vector3(7,6,9));}},setLight(dark:boolean){renderer.toneMappingExposure=dark?.85:1.15;},dispose(){disposed=true;sceneWaiters.forEach(cleanup=>cleanup());cancelAnimationFrame(frameId);observer.disconnect();controls.dispose();release(scene);mats.forEach(m=>m.dispose());glowMaterial.dispose();environmentTarget.dispose();renderer.dispose();labels.forEach(l=>l.remove());roomLabels.forEach(r=>r.node.remove());renderer.domElement.remove();}};
}
