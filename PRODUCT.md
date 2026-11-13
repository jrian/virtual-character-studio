# 虚拟人自动生成机

<!-- impeccable:product-schema 1 -->

## Platform
web

## Stack
纯 HTML/CSS/JavaScript。用户要求上传 GitHub 部署；静态文件直接适配 GitHub Pages，无服务端或密钥。

## Product Purpose
用户选择条件后生成完整虚拟人角色设定。覆盖虚拟博主、短视频、小说和游戏角色。

## Users
需要角色设定的创作者；具体团队规模和使用频率未确定。

## Capabilities and Constraints
核心：条件选择与角色设定生成。首版实现方案：本地规则组合、复制和 Markdown 下载、浏览器本地档案。不将规则组合标为大模型生成，不生成角色图片。

## Operating Context
通过 GitHub Pages 使用。没有既有代码、视觉资产或指定品牌规范。

## Product Principles
- 选择的条件必须在输出中体现。
- 允许从预设开始，再修改具体条件。
- 明确区分当前条件与已生成版本。
- 结果可直接复制或导出用于后续创作。

## Bound Libraries
用户明确要求绑定 Open Pose & Costume、AI Library、Fashionpedia 并将库放到 GitHub。实现范围为可本地筛选的服装元数据与分类属性，包含来源映射、去重、可复现快照和同步脚本；不含图片整库。

## Visual Reference Selection
用户要求在网页展示人物与服装参考图，支持看图筛选和选择后生成设定。界面提供双图库分页和单选，已选预览、按需放大、错误重试；生成结果展示本次参考组合。图片直接按需从原站读取，不复制至GitHub或代理缓存；文字生成依据公开标签、编号及用户条件，不作自动视觉识别。
