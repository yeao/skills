---
name: generating-crud-frontend-uni
description: 仅供手动调用，请勿自动触发
---

# 生成 CRUD 前端模块（uni-app 移动端）

根据 **已有前端 API 类、建表 SQL、Java 实体类** 三种输入之一，一次性生成与 `@gy` uni 应用现有风格完全一致的移动端「列表 + 表单」页面模块：列表页壳 + GyList 列表 + use-list 配置 + GyForm 表单，并完成 URL 常量与 `pages.json` 注册。

支持两类模块：**普通 CRUD** 与**工作流审批**（实体带 `flow_status`/`flow_instance_id` 或继承 `SysFlowForm`，使用 `*-flow-template` 系列模板）。

Web 管理端页面请用姊妹技能 `generating-crud-frontend`；本技能只生成 uni-app 端页面，**不生成、不校验服务层**——服务层实体/`xxxUrl`/`xxxFormatter` 假定已存在于 service 包（缺失时提示用户先用 `generating-service-api` 生成 API 层）。

## 输入来源

| 输入 | 识别特征 | 说明 |
| --- | --- | --- |
| 已有前端 API 类（首选） | 给出 `<service包>/src/api/**/*.ts` 路径，或实体名可被检索到 | **唯一事实来源**：字段、字典 dicCode、外键、文件字段一律取自该文件 |
| 建表 SQL（CREATE TABLE） | 用户粘贴 SQL 语句 | 仅作字段来源解析；service 包需已有对应导出 |
| Java 实体类 | 粘贴 Java 代码或给出 `.java` 文件路径 | 同上 |

## 项目架构要点

这是 `@gy` 框架的 uni-app 应用（uni-app + Vue 3 + tmui），生成前先确认目标应用属于以下公认结构（详见 references/generation-rules.md 的「应用结构」）：

- `src/gy/components/` —— 随应用分发的 Gy 组件（gy-list、gy-form、gy-button、gy-filter、gy-select、gy-tm-pick 等），页面**从应用内路径导入**（`@/gy/components/...`）
- `@gy/sys-uni` —— composable 与类型：`useGyButton`、`useUserStore`、`GyListProps`、`UseGyListOptionsO`、`UseGyListHandleOptionsO`、`UseGyFormOptionsO`、`getListSettingCommon` 等
- `@gy/base` —— 基础类型：`TermMapKey`、`TermMap`、`ModelForm`、`opt_detail`、`opt_save`、`opt_update`、`setDefault`
- `@gy/sys-service` —— 流程类型：`FlowQueryType`、`flowHandleShowC`、`ActSelfNode`、`FLOW_STATUS_CANCEL`
- `src/tmui/` —— tmui 组件库（tm-app、tm-navbar、tm-form、tm-form-item、tm-input、tm-sheet、tm-text 等），按项目现有导入方式（自动导入或显式 `@/tmui/components/...`）
- 服务层 —— 业务 service 包提供实体接口、`xxxUrl`、`xxxFormatter`（可选 `xxxFileFieldMap`）；应用侧 `src/api/*-service.ts` 实例化 Api 类
- 页面 URL 常量统一定义在 `src/api/pages-urls.ts`（`xxxListUrl`/`xxxFormUrl`，按模块加中文分组注释）
- 路由注册在 `src/pages.json`（JSONC，可带注释；**第一项是启动页**，新页面只能追加）

## 工作流

### 步骤 1：识别输入来源并解析

按 references/generation-rules.md 的「输入来源解析」提取字段清单、字典字段、外键字段、文件字段、工作流特征。已有 API 类输入时以该文件为准，不做额外推断。

### 步骤 2：确认目标位置与范围（只问一次）

用一次 AskUserQuestion 同时确认（能推断的给出默认选项）：

1. **目标 uni 应用**：仓库有多个 uni 应用时选哪个（单应用免问）
2. **区域目录**：`src/pages/` 下的分组目录（参考该应用已有业务页面的分组）
3. **模块中文名**：navbar 标题与 pages.json 注释用。默认：SQL 取表注释；Java 取类注释；已有 API 取实体注释/文件名语义
4. **模块类型**：标准 CRUD / 工作流审批。默认按步骤 1 特征自动判定；判定为工作流时追加确认 `flowKey`
5. **生成范围**（multiSelect）：列表页（list-page + list + use-list）、表单页（form）。默认全选；只读/日志类模块可只要列表

### 步骤 3：探测项目约定

