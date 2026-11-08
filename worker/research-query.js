export function summarizeFactorial(data){
 if(data?.synthetic!==true||data.design!=='balanced-2x2-factorial'||data.domain!=='research-process'||!Array.isArray(data.cells)||data.cells.length!==4)throw new Error('A complete synthetic two-factor design is required.');
 const seen=new Set();let n=null;const mean=a=>a.reduce((x,y)=>x+y,0)/a.length;
 const cells=data.cells.map(c=>{const key=c.a+':'+c.b;if(![-1,1].includes(c.a)||![-1,1].includes(c.b)||seen.has(key)||!Array.isArray(c.values)||c.values.length<2||c.values.some(v=>typeof v!=='number'||!Number.isFinite(v)||v<0||v>100))throw new Error('Invalid factorial cell.');seen.add(key);if(n===null)n=c.values.length;if(c.values.length!==n)throw new Error('Balanced replication required.');const m=mean(c.values);return {a:c.a,b:c.b,n:c.values.length,mean:m,sd:Math.sqrt(c.values.reduce((sum,v)=>sum+(v-m)**2,0)/(c.values.length-1))};});
 const get=(a,b)=>cells.find(c=>c.a===a&&c.b===b).mean;
 const aLow=(get(-1,-1)+get(-1,1))/2,aHigh=(get(1,-1)+get(1,1))/2,bLow=(get(-1,-1)+get(1,-1))/2,bHigh=(get(-1,1)+get(1,1))/2;
 const interaction=(get(-1,-1)+get(1,1)-get(1,-1)-get(-1,1))/2;
 return {kind:'doe-demo',synthetic:true,datasetId:data.id,factors:data.factors,responseLabel:data.responseLabel,unit:data.unit,cells,totalRuns:n*4,mainEffects:{a:{low:aLow,high:aHigh,effect:aHigh-aLow},b:{low:bLow,high:bHigh,effect:bHigh-bLow}},interactionEffect:interaction,differenceOfDifferences:2*interaction,interactionLines:[{label:'Second check absent',values:[get(-1,-1),get(1,-1)]},{label:'Second check present',values:[get(-1,1),get(1,1)]}],notice:'Invented research-process teaching example, not patient treatment data or a completed experiment. No significance test or medical conclusion.',method:'Balanced two-level mean contrasts; main effect = high mean minus low mean. Interaction effect = mean at matching coded signs minus mean at opposite signs. Difference of differences = twice interaction effect.',reference:'https://www.itl.nist.gov/div898/handbook/pri/section3/pri3331.htm'};
}
export function validateResearchQuery(input){
 if(!input||typeof input!=='object'||Array.isArray(input))return 'Expected a structured research query.';
 const allowed=new Set(['kind','context','recruiting','topic']);if(Object.keys(input).some(k=>!allowed.has(k)))return 'Only structured search settings are accepted. Do not send a chat transcript, patient information, SQL or an arbitrary URL.';
 if(!['overview','trials','publications','genomics','doe-demo'].includes(input.kind))return 'Choose a supported research view.';
 if(input.topic!==undefined&&!Object.hasOwn(RESEARCH_TOPICS,input.topic))return 'Choose a supported research topic.';
 if(input.context!==undefined&&!['all','localized','metastatic'].includes(input.context))return 'Choose a supported broad keyword context.';
 if(input.recruiting!==undefined&&typeof input.recruiting!=='boolean')return 'Recruitment filter must be true or false.';
 return null;
}
export async function runResearchQuery(input,fetcher=fetch,useCache=true){
 const error=validateResearchQuery(input);if(error)throw new Error(error);
 if(input.kind==='doe-demo')return summarizeFactorial(DOE_DEMO);
 const sets={overview:['pubmed','europepmc','clinicaltrials','gdc','cbioportal'],trials:['clinicaltrials'],publications:['pubmed','europepmc'],genomics:['gdc','cbioportal']};
 const sources=input.kind==='overview'&&input.topic&&input.topic!=='general'?['pubmed','europepmc','clinicaltrials']:sets[input.kind];
 return publicMetadata(sources,input.context||'all',input.recruiting||false,fetcher,useCache,input.topic||'general');
}
async function readResearchBody(request){const reader=request.body?.getReader();if(!reader)throw new Error('Missing query.');let size=0;const chunks=[];try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>2048){await reader.cancel();throw new Error('Query too large.');}chunks.push(value);}}finally{reader.releaseLock();}const all=new Uint8Array(size);let at=0;for(const chunk of chunks){all.set(chunk,at);at+=chunk.byteLength;}return JSON.parse(new TextDecoder().decode(all));}
