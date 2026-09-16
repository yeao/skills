// ============================================================
// API 层模板 —— 放置于 <app>-service/src/api/<group>/<file>.ts
// 基于 @gy 项目标准服务层风格
// 占位符：{{EntityName}} 实体名 / {{entityName}} 小驼峰前缀 / {{appName}} 应用前缀常量（定义在 ../api-service）
// ============================================================
import type { BaseApi, DefaultEntity, Formatter } from '@gy/base'
// 需要自定义导出/打开文件接口时补充导入：
// import { fullUrl, openWindow, SuperCrudApi } from '@gy/base'
import { SuperCrudApi } from '@gy/base'

import { {{appName}} } from '../api-service'

export interface {{EntityName}} extends DefaultEntity {
  // 每个业务字段一行，格式：<驼峰字段名>: <TS类型> // <中文注释（可选）>
  // 示例：
  // name: string // 名称,
  // type: string // 类型,
  // effectDate: string // 生效日期,
  // sortNum: number // 排序,
  // isEnable: boolean // 是否启用,
  //
  // 后端联表/冗余带出的展示字段（不入库、只展示）也声明在接口中：
  // deptName: string // 部门名称,
  // 非数据库字段（可选）：
  // transientMap: any // 非数据库字段
}

export const {{entityName}}Url = `${ {{appName}} }/{{entityName}}`

export const {{entityName}}Formatter: Formatter<{{EntityName}}> = {
  // 字典字段（可选）：
  // formatterDics: {
  //   type: { dicCode: '<项目字典编码>' },
  //   status: { dicCode: '<项目字典编码>' }
  // },
  //
  // 外键关联字段（可选，字段值需显示关联表的某列）：
  // formatterAEntitys: {
  //   deptId: [{ apiUrl: sysDeptUrl }]
  // }
  // 使用时导入对应的 url：import { sysDeptUrl } from '@gy/sys-service' 或从同目录 ./xxx 导入
}

// 状态等固定枚举需要在页面逻辑中判断时，声明状态 map（可选）：
// export const {{entityName}}_status_map = {
//   wait: { id: 'wait', name: '待处理' },
//   start: { id: 'start', name: '进行中' },
//   end: { id: 'end', name: '已结束' }
// }

// 文件上传字段（可选，有文件/图片字段时声明）：
// export const {{entityName}}FileFieldMap: FileFieldMap = {
//   fileUrl: 'self'
// }
// 需补充导入：import type { FileFieldMap } from '@gy/sys-service'

export class {{EntityName}}Api extends SuperCrudApi<{{EntityName}}> {
  constructor(baseApi: BaseApi) {
    super({
      baseApi,
      url: {{entityName}}Url
    })
  }

  // 后端提供的非标准接口（如打开文件导出）按需追加：
  // /**
  //  * 生成导出文件
  //  * @param ids 主键id集合
  //  */
  // exportByIds(ids?: string) {
  //   openWindow(fullUrl(`${this.url}/exportByIds?ids=${ids}`, this.baseApi.api_baseURL))
  // }
}
