import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyState,MANAGER_ID} from '../src/domain.ts';
import {arrangeAgents,officeFootprint,DESK_SPACING} from '../src/agent-layout.ts';
import {removeAgent,agentReplacementOptions} from '../src/agent-removal.ts';
import {routeToMeeting} from '../src/meeting-layout.ts';

test('existing desks keep their positions and a stacked saved agent is relocated',()=>{
 const state=emptyState();const input=[...state.agents,{...state.agents[0],id:'new',x:0,z:4}];
 const arranged=arrangeAgents(input);
 assert.deepEqual(arranged.slice(0,state.agents.length),state.agents);
 const newAgent=arranged.at(-1);assert.notDeepEqual({x:newAgent.x,z:newAgent.z},{x:0,z:4});
 assert.deepEqual(input.at(-1).z,4);
 assert(officeFootprint(arranged).front>6);
});
test('large teams get separate desks with floor and circulation space for every row',()=>{
 const base=emptyState().agents;
 const agents=arrangeAgents([...base,...Array.from({length:24},(_,i)=>({...base[0],id:'extra-'+i,x:NaN,z:NaN}))]);
 const bounds=officeFootprint(agents);
 for(let i=0;i<agents.length;i++){
  assert(agents[i].z+3.1<=bounds.front+.0001);
  for(let j=0;j<i;j++)assert(Math.abs(agents[i].x-agents[j].x)>=DESK_SPACING.x||Math.abs(agents[i].z-agents[j].z)>=DESK_SPACING.z,'desks must not overlap');
 }
 const last=agents.at(-1);const route=routeToMeeting(last,{agentId:last.id,projectId:'p',roomId:'aurora',seat:0});
 assert(route[1].z>=last.z+2.5);assert(route[1].z<bounds.front);
 assert.deepEqual(arrangeAgents(agents),agents);
});
test('the old oversized extra row is repaired into the nearest compact free row',()=>{
 const base=emptyState().agents;const saved={...base[0],id:'saved-extra',x:-5.85,z:7.3};
 const arranged=arrangeAgents([...base,saved]);const moved=arranged.at(-1);
 assert.equal(moved.z,6.5);assert.equal(moved.x,-2);
 assert(officeFootprint(arranged).front<7.3+3.1);
 assert.deepEqual(arrangeAgents(arranged),arranged);
 assert.deepEqual(arranged.slice(0,base.length),base);
});
test('unlinked agents can be removed while their conversation remains exportable',()=>{
 const state=emptyState();state.messages.dev=[{id:'m',role:'assistant',content:'Entrega existente',at:'2026-11-05'}];
 const result=removeAgent(state,'dev');
 assert(!result.agents.some(a=>a.id==='dev'));assert(result.removedAgents.some(a=>a.id==='dev'));
 assert.equal(result.messages.dev[0].content,'Entrega existente');assert(state.agents.some(a=>a.id==='dev'));
});
test('deletion transfers linked tasks and plans without losing their outputs',()=>{
 const state=emptyState();state.tasks=[{id:'task',agentId:'dev',title:'Código',status:'Concluída',result:'Código preservado',history:[]}];
 const project={id:'p',title:'Projeto',status:'paused',stages:[{id:'a',agentId:'dev',status:'completed',result:'Entrega original'},{id:'b',agentId:'support',status:'pending'}]};
 state.collaborations=[project];state.messages.manager=[{id:'plan',role:'assistant',content:'Plano existente',teamPlan:project}];
 assert(!agentReplacementOptions(state,'dev').some(a=>a.id==='support'));
 assert.throws(()=>removeAgent(state,'dev','support'),/substituto/);
 const next=removeAgent(state,'dev','analyst');
 assert.equal(next.tasks[0].agentId,'analyst');assert.equal(next.tasks[0].result,'Código preservado');assert(next.tasks[0].history.at(-1).text.includes('Lucas'));
 assert.equal(next.collaborations[0].stages[0].agentId,'analyst');assert.equal(next.collaborations[0].stages[0].result,'Entrega original');
 assert.equal(next.messages.manager[0].teamPlan.stages[0].agentId,'analyst');
 assert(next.collaborations[0].assignmentHistory.length);
});
test('deletion also catches draft plans that exist only in the manager conversation',()=>{
 const state=emptyState();state.messages.manager=[{id:'m',role:'assistant',content:'Plano',teamPlan:{id:'draft',stages:[{id:'a',agentId:'design'}]}}];
 assert.throws(()=>removeAgent(state,'design'),/substituto/);
 assert.equal(removeAgent(state,'design','dev').messages.manager[0].teamPlan.stages[0].agentId,'dev');
});
test('the manager and agents with an active job cannot be deleted',()=>{
 const state=emptyState();assert.throws(()=>removeAgent(state,MANAGER_ID),/Gestor principal/);
 state.tasks=[{id:'t',agentId:'dev',status:'Em andamento'}];assert.throws(()=>removeAgent(state,'dev','design'),/Interrompa/);
 state.tasks=[];state.collaborations=[{id:'p',status:'preview',stages:[{agentId:'dev'}]}];assert.throws(()=>removeAgent(state,'dev','design'),/Interrompa/);
});
