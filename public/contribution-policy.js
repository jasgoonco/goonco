// Structured local-draft schema. No names, dates, addresses, identifiers, files or free text.
export const contributionFields = Object.freeze({
  contributorRole:{label:'I am contributing as',required:true,options:['Patient','Authorized caregiver','Doctor / clinician']},
  ageBand:{label:'Age group',options:['Prefer not to say','18–39','40–49','50–59','60–69','70–79','80 or older']},
  region:{label:'Broad world region',options:['Prefer not to say','Africa','Asia','Europe','North America','South America','Oceania']},
  race:{label:'Self-described race',options:['Prefer not to say','Asian','Black','White','Indigenous','Mixed / multiple','Not listed']},
  diseaseExtent:{label:'Disease extent, if known',options:['Not known / not shared','Localized','Regional spread','Distant spread']},
  treatment:{label:'Main treatment or monitoring approach',options:['Not known / not shared','Active surveillance / monitoring','Surgery','Radiotherapy','Hormone therapy','Chemotherapy','Several approaches','Other approach']},
  outcome:{label:'Reported experience or outcome',options:['Not known / not assessed','Improvement reported','Stable / no change reported','Worsening or recurrence reported','Side-effect or quality-of-life concerns']},
  followupPeriod:{label:'Time since the reported treatment',options:['Not known / not shared','Still receiving treatment','Under 6 months','6–12 months','1–3 years','Over 3 years']}
});
export const questionTopics = Object.freeze(['No follow-up question','How will my information be reviewed?','Who could access research summaries?','How will small groups be protected?','How can a contribution be corrected or withdrawn?','What does a reported outcome mean?','How can a doctor or university help?']);
export function validateContribution(input){
 const errors=[]; const allowed=new Set([...Object.keys(contributionFields),'adult','authority','localOnly','aggregatePermission','question']);
 if(!input || typeof input!=='object' || Array.isArray(input))return ['Expected a structured contribution.'];
 for(const key of Object.keys(input))if(!allowed.has(key))errors.push('Unexpected field: '+key);
 for(const [key,field] of Object.entries(contributionFields)){
  const value=input[key];if(field.required && !value)errors.push('Choose who is contributing.');
  if(value!==undefined && value!=='' && !field.options.includes(value))errors.push('Choose a listed value for '+field.label+'.');
 }
 if(input.adult!==true)errors.push('This prototype is for adult contributions only.');
 if(input.authority!==true)errors.push('Confirm that you have authority to share this information.');
 if(input.localOnly!==true)errors.push('Confirm that this is a local draft, not a submission.');
 if(input.aggregatePermission!==undefined && typeof input.aggregatePermission!=='boolean')errors.push('Research preference must be yes or no.');
 if(input.question!==undefined && !questionTopics.includes(input.question))errors.push('Choose a listed optional question.');
 return errors;
}
export function makeContributionDraft(input,randomBytes){
 const errors=validateContribution(input);if(errors.length)throw new Error(errors.join(' '));
 if(!(randomBytes instanceof Uint8Array)||randomBytes.length!==16)throw new Error('A fresh random identifier is required.');
 const id=Array.from(randomBytes,x=>x.toString(16).padStart(2,'0')).join('');
 const classification={};for(const [key,field] of Object.entries(contributionFields))if(key!=='contributorRole')classification[key]=input[key]||field.options[0];
 return {project:'GoOnco',schemaVersion:'contribution-draft-0.1',condition:'Prostate cancer',recordId:id,pseudonym:'Contributor-'+id.slice(0,8),identityRequested:false,anonymityGuaranteed:false,submitted:false,reviewStatus:'unreviewed-local-draft',evidenceType:input.contributorRole==='Doctor / clinician'?'clinician-reported-unverified':'patient-or-caregiver-reported-unverified',contributorRole:input.contributorRole,classification,permissions:{currentSharing:'local-device-only',futureReviewedAggregateResearchPreference:input.aggregatePermission===true,publicRowSharing:false,AITraining:false},optionalQuestion:input.question||questionTopics[0],limitations:['Self-selected report; no clinical record verification.','No causal treatment inference, survival estimate or targeted-treatment recommendation.','Demographic combinations may identify someone; qualified privacy review required before collection or sharing.','A random pseudonym reduces name disclosure but does not guarantee anonymity.']};
}
