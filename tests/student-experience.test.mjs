import test from 'node:test';
import assert from 'node:assert/strict';
import {caseRail,evidencePanel,caseDesk} from '../public/student-experience.js';
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const fresh=()=>({caseHotel:{},interviews:{hotel:[]},log:[]});
test('Case desk identifies contacts and deliverable without revealing observations or solutions',()=>{
 const html=caseDesk(fresh(),esc);for(const id of ['lucia','marco','elena'])assert.ok(html.includes(`data-contact="${id}"`));
 assert.ok(!/170|190|262|196\.5|69 rooms|54 rooms/.test(html));assert.ok(html.includes('80'));
});
test('Evidence panel shows only gathered hotel replies and escapes student content',()=>{
 const s=fresh();s.log=[{actor:'hotel',kind:'question',detail:'<script>bad</script>',data:{speaker:'Lucia',answer:'At €170, 69 rooms requested.'}},{actor:'winery',kind:'question',detail:'private extension',data:{answer:'Not hotel evidence'}}];
 const html=evidencePanel(s,esc);assert.ok(html.includes('69 rooms'));assert.ok(html.includes('&lt;script&gt;'));assert.ok(!html.includes('<script>'));assert.ok(!html.includes('private extension'));
});
test('Progress follows collected evidence and verified work rather than visits or chat count',()=>{
 const s=fresh();s.interviews.hotel=['price','bookings','other','comparable','full','costs'];s.caseHotel.demand={intercept:262,slope:-4/3};
 const html=caseRail(s,esc);assert.equal((html.match(/class="complete"/g)||[]).length,2);assert.match(html,/class="current" aria-current="step"><span>03/);assert.ok(!html.includes('262'));
});
test('Empty field notes invite interviewing without inventing evidence',()=>{const html=evidencePanel(fresh(),esc);assert.ok(html.includes('Build your evidence'));assert.ok(!/170|190|69|54/.test(html));});
