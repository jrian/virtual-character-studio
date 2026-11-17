---
name: 角色样本工作室
description: 暖白工作纸、深茄墨色与清晰参考分工，兼顾角色编辑效率和档案质感
colors:
  aubergine: "#403346"
  aubergine-hover: "#302336"
  ground: "#f2eee8"
  paper: "#fcfaf6"
  muted: "#6b5b6f"
  selected: "#e9e1e5"
  line: "#d9d0d6"
  soft: "#f7f3ee"
  control-border: "#bfb1bf"
  ochre: "#a35930"
  sample-orange: "#b86b3e"
  focus: "#8b4b29"
  warn: "#85491f"
  warn-bg: "#f6e7d9"
  profile-ink: "#625066"
  action-surface: "#eee8e9"
typography:
  display:
    fontFamily: 'CharacterDisplay, "PingFang SC", sans-serif'
    fontSize: "25px"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "-0.025em"
  profile-name:
    fontFamily: 'CharacterDisplay, "PingFang SC", sans-serif'
    fontSize: "30px"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0.035em"
  title:
    fontSize: "15px"
    fontWeight: 600
    lineHeight: 1.5
  body:
    fontFamily: '-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif'
    fontSize: "14px"
    lineHeight: 1.65
  profile-body:
    fontSize: "13px"
    lineHeight: 1.95
  control:
    fontSize: "13px"
  label:
    fontSize: "12px"
    fontWeight: 550
  note:
    fontSize: "12px"
rounded:
  tag: "4px"
  field: "5px"
  button: "6px"
  reference: "7px"
  notice: "8px"
  panel: "12px"
spacing:
  xs: "8px"
  sm: "12px"
  field: "18px"
  panel-x: "24px"
  workspace: "30px"
components:
  button-primary:
    backgroundColor: "{colors.aubergine}"
    textColor: "{colors.paper}"
    rounded: "{rounded.button}"
    padding: "9px 15px"
    typography: "{typography.control}"
  button-primary-hover:
    backgroundColor: "{colors.aubergine-hover}"
  button-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.aubergine}"
    rounded: "{rounded.button}"
    padding: "9px 15px"
  button-secondary-hover:
    backgroundColor: "{colors.selected}"
  field:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.aubergine}"
    rounded: "{rounded.field}"
    padding: "9px 11px"
    width: "100%"
  choice-selected:
    backgroundColor: "{colors.selected}"
    textColor: "{colors.aubergine}"
    rounded: "{rounded.button}"
    padding: "8px 13px"
  panel:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.panel}"
  snapshot-tag:
    backgroundColor: "{colors.ground}"
    rounded: "{rounded.tag}"
    padding: "4px 9px"
---

# Design System: 角色样本工作室

## Overview

**Creative North Star: "角色样本工作室"**

暖白纸面承载条件与档案，深茄墨色建立阅读和操作层级，赭橙点明参考入口与当前编辑分组。界面像持续使用的角色工作纸：紧凑但有呼吸，先看到参考分工与实际内容，再深入工具。

这是用户确认的替换视觉世界，兼顾效率与质感，并保留全部功能及独立弹窗。样本感来自真实参考、字体、边线和留白，不依赖新制作的装饰位图。以下记录最终 `styles.css` 与 `studio.css` 的有效层叠值；首屏构图的详细约定仍归 `.impeccable/surfaces/index-html.md`。

**Key Characteristics:**
- 暖白底面、深茄操作与赭橙指引。
- 人物、服装、风格参考各有可见来源与独立用途。
- 当前条件与生成版本分开呈现，状态有明确文字。
- 编辑纸面与平直档案页形成轻重关系，工具保持独立弹窗。

## Colors

暖中性色围绕深茄墨色组织，赭橙用于局部指引；规范色值以顶部 tokens 为准。

### Primary
- **深茄墨（aubergine）**：主要文字、主按钮、当前主导航及结果页顶线；深茄悬停色用于主按钮反馈。
- **浅茄纸（selected）**：选择底色、次级悬停和档案空态。

