const {test}=require('node:test'),assert=require('node:assert/strict');
const core=require('../studio-core.js');
require('../engine.js');
const conditions={name:'测试角色',age:'25',gender:'女性',world:'现代都市',role:'生活记录者',hair:'短发',hairstyle:'基础发型',wardrobe:'日常简约',traits:['温柔'],purpose:'虚拟博主',signature:'银色发夹',studio:{}};
test('locks and manual features survive AI suggestions, conflicts require explicit adoption',()=>{
 const s={features:{faceShape:{value:'圆脸',locked:true,origin:'manual'},eyes:{value:'杏眼',origin:'manual'},nose:{value:'挺直鼻梁',origin:'extracted'}}};
 const merged=core.merge(s,{faceShape:'长脸',eyes:'圆眼',nose:'圆润鼻尖',hairColor:'深棕'},'redesign');
 assert.equal(merged.state.features.faceShape.value,'圆脸');assert.equal(merged.state.features.eyes.value,'杏眼');assert.equal(merged.state.features.nose.value,'圆润鼻尖');assert.equal(merged.conflicts.length,2);
 assert.equal(core.merge(s,{nose:'圆润鼻尖'},'fill').state.features.nose.value,'挺直鼻梁');
});
test('normalization excludes credentials, URLs and unknown features from portable state',()=>{
 const s=core.normalize({apiKey:'secret',features:{evil:{value:'x'},eyes:{value:'杏眼',locked:true}},uploads:{person:{id:'a'.repeat(32),name:'人物.png',url:'https://evil'}},anchor:{id:'javascript:alert(1)'}});
 assert.equal(s.apiKey,undefined);assert.equal(s.features.evil,undefined);assert.equal(s.uploads.person.url,undefined);assert.equal(s.anchor,null);
 assert.equal(Object.keys(core.fields).length,13);
});
test('source precedence excludes inactive gallery references and distinguishes identity modes',()=>{
 const c={...conditions,reference:{id:'FACE1',full:'https://source.example/face.png'},outfit:{id:'O1',code:'O1',keywords:'denim'},studio:{sources:{person:'upload',outfit:'upload'},uploads:{person:{id:'a'.repeat(32),name:'人像.png'},outfit:{id:'b'.repeat(32),name:'服装.png'}},mode:'redesign',anchor:{id:'c'.repeat(32),name:'旧身份'}}};
 assert.equal(core.effective(c).reference,null);assert.equal(core.effective(c).outfit,null);
 const prompt=core.prompts(c,'人物');assert.match(prompt.positive,/新的原创人物/);assert.doesNotMatch(prompt.positive,/FACE1|旧身份|O1/);
 c.studio.mode='preserve';assert.match(core.prompts(c,'人物').positive,/旧身份/);
});
test('each generated version snapshots conditions and exports authoritative prompt constraints',()=>{
 const c={...conditions,studio:{features:{faceShape:{value:'圆脸',locked:true}},observations:{person:'左眼下有一颗小痣'}}};
 const p=core.decorate(CharacterEngine.generate(c),'local');c.studio.features.faceShape.value='长脸';
 const p2=core.decorate(p,'ai',p);assert.equal(p.conditions.studio.features.faceShape.value,'圆脸');assert.equal(p2.version.number,2);assert.equal(p2.version.parentId,p.id);
 assert.match(p.prompts.positive,/圆脸（锁定）/);assert.match(p.prompts.positive,/小痣/);assert.match(CharacterEngine.markdown(p2),/Lovart AI/);
 assert.equal(p2.sections.filter(x=>x[0]==='角色一致性提示词').length,1);
});
