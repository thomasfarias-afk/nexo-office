import React from 'react';
import {MessageSquare,ChevronRight} from 'lucide-react';
import type {Agent} from './domain';
import {Mascot} from './Mascot';
export function ManagerLauncher({agent,active,onClick}:{agent:Agent;active:boolean;onClick:()=>void}){
 return <button className={`manager-shortcut manager-launcher ${active?'active':''}`} onClick={onClick} aria-expanded={active} aria-label={active?'Fechar conversa com Gestor':'Conversar e delegar ao Gestor'} title="Conversar e delegar ao Gestor"><span className="manager-launcher-avatar"><Mascot agent={agent}/><i/></span><span className="manager-launcher-copy"><strong>Gestor</strong><small>Converse e delegue</small></span><MessageSquare className="manager-launcher-chat" size={17}/><ChevronRight className="manager-launcher-arrow" size={14}/></button>;
}
export function ManagerTabs({value,onChange,count}:{value:'chat'|'activity';onChange:(value:'chat'|'activity')=>void;count:number}){
 return <div className="manager-tabs" role="tablist" aria-label="Painel do Gestor" onKeyDown={e=>{let next:'chat'|'activity'|undefined;if(e.key==='ArrowLeft'||e.key==='ArrowRight')next=value==='chat'?'activity':'chat';if(e.key==='Home')next='chat';if(e.key==='End')next='activity';if(next){e.preventDefault();onChange(next);e.currentTarget.querySelector<HTMLButtonElement>(`[data-view=${next}]`)?.focus();}}}>
 <button id="gestor-tab-chat" data-view="chat" role="tab" tabIndex={value==='chat'?0:-1} aria-controls="gestor-panel-chat" aria-selected={value==='chat'} onClick={()=>onChange('chat')}><MessageSquare size={14}/>Conversa</button>
 <button id="gestor-tab-activity" data-view="activity" role="tab" tabIndex={value==='activity'?0:-1} aria-controls="gestor-panel-activity" aria-selected={value==='activity'} onClick={()=>onChange('activity')}><ChevronRight size={14}/>Atividade do time<span>{count}</span></button>
 </div>;
}
