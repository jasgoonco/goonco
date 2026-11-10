// API-first review MVP. Hosted access is enforced by Sites owner-private policy.
// No visitor headers are accepted as application reviewer authority. No writes or ingestion.
const ASSETS = __ASSETS__;
const SOURCES = __SOURCES__;
const GOVERNANCE = __GOVERNANCE__;
const DEMO_OUTCOMES = __DEMO_OUTCOMES__;
const DOE_DEMO=__DOE_DEMO__;
__RESEARCH_TOPICS__
__PUBLIC_CONNECTORS__
__RESEARCH_QUERY__
export const VERSION = '0.12.0';
export function summarize(sources) {
  const categories = {};
  for (const source of sources) categories[source.category] = (categories[source.category] || 0) + 1;
  return {catalogVersion:'2026-11-07',total:sources.length,approved:sources.filter(s=>s.approval==='approved').length,candidates:sources.filter(s=>s.approval==='candidate').length,categories,unit:'source catalog entries',clinicalOutcomeData:false};
}
export function assessAccess(source, dataset = {}) {
  const reasons=[];
  if (!source || source.approval !== 'approved') reasons.push('Source approval required');
  if (dataset.approval !== 'approved') reasons.push('Dataset approval required');
  if (dataset.licenseReviewed !== true) reasons.push('License and permitted-use review required');
  if (dataset.scientificReviewed !== true) reasons.push('Scientific review required');
  if (dataset.revoked === true) reasons.push('Dataset is revoked');
  if (!dataset.expiresAt || !Number.isFinite(Date.parse(dataset.expiresAt)) || Date.parse(dataset.expiresAt) <= Date.now()) reasons.push('Active approval expiry required');
  return {allowed:reasons.length===0,reasons};
}
export function evaluateEffectiveness(remaining, windowComplete, reviewComplete) {
  if (!Number.isInteger(remaining) || remaining<0 || remaining>20) throw new Error('Remaining must be an integer from 0 to 20.');
  const effective=remaining===0 && windowComplete===true && reviewComplete===true;
  return {synthetic:true,effective,knowledgeApproved:false,message:effective?'Demo target met and verification conditions selected. A real action still requires authorized review; no knowledge update is approved.':remaining>0?'Target not met. Reopen or continue the corrective action in this synthetic example.':'Target met, but the observation window and independent verification must both be complete. No closure.'};
}
const security = {
  'X-Content-Type-Options':'nosniff',
  'Referrer-Policy':'no-referrer',
  'Permissions-Policy':'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; font-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
  'X-Frame-Options':'DENY',
  'Cache-Control':'no-store',
  'Strict-Transport-Security':'max-age=31536000',
};
function response(body,status=200,type='application/json; charset=utf-8',extra={}) {
  return new Response(type.startsWith('application/json') ? JSON.stringify(body) : body,{status,headers:{...security,'Content-Type':type,...extra}});
}
function filterCatalog(url) {
  const query=(url.searchParams.get('q') || '').trim().toLowerCase();
  const category=url.searchParams.get('category') || '';
  return SOURCES.filter(s=>(!category || s.category===category) && (!query || [s.name,s.description,s.category,s.kind].join(' ').toLowerCase().includes(query)));
}
export function demoOutcomes(extent,followup){
 const validExtents=['Localized','Regional spread'];const validFollowups=['6–12 months','1–3 years'];
 if(!validExtents.includes(extent)||!validFollowups.includes(followup))throw new Error('Choose a listed demonstration context.');
 return {...DEMO_OUTCOMES,groups:DEMO_OUTCOMES.groups.filter(g=>g.extent===extent&&g.followup===followup).map(g=>({...g,total:g.counts.reduce((a,b)=>a+b,0)})),clinicalInference:false,realPatientData:false};
}
async function handle(request) {
  const url=new URL(request.url);
  if (url.pathname.startsWith('/api/')) {
    if(url.pathname==='/api/v1/research/query'){
      if(request.method!=='POST')return response({error:'Use a structured POST query.'},405,undefined,{Allow:'POST'});
      if(request.headers.get('origin')!==url.origin)return response({error:'Request origin is not permitted.'},403);
      if(!(request.headers.get('content-type')||'').startsWith('application/json'))return response({error:'Use JSON query settings.'},415);
      let input;try{input=await readResearchBody(request);}catch{return response({error:'Invalid or oversized query.'},400);}
      const problem=validateResearchQuery(input);if(problem)return response({error:problem},400);
      return response(await runResearchQuery(input));
    }
    if (!['GET','HEAD'].includes(request.method)) return response({error:'Read-only review MVP. Submissions, approvals, ingestion and uploads are not enabled.'},405,undefined,{Allow:'GET, HEAD'});
    if ((url.searchParams.get('q') || '').length>200) return response({error:'Search is limited to 200 characters.'},400);
    if(url.pathname==='/api/v1/demo/effectiveness') {
      const raw=url.searchParams.get('remaining');
      if(raw===null || !/^\d+$/.test(raw)) return response({error:'Remaining must be an integer from 0 to 20.'},400);
      try{return response(evaluateEffectiveness(Number(raw),url.searchParams.get('window')==='true',url.searchParams.get('review')==='true'));}catch(error){return response({error:error.message},400);}
    }
    if(url.pathname==='/api/v1/demo/outcomes') {
      try{return response(demoOutcomes(url.searchParams.get('extent')||'Localized',url.searchParams.get('followup')||'6–12 months'));}catch(error){return response({error:error.message},400);}
    }
    if(url.pathname==='/api/v1/health') return response({status:'ok',version:VERSION,mode:'information-only-alpha',persistence:false,ingestion:false,patientData:false});
    if(url.pathname==='/api/v1/sources') return response({items:filterCatalog(url),notice:'Candidate catalog only. No source or dataset is approved for ingestion.'});
    if(url.pathname==='/api/v1/analytics') return response(summarize(filterCatalog(url)));
    if(url.pathname==='/api/v1/governance/model') return response(GOVERNANCE);
    if(url.pathname==='/api/v1/governance') return response({policy:'Curated Scientific Sources with Explicit Review',sources:SOURCES.map(s=>({id:s.id,...assessAccess(s)})),writesEnabled:false});
    if(url.pathname==='/api/v1/capabilities') return response({version:VERSION,available:['candidate-source-catalog','catalog-analytics','local-application-drafts','local-feedback-drafts','synthetic-quality-exercise','structured-contribution-local-draft','optional-question-local-draft','synthetic-reported-outcome-visualization','dummy-reviewer-readiness-packets','public-metadata-connectors','guided-research-chat','synthetic-doe-charts'],unavailable:['patient-upload','live-ingestion','reviewer-approval','clinical-statistics','federated-execution','AI-recommendations','donations','invitation-delivery','shared-health-submissions','pseudonymous-messaging'],authentication:'Public browsing when explicitly enabled; owner review remains restricted; member accounts and application roles not implemented'});
    return response({error:'Endpoint not found'},404);
  }
  if (!['GET','HEAD'].includes(request.method)) return response({error:'Method not allowed'},405,undefined,{Allow:'GET, HEAD'});
  if(url.pathname==='/robots.txt') return response('User-agent: *\nDisallow: /\n',200,'text/plain; charset=utf-8');
  const asset=ASSETS[url.pathname==='/'?'/index.html':url.pathname];
  if(!asset) return response({error:'Page not found'},404);
  return new Response(request.method==='HEAD'?null:asset.body,{headers:{...security,'Content-Type':asset.type}});
}
export async function fetchApplication(request) {const result=await handle(request);return request.method==='HEAD'?new Response(null,{status:result.status,headers:result.headers}):result;}
__PIN_GATE__
__PUBLIC_ACCESS__
export default {async fetch(request,env={}) {const result=await (env.PUBLIC_BROWSING==='true'?publicApplication(request,env,fetchApplication):reviewGate(request,env,fetchApplication));return request.method==='HEAD'?new Response(null,{status:result.status,headers:result.headers}):result;}};