生成前**必须**在目标应用中找一个现有业务模块（结构最接近的）作为基准，核对：

- 服务包名（package.json 依赖里的 service 包）
- gy 组件导入路径、tmui 导入方式（显式/自动）
- 卡片样式类与 style 引用（如 `.attr-item` 所在的 scss）
- type-check 脚本名（package.json scripts）

### 步骤 4：加载模板与规则

1. 读取 [references/generation-rules.md](references/generation-rules.md) —— 字段映射、控件推断、卡片/筛选/按钮规则、注册规则、工作流差异
2. 按范围与类型读取模板：
   - 标准 CRUD：[assets/templates/list-page-template.vue](assets/templates/list-page-template.vue)、[assets/templates/list-template.vue](assets/templates/list-template.vue)、[assets/templates/use-list-template.ts](assets/templates/use-list-template.ts)、[assets/templates/form-template.vue](assets/templates/form-template.vue)
   - 工作流审批：list-page/use-list 同上，改用 [assets/templates/list-flow-template.vue](assets/templates/list-flow-template.vue)、[assets/templates/form-flow-template.vue](assets/templates/form-flow-template.vue)

### 步骤 5：生成文件

命名转换（以实体 `EquMaterial` 为例）：

| 项 | 值 |
| --- | --- |
| 实体名 | `EquMaterial`（大驼峰） |
| 变量前缀 | `equMaterial`（小驼峰） |
| 文件/目录名 | `equ-material`（kebab-case） |
| flowKey（工作流） | `equ_material`（下划线，与后端流程模型 key 核对） |

生成/修改清单（按步骤 2 选定的范围裁剪）：

1. **新建** `<uni应用>/src/pages/<areaDir>/<file-name>/list/<file-name>-list-page.vue`
2. **新建** `<uni应用>/src/pages/<areaDir>/<file-name>/list/<file-name>-list.vue`
3. **新建** `<uni应用>/src/pages/<areaDir>/<file-name>/list/use-<file-name>-list.ts`
4. **新建** `<uni应用>/src/pages/<areaDir>/<file-name>/form/<file-name>-form.vue`
5. **修改** `<uni应用>/src/api/pages-urls.ts` —— 末尾追加 `{{entityName}}ListUrl`、`{{entityName}}FormUrl`，带中文注释
6. **修改** `<uni应用>/src/pages.json` —— `pages` 数组**末尾**追加列表页与表单页两个条目，各带一行中文注释

### 步骤 6：收尾

生成完成后：

1. 运行类型校验（脚本名以步骤 3 探测为准，通常）：`pnpm --filter <uni应用包名> type-check`，修复报错
2. 告知用户：
   - 生成的文件清单与注册位置
   - 字典字段（SQL / Java 输入）：列出推断的占位 dicCode，请确认真实字典编码；已有 API 输入的 dicCode 取自 formatter，无需确认
   - 外键字段：列出推断的关联关系与选择组件，请确认
   - 工作流模块：确认 `flowKey` 与后端流程模型 key 一致
   - `itemHeight` 为估算值，真机/H5 联调时按卡片实际高度校准
   - 表单 `rules` 校验规则按保守策略生成，请确认必填项
   - 若该应用与其他 uni 应用存在页面同步机制（如 robocopy 脚本），提醒用户同步；脚本有破坏性时只提醒、不代跑

## 关键约定

- **速度优先**：除步骤 2 的一次确认外不再提问，直接生成全部文件
- **已有 API 为唯一事实来源**：字段、字典、外键、文件字段一律以该文件为准，不猜测、不新建重复定义
- **参考项目现有模块**：导入路径、常量命名、样式引用与目标应用已有模块保持一致，不要凭记忆拼写
- **字典字段**：卡片显示用 `xxxValue`，表单用 `dics.get(dicCode)` 渲染 tm-radio-group / tm-checkbox-group，筛选用 `render: 'select'`
- **外键字段**：卡片用 `xxxValue.<显示列>`；表单/筛选用 GySelectRemote 或项目已有的 select-list 弹窗组件
- **DefaultEntity 继承字段**（id、createTime、updateTime、createUserId、createRealName 等）不生成表单项；createTime/createRealName 可作卡片字段与筛选条件
- **风格一致性**：代码结构、注释分隔线（如 `//-----------------列表----------------`）、命名习惯必须与模板及项目现有模块一致
- **Prettier 约定**：无分号、单引号、缩进 2、行宽 140、无尾逗号（以目标应用 .prettierrc 为准）
