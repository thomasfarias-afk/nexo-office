import {spawn} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {homedir} from 'node:os';
import path from 'node:path';
import type {AccountUsage,ProviderChoice,UsageWindow} from '../src/runtime-types.ts';

interface Command {file:string;prefix:string[];}
class UsageLookupError extends Error {}
const finite=(value:unknown):value is number=>typeof value==='number'&&Number.isFinite(value);
function resetDate(value:unknown):string|null{
 const time=finite(value)?value*1000:typeof value==='string'?Date.parse(value):NaN;
 return Number.isFinite(time)&&time>0&&time<8640000000000000?new Date(time).toISOString():null;
}
function window(id:string,used:unknown,minutes:number,reset:unknown):UsageWindow|null{
 if(!finite(used))return null;
 const label=minutes===10080?'Limite semanal':minutes===300?'Limite de 5 horas':minutes>=60&&minutes%60===0?`Limite de ${minutes/60} horas`:`Limite de ${minutes} min`;
 return {id,label,remainingPercent:Math.max(0,Math.min(100,100-used)),resetsAt:resetDate(reset),windowMinutes:minutes};
}
export function normalizeCodexUsage(payload:any):UsageWindow[]{
 const bucket=payload?.rateLimitsByLimitId?.codex??payload?.rateLimits;
 if(!bucket)return [];
 return ['primary','secondary'].flatMap(id=>{const raw=bucket[id];if(!raw||!finite(raw.windowDurationMins)||raw.windowDurationMins<=0)return [];const result=window(id,raw.usedPercent,raw.windowDurationMins,raw.resetsAt);return result?[result]:[];});
}
export function normalizeClaudeUsage(payload:any):UsageWindow[]{
 return [['five_hour',300],['seven_day',10080]].flatMap(([id,minutes])=>{const raw=payload?.[id];if(!raw)return [];const result=window(String(id),raw.utilization,Number(minutes),raw.resets_at);return result?[result]:[];});
}

// Only account metadata is requested. No thread or model turn is started.
export async function readCodexUsage(command:Command,timeoutMs=12000):Promise<UsageWindow[]>{
 return new Promise((resolve,reject)=>{
  const child=spawn(command.file,[...command.prefix,'app-server'],{shell:false,windowsHide:true,stdio:['pipe','pipe','pipe']});
  let buffer='',settled=false,initialized=false;
  const timer=setTimeout(()=>finish(Error('A consulta ao Codex demorou. Tente novamente.')),timeoutMs);
  function finish(error?:Error,value:UsageWindow[]=[]){if(settled)return;settled=true;clearTimeout(timer);child.stdin.end();child.kill();error?reject(error):resolve(value);}
  function send(value:unknown){if(!settled&&!child.stdin.destroyed)child.stdin.write(JSON.stringify(value)+'\n');}
  child.stdin.on('error',()=>finish(Error('Não foi possível consultar a conta Codex.')));
  child.stderr.resume();
  child.on('error',()=>finish(Error('Não foi possível iniciar a consulta ao Codex.')));
  child.on('close',()=>finish(Error('O Codex encerrou antes de informar os limites.')));
  child.stdout.on('data',chunk=>{
   buffer+=String(chunk);if(buffer.length>1024*1024){finish(Error('Resposta de limites inválida.'));return;}
   let newline:number;
   while((newline=buffer.indexOf('\n'))>=0){const line=buffer.slice(0,newline);buffer=buffer.slice(newline+1);let message:any;try{message=JSON.parse(line);}catch{continue;}
    if(settled)break;
    if(message.id===1){if(message.error){finish(Error('O Codex não disponibilizou a consulta de limites.'));return;}if(initialized)continue;initialized=true;send({method:'initialized'});send({id:2,method:'account/rateLimits/read'});}
    if(message.id===2&&initialized){if(message.error){finish(Error('Não foi possível consultar os limites. Verifique o login no Codex.'));return;}finish(undefined,normalizeCodexUsage(message.result));}
   }
  });
  send({id:1,method:'initialize',params:{clientInfo:{name:'nexo_office',title:'Nexo Office',version:'1.0.0'}}});
 });
}

