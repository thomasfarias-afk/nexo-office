import {MANAGER_ID,type Collaboration,type State} from './domain';

export function managerProjects(state:State):Collaboration[]{
 const stored=state.collaborations.filter(project=>project.requestedBy===MANAGER_ID);
 const savedIds=new Set(stored.map(project=>project.id));
 const planned=(state.messages[MANAGER_ID]||[]).flatMap(message=>message.teamPlan&&!savedIds.has(message.teamPlan.id)?[message.teamPlan]:[]);
 return [...stored,...planned].sort((a,b)=>Date.parse(b.updatedAt||b.createdAt)-Date.parse(a.updatedAt||a.createdAt));
}
export const needsResume=(project:Collaboration)=>['draft','queued','preview','paused','waiting','error'].includes(project.status);
export const resumableManagerProjects=(state:State)=>managerProjects(state).filter(needsResume);
export function featuredManagerProject(state:State):Collaboration|undefined{
 const projects=managerProjects(state);
 return projects.find(needsResume)||projects.find(project=>['gathering','running','returning'].includes(project.status))||projects[0];
}
