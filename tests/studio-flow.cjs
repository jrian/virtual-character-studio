// Browser integration against localhost; Lovart responses are intercepted, never billed.
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
 const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce',acceptDownloads:true});
 const page=await context.newPage(),errors=[],jobs=new Map();let creates=0,confirms=0,resumes=0,previewAsset;
 page.on('pageerror',e=>errors.push(e.message));
 const json=(route,data)=>route.fulfill({json:data});
 await page.route('**/api/health',r=>json(r,{local:true,configured:true,projectReady:true,maxUploadBytes:10485760}));
 await page.route('**/api/jobs',r=>{
  if(r.request().method()==='GET')return json(r,{jobs:[...jobs.values()].reverse()});
  const body=r.request().postDataJSON(),id=String(++creates).padStart(32,'a');
  const job={...body,id,projectId:'mock-project',status:body.kind==='preview'?'pending_confirmation':'done',conditions:body.conditions,message:'模拟 Lovart 响应，未联网生成。'};
  if(body.kind==='extract')job.result={features:{faceShape:'长脸',eyes:'杏眼'},observations:{person:'左眼下有一颗小痣'},uncertain:'耳朵被头发遮住'};
  if(body.kind==='design')job.result={name:'林知遥',tagline:'AI 测试角色',features:{faceShape:'长脸',eyes:'圆眼',nose:'圆润鼻尖'},sections:[['人物概览','生活于城市旧街区的生活记录者。'],['经历与动机','通过社区记录寻找人与人的联系。']],uncertain:''};
  if(body.kind==='preview'){job.threadId='mock-thread';job.confirmation={description:'模拟需确认的操作，仅供测试。'};}
  jobs.set(id,job);return json(r,job);
 });
 await page.route('**/api/jobs/**',r=>{
  const parts=new URL(r.request().url()).pathname.split('/'),job=jobs.get(parts[3]);
  if(parts[4]==='confirm'){confirms++;job.status='timeout';job.message='模拟等待超时，远端任务可能仍在运行。';}
  if(parts[4]==='resume'){resumes++;job.status='done';job.result={preview:previewAsset};job.message='模拟图片结果，未联网生成。';}
  return json(r,job);
 });
 await page.goto(process.env.SITE_URL||'http://localhost:4176/');
 await page.waitForFunction(()=>document.querySelector('#service-status').textContent.includes('完整版已连接'));
 await page.locator('#open-studio').click();
 assert.equal(await page.locator('.face-field').count(),13);
 await page.locator('#feature-faceShape').fill('鹅蛋脸');await page.locator('#lock-faceShape').check();await page.locator('#feature-nose').fill('挺直鼻梁');
 assert.equal(creates,0,'changing features must not generate');
 const png=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=32;c.height=40;const x=c.getContext('2d');x.fillStyle='#d7e1da';x.fillRect(0,0,32,40);return c.toDataURL('image/png').split(',')[1];});
 const uploadResponse=page.waitForResponse(r=>r.url().endsWith('/api/uploads')&&r.request().method()==='POST');
 await page.locator('#upload-person').setInputFiles({name:'模拟参考.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')});
 previewAsset=await(await uploadResponse).json();
 await page.waitForFunction(()=>document.querySelector('#person-source').value==='upload');
 await page.locator('#extract-features').click();
 await page.getByRole('checkbox',{name:'脸型：长脸',exact:true}).check();
 await page.getByRole('checkbox',{name:'眼形：杏眼',exact:true}).check();
 await page.getByRole('checkbox',{name:'人物描述：左眼下有一颗小痣',exact:true}).check();
 await page.getByRole('button',{name:'确认选中特征并加入草稿'}).click();
 assert.equal(await page.locator('#feature-faceShape').inputValue(),'鹅蛋脸');assert.equal(await page.locator('#feature-eyes').inputValue(),'杏眼');
 assert.match(await page.locator('#task-result').textContent(),/该项已锁定/);
 await page.locator('#studio-step .studio-local-generate').click();
 assert.match(await page.locator('#result').textContent(),/鹅蛋脸（锁定）/);assert.match(await page.locator('#result').textContent(),/小痣/);
 await page.locator('#ai-strategy').selectOption('redesign');await page.locator('#ai-instructions').fill('保留脸型，改善角色故事。');
 await page.locator('#ai-design').click();await page.getByRole('button',{name:'采用此版角色设定'}).click();
 assert.equal(await page.locator('#feature-faceShape').inputValue(),'鹅蛋脸');assert.equal(await page.locator('#feature-nose').inputValue(),'挺直鼻梁');assert.equal(await page.locator('#feature-eyes').inputValue(),'圆眼');
 assert.match(await page.locator('#result').textContent(),/社区记录/);assert.match(await page.locator('#result').textContent(),/Lovart AI 设定/);
 await page.locator('#ai-preview').click();await page.getByRole('button',{name:'确认并继续此任务'}).waitFor();assert.equal(confirms,0);assert.equal(await page.getByRole('button',{name:'确认并继续此任务'}).count(),1);
 await page.getByRole('button',{name:'确认并继续此任务'}).click();await page.getByRole('button',{name:'恢复查询已有任务'}).waitFor();assert.equal(confirms,1);assert.equal(creates,3);
 await page.getByRole('button',{name:'恢复查询已有任务'}).click();await page.getByRole('button',{name:'确认此图，作为后续身份参考'}).waitFor();assert.equal(resumes,1);assert.equal(creates,3);
 await page.locator('.studio-comparison img').last().waitFor();assert.ok(await page.locator('.studio-comparison figure').count()>=2);
 await page.getByRole('button',{name:'确认此图，作为后续身份参考'}).click();assert.match(await page.locator('#anchor-status').textContent(),/已确认/);
 await page.locator('#identity-mode').selectOption('redesign');assert.match(await page.locator('#anchor-status').textContent(),/不使用/);
 const before=await page.locator('#version-select option').count();await page.reload();await page.waitForFunction(()=>document.querySelector('#task-status').textContent.includes('完成'));await page.locator('#version-select').waitFor();assert.equal(await page.locator('#version-select option').count(),before+1,'reload includes demonstration option plus existing versions');assert.equal(creates,3);
 await page.locator('#open-studio').click();assert.equal(await page.locator('#feature-faceShape').inputValue(),'鹅蛋脸');assert.equal(await page.locator('#lock-faceShape').isChecked(),true);
 // All versions are included in v2 backup, without embedded image bytes or credentials.
 await page.locator('[data-view=library]').click();const download=page.waitForEvent('download');await page.locator('#export-all').click();const backup=JSON.parse(fs.readFileSync(await(await download).path(),'utf8'));assert.equal(backup.version,2);assert.ok(backup.profiles.length>=3);assert.ok(backup.profiles.some(x=>x.preview));assert.doesNotMatch(JSON.stringify(backup),/apiKey|secretKey|data:image/);
 const old={...backup.profiles[0],id:'legacy-character',schemaVersion:undefined,kind:undefined,preview:undefined};delete old.conditions.studio;
 await page.locator('#import').setInputFiles({name:'旧版.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({version:1,profiles:[old]}))});await page.waitForFunction(()=>JSON.parse(localStorage.getItem('character-studio-profiles-v1')).some(x=>x.id==='legacy-character'));assert.ok(await page.locator('.library-row').count()>0);
 await page.locator('[data-view=create]').click();await page.locator('#open-studio').click();await page.locator('#local-help').evaluate(el=>el.open=false);
 await page.locator('#version-select').selectOption(backup.profiles.find(x=>x.preview).id);await page.locator('#toast.visible').waitFor({state:'hidden'});await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:'.impeccable/review/studio-desktop.png'});
 await page.locator('#task-title').scrollIntoViewIfNeeded();await page.screenshot({path:'.impeccable/review/studio-task-desktop.png'});
 for(const width of [1280,820,390]){await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'horizontal overflow '+width);}
 await page.locator('#studio-step').evaluate(el=>el.scrollIntoView({block:'start'}));await page.screenshot({path:'.impeccable/review/studio-mobile.png'});await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:'.impeccable/review/studio-mobile-top.png'});
 assert.equal(errors.length,0,errors.join('\n'));fs.writeFileSync('.impeccable/review/studio-results.json',JSON.stringify({passed:true,paidRequests:0,mockedLovartJobs:creates,confirms,resumes,versions:backup.profiles.length,errors},null,2));
 await browser.close();console.log('PASS: locks, real local upload, extraction confirmation, AI merge, preview confirmation/recovery, versions, backups, responsive layouts; no paid Lovart calls.');
})().catch(e=>{console.error(e);process.exit(1)});