### Secondary
- **赭橙（ochre）**：参考选择入口和灵感文字的悬停反馈。
- **样本橙（sample-orange）**：当前条件分组的短底线，保持文本本身可读。

### Neutral
- **暖底（ground）、暖白纸（paper）、柔纸（soft）**：分别用于页面、主体阅读面和次级内容底面。
- **灰茄（muted）、档案墨（profile-ink）**：辅助说明与长篇档案文字。
- **纸缝线（line）、控件边线（control-border）**：区分分段和可编辑边界。
- **操作纸（action-surface）**：生成操作区的浅色承托。
- **焦点赭（focus）**：清晰的键盘聚焦轮廓；**警示赭（warn）与浅警示纸（warn-bg）**解释条件已变更、档案待更新。

**The State Has Words Rule.** 选择、来源、待更新和任务状态必须带文字或勾选线索，不能仅依赖色差。

源码保留 `--green`、`--green-hover` 兼容名称，其值分别为深茄墨与深茄悬停色；这些名称不代表绿色视觉身份。`--ink` 与 `--green` 共用深茄墨值。

## Typography

**Display Font:** CharacterDisplay，自托管 Noto Sans SC 展示子集，回退 PingFang SC、sans-serif。
**Body Font:** 系统 UI 栈，见 body token；表单和档案正文继承此栈。

展示字用于主标题和角色姓名，其他内容保持系统正文的阅读效率。字体出处和 SIL OFL 1.1 许可保留在 `assets/fonts/SOURCE.txt` 与 `assets/fonts/OFL.txt`；字体子集之外的字由系统回退。

### Hierarchy
- **Display**：桌面主标题使用 display，小屏（≤600px）为 23px。
- **Profile name**：角色姓名使用 profile-name，维持轻微正字距。
- **Title**：工作面标题为 15px；弹窗桌面标题为 16px，小屏为 17px。
- **Body / Profile body**：全局正文与档案段落分别使用对应 token，档案段落最大 72ch。
- **Control / Label / Note**：桌面控件 13px，表单名称与说明通常 12px；≤600px 的表单及工具弹窗输入为 14px、至少 44px 高。

**The Two Reading Speeds Rule.** 条件操作保持紧凑；长篇角色段落保留更宽行距。

## Layout

主容器最大宽度（1600px），桌面内边距（27px 38px 38px）。页头最小高度（70px）。工作区桌面两列为 `minmax(0,1.25fr) minmax(0,1fr)`，列距（30px）；条件面更宽，生成档案保留独立阅读面。条件内水平留白通常（24px），普通字段双列间距（18px），身份字段使用（1.7fr 1fr 1fr）。

参考条横向保留人物、服装、风格三种角色与工具区；≤900px 时工具区换到下一行，工作区变为单列，显示条件／档案定位。≤600px 时页面侧距（20px），参考仍为三列，但缩略图和说明转成纵向排列；身份字段首项通栏，捏脸字段转为单列。手机保留文字导航和所有工具入口。

桌面档案可粘附视口上缘（20px），正文最大高度（650px）并独立滚动；≥1600px 为（730px）。≤900px 取消粘附与正文高度上限，改为页面自然滚动。长来源和文件名可换行；参考条的来源摘要可省略，完整来源在选择器或档案中呈现。

## Elevation & Depth

主要靠纸面色差、细线与留白形成层级。条件面为暖白圆角纸，结果面以深茄顶线和直边正文区区分。静态面板没有阴影；临时 toast 使用柔和阴影（`0 8px 25px #40334626`），原生弹窗使用深茄半透明遮罩（`#2b2133bf`）。

**The Quiet Surface Rule.** 常驻编辑与阅读面保持平静，临时反馈和模态遮罩承担浮层提示。

档案更新采用（450ms）的揭示动画；toast 透明度（150ms）、位移（250ms），缓动为 `cubic-bezier(.16,1,.3,1)`。遵循减少动态效果偏好，关闭动画及过渡。

## Shapes

