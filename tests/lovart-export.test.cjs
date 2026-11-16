const {test}=require('node:test'),assert=require('node:assert/strict'),core=require('../studio-core.js');
const c={name:'新角色',age:'32',gender:'男性',purpose:'小说角色',role:'调查员',world:'近未来',hair:'短发',hairstyle:'基础发型',wardrobe:'运动机能',signature:'旧相机',traits:['理性','独立'],voice:'平静清晰',notes:'保留旧相机',reference:{id:'OLD_FACE',full:'https://example.org/inactive.png'},outfit:{id:'OUTFIT1',code:'OUTFIT1',keywords:'denim coat',originImage:'https://example.org/outfit.png'},studio:{features:{faceShape:{value:'方脸',locked:true,origin:'manual'}},sources:{person:'upload',outfit:'gallery'},uploads:{person:{id:'a'.repeat(32),name:'人物.png'}},instructions:'修改衣服配色'}};
test('Lovart handoff exports active parameters and references without local paths or inactive gallery identities',()=>{
 const pack=core.lovartExport(c,'generate');for(const value of ['32','男性','调查员','理性、独立','平静清晰'])assert.ok(pack.text.includes(value),value);assert.match(pack.text,/方脸；锁定/);assert.match(pack.text,/修改衣服配色/);assert.match(pack.text,/一张单人角色预览图/);assert.match(pack.text,/人物.png/);assert.match(pack.text,/本次导出没有传输图片文件/);assert.match(pack.text,/OUTFIT1/);assert.doesNotMatch(pack.text,/OLD_FACE|inactive.png|localhost|\/media\/|LOVART_SECRET/);
 assert.equal(pack.references.length,2);assert.equal(pack.references[0].manual,true);
 const changed=core.lovartExport({...c,name:'已修改的新名字'},'prompt');assert.match(changed.text,/已修改的新名字/);assert.match(changed.text,/本次只输出文字，不生成图片/);
});
test('Lovart destination accepts actual project links and strips unrelated parameters',()=>{
 assert.equal(core.lovartTarget(''),'https://www.lovart.ai/');assert.equal(core.lovartTarget('https://www.lovart.ai/canvas?projectId=abc-12&token=ignore'),'https://www.lovart.ai/canvas?projectId=abc-12');
 for(const value of ['javascript:alert(1)','https://www.lovart.ai.evil.test/canvas?projectId=x','https://user:pass@www.lovart.ai/','http://www.lovart.ai/','https://www.lovart.ai/unknown','https://www.lovart.ai/canvas'])assert.throws(()=>core.lovartTarget(value));
});
