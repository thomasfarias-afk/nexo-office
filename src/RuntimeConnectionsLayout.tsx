import React from 'react';
import {ArrowUpRight,Check,CheckCheck,FolderOpen,History,LoaderCircle,PlugZap,RefreshCw,Terminal} from 'lucide-react';
import type {RuntimeJob,RuntimeStatus} from './runtime-types';
import {runtimeRequest} from './runtime-client';
import {RuntimeJobView} from './RuntimeConnections';
import {ProviderLogo} from './ProviderLogo';

interface Props {
 status:RuntimeStatus|null;workspace:string;setWorkspace:(value:string)=>void;
 error:string;pending:boolean;auth:any;setAuth:(value:any)=>void;jobs:RuntimeJob[];
 action:(fn:()=>Promise<unknown>)=>Promise<void>;refresh:()=>Promise<void>;
}

export function RuntimeConnectionsLayout({status,workspace,setWorkspace,error,pending,auth,setAuth,jobs,action,refresh}:Props){
 const executions=jobs.filter(j=>j.kind==='execute');
 return <div className="runtime-connections">
  <section className="connections-hero">
   <span className="connections-hero-icon"><PlugZap size={25}/></span>
   <span className="eyebrow">CONECTE SUAS POSSIBILIDADES</span>
   <h3>A sua IA.<br/><em>O potencial do seu time.</em></h3>
   <p>Conecte sua conta e transforme conversas em arquivos, projetos e entregas reais.</p>
   <div className="connections-benefits"><span><Terminal size={13}/>Execução local</span><span><CheckCheck size={14}/>Sua conta de IA</span></div>
  </section>
  {error&&<p role="alert" className="notice">{error}</p>}
  <div className="connections-section-heading"><span>CONEXÕES DISPONÍVEIS</span><span>{status?`${status.providers.filter(p=>p.ready).length} conectadas`:'Verificando…'}</span></div>
  <div className="runtime-providers">
   {!status&&<div className="connections-loading" role="status"><LoaderCircle size={18} className="spin"/>Verificando suas conexões…</div>}
   {status?.providers.map(provider=><article key={provider.id} data-provider={provider.id} data-active={status.provider===provider.id}>
    <header className="provider-heading"><ProviderLogo provider={provider.id}/><div><strong>{provider.name}</strong><span className="provider-caption">{provider.id==='codex'?'Da ideia ao código':provider.id==='claude'?'Inteligência para construir':'Para suas conversas'}</span></div>{status.provider===provider.id&&<span className="provider-selected" title="Conexão em uso"><Check size={13}/></span>}</header>
    <p>{provider.message}</p>
    <footer className="provider-footer"><span className="provider-status" data-ready={provider.ready}>{provider.ready?'Conectado':provider.installed?'Login necessário':'Não instalado'}</span>
     {provider.ready?status.provider===provider.id?<span className="provider-active"><Check size={12}/>Em uso</span>:<button disabled={pending} onClick={()=>action(async()=>{await runtimeRequest('/settings',{provider:provider.id});await refresh();})}>Usar conexão<ArrowUpRight size={13}/></button>:provider.installed&&provider.id!=='api'?<button disabled={pending} onClick={()=>action(async()=>setAuth(await runtimeRequest('/auth',{provider:provider.id})))}>Conectar<ArrowUpRight size={13}/></button>:provider.id==='claude'?<a href="https://code.claude.com/docs/en/setup" target="_blank" rel="noreferrer">Instalar<ArrowUpRight size={13}/></a>:null}
    </footer>
   </article>)}
  </div>
  {auth&&<div className="notice runtime-auth"><p>{auth.message}</p>{auth.code&&<strong>{auth.code}</strong>}{auth.url&&<a href={auth.url} target="_blank" rel="noreferrer">Continuar login oficial ↗</a>}</div>}
  <form className="runtime-workspace" onSubmit={e=>{e.preventDefault();action(async()=>{await runtimeRequest('/settings',{workspace});await refresh();});}}>
   <div className="connections-form-heading"><span><FolderOpen size={20}/></span><div><h4>Um lugar para criar</h4><p>Escolha onde os agentes trabalham.</p></div></div>
   <label htmlFor="runtime-workspace">Pasta de trabalho</label><input id="runtime-workspace" value={workspace} onChange={e=>setWorkspace(e.target.value)} required/>
   <p className="workspace-explanation">Arquivos e projetos ficam nesta pasta. Acompanhe as alterações e os comandos no histórico de execução.</p>
   <div className="connections-form-actions"><button className="primary" disabled={pending}><Check size={14}/>Salvar pasta</button><button type="button" disabled={pending} onClick={()=>action(refresh)}><RefreshCw size={14} className={pending?'spin':''}/>Verificar conexão</button></div>
  </form>
  <section className="connections-history"><div className="connections-section-heading"><span>EXECUÇÕES RECENTES</span><span>{executions.length}</span></div>{executions.length?executions.map(job=><RuntimeJobView key={job.id} id={job.id}/>):<div className="connections-history-empty"><History size={22}/><div><h4>As próximas entregas começam aqui.</h4><p>Peça uma tarefa ao Gestor para acompanhar sua equipe em ação.</p></div></div>}</section>
 </div>;
}
