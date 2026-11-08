import {detectResearchTopic,detectCancerType,CANCER_TYPES} from './research-topics.js';
import {localEducation} from './member-workspace.js';
export const researchStarters=['Explain PSA and find related research','Show recruiting trials for localized prostate cancer','Find prostate cancer publications','Show genomic research catalogs','Explain DOE with a simple process example'];
export function planResearchPrompt(prompt,defaults={context:'all',recruiting:false}){
 if(typeof prompt!=='string'||!prompt.trim())return {localOnly:true,message:'Type a research question or choose an example.'};
 if(prompt.length>500)return {localOnly:true,message:'Please keep your question under 500 characters.'};
 const q=prompt.toLowerCase();
 if(/\S+@\S+|\b(?:mrn|date of birth|dob|social security|my psa|my diagnosis|i was diagnosed|i have cancer)\b/.test(q))return {localOnly:true,message:'Please leave out personal or patient information. Ask a general research question instead. Nothing from this question was sent to an API.'};
 if(/\b(?:should i|recommend|dosage|cure me|cure rate for me)\b/.test(q)||(/\b(?:treatment|therapy|drug)\b/.test(q)&&/\b(?:best|works|choose|take|stop)\b/.test(q)))return {localOnly:true,message:'I can help explore public research descriptions, not recommend treatment or predict an individual outcome. Discuss whether, how and when information applies with a qualified professional.'};
 if(/\b(?:completed|terminated|withdrawn) trials\b|\bnot recruiting\b/.test(q))return {localOnly:true,message:'This first query router supports all study statuses or recruiting-only searches. Use the recruitment-status chart to inspect the returned sample; it does not measure treatment success.'};
 const cancers=detectCancerType(q);if(cancers.length>1)return {localOnly:true,message:'Please search one cancer type at a time, or choose All oncology in the filters. No cross-cancer comparison was made.'};
 const cancerType=cancers[0]||defaults.cancerType||'all';
 let topic=detectResearchTopic(q);if(cancers.length===0&&topic==='general'&&defaults.topic&&defaults.topic!=='general'&&!/all connected|all topics|overview/.test(q))topic=defaults.topic;
 const education=cancers.length===0?localEducation(prompt):null;if(education)return education;
 let kind;if(/\b(?:doe|factorial|main effects|interaction plot)\b/.test(q))kind='doe-demo';else if(/\b(?:trial|trials|recruiting|registry)\b/.test(q))kind='trials';else if(/\b(?:pubmed|publication|publications|papers|literature|articles|europe pmc)\b/.test(q))kind='publications';else if(/\b(?:genomic|genomics|gdc|cbioportal|gene|genes)\b/.test(q))kind='genomics';else if(/\b(?:prostate|cancer|research|sources|apis|api|similar|compare|charts|data|overview|oncology|tumor|tumour)\b/.test(q))kind='overview';
 if(!kind&&(topic!=='general'||cancers.length))kind='overview';
 if(!kind)return {localOnly:true,message:'I can search public research APIs, show trial/publication charts, or explain a simple DOE example. Try one of the suggested questions. Choose a cancer type or a supported topic in the filters. This is guided research discovery, not an AI model.'};
 let context=defaults.context||'all';if(/\bnon[- ]?metastatic\b/.test(q))context='all';else if(/\blocali[sz]ed\b/.test(q))context='localized';else if(/\b(?:metastatic|metastasis)\b/.test(q))context='metastatic';
 const recruiting=/\brecruiting\b/.test(q)&&!/\bnot recruiting\b/.test(q)?true:defaults.recruiting===true;
 return {localOnly:false,payload:{kind,context,recruiting,...(topic!=='general'&&kind!=='doe-demo'?{topic}:{}),...(cancerType!=='prostate'&&kind!=='doe-demo'?{cancerType}:{})},description:kind==='doe-demo'?'Synthetic process example; not patient data.':('Live topic research · '+(topic!=='general'?topic+' · ':'')+CANCER_TYPES[cancerType].label+(context==='all'?'':' · '+context+' keyword')+(recruiting?' · recruiting-only registry filter':''))};
}
