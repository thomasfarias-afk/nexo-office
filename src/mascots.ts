import type {Agent} from './domain';

export type MascotKind='bunny'|'cat'|'owl'|'bear'|'fox';
export const mascotOptions:{kind:MascotKind;name:string}[]=[
 {kind:'bunny',name:'Coelho'}, {kind:'cat',name:'Gato'}, {kind:'owl',name:'Coruja'},
 {kind:'bear',name:'Urso'}, {kind:'fox',name:'Raposa'},
];
const defaults:Record<string,MascotKind>={coord:'bunny',dev:'cat',analyst:'owl',support:'bear',design:'fox'};
export function mascotKind(agent:Pick<Agent,'id'|'mascot'>):MascotKind{
 return mascotOptions.some(m=>m.kind===agent.mascot)?agent.mascot!:defaults[agent.id]||'cat';
}

/** Shared, standalone SVG source: React avatars and downloadable vector assets. */
export function mascotSvg(kind:MascotKind,color:string,prefix='mascot'):string{
 const safeColor=/^#[\da-f]{6}$/i.test(color)?color:'#879f78';
 const id=prefix.replace(/[^a-zA-Z0-9_-]/g,'');
 const ears=kind==='bunny'?`<rect x="48" y="12" width="23" height="57" rx="12" transform="rotate(-12 59 40)"/><rect x="89" y="12" width="23" height="57" rx="12" transform="rotate(12 100 40)"/><path d="M59 25v23m42-23v23" stroke="#fff" stroke-opacity=".32" stroke-width="8" stroke-linecap="round"/>`:
 kind==='cat'||kind==='fox'?`<path d="M35 70 33 27Q34 18 43 24L68 46M92 46l25-22q9-6 10 3l-2 43"/><path d="m43 34 4 22 12-9m42 0 12 9 4-22" fill="#fff" opacity=".38"/>`:
 kind==='bear'?`<circle cx="43" cy="51" r="19"/><circle cx="117" cy="51" r="19"/><circle cx="43" cy="51" r="10" fill="#f7e5d8" opacity=".75"/><circle cx="117" cy="51" r="10" fill="#f7e5d8" opacity=".75"/>`:
 `<path d="m35 68 3-38 29 19m26 0 29-19 3 38"/>`;
 const face=kind==='owl'?`<path d="M80 62C57 40 34 58 38 82c3 18 24 28 42 16 18 12 39 2 42-16 4-24-19-42-42-20Z" fill="#fff3d8"/><path d="m74 89 6 9 6-9" fill="#d6924d"/>`:
 kind==='fox'?`<path d="M36 74q10 7 18 4l26 24 26-24q8 3 18-4c0 27-18 40-44 40S36 101 36 74" fill="#fff2e7"/><path d="m74 93 6 5 6-5q-6-7-12 0" fill="#354b48"/>`:
 `<ellipse cx="80" cy="94" rx="19" ry="14" fill="#fff5e8" opacity=".88"/><path d="M76 88q4-4 8 0l-4 4Z" fill="#3b514b"/>`;
 const accessory=kind==='cat'?`<path d="m57 120-12 8 12 8m46-16 12 8-12 8m-19-20-8 26" fill="none" stroke="#f2fff9" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`:
 kind==='bunny'?`<path d="m80 118 3 7 8 1-6 6 1 8-6-4-6 4 1-8-6-6 8-1Z" fill="#fff2bb"/>`:
 kind==='owl'?`<path d="M70 136v-7m10 7v-14m10 14v-21" stroke="#fff4d3" stroke-width="4" stroke-linecap="round"/>`:
 kind==='bear'?`<path d="M44 78v-4a36 36 0 0 1 72 0v15m-72-8v8m72 0q0 17-25 16" fill="none" stroke="#384f45" stroke-width="5" stroke-linecap="round"/><rect x="37" y="74" width="10" height="19" rx="5" fill="#ebf5d9"/><rect x="113" y="74" width="10" height="19" rx="5" fill="#ebf5d9"/><rect x="84" y="101" width="12" height="6" rx="3" fill="#384f45"/><path d="M74 125h12m-6-6v12" stroke="#f1ffdf" stroke-width="4" stroke-linecap="round"/>`:
 `<path d="m71 135 12-18 8 5-15 15-8 3Z" fill="#ffedbe"/><path d="m83 117 3-5q3-3 6 0t0 6l-1 4Z" fill="#d6bef1"/>`;
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 168" fill="none"><defs><linearGradient id="${id}-shell" x1="34" y1="24" x2="128" y2="139" gradientUnits="userSpaceOnUse"><stop stop-color="#fff"/><stop offset=".18" stop-color="${safeColor}"/><stop offset="1" stop-color="${safeColor}"/></linearGradient><linearGradient id="${id}-shade" x1="58" y1="43" x2="126" y2="139" gradientUnits="userSpaceOnUse"><stop stop-color="#fff" stop-opacity=".12"/><stop offset=".6" stop-color="#142f36" stop-opacity="0"/><stop offset="1" stop-color="#142f36" stop-opacity=".4"/></linearGradient><radialGradient id="${id}-shine" cx="0" cy="0" r="1" gradientTransform="translate(57 58) rotate(57) scale(48 54)" gradientUnits="userSpaceOnUse"><stop stop-color="#fff" stop-opacity=".5"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs><ellipse cx="80" cy="157" rx="43" ry="7" fill="#0b191e" opacity=".18"/><g fill="url(#${id}-shell)" stroke="${safeColor}" stroke-width="1.5" stroke-linejoin="round">${ears}<rect x="47" y="104" width="66" height="43" rx="24"/><ellipse cx="45" cy="127" rx="12" ry="16" transform="rotate(20 45 127)"/><ellipse cx="115" cy="127" rx="12" ry="16" transform="rotate(-20 115 127)"/><ellipse cx="60" cy="146" rx="16" ry="9"/><ellipse cx="100" cy="146" rx="16" ry="9"/><rect x="33" y="44" width="94" height="70" rx="33"/></g><rect x="33" y="44" width="94" height="70" rx="33" fill="url(#${id}-shade)"/><rect x="33" y="44" width="94" height="70" rx="33" fill="url(#${id}-shine)"/>${face}<g fill="#283f42"><ellipse cx="61" cy="78" rx="4.7" ry="6.5"/><ellipse cx="99" cy="78" rx="4.7" ry="6.5"/></g><g fill="#fff"><circle cx="62" cy="76" r="1.8"/><circle cx="100" cy="76" r="1.8"/></g><g fill="#e9a8a2" opacity=".7"><ellipse cx="49" cy="90" rx="7" ry="4"/><ellipse cx="111" cy="90" rx="7" ry="4"/></g><path d="M74 98q6 6 12 0" stroke="#3b514b" stroke-width="2.3" stroke-linecap="round"/>${accessory}<path d="M43 63q3-9 13-10" stroke="#fff" stroke-opacity=".5" stroke-width="3" stroke-linecap="round"/></svg>`;
}