输入框圆角（5px），按钮和选择条件（6px），参考选择卡（7px），条件面与工具弹窗（12px）；只读标签使用（4px）。结果阅读区保持平直，不复制编辑面的大圆角。细实线用于控件和分隔；当前主导航为深茄底线（3px），条件分组为样本橙底线（2px）。图标使用内联 SVG，选中勾号由 CSS 边线绘制。

## Components

### Buttons
紧凑、明确，主次由填充而非体积区分。主要按钮为深茄暖白字，通用最小高度（41px），生成按钮（43px）并通栏。次级按钮暖白底加细边线；悬停为浅茄纸。文字按钮用于恢复、参考选择和辅助操作。禁用态保留（0.5）透明度。所有可聚焦交互沿用（3px）焦点轮廓，通常偏移（4px）。

### Chips
选择条件由原生 radio／checkbox 与 label 组合；浅茄底、较深边线和勾号表示已选。档案快照标签使用暖底和小圆角，仅用于只读摘要。分类按钮保留数量及选中状态，不因筛选丢失已选来源。

### Cards / Containers
编辑面暖白、有圆角、无阴影。生成操作区使用操作纸，档案工具栏及底部操作直接位于页面底面。参考列表以图片、名称和来源为主，图库内部卡保留细边，个人参考库采用分隔线。

### Inputs / Fields
原生输入、选择及文本框为暖白、细边线，桌面内边距（9px 11px）；悬停边线加深（`#8f738e`）。多行输入可纵向调整。键盘选择项将焦点轮廓移到可见 label，保持勾选和锁定可辨认。

### Navigation
主导航与四个条件分组均为文字加底线。手机页头为品牌和模型入口一行、导航一行；工作区定位提供明确文字链接。折叠服务说明保持次要层级，常用字段直接可编辑。

### Long-form sections
捏脸与 AI 采用三个可定位分区：参考与来源、捏脸特征、AI 设计与任务。13 组特征及锁定完整保留在默认关闭的原生 details，参考来源默认展开；特征锚点会先展开再定位。分区导航粘附顶部（0px），桌面链接至少（40px）高，小屏（44px），目标滚动避让分别为（78px／82px）。生成范围、补充说明、生成按钮和任务反馈独立成段，详细编辑展开后仍可通过分区导航直达，避免把操作埋在长表单末尾。

### Reference roles and version surfaces
人物、服装、风格三个参考槽持续显示当前条件的来源、缩略图或用途图标；不同用途的浅底色辅助识别，不替代文字。生成后来源进入对应版本，条件变化不会把旧档案悄然改成新版本。空态以简洁指引代替虚构成品。

### Independent dialogs
人物与服装图库、模型接入、Lovart 导出、我的参考库分别使用独立原生 dialog。保留标题、固定关闭区、内部滚动和原生模态焦点；图片放大另用查看弹窗。普通工具桌面宽度上限（860px），宽版（1120px），最大高度（90dvh）；≤600px 留屏幕边距（10px），内部边距以（16px）为主。图库默认折叠分类、先展示参考图；手机图库两列，区别于三列的当前参考条。

## Do's and Don'ts

### Do:
- **Do** 用暖白纸和深茄墨组织阅读，赭橙标示参考入口与当前分组。
- **Do** 保持三类参考的用途和来源可见，明确区分当前条件与生成版本。
- **Do** 在手机保留全部目的地、独立工具弹窗和条件／档案定位。
- **Do** 保留字体出处及许可，允许展示子集之外的字形回退。
- **Do** 用真实选中内容、文字状态和原生控件表达功能结果。
- **Do** 为长表单提供可见分区定位，将详细编辑与生成操作分段，并保留所有字段及锁定。

### Don't:
- **Don't** 因兼容变量仍叫 green 而恢复旧绿色视觉身份。
- **Don't** 把只读版本快照绘制成可操作按钮，或只用颜色解释更新状态。
- **Don't** 将常驻工作面改成带强阴影的浮卡，或把展示字体扩散到所有长文与表单。
- **Don't** 把外链参考或本地规则组合表现为本站已生成、已识别的角色图片。