export async function readClaudeUsage(options:{fetch?:typeof fetch;readCredentials?:()=>Promise<string>;token?:string}={}):Promise<UsageWindow[]>{
 let token=options.token??process.env.CLAUDE_CODE_OAUTH_TOKEN;
 if(!token){
  let credentials:any;
  try{credentials=JSON.parse(await (options.readCredentials?.()??readFile(path.join(process.env.CLAUDE_CONFIG_DIR||path.join(homedir(),'.claude'),'.credentials.json'),'utf8')));}catch{throw Error('Conecte sua conta no Claude Code para consultar os limites.');}
  const account=credentials?.claudeAiOauth;
  if(finite(account?.expiresAt)&&account.expiresAt<=Date.now())throw Error('Renove o login no Claude Code para atualizar os limites.');
  token=account?.accessToken;
 }
 if(typeof token!=='string'||!token)throw Error('A conta Claude não disponibilizou acesso aos limites.');
 // This account endpoint can be unavailable for some plans/CLI versions.
 // Credentials stay on the server and are never returned or persisted by Nexo.
 const response=await (options.fetch??fetch)('https://api.anthropic.com/api/oauth/usage',{headers:{Authorization:`Bearer ${token}`,'anthropic-beta':'oauth-2025-04-20','User-Agent':'nexo-office/1.0.0'},redirect:'error',signal:AbortSignal.timeout(12000)});
 if(response.status===401||response.status===403)throw Error('O Claude não autorizou a consulta. Verifique o login da conta.');
 if(response.status===429)throw Error('O Claude limitou as consultas de uso. Aguarde alguns minutos.');
 if(!response.ok)throw Error('O serviço de limites do Claude está indisponível.');
 return normalizeClaudeUsage(await response.json());
}

export class AccountUsageService {
 private cache=new Map<ProviderChoice,{at:number;value:AccountUsage}>();
 private pending=new Map<ProviderChoice,Promise<AccountUsage>>();
 private generation=0;
 private readers:{codex:()=>Promise<UsageWindow[]>;claude:()=>Promise<UsageWindow[]>};
 private now:()=>number;
 constructor(readers:{codex:()=>Promise<UsageWindow[]>;claude:()=>Promise<UsageWindow[]>},now=()=>Date.now()){this.readers=readers;this.now=now;}
 invalidate(){this.generation++;this.cache.clear();this.pending.clear();}
 async read(provider:ProviderChoice,ready:boolean):Promise<AccountUsage>{
  const checkedAt=new Date(this.now()).toISOString();
  if(!ready){this.cache.delete(provider);return {provider,status:'disconnected',windows:[],updatedAt:null,checkedAt,message:'Conecte sua conta de IA para acompanhar os limites.'};}
  if(provider==='api')return {provider,status:'unavailable',windows:[],updatedAt:null,checkedAt,message:'A API de texto não informa um limite de assinatura.'};
  const cached=this.cache.get(provider);const ttl=provider==='claude'?300000:60000;
  if(cached&&this.now()-cached.at<ttl)return cached.value;
  const existing=this.pending.get(provider);if(existing)return existing;
  const generation=this.generation;
  const request=(async()=>{
   let value:AccountUsage;
   try{const windows=await this.readers[provider]();value={provider,status:windows.length?'ready':'unavailable',windows,updatedAt:windows.length?checkedAt:null,checkedAt,...(!windows.length?{message:'Sua conta não informou os limites de uso.'}:{})};}
   catch(error){
    // Never include upstream diagnostics or credentials in API responses.
    const message=error instanceof UsageLookupError?error.message:"Não foi possível atualizar os limites agora.";
    value=cached?.value.windows.length?{...cached.value,status:'error',stale:true,checkedAt,message}:{provider,status:'error',windows:[],updatedAt:null,checkedAt,message};
   }
   if(this.generation===generation)this.cache.set(provider,{at:this.now(),value});return value;
  })();
  this.pending.set(provider,request);
  try{return await request;}finally{if(this.pending.get(provider)===request)this.pending.delete(provider);}
 }
}
