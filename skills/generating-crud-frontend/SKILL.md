---
name: generating-crud-frontend
description: 仅供手动调用，请勿自动触发
---

# 生成 CRUD 前端模块

根据 **建表 SQL、Java 实体类、已有前端 API 类** 三种输入之一，一次性生成与项目现有风格完全一致的 CRUD 前端代码：实体接口 + API 类、列表页、表单弹窗，并完成所有注册。

支持两类模块：**普通 CRUD** 与**工作流审批**（实体带 `flow_status`/`flow_instance_id` 或继承 `SysFlowForm`，含发起/审批/撤销/归档，使用 `*-flow-template` 系列模板并可生成 manage/dept 包装页）。

## 输入来源

| 输入                     | 识别特征                                                                                     | 可生成范围                             |
| ------------------------ | -------------------------------------------------------------------------------------------- | -------------------------------------- |
| 建表 SQL（CREATE TABLE） | 用户粘贴 SQL 语句                                                                            | api + table + form                     |
| Java 实体类              | 粘贴 Java 代码或给出 `.java` 文件路径（含 `@TableName`/`@Data`/`extends BaseEntity` 等特征） | api + table + form                     |
| 已有前端 API 类          | 给出 `<app>-service/src/api/**/*.ts` 路径，或明确说"api 已有，只生成页面"                    | table + form（API 不重建，按需补注册） |

## 项目架构要点

这是 `@gy` 框架的 pnpm monorepo，GyTable、GyForm、useGyButton、baseApi 等**全部从 `@gy/sys-web` 导入**。常见两种仓库形态（详见 references/generation-rules.md 的"仓库与包结构"）：

- **多应用形态**：每个业务应用由 `<app>-service`（接口层）+ `<app>-web`（页面层）组成；**sys-web / sys-service 是基础模块**，其他应用依赖它
- **单服务层形态**：整个仓库一个服务层包 + 一个 Web 端；服务层按 `src/api/` 子目录分组，Web 端在一个 api 实例文件中用 `@gy/sys-web` 的 `baseApi` 实例化全部 Api 类
- **sys-web 自身**的页面：用相对路径导入组件（参考 `sys-web/src/views/sys/role/`）
- 路由由数据库菜单动态生成，无需改路由文件

## 工作流

### 步骤 1：识别输入来源并解析

**A. 建表 SQL** —— 从 CREATE TABLE 中提取：

- 表名、表注释（COMMENT）
- 每个字段的：字段名、类型、长度、NOT NULL、默认值、注释
- 主键字段
- **工作流特征**：含 `flow_status` / `flow_instance_id` / `run_user_ids` 字段 → 工作流审批模块

**B. Java 实体类** —— 若用户给的是文件路径，先读取文件。提取：

- 类名（即实体名，已是大驼峰）；类上注释 / `@Schema(title)` / `@ApiModel` → 中文名
- `@TableName("xxx")` → 表名（用于推断目标应用）
- 类自身声明的字段：字段名（已是驼峰）、Java 类型、注释（优先 `@Schema(description)` / `@ApiModelProperty`，其次行内或上方 `//`、`/** */` 注释）、校验注解（`@NotNull`、`@NotBlank`、`@Size`、`@Length`、`@Email` 等）
- 忽略继承自基类（BaseEntity/DefaultEntity 等）的字段与 `serialVersionUID`、`static` 字段
- **工作流特征**：`extends SysFlowForm`（或含 flowStatus/flowInstanceId 字段）→ 工作流审批模块

**C. 已有前端 API 类** —— 读取该文件，提取：

- 实体接口字段：名称、TS 类型、行尾中文注释
- `formatterDics` → 字典字段及真实 dicCode
- `formatterAEntitys` → 外键字段及关联表
- `xxxFileFieldMap`（如有）→ 文件字段
- url 常量 → 实体小驼峰名与 appName
- **工作流特征**：实体 `extends SysFlowForm` 或含 `flowStatus` 字段 → 工作流审批模块
- 检查注册状态：`lib/main.ts` 是否已导出、目标应用 `src/api/<app>-service.ts` 是否已实例化

