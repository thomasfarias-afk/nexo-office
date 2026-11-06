import {localRuntime} from './runtime/local-runtime.ts';
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
try { process.loadEnvFile(); } catch {}
export async function api(req,res){
 const json=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
 try {
 const origin=req.headers.origin;if(origin&&origin!==`http://${req.headers.host}`&&origin!==`https://${req.headers.host}`)return json(403,{error:'Origem bloqueada.'});
 if(req.headers['sec-fetch-site']==='cross-site')return json(403,{error:'Origem n?o permitida.'});
 const pathname=new URL(req.url,'http://localhost').pathname;
 const body=async()=>{if(!String(req.headers['content-type']||'').includes('application/json'))throw Error('Envie JSON.');let value='';for await(const chunk of req){value+=chunk;if(value.length>1000000)throw Error('Mensagem muito grande.');}return JSON.parse(value||'{}');};
 if(pathname==='/api/runtime'&&req.method==='GET')return json(200,await localRuntime.status());
 if(pathname==='/api/runtime/usage'&&req.method==='GET')return json(200,await localRuntime.usage());
 if(pathname==='/api/runtime/settings'&&req.method==='POST')return json(200,await localRuntime.configure(await body()));
 if(pathname==='/api/runtime/auth'&&req.method==='POST')return json(200,await localRuntime.login((await body()).provider));
 if(pathname.startsWith('/api/runtime/auth/'))return json(200,localRuntime.auth.get(pathname.split('/').pop())||{status:'error',message:'Login inexistente.'});
 if(pathname==='/api/runtime/jobs')return json(200,req.method==='POST'?await localRuntime.create(await body()):await localRuntime.list());
 const match=pathname.match(/^\/api\/runtime\/jobs\/([a-f0-9-]+)(\/cancel)?$/);
 if(match){const job=match[2]&&req.method==='POST'?await localRuntime.cancel(match[1]):await localRuntime.get(match[1]);return json(job?200:404,job||{error:'Tarefa inexistente.'});}
 const runtime=await localRuntime.status();
 if(pathname==='/api/status')return json(200,{...runtime,model:runtime.provider});
 if(pathname==='/api/chat'&&req.method==='POST'&&runtime.execution){const data=await body();if(!Array.isArray(data.messages))throw Error('Conversa sem mensagens.');const job=await localRuntime.create({kind:'plan',title:'Conversa e planejamento',instructions:data.instructions,prompt:data.messages.slice(-40).map(m=>`${m.role}: ${String(m.content).slice(0,60000)}`).join('\n\n')});const result=await localRuntime.wait(job.id);if(result.status!=='completed')throw Error(result.error||'Conversa interrompida.');return json(200,{content:result.output});}
 }catch(error){return json(400,{error:error instanceof Error?error.message:'Falha na tarefa local.'});}
 const configured=!!(process.env.AI_BASE_URL&&process.env.AI_API_KEY&&process.env.AI_MODEL);
 if(req.url==='/api/status')return json(200,{configured,model:configured?process.env.AI_MODEL:null});
 if(req.url!=='/api/chat'||req.method!=='POST')return json(404,{error:'Rota não encontrada.'});
 if(!configured)return json(503,{error:'Conecte um provedor de IA no servidor para executar esta ação.'});
 try{
 let body='';for await(const chunk of req){body+=chunk;if(body.length>1000000)return json(413,{error:'Mensagem muito grande.'});}
 const data=JSON.parse(body);if(!Array.isArray(data.messages)||!data.messages.length)return json(400,{error:'Envie uma conversa válida.'});
 const messages=data.messages.slice(-40).map(m=>({role:m.role==='assistant'?'assistant':'user',content:String(m.content).slice(0,60000)}));
 const disconnected=new AbortController();res.on('close',()=>disconnected.abort());
 const response=await fetch(process.env.AI_BASE_URL.replace(/\/$/,'')+'/chat/completions',{method:'POST',headers:{Authorization:`Bearer ${process.env.AI_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({model:process.env.AI_MODEL,messages:[{role:'system',content:`Você é um agente de escritório. Responda em português. Peça esclarecimentos quando necessários. Não afirme ter executado ferramentas ou ações externas. Você só pode gerar texto. Perfil: ${String(data.instructions||'').slice(0,8000)}`},...messages]}),signal:AbortSignal.any([AbortSignal.timeout(90000),disconnected.signal])});
 if(!response.ok)return json(502,{error:'O provedor recusou a solicitação. Verifique a configuração no servidor.'});
 const result=await response.json();const content=result.choices?.[0]?.message?.content;if(!content)throw new Error('Resposta vazia');return json(200,{content});
 }catch(error){return json(502,{error:error.name==='TimeoutError'?'O provedor demorou para responder. Tente novamente.':'Não foi possível obter a resposta. Verifique o servidor e tente novamente.'});}
}
const root=path.dirname(fileURLToPath(import.meta.url));
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png'};
 http.createServer(async(req,res)=>{if(req.url.startsWith('/api/'))return api(req,res);try{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);const file=path.resolve(root,'dist','.'+(pathname==='/'?'/index.html':pathname));if(!file.startsWith(path.join(root,'dist')+path.sep))throw new Error();const content=await readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});res.end(content);}catch{res.writeHead(404);res.end('Não encontrado');}}).listen(Number(process.env.PORT)||4173,'127.0.0.1',()=>console.log(`Nexo em http://127.0.0.1:${process.env.PORT||4173}`));
}
