import test from 'node:test';
import assert from 'node:assert/strict';
import {townScene,meetingScene,restoreInterviewHistory,MEETINGS} from '../public/seated-scenes.js';
import {ROOM_STAFF} from '../public/interior.js';
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
test('Town contains three direct building controls with no avatar or movement control',()=>{const html=townScene();assert.equal((html.match(/data-visit=/g)||[]).length,3);assert.ok(!/canvas|data-move|player/i.test(html));});
test('Every seated meeting exposes each role and workbook directly',()=>{for(const id of Object.keys(MEETINGS)){const html=meetingScene(id,ROOM_STAFF[id],esc);assert.equal((html.match(/data-person=/g)||[]).length,Object.keys(ROOM_STAFF[id]).length);assert.match(html,/Open workbook on the table/);assert.ok(!/170|190|262|69 rooms|54 rooms/.test(html));}});
test('Conversation history is restored chronologically per person from legacy and current notes',()=>{const rows=[{kind:'question',detail:'Latest',data:{speaker:'Lucia',personId:'lucia',answer:'A2'}},{kind:'question',detail:'Marco question',data:{speaker:'Marco',answer:'Other observation'}},{kind:'question',detail:'First',data:{speaker:'Lucia',answer:'A1'}},{kind:'visit',detail:'Entered hotel'}];const h=restoreInterviewHistory(rows,ROOM_STAFF);assert.deepEqual(h.get('lucia').map(r=>r.question),['First','Latest']);assert.equal(h.get('marco').length,1);});
test('Unknown or missing replies do not become conversation evidence',()=>{assert.equal(restoreInterviewHistory([{kind:'question',data:{speaker:'Unknown',answer:'invented'}},{kind:'question',data:{speaker:'Lucia'}}],ROOM_STAFF).size,0);});
