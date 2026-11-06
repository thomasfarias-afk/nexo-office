import React from 'react';
import {Sparkles} from 'lucide-react';

export function ProviderLogo({provider}:{provider:string}){
 const branded=provider==='codex'||provider==='claude';
 return <span className={`provider-logo provider-logo-${provider}`} aria-hidden="true">{branded?<img src={provider==='codex'?'/codex-logo.png':'/claude-logo.svg'} alt=""/>:<Sparkles size={20}/>}</span>;
}
