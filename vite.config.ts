import {defineConfig} from 'vite';
import {api} from './server.mts';
export default defineConfig({server:{port:5174,strictPort:true},plugins:[{name:'nexo-api',configureServer(server){server.middlewares.use('/api', (req,res)=>{req.url='/api'+req.url;api(req,res);});}}]});
