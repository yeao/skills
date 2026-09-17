<!-- ============================================================
列表主体模板（标准 CRUD）—— 放置于 <uni应用>/src/pages/{{areaDir}}/{{file-name}}/list/{{file-name}}-list.vue
基于 @gy uni 应用标准列表风格；工作流审批模块改用 list-flow-template.vue
占位符：{{EntityName}} / {{entityName}} / {{file-name}} / {{servicePackage}}
注意：
- #row 卡片字段为示例，必须按实体字段重写（字典字段用 xxxValue，外键用 xxxValue.显示列）
- itemHeight 为虚拟滚动行高估算（px），按卡片内容调整后联调校准
- .attr-item 等卡片文本样式类与 style 引用以项目现有 list.vue 为准
============================================================ -->
<template>
  <GyList
    ref="gyList"
    :itemHeight="360"
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
        <!-- 卡片标题行：放名称/姓名等主要字段 -->
        <view class="flex flex-row flex-wrap flex-row-center-start relative mb-8">
          <tm-text color="black" :font-size="36" _class="ml-12 text-weight-b">{{ row.name }}</tm-text>
        </view>

        <!-- 卡片内容行：按需增删，一个 tm-sheet 一行 -->
        <tm-sheet :margin="[0, 10, 0, 0]" :padding="[10]" color="primary" :text="true" _class="flex flex-row flex-row-center-start">
          <tm-text color="grey-darken-2" class="attr-item">备注：{{ row.remark }}</tm-text>
        </tm-sheet>

        <!-- 行按钮（详情/修改/删除等，由 useGyButton 配置驱动） -->
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

  <!-- 页面级按钮（新增等） -->
  <GyButtonSingle :buttons="btnSingle" @handle-click="gyList?.handleSingleBtnClick" />
</template>

<script setup lang="ts">
import { type TermMap } from '@gy/base'
import { type GyListProps, useGyButton } from '@gy/sys-uni'
import { type {{EntityName}} } from '{{servicePackage}}'
import { ref } from 'vue'
import type { ComponentExposed } from 'vue-component-type-helpers'

import GyButtonList from '@/gy/components/gy-button/gy-button-list.vue'
import GyButtonSingle from '@/gy/components/gy-button/gy-button-single.vue'
import GyList from '@/gy/components/gy-list/gy-list.vue'

import { use{{EntityName}}List } from './use-{{file-name}}-list'

//-----------------参数----------------
export interface {{EntityName}}ListProps extends GyListProps<{{EntityName}}> {
  disableRequest?: boolean
  handleDisableRequest?: boolean
  termMapLimit?: TermMap<{{EntityName}}>
}

const props = withDefaults(defineProps<{{EntityName}}ListProps>(), {
  termMapLimit: undefined
})

//-----------------列表----------------
const gyList = ref<ComponentExposed<typeof GyList<{{EntityName}}> | undefined>()
const { filterFieldQuick, filterFieldMap, useGyListOptions, useGyListHandleOptions } = use{{EntityName}}List()

//-----------------按钮----------------
// 只读/日志类模块保持 { isDetail: true }；按行状态显隐用 showMethodFucMap（见 generation-rules.md）
const { btnSingle, btnTable } = useGyButton<{{EntityName}}>({
  isDetail: true
})

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
