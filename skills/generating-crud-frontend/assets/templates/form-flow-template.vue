<!-- ============================================================
表单弹窗模板（工作流审批模块）—— 放置于 <app>-web/src/views/<group>/<module>/components/<file>-form.vue
基于 @gy 项目标准工作流表单风格（流程能力由 GyForm 的 flowKey 机制提供）
与普通表单模板的区别：GyForm 必须配 flowKey；提交流程后表单锁定（按 flowInstanceId 判断）；
插槽解构多 flowNode（流程节点配置，如 documentObj.enableEdit/enableApprove）；
提交前可用 handleValidBefore / handleValidAfter 做业务校验
占位符：{{EntityName}} / {{entityName}} / {{模块中文名}} / {{flowKey}} 流程定义 key（后端流程模型的 key，收尾时向用户确认） / {{servicePackage}} / {{apiInstancesFile}}
============================================================ -->
<template>
  <GyForm
    ref="gyForm"
    v-bind="props"
    :flowKey="'{{flowKey}}'"
    apiTitle="{{模块中文名}}"
    :useGyFormOptions="useGyFormOptions"
    @handleAfter="handleAfter"
  >
    <!-- 自定义操作标题（如复制）：
    :optMapPre="{ copy: '复制' }" -->
    <!-- 复制等临时状态隐藏流程历史：
    :flow-his-list-hide="approveStatus === 'copy'" -->
    <template #default="{ dialogStatus, modelForm, flowNode, dics }">
      <ElForm ref="elForm" :model="modelForm" :rules="getDisabled(dialogStatus, modelForm) ? undefined : rules">
        <!-- 表单项写法同 form-template.vue（el-input / el-select + dics.get / el-date-picker 等）：
        <el-form-item label="日期" prop="approveDate">
          <el-date-picker v-model="modelForm.approveDate" :disabled="getDisabled(dialogStatus, modelForm)" type="date" value-format="YYYY-MM-DD" />
        </el-form-item> -->
        <!-- 提交流程后需锁定的控件统一绑 :disabled="getDisabled(dialogStatus, modelForm)" -->
        <!-- 流程节点允许编辑时放开（审批节点可编辑的业务）：
        :enableEdit="dialogStatus === opt_flowHandle && flowNode?.documentObj?.enableEdit" -->
      </ElForm>
    </template>

    <!-- 自定义状态的提交按钮（如复制）：
    <template #footerPrefix="{ modelForm }">
      <template v-if="approveStatus === 'copy'">
        <el-button type="primary" @click="copy(modelForm)">确定</el-button>
      </template>
    </template> -->
  </GyForm>
</template>

<script setup lang="ts">
import { opt_detail, opt_flowHandle, opt_update, type ModelForm } from '@gy/base'
import { GyForm, type GyFormProps, type InitFormCommon, type InitFormOptions, type ShowModalOptions, type UseGyFormOptionsO } from '@gy/sys-web'
import { type {{EntityName}}, {{entityName}}Formatter, {{entityName}}Url } from '{{servicePackage}}'
import { type FormInstance } from 'element-plus'
import { ref } from 'vue'
import type { ComponentExposed } from 'vue-component-type-helpers'

// 自定义操作需要直接调 api（撤销/复制/上传等）时导入：
// import { {{entityName}}Api } from '{{apiInstancesFile}}'

//-----------------参数----------------
const props = withDefaults(defineProps<GyFormProps<{{EntityName}}>>(), {})

//-----------------emits----------------
const emits = defineEmits<{
  handleAfter: [dialogStatus: string, data: any]
}>()

function handleAfter(dialogStatus: string, data: any) {
  emits('handleAfter', dialogStatus, data)
}

//-----------------gy-form----------------
const gyForm = ref<ComponentExposed<typeof GyForm<{{EntityName}}> | undefined>()
// showModal
function showModal(options: ShowModalOptions<{{EntityName}}>) {
  gyForm.value?.showModal(options)
}
defineExpose({
  showModal
})

// 提交流程以后就不能修改（固定写法）
function getDisabled(dialogStatus: string | undefined, modelForm: ModelForm<{{EntityName}}>): boolean {
  if (dialogStatus === opt_detail) {
    return true
  }

  if (dialogStatus === opt_update) {
    return false
  }

  return !!modelForm.flowInstanceId
}

// useGyForm的参数
const elForm = ref<FormInstance>()
const useGyFormOptions: UseGyFormOptionsO<{{EntityName}}> = {
  apiUrl: {{entityName}}Url,
  formatter: {{entityName}}Formatter,
  async initForm(common: InitFormCommon<{{EntityName}}>, options: InitFormOptions<{{EntityName}}>) {
    // 新建草稿时初始化默认值（flowStatus 必须置 null）：
    if (!options.entity.id) {
      // options.entity.approveDate = dayjs().format('YYYY-MM-DD')
      options.entity.flowStatus = null
    }

    await common(options)
  },
  async validate() {
    return await elForm.value?.validate()
  },
  clearValidate() {
    return elForm.value?.clearValidate()
  },
  // 点流程按钮（提交/审批）与保存草稿的区分逻辑（按需）：
  // async handleValidBefore(status) {
  //   if (status === opt_flowHandle) {
  //     if (gyForm.value?.flowBtn) {
  //       // 流程按钮：提交前强校验
  //     } else {
  //       // 保存草稿：放宽校验
  //     }
  //   }
  //   return true
  // },
  // 提交前后端业务校验（按需，返回错误数组时弹确认框）：
  // async handleValidAfter(_status, modelForm) {
  //   const errorRes = await {{entityName}}Api.checkXxx(modelForm)
  //   if (errorRes.data && errorRes.data.length) {
  //     try {
  //       await showConfirmMsg(errorRes.data.join('<br>'), { title: '是否继续提交？', dangerouslyUseHTMLString: true })
  //     } catch (e) {
  //       return false
  //     }
  //   }
  //   return true
  // }
}

// 验证
const rules = {
  // approveDate: [{ required: true, message: '请选择日期', trigger: 'change' }]
}
</script>
