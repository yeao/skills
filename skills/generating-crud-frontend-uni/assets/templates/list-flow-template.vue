<!-- ============================================================
列表主体模板（工作流审批）—— 放置于 <uni应用>/src/pages/{{areaDir}}/{{file-name}}/list/{{file-name}}-list.vue
与 list-template.vue 的差异：流程按钮显隐（flowHandleShowC）、撤销流程样式、流程状态展示
占位符：{{EntityName}} / {{entityName}} / {{file-name}} / {{servicePackage}}
注意：
- #row 卡片字段为示例，必须按实体字段重写；流程状态行按需保留
- flowQueryType 由流程中心/待办入口透传（'create'/'run'/'all'）
============================================================ -->
<template>
  <GyList
    ref="gyList"
    :itemHeight="400"
    :isAllChildren="true"
    :flowQueryType="props.flowQueryType"
    :disableRequest="props.disableRequest"
    :handleDisableRequest="props.handleDisableRequest"
    :filterFieldQuick="filterFieldQuick"
    :filterFieldMap="filterFieldMap"
    :useGyListOptions="useGyListOptions"
    :useGyListHandleOptions="useGyListHandleOptions"
    :runHide="true"
    :lastHide="true"
  >
    <template #row="{ row, index }">
      <tm-sheet :border="1" :round="2" :padding="[16, 16]" :margin="[25, 25]" style="width: 700rpx">
        <!-- 卡片标题行：主要字段 + 流程状态 -->
        <view class="flex flex-row flex-wrap flex-row-center-start relative mb-8">
          <tm-text color="black" :font-size="36" _class="ml-12 text-weight-b">{{ row.name }}</tm-text>

          <view class="absolute flex-col flex-col-top-end" style="top: 0; right: 0">
            <tm-tag :color="getFlowStatusColor(row.flowStatus)" :font-size="24">
              {{ row.flowStatusValue || '草稿' }}
            </tm-tag>
          </view>
        </view>

        <!-- 卡片内容行：按需增删 -->
        <tm-sheet :margin="[0, 10, 0, 0]" :padding="[10]" color="primary" :text="true" _class="flex flex-row flex-row-center-start">
          <tm-text color="grey-darken-2" class="attr-item">备注：{{ row.remark }}</tm-text>
        </tm-sheet>

        <!-- 行按钮（详情/修改/流程办理等，由 useGyButton 配置驱动） -->
        <GyButtonList
          class="flex flex-1 mt-20"
          :buttons="btnTable"
          :row="row"
          :rowIndex="index"
          @handleClick="gyList?.handleTableBtnClick"
        />
      </tm-sheet>
    </template>
  </GyList>

  <!-- 页面级按钮（新增/发起等） -->
  <GyButtonSingle :buttons="btnSingle" @handle-click="gyList?.handleSingleBtnClick" />
</template>

<script setup lang="ts">
import { type TermMap } from '@gy/base'
import { FLOW_STATUS_CANCEL, FLOW_STATUS_END, FLOW_STATUS_START, flowHandleShowC, type FlowQueryType } from '@gy/sys-service'
import { type GyListProps, useGyButton, useUserStore } from '@gy/sys-uni'
import { type {{EntityName}} } from '{{servicePackage}}'
import { ref } from 'vue'
import type { ComponentExposed } from 'vue-component-type-helpers'

import GyButtonList from '@/gy/components/gy-button/gy-button-list.vue'
import GyButtonSingle from '@/gy/components/gy-button/gy-button-single.vue'
import GyList from '@/gy/components/gy-list/gy-list.vue'

import { use{{EntityName}}List } from './use-{{file-name}}-list'

//-----------------参数----------------
export interface {{EntityName}}ListProps extends GyListProps<{{EntityName}}> {
  flowQueryType?: FlowQueryType
  isEdit?: boolean
  disableRequest?: boolean
  handleDisableRequest?: boolean
  termMapLimit?: TermMap<{{EntityName}}>
}

const props = withDefaults(defineProps<{{EntityName}}ListProps>(), {
  flowQueryType: undefined,
  termMapLimit: undefined
})

//-----------------列表----------------
const gyList = ref<ComponentExposed<typeof GyList<{{EntityName}}> | undefined>()
const { filterFieldQuick, filterFieldMap, useGyListOptions, useGyListHandleOptions } = use{{EntityName}}List()

const userStore = useUserStore()
//-----------------按钮----------------
const { btnSingle, btnTable } = useGyButton<{{EntityName}}>({
  isDetail: true,
  isFlowCancel: false,
  showMethodFucMap: {
    hisListShow() {
      return false
    },
    flowHandleShow(row) {
      return flowHandleShowC(props.flowQueryType, row, userStore.userInfo.userId)
    }
  }
})

// 流程状态 → 标签颜色（项目有统一实现时优先复用）
function getFlowStatusColor(flowStatus: string) {
  if (flowStatus === FLOW_STATUS_CANCEL) {
    return 'grey'
  } else if (flowStatus === FLOW_STATUS_END) {
    return 'green'
  } else if (flowStatus === FLOW_STATUS_START) {
    return 'primary'
  }
  return 'orange'
}

defineExpose({
  handleAfterByForm(status: string, data: any) {
    gyList.value?.handleAfterByForm(status, data)
  }
})
</script>

<style lang="scss" scoped>
/* 卡片文本样式类（.attr-item 等）以项目现有 list.vue 的 style 引用为准，例如：
@use '@/styles/xxx.scss'; */
</style>
