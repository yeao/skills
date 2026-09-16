<!-- ============================================================
左列表右详情包装页模板（工作流审批模块）—— 放置于 <app>-web/src/views/<group>/<module>/<file>-manage.vue
基于 @gy 项目标准"左列表右详情"工作流页面风格
用于菜单直接注册的页面：左边列表 + 右边详情卡片（点行即打开详情表单，showType="div" 内嵌展示）
占位符：{{EntityName}} / {{entityName}} / {{模块中文名}} / {{file}} / {{servicePackage}}
说明：列表页需透传 #gyTableEnd 插槽、支持 current-change 事件（见 table-flow-template.vue）
============================================================ -->
<template>
  <el-container class="gy-adaptable">
    <{{EntityName}}Table
      style="width: 1010px"
      :flowQueryType="props.flowQueryType"
      :byDeptId="props.byDeptId"
      :isAllChildren="true"
      :setFirstKey="true"
      @current-change="
        (nv: any, ov: any) => {
          if (ov && nv && ov.id == nv.id) {
            return
          }

          currentEntity = nv
          {{entityName}}FormRef?.showModal({
            status: opt_detail,
            entity: nv || {}
          })
        }
      "
    >
      <template #gyTableEnd="{ dics }">
        <el-card style="margin-left: 8px" :class="{ 'cancel-form': currentEntity?.flowStatus === FLOW_STATUS_CANCEL }">
          <{{EntityName}}Form
            ref="{{entityName}}FormRef"
            showType="div"
            :flowHisListHide="true"
            :dicsPre="dics"
            style="height: 100%"
          />
        </el-card>
      </template>
    </{{EntityName}}Table>
  </el-container>
</template>

<script setup lang="ts">
import { opt_detail } from '@gy/base'
import { FLOW_STATUS_CANCEL, type FlowQueryType } from '@gy/sys-service'
import type { {{EntityName}} } from '{{servicePackage}}'
import { ref } from 'vue'

import {{EntityName}}Form from './components/{{file}}-form.vue'
import {{EntityName}}Table from './{{file}}-table.vue'

const props = defineProps<{
  byDeptId?: string
  flowQueryType?: FlowQueryType
}>()

const currentEntity = ref<{{EntityName}}>()
const {{entityName}}FormRef = ref<InstanceType<typeof {{EntityName}}Form>>()
</script>
