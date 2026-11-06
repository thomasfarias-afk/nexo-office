import React,{useEffect,useState} from 'react';
import {createPortal} from 'react-dom';
import {LogIn,LogOut,ShieldCheck,UserRound,UserRoundPlus,X} from 'lucide-react';

type LocalAccountRecord={name:string;email:string;salt:string;hash:string};
const ACCOUNT_KEY='nexo-local-account-v1';
const SESSION_KEY='nexo-local-account-active-v1';
const GUIDE_KEY='nexo-local-account-guide-seen-v1';
const toBase64=(bytes:Uint8Array)=>btoa(String.fromCharCode(...bytes));
const fromBase64=(value:string)=>Uint8Array.from(atob(value),char=>char.charCodeAt(0));
async function passwordHash(password:string,salt:Uint8Array){
 const material=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);
 const saltBytes=new Uint8Array(salt);
 const bits=await crypto.subtle.deriveBits({name:'PBKDF2',salt:saltBytes.buffer as ArrayBuffer,iterations:210000,hash:'SHA-256'},material,256);
 return new Uint8Array(bits);
}
function initial(name:string){return name.trim().split(/\s+/).slice(0,2).map(part=>part[0]).join('').toUpperCase()||'N';}

export function LocalAccount(){
 const [record,setRecord]=useState<LocalAccountRecord|null>(null),[active,setActive]=useState(false),[open,setOpen]=useState(()=>{try{return localStorage.getItem(SESSION_KEY)!=='true';}catch{return true;}}),[register,setRegister]=useState(true);
 const [required]=useState(true),[guide,setGuide]=useState(()=>{try{return !localStorage.getItem(ACCOUNT_KEY)&&localStorage.getItem(GUIDE_KEY)!=='true';}catch{return true;}});
 const [name,setName]=useState(''),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[confirm,setConfirm]=useState(''),[error,setError]=useState(''),[success,setSuccess]=useState(''),[busy,setBusy]=useState(false);
 useEffect(()=>{try{const saved=localStorage.getItem(ACCOUNT_KEY);const signedIn=localStorage.getItem(SESSION_KEY)==='true';if(saved){const parsed=JSON.parse(saved) as LocalAccountRecord;setRecord(parsed);setEmail(parsed.email);setName(parsed.name);setRegister(false);setActive(signedIn);if(!signedIn){setGuide(false);setOpen(true);}}else{setRegister(true);setOpen(true);setGuide(localStorage.getItem(GUIDE_KEY)!=='true');}}catch{setError('Não foi possível ler o cadastro local.');setOpen(true);}},[]);
 const close=(force=false)=>{if(required&&!active&&!force)return;setOpen(false);setPassword('');setConfirm('');setError('');};
 async function submit(event:React.FormEvent){event.preventDefault();setError('');
  if(register){if(name.trim().length<2){setError('Informe seu nome.');return;}if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){setError('Informe um e-mail válido.');return;}if(password.length<8){setError('Use uma senha com pelo menos 8 caracteres.');return;}if(password!==confirm){setError('As senhas não coincidem.');return;}}
  else if(!record){setError('Ainda não há uma conta neste navegador. Crie sua conta primeiro.');return;}
  else if(!password){setError('Informe sua senha.');return;}
  setBusy(true);
  try{
   if(register){const salt=crypto.getRandomValues(new Uint8Array(16));const hash=await passwordHash(password,salt);const next={name:name.trim(),email:email.trim().toLowerCase(),salt:toBase64(salt),hash:toBase64(hash)};localStorage.setItem(ACCOUNT_KEY,JSON.stringify(next));localStorage.removeItem(SESSION_KEY);localStorage.setItem(GUIDE_KEY,'true');setRecord(next);setActive(false);setRegister(false);setPassword('');setConfirm('');setSuccess('Conta criada. Entre com seu e-mail e senha para acessar o escritório.');}
   else if(record){const candidate=await passwordHash(password,fromBase64(record.salt));const expected=fromBase64(record.hash);const match=candidate.length===expected.length&&candidate.every((value,index)=>value===expected[index]);if(!match){setError('E-mail ou senha incorretos.');return;}localStorage.setItem(SESSION_KEY,'true');setActive(true);close(true);}
  }catch{setError('Não foi possível salvar o cadastro neste navegador.');}finally{setBusy(false);}
 }
 function signOut(){localStorage.removeItem(SESSION_KEY);setActive(false);setPassword('');setRegister(false);}
 return <>
  <button className="user-circle local-account-button" title={active?`${record?.name} · Minha conta local`:'Criar ou acessar conta local'} aria-label="Minha conta local" onClick={()=>setOpen(true)}>{active&&record?initial(record.name):<UserRound size={16}/>}</button>
  {open&&createPortal(<div className={`local-account-backdrop ${required&&!active?'account-required':''}`} role="presentation" onMouseDown={event=>{if(event.target===event.currentTarget)close();}}><section className="local-account-card" role="dialog" aria-modal="true" aria-labelledby="local-account-title">
   {(!required||active)&&<button className="local-account-dismiss" aria-label="Fechar" onClick={()=>close()}><X size={18}/></button>}
   <span className="local-account-mark"><ShieldCheck size={21}/></span>
    {active&&record?<><span className="eyebrow">CONTA NESTE NAVEGADOR</span><h2 id="local-account-title">Olá, {record.name.split(' ')[0]}.</h2><p>{record.email}</p><div className="local-account-local-note">Seu perfil e sua senha ficam salvos somente neste navegador. Os dados do workspace não são enviados nem sincronizados.</div><button className="local-account-submit" onClick={signOut}><LogOut size={15}/>Sair desta conta</button></>:guide?<><span className="eyebrow">BEM-VINDO AO NEXO OFFICE</span><h2 id="local-account-title">Entre para acessar o escritório</h2><p>Na primeira visita, crie sua conta e faça login. O acesso à equipe e ao workspace só fica disponível depois de entrar.</p><ol className="local-account-guide"><li><span>01</span><div><strong>Crie sua conta</strong><small>Cadastre nome, e-mail e senha neste navegador.</small></div></li><li><span>02</span><div><strong>Entre no Nexo Office</strong><small>Use o e-mail e a senha cadastrados para abrir o escritório.</small></div></li></ol><button className="local-account-submit" onClick={()=>{try{localStorage.setItem(GUIDE_KEY,'true');}catch{}setGuide(false);setRegister(true);setSuccess('');}}>Criar conta e continuar</button><div className="local-account-local-note">Sua conta é local a este navegador. Ela não é sincronizada entre dispositivos.</div></>:<><span className="eyebrow">PERFIL LOCAL</span><h2 id="local-account-title">{register?'Criar sua conta':'Acessar conta local'}</h2><p>{register?'Cadastre seu perfil para identificar o workspace neste dispositivo.':'Entre com a conta cadastrada neste navegador.'}</p>
    <div className="local-account-tabs" role="tablist" aria-label="Acesso à conta">
     <button type="button" role="tab" aria-selected={!register} className={!register?'selected':''} onClick={()=>{setRegister(false);setError('');setPassword('');setConfirm('');}}><LogIn size={14}/>Entrar</button>
     <button type="button" role="tab" aria-selected={register} className={register?'selected':''} onClick={()=>{setRegister(true);setError('');setPassword('');setConfirm('');}}><UserRoundPlus size={14}/>Criar conta</button>
    </div>
    {!record&&!register&&<p className="local-account-first-use">Este navegador ainda não tem uma conta. Escolha <strong>Criar conta</strong> para começar.</p>}
    <form onSubmit={submit}>
     {register&&<label>Nome<input autoComplete="name" value={name} onChange={event=>setName(event.target.value)} placeholder="Seu nome" required/></label>}
     <label>E-mail<input type="email" autoComplete="email" value={email} onChange={event=>setEmail(event.target.value)} placeholder="voce@exemplo.com" required disabled={!register}/></label>
     <label>Senha<input type="password" autoComplete={register?'new-password':'current-password'} value={password} onChange={event=>setPassword(event.target.value)} placeholder={register?'Pelo menos 8 caracteres':'Sua senha'} required minLength={register?8:1}/></label>
     {register&&<label>Confirmar senha<input type="password" autoComplete="new-password" value={confirm} onChange={event=>setConfirm(event.target.value)} placeholder="Digite a senha novamente" required minLength={8}/></label>}
     {success&&<p className="local-account-success" role="status">{success}</p>}{error&&<p className="local-account-error" role="alert">{error}</p>}
     <button className="local-account-submit" disabled={busy||(!register&&!record)}>{busy?'Verificando…':register?'Criar conta local':'Entrar'}</button>
    </form>
    <div className="local-account-local-note">Este cadastro é local: não valida sua identidade online, não recupera senha e não sincroniza entre dispositivos.</div>
   </>}
  </section></div>,document.body)}
 </>;
}
