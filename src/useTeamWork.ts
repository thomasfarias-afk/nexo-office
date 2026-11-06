import {executeLocal} from './runtime-client';
import type {RuntimeStatus} from './runtime-types';
import {useEffect,useRef} from 'react';
import type {MutableRefObject} from 'react';
import type {createOffice} from './office';
import {MANAGER_ID,type Collaboration,type State} from './domain';
import {executeCollaboration,meetingAssignments,occupiesRoom,validateCollaboration,nextAutoDispatch} from './collaboration';

export function useTeamWork({stateRef,scene,update,configured,runtime,busy,setBusy,notify}:{stateRef:MutableRefObject<State>;scene:MutableRefObject<ReturnType<typeof createOffice>|null>;update:(fn:(s:State)=>State)=>void;configured:boolean;runtime?:RuntimeStatus|null;busy:Record<string,boolean>;setBusy:(fn:(b:Record<string,boolean>)=>Record<string,boolean>)=>void;notify:(text:string)=>void}){
 const runs=useRef(new Map<string,{controller:AbortController;project:Collaboration;resumeAfterPreview?:boolean}>());
 useEffect(()=>()=>{for(const run of runs.current.values())run.controller.abort();},[]);
 const currentState=():State=>({...stateRef.current,collaborations:[...stateRef.current.collaborations.filter(c=>!runs.current.has(c.id)),...Array.from(runs.current.values(),r=>r.project)]});
 const syncScene=()=>{const projects=currentState().collaborations;scene.current?.setMeetings(meetingAssignments(projects),projects.filter(occupiesRoom).map(c=>c.roomId));};
 const isReserved=(id:string)=>Array.from(runs.current.values()).some(r=>r.project.stages.some(s=>s.agentId===id));
 async function arrive(project:Collaboration,signal:AbortSignal){
  if(!scene.current)await new Promise<void>((resolve,reject)=>{const started=Date.now();const check=setInterval(()=>{if(signal.aborted||Date.now()-started>20000){clearInterval(check);reject(Error('O escritório 3D ainda não está disponível. Tente retomar o projeto.'));}else if(scene.current){clearInterval(check);resolve();}},100);});
  signal.throwIfAborted();syncScene();scene.current?.focusRoom(project.roomId);await scene.current?.waitForMeeting(project.id,signal);
 }
 async function preview(project:Collaboration){
  const controller=new AbortController();let next:Collaboration={...project,status:'preview'};
  runs.current.set(project.id,{controller,project:next});
  const ids=project.stages.map(s=>s.agentId);setBusy(b=>({...b,...Object.fromEntries(ids.map(id=>[id,true]))}));
  const publish=(status:Collaboration['status'])=>{next={...next,status,updatedAt:new Date().toISOString()};const entry=runs.current.get(project.id);if(entry)entry.project=next;update(s=>({...s,collaborations:s.collaborations.map(c=>c.id===project.id?next:c)}));syncScene();};
  try{publish('preview');await arrive(next,controller.signal);notify('Prévia da reunião: nenhuma etapa de IA está sendo executada. Encerre em Equipes para voltar às mesas.');await new Promise<void>(resolve=>{if(controller.signal.aborted)resolve();else controller.signal.addEventListener('abort',()=>resolve(),{once:true});});}
  catch(error){if(!controller.signal.aborted)notify(error instanceof Error?error.message:'Não foi possível reunir a equipe.');}
  finally{publish('returning');try{await scene.current?.waitForDesks(ids);}catch{}const resume=runs.current.get(project.id)?.resumeAfterPreview;publish(resume?'queued':project.status==='queued'?'paused':project.status);runs.current.delete(project.id);setBusy(b=>({...b,...Object.fromEntries(ids.map(id=>[id,false]))}));}
 }
 async function run(project:Collaboration){
  if(runs.current.has(project.id))return;
  if(project.status==='completed'){notify('Este projeto já foi concluído.');return;}
  if(!configured){notify('Configure um provedor em Integrações para iniciar a equipe.');return;}
  const error=validateCollaboration(project,currentState(),Object.keys(busy).filter(id=>busy[id]));if(error){notify(error);return;}
  const controller=new AbortController();runs.current.set(project.id,{controller,project:{...project,status:'gathering'}});
  const ids=project.stages.map(s=>s.agentId);setBusy(b=>({...b,...Object.fromEntries(ids.map(id=>[id,true]))}));
  const delivered=new Set(project.stages.filter(s=>s.status==='completed').map(s=>s.id));
  let managerNotified=false;
  try{
   const finished=await executeCollaboration(project,stateRef.current.agents,{
    signal:controller.signal,execution:runtime?.execution,
    update(next){
     const entry=runs.current.get(project.id);if(entry)entry.project=next;
     const messages=next.stages.filter(s=>s.result&&!delivered.has(s.id)&&(s.status==='completed'||s.status==='waiting'));messages.forEach(s=>delivered.add(s.id));
     const report=next.requestedBy===MANAGER_ID&&!managerNotified&&['completed','waiting','paused','error'].includes(next.status);
     if(report)managerNotified=true;
     update(state=>{let all=messages.reduce((all,s)=>({...all,[s.agentId]:[...(all[s.agentId]||[]),{id:crypto.randomUUID(),role:'assistant' as const,content:`${next.title} · ${s.title}\n\n${s.result}`,at:next.updatedAt}]}),state.messages);
      if(report){const question=next.stages.find(s=>s.status==='waiting')?.result;const summary=next.status==='completed'?`A equipe concluiu ${next.title} e voltou às mesas.\n\n`+next.stages.map(s=>`${s.title}:\n${s.result?.slice(0,5000)||''}`).join('\n\n'):next.status==='waiting'?`O especialista precisa desta informação para continuar ${next.title}:\n\n${question||next.error}\n\nResponda aqui; eu retomarei o trabalho sem repetir as etapas concluídas.`:`Atualização de ${next.title}: ${next.error||next.status}. A equipe voltou às mesas. As etapas concluídas foram preservadas.`;all={...all,[MANAGER_ID]:[...(all[MANAGER_ID]||[]),{id:crypto.randomUUID(),role:'assistant',content:summary,projectId:next.id,managerClarification:next.status==='waiting'?{request:next.objective,projectId:next.id}:undefined,at:next.updatedAt}]};}
      return {...state,collaborations:state.collaborations.map(c=>c.id===next.id?next:c),messages:all};});syncScene();
    },
    arrive,
    async leave(next){syncScene();await scene.current?.waitForDesks(next.stages.map(s=>s.agentId));},
    async execute(agent,prompt,signal,context){if(runtime?.execution)return executeLocal({title:project.title+' - '+agent.name,agentId:agent.id,projectId:project.id,stageId:context?.stageId,instructions:agent.role+'. '+agent.instructions,prompt,expectedWorkspace:runtime.workspace},signal,context?.onJob);const response=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},signal,body:JSON.stringify({instructions:`${agent.role}. ${agent.instructions}. Especialidades: ${agent.specialties}.`,messages:[{role:'user',content:prompt}]})});const data=await response.json();if(!response.ok)throw Error(data.error||'O provedor recusou esta etapa.');if(typeof data.content!=='string')throw Error('Resposta inválida do provedor.');return data.content;},
   });
   notify(finished.status==='completed'?'Projeto concluído. A equipe voltou às mesas.':finished.status==='waiting'?'A equipe precisa de mais contexto. Consulte o projeto.':finished.status==='paused'?'Projeto interrompido. Você pode retomar depois.':finished.error||'Falha no trabalho em equipe.');
  }finally{runs.current.delete(project.id);setBusy(b=>({...b,...Object.fromEntries(ids.map(id=>[id,false]))}));}
 }
 // Accepted manager requests wait for capacity rather than asking for another confirmation.
 useEffect(()=>{
  if(configured)for(const entry of runs.current.values())if(entry.project.status==='preview'&&entry.project.autoStart){entry.resumeAfterPreview=true;entry.controller.abort();}
  for(let attempt=0;attempt<stateRef.current.collaborations.length;attempt++){
   const project=nextAutoDispatch(currentState(),Object.keys(busy).filter(id=>busy[id]));if(!project)break;
   if(configured)void run(project);else void preview(project);
  }
 },[configured,stateRef.current.collaborations,stateRef.current.tasks,stateRef.current.agents,busy]);
 return {
  isReserved,
  dispatch(project:Collaboration):string|null{const error=validateCollaboration(project,currentState(),[],true);if(error)return error;const next={...project,status:'queued' as const,autoStart:true,error:undefined,updatedAt:new Date().toISOString()};update(s=>({...s,collaborations:s.collaborations.some(c=>c.id===next.id)?s.collaborations.map(c=>c.id===next.id?next:c):[...s.collaborations,next]}));return null;},
  preview:(project:Collaboration)=>{if(runs.current.has(project.id))return false;const error=validateCollaboration(project,currentState(),Object.keys(busy).filter(id=>busy[id]));if(error){notify(error);return false;}void preview(project);return true;},
  run:(project:Collaboration)=>{if(runs.current.has(project.id))return false;if(!configured){notify('Configure um provedor em Integrações.');return false;}const error=validateCollaboration(project,currentState(),Object.keys(busy).filter(id=>busy[id]));if(error){notify(error);return false;}void run(project);return true;},
  stop:(id:string)=>{const entry=runs.current.get(id);if(entry){entry.resumeAfterPreview=false;entry.controller.abort();}else update(s=>({...s,collaborations:s.collaborations.map(c=>c.id===id&&c.status==='queued'?{...c,status:'paused'}:c)}));},
  create(project:Collaboration,start:boolean,showPreview=false):string|null{const error=validateCollaboration(project,currentState(),Object.keys(busy).filter(id=>busy[id]),!start&&!showPreview);if(error)return error;if(start&&!configured)return 'Conecte um provedor antes de iniciar.';update(s=>({...s,collaborations:[...s.collaborations,project]}));if(start)void run(project);else if(showPreview)void preview(project);else notify('Planejamento salvo.');return null;},
  editObjective(id:string,objective:string){update(s=>({...s,collaborations:s.collaborations.map(c=>c.id===id&&!occupiesRoom(c)?{...c,objective,updatedAt:new Date().toISOString()}:c)}));},
 };
}
