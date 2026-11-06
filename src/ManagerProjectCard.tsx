import React from 'react';
import {ArrowRight,ArrowUpRight,ChevronDown,CheckCheck,MessageSquare,Play,RotateCcw,Users} from 'lucide-react';
import {MANAGER_ID,type Collaboration,type State} from './domain';
import {TeamProgress} from './TeamProgress';
import {featuredManagerProject,managerProjects,needsResume} from './manager-activity-utils';

function ProjectCard({project,state,onProject,onResume,featured=false}:{project:Collaboration;state:State;onProject:(id:string)=>void;onResume:(project:Collaboration)=>void;featured?:boolean}){
 const stage=project.stages.find(item=>item.status==='running')||project.stages.find(item=>item.status==='waiting'||item.status==='error')||project.stages.find(item=>item.status!=='completed');
 const index=stage?project.stages.indexOf(stage):-1;
 const agent=state.agents.find(item=>item.id===stage?.agentId);
 const nextStage=project.stages.slice(index+1).find(item=>item.status!=='completed');
 const nextAgent=state.agents.find(item=>item.id===nextStage?.agentId);
 const nextAction=project.status==='waiting'?`Responder a pergunta de ${agent?.name||'quem está trabalhando'}.`:project.status==='running'?`${agent?.name||'O responsável'} está nesta etapa.${nextAgent?` Depois, ${nextAgent.name} continua.`:''}`:project.status==='completed'?'Todas as etapas foram concluídas.':`Próxima etapa: ${stage?.title||'iniciar a equipe'}${agent?` · ${agent.name} · ${agent.role}`:''}.`;
 const canResume=needsResume(project)&&project.status!=='waiting';
 return <section className={`manager-activity-project ${featured?'featured':''}`}>
  <header><span>{project.status==='completed'?'ENTREGA CONCLUÍDA':needsResume(project)?'PLANEJADO · PRECISA DE AÇÃO':'PROJETO EM ANDAMENTO'}</span><button onClick={()=>onProject(project.id)} title="Abrir projeto completo"><ArrowUpRight size={16}/></button></header>
  <h4 title={project.title}>{project.title}</h4><TeamProgress project={project} agents={state.agents} compact/>
  <div className="manager-project-next"><span>{project.status==='waiting'?'AGUARDANDO VOCÊ':project.status==='running'?'ETAPA ATUAL':'PRÓXIMA AÇÃO'}</span><strong>{nextAction}</strong></div>
  <div className="manager-project-actions"><button onClick={()=>onProject(project.id)}>Ver projeto<ArrowUpRight size={13}/></button>{canResume&&<button className="primary" onClick={()=>onResume(project)}>{project.status==='paused'||project.status==='error'?<RotateCcw size={13}/>:<Play size={13}/>} {project.status==='queued'?'Tentar iniciar':'Retomar projeto'}</button>}{project.status==='waiting'&&<button className="primary" onClick={()=>onProject(project.id)}>Ver pergunta<ArrowRight size={13}/></button>}</div>
 </section>;
}

export function ManagerProjectOverview({state,onProject,onTask,onChat,onResume}:{state:State;onProject:(id:string)=>void;onTask:(id:string)=>void;onChat:()=>void;onResume:(project:Collaboration)=>void}){
 const projects=managerProjects(state);const featured=featuredManagerProject(state);const previous=projects.filter(project=>project.id!==featured?.id);
 const tasks=state.tasks.filter(task=>task.delegatedBy===MANAGER_ID);
 const active=projects.filter(project=>['gathering','running','returning'].includes(project.status)).length+tasks.filter(task=>task.status==='Em andamento').length;
 const completed=projects.filter(project=>project.status==='completed').length+tasks.filter(task=>task.status==='Concluída').length;
 return <div className="manager-activity">
  <div className="manager-activity-intro"><div className="eyebrow">VISÃO DO GESTOR</div><h3>Projetos e tarefas, em um só lugar.</h3><p>Projetos reúnem etapas de uma equipe. Tarefas são trabalhos individuais e também aparecem em Tarefas.</p></div>
  <div className="manager-activity-stats"><div><span>Em atividade</span><strong>{active}</strong></div><div><span>Entregas concluídas</span><strong>{completed}</strong></div></div>
  {featured?<ProjectCard project={featured} state={state} onProject={onProject} onResume={onResume} featured/>:<div className="manager-activity-empty"><Users size={27}/><h4>Sua próxima entrega começa aqui.</h4><p>Peça algo ao Gestor para criar um projeto de equipe. Você também pode acompanhar tarefas individuais abaixo.</p><button onClick={onChat}><MessageSquare size={15}/>Conversar com Gestor</button></div>}
  {previous.length>0&&<details className="manager-project-archive"><summary><span>Outros projetos e planos</span><small>{previous.length}</small><ChevronDown size={15}/></summary><div>{previous.map(project=><ProjectCard key={project.id} project={project} state={state} onProject={onProject} onResume={onResume}/>)}</div></details>}
  <section className="manager-activity-task-section"><header><div><span className="eyebrow">TRABALHO INDIVIDUAL</span><h4>Tarefas</h4></div><button onClick={()=>onTask('')}>Ver todas<ArrowUpRight size={13}/></button></header>
   {tasks.length?tasks.map(task=><button key={task.id} className="manager-activity-task" onClick={()=>onTask(task.id)}><span className="manager-task-icon"><CheckCheck size={17}/></span><span><strong>{task.title}</strong><small>{state.agents.find(agent=>agent.id===task.agentId)?.name} · {state.agents.find(agent=>agent.id===task.agentId)?.role} · {task.status}</small></span><ArrowUpRight size={15}/></button>):<p className="manager-activity-no-tasks">Nenhuma tarefa individual por enquanto. Projetos em equipe aparecem acima.</p>}
  </section>
 </div>;
}
