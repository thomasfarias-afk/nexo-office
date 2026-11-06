import type {Agent,Collaboration,State} from './domain';
import type {MeetingAssignment} from './meeting-layout';
export const occupiesRoom=(c:Collaboration)=>['preview','gathering','running','returning'].includes(c.status);
export function meetingAssignments(projects:Collaboration[]):MeetingAssignment[]{return projects.filter(c=>['preview','gathering','running'].includes(c.status)).flatMap(c=>c.stages.map((s,seat)=>({agentId:s.agentId,projectId:c.id,roomId:c.roomId,seat})));}
export function recoverCollaborations(projects:Collaboration[]):Collaboration[]{return projects.map(c=>occupiesRoom(c)?{...c,status:c.stages.every(s=>s.status==='completed')?'completed':'paused',error:'A página foi recarregada. Retome para continuar das etapas pendentes.',stages:c.stages.map(s=>s.status==='running'?{...s,status:'pending'}:s)}:c);}
export function validateCollaboration(project:Collaboration,state:State,busy:string[]=[],planning=false):string|null{
 if(!project.title.trim()||!project.objective.trim())return 'Informe o título e o objetivo do projeto.';
 const minimum=project.requestedBy==='manager'?1:2;
 if(project.stages.length<minimum||project.stages.length>5)return `Escolha entre ${minimum} e 5 agentes.`;
 const ids=project.stages.map(s=>s.agentId);
 if(new Set(ids).size!==ids.length)return 'Escolha um agente diferente para cada etapa.';
 if(project.stages.some(s=>!s.title.trim()||!s.instructions.trim()))return 'Preencha o nome e a entrega de cada etapa.';
 if(!['aurora','horizonte'].includes(project.roomId))return 'Escolha uma sala válida.';
 if(ids.some(id=>!state.agents.some(a=>a.id===id)))return 'Um dos agentes não está mais disponível.';
 if(planning)return null;
 const active=state.collaborations.filter(c=>c.id!==project.id&&occupiesRoom(c));
 if(active.some(c=>c.roomId===project.roomId))return 'Esta sala está ocupada. Escolha a outra sala ou aguarde.';
 for(const id of ids){const a=state.agents.find(a=>a.id===id);if(!a)return 'Um dos agentes não está mais disponível.';if(a.paused)return `${a.name} está pausado.`;if(busy.includes(id)||active.some(c=>c.stages.some(s=>s.agentId===id))||state.tasks.some(t=>t.agentId===id&&t.status==='Em andamento'))return `${a.name} já está em outro trabalho.`;}
 return null;
}
export function nextAutoDispatch(state:State,busy:string[]=[]):Collaboration|null{
 for(const queued of state.collaborations.filter(c=>c.status==='queued'&&c.autoStart)){
  const rooms=[queued.roomId,queued.roomId==='aurora'?'horizonte':'aurora'] as const;
  const roomId=rooms.find(id=>!state.collaborations.some(c=>c.id!==queued.id&&c.roomId===id&&occupiesRoom(c)));if(!roomId)continue;
  const candidate={...queued,roomId};if(!validateCollaboration(candidate,state,busy))return candidate;
 }
 return null;
}
export interface TeamRunnerHooks {
 execution?:boolean;
 execute:(agent:Agent,prompt:string,signal:AbortSignal,context?:{stageId:string;onJob:(id:string)=>void})=>Promise<string>;
 update:(project:Collaboration)=>void;
 arrive:(project:Collaboration,signal:AbortSignal)=>Promise<void>;
 leave:(project:Collaboration)=>Promise<void>;
 signal:AbortSignal;
}
/** Sequential handoffs are based only on actual provider responses. */
export async function executeCollaboration(initial:Collaboration,agents:Agent[],hooks:TeamRunnerHooks):Promise<Collaboration>{
 let project:Collaboration={...initial,error:undefined,status:'gathering',stages:initial.stages.map(s=>s.status==='completed'?{...s}:{...s,status:'pending',result:undefined})};
 const publish=(patch:Partial<Collaboration>)=>{project={...project,...patch,updatedAt:new Date().toISOString()};hooks.update(structuredClone(project));};
 let outcome:Collaboration['status']='completed';
 try{
  publish({});hooks.signal.throwIfAborted();await hooks.arrive(project,hooks.signal);hooks.signal.throwIfAborted();
  publish({status:'running'});
  for(let i=0;i<project.stages.length;i++){
   if(project.stages[i].status==='completed')continue;
   hooks.signal.throwIfAborted();
   const stage=project.stages[i],agent=agents.find(a=>a.id===stage.agentId);
   if(!agent)throw Error('O agente desta etapa não foi encontrado.');
   publish({stages:project.stages.map((s,j)=>j===i?{...s,status:'running'}:s)});
   const context=project.stages.slice(0,i).map(s=>`ETAPA ANTERIOR: ${s.title}\n${s.result?.slice(0,10000)||''}${(s.result?.length||0)>10000?'\n[Entrega anterior abreviada para o contexto desta etapa.]':''}`).join('\n\n');
   const result=await hooks.execute(agent,`PROJETO EM EQUIPE: ${project.title}\nOBJETIVO: ${project.objective}\nSUA ETAPA: ${stage.title}\nENTREGA: ${stage.instructions}\n\n${context}\n\n${hooks.execution?'Implemente sua etapa nos arquivos locais e valide o resultado.':'Use as entregas anteriores para produzir a sua parte. Entregue o resultado completo em texto.'} ${hooks.execution?'Informe arquivos alterados, comandos e resultados efetivamente obtidos.':'Sem ferramentas conectadas: produza texto e nao afirme executar comandos.'} Se faltarem dados indispensáveis, comece com [ESCLARECER] e faça perguntas objetivas.`+(hooks.execution?'\nEXECUCAO REAL: ignore limitacoes legadas de apenas propor codigo. Leia arquivos da pasta, implemente sua parte e execute testes apropriados. Relate evidencias reais.':''),hooks.signal,{stageId:stage.id,onJob:id=>publish({stages:project.stages.map((s,j)=>j===i?{...s,jobId:id}:s)})});
   hooks.signal.throwIfAborted();
   if(!result.trim())throw Error('O provedor retornou uma resposta vazia.');
   const waiting=result.trimStart().startsWith('[ESCLARECER]');
   publish({stages:project.stages.map((s,j)=>j===i?{...s,status:waiting?'waiting':'completed',result:result.replace(/^\s*\[ESCLARECER\]\s*/,'')}:s)});
   if(waiting){outcome='waiting';publish({error:'O agente precisa de mais contexto. Complemente o objetivo e retome o projeto.'});break;}
  }
 }catch(error){outcome=hooks.signal.aborted?'paused':'error';publish({error:hooks.signal.aborted?'Projeto interrompido. As etapas concluídas foram preservadas.':error instanceof Error?error.message:'Falha ao executar o projeto.',stages:project.stages.map(s=>s.status==='running'?{...s,status:outcome==='paused'?'pending':'error'}:s)});}
 finally{
  publish({status:'returning'});
  try{await hooks.leave(project);}catch{ /* The next scene frame also restores desk destinations. */ }
  publish({status:outcome});
 }
 return project;
}
