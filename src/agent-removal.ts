import {MANAGER_ID,type Agent,type State} from './domain.ts';
import {occupiesRoom} from './collaboration.ts';
export function linkedAgentPlans(state:State,id:string){const plans=new Map(Object.values(state.messages||{}).flat().flatMap(m=>m.teamPlan?[m.teamPlan]:[]).map(p=>[p.id,p]));for(const project of state.collaborations)plans.set(project.id,project);return [...plans.values()].filter(p=>p.stages.some(s=>s.agentId===id));}
export function agentRemovalBlocked(state:State,id:string):string|null{
 if(id===MANAGER_ID)return 'O Gestor principal coordena o escritório e não pode ser excluído.';
 if(state.tasks.some(t=>t.agentId===id&&t.status==='Em andamento')||state.collaborations.some(c=>occupiesRoom(c)&&c.stages.some(s=>s.agentId===id)))return 'Interrompa o trabalho deste agente e aguarde ele voltar à mesa antes de excluir.';
 return null;
}
export function agentReplacementOptions(state:State,id:string):Agent[]{const linked=linkedAgentPlans(state,id);return state.agents.filter(a=>a.id!==id&&!linked.some(c=>c.stages.some(s=>s.agentId===a.id)));}
export function removeAgent(state:State,id:string,replacementId?:string):State{
 const blocked=agentRemovalBlocked(state,id);if(blocked)throw Error(blocked);
 const agent=state.agents.find(a=>a.id===id);if(!agent)throw Error('Este agente já foi removido.');
 const linked=state.tasks.some(t=>t.agentId===id)||linkedAgentPlans(state,id).length>0;
 const replacement=agentReplacementOptions(state,id).find(a=>a.id===replacementId);
 if(linked&&!replacement)throw Error('Escolha um substituto que não participe das mesmas etapas do projeto.');
 const now=new Date().toISOString();const note=`Responsabilidade transferida de ${agent.name} para ${replacement?.name||'outro agente'} após exclusão do perfil.`;
 const transfer=(c:State['collaborations'][number])=>c.stages.some(s=>s.agentId===id)?{...c,stages:c.stages.map(s=>s.agentId===id?{...s,agentId:replacement!.id}:s),assignmentHistory:[...(c.assignmentHistory||[]),{at:now,text:note}]}:c;
 return {...state,agents:state.agents.filter(a=>a.id!==id),removedAgents:[...(state.removedAgents||[]),agent],tasks:state.tasks.map(t=>t.agentId===id?{...t,agentId:replacement!.id,history:[...t.history,{at:now,text:note}]}:t),collaborations:state.collaborations.map(transfer),messages:Object.fromEntries(Object.entries(state.messages).map(([key,messages])=>[key,messages.map(m=>m.teamPlan?{...m,teamPlan:transfer(m.teamPlan)}:m)]))};
}
