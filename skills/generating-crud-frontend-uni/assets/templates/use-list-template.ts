/**
 * ============================================================
 * 列表配置模板（普通 CRUD 与工作流模块通用）
 * 放置于 <uni应用>/src/pages/{{areaDir}}/{{file-name}}/list/use-{{file-name}}-list.ts
 * 占位符：{{EntityName}} / {{entityName}} / {{模块中文名}} / {{servicePackage}}
 * 注意：
 * - 表单 URL 常量统一定义在 src/api/pages-urls.ts（见 generation-rules.md「页面注册」）
 * - filterFieldQuick / filterFieldMap / orders 按 generation-rules.md 的推断规则生成
 * - 复杂场景（角色数据权限、自定义按钮拦截、动态 formUrl 参数）见 generation-rules.md「高级列表模式」
 * ============================================================
 */
import { TermMapKey } from '@gy/base'
import { type UseGyListHandleOptionsO, type UseGyListOptionsO } from '@gy/sys-uni'
import { type {{EntityName}}, {{entityName}}Formatter, {{entityName}}Url } from '{{servicePackage}}'
import { computed } from 'vue'

import { {{entityName}}FormUrl } from '@/api/pages-urls'
import type { FilterField, FilterFieldQuick } from '@/gy/components/gy-filter/default'

export function use{{EntityName}}List() {
  // 快速查询条件（列表顶部搜索框）：选名称/标题类主字段
  const filterFieldQuick: FilterFieldQuick<{{EntityName}}> = {
    termMapKey: new TermMapKey('name', 'like'),
    placeholder: '请输入{{模块中文名}}关键字'
  }

  // 查询过滤条件（展开的筛选面板，通常 2~4 个）
  const filterFieldMap = computed<Map<TermMapKey<{{EntityName}}>, FilterField<{{EntityName}}>>>(() => {
    const temp = new Map<TermMapKey<{{EntityName}}>, FilterField<{{EntityName}}>>()

    // 字典下拉：dicCode 从 Formatter 取
    // temp.set(new TermMapKey('type', 'equal'), {
    //   fieldName: '类型',
    //   render: 'select',
    //   dicCode: {{entityName}}Formatter.formatterDics?.type?.dicCode
    // })

    // 时间范围
    temp.set(new TermMapKey('createTime', 'range'), {
      fieldName: '创建时间',
      render: 'datetime',
      labelWidth: 220
    })

    return temp
  })

  //-----------------列表--------------------
  const useGyListOptions: UseGyListOptionsO<{{EntityName}}> = {
    isPage: true,
    isCurrent: true,
    isInitList: true,
    apiUrl: {{entityName}}Url,
    formatter: {{entityName}}Formatter,
    // 文件字段（如有）：fileFieldMap 配置在 useGyListHandleOptions，见 generation-rules.md
    orders: [
      { field: 'createTime', op: 'desc' },
      { field: 'id', op: 'desc' }
    ]
  }

  //-----------------额外的操作--------------------
  const useGyListHandleOptions: UseGyListHandleOptionsO<{{EntityName}}> = {
    getFormUrl() {
      return {{entityName}}FormUrl
    }
  }

  return {
    filterFieldQuick,
    filterFieldMap,
    useGyListOptions,
    useGyListHandleOptions
  }
}
