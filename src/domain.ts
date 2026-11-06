export type TaskStatus='A fazer'|'Em andamento'|'Aguardando minha resposta'|'Concluída'|'Cancelada';
export interface Agent {id:string;name:string;role:string;color:string;mascot?:'bunny'|'cat'|'owl'|'bear'|'fox';hair?:string;instructions:string;specialties:string;tools:string[];x:number;z:number;paused?:boolean;}
export interface Attachment {id:string;name:string;type:string;size:number;content:string;}
export interface Message {id:string;role:'user'|'assistant'|'system';content:string;at:string;attachments?:Attachment[];proposal?:Proposal;confirmed?:boolean;teamPlan?:Collaboration;projectId?:string;managerClarification?:{request:string;projectId?:string};managerResolved?:boolean;}
export interface Proposal {title:string;objective:string;priority:string;due:string;expected:string;}
export interface Task extends Proposal {id:string;agentId:string;status:TaskStatus;attachments:Attachment[];history:{at:string;text:string}[];result?:string;delegatedBy?:string;}
export type RoomId='aurora'|'horizonte';
export interface TeamStage {jobId?:string;id:string;agentId:string;title:string;instructions:string;status:'pending'|'running'|'completed'|'waiting'|'error';result?:string;}
export interface Collaboration {id:string;title:string;objective:string;roomId:RoomId;status:'draft'|'queued'|'preview'|'gathering'|'running'|'returning'|'completed'|'paused'|'waiting'|'error';stages:TeamStage[];createdAt:string;updatedAt:string;error?:string;requestedBy?:string;autoStart?:boolean;assignmentHistory?:{at:string;text:string}[];}
export interface State {agents:Agent[];removedAgents?:Agent[];tasks:Task[];messages:Record<string,Message[]>;files:Attachment[];collaborations:Collaboration[];preferences:{dark:boolean;motion:boolean};}
export const taskStatuses:TaskStatus[]=['A fazer','Em andamento','Aguardando minha resposta','Concluída','Cancelada'];
export const MANAGER_ID='manager';
export const managerAgent:Agent={id:MANAGER_ID,name:'Gestor',role:'Gestor de projetos',mascot:'bear',color:'#7298b6',x:-5.85,z:2.8,instructions:'Converse com o usuário, entenda o objetivo e distribua o trabalho aos especialistas. Coordene as entregas e acompanhe os projetos. Não afirme que código ou testes foram executados: os agentes geram entregas em texto.',specialties:'Delegação, gestão de equipe, acompanhamento e entregas',tools:['Texto','Planejamento da equipe']};
export const withManager=(agents:Agent[]):Agent[]=>agents.some(a=>a.id===MANAGER_ID)?agents:[...agents,structuredClone(managerAgent)];
export const initialAgents:Agent[]=[
 {id:'coord',name:'Sofia',role:'Coordenadora',color:'#9b9cbd',x:-3,z:-2.5,instructions:'Organize demandas e acompanhe entregas.',specialties:'Planejamento, organização, prioridades',tools:['Texto']},
 {id:'dev',name:'Lucas',role:'Desenvolvedor',color:'#709c9d',x:1,z:-2.5,instructions:'Auxilie com código e implementações. Explique como validar o código.',specialties:'Código, arquitetura, revisão',tools:['Texto']},
 {id:'analyst',name:'Clara',role:'Analista',color:'#c4a47a',x:5,z:-2.5,instructions:'Analise os dados fornecidos e prepare relatórios. Não invente números.',specialties:'Dados, relatórios, pesquisa',tools:['Texto']},
 {id:'support',name:'Rafael',role:'Suporte',color:'#879f78',x:-2,z:2,instructions:'Auxilie com dúvidas e procedimentos.',specialties:'Atendimento, documentação, processos',tools:['Texto']},
 {id:'design',name:'Luna',role:'Designer',color:'#b18d9f',x:3,z:2,instructions:'Desenvolva propostas visuais e interfaces.',specialties:'Interfaces, identidade, experiência',tools:['Texto']},
 managerAgent
];
export function agentStatus(state:State,id:string):string{if(state.agents.find(a=>a.id===id)?.paused)return 'paused';const meeting=state.collaborations?.find(c=>['preview','gathering','running','returning'].includes(c.status)&&c.stages.some(s=>s.agentId===id));if(meeting)return meeting.status==='running'&&meeting.stages.some(s=>s.agentId===id&&s.status==='running')?'working':'meeting';const tasks=state.tasks.filter(t=>t.agentId===id);if(tasks.some(t=>t.status==='Em andamento'))return 'working';if(tasks.some(t=>t.status==='Aguardando minha resposta'))return 'waiting';return 'available';}
export function makeTask(agentId:string,proposal:Proposal,attachments:Attachment[]=[]):Task{return {...proposal,id:crypto.randomUUID(),agentId,status:'A fazer',attachments,history:[{at:new Date().toISOString(),text:'Tarefa confirmada e registrada.'}]};}
export const emptyState=():State=>({agents:structuredClone(initialAgents),tasks:[],messages:{},files:[],collaborations:[],preferences:{dark:false,motion:false}});
