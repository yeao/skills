---
name: generating-crud-frontend
description: 仅供手动调用，请勿自动触发
---

# 生成 CRUD 前端模块

根据 **已有前端 API 类**，一次性生成与项目现有风格完全一致的 CRUD 前端**页面**：列表页、表单弹窗，并完成 web 端 API 实例注册。

**本 skill 不生成、不修改服务层（service 包）API 文件**——实体接口、formatter、Api 类及 `lib/main.ts` 导出一律通过 **generating-service-api** skill（根据 Java 实体 / Controller）生成更新。本 skill 只消费服务层已导出的 Api 类，**API 文件是页面生成的唯一事实来源**。

支持两类模块：**普通 CRUD** 与**工作流审批**（实体 `extends SysFlowForm` 或含 `flowStatus` 字段，含发起/审批/撤销/归档，使用 `*-flow-template` 系列模板并可生成 manage/dept 包装页）。

## 输入

| 输入            | 识别特征                                                       |
| --------------- | -------------------------------------------------------------- |
| 已有前端 API 类 | 给出 `<service包>/src/api/**/*.ts` 路径，或给出实体/模块名供检索 |

用户只给实体名/表名时，按名称在服务层 `src/api/` 下检索（如 `Grep "class XxxApi"` 或按 kebab-case 文件名查找）；**找不到 → 提示先用 generating-service-api skill 根据 Java 实体 / Controller 生成 API，本 skill 不代生成**。

## 项目架构要点

这是 `@gy` 框架的 pnpm monorepo，GyTable、GyForm、useGyButton、baseApi 等**全部从 `@gy/sys-web` 导入**。常见两种仓库形态（详见 references/generation-rules.md 的"仓库与包结构"）：

- **多应用形态**：每个业务应用由 `<app>-service`（接口层）+ `<app>-web`（页面层）组成；**sys-web / sys-service 是基础模块**，其他应用依赖它
- **单服务层形态**：整个仓库一个服务层包 + 一个 Web 端；Web 端在一个 api 实例文件中用 `@gy/sys-web` 的 `baseApi` 实例化全部 Api 类
- **sys-web 自身**的页面：用相对路径导入组件（参考 `sys-web/src/views/sys/role/`）
- 路由由数据库菜单动态生成，无需改路由文件

## 工作流

### 步骤 1：读取并解析 API 文件

读取该文件，提取：

- 实体接口字段：名称、TS 类型、行尾中文注释
- `formatterDics` → 字典字段及真实 dicCode
- `formatterAEntitys` → 外键字段及关联表（需要显示列时读取关联表的 API 文件确认）
- `xxxFileFieldMap`（如有）→ 文件字段
- url 常量 → 实体小驼峰名与 appName；实体名/文件名 → kebab-case 页面文件名
- Api 类自定义方法（`cancel`/`copy`/`checkXxx`/`exportByIds` 等）→ 页面按钮与操作的绑定依据
- **工作流特征**：实体 `extends SysFlowForm` 或含 `flowStatus` 字段 → 工作流审批模块
- 检查注册状态：`lib/main.ts` 是否已导出（未导出属 generating-service-api 职责，仅提醒）、目标应用 `src/api/<app>-service.ts` 是否已实例化

### 步骤 2：确认目标位置与范围（只问一次）

用一次 AskUserQuestion 同时确认（能推断的给出默认选项）：

1. **目标应用**：多应用形态选哪个 web 端；单服务层形态固定为唯一 Web 端，只需确认分组。推断依据：API 文件所在 service 包 / url 常量中的 appName
2. **模块分组**：web 下 `src/views/` 的子目录（参考该应用已有分组）
3. **模块中文名**：用于页面 title 和表单 apiTitle。默认取实体接口注释/文件名语义
4. **生成范围**（multiSelect）：列表页（table）、表单弹窗（form）。默认全选。常见组合：仅 table（日志/只读类，无 form）、全选（标准 CRUD）
5. **模块类型**：标准 CRUD / 工作流审批。默认按步骤 1 的特征自动判定（能推断时不必问）；判定为工作流时追加确认 `flowKey`（流程定义 key）与是否需要 manage/dept 包装页

### 步骤 3：加载模板与规则

1. 读取 [references/generation-rules.md](references/generation-rules.md) —— API 文件解析、表单组件推断、校验、查询条件、字典/外键/文件字段规则
2. 按范围读取模板：
   - 标准 CRUD：[assets/templates/table-template.vue](assets/templates/table-template.vue)、[assets/templates/form-template.vue](assets/templates/form-template.vue)
   - 工作流审批模块：改用 [assets/templates/table-flow-template.vue](assets/templates/table-flow-template.vue)、[assets/templates/form-flow-template.vue](assets/templates/form-flow-template.vue)，按需 [assets/templates/manage-flow-template.vue](assets/templates/manage-flow-template.vue)、[assets/templates/dept-flow-template.vue](assets/templates/dept-flow-template.vue)