### 步骤 2：确认目标位置与范围（只问一次）

用一次 AskUserQuestion 同时确认（能推断的给出默认选项）：

1. **目标应用**：多应用形态选哪个 service/web 对；单服务层形态固定为唯一的服务层 + Web 端，只需确认分组。推断依据：表名前缀 / Java `@TableName` 前缀 / API 文件所在 service 包
2. **模块分组**：service 下 `src/api/` 的子目录、web 下 `src/views/` 的子目录（参考该应用已有分组）
3. **模块中文名**：用于页面 title 和表单 apiTitle。默认：SQL 取表注释；Java 取类注释或 `@Schema(title)`；已有 API 取实体接口注释/文件名语义
4. **生成范围**（multiSelect）：
   - **SQL / Java 输入**：API 封装（含实体接口，必选）、列表页（table）、表单弹窗（form）。默认全选。常见组合：仅 API（后端页面已有或暂不需要页面）、api + table（日志/只读类，无 form）、全选（标准 CRUD）
   - **已有 API 输入**：列表页（table）、表单弹窗（form）。默认全选（API 已存在，无需再选）
5. **模块类型**：标准 CRUD / 工作流审批。默认按步骤 1 的特征自动判定（能推断时不必问）；判定为工作流时追加确认 `flowKey`（流程定义 key）与是否需要 manage/dept 包装页

### 步骤 3：加载模板与规则

1. 读取 [references/generation-rules.md](references/generation-rules.md) —— 各输入来源的解析、字段映射、校验、查询条件、字典/外键/文件字段规则
2. 按范围读取模板：
   - SQL / Java 输入（标准 CRUD）：[assets/templates/api-template.ts](assets/templates/api-template.ts)、table/form 模板
   - 已有 API 输入（标准 CRUD）：仅 [assets/templates/table-template.vue](assets/templates/table-template.vue)、[assets/templates/form-template.vue](assets/templates/form-template.vue)
   - 工作流审批模块：改用 [assets/templates/api-flow-template.ts](assets/templates/api-flow-template.ts)、[assets/templates/table-flow-template.vue](assets/templates/table-flow-template.vue)、[assets/templates/form-flow-template.vue](assets/templates/form-flow-template.vue)，按需 [assets/templates/manage-flow-template.vue](assets/templates/manage-flow-template.vue)、[assets/templates/dept-flow-template.vue](assets/templates/dept-flow-template.vue)

### 步骤 4：生成文件

命名转换（以表 `equ_material` / 实体 `EquMaterial` 为例）：

| 项       | 值                           |
| -------- | ---------------------------- |
| 实体名   | `EquMaterial`（大驼峰）      |
| 变量前缀 | `equMaterial`（小驼峰）      |
| 文件名   | `equ-material`（kebab-case） |
| URL 路径 | `${equAppName}/equMaterial`  |
| API 类名 | `EquMaterialApi`             |

- Java 实体：类名即实体名，直接按上表派生变量前缀、文件名、URL、API 类名
- 已有 API：沿用文件中现有的接口名、变量名、文件名，**不重新命名**

**SQL / Java 输入**，按以下顺序生成/修改（**按步骤 2 选定的范围裁剪**）：

1. **新建** `<服务层>/src/api/<group>/<file>.ts` —— 实体接口 + formatter + url + Api 类
2. **修改** `<服务层>/lib/main.ts` —— 在对应分组注释下追加 `export * from '../src/api/<group>/<file>'`
3. **修改** `<web端>/src/api/<app>-service.ts` —— import 中追加 Api 类，并加 `export const xxxApi = new XxxApi(baseApi)`（baseApi 来自 `@gy/sys-web`）
4. **新建** `<web端>/src/views/<group>/<module>/<file>-table.vue` —— 列表页
5. **新建** `<web端>/src/views/<group>/<module>/components/<file>-form.vue` —— 表单弹窗

**已有 API 输入**：

