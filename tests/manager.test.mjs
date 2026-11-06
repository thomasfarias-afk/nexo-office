import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyState,MANAGER_ID,withManager} from '../src/domain.ts';
import {localManagerDecision,parseManagerDecision,managerProjectForDecision,managerRequestContext,askManager} from '../src/manager.ts';
import {nextAutoDispatch,validateCollaboration} from '../src/collaboration.ts';

test('old workspaces receive one manager and retain their custom agents',()=>{
 const original=[{id:'custom',name:'Meu agente'}];
 const upgraded=withManager(original);
 assert.equal(upgraded.length,2);assert.equal(upgraded[0],original[0]);assert.equal(upgraded[1].id,MANAGER_ID);
 assert.equal(withManager(upgraded).length,2);assert.equal(original.length,1);
});
test('local manager creates an honest ordered plan for design, development and testing',()=>{
 const decision=localManagerDecision('Quero criar uma página com designer, desenvolvedor e suporte para testar.',emptyState());
 assert.match(decision.message,/Planejamento local/);
 assert.deepEqual(decision.project.stages.map(s=>s.agentId),['design','dev','support']);
 assert.equal(decision.project.requestedBy,MANAGER_ID);assert.equal(decision.project.status,'draft');
 assert(decision.project.stages.every(s=>s.status==='pending'&&!s.result));
});
test('greetings and vague requests do not silently dispatch work',()=>{
 for(const request of ['Olá','Bom dia!','Preciso que você me ajude com algo']){const decision=localManagerDecision(request,emptyState());assert(!decision.project);assert(!decision.task);assert(decision.message);}
});
test('manager validates JSON plans against actual specialists',()=>{
 const raw={action:'team',message:'Vou organizar a equipe.',project:{title:'Nova interface',objective:'Criar interface de atendimento',stages:[{agentId:'design',title:'Design',instructions:'Criar especificações'},{agentId:'dev',title:'Código',instructions:'Usar as especificações'}]}};
 const parsed=parseManagerDecision('```json\n'+JSON.stringify(raw)+'\n```',emptyState());assert.equal(parsed.project.stages.length,2);
 raw.project.stages[1].agentId='unknown';assert.throws(()=>parseManagerDecision(JSON.stringify(raw),emptyState()),/inválida/);
 raw.project.stages[1].agentId=MANAGER_ID;assert.throws(()=>parseManagerDecision(JSON.stringify(raw),emptyState()),/inválida/);
 raw.project.stages[1].agentId='design';assert.throws(()=>parseManagerDecision(JSON.stringify(raw),emptyState()),/etapa própria/);
 assert.throws(()=>parseManagerDecision('not json',emptyState()),/plano válido/);
});
test('single specialist requests become individual assignments',()=>{
 const decision=localManagerDecision('Rafael, preciso que o suporte revise a documentação de atendimento.',emptyState());
 assert.equal(decision.task.agentId,'support');assert(!decision.project);
 assert(decision.task.proposal.objective.includes('documentação'));
});
test('manager selects the other room when one is occupied',()=>{
 const state=emptyState();state.collaborations=[{id:'busy',roomId:'aurora',status:'running',stages:[]}];
 const decision=localManagerDecision('Criar um site com designer, desenvolvimento e testes.',state);
 assert.equal(decision.project.roomId,'horizonte');
});
test('clear short requests dispatch without an additional confirmation',()=>{
 const state=emptyState();const decision=localManagerDecision('Crie um site',state);
 assert(!decision.needsClarification);
 const project=managerProjectForDecision(decision,state);
 assert.equal(project.status,'queued');assert.equal(project.autoStart,true);
 state.collaborations=[project];assert.equal(nextAutoDispatch(state).id,project.id);
});
test('a single specialist also goes to a meeting room automatically',()=>{
 const state=emptyState();const decision=localManagerDecision('Rafael, revise a documentação de suporte.',state);
 const project=managerProjectForDecision(decision,state);
 assert.equal(project.stages.length,1);assert.equal(project.stages[0].agentId,'support');
 assert.equal(validateCollaboration(project,state),null);
 assert.equal(project.autoStart,true);
});
test('essential clarification preserves the request and starts after the answer',()=>{
 const state=emptyState();const first=localManagerDecision('Faça isso para mim',state);
 assert.equal(first.needsClarification,true);assert.equal(managerProjectForDecision(first,state),null);
 const history=[{role:'user',content:'Faça isso para mim'},{role:'assistant',content:first.message,managerClarification:{request:'Faça isso para mim'}},{role:'user',content:'Uma página de atendimento ao cliente'}];
 const clarified=localManagerDecision('Uma página de atendimento ao cliente',state,history);
 const project=managerProjectForDecision(clarified,state);
 assert(project&&project.autoStart);assert(project.objective.includes('Faça isso para mim'));assert(project.objective.includes('atendimento ao cliente'));
 assert.equal(clarified.needsClarification,undefined);
});
test('clarification actions do not dispatch or ask for a generic confirmation',()=>{
 const state=emptyState();const decision=parseManagerDecision(JSON.stringify({action:'clarify',questions:['Qual é o arquivo que deve ser revisado?']}),state);
 assert.equal(decision.needsClarification,true);assert.equal(managerProjectForDecision(decision,state),null);
 assert.throws(()=>parseManagerDecision(JSON.stringify({action:'clarify',questions:[]}),state),/dado essencial/);
});
test('answers to a running project question reuse its id and retain completed deliveries',()=>{
 const state=emptyState();const original=managerProjectForDecision(localManagerDecision('Criar um site com design e testes.',state),state);
 original.status='waiting';original.stages[0]={...original.stages[0],status:'completed',result:'Design aprovado'};original.stages[1].status='waiting';state.collaborations=[original];
 const history=[{role:'assistant',content:'Qual é o público?',managerClarification:{request:original.objective,projectId:original.id}}];
 const reply=localManagerDecision('Clientes de pequenas empresas',state,history);
 const resumed=managerProjectForDecision(reply,state);
 assert.equal(resumed.id,original.id);assert.equal(resumed.status,'queued');assert.equal(resumed.stages[0].result,'Design aprovado');assert(resumed.objective.includes('pequenas empresas'));
 const status=localManagerDecision('Qual o andamento?',state,history);assert(!status.resume);
});
test('automatic dispatch waits for busy workers and chooses an available room',()=>{
 const state=emptyState();const queued=managerProjectForDecision(localManagerDecision('Rafael, revise a documentação de suporte.',state),state);
 state.collaborations=[queued,{...queued,id:'occupied',roomId:'aurora',status:'running',stages:[{...queued.stages[0],agentId:'dev'}]}];
 assert.equal(nextAutoDispatch(state,['support']),null);
 assert.equal(nextAutoDispatch(state).roomId,'horizonte');
 state.collaborations.push({...queued,id:'other',roomId:'horizonte',status:'returning',stages:[{...queued.stages[0],agentId:'design'}]});
 assert.equal(nextAutoDispatch(state),null);
 state.collaborations=[{...queued,status:'draft',autoStart:false}];assert.equal(nextAutoDispatch(state),null);
});
test('resolved or cancelled requests do not leak old clarification into new work',()=>{
 const history=[{role:'assistant',content:'Qual entrega?',managerClarification:{request:'Pedido antigo'}},{role:'assistant',content:'Pedido encaminhado',managerResolved:true}];
 assert.equal(managerRequestContext(history,'Pedido novo').request,'Pedido novo');
 assert.equal(localManagerDecision('Cancele esse pedido',emptyState()).clearPending,true);
});
test('AI clarification uses conversation context and returns a resumable decision',async()=>{
 const state=emptyState();const project=managerProjectForDecision(localManagerDecision('Crie um site',state),state);project.status='waiting';state.collaborations=[project];
 const originalFetch=globalThis.fetch;let payload;
 globalThis.fetch=async(_url,options)=>{payload=JSON.parse(options.body);return {ok:true,json:async()=>({content:JSON.stringify({action:'resume',message:'Vou continuar.',projectId:project.id,objective:project.objective+'\nPúblico: clientes'})})};};
 try{const decision=await askManager(state,[{role:'assistant',content:'Qual o público?',managerClarification:{request:project.objective,projectId:project.id}},{role:'user',content:'Clientes'}]);assert.equal(decision.resume.projectId,project.id);assert(payload.messages[0].content.includes(project.id));assert(payload.messages[0].content.includes('Clientes'));}
 finally{globalThis.fetch=originalFetch;}
});
test('generic start confirmations are removed while essential questions are retained',()=>{
 const decision=parseManagerDecision(JSON.stringify({action:'clarify',questions:['Qual é o arquivo a revisar?','Posso iniciar a execução?']}),emptyState());
 assert.equal(decision.message,'Qual é o arquivo a revisar?');assert(decision.needsClarification);
 assert.throws(()=>parseManagerDecision(JSON.stringify({action:'reply',message:'Posso chamar os agentes e iniciar?'}),emptyState()),/não é necessária confirmação/);
});
test('a provider permission question is corrected internally without another user click',async()=>{
 const originalFetch=globalThis.fetch;let calls=0;
 globalThis.fetch=async()=>({ok:true,json:async()=>({content:JSON.stringify(++calls===1?{action:'clarify',questions:['Posso iniciar o trabalho?']}:{action:'task',message:'Vou encaminhar.',task:{agentId:'dev',title:'Revisar código',objective:'Revisar o código fornecido',expected:'Apontar problemas e correções'}})})});
 try{const state=emptyState();const decision=await askManager(state,[{role:'user',content:'Revise o código que enviei.'}]);assert.equal(calls,2);assert.equal(managerProjectForDecision(decision,state).autoStart,true);assert.equal(decision.needsClarification,undefined);}
 finally{globalThis.fetch=originalFetch;}
});
