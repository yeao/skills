# 按钮参考（Btn / useGyButton / 默认 handler）

来源：外部框架包 `@gy/base`（`base/src/router/btn.ts`）与 `@gy/sys-web`（`sys-web/src/use/gy-button/gy-button.ts`、`sys-web/src/use/gy-table/gy-table-handle.ts`、`sys-web/src/components/gy-button/*`）。**只读参考，勿在本仓库改其实现。**

---

## 1. `Btn<T>` 接口（完整）

```ts
type BtnType = 'default' | 'success' | 'warning' | 'info' | 'primary' | 'danger'

interface Btn<T extends Record<string, any>> {
  id?: string                                  // 按钮标识，服务端权限匹配用；内联可空
  authType: 'btn_single' | 'btn_table'         // 页面按钮 / 行内按钮（用常量 auth_type_btn_single / auth_type_btn_table）
  title: string                                // 按钮文字
  icon: string                                 // 图标：el-icon-Xxx 或 gy sprite symbolId（gy-xxx）
  sortNum?: number                             // 排序，越小越靠前
  component: string                            // 所属组件名(__name)，服务端配置分组用；内联留空 ''
  path?: string                                // more 的 JSON 字符串（仅服务端配置下发时用，代码内联忽略）
  more: {
    type: BtnType                              // 按钮颜色语义
    onclick: string                            // ★ 方法名，对应 handleTableBtnMap / handleSingleBtnMap 的 key
    onclickParams?: any                         // 透传给 handler 的额外参数（handler 第 4 / 第 2 个入参）
    showField?: string                         // 全局显隐：查 showMap[showField]，=== false 才隐藏
    showMethod?: string                        // 按行显隐（仅行内）：查 showMethodFucMap[showMethod]
    showMethedFuc?(row, rowIndex): boolean     // 框架内部挂载，勿手写（注意拼写 Methed）
    disableMethod?: string                     // 按行禁用名
    disableMethodFuc?(row, rowIndex): boolean  // 框架内部挂载
  }
}
```

`auth_type` 常量（`@gy/base`）：`auth_type_menu='menu'`、`auth_type_btn_single='btn_single'`、`auth_type_btn_table='btn_table'`。

---

## 2. `useGyButton<T>(options)` 选项

```ts
interface UseGyButtonOptions<T> {
  isDetail?: boolean      // true → 注入"详情"行内按钮(btn_table_Detail, onclick=handleDetail, sortNum 9998)
  isEdit?: boolean        // true → 注入 新增(Save,页面) + 编辑(UpdateTable)/删除(DeleteTable)(行内)，均带 showField='isEditShow'
  isFlowCancel?: boolean  // 流程页：是否注入 撤销/退回申请人
  btnSingle?: Array<Btn<T>>   // ★ 代码内联页面按钮
  btnTable?: Array<Btn<T>>    // ★ 代码内联行内按钮
  showMethodFucMap?: Record<string, (row: T | undefined, rowIndex: number | undefined) => boolean>
  // ★ showMethod 名 → 函数。框架遍历按钮，把 showMethodFucMap[btn.more.showMethod] 赋给 btn.more.showMethedFuc
}
// 返回： { btnSingle: Ref<Btn<T>[]>, btnTable: Ref<Btn<T>[] > }（已合并服务端配置+内联+自动注入，并按 sortNum 排序）
```

按钮合并顺序：`isDetail` 注入 → 路由 meta（服务端配置，按组件名匹配）→ `isEdit` 注入 → 流程注入 → `options.btnSingle/btnTable` 内联 → 排序 → 绑定 `showMethedFuc`。

---

## 3. handler 签名（写在 `useGyTableHandleOptions`）

```ts
// 页面按钮
handleSingleBtnMap?: Record<string, (common: SingleBtnCommon, params?: unknown) => Promise<unknown>>
// common = 框架默认同名方法（可调用以复用默认逻辑）；params = more.onclickParams

// 行内按钮
handleTableBtnMap?: Record<string, (p_optRow: T, p_optRowIndex: number, common: TableBtnCommon<T>, params?: unknown) => Promise<unknown>>
// p_optRow 当前行；p_optRowIndex 行号；common 框架默认同名方法；params = more.onclickParams
```

点击分发逻辑：先查**用户自定义** map，命中则调用（并把框架默认方法作为 `common` 传入，可在自定义里复用）；未命中则回退**框架默认** map；再未命中页面按钮会提示"方法未定义"。

---

## 4. 框架默认 handler 全清单（onclick 直接用这些名即可免实现）

**页面按钮默认（handleSingleBtnMap）**：
| onclick | 行为 |
|---|---|
| `handleSave` | 打开新增弹窗(status=save) |
| `handleSaveBat` | 批量新增弹窗 |
| `handleUpdateFields` | 批量编辑（需选中行） |
| `handleDeleteByIds` | 批量删除（需选中行，带二次确认） |
| `handleSync` | 调 `baseApi.sync(apiUrl)` 同步 |
| `handleDownloadImport` | 下载导入模板 |
| `handleImportSave` | 新增导入弹窗 |
| `handleImportBat` | 导入弹窗 |
| `handleExportBat` | 按当前查询条件导出 |
| `handleExportBatByIds` | 按选中行导出 |
| `handleFlowStart` | 启动流程 |

**行内按钮默认（handleTableBtnMap）**：
| onclick | 行为 |
|---|---|
| `handleUpdate` | 打开编辑弹窗(status=update, entity=row) |
| `handleDetail` | 打开详情弹窗(status=detail) |
| `handleDelete` | 删除该行（二次确认；params 可传 `{removeFile:false}` 不删附件） |
| `handleSaveTable` | 以该行为父级打开新增弹窗 |
| `handleExportById` | 行内导出/下载（openWindow exportById?id=row.id） |
| `handleFlowHandle` | 流程处理弹窗 |
| `handleFlowDelete` | 删除流程数据 |
| `handleFlowCancel` | 撤销流程（输入原因） |
| `handleFlowJumpStart` | 退回申请人（输入原因） |

