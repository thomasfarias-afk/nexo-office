import React,{useEffect,useRef,useState} from 'react';
import {Search,Users,CheckCheck,ChevronRight,X} from 'lucide-react';
import {searchWorkspace,type SearchResult} from './workspace-utils';
import type {State} from './domain';

export function QuickSearch({state,onClose,onChoose}:{state:State;onClose:()=>void;onChoose:(result:SearchResult)=>void}){
 const [query,setQuery]=useState(''),[active,setActive]=useState(0);
 const root=useRef<HTMLDivElement>(null),input=useRef<HTMLInputElement>(null);
 const results=searchWorkspace(state,query);
 useEffect(()=>{const previous=document.activeElement as HTMLElement;input.current?.focus();return ()=>previous?.focus();},[]);
 useEffect(()=>{root.current?.querySelector('[aria-selected=true]')?.scrollIntoView({block:'nearest'});},[active]);
 return <div className="modal-layer search-layer" onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
 <div className="quick-search glass" ref={root} role="dialog" aria-modal="true" aria-label="Busca rápida" onKeyDown={e=>{
  if(e.key==='Escape'){e.stopPropagation();onClose();}
  if(e.key==='Tab'){e.preventDefault();const nodes=root.current?.querySelectorAll<HTMLElement>('input,button');if(nodes?.length){const index=Array.from(nodes).indexOf(document.activeElement as HTMLElement);nodes[(index+(e.shiftKey?-1:1)+nodes.length)%nodes.length].focus();}}
 }}>
 <div className="quick-search-input"><Search size={21}/><input ref={input} placeholder="Busque por agente, função ou tarefa…" value={query} role="combobox" aria-label="Buscar agentes e tarefas" aria-autocomplete="list" aria-expanded="true" aria-controls="workspace-results" aria-activedescendant={results[active]?`quick-result-${active}`:undefined} onChange={e=>{setQuery(e.target.value);setActive(0);}} onKeyDown={e=>{
  if(e.key==='ArrowDown'){e.preventDefault();setActive(i=>Math.max(0,Math.min(i+1,results.length-1)));}
  if(e.key==='ArrowUp'){e.preventDefault();setActive(i=>Math.max(0,i-1));}
  if(e.key==='Enter'&&results[active]){e.preventDefault();onChoose(results[active]);}
 }}/><button className="icon-btn" aria-label="Fechar busca" onClick={onClose}><X size={18}/></button></div>
 <div className="quick-search-heading">{query?'RESULTADOS':'AGENTES E TAREFAS'}</div>
 <div className="quick-search-results" role="listbox" id="workspace-results" aria-label="Resultados da busca">{results.map((r,i)=><button key={`${r.kind}-${r.id}`} id={`quick-result-${i}`} role="option" aria-selected={i===active} onMouseEnter={()=>setActive(i)} onClick={()=>onChoose(r)}><span className={`quick-result-icon ${r.kind}`}>{r.kind==='agent'?<Users size={18}/>:<CheckCheck size={18}/>}</span><span><strong>{r.title}</strong><small>{r.detail}</small></span><ChevronRight size={16}/></button>)}{!results.length&&<p className="quick-search-empty">Nada encontrado. Tente outro nome ou palavra.</p>}</div>
 <footer><span>↑ ↓ navegar</span><span>Enter abrir</span><span>Esc fechar</span></footer>
 </div></div>;
}
