import {MANAGER_ID,type Agent} from './domain.ts';
export const DESK_SPACING={x:3.6,z:4.3};
const overlaps=(a:{x:number;z:number},b:{x:number;z:number})=>Math.abs(a.x-b.x)<DESK_SPACING.x&&Math.abs(a.z-b.z)<DESK_SPACING.z;
/** Keep valid desks in place; allocate extra rows instead of stacking new agents. */
export function arrangeAgents(agents:Agent[]):Agent[]{
 const placed:Agent[]=[];const positions=new Map<string,{x:number;z:number}>();
 const ordered=[...agents.filter(a=>a.id===MANAGER_ID),...agents.filter(a=>a.id!==MANAGER_ID)];
 for(const agent of ordered){
  let position={x:agent.x,z:agent.z};
  // Repair the old extra-row offset while retaining desks already in the new grid.
  const extraRowValid=position.z<6||Math.abs((position.z-6.5)/4.5-Math.round((position.z-6.5)/4.5))<.001;
  const valid=Number.isFinite(position.x)&&Number.isFinite(position.z)&&position.x>=-6.25&&position.x<=6.25&&position.z>=-2.7&&extraRowValid&&!placed.some(a=>overlaps(position,a));
  if(!valid){let found=false;for(let row=0;!found;row++){const z=row===0?-2.5:row===1?2:6.5+(row-2)*4.5;for(const x of [-5.85,-2,1.85,5.7])if(!placed.some(a=>overlaps({x,z},a))){position={x,z};found=true;break;}}}
  positions.set(agent.id,position);placed.push({...agent,...position});
 }
 return agents.map(a=>{const p=positions.get(a.id)!;return a.x===p.x&&a.z===p.z?a:{...a,...p};});
}
export function officeFootprint(agents:Agent[]){const front=Math.max(6,...agents.map(a=>Number.isFinite(a.z)?a.z+3.1:6));return {front,depth:front+6,centerZ:(front-6)/2,scale:Math.max(1,(front+34)/40)};}
