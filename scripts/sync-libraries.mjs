// Refresh public metadata only, from pinned upstream versions. Never downloads images.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const inputs=[
 {key:'opc-realistic',repo:'hongye007/open-pose-costume',ref:'16e378aaf0dd021b8e06001b4e1ed781580287ba',path:'data/source/costume.json'},
 {key:'opc-anime',repo:'hongye007/open-pose-costume',ref:'16e378aaf0dd021b8e06001b4e1ed781580287ba',path:'data/source/costume-anime.json'},
 {key:'ailib',repo:'opensegra/ai-library',ref:'22ba148db7e7714920b08fecd9b33aa564881915',path:'data/catalogue.json'},
 {key:'fashionpedia',repo:'KMnP/fashionpedia-api',ref:'1ef732050e15d446c38d58ef945ccadc28c59328',path:'data/demo/category_attributes_descriptions.json'}
];
const cache={'opc-realistic':'/tmp/opc-costume.json','opc-anime':'/tmp/opc-anime.json',ailib:'/tmp/ai-catalogue.json',fashionpedia:'data/fashionpedia-taxonomy.json'};
const raw={},manifest=[];
for(const item of inputs){
 const url=`https://raw.githubusercontent.com/${item.repo}/${item.ref}/${item.path}`;
 let text;if(process.argv.includes('--from-cache'))text=await readFile(cache[item.key],'utf8');else {const res=await fetch(url,{signal:AbortSignal.timeout(120000)});if(!res.ok)throw Error(`${res.status}: ${url}`);text=await res.text();}
 raw[item.key]=JSON.parse(text);manifest.push({...item,url,storedInputSha256:createHash('sha256').update(text).digest('hex')});
}
const cat={'春':'春季','夏':'夏季','秋':'秋季','冬':'冬季','ランジェリー':'内衣','パーティ':'派对','水着':'泳装','セクシー':'魅力风格'};
const all=new Map();
for(const [key,rendering,origin] of [['opc-realistic','写实','https://ai-costume-gallery.pages.dev/'],['opc-anime','动漫','https://ai-costume-anime-gallery.pages.dev/']]){
 for(const x of raw[key]){const id=`${rendering==='写实'?'realistic':'anime'}:${x.id}`;if(!x.id||!cat[x['カテゴリ']])throw Error('Unexpected costume schema');all.set(id,{id,code:x.id,category:cat[x['カテゴリ']],rendering,keywords:x['キーワード'],origin,originImage:origin+x['原寸'],sources:['opc'],bindings:[{source:'opc',code:x.id}]});}
}
for(const x of raw.ailib.costumes){const original=x.thumb.split('/').pop().replace(/\.webp$/,'');const id='realistic:'+original;const item=all.get(id);if(!item)throw Error(`Unknown origin ${id}`);item.sources.push('ailib');item.bindings.push({source:'ailib',code:x.id});}
const taxonomy=raw.fashionpedia;if(taxonomy.categories.length!==46||taxonomy.attributes.length!==294)throw Error('Unexpected Fashionpedia taxonomy');
const output={version:1,retrievedAt:'2026-11-13',items:[...all.values()],taxonomy,sources:[
 {id:'opc',name:'Open Pose & Costume',repo:'https://github.com/hongye007/open-pose-costume',count:raw['opc-realistic'].length+raw['opc-anime'].length,scope:'上游服装公开元数据；排除需单独授权的自建素材',terms:'仅保存事实性编号、分类、关键词和链接；未复制图片。图片适用原站条款。'},
 {id:'ailib',name:'AI Library',repo:'https://github.com/opensegra/ai-library',count:raw.ailib.costumes.length,scope:'服装元数据；与上述写实库存按原始编号去重',terms:'保留仓库来源和上游映射；未复制图片。'},
 {id:'fashionpedia',name:'Fashionpedia',repo:'https://github.com/cvdfoundation/fashionpedia',count:taxonomy.categories.length+taxonomy.attributes.length,scope:'46类服装/部件、294项属性；不含人物照片、分割标注',terms:'仅绑定公开分类与属性名称，来源为官方 API 仓库的类别说明。'}
]};
await mkdir('data',{recursive:true});await writeFile('data/bound-libraries.js','/* Public metadata snapshot. Source versions: library-manifest.json. No image bytes. */\nwindow.BOUND_LIBRARIES = '+JSON.stringify(output)+';\n');
await writeFile('data/bound-libraries.json',JSON.stringify(output)+'\n');
await writeFile('data/library-manifest.json',JSON.stringify({version:1,retrievedAt:'2026-11-13',ingestionMode:process.argv.includes('--from-cache')?'cached metadata (formatting may differ from source)':'pinned remote metadata',uniqueOutfits:all.size,sourceEntries:raw['opc-realistic'].length+raw['opc-anime'].length+raw.ailib.costumes.length,taxonomy:{categories:46,attributes:294},inputs:manifest},null,2)+'\n');console.log(`Bound ${all.size} unique outfit records (${raw.ailib.costumes.length} shared records deduplicated), 46 categories and 294 attributes.`);
