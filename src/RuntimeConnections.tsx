import React,{useEffect,useState} from 'react';
import {runtimeRequest} from './runtime-client';
import type {RuntimeJob,RuntimeStatus} from './runtime-types';
import './runtime.css';
import {RuntimeConnectionsLayout} from './RuntimeConnectionsLayout';
export function RuntimeJobView({id}:{id:string}){const [job,setJob]=useState<RuntimeJob|null>(null);useEffect(()=>{let active=true;const refresh=()=>runtimeRequest('/jobs/'+id).then(j=>{if(active)setJob(j);}).catch(()=>{});refresh();const timer=setInterval(refresh,2000);return()=>{active=false;clearInterval(timer);};},[id]);if(!job)return null;return <details className="runtime-job"><summary>{job.title} · {job.status} · {job.files.length} arquivos</summary><small>{job.provider} · {job.workspace}</small>{['running','queued'].includes(job.status)&&<button onClick={()=>runtimeRequest('/jobs/'+id+'/cancel',{})}>Interromper execução</button>}{job.error&&<p role="alert">{job.error}</p>}{job.files.map(file=><p key={file}>↗ {file}</p>)}{job.commands.map((command,i)=><pre key={i}>{command.command}{'\n'}Código de saída: {command.exitCode??'não informado'}{'\n'}{command.output}</pre>)}<pre>{job.output||job.events.slice(-5).map(e=>e.text).join('\n')}</pre></details>;}
export function RuntimeConnections({onChange}:{onChange:(status:RuntimeStatus)=>void}){
 const [status,setStatus]=useState<RuntimeStatus|null>(null),[workspace,setWorkspace]=useState(''),[error,setError]=useState(''),[pending,setPending]=useState(false),[auth,setAuth]=useState<any>(null),[jobs,setJobs]=useState<RuntimeJob[]>([]);
 async function refresh(){try{const value=await runtimeRequest('');setStatus(value);setWorkspace(value.workspace);onChange(value);setJobs(await runtimeRequest('/jobs'));}catch(e){setError(e.message);}}
 useEffect(()=>{refresh();const timer=setInterval(()=>runtimeRequest('/jobs').then(setJobs).catch(()=>{}),4000);return()=>clearInterval(timer);},[]);
 useEffect(()=>{if(!auth||auth.status!=='running')return;const timer=setInterval(()=>runtimeRequest('/auth/'+auth.id).then(next=>{setAuth(next);if(next.status!=='running')refresh();}).catch(e=>setError(e.message)),1500);return()=>clearInterval(timer);},[auth?.id,auth?.status]);
 async function action(fn:()=>Promise<unknown>){setPending(true);setError('');try{await fn();}catch(e){setError(e.message);}finally{setPending(false);}}
 return <RuntimeConnectionsLayout {...{status,workspace,setWorkspace,error,pending,auth,setAuth,jobs,action,refresh}}/>;
}
