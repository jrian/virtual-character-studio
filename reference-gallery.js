(()=>{
'use strict';
const $=id=>document.getElementById(id);
function element(tag,text,cls){const e=document.createElement(tag);if(text)e.textContent=text;if(cls)e.className=cls;return e;}
function picture(item,{large=false}={}){
 const frame=element('div',null,'reference-image '+(item.kind==='outfit'?'outfit-image':'portrait-image'));
 const img=new Image();img.hidden=true;img.alt=item.label;img.loading=large?'eager':'lazy';img.decoding='async';img.referrerPolicy='no-referrer';
 const status=element('span','滚动到此处加载图片','image-status');const retry=element('button','重试图片','image-retry');retry.type='button';retry.hidden=true;
 const url=large?item.full:item.thumb;
 function load(){status.textContent='图片加载中';retry.hidden=true;img.hidden=true;img.loading='eager';if(typeof url==='function')Promise.resolve().then(url).then(src=>{if(!src)throw Error('图片缺失');img.src=src;}).catch(()=>img.dispatchEvent(new Event('error')));else img.src=url;}
 img.addEventListener('load',()=>{img.hidden=false;status.hidden=true;retry.hidden=true;frame.classList.add('image-ready');});
 img.addEventListener('error',()=>{img.hidden=true;status.hidden=false;status.textContent='图片暂时无法加载';retry.hidden=false;frame.classList.remove('image-ready');});
 retry.addEventListener('click',()=>{status.hidden=false;load();});
 frame.append(img,status,retry);frame.loadImage=load;
 if(large)load();else{const observer=new IntersectionObserver(entries=>{if(entries.some(x=>x.isIntersecting)){load();observer.disconnect();}},{rootMargin:'100px'});observer.observe(frame);frame.stopObserving=()=>observer.disconnect();}
 return frame;
}
const dialog=element('dialog',null,'image-dialog');dialog.setAttribute('aria-labelledby','image-dialog-title');
const dialogHead=element('div',null,'image-dialog-head'),title=element('h2');title.id='image-dialog-title';const close=element('button','关闭','button secondary compact');close.type='button';close.addEventListener('click',()=>dialog.close());dialogHead.append(title,close);
const media=element('div',null,'image-dialog-media'),description=element('p',null,'field-note'),actions=element('div',null,'image-dialog-actions');dialog.append(dialogHead,media,description,actions);document.body.append(dialog);
let returnFocus;
dialog.addEventListener('close',()=>{media.replaceChildren();returnFocus?.focus();});
function preview(item,onChoose){returnFocus=document.activeElement;title.textContent=item.label;description.textContent=[item.categoryText,item.details||item.label].filter(Boolean).join(' · ');media.replaceChildren(picture(item,{large:true}));const choose=element('button','选择这张参考图','button');choose.type='button';choose.addEventListener('click',()=>{onChoose();dialog.close();});const link=element('a','原站原图');if(typeof item.full==='function')Promise.resolve().then(item.full).then(url=>{if(url)link.href=url;}).catch(()=>link.remove());else link.href=item.full;link.target='_blank';link.rel='noopener noreferrer';actions.replaceChildren(choose,link);dialog.showModal();}
function mount(container,{kind,onSelect,selectionLabel}){
 let items=[],selectedId='',page=0,shown=6;const perPage=6;const browse=element('label','浏览方式','browse-mode'),mode=element('select');mode.setAttribute('aria-label','浏览方式');mode.append(new Option('连续看图','continuous'),new Option('分页浏览','pages'));browse.append(mode);const more=element('button','加载更多图片','button secondary'),sentinel=element('div',null,'gallery-sentinel');more.type='button';
 const grid=element('div',null,'reference-grid'),empty=element('p','没有匹配的参考图，试试其他筛选条件。','gallery-empty');
 const pager=element('div',null,'gallery-pager'),prev=element('button','上一页','button secondary compact'),next=element('button','下一页','button secondary compact'),count=element('span');count.setAttribute('aria-live','polite');prev.type=next.type='button';pager.append(prev,count,next);container.replaceChildren(browse,grid,empty,pager,more,sentinel);
 function checked(id){return Array.isArray(selectedId)?selectedId.includes(id):selectedId===id;}
 function draw(append=false){if(!append){grid.querySelectorAll('.reference-image').forEach(x=>x.stopObserving?.());grid.replaceChildren();}const continuous=mode.value==='continuous',start=continuous?grid.children.length:page*perPage,end=continuous?shown:start+perPage;items.slice(start,end).forEach(item=>{
  const card=element('div',null,'reference-card');card.dataset.referenceId=item.id;const choose=element('button',null,'reference-choice');choose.type='button';choose.setAttribute('aria-label',`选择${(item.kind||kind)==='outfit'?'服装':'人物'} ${item.label}`);choose.setAttribute('aria-pressed',String(checked(item.id)));
  const itemKind=item.kind||kind;const img=picture({...item,kind:itemKind}),name=element('span',item.label,'reference-label'),state=element('span',checked(item.id)?(selectionLabel?.(item.id)||'已选择'):'选择','reference-choice-state');choose.append(img,name);if(item.categoryText)choose.append(element('span',item.categoryText,'reference-category-label'));choose.append(state);choose.addEventListener('click',()=>onSelect(item.id));
  // Retry is its own button, never nested inside the selection button.
  const retry=img.querySelector('.image-retry');retry.remove();card.append(choose,retry);
  const zoom=element('button','放大查看','text-button reference-zoom');zoom.type='button';zoom.setAttribute('aria-label',`放大查看 ${item.label}`);zoom.addEventListener('click',()=>preview({...item,kind:item.kind||kind},()=>onSelect(item.id)));card.append(zoom);grid.append(card);
 });empty.hidden=items.length>0;const pages=Math.ceil(items.length/perPage);count.textContent=continuous?`已显示 ${Math.min(shown,items.length)} / ${items.length} 张`:pages?`${page+1} / ${pages} 页 · ${items.length} 张`:'0 张';prev.hidden=next.hidden=continuous;more.hidden=!continuous||shown>=items.length;sentinel.hidden=more.hidden;prev.disabled=page===0;next.disabled=page+1>=pages;}
 function loadMore(){if(mode.value!=='continuous'||shown>=items.length)return;shown+=perPage;draw(true);}more.addEventListener('click',loadMore);mode.addEventListener('change',()=>{page=0;shown=perPage;draw();});const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)&&!more.hidden)loadMore();},{rootMargin:'100px'});observer.observe(sentinel);
 prev.addEventListener('click',()=>{page--;draw();prev.focus();});next.addEventListener('click',()=>{page++;draw();next.focus();});
 return {render(nextItems,id,{reset=false}={}){items=nextItems;selectedId=id||'';if(reset)shown=perPage;shown=Math.min(Math.max(perPage,shown),Math.max(perPage,items.length));page=reset?0:Math.min(page,Math.max(0,Math.ceil(items.length/perPage)-1));draw();},select(id){selectedId=id;grid.querySelectorAll('.reference-card').forEach(card=>{const active=checked(card.dataset.referenceId);card.querySelector('.reference-choice').setAttribute('aria-pressed',String(active));card.querySelector('.reference-choice-state').textContent=active?(selectionLabel?.(card.dataset.referenceId)||'已选择'):'选择';});}};
}
function selected(container,item,onClear){container.querySelectorAll('.reference-image').forEach(x=>x.stopObserving?.());container.replaceChildren();container.hidden=!item;if(!item)return;const body=element('div');body.append(element('strong',`已选${item.kind==='outfit'?'服装':'人物'}：${item.label}`),element('p',item.details,'field-note'));if(onClear){const clear=element('button','取消选择','text-button');clear.type='button';clear.addEventListener('click',onClear);body.append(clear);}container.append(picture(item),body);}
function profile(container,c){container.replaceChildren();const entries=[];if(c.reference)entries.push({kind:'portrait',label:`人物 ${c.reference.id}`,thumb:c.reference.thumb,full:c.reference.full});if(c.outfit)entries.push({kind:'outfit',label:`服装 ${c.outfit.code}`,thumb:c.outfit.origin+'thumbs/'+c.outfit.code+'.webp',full:c.outfit.originImage});if(!entries.length)return;container.className='profile-references';const heading=element('h3','本次生成使用的参考图');container.append(heading);const row=element('div',null,'profile-reference-row');entries.forEach(item=>{const fig=element('figure');fig.append(picture(item),element('figcaption',item.label));const link=element('a','查看原图');link.href=item.full;link.target='_blank';link.rel='noopener noreferrer';fig.append(link);row.append(fig);});container.append(row);}
function categories(container,groups,onChange){
 const controls=[];
 groups.forEach(group=>{const fieldset=element('fieldset',null,'category-group');fieldset.dataset.categoryGroup=group.id;fieldset.append(element('legend',group.label));const row=element('div',null,'category-options');group.options.forEach(option=>{const button=element('button',null,'category-button');button.type='button';button.dataset.value=option.value;button.append(element('span',option.label),element('span','0','category-count'));button.addEventListener('click',()=>onChange(group.id,option.value));row.append(button);controls.push({group,option,button});});fieldset.append(row);container.append(fieldset);});
 return {update(countFor){controls.forEach(({group,option,button})=>{const count=countFor(group.id,option.value),active=$(group.id).value===option.value;button.setAttribute('aria-pressed',String(active));button.disabled=!active&&option.value!=='all'&&count===0;button.querySelector('.category-count').textContent=count;button.setAttribute('aria-label',`${option.label}，${count} 张`);});}};
}
function showMode(mode){for(const key of ['portrait','outfit','cross'])$(key+'-browser').hidden=key!==mode;document.querySelectorAll('[data-gallery-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.galleryMode===mode)));}
document.querySelectorAll('[data-gallery-mode]').forEach(b=>b.addEventListener('click',()=>showMode(b.dataset.galleryMode)));
window.ReferenceGallery={mount,selected,profile,showMode,categories};
})();
