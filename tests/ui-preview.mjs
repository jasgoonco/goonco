// Explicit loopback-only synthetic UI harness. It never changes the hosted Worker gate.
import http from 'node:http';
import {readFile} from 'node:fs/promises';
const expiredSession=process.argv.includes('--expired-session');
const port=expiredSession?4175:4174;
const source=await readFile(new URL('../dist/server/index.js',import.meta.url),'utf8');
const {fetchApplication}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
http.createServer(async(req,res)=>{
 try{
  if(!['127.0.0.1:'+port,'localhost:'+port].includes(req.headers.host)){res.writeHead(403);res.end('Loopback preview only');return;}
  const structuredQuery=req.method==='POST'&&req.url==='/api/v1/research/query';
  if(!['GET','HEAD'].includes(req.method)&&!structuredQuery){res.writeHead(405);res.end('Read-only UI fixture');return;}
  let body; if(structuredQuery){const parts=[];let bytes=0;for await(const part of req){bytes+=part.length;if(bytes>2048){res.writeHead(413);res.end('Query too large');return;}parts.push(part);}body=Buffer.concat(parts);}
  const result=expiredSession&&req.url.startsWith('/api/')?new Response('{"error":"Review PIN required."}',{status:401,headers:{'content-type':'application/json'}}):await fetchApplication(new Request('http://'+req.headers.host+req.url,{method:req.method,headers:structuredQuery?{origin:req.headers.origin||'','content-type':req.headers['content-type']||''}:{},...(structuredQuery?{body}:{} )}));
  const headers=Object.fromEntries(result.headers);let responseBody=await result.text();
  if(headers['content-type']?.includes('text/html'))responseBody=responseBody.replace('<body>','<body><aside style="padding:8px 18px;background:#eee5ff;color:#513f72;font:12px system-ui">LOCAL UI REVIEW — public metadata and synthetic examples; hosted sign-in and PIN are not exercised here. No patient records.</aside>');
  res.writeHead(result.status,headers);res.end(req.method==='HEAD'?'':responseBody);
 }catch{res.writeHead(500);res.end('Fixture unavailable');}
}).listen(port,'127.0.0.1',()=>console.log('Synthetic UI fixture: http://127.0.0.1:'+port+' — no real health data; hosted authentication unchanged; expired-session scenario: '+expiredSession));
