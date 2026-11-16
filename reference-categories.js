// Categories are derived only from public catalog labels; no visual inference.
(function(root){
'use strict';
const portraitFeatures=[
 {value:'all',label:'全部特征'},
 {value:'straight',label:'直发',pattern:/ストレート|直发|straight/i},
 {value:'curly',label:'卷发',pattern:/パーマ|カール|くるくる|卷发|卷|perm|curl/i},
 {value:'bob',label:'波波头',pattern:/ボブ|波波|bob/i},
 {value:'layered',label:'层次 / 狼尾',pattern:/レイヤー|ウルフ|ハッシュ|バタフライ|シャギー|层次|狼尾|layer|wolf/i},
 {value:'unspecified',label:'其他 / 未标注'}
];
const outfitGarments=[
 {value:'all',label:'全部单品'},
 {value:'dress',label:'连衣裙',pattern:/\b(?:(?:mini|midi|maxi)?dress|gown)\b/i},
 {value:'skirt',label:'半身裙',pattern:/\b(?:skirt|skort)\b/i},
 {value:'pants',label:'裤装',pattern:/\b(?:pants|trousers|shorts|jeans|leggings|joggers)\b/i},
 {value:'outerwear',label:'外套',pattern:/\b(?:coat|jacket|blazer|trench|cape|parka)\b/i},
 {value:'tops',label:'衬衫 / 上衣',pattern:/\b(?:shirt|blouse|top|tee|t-shirt|hoodie|sweatshirt|camisole)\b/i},
 {value:'knit',label:'针织',pattern:/\b(?:knit|knitted|knitwear|sweater|cardigan)\b/i},
 {value:'other',label:'其他单品'}
];
function portraitMatches(item,value){if(value==='all')return true;const text=item.style||'';if(value==='unspecified')return !portraitFeatures.some(x=>x.pattern?.test(text));return portraitFeatures.find(x=>x.value===value)?.pattern?.test(text)||false;}
function outfitMatches(item,value){if(value==='all')return true;const text=item.keywords||'';if(value==='other')return !outfitGarments.some(x=>x.pattern?.test(text));return outfitGarments.find(x=>x.value===value)?.pattern?.test(text)||false;}
const api={portraitFeatures,outfitGarments,portraitMatches,outfitMatches};root.ReferenceCategories=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
