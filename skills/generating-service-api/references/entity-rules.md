# 实体 → API 生成规则

**Java 实体类**输入到服务层 API 文件（实体接口 + formatter + url + Api 类）的映射规则。生成时逐字段应用。页面生成规则不在本文档内（见 generating-crud-frontend skill）。

## 目录

1. [仓库与包结构](#仓库与包结构)
2. [实体解析](#实体解析)
3. [字段过滤](#字段过滤)
4. [类型映射](#类型映射)
5. [字典字段识别](#字典字段识别)
6. [外键字段识别](#外键字段识别)
7. [文件字段识别](#文件字段识别)
8. [状态 map 常量](#状态-map-常量)
9. [工作流实体（SysFlowForm）](#工作流实体sysflowform)

---

## 仓库与包结构

`@gy` 系列仓库有两种常见形态，生成前先确认当前仓库属于哪种（模板占位符 `{{appName}}` 等按此取值）：

| 项 | 多应用形态（如 gy-admin-vue3） | 单服务层形态（如 jail-criminal） |
|----|------------------------------|----------------------------------|
| 服务层包 | 每应用一个包：`<app>-service` → `@gy/<app>-service` | 整仓库一个包：`service/<name>` → `@<scope>/<name>-service` |
| API 分组目录 | `src/api/<group>/` | `src/api/<group>/` |
| appName 常量 | `<app>AppName`，定义在 `src/api/api-service.ts` | 同左（全仓库共用一个） |
| 包入口 | `lib/main.ts`（`export * from '../src/api/...'`） | 同左 |

两类仓库均以**已有模块的实际文件**为准核对包名与路径，不要凭记忆拼写。目标包推断依据：`@TableName` 表名前缀 / 用户指定 / 同领域已有 API 文件所在位置。

命名转换（以表 `equ_material` / 实体 `EquMaterial` 为例）：

| 项       | 值                           |
| -------- | ---------------------------- |
| 实体名   | `EquMaterial`（大驼峰，即类名） |
| 变量前缀 | `equMaterial`（小驼峰）      |
| 文件名   | `equ-material.ts`（kebab-case） |
| URL 路径 | `${equAppName}/equMaterial`  |
| API 类名 | `EquMaterialApi`             |

## 实体解析

- 类名即实体名（已是大驼峰）；`@TableName("xxx")` 提供表名（用于推断目标应用与 URL 路径）
- 中文名来源：类上 `@Schema(title)` / `@ApiModel` / Javadoc 注释
- **只解析类自身声明的字段**；继承自基类（BaseEntity/DefaultEntity 等）的字段一律忽略
- 跳过 `serialVersionUID`、`static`、`transient` 字段
- 字段中文名优先级：`@Schema(description)` > `@ApiModelProperty(value)` > 行内/上方 `//`、`/** */` 注释 > 按字段名语义翻译；中文名写入实体接口的行尾注释
- 字段名已是驼峰，无需转换；若有 `@JsonProperty` / `@JSONField` 注解则以注解值为准
- 后端联表/冗余带出的展示字段（不入库、只展示，如 `deptName`、`xxxValue`）也声明在实体接口中

## 字段过滤

以下字段由 `DefaultEntity` 基类提供，**不写入实体接口**：

`id`、`create_time`、`update_time`、`create_user_id`、`create_real_name`、`update_user_id`、`update_real_name`、`is_delete`、`is_submit`、`is_sure`、`parent_id`

只解析类自身声明的字段即可自然过滤。

## 类型映射

### Java → TS

| Java 类型 | TS 类型 |
|-----------|---------|
| String | string |
| Integer / Long / Short / int / long / short / BigInteger | number |
| Boolean / boolean | boolean |
| BigDecimal / Double / Float / double / float | number |
| LocalDate / Date / LocalDateTime / Timestamp / LocalTime | string |
| 枚举 / 其他对象类型 | string（结合字段名判断走字典或外键） |

### SQL → TS（用户仅提供建表 SQL 时参考）

| SQL 类型 | TS 类型 |
|----------|---------|
| varchar / char / text / longtext | string |
| int / bigint / smallint / decimal / numeric / float / double | number |
| tinyint(1) / boolean / bit | boolean |
| tinyint（非1位）/ 状态类字段 | string（走字典） |
| date / datetime / timestamp | string |

字段名 snake_case → 驼峰（`material_name` → `materialName`）。

## 字典字段识别

满足任一条件即视为字典字段：

1. 字段名含 `status`、`type`（且非外键 `_id`/`Id`）、`sex`、`gender`、`level`、`category`、`kind`、`mode`
2. 字段注释中出现"字典"、"枚举"、"（1:…2:…）"这类取值说明
3. `is_` 开头的布尔字段：类型为 boolean，或走 `true_false` 字典（string）
4. Java 字段类型为枚举，或带 `@Schema` 字典说明的，同样按字典处理

字典处理：

- formatter 注册：`formatterDics: { cmdStatus: { dicCode: '<前缀>_<字段语义>' } }`，dicCode 按 `<表名前缀>_<字段语义>` 推断（如 `equ_cmd_status`），汇报时提醒用户确认真实字典编码
- 实体接口中该字段类型为 `string`
- 可补 `xxxValue: string` 展示字段（后端字典翻译回填）

## 外键字段识别

以 `_id` / `Id` 结尾且指向业务表的字段（如 `equ_type_id`/`equTypeId`、`user_id`/`userId`）：

- formatter 注册（从同目录导入关联表的 url；基础表从 `@gy/sys-service` 导入）：

```ts
import { equTypeUrl } from './equ-type'
// ...
formatterAEntitys: {
  equTypeId: [{ apiUrl: equTypeUrl }]
}
```

- 关联表按字段名语义推断（`equTypeId` → `equ-type`），读取同目录/同包已有文件确认；无法确定关联表时不注册该字段，并在汇报中说明
- 实体接口中该字段类型为 `string`，可补 `xxxValue` 展示字段

## 文件字段识别

字段名/注释含 `url`、`file`、`img`、`image`、`photo`、`attachment`、`avatar`、素材类的：

```ts
import type { FileFieldMap } from '@gy/sys-service'
export const xxxFileFieldMap: FileFieldMap = { materialUrl: 'self' }
```

## 状态 map 常量

状态等固定枚举需要在页面逻辑中判断时，声明状态 map（可选）：

```ts
export const xxx_status_map = {
  wait: { id: 'wait', name: '待处理' },
  start: { id: 'start', name: '进行中' },
  end: { id: 'end', name: '已结束' }
}
```

## 工作流实体（SysFlowForm）

实体 `extends SysFlowForm`（或含 `flowStatus` / `flowInstanceId` 字段）→ 按 [assets/templates/api-flow-template.ts](../assets/templates/api-flow-template.ts) 生成，与普通 CRUD 的差异：

- 实体接口继承 `SysFlowForm`（来自 `@gy/sys-service`），**不是** `DefaultEntity`；流程字段（flowStatus、flowInstanceId、runUserIds、runListTaskName 等）由基类提供，不声明；可加 `flowStatusValue: string` 展示字段
- `formatterDics.flowStatus` 的 dicCode 为项目的流程状态字典编码（占位符 `{{flowStatusDicCode}}`，汇报时向用户确认；若项目服务层已有统一常量则直接复用，勿重复定义）
- `formatterAEntitys` 展开 `...flowRunUserIdsFormatter`（来自 `@gy/sys-service`），支撑列表页"当前处理人"列
- 自定义接口用 `this.httpRequest({ url: this.url + '/xxx', ... })`：`cancel(id)`（GET 撤销）；按需 `copy(params)`、`checkXxx(entity)`（提交前校验）、`uploadById(id, files)`（FormData）。有 Controller 时以 Controller 端点为准
- 业务类型常量（同表多业务类型时）：`export const xxx_approve_type_daily = 'daily'` 风格
