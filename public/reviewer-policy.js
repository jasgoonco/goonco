export const reviewerRoles=Object.freeze({
 'Clinical / scientific reviewer':'Review contribution wording and scientific/source approval criteria.',
 'Data / licensing steward':'Review provenance, permitted uses, licensing restrictions and dataset-specific approval requirements.',
 'Privacy / security reviewer':'Review identity/disclosure risks and conditions before live intake.',
 'Statistical reviewer':'Review endpoints, missingness, bias and comparison limitations.',
 'Technical maintainer':'Review reproducibility, access controls, tests and release operations.',
 'Patient / caregiver perspective':'Review clarity, burden and understanding using synthetic examples.'
});
const confirmations=['evidenceChecked','scopeRecorded','conflictsRecorded','independenceRecorded'];
export function assessReviewerDraft(input,now=new Date()){
 const blockers=[];const role=input?.role;
 const allowed=new Set(['role','candidateRef','assessorRef','evidenceUrl','reviewUntil','conflict',...confirmations]);
 if(!input||typeof input!=='object'||Array.isArray(input))return {synthetic:true,status:'blocked',blockers:['Provide a structured dummy record.'],roleApproved:false,accessGranted:false};
 for(const field of Object.keys(input))if(!allowed.has(field))blockers.push('Unexpected field: '+field);
 if(!Object.hasOwn(reviewerRoles,role||''))blockers.push('Select a listed reviewer role.');
 for(const field of ['candidateRef','assessorRef'])if(!/^[a-z][a-z0-9-]{2,31}$/.test(input[field]||''))blockers.push('Use a short internal reference for '+field+'; no names or contact details.');
 if(input.candidateRef&&input.candidateRef===input.assessorRef)blockers.push('A candidate cannot assess their own appointment.');
 let validEvidence=false;try{const url=new URL(input.evidenceUrl);validEvidence=url.protocol==='https:'&&!url.username&&!url.password&&!url.search&&!url.hash&&url.hostname.includes('.')&&!['localhost','127.0.0.1'].includes(url.hostname);}catch{}
 if(!validEvidence)blockers.push('Record a public HTTPS evidence reference without credentials or tokens.');
 const date=input.reviewUntil;let validDate=false;try{validDate=/^\d{4}-\d{2}-\d{2}$/.test(date||'')&&new Date(date+'T23:59:59Z').toISOString().slice(0,10)===date&&new Date(date+'T23:59:59Z')>now;}catch{}
 if(!validDate)blockers.push('Choose a valid future review-expiry date.');
 if(input.conflict!=='No conflict declared')blockers.push(input.conflict==='Conflict declared'?'A declared conflict requires recusal or an independent replacement.':'Record the conflict-of-interest assessment.');
 for(const field of confirmations)if(input[field]!==true)blockers.push({evidenceChecked:'Evidence-check record is missing.',scopeRecorded:'Bounded task/scope record is missing.',conflictsRecorded:'Conflict-declaration record is missing.',independenceRecorded:'Independent qualified review record is missing.'}[field]);
 return {synthetic:true,status:blockers.length?'blocked':'ready-for-simulated-independent-decision',blockers,roleApproved:false,accessGranted:false,sourceApproved:false,scope:reviewerRoles[role]||null,notice:'This local exercise checks completeness only; it cannot verify credentials, appoint people or grant access.'};
}
export function dummyReviewer(scenario='complete',now=new Date()){
 const expiry=new Date(now);expiry.setUTCDate(expiry.getUTCDate()+30);
 const item={role:'Clinical / scientific reviewer',candidateRef:'dummy-reviewer-a',assessorRef:'dummy-assessor-b',evidenceUrl:'https://example.org/dummy-reviewer',reviewUntil:expiry.toISOString().slice(0,10),conflict:'No conflict declared',evidenceChecked:true,scopeRecorded:true,conflictsRecorded:true,independenceRecorded:true};
 if(scenario==='self-review')item.assessorRef=item.candidateRef;
 if(scenario==='conflict')item.conflict='Conflict declared';
 if(scenario==='expired'){const d=new Date(now);d.setUTCDate(d.getUTCDate()-1);item.reviewUntil=d.toISOString().slice(0,10);}
 if(scenario==='missing-evidence'){item.evidenceUrl='';item.evidenceChecked=false;}
 return item;
}
export function makeReviewerPacket(input,now=new Date()){
 const result=assessReviewerDraft(input,now);if(result.status==='blocked')throw new Error('Resolve blockers before generating a dummy review packet.');
 const record={};for(const key of ['role','candidateRef','assessorRef','evidenceUrl','reviewUntil','conflict',...confirmations])record[key]=input[key];
 return {project:'GoOnco',schemaVersion:'reviewer-dummy-packet-0.1',synthetic:true,submitted:false,record,assessment:result,simulatedStages:['Dummy candidate recorded','Evidence-reference completeness checked; credential authenticity not verified','Conflict/independence/expiry gates passed','Bounded task proposed','Independent appointment decision remains required'],roleApproved:false,accessGranted:false,sourceApproved:false,liveAssignmentsChanged:false};
}
