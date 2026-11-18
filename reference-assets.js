(function(root){
'use strict';
const api={
 thumb:item=>item.thumb||item.origin+'thumbs/'+item.code+'.webp',
 source:item=>item.sourceName||item.bindings?.map(b=>({opc:'Open Pose & Costume',ailib:'AI Library'}[b.source]||b.source)).join(' / ')||'FACE REFERENCE',
 gender:item=>item.gender==='male'?'男性':item.gender==='female'?'女性':'未标注',
 matchesGender:(item,value)=>value==='all'||(item.gender||'unspecified')===value,
 fields:item=>({attribution:item.attribution,licenseUrl:item.licenseUrl,sourceUrl:item.sourceUrl,authorUrl:item.authorUrl}),
 aiAllowed:item=>item?.aiImageAllowed!==false
};root.ReferenceAssets=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
