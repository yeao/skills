<!-- ============================================================
表单页模板（标准 CRUD）—— 放置于 <uni应用>/src/pages/{{areaDir}}/{{file-name}}/form/{{file-name}}-form.vue
基于 @gy uni 应用标准表单风格；工作流审批模块改用 form-flow-template.vue
占位符：{{EntityName}} / {{entityName}} / {{file-name}} / {{模块中文名}} / {{servicePackage}}
注意：
- 表单项为注释示例，按字段清单取消注释并重写；控件选择见 generation-rules.md「表单项生成」
- rules 校验按 generation-rules.md「校验规则推断」，格式以项目现有 form 为准
- tm-form 的 labelWidth 以项目现有表单为准（常见 180）
============================================================ -->
<template>
  <tm-app ref="tmApp">
    <tm-navbar :title="gyForm?.pageTitle" />

    <GyForm
      ref="gyForm"
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
    >
      <template #default="{ dialogStatus, modelForm, dics }">
        <tm-form
          v-if="props"
          ref="tmForm"
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

          <!-- 长文本：
          <tm-form-item label="备注" field="remark" :rules="rules.remark">
            <tm-input v-model="modelForm.remark" :disabled="disabled" type="textarea" :inputPadding="[20, 20]" :auto-height="true" />
          </tm-form-item> -->

          <!-- 数值：
          <tm-form-item label="数量" field="num">
            <tm-input v-model="modelForm.num" :disabled="disabled" type="number" :inputPadding="[20, 20]" />
          </tm-form-item> -->

          <!-- 字典单选：dics 由 GyForm 依据 Formatter 的 formatterDics 自动加载
          <tm-form-item label="类型" :required="true" field="type" :rules="rules.type">
            <tm-radio-group v-if="{{entityName}}Formatter.formatterDics?.type?.dicCode" v-model="modelForm.type" :disabled="disabled">
              <tm-radio
                v-for="item in dics.get({{entityName}}Formatter.formatterDics.type.dicCode)"
                :key="item.dicKey"
                :value="item.dicKey"
                :label="item.dicValue"
              />
            </tm-radio-group>
          </tm-form-item> -->

          <!-- 字典多选（实体中以逗号分隔字符串存储，绑定/回显需 split/join）：
          <tm-form-item label="类型" :required="true" field="types" :rules="rules.types">
            <tm-checkbox-group
              v-if="{{entityName}}Formatter.formatterDics?.types?.dicCode"
              :disabled="disabled"
              :model-value="modelForm.types?.split(',')"
              @change="
                (val: any) => {
                  modelForm.types = val.join(',')
                }
              "
            >
              <tm-checkbox
                v-for="item in dics.get({{entityName}}Formatter.formatterDics.types.dicCode)"
                :key="item.dicKey"
                :value="item.dicKey"
                :label="item.dicValue"
                style="width: 100%; margin-top: 12px"
              />
            </tm-checkbox-group>
          </tm-form-item> -->

          <!-- 日期时间（GyTmPick 为触发器，showDetail 控制精度，只到日期时 hour/minute/second 置 false）：
          <tm-form-item label="时间" field="startTime" :rules="rules.startTime">
            <tm-time-picker
              v-model:modelStr="modelForm.startTime"
              v-model="modelForm.startTime"
              :showDetail="{ year: true, month: true, day: true, hour: true, minute: true, second: true }"
              format="YYYY-MM-DD HH:mm:ss"
            >
              <GyTmPick
                :text="modelForm.startTime"
                :clearable="true"
                :disabled="disabled"
                @on-clear="
                  () => {
                    modelForm.startTime = ''
                  }
                "
              />
            </tm-time-picker>
          </tm-form-item>
          需导入：import GyTmPick from '@/gy/components/gy-tm-pick/gy-tm-pick.vue' -->

          <!-- 布尔：
          <tm-form-item label="是否启用" field="isEnable">
            <tm-switch v-model="modelForm.isEnable" :disabled="disabled" />
          </tm-form-item> -->

          <!-- 底部按钮：保存/提交 -->
          <GyFormButton
            ref="gyFormButton"
            :apiUrl="{{entityName}}Url"
            :dialogStatus="dialogStatus"
            :modelForm="modelForm"
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
import { type ModelForm, opt_detail } from '@gy/base'
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

// 详情态只读
const disabled = computed<boolean>(() => {
  if (!formModel.value) {
    return false
  }

  return formStatus.value === opt_detail
})

//-----------------gy-form----------------
const tmForm = ref<InstanceType<typeof TmForm> | null>(null)
const gyForm = ref<ComponentExposed<typeof GyForm<{{EntityName}}>> | null>(null)
const { props } = useGyFormCommon<{{EntityName}}FormProps, {{EntityName}}>(gyForm)

const useGyFormOptions: UseGyFormOptionsO<{{EntityName}}> = {
  apiUrl: {{entityName}}Url,
  formatter: {{entityName}}Formatter
  // 新增默认值：用 initForm（见 generation-rules.md「initForm 默认值」）
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
