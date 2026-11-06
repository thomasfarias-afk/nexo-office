import test from 'node:test';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {AccountUsageService,normalizeCodexUsage,normalizeClaudeUsage,readCodexUsage,readClaudeUsage} from '../runtime/account-usage.ts';

const window={id:'primary',label:'Limite de 5 horas',remainingPercent:59,resetsAt:'2033-05-18T03:33:20.000Z',windowMinutes:300};
const fixture=fileURLToPath(new URL('./fixtures/usage-app-server.mjs',import.meta.url));
test('provider percentages are converted to remaining usage, preserving zero and missing windows',()=>{
 const payload={rateLimits:{primary:{usedPercent:100,windowDurationMins:300,resetsAt:2000000000},secondary:null}};
 assert.equal(normalizeCodexUsage(payload)[0].remainingPercent,0);
 assert.equal(normalizeCodexUsage({rateLimits:{primary:{usedPercent:0,windowDurationMins:300}}})[0].remainingPercent,100);
 assert.deepEqual(normalizeCodexUsage({rateLimits:{primary:{usedPercent:null,windowDurationMins:300}}}),[]);
 assert.deepEqual(normalizeCodexUsage({}),[]);
 assert.deepEqual(normalizeClaudeUsage({five_hour:{utilization:41,resets_at:window.resetsAt},seven_day:null}),[{...window,id:'five_hour'}]);
 assert.equal(normalizeClaudeUsage({seven_day:{utilization:120,resets_at:'bad'}})[0].remainingPercent,0);
 assert.equal(normalizeClaudeUsage({seven_day:{utilization:20,resets_at:'bad'}})[0].resetsAt,null);
 assert.deepEqual(normalizeClaudeUsage({five_hour:{utilization:'41'}}),[]);
});
test('Codex selects its own bucket and respects provider window durations',()=>{
 const result=normalizeCodexUsage({rateLimits:{primary:{usedPercent:99,windowDurationMins:300}},rateLimitsByLimitId:{codex:{primary:{usedPercent:41,windowDurationMins:300,resetsAt:2000000000},secondary:{usedPercent:39,windowDurationMins:10080}},review:{primary:{usedPercent:100,windowDurationMins:10080}}}});
 assert.equal(result[0].remainingPercent,59);assert.equal(result[1].remainingPercent,61);assert.equal(result[1].label,'Limite semanal');
});
test('Codex performs only the metadata handshake and parses fragmented responses',async()=>{
 const result=await readCodexUsage({file:process.execPath,prefix:[fixture,'success']},3000);
 assert.equal(result[0].remainingPercent,59);assert.equal(result[1].remainingPercent,61);
});
test('Codex stops on timeout and hides upstream diagnostic messages',async()=>{
 await assert.rejects(readCodexUsage({file:process.execPath,prefix:[fixture,'timeout']},200),/demorou/);
 await assert.rejects(readCodexUsage({file:process.execPath,prefix:[fixture,'error']},3000),error=>!error.message.includes('secret-upstream-diagnostic'));
});
test('Claude uses account credentials only with the fixed provider origin and returns sanitized quota data',async()=>{
 const windows=await readClaudeUsage({token:'',readCredentials:async()=>JSON.stringify({claudeAiOauth:{accessToken:'fake-test-secret',expiresAt:Date.now()+60000}}),fetch:async(url,init)=>{
  assert.equal(url,'https://api.anthropic.com/api/oauth/usage');assert.equal(init.headers.Authorization,'Bearer fake-test-secret');assert.equal(init.redirect,'error');
  return new Response(JSON.stringify({five_hour:{utilization:41,resets_at:window.resetsAt},seven_day:{utilization:39},credential:'fake-test-secret'}));
 }});
 assert.equal(windows[0].remainingPercent,59);assert.equal(windows[1].remainingPercent,61);assert.ok(!JSON.stringify(windows).includes('fake-test-secret'));
});
test('Claude handles expired login and rate limiting without refreshing or exposing credentials',async()=>{
 let called=false;
 await assert.rejects(readClaudeUsage({token:'',readCredentials:async()=>JSON.stringify({claudeAiOauth:{accessToken:'secret',expiresAt:1}}),fetch:async()=>{called=true;}}),/Renove o login/);
 assert.equal(called,false);
 await assert.rejects(readClaudeUsage({token:'fake',fetch:async()=>new Response('secret upstream message',{status:429})}),/Aguarde alguns minutos/);
});
test('concurrent quota reads coalesce, cache results, and report stale data on later failure',async()=>{
 let count=0,now=2000000000000,fail=false;
 const service=new AccountUsageService({codex:async()=>{count++;if(fail)throw Error('private bearer secret');return [window];},claude:async()=>[]},()=>now);
 const result=await Promise.all([service.read('codex',true),service.read('codex',true)]);assert.equal(count,1);assert.equal(result[0].status,'ready');
 await service.read('codex',true);assert.equal(count,1);
 now+=61000;fail=true;const stale=await service.read('codex',true);assert.equal(stale.stale,true);assert.equal(stale.status,'error');assert.deepEqual(stale.windows,[window]);assert.ok(!JSON.stringify(stale).includes('private bearer secret'));
 const disconnected=await service.read('codex',false);assert.equal(disconnected.status,'disconnected');assert.deepEqual(disconnected.windows,[]);
});
test('missing account data and API-only providers never imply 100% availability',async()=>{
 const service=new AccountUsageService({codex:async()=>[],claude:async()=>[]});
 for(const provider of ['codex','claude','api']){const value=await service.read(provider,true);assert.equal(value.status,'unavailable');assert.deepEqual(value.windows,[]);}
});
test('invalidating a connection prevents an older in-flight read from overwriting its replacement',async()=>{
 let resolveOld,count=0;
 const service=new AccountUsageService({codex:async()=>{count++;if(count===1)return new Promise(resolve=>resolveOld=resolve);return [{...window,remainingPercent:25}];},claude:async()=>[]});
 const old=service.read('codex',true);service.invalidate();await service.read('codex',true);resolveOld([window]);await old;
 assert.equal((await service.read('codex',true)).windows[0].remainingPercent,25);
});
