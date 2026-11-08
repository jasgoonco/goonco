import {publicMetadata} from '../worker/public-connectors.js';
import {writeFile} from 'node:fs/promises';
const data=await publicMetadata(['pubmed','europepmc','clinicaltrials','gdc','cbioportal'],'all',false,fetch,false);
const report={checkedAt:new Date().toISOString(),scope:'Public descriptions only; no patient rows or approved scientific claims',sources:data.sources.map(s=>({id:s.id,status:s.status,total:s.total,unit:s.unit,sampleSize:s.sampleSize,retrievedAt:s.retrievedAt,error:s.error||null})),connected:data.connected,requested:data.sourceCount};
if(process.argv[2])await writeFile(process.argv[2],JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
