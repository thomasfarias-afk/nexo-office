import type {RoomId} from './domain';
export interface Point {x:number;z:number;}
export interface MeetingAssignment {agentId:string;projectId:string;roomId:RoomId;seat:number;}
export const MEETING_ROOMS=[{id:'aurora' as const,name:'Sala Aurora',x:15.2,z:-3,accent:'#8fcdd1'},{id:'horizonte' as const,name:'Sala Horizonte',x:15.2,z:3,accent:'#b6a3d3'}];
export function meetingSeat(roomId:RoomId,index:number){
 const room=MEETING_ROOMS.find(r=>r.id===roomId)!;
 const seats=[[-1.4,1.35],[0,1.35],[1.4,1.35],[-1.1,-1.35],[1.1,-1.35]];
 const [x,z]=seats[index%seats.length];
 return {x:room.x+x,z:room.z+z,rotation:z>0?Math.PI:0};
}
export function routeToMeeting(desk:Point,assignment:MeetingAssignment):Point[]{
 const room=MEETING_ROOMS.find(r=>r.id===assignment.roomId)!;
 const seat=meetingSeat(assignment.roomId,assignment.seat);
 const aisle=desk.z>=0?Math.max(4.5,desk.z+2.5):-.05;
 return [{x:desk.x+.9,z:desk.z+1.95},{x:desk.x+.9,z:aisle},{x:9.1,z:aisle},{x:9.1,z:room.z},{x:12.2,z:room.z},{x:12.2,z:seat.z},{x:seat.x,z:seat.z}];
}
export function routeBackToDesk(desk:Point,trail:Point[]):Point[]{return [...trail].reverse().concat([{x:desk.x+.9,z:desk.z+1.95}]);}
