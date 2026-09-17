<!-- ============================================================
表单页模板（工作流审批）—— 放置于 <uni应用>/src/pages/{{areaDir}}/{{file-name}}/form/{{file-name}}-form.vue
与 form-template.vue 的差异：flowKey、流程节点监听（flowNode）、opt_flowHandle 禁用逻辑、
flowBtnList/flowMsg 流程按钮、撤销流程样式（FLOW_STATUS_CANCEL）
占位符：{{EntityName}} / {{entityName}} / {{file-name}} / {{模块中文名}} / {{servicePackage}} / {{flowKey}}
注意：
- {{flowKey}} 为后端流程模型 key，收尾时必须向用户确认
- 表单项为注释示例，按字段清单取消注释并重写（控件示例见 form-template.vue，两版通用）
- 个别字段允许审批节点编辑时用 flowNode?.documentObj?.enableEdit（见下方示例）
============================================================ -->
<template>
  <tm-app ref="tmApp">
    <tm-navbar :title="gyForm?.pageTitle" />

    <GyForm
      ref="gyForm"
      :flowHisListHide="true"
      :useGyFormOptions="useGyFormOptions"
      @handleAfter="handleAfter"
      @update:dialog-status="
        (val) => {
          formStatus = val
        }
      "
      @update:model-form="
        (val) => {
          formModel = val
        }
      "
      @update:flow-node="
        (val) => {
          flowNode = val
        }
      "
    >
      <template #default="{ dialogStatus, modelForm, dics, flowBtnList, flowMsg, flowNode }">
        <tm-form
          v-if="props"
          ref="tmForm"
          :class="{ 'canctm-card': modelForm.flowStatus === FLOW_STATUS_CANCEL }"
          :labelWidth="180"
          :margin="[0, 0]"
          style="height: 100%"
          :modelValue="modelForm"
          @submit="gyForm?.onSubmit"
        >
          <!-- 文本：
          <tm-form-item label="名称" :required="true" field="name" :rules="rules.name">
            <tm-input v-model="modelForm.name" :disabled="disabled" :inputPadding="[20, 20]" />
          </tm-form-item> -->

          <!-- 仅详情或特定流程节点可见/可编辑的字段（如审批意见、反馈内容）：
          <tm-form-item
            v-if="dialogStatus === opt_detail || (dialogStatus === opt_flowHandle && flowNode?.documentObj?.enableEdit)"
            label="审批意见"
            field="approveContent"
            :rules="rules.approveContent"
          >
            <tm-input
              v-model="modelForm.approveContent"
              :disabled="approveContentDisabled"
              type="textarea"
              :inputPadding="[20, 20]"
              :auto-height="true"
            />
          </tm-form-item> -->

          <!-- 底部按钮：保存草稿/流程提交/流程办理（flowBtnList/flowMsg 由 GyForm 注入） -->
          <GyFormButton
            ref="gyFormButton"
            :apiUrl="{{entityName}}Url"
            :dialogStatus="dialogStatus"
            :modelForm="modelForm"
            :flowBtnList="flowBtnList"
            :flowMsg="flowMsg"
            :validate="
              async () => {
                return await tmForm?.validateIsPass()
              }
            "
            :submit="
              async () => {
                await tmForm?.submit()
              }
            "
          />
        </tm-form>
      </template>
    </GyForm>
  </tm-app>
</template>

<script setup lang="ts">
import { type ModelForm, opt_detail, opt_flowHandle } from '@gy/base'
import { type ActSelfNode, FLOW_STATUS_CANCEL } from '@gy/sys-service'
import { type {{EntityName}}, {{entityName}}Formatter, {{entityName}}Url } from '{{servicePackage}}'
import { computed, getCurrentInstance, ref } from 'vue'
import type { ComponentExposed } from 'vue-component-type-helpers'

import { useGyFormCommon } from '@/gy/components/gy-form/default'
import GyForm, { type UseGyFormOptionsO } from '@/gy/components/gy-form/gy-form.vue'
import GyFormButton from '@/gy/components/gy-form/gy-form-button.vue'
import TmForm from '@/tmui/components/tm-form/tm-form.vue'

//-----------------参数----------------
export interface {{EntityName}}FormProps {
  test?: string
}

//-----------------emits----------------
const emits = defineEmits<{
  handleAfter: [dialogStatus: string, data: any]
}>()

function handleAfter(dialogStatus: string, data: any) {
  emits('handleAfter', dialogStatus, data)
}

const proxy = getCurrentInstance()?.proxy ?? null

const formStatus = ref<string>()
const formModel = ref<ModelForm<{{EntityName}}> | null>(null)
const flowNode = ref<ActSelfNode | null>(null)

// 详情态只读；流程办理态提交过流程即只读
const disabled = computed<boolean>(() => {
  if (!formModel.value) {
    return false
  }

  if (formStatus.value === opt_detail) {
    return true
  } else if (formStatus.value === opt_flowHandle) {
    // 流程提交以后就不可编辑
    return !!formModel.value.flowInstanceId
  }

  return false
})

// 个别字段允许流程节点上编辑（documentObj.enableEdit 由流程节点配置决定）；无此需求可删除
const approveContentDisabled = computed<boolean>(() => {
  if (formStatus.value === opt_flowHandle && flowNode.value?.documentObj?.enableEdit) {
    return false
  }

  return disabled.value
})

//-----------------gy-form----------------
const tmForm = ref<InstanceType<typeof TmForm> | null>(null)
const gyForm = ref<ComponentExposed<typeof GyForm<{{EntityName}}>> | null>(null)
const { props } = useGyFormCommon<{{EntityName}}FormProps, {{EntityName}}>(gyForm)

const useGyFormOptions: UseGyFormOptionsO<{{EntityName}}> = {
  flowKey: '{{flowKey}}',
  apiUrl: {{entityName}}Url,
  formatter: {{entityName}}Formatter
  // 新建草稿默认 flowStatus = null 等初始化逻辑放 initForm（见 generation-rules.md）
}

// 验证规则：按 generation-rules.md「校验规则推断」填写；格式以项目现有 form 为准
const rules = computed<Record<string, any>>(() => {
  if (disabled.value) {
    return {}
  } else {
    return {}
  }
})

function saveSignAfter(src: string) {
  const gyFormButton = proxy?.$refs.gyFormButton as ComponentExposed<typeof GyFormButton<{{EntityName}}>> | null
  gyFormButton?.saveSignAfter(src)
}

defineExpose({
  saveSignAfter
})
</script>
