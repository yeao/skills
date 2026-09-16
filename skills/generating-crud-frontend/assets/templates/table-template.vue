<!-- ============================================================
列表页模板 —— 放置于 <app>-web/src/views/<group>/<module>/<file>-table.vue
基于 @gy 项目标准列表页风格（项目模块：组件全部从 @gy/sys-web 导入）
占位符：{{EntityName}} / {{entityName}} / {{模块中文名}} / {{file}} / {{nameField}} / {{servicePackage}} / {{apiInstancesFile}}
  - servicePackage：服务层包名（如 '@gy/<app>-service'，具体以当前仓库的服务层包名为准）
  - apiInstancesFile：Web 端 api 实例文件（如 '@/api/equ-service'）
注意：仅当目标应用是 sys-web 自身时改用相对路径导入（参考 sys-web/src/views/sys/role/）
注意：三种输入（SQL / Java 实体 / 已有 API）均使用本模板；已有 API 输入时占位符沿用现有 API 文件中的命名
============================================================ -->
<template>
  <GyTable
    ref="gyTable"
    v-bind="props"
    :btnSingle="btnSingle"
    title="{{模块中文名}}"
    :filterFieldMap="filterFieldMap"
    :filterFieldQuick="filterFieldQuick"
    :useGyTableOptions="useGyTableOptions"
    :useGyTableHandleOptions="useGyTableHandleOptions"
    :getTableVm="getTableVm"
    :getFormModalVm="getFormModalVm"
  >
    <template #default="{ loading, list, handleLoading, formModalInit, dics }">
      <el-table ref="table" v-loading="loading" :data="list" :defaultSort="defaultSort" @sort-change="gyTable?.onSortChange">
        <!-- 需要批量操作（批量导出/批量删除等）时才加多选列，并给序号列加 fixed="left"：
        <el-table-column type="selection" align="center" width="55" fixed="left" /> -->
        <el-table-column label="序号" type="index" align="center" width="70" />
        <!-- 普通字段：<el-table-column label="名称" align="center" prop="name" min-width="200" /> -->
        <!-- 字典字段：<el-table-column label="状态" align="center" prop="statusValue" width="110" /> -->
        <!-- 外键字段：<el-table-column label="部门" align="center" prop="deptIdValue.deptName" width="140" /> -->
        <!-- 日期/时间字段（可排序）：<el-table-column label="生效日期" align="center" prop="effectDate" width="120" sortable="custom" /> -->
        <!-- 首列做成链接跳转详情（按需）：
        <el-table-column label="名称" align="center" prop="name" width="120" fixed="left">
          <template #default="{ row }">
            <el-link type="primary" underline="always" @click="gotoDetail(row)">{{ row.name }}</el-link>
          </template>
        </el-table-column> -->

        <GyButtonTable :handle-loading="handleLoading" :buttons="btnTable" @handleClick="gyTable?.handleTableBtnClick" />
      </el-table>

      <{{EntityName}}Form v-if="formModalInit" ref="formModal" :dicsPre="dics" @handle-after="gyTable?.handleAfterByForm" />
    </template>
  </GyTable>
</template>

<script setup lang="ts">
import { TermMapKey } from '@gy/base' // 覆盖行操作走表单弹窗（如 handleDelete）时，补充导入 opt_delete
import type { UseGyTableHandleOptionsO, UseGyTableOptionsO } from '@gy/sys-web'
import { type FilterField, type FilterFieldQuick, GyButtonTable, GyTable, type GyTableProps, useGyButton } from '@gy/sys-web'
import { type {{EntityName}}, {{entityName}}Formatter, {{entityName}}Url } from '{{servicePackage}}'
import { type Sort, type TableInstance } from 'element-plus'
import { computed, ref } from 'vue'
import type { ComponentExposed } from 'vue-component-type-helpers'

// 行/批量操作需要直接调 api 时导入：
// import { {{entityName}}Api } from '{{apiInstancesFile}}'

import {{EntityName}}Form from './components/{{file}}-form.vue'

//-----------------参数----------------
const props = withDefaults(defineProps<GyTableProps<{{EntityName}}>>(), {})

//-----------------列表----------------
const gyTable = ref<ComponentExposed<typeof GyTable<{{EntityName}}> | undefined>()
const table = ref<TableInstance | undefined>()
function getTableVm() {
  return table.value
}
const formModal = ref<InstanceType<typeof {{EntityName}}Form> | undefined>()
function getFormModalVm() {
  return formModal.value
}

// 查询过滤条件（按 generation-rules.md 推断，示例：）
const filterFieldMap = computed<Map<TermMapKey<{{EntityName}}>, FilterField<{{EntityName}}>>>(() => {
  const temp = new Map<TermMapKey<{{EntityName}}>, FilterField<{{EntityName}}>>()

  // 字典下拉：
  // temp.set(new TermMapKey('status', 'equal'), {
  //   fieldName: '状态',
  //   render: 'select',
  //   dicCode: {{entityName}}Formatter.formatterDics?.status?.dicCode
  // })

  // 时间范围：
  // temp.set(new TermMapKey('createTime', 'range'), {
  //   fieldName: '创建时间',
  //   render: 'datetime'
  // })

  return temp
})

// 快速查询条件（选一个名称类字段）
const filterFieldQuick: FilterFieldQuick<{{EntityName}}> = {
  termMapKey: new TermMapKey('{{nameField}}', 'like'),
  placeholder: '{{名称字段中文}}'
}

// 默认排序
const defaultSort: Sort = {
  prop: 'createTime',
  order: 'descending'
}

const useGyTableOptions: UseGyTableOptionsO<{{EntityName}}> = {
  apiUrl: {{entityName}}Url,
  formatter: {{entityName}}Formatter,
  defaultSort: defaultSort
  // 需要额外固定查询参数（如按部门过滤）时加：
  // getListConfig() {
  //   return {
  //     params: { deptId: props.byDeptId }
  //   }
  // }
}

// 行/批量操作自定义；不覆盖的操作走 GyTable 内置流程，保持空对象即可
const useGyTableHandleOptions: UseGyTableHandleOptionsO<{{EntityName}}> = {
  // 批量按钮（配合多选列）：
  // handleSingleBtnMap: {
  //   async handleExportByIds() {
  //     const selectedRows = table.value?.getSelectionRows()
  //     {{entityName}}Api.exportByIds(selectedRows?.map((item) => item.id).join(','))
  //   }
  // },
  handleTableBtnMap: {
    // 删除不是物理删除、需要弹表单填写理由时，覆盖内置删除改走表单弹窗：
    // async handleDelete(p_optRow) {
    //   gyTable.value?.showModal({
    //     status: opt_delete,
    //     entity: {
    //       id: p_optRow.id
    //     },
    //     isDirect: true
    //   })
    // }
  }
}

//-----------------按钮----------------
// 常规增删改查：useGyButton<{{EntityName}}>({})；只读/详情类：{ isDetail: true }
// 按行状态控制按钮显隐：
// { showMethodFucMap: { deleteTableShow(row) { return !!row && row.status !== 'end' } } }
const { btnSingle, btnTable } = useGyButton<{{EntityName}}>({})
</script>
