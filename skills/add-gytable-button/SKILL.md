---
name: add-gytable-button
description: 给 GyTable 列表页添加按钮（行内按钮 btnTable / 页面按钮 btnSingle）。当用户说"添加按钮""给表格加个操作按钮""加行内按钮""加页面按钮""给 xxx-table 增加按钮"等时触发。覆盖代码内联定义与服务端模块配置两种来源、onclick 方法绑定、显示/禁用控制（showField / showMethod / disableMethod）、sortNum 排序、loading 等。
triggers:
  - 添加按钮
  - 加个按钮
  - 加个操作按钮
  - 表格按钮
  - 行内按钮
  - 页面按钮
  - 给表格加按钮
  - btnTable
  - btnSingle
  - useGyButton
  - GyButtonTable
  - add button
---

# 给 GyTable 添加按钮

本 skill 指导如何在 `app-web-jail-criminal` 的列表页（基于 `@gy/sys-web` 的 `GyTable`）中添加**行内按钮**（每行操作列，`btnTable`）或**页面按钮**（表格上方工具栏，`btnSingle`）。

参考实现（务必先读）：
- 行内自定义按钮：`src/views/jail-criminal/jail-criminal-error/jail-criminal-error-table.vue`（"处理"按钮，代码内联定义）
- 页面/行内按钮 + 服务端配置：`src/views/jail-criminal/jail-criminal-file/jail-criminal-file-table.vue`（`handleZip`/`handleCheck` 等，handler 在代码、按钮在服务端模块配置）

> 核心类型/组件 `Btn`、`useGyButton`、`GyTable`、`GyButtonTable`、`auth_type_btn_*` 来自**外部框架包** `@gy/base` / `@gy/sys-web`（`file:` 链接到仓库外的 `gy-admin-vue3`），**不要在本仓库内查找或修改其实现**。本 skill 已把所需 API 摘录在 `references/btn-reference.md`。

---

## 一、先搞清楚：按钮从哪来？

`useGyButton<T>(options)` 返回 `{ btnSingle, btnTable }` 两个响应式数组，框架会把以下来源**合并 + 按 sortNum 排序**：

1. **服务端模块配置（主要来源）**：后台「模块管理 / 菜单管理」里给某组件配置的按钮，随菜单下发，按 `component`（组件名 `__name`）匹配后注入。标准按钮（新增/编辑/删除/导出/详情/流程等）通常走这条，**代码里看不到按钮定义，只看到 handler**。
2. **代码内联定义（自定义按钮）**：通过 `options.btnSingle` / `options.btnTable` 数组直接写死在组件里。本仓库自定义业务按钮（如 error-table 的"处理"）走这条。
3. **框架自动注入**：`isDetail: true` 注入"详情"行内按钮；`isEdit: true` 注入"新增/编辑/删除"；流程页按 `flowQueryType` 注入流程按钮。

**决策**：
- 加一个**本页面专属的业务按钮**（如"处理""核查""生成"）→ 用 **Pattern A 代码内联**。
- 按钮已在**后台模块管理里配好**，只是页面缺少点击逻辑或显示条件 → 用 **Pattern B 只提供 handler / show 覆盖**。
- 只是想要标准的 增/删/改/详情 → 优先 `isEdit`/`isDetail` 开关或后台配置，**不要重复内联**。

---

## 二、Pattern A：代码内联自定义按钮（最常用）

### A-1 行内按钮（操作列，每行一个）

**① 在 `useGyButton` 的 `btnTable` 数组里加一个 `Btn`**（`auth_type_btn_table` 从 `@gy/base` 导入）：

```ts
import { auth_type_btn_table } from '@gy/base'
import { useGyButton } from '@gy/sys-web'

const { btnSingle, btnTable } = useGyButton<JailCriminalError>({
  isDetail: false,
  btnTable: [
    {
      component: '',            // 内联按钮留空
      id: '',                   // 内联按钮留空（id 用于服务端权限匹配）
      authType: auth_type_btn_table,
      title: '处理',            // 按钮文字
      icon: 'el-icon-Edit',     // Element 图标 或 gy sprite symbolId（见规范）
      more: {
        type: 'success',        // default|success|warning|info|primary|danger
        onclick: 'handleConfirm',   // ★ 方法名（字符串），对应 handleTableBtnMap 的 key
        showMethod: 'confirmShow'   // ★ 可选：按行控制显隐，对应 showMethodFucMap 的 key
      },
      sortNum: 22               // 排序，越小越靠前
    }
  ],
  // 若上面用了 showMethod，这里定义对应函数（按 row/rowIndex 返回 boolean）
  showMethodFucMap: {
    confirmShow: (row) => {
      if (!row) return false
      if (!isDeptYuZheng.value) return false   // 业务/权限判断
      if (!isKeShiFzr.value) return false
      return !row.confirmUserId                // 按行数据判断
    }
  }
})
```

