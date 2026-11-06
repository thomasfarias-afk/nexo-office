export type LocalProvider='codex'|'claude';
export type ProviderChoice=LocalProvider|'api';
export interface UsageWindow {id:string;label:string;remainingPercent:number;resetsAt:string|null;windowMinutes:number;}
export interface AccountUsage {provider:ProviderChoice;status:'ready'|'unavailable'|'disconnected'|'error';windows:UsageWindow[];updatedAt:string|null;checkedAt:string;stale?:boolean;message?:string;}
export interface ProviderStatus {id:ProviderChoice;name:string;installed:boolean;authenticated:boolean;ready:boolean;message:string;}
export interface RuntimeStatus {provider:ProviderChoice;workspace:string;providers:ProviderStatus[];configured:boolean;execution:boolean;}
export interface RuntimeEvent {at:string;type:'status'|'message'|'command'|'file'|'error';text:string;}
export interface RuntimeCommand {command:string;exitCode:number|null;output:string;}
export interface RuntimeJob {id:string;kind:'plan'|'execute';title:string;agentId?:string;projectId?:string;stageId?:string;provider:LocalProvider;workspace:string;status:'queued'|'running'|'completed'|'error'|'cancelled';createdAt:string;startedAt?:string;finishedAt?:string;output:string;error?:string;events:RuntimeEvent[];files:string[];commands:RuntimeCommand[];key?:string;}
export interface RuntimeJobRequest {kind:'plan'|'execute';title?:string;prompt:string;instructions?:string;agentId?:string;projectId?:string;stageId?:string;expectedWorkspace?:string;}
