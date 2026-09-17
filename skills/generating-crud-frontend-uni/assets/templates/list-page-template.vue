<!-- ============================================================
列表页面壳模板 —— 放置于 <uni应用>/src/pages/{{areaDir}}/{{file-name}}/list/{{file-name}}-list-page.vue
基于 @gy uni 应用标准列表页风格（普通 CRUD 与工作流模块通用）
占位符：{{EntityName}} / {{entityName}} / {{file-name}} / {{模块中文名}}
职责：接收路由 query（onLoad）、渲染导航栏与列表组件、
向上暴露 handleAfter（表单保存后刷新列表的回调链）
============================================================ -->
<template>
  <tm-app v-if="props" ref="tmApp">
    <tm-navbar title="{{模块中文名}}" />
    <{{EntityName}}List ref="{{entityName}}List" class="flex flex-1" v-bind="props" />
  </tm-app>
</template>

<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app'
import type { FlowQueryType } from '@gy/sys-service'
import { ref } from 'vue'

import {{EntityName}}List from './{{file-name}}-list.vue'

const props = ref<{
  flowQueryType?: FlowQueryType
}>()

onLoad((query) => {
  props.value = query
})

const {{entityName}}List = ref<InstanceType<typeof {{EntityName}}List>>()

defineExpose({
  // 这个方法一定要暴露出来，便于更新以后刷新界面
  handleAfter(status: string, data: any) {
    {{entityName}}List.value?.handleAfterByForm(status, data)
  }
})
</script>