**② 在 `useGyTableHandleOptions.handleTableBtnMap` 里实现 `onclick` 同名方法**：

```ts
const useGyTableHandleOptions: UseGyTableHandleOptionsO<JailCriminalError> = {
  handleTableBtnMap: {
    // 签名：(row, rowIndex, common, params) => Promise<unknown>
    async handleConfirm(row: JailCriminalError) {
      gyTable.value?.showModal({
        status: 'confirm',
        entity: { id: row.id, confirmResult: true },
        isDirect: true
      })
    }
  }
}
```

**③ 模板里确保有 `GyButtonTable`**（error-table / file-table 都已有，通常无需新增）：

```vue
<GyButtonTable
  :handle-loading="handleLoading"
  :buttons="btnTable"
  :column-props="{ width: '80' }"
  @handleClick="gyTable?.handleTableBtnClick"
/>
```
> 放在 `<el-table>` 内、所有 `el-table-column` 之后。`handleLoading` 来自 `GyTable` 默认插槽作用域（`#default="{ handleLoading, ... }"`）。

### A-2 页面按钮（工具栏，整表一个）

**① 在 `useGyButton` 的 `btnSingle` 数组里加 `Btn`**（`auth_type_btn_single`）：

```ts
import { auth_type_btn_single } from '@gy/base'

const { btnSingle, btnTable } = useGyButton<JailCriminalFile>({
  btnSingle: [
    {
      component: '',
      id: '',
      authType: auth_type_btn_single,
      title: '打包下载',
      icon: 'el-icon-Download',
      more: {
        type: 'primary',
        onclick: 'handleZip',
        showField: 'zipShow'      // 可选：用 showMap 布尔表控制全局显隐
      },
      sortNum: 30
    }
  ]
})
```

**② 在 `useGyTableHandleOptions.handleSingleBtnMap` 里实现 handler**：

```ts
const useGyTableHandleOptions: UseGyTableHandleOptionsO<JailCriminalFile> = {
  handleSingleBtnMap: {
    // 签名：(common, params) => Promise<unknown>
    async handleZip() {
      if (!gyTable.value || !table.value) return
      if (!gyTable.value.checkSelects()) return        // 校验是否选中行
      const rows = table.value.getSelectionRows()
      await jailCriminalFileApi.zip(rows.map((i) => i.id))
    }
  }
}
```

**③ 把 `btnSingle` 传给 `GyTable`**（页面按钮由框架内部 `GyFilter`→`GyButtonSingle` 渲染，无需手写组件）：

```vue
<GyTable ref="gyTable" v-bind="props" :btnSingle="btnSingle" ... >
```
> 若用了 `showField`，再给 `GyTable` 传 `:showMap="{ zipShow: true }"`（布尔 Record）。

---

## 三、Pattern B：按钮在服务端配置，代码只补 handler / show

file-table 就是这种：`useGyButton` **不传** `btnSingle`/`btnTable` 数组（按钮由后台模块管理下发），代码只做两件事：

1. **提供 handler**：在 `handleSingleBtnMap` / `handleTableBtnMap` 里写与后台按钮 `onclick` 同名的方法（如 `handleCheck`、`handleGenerate`、`handleExportById`、`handleExporGridByDept`）。
2. **覆盖显示条件**：在 `useGyButton({ showMethodFucMap })` 里按行重新定义显隐（如 `checkShow`、`generateShow`、`updateTableShow`、`exportByIdTableShow`）。

```ts
const { btnSingle, btnTable } = useGyButton<JailCriminalFile>({
  showMethodFucMap: {
    checkShow: (row) => !!(row && [criminalFileStatusUploaded, criminalFileStatusRefused].includes(row.fileStatus)),
    generateShow: (row) => !!(row && [criminalFileStatusChecked].includes(row.fileStatus))
  }
})
```

> 用 Pattern B 时，新增按钮本身要在**后台模块管理**里配置（title/icon/onclick/sortNum/authType/component），代码侧只负责让它"能点"和"该不该显示"。如果用户只在代码里加了 handler 但按钮没出现，提醒其去后台配置按钮或改用 Pattern A 内联。

---

## 四、显示 / 禁用控制（三种机制）

| 机制 | 字段 | 配套 | 适用 | 说明 |
|---|---|---|---|---|
| 全局显隐 | `more.showField` | `GyTable`/`GyButtonTable` 的 `showMap` 布尔表 | 页面/行内 | `showMap[showField] === false` 时隐藏；不传 showMap 默认显示 |
| 按行显隐 | `more.showMethod` | `useGyButton({ showMethodFucMap })` | **仅行内** | 框架把 `showMethodFucMap[showMethod]` 挂到 `more.showMethedFuc`，渲染时按 `(row, rowIndex)` 调用 |
| 按行禁用 | `more.disableMethod` | `disableMethodFuc` | 行内 | 同 showMethod 机制，控制 disabled 而非隐藏 |

