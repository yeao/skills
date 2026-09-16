---
name: update-api-from-controller
description: 仅供手动调用，请勿自动触发
---

# Update Api From Controller

将后端 Spring Controller 的端点完全同步到前端 `@gy` 风格的 API 类：补缺失、修不一致、删多余（删除前查调用方），最后验证并重建 dist。

## 项目约定

以 `D:\svn-java\pri\jail\trunk` 为根（若在别处，按用户给定路径推断）：

- **后端**：`jail-parent/jail-service-parent/<module>/src/main/java/.../controller/**/<Name>Controller.java`
- **前端 service 包**：`ui/<project>/service/<project>-service/`
  - API 源码：`src/api/<app>/<name>.ts`，类名 `XxxApi`
  - 包入口：`lib/main.ts`（`export * from '../src/api/...'`）
  - 基础路径变量：`src/api/api-service.ts`（如 `export const jailCriminalAppName = '/sys'`）
- **前端 app 工程**：`ui/<project>/app-*`（删除方法前在此搜索调用方）

## 映射规则（Controller → Api）

| 后端                                       | 前端                                                                                       |
| ------------------------------------------ | ------------------------------------------------------------------------------------------ |
| 类名 `CriminalController`                  | 类 `CriminalApi extends SuperApi`（CRUD 控制器对应 `SuperCrudApi<T>`）                     |
| `@RequestMapping({"/criminal"})`           | `export const criminalUrl = \`${jailCriminalAppName}/criminal\``+ 构造器`url: criminalUrl` |
| `@GetMapping("/findCriminal")`             | 方法名 `findCriminal`，`method: 'get'`（Post/Put/Delete 同理）                             |
| `@Operation(summary/description)`          | 方法上方 JSDoc 注释（取中文描述；有参数的加 `@param`）                                     |
| `@RequestParam("isFirst") boolean isFirst` | `params: { isFirst }`                                                                      |
| `@RequestBody List<String> userIds`        | `data: userIds`                                                                            |
| `@PathVariable`                            | 拼入 url 路径：`` url: `${this.url}/xxx/${id}` ``                                          |
| 返回 `RestResponse.ok(data)`               | `Promise<RestResponse<实际类型>>`                                                          |
| 返回 `RestResponse.ok()`（无数据）         | `Promise<RestResponse<void>>`                                                              |

import 与继承（非 CRUD 类）：

```ts
import { type BaseApi, type RestResponse, SuperApi } from '@gy/base'
import { jailCriminalAppName } from '../api-service'
```

## 工作流

```
任务进度：
- [ ] 1. 解析 Controller
- [ ] 2. 定位前端 API 文件
- [ ] 3. 差异比对
- [ ] 4. 写入代码
- [ ] 5. 验证与重建
- [ ] 6. 汇报
```

### 1. 解析 Controller

通读给定文件，提取每个端点的：HTTP 方法、路径、`@Operation` 描述、参数（位置+类型）、返回类型、是否带 `@IgnoreUserToken`。

**调试接口识别**：带 `@IgnoreUserToken`，或路径/方法名/描述明显是调试用途（如 `/test`、`/debug`、描述含"测试"）→ 默认**不生成**，记入汇报清单。

**`generate` 类接口**：方法名为 `generate` 的数据生成类端点（多由后端定时任务/待办驱动，前端通常不直接调用）→ 默认**不生成**，记入汇报清单。**例外**：若对应 `ui/<project>/app-*` 工程 src 中已有对该方法的调用，或用户明确要求生成，则照常生成。

### 2. 定位前端 API 文件

用户未直接给出 api 文件时，按类名搜索：`Grep "class CriminalApi"` 于 `ui/*/service/*/src`。找到后通读该文件，沿用其现有风格（import、url 常量、继承方式、注释习惯）。

找不到类 → 在同包下新建文件（参照同目录已有文件的结构），并在 `lib/main.ts` 追加 `export * from ...`。

### 3. 差异比对

前端方法与后端端点按**端点路径**对齐（方法名通常与路径一致），分三类：

- **缺失**：后端有、前端无 → 新增
- **不一致**：HTTP 方法、参数列表、路径不同 → 修正为与后端一致
- **多余**：前端有、后端无 → 准备删除（先执行第 4 步的调用方检查）

### 4. 写入代码

- 按映射规则生成方法，方法顺序与 Controller 一致
- 已有方法仅在不一致时修改，不要重写无变化的方法
- **删除安全检查**：删除每个多余方法前，在对应 `ui/<project>/app-*` 工程 src 中搜索方法名；有调用方 → 保留该方法并在汇报中标注"后端已移除，前端仍有调用"

方法范例：

```ts
/**
 * 同步数据中心：罪犯关系数据
 * @param isFirst 是否首次同步
 */
syncFlxCriminalRelation(isFirst: boolean): Promise<RestResponse<void>> {
  return this.httpRequest({
    url: `${this.url}/syncFlxCriminalRelation`,
    method: 'get',
    params: {
      isFirst
    }
  })
}
```

### 5. 验证与重建

在 service 包目录（含 `package.json` 的那层）依次执行：

1. 类型检查：`npx vue-tsc --noEmit -p tsconfig.app.json --composite false`
2. 风格检查：`npx eslint --max-warnings 0 "src/api/<app>/<name>.ts"`
3. 重建 dist（使前端工程可用新方法）：`pnpm lib`

任一步失败 → 修复后重跑，全部通过才算完成。注意 `pnpm lib` 内含 `eslint --fix`，可能顺带修正同包其他文件的风格问题，属预期行为。

### 6. 汇报

用表格列出：新增方法、修正方法（说明改了什么）、删除方法、保留但后端已移除的方法、跳过的调试/`generate` 接口。

## 特殊情况

- **下载类接口**（后端返回文件流）：参照同包已有写法，用 `responseType: 'blob'` + `downloadByData(res, '文件名.xlsx')`，或直接 `openWindow(fullUrl(...))`
- **返回类型不确定时**：优先看后端方法体的 `RestResponse.ok(...)` 实参；`RestResponse<?>` 且无实参 → `RestResponse<void>`
- **一个 Controller 对应多个前端文件**：以类名精确匹配的那个为准
