import './no-paid-calls.mjs';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,...(process.platform==='darwin'?{executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}:{})});
const url=process.env.GAME_URL||'http://127.0.0.1:8188/';
await mkdir('test-artifacts',{recursive:true});
try{for(const width of [1280,390]){
 const ctx=await browser.newContext({viewport:{width,height:width===390?844:900},reducedMotion:'reduce'}),page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 // Deployed smoke verification also intercepts every actor request: this suite never spends API credit.
 if(process.env.MOCK_HOSTED==='1')await page.route('**/api/actor',async route=>{const b=route.request().postDataJSON();const {answerFreeQuestion}=await import('../public/free-agents.js');await route.fulfill({contentType:'application/json',body:JSON.stringify({...answerFreeQuestion(b.personId,b.question),source:'mock'})});});
 await page.goto(url);await page.locator('.entry-start').click();assert.equal(await page.locator('canvas,[data-move]').count(),0);
 await page.screenshot({path:`test-artifacts/seated-town-${width}.png`,fullPage:true});
 await page.locator('.tabs [data-action="workspace"]').click();await page.locator('.mini-tool-links [data-action="dialogue"]').click();await page.locator('#free-question-input').waitFor();assert.equal(await page.locator('.person-hotspot').count(),3);await page.keyboard.press('Escape');await page.locator('.back-to-town').click();
 await page.locator('.building-hotspot.hotel').click();await page.waitForFunction(()=>document.querySelector('.meeting-art img')?.naturalWidth>0);
 assert.equal(await page.locator('.person-hotspot').count(),3);for(const button of await page.locator('.person-hotspot').all())assert.ok(await button.isVisible());
 await page.screenshot({path:`test-artifacts/seated-hotel-${width}.png`,fullPage:true});
 const ask=async(q)=>{const before=await page.locator('.scene-speech').innerText();await page.locator('#free-question-input').fill(q);await page.locator('.free-question button').click();await page.waitForFunction(text=>document.querySelector('.scene-speech')?.innerText!==text,before);};
 await page.locator('.person-hotspot[data-person="lucia"]').click();await ask('What price and booking requests did you observe?');assert.match(await page.locator('.scene-speech').innerText(),/170/);assert.match(await page.locator('.scene-speech').innerText(),/69/);assert.doesNotMatch(await page.locator('.scene-speech').innerText(),/190|54 rooms|262/);
 await page.screenshot({path:`test-artifacts/seated-conversation-${width}.png`});
 await page.locator('#free-question-input').fill('Which conditions apply to your observation?');await page.locator('.interview-switch [data-person="marco"]').click();assert.equal(await page.locator('#free-question-input').inputValue(),'');await page.locator('.interview-switch [data-person="lucia"]').click();assert.equal(await page.locator('#free-question-input').inputValue(),'Which conditions apply to your observation?');
 await page.locator('.scene-dialogue-foot [data-action="workspace"]').click();await page.locator('[name="intercept"]').fill('111');await page.locator('[name="slope"]').fill('-.5');
 await page.locator('.mini-tool-links [data-action="dialogue"]').click();await page.locator('.interview-switch [data-person="marco"]').click();await ask('What comparison price and bookings do you have?');assert.match(await page.locator('.scene-speech').innerText(),/190/);assert.match(await page.locator('.scene-speech').innerText(),/54/);
 await page.locator('.scene-dialogue-foot [data-action="workspace"]').click();assert.equal(await page.locator('[name="intercept"]').inputValue(),'111');assert.match(await page.locator('.mini-evidence').innerText(),/170/);assert.match(await page.locator('.mini-evidence').innerText(),/190/);
 await page.reload();await page.locator('.entry-start').click();assert.equal(await page.locator('[name="intercept"]').inputValue(),'111');assert.equal(await page.locator('[name="slope"]').inputValue(),'-.5');
 await page.screenshot({path:`test-artifacts/seated-workbook-${width}.png`});
 await page.locator('.mini-tool-links [data-action="dialogue"]').click();assert.match(await page.locator('.scene-speech').innerText(),/190/);await page.locator('.interview-switch [data-person="lucia"]').click();assert.match(await page.locator('.scene-speech').innerText(),/170/);assert.equal(await page.locator('#free-question-input').inputValue(),'Which conditions apply to your observation?');
 await page.keyboard.press('Escape');await page.locator('.back-to-town').click();assert.equal(await page.locator('.building-hotspot').count(),3);
 for(const id of ['bakery','winery']){await page.locator('.building-hotspot.'+id).click();await page.waitForFunction(()=>document.querySelector('.meeting-art img')?.naturalWidth>0);assert.equal(await page.locator('.person-hotspot').count(),2);await page.locator('.back-to-town').click();}
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);assert.deepEqual(errors,[]);await ctx.close();console.log(width+'px: direct 2D entry, three actors, evidence boundaries, interview switching, draft persistence, reload history and optional meetings passed');
}}finally{await browser.close();}
