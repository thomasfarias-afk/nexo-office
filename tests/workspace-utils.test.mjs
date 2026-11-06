import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeSearch,isOverdue,searchWorkspace} from '../src/workspace-utils.ts';

const now=new Date(2026,10,5,18);
test('deadlines use the local calendar and exclude terminal tasks',()=>{
 assert.equal(isOverdue({due:'2026-11-04',status:'A fazer'},now),true);
 assert.equal(isOverdue({due:'2026-11-05',status:'A fazer'},now),false);
 assert.equal(isOverdue({due:'2026-11-06',status:'A fazer'},now),false);
 for(const status of ['Concluída','Cancelada'])assert.equal(isOverdue({due:'2026-11-04',status},now),false);
 for(const due of ['', 'invalid'])assert.equal(isOverdue({due,status:'A fazer'},now),false);
});
test('search finds specialties and task objectives without accents',()=>{
 const state={agents:[{id:'a',name:'Sofia',role:'Coordenadora',specialties:'Organização'}],tasks:[{id:'t',agentId:'a',title:'Preparar relatório',objective:'Revisão de orçamento',status:'A fazer'}]};
 assert.equal(normalizeSearch('  ORGANIZAÇÃO '),'organizacao');
 assert.equal(searchWorkspace(state,'organizacao')[0].id,'a');
 assert.equal(searchWorkspace(state,'orcamento')[0].kind,'task');
 assert.match(searchWorkspace(state,'relatorio')[0].detail,/Sofia/);
 assert.equal(searchWorkspace(state,'inexistente').length,0);
 assert.equal(searchWorkspace(state,'').length,2);
});
test('quick search limits results for large workspaces',()=>{
 const state={agents:Array.from({length:30},(_,i)=>({id:String(i),name:'Agente '+i,role:'Suporte',specialties:''})),tasks:[]};
 assert.equal(searchWorkspace(state,'').length,12);
});
