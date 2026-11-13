# 角色与服装参考库调研

核对日期：2026-11-13。通过 GitHub 连接器检索，并读取仓库 README、LICENSE、来源说明。以下为调研结果；其后用户明确选择前三项绑定，当前实施状态见下文。没有安装其 Skill、执行第三方代码或复制图片。

| 资源 | 内容 | 对本工具的作用 | 来源许可边界 |
| --- | --- | --- | --- |
| [Open Pose & Costume](https://github.com/hongye007/open-pose-costume) | README列出343组姿势、2821套服饰、1539张人物参考 | 最接近人物＋服饰＋姿势的完整参考工作台 | MIT只覆盖代码；第三方素材与自建素材另有条款，不可把代码许可当作图片许可 |
| [AI Library](https://github.com/opensegra/ai-library) | README列出288种姿势、1407套服装；按颜色、衣物、材质、配饰检索；有3D人偶与GLB/BVH导出 | 适合作为服装描述与姿势检索的交互参考 | 仓库列出MIT；原始参考图来源需另核对 |
| [ai-gallery](https://github.com/klarkxy/ai-gallery) | 从人物、服装、姿势、深度图等源站按编号取参考的Agent Skill | 自动检索的实现参考，不是新增独立图库 | 代码文档为SATA 2.1；图片按各原站条款，来源有重叠 |
| [SFHQ](https://github.com/SelfishGene/SFHQ-dataset) | 约42.5万张1024×1024合成人脸，含关键点与分割数据 | 大规模人脸候选池，需自行筛选和整理 | 仓库为MIT；图片下载分布于Kaggle，实际接入时另核对下载批次条款 |
| [DiceBear](https://github.com/dicebear/dicebear) | 根据种子和外观参数生成SVG头像 | 适合非写实头像，可本地生成，不是写真人脸照片库 | 代码MIT，具体头像风格各自许可 |
| [Character Card V2](https://github.com/malfoyslastname/character-card-spec-v2) | 姓名、描述、性格、情境、开场白、示例对话等JSON规范 | 角色设定导出结构参考，不是服装或人像图库 | 规范与实际角色卡内容分别核对 |

## 更贴近原站的服装来源

- https://ai-costume-gallery.pages.dev/ ：写实虚构服装参考。
- https://ai-costume-anime-gallery.pages.dev/ ：动漫服装参考。
- 原站允许单张用于参考创作，包括商用作品；明确禁止批量下载和图片本身的再分发、转载、转售。本项目不批量拉取这些图片。

## 建议

角色设定生成器优先采用「面部／发型＋服装描述＋性格／背景」三层结构。先接入公开元数据与来源链接；图像参考只在用户明确选中时按源站规则使用。多个聚合仓库引用同一上游图库，不应把它们视为互相独立的库存重复计数。

补充核验：
- [Fashionpedia](https://github.com/cvdfoundation/fashionpedia)：27 类服装、19 类服装部件、294 项细粒度属性，适合标签设计；不是整套虚构服装素材集。
- [SFHQ-T2I](https://github.com/SelfishGene/SFHQ-T2I-dataset)：122,726 张 1024×1024 合成人脸，附生成提示词、模型与配置，较原版 SFHQ 更适合构建带提示词的参考索引。
- [Shisei](https://github.com/wquguru/shisei)：自建姿势图片明确标注 CC0，代码 Apache 2.0。仓库声称还含服装库，但服装目录与条目未进一步审计，因此不将其作为已核实的服装库存推荐。
- [动漫服装原站](https://ai-costume-anime-gallery.pages.dev/)：GitHub 项目来源说明列出该站，但网页工具本轮未直接打开成功，库存与现行条款仍待直接核验。


## 用户选定三项后的实施状态

已绑定 Open Pose & Costume、AI Library、Fashionpedia，并将可复现元数据快照置于仓库 data/。

| 绑定项目 | 本次范围 | 去重与限制 |
| --- | --- | --- |
| Open Pose & Costume | 1407写实＋1320动漫＝2727条上游服装元数据 | 排除需额外授权的自建素材与第三方翻译，不复制图片 |
| AI Library | 1407条服装ID映射 | 与上项写实来源完全重叠，合并同条目，保留两套来源编号 |
| Fashionpedia | 46类服装／部件＋294项属性 | 仅分类体系，CC BY4.0署名与来源已保留；不引入真实人物照片 |

运行时文件 data/bound-libraries.js，机器可读快照 data/bound-libraries.json；版本、来源路径和输入摘要记录于 data/library-manifest.json。选择器与输出通过标准ID关联，用户档案导入时重新解析为本地规范条目。
