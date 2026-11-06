import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {buildLocalInvocation,consumeRuntimeEvent,validateRuntimeWorkspace,redactRuntimeText} from '../runtime/local-runtime.ts';
test('Codex planning is read-only and execution uses workspace sandbox without bypass flags',()=>{
 for(const kind of ['plan','execute']){const args=buildLocalInvocation('codex',kind,'C:\\My Project','output.txt');assert.equal(args[args.indexOf('--sandbox')+1],kind==='plan'?'read-only':'workspace-write');assert.ok(args.includes('C:\\My Project'));assert.ok(!args.includes('--dangerously-bypass-approvals-and-sandbox'));assert.ok(args.includes('never'));}
});
test('Claude reuses account login and restricts planning tools',()=>{const plan=buildLocalInvocation('claude','plan','project','output');assert.ok(!plan.includes('--bare'));assert.ok(!plan.includes('--dangerously-skip-permissions'));assert.ok(!plan[plan.indexOf('--tools')+1].includes('Bash'));assert.ok(buildLocalInvocation('claude','execute','project','output').includes('acceptEdits'));});
test('execution evidence includes files, real command exits and public responses, excluding reasoning',()=>{const job={output:'',events:[],commands:[],files:[]};consumeRuntimeEvent(job,{type:'item.completed',item:{type:'reasoning',text:'private'}});consumeRuntimeEvent(job,{type:'item.completed',item:{type:'command_execution',command:'node --test',exit_code:1,aggregated_output:'failed'}});consumeRuntimeEvent(job,{type:'item.completed',item:{type:'file_change',changes:[{path:'app.ts',kind:'update'}]}});consumeRuntimeEvent(job,{type:'item.completed',item:{type:'agent_message',text:'Final response'}});assert.equal(job.commands[0].exitCode,1);assert.deepEqual(job.files,['app.ts']);assert.equal(job.output,'Final response');assert.ok(!JSON.stringify(job).includes('private'));});
test('workspace must exist and must not be a disk root',async()=>{const dir=await mkdtemp(path.join(tmpdir(),'nexo-runtime-'));try{assert.equal((await validateRuntimeWorkspace(dir)).toLowerCase(),dir.toLowerCase());await assert.rejects(validateRuntimeWorkspace(path.parse(dir).root));await assert.rejects(validateRuntimeWorkspace(path.join(dir,'missing')));}finally{await rm(dir,{recursive:true,force:true});}});
const fakeToken=['sk','abcdefghijklmnopqrstuv'].join('-');
test('obvious credentials are redacted in public diagnostics',()=>assert.equal(redactRuntimeText(`token ${fakeToken}`),'token [credencial ocultada]'));
