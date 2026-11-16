// Local browser test: opens no Lovart page and submits no generation task.
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const b=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}),page=await b.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.goto(process.env.SITE_URL||'http://localhost:4180/');
 await page.evaluate(()=>{window.opened=[];window.open=(...args)=>{opened.push(args);return null;};window.copied='';Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.copied=text;}}});});
 await page.locator('#open-lovart-export').click();assert.equal(await page.locator('#lovart-export').isVisible(),true);
 await page.locator('#feature-faceShape').fill('圆脸');await page.locator('#lock-faceShape').check();await page.locator('#ai-instructions').fill('保留眼形，修改服装颜色');
 await page.locator('[data-step=base]').click();await page.locator('#name').fill('导出角色');await page.locator('#age').fill('36');await page.locator('#open-lovart-export').click();
 assert.match(await page.locator('#lovart-export-text').inputValue(),/导出角色/);assert.match(await page.locator('#lovart-export-text').inputValue(),/年龄：36/);assert.match(await page.locator('#lovart-export-text').inputValue(),/圆脸；锁定/);
 await page.locator('#lovart-target').fill('https://evil.test/');await page.locator('#lovart-copy-open').click();assert.equal(await page.evaluate(()=>opened.length),0);assert.equal(await page.locator('#lovart-target').getAttribute('aria-invalid'),'true');
 await page.locator('#lovart-target').fill('https://www.lovart.ai/canvas?projectId=target-demo');await page.locator('#lovart-copy-open').click();await page.waitForFunction(()=>copied.includes('保留眼形'));assert.equal(await page.evaluate(()=>opened[0][0]),'https://www.lovart.ai/canvas?projectId=target-demo');assert.match(await page.locator('#lovart-export-status').textContent(),/粘贴指令/);
 // Inactive image sources are omitted; active public references and uploads are listed distinctly.
 await page.evaluate(()=>{const c=CharacterApp.conditions();c.reference=PORTRAIT_REFERENCES[0];c.outfit=BOUND_LIBRARIES.items[0];c.studio.sources={person:'upload',outfit:'gallery'};c.studio.uploads.person={id:'a'.repeat(32),name:'自备人物.png'};CharacterApp.setConditions(c);});
 let text=await page.locator('#lovart-export-text').inputValue();assert.match(text,/自备人物.png/);assert.doesNotMatch(text,/localhost|\/media\//);assert.match(await page.locator('#lovart-reference-checklist').textContent(),/手动上传/);
 const downloaded=page.waitForEvent('download');await page.locator('#lovart-download').click();text=fs.readFileSync(await(await downloaded).path(),'utf8');assert.match(text,/圆脸；锁定/);assert.match(text,/保留眼形/);
 await page.locator('#lovart-export-task').selectOption('extract');assert.match(await page.locator('#lovart-export-text').inputValue(),/本次不要生成图片/);
 // Denied clipboard: truthful manual recovery, no false copied success.
 await page.evaluate(()=>{navigator.clipboard.writeText=async()=>{throw Error('denied');};document.execCommand=()=>false;});await page.locator('#lovart-copy').click();await page.waitForFunction(()=>document.querySelector('#lovart-export-status').textContent.includes('未能复制'));
 await page.locator('#toast.visible').waitFor({state:'hidden'});await page.evaluate(()=>{document.activeElement.blur();const el=document.querySelector('#lovart-export-text');el.setSelectionRange(0,0);el.scrollTop=0;});await page.locator('#lovart-export').evaluate(el=>el.scrollIntoView({block:'start',behavior:'instant'}));await page.screenshot({path:'.impeccable/review/lovart-export-desktop.png'});
 for(const width of [820,390]){await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);}
 await page.locator('#lovart-export').evaluate(el=>el.scrollIntoView({block:'start',behavior:'instant'}));await page.waitForTimeout(350);await page.screenshot({path:'.impeccable/review/lovart-export-mobile.png'});
 await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await page.screenshot({path:'.impeccable/review/lovart-export-mobile-top.png'});
 await page.reload();assert.equal(await page.locator('#lovart-target').inputValue(),'https://www.lovart.ai/canvas?projectId=target-demo');assert.equal(errors.length,0,errors.join('\n'));
 fs.writeFileSync('.impeccable/review/lovart-export-results.json',JSON.stringify({passed:true,errors,checks:['live form snapshot','locks','active reference checklist','target validation and persistence','copy and open requested URL','clipboard rejection','Markdown download','task choice','390/820/1440 responsive'],paidCalls:0},null,2));await b.close();console.log('PASS: Lovart export, destination, clipboard recovery, references, download and responsive layouts; no paid calls.');
})().catch(e=>{console.error(e);process.exit(1)});
