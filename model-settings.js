(()=>{
'use strict';
const $=id=>document.getElementById(id),ids=['model-preset','model-base-url','model-text-name','model-vision-name','model-api-key','model-enabled','model-save','model-test','model-clear'];
let local=false,working=false,loaded=false;
async function request(path,body){const r=await fetch(path,{method:body?'POST':'GET',cache:'no-store',headers:{'Content-Type':'application/json','X-Studio-Request':'1'},body:body?JSON.stringify(body):undefined});const result=await r.json();if(!r.ok)throw Error(result.error||'请求失败');return result;}
function fields(c){$('model-base-url').value=c.baseUrl||'';$('model-text-name').value=c.textModel||'';$('model-vision-name').value=c.visionModel||'';$('model-enabled').checked=c.configured?c.enabled:true;$('model-api-key').value='';$('model-api-key').placeholder=c.hasKey?'已保存密钥；留空保留，填写则替换':'仅保存在本机；本地无鉴权服务可留空';}
function controls(){ids.forEach(id=>$(id).disabled=!local||working||!loaded);}
document.addEventListener('model-health',event=>{local=event.detail.local===true;controls();if(local&&$('model-settings').open&&!loaded)load();const c=event.detail.model;$('model-config-status').textContent=!local?'在线版：请使用本机完整版保存与调用模型。':c?.configured?(c.enabled?'已启用':'已保存，未启用')+' · '+c.textModel+(c.visionModel?' · 识图：'+c.visionModel:' · 未配置识图模型'):'本机服务已连接，可配置文字模型与可选识图模型。';});
async function load(){if(!local||working||loaded)return;working=true;controls();try{fields(await request('/api/model-config'));loaded=true;$('model-action-status').textContent='';}catch{$('model-action-status').textContent='请先重启到最新版本的本机服务，再点顶部入口重试读取配置。';}finally{working=false;controls();}}
$('model-settings').addEventListener('toggle',()=>{if($('model-settings').open)load();});
$('open-model-settings').addEventListener('click',()=>{$('model-settings').open=true;$('model-settings').scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});load();});
$('model-preset').addEventListener('change',()=>{const urls={deepseek:'https://api.deepseek.com',qwen:'https://dashscope.aliyuncs.com/compatible-mode/v1'};$('model-base-url').value=urls[$('model-preset').value]||'';$('model-api-key').value='';$('model-action-status').textContent='地址预设仅填入地址；模型名称和权限以你的服务控制台为准。';});
async function action(path,body,message){if(!local||working)return;working=true;controls();$('model-action-status').textContent='处理中…';try{const c=await request(path,body);if(path==='/api/model-config')fields(c);$('model-action-status').textContent=c.message||message;await window.Studio.refreshService();}catch(error){$('model-action-status').textContent=error.message;}finally{working=false;controls();}}
$('model-save').addEventListener('click',()=>action('/api/model-config',{baseUrl:$('model-base-url').value,textModel:$('model-text-name').value,visionModel:$('model-vision-name').value,apiKey:$('model-api-key').value,enabled:$('model-enabled').checked},'接入配置已保存到本机，密钥不进入档案或 GitHub。'));
$('model-test').addEventListener('click',()=>action('/api/model-test',{},'连接成功。'));
$('model-clear').addEventListener('click',()=>action('/api/model-config',{clear:true},'本机模型配置已清除，Lovart 导出仍可使用。'));
controls();document.addEventListener('DOMContentLoaded',()=>window.Studio.refreshService());
})();
