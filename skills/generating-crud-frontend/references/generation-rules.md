# 生成规则

三种输入（**建表 SQL / Java 实体 / 已有前端 API**）到前端代码的映射规则。生成时逐字段应用。

## 目录

1. [仓库与包结构](#仓库与包结构)
2. [输入来源解析](#输入来源解析)
3. [字段过滤](#字段过滤)
4. [类型映射](#类型映射)
5. [字典字段识别](#字典字段识别)
6. [外键字段识别](#外键字段识别)
7. [文件字段识别](#文件字段识别)
8. [校验规则推断](#校验规则推断)
9. [查询条件推断](#查询条件推断)
10. [表格列生成](#表格列生成)
11. [行操作与删除风格](#行操作与删除风格)
12. [表单项生成](#表单项生成)
13. [工作流审批模块](#工作流审批模块)

---

## 仓库与包结构

`@gy` 系列仓库有两种常见形态，生成前先确认当前仓库属于哪种（模板占位符 `{{servicePackage}}` / `{{apiInstancesFile}}` / `{{appName}}` 按此取值）：

| 项 | 多应用形态（如 gy-admin-vue3） | 单服务层形态（如 jail-criminal） |
|----|------------------------------|----------------------------------|
| 服务层包 | 每应用一个包：`<app>-service` → `@gy/<app>-service` | 整仓库一个包：`service/<name>` → `@<scope>/<name>-service` |
| 服务层分组目录 | `src/api/<group>/` | `src/api/<group>/` |
| appName 常量 | `<app>AppName`，定义在 `src/api/api-service.ts` | 同左（全仓库共用一个） |
| Web 应用 | `<app>-web` | 整仓库一个 `app-<name>` |
| api 实例文件 | `<app>-web/src/api/<app>-service.ts` | 同左（一个文件实例化全部 Api） |
| 页面分组目录 | `src/views/<group>/` | `src/views/<group>/` |
| baseApi / GyTable 等 | 均来自 `@gy/sys-web` | 均来自 `@gy/sys-web` |

两类仓库均以各自**已有模块的实际文件**为准核对包名与路径，不要凭记忆拼写。

命名习惯：业务实体用领域词命名（与表名保持一致），参考目标应用 `src/views/` 下已有模块的命名风格。

---

## 输入来源解析

### 建表 SQL

逐字段解析：名称、类型、长度、NOT NULL、默认值、注释。字段名 snake_case → 驼峰（`material_name` → `materialName`）。

### Java 实体

- 类名即实体名（已是大驼峰）；`@TableName("xxx")` 提供表名（用于推断目标应用）
- 中文名来源：类上 `@Schema(title)` / `@ApiModel` / Javadoc 注释
- **只解析类自身声明的字段**；继承自基类（BaseEntity/DefaultEntity 等）的字段一律忽略
- 跳过 `serialVersionUID`、`static`、`transient` 字段
- 字段中文名优先级：`@Schema(description)` > `@ApiModelProperty(value)` > 行内/上方 `//`、`/** */` 注释 > 按字段名语义翻译

### 已有前端 API

该文件是**唯一事实来源**，不做额外推断：

- 实体接口字段与行尾注释 → 字段名、中文名
- `formatterDics` → 字典字段（dicCode 为真实值，无需占位推断）
- `formatterAEntitys` → 外键字段及关联表（显示列仍需按外键规则确认）
- `xxxFileFieldMap`（如有）→ 文件字段
- TS 类型即最终类型，**无需类型映射**
- 无 NOT NULL / 默认值信息：必填与初始化按保守策略（见校验规则推断），收尾提醒确认

## 字段过滤

以下字段由 `DefaultEntity` 基类提供，**不写入实体接口、不生成表单项**：

`id`、`create_time`、`update_time`、`create_user_id`、`create_real_name`、`update_user_id`、`update_real_name`、`is_delete`、`is_submit`、`is_sure`、`parent_id`

Java 实体中继承自基类的字段同理忽略（只解析类自身声明的字段即可自然过滤）。

其中 `create_time`、`create_real_name`（`createTime`、`createRealName`）可作为表格列和查询条件（参考 equ-cmd-log）。

## 类型映射

### SQL → TS

| SQL 类型 | TS 类型 | 表单组件 |
|----------|---------|----------|
| varchar / char / text / longtext | string | el-input（text 类或长描述用 `type="textarea" resize="none"`） |
| int / bigint / smallint（业务数值） | number | el-input-number |
| tinyint(1) / boolean / bit | boolean | el-switch |
| tinyint（非1位）/ 状态类字段 | string（走字典） | el-select |
| decimal / numeric / float / double | number | el-input-number |
| date | string | el-date-picker（type="date" value-format="YYYY-MM-DD"） |
| datetime / timestamp | string | el-date-picker（type="datetime" value-format="YYYY-MM-DD HH:mm:ss"） |
| 以 `_id` 结尾的关联字段 | string | 关联选择组件（见外键字段） |

### Java → TS

| Java 类型 | TS 类型 | 表单组件 |
|-----------|---------|----------|
| String | string | el-input（长描述/含 remark 语义用 `type="textarea" resize="none"`） |
| Integer / Long / Short / int / long / short / BigInteger | number | el-input-number |
| Boolean / boolean | boolean | el-switch |
| BigDecimal / Double / Float / double / float | number | el-input-number |
| LocalDate | string | el-date-picker（type="date" value-format="YYYY-MM-DD"） |
| Date / LocalDateTime / Timestamp | string | el-date-picker（type="datetime" value-format="YYYY-MM-DD HH:mm:ss"） |
| LocalTime | string | el-time-picker（value-format="HH:mm:ss"） |
| 枚举 / 其他对象类型 | string（结合字段名判断走字典或外键） | el-select / 关联选择组件 |

Java 字段名已是驼峰，无需转换；若有 `@JsonProperty` / `@JSONField` 注解则以注解值为准。

## 字典字段识别

满足任一条件即视为字典字段（三种输入判断依据相同）：

1. 字段名含 `status`、`type`（且非外键 `_id`/`Id`）、`sex`、`gender`、`level`、`category`、`kind`、`mode`
2. 字段注释中出现"字典"、"枚举"、"（1:…2:…）"这类取值说明
3. `is_` 开头的布尔字段：用 el-switch，或走 `true_false` 字典
4. Java 字段类型为枚举，或带 `@Schema` 字典说明的，同样按字典处理

字典处理：

- formatter 注册：`formatterDics: { cmdStatus: { dicCode: '<前缀>_<字段语义>' } }`，dicCode 按 `<表名前缀>_<字段语义>` 推断（如 `equ_cmd_status`），收尾时提醒用户确认
- 实体接口中该字段类型为 `string`
- **已有 API 输入**：dicCode 直接取 `formatterDics` 中的现有值，不重新推断

## 外键字段识别

以 `_id` / `Id` 结尾且指向业务表的字段（如 `equ_type_id`/`equTypeId`、`user_id`/`userId`）：

- formatter 注册（从同目录导入关联表的 url）：

```ts
import { equTypeUrl } from './equ-type'
// ...
formatterAEntitys: {
  equTypeId: [{ apiUrl: equTypeUrl }]
}
```

- 表格列：`prop="equTypeIdValue.<关联表显示列>"`（如 `.typeName`），不确定显示列名时读取关联表实体确认，仍不确定则在收尾时询问
- 表单/筛选：使用关联表的 `XxxSelectTable` 组件（若项目中已有，路径形如 `../equ-type/components/equ-type-select-table.vue`）；没有则收尾提醒用户
- 无法确定关联表时，降级为普通 el-input，并在收尾时说明
- **已有 API 输入**：外键以 `formatterAEntitys` 为准，仅需确认显示列与表单选择组件

## 文件字段识别

字段名/注释含 `url`、`file`、`img`、`image`、`photo`、`attachment`、`avatar`、素材类的（三种输入判断依据相同）：

- API 层声明（仅 SQL / Java 输入需要新建；已有 API 输入直接沿用现有 `FileFieldMap`）：

```ts
import type { FileFieldMap } from '@gy/sys-service'
export const xxxFileFieldMap: FileFieldMap = { materialUrl: 'self' }
```

- 表单：插槽解构加 `fileListAll`，用 el-upload + `gyForm?.uploadRequestAndDeleteOther(request, modelForm)`（参考 form-template.vue 注释示例）
- 表格：可用 audio/img 预览（参考 equ-material 的 audio 写法），或简单显示文件名

## 校验规则推断

生成 `rules` 对象（写在 form 组件中）：

| 条件 | 规则 |
|------|------|
| SQL：NOT NULL 且无默认值、非外键自动填充字段；Java：`@NotNull` / `@NotBlank` / `@NotEmpty` | `{ required: true, message: '请输入/请选择/请上传<中文名>', trigger: 'blur' }` |
| SQL：varchar(n)；Java：`@Size(max = n)` / `@Length(max = n)` | el-input 加 `:maxlength="n"` |
| 手机号（字段名/注释含手机/电话） | 追加 `{ pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }` |
| 邮箱（含 Java `@Email`） | 追加 `type: 'email'` 规则 |

有默认值的字段不强制必填。

**已有 API 输入**：无 NOT NULL 依据，仅对名称类主字段（或注释中明确标注"必填"的字段）生成必填规则，其余不加，收尾时提醒用户确认。

## 查询条件推断

列表页 `filterFieldMap`（通常 2~4 个，不要每字段都加；三种输入推断方式相同）：

| 字段特征 | 过滤方式 |
|----------|----------|
| 名称/标题类（第一个） | 作为**快速查询** `filterFieldQuick`（op: 'like'） |
| 描述/备注类 | `like` |
| 字典字段 | `equal` + `render: 'select'` + `dicCode: xxxFormatter.formatterDics?.field?.dicCode` |
| 外键字段 | `equal` + `component: XxxSelectTable`（有该组件时） |
| 时间字段 | `range` + `render: 'datetime'` |
| 操作人等 | `like`（createRealName） |

## 表格列生成

- 第一列固定：`<el-table-column label="序号" type="index" align="center" width="70" />`
- **多选列**：仅当模块有批量操作（批量导出/批量删除等，对应 `handleSingleBtnMap` 读 `table.value?.getSelectionRows()`）时才加 `<el-table-column type="selection" align="center" width="55" fixed="left" />`，并给序号列及首列加 `fixed="left"`；普通 CRUD 不加
- 字典字段：`prop` 用 `<field>Value`
- 外键字段：`prop` 用 `<field>Value.<显示列>`
- 时间/日期字段：加 `sortable="custom"`
- 名称/长文本类用 `min-width`，短定长字段（状态、编码）用 `width`；长文本可加 `show-overflow-tooltip`
- 名称/编号首列可做成 `el-link` 跳转详情（模板中有示例写法）
- 操作列由 `GyButtonTable` 提供，不用手写
- `defaultSort` 默认 `{ prop: 'createTime', order: 'descending' }`；有条款号/排序号类字段（如 `according`、`sortNum`）时改为按它升序

## 行操作与删除风格

列表页默认绑定 `:useGyTableHandleOptions="useGyTableHandleOptions"`（本仓库主流写法），未覆盖的操作走 GyTable 内置流程：

- **标准物理删除**：不覆盖 `handleTableBtnMap.handleDelete`，GyTable 内置确认框 + 删除即可，`handleTableBtnMap: {}` 保持空对象
- **删除需填表单**（如"撤销"要填理由、改状态而非物理删除）：覆盖 `handleDelete` 改走表单弹窗：

  ```ts
  async handleDelete(p_optRow) {
    gyTable.value?.showModal({
      status: opt_delete,
      entity: { id: p_optRow.id },
      isDirect: true
    })
  }
  ```

  此时 form 模板需配合：`opt-map-pre` 改名、`dialogStatus === opt_delete` 分支展示理由字段、`#footerPrefix` 自定义提交（调 `update` 改状态）。需从 `@gy/base` 导入 `opt_delete`
- **其他自定义行操作**（复制、确认、预览等）：同样用 `gyTable.value?.showModal({ status: 'xxx', entity: {...}, isDirect: true })` 或 `openWindow` 打开文件
- **批量按钮**：写在 `handleSingleBtnMap` 中，配合多选列；导出所有/导出选中二选一时参考 `handleExportBatByIds` 的 `showConfirmMsg` 写法（需从 `@gy/sys-web` 导入）
- **按钮配置**：`useGyButton<{{EntityName}}>({})` 必须带实体泛型；只读/详情类 `{ isDetail: true }`；按行状态显隐按钮用 `showMethodFucMap`（如 `deleteTableShow(row) { return !!row && row.status !== xxx_status_map.end.id }`，状态常量来自服务层导出的状态 map）

## 表单项生成

- `GyForm` 包裹，加 `append-to-body`，`apiTitle` 填模块中文名，常规 `:width="500"`（两列表单 800）
- `ElForm` 加 `:disabled="dialogStatus === opt_detail"`（需导入 `opt_detail`）
- 插槽解构：普通 `{ dialogStatus, modelForm, dics }`，有文件字段再加 `fileListAll`
- 布尔字段用 el-switch；数值用 el-input-number（非负加 `:min="0"`）；有默认值的字段在 `useGyFormOptions.initForm` 中初始化
- 打开弹窗需加工数据（如逗号分隔串转数组回填多选）时用 `useGyFormOptions.initForm`（参考 `jail-according-form.vue`）
- 操作标题改名（如删除→撤销）：GyForm 加 `:opt-map-pre="{ [opt_delete]: '撤销' }"`
- 自定义提交（批量保存、撤销改状态等非标准流程）：用 `#footerPrefix` 插槽放自定义按钮，脚本里调 `gyForm.value.handleBefore()` → api → `gyForm.value.handleAfter(res.data)`，最后 `gyForm.value.loading = false`
- 纯展示/日志类模块（只读）：表单项不加校验，按钮用 `useGyButton<X>({ isDetail: true })`

## 工作流审批模块

带审批流程的模块（发起 → 审批 → 归档）。**识别特征**（满足任一即按工作流模板生成）：

- 建表 SQL 含 `flow_status` / `flow_instance_id` 字段
- Java 实体 `extends SysFlowForm`（或含 flowStatus/flowInstanceId 字段）
- 用户明确说"审批"、"工作流"、"流程"

此时改用 `*-flow-template` 系列模板（api-flow / table-flow / form-flow / manage-flow / dept-flow），与普通 CRUD 模板的差异如下。

### 服务层（api-flow-template.ts）

- 实体继承 `SysFlowForm`（来自 `@gy/sys-service`），**不是** `DefaultEntity`；流程字段（flowStatus、flowInstanceId、runUserIds、runListTaskName 等）由基类提供，不声明；可加 `flowStatusValue: string` 展示字段
- `formatterDics.flowStatus` 的 dicCode 为项目的流程状态字典编码（占位符 `{{flowStatusDicCode}}`，收尾时向用户确认；若项目服务层已有统一常量则直接复用，勿重复定义）
- `formatterAEntitys` 展开 `...flowRunUserIdsFormatter`（来自 `@gy/sys-service`），支撑列表页"当前处理人"列
- 自定义接口用 `this.httpRequest({ url: this.url + '/xxx', ... })`：`cancel(id)`（GET 撤销）；按需 `copy(params)`、`checkXxx(entity)`（提交前校验）、`uploadById(id, files)`（FormData）
- 业务类型常量（同表多业务类型时）：`export const xxx_approve_type_daily = 'daily'` 风格
- 流程状态 → el-tag 类型：模板内置基于 `FLOW_STATUS_START/END/CANCEL`（`@gy/sys-service`）的通用 `getFlowStatusTag`；若项目已有基于字典的统一实现，优先复用项目版本
- 编辑按钮显隐：模板内置通用 `updateTableShow`（我的草稿视图 + 创建人 + 未审批可编辑）；项目有更细规则时在 `showMethodFucMap` 中调整

### 列表页（table-flow-template.vue）

- 状态列固定写法：`<el-tag :type="getFlowStatusTag(dics, row.flowStatus)">{{ row.flowStatusValue || '草稿' }}</el-tag>`
- 插槽解构加 `runShow`；`runShow` 时渲染"当前处理人"（`:formatter="formatterRunUserIdsValue"`）与"当前处理步骤"（`formatterRunListTaskName`）两列，均来自 `@gy/sys-service`
- 撤销行样式：el-table 加 `:row-class-name`，`flowStatus === FLOW_STATUS_CANCEL` 时加 `cancel-row` 类；该类样式已全局定义在 `src/styles/index.scss`（背景色+斜纹），页面内不要重复定义。`FLOW_STATUS_CANCEL` 来自 `@gy/sys-service`
- `useGyTableOptions.getListSetting` 用 `getListSettingCommon(...)`（`@gy/sys-web`）并追加 `{ field: 'flowStatus', op: 'notEqual', value: FLOW_STATUS_CANCEL }` 排除已撤销
- 撤销按钮：`handleCancel` → `showConfirmMsg('确认撤销吗？')` → `api.cancel(id)` → `handleRefresh()`（撤销走后端接口，不走表单弹窗）
- 流程按钮（发起/处理/撤销）由 `useGyButton` 按 `props.flowQueryType`（`GyTableProps` 已含）**自动注入**，页面在 `showMethodFucMap` 提供同名显隐函数：`updateTableShow`（编辑）、`flowJumpStartShow`（发起，用 `flowJumpStartShowC(row)`）、`flowHandleShow`（处理，用 `flowHandleShowC(props.flowQueryType, row, userId)`）、`flowCancelShow`（内置撤销，一般置 `false` 改用自定义撤销按钮）
- `GyButtonTable` 加 `:menuLength="2"` 与 `:column-props="{ width: '130' }"`
- 支持行点击联动详情（`@current-change` + `setCurrentRow`），并透传 `#gyTableStart` / `#gyTableEnd` 插槽供 manage 页注入

### 表单（form-flow-template.vue）

- `GyForm` 必须配 `:flowKey="'<流程定义 key>'"`（后端流程模型的 key，收尾时向用户确认）
- 插槽解构加 `flowNode`（`ActSelfNode`，流程节点配置，`flowNode?.documentObj?.enableEdit/enableApprove` 控制审批时可否编辑）
- 锁定规则 `getDisabled`：`opt_detail` 锁、`opt_update` 放开、其余看 `!!modelForm.flowInstanceId`（提交过流程即锁）
- `useGyFormOptions.initForm` 中新建草稿默认 `options.entity.flowStatus = null`
- `handleValidBefore(status)`：用 `gyForm.value?.flowBtn` 区分"流程按钮提交"与"保存草稿"；`handleValidAfter`：提交前业务校验（`checkXxx` 返回错误数组时 `showConfirmMsg(..., { dangerouslyUseHTMLString: true })` 二次确认）
- 流程历史：需要时用 `:flow-his-list-hide` 隐藏

### 包装页（可选）

- `<file>-manage.vue`：左列表右详情卡片，列表透传的 `#gyTableEnd` 里放 `<XxxForm showType="div" :flowHisListHide="true">`，`@current-change` 时 `showModal({ status: opt_detail, entity })`；props 接 `byDeptId` / `flowQueryType: FlowQueryType`
- `<file>-dept.vue`：薄包装，取当前用户主部门（如 `useUserStore().userInfo.deptIds[0]`，或项目自有的权限工具），`flowQueryType="all"`
- 菜单组件路径：菜单直接指向 manage 或 dept 页时注册 `views/<group>/<module>/<file>-manage` 或 `-dept`；待办/草稿视图由流程中心（sys-web）以 `flowQueryType="create"/"run"` 复用 table 页

### 收尾补充（工作流模块）

- 提醒用户确认 `flowKey` 与后端流程模型 key 一致
- 提醒用户确认流程状态字典编码（`{{flowStatusDicCode}}`）
- 提醒确认 `cancel`/`copy`/`checkXxx` 等自定义后端接口是否存在，删除不存在的按钮与方法
