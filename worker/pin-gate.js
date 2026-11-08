// Additional owner-review lock. Keep the Sites identity/access boundary in place.
const REVIEW_COOKIE='__Host-goonco_review';
const SESSION_SECONDS=3600;
const attempts=new Map();
const enc=new TextEncoder();
function hex(bytes){return Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');}
async function digest(value){return hex(await crypto.subtle.digest('SHA-256',enc.encode(value)));}
function b64(bytes){return btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
function unb64(value){return Uint8Array.from(atob(value.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));}
async function key(secret){return crypto.subtle.importKey('raw',enc.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign','verify']);}
async function sign(value,secret){return b64(await crypto.subtle.sign('HMAC',await key(secret),enc.encode(value)));}
async function sameHash(a,b){if(!/^[a-f0-9]{64}$/.test(a)||!/^[a-f0-9]{64}$/.test(b))return false;let diff=0;for(let i=0;i<64;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);return diff===0;}
function gateHeaders(extra={}){return {...security,'Content-Security-Policy':security['Content-Security-Policy'].replace("form-action 'none'","form-action 'self'"),'Cache-Control':'no-store',Pragma:'no-cache',...extra};}
function gateJson(error,status,extra={}){return new Response(JSON.stringify({error}),{status,headers:gateHeaders({'Content-Type':'application/json; charset=utf-8',...extra})});}
function cookie(request){const parts=(request.headers.get('cookie')||'').split(';').map(p=>p.trim()).filter(p=>p.startsWith(REVIEW_COOKIE+'='));return parts.length===1?parts[0].slice(REVIEW_COOKIE.length+1):'';}
function configured(env){return /^[a-f0-9]{64}$/.test(env.REVIEW_PIN_HASH||'') && typeof env.REVIEW_SESSION_SECRET==='string' && env.REVIEW_SESSION_SECRET.length>=64;}
function emailReady(env){return !!(env.RESEND_API_KEY&&env.REVIEW_EMAIL_FROM&&env.REVIEW_PIN_RECIPIENT&&/^\S+@\S+\.\S+$/.test(env.REVIEW_PIN_RECIPIENT));}
function lockedPage(message='',emailAvailable=false,status=200){
 const title='GoOnco · Private review';
 const notice=message?`<p class="message" role="alert">${message}</p>`:'';
 const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${title}</title><style>*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f3f6ef;color:#193a31;font:15px/1.6 system-ui,sans-serif;padding:24px}main{background:white;border:1px solid #dce5d6;border-radius:16px;width:430px;max-width:100%;padding:35px}.brand{font-weight:700;font-size:23px}.eyebrow{font-size:10px;letter-spacing:2px;color:#6b8265;margin:25px 0 8px}h1{font-size:29px;line-height:1.2;letter-spacing:-.7px;margin:0 0 14px}p{font-size:12px;color:#64756a}label{display:block;font-size:12px;font-weight:650;margin:20px 0 8px}input{width:100%;font:22px monospace;letter-spacing:3px;padding:13px;border:1px solid #bbcdb4;border-radius:7px}button{font:600 13px system-ui;cursor:pointer;background:#174d40;color:white;border:0;border-radius:7px;width:100%;padding:13px;margin-top:15px}button.secondary{background:#edf2e8;color:#355c43;border:1px solid #dce5d6}input:focus-visible,button:focus-visible{outline:3px solid #9b82c4;outline-offset:3px}.small{font-size:11px;margin-top:20px;border-top:1px solid #e1e8dc;padding-top:15px}.message{background:#fcf1df;padding:12px;border-radius:7px;color:#775d2e}.status{font-size:10px;letter-spacing:.5px;color:#688060}</style></head><body><main><div class="brand">✳ GoOnco</div><div class="eyebrow">INVITED REVIEW · ADDITIONAL LOCK</div><h1>Enter the review PIN.</h1><p>ChatGPT sign-in is required first. Enter your 12-digit PIN to open the MVP for one hour on this signed-in account.</p>${notice}<form action="/review/unlock" method="post"><label for="pin">Review PIN</label><input id="pin" name="pin" type="password" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{12}" minlength="12" maxlength="12" required autofocus aria-describedby="pin-help"><p id="pin-help">Enter 12 digits. Keep the code private; it does not grant professional or patient-data access.</p><button type="submit">Unlock review workspace →</button></form>${emailAvailable?'<form action="/review/request-pin" method="post"><button class="secondary" type="submit">Email a time-limited PIN to the configured inbox</button></form>':'<p class="status">PIN email delivery is awaiting a verified sending service.</p>'}<p class="small">Private product review only. No patient submissions, treatment recommendations or clinical advice. Access expires automatically; locking the workspace clears its review cookie.</p></main></body></html>`;
 return new Response(html,{status,headers:gateHeaders({'Content-Type':'text/html; charset=utf-8'})});
}
export async function createReviewSession(identity,env,origin,now=Date.now()){
 const payload=b64(enc.encode(JSON.stringify({v:1,exp:Math.floor(now/1000)+SESSION_SECONDS,identity:await digest(identity),epoch:env.REVIEW_PIN_HASH})));
 return payload+'.'+await sign(origin+'|'+payload,env.REVIEW_SESSION_SECRET);
}
export async function validReviewSession(token,identity,env,origin,now=Date.now()){
 try{
  if(!token||token.length>1024||!configured(env))return false;
  const parts=token.split('.');if(parts.length!==2)return false;
  const valid=await crypto.subtle.verify('HMAC',await key(env.REVIEW_SESSION_SECRET),unb64(parts[1]),enc.encode(origin+'|'+parts[0]));if(!valid)return false;
  const payload=JSON.parse(new TextDecoder().decode(unb64(parts[0])));
  return payload.v===1&&Number.isInteger(payload.exp)&&payload.exp>Math.floor(now/1000)&&payload.exp<=Math.floor(now/1000)+SESSION_SECONDS&&payload.identity===await digest(identity)&&payload.epoch===env.REVIEW_PIN_HASH;
 }catch{return false;}
}
async function readSmallBody(request){const reader=request.body?.getReader();if(!reader)return '';let bytes=0;const chunks=[];try{for(;;){const {value,done}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>2048){await reader.cancel();throw new Error('oversize');}chunks.push(value);}}finally{reader.releaseLock();}const full=new Uint8Array(bytes);let offset=0;for(const chunk of chunks){full.set(chunk,offset);offset+=chunk.byteLength;}return new TextDecoder().decode(full);}
function expireCookie(){return REVIEW_COOKIE+'=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0';}
export async function reviewGate(request,env,application){
 const url=new URL(request.url);const identity=request.headers.get('oai-authenticated-user-id');
 if(!identity)return gateJson('ChatGPT sign-in is required before the review PIN.',401);
 if(!configured(env))return gateJson('Private review access is awaiting secure configuration.',503);
 const isPost=request.method==='POST';
 if(url.pathname==='/review/unlock'||url.pathname==='/review/request-pin'||url.pathname==='/review/lock'){
  if(!isPost)return gateJson('Method not allowed.',405,{Allow:'POST'});
  if(request.headers.get('origin')!==url.origin)return gateJson('Request origin is not permitted.',403);
  if(url.pathname==='/review/lock')return new Response(null,{status:303,headers:gateHeaders({Location:'/', 'Set-Cookie':expireCookie()})});
  const bucket=await digest(identity+'|'+env.REVIEW_SESSION_SECRET);const now=Date.now();
  for(const [id,state] of attempts)if(state.until<=now)attempts.delete(id);
  const record=attempts.get(bucket)||{count:0,until:now+15*60*1000,emailAfter:0};
  if(record.count>=8)return gateJson('Too many attempts. Try again later.',429,{'Retry-After':String(Math.max(1,Math.ceil((record.until-now)/1000)))});
  if(url.pathname==='/review/request-pin'){
   if(!emailReady(env))return lockedPage('PIN email delivery is not configured. No email was sent.',false,503);
   // Automatic PIN email is deliberately gated until a verified sender is provisioned.
   return lockedPage('Automatic PIN email is awaiting delivery verification. No email was sent.',false,503);
  }
  if(!(request.headers.get('content-type')||'').startsWith('application/x-www-form-urlencoded'))return gateJson('Unsupported request format.',415);
  let text;try{text=await readSmallBody(request);}catch{return gateJson('Request is too large.',413);}
  const params=new URLSearchParams(text);const pin=params.get('pin')||'';
  record.count++;attempts.set(bucket,record);
  const valid=params.getAll('pin').length===1&&/^[0-9]{12}$/.test(pin)&&await sameHash(await digest(pin),env.REVIEW_PIN_HASH);
  if(!valid)return lockedPage('The PIN could not be verified. Please try again.',false,401);
  attempts.delete(bucket);
  const token=await createReviewSession(identity,env,url.origin);
  return new Response(null,{status:303,headers:gateHeaders({Location:'/', 'Set-Cookie':REVIEW_COOKIE+'='+token+'; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age='+SESSION_SECONDS})});
 }
 if(await validReviewSession(cookie(request),identity,env,url.origin))return application(request);
 if(url.pathname.startsWith('/api/')||url.pathname.endsWith('.js')||url.pathname.endsWith('.css'))return gateJson('Review PIN required.',401);
 return lockedPage('',false);
}
