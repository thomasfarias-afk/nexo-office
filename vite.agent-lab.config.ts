import {defineConfig} from 'vite';
import {fileURLToPath} from 'node:url';
export default defineConfig({server:{host:'127.0.0.1',port:5175,strictPort:true},build:{outDir:'dist-agent-lab',rollupOptions:{input:fileURLToPath(new URL('./agent-lab.html',import.meta.url))}},plugins:[{name:'agent-lab-entry',configureServer(server){server.middlewares.use((req,_res,next)=>{if(req.url==='/'||req.url?.startsWith('/?'))req.url='/agent-lab.html';next();});}}]});