### 步骤 4：生成文件

命名转换（以 API 文件 `equ-material.ts` / 实体 `EquMaterial` 为例）：

| 项       | 值                           |
| -------- | ---------------------------- |
| 实体名   | `EquMaterial`（大驼峰）      |
| 变量前缀 | `equMaterial`（小驼峰）      |
| 文件名   | `equ-material`（kebab-case） |
| API 实例 | `equMaterialApi`（web 端 `<app>-service.ts` 中实例化） |

沿用 API 文件中现有的接口名、变量名、文件名，**不重新命名**。

按以下顺序生成/修改（**按步骤 2 选定的范围裁剪**）：

1. **修改** `<web端>/src/api/<app>-service.ts` —— import 中追加服务层导出的 Api 类，并加 `export const xxxApi = new XxxApi(baseApi)`（baseApi 来自 `@gy/sys-web`）；已实例化则跳过
2. **新建** `<web端>/src/views/<group>/<module>/<file>-table.vue` —— 列表页
3. **新建** `<web端>/src/views/<group>/<module>/components/<file>-form.vue` —— 表单弹窗

**工作流审批模块**（服务层 API 已由 generating-service-api 按 SysFlowForm 风格生成）：

1. 列表页用 table-flow-template 风格：`<web端>/src/views/<group>/<module>/<file>-table.vue`
2. 表单用 form-flow-template 风格：`<web端>/src/views/<group>/<module>/components/<file>-form.vue`
3. 需要菜单直接打开的完整页面时追加包装页：`<file>-manage.vue`（左列表右详情）、可选 `<file>-dept.vue`（部门入口）

**不生成 form 时**：列表页需同步去掉 `:getFormModalVm` 绑定、`<XxxForm v-if="formModalInit" ...>` 节点、formModal 相关 ref/函数和 import；按钮按需配置（如只读日志用 `useGyButton({ isDetail: true })`）。

**复杂模块**：若列表页需要额外业务 props（如外键 id 过滤）或逻辑较多，参考 `jail-journal-detail` 拆出 `use-<file>-table.ts` composable；简单 CRUD 全部内联在 table.vue 即可。

### 步骤 5：收尾

生成完成后告知用户：

- 生成了列表页时：需在系统菜单中添加该页面，组件路径为 `views/<group>/<module>/<file>-table`（工作流模块若生成了包装页，菜单指向 `...-manage` 或 `...-dept`）
- `lib/main.ts` 未导出该 API 时：提醒走 generating-service-api 补齐，否则 web 端 import 不到
- 外键字段：关联表取自 `formatterAEntitys`，列出所用显示列与选择组件，请用户确认
- 必填校验：无 NOT NULL 依据，仅对名称类主字段（或注释明确标注"必填"的字段）生成必填规则，提醒用户确认必填项是否合理
- 工作流模块：提醒确认 `flowKey` 与后端流程模型 key 一致；按 API 文件已有方法裁剪模板中注释掉的按钮与方法（`cancel`/`copy`/`checkXxx` 等），缺失的 API 方法由 generating-service-api 补齐

## 关键约定

- **职责边界**：服务层（service 包）的 API 文件、`lib/main.ts` 导出只读不写；发现缺失或不一致时提醒用户走 generating-service-api skill
- **速度优先**：除步骤 2 的一次确认外不再提问，直接生成全部文件
- **已有 API 为唯一事实来源**：字段、字典、外键、文件字段一律以服务层 API 文件为准，不猜测、不新建重复定义
- **字典字段**：表格列用 `prop="xxxValue"`，表单用 el-select 绑定 `dics.get(dicCode)`，筛选器用 `render: 'select'`
- **外键字段**：表格列用 `prop="xxxValue.<关联表显示列>"`（formatter 的 `formatterAEntitys` 在 API 文件中已配好）
- **文件字段**：表单用 el-upload + `fileListAll`（`FileFieldMap` 在 API 文件中已声明）
- **行操作与删除**：列表页绑定 `useGyTableHandleOptions`；标准物理删除走内置流程（`handleTableBtnMap: {}`），删除需填表单时覆盖 `handleDelete` 走 `showModal({ status: opt_delete, isDirect: true })`
- **按钮配置**：`useGyButton<Entity>({})` 带实体泛型；只读类 `{ isDetail: true }`；按状态显隐用 `showMethodFucMap`
- **多选列**：仅批量操作需要时才加 `type="selection"` 列
- **DefaultEntity 继承字段**（id、createTime、updateTime、createUserId、createRealName、updateUserId、updateRealName、isDelete、isSubmit、isSure、parentId）不重复声明、默认不生成表单项；个别（如 createTime）可作为表格列/查询条件
- **风格一致性**：代码结构、注释分隔线（如 `//-----------------列表----------------`）、命名习惯必须与模板一致
