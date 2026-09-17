# 生成规则（uni-app 端）

三种输入（**已有前端 API / 建表 SQL / Java 实体**）到 uni-app 页面代码的映射规则。生成时逐字段应用。

## 目录

1. [应用结构](#应用结构)
2. [输入来源解析](#输入来源解析)
3. [字段过滤](#字段过滤)
4. [类型映射](#类型映射)
5. [字典字段识别](#字典字段识别)
6. [外键字段识别](#外键字段识别)
7. [文件字段识别](#文件字段识别)
8. [校验规则推断](#校验规则推断)
9. [查询条件推断](#查询条件推断)
10. [卡片生成（列表行）](#卡片生成列表行)
11. [按钮配置](#按钮配置)
12. [表单项生成](#表单项生成)
13. [initForm 默认值](#initform-默认值)
14. [高级列表模式](#高级列表模式)
15. [工作流审批模块](#工作流审批模块)
16. [页面注册](#页面注册)
17. [select-list 选择列表变体](#select-list-选择列表变体)

---

## 应用结构

`@gy` uni 应用（uni-app + Vue 3 + tmui + pnpm monorepo）的公认结构：

| 项 | 位置 / 来源 |
|----|-------------|
| Gy 组件（gy-list、gy-form、gy-button、gy-filter、gy-select、gy-tm-pick 等） | 应用内 `src/gy/components/`，页面用 `@/gy/components/...` 相对别名导入 |
| composable 与类型 | `@gy/sys-uni`：useGyButton、useUserStore、GyListProps、UseGyListOptionsO、UseGyListHandleOptionsO、UseGyFormOptionsO、getListSettingCommon、px2Upx |
| 基础类型 | `@gy/base`：TermMapKey、TermMap、ModelForm、opt_detail、opt_save、opt_update、opt_flowHandle、setDefault |
| 流程类型 | `@gy/sys-service`：FlowQueryType、flowHandleShowC、ActSelfNode、FLOW_STATUS_START/END/CANCEL |
| UI 组件库 | `src/tmui/`（tm-app、tm-navbar、tm-form、tm-form-item、tm-input、tm-sheet、tm-text、tm-radio-group、tm-checkbox-group、tm-time-picker、tm-switch、tm-tag、tm-descriptions 等），导入方式（显式/自动）以项目现有页面为准 |
| 服务层 | 业务 service 包：实体接口、`xxxUrl`、`xxxFormatter`（可选 `xxxFileFieldMap`） |
| Api 实例 | 应用侧 `src/api/*-service.ts`（`new XxxApi(baseApi)`，baseApi 来自 `@gy/sys-uni`） |
| 页面 URL 常量 | `src/api/pages-urls.ts`（`xxxListUrl`/`xxxFormUrl`，按模块加中文分组注释） |
| 路由注册 | `src/pages.json`（JSONC；第一项为启动页） |
| 业务页面 | `src/pages/<areaDir>/<module>/list|form/...`，areaDir 为项目自定分组 |

生成前必须在目标应用中找一个现有业务模块核对以上路径与命名，**不要凭记忆拼写**。

## 输入来源解析

### 已有前端 API（首选）

该文件是**唯一事实来源**，不做额外推断：

- 实体接口字段与行尾注释 → 字段名、中文名
- `formatterDics` → 字典字段（dicCode 为真实值）
- `formatterAEntitys` → 外键字段及关联表
- `xxxFileFieldMap`（如有）→ 文件字段
- TS 类型即最终类型，无需类型映射
- 实体 `extends SysFlowForm` 或含 `flowStatus` 字段 → 工作流审批模块
- 无 NOT NULL 信息：必填按保守策略（见校验规则推断），收尾提醒确认

### 建表 SQL / Java 实体

解析规则与 web 端技能 `generating-crud-frontend` 相同：

- SQL：逐字段解析名称、类型、长度、NOT NULL、默认值、注释；字段名 snake_case → 驼峰
- Java：类名即实体名；只解析类自身声明的字段（忽略基类字段、serialVersionUID、static）；中文名优先级 `@Schema(description)` > `@ApiModelProperty` > 注释 > 字段名语义
- 工作流特征：SQL 含 `flow_status`/`flow_instance_id`；Java `extends SysFlowForm`
- 服务层需已有对应导出（实体/Url/Formatter）；若缺失，提示用户先用 `generating-service-api` 技能生成 API 层，本技能不代生成服务层

## 字段过滤

以下字段由 `DefaultEntity`/`SysFlowForm` 基类提供，**不生成表单项**：

`id`、`createTime`、`updateTime`、`createUserId`、`createRealName`、`updateUserId`、`updateRealName`、`isDelete`、`isSubmit`、`isSure`、`parentId`；工作流另有 `flowStatus`、`flowInstanceId`、`runUserIds`、`runListTaskName` 等。

其中 `createTime`、`createRealName` 可作卡片字段、筛选条件与排序字段。

## 类型映射

SQL / Java 类型 → TS 类型与 tmui 表单控件：

| 类型（SQL / Java） | TS 类型 | 表单控件 |
|--------------------|---------|----------|
| varchar / char / String | string | `tm-input` |
| text / longtext / 长描述语义 | string | `tm-input type="textarea" :auto-height="true"` |
| int / bigint / decimal / Integer / Long / BigDecimal | number | `tm-input type="number"` |
| tinyint(1) / boolean / Boolean | boolean | `tm-switch` |
| tinyint（非1位）/ 状态类 / 枚举 | string（走字典） | `tm-radio-group`（选项少）/ 字典 picker（选项多） |
| date / LocalDate | string | `tm-time-picker`（showDetail 只开 year/month/day）+ `GyTmPick`，format="YYYY-MM-DD" |
| datetime / timestamp / Date / LocalDateTime | string | `tm-time-picker`（全精度）+ `GyTmPick`，format="YYYY-MM-DD HH:mm:ss" |
| 以 `_id`/`Id` 结尾的关联字段 | string | 外键控件（见外键字段识别） |

多选字典（逗号分隔字符串存储）用 `tm-checkbox-group` + split/join（见 form-template.vue 注释示例）。

## 字典字段识别

与 web 端规则相同：字段名含 `status`、`type`（非外键）、`sex`、`gender`、`level`、`category`、`kind`、`mode`，或注释含取值说明（"字典"、"枚举"、"（1:…2:…）"）。

- 卡片显示用 `xxxValue`（Formatter 依据 formatterDics 自动生成）
- 表单：`dics.get(xxxFormatter.formatterDics?.field?.dicCode)` 渲染 tm-radio-group / tm-checkbox-group，外层加 `v-if="xxxFormatter.formatterDics?.field?.dicCode"` 防御
- 筛选：`render: 'select'` + dicCode
- SQL/Java 输入时 dicCode 按 `<表名前缀>_<字段语义>` 推断占位，收尾提醒确认；已有 API 输入直接取 formatter 现值

## 外键字段识别

以 `_id`/`Id` 结尾且指向业务表的字段：

- 卡片：`xxxValue.<关联表显示列>`（formatterAEntitys 生效后关联实体挂在 `xxxValue`）；显示列不确定时读关联表实体确认，仍不确定则收尾询问
- 表单/筛选，按优先级：
  1. 项目已有该关联实体的 select-list 弹窗组件（`@/pages/.../<name>-select-list.vue` 或 `@/gy/pages/sys/...`）→ 直接复用
  2. 简单关联（字典式小表）→ `GySelectRemote` / `GySelectRemoteInput`（`@/gy/components/gy-select/`），传关联表 apiUrl
  3. 都没有 → 降级为 tm-input 并收尾说明，或按需生成 select-list（见文末）

## 文件字段识别

字段名/注释含 `url`、`file`、`img`、`image`、`photo`、`attachment`、`avatar` 的：

- 服务层已有 `xxxFileFieldMap` 时，`useGyListHandleOptions` 加 `fileFieldMap: xxxFileFieldMap`（列表侧支撑图片/附件回显）
- 表单上传控件**因项目而异**（gy-upload 等）：查看目标应用 `src/gy/components/` 是否有上传组件，有则参考项目现有表单用法；没有则收尾提醒用户补控件，不要凭空造

## 校验规则推断

tm-form-item 用 `field` + `:rules="rules.<field>"`。`rules` 格式以项目现有表单为准，通常：

```ts
const rules = computed<Record<string, any>>(() => {
  if (disabled.value) {
    return {}
  }
  return {
    name: [{ required: true, message: '请输入名称' }],
    type: [{ required: true, message: '请选择类型' }]
  }
})
```

| 条件 | 规则 |
|------|------|
| SQL：NOT NULL 且无默认值；Java：`@NotNull`/`@NotBlank`/`@NotEmpty` | `[{ required: true, message: '请输入/请选择<中文名>' }]` |
| SQL：varchar(n)；Java：`@Size(max=n)` | tm-input 加 `:maxlength="n"` |
| 手机号 | 追加 `{ pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' }` |

已有 API 输入：仅对名称类主字段（或注释明确"必填"）生成必填规则，其余不加，收尾提醒确认。

## 查询条件推断

`use-<file-name>-list.ts` 中（通常 2~4 个，不要每字段都加）：

| 字段特征 | 配置 |
|----------|------|
| 名称/标题类（第一个） | **快速查询** `filterFieldQuick`：`new TermMapKey(field, 'like')` + placeholder |
| 描述/备注类 | filterFieldMap：`like` |
| 字典字段 | `equal` + `render: 'select'` + `dicCode: xxxFormatter.formatterDics?.field?.dicCode` |
| 外键字段 | `equal` + `render: 'component'` + `component: XxxSelectList`（有该组件时） |
| 时间字段 | `range` + `render: 'datetime'`（labelWidth 视标签长度调整，如 220） |
| 操作人等 | `like`（createRealName） |

排序 `orders` 默认 `[{ field: 'createTime', op: 'desc' }, { field: 'id', op: 'desc' }]`；有排序号类字段（sortNum、according）时改按它升序。

## 卡片生成（列表行）

移动端列表是卡片流（GyList `#row` 插槽），不是表格。规则：

- 外层 `tm-sheet`（`:border="1" :round="2" :padding="[16, 16]" :margin="[25, 25]" style="width: 700rpx"`）
- **标题行**：名称/姓名等主字段（`tm-text :font-size="36"` + `text-weight-b`）；工作流模块右上角加流程状态 `tm-tag`
- **内容行**：每行一个内层 `tm-sheet`（color 区分语义：primary/green/orange 等），行内 `tm-text class="attr-item"` 显示 `标签：{{ row.field }}`
- 字典字段显示 `xxxValue`，外键显示 `xxxValue.列`，时间直接显示
- 敏感/长文本字段考虑脱敏或截断（参考项目现有卡片）
- 底部 `GyButtonList`（行按钮）
- `itemHeight`：按卡片内容估算（单标题+单内容行约 300~360，三行内容约 480~500），收尾提醒联调校准

## 按钮配置

`useGyButton<Entity>({...})` 必须带实体泛型：

- 标准 CRUD：`{}`（内置新增/修改/删除）；只读/日志类：`{ isDetail: true }`
- 按行状态显隐：`showMethodFucMap: { deleteTableShow(row) {...}, updateTableShow(row) {...} }`
- 自定义行操作：在 `useGyListHandleOptions.handleTableBtnMap` 中实现，配合 `gyList.value?.showModal({ status: 'xxx', entity: row })` 打开表单自定义态；表单侧用 `optMapPre` 给自定义态命名（如 `{ updateLeader: '回复' }`）
- 拦截页面按钮（新增前校验）：`handleSingleBtnMap: { async handleSave(common) { if (不满足) { showWarningMsg('...'); return } await common() } }`

## 表单项生成

- `GyForm` 包裹 + `tm-form`（`:labelWidth="180"` 以项目为准，`:modelValue="modelForm"`，`@submit="gyForm?.onSubmit"`）
- 插槽解构：普通 `{ dialogStatus, modelForm, dics }`；工作流再加 `flowBtnList, flowMsg, flowNode`
- 每个字段一个 `tm-form-item`（label、field、:rules、:required）
- 详情态只读：`disabled` computed 基于 `formStatus === opt_detail`（工作流版本见 flow 模板）
- 字段分组多时用 `tm-divider`（`color="primary" font-color="primary" label="分组名"`）分隔
- 底部 `GyFormButton`：validate 走 `tmForm?.validateIsPass()`，submit 走 `tmForm?.submit()`；需要完全自定义按钮时用其 `#default` 插槽

## initForm 默认值

新增时的默认值在 `useGyFormOptions.initForm` 中注入（仅 `!entity.id` 时），**必须**最后 `await initFormCommon(initFormOptions)`：

```ts
async initForm(initFormCommon, initFormOptions) {
  if (!initFormOptions.entity.id) {
    setDefault(initFormOptions.entity, 'type', 'xxx')
    setDefault(initFormOptions.entity, 'startTime', dayjs().format('YYYY-MM-DD HH:mm:00'))
  }
  await initFormCommon(initFormOptions)
}
```

工作流模块新建草稿：`initFormOptions.entity.flowStatus = null`。
打开表单需加工数据（逗号串转数组回填多选等）也在这里做。

## 高级列表模式

- **use-list 带参签名**：查询逻辑需要列表 props 或 gyList 实例时，`useXxxList(_props: XxxListProps, _gyList: any)`，list.vue 调用处传 `(props, gyList)`
- **前提查询条件 termMapLimitAll**：合并外部传入的 `props.termMapLimit` 与本页固有条件，绑定到 GyList `:termMapLimit`
- **getListSetting 完全接管查询**（角色数据权限等）：`useGyListOptions.getListSetting(termMapLimit, termMap, orders)` 内组装 `termMap['字段;匹配方式'] = 值`（value 为 null 清除条件），最后 `return getListSettingCommon(termMapLimit, termMap, orders)`；此时 `isInitList: false`，由外部触发加载
- **动态 formUrl 参数**：`getFormUrl()` 返回 `${formUrl}?key=value`，表单页 props 接收
- **itemHeight 校准**：虚拟滚动行高，联调时实测修正

## 工作流审批模块

识别特征同 web 端（flow_status 字段 / extends SysFlowForm / 用户明确说审批）。改用 `list-flow-template.vue` + `form-flow-template.vue`，要点：

- **表单**：`useGyFormOptions.flowKey`（后端流程模型 key，收尾确认）；`GyForm :flowHisListHide="true"`（不需历史时）；监听 `@update:flow-node`；禁用逻辑区分 `opt_detail`（锁）与 `opt_flowHandle`（`!!modelForm.flowInstanceId` 提交过即锁）；个别字段按 `flowNode?.documentObj?.enableEdit` 放开；已撤销样式 `:class="{ 'canctm-card': modelForm.flowStatus === FLOW_STATUS_CANCEL }"`（样式类以项目全局定义为准）
- **列表**：`useGyButton` 配 `isFlowCancel: false` + `showMethodFucMap: { hisListShow() { return false }, flowHandleShow(row) { return flowHandleShowC(props.flowQueryType, row, userStore.userInfo.userId) } }`；卡片显示流程状态（`row.flowStatusValue || '草稿'`）；流程中心/待办入口以 `flowQueryType`（'create'/'run'/'all'）复用列表页
- **撤销**：web 端走 api.cancel；uni 端如需撤销按钮，在 handleTableBtnMap 自定义并调服务层 cancel 接口后 `gyList.value?.handleRefresh()`

## 页面注册

**URL 常量**：追加到 `src/api/pages-urls.ts` 末尾，带中文注释：

```ts
// {{模块中文名}}
export const {{entityName}}ListUrl = '/pages/{{areaDir}}/{{file-name}}/list/{{file-name}}-list-page'
export const {{entityName}}FormUrl = '/pages/{{areaDir}}/{{file-name}}/form/{{file-name}}-form'
```

`use-<file-name>-list.ts` 的 `getFormUrl()` 引用 FormUrl 常量；其他页面跳转引用 ListUrl 常量。

**pages.json**：`pages` 数组**末尾**追加（JSONC 可带注释；绝不能动第一项——启动页）：

```json
// {{模块中文名}}列表
{
  "path": "pages/{{areaDir}}/{{file-name}}/list/{{file-name}}-list-page"
},
// {{模块中文名}}表单
{
  "path": "pages/{{areaDir}}/{{file-name}}/form/{{file-name}}-form"
}
```

**入口**：移动端页面通常从首页宫格/菜单跳转（`uni.navigateTo({ url: xxxListUrl })`），入口配置方式因项目而异（静态配置或后端菜单），收尾时提醒用户添加入口。

## select-list 选择列表变体

当本模块需要被其他模块的表单/筛选以弹窗选择（如人员选罪犯、表单选车辆），追加 `<file-name>-select-list.vue`：

- 骨架：`GySelectList`（`@/gy/components/gy-select/`）+ `#row-title` 插槽内 `tm-descriptions` 展示字段 + `#reference` 插槽透传
- props/emits：`v-bind="props"`、`update:modelValue`、`change`、`handleSure`
- 复用本模块的 `use-<file-name>-list.ts`（filterFieldQuick/filterFieldMap/useGyListOptions）+ `termMapLimitAll`
- **以目标应用现有 select-list 文件为基准**生成（各项目 GySelectList 的 props 细节可能有差异）
