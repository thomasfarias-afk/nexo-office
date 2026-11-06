import React from 'react';

function Inline({text}:{text:string}){
 return <>{text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).map((part,i)=>part.startsWith('`')&&part.endsWith('`')?<code key={i}>{part.slice(1,-1)}</code>:part.startsWith('**')&&part.endsWith('**')?<strong key={i}>{part.slice(2,-2)}</strong>:part)}</>;
}

export function ChatRichText({text}:{text:string}){
 return <>{text.split(/```/g).map((part,i)=>{
  if(i%2){const match=part.match(/^([\w+-]+)\r?\n/);return <div className="chat-code" key={i}><div className="chat-code-heading"><span/>{match?.[1]||'Código'}</div><pre><code>{match?part.slice(match[0].length):part}</code></pre></div>;}
  const blocks:React.ReactNode[]=[];const lines=part.split('\n');
  for(let j=0;j<lines.length;j++){
   const line=lines[j];
   if(!line.trim())continue;
   if(/^#{1,6}\s/.test(line)){blocks.push(<h4 key={j}><Inline text={line.replace(/^#{1,6}\s+/,'')}/></h4>);continue;}
   if(/^\s*([-*]|\d+[.)])\s+/.test(line)){
    const ordered=/^\s*\d+[.)]/.test(line);const start=j;const items:React.ReactNode[]=[];const pattern=ordered?/^\s*\d+[.)]\s+/:/^\s*[-*]\s+/;
    while(j<lines.length&&pattern.test(lines[j])){items.push(<li key={j}><Inline text={lines[j].replace(pattern,'')}/></li>);j++;}
    j--;blocks.push(ordered?<ol key={start}>{items}</ol>:<ul key={start}>{items}</ul>);continue;
   }
   blocks.push(<p key={j}><Inline text={line}/></p>);
  }
  return <div className="prose" key={i}>{blocks}</div>;
 })}</>;
}
