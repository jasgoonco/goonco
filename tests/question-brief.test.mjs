import test from 'node:test';
import assert from 'node:assert/strict';
import {questionBrief,briefFocus} from '../public/question-brief.js';
import {makeLearningReport,renderLearningReport} from '../public/learning-report.js';
import {planResearchPrompt} from '../public/chat-planner.js';
const data={cancerType:'breast',topic:'general',context:'all',connected:0,sourceCount:3,sources:[]};
test('breast and prostate briefs contain distinct clinical education and no crossed PSA threshold',()=>{const breast=questionBrief(data).cards.map(c=>c[1]).join(' ');assert.match(breast,/ER\/PR/);assert.match(breast,/biopsy/);assert.doesNotMatch(breast,/4.0|leuprolide/);const prostate=questionBrief({...data,cancerType:'prostate'}).cards.map(c=>c[1]).join(' ');assert.match(prostate,/4.0/);assert.match(prostate,/not a universal normal range/);assert.match(prostate,/finasteride/);});
test('specific question focus leads the brief, remains browser-only and accepts common breast misspelling',()=>{assert.equal(briefFocus('breast cancer prevention'),'prevention');assert.match(questionBrief({...data,briefFocus:'prevention'}).cards[0][0],/Prevention/);assert.equal(planResearchPrompt('brest cancer').payload.cancerType,'breast');assert.equal(briefFocus('prostate medication'),'treatment');});
test('concise main answer stays below 550 words and extended record is optional',()=>{for(const cancerType of ['breast','prostate']){const html=renderLearningReport(makeLearningReport({...data,cancerType}));const main=html.split('<details class="panel extended-evidence">')[0];const words=main.replace(/<[^>]*>/g,' ').trim().split(/\s+/).length;assert.ok(words<550,words);assert.match(html,/<details class="panel extended-evidence">/);assert.equal((html.match(/id="download-learning-report"/g)||[]).length,1);assert.match(main,/not a hospital ranking/);assert.match(main,/No diagnosis/);}});
test('unavailable registry is unknown and no empty outcome chart is invented',()=>{const main=renderLearningReport(makeLearningReport(data)).split('<details class="panel extended-evidence">')[0];assert.match(main,/Registry unavailable/);assert.doesNotMatch(main,/0 flag posted results|screening invitation|7.8/);});

// Build-level check: a browser import must resolve as executable JS.
import {readFile} from 'node:fs/promises';
const bundle=await readFile(new URL('../dist/server/index.js',import.meta.url),'utf8');
const {fetchApplication}=await import('data:text/javascript;base64,'+Buffer.from(bundle).toString('base64'));
test('new brief module is included in deployed assets',async()=>{const response=await fetchApplication(new Request('https://test.invalid/question-brief.js'));assert.equal(response.status,200);assert.match(response.headers.get('content-type'),/javascript/);assert.match(await response.text(),/export function questionBrief/);});
