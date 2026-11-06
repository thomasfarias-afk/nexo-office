import {useId} from 'react';
import {mascotKind,mascotSvg,type MascotKind} from './mascots';
import type {Agent} from './domain';

export function Mascot({agent,kind,className=''}:{agent:Pick<Agent,'id'|'color'|'mascot'>;kind?:MascotKind;className?:string}){
 const id=useId();
 return <span className={`mascot-svg ${className}`} aria-hidden="true" dangerouslySetInnerHTML={{__html:mascotSvg(kind||mascotKind(agent),agent.color,id)}}/>;
}
