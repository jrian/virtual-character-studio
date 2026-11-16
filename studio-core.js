(function(root){
'use strict';
const fields={
 faceShape:['脸型','鹅蛋脸','圆脸','方脸','长脸','心形脸'],
 jaw:['下颌','柔和圆润','清晰利落','宽下颌','窄下颌'],
 cheekbones:['颧骨','平缓颧骨','较高颧骨','饱满面颊'],
 brows:['眉形','平直眉','自然弧眉','细长眉','浓眉'],
 eyes:['眼形','杏眼','圆眼','细长眼','眼尾微扬'],
 eyelids:['眼睑','单眼皮','内双','双眼皮'],
 eyeSpacing:['眼距','适中眼距','较宽眼距','较窄眼距'],
 nose:['鼻形','平缓鼻梁','挺直鼻梁','圆润鼻尖','较宽鼻翼'],
 lips:['唇形','自然唇形','饱满双唇','薄唇','清晰唇峰'],
 skinTone:['肤色','浅肤色','自然中等肤色','小麦肤色','深肤色'],
 skinTexture:['肤质','自然肌理','雀斑','轻微细纹','清透肤质'],
 hairStyle:['发型细节','利落短发','齐耳波波头','齐肩直发','长直发','长卷发','束起长发'],
 hairColor:['发色','自然黑','深棕','浅棕','金色','银白','红棕']
};
const copy=x=>JSON.parse(JSON.stringify(x));
const text=(x,n=500)=>typeof x==='string'?x.slice(0,n):'';
function normalize(source){
 const s=source&&typeof source==='object'?source:{};
 const result={features:{},mode:s.mode==='redesign'?'redesign':'preserve',strategy:s.strategy==='redesign'?'redesign':'fill',instructions:text(s.instructions,1500),sources:{person:'gallery',outfit:'gallery'},uploads:{},observations:{},anchor:null};
 for(const key of Object.keys(fields)){
  const f=s.features?.[key];if(!f||typeof f.value!=='string'||!f.value.trim())continue;
  result.features[key]={value:f.value.trim().slice(0,120),locked:f.locked===true,origin:['manual','extracted','ai'].includes(f.origin)?f.origin:'manual',source:text(f.source,120)};
 }
 for(const role of ['person','outfit'])if(['gallery','upload','none'].includes(s.sources?.[role]))result.sources[role]=s.sources[role];
 for(const role of ['person','outfit','style']){
  const u=s.uploads?.[role];if(u&&/^[a-f0-9]{32}$/.test(u.id))result.uploads[role]={id:u.id,name:text(u.name,120)};
  if(typeof s.observations?.[role]==='string')result.observations[role]=text(s.observations[role],800);
 }
 if(s.anchor&&/^[a-f0-9]{32}$/.test(s.anchor.id))result.anchor={id:s.anchor.id,name:text(s.anchor.name,120)};
 return result;
}
function merge(source,suggestions,strategy='fill',origin='ai'){
 const state=normalize(source),conflicts=[];
 for(const key of Object.keys(fields)){
  const value=text(suggestions?.[key],120).trim();if(!value)continue;
  const old=state.features[key];
  if(old?.value===value)continue;
  if(old&&(old.locked||old.origin==='manual'||strategy==='fill')){conflicts.push({key,existing:old.value,suggested:value,locked:old.locked});continue;}
  state.features[key]={value,locked:false,origin};
 }
 return {state,conflicts};
}
function effective(c){const result=copy(c),s=normalize(c.studio);if(s.sources.person!=='gallery')result.reference=null;if(s.sources.outfit!=='gallery')result.outfit=null;return result;}
function prompts(c,name){
 const s=normalize(c.studio),e=effective(c);
 const appearance=Object.entries(s.features).map(([key,f])=>`${fields[key][0]}：${f.value}${f.locked?'（锁定）':''}`).join('；');
 const identity=`人物身份：${name}，${c.age}岁，${c.gender}；${c.world}，${c.role}。${appearance||'脸部未限定，保持自然比例'}。${s.features.hairStyle?'':`发型：${c.hairstyle&&c.hairstyle!=='基础发型'?c.hairstyle:c.hair}。`}`;
 const refs=[];
 if(s.sources.person==='upload'&&s.uploads.person)refs.push(`人物参考：上传图片「${s.uploads.person.name}」；${s.mode==='preserve'?'以该图的脸部身份为基础，仅修改明确指定的特征':'仅借鉴已确认特征，设计新的原创人物，不复现原人物身份'}。`);
 if(e.reference)refs.push(`人物参考：FACE REFERENCE ${e.reference.id}，${e.reference.full}；${s.mode==='redesign'?'仅借鉴已确认特征，重新设计原创人物':'保留参考人物的身份特征，明确指定的修改除外'}。`);
 if(s.mode==='preserve'&&s.anchor)refs.push(`已确认的身份参考：${s.anchor.name}。`);
 const wardrobe=`服装造型：${s.sources.outfit==='upload'&&s.uploads.outfit?'参考上传服装「'+s.uploads.outfit.name+'」'+(s.observations.outfit?'，'+s.observations.outfit:''):e.outfit?e.outfit.code+'，'+e.outfit.keywords:c.wardrobe}。${c.fashionCategory?'服装类别：'+c.fashionCategory.name+'。':''}${c.fashionAttribute?'服装属性：'+c.fashionAttribute.name+'。':''}辨识物：${c.signature||'未限定'}。`;
 const style=`画面风格：${s.uploads.style?'借鉴风格参考「'+s.uploads.style.name+'」的色彩、材质与光影，不转移人物身份'+(s.observations.style?'；'+s.observations.style:''):'干净背景，清晰展示人物面部与服装'}。`;
 const changes=`允许变化：${s.instructions||'未锁定的细节可在创作目标内完善'}。${c.notes?'创作者要求：'+c.notes:''}`;
 const negative='避免项：不要覆盖锁定特征，不将姿势或表情当作永久身份，不增加无关人物，避免重复面孔、五官错位与服装混用。';
 const consistency=`角色标签：CHARACTER_${String(name).replace(/[^\p{L}\p{N}_]/gu,'_')}；造型标签：LOOK_01。\n${identity}\n${refs.join('\n')}\n${wardrobe}\n连续性：固定已确认的脸部比例、发际线与辨识物；表情、动作和场景另行描述。\n${changes}\n在即梦／Seedance 中，将参考说明替换为实际上传素材的引用标签；本工具不虚构平台素材编号。`;
 return {positive:[identity,...refs,...(s.observations.person?[`已确认可见特征：${s.observations.person}`]:[]),wardrobe,style,changes,'单人角色参考图，正面或四分之三视角，自然表情。'].join('\n'),negative,consistency};
}
function decorate(profile,kind='local',previous=null){
 const p=copy(profile);p.schemaVersion=2;p.kind=kind;p.prompts=prompts(p.conditions,p.name);
 p.version={number:(previous?.version?.number||0)+1,parentId:previous?.id||null};
 p.sections=p.sections.filter(([h])=>!['中文生图提示词','避免项','角色一致性提示词'].includes(h));
 p.sections.push(['中文生图提示词',p.prompts.positive],['避免项',p.prompts.negative],['角色一致性提示词',p.prompts.consistency]);
 return p;
}
root.StudioCore={fields,normalize,merge,effective,prompts,decorate};
if(typeof module!=='undefined')module.exports=root.StudioCore;
})(typeof window==='undefined'?globalThis:window);
