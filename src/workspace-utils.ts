import type {State,Task} from './domain';

export const normalizeSearch=(value:string)=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR').trim();
export function isOverdue(task:Task,now=new Date()):boolean{
 if(!/^\d{4}-\d{2}-\d{2}$/.test(task.due)||task.status==='Concluída'||task.status==='Cancelada')return false;
 const today=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
 return task.due<today;
}
export interface SearchResult {id:string;kind:'agent'|'task';title:string;detail:string;}
export function searchWorkspace(state:State,query:string):SearchResult[]{
 const q=normalizeSearch(query);
 const results:(SearchResult&{search:string})[]=[
  ...state.agents.map(a=>({id:a.id,kind:'agent' as const,title:a.name,detail:a.role,search:`${a.name} ${a.role} ${a.specialties}`})),
  ...state.tasks.map(t=>({id:t.id,kind:'task' as const,title:t.title,detail:`${t.status} · ${state.agents.find(a=>a.id===t.agentId)?.name||'Sem agente'}`,search:`${t.title} ${t.objective} ${t.status}`})),
 ];
 return results.filter(r=>normalizeSearch(r.search).includes(q)).slice(0,12);
}
