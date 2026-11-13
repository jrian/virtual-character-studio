---
name: 角色工坊
description: 清晰、克制的虚拟角色条件与档案工作界面
colors:
  green: "#254a3b"
  green-hover: "#173a2b"
  ground: "#edf1ee"
  paper: "#fff"
  ink: "#243a30"
  muted: "#5d7065"
  selected: "#e1ece4"
  line: "#d7e1da"
  soft: "#f5f7f5"
  control-border: "#bdccc1"
  secondary-border: "#abbdb1"
  focus: "#61816b"
  warn: "#78541d"
  warn-bg: "#faf0d9"
typography:
  display:
    fontFamily: 'CharacterDisplay, "PingFang SC", sans-serif'
    fontSize: "clamp(25px, 2.5vw, 36px)"
    fontWeight: 650
    lineHeight: 1.4
    letterSpacing: "-0.025em"
  profile-name:
    fontFamily: 'CharacterDisplay, "PingFang SC", sans-serif'
    fontSize: "36px"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0.06em"
  title:
    fontSize: "17px"
    fontWeight: 600
    lineHeight: 1.5
  body:
    fontFamily: '-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif'
    fontSize: "14px"
    lineHeight: 1.65
  profile-body:
    fontSize: "13px"
    lineHeight: 1.95
  label:
    fontSize: "13px"
    fontWeight: 550
  note:
    fontSize: "12px"
rounded:
  tag: "4px"
  control: "6px"
  button: "7px"
  notice: "8px"
  panel: "14px"
spacing:
  xs: "8px"
  sm: "12px"
  field: "16px"
  group: "24px"
  panel-x: "26px"
components:
  button-primary:
    backgroundColor: "{colors.green}"
    textColor: "{colors.paper}"
    rounded: "{rounded.button}"
    padding: "11px 17px"
  button-primary-hover:
    backgroundColor: "{colors.green-hover}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.green}"
    rounded: "{rounded.button}"
    padding: "11px 17px"
  button-secondary-hover:
    backgroundColor: "{colors.selected}"
  field:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "10px 12px"
    width: "100%"
  choice-selected:
    backgroundColor: "{colors.selected}"
    rounded: "{rounded.control}"
    padding: "9px 13px"
  panel:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.panel}"
  snapshot-tag:
    backgroundColor: "{colors.ground}"
    rounded: "{rounded.tag}"
    padding: "4px 9px"
---

# Design System: 角色工坊

## Overview

**Creative North Star: "角色工作台"**

浅鼠尾草色底面托住白色编辑区与阅读面，森林绿标示行动与选择。紧凑的中文控件服务于条件编辑，较舒展的人物档案服务于连续阅读；内容层级依靠字号、留白和细分隔线形成。

这是对实际实现的记录，视觉命名为文档描述，并不代表用户另行批准了品牌方向。方向选择页等待超时，当前方向按可逆假设落地；没有已批准的设计稿或 QUALITY BAR 卡。未来大幅改变视觉身份时需重新确认方向。本界面保持本地规则生成的事实边界；外部服装资源以元数据和可选选择器呈现，不把元数据表现成已生成的图片或推断结果。

**Key Characteristics:**
- 浅灰绿底面、森林绿操作、白色阅读面。
- 专用中文展示字配系统正文与原生表单。
- 选择、生成快照与待更新状态均有文字线索。
- 平面容器、细边线、有限的圆角层级。

## Colors

单一绿色主调配低饱和中性色；琥珀仅解释条件与结果不一致的状态。规范值由文件顶部 tokens 定义。

### Primary
- **森林绿（green）**：主要操作、当前导航、链接与品牌笔画。
- **深林绿（green-hover）**：主要按钮悬停。
- **淡叶绿（selected）**：已选条件、次级按钮悬停和资源说明背景。

### Neutral
- **鼠尾草底（ground）**：页面底面、快照标签与状态标签。
- **白纸（paper）**：编辑、档案及资源列表阅读面。
- **深绿墨（ink）**：标题和主要正文。
- **草木灰（muted）**：辅助说明与非当前导航。
- **浅叶分隔（line）**：容器内部边界、表单与结果分段。
- **柔灰绿（soft）**：继续下一步等次级操作底面。
- **控件边线（control-border）、次级边线（secondary-border）**：保持可见的交互边界。
- **聚焦绿（focus）**：键盘焦点，配合轮廓偏移确保可见。
- **琥珀文字（warn）与浅琥珀底（warn-bg）**：条件已变化、档案待重新生成的提示。

**The State Has Words Rule.** 已选状态与待更新状态需要文字或勾选线索，不能只改变底色。

## Typography

**Display Font:** CharacterDisplay，即自托管 Noto Sans SC 展示子集；中文回退为 PingFang SC、sans-serif。
**Body Font:** 系统 UI 栈，见 body token。正文和控件均不请求远程字体。

展示字只用于页面主标题和角色姓名。字体文件位于 `assets/fonts/noto-sans-sc-display.ttf`，按 SIL OFL 1.1 分发，出处和许可随 `assets/fonts/SOURCE.txt`、`assets/fonts/OFL.txt` 保存。子集之外的用户姓名字符由已安装字体回退，不保证整个人名使用同一展示字形。

### Hierarchy
- **Display**：流式主标题，较紧的负字距；不是大面积宣传文案。
- **Profile name**：角色姓名使用较宽字距，小屏（≤480px）降至 30px。
- **Title**：编辑区标题；结果工具栏标题降为 14px，小屏为 13px。
- **Body**：全局正文与原生控件继承系统字体；档案段落使用 profile-body，最多 72ch。
- **Label / Note**：表单名称与辅助信息分层，说明不使用装饰性大写标签。

