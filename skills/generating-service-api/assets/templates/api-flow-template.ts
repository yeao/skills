// ============================================================
// API 层模板（工作流审批模块）—— 放置于 <app>-service/src/api/<group>/<file>.ts
// 基于 @gy 项目标准工作流服务层风格（SysFlowForm 由 @gy/sys-service 提供）
// 与普通 CRUD 模板的区别：实体继承 SysFlowForm、formatter 挂流程状态字典与当前处理人、附撤销/复制等自定义接口
// 占位符：{{EntityName}} 实体名 / {{entityName}} 小驼峰前缀 / {{appName}} 应用前缀常量 /
//        {{flowStatusDicCode}} 流程状态字典编码（收尾时向用户确认；若项目服务层已有统一常量可直接替换）
// ============================================================
import type { BaseApi, Formatter, ModelForm } from '@gy/base'
import { SuperCrudApi } from '@gy/base'
import { flowRunUserIdsFormatter, type SysFlowForm } from '@gy/sys-service'

import { {{appName}} } from '../api-service'

// 业务类型常量（同一流程表承载多种业务类型时声明）：
// export const {{entityName}}_type_xxx = 'xxx'

export interface {{EntityName}} extends SysFlowForm {
  // 业务字段（不需要声明流程字段，SysFlowForm 已含 flowStatus/flowInstanceId/runUserIds/lockVersion 等）：
  // approveDate: string // 审核日期
  // archiveUrl: string // 归档地址
  //
  // Value 展示字段：
  // flowStatusValue: string
  // typeValue: string // 类型值
  //
  // 业务判断字段（可选）：
  // isCancelable: boolean // 是否可撤销
  //
  // 自定义操作参数实体（可选，如复制）：
  // isCopyAttachment: boolean // 是否复制附件
}

export const {{entityName}}Url = `${ {{appName}} }/{{entityName}}`

export const {{entityName}}Formatter: Formatter<{{EntityName}}> = {
  formatterDics: {
    flowStatus: {
      dicCode: '{{flowStatusDicCode}}'
    }
    // 其他字典字段：
    // type: { dicCode: '<项目字典编码>' }
  },
  formatterAEntitys: {
    // 当前处理人列（配合列表页 formatterRunUserIdsValue/formatterRunListTaskName 列）：
    ...flowRunUserIdsFormatter
  }
}

export class {{EntityName}}Api extends SuperCrudApi<{{EntityName}}> {
  constructor(baseApi: BaseApi) {
    super({
      baseApi,
      url: {{entityName}}Url
    })
  }

  // 撤销流程（后端取消接口；若撤销走表单弹窗改状态则不需要此方法）：
  cancel(id: string) {
    return this.httpRequest({
      url: this.url + '/cancel',
      method: 'get',
      params: {
        id
      }
    })
  }

  // 复制（可选）：
  // copy(params: { id?: string }) {
  //   return this.httpRequest({
  //     url: this.url + '/copy',
  //     method: 'get',
  //     params: params
  //   })
  // }

  // 提交前业务校验（可选，返回错误提示数组）：
  // checkXxx(entity: ModelForm<{{EntityName}}>) {
  //   return this.httpRequest({
  //     url: this.url + '/checkXxx',
  //     method: 'post',
  //     data: entity
  //   })
  // }

  // 上传文件（可选）：
  // uploadById(id: string, files: File[]) {
  //   const formData = new FormData()
  //   for (let index = 0; index < files.length; index++) {
  //     formData.append('files', files[index])
  //   }
  //   return this.httpRequest({
  //     url: this.url + '/upload',
  //     method: 'post',
  //     params: { id },
  //     data: formData
  //   })
  // }
}
