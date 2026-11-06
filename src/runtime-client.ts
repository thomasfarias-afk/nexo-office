import type {RuntimeJob,RuntimeJobRequest} from './runtime-types';
export async function runtimeRequest(url:string,data?:unknown){const response=await fetch('/api/runtime'+url,data===undefined?{}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});const value=await response.json();if(!response.ok)throw Error(value.error||'Falha na conexão local.');return value;}
export async function executeLocal(request:Omit<RuntimeJobRequest,'kind'>,signal?:AbortSignal,onJob?:(id:string)=>void):Promise<string>{
 const job:RuntimeJob=await runtimeRequest('/jobs',{...request,kind:'execute'});onJob?.(job.id);
 const cancel=()=>{void runtimeRequest('/jobs/'+job.id+'/cancel',{}).catch(()=>{});};signal?.addEventListener('abort',cancel,{once:true});
 try{for(;;){if(signal?.aborted){cancel();signal.throwIfAborted();}const current:RuntimeJob=await runtimeRequest('/jobs/'+job.id);if(current.status==='completed')return current.output;if(current.status==='error'||current.status==='cancelled')throw Error(current.error||'Execução cancelada.');await new Promise(resolve=>setTimeout(resolve,1000));}}finally{signal?.removeEventListener('abort',cancel);}
}
