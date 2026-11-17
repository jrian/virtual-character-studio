(()=>{
'use strict';
const $=id=>document.getElementById(id),core=window.StudioCore;
const roleLabels={person:'人物',outfit:'服装',style:'风格'},originLabels={manual:'手动设置',extracted:'已确认提取',ai:'AI 建议'};
const clone=x=>JSON.parse(JSON.stringify(x));
let state=core.normalize(),health={local:false,configured:false,projectReady:false},busy=false,activeJob=null,pollTimer=null;
let versions=read('character-studio-versions-v2',[]),applied=read('character-studio-applied-v2',[]),pending=read('character-studio-pending-v2',{});
if(!Array.isArray(versions))versions=[];if(!Array.isArray(applied))applied=[];
const assets=new Map();
function read(key,fallback){try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}}
function store(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{notify('本机存储空间不足，请导出档案备份。');return false;}}
function node(tag,text,cls){const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(cls)el.className=cls;return el;}
function button(text,action,cls='button secondary'){const el=node('button',text,cls);el.type='button';el.addEventListener('click',action);return el;}
function notify(text){if(window.CharacterApp)window.CharacterApp.notify(text);else $('service-status').textContent=text;}
function changed(){document.getElementById('character-form').dispatchEvent(new Event('studio-change'));summary();}
async function api(path,{body,raw,name}={}){
 const headers={'X-Studio-Request':'1'};if(body)headers['Content-Type']='application/json';if(name)headers['X-File-Name']=encodeURIComponent(name);
 const response=await fetch(path,{method:body||raw?'POST':'GET',headers,body:raw||(body?JSON.stringify(body):undefined),cache:'no-store'});
 let data;try{data=await response.json();}catch{throw Error('本机 AI 服务没有响应，请确认使用 npm start 启动完整版。');}
 if(!response.ok)throw Error(data.error||'请求失败，请检查服务后重试。');return data;
}
async function asset(id){if(!assets.has(id))assets.set(id,api('/api/assets/'+id).catch(()=>null));return assets.get(id);}
function available(){return health.local&&(health.model?.enabled?health.model.configured:health.configured&&health.projectReady);}
function controls(){document.querySelectorAll('[data-ai-action]').forEach(el=>el.disabled=!available()||busy);document.querySelectorAll('[data-upload]').forEach(el=>el.disabled=!health.local||busy);$('create-project').hidden=!health.local||!health.configured||health.projectReady;$('create-project').disabled=busy;if(health.model?.enabled)$('ai-preview').disabled=true;}
async function checkService(){
 const local=['localhost','127.0.0.1'].includes(location.hostname)&&location.protocol==='http:';
 try{health=local?await api('/api/health'):{local:false,configured:false,projectReady:false};}catch{health={local:false,configured:false,projectReady:false};}
 $('service-status').textContent=!health.local?'在线基础版：参数捏脸、选图与 Lovart 导出可用；复制指令后到 Lovart 粘贴并发送。':!health.configured?'本机参考图服务已连接。使用「导出到 Lovart」即可继续创作，无需 AK/SK。':!health.projectReady?'Lovart 凭据已配置。请设置已有项目 ID，或在下方创建专用项目。':'本机完整版已连接。每次点击 AI 操作才发送选中的参考图，可能消耗 Lovart 额度。';
 if(health.local&&health.model?.enabled)$('service-status').textContent='自定义 AI 模型已启用：文字／识图使用接入模型，生图继续通过 Lovart 导出。';document.dispatchEvent(new CustomEvent('model-health',{detail:health}));controls();renderUploads();window.CharacterApp?.refreshResult();
 if(health.local&&!activeJob){try{const data=await api('/api/jobs');const recent=data.jobs.find(x=>['queued','running','pending_confirmation','timeout','interrupted'].includes(x.status))||data.jobs[0];if(recent)showJob(recent);}catch{/* Basic tools stay available. */}}
}
function renderFeatures(){
 $('face-fields').replaceChildren();
 for(const [key,[label,...choices]] of Object.entries(core.fields)){
  const row=node('div',undefined,'face-field'),lab=node('label',label);lab.htmlFor='feature-'+key;
  const input=node('input');input.type='text';input.id='feature-'+key;input.maxLength=120;input.placeholder='不限定，可选择或输入';input.setAttribute('list','choices-'+key);input.value=state.features[key]?.value||'';
  const list=node('datalist');list.id='choices-'+key;for(const value of choices){const option=node('option');option.value=value;list.append(option);}
  const meta=node('div',undefined,'feature-meta'),origin=node('span',originLabels[state.features[key]?.origin]||'尚未设置');
  const lockLabel=node('label'),lock=node('input');lock.type='checkbox';lock.id='lock-'+key;lock.checked=state.features[key]?.locked||false;lock.disabled=!input.value;lockLabel.append(lock,document.createTextNode('锁定'+label));
  input.addEventListener('input',()=>{if(input.value.trim())state.features[key]={value:input.value.trim(),locked:lock.checked,origin:'manual',source:''};else{delete state.features[key];lock.checked=false;}lock.disabled=!input.value.trim();origin.textContent=input.value.trim()?'手动设置':'尚未设置';changed();});
  lock.addEventListener('change',()=>{if(state.features[key])state.features[key].locked=lock.checked;changed();});meta.append(origin,lockLabel);row.append(lab,input,list,meta);$('face-fields').append(row);
 }
}
function renderUploads(){
 $('upload-fields').replaceChildren();
 for(const [role,label] of Object.entries(roleLabels)){
  const row=node('div',undefined,'upload-row'),lab=node('label',`${label}参考图${role==='style'?'（选填）':''}`),input=node('input');input.type='file';input.id='upload-'+role;input.accept='image/png,image/jpeg,image/webp';input.dataset.upload=role;input.disabled=!health.local||busy;lab.htmlFor=input.id;
  const preview=node('div',undefined,'upload-preview');row.append(lab,input,preview);$('upload-fields').append(row);
  input.addEventListener('change',async()=>{
   const file=input.files[0];if(!file)return;
   if(file.size>10*1024*1024||!['image/png','image/jpeg','image/webp'].includes(file.type)){notify('请选择 10 MB 以内的 PNG、JPEG 或 WebP 图片。');input.value='';return;}
   input.disabled=true;
   try{const image=await createImageBitmap(file);image.close();const value=await api('/api/uploads',{raw:file,name:file.name});assets.set(value.id,Promise.resolve(value));state.uploads[role]={id:value.id,name:value.name};if(role!=='style')state.sources[role]='upload';delete state.observations[role];set(state);changed();notify('图片已保存在本机，尚未发送至 Lovart。');}catch(error){notify(error.message||'图片无法读取，请转换格式后重试。');}finally{input.disabled=!health.local||busy;}
  });
  const ref=state.uploads[role];if(ref){
   const text=node('p',ref.name+(health.local?' · 正在检查本机图片':' · 本地图片需在完整版中重新关联'));preview.append(text,button('移除',()=>{delete state.uploads[role];delete state.observations[role];set(state);changed();},'text-button'));
   if(health.local||ref.libraryId)(!health.local&&ref.libraryId?window.PersonalLibrary.asset(ref.libraryId):asset(ref.id)).then(a=>{if(!preview.isConnected)return;text.textContent=ref.name+(a?' · 已保存在本机':' · 图片缺失，请重新上传');if(a){const img=node('img');img.src=a.url;img.alt=label+'参考';preview.prepend(img);}});
  }
 }
}
function set(value){
 state=core.normalize(value);renderFeatures();renderUploads();
 $('person-source').value=state.sources.person;$('outfit-primary-source').value=state.sources.outfit;
 $('identity-mode').value=state.mode;$('ai-strategy').value=state.strategy;$('ai-instructions').value=state.instructions;
 summary();
}
for(const [id,key] of [['identity-mode','mode'],['ai-strategy','strategy'],['ai-instructions','instructions']])$(id).addEventListener(id==='ai-instructions'?'input':'change',()=>{state[key]=$(id).value;changed();});
function renderExport(c){
 const pack=core.lovartExport(c,$('lovart-export-task').value);$('lovart-export-text').value=pack.text;
 $('lovart-reference-checklist').replaceChildren();
 for(const ref of pack.references){const p=node('p',`${ref.label} · ${ref.name}${ref.manual?'：需在 Lovart 手动上传或关联':'：指令已含原图链接；如无法读取，请在 Lovart 手动上传'}`);if(ref.url){const a=node('a','查看参考原图');a.href=ref.url;a.target='_blank';a.rel='noopener noreferrer';p.append(document.createTextNode(' '),a);}$('lovart-reference-checklist').append(p);}
}
function exportTarget(){
 try{const target=core.lovartTarget($('lovart-target').value);$('lovart-target-error').textContent='';$('lovart-target').removeAttribute('aria-invalid');$('lovart-open-link').href=target;store('character-studio-lovart-target',target);return target;}
 catch(e){$('lovart-target-error').textContent=e.message;$('lovart-target').setAttribute('aria-invalid','true');$('lovart-open-link').removeAttribute('href');return null;}
}
async function copyExport(open=false){
 if(!window.CharacterApp.validate())return;
 const target=exportTarget();if(!target){$('lovart-target').focus();return;}
 renderExport(window.CharacterApp.conditions());const text=$('lovart-export-text').value;
 // Open only the target page, never an undocumented prompt URL or an automatic submission.
 let copying;try{copying=navigator.clipboard.writeText(text);}catch{copying=Promise.reject(Error('clipboard unavailable'));}
 if(open)window.open(target,'_blank','noopener,noreferrer');
 let ok=false;try{await copying;ok=true;}catch{const area=$('lovart-export-text');area.focus();area.select();try{ok=document.execCommand('copy');}catch{}}
 $('lovart-export-status').textContent=ok?(open?'指令已复制，已请求打开 Lovart。请粘贴指令、补充参考图，再点击发送。':'指令已复制。请到目标 Lovart 项目粘贴、补充参考图并发送。'):'浏览器未能复制。导出文字已选中，请按 Ctrl+C／⌘C；也可下载指令文件。';
 notify(ok?'Lovart 指令已复制，等待你在 Lovart 中粘贴并发送。':'复制未完成，请手动复制或下载指令。');
}
$('lovart-target').value=read('character-studio-lovart-target','');exportTarget();
$('lovart-target').addEventListener('input',exportTarget);
$('lovart-export-task').addEventListener('change',()=>renderExport(window.CharacterApp.conditions()));
$('lovart-copy').addEventListener('click',()=>copyExport());$('lovart-copy-open').addEventListener('click',()=>copyExport(true));
$('open-lovart-export').addEventListener('click',()=>{renderExport(window.CharacterApp.conditions());window.ToolDialogs.open('lovart-dialog',$('open-lovart-export'));});
$('lovart-download').addEventListener('click',()=>{
 if(!window.CharacterApp.validate()||!exportTarget())return;
 const c=window.CharacterApp.conditions(),text=core.lovartExport(c,$('lovart-export-task').value).text,url=URL.createObjectURL(new Blob([text],{type:'text/markdown;charset=utf-8'})),a=node('a');a.href=url;a.download=(c.name||'未命名角色').replace(/[\\/:*?"<>|]/g,'_')+'-Lovart生成指令.md';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);$('lovart-export-status').textContent='指令文件已导出。可复制文件中的文字到 Lovart；参考图片需另外上传。';
});
const referenceKeys=new Map();
document.addEventListener('reference-image-removed',event=>{for(const role of ['person','outfit','style'])if(state.uploads[role]?.libraryId===event.detail.id)referenceKeys.delete(role);summary();});
function renderDraftReferences(c){
 for(const role of ['person','outfit','style']){
  const holder=$('reference-thumb-'+role),caption=$('reference-detail-'+role);if(!holder)continue;
  const upload=state.uploads[role],source=role==='style'?'upload':state.sources[role],gallery=role==='person'?c.reference:c.outfit;
  const key=JSON.stringify([source,source==='upload'?upload:gallery,health.local]);if(referenceKeys.get(role)===key)continue;referenceKeys.set(role,key);
  if(!holder.dataset.empty)holder.dataset.empty=holder.innerHTML;holder.innerHTML=holder.dataset.empty;
  let url=null;
  if(source==='gallery'&&gallery){caption.textContent='本次使用 · '+(gallery.id&&role==='person'?gallery.id:gallery.code);url=role==='person'?gallery.thumb:gallery.origin+'thumbs/'+gallery.code+'.webp';}
  else if(source==='upload'&&upload){caption.textContent='本次使用 · '+upload.name;const promise=!health.local&&upload.libraryId?window.PersonalLibrary?.asset(upload.libraryId):health.local?asset(upload.id):Promise.resolve(null);Promise.resolve(promise).then(a=>{if(referenceKeys.get(role)!==key)return;if(a)addImage(a.url);else caption.textContent=upload.name+' · 图片缺失，请重新关联';}).catch(()=>{if(referenceKeys.get(role)===key)caption.textContent=upload.name+' · 图片无法读取，请重新关联';});}
  else caption.textContent=role==='style'?'尚未添加风格图':source==='none'?'本次仅使用文字条件':source==='upload'?'尚未上传图片':'尚未选择'+roleLabels[role];
  function addImage(src){if(!src)return;const img=node('img');img.alt=roleLabels[role]+'参考';img.loading='lazy';img.referrerPolicy='no-referrer';img.src=src;img.addEventListener('error',()=>{if(img.isConnected){holder.innerHTML=holder.dataset.empty;caption.textContent+=' · 缩略图不可用';}},{once:true});holder.replaceChildren(img);}
  if(url)addImage(url);
 }
}
function summary(){
 if(!window.CharacterApp)return;
 const c=window.CharacterApp.conditions(),labels=[];renderExport(c);renderDraftReferences(c);
 for(const role of ['person','outfit']){const source=state.sources[role],ref=source==='upload'?state.uploads[role]?.name:source==='gallery'?(role==='person'?c.reference?.id:c.outfit?.code):null;labels.push(`${roleLabels[role]}：${ref||(source==='upload'?'上传图片缺失':'仅文字条件')}`);}
 if(state.uploads.style)labels.push('风格：'+state.uploads.style.name);
 $('active-reference-summary').textContent='本次参考 · '+labels.join('；');
 $('anchor-status').textContent=state.anchor?`已确认的身份参考：${state.anchor.name}${state.mode==='redesign'?'（重新设计时不使用）':''}`:'尚未确认身份预览。满意后可在结果中设为后续身份参考。';$('clear-anchor').hidden=!state.anchor;
 $('accepted-observations').replaceChildren();for(const [role,value] of Object.entries(state.observations)){if(!value)continue;const p=node('p',`已确认${roleLabels[role]}描述：${value}`);p.append(button('清除',()=>{delete state.observations[role];changed();},'text-button'));$('accepted-observations').append(p);}
}
function set(value){state=core.normalize(value);renderFeatures();renderUploads();$('identity-mode').value=state.mode;$('ai-strategy').value=state.strategy;$('ai-instructions').value=state.instructions;$('person-source').value=state.sources.person;$('outfit-primary-source').value=state.sources.outfit;summary();}
for(const [id,key] of [['identity-mode','mode'],['ai-strategy','strategy'],['ai-instructions','instructions']])$(id).addEventListener('input',()=>{state[key]=$(id).value;changed();});
for(const [id,key] of [['person-source','person'],['outfit-primary-source','outfit']])$(id).addEventListener('change',()=>{state.sources[key]=$(id).value;changed();});
$('clear-anchor').addEventListener('click',()=>{state.anchor=null;changed();});
$('open-studio').addEventListener('click',()=>{document.querySelector('[data-step=studio]').click();$('editor-title').scrollIntoView({block:'start',behavior:'smooth'});});
$('refresh-service').addEventListener('click',checkService);
$('create-project').addEventListener('click',async()=>{busy=true;controls();try{await api('/api/project',{body:{}});await checkService();notify('专用 Lovart 项目已创建。');}catch(e){notify(e.message);}finally{busy=false;controls();}});
async function start(kind){
 if(!available()||busy||!window.CharacterApp.validate())return;
 busy=true;controls();$('task-status').textContent='正在创建任务，请勿重复点击。';
 const requestId=crypto.randomUUID(),conditions=window.CharacterApp.conditions();
 pending[requestId]={conditions,baseId:window.CharacterApp.current()?.id};store('character-studio-pending-v2',pending);
 try{const job=await api('/api/jobs',{body:{kind,requestId,conditions}});showJob(job);}
 catch(e){busy=false;controls();$('task-status').textContent=e.message+' 未自动重发。';notify(e.message);try{const data=await api('/api/jobs');const existing=data.jobs.find(x=>['queued','running','pending_confirmation','timeout','interrupted'].includes(x.status));if(existing)showJob(existing);}catch{}}
}
$('extract-features').addEventListener('click',()=>start('extract'));$('ai-design').addEventListener('click',()=>start('design'));$('ai-preview').addEventListener('click',()=>start('preview'));
function jobConditions(job){return window.CharacterApp.clean(pending[job.requestId]?.conditions||job.conditions);}
function rememberApplied(job){if(!applied.includes(job.id))applied.push(job.id);applied=applied.slice(-200);store('character-studio-applied-v2',applied);}
function conflicts(list,container,apply){
 if(!list.length)return;container.append(node('p','以下建议与现有设置不同，已保留你的选择。','studio-warning'));
 list.forEach(f=>{const row=node('div',undefined,'conflict-row');row.append(node('strong',core.fields[f.key][0]),node('p',`当前：${f.existing}；建议：${f.suggested}${f.locked?'。该项已锁定。':''}`));if(!f.locked)row.append(button('明确采用此项建议',()=>{apply(f);row.replaceChildren(node('p','已采用该项建议，请生成或采用新版本查看结果。'));},'text-button'));container.append(row);});
}
function extraction(job,box){
 const result=job.result,chosen={};box.append(node('p','勾选清晰且需要的特征，再确认加入草稿；未确认的推测不会进入提示词。'));
 for(const [key,value] of Object.entries(result.features||{})){
  const lab=node('label',undefined,'extraction-choice'),check=node('input');check.type='checkbox';check.checked=false;check.addEventListener('change',()=>{if(check.checked)chosen[key]=value;else delete chosen[key];});lab.append(check,document.createTextNode(`${core.fields[key][0]}：${value}`));box.append(lab);
 }
 const observations={};for(const [role,value] of Object.entries(result.observations||{})){if(!value)continue;const lab=node('label',undefined,'extraction-choice'),check=node('input');check.type='checkbox';check.addEventListener('change',()=>{if(check.checked)observations[role]=value;else delete observations[role];});lab.append(check,document.createTextNode(`${roleLabels[role]}描述：${value}`));box.append(lab);}
 if(result.uncertain)box.append(node('p','不确定或不可见：'+result.uncertain,'field-note'));
 const diff=node('div');box.append(button('确认选中特征并加入草稿',()=>{
  if(!Object.keys(chosen).length&&!Object.keys(observations).length){notify('请先勾选需要采用的特征。');return;}
  const merged=core.merge(state,chosen,'redesign','extracted');state=merged.state;Object.assign(state.observations,observations);for(const key of Object.keys(chosen))if(state.features[key]?.value===chosen[key])state.features[key].source=job.id;set(state);changed();diff.replaceChildren();conflicts(merged.conflicts,diff,f=>{state.features[f.key]={value:f.suggested,locked:false,origin:'extracted',source:job.id};set(state);changed();});notify('已确认的特征已加入草稿，现有角色版本未改变。');}),diff);
}
function adoptDesign(job,box){
 const result=job.result,c=jobConditions(job),merged=core.merge(c.studio,result.features,c.studio.strategy,'ai');c.studio=merged.state;
 const preview=node('div');for(const [h,t] of result.sections||[]){preview.append(node('strong',h),node('p',t));}box.append(preview);
 if(result.uncertain)box.append(node('p',result.uncertain,'field-note'));
 const diff=node('div');conflicts(merged.conflicts,diff,f=>{c.studio.features[f.key]={value:f.suggested,locked:false,origin:'ai',source:job.id};});box.append(diff);
 const use=button(applied.includes(job.id)?'已采用，可在版本记录中查看':'采用此版角色设定',()=>{
  if(applied.includes(job.id))return;
  const original=jobConditions(job),unchanged=JSON.stringify(window.CharacterApp.conditions())===JSON.stringify(original);
  let profile=window.CharacterApp.build(c,'ai');
  if(!c.name&&result.name)profile.name=result.name;if(result.tagline)profile.tagline=result.tagline;
  for(const [h,t] of result.sections){const item=profile.sections.find(x=>x[0]===h);if(item)item[1]=t;else profile.sections.push([h,t]);}
  profile=core.decorate(profile,'ai',window.CharacterApp.current());profile.provider={name:job.providerName||'Lovart',jobId:job.id};
  if(unchanged)window.CharacterApp.setConditions(c);
  window.CharacterApp.present(profile);rememberApplied(job);diff.querySelectorAll('button').forEach(x=>x.disabled=true);use.disabled=true;use.textContent='已采用，可在版本记录中查看';notify(unchanged?'AI 设定已生成新版本。':'已采用提交时的条件生成新版本，当前草稿仍保留。');
 });use.disabled=applied.includes(job.id);box.append(use);
}
function adoptPreview(job){
 if(applied.includes(job.id)||!job.result?.preview)return;
 const c=jobConditions(job),context=pending[job.requestId],base=versions.find(x=>x.id===context?.baseId)||window.CharacterApp.current();
 let p=base&&JSON.stringify(base.conditions)===JSON.stringify(c)?clone(base):window.CharacterApp.build(c,'local');
 p.id=crypto.randomUUID();p.createdAt=new Date().toISOString();p=core.decorate(p,'preview',base);p.preview={id:job.result.preview.id,name:job.result.preview.name};p.provider={name:'Lovart',jobId:job.id};
 window.CharacterApp.present(p);rememberApplied(job);
}
function showJob(job){
 clearTimeout(pollTimer);activeJob=job;busy=['queued','running','pending_confirmation','timeout','interrupted'].includes(job.status);controls();
 const labels={queued:'排队中',running:'生成中',pending_confirmation:'等待确认',timeout:'等待超时',interrupted:'需要恢复查询',failed:'失败',invalid:'返回内容需处理',done:'完成'};
 $('task-status').textContent=`${{extract:'图片特征提取',design:'AI 角色设定',preview:'角色预览'}[job.kind]} · ${labels[job.status]||job.status}。${job.message||''}`;
 const actions=$('task-actions'),box=$('task-result');actions.replaceChildren();box.replaceChildren();
 if(job.projectId){const link=node('a','在 Lovart 查看任务与消耗');link.href='https://www.lovart.ai/canvas?projectId='+encodeURIComponent(job.projectId);link.target='_blank';link.rel='noopener';actions.append(link);}
 if(job.status==='pending_confirmation'){box.append(node('pre',JSON.stringify(job.confirmation||{},null,2)));actions.append(button('确认并继续此任务',()=>actionJob(job,'confirm')));}
 if(['timeout','interrupted'].includes(job.status))actions.append(button('恢复查询已有任务',()=>actionJob(job,'resume')));
 if(job.status==='done'){
  if(job.result?.warning)box.append(node('p',job.result.warning,'studio-warning'));
  if(job.kind==='extract')extraction(job,box);if(job.kind==='design')adoptDesign(job,box);if(job.kind==='preview'){adoptPreview(job);box.append(node('p','图片已保存为新版本，可在角色档案中比较并确认身份参考。'));}
 }
 if(job.status==='invalid'&&job.result){box.append(node('pre',job.result.rawText||'没有可读取的文字。'));box.append(button('复制返回原文',async()=>{try{await navigator.clipboard.writeText(job.result.rawText||'');notify('返回原文已复制。');}catch{notify('复制失败，可选中原文手动复制。');}}));}
 if(['queued','running'].includes(job.status))pollTimer=setTimeout(()=>poll(job.id),2000);
}
async function actionJob(job,action){try{showJob(await api('/api/jobs/'+job.id+'/'+action,{body:{}}));}catch(e){notify(e.message);}}
async function poll(id){try{showJob(await api('/api/jobs/'+id));}catch(e){$('task-status').textContent=e.message+' 重新检查服务可找回已有任务。';busy=false;controls();}}
function record(profile){
 if(!profile||!window.CharacterApp.valid(profile))return;
 versions=versions.filter(x=>window.CharacterApp.valid(x)).map(x=>window.CharacterApp.sanitize(x));
 if(!versions.some(x=>x.id===profile.id)){const next=[clone(profile),...versions].slice(0,50);if(store('character-studio-versions-v2',next))versions=next;}
 window.CharacterApp.refreshArchive();
}
function imageFigure(container,ref,label){
 if(!ref)return;const fig=node('figure'),caption=node('figcaption',label);fig.append(caption);container.append(fig);
 if(!health.local&&!ref.libraryId){fig.prepend(node('p','本机图片，请在完整版关联。','studio-empty'));return;}
 (!health.local&&ref.libraryId?window.PersonalLibrary.asset(ref.libraryId):asset(ref.id)).then(a=>{if(!fig.isConnected)return;if(!a){fig.prepend(node('p','本机图片缺失，请重新关联。','studio-empty'));return;}const img=node('img');img.src=a.url;img.alt=label;fig.prepend(img);const link=node('a','打开或下载图片');link.href=a.url;link.target='_blank';link.rel='noopener';fig.append(link);});
}
function renderResult(profile,isExample){
 if(isExample){renderVersionControls(null);summary();return;}
 if(!isExample)record(profile);
 const result=$('result'),s=core.normalize(profile.conditions.studio);
 document.querySelector('.result-bottom>span').textContent=profile.kind==='ai'?(profile.provider?.name||'Lovart')+' AI 设定 · 请检查后使用':profile.kind==='preview'?'Lovart 图片预览 · 文字来源见版本':'本地规则组合 · 可继续编辑完善';$('regenerate').textContent=profile.kind==='ai'||profile.kind==='preview'?'按当前条件生成基础新版':'按当前条件换一版';
 result.append(node('p',`${profile.kind==='ai'?(profile.provider?.name||'Lovart')+' AI 设定':profile.kind==='preview'?'Lovart 图片预览':'本地基础设定'} · 版本 ${profile.version?.number||1}`,'studio-meta'));
 const comparison=node('div',undefined,'studio-comparison');
 if(s.sources.person==='upload')imageFigure(comparison,s.uploads.person,'人物原始参考');
 if(s.sources.outfit==='upload')imageFigure(comparison,s.uploads.outfit,'服装原始参考');
 const previous=versions.find(x=>x.id===profile.version?.parentId);if(previous?.preview)imageFigure(comparison,previous.preview,'上一版预览');
 if(profile.preview)imageFigure(comparison,profile.preview,'本次角色预览');if(comparison.children.length)result.prepend(comparison);
 if(profile.preview){const actions=node('div',undefined,'studio-result-actions'),accept=button('确认此图，作为后续身份参考',async()=>{if(!await asset(profile.preview.id)){notify('本机图片缺失，请先重新关联。');return;}state.anchor={id:profile.preview.id,name:profile.name+' · 版本 '+(profile.version?.number||1)};state.mode='preserve';set(state);changed();notify('已确认身份参考，后续预览仍需检查一致性。');});accept.disabled=!health.local;actions.append(accept);result.prepend(actions);}
 renderVersionControls(profile);summary();
}
function renderVersionControls(profile){
 document.getElementById('version-controls')?.remove();
 const row=node('div',undefined,'version-controls');row.id='version-controls';const label=node('label','版本记录'),select=node('select');select.id='version-select';label.htmlFor=select.id;
 const list=[...(profile?[profile]:[]),...versions.filter(x=>x.id!==profile?.id)].filter(x=>window.CharacterApp.valid(x));if(!list.length)return;if(!profile){const placeholder=node('option','选择已生成版本继续查看');placeholder.value='';placeholder.disabled=true;placeholder.selected=true;select.append(placeholder);}
 list.forEach(p=>{const option=node('option',`${p.name} · v${p.version?.number||1} · ${p.kind==='ai'?'AI 设定':p.kind==='preview'?'图片预览':'基础设定'} · ${new Date(p.createdAt).toLocaleString('zh-CN')}`);option.value=p.id;select.append(option);});
 select.addEventListener('change',()=>{const p=list.find(x=>x.id===select.value);if(p){window.CharacterApp.present(clone(p));notify('已查看历史版本，当前条件草稿保留。');}});row.append(label,select,node('p','自动保留最近 50 个版本。保存档案可长期保留；导出全部档案也包含这些版本。'));
 $('result').after(row);
}
async function useLibrary(item,role){
 if(busy)throw Error('请等待当前 AI 任务结束，再更换提炼对象。');
 const platform={xiaohongshu:'小红书',behance:'Behance',pinterest:'Pinterest',local:'本地素材'}[item.collection.platform]||'参考库';
 const name=(platform+' · '+item.collection.name+' · '+item.name).slice(0,120);
 let ref={id:item.id,name};if(health.local)ref=await api('/api/uploads',{raw:item.blob,name});
 state.uploads[role]={id:ref.id,name,libraryId:item.id};if(role==='person')state.anchor=null;if(role!=='style')state.sources[role]='upload';delete state.observations[role];
 if(health.local)assets.set(ref.id,Promise.resolve(ref));set(state);changed();window.ToolDialogs.closeAll();$('open-studio').click();notify('已选作'+roleLabels[role]+'参考，可点击提取图片特征，或导出到 Lovart。');
}
window.Studio={useLibrary,get:()=>core.normalize(state),set,summary,renderResult,refreshService:checkService,versions:()=>versions.filter(x=>window.CharacterApp.valid(x))};
set(state);queueMicrotask(checkService);
})();
