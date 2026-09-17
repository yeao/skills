<!-- ============================================================
表单弹窗模板 —— 放置于 <app>-web/src/views/<group>/<module>/components/<file>-form.vue
基于 @gy 项目标准表单弹窗风格（项目模块：组件从 @gy/sys-web 导入）
占位符：{{EntityName}} / {{entityName}} / {{模块中文名}} / {{servicePackage}} / {{apiInstancesFile}}
注意：仅当目标应用是 sys-web 自身时改用相对路径导入（参考 sys-web/src/views/sys/role/components/）
注意：占位符沿用已有 API 文件中的命名（接口名、变量名、文件名），不重新命名
============================================================ -->
<template>
  <GyForm
    ref="gyForm"
    v-bind="props"
    append-to-body
    apiTitle="{{模块中文名}}"
    :width="500"
    :useGyFormOptions="useGyFormOptions"
    @handleAfter="handleAfter"
  >
    <!-- 把某操作标题改名（如删除改叫撤销）：
    :opt-map-pre="{ [opt_delete]: '撤销' }" -->
    <template #default="{ dialogStatus, modelForm, dics }">
      <ElForm ref="elForm" :model="modelForm" :rules="rules" :disabled="dialogStatus === opt_detail">
        <!-- 文本字段：
        <el-form-item label="名称" prop="name">
          <el-input v-model="modelForm.name" placeholder="请输入名称" />
        </el-form-item> -->

        <!-- 长文本：
        <el-form-item label="备注" prop="remark">
          <el-input v-model="modelForm.remark" type="textarea" resize="none" placeholder="请输入" />
        </el-form-item> -->

        <!-- 数值：
        <el-form-item label="排序" prop="sortNum">
          <el-input-number v-model="modelForm.sortNum" :min="0" />
        </el-form-item> -->

        <!-- 字典下拉：
        <el-form-item label="类型" prop="type">
          <el-select v-model="modelForm.type" placeholder="请选择">
            <el-option
              v-for="item in dics.get({{entityName}}Formatter.formatterDics?.type?.dicCode || '')"
              :key="item.dicKey"
              :label="item.dicValue"
              :value="item.dicKey"
            />
          </el-select>
        </el-form-item> -->

        <!-- 布尔：
        <el-form-item label="是否启用" prop="isEnable">
          <el-switch v-model="modelForm.isEnable" />
        </el-form-item> -->

        <!-- 日期：
        <el-form-item label="生效日期" prop="effectDate">
          <el-date-picker v-model="modelForm.effectDate" type="date" value-format="YYYY-MM-DD" placeholder="请选择" />
        </el-form-item> -->

        <!-- 日期时间：
        <el-form-item label="生效时间" prop="effectTime">
          <el-date-picker v-model="modelForm.effectTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="请选择" />
        </el-form-item> -->

        <!-- 文件上传（有文件字段时，插槽需解构 fileListAll，useGyFormOptions 加 fileFieldMap）：
        <el-form-item label="附件" prop="fileUrl">
          <el-upload
            v-if="fileListAll.fileUrl"
            v-model:file-list="fileListAll.fileUrl"
            action="fileUrl"
            :show-file-list="false"
            :httpRequest="
              async (request: any) => {
                await gyForm?.uploadRequestAndDeleteOther(request, modelForm)
              }
            "
          >
            <el-button :icon="Plus">上传</el-button>
          </el-upload>
        </el-form-item> -->
      </ElForm>
    </template>

    <!-- 需要自定义提交按钮（批量保存、自定义删除等）：
    <template #footerPrefix="{ dialogStatus, loading, modelForm }">
      <el-button v-if="dialogStatus === opt_saveBat" :loading="loading" type="primary" @click="saveBat(modelForm)">确定</el-button>
    </template> -->
  </GyForm>
</template>

<script setup lang="ts">
import { opt_detail } from '@gy/base' // 自定义操作按钮时按需补充导入 opt_save / opt_saveBat / opt_delete 等
import { GyForm, type GyFormProps, type ShowModalOptions, type UseGyFormOptionsO } from '@gy/sys-web'
import { type {{EntityName}}, {{entityName}}Formatter, {{entityName}}Url } from '{{servicePackage}}'
import { type FormInstance } from 'element-plus'
import { ref } from 'vue'
import type { ComponentExposed } from 'vue-component-type-helpers'

// 需要直接调 api（批量保存、自定义删除等）时导入：
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

// useGyForm的参数
const elForm = ref<FormInstance>()
const useGyFormOptions: UseGyFormOptionsO<{{EntityName}}> = {
  apiUrl: {{entityName}}Url,
  formatter: {{entityName}}Formatter,
  // 有文件字段时加：fileFieldMap: {{entityName}}FileFieldMap,
  // 打开弹窗时需加工数据时加（如逗号分隔串转数组回填多选）：
  // async initForm(common, options) {
  //   await common(options)
  // },
  async validate() {
    return await elForm.value?.validate()
  },
  clearValidate() {
    return elForm.value?.clearValidate()
  }
}

// 验证（按 generation-rules.md 推断）
const rules = {
  // name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  // type: [{ required: true, message: '请选择类型', trigger: 'change' }]
}
</script>
