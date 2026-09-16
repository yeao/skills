<!-- ============================================================
列表页模板（工作流审批模块）—— 放置于 <app>-web/src/views/<group>/<module>/<file>-table.vue
基于 @gy 项目标准工作流列表页风格（流程能力由 @gy/sys-service / @gy/sys-web 提供）
与普通列表页模板的区别：状态列用 el-tag、runShow 时显示当前处理人/步骤列、撤销行加 cancel-row 类、
透传 gyTableStart/gyTableEnd 插槽、按钮带流程显隐函数
占位符：{{EntityName}} / {{entityName}} / {{模块中文名}} / {{file}} / {{servicePackage}} / {{apiInstancesFile}}
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
    <!-- 透传插槽，供 manage 包装页注入右侧详情卡片（不需要可删）：
    <template #gyTableStart="{ loading, list, currentRow, optRow, dics, isFinished }">
      <slot name="gyTableStart" :loading="loading" :list="list" :currentRow="currentRow" :optRow="optRow" :dics="dics" :isFinished="isFinished"></slot>
    </template> -->

    <template #default="{ loading, list, handleLoading, formModalInit, dics, runShow }">
      <el-table
        ref="table"
        v-loading="loading"
        :data="list"
        :defaultSort="defaultSort"
        :row-class-name="
          ({ row }: any) => {
            let temp = ''
            if (row.flowStatus === FLOW_STATUS_CANCEL) {
              temp += ' cancel-row'
            }
            return temp
          }
        "
        @sort-change="gyTable?.onSortChange"
        @current-change="onCurrentChange"
      >
        <el-table-column label="编号" align="center" width="130" prop="id" />
        <!-- 业务列：
        <el-table-column label="名称" align="center" min-width="150" prop="name" />
        <el-table-column label="日期" align="center" width="100" prop="approveDate" /> -->

        <!-- 流程状态列： -->
        <el-table-column label="状态" align="center" width="81">
          <template #default="{ row }">
            <el-tag :type="getFlowStatusTag(row.flowStatus)">{{ row.flowStatusValue || '草稿' }}</el-tag>
          </template>
        </el-table-column>

        <!-- 当前处理人/处理步骤列（固定写法，仅待办视图 runShow 时显示）： -->
        <template v-if="runShow">
          <el-table-column header-align="center" label="当前处理人" min-width="120" :formatter="formatterRunUserIdsValue" show-overflow-tooltip />
          <el-table-column align="center" label="当前处理步骤" min-width="160" :formatter="formatterRunListTaskName" show-overflow-tooltip />
        </template>

        <GyButtonTable
          :handleLoading="handleLoading"
          :buttons="btnTable"
          :menuLength="2"
          :column-props="{ width: '130' }"
          @handleClick="gyTable?.handleTableBtnClick"
        />
      </el-table>

      <{{EntityName}}Form v-if="formModalInit" ref="formModal" :dicsPre="dics" @handle-after="gyTable?.handleAfterByForm" />
    </template>

    <!-- <template #gyTableEnd="{ loading, list, currentRow, optRow, dics, termMap, isFinished }">
      <slot name="gyTableEnd" :loading="loading" :list="list" :currentRow="currentRow" :optRow="optRow" :dics="dics" :termMap="termMap" :isFinished="isFinished"></slot>
    </template> -->
  </GyTable>
</template>

<script setup lang="ts">
import { auth_type_btn_table, TermMapKey } from '@gy/base'
// 按需补充：fullUrl, openWindow（预览/下载归档文件时）
import {
  FLOW_STATUS_CANCEL,
  FLOW_STATUS_END,
  FLOW_STATUS_START,
  flowHandleShowC,
  flowJumpStartShowC,
  formatterRunListTaskName,
  formatterRunUserIdsValue
} from '@gy/sys-service'
import type { UseGyTableHandleOptionsO, UseGyTableOptionsO } from '@gy/sys-web'
import {
  type FilterField,
  type FilterFieldQuick,
  getListSettingCommon,
  GyButtonTable,
  GyTable,
  type GyTableProps,
  showConfirmMsg,
  showSuccessMsg,
  useGyButton,
  useUserStore
} from '@gy/sys-web'
import { type {{EntityName}}, {{entityName}}Formatter, {{entityName}}Url } from '{{servicePackage}}'
import { type Sort, type TableInstance } from 'element-plus'
import { computed, ref } from 'vue'
import type { ComponentExposed } from 'vue-component-type-helpers'

import { {{entityName}}Api } from '{{apiInstancesFile}}'

import {{EntityName}}Form from './components/{{file}}-form.vue'

//--------------------------props------------------------------
// flowQueryType / byDeptId 等已包含在 GyTableProps 中，无需重复声明
const props = withDefaults(defineProps<GyTableProps<{{EntityName}}>>(), {})

//-----------------emits----------------
const emits = defineEmits<{
  'current-change': [ov?: {{EntityName}} | null, nv?: {{EntityName}} | null]
}>()

function onCurrentChange(current: {{EntityName}} | null) {
  emits('current-change', current, gyTable.value?.currentRow)
  gyTable.value?.setCurrentRow(current)
}

const userStore = useUserStore()
const userId = computed(() => userStore.userInfo.userId)

// 流程状态 → el-tag 类型（若项目已有基于字典的统一实现，可替换为项目版本）
function getFlowStatusTag(flowStatus: string): 'primary' | 'success' | 'warning' | 'info' | 'danger' {
  if (!flowStatus) {
    return 'info' // 草稿
  }

  if (flowStatus === FLOW_STATUS_CANCEL) {
    return 'danger'
  }

  if (flowStatus === FLOW_STATUS_END) {
    return 'success'
  }

  if (flowStatus === FLOW_STATUS_START) {
    return 'primary'
  }

  return 'warning' // 审批中等其他状态
}

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

