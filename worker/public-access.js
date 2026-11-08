// Public information-only surface. Unknown routes and all real writes fail closed.
const PUBLIC_READ_APIS=new Set(['/api/v1/health','/api/v1/sources','/api/v1/analytics','/api/v1/governance','/api/v1/governance/model','/api/v1/capabilities','/api/v1/demo/effectiveness','/api/v1/demo/outcomes']);
const publicQueries=new Map();let inFlightPublicQueries=0;
export async function publicApplication(request,env,application){
 const url=new URL(request.url),path=url.pathname;
 if(path.startsWith('/review/')||path==='/review'){
  const email=(request.headers.get('oai-authenticated-user-email')||'').toLowerCase();
  const owners=(env.REVIEW_OWNER_EMAILS||'').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean);
  if(!email||!owners.includes(email))return gateJson('Owner review access required.',403);
  return reviewGate(request,env,application);
 }
 const asset=path==='/'?'/index.html':path;
 if(request.method==='GET'||request.method==='HEAD'){
  if(Object.hasOwn(ASSETS,asset)||PUBLIC_READ_APIS.has(path)||path==='/robots.txt')return application(request);
  return response({error:'Public page not found.'},404);
 }
 if(path!=='/api/v1/research/query'||request.method!=='POST')return response({error:'Submissions, uploads, role changes and approvals are not enabled.'},405);
 if(request.headers.get('origin')!==url.origin)return response({error:'Request origin is not permitted.'},403);
 // Supplemental isolate-local limits, not a distributed security guarantee.
 const now=Date.now();for(const [id,b] of publicQueries)if(b.until<=now)publicQueries.delete(id);
 const id=await digest(request.headers.get('cf-connecting-ip')||'unknown-shared-client');
 if(!publicQueries.has(id)&&publicQueries.size>=2000)return response({error:'Research queries are busy. Please try later.'},429,undefined,{'Retry-After':'60'});
 const bucket=publicQueries.get(id)||{count:0,until:now+300000};
 if(bucket.count>=20||inFlightPublicQueries>=4)return response({error:'Research query limit reached. Please try later.'},429,undefined,{'Retry-After':'60'});
 bucket.count++;publicQueries.set(id,bucket);inFlightPublicQueries++;
 try{return await application(request);}finally{inFlightPublicQueries--;}
}
