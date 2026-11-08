import http from 'node:http';
import {resolve} from 'node:path';
import {readFile} from 'node:fs/promises';
const root=resolve(import.meta.dirname,'..');
const source=await readFile(resolve(root,'dist/server/index.js'),'utf8');
const {default:worker}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const server=http.createServer(async(req,res)=>{try{const result=await worker.fetch(new Request('http://127.0.0.1:4173'+req.url,{method:req.method}));res.writeHead(result.status,Object.fromEntries(result.headers));res.end(Buffer.from(await result.arrayBuffer()));}catch{res.writeHead(500);res.end('Preview error');}});
server.listen(4173,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:4173'));
