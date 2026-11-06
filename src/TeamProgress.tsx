import {RuntimeJobView} from './RuntimeConnections';
import React from 'react';
import {Check,LoaderCircle,Users,ArrowRight,Clock,FileText} from 'lucide-react';
import type {Agent,Collaboration,TeamStage} from './domain';
import {Mascot} from './Mascot';
import './workflow.css';

export function projectPresentation(project:Collaboration,agents:Agent[]){
 const done=project.stages.filter(s=>s.status==='completed').length;
 const index=project.stages.findIndex(s=>s.status==='running');
 const stage=project.stages[index];const agent=agents.find(a=>a.id===stage?.agentId);
 const next=project.stages[index+1];const nextAgent=agents.find(a=>a.id===next?.agentId);
 const map:Record<Collaboration['status'],[string,string]>={
  queued:['Encaminhado pelo Gestor','A reunião começa automaticamente quando a equipe e a sala estiverem livres.'],
  draft:['Equipe definida','O plano está pronto para começar.'],
  preview:['Equipe na sala','Prévia visual · as entregas ainda não foram iniciadas.'],
  gathering:['Reunindo a equipe','Os especialistas estão a caminho da sala.'],
  running:[agent?`${agent.name} · ${stage.title}`:'Equipe trabalhando',nextAgent?`${nextAgent.name} assume a próxima entrega.`:'Última etapa do projeto.'],
  returning:['Voltando às mesas','A equipe está encerrando a reunião.'],
  completed:['Entrega concluída','Todas as etapas foram finalizadas.'],
  paused:['Aguardando retomada','As entregas concluídas estão preservadas.'],
  waiting:['Precisamos de mais contexto','Veja a pergunta do agente para continuar.'],
  error:['Etapa interrompida','Você pode retomar sem repetir as entregas prontas.'],
 };
 return {title:map[project.status][0],description:map[project.status][1],done,total:project.stages.length};
}
function stageLabel(project:Collaboration,stage:TeamStage){
 if(stage.status==='completed')return 'Concluído';
 if(project.status==='preview')return 'Na reunião · prévia';
 if(project.status==='gathering')return 'A caminho';
 if(stage.status==='running'&&project.status==='running')return 'Trabalhando';
 if(stage.status==='waiting')return 'Precisa de contexto';
 if(stage.status==='error')return 'A retomar';
 if(project.status==='returning')return 'Retornando';
 if(project.status==='queued')return 'Na fila';
 if(project.status==='draft')return 'Planejado';
 if(project.status==='paused')return 'Aguardando retomada';
 return 'Próxima entrega';
}
export function TeamProgress({project,agents,compact=false}:{project:Collaboration;agents:Agent[];compact?:boolean}){
 const view=projectPresentation(project,agents);
 return <div className={`workflow ${compact?'compact':''}`}>
 <div className={`workflow-now ${project.status}`} aria-live="polite"><span className="workflow-now-icon">{project.status==='completed'?<Check size={18}/>:project.status==='running'||project.status==='gathering'?<LoaderCircle size={18} className="spin"/>:project.status==='preview'?<Users size={18}/>:<Clock size={18}/>}</span><span><strong>{view.title}</strong><small>{view.description}</small></span></div>
 <div className="workflow-progress"><span>Entregas</span><strong>{view.done}<em> / {view.total}</em></strong><div className="workflow-segments" role="progressbar" aria-label="Etapas concluídas" aria-valuemin={0} aria-valuemax={view.total} aria-valuenow={view.done}>{project.stages.map(s=><span key={s.id} className={s.status==='completed'?'done':s.status==='running'&&project.status==='running'?'current':''}/>)}</div></div>
 <ol className="workflow-stages">{project.stages.map((stage,i)=>{const agent=agents.find(a=>a.id===stage.agentId);const working=stage.status==='running'&&project.status==='running';return <li key={stage.id} className={`workflow-stage ${working?'working':''} ${stage.status==='completed'?'done':''}`}>
 <div className="workflow-stage-top"><span className="workflow-sequence">ETAPA {String(i+1).padStart(2,'0')}</span><span className={`workflow-stage-state ${working?'working':''} ${stage.status==='completed'?'done':''}`}><span/>{stageLabel(project,stage)}</span></div>
 <div className="workflow-person">{agent&&<span className="workflow-avatar" style={{'--worker-color':agent.color} as React.CSSProperties}><Mascot agent={agent}/></span>}<div><h4>{stage.title}</h4><p>{agent?.name||'Agente'}<span> · {agent?.role}</span></p></div>{stage.status==='completed'?<Check className="workflow-stage-icon" size={18}/>:working?<LoaderCircle className="workflow-stage-icon spin" size={18}/>:<ArrowRight className="workflow-stage-icon" size={16}/>}</div>
 {!compact&&<details className="workflow-brief"><summary><FileText size={12}/>Ver briefing</summary><p>{stage.instructions}</p></details>}
 {stage.jobId&&!compact&&<RuntimeJobView id={stage.jobId}/>}
 {stage.result&&<details className="workflow-output" open={stage.status==='waiting'}><summary>{stage.status==='waiting'?'Ver pergunta do agente':'Abrir entrega'}<ArrowRight size={13}/></summary><pre>{stage.result}</pre></details>}
 </li>;})}</ol>
 </div>;
}
