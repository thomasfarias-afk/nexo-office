import React,{useState} from 'react';
import {ArrowUpRight,MessageSquareText,Sparkles,Users,X} from 'lucide-react';

const examples=['Planejar uma campanha','Revisar meu workspace','Criar uma página'];
export function ManagerHomePrompt({onSend}:{onSend:(message:string)=>void}){
 const [message,setMessage]=useState('');const [open,setOpen]=useState(false);
 if(!open)return <button className="office-manager-launcher" aria-label="Abrir pedido para o Gestor" title="O que você quer que a equipe faça?" onClick={()=>setOpen(true)}><MessageSquareText size={19}/><span>Fazer um pedido</span></button>;
 const submit=(value:string)=>{onSend(value);setOpen(false);};
 return <section className="office-manager-prompt" aria-label="Novo pedido para o Gestor">
  <button className="office-manager-close" aria-label="Fechar" onClick={()=>setOpen(false)}><X size={16}/></button>
  <div className="office-manager-prompt-head"><span className="office-manager-prompt-icon"><Sparkles size={15}/></span><span className="eyebrow">SEU TIME ESTÁ PRONTO</span></div>
  <h1>O que você quer<br/>que a equipe faça?</h1>
  <form onSubmit={event=>{event.preventDefault();if(message.trim())submit(message.trim());}}>
   <input aria-label="O que você quer que a equipe faça?" value={message} onChange={event=>setMessage(event.target.value)} placeholder="Escreva seu objetivo..."/>
   <button className="primary" aria-label="Conversar com Gestor" title="Continuar com Gestor" type="submit"><ArrowUpRight size={17}/></button>
  </form>
  <div className="office-manager-suggestions" aria-label="Sugestões de pedidos">{examples.map(example=><button key={example} onClick={()=>submit(example)}><span>{example==='Planejar uma campanha'?'✳':example==='Revisar meu workspace'?'⌕':'＋'}</span>{example}</button>)}</div>
  <button className="office-manager-all" onClick={()=>submit('')}><Users size={13}/>Conversar e delegar ao Gestor<ArrowUpRight size={13}/></button>
 </section>;
}
