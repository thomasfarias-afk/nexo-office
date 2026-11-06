import readline from 'node:readline';
const scenario=process.argv[2];let initialized=false;
const send=value=>process.stdout.write(JSON.stringify(value)+'\n');
readline.createInterface({input:process.stdin}).on('line',line=>{
 const message=JSON.parse(line);
 if(message.method==='initialize'){
  if(!message.params.clientInfo.name)process.exit(9);
  if(scenario==='timeout')return;
  send({id:message.id,result:{userAgent:'fixture'}});return;
 }
 if(message.method==='initialized'){initialized=true;return;}
 if(message.method!=='account/rateLimits/read'||!initialized)process.exit(8);
 if(scenario==='error'){send({id:message.id,error:{message:'secret-upstream-diagnostic'}});return;}
 // Deliver a split JSON response to exercise stdio buffering.
 const response=JSON.stringify({id:message.id,result:{rateLimits:{primary:{usedPercent:41,windowDurationMins:300,resetsAt:2000000000},secondary:{usedPercent:39,windowDurationMins:10080,resetsAt:2000100000}}}})+'\n';
 process.stdout.write(response.slice(0,30));setTimeout(()=>process.stdout.write(response.slice(30)),5);
});
