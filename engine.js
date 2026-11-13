(function(root){
'use strict';
const worlds = {
 '现代都市':{place:'城市旧街区',event:'一次社区记录计划',goal:'让容易被忽略的日常被看见',conflict:'追求真实与外界对效率的要求'},
 '近未来':{place:'人机共居的沿海城市',event:'一段被系统误删的生活记录',goal:'为无法被数据描述的人保留位置',conflict:'技术带来的便利与个人选择权'},
 '东方幻想':{place:'山海之间的渡口小城',event:'一封来自失落故乡的信',goal:'找回故乡与世人之间断开的联系',conflict:'守护承诺与踏出熟悉天地'},
 '异世冒险':{place:'连接数个国度的边境驿站',event:'一张没有终点的委托单',goal:'找到旅程背后真正需要帮助的人',conflict:'独自行动的习惯与团队的信任'},
 '架空历史':{place:'商旅汇聚的古城',event:'一册缺失末页的行旅手记',goal:'让被改写的故事重新拥有讲述者',conflict:'保护身边的人与说出事实的代价'}
};
const roles={
 '生活记录者':['发现生活的细节','每周记录一个被忽略的地方','环境细节与叙事节奏'],
 '知识分享者':['把复杂知识讲清楚','用一个日常问题展开一次解释','观察、验证与表达'],
 '独立创作者':['把经历转化成作品','展示一件作品从失败到完成的过程','创作与复盘'],
 '旅行探索者':['在陌生环境中寻找联系','沿一条路线认识三种不同生活','路线判断与现场应变'],
 '调查员':['把零散线索连成事实','围绕一个物件追溯它的来历','倾听、观察与线索比对'],
 '守护者':['在危机中保护他人','面对一次无法两全的选择','风险判断与协作'],
 '研究者':['理解未知的规律','用一次实验修正原先的判断','研究、记录与耐心求证']
};
const traits={
 '温柔':['先听完对方的话再给建议','“慢一点也没关系，我们先把这件事看清楚。”'],
 '理性':['遇到分歧先列出已知事实','“先确认我们知道什么，再决定下一步。”'],
 '好奇':['总会为一个不起眼的细节多问一句','“如果换个角度，会不会有新的答案？”'],
 '幽默':['用轻巧的比喻化解尴尬','“计划又改了，看来生活比我更有创意。”'],
 '独立':['习惯先独自处理困难，再决定是否求助','“我想先试一次，再认真听你的建议。”'],
 '热情':['主动邀请沉默的人加入话题','“来吧，第一步我陪你一起。”'],
 '克制':['先把情绪写下来，再开口表达','“我需要一点时间，但这件事我会认真回应。”'],
 '坚定':['在压力下仍会把承诺落实到行动','“既然答应了，就把它做完。”']
};
const wardrobes={
 '日常简约':'低饱和上衣、利落长裤与便于行动的平底鞋，轮廓干净，避免繁杂装饰',
 '复古文艺':'有织物肌理的外套、衬衣与轻便挎包，以旧物和细小修补痕迹表现生活经验',
 '运动机能':'活动方便的分层服装、实用口袋与耐磨鞋履，让装备服务行动',
 '职业利落':'剪裁合身的外套、纯色内搭与简洁配饰，保持清晰的肩颈线条',
 '东方衣装':'交领或对襟上衣、适合行动的下装与织物腰带，细节与所选世界背景统一',
 '幻想旅装':'适合长途移动的分层外衣、短靴与小型行囊，保留与身份相符的使用痕迹'
};
function pick(a,rng){return a[Math.floor(rng()*a.length)];}
function generate(c, rng=Math.random){
 const world=worlds[c.world]||worlds['现代都市'], role=roles[c.role]||roles['独立创作者'];
 const selected=(c.traits||[]).filter(x=>traits[x]);
 const traitList=selected.length?selected:['好奇','坚定'];
 const surname=pick(['林','沈','许','陆','江','程','叶','苏'],rng);
 const given=pick(['知遥','以宁','望舒','言川','听澜','予安','见山','时雨','清和','书禾','星野','怀青'],rng);
 const name=(c.name||'').trim()||surname+given;
 const habit=pick(['会在手账页脚记录当天听到的一句话','出门前会确认随身物品，回家后却总把钥匙放错位置','紧张时会用拇指摩挲随身物件的边缘','习惯提前到约定地点，留出观察周围的时间'],rng);
 const flaw=pick(['不容易开口求助，常把可以分担的事留给自己','对重要的事情准备过度，偶尔错过及时行动的机会','习惯照顾他人的感受，有时会延后表达自己的需要','太珍惜已经建立的关系，面对改变时会犹豫'],rng);
 const hair=c.hairstyle&&c.hairstyle!=='基础发型'?c.hairstyle:c.hair;
 const sections=[
 ['人物概览',`${name}，${c.age}岁，${c.gender}。在${c.world}背景中，作为${c.role}生活于${world.place}。核心能力是${role[2]}；最在意的是${world.goal}。`],
 ['外貌与造型',`发型：${hair}。服装：${wardrobes[c.wardrobe]||c.wardrobe}。辨识点：${c.signature||'一件有使用痕迹的随身小物'}。这些外观特征作为后续创作的固定锚点。${c.reference?'所选外观参考仅用于发型与造型，不据此推断人物年龄或性格。':''}`],
 ...(c.outfit? [['服装库绑定',`选中服装：${c.outfit.rendering} · ${c.outfit.category} · ${c.outfit.code}。原始服装关键词：${c.outfit.keywords}。具体条目优先于整体服装方向。来源：${c.outfit.bindings.map(x=>`${x.source==='opc'?'Open Pose & Costume':'AI Library'} / ${x.code}`).join('；')}。原站：${c.outfit.origin}。参考原图：${c.outfit.originImage}。本工具仅绑定元数据与链接。`]]:[]),
 ...(c.fashionCategory||c.fashionAttribute?[['服装属性细化',`Fashionpedia 分类：${c.fashionCategory?.name||'未限定'}。属性：${c.fashionAttribute?.name||'未限定'}。这是创作者所选约束，不是从图片推断。来源：https://github.com/cvdfoundation/fashionpedia 。分类与属性标注来源遵循 CC BY 4.0。`]]:[]),
 ['性格与行为',`核心性格：${traitList.join('、')}。${traitList.map(t=>traits[t][0]).join('；')}。生活习惯：${habit}。内在弱点：${flaw}。`],
 ['经历与动机',`${name}原本把${role[0]}当作日常习惯，直到${world.event}，开始主动承担更大的责任。当前目标是${world.goal}。主要矛盾来自${world.conflict}；成长方向是学会向值得信赖的人说明自己的需要。`],
 ['声音与表达',`表达方式：${c.voice}。示例台词：${traits[traitList[0]][1]} 与熟人相处时会保留细小的停顿，让情绪通过具体的行动和回应被看见。`],
 [c.purpose==='虚拟博主'?'内容方向':c.purpose==='小说角色'?'叙事切入点':'互动与任务',c.purpose==='虚拟博主'?`内容主线：${role[1]}。固定栏目可以围绕「一个问题、一段亲历、一次复盘」展开。首期选题：${world.event}之后，第一次尝试把经历完整记录下来。交流原则：区分个人体验与已经核实的信息。`:c.purpose==='小说角色'?`开场让角色在${world.event}中做出一个小而有代价的决定。以${world.conflict}推动中段，让${flaw}影响关键关系；结尾通过一次主动求助或坦诚表达完成变化。`:`任务起点：围绕${world.event}提供线索。玩家可以选择独自调查或与角色协作，分别影响信息获取方式与信任关系。角色用${role[2]}提供支持，并保留自己的目标与判断。`],
 ['角色一致性提示词',`原创虚构角色「${name}」，${c.age}岁，${c.gender}，${c.world}背景，身份${c.role}，${hair}，${c.wardrobe}穿搭${c.outfit?'，服装固定为所选条目 '+c.outfit.code+'（'+c.outfit.keywords+'）':''}${c.fashionCategory?'，服装类别 '+c.fashionCategory.name:''}${c.fashionAttribute?'，服装属性 '+c.fashionAttribute.name:''}，辨识物${c.signature||'有使用痕迹的随身小物'}。人物气质：${traitList.join('、')}。跨画面固定脸部比例、发际线、发长与辨识物；先建立正面、侧面与四分之三视角参考。此提示词为本工具组合生成。`]
 ];
 if(c.notes?.trim()) sections.push(['创作者补充约束',c.notes.trim()]);
 if(c.reference) sections.push(['外观参考来源',`FACE REFERENCE · ${c.reference.id}\n原始标签：${c.reference.style||c.reference.hair}\n原图链接：${c.reference.full}\n参考库：https://ai-portrait-gallery.pages.dev/\n来源标注 CC0；图片留在原站，本工具仅保存公开元数据与链接。`]);
 return {id:Date.now().toString(36)+Math.random().toString(36).slice(2,8),name,tagline:`${c.role} · ${traitList.join(' / ')}`,createdAt:new Date().toISOString(),conditions:JSON.parse(JSON.stringify(c)),sections};
}
function markdown(p){return `# ${p.name}\n\n${p.tagline}\n\n`+p.sections.map(([h,t])=>`## ${h}\n\n${t}`).join('\n\n')+'\n\n---\n由角色工坊本地规则组合生成；请在创作中进一步完善。\n';}
root.CharacterEngine={generate,markdown,worlds,roles,traits,wardrobes};
})(typeof window==='undefined'?globalThis:window);
