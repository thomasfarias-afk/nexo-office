import React,{useState} from 'react';
import {Play,Users,Check,ArrowUpRight} from 'lucide-react';
import type {Collaboration,State} from './domain';
import {TeamProgress} from './TeamProgress';
import {occupiesRoom} from './collaboration';
export function ManagerPlan({plan,state,configured,onAction,onOpen,onConfigure}:{plan:Collaboration;state:State;configured:boolean;onAction:(p:Collaboration,mode:'save'|'run'|'preview')=>string|null;onOpen:(id:string)=>void;onConfigure:()=>void}){
 const [error,setError]=useState('');const current=state.collaborations.find(c=>c.id===plan.id);const project=current||plan;const active=current&&occupiesRoom(current);const queued=project.autoStart&&project.status==='queued';
 return <section className="manager-plan manager-plan-v2"><div className="manager-plan-heading"><span className="manager-plan-heading-icon"><Users size={16}/></span><div><div className="eyebrow">EQUIPE ORGANIZADA</div><small>{project.stages.length} {project.stages.length===1?'especialista':'especialistas'} · entregas em sequência</small></div></div><h3 title={project.title}>{project.title}</h3><TeamProgress project={project} agents={state.agents} compact/>
 <div className="manager-plan-actions">{!current&&!queued&&<button onClick={()=>setError(onAction(plan,'save')||'')}><Check size={13}/>Salvar plano</button>}{!active&&!queued&&project.status!=='completed'&&<><button onClick={()=>setError(onAction(project,'preview')||'')}><Users size={14}/>Ver reunião</button>{configured?<button className="primary" onClick={()=>setError(onAction(project,'run')||'')}><Play size={14}/>{current?'Iniciar / retomar':'Iniciar equipe'}</button>:<button className="primary" onClick={onConfigure}>Conectar IA<ArrowUpRight size={14}/></button>}</>}{current&&<button onClick={()=>onOpen(current.id)}>Ver projeto<ArrowUpRight size={14}/></button>}</div>
 {!configured&&!active&&project.status!=='completed'&&<p className="manager-plan-hint"><span/>Prévia disponível · IA ainda não conectada</p>}{error&&<p className="manager-plan-error" role="alert">{error}</p>}
 </section>;
}
