import React,{useEffect,useRef,useState} from 'react';
import {ChevronDown,Clock3,RefreshCw} from 'lucide-react';
import type {AccountUsage,RuntimeStatus,UsageWindow} from './runtime-types';
import {ProviderLogo} from './ProviderLogo';
import {runtimeRequest} from './runtime-client';

export function resetCountdown(resetsAt:string|null,now=Date.now()){
 if(!resetsAt)return 'Renovação não informada';
 const remaining=Date.parse(resetsAt)-now;
 if(!Number.isFinite(remaining))return 'Renovação não informada';
 if(remaining<=0)return 'Aguardando atualização';
 const minutes=Math.ceil(remaining/60000),days=Math.floor(minutes/1440),hours=Math.floor(minutes%1440/60),mins=minutes%60;
 return `Reinicia em ${days?`${days} d ${hours} h`:hours?`${hours} h ${mins} min`:`${mins} min`}`;
}

function UsageMeter({window,now,expired}:{window:UsageWindow;now:number;expired:boolean}){
 const value=Math.round(window.remainingPercent);const tone=value<=10?'critical':value<=30?'low':'normal';
 return <div className="usage-meter" data-tone={tone} data-expired={expired}>
  <div className="usage-meter-heading"><span>{window.label}</span><strong>{expired?'—':`${value}%`}<small> restante</small></strong></div>
  {expired?<div className="usage-track usage-track-unknown"/>:<div className="usage-track" role="progressbar" aria-label={`${window.label}: disponível`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={value}><span style={{width:`${window.remainingPercent}%`}}/></div>}
  <span className="usage-renews">{resetCountdown(window.resetsAt,now)}</span>
 </div>;
}

export function AccountUsageIndicator({runtime}:{runtime:RuntimeStatus|null}){
 const [usage,setUsage]=useState<AccountUsage|null>(null),[busy,setBusy]=useState(false),[now,setNow]=useState(Date.now());
 const refreshRef=useRef<()=>void>(()=>{});
 useEffect(()=>{
  let active=true,inFlight=false;
  setUsage(null);
  const refresh=async()=>{
   if(!active||!runtime||inFlight||document.hidden)return;
   inFlight=true;setBusy(true);
   try{const value:AccountUsage=await runtimeRequest('/usage');if(active&&value.provider===runtime.provider)setUsage(value);}
   catch{if(active)setUsage(previous=>previous?{...previous,status:'error',stale:true,message:'Não foi possível atualizar os limites agora.'}:{provider:runtime.provider,status:'error',windows:[],updatedAt:null,checkedAt:new Date().toISOString(),message:'Não foi possível consultar os limites agora.'});}
   finally{inFlight=false;if(active)setBusy(false);}
  };
  refreshRef.current=()=>{void refresh();};void refresh();
  const timer=setInterval(()=>{setNow(Date.now());void refresh();},60000);
  const visible=()=>{if(!document.hidden){setNow(Date.now());void refresh();}};
  document.addEventListener('visibilitychange',visible);
  return()=>{active=false;clearInterval(timer);document.removeEventListener('visibilitychange',visible);};
 },[runtime?.provider,runtime?.configured]);
 const provider=runtime?.provider==='claude'?'Claude':runtime?.provider==='codex'?'Codex':'IA';
 const windows=usage?.windows||[];
 const unavailable=usage?.message||(!runtime||busy?'Consultando limites…':'Conecte sua conta para ver os limites.');
 return <details className="account-usage" data-state={usage?.status||'loading'} data-stale={usage?.stale||undefined} onKeyDown={e=>{if(e.key==='Escape')e.currentTarget.open=false;}}>
  <summary aria-label={`Limites de uso ${provider}`} title={usage?.stale?'Última leitura. Abra para ver o status.':`Limites da conta ${provider}`}>
   <span className="usage-provider"><ProviderLogo provider={runtime?.provider||'api'}/><span>{provider}<small>{usage?.stale?'Última leitura':'Uso da conta'}</small></span></span>
   <span className="usage-summary-status"><i className={runtime?.configured?'':'disconnected'}/>{runtime?.configured?'IA disponível':'Conectar IA'}</span>
   <ChevronDown size={12} className="usage-chevron"/>
  </summary>
  <section className="usage-popover" aria-label="Disponibilidade da conta de IA">
   <header><div><span className="eyebrow">DISPONIBILIDADE DA SUA IA</span><h3>Mais espaço para criar.</h3></div><ProviderLogo provider={runtime?.provider||'api'}/></header>
   {windows.length?<><p>Limites de uso da conta {provider}.</p><div className="usage-windows">{windows.map(w=><UsageMeter key={w.id} window={w} now={now} expired={!!w.resetsAt&&Date.parse(w.resetsAt)<=now}/>)}</div>{usage?.stale&&<p className="usage-warning" role="status">Última leitura disponível. {usage.message}</p>}</>:<p className="usage-unavailable" role="status">{unavailable}</p>}
   <footer><span><Clock3 size={12}/>{usage?.updatedAt?`Atualizado às ${new Date(usage.updatedAt).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}`:'Atualização automática'}</span><button type="button" disabled={busy} onClick={()=>refreshRef.current()} title="Atualizar limites"><RefreshCw size={13} className={busy?'spin':''}/>{busy?'Consultando':'Atualizar'}</button></footer>
   <small className="usage-explanation">O plano informa percentuais de uso, sem um saldo fixo de tokens.</small>
  </section>
 </details>;
}
