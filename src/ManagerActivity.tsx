import React from 'react';
import {type Collaboration,type State} from './domain';
import {ManagerProjectOverview} from './ManagerProjectCard';
export function ManagerActivity(props:{state:State;onProject:(id:string)=>void;onTask:(id:string)=>void;onChat:()=>void;onResume:(project:Collaboration)=>void}){return <ManagerProjectOverview {...props}/>;}
