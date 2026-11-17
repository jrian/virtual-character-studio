(()=>{
'use strict';
const $=id=>document.getElementById(id),names={xiaohongshu:'小红书',behance:'Behance',pinterest:'Pinterest',local:'本地素材'};
let db,collections=[],items=[],urls=[],limit=30;const assetCache=new Map();
const uid=()=>crypto.randomUUID().replaceAll('-','');
const node=(tag,text,cls)=>{const el=document.createElement(tag);if(text)el.textContent=text;if(cls)el.className=cls;return el;};
const request=r=>new Promise((resolve,reject)=>{r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
async function database(){if(!db)db=await new Promise((resolve,reject)=>{const r=indexedDB.open('character-personal-references',1);r.onupgradeneeded=()=>{r.result.createObjectStore('collections',{keyPath:'id'});r.result.createObjectStore('images',{keyPath:'id'});};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});return db;}
async function write(store,value,remove=false){const d=await database();return new Promise((resolve,reject)=>{const t=d.transaction(store,'readwrite');if(remove)t.objectStore(store).delete(value);else t.objectStore(store).put(value);t.oncomplete=resolve;t.onerror=()=>reject(t.error);t.onabort=()=>reject(t.error);});}
function status(message){$('personal-library-status').textContent=message;}
function sourceUrl(value,platform){
 if(!value.trim())return '';
 const u=new URL(value.trim()),hosts={xiaohongshu:['xiaohongshu.com','xhslink.com'],behance:['behance.net'],pinterest:['pinterest.com','pinterest.cn','pin.it'],local:[]};
 if(u.protocol!=='https:'||u.username||u.password||!hosts[platform]?.some(h=>u.hostname===h||u.hostname.endsWith('.'+h)))throw Error('请填写对应平台的 HTTPS 收藏夹链接；也可先留空。');
 return u.href;
}
async function refresh(){const d=await database();collections=await request(d.transaction('collections').objectStore('collections').getAll());items=await request(d.transaction('images').objectStore('images').getAll());render();}
function render(){
 const select=$('reference-collection'),selected=select.value;select.replaceChildren(new Option('全部分组',''));for(const c of collections)select.append(new Option(`${names[c.platform]} · ${c.name}`,c.id));if(collections.some(c=>c.id===selected))select.value=selected;
 const active=collections.find(c=>c.id===select.value),description=$('collection-description');description.replaceChildren();
 if(active){description.append(document.createTextNode(`${active.name} · ${items.filter(x=>x.collectionId===active.id).length} 张图片。`));if(active.url){const link=node('a','打开来源收藏夹');link.href=active.url;link.target='_blank';link.rel='noopener noreferrer';description.append(link);}const remove=node('button','删除空分组','text-button');remove.type='button';remove.disabled=items.some(x=>x.collectionId===active.id);remove.addEventListener('click',async()=>{await write('collections',active.id,true);await refresh();status('空分组已删除。');});description.append(remove);}
 $('library-images').disabled=!active;
 urls.forEach(URL.revokeObjectURL);urls=[];const box=$('personal-image-grid');box.replaceChildren();
 const q=$('personal-image-search').value.trim().toLowerCase(),list=items.filter(i=>(!active||i.collectionId===active.id)&&(!q||i.name.toLowerCase().includes(q)));
 if(!list.length)box.append(node('p',collections.length?'该分组还没有图片。选择分组后，可批量添加 JPG、PNG、WebP。':'先创建一个收藏夹分组，链接和图片都可以以后再添加。','library-empty'));
 const pageSize=limit;for(const item of list.slice(0,pageSize)){
  const c=collections.find(c=>c.id===item.collectionId);if(!c)continue;
  const row=node('article',undefined,'personal-image'),image=node('img'),url=URL.createObjectURL(item.blob);urls.push(url);image.src=url;image.alt=item.name;image.loading='lazy';
  row.dataset.libraryId=item.id;const caption=node('p',item.name),meta=node('small',`${names[c.platform]} · ${c.name}`),use=node('button','选择为提炼对象','button secondary');use.type='button';use.addEventListener('click',async()=>{use.disabled=true;try{await window.Studio.useLibrary({...item,collection:c},$('library-use-role').value);status('已加入当前角色条件。');}catch(e){status(e.message||'选择失败，请重试。');}finally{use.disabled=false;}});
  const remove=node('button','移除图片','text-button');remove.type='button';remove.addEventListener('click',async()=>{await write('images',item.id,true);if(assetCache.has(item.id)){URL.revokeObjectURL(assetCache.get(item.id).url);assetCache.delete(item.id);}document.dispatchEvent(new CustomEvent('reference-image-removed',{detail:{id:item.id}}));await refresh();status('图片已从参考库删除；使用该图的当前或历史角色可能需要重新关联原图。');});row.append(image,caption,meta,use,remove);box.append(row);
 }
 if(list.length>pageSize){const more=node('button','显示更多图片','button secondary');more.type='button';more.addEventListener('click',()=>{limit+=30;render();});box.append(more);}
 $('personal-library-count').textContent=`${collections.length} 个分组 · ${items.length} 张图片`;
}
$('create-reference-collection').addEventListener('click',async()=>{try{const name=$('collection-name').value.trim(),platform=$('collection-platform').value;if(!name)throw Error('请先给参考库分组命名。');const url=sourceUrl($('collection-url').value,platform),id=uid();await write('collections',{id,name:name.slice(0,80),platform,url});await refresh();$('reference-collection').value=id;render();$('collection-name').value='';$('collection-url').value='';status('分组已创建；链接和图片都可以后续添加。');}catch(e){status(e.message||'无法保存分组。');}});
$('save-collection-url').addEventListener('click',async()=>{try{const c=collections.find(c=>c.id===$('reference-collection').value);if(!c)throw Error('请先选择一个分组。');c.url=sourceUrl($('collection-url').value,c.platform);await write('collections',c);await refresh();status('来源链接已更新。链接仅用于来源记录，不会自动抓取收藏夹。');}catch(e){status(e.message);}});
$('library-images').addEventListener('change',async e=>{const collectionId=$('reference-collection').value;if(!collectionId)return;const files=[...e.target.files];let added=0,failed=0;e.target.disabled=true;try{for(const file of files){try{if(file.size>10*1024*1024||!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error();const bitmap=await createImageBitmap(file);bitmap.close();await write('images',{id:uid(),collectionId,name:file.name.slice(0,120),blob:file});added++;}catch{failed++;}}await refresh();status(`已添加 ${added} 张图片${failed?`，${failed} 张格式不支持、过大或保存失败`:''}。图片只保存在当前浏览器，尚未发送给 AI。`);}finally{e.target.value='';e.target.disabled=!$('reference-collection').value;}});
$('reference-collection').addEventListener('change',()=>{render();const c=collections.find(c=>c.id===$('reference-collection').value);$('collection-url').value=c?.url||'';if(c)$('collection-platform').value=c.platform;});$('personal-image-search').addEventListener('input',()=>{limit=30;render();});
$('open-personal-library').addEventListener('click',()=>window.ToolDialogs.open('personal-library-dialog',$('open-personal-library')));
$('personal-library-dialog').addEventListener('tool-open',()=>refresh().catch(()=>status('浏览器无法使用参考库存储，请检查浏览器存储权限。')));
window.PersonalLibrary={asset:async id=>{if(assetCache.has(id))return assetCache.get(id);const d=await database(),i=await request(d.transaction('images').objectStore('images').get(id));if(!i)return null;const result={id:i.id,name:i.name,url:URL.createObjectURL(i.blob)};assetCache.set(id,result);return result;}};
})();