**The Two Reading Speeds Rule.** 编辑控件保持紧凑；人物段落保留更宽的行距，不把长篇档案压成标签密度。

## Layout

主容器最大宽度 1490px，桌面水平内边距为 4.2%，顶部 38px、底部 60px。桌面工作区采用两列 `minmax(350px, .88fr) minmax(440px, 1.2fr)`，列距 24px。实际页头最小高度为 88px，包含创建、档案、参考资源三个目的地；这两项是已实现值，取代早期方向简述中的 80px 和两个目的地。

表单常用双列字段，列距 16px；面板内部水平留白通常 26px。档案桌面内边距为 32px 34px 35px，最大阅读高度 710px，独立滚动并保留滚动条槽。宽屏 ≥1600px 时顶部留白 45px、档案最大高度 780px。

≤1100px 时收紧列距为 18px，字段面板边距为 22px；≤820px 时工作区改为一列，页面水平留白为 5%，表单先于结果，档案取消内部最大高度。≤480px 时导航独占一行、简介换行，引用选择器中的双列字段改为一列。长来源编号允许换行；字段网格子项和 select 具有最小宽度约束，避免横向撑破容器。

## Elevation & Depth

静态面板不使用阴影；深度来自底面与白纸的色差、边线和留白。底部提示 toast 使用唯一浮层阴影（`0 8px 25px #213b3026`）表明临时反馈层。

**The Quiet Surface Rule.** 常驻编辑和阅读容器保持平面，浮层阴影留给临时反馈。

结果更新时使用 450ms 的浅绿到白色揭示动画；toast 使用 150ms 透明度与 250ms 位移，缓动为 `cubic-bezier(.16,1,.3,1)`。系统减少动态效果偏好下关闭动画与过渡。

## Shapes

面板圆角大于控件，控件大于标签；各级规范值见 rounded tokens。输入框和选择条件采用细实线边界，白色容器主要靠色差成形。导航使用底部短实线标记当前页。图标为内联 SVG 线条；选中勾号由 CSS 边线绘制。无随站点分发的位图素材。

## Components

### Buttons
主要按钮为森林绿白字，最小高度 44px；生成按钮通栏，使用 13px 17px 内边距与 15px 字号。次级按钮透明底加细边线，悬停呈淡叶绿。紧凑保存按钮使用 12px 字号、8px 13px 内边距和 36px 最小高度。文字按钮降低视觉重量，用于重置、继续变体等辅助动作。禁用状态保留 0.5 透明度。

### Chips
可选择条件使用原生 radio/checkbox 配 label，选中为淡叶绿、较深边线与勾号。生成快照标签为只读文本，其低对比底面与小圆角不暗示交互。

### Cards / Containers
编辑区与档案面板为白色大圆角容器，无静态阴影。内部分段以浅边线区分；底部操作区使用浅灰绿。资源和档案列表采用连续行，仅首尾外侧保留面板圆角。

### Inputs / Fields
原生 input/select/textarea 具有白底、细边线、控件圆角及至少 43px 高度。悬停边线加深（`#7d9987`）。键盘焦点为 3px 聚焦绿轮廓，通常外移 4px；选择条件将焦点轮廓转移至可见 label。多行输入允许纵向调整。服装条目为原生多行 select，高度 160px；浏览器自身绘制选项选择状态。

### Navigation
主导航与条件分组都采用文字加底线，不使用填充式大胶囊。当前主导航底线为 3px，条件分组为 2px。手机端保留文本目的地，不依赖纯图标导航。

### Provenance disclosures
服装库存、Fashionpedia 和外观参考采用原生 details/summary。展开后才显示可选筛选器、数量、来源链接和说明。Open Pose & Costume、AI Library 是服装元数据来源，Fashionpedia 提供分类与属性；不展示本站复制的原图。来源详情与角色正文分层，保留明确的外链文案。

### Result snapshot and stale state
姓名后依次出现简述、条件快照和人物分段。条件修改后，琥珀文字提示位于工具栏下方；保留旧内容并说明重新生成后才使用新条件。保存、复制、下载动作在同一工具栏，图标按钮带可读名称。

## Do's and Don'ts

### Do:
- **Do** 使用森林绿强调行动与当前状态，以白纸承载编辑和长文。
- **Do** 为选择、快照和待更新状态提供明确文字线索。
- **Do** 保持移动端先编辑后阅读的顺序，展开来源选择器时允许自然纵向增长。
- **Do** 保存自托管展示字体的出处与 OFL 许可，并允许子集之外的中文字符回退。
- **Do** 保留本地规则生成与元数据来源的准确说明。

### Don't:
- **Don't** 将静态面板改为悬浮阴影卡，或把只读快照包装成交互按钮。
- **Don't** 将展示字体扩展为所有表单与长文的默认字体。
- **Don't** 把外链图片、服装标签或分类属性表现为本站已生成的角色图片。

记录范围：基于 `styles.css`、`index.html`、`PRODUCT.md` 与实际展开服装库界面。已打开检查 `.impeccable/review/desktop.png`（1440px 全页）、`mobile.png`（390px 全页）、`mobile-outfits.png`；浏览器结果记录为通过。扩展范围覆盖 Open Pose & Costume、AI Library、Fashionpedia，当前文档交付处置为 **ship**，无需实质性修复或应用代码调整。未规范化、未修复的缺陷：无新增已确认问题；未批准方向与未提供 QUALITY BAR 属于视觉授权依据限制，未将其写成用户确认的设计决定。
