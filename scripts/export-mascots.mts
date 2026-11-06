import {mkdir,writeFile} from 'node:fs/promises';
import {mascotSvg,type MascotKind} from '../src/mascots.ts';
const assets:{name:string;kind:MascotKind;color:string}[]=[
 {name:'sofia-coelho',kind:'bunny',color:'#9b9cbd'},
 {name:'lucas-gato',kind:'cat',color:'#709c9d'},
 {name:'clara-coruja',kind:'owl',color:'#c4a47a'},
 {name:'rafael-urso',kind:'bear',color:'#879f78'},
 {name:'luna-raposa',kind:'fox',color:'#b18d9f'},
];
await mkdir(new URL('../public/mascots/',import.meta.url),{recursive:true});
for(const asset of assets)await writeFile(new URL(`../public/mascots/${asset.name}.svg`,import.meta.url),mascotSvg(asset.kind,asset.color,asset.name));
console.log('5 mascotes SVG exportados para public/mascots.');