---

## 5. 框架预置按钮常量与 sortNum 序位

| 常量 | id | authType | title | onclick | sortNum |
|---|---|---|---|---|---|
| btn_single_DownloadImport | DownloadImport | single | 模板下载 | handleDownloadImport | 10 |
| btn_single_ImportSave | ImportSave | single | 新增导入 | handleImportSave | 12 |
| btn_single_ImportBat | ImportBat | single | 导入 | handleImportBat | 12 |
| btn_single_ExportBat | ExportBat | single | 导出 | handleExportBat | 25 |
| btn_single_ExportBatByIds | ExportBatByIds | single | 批量导出 | handleExportBatByIds | 26 |
| btn_single_Save | Save | single | 新增 | handleSave | 21 |
| btn_single_SaveBat | SaveBat | single | 批量新增 | handleSaveBat | 22 |
| btn_single_DeleteByIds | DeleteByIds | single | 批量删除 | handleDeleteByIds | 24 |
| btn_single_Sync | Sync | single | 同步 | handleSync | 31 |
| btn_table_SaveTable | SaveTable | table | 新增 | handleSaveTable | 21 |
| btn_table_Update | UpdateTable | table | 编辑 | handleUpdate | 22 |
| btn_table_UpdateRow | UpdateTableRow | table | 编辑(行内编辑) | handleUpdateRow | 22 |
| btn_table_Delete | DeleteTable | table | 删除 | handleDelete | 23 |
| btn_table_FlowDelete | FlowDeleteTable | table | 删除流程 | handleFlowDelete | 24 |
| btn_table_ExportById | ExportByIdTable | table | 下载 | handleExportById | 26 |
| btn_table_Detail | Detail | table | 详情 | handleDetail | 9998 |
| btn_table_FlowHandle | FlowHandle | table | 处理 | handleFlowHandle | 22 |
| btn_table_FlowCancel | FlowCancel | table | 撤销 | handleFlowCancel | 26 |
| btn_table_FlowJumpStart | FlowJumpStart | table | 退回申请人 | handleFlowJumpStart | 2000 |
| btn_table_ShowHisList | ShowHisList | table | 处理记录 | handleShowHisList | 9999 |

> 自定义按钮 sortNum 取语义相近值即可；同列多按钮按 sortNum 升序排列，超过 `menuLength`（默认 2）折叠进"更多"。

---

## 6. 渲染组件 props（一般无需手改，了解即可）

`GyButtonTable`（行内，需手写进 `<el-table>`）：
```ts
{ showMap?, buttons?: Btn<T>[], menuLength?=2, columnProps?: Partial<TableColumnCtx>, handleLoading: Record<string,boolean> }
// emits: handleClick(btn, row, rowIndex) → 接 gyTable?.handleTableBtnClick
// 默认操作列：label='操作' align='center' width='141' fixed='right'，可被 columnProps 覆盖
// 有 prefix / suffix 插槽（作用域 { row, rowIndex }）可在按钮前后插自定义内容
```
`GyButtonSingle`（页面，框架内部经 GyFilter 渲染，不手写）：
```ts
{ showMap?, buttons?: Btn<T>[], handleLoading }  // v-if="!showField || !showMap || showMap[showField]"
```

`handleLoading` key 规则：行内 = `more.onclick + row.id`；页面 = `more.onclick`。点击期间自动 true→渲染 Loading 图标并 disabled。

---

## 7. 可复制模板

### 行内自定义按钮（最小集）
```ts
// 1) useGyButton
btnTable: [
  { component: '', id: '', authType: auth_type_btn_table, title: '处理', icon: 'el-icon-Edit',
    more: { type: 'success', onclick: 'handleConfirm', showMethod: 'confirmShow' }, sortNum: 22 }
],
showMethodFucMap: { confirmShow: (row) => !!row && !row.confirmUserId }

// 2) useGyTableHandleOptions
handleTableBtnMap: {
  async handleConfirm(row) { gyTable.value?.showModal({ status: 'confirm', entity: row }) }
}

// 3) 模板（已存在则跳过）
// <GyButtonTable :handle-loading="handleLoading" :buttons="btnTable" @handleClick="gyTable?.handleTableBtnClick" />
```

### 页面自定义按钮（最小集）
```ts
// 1) useGyButton
btnSingle: [
  { component: '', id: '', authType: auth_type_btn_single, title: '打包下载', icon: 'el-icon-Download',
    more: { type: 'primary', onclick: 'handleZip' }, sortNum: 30 }
]

// 2) useGyTableHandleOptions
handleSingleBtnMap: {
  async handleZip() {
    if (!gyTable.value?.checkSelects()) return
    const rows = table.value!.getSelectionRows()
    await xxxApi.zip(rows.map((i) => i.id))
  }
}

// 3) 模板：<GyTable :btnSingle="btnSingle" ...>
```

### 标准编辑/删除（复用框架默认，无需写 handler）
```ts
btnTable: [
  { component:'', id:'', authType: auth_type_btn_table, title:'编辑', icon:'el-icon-Edit',
    more:{ type:'success', onclick:'handleUpdate' }, sortNum:22 },
  { component:'', id:'', authType: auth_type_btn_table, title:'删除', icon:'el-icon-Delete',
    more:{ type:'danger', onclick:'handleDelete' }, sortNum:23 }
]
// 或直接 useGyButton({ isEdit: true }) 让框架注入（带 isEditShow 显隐）
```