- `showMethod` 函数返回 `true` 显示、`false` 隐藏；务必先判 `row` 非空（首行/空表时 row 可能为 undefined）。
- 权限判断常组合 store/composable，如 `useUserOtherStore().isDeptYuZheng`、`useAuth().isKeShiFzr`、`userStore.containRoleIds([...])`。

---

## 五、onclick 找不到 handler 时的框架兜底

若 `more.onclick` 在用户自定义的 `handleTableBtnMap`/`handleSingleBtnMap` 中**不存在**，框架会回退调用其**内置默认方法**（完整清单见 `references/btn-reference.md`）。常用：
- 页面默认：`handleSave`(新增) `handleSaveBat` `handleDeleteByIds`(批量删除) `handleExportBat`(导出) `handleImportBat`(导入) `handleSync`(同步) `handleFlowStart`
- 行内默认：`handleUpdate`(编辑) `handleDelete`(删除) `handleDetail`(详情) `handleSaveTable` `handleExportById`(下载) `handleFlowHandle` `handleFlowCancel`

> 所以：只想用标准"编辑/删除/详情"行为时，`onclick` 直接写这些默认名即可，无需自己实现 handler；要自定义逻辑才在 map 里写同名方法**覆盖**它。

---

## 六、命名 / 风格规范（遵循仓库约定）

- **handler 方法名**：`handle` 开头，驼峰，与 `more.onclick` 字符串**完全一致**（`handleConfirm` / `handleCheck` / `handleGenerate` / `handleExportById`）。
- **show 方法名**：`Show` 结尾（`confirmShow` / `checkShow` / `generateShow`），与 `more.showMethod` 一致。
- **图标**：通用操作用 Element 图标字符串 `el-icon-Xxx`（Edit/Delete/Plus/Download/Setting/InfoFilled…）；业务专属 SVG 放 `/src/assets/svg/`，用 sprite symbolId `gy-xxx`（见 CLAUDE.md「样式复用规范」，先查目录复用同义图标，颜色用 `currentColor`）。
- **sortNum**：沿用框架默认序位，自定义按钮取语义相近值——新增 21、编辑/处理 22、删除 23、下载/导出 26、同步 31、详情 9998。同列多按钮靠 sortNum 排先后。
- **type 颜色**：主操作 `primary`、确认/处理类 `success`、危险（删除/撤销）`danger`、导出/信息 `info`、次要 `warning`/`default`。颜色语义遵循 CLAUDE.md，用 Element 主题 token，勿新定义。
- **行内按钮折叠**：操作列按钮数 > `menuLength`（默认 2）时，超出部分自动收进"更多"下拉；需要全展示可调 `<GyButtonTable :menuLength="3">` 或加宽 `column-props`。
- **loading**：无需手动管理。点击时框架自动置 loading（行内 key=`onclick+row.id`，页面 key=`onclick`），`GyButtonTable`/`GyButtonSingle` 自动渲染转圈并禁用。

---

## 七、完成前自检清单

- [ ] `Btn` 的 `more.onclick` 字符串 与 `handleTableBtnMap`/`handleSingleBtnMap` 里的方法名**逐字一致**。
- [ ] 行内按钮：模板存在 `<GyButtonTable :buttons="btnTable" :handle-loading="handleLoading" @handleClick="gyTable?.handleTableBtnClick" />`，且 `handleLoading` 取自 `GyTable` 默认插槽作用域。
- [ ] 页面按钮：`btnSingle` 已通过 `:btnSingle="btnSingle"` 传给 `GyTable`；用了 `showField` 则补 `:showMap`。
- [ ] 用了 `showMethod` 就在 `showMethodFucMap` 里定义同名函数，且函数先判 `row` 非空。
- [ ] `authType` 用对常量：行内 `auth_type_btn_table`、页面 `auth_type_btn_single`（从 `@gy/base` 导入）。
- [ ] 内联按钮 `component`/`id` 留空字符串即可；Pattern B 的按钮确认已在后台模块管理配置。
- [ ] 图标/颜色/命名符合第六节规范；业务 SVG 已查 `/src/assets/svg/` 是否可复用。
- [ ] 改完跑 `pnpm --filter app-web-jail-criminal type-check`（或对应包）确认类型通过。

更完整的 `Btn` 字段、框架默认 handler 全清单、可复制模板见 `references/btn-reference.md`。
