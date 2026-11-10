import {CANCER_TYPES} from './research-topics.js';
export const simpleFields=Object.freeze({
 cancerType:{label:'Cancer type',options:['Not known / not shared',...Object.entries(CANCER_TYPES).filter(([k])=>k!=='all').map(([,v])=>v.label),'Other cancer']},
 diagnosisStatus:{label:'Has the diagnosis been confirmed?',options:['Not known / not shared','Confirmed by a clinician','Tests / assessment still in progress']},
 diseaseExtent:{label:'Where is the cancer, if known?',options:['Not known / not shared','In the original organ / site','Spread nearby','Spread to distant parts']},
 treatment:{label:'Main treatment or monitoring',options:['Not known / not shared','Monitoring / active surveillance','Surgery','Radiation therapy','Hormone therapy','Chemotherapy','Immunotherapy','Targeted therapy','Several treatments','Supportive / palliative care','Other approach','No treatment yet']},
 outcome:{label:'What has been reported?',options:['Not known / not assessed','Improvement reported','Stable / no change reported','Worsening / recurrence reported','Side effects / quality-of-life concerns']},
 followupPeriod:{label:'How long after treatment?',options:['Not known / not shared','Still receiving treatment','Under 6 months','6–12 months','1–3 years','Over 3 years','Not applicable']},
 ageBand:{label:'Age group (adult only)',options:['Not known / not shared','18–39','40–59','60–79','80 or older']},
 region:{label:'Broad world region',options:['Not known / not shared','Africa','Asia','Europe','North America','South America','Oceania']},
 evidenceBasis:{label:'Basis for this professional report',options:['Not known / not shared','Clinical information reviewed in an authorized setting','Contributor recollection','Published information only']}
});
export const roles={patient:['Patient','Authorized caregiver'],professional:['Doctor / clinician','Other health professional','Researcher / student']};
const exactKeys=(x,keys)=>x&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).every(k=>keys.includes(k));
export function validateSimpleInput(input){
 const fields=Object.keys(simpleFields);if(!exactKeys(input,['formType','role',...fields,'adult','authority','localOnly','futureResearch','futureContact']))throw Error('Use only the listed classification fields. Names, contact details, notes and files are not accepted.');
 if(!Object.hasOwn(roles,input.formType)||!roles[input.formType].includes(input.role))throw Error('Choose a valid contributor role. Professional authority is not verified.');
 for(const [key,f] of Object.entries(simpleFields))if(input[key]!==undefined&&!f.options.includes(input[key]))throw Error('Choose a listed value for '+f.label+'.');
 if(!input.cancerType)throw Error('Choose a cancer type, or Not known / not shared.');
 if(input.formType==='patient'&&input.evidenceBasis!==undefined&&input.evidenceBasis!==simpleFields.evidenceBasis.options[0])throw Error('Professional evidence fields do not apply to a patient form.');
 for(const k of ['adult','authority','localOnly'])if(input[k]!==true)throw Error('Confirm adult status, authority and the local-only boundary.');
 for(const k of ['futureResearch','futureContact'])if(input[k]!==undefined&&typeof input[k]!=='boolean')throw Error('Optional preferences must be true or false.');
 return true;
}
export function normalizeSimpleInput(input){validateSimpleInput(input);return {formType:input.formType,role:input.role,...Object.fromEntries(Object.entries(simpleFields).map(([k,f])=>[k,input[k]||f.options[0]])),adult:true,authority:true,localOnly:true,futureResearch:input.futureResearch===true,futureContact:input.futureContact===true};}
export function makeLocalRecord(input,bytes){const values=normalizeSimpleInput(input);if(!(bytes instanceof Uint8Array)||bytes.length!==16)throw Error('A fresh random label is required.');const recordId=Array.from(bytes,x=>x.toString(16).padStart(2,'0')).join('');return {recordId,pseudonym:'Member-'+recordId.slice(0,8),revisions:[values]};}
export function currentValues(record){return record.revisions.at(-1);}
export function reviseLocalRecord(record,input){if(record.revisions.length>=10)throw Error('This local record has reached its ten-revision limit. Save your workspace before starting another draft.');return {...record,revisions:[...record.revisions,normalizeSimpleInput(input)]};}
export function workspaceExport(records){return {project:'GoOnco',schema:'goonco-local-classifications-v1',submitted:false,sharing:'local-device-only',reviewStatus:'unverified',anonymityGuaranteed:false,contactEnabled:false,researchAccessEnabled:false,AITraining:false,records};}
export function readLocalWorkspace(value){
 if(!exactKeys(value,['project','schema','submitted','sharing','reviewStatus','anonymityGuaranteed','contactEnabled','researchAccessEnabled','AITraining','records'])||value.project!=='GoOnco'||value.schema!=='goonco-local-classifications-v1'||value.submitted!==false||value.sharing!=='local-device-only'||value.reviewStatus!=='unverified'||value.anonymityGuaranteed!==false||value.contactEnabled!==false||value.researchAccessEnabled!==false||value.AITraining!==false||!Array.isArray(value.records)||value.records.length>100)throw Error('Open an unmodified GoOnco local workspace file (up to 100 records). It is not a generic medical-file importer.');
 const ids=new Set();return value.records.map(record=>{if(!exactKeys(record,['recordId','pseudonym','revisions'])||!(/^[a-f0-9]{32}$/).test(record.recordId)||record.pseudonym!=='Member-'+record.recordId.slice(0,8)||!Array.isArray(record.revisions)||!record.revisions.length||record.revisions.length>10||ids.has(record.recordId))throw Error('Invalid or duplicate local record label. No records were imported.');ids.add(record.recordId);return {recordId:record.recordId,pseudonym:record.pseudonym,revisions:record.revisions.map(normalizeSimpleInput)};});
}
export function localQuality(records){const seen=new Set();let repeated=0,unknown=0;for(const record of records){const row=currentValues(record);const key=JSON.stringify(Object.keys(simpleFields).map(k=>row[k]));if(seen.has(key))repeated++;seen.add(key);if(['cancerType','diagnosisStatus','diseaseExtent','treatment','outcome','followupPeriod'].some(k=>row[k].startsWith('Not known')))unknown++;}return {total:records.length,unknown,repeated,patient:records.filter(r=>currentValues(r).formType==='patient').length,professional:records.filter(r=>currentValues(r).formType==='professional').length};}
export function localCounts(records,key){if(!['cancerType','treatment','outcome','followupPeriod'].includes(key))throw Error('Unsupported local chart.');const counts=new Map();for(const r of records){const label=currentValues(r)[key];counts.set(label,(counts.get(label)||0)+1);}return [...counts].map(([label,value])=>({label,value}));}

export function localAnalysisCSV(records){const safe=readLocalWorkspace(workspaceExport(records));const columns=['pseudonym','role',...Object.keys(simpleFields),'reviewStatus'];const quote=v=>'"'+String(v).replace(/"/g,'""')+'"';return [columns,...safe.map(r=>{const row=currentValues(r);return [r.pseudonym,row.role,...Object.keys(simpleFields).map(k=>row[k]),'unverified-local'];})].map(row=>row.map(quote).join(',')).join('\r\n')+'\r\n';}