// 快速查询条件
const filterFieldQuick: FilterFieldQuick<{{EntityName}}> = {
  termMapKey: new TermMapKey('id', 'like'),
  placeholder: '编号'
}

// 查询过滤条件
const filterFieldMap = computed<Map<TermMapKey<{{EntityName}}>, FilterField<{{EntityName}}>>>(() => {
  const temp = new Map<TermMapKey<{{EntityName}}>, FilterField<{{EntityName}}>>()

  temp.set(new TermMapKey('createTime', 'range'), {
    fieldName: '创建时间',
    render: 'datetime'
  })

  // 流程状态过滤（可选）：
  // temp.set(new TermMapKey('flowStatus', 'equal'), {
  //   fieldName: '状态',
  //   render: 'select',
  //   dicCode: {{entityName}}Formatter.formatterDics?.flowStatus?.dicCode
  // })

  return temp
})

// 默认排序
const defaultSort: Sort = { prop: 'createTime', order: 'descending' }

const useGyTableOptions: UseGyTableOptionsO<{{EntityName}}> = {
  apiUrl: {{entityName}}Url,
  formatter: {{entityName}}Formatter,
  defaultSort: defaultSort,
  // 列表默认排除已撤销记录（固定写法）：
  async getListSetting(termMapLimit, termMap, sort, ordersPre, ordersSuf) {
    const listSetting = getListSettingCommon(termMapLimit, termMap, sort, ordersPre, ordersSuf)
    if (!listSetting.terms) {
      listSetting.terms = []
    }

    listSetting.terms.push({ field: 'flowStatus', op: 'notEqual', value: FLOW_STATUS_CANCEL })
    return listSetting
  }
  // 复制成功后跳回我的草稿（有复制按钮时加）：
  // handleAfter(commonFunc, handleEntity) {
  //   if (!gyTable.value) return
  //   if (handleEntity.status === 'copy') {
  //     gyTable.value.isFinished = 'null'
  //     gyTable.value.handleRefresh()
  //   } else {
  //     commonFunc(handleEntity)
  //   }
  // }
}

//-----------------额外的操作--------------------
const useGyTableHandleOptions: UseGyTableHandleOptionsO<{{EntityName}}> = {
  handleTableBtnMap: {
    // 撤销：确认后调后端 cancel 接口：
    async handleCancel(p_optRow) {
      await showConfirmMsg('确认撤销吗？').then(async () => {
        await {{entityName}}Api.cancel(p_optRow.id)
        showSuccessMsg('撤销成功')
        gyTable.value?.handleRefresh()
      })
    }
    // 预览/下载归档文件（有 archiveUrl 字段时）：
    // async handlePreview(p_optRow) {
    //   openWindow(fullUrl(p_optRow.archiveUrl.split(';')[0], gyConfigStore.gyConfig.file_baseURL))
    // },
    // async handleExport(p_optRow) {
    //   fileApi.downloadByFileId(p_optRow.archiveUrl.split(';')[0])
    // }
    // 复制（走表单弹窗）：
    // async handleCopy(p_optRow) {
    //   gyTable.value?.showModal({
    //     status: 'copy',
    //     isDirect: true,
    //     entity: { id: p_optRow.id, isCopyAttachment: false }
    //   })
    // }
  }
}

//-----------------按钮----------------
// 流程按钮（发起/处理/撤销）由 useGyButton 按 props.flowQueryType 自动注入，
// 页面只需在 showMethodFucMap 提供对应的显隐函数（名称固定）：
// - updateTableShow：编辑
// - flowJumpStartShow：发起流程
// - flowHandleShow：处理流程（待办）
// - flowCancelShow：内置撤销（一般置 false，改用自定义撤销按钮）
// 其余自定义按钮按需在 btnTable 追加、showMethodFucMap 补显隐逻辑
const { btnSingle, btnTable } = useGyButton<{{EntityName}}>({
  isDetail: true,
  btnTable: [
    {
      id: '',
      component: '',
      authType: auth_type_btn_table,
      title: '编辑',
      icon: 'el-icon-Edit',
      more: {
        type: 'success',
        onclick: 'handleUpdate',
        showMethod: 'updateTableShow'
      },
      // 要在详情前面
      sortNum: 99
    }
    // 撤销按钮（按需）：
    // {
    //   id: '',
    //   component: '',
    //   authType: auth_type_btn_table,
    //   title: '撤销',
    //   icon: 'el-icon-Delete',
    //   more: { type: 'danger', onclick: 'handleCancel', showMethod: 'cancelShow' },
    //   sortNum: 10010
    // }
  ],
  showMethodFucMap: {
    // 编辑：我的草稿视图、创建人本人、未提交或刚发起未审批时可编辑（按业务调整）
    updateTableShow(row) {
      if (!row) {
        return false
      }

      if (props.flowQueryType !== 'create') {
        return false
      }

      if (row.createUserId !== userId.value) {
        return false
      }

      if (row.flowInstanceId && row.flowStatus !== FLOW_STATUS_START) {
        return false
      }

      return true
    },
    flowJumpStartShow(row) {
      return flowJumpStartShowC(row)
    },
    flowHandleShow(row) {
      return flowHandleShowC(props.flowQueryType, row, userId.value)
    },
    flowCancelShow() {
      return false
    }
    // 自定义显隐（按需）：
    // cancelShow(row) {
    //   if (!row) return false
    //   return !!row.isCancelable && row.createUserId === userId.value
    // }
  }
})

defineExpose({
  gyTable
})
</script>
<!-- cancel-row 类用于已撤销行样式；若项目全局样式（如 src/styles/index.scss）已定义则直接复用，否则自行补充 -->
