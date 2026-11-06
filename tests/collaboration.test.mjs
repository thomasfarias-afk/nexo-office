import test from 'node:test';
import assert from 'node:assert/strict';
import {executeCollaboration,meetingAssignments,recoverCollaborations,validateCollaboration} from '../src/collaboration.ts';
import {meetingSeat,routeToMeeting,routeBackToDesk,MEETING_ROOMS} from '../src/meeting-layout.ts';
import {agentStatus} from '../src/domain.ts';

const agents=['Designer','Desenvolvedor','Suporte','Coordenador','Analista'].map((role,i)=>({id:String(i),name:role,role,paused:false}));
const project=(patch={})=>({id:'team',title:'Projeto integrado',objective:'Criar uma tela de atendimento',roomId:'aurora',status:'draft',createdAt:'2026-11-05',updatedAt:'2026-11-05',stages:agents.slice(0,3).map((a,i)=>({id:'stage'+i,agentId:a.id,title:['Design','Código','Revisão'][i],instructions:'Produzir a entrega da etapa '+i,status:'pending'})),...patch});
const state=(collaborations=[])=>({agents,tasks:[],collaborations});
function hooks(patch={}){return {signal:new AbortController().signal,update:()=>{},arrive:async()=>{},leave:async()=>{},execute:async a=>'Entrega de '+a.id,...patch};}

test('team waits for arrival, hands off actual outputs in order and returns before completion',async()=>{
 const events=[],prompts=[],updates=[];
 const result=await executeCollaboration(project(),agents,hooks({arrive:async()=>{events.push('arrived');},leave:async()=>{events.push('returned');},execute:async(a,p)=>{events.push(a.id);prompts.push(p);return 'RESULTADO-'+a.id;},update:p=>{updates.push(p);if(p.status==='completed')events.push('completed');}}));
 assert.deepEqual(events,['arrived','0','1','2','returned','completed']);
 assert(!prompts[0].includes('RESULTADO-0'));
 assert(prompts[1].includes('RESULTADO-0'));
 assert(prompts[2].includes('RESULTADO-0')&&prompts[2].includes('RESULTADO-1'));
 assert.equal(result.status,'completed');assert(result.stages.every(s=>s.status==='completed'));
 assert.equal(updates.at(-2).status,'returning');
});
test('provider failure stops later stages, frees the room and preserves completed output',async()=>{
 const called=[];let returned=false;
 const result=await executeCollaboration(project(),agents,hooks({execute:async a=>{called.push(a.id);if(a.id==='1')throw Error('Provedor indisponível');return 'Design pronto';},leave:async()=>{returned=true;}}));
 assert.deepEqual(called,['0','1']);assert(returned);assert.equal(result.status,'error');assert.equal(result.stages[0].result,'Design pronto');assert.equal(result.stages[1].status,'error');assert.equal(meetingAssignments([result]).length,0);
 const resumed=[];const final=await executeCollaboration(result,agents,hooks({execute:async(a,p)=>{resumed.push(a.id);assert(p.includes('Design pronto'));return 'OK';}}));
 assert.deepEqual(resumed,['1','2']);assert.equal(final.status,'completed');
});
test('requests for context stop the sequence and return agents to their desks',async()=>{
 const called=[];let returned=false;
 const result=await executeCollaboration(project(),agents,hooks({execute:async a=>{called.push(a.id);return '[ESCLARECER] Qual é o público?';},leave:async()=>{returned=true;}}));
 assert.deepEqual(called,['0']);assert(returned);assert.equal(result.status,'waiting');assert.equal(result.stages[0].result,'Qual é o público?');assert.equal(result.stages[1].status,'pending');
});
test('interrupting during an in-flight response preserves prior stages and ignores late output',async()=>{
 const controller=new AbortController();let returned=false;
 const result=await executeCollaboration(project(),agents,hooks({signal:controller.signal,execute:async a=>{if(a.id==='1')controller.abort();return 'Entrega-'+a.id;},leave:async()=>{returned=true;}}));
 assert(returned);assert.equal(result.status,'paused');assert.equal(result.stages[0].result,'Entrega-0');assert.equal(result.stages[1].result,undefined);assert.equal(result.stages[1].status,'pending');
});
test('room and agent reservations block conflicts and allow two independent teams',()=>{
 const active=project({id:'active',status:'running'});
 assert.match(validateCollaboration(project({id:'new'}),state([active])),/sala está ocupada/);
 assert.match(validateCollaboration(project({id:'new',roomId:'horizonte'}),state([active])),/já está em outro trabalho/);
 const independent=project({id:'new',roomId:'horizonte',stages:agents.slice(3).map((a,i)=>({id:'other'+i,agentId:a.id,title:'Etapa',instructions:'Entregar análise',status:'pending'}))});
 assert.equal(validateCollaboration(independent,state([active])),null);
 assert.equal(validateCollaboration(project({id:'plan'}),state([active]),[],true),null);
 assert.equal(meetingAssignments([active,{...independent,status:'gathering'}]).length,5);
 assert.match(validateCollaboration(project({stages:[project().stages[0],project().stages[0]]}),state()),/diferente/);
});
test('reload recovers active projects without repeating completed stages',()=>{
 const p=project({status:'running'});p.stages[0]={...p.stages[0],status:'completed',result:'Design preservado'};p.stages[1].status='running';
 const [recovered]=recoverCollaborations([p]);assert.equal(recovered.status,'paused');assert.equal(recovered.stages[0].result,'Design preservado');assert.equal(recovered.stages[1].status,'pending');assert.equal(meetingAssignments([recovered]).length,0);
});
test('previews reserve seats without marking stages complete or agents as producing output',()=>{
 const p=project({status:'preview'});const current=state([p]);
 assert.equal(meetingAssignments([p]).length,3);assert(p.stages.every(s=>s.status==='pending'));
 assert.equal(agentStatus(current,'0'),'meeting');
 const running=project({status:'running'});running.stages[1].status='running';
 assert.equal(agentStatus(state([running]),'1'),'working');assert.equal(agentStatus(state([running]),'0'),'meeting');
 assert.equal(meetingAssignments([{...p,status:'returning'}]).length,0);
});
test('routes use the circulation aisle and open doors, and all room seats are unique',()=>{
 for(const room of MEETING_ROOMS){const seats=Array.from({length:5},(_,i)=>meetingSeat(room.id,i));assert.equal(new Set(seats.map(s=>s.x+','+s.z)).size,5);
  for(const desk of [{x:-3,z:-2.5},{x:3,z:2}]){const route=routeToMeeting(desk,{agentId:'0',projectId:'p',roomId:room.id,seat:0});assert(route.some(p=>p.x===9.1&&p.z===room.z));assert(route.some(p=>p.x===12.2&&p.z===room.z));assert.deepEqual(route.at(-1),{x:seats[0].x,z:seats[0].z});const back=routeBackToDesk(desk,route);assert.deepEqual(back.at(-1),{x:desk.x+.9,z:desk.z+1.95});assert.equal(back.length,route.length+1);}
 }
});