1. 若步骤 1 发现未注册：**修改** `<服务层>/lib/main.ts` 补导出；**修改** `<web端>/src/api/<app>-service.ts` 补 import 与实例化；已注册则跳过
2. **新建** `<web端>/src/views/<group>/<module>/<file>-table.vue` —— 列表页
3. **新建** `<web端>/src/views/<group>/<module>/components/<file>-form.vue` —— 表单弹窗（选定 form 时）

**工作流审批模块**（在上述对应清单基础上替换/追加）：

1. 服务层文件改用 api-flow-template 风格（实体继承 `SysFlowForm`，formatter 挂流程状态字典与 `flowRunUserIdsFormatter`，含 `cancel` 等自定义接口）
2. 列表页用 table-flow-template 风格：`<web端>/src/views/<group>/<module>/<file>-table.vue`
3. 表单用 form-flow-template 风格：`<web端>/src/views/<group>/<module>/components/<file>-form.vue`
4. 需要菜单直接打开的完整页面时追加包装页：`<file>-manage.vue`（左列表右详情）、可选 `<file>-dept.vue`（部门入口）

**不生成 form 时**：列表页需同步去掉 `:getFormModalVm` 绑定、`<XxxForm v-if="formModalInit" ...>` 节点、formModal 相关 ref/函数和 import；按钮按需配置（如只读日志用 `useGyButton({ isDetail: true })`）。

**复杂模块**：若列表页需要额外业务 props（如外键 id 过滤）或逻辑较多，参考 `jail-journal-detail` 拆出 `use-<file>-table.ts` composable；简单 CRUD 全部内联在 table.vue 即可。

### 步骤 5：收尾

生成完成后告知用户：

- 生成了列表页时：需在系统菜单中添加该页面，组件路径为 `views/<group>/<module>/<file>-table`（工作流模块若生成了包装页，菜单指向 `...-manage` 或 `...-dept`）
- 字典字段（SQL / Java 输入）：列出推断的字段与占位 dicCode，请用户确认真实字典编码；已有 API 输入的 dicCode 直接取自 formatter，无需确认
- 外键字段：列出推断的关联表，请用户确认关联关系（已有 API 输入时关联表取自 `formatterAEntitys`，仅需确认显示列）
- 仅生成 API 时：跳过菜单提醒，只提示已在 main.ts 和 api-service.ts 完成注册
- 已有 API 输入时：必填校验无 NOT NULL 依据（除非实体注释标明），提醒用户确认必填项是否合理
- 工作流模块：提醒确认 `flowKey` 与后端流程模型 key 一致；确认 `cancel`/`copy`/`checkXxx` 等自定义后端接口是否存在，按需删减模板中注释掉的按钮与方法

## 关键约定

- **速度优先**：除步骤 2 的一次确认外不再提问，直接生成全部文件
- **已有 API 为唯一事实来源**：从已有 API 生成页面时，字段、字典、外键、文件字段一律以该文件为准，不猜测、不新建重复定义
- **字典字段**：表格列用 `prop="xxxValue"`，表单用 el-select 绑定 `dics.get(dicCode)`，筛选器用 `render: 'select'`
- **外键字段**：formatter 配 `formatterAEntitys`，表格列用 `prop="xxxValue.<关联表显示列>"`
- **文件字段**：声明 `FileFieldMap`，表单用 el-upload + `fileListAll`
- **行操作与删除**：列表页绑定 `useGyTableHandleOptions`；标准物理删除走内置流程（`handleTableBtnMap: {}`），删除需填表单时覆盖 `handleDelete` 走 `showModal({ status: opt_delete, isDirect: true })`
- **按钮配置**：`useGyButton<Entity>({})` 带实体泛型；只读类 `{ isDetail: true }`；按状态显隐用 `showMethodFucMap`
- **多选列**：仅批量操作需要时才加 `type="selection"` 列
- **DefaultEntity 继承字段**（id、createTime、updateTime、createUserId、createRealName、updateUserId、updateRealName、isDelete、isSubmit、isSure、parentId）不重复声明、默认不生成表单项；个别（如 createTime）可作为表格列/查询条件
- **风格一致性**：代码结构、注释分隔线（如 `//-----------------列表----------------`）、命名习惯必须与模板一致
